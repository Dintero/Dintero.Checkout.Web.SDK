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
    SessionEvent
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
    postSetLanguage,
    // postFocusPopOutEvent,
    // postClosePopOutEvent,
} from "./subscribe";
import { createBackdrop, removeBackdrop } from "./backdrop";
import { OPEN_POP_OUT_BUTTON_ID, addButton, openPopOut, removeButton } from "./popOut";

export interface DinteroCheckoutInstance {
    /**
     * Remove iframe and all event listeners.
     */
    destroy: () => void;
    iframe: HTMLIFrameElement;
    language: string;
    lockSession: () => Promise<SessionEvent>;
    refreshSession: () => Promise<SessionEvent>;
    setActivePaymentProductType: (paymentProductType: string) => void;
    submitValidationResult: (result: SessionValidationCallback) => void;
    options: DinteroEmbedCheckoutOptions;
    handlers: ({
        handler: SubscriptionHandler;
        eventTypes: InternalCheckoutEvents[];
    } | {
        handler: SubscriptionHandler;
        eventTypes: CheckoutEvents[];
    })[];
}

export interface DinteroCheckoutOptions {
    sid: string;
    endpoint?: string;
    language?: string;
}

export interface DinteroEmbedCheckoutOptions extends DinteroCheckoutOptions {
    container: HTMLDivElement;
    popOut?: boolean;
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
        checkout: DinteroCheckoutInstance,
        callback: () => void,
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
const setIframeHeight: SubscriptionHandler = (event: any, checkout: DinteroCheckoutInstance): void => {
    if (event.height || event.height === 0) {
        checkout.iframe.setAttribute(
            "style",
            `width:100%; height:${event.height}px;`
        );
    }
};

/**
 * An event handler that scrolls to the top of the iframe. This is useful when the user
 * is navigated to another page.
 */
 const scrollToIframeTop: SubscriptionHandler = (event: any, checkout: DinteroCheckoutInstance): void => {
    try {
        checkout.iframe.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
        });
    } catch (e){
        // Ignore erorr silenty bug log it to the console.
        console.error(e);
    }
};

/**
 * An event handler that sets language in the iframe.
 */
const setLanguage: SubscriptionHandler = (event: any, checkout: DinteroCheckoutInstance): void => {
    if (event.language) {
        checkout.language = event.language;
    }
};




const createPopOutMessageHandler = (source: Window, checkout: DinteroCheckoutInstance) => {
    // Close pop out when payment is completed.
    // Invoke handlers for payment events.
    const popOutChangedLanguageHandler = {
        eventTypes: [InternalCheckoutEvents.LanguageChanged],
        handler: (eventData: any, checkout: DinteroCheckoutInstance) => {
            // Tell the embedded checkout to change language
            postSetLanguage(checkout.iframe, checkout.options.sid, event.data.language);
        }
    }

    const popOutCompletedHandler = {
        eventTypes: [
            CheckoutEvents.SessionNotFound,
            CheckoutEvents.SessionCancel,
            CheckoutEvents.SessionPaymentOnHold,
            CheckoutEvents.SessionPaymentAuthorized,
            CheckoutEvents.SessionPaymentError
        ],
        handler: (eventData: any, checkout: DinteroCheckoutInstance) => {
            if (eventData.href) {
                const params = new URLSearchParams(window.location.search);
                let timeout = parseInt(params.get('timeout') || '1000');
                try {
                    const messageHref = new URL(eventData.href);
                    const popOutResultUrl = checkout.options.endpoint + '/popOutResult/' + messageHref.search;
                    console.log(popOutResultUrl);
                    source.location.href = popOutResultUrl;
                } catch (e) {
                    // Ignore if we cannot set the origin
                    console.error(e);
                    timeout = 0;
                }

                // Close pop out after a timeout.
                window.setTimeout(() => {
                    try {
                        source.close();
                    } catch (e) {
                        console.error(e);
                    }
                }, timeout);

                console.log('remove button');
                // Remove button rendered by SDK
                removeButton(OPEN_POP_OUT_BUTTON_ID);
            }
        }
    }
    const handlerWrapper = (event: MessageEvent) => {
        // Check that we should handle the message
        if (
            event.source === source &&
            event.data.context === 'popOut' &&
            event.data.sid === checkout.options.sid
        ) {
            // Invoke handlers
            const sessionEvent = event.data;
            [
                popOutChangedLanguageHandler,
                popOutCompletedHandler,
                ...checkout.handlers
            ].forEach(handlerObject => {
                if ((handlerObject.eventTypes as string[]).includes(sessionEvent.type)) {
                    handlerObject.handler(sessionEvent, checkout);
                }
            });
        }
    };
    window.addEventListener('message', handlerWrapper);
    // returns unsubscribe function
    return () => {
        window.removeEventListener('message', handlerWrapper);
    };
};


