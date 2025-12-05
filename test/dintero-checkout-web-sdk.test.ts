import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pkg from "../package.json";
import * as dintero from "../src";
import {
    type ActivePaymentProductType,
    CheckoutEvents,
    type SessionCancel,
    type SessionLoaded,
    type SessionLocked,
    type SessionLockFailed,
    type SessionNotFound,
    type SessionPaymentAuthorized,
    type SessionUpdated,
    type SessionValidationCallback,
    type ValidateSession,
} from "../src/checkout";
import { popOutModule } from "../src/popOut";
import { type SessionUrlOptions, url } from "../src/url";

//// Listen to all events emitted, helpful during development
//window.addEventListener(
//    "message",
//    (event: MessageEvent) => {
//        console.log(event, event.data, event.origin);
//    },
//    false,
//);

// Create test iframe content from a blob
const getHtmlBlobUrl = (options: SessionUrlOptions, script: string): string => {
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
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("redirects to session", () => {
        vi.spyOn(url, "windowLocationAssign").mockImplementationOnce(() => {
            // do nothing
        });
        dintero.redirect({ sid: "<session_id>" });
        expect(url.windowLocationAssign).toBeCalledWith(
            `https://checkout.dintero.com/v1/view/<session_id>?sdk=${pkg.version}&sdk_hostname=127.0.0.1`,
        );
    });

    it("redirects to session with language parameter", () => {
        vi.spyOn(url, "windowLocationAssign").mockImplementationOnce(() => {
            // do nothing
        });
        dintero.redirect({ sid: "<session_id>", language: "no" });
        expect(url.windowLocationAssign).toBeCalledWith(
            `https://checkout.dintero.com/v1/view/<session_id>?sdk=${pkg.version}&language=no&sdk_hostname=127.0.0.1`,
        );
    });
});

