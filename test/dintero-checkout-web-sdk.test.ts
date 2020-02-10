import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as dintero from "../src/dintero-checkout-web-sdk";
import * as url from "../src/url";

import {
    CheckoutEvents,
    SessionNotFound,
    SessionLoaded,
    SessionUpdated,
    SessionCancel,
    SessionPaymentAuthorized,
} from "../src/checkout";

if (!process.env.CI) {
    // Listen to all events emitted, helpful during development
    window.addEventListener(
        "message",
        (event: MessageEvent) => {
            console.log(event, event.data, event.origin);
        },
        false
    );
}

// Create test iframe content from a blob
const getHtmlBlobUrl = (
    options: url.SessionUrlOptions,
    script: string
): string => {
    const html = `
<script type="text/javascript">
        const sid = "${options.sid}";
        const language =  "${options.language || "undefined"}";

        const emit = (msg) => {
            window.parent.postMessage({sid, ...msg}, "*");
        };
        ${script}
</script>`;
    // Print html during development
    // console.log(html);
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
};

describe("dintero.redirect", () => {
    it("redirects to session", () => {
        const windowLocationAssignStub = sinon.stub(
            url,
            "windowLocationAssign"
        );
        dintero.redirect({ sid: "<session_id>" });
        sinon.assert.alwaysCalledWithExactly(
            windowLocationAssignStub,
            "https://checkout.dintero.com/v1/view/<session_id>"
        );
        windowLocationAssignStub.restore();
    });

    it("redirects to session with language parameter", () => {
        const windowLocationAssignStub = sinon.stub(
            url,
            "windowLocationAssign"
        );
        dintero.redirect({ sid: "<session_id>", language: "no" });
        sinon.assert.alwaysCalledWithExactly(
            windowLocationAssignStub,
            "https://checkout.dintero.com/v1/view/<session_id>?language=no"
        );
        windowLocationAssignStub.restore();
    });
});

