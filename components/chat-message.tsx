"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { InspirationCarousel } from "@/components/inspiration-carousel";
import type { LlmResponse, LlmOutfitOption } from "@/lib/intent-structures";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  structuredResponse?: LlmResponse;
  image?: string;
  // For structured responses: [slot1Url, slot2Url, slot3Url]
  // For non-structured (demo / lookbook): any number of URLs
  inspirationImages?: string[];
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

function OutfitOption({ option }: { option: LlmOutfitOption }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Look {String(option.slot).padStart(2, "0")}
      </p>
      <h4 className="font-medium text-foreground">{option.title}</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {option.description}
      </p>
    </div>
  );
}


function StructuredResponse({
  response,
  slotImages,
}: {
  response: LlmResponse;
  slotImages?: string[];
}) {
  const isInitial = response.responseType === "initial";

  if (!response.sections || !Array.isArray(response.sections)) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-6 wrap-break-word">
      {/* Response Title */}
      {response.title && (
        <h2 className="text-2xl font-bold text-foreground">{response.title}</h2>
      )}

      {response.sections.map((section, idx) => {
        // Intro section
        if (section.key === "intro" && "content" in section) {
          return (
            <React.Fragment key={idx}>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.content.join(" ")}
                </p>
              </div>
              <hr className="border-border" />
            </React.Fragment>
          );
        }

        if (section.key === "curated_looks") {
          if (isInitial && "options" in section) {
            const hasImages = slotImages && slotImages.some((url) => url);
            return (
              <React.Fragment key={idx}>
                {/* All look descriptions first */}
                <div className="space-y-8">
                  {section.options.map((option, optIdx) => (
                    <OutfitOption key={optIdx} option={option} />
                  ))}
                </div>
                {/* Images as a horizontal row after all text */}
                {hasImages && (
                  <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3 sm:gap-3">
                    {section.options.map((option, optIdx) => {
                      const url = slotImages?.[option.slot - 1] ?? "";
                      if (!url) return null;
                      return (
                        <div key={optIdx}>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            Look {String(option.slot).padStart(2, "0")}
                          </p>
                          <img
                            src={url}
                            alt={`Look ${option.slot}: ${option.title}`}
                            className="w-full rounded-xl"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                <hr className="border-border" />
              </React.Fragment>
            );
          } else if (!isInitial && "content" in section) {
            return (
              <React.Fragment key={idx}>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Updated Looks</h3>
                  <div className="space-y-3">
                    {section.content.map((change, changeIdx) => (
                      <div key={changeIdx} className="space-y-2">
                        <h4 className="font-medium text-foreground">{change.title}</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {change.changes.map((ch, chIdx) => (
                            <li key={chIdx}>• {ch}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="border-border" />
              </React.Fragment>
            );
          }
        }

        if (section.key === "style_notes" && "content" in section) {
          return (
            <React.Fragment key={idx}>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Style Notes</h3>
                <ul className="space-y-1.5 text-sm text-foreground">
                  {section.content.map((note, noteIdx) => (
                    <li key={noteIdx}>• {note}</li>
                  ))}
                </ul>
              </div>
              <hr className="border-border" />
            </React.Fragment>
          );
        }

        if (section.key === "verdict" && "content" in section) {
          const verdict = section.content[0] ?? "";
          const reason = section.content[1] ?? "";
          return (
            <React.Fragment key={idx}>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{verdict}</p>
                {reason && <p className="text-sm leading-relaxed text-muted-foreground">{reason}</p>}
              </div>
              <hr className="border-border" />
            </React.Fragment>
          );
        }

        if (section.key === "editors_note" && "content" in section) {
          return (
            <React.Fragment key={idx}>
              <div className="rounded-lg border-l-4 border-accent bg-accent/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1.5">Editor's Note</p>
                <div className="space-y-1 text-sm italic text-accent">
                  {section.content.map((note, noteIdx) => (
                    <p key={noteIdx}>{note}</p>
                  ))}
                </div>
              </div>
              <hr className="border-border" />
            </React.Fragment>
          );
        }

        if (section.key === "wardrobe_items" && "items" in section) {
          return (
            <React.Fragment key={idx}>
              <div className="space-y-8">
                {(section as any).items.map((item: any) => (
                  <div key={item.slot} className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Item {String(item.slot).padStart(2, "0")}
                    </p>
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <hr className="border-border" />
            </React.Fragment>
          );
        }

        if (section.key === "next_questions" && "content" in section && section.content.length > 0) {
          return (
            <div key={idx} className="space-y-2">
              <p className="text-sm font-medium text-foreground">{section.content[0]}</p>
            </div>
          );
        }

        if (section.key === "outfit_storybook" && "content" in section) {
          return (
            <React.Fragment key={idx}>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">The Vibe</h3>
                <div className="space-y-1.5 text-sm text-foreground">
                  {section.content.map((note, noteIdx) => (
                    <p key={noteIdx}>{note}</p>
                  ))}
                </div>
              </div>
              <hr className="border-border" />
            </React.Fragment>
          );
        }

        return null;
      })}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const slotImages = message.structuredResponse
    ? message.inspirationImages
    : undefined;

  const showCarousel =
    !isUser &&
    !message.structuredResponse &&
    message.inspirationImages &&
    message.inspirationImages.length > 0;

  return (
    <div
      className={cn(
        "flex w-full gap-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "min-w-0 space-y-3",
          isUser ? "max-w-[85%] flex flex-col items-end" : "w-full"
        )}
      >
        {/* User Image Attachment */}
        {isUser && message.image && (
          <div className="overflow-hidden rounded-xl">
            <img
              src={message.image || "/placeholder.svg"}
              alt="Uploaded outfit"
              className="h-48 w-auto max-w-full object-cover"
            />
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            isUser
              ? "rounded-2xl px-6 py-4 bg-foreground text-background"
              : "py-1"
          )}
        >
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}

          {!isUser && message.structuredResponse && (
            <StructuredResponse
              response={message.structuredResponse}
              slotImages={slotImages}
            />
          )}
        </div>

        {/* Flat carousel — only for non-structured messages */}
        {showCarousel && (
          <InspirationCarousel images={message.inspirationImages!} />
        )}
      </div>
    </div>
  );
}
