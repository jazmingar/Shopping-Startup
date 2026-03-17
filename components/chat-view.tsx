"use client";

import * as React from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatMessage, Message } from "@/components/chat-message";
import { StarterChips } from "@/components/starter-chips";
import { Pin, PinOff, Sparkles, Menu } from "lucide-react";
import { getPersonaBgClass } from "@/components/persona-selector";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (message: string, image?: File) => void;
  onStarterSelect: (prompt: string) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  isLoading?: boolean;
}

const THINKING_PHRASES = [
  "Pulling looks...",
  "Considering your vibe...",
  "Styling in progress...",
  "Curating options...",
  "Reading the room...",
  "Building your look...",
  "Working on your look...",
  "Thinking about your wardrobe..."
];

function ThinkingIndicator() {
  const [index, setIndex] = React.useState(() =>
    Math.floor(Math.random() * THINKING_PHRASES.length)
  );
  const shownRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    shownRef.current.add(index);
    const interval = setInterval(() => {
      const remaining = THINKING_PHRASES
        .map((_, i) => i)
        .filter((i) => !shownRef.current.has(i));
      if (remaining.length === 0) return;
      const next = remaining[Math.floor(Math.random() * remaining.length)];
      shownRef.current.add(next);
      setIndex(next);
    }, 2700);
    return () => clearInterval(interval);
  }, []);

  const phrase = THINKING_PHRASES[index];

  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-sm italic text-muted-foreground animate-pulse">{phrase}</p>
      </div>
    </div>
  );
}

export function ChatView({
  messages,
  onSendMessage,
  onStarterSelect,
  isPinned,
  onTogglePin,
  isLoading = false,
}: ChatViewProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;
  const bgClass = getPersonaBgClass("brutal-editor");
  const { toggleSidebar, isMobile } = useSidebar();

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className={`flex h-full flex-col transition-colors duration-300 ${bgClass}`}>
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h1 className="font-serif text-lg font-semibold tracking-tight text-foreground">Drape</h1>
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePin}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {isPinned ? (
              <>
                <PinOff className="h-4 w-4" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-4 w-4" />
                Pin
              </>
            )}
          </Button>
        )}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
              <h1 className="mb-6 flex items-center justify-center gap-2 text-2xl font-medium text-foreground sm:text-3xl">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                Welcome
              </h1>
              <ChatInput
                onSubmit={onSendMessage}
                disabled={isLoading}
                placeholder="What are we dressing for?"
              />
              <div className="mt-6">
                <StarterChips onSelect={onStarterSelect} />
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="mx-auto max-w-3xl space-y-6 px-3 py-4 sm:px-4 sm:py-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <ThinkingIndicator />}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area - only show when there are messages */}
      {!isEmpty && (
        <div className="border-t border-border bg-background p-3 sm:p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSubmit={onSendMessage}
              disabled={isLoading}
              placeholder="Ask for more advice..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
