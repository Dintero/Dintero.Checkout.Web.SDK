import pkg from "../package.json";

/**
 * Wraps window.location.assign()
 */
const windowLocationAssign = (url: string) => {
    window.location.assign(url);
};

/**
 * Get the url for the session
 */
export interface SessionUrlOptions {
    sid: string;
    endpoint: string;
    language: string | undefined;
    ui?: "fullscreen" | "inline";
    shouldCallValidateSession: boolean;
    popOut?: boolean;
    hideTestMessage?: boolean;
}

const getSessionUrl = (options: SessionUrlOptions): string => {
    const {
        sid,
        endpoint,
        language,
        ui,
        shouldCallValidateSession,
        popOut,
        hideTestMessage,
    } = options;
    if (!endpoint) {
        throw new Error("Invalid endpoint");
    }
    const params = new URLSearchParams();
    params.append("sdk", pkg.version);
    if (ui) {
        params.append("ui", ui);
    }
    if (language) {
        params.append("language", language);
    }
    if (shouldCallValidateSession) {
        params.append("client_side_validation", "true");
    }
    if (popOut) {
        params.append("role", "pop_out_launcher");
    }
    if (hideTestMessage) {
        params.append("hide_test_message", "true");
    }
    if (endpoint === "https://checkout.dintero.com") {
        // Default endpoint will redirect via the view endpoint
        return `${endpoint}/v1/view/${sid}?${params.toString()}`;
    }
    // When a custom endpoint is set skip the view redirect endpoint since
    // custom endpoints like localhost and PR builds does not support the
    // serverside view flow.
    params.append("sid", sid);
    return `${padTralingSlash(endpoint)}?${params.toString()}`;
};

const padTralingSlash = (endpoint: string) =>
    endpoint.endsWith("/") ? endpoint : `${endpoint}/`;

const getPopOutUrl = ({
    sid,
    endpoint,
    language,
    shouldCallValidateSession,
}: SessionUrlOptions) => {
    const params = new URLSearchParams();
    params.append("ui", "fullscreen");
    params.append("role", "pop_out_payment");
    params.append("sid", sid);
    params.append("sdk", pkg.version);
    if (language) {
        params.append("language", language);
    }
    if (shouldCallValidateSession) {
        params.append("loader", "true");
        return `${padTralingSlash(endpoint)}?${params.toString()}`;
    }
    return `${padTralingSlash(endpoint)}?${params.toString()}`;
};

export const url = {
    getPopOutUrl,
    getSessionUrl,
    windowLocationAssign,
};
