/**
 * Wraps window.location.assign()
 */
export const windowLocationAssign = (url: string) => {
    window.location.assign(url);
};

/**
 * Get the url for the session./yarn-error.log
.DS_Store
 */
export interface SessionUrlOptions {
    iid: string | undefined;
    sid: string;
    endpoint: string;
    language: string | undefined;
}

export const getSessionUrl = (options: SessionUrlOptions): string => {
    const { iid, sid, endpoint, language } = options;
    if (!sid) {
        throw new Error("Invalid sid");
    }
    if (!endpoint) {
        throw new Error("Invalid endpoint");
    }

    // Compose url for view session endpoint with optional language parameter.
    let languageParam = language ? `language=${language}` : "";
    let iidParam = iid ? `iid=${iid}` : "";
    const params = [iidParam, languageParam].filter(x => x).join("&");
    return `${endpoint}/v1/view/${sid}${params ? "?" + params : ""}`;
};
