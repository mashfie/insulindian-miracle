"use client";

import { useState } from "react";

interface SeedControlProps {
  seed: number;
  onChange: (seed: number) => void;
}

export default function SeedControl({ seed, onChange }: SeedControlProps) {
  const [input, setInput] = useState(String(seed));
  const [flash, setFlash] = useState(false);

  const handleSubmit = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n >= 0) {
      onChange(n);
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
  };

  const handleRandom = () => {
    const n = Math.floor(Math.random() * 10000);
    setInput(String(n));
    onChange(n);
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  return (
    <div className="flex flex-col">
      <div className="text-[9px] text-text-muted small-caps tracking-widest mb-2">
        world seed
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          onBlur={handleSubmit}
          className={`w-16 bg-void/60 border px-2 py-1 text-[11px] font-mono text-text-bright tabular-nums focus:border-accent focus:outline-none select-transition ${
            flash ? "border-accent" : "border-border"
          }`}
        />
        <button
          onClick={handleSubmit}
          className="px-2 py-1 border border-border text-[9px] text-text-muted hover:border-accent hover:text-accent select-transition tracking-wider"
        >
          GEN
        </button>
        <button
          onClick={handleRandom}
          className="px-2 py-1 border border-border text-[9px] text-text-muted hover:border-accent hover:text-accent select-transition"
          title="Random seed"
        >
          &#x2684;
        </button>
      </div>
    </div>
  );
}
