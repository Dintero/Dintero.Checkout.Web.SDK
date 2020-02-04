import "native-promise-only";
import {
    CheckoutEvents,
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
 * Create a unique instance id.
 */
const getInstanceId = () => {
    return (
        new Date().valueOf() +
        Math.random()
            .toString(36)
            .substring(7)
    );
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

    // A unique instance id, needed to filter messages so we know that we receive them from the right iframe instance.
    const iid = getInstanceId();

    // Create iframe and add it to the container.
    const iframe = await createIframeAsync(
        container,
        endpoint,
        getSessionUrl({ iid, sid, endpoint, language })
    );

    /**
     * Function that removes the iframe and all event listeners.
     */
    const destroy = () => {
        if (iframe) {
            subscriptions.forEach(sub => sub.unsubscribe());
            container.removeChild(iframe);
        }
    };

    // Create checkout object that wraps the destroy function.
    const checkout: DinteroCheckoutInstance = { destroy, iframe };

    // Add event handlers (or in some cases add a fallback href handler).
    [
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
                    iid,
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

export const redirect = (options: DinteroCheckoutOptions) => {
    const {
        sid,
        language,
        endpoint = "https://checkout.dintero.com",
    } = options;
    // Instance id not used for anything in the redirect scenario.
    const iid = undefined;
    // Redirect the current browser window to the checkout session url.
    windowLocationAssign(getSessionUrl({ iid, sid, endpoint, language }));
};
