"use client";

import React from "react"

import { Sparkles, Briefcase, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarterChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

interface StarterChipsProps {
  onSelect: (prompt: string) => void;
}

const chips: StarterChip[] = [
  {
    id: "dinner",
    label: "Dinner tonight",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "What should I wear to dinner?",
  },
  {
    id: "work",
    label: "Work outfit",
    icon: <Briefcase className="h-4 w-4" />,
    prompt: "What should I wear to work?",
  },
  {
    id: "wardrobe",
    label: "Refresh my wardrobe",
    icon: <ShoppingBag className="h-4 w-4" />,
    prompt: "Help me figure out what's missing from my wardrobe",
  },
];

export function StarterChips({ onSelect }: StarterChipsProps) {
  return (
    <div className="flex flex-nowrap justify-center gap-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onSelect(chip.prompt)}
          className={cn(
            "group flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5",
            "text-sm text-muted-foreground transition-all duration-200",
            "hover:border-muted-foreground/50 hover:bg-secondary hover:text-foreground"
          )}
        >
          <span className="text-muted-foreground group-hover:text-accent">
            {chip.icon}
          </span>
          {chip.label}
        </button>
      ))}
    </div>
  );
}
