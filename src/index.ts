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
    SessionEvent,
    ShowPopOutButton,
} from "./checkout";
import { url } from "./url";
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
    postOpenPopOutEvent,
    postClosePopOutEvent,
    postValidatePopOutEvent,
    postOpenPopOutFailedEvent,
} from "./subscribe";
import {
    createBackdrop,
    removeBackdrop,
    setBackdropLabels,
} from "./popOutBackdrop";
import {
    addPopOutButton,
    removePopOutButton,
    setPopOutButtonDisabled,
} from "./popOutButton";
import { popOut } from "./popOut";
import { Session } from "./session";

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
    options: InternalDinteroEmbedCheckoutOptions;
    handlers: (
        | {
              handler: SubscriptionHandler;
              eventTypes: InternalCheckoutEvents[];
          }
        | {
              handler: SubscriptionHandler;
              eventTypes: CheckoutEvents[];
          }
    )[];
    session: Session | undefined;
    popOutWindow: Window | undefined;
}

export interface DinteroCheckoutOptions {
    sid: string;
    endpoint?: string;
    language?: string;
}

export interface DinteroEmbedCheckoutOptions extends DinteroCheckoutOptions {
    container: HTMLDivElement;
    popOut?: boolean;
    ui?: "inline" | "fullscreen";
    onPayment?: (
        event: SessionPaymentAuthorized | SessionPaymentOnHold,
        checkout: DinteroCheckoutInstance,
    ) => void;
    /**
     * @deprecated Since version 0.0.1. Will be deleted in version 1.0.0. Use onPayment instead.
     */
    onPaymentAuthorized?: (
        event: SessionPaymentAuthorized,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onSession?: (
        event: SessionLoaded | SessionUpdated,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onPaymentError?: (
        event: SessionPaymentError,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onSessionCancel?: (
        event: SessionCancel,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onSessionNotFound?: (
        event: SessionNotFound,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onSessionLocked?: (
        event: SessionLocked,
        checkout: DinteroCheckoutInstance,
        callback: () => void,
    ) => void;
    onSessionLockFailed?: (
        event: SessionLockFailed,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onActivePaymentType?: (
        event: ActivePaymentProductType,
        checkout: DinteroCheckoutInstance,
    ) => void;
    onValidateSession?: (
        event: ValidateSession,
        checkout: DinteroCheckoutInstance,
        callback: (result: SessionValidationCallback) => void,
    ) => void;
}

interface InternalDinteroEmbedCheckoutOptions
    extends DinteroEmbedCheckoutOptions {
    innerContainer: HTMLDivElement;
}

/**
 * An event handler that navigates to the href in the event.
 */
const followHref: SubscriptionHandler = (
    event: any,
    checkout: DinteroCheckoutInstance,
): void => {
    cleanUpPopOut(checkout);
    if (event.href) {
        url.windowLocationAssign(event.href);
    }
};

/**
 * An event handler that sets height of the iframe.
 */
const setIframeHeight: SubscriptionHandler = (
    event: any,
    checkout: DinteroCheckoutInstance,
): void => {
    if (event.height || event.height === 0) {
        checkout.iframe.setAttribute(
            "style",
            `width:100%; height:${event.height}px;`,
        );
    }
};

/**
 * An event handler that scrolls to the top of the iframe. This is useful when the user
 * is navigated to another page.
 */
const scrollToIframeTop: SubscriptionHandler = (
    event: any,
    checkout: DinteroCheckoutInstance,
): void => {
    try {
        checkout.iframe.scrollIntoView({
            block: "start",
            behavior: "smooth",
        });
    } catch (e) {
        // Ignore error silently bug log it to the console.
        console.error(e);
    }
};

/**
 * An event handler that sets language in the iframe.
 */
const setLanguage: SubscriptionHandler = (
    event: any,
    checkout: DinteroCheckoutInstance,
): void => {
    if (event.language) {
        checkout.language = event.language;
    }
};

/**
 * Wrap function with try catch so an error in a single function won't short circuit other code in the current context.
 */
const safelyInvoke = (fn: () => void) => {
    try {
        fn();
    } catch (e) {
        console.error(e);
    }
};

/**
 *  Handle messages sendt to the SDK from the pop out.
 */
const createPopOutMessageHandler = (
    source: Window,
    checkout: DinteroCheckoutInstance,
) => {
    // Change language in embed if changed in pop out
    const popOutChangedLanguageHandler = {
        internalPopOutHandler: true,
        eventTypes: [InternalCheckoutEvents.LanguageChanged],
        handler: (eventData: any, checkout: DinteroCheckoutInstance) => {
            // Tell the embedded checkout to change language.
            postSetLanguage(
                checkout.iframe,
                checkout.options.sid,
                eventData.language,
            );
        },
    };

    // Close pop out, and remove SDK rendered button when payment is completed.
    const paymentCompletedEvents = [
        CheckoutEvents.SessionCancel,
        CheckoutEvents.SessionPaymentOnHold,
        CheckoutEvents.SessionPaymentAuthorized,
        CheckoutEvents.SessionPaymentError,
    ];
    const popOutCompletedHandler = {
        internalPopOutHandler: true,
        eventTypes: paymentCompletedEvents,
        handler: (eventData: any, checkout: DinteroCheckoutInstance) => {
            if (eventData.href) {
                // Remove open pop out button rendered by SDK
                removePopOutButton();

                // Close checkout
                try {
                    source.close();
                } catch (e) {
                    console.error(e);
                }
            } else {
                console.error("Payment Complete event missing href property");
            }
        },
    };

    // Listens to messages from pop out window and routes the events to dedicated handlers
    const messageRouter = (event: MessageEvent) => {
        // Check that we should handle the message
        if (
            event.source === source &&
            event.data.context === "popOut" &&
            event.data.sid === checkout.options.sid
        ) {
            // Check if handler matches incoming event and trigger the handler if so.
            [
                // SDK events for managing the pop out flow.
                popOutChangedLanguageHandler,
                popOutCompletedHandler,

                // Events configured when the checkout was embedded.
                ...checkout.handlers,
            ].forEach((handlerObject) => {
                if (
                    (handlerObject.eventTypes as string[]).includes(
                        event.data.type,
                    ) &&
                    handlerObject.handler
                ) {
                    // Invoking the handler function if the event type matches the handler.
                    safelyInvoke(() => {
                        handlerObject.handler(event.data, checkout);
                    });
                }
            });
        }
    };
    // Add messageRouter event listener to the Pop Out
    window.addEventListener("message", messageRouter);

    // Return unsubscribe function
    return () => {
        window.removeEventListener("message", messageRouter);
    };
};

/**
 * Configures and shows the pop out with the payment options.
 */
const showPopOut = async (
    event: ShowPopOutButton,
    checkout: DinteroCheckoutInstance,
) => {
    const { close, focus, popOutWindow } = await popOut.openPopOut({
        sid: checkout.options.sid,
        endpoint: checkout.options.endpoint,
        shouldCallValidateSession: Boolean(checkout.options.onValidateSession),
        language: event.language,
        onOpen: (popOutWindow: Window) =>
            createPopOutMessageHandler(popOutWindow, checkout),
        onClose: () => {
            removeBackdrop();
            postClosePopOutEvent(checkout.iframe, checkout.options.sid);
            setPopOutButtonDisabled(false);
            checkout.popOutWindow = undefined;
        },
    });
    if (popOutWindow) {
        postOpenPopOutEvent(checkout.iframe, checkout.options.sid);
        // Add pop out window to checkout instance
        checkout.popOutWindow = popOutWindow;
        createBackdrop({ focus, close, event });
        return true;
    } else {
        postOpenPopOutFailedEvent(checkout.iframe, checkout.options.sid);
        return false;
    }
};

/**
 * Create callback function for the client side validation flow. It allows the
 * host application to validate the content of the payment session before the
 * pop out is opened.
 */
const createPopOutValidationCallback = (
    event: ShowPopOutButton,
    checkout: DinteroCheckoutInstance,
) => {
    return (result: SessionValidationCallback) => {
        // Tell the embedded iframe about the validation result so it can show an error message if
        // the validation failed.
        postValidationResult(checkout.iframe, checkout.options.sid, result);
        if (result.success && checkout.popOutWindow) {
            // Redirect user to session in pop out window
            checkout.popOutWindow.location.href = url.getPopOutUrl({
                sid: checkout.options.sid,
                endpoint: checkout.options.endpoint,
                shouldCallValidateSession: false,
                language: event.language,
            });
        } else {
            // Close pop out
            if (checkout.popOutWindow) {
                checkout.popOutWindow.close();
            }
            // Log validation error to console log.
            console.error(result.clientValidationError);
        }
    };
};

/**
 * Handle click event on the SDK rendered pop out button
 */
const handlePopOutButtonClick = async (
    event: ShowPopOutButton,
    checkout: DinteroCheckoutInstance,
) => {
    // Disable button while pop out is open
    const opened = await showPopOut(event, checkout);

    if (opened && checkout.options.onValidateSession) {
        // Let the host application validate the payment session before opening checkout.

        // Tell the embedded iframe that we are validating the session
        postValidatePopOutEvent(checkout.iframe, checkout.options.sid);

        // Create callback function added to the SDK event and onValidateSession attributes
        const callback = createPopOutValidationCallback(event, checkout);

        // Invoke onValidateSession function defined in checkout options
        try {
            checkout.options.onValidateSession(
                {
                    type: CheckoutEvents.ValidateSession,
                    session: checkout.session,
                    callback,
                },
                checkout,
                callback,
            );
        } catch (e) {
            console.error(e);
            postValidationResult(checkout.iframe, checkout.options.sid, {
                success: false,
                clientValidationError: "Validation runtime error",
            });
        }
    }
};

/**
 * Type guard for ShowPopOutButton
 */
const isShowPopOutButton = (event: any): event is ShowPopOutButton => {
    return event && event.type === InternalCheckoutEvents.ShowPopOutButton;
};

/**
 * Display the SDK rendered pop out button on top of the embedded iframe
 */
const handleShowButton: SubscriptionHandler = (
    event: any,
    checkout: DinteroCheckoutInstance,
): void => {
    if (isShowPopOutButton(event)) {
        addPopOutButton({
            container: checkout.options.innerContainer,
            label: event.openLabel,
            top: event.top,
            left: event.left,
            right: event.right,
            styles: event.styles,
            stylesHover: event.stylesHover,
            stylesFocusVisible: event.stylesFocusVisible,
            disabled: event.disabled,
            onClick: () => handlePopOutButtonClick(event, checkout),
        });
        setBackdropLabels(event);
    }
};

/**
 * Remove the pop out button above the embedded iframe
 */
const handleRemoveButton: SubscriptionHandler = (
    event: any,
    checkout: DinteroCheckoutInstance,
): void => {
    if (event.type === InternalCheckoutEvents.HidePopOutButton) {
        removePopOutButton();
    }
};

const cleanUpPopOut = (checkout: DinteroCheckoutInstance) => {
    // Ensures that the pop out is no longer open when the payment is completed or the checkout is destroyed.
    removePopOutButton();
    removeBackdrop();
    if (checkout.popOutWindow) {
        try {
            checkout.popOutWindow.close();
            // Pop out message handlers will be removed when the pop out window is closed
            // via the interval created by openPopOut.
        } catch (e) {
            console.error(e);
        }
    }
};

const composeUrl = (base: string, path: string, query: string) => {
    const slash = base.endsWith("/") ? "" : "/";
    return `${base}${slash}${path}?${query}`;
};

/**
 * Show a dintero payment session in an embedded iframe.
 */
export const embed = async (
    options: DinteroEmbedCheckoutOptions,
): Promise<DinteroCheckoutInstance> => {
    // Create inner container to offset any styling on the container.
    const innerContainer = document.createElement("div");
    innerContainer.style.position = "relative";
    innerContainer.style["box-sizing"] = "border-box";

    const internalOptions = {
        endpoint: "https://checkout.dintero.com",
        innerContainer: innerContainer,
        ...options,
    };
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
        popOut,
    } = internalOptions;

    let checkout: DinteroCheckoutInstance | undefined;
    const subscriptions: Subscription[] = [];
    let has_delivered_final_event = false;

    // Create iframe
    container.appendChild(innerContainer);
    const { iframe, initiate } = createIframeAsync(
        innerContainer,
        endpoint,
        url.getSessionUrl({
            sid,
            endpoint,
            language,
            ui: options.ui || "inline",
            shouldCallValidateSession: onValidateSession !== undefined,
            popOut,
            ...(options.hasOwnProperty("hideTestMessage") && {
                hideTestMessage: options["hideTestMessage"],
            }),
        }),
    );

    /**
     * Function that removes the iframe, pop out and all event listeners.
     */
    const destroy = () => {
        cleanUpPopOut(checkout);
        if (iframe) {
            if (internalOptions.popOut) {
                // Try to remove backdrop if it exists
                removeBackdrop();
            }
            subscriptions.forEach((sub) => sub.unsubscribe());
            if (iframe.parentElement) {
                innerContainer.removeChild(iframe);
            }
        }
        if (innerContainer.parentElement) {
            container.removeChild(innerContainer);
        }
    };

    /**
     * Turn an action into a promise by specifying resolve and
     * reject events.
     */
    const promisifyAction = (
        action: () => void,
        resolveEvent: CheckoutEvents,
        rejectEvent: CheckoutEvents,
    ) => {
        if (!checkout) {
            throw new Error(
                "Unable to create action promise: checkout is undefined",
            );
        }
        return new Promise<SessionEvent>((resolve, reject) => {
            const eventSubscriptions: Subscription[] = [];
            eventSubscriptions.push(
                subscribe({
                    sid,
                    endpoint,
                    handler: (sessionEvent) => {
                        eventSubscriptions.forEach((sub) => sub.unsubscribe());
                        resolve(sessionEvent);
                    },
                    eventTypes: [resolveEvent],
                    checkout,
                    source: checkout.iframe.contentWindow,
                }),
            );
            eventSubscriptions.push(
                subscribe({
                    sid,
                    endpoint,
                    handler: () => {
                        eventSubscriptions.forEach((sub) => sub.unsubscribe());
                        reject(`Received unexpected event: ${rejectEvent}`);
                    },
                    eventTypes: [rejectEvent],
                    checkout,
                    source: checkout.iframe.contentWindow,
                }),
            );
            action();
        });
    };

    const lockSession = () => {
        return promisifyAction(
            () => {
                postSessionLock(iframe, sid);
            },
            CheckoutEvents.SessionLocked,
            CheckoutEvents.SessionLockFailed,
        );
    };

    const refreshSession = () => {
        return promisifyAction(
            () => {
                postSessionRefresh(iframe, sid);
            },
            CheckoutEvents.SessionUpdated,
            CheckoutEvents.SessionNotFound,
        );
    };

    const setActivePaymentProductType = (paymentProductType?: string) => {
        postActivePaymentProductType(iframe, sid, paymentProductType);
    };

    const submitValidationResult = (result: SessionValidationCallback) => {
        postValidationResult(iframe, sid, result);
    };

    /**
     *  Internal result event message handler wrapper, to replace the content of the iframe with a success/or
     *  error message. Only used when the embed function in the SDK has a dedicated handler for onPayment, onError etc.
     *  If no custom handler is set the followHref handler is used instead.
     */
    const handleWithResult = (
        sid: string,
        endpoint: string,
        handler: SubscriptionHandler,
    ): SubscriptionHandler => {
        return (event: any, checkout: DinteroCheckoutInstance) => {
            if (!has_delivered_final_event) {
                has_delivered_final_event = true;
                cleanUpPopOut(checkout);

                const eventKeys = [
                    "sid",
                    "merchant_reference",
                    "transaction_id",
                    "error",
                ];
                const pairs = eventKeys.map((key) => [key, event[key]]);
                if (
                    event.type === CheckoutEvents.SessionCancel &&
                    !event.error
                ) {
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
                    composeUrl(endpoint, "embedResult/", urlQuery),
                );
                handler(event, checkout);
            }
        };
    };

    const wrappedOnValidateSession = (
        event: ValidateSession,
        checkout: DinteroCheckoutInstance,
    ) => {
        if (onValidateSession) {
            try {
                onValidateSession(
                    {
                        ...event,
                        callback: submitValidationResult,
                    },
                    checkout,
                    submitValidationResult,
                );
            } catch (e) {
                console.error(e);
                submitValidationResult({
                    success: false,
                    clientValidationError: "Validation runtime error",
                });
            }
        }
    };

    const wrappedOnSessionLocked = (
        event: SessionLocked,
        checkout: DinteroCheckoutInstance,
    ) => {
        if (onSessionLocked) {
            onSessionLocked(event, checkout, refreshSession);
        }
    };

    const wrappedOnLoadedOrUpdated = (
        event: SessionLoaded | SessionUpdated,
        checkout: DinteroCheckoutInstance,
    ) => {
        // Update the checkout instance to include the session object
        checkout.session = event.session;
        if (onSession) {
            onSession(event, checkout);
        }
    };

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
            handler: wrappedOnLoadedOrUpdated as
                | SubscriptionHandler
                | undefined,
            eventTypes: [
                CheckoutEvents.SessionLoaded,
                CheckoutEvents.SessionUpdated,
            ],
        },
        {
            eventTypes: [CheckoutEvents.SessionPaymentOnHold],
            handler: handleWithResult(sid, endpoint, onPayment || followHref),
        },
        {
            eventTypes: [CheckoutEvents.SessionPaymentAuthorized],
            handler: handleWithResult(
                sid,
                endpoint,
                onPaymentAuthorized || onPayment || followHref,
            ),
        },
        {
            handler: handleWithResult(
                sid,
                endpoint,
                onSessionCancel || followHref,
            ),
            eventTypes: [CheckoutEvents.SessionCancel],
        },
        {
            handler: handleWithResult(
                sid,
                endpoint,
                onPaymentError || followHref,
            ),
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
            handler: wrappedOnValidateSession as
                | SubscriptionHandler
                | undefined,
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
        options: internalOptions,
        handlers,
        session: undefined,
        popOutWindow: undefined,
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
                    source: checkout.iframe.contentWindow,
                }),
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
    url.windowLocationAssign(
        url.getSessionUrl({
            sid,
            endpoint,
            language,
            shouldCallValidateSession: false,
        }),
    );
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
