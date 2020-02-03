import { CheckoutEvents, SessionEvent } from "./checkout";
import { DinteroCheckoutInstance } from "./dintero-checkout-web-sdk";

/**
 * Unsubscribe handler from event(s).
 */
export type SubscriptionHandler = (
    sessionEvent: SessionEvent,
    checkout: DinteroCheckoutInstance
) => void;

interface SubscriptionOptions {
    iid: string;
    sid: string;
    endpoint: string;
    handler: SubscriptionHandler;
    eventTypes: CheckoutEvents[];
    checkout: DinteroCheckoutInstance;
}

export type Subscription = {
    /**
     * Unsubscribe handler from event(s).
     */
    unsubscribe: () => void;
};

/**
 * Subscribe to events from an iframe given a handler and a set
 * of event types.
 */
export const subscribe = (options: SubscriptionOptions): Subscription => {
    const { sid, iid, endpoint, handler, eventTypes, checkout } = options;

    // Wrap event handler in a function that checks for correct origin and
    // filters on event type(s) in the event data.
    const wrappedHandler = (event: MessageEvent) => {
        const correctSid = event.data && event.data.sid === sid;
        const correctIid = event.data && event.data.iid === iid;
        const correctMessageType =
            eventTypes.indexOf(event.data && event.data.type) !== -1;
        if (correctSid && correctIid && correctMessageType) {
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
