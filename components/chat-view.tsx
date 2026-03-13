"use client";

import * as React from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatMessage, Message } from "@/components/chat-message";
import { StarterChips } from "@/components/starter-chips";
import { Pin, PinOff, Sparkles } from "lucide-react";
import {
  PersonaSelector,
  PersonaId,
  getPersonaBgClass,
  getPersonaTextClass,
} from "@/components/persona-selector";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (message: string, image?: File) => void;
  onStarterSelect: (prompt: string) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  chatTitle?: string;
  isLoading?: boolean;
  selectedPersona: PersonaId;
  onSelectPersona: (personaId: PersonaId) => void;
}

export function ChatView({
  messages,
  onSendMessage,
  onStarterSelect,
  isPinned,
  onTogglePin,
  chatTitle,
  isLoading = false,
  selectedPersona,
  onSelectPersona,
}: ChatViewProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;
  const bgClass = getPersonaBgClass(selectedPersona);
  const textClass = getPersonaTextClass(selectedPersona);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          {chatTitle && (
            <h2 className="text-sm font-medium text-foreground">{chatTitle}</h2>
          )}
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
      <div className={`flex-1 overflow-hidden transition-colors duration-300 ${bgClass}`}>
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl">
              {/* Persona Selector */}
              <div className="mb-8">
                <PersonaSelector
                  selectedPersona={selectedPersona}
                  onSelectPersona={onSelectPersona}
                />
              </div>
              <h1 className={`mb-6 flex items-center justify-center gap-2 text-3xl font-medium ${textClass}`}>
                <Sparkles className="h-7 w-7" />
                Welcome, Jazmin
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
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                      <div className="h-2 w-2 animate-pulse rounded-full bg-accent delay-100" />
                      <div className="h-2 w-2 animate-pulse rounded-full bg-accent delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area - only show when there are messages */}
      {!isEmpty && (
        <div className="border-t border-border bg-background p-4">
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
