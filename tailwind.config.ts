import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                border: "var(--border)",
                "border-subtle": "var(--border-subtle)",
                "border-secondary": "var(--border-secondary)",
                surface: "var(--surface)",
                "surface-elevated": "var(--surface-elevated)",
                "surface-hover": "var(--surface-hover)",
                "text-muted": "var(--text-muted)",
                "text-secondary": "var(--text-secondary)",
                accent: "var(--accent)",
                "accent-hover": "var(--accent-hover)",
                "input-bg": "var(--input-bg)",
                "input-border": "var(--input-border)",
                success: "var(--success)",
                danger: "var(--danger)",
                "chart-bg": "var(--chart-bg)",
                "chart-grid": "var(--chart-grid)",
            },
            transitionDuration: {
                theme: "250ms",
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
            },
        },
    },
    plugins: [],
};
export default config;
