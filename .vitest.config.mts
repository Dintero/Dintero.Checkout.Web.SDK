import { webdriverio } from "@vitest/browser-webdriverio";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        browser: {
            provider: webdriverio({
                capabilities: {
                    browserName: "chrome",
                    "goog:chromeOptions": {
                        binary: process.env.CHROME_BIN,
                        args: [
                            "--headless=new",
                            "--no-sandbox",
                            "--disable-dev-shm-usage",
                        ],
                    },
                },
            }),
            enabled: true,
            headless: true,
            instances: [{ browser: "chrome" }],
        },
    },
});