describe("dintero.embed", () => {
    it("creates iframe added to container", async () => {
        let iframeSrc: string | undefined;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake(options => {
                iframeSrc = getHtmlBlobUrl(options, ``);
                return iframeSrc;
            });

        const container = document.createElement("div");
        document.body.appendChild(container);
        const checkout = await dintero.embed({
            sid: "<session_id>",
            container,
        });
        expect(checkout.iframe.parentElement).to.equal(container);
        expect(checkout.iframe).to.be.instanceOf(HTMLIFrameElement);
        expect(checkout.iframe.src).to.equal(iframeSrc);
        sinon.assert.calledOnce(getSessionUrlStub);
        getSessionUrlStub.restore();
    });

    it("can be destroyed", async () => {
        let iframeSrc: string | undefined;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake(options => {
                iframeSrc = getHtmlBlobUrl(options, ``);
                return iframeSrc;
            });

        const container = document.createElement("div");
        document.body.appendChild(container);
        const checkout = await dintero.embed({
            sid: "<session_id>",
            container,
        });
        checkout.destroy();
        expect(checkout.iframe.parentElement).to.equal(null);
        expect(container.innerHTML).to.equal("");
        getSessionUrlStub.restore();
    });

    it("multiple destroy calls do not throw exceptions", async () => {
        let iframeSrc: string | undefined;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake(options => {
                iframeSrc = getHtmlBlobUrl(options, ``);
                return iframeSrc;
            });

        const container = document.createElement("div");
        document.body.appendChild(container);
        const checkout = await dintero.embed({
            sid: "<session_id>",
            container,
        });
        checkout.destroy();
        checkout.destroy();
        expect(checkout.iframe.parentElement).to.equal(null);
        expect(container.innerHTML).to.equal("");
        getSessionUrlStub.restore();
    });

    it("listens to onSession messages for SessionLoaded", async () => {
        const script = `
            emit({
                type: "SessionLoaded",
                session: {},
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const onSessionResult: {
            event: SessionLoaded | SessionUpdated;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSession: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionLoaded
        );
        getSessionUrlStub.restore();
    });

    it("listens to onSession messages for SessionUpdated", async () => {
        const script = `
            emit({
                type: "SessionUpdated",
                session: {},
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const onSessionResult: {
            event: SessionLoaded | SessionUpdated;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSession: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionUpdated
        );
        getSessionUrlStub.restore();
    });

    it("listens to SessionNotFound messages", async () => {
        const script = `
            emit({
                type: "SessionNotFound",
                session: {},
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const onSessionResult: {
            event: SessionNotFound;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSessionNotFound: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionNotFound
        );
        getSessionUrlStub.restore();
    });

    it("listens to SessionCancel messages", async () => {
        const script = `
            emit({
                type: "SessionCancel",
                session: {},
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const onSessionResult: {
            event: SessionCancel;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSessionCancel: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionCancel
        );
        getSessionUrlStub.restore();
    });

    it("listens to onPaymentAuthorized messages", async () => {
        const windowLocationAssignStub = sinon.stub(
            url,
            "windowLocationAssign"
        );
        const script = `
            emit({
                type: "SessionPaymentAuthorized",
                href: "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
                transaction_id: "<transaction_id>",
                merchant_reference: "test-1",
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        await new Promise((resolve, reject) => {
            windowLocationAssignStub.callsFake(() => {
                resolve();
            });
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
            });
        });

        sinon.assert.alwaysCalledWithExactly(
            windowLocationAssignStub,
            "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>"
        );
        getSessionUrlStub.restore();
        windowLocationAssignStub.restore();
    });

    it("listens to onSessionPaymentError messages", async () => {
        const windowLocationAssignStub = sinon.stub(
            url,
            "windowLocationAssign"
        );
        const script = `
            emit({
                type: "SessionPaymentError",
                href: "http://redirct_url.test.com?merchant_reference=test-1&error=failed",
                merchant_reference: "test-1",
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        await new Promise((resolve, reject) => {
            windowLocationAssignStub.callsFake(() => {
                resolve();
            });
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
            });
        });

        sinon.assert.alwaysCalledWithExactly(
            windowLocationAssignStub,
            "http://redirct_url.test.com?merchant_reference=test-1&error=failed"
        );
        getSessionUrlStub.restore();
        windowLocationAssignStub.restore();
    });

    it("ignores messages from wrong origin", async () => {
        const script = ``;

        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const onSession = sinon.fake();
        await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero
                .embed({
                    sid: "<session_id>",
                    container,
                    endpoint: "http://localhost:9999",
                    onSession,
                })
                .then(() => {
                    // post from wrong window
                    window.postMessage(
                        {
                            type: "SessionLoaded",
                            session: {},
                            sid: "<session_id>",
                        },
                        "*"
                    );
                });

            sleep(100).then(resolve);
        });
        sinon.assert.notCalled(onSession);
        getSessionUrlStub.restore();
    });

    it("ignores messages with wrong/unknown type", async () => {
        const script = `
            emit({
                type: "UnknownEventType",
                session: {},
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const fakeHandler = sinon.fake();
        await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSession: fakeHandler,
                onSessionNotFound: fakeHandler,
                onSessionCancel: fakeHandler,
                onPaymentError: fakeHandler,
                onPaymentAuthorized: fakeHandler,
            });
            sleep(100).then(resolve);
        });
        sinon.assert.notCalled(fakeHandler);
        getSessionUrlStub.restore();
    });

    it("ignores messages with wrong sid", async () => {
        const script = `
            emit({
                type: "SessionLoaded",
                session: {},
                sid: "overriding correct id from emit",
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const onSession = sinon.fake();
        await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSession,
            });
            sleep(100).then(resolve);
        });
        sinon.assert.notCalled(onSession);
        getSessionUrlStub.restore();
    });

    it("changes height when iframe changes height", async () => {
        const script = `
            emit({
                type: "HeightChanged",
                height: 3003,
            });
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const container = document.createElement("div");
        document.body.appendChild(container);

        const checkout = await dintero.embed({
            sid: "<session_id>",
            container,
            endpoint: "http://localhost:9999",
        });

        await sleep(10);
        expect(checkout.iframe.style.height).to.equal("3003px");
        getSessionUrlStub.restore();
    });

    it("posts ack for received messages", async () => {
        const mid = Math.floor(Math.random() * 1000000000000000000);
        const script = `
            emit({
                type: "SessionLoaded",
                session: {},
                mid: ${mid},
            });

            window.addEventListener("message", function(event){
                // emit payment authorized when ack is received
                emit({
                    type: "SessionPaymentAuthorized",
                    transaction_id: event.data.ack
                });
            }, "*");
        `;
        const getSessionUrlStub = sinon
            .stub(url, "getSessionUrl")
            .callsFake((options: url.SessionUrlOptions) =>
                getHtmlBlobUrl(options, script)
            );

        const container = document.createElement("div");
        document.body.appendChild(container);
        const onSessionHandler = sinon.fake();
        const result: {
            event: SessionPaymentAuthorized;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            dintero.embed({
                sid: "<session_id>",
                container,
                endpoint: "http://localhost:9999",
                onSession: onSessionHandler,
                onPaymentAuthorized: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
            sleep(100).then(reject);
        });
        expect(result.event.type).to.equal(
            CheckoutEvents.SessionPaymentAuthorized
        );
        expect(result.event.transaction_id).to.equal(mid);
        sinon.assert.calledOnce(onSessionHandler);
        getSessionUrlStub.restore();
    });
});

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
