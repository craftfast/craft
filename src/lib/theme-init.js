// This script runs before React hydration to prevent theme flash
(function () {
    try {
        const theme = localStorage.getItem("theme") || "dark";

        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else if (theme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (prefersDark) {
                document.documentElement.classList.add("dark");
            }
        }
    } catch (e) {
        // If localStorage is not available, default to dark
        document.documentElement.classList.add("dark");
    }
})();
