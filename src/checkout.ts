import { Session } from "./session";

export enum CheckoutEvents {
    SessionNotFound = "SessionNotFound",
    SessionLoaded = "SessionLoaded",
    SessionUpdated = "SessionUpdated",
    SessionCancel = "SessionCancel",
    SessionPaymentAuthorized = "SessionPaymentAuthorized",
    SessionPaymentError = "SessionPaymentError",
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

export type SessionPaymentAuthorized = {
    type: CheckoutEvents.SessionPaymentAuthorized;
    transaction_id: string;
    merchant_reference: string;
    href: string;
};

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
    | SessionPaymentAuthorized
    | SessionPaymentError;
