import {
    CheckoutEvents,
    InternalCheckoutEvents,
    SessionEvent,
} from "./checkout";
import { DinteroCheckoutInstance } from "./dintero-checkout-web-sdk";

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
export const postSessionLock = (iframe: HTMLIFrameElement) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "LockSession" },
            "*"
        );
    }
};

/**
 * Post RefreshSession-event to the checkout iframe.
 */
export const postSessionRefresh = (iframe: HTMLIFrameElement) => {
    if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
            { type: "RefreshSession" },
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