const handleShowButton: SubscriptionHandler = (event: any, checkout: DinteroCheckoutInstance): void => {
    if (event.type === InternalCheckoutEvents.ShowPopOutButton) {
        let unsubscribe: undefined | (() => void);
        addButton({
            id: OPEN_POP_OUT_BUTTON_ID,
            container: checkout.options.container,
            label: event.openLabel,
            top: event.top,
            left: event.left,
            right: event.right,
            styles: event.styles,
            disabled: event.disabled,
            onClick: () => {
                const { close, focus } = openPopOut({
                    sid: checkout.options.sid,
                    endpoint: checkout.options.endpoint,
                    shouldCallValidateSession: false,
                    language: event.language,
                    onOpen: (popOutWindow: Window) => {
                        console.log('onOpen', { popOutWindow });
                        unsubscribe = createPopOutMessageHandler(popOutWindow, checkout);
                    },
                    onClose: () => {
                        if (unsubscribe) {
                            unsubscribe();
                        }
                        removeBackdrop();
                        // TODO: unsubscribe to events added on open
                    }
                })
                createBackdrop({ focus, close });
            }
        });
    }
};

const handleRemoveButton: SubscriptionHandler = (event: any, checkout: DinteroCheckoutInstance): void => {
    if (event.type === InternalCheckoutEvents.HidePopOutButton) {
        removeBackdrop();
        removeButton(OPEN_POP_OUT_BUTTON_ID);
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
    if (!options.endpoint) {
        options.endpoint = "https://checkout.dintero.com"
    }
    const {
        container,
        sid,
        language,
        endpoint,
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
        popOut
    } = options;
    let checkout: DinteroCheckoutInstance | undefined;
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
            shouldCallValidateSession: onValidateSession !== undefined,
            popOut,
        }),
    );

    if (!container.style.position) {
        container.style.position = 'relative';
    }

    /**
     * Function that removes the iframe and all event listeners.
     */
    const destroy = () => {
        if (iframe) {
            if (options.popOut) {
                // Try to remove backdrop if it exists
                removeBackdrop();
            }
            subscriptions.forEach((sub) => sub.unsubscribe());
            if (iframe.parentElement) {
                container.removeChild(iframe);
            }
        }
    };

    /**
     * Turn an action into a promise by specifying resolve and
     * reject events.
     */
    const promisifyAction = (action:()=> void, resolveEvent:CheckoutEvents, rejectEvent:CheckoutEvents) => {
        if(!checkout){
            throw new Error("Unable to create action promise: checkout is undefined");
        }
        return new Promise<SessionEvent>((resolve, reject)=> {
            const eventSubscriptions:Subscription[] = [];
            eventSubscriptions.push(subscribe({
                sid,
                endpoint,
                handler: (sessionEvent) => {
                    eventSubscriptions.forEach((sub)=> sub.unsubscribe());
                    resolve(sessionEvent);
                },
                eventTypes: [resolveEvent],
                checkout,
                source: checkout.iframe.contentWindow,
            }));
            eventSubscriptions.push(subscribe({
                sid,
                endpoint,
                handler: () => {
                    eventSubscriptions.forEach((sub)=> sub.unsubscribe());
                    reject(`Received unexpected event: ${rejectEvent}`);
                },
                eventTypes: [rejectEvent],
                checkout,
                source: checkout.iframe.contentWindow,
            }));
            action();
        });
    }

    const lockSession = () => {
        return promisifyAction(
            ()=>{postSessionLock(iframe, sid)},
            CheckoutEvents.SessionLocked,
            CheckoutEvents.SessionLockFailed
        );
    };

    const refreshSession = () => {
        return promisifyAction(
            ()=>{postSessionRefresh(iframe, sid)},
            CheckoutEvents.SessionUpdated,
            CheckoutEvents.SessionNotFound
        );
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

    const wrappedOnSessionLocked = (
        event: SessionLocked,
        checkout: DinteroCheckoutInstance,
    ) => {
        if (onSessionLocked) {
            onSessionLocked(event, checkout, refreshSession);
        }
    }


    // Add event handlers (or in some cases add a fallback href handler).
    const handlers = [
        {
            handler: setLanguage,
            eventTypes: [InternalCheckoutEvents.LanguageChanged],
        },
        {
            handler: setIframeHeight,
            eventTypes: [InternalCheckoutEvents.HeightChanged],
        },
        {
            handler: scrollToIframeTop,
            eventTypes: [InternalCheckoutEvents.ScrollToTop],
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
            handler: wrappedOnSessionLocked as SubscriptionHandler | undefined,
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
            handler: wrappedOnValidateSession as SubscriptionHandler | undefined,
            eventTypes: [CheckoutEvents.ValidateSession],
        },
        {
            handler: handleShowButton as SubscriptionHandler,
            eventTypes: [InternalCheckoutEvents.ShowPopOutButton],
        },
        {
            handler: handleRemoveButton as SubscriptionHandler,
            eventTypes: [InternalCheckoutEvents.HidePopOutButton],
        },
    ];
    // Create checkout object that wraps the destroy function.
    checkout = {
        destroy,
        iframe,
        language,
        lockSession,
        refreshSession,
        setActivePaymentProductType,
        submitValidationResult,
        options,
        handlers,
    };

    handlers.forEach(({ handler, eventTypes }) => {
        if (handler) {
            subscriptions.push(
                subscribe({
                    sid,
                    endpoint,
                    handler,
                    eventTypes,
                    checkout,
                    source: checkout.iframe.contentWindow
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

export type {
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

