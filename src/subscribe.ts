import type { DinteroCheckoutInstance } from ".";
import type {
    AddressCallbackResult,
    CheckoutEvents,
    InternalCheckoutEvents,
    SessionEvent,
    SessionValidationCallback,
} from "./checkout";

/**
 * Unsubscribe handler from event(s).
 */
export type SubscriptionHandler = (
    sessionEvent: SessionEvent,
    checkout: DinteroCheckoutInstance,
) => void;

interface SubscriptionOptions {
    sid: string;
    endpoint: string;
    handler: SubscriptionHandler;
    eventTypes: (CheckoutEvents | InternalCheckoutEvents)[];
    checkout: DinteroCheckoutInstance;
    source: Window | null;
}

export type Subscription = {
    /**
     * Unsubscribe handler from event(s).
     */
    unsubscribe: () => void;
};

/**
 * Post a message acknowledgement to the checkout iframe.
 */
const postAck = (
    source: Window | null,
    event: MessageEvent,
    targetOrigin: string,
) => {
    if (event.data.mid && source) {
        source.postMessage({ ack: event.data.mid }, targetOrigin);
    }
};

/**
 * Post a SessionLock-event to the checkout iframe.
 */
export const postSessionLock = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "LockSession", sid },
            targetOrigin,
        );
    }
};

/**
 * Post the validation result to the checkout iframe
 */
export const postValidationResult = (
    iframe: HTMLIFrameElement,
    sid: string,
    result: SessionValidationCallback,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "ValidationResult", sid, ...result },
            targetOrigin,
        );
    }
};

/**
 * Post the address call back result to the checkout iframe
 */
export const postAddressCallbackResult = (
    iframe: HTMLIFrameElement,
    sid: string,
    result: AddressCallbackResult,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "AddressCallbackResult", sid, ...result },
            targetOrigin,
        );
    }
};

/**
 * Post RefreshSession-event to the checkout iframe.
 */
export const postSessionRefresh = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "RefreshSession", sid },
            targetOrigin,
        );
    }
};

/**
 * Post SetActivePaymentProductType-event to the checkout iframe.
 */
export const postActivePaymentProductType = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
    paymentProductType?: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            {
                type: "SetActivePaymentProductType",
                sid,
                payment_product_type: paymentProductType,
            },
            targetOrigin,
        );
    }
};

/**
 * Post ClosePopOut-event to the checkout iframe.
 */
export const postValidatePopOutEvent = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "ValidatingPopOut", sid },
            targetOrigin,
        );
    }
};

/**
 * Post OpenPopOutFailed-event to the checkout iframe.
 */
export const postOpenPopOutFailedEvent = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "OpenPopOutFailed", sid },
            targetOrigin,
        );
    }
};

/**
 * Post OpenedPopOut-event to the checkout iframe.
 */
export const postOpenPopOutEvent = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "OpenedPopOut", sid },
            targetOrigin,
        );
    }
};

/**
 * Post ClosePopOut-event to the checkout iframe.
 */
export const postClosePopOutEvent = (
    iframe: HTMLIFrameElement,
    sid: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "ClosedPopOut", sid },
            targetOrigin,
        );
    }
};

/**
 * Post SetLanguage-event to the checkout iframe.
 */
export const postSetLanguage = (
    iframe: HTMLIFrameElement,
    sid: string,
    language: string,
    targetOrigin: string,
) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "SetLanguage", sid, language },
            targetOrigin,
        );
    }
};

/**
 * Subscribe to events from an iframe given a handler and a set
 * of event types.
 */
export const subscribe = (options: SubscriptionOptions): Subscription => {
    const { sid, endpoint, handler, eventTypes, checkout } = options;

    // Wrap event handler in a function that checks for correct origin and
    // filters on event type(s) in the event data.
    const endpointUrl = new URL(endpoint);

    const wrappedHandler = (event: MessageEvent) => {
        const correctOrigin = event.origin === endpointUrl.origin;
        const correctWindow = event.source === checkout.iframe.contentWindow;
        const correctSid = event.data && event.data.sid === sid;
        const correctMessageType = eventTypes.indexOf(event.data?.type) !== -1;

        if (
            correctOrigin &&
            correctWindow &&
            correctSid &&
            correctMessageType
        ) {
            postAck(checkout.iframe.contentWindow, event, endpointUrl.origin);
            handler(event.data, checkout);
        }
    };

    // Add event listener to the iframe.
    window.addEventListener("message", wrappedHandler, false);

    // Function to remove the event listener from the iframe.
    const unsubscribe = () => {
        window.removeEventListener("message", wrappedHandler, false);
    };

    // Return object with unsubscribe function.
    return {
        unsubscribe,
    };
};
