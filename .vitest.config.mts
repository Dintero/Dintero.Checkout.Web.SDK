import { webdriverio } from "@vitest/browser-webdriverio";
import { defineConfig } from "vitest/config";

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
