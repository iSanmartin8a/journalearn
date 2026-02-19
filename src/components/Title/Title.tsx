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
              border-r-2 border-current
              w-[11ch] text-xl font-bold tracking-tight
              text-[var(--theme-title)]
              text-left overflow-hidden
              animate-typing cursor-pointer
            "
          >
            {title.toUpperCase()}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          className="
            relative z-50
            max-w-xs text-xs text-left
            bg-[var(--theme-tooltip-background)]
            text-[var(--theme-tooltip-text)]
            rounded-xl border-0 shadow-lg
          "
        >
          <p className="px-3 py-2 leading-relaxed">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
