"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, PinnedChat, RecentChat } from "@/components/app-sidebar";
import { ChatView } from "@/components/chat-view";
import { Message } from "@/components/chat-message";
import { PersonaId } from "@/components/persona-selector";
import {
  getEffectiveLocation,
  detectHomeLocation,
  setHomeLocation,
  addTravelDestination,
  getTravelInsights,
  getCityAesthetic,
} from "@/lib/location";
import { fetchWeatherByCoords, fetchWeatherByLocation } from "@/lib/weather";
import { Onboarding } from "@/components/onboarding";
import {
  hasCompletedOnboarding,
  getStyleProfile,
  formatStyleProfileForPrompt,
  StyleProfile,
} from "@/lib/style-profile";



export default function Home() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);
  const [activeChat, setActiveChat] = React.useState<string | null>(null);
  const [chatTitle, setChatTitle] = React.useState<string | undefined>(undefined);

  const [pinnedChats, setPinnedChats] = React.useState<PinnedChat[]>([]);
  const [recentChats, setRecentChats] = React.useState<RecentChat[]>([]);

  // Persona state
  const [selectedPersona, setSelectedPersona] = React.useState<PersonaId>("brutal-editor");

  // Onboarding — shown on first visit, hidden once complete or skipped
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [styleProfile, setStyleProfile] = React.useState<StyleProfile | null>(null);

  React.useEffect(() => {
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    } else {
      setStyleProfile(getStyleProfile());
    }
  }, []);

  const handleOnboardingComplete = () => {
    setStyleProfile(getStyleProfile());
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Persistent user context — survives across turns so we don't re-ask things
  const [userIndustry, setUserIndustry] = React.useState<string | undefined>(undefined);

  // Weather — fetched once on load via browser geolocation, overridden by travel location
  const [weather, setWeather] = React.useState<string | undefined>(undefined);
  const weatherLocationRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const w = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        if (w) {
          setWeather(w);
          weatherLocationRef.current = "geolocation";
        }
      },
      () => {} // silently ignore — permission denied or unavailable
    );
  }, []);

  // Helper: Detect if we've shown styling options with 3 curated looks
  const hasShownOptions = () => {
    return messages.some(m =>
      m.role === "assistant" &&
      m.structuredResponse?.responseType === "initial" &&
      m.structuredResponse?.sections?.some(s => s.key === "curated_looks")
    );
  };

  // Helper: Detect which option slot user is referring to (1, 2, or 3)
  const detectOptionSlot = (query: string): 1 | 2 | 3 | null => {
    const lower = query.toLowerCase();
    if (lower.match(/\b(option\s*1|first\s+option|option\s+one|the\s+first\s+one)\b/)) return 1;
    if (lower.match(/\b(option\s*2|second\s+option|option\s+two|the\s+second\s+one)\b/)) return 2;
    if (lower.match(/\b(option\s*3|third\s+option|option\s+three|the\s+third\s+one)\b/)) return 3;
    return null;
  };

  // THE UPDATED BRAIN LOGIC
  const handleSendMessage = async (content: string, image?: File) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      image: image ? URL.createObjectURL(image) : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    if (!chatTitle) {
      const title = content.length > 30 ? content.slice(0, 30) + "..." : content;
      const newChatId = Date.now().toString();
      setChatTitle(title);
      setActiveChat(newChatId);
      setRecentChats((prev) => [{ id: newChatId, title, timestamp: new Date() }, ...prev]);
    }

    // Determine if this is a followup request
    const isFollowup = hasShownOptions();
    const focusSlot = isFollowup ? detectOptionSlot(content) : null;
    // Default to modifying all options unless a specific slot is mentioned
    const modifyingAll = isFollowup && !focusSlot;

    // Pass the last known intent so the route can anchor clarifying follow-ups
    const lastKnownIntent = [...messages]
      .reverse()
      .find(m => m.role === "assistant" && m.structuredResponse?.intent)
      ?.structuredResponse?.intent;

    // If the last assistant turn was a clarifying question, capture this reply as context
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    const wasAskingForIndustry =
      lastAssistant?.structuredResponse?.responseType === "clarifying" &&
      lastAssistant?.structuredResponse?.intent === "professional";
    if (wasAskingForIndustry && !userIndustry) {
      setUserIndustry(content);
    }

    // --- LOCATION DETECTION & STORAGE ---
    // Detect and store home location if mentioned
    const homeLocationMention = detectHomeLocation(content);
    if (homeLocationMention) {
      setHomeLocation(homeLocationMention);
    }

    // Get effective location (travel > home > null)
    const locationContext = getEffectiveLocation(content);

    // Store travel destination if detected
    if (locationContext.isTravel && locationContext.location) {
      addTravelDestination(locationContext.location, locationContext.context);
    }

    // Override weather when user mentions a new travel destination
    if (
      locationContext.isTravel &&
      locationContext.location &&
      locationContext.location !== weatherLocationRef.current
    ) {
      fetchWeatherByLocation(locationContext.location).then((w) => {
        if (w) {
          setWeather(w);
          weatherLocationRef.current = locationContext.location;
        }
      });
    }

    // Get travel insights for richer context
    const travelInsights = getTravelInsights();

    // Get city aesthetic if location is available
    const cityAesthetic = locationContext.location
      ? getCityAesthetic(locationContext.location)
      : null;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuery: content,
          personaId: selectedPersona,
          mode: isFollowup ? "refine" : "initial",
          intent: lastKnownIntent,
          focusSlot: focusSlot || undefined,
          refineScope: modifyingAll ? "all" : "one",
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content || "",
          })),
          // Location context
          userContext: {
            location: locationContext.location,
            isTravel: locationContext.isTravel,
            travelContext: locationContext.context,
            isFrequentTraveler: travelInsights.isFrequentTraveler,
            frequentDestinations: travelInsights.frequentDestinations,
            cityAesthetic: cityAesthetic,
            weather: weather,
            // Persist answers from clarifying questions
            closetNotes: wasAskingForIndustry ? content : userIndustry,
            // Style profile from onboarding
            styleProfile: styleProfile ? formatStyleProfileForPrompt(styleProfile) : undefined,
          },
        }),
      });

      if (!response.ok) throw new Error("API Route failed");

      const aiData = await response.json();

      // Check if response has structured data (intent AND sections means it's a valid styling response)
      const isStructuredResponse = aiData.intent && Array.isArray(aiData.sections);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        structuredResponse: isStructuredResponse ? aiData : undefined,
        content: !isStructuredResponse ? (aiData.message || JSON.stringify(aiData, null, 2)) : undefined,
        inspirationImages: aiData.inspirationImages ?? undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, {
        id: "error",
        role: "assistant",
        content: "Oops, something went wrong on my end — please try again!",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatTitle(undefined);
    setIsPinned(false);
    setActiveChat(null);
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    const pinnedChat = pinnedChats.find((c) => c.id === id);
    const recentChat = recentChats.find((c) => c.id === id);
    setChatTitle(pinnedChat?.title || recentChat?.title);
    setIsPinned(!!pinnedChat);
    
    setMessages([]);
  };

  const handleTogglePin = () => {
    if (!chatTitle) return;
    if (isPinned) {
      setPinnedChats((prev) => prev.filter((c) => c.id !== activeChat));
      if (activeChat) {
        setRecentChats((prev) => [{ id: activeChat, title: chatTitle, timestamp: new Date() }, ...prev]);
      }
    } else {
      const newPinnedId = activeChat || Date.now().toString();
      setPinnedChats((prev) => [{ id: newPinnedId, title: chatTitle, timestamp: new Date() }, ...prev]);
      setActiveChat(newPinnedId);
    }
    setIsPinned(!isPinned);
  };


  return (
    <>
    {showOnboarding && (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    )}
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        pinnedChats={pinnedChats}
        recentChats={recentChats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />
      <SidebarInset className="h-svh">
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            onStarterSelect={handleStarterSelect}
            isPinned={isPinned}
            onTogglePin={handleTogglePin}
            chatTitle={chatTitle}
            isLoading={isLoading}
            selectedPersona={selectedPersona}
            onSelectPersona={setSelectedPersona}
          />
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}