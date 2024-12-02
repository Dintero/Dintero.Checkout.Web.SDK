# Dintero Checkout JavaScript SDK for frontend applications [![Actions Status](https://github.com/Dintero/Dintero.Checkout.Web.SDK/workflows/CI/badge.svg?branch=master)](https://github.com/Dintero/Dintero.Checkout.Web.SDK/actions?query=branch%3Amaster+workflow%3ACI+) [![npm latest version](https://img.shields.io/npm/v/@dintero/checkout-web-sdk/latest.svg)](https://www.npmjs.com/package/@dintero/checkout-web-sdk)

Use this SDK in your frontend application to

- embed an existing Dintero Checkout payment session in an iframe on your website
- redirect the end user to the full page version of the Dintero Checkout for an existing payment session

_Note that this SDK is for redirecting or embedding existing payment sessions. You cannot use this SDK to send requests to the Checkout API or to crate new payment sessions._

[Learn more about the Dintero Checkout at docs.dintero.com](https://docs.dintero.com/docs/checkout/getting-started/)

## Before you start

We cannot guarantee the delivery of events from the embedded checkout to the SDK client runtime. The sessions machine-to-machine `callback_url` will be delivered at least once. Read more about the [callback_url parameter](https://docs.dintero.com/checkout-api.html#operation/checkout_session_profile_post) in our api spec.

For payments on devices with the Vipps app installed, after payment is completed in the Vipps app, the end user will be returned to the browser where **the `return_url` on the payment is opened in a new browser tab** leaving the site that has the embedded checkout still open in a background browser tab on the device. In this case the SDK cannot guarantee that the handlers for `onPaymentAuthorized` or `onPaymentError` will be called.

If no custom handler are added for `onPaymentError`, `onPaymentAuthorized` and `onPaymentCanceled` the SDK will redirect the user to the `return_url` in the payment session.

## Installation

**NPM package**

```
npm install @dintero/checkout-web-sdk
```

## Using the SDK for an embedded checkout

The Dintero Checkout will be added to the `<div id="checkout-container"></div>` DOM-node.

### Minimal example

_When payment is completed, the SDK will redirect the end user to the `return_url` defined in the payment session._

```html
<script type="text/javascript">
    const container = document.getElementById("checkout-container");

    dintero.embed({
        container,
        sid: "T11223344.<short-uuid>",
    });
</script>
```

### Full inline HTML JavaScript example

_The checkout sdk will add a polyfill for promises if the browser does not support promises natively._

```html
<script type="text/javascript">
    const container = document.getElementById("checkout-container");

    dintero
        .embed({
            container,
            sid: "T11223344.<short-uuid>",
            popOut: false, // optional parameter to enable pop out mode
            language: "no", // optional parameter, an ISO 639-1 two-letter language code
            onSession: function (event, checkout) {
                console.log("session", event.session);
            },
            onPayment: function (event, checkout) {
                console.log("transaction_id", event.transaction_id);
                console.log("href", event.href);
                checkout.destroy();
            },
            onPaymentError: function (event, checkout) {
                console.log("href", event.href);
                checkout.destroy();
            },
            onSessionCancel: function (event, checkout) {
                console.log("href", event.href);
                checkout.destroy();
            },
            onSessionNotFound: function (event, checkout) {
                console.log("session not found (expired)", event.type);
                checkout.destroy();
            },
            onSessionLocked: function (event, checkout, callback) {
                console.log("pay_lock_id", event.pay_lock_id);
                callback(); // refresh session
            },
            onSessionLockFailed: function (event, checkout) {
                console.log("session lock failed");
            },
            onActivePaymentType: function (event, checkout) {
                console.log(
                    "payment product type selected",
                    event.payment_product_type,
                );
            },
            onValidateSession: function (event, checkout, callback) {
                console.log("validating session", event.session);
                callback({
                    success: true,
                    clientValidationError: undefined,
                });
            },
        })
        .then(function (checkout) {
            console.log("checkout", checkout);
        });
</script>
```

### Typescript example

```ts
import {
    embed,
    SessionLoaded,
    SessionUpdated,
    SessionPayment,
    SessionPaymentError,
    SessionCancel,
    SessionNotFound,
} from "@dintero/checkout-web-sdk";

const container = document.getElementById("checkout-container");

const checkout = await embed({
    container,
    sid: "T11223344.<short-uuid>",
    popOut: false, // optional parameter to enable pop out mode
    language: "no", // optional parameter, an ISO 639-1 two-letter language code
    onSession: (event: SessionLoaded | SessionUpdated) => {
        console.log("session", event.session);
    },
    onPayment: (
        event: SessionPaymentAuthorized | SessionPaymentOnHold,
        checkout,
    ) => {
        console.log("transaction_id", event.transaction_id);
        console.log("href", event.href);
        checkout.destroy();
    },
    onPaymentError: (event: SessionPaymentError, checkout) => {
        console.log("href", event.href);
        checkout.destroy();
    },
    onSessionCancel: (event: SessionCancel, checkout) => {
        console.log("href", event.href);
        checkout.destroy();
    },
    onSessionNotFound: (event: SessionNotFound, checkout) => {
        console.log("session not found (expired)", event.type);
        checkout.destroy();
    },
    onSessionLocked: (event: SessionLocked, checkout, callback) => {
        console.log("pay_lock_id", event.pay_lock_id);
        callback(); // refresh session
    },
    onSessionLockFailed: (event: SessionLockFailed, checkout) => {
        console.log("session lock failed");
    },
    onActivePaymentType: function (event: ActivePaymentProductType, checkout) {
        console.log(
            "payment product type selected",
            event.payment_product_type,
        );
    },
    onValidateSession: function (event: ValidateSession, checkout, callback) {
        console.log("validating session", event.session);
        callback({
            success: true,
            clientValidationError: undefined,
        });
    },
});
```

### Setting payment product type

The payment product type can be set with the returned `setActivePaymentProductType()`function when embedding the checkout.

Select "vipps" payment product type:

```
checkout.setActivePaymentProductType("vipps");
```

Resetting selection (so no option is selected in the checkout):

```
checkout.setActivePaymentProductType();
```

### Updating an Checkout Express-session

To update an existing Checkout Express-session, follow these steps:

1. Lock the session with the SDK
2. Perform a server-to-server [session update](https://docs.dintero.com/checkout-api.html#operation/checkout_session_put)
3. Refresh the session with the SDK

#### Locking the session

Call lockSession on the checkout object:

```js
checkout
    .lockSession()
    .then(function (sessionLockedEvent) {
        // initiate server side session update and then refresh the session
    })
    .catch(function (sessionLockFailedEvent) {
        // handle failure to lock
    });
```

`lockSession()` returns a promise that is resolved when the `SessionLocked` event is
received from the checkout or rejected if the SessionLockFailed event is received.

When the session is successfully locked, you'll get a callback at `onSessionLocked`.
If locking the session fails, there will be a callback at `onSessionLockFailed`.

While the session is locked, all editing and paying in the checkout is disabled.

#### Perform a server-to-server session update

See [session update](https://docs.dintero.com/checkout-api.html#operation/checkout_session_put) for details on what parts of the session can be updated, and how.

#### Refreshing the session

After updating the session, call refreshSession on the checkout object:

```js
checkout.refreshSession();
```

or use the callback in `onSessionLocked`:

```js
onSessionLocked: (event, checkout, callback) => {
    console.log("pay_lock_id", event.pay_lock_id);
    callback(); // refresh session
};
```

`refreshSession()` returns a promise that is resolved when the `SessionUpdated`
event is received from the checkout.

Editing and paying in the checkout is enabled again when a session without a `pay_lock`
is loaded by the checkout.

### Validating session before payment

To validate the session and perform actions before the session is paid, use the `onSessionValidation`-handler.

The checkout will be locked and payment will be paused until the provided callback function is called, or `checkout.submitValidationResult` is called with the result.

When validated successfully, return a successful result:

```js
{
    success: true;
}
```

If the validation is not successful, return the result with an error message:

```js
{
   success: false,
   clientValidationError: "session is not in sync with cart"
}
```

Example implementation:

```
onValidateSession: function(event, checkout, callback) {
     // Call the ecommerce solution to make sure the session is sync with the cart
     callback({
         success: false,
         clientValidationError: "session is not in sync with cart",
     });
},
```

## Using the SDK for a redirect checkout

The user is redirected to the Dintero Checkout to complete payment.

```ts
import { redirect } from "dintero-checkout-web-sdk";

const checkout = redirect({
    sid: "T11223344.<short-uuid>",
});
```

## Bugs

Bugs can be reported to https://github.com/Dintero/Dintero.Checkout.Web.SDK/issues

## Security

Contact us at [security@dintero.com](mailto:security@dintero.com)

## Browser support

All major browsers above version `N - 1`, where `N` is the most recent version. For Internet Explorer, only version 11 is supported.

The SDK includes a [polyfill for promises](https://github.com/getify/native-promise-only) that is added to the global scope if promises are not supported by the browser.

## Building from source

```bash
yarn install
yarn run build
```

The Dintero Checkout SDK is built with [microbundle](https://github.com/developit/microbundle).

## Creating a new release

1. Enforce all commits to the master branch to be formatted according to the [Angular Commit Message Format](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format)
2. Remember that the PR title is not used as the commit message if the PR is merged with the "Squash and merge" option and it only contains a single commit.
3. When merged to master, it will automatically be released with [semantic-release](https://github.com/semantic-release/semantic-release)
