import { useEffect, useState } from "react";

export default function useSystemTheme() {
    const getCurrentTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const [isDarkTheme, setIsDarkTheme] = useState<"dark" | "light">(getCurrentTheme());
    const mqListener = ((e: MediaQueryListEvent) => {
        setIsDarkTheme(e.matches ? "dark" : "light");
    });

    useEffect(() => {
        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
        darkThemeMq.addEventListener("change", mqListener);
        return () => darkThemeMq.removeEventListener("change", mqListener);
    }, []);

    return isDarkTheme;
}