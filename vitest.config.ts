// Restricts Vitest discovery to the backend TypeScript test files.
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        exclude: [
            "node_modules/**",
            "dist/**",
        ],
    },
});