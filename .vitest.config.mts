import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        browser: {
            provider: "webdriverio",
            name: "chrome",
            enabled: true,
            headless: true,
        },
    },
});
