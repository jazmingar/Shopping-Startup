"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, PinnedChat, RecentChat } from "@/components/app-sidebar";
import { ChatView } from "@/components/chat-view";
import { Message } from "@/components/chat-message";
import {
  getEffectiveLocation,
  detectHomeLocation,
  setHomeLocation,
  addTravelDestination,
  getTravelInsights,
  getCityAesthetic,
} from "@/lib/location";
import { fetchWeatherByCoords, fetchWeatherByLocation } from "@/lib/weather";
import { resolveIntentFromText, detectTimeHorizon } from "@/lib/resolve-intent";
import { Onboarding } from "@/components/onboarding";
import {
  hasCompletedOnboarding,
  getStyleProfile,
  formatStyleProfileForPrompt,
  getSavedIndustry,
  saveIndustry,
  extractIndustryFromMessage,
  StyleProfile,
} from "@/lib/style-profile";
import {
  trackSession,
  trackMessage,
  computeJourneyStage,
  type JourneyStage,
} from "@/lib/engagement-tracker";

/**
 * Returns only the conversation history relevant to the current intent thread.
 *
 * - Follow-up (isNewThread=false): messages since the last intent switch — keeps
 *   the current thread clean without mixing in prior topics.
 * - New thread (isNewThread=true): messages from prior turns that share the same
 *   intent — so returning to "dinner" restores the original dinner context.
 *   If the intent has never been seen before, returns empty.
 */
function buildRelevantHistory(
  messages: Message[],
  isNewThread: boolean,
  targetIntent: string | null
): { role: string; content: string }[] {
  if (!isNewThread) {
    // Walk backwards to find where the current thread started (last intent switch)
    let threadStart = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        m.role === "assistant" &&
        m.structuredResponse?.intent &&
        m.structuredResponse.intent !== targetIntent
      ) {
        threadStart = i + 1;
        break;
      }
    }
    return messages.slice(threadStart).map(m => ({ role: m.role, content: m.content || "" }));
  }

  // New thread: pull messages from prior segments that match the target intent
  if (!targetIntent) return [];
  const result: { role: string; content: string }[] = [];
  let pendingUser: { role: string; content: string } | null = null;
  for (const m of messages) {
    if (m.role === "user") {
      pendingUser = { role: "user", content: m.content || "" };
    } else if (m.role === "assistant") {
      if (m.structuredResponse?.intent === targetIntent) {
        if (pendingUser) result.push(pendingUser);
        result.push({ role: "assistant", content: m.content || "" });
        pendingUser = null;
      } else {
        pendingUser = null; // user message led to a different intent — discard it
      }
    }
  }
  return result;
}



export default function Home() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);
  const [activeChat, setActiveChat] = React.useState<string | null>(null);
  const [chatTitle, setChatTitle] = React.useState<string | undefined>(undefined);

  const [pinnedChats, setPinnedChats] = React.useState<PinnedChat[]>(() => {
    try { return JSON.parse(localStorage.getItem("drape_pinned_chats") || "[]"); } catch { return []; }
  });
  const [recentChats, setRecentChats] = React.useState<RecentChat[]>(() => {
    try { return JSON.parse(localStorage.getItem("drape_recent_chats") || "[]"); } catch { return []; }
  });
  const [allChatMessages, setAllChatMessages] = React.useState<Record<string, Message[]>>(() => {
    try { return JSON.parse(localStorage.getItem("drape_chat_messages") || "{}"); } catch { return {}; }
  });

  // Persist chat data to localStorage
  React.useEffect(() => {
    try { localStorage.setItem("drape_pinned_chats", JSON.stringify(pinnedChats)); } catch {}
  }, [pinnedChats]);
  React.useEffect(() => {
    try { localStorage.setItem("drape_recent_chats", JSON.stringify(recentChats)); } catch {}
  }, [recentChats]);
  React.useEffect(() => {
    try { localStorage.setItem("drape_chat_messages", JSON.stringify(allChatMessages)); } catch {}
  }, [allChatMessages]);

  // Save the current chat's messages before navigating away
  const saveCurrentChat = React.useCallback((currentActiveChat: string | null, currentMessages: Message[]) => {
    if (currentActiveChat && currentMessages.length > 0) {
      setAllChatMessages(prev => ({ ...prev, [currentActiveChat]: currentMessages }));
    }
  }, []);


  // Onboarding — shown on first visit, hidden once complete or skipped
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [styleProfile, setStyleProfile] = React.useState<StyleProfile | null>(null);
  const [journeyStage, setJourneyStage] = React.useState<JourneyStage>("discovering");

  React.useEffect(() => {
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    } else {
      setStyleProfile(getStyleProfile());
    }
    trackSession();
    setJourneyStage(computeJourneyStage());
  }, []);

  const handleOnboardingComplete = () => {
    setStyleProfile(getStyleProfile());
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Persistent user context — survives across turns and sessions
  const [userIndustry, setUserIndustry] = React.useState<string | undefined>(() => getSavedIndustry());

  // Set to true when the LLM asks the wardrobe gap clarifying question — consumed on next send
  const wardrobeGapPendingRef = React.useRef(false);

  // Stores uploaded images when the LLM asks a clarifying question — re-sent on next turn
  const pendingImagesRef = React.useRef<File[]>([]);

  // Weather — fetched once via browser geolocation, cached for 7 days.
  // If user denies permission, we store that and never ask again.
  const [weather, setWeather] = React.useState<string | undefined>(undefined);
  const weatherLocationRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    try {
      // Never re-prompt if user previously denied
      if (localStorage.getItem("drape_weather_denied") === "1") return;

      // Use cached weather if still fresh
      const cached = localStorage.getItem("drape_weather");
      const cachedAt = Number(localStorage.getItem("drape_weather_at") || "0");
      if (cached && Date.now() - cachedAt < SEVEN_DAYS) {
        setWeather(cached);
        weatherLocationRef.current = "geolocation";
        return;
      }
    } catch {}

    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const w = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        if (w) {
          setWeather(w);
          weatherLocationRef.current = "geolocation";
          try {
            localStorage.setItem("drape_weather", w);
            localStorage.setItem("drape_weather_at", String(Date.now()));
          } catch {}
        }
      },
      () => {
        // User denied — remember this so we never prompt again
        try { localStorage.setItem("drape_weather_denied", "1"); } catch {}
      }
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
  const handleSendMessage = async (content: string, images?: File[]) => {
    // Use pending images (from a prior clarifying turn) if no new images were attached
    const imagesToSend = (images && images.length > 0) ? images : (pendingImagesRef.current.length > 0 ? pendingImagesRef.current : undefined);
    pendingImagesRef.current = [];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      images: images && images.length > 0 ? images.map((f) => URL.createObjectURL(f)) : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Track engagement signal and refresh journey stage
    trackMessage(content, !!imagesToSend?.length);
    setJourneyStage(computeJourneyStage());

    if (!chatTitle) {
      const title = content.length > 30 ? content.slice(0, 30) + "..." : content;
      const newChatId = Date.now().toString();
      setChatTitle(title);
      setActiveChat(newChatId);
      setRecentChats((prev) => [{ id: newChatId, title, timestamp: new Date() }, ...prev]);
    }

    // Pass the last known intent so the route can anchor clarifying follow-ups
    const lastKnownIntent = [...messages]
      .reverse()
      .find(m => m.role === "assistant" && m.structuredResponse?.intent)
      ?.structuredResponse?.intent;

    // Determine if this is a followup request.
    // Only treat as refine if options have been shown AND the new message doesn't
    // resolve to a different intent — otherwise it's a new thread, start fresh.
    const newIntent = resolveIntentFromText(content);
    const timeHorizon = detectTimeHorizon(content);
    const isNewThread = !!newIntent && newIntent !== lastKnownIntent;
    const isFollowup = hasShownOptions() && !isNewThread;
    const focusSlot = isFollowup ? detectOptionSlot(content) : null;
    // Default to modifying all options unless a specific slot is mentioned
    const modifyingAll = isFollowup && !focusSlot;

    // Capture industry from any message (explicit answer or volunteered info)
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");

    // Consume the wardrobe gap pending flag set when the LLM asked the wardrobe clarifying question
    const wasAskingWardrobeGap = wardrobeGapPendingRef.current;
    wardrobeGapPendingRef.current = false;

    // Detect if we're following up on a wardrobe gap response
    const lastWasWardrobeGap = lastAssistant?.structuredResponse?.responseType === "wardrobe_gap";

    const wasAskingForIndustry =
      lastAssistant?.structuredResponse?.responseType === "clarifying" &&
      lastAssistant?.structuredResponse?.intent === "professional";
    if (!userIndustry) {
      const industryFromMessage = wasAskingForIndustry
        ? content
        : extractIndustryFromMessage(content);
      if (industryFromMessage) {
        setUserIndustry(industryFromMessage);
        saveIndustry(industryFromMessage);
      }
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

    // Convert images to base64 for vision API — resize each to max 1024px first
    const resizeFile = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          const MAX = 1024;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(objectUrl);
          resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
        };
        img.onerror = reject;
        img.src = objectUrl;
      });

    const imagesBase64: string[] = imagesToSend
      ? await Promise.all(imagesToSend.map(resizeFile))
      : [];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuery: content,
          personaId: "brutal-editor",
          mode: isFollowup ? "refine" : "initial",
          intent: lastKnownIntent,
          focusSlot: focusSlot || undefined,
          refineScope: modifyingAll ? "all" : "one",
          isWardrobeGap: wasAskingWardrobeGap || lastWasWardrobeGap,
          isWardrobeGapFollowup: lastWasWardrobeGap,
          wardrobeGapShownItems: lastWasWardrobeGap
            ? (lastAssistant?.structuredResponse as any)?.sections
                ?.find((s: any) => s.key === "wardrobe_items")
                ?.items?.map((i: any) => i.name) ?? []
            : [],
          imagesBase64: imagesBase64.length > 0 ? imagesBase64 : undefined,
          conversationHistory: buildRelevantHistory(messages, isNewThread, newIntent ?? lastKnownIntent ?? null),
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
          journeyStage,
          timeHorizon,
        }),
      });

      if (!response.ok) throw new Error("API Route failed");

      const streamingId = (Date.now() + 1).toString();

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: any;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === "done") {
            const aiData = event.data;
            const isStructuredResponse = aiData.intent && Array.isArray(aiData.sections);
            const assistantMessage: Message = {
              id: streamingId,
              role: "assistant",
              structuredResponse: isStructuredResponse ? aiData : undefined,
              content: !isStructuredResponse ? (aiData.message || "") : undefined,
              inspirationImages: aiData.inspirationImages ?? undefined,
              timestamp: new Date(),
            };

            if (
              isStructuredResponse &&
              aiData.responseType === "clarifying" &&
              aiData.sections?.some((s: any) =>
                s.key === "next_questions" &&
                s.content?.[0]?.toLowerCase().includes("wardrobe")
              )
            ) {
              wardrobeGapPendingRef.current = true;
            }

            // If images were uploaded and LLM asked a clarifying question, hold them for the next turn
            if (isStructuredResponse && aiData.responseType === "clarifying" && imagesToSend?.length) {
              pendingImagesRef.current = imagesToSend;
            }

            setMessages((prev) => [...prev, assistantMessage]);
          } else if (event.type === "error") {
            setMessages((prev) => [...prev, {
              id: streamingId,
              role: "assistant" as const,
              content: "Oops, something went wrong on my end — please try again!",
              timestamp: new Date(),
            }]);
          }
        }
      }
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

  const WARDROBE_GAP_PROMPT = "Help me figure out what's missing from my wardrobe";
  const WARDROBE_GAP_QUESTION = "What area of your wardrobe feels most lacking — going out, date night, or work?";

  const handleStarterSelect = (prompt: string) => {
    if (prompt === WARDROBE_GAP_PROMPT) {
      // Show clarifying question immediately without an API call
      setMessages([
        { id: Date.now().toString(), role: "user", content: prompt, timestamp: new Date() },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          structuredResponse: {
            responseType: "clarifying",
            intent: "social",
            title: "Quick question",
            sections: [
              { key: "intro", content: ["Let's pinpoint what your wardrobe truly needs."] },
              { key: "next_questions", content: [WARDROBE_GAP_QUESTION] },
            ],
          } as any,
          timestamp: new Date(),
        },
      ]);
      wardrobeGapPendingRef.current = true;
      return;
    }
    handleSendMessage(prompt);
  };

  const handleNewChat = () => {
    saveCurrentChat(activeChat, messages);
    setMessages([]);
    setChatTitle(undefined);
    setIsPinned(false);
    setActiveChat(null);
  };

  const handleSelectChat = (id: string) => {
    saveCurrentChat(activeChat, messages);
    setActiveChat(id);
    const pinnedChat = pinnedChats.find((c) => c.id === id);
    const recentChat = recentChats.find((c) => c.id === id);
    setChatTitle(pinnedChat?.title || recentChat?.title);
    setIsPinned(!!pinnedChat);
    setMessages(allChatMessages[id] || []);
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
            onPhotoFeedback={(files) => handleSendMessage("What do you think of this outfit?", files)}
            isPinned={isPinned}
            onTogglePin={handleTogglePin}
            isLoading={isLoading}
            userName={styleProfile?.name}
          />
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}