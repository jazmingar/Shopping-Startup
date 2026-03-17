"use client";

import * as React from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveStyleProfile } from "@/lib/style-profile";

const STYLE_OPTIONS = [
  { id: "Casual", desc: "effortless, comfort-first" },
  { id: "Minimalist", desc: "clean, pared-back" },
  { id: "Bold / Statement", desc: "eye-catching, expressive" },
  { id: "Streetwear", desc: "urban, relaxed-cool" },
  { id: "Polished / Professional", desc: "tailored, put-together" },
];

const LIFESTYLE_OPTIONS = [
  "Mostly remote",
  "In-office / professional setting",
  "Social events",
  "Active / outdoors",
  "Mix of everything",
];

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = React.useState(1);
  const [styleSelections, setStyleSelections] = React.useState<string[]>([]);
  const [lifestyleSelections, setLifestyleSelections] = React.useState<string[]>([]);
  const [wardrobeGap, setWardrobeGap] = React.useState("");

  const toggleStyle = (id: string) => {
    setStyleSelections((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const toggleLifestyle = (id: string) => {
    setLifestyleSelections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      saveStyleProfile({
        styleDescriptors: styleSelections,
        weeklyLifestyle: lifestyleSelections,
        wardrobeGap,
      });
      onComplete();
    }
  };

  const canProceed = () => {
    if (step === 1) return styleSelections.length > 0;
    if (step === 2) return lifestyleSelections.length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background px-4 py-8 sm:items-center sm:px-6">
      <div className="w-full max-w-md">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {step === 1 && <Sparkles className="h-4 w-4" />}
            <span>Step {step} of 3</span>
          </div>
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Style */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-2xl font-medium">How would you describe your style?</h2>
            <p className="mb-6 text-sm text-muted-foreground">Pick up to 3.</p>
            <div className="space-y-2.5">
              {STYLE_OPTIONS.map((opt) => {
                const selected = styleSelections.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleStyle(opt.id)}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/50"
                    }`}
                  >
                    <span className="font-medium">{opt.id}</span>
                    <span
                      className={`ml-2 text-sm ${
                        selected ? "text-background/60" : "text-muted-foreground"
                      }`}
                    >
                      — {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Lifestyle */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 text-2xl font-medium">What does your typical week look like?</h2>
            <p className="mb-6 text-sm text-muted-foreground">Select all that apply.</p>
            <div className="space-y-2.5">
              {LIFESTYLE_OPTIONS.map((label) => {
                const selected = lifestyleSelections.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleLifestyle(label)}
                    className={`w-full rounded-xl border px-4 py-3.5 text-left font-medium transition-colors ${
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Wardrobe gap */}
        {step === 3 && (
          <div>
            <h2 className="mb-1 text-2xl font-medium">
              What would you like to focus on with your style right now?
            </h2>
            <textarea
              value={wardrobeGap}
              onChange={(e) => setWardrobeGap(e.target.value)}
              placeholder="e.g. more date nights, building a spring wardrobe, starting fresh, going out looks..."
              className="mt-6 w-full resize-none rounded-xl border border-border bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground transition-colors"
              rows={3}
              autoFocus
            />
          </div>
        )}

        {/* Continue / Get started */}
        <div className="mt-8">
          <Button onClick={handleNext} disabled={!canProceed()} className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
            {step === 3 ? "Get started" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
