"use client";

import * as React from "react";
import { Heart, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LookbookImage {
  id: string;
  url: string;
  isHearted: boolean;
  heartedAt?: Date;
}

export interface LookbookIssue {
  id: string;
  weekOf: Date;
  images: LookbookImage[];
  isNew: boolean;
}

interface LookbookProps {
  issue: LookbookIssue;
  onHeart: (imageId: string) => void;
  onBack: () => void;
  onMarkAsSeen: () => void;
}

export function Lookbook({ issue, onHeart, onBack, onMarkAsSeen }: LookbookProps) {
  React.useEffect(() => {
    // Mark as seen when the user views the lookbook
    if (issue.isNew) {
      onMarkAsSeen();
    }
  }, [issue.isNew, onMarkAsSeen]);

  const heartedCount = issue.images.filter((img) => img.isHearted).length;

  const formatWeekOf = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Weekly Lookbook</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Week of {formatWeekOf(issue.weekOf)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 fill-current text-pink-500" />
          <span>{heartedCount} saved</span>
        </div>
      </header>

      {/* Masonry Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {issue.images.map((image) => (
            <LookbookCard
              key={image.id}
              image={image}
              onHeart={() => onHeart(image.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface LookbookCardProps {
  image: LookbookImage;
  onHeart: () => void;
}

function LookbookCard({ image, onHeart }: LookbookCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={image.url || "/placeholder.svg"}
        alt="Fashion inspiration"
        className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      
      {/* Overlay gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-200",
          isHovered || image.isHearted ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Heart button */}
      <button
        onClick={onHeart}
        className={cn(
          "absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
          image.isHearted
            ? "bg-white/90 text-pink-500"
            : "bg-white/80 text-foreground/70 hover:bg-white hover:text-pink-500",
          isHovered || image.isHearted
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        )}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            image.isHearted && "fill-current scale-110"
          )}
        />
      </button>
    </div>
  );
}
