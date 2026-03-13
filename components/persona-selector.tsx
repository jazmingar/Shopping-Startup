"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PersonaId = "brutal-editor" | "hype-bestie" | "stealth-wealth";

export interface Persona {
  id: PersonaId;
  name: string;
  shortName: string;
  description: string;
  bgColor: string;
  iconBg: string;
  iconText: string;
}

export const personas: Persona[] = [
  {
    id: "brutal-editor",
    name: "Executive Editor",
    shortName: "Editor",
    description: "Sophisticated, authoritative. 25 years Vogue experience.",
    bgColor: "bg-stone-100",
    iconBg: "bg-stone-400",
    iconText: "text-white",
  },
  {
    id: "hype-bestie",
    name: "Shopping Bestie",
    shortName: "Bestie",
    description: "High-energy, sassy. Your most fashionable friend.",
    bgColor: "bg-pink-50",
    iconBg: "bg-pink-500",
    iconText: "text-white",
  },
  {
    id: "stealth-wealth",
    name: "Bold Creative",
    shortName: "Creative",
    description: "Experimental, artistic. Maximalist risk-taker.",
    bgColor: "bg-purple-50",
    iconBg: "bg-gradient-to-br from-purple-600 to-orange-500",
    iconText: "text-white",
  },
];

interface PersonaSelectorProps {
  selectedPersona: PersonaId;
  onSelectPersona: (personaId: PersonaId) => void;
}

export function PersonaSelector({
  selectedPersona,
  onSelectPersona,
}: PersonaSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {personas.map((persona) => {
        const isSelected = selectedPersona === persona.id;
        return (
          <button
            key={persona.id}
            onClick={() => onSelectPersona(persona.id)}
            className="group flex flex-col items-center gap-2"
            title={persona.name}
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200",
                persona.iconBg,
                persona.iconText,
                isSelected
                  ? "scale-110 shadow-lg ring-2 ring-primary/20"
                  : "opacity-60 hover:opacity-100 hover:scale-105"
              )}
            >
              <span className="text-lg font-semibold">
                {persona.shortName.charAt(0)}
              </span>
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-opacity",
                isSelected ? "opacity-100" : "opacity-50"
              )}
            >
              {persona.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Get persona background class for chat area
export function getPersonaBgClass(personaId: PersonaId): string {
  const persona = personas.find((p) => p.id === personaId);
  return persona?.bgColor || "bg-background";
}

// Get persona text color class for proper contrast
export function getPersonaTextClass(personaId: PersonaId): string {
  switch (personaId) {
    case "brutal-editor":
      return "text-stone-950";
    case "hype-bestie":
      return "text-pink-950";
    case "stealth-wealth":
      return "text-purple-950";
    default:
      return "text-foreground";
  }
}
