/**
 * Creates an iframe and adds it to the container.
 *
 * Returns a promise that resolves to the iframe when the iframe has loaded.
 * Rejects the promise if there is a problem loading the iframe.
 */
export const createIframeAsync = (
    container: HTMLDivElement,
    endpoint: string,
    url: string
): { iframe: HTMLIFrameElement; initiate: () => void } => {
    if (!container || !container.appendChild) {
        throw new Error("Invalid container");
    }
    const iframe = document.createElement("iframe");

    // No border, transparent and stretch to 100% of the container width.
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowTransparency", "true");
    iframe.setAttribute("style", "width:100%; height:0;");

    // TODO: Get this to work as expected, might be tricky with current
    // tests since they will require the csp to be "unsafe-inline".
    // The server needs to add the same property in the Content Security
    // Policy headers in the response for this to work. A CSP header set by
    //  a meta tag in the iframe target will not be detected as a valid
    // CSP from the iframe host.
    // Content Security Policy, should be limited to "endpoint".
    // iframe.setAttribute("csp", `default-src  ${endpoint}`);

    // Apply extra restrictions to the content in the iframe.
    // allow popups is needed to open terms in new window
    iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    );

    // Needed for to allow apple pay from iframe
    iframe.setAttribute("allow", "payment");

    // The download priority of the resource in the <iframe>'s src attribute.
    iframe.setAttribute("importance", "high");

    // Set the iframe source to the url.
    iframe.setAttribute("src", url);

    // Resolve or reject promise when iframe loads.

    // // Add iframe to the container.
    // container.appendChild(iframe);
    return {
        iframe,
        initiate: async () => {
            return new Promise<void>((resolve, reject) => {
                iframe.onload = () => resolve();
                iframe.onerror = () => reject();
                container.appendChild(iframe);
            });
        },
    };
};
