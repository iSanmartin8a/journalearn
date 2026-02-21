"use client";

type TitleProps = {
  title?: string;
  tooltip?: string;
};

export default function Title({ title = "Journalearn", tooltip }: TitleProps) {
  return (
    <span
      className="
        font-mono block whitespace-nowrap
        border-r-2 border-current
        w-[11ch] text-xl font-bold tracking-tight
        text-[var(--theme-title)]
        text-left overflow-hidden
        animate-typing cursor-pointer
      "
      title={tooltip}
    >
      {title.toUpperCase()}
    </span>
  );
}
