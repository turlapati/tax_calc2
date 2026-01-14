import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return true; // Default to dark theme
    }
    return true; // Default to dark theme
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);


  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full transition-colors duration-300",
        "border-2 border-border shadow-inner",
        isDark ? "bg-slate-700" : "bg-sky-100"
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={cn(
          "absolute flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-300",
          isDark
            ? "translate-x-8 bg-slate-900 text-sky-400"
            : "translate-x-1 bg-white text-amber-500"
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}
