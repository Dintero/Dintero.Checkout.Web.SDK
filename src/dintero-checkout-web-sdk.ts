import "native-promise-only";

import {
    CheckoutEvents,
    InternalCheckoutEvents,
    SessionNotFound,
    SessionLoaded,
    SessionUpdated,
    SessionCancel,
    SessionPaymentAuthorized,
    SessionPaymentError,
} from "./checkout";
import { getSessionUrl, windowLocationAssign } from "./url";
import { createIframeAsync } from "./createIframeAsync";
import { subscribe, SubscriptionHandler, Subscription } from "./subscribe";

export interface DinteroCheckoutInstance {
    /**
     * Remove iframe and all event listeners.
     */
    destroy: () => void;
    iframe: HTMLIFrameElement;
}

export interface DinteroCheckoutOptions {
    sid: string;
    endpoint?: string;
    language?: string;
}

export interface DinteroEmbedCheckoutOptions extends DinteroCheckoutOptions {
    container: HTMLDivElement;
    onPaymentAuthorized?: (
        event: SessionPaymentAuthorized,
        checkout: DinteroCheckoutInstance
    ) => void;
    onSession?: (
        event: SessionLoaded | SessionUpdated,
        checkout: DinteroCheckoutInstance
    ) => void;
    onPaymentError?: (
        event: SessionPaymentError,
        checkout: DinteroCheckoutInstance
    ) => void;
    onSessionCancel?: (
        event: SessionCancel,
        checkout: DinteroCheckoutInstance
    ) => void;
    onSessionNotFound?: (
        event: SessionNotFound,
        checkout: DinteroCheckoutInstance
    ) => void;
}

/**
 * An event handler that navigates to the href in the event.
 */
const followHref: SubscriptionHandler = (event: any): void => {
    if (event.href) {
        windowLocationAssign(event.href);
    }
};

/**
 * An event handler that sets height of the iframe.
 */
const setIframeHeight: SubscriptionHandler = (event: any, checkout): void => {
    if (event.height) {
        checkout.iframe.setAttribute(
            "style",
            `width:100%; height:${event.height}px;`
        );
    }
};

/**
 * Show a dintero payment session in an embedded iframe.
 */
export const embed = async (
    options: DinteroEmbedCheckoutOptions
): Promise<DinteroCheckoutInstance> => {
    const {
        container,
        sid,
        language,
        endpoint = "https://checkout.dintero.com",
        onSession,
        onSessionCancel,
        onPaymentAuthorized,
        onPaymentError,
        onSessionNotFound,
    } = options;
    const subscriptions: Subscription[] = [];

    // Create iframe and add it to the container.
    const iframe = await createIframeAsync(
        container,
        endpoint,
        getSessionUrl({ sid, endpoint, language, ui: "inline" })
    );

    /**
     * Function that removes the iframe and all event listeners.
     */
    const destroy = () => {
        if (iframe) {
            subscriptions.forEach(sub => sub.unsubscribe());
            if (iframe.parentElement) {
                container.removeChild(iframe);
            }
        }
    };

    // Create checkout object that wraps the destroy function.
    const checkout: DinteroCheckoutInstance = { destroy, iframe };

    // Add event handlers (or in some cases add a fallback href handler).
    [
        {
            handler: setIframeHeight,
            eventTypes: [InternalCheckoutEvents.HeightChanged],
        },
        {
            handler: onSession as SubscriptionHandler | undefined,
            eventTypes: [
                CheckoutEvents.SessionLoaded,
                CheckoutEvents.SessionUpdated,
            ],
        },
        {
            eventTypes: [CheckoutEvents.SessionPaymentAuthorized],
            handler: (onPaymentAuthorized || followHref) as SubscriptionHandler,
        },
        {
            handler: (onSessionCancel || followHref) as
                | SubscriptionHandler
                | undefined,
            eventTypes: [CheckoutEvents.SessionCancel],
        },
        {
            handler: (onPaymentError || followHref) as
                | SubscriptionHandler
                | undefined,
            eventTypes: [CheckoutEvents.SessionPaymentError],
        },
        {
            handler: onSessionNotFound as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.SessionNotFound],
        },
    ].forEach(({ handler, eventTypes }) => {
        if (handler) {
            subscriptions.push(
                subscribe({
                    sid,
                    endpoint,
                    handler,
                    eventTypes,
                    checkout,
                })
            );
        }
    });

    // Return object with function to destroy the checkout.
    return checkout;
};

/**
 * Redirect the customer to a payment session in the Dintero Checkout.
 */
export const redirect = (options: DinteroCheckoutOptions) => {
    const {
        sid,
        language,
        endpoint = "https://checkout.dintero.com",
    } = options;
    // Redirect the current browser window to the checkout session url.
    windowLocationAssign(getSessionUrl({ sid, endpoint, language }));
};
