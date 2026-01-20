import type { Session } from "./session";

export enum CheckoutEvents {
    SessionNotFound = "SessionNotFound",
    SessionLoaded = "SessionLoaded",
    SessionUpdated = "SessionUpdated",
    SessionCancel = "SessionCancel",
    SessionPaymentOnHold = "SessionPaymentOnHold",
    SessionPaymentAuthorized = "SessionPaymentAuthorized",
    SessionPaymentError = "SessionPaymentError",
    SessionLocked = "SessionLocked",
    SessionLockFailed = "SessionLockFailed",
    ActivePaymentProductType = "ActivePaymentProductType",
    ValidateSession = "ValidateSession",
}
export enum InternalCheckoutEvents {
    HeightChanged = "HeightChanged",
    LanguageChanged = "LanguageChanged",
    ScrollToTop = "ScrollToTop",
    ShowPopOutButton = "ShowPopOutButton",
    HidePopOutButton = "HidePopOutButton",
    TopLevelNavigation = "TopLevelNavigation",
}

export type SessionNotFound = {
    type: CheckoutEvents.SessionNotFound;
};

export type SessionLoaded = {
    type: CheckoutEvents.SessionLoaded;
    session: Session;
};

export type SessionUpdated = {
    type: CheckoutEvents.SessionUpdated;
    session: Session;
};

export type SessionCancel = {
    type: CheckoutEvents.SessionCancel;
    href: string;
};

export type SessionPaymentOnHold = {
    type: CheckoutEvents.SessionPaymentOnHold;
    transaction_id: string;
    merchant_reference: string;
    href: string;
};

export type SessionPaymentAuthorized = {
    type: CheckoutEvents.SessionPaymentAuthorized;
    transaction_id: string;
    merchant_reference: string;
    href: string;
};

export type SessionLocked = {
    type: CheckoutEvents.SessionLocked;
    pay_lock_id: string;
    callback: () => void;
};

export type ShowPopOutButton = {
    type: "ShowPopOutButton";
    styles: {
        font: string;
        height: string;
        color: string;
        background: string;
        textAlign: string;
        padding: string;
        margin: string;
        border: string;
        borderRadius: string;
        cursor: string;
        fontWeight: string;
        lineHeight: string;
        transition: string;
        outline: string;
    };
    stylesHover?: { [key: string]: string };
    stylesFocusVisible?: { [key: string]: string };
    openLabel: string;
    focusLabel: string;
    closeLabel: string;
    descriptionLabel: string;
    top: string;
    left: string;
    right: string;
    language: string;
    disabled: "true" | "false";
    session?: Session;
};

export type SessionLockFailed = {
    type: CheckoutEvents.SessionLockFailed;
};
export type ActivePaymentProductType = {
    type: CheckoutEvents.ActivePaymentProductType;
    payment_product_type: string | undefined;
};

export type ValidateSession = {
    type: CheckoutEvents.ValidateSession;
    session: Session;
    callback: (result: SessionValidationCallback) => void;
};

export interface SessionValidationCallback {
    success: boolean;
    clientValidationError?: string;
}

export type WrappedValidateSession = Pick<ValidateSession, "type" | "session">;
export type WrappedSessionLocked = Pick<SessionLocked, "type" | "pay_lock_id">;

export type SessionPayment = SessionPaymentAuthorized | SessionPaymentOnHold;

export type SessionPaymentError = {
    type: CheckoutEvents.SessionPaymentError;
    error: string;
    href: string;
};

export type SessionEvent =
    | SessionNotFound
    | SessionLoaded
    | SessionUpdated
    | SessionCancel
    | SessionPaymentOnHold
    | SessionPaymentAuthorized
    | SessionPaymentError
    | WrappedSessionLocked
    | SessionLockFailed
    | ActivePaymentProductType
    | WrappedValidateSession;
