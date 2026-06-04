import { webdriverio } from "@vitest/browser-webdriverio";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        browser: {
            provider: webdriverio({
                capabilities: {
                    browserName: "chrome",
                    "goog:chromeOptions": {
                        args: ["--no-sandbox", "--disable-dev-shm-usage"],
                    },
                },
            }),
            enabled: true,
            headless: true,
            instances: [{ browser: "chrome" }],
        },
    },
});
