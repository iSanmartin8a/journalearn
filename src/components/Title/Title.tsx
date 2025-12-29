"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TitleProps = {
  title?: string;
  tooltip?: string;
};

export default function Title({ title = "Journalearn", tooltip }: TitleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="
              font-mono block whitespace-nowrap
              border-r-4 border-current
              w-[14ch] text-3xl font-bold
              text-[var(--theme-title)]
              text-center overflow-hidden
              animate-typing cursor-pointer
            "
          >
            {title.toUpperCase()}...
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="
            relative z-50
            max-w-xs text-sm text-center
            bg-[var(--theme-tooltip-background)]
            text-[var(--theme-tooltip-text)]
            rounded-md
          "
        >
          <p className="px-3 py-2">{tooltip}</p>

          {/* Flecha del tooltip */}
          <div
            className="
              absolute left-1/2 -bottom-2 -translate-x-1/2
              w-0 h-0
              border-x-8 border-x-transparent
              border-t-8 border-t-[var(--theme-tooltip-background)]
            "
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
