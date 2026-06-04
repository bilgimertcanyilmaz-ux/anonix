"use client";

import { feedFilters, type FeedFilter } from "@/lib/trending";

interface FilterTabsProps {
  value: FeedFilter;
  onChange: (value: FeedFilter) => void;
}

/** Feed filtre sekmeleri: Yeni / Trend / En Çok Beğenilen / En Çok Yorumlanan. */
export function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="-mx-1 mb-4 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
      {feedFilters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            value === f.value
              ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
