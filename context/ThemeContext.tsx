import { get, ref, update } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

// 1. Unified Color Palette
export const Colors = {
  light: {
    background: "#eef2ff",
    card: "#ffffff",
    text: "#1e293b",
    subText: "#64748b",
    border: "#f1f5f9",
    tint: "#6366f1",
    icon: "#475569",
  },
  dark: {
    background: "#0f172a",
    card: "#1e293b",
    text: "#f8fafc",
    subText: "#94a3b8",
    border: "#334155",
    tint: "#818cf8",
    icon: "#cbd5e1",
  },
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(db, `users/${user.uid}/darkMode`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setIsDarkMode(snapshot.val());
        }
      });
    }
  }, []);

  const toggleTheme = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);

    const user = auth.currentUser;
    if (user) {
      try {
        await update(ref(db, `users/${user.uid}`), { darkMode: newValue });
      } catch (err) {
        console.error("Theme Update Error:", err);
      }
    }
  };

  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
