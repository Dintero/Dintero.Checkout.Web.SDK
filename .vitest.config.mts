import { defineConfig } from "vitest/config";
import { webdriverio } from "@vitest/browser-webdriverio";

export default defineConfig({
    test: {
        browser: {
            provider: webdriverio(),
            enabled: true,
            headless: true,
            instances: [{ browser: "chrome" }],
        },
    },
});
