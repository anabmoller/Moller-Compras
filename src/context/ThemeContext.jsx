import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

const THEMES = {
  dark: {
    bg: "#0a0b0f",
    card: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)",
    text: "#ffffff",
    textMuted: "#94a3b8",
    accent: "#10b981",
    sidebarBg: "#0d0e14",
  },
  light: {
    bg: "#f8f9fa",
    card: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    textMuted: "#6b7280",
    accent: "#059669",
    sidebarBg: "#ffffff",
  },
};

function applyTheme(mode) {
  const t = THEMES[mode];
  const root = document.documentElement;
  root.style.setProperty("--color-bg", t.bg);
  root.style.setProperty("--color-card", t.card);
  root.style.setProperty("--color-border", t.border);
  root.style.setProperty("--color-text", t.text);
  root.style.setProperty("--color-text-muted", t.textMuted);
  root.style.setProperty("--color-accent", t.accent);
  root.style.setProperty("--color-sidebar-bg", t.sidebarBg);
  if (mode === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem("ypoti-theme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("ypoti-theme", next); } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
