import type { DinteroEmbedCheckoutOptions } from ".";

export const DEBUG_LOG_PREFIX = "[dintero-checkout-web-sdk]";

/**
 * Logs a message and the values it describes when the debug option is enabled.
 */
export type DebugLogger = (message: string, ...data: unknown[]) => void;

const noop: DebugLogger = () => {};

/**
 * Create a logger that writes to the console when debug is enabled. Returns a
 * function that does nothing when debug is disabled, so that call sites do not
 * have to check the flag.
 *
 * Only pass values that already exist to the logger, never values that are
 * built for the log entry, since the arguments are evaluated even when debug
 * is disabled.
 */
export const createLogger = (debug?: boolean): DebugLogger =>
    debug
        ? (message, ...data) => {
              console.log(`${DEBUG_LOG_PREFIX} ${message}`, ...data);
          }
        : noop;

/**
 * The event handlers that can be passed to embed.
 */
const callbackNames = [
    "onPayment",
    "onPaymentAuthorized",
    "onSession",
    "onPaymentError",
    "onSessionCancel",
    "onSessionNotFound",
    "onSessionLocked",
    "onSessionLockFailed",
    "onActivePaymentType",
    "onValidateSession",
    "onAddressCallback",
] as const;

/**
 * The names of all function options in DinteroEmbedCheckoutOptions. Makes
 * adding a new on<Event> option without adding it to callbackNames a
 * compile error.
 */
type CallbackOptionName = {
    [Key in keyof DinteroEmbedCheckoutOptions]-?: NonNullable<
        DinteroEmbedCheckoutOptions[Key]
    > extends (...args: never[]) => void
        ? Key
        : never;
}[keyof DinteroEmbedCheckoutOptions];

type Assert<T extends true> = T;

type _AllCallbacksAreLogged = Assert<
    CallbackOptionName extends (typeof callbackNames)[number] ? true : false
>;

// biome-ignore lint/suspicious/noExplicitAny: the on<Event> handlers have different event types
type AnyCallback = (...args: any[]) => void;

/**
 * Return a copy of the options where every on<Event> handler logs the
 * parameters it is invoked with before it is invoked.
 *
 * The options are returned untouched when debug is disabled, and handlers that
 * are not set stay undefined, so the undefined-checks that decide the iframe
 * url parameters and the event subscriptions keep working.
 */
export const wrapCallbacksWithDebug = <T extends object>(
    options: T,
    debug: boolean | undefined,
    log: DebugLogger,
): T => {
    if (!debug) {
        return options;
    }
    const wrapped = { ...options } as Record<string, unknown>;
    for (const name of callbackNames) {
        const callback = wrapped[name];
        if (typeof callback === "function") {
            wrapped[name] = (...args: unknown[]) => {
                log(`options.${name}()`, ...args);
                return (callback as AnyCallback)(...args);
            };
        }
    }
    return wrapped as T;
};