describe("dintero.embed", () => {
    let checkout: dintero.DinteroCheckoutInstance | undefined;
    let container: HTMLDivElement | undefined;
    let endpoint = "http://localhost:5173";
    const sid = "session-id";

    beforeEach(() => {
        container = document.createElement("p");
        document.body.appendChild(container);
        endpoint = document.location.href;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        checkout?.destroy();

        if (container) {
            container.remove();
        }
    });

    it("creates iframe added to container", async () => {
        let iframeSrc: string | undefined;
        const getSessionUrl = vi
            .spyOn(url, "getSessionUrl")
            .mockImplementationOnce((options) => {
                iframeSrc = getHtmlBlobUrl(options, ``);
                return iframeSrc;
            });

        checkout = await dintero.embed({ sid, container });

        expect(checkout.iframe.parentElement.parentElement).to.equal(container);
        expect(checkout.iframe).to.be.instanceOf(HTMLIFrameElement);
        expect(checkout.iframe.src).to.equal(iframeSrc);
        expect(getSessionUrl).toBeCalledTimes(1);
    });

    it("can be destroyed", async () => {
        let iframeSrc: string | undefined;
        vi.spyOn(url, "getSessionUrl").mockImplementationOnce((options) => {
            iframeSrc = getHtmlBlobUrl(options, ``);
            return iframeSrc;
        });

        checkout = await dintero.embed({ sid, container });
        checkout.destroy();

        expect(checkout.iframe.parentElement).to.equal(null);
        expect(container.innerHTML).to.equal("");
    });

    it("multiple destroy calls do not throw exceptions", async () => {
        let iframeSrc: string | undefined;
        vi.spyOn(url, "getSessionUrl").mockImplementationOnce((options) => {
            iframeSrc = getHtmlBlobUrl(options, ``);
            return iframeSrc;
        });

        checkout = await dintero.embed({ sid, container });
        checkout.destroy();
        checkout.destroy();

        expect(checkout.iframe.parentElement).to.equal(null);
        expect(container.innerHTML).to.equal("");
    });

    it("listens to onSession messages for SessionLoaded", async () => {
        const script = `
            emit({type: "SessionLoaded",
                session: {},
            })
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: SessionLoaded | SessionUpdated;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: (event, checkout) => {
                        resolve({ event, checkout });
                    },
                })
                .catch(reject);
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionLoaded,
        );
    });

    it("listens to onSession messages for SessionUpdated", async () => {
        const script = `
            emit({
                type: "SessionUpdated",
                session: {},
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: SessionLoaded | SessionUpdated;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onSession: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionUpdated,
        );
    });

    it("listens to SessionNotFound messages", async () => {
        const script = `
           emit({
               type: "SessionNotFound",
               session: {},
           });
       `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: SessionNotFound;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onSessionNotFound: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionNotFound,
        );
    });

    it("listens to SessionCancel messages", async () => {
        const script = `
             emit({
                 type: "SessionCancel",
                 session: {},
             });
         `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: SessionCancel;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onSessionCancel: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionCancel,
        );
    });

    ["SessionPaymentAuthorized", "SessionPaymentOnHold"].forEach((type) => {
        it(`listens to ${type} messages`, async () => {
            const windowLocationAssign = vi.spyOn(url, "windowLocationAssign");
            const script = `
            emit({
                type: "${type}",
                href: "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
                transaction_id: "<transaction_id>",
                merchant_reference: "test-1",
            });
        `;

            vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
                return getHtmlBlobUrl(options, script);
            });

            await new Promise((resolve) => {
                windowLocationAssign.mockImplementation(resolve);
                dintero.embed({ sid, container, endpoint });
            });

            expect(windowLocationAssign).toBeCalledWith(
                "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
            );
        });
    });

    it("listens to onSessionPaymentError messages", async () => {
        const windowLocationAssign = vi.spyOn(url, "windowLocationAssign");
        const script = `
            emit({
                type: "SessionPaymentError",
                href: "http://redirct_url.test.com?merchant_reference=test-1&error=failed",
                merchant_reference: "test-1",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        await new Promise((resolve) => {
            windowLocationAssign.mockImplementation(resolve);
            dintero.embed({ sid, container, endpoint });
        });

        expect(windowLocationAssign).toBeCalledWith(
            "http://redirct_url.test.com?merchant_reference=test-1&error=failed",
        );
    });

    it("listens to onSession messages for SessionLocked", async () => {
        const script = `
            emit({
                type: "SessionLocked",
                pay_lock_id: "plid",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: SessionLocked;
            checkout: dintero.DinteroCheckoutInstance;
            callback: () => void;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onSessionLocked: (event, checkout, callback) => {
                    resolve({ event, checkout, callback });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionLocked,
        );

        expect(onSessionResult.callback).to.be.a("function");
        expect(onSessionResult.event.pay_lock_id).to.equal("plid");
    });

    it("listens to onSession messages for SessionLockFailed", async () => {
        const script = `
            emit({
                type: "SessionLockFailed"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: SessionLockFailed;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onSessionLockFailed: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.SessionLockFailed,
        );
    });

    it("listens to onSession messages for ActivePaymentProductType", async () => {
        const script = `
            emit({
                type: "ActivePaymentProductType",
                payment_product_type: "vipps",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionResult: {
            event: ActivePaymentProductType;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onActivePaymentType: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(onSessionResult.event.type).to.equal(
            CheckoutEvents.ActivePaymentProductType,
        );
        expect(onSessionResult.event.payment_product_type).to.equal("vipps");
    });

    it("ignores messages from wrong origin", async () => {
        const script = ``;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSession = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession,
                })
                .catch(reject)
                .then(() => {
                    // post from wrong window
                    window.postMessage(
                        {
                            type: "SessionLoaded",
                            session: {},
                            sid: "<session_id>",
                        },
                        "*",
                    );
                });
            sleep(100).then(resolve);
        });

        expect(onSession).not.toBeCalled();
    });

    it("ignores messages with wrong/unknown type", async () => {
        const script = `
            emit({
                type: "UnknownEventType",
                session: {},
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const fakeHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: fakeHandler,
                    onSessionNotFound: fakeHandler,
                    onSessionCancel: fakeHandler,
                    onPaymentError: fakeHandler,
                    onPaymentAuthorized: fakeHandler,
                })
                .catch(reject)
                .then(resolve);
        });

        expect(fakeHandler).not.toBeCalled();
    });

    it("ignores messages with wrong sid", async () => {
        const script = `
            emit({
                type: "SessionLoaded",
                session: {},
                sid: "overriding correct id from emit",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSession = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession,
                })
                .catch(reject)
                .then(resolve);
        });

        expect(onSession).not.toBeCalled();
    });

    it("changes height when iframe changes height", async () => {
        const script = `
            emit({
                type: "HeightChanged",
                height: 3003,
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const checkout = await dintero.embed({ sid, container, endpoint });
        await sleep(10);

        expect(checkout.iframe.style.height).to.equal("3003px");
    });

    it("changes scrolls to top of iframe when iframe tells it to", async () => {
        const script = `
            emit({
                type: "ScrollToTop",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const checkout = await dintero.embed({ sid, container, endpoint });
        await sleep(10);

        expect(checkout).to.not.be.undefined;
    });

    it("changes language when iframe changes language", async () => {
        const script = `
            emit({
                type: "LanguageChanged",
                language: "no",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const checkout = await dintero.embed({ sid, container, endpoint });
        await sleep(10);

        expect(checkout.language).to.equal("no");
    });

    type Callback = {
        event: unknown;
        checkout: dintero.DinteroCheckoutInstance;
    };

    ["SessionPaymentAuthorized", "SessionPaymentOnHold"].forEach((type) => {
        it(`shows embedResult onPayment ${type} message if handler is defined`, async () => {
            const script = `
            emit({
                type: "SessionPaymentAuthorized",
                href: "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
                    transaction_id: "txn-id",
                merchant_reference: "test-1",
            });
            `;

            vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
                return getHtmlBlobUrl(options, script);
            });

            const { checkout } = await new Promise<Callback>((resolve) => {
                dintero.embed({
                    sid,
                    container,
                    endpoint,
                    onPayment: (event, checkout) => {
                        resolve({ event, checkout });
                    },
                });
            });

            expect(checkout.iframe.src).to.equal(
                `${endpoint}/embedResult/?sid=session-id&merchant_reference=test-1&transaction_id=txn-id&sdk=${pkg.version}`,
            );
        });
    });

    it("shows embedResult onPaymentAuthorized message if handler is defined", async () => {
        const script = `
            emit({
                type: "SessionPaymentAuthorized",
                href: "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
                transaction_id: "txn-id",
                merchant_reference: "test-1",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const { checkout } = await new Promise<Callback>((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onPaymentAuthorized: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(checkout.iframe.src).to.equal(
            `${endpoint}/embedResult/?sid=session-id&merchant_reference=test-1&transaction_id=txn-id&sdk=${pkg.version}`,
        );
    });

    it("shows embedResult onPaymentError message if handler is defined", async () => {
        const script = `
            emit({
                type: "SessionPaymentError",
                href: "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
                merchant_reference: "test-1",
                error: "failed"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const { checkout } = await new Promise<Callback>((resolve) => {
            dintero.embed({
                sid,
                container,
                language: "no",
                endpoint,
                onPaymentError: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(checkout.iframe.src).to.equal(
            `${endpoint}/embedResult/?sid=session-id&merchant_reference=test-1&error=failed&language=no&sdk=${pkg.version}`,
        );
    });

    it("shows embedResult onSessionCancel message if handler is defined", async () => {
        const script = `
            emit({
                type: "SessionCancel",
                href: "http://redirct_url.test.com?merchant_reference=test-1&transaction_id=<transaction_id>",
                merchant_reference: "test-1",
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const { checkout } = await new Promise<Callback>((resolve) => {
            dintero.embed({
                sid,
                container,
                language: "no",
                endpoint,
                onSessionCancel: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
        });

        expect(checkout.iframe.src).to.equal(
            `${endpoint}/embedResult/?sid=session-id&merchant_reference=test-1&error=cancelled&language=no&sdk=${pkg.version}`,
        );
    });

    it("should handle validation", async () => {
        const script = `
            emit({
                type: "ValidateSession",
                session: {},
            });
        `;

        const getSessionUrl = vi
            .spyOn(url, "getSessionUrl")
            .mockImplementation((options) => {
                return getHtmlBlobUrl(options, script);
            });

        const onSessionResult: {
            event: ValidateSession;
            checkout: dintero.DinteroCheckoutInstance;
            callback: (result: SessionValidationCallback) => void;
        } = await new Promise((resolve) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onValidateSession: (event, checkout, callback) => {
                    resolve({ event, checkout, callback });
                },
            });
        });

        expect(onSessionResult.callback).to.not.be.undefined;
        expect(getSessionUrl).toBeCalledWith({
            endpoint,
            shouldCallValidateSession: true,
            sid,
            ui: "inline",
        });
    });

    it("should not handle validation in onValidateSession is not defined", async () => {
        const script = `
            emit({
                type: "ValidateSession",
                session: {},
            });
        `;

        const getSessionUrl = vi
            .spyOn(url, "getSessionUrl")
            .mockImplementation((options) => {
                return getHtmlBlobUrl(options, script);
            });

        await new Promise((resolve) => {
            dintero.embed({ sid, container, endpoint }).then(() => resolve({}));
        });

        expect(getSessionUrl).toBeCalledWith({
            endpoint,
            shouldCallValidateSession: false,
            sid,
            ui: "inline",
        });
    });

    it("should return a promise that resolves when calling lockSession and the SessionLocked is received", async () => {
        const script = `
            window.setTimeout(function(){
                emit({
                    type: "SessionLocked",
                    pay_lock_id: "plid",
                });
            }, 10);
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const event = await new Promise((resolve, reject) => {
            dintero.embed({ sid, container, endpoint }).then((checkout) => {
                checkout
                    .lockSession()
                    .then(resolve)
                    .catch(() => {
                        reject("lockSession() raised unexpected exception");
                    });
            });
        });

        expect(event).to.not.be.not.undefined;
    });

    it("should raise an exception when calling lockSession and the SessionLocked is received", async () => {
        const script = `
                window.setTimeout(function(){
                    emit({
                        type: "SessionLockFailed",
                    });
                }, 10);
            `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const error = await new Promise((resolve, reject) => {
            dintero.embed({ sid, container, endpoint }).then((checkout) => {
                checkout
                    .lockSession()
                    .then((_) =>
                        reject("lockSession() did not raise exception"),
                    )
                    .catch(resolve);
            });
        });

        expect(error).toEqual("Received unexpected event: SessionLockFailed");
    });

    it("should return a promise that resolves when calling refreshSession and the SessionUpdated is received", async () => {
        const script = `
            window.setTimeout(function(){
                emit({
                    type: "SessionUpdated",
                });
            }, 10);
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const event = await new Promise((resolve, reject) => {
            dintero.embed({ sid, container, endpoint }).then((checkout) => {
                checkout
                    .refreshSession()
                    .then(resolve)
                    .catch(() => {
                        reject("refreshSession() raised unexpected exception");
                    });
            });
        });

        expect(event).to.not.be.not.undefined;
    });

    it("should raise an exception when calling refreshSession and the SessionNotFound is received", async () => {
        const script = `
            window.setTimeout(function(){
                emit({
                    type: "SessionNotFound",
                });
            }, 10);
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const error = await new Promise((resolve, reject) => {
            dintero.embed({ sid, container, endpoint }).then((checkout) => {
                checkout
                    .refreshSession()
                    .then((_) => {
                        reject("refreshSession() did not raise exception");
                    })
                    .catch(resolve);
            });
        });

        expect(error).toEqual("Received unexpected event: SessionNotFound");
    });

    it("posts ack for received messages", async () => {
        const mid = Math.floor(Math.random() * 1000000000000000);
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

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionHandler = vi.fn();
        const result: {
            event: SessionPaymentAuthorized;
            checkout: dintero.DinteroCheckoutInstance;
        } = await new Promise((resolve, reject) => {
            dintero.embed({
                sid,
                container,
                endpoint,
                onSession: onSessionHandler,
                onPaymentAuthorized: (event, checkout) => {
                    resolve({ event, checkout });
                },
            });
            sleep(100).then(reject);
        });

        expect(result.event.type).to.equal(
            CheckoutEvents.SessionPaymentAuthorized,
        );
        expect(result.event.transaction_id).to.equal(mid);
        expect(onSessionHandler).toHaveBeenCalledOnce();
    });

    it("Adds button to DOM when a ShowPopOutButton message is received", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionHandler = vi.fn();
        let checkout: dintero.DinteroCheckoutInstance;
        const result: HTMLElement = await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then((instance: dintero.DinteroCheckoutInstance) => {
                    checkout = instance;
                    // Wait for button to be created.
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            resolve(button);
                        } else {
                            reject();
                        }
                    });
                });
        });

        expect(result).to.not.be.undefined;
        result.remove();
        checkout.destroy();
    });

    it("Removes button from DOM when a HidePopOutButton message is received", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
            window.setTimeout(()=>{
                emit({
                    type: "HidePopOutButton",
                });
            }, 50);
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const onSessionHandler = vi.fn();
        const result: HTMLElement = await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then(() => {
                    // Wait for button to be created and removed
                    sleep(100).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        resolve(button);
                    });
                });
        });
        expect(result).to.be.null;
    });

    it("Adds backdrop to DOM and opens modal when open button is clicked", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockResolvedValue({
            close: closeFake,
            focus: focusFake,
            popOutWindow,
        });

        const onSessionHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then(() => {
                    // Wait for button to be created.
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            resolve(null);
                        } else {
                            reject();
                        }
                    });
                });
        });

        const backdrop = document.getElementById(
            "dintero-checkout-sdk-backdrop",
        );

        expect(backdrop).to.not.be.undefined;
        expect(closeFake).not.toBeCalled();
        expect(focusFake).not.toBeCalled();
    });

    it("Removes backdrop and closes pop out when close is clicked", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockImplementation((options) =>
            Promise.resolve({
                close: closeFake.mockImplementation(() => {
                    options.onOpen(popOutWindow);
                    options.onClose();
                }),
                focus: focusFake,
                popOutWindow,
            }),
        );

        const onSessionHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then(() => {
                    // Wait for button to be created.
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            // Wait for close button to be created.
                            sleep(50).then(() => {
                                const button = document.getElementById(
                                    "dintero-checkout-sdk-backdrop-close",
                                );
                                if (button) {
                                    button.click();
                                    resolve(null);
                                } else {
                                    reject();
                                }
                            });
                        } else {
                            reject();
                        }
                    });
                });
        });

        const backdrop = document.getElementById(
            "dintero-checkout-sdk-backdrop",
        );

        expect(backdrop).to.be.null;
        expect(closeFake).toBeCalled();
        expect(focusFake).not.toBeCalled();
    });

    it("Focuses pop out when focus is clicked", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockImplementation((options) =>
            Promise.resolve({
                close: closeFake.mockImplementation(() => {
                    options.onOpen(popOutWindow);
                    options.onClose();
                }),
                focus: focusFake,
                popOutWindow,
            }),
        );

        const onSessionHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then(() => {
                    // Wait for button to be created.
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            // Wait for focus button to be created.
                            sleep(50).then(() => {
                                const button = document.getElementById(
                                    "dintero-checkout-sdk-backdrop-focus",
                                );
                                if (button) {
                                    button.click();
                                    resolve(null);
                                } else {
                                    reject();
                                }
                            });
                        } else {
                            reject();
                        }
                    });
                });
        });

        expect(closeFake).not.toBeCalled();
        expect(focusFake).toBeCalled();
    });

    it("Focuses pop out when backdrop is clicked", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockImplementation((options) =>
            Promise.resolve({
                close: closeFake.mockImplementation(() => {
                    options.onOpen(popOutWindow);
                    options.onClose();
                }),
                focus: focusFake,
                popOutWindow,
            }),
        );

        const onSessionHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then(() => {
                    // Wait for button to be created.
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            // Wait for focus button to be created.
                            sleep(50).then(() => {
                                const backdrop = document.getElementById(
                                    "dintero-checkout-sdk-backdrop",
                                );
                                if (backdrop) {
                                    backdrop.click();
                                    resolve(null);
                                } else {
                                    reject();
                                }
                            });
                        } else {
                            reject();
                        }
                    });
                });
        });

        expect(closeFake).not.toBeCalled();
        expect(focusFake).toBeCalled();
    });

    it("locks pop out when lock is called", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockImplementation((options) =>
            Promise.resolve({
                close: closeFake.mockImplementation(() => {
                    options.onOpen(popOutWindow);
                    options.onClose();
                }),
                focus: focusFake,
                popOutWindow,
            }),
        );

        vi.spyOn(popOutModule, "postPopOutSessionLock").mockImplementation(
            (_options) => Promise.resolve(),
        );

        const onSessionHandler = vi.fn();

        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then((checkout) => {
                    // Wait for button to be created.
                    if (!checkout) {
                        reject(new Error("checkout instance null"));
                        return;
                    }
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            // Wait for focus button to be created.
                            sleep(50).then(() => {
                                checkout.lockSession();
                                sleep(50).then(() => {
                                    resolve(null);
                                });
                            });
                        } else {
                            reject();
                        }
                    });
                });
        });

        expect(popOutModule.postPopOutSessionLock).toBeCalledWith(
            popOutWindow,
            sid,
        );
    });

    it("refreshes pop out when refresh is called", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockImplementation((options) =>
            Promise.resolve({
                close: closeFake.mockImplementation(() => {
                    options.onOpen(popOutWindow);
                    options.onClose();
                }),
                focus: focusFake,
                popOutWindow,
            }),
        );

        vi.spyOn(popOutModule, "postPopOutSessionRefresh").mockImplementation(
            (_options) => Promise.resolve(),
        );
        const onSessionHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then((checkout) => {
                    if (!checkout) {
                        reject(new Error("checkout instance null"));
                        return;
                    }
                    // Wait for button to be created.
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            // Wait for focus button to be created.
                            sleep(50).then(() => {
                                checkout.refreshSession();
                                sleep(50).then(() => {
                                    resolve(null);
                                });
                            });
                        } else {
                            reject();
                        }
                    });
                });
        });

        expect(popOutModule.postPopOutSessionRefresh).toBeCalledWith(
            popOutWindow,
            sid,
        );
    });

    it("set active payment type in pop out when active payment type is called", async () => {
        const script = `
            // Tell the SDK to create the payment button
            emit({
                type: "ShowPopOutButton",
                top: "0",
                left: "0",
                right: "0",
                styles: {},
                openLabel: "Pay with Dintero",
                focusLabel: "Open payment window",
                closeLabel: "Close payment window",
                descriptionLabel: "Can't see the payment window?",
                language: "en",
                disabled: "false"
            });
        `;

        vi.spyOn(url, "getSessionUrl").mockImplementation((options) => {
            return getHtmlBlobUrl(options, script);
        });

        const closeFake = vi.fn();
        const focusFake = vi.fn();
        const popOutWindow = { close: vi.fn() as unknown } as Window;

        vi.spyOn(popOutModule, "openPopOut").mockImplementation((options) =>
            Promise.resolve({
                close: closeFake.mockImplementation(() => {
                    options.onOpen(popOutWindow);
                    options.onClose();
                }),
                focus: focusFake,
                popOutWindow,
            }),
        );

        vi.spyOn(
            popOutModule,
            "postPopOutActivePaymentProductType",
        ).mockImplementation((_options) => Promise.resolve());
        const onSessionHandler = vi.fn();
        await new Promise((resolve, reject) => {
            dintero
                .embed({
                    sid,
                    container,
                    endpoint,
                    onSession: onSessionHandler,
                    popOut: true,
                })
                .catch(reject)
                .then((instance: dintero.DinteroCheckoutInstance) => {
                    // Wait for button to be created.
                    checkout = instance;
                    sleep(50).then(() => {
                        const button = document.getElementById(
                            "dintero-checkout-sdk-launch-pop-out",
                        );
                        if (button) {
                            button.click();
                            // Wait for focus button to be created.
                            sleep(50).then(() => {
                                checkout.setActivePaymentProductType(
                                    "generic.creditcard",
                                );
                                sleep(50).then(() => {
                                    resolve(null);
                                });
                            });
                        } else {
                            reject();
                        }
                    });
                });
        });

        expect(popOutModule.postPopOutActivePaymentProductType).toBeCalledWith(
            popOutWindow,
            sid,
            "generic.creditcard",
        );
    });
});

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
