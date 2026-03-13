"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ExternalLink } from "lucide-react";

interface InspirationCarouselProps {
  images: string[];
}

export function InspirationCarousel({ images }: InspirationCarouselProps) {
  return (
    <div className="w-full max-w-2xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Style Inspiration
      </p>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {images.map((image, index) => (
            <CarouselItem key={index} className="basis-1/2 pl-2 md:basis-1/3 lg:basis-1/4">
              <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Style inspiration ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <button className="absolute bottom-2 right-2 rounded-full bg-foreground/90 p-1.5 text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 border-border bg-card text-foreground hover:bg-secondary" />
        <CarouselNext className="right-0 border-border bg-card text-foreground hover:bg-secondary" />
      </Carousel>
    </div>
  );
}
