const puppeteer = require("puppeteer");

process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "chai", "karma-typescript"],
        browsers: ["ChromeHeadless"],
        preprocessors: {
            "**/*.ts": "karma-typescript",
        },
        reporters: ["progress", "karma-typescript"],
        basePath: process.cwd(),
        colors: true,
        files: ["test/**/*.ts", "src/**/*.ts"],
        port: 9999,
        singleRun: true,
        concurrency: Infinity,
        // logLevel: config.LOG_DEBUG,
    });
};
