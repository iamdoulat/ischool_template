"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardBorderBeamProps {
  rx?: number;
  ry?: number;
  strokeWidth?: number;
  gradientId: string;
  colors?: string[];
  activeClass?: string;
  className?: string;
  borderStrokeWidth?: number;
  borderStrokeColor?: string;
  borderStrokeOpacity?: number;
}

/**
 * CardBorderBeam
 * Renders an SVG traveling border beam that activates on hover.
 * The motion travels from left to right along the top perimeter and clockwise around the card.
 */
export function CardBorderBeam({
  rx = 24,
  ry = 24,
  strokeWidth = 3,
  gradientId,
  colors = ["#F59E0B", "#10B981", "#06B6D4", "#F97316"],
  activeClass = "group-hover:opacity-100",
  className,
  borderStrokeWidth = 1.5,
  borderStrokeColor,
  borderStrokeOpacity = 0.15,
}: CardBorderBeamProps) {
  const baseStroke = borderStrokeColor || colors[1] || "#10B981";

  return (
    <svg
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none rounded-[inherit] overflow-visible z-20",
        className
      )}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {colors.map((color, idx) => (
            <stop
              key={idx}
              offset={`${(idx / Math.max(colors.length - 1, 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>
      {/* Subtle faint border base */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={rx}
        ry={ry}
        fill="none"
        stroke={baseStroke}
        strokeWidth={borderStrokeWidth}
        strokeOpacity={borderStrokeOpacity}
        className="transition-all duration-300 group-hover:stroke-amber-400/40 group-hover:stroke-opacity-50"
      />
      {/* Animated Traveling Beam (Left to Right around perimeter) */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={rx}
        ry={ry}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        pathLength="100"
        className={cn(
          "card-border-beam opacity-0 transition-opacity duration-300",
          activeClass
        )}
      />
    </svg>
  );
}
