import {
    CheckoutEvents,
    InternalCheckoutEvents,
    SessionEvent,
    SessionValidationCallback,
} from "./checkout";
import { DinteroCheckoutInstance } from ".";

/**
 * Unsubscribe handler from event(s).
 */
export type SubscriptionHandler = (
    sessionEvent: SessionEvent,
    checkout: DinteroCheckoutInstance
) => void;

interface SubscriptionOptions {
    sid: string;
    endpoint: string;
    handler: SubscriptionHandler;
    eventTypes: (CheckoutEvents | InternalCheckoutEvents)[];
    checkout: DinteroCheckoutInstance;
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
const postAck = (iframe: HTMLIFrameElement, event: MessageEvent) => {
    if (event.data.mid && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { ack: event.data.mid },
            event.origin || "*"
        );
    }
};

/**
 * Post a SessionLock-event to the checkout iframe.
 */
export const postSessionLock = (iframe: HTMLIFrameElement, sid: string) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "LockSession", sid }, "*");
    }
};

/**
 * Post the validation result to the checkout iframe
 */
export const postValidationResult = (iframe: HTMLIFrameElement, sid: string, result: SessionValidationCallback) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "ValidationResult", sid, ...result }, "*");
    }
};

/**
 * Post RefreshSession-event to the checkout iframe.
 */
export const postSessionRefresh = (iframe: HTMLIFrameElement, sid: string) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "RefreshSession", sid }, "*");
    }
};

/**
 * Post SetActivePaymentProductType-event to the checkout iframe.
 */
export const postActivePaymentProductType = (iframe: HTMLIFrameElement, sid: string, paymentProductType?: string) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "SetActivePaymentProductType", sid, payment_product_type:paymentProductType },
            "*"
        );
    }
};

/**
 * Post ClosePopOut-event to the checkout iframe.
 */
export const postClosePopOutEvent = (iframe: HTMLIFrameElement, sid: string) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "ClosePopOut", sid },
            "*"
        );
    }
};

/**
 * Post FocusPopOut-event to the checkout iframe.
 */
export const postFocusPopOutEvent = (iframe: HTMLIFrameElement, sid: string) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "FocusPopOut", sid },
            "*"
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
    const wrappedHandler = (event: MessageEvent) => {
        const correctOrigin = event.origin === endpoint;
        const correctWindow = event.source === checkout.iframe.contentWindow;
        const correctSid = event.data && event.data.sid === sid;
        const correctMessageType =
            eventTypes.indexOf(event.data && event.data.type) !== -1;
        if (
            correctOrigin &&
            correctWindow &&
            correctSid &&
            correctMessageType
        ) {
            postAck(checkout.iframe, event);
            handler(event.data, checkout);
        }
    };

    // Add event listener to the iframe.
    window.addEventListener("message", wrappedHandler as any, false);

    // Function to remove the event listener from the iframe.
    const unsubscribe = () => {
        window.removeEventListener("message", wrappedHandler as any, false);
    };

    // Return object with unsubscribe function.
    return {
        unsubscribe,
    };
};
