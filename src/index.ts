import "native-promise-only";

import pkg from "../package.json";
import {
    CheckoutEvents,
    InternalCheckoutEvents,
    SessionNotFound,
    SessionLoaded,
    SessionUpdated,
    SessionCancel,
    SessionPaymentOnHold,
    SessionPaymentAuthorized,
    SessionPaymentError,
    SessionLocked,
    SessionLockFailed,
    ActivePaymentProductType,
    ValidateSession,
    SessionValidationCallback,
} from "./checkout";
import { getSessionUrl, windowLocationAssign } from "./url";
import { createIframeAsync } from "./createIframeAsync";
import {
    subscribe,
    SubscriptionHandler,
    Subscription,
    postSessionLock,
    postSessionRefresh,
    postActivePaymentProductType,
    postValidationResult,
} from "./subscribe";

export interface DinteroCheckoutInstance {
    /**
     * Remove iframe and all event listeners.
     */
    destroy: () => void;
    iframe: HTMLIFrameElement;
    language: string;
    lockSession: () => void;
    refreshSession: () => void;
    setActivePaymentProductType: (paymentProductType: string) => void;
    submitValidationResult: (result: SessionValidationCallback) => void;
}

export interface DinteroCheckoutOptions {
    sid: string;
    endpoint?: string;
    language?: string;
}

export interface DinteroEmbedCheckoutOptions extends DinteroCheckoutOptions {
    container: HTMLDivElement;
    onPayment?: (
        event: SessionPaymentAuthorized | SessionPaymentOnHold,
        checkout: DinteroCheckoutInstance
    ) => void;
    /**
     * @deprecated Since version 0.0.1. Will be deleted in version 1.0.0. Use onPayment instead.
     */
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
    onSessionLocked?: (
        event: SessionLocked,
        checkout: DinteroCheckoutInstance
    ) => void;
    onSessionLockFailed?: (
        event: SessionLockFailed,
        checkout: DinteroCheckoutInstance
    ) => void;
    onActivePaymentType?: (
        event: ActivePaymentProductType,
        checkout: DinteroCheckoutInstance
    ) => void;
    onValidateSession?: (
        event: ValidateSession,
        checkout: DinteroCheckoutInstance,
        callback: (result: SessionValidationCallback) => void,
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
    if (event.height || event.height === 0) {
        checkout.iframe.setAttribute(
            "style",
            `width:100%; height:${event.height}px;`
        );
    }
};
const setLanguage: SubscriptionHandler = (event: any, checkout): void => {
    if (event.language) {
        checkout.language = event.language;
    }
};

const handleWithResult = (
    sid: string,
    endpoint: string,
    handler: SubscriptionHandler
): SubscriptionHandler => {
    return (event: any, checkout: DinteroCheckoutInstance) => {
        const eventKeys = [
            "sid",
            "merchant_reference",
            "transaction_id",
            "error",
        ];
        const pairs = eventKeys.map((key) => [key, event[key]]);
        if (event.type === CheckoutEvents.SessionCancel && !event.error) {
            pairs.push(["error", "cancelled"]);
        }
        pairs.push(["language", checkout.language]);
        pairs.push(["sdk", pkg.version]);
        const urlQuery = pairs
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}=${value}`)
            .join("&");
        checkout.iframe.setAttribute(
            "src",
            `${endpoint}/embedResult/?${urlQuery}`
        );
        handler(event, checkout);
    };
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
        onPayment,
        onPaymentAuthorized,
        onPaymentError,
        onSessionNotFound,
        onSessionLocked,
        onSessionLockFailed,
        onActivePaymentType,
        onValidateSession,
    } = options;
    const subscriptions: Subscription[] = [];

    // Create iframe
    const { iframe, initiate } = createIframeAsync(
        container,
        endpoint,
        getSessionUrl({
            sid,
            endpoint,
            language,
            ui: "inline",
            shouldCallValidateSession: onValidateSession !== undefined
        }),
    );

    /**
     * Function that removes the iframe and all event listeners.
     */
    const destroy = () => {
        if (iframe) {
            subscriptions.forEach((sub) => sub.unsubscribe());
            if (iframe.parentElement) {
                container.removeChild(iframe);
            }
        }
    };

    const lockSession = () => {
        postSessionLock(iframe, sid);
    };

    const refreshSession = () => {
        postSessionRefresh(iframe, sid);
    };

    const setActivePaymentProductType = (paymentProductType?:string) => {
        postActivePaymentProductType(iframe, sid, paymentProductType);
    };

    const submitValidationResult = (result: SessionValidationCallback) => {
        postValidationResult(iframe, sid, result);
    }

    const wrappedOnValidateSession = (
        event: ValidateSession,
        checkout: DinteroCheckoutInstance,
    ) => {
        if (onValidateSession) {
            onValidateSession(event, checkout, submitValidationResult);
        }
    }

    // Create checkout object that wraps the destroy function.
    const checkout: DinteroCheckoutInstance = {
        destroy,
        iframe,
        language,
        lockSession,
        refreshSession,
        setActivePaymentProductType,
        submitValidationResult,
    };

    // Add event handlers (or in some cases add a fallback href handler).
    [
        {
            handler: setLanguage,
            eventTypes: [InternalCheckoutEvents.LanguageChanged],
        },
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
            eventTypes: [CheckoutEvents.SessionPaymentOnHold],
            handler: onPayment
                ? handleWithResult(sid, endpoint, onPayment)
                : followHref,
        },
        {
            eventTypes: [CheckoutEvents.SessionPaymentAuthorized],
            handler:
                onPaymentAuthorized || onPayment
                    ? handleWithResult(
                          sid,
                          endpoint,
                          onPaymentAuthorized || onPayment
                      )
                    : followHref,
        },
        {
            handler: onSessionCancel
                ? handleWithResult(sid, endpoint, onSessionCancel)
                : followHref,
            eventTypes: [CheckoutEvents.SessionCancel],
        },
        {
            handler: onPaymentError
                ? handleWithResult(sid, endpoint, onPaymentError)
                : followHref,
            eventTypes: [CheckoutEvents.SessionPaymentError],
        },
        {
            handler: onSessionNotFound as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.SessionNotFound],
        },
        {
            handler: onSessionLocked as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.SessionLocked],
        },
        {
            handler: onSessionLockFailed as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.SessionLockFailed],
        },
        {
            handler: onActivePaymentType as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.ActivePaymentProductType],
        },
        {
            handler: onActivePaymentType as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.ActivePaymentProductType],
        },
        {
            handler: wrappedOnValidateSession as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.ValidateSession],
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

    // Add iframe to DOM
    await initiate();
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
    windowLocationAssign(getSessionUrl({ sid, endpoint, language, shouldCallValidateSession: false }));
};
