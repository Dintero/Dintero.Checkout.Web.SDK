# Dintero Checkout JavaScript SDK for frontend applications

Use this SDK in your frontend application to

-   embed an existing Dintero Checkout payment session in an iframe on your website
-   redirect the end user to the full page version of the Dintero Checkout for an existing payment session

_Note that this SDK is for redirecting or embedding existing payment sessions. You cannot use this SDK to send requests to the Checkout API or to crate new payment sessions._

[Learn more about the Dintero Checkout at docs.dintero.com](https://docs.dintero.com/docs/checkout-getting-started.html)

## Before you start

We cannot guarantee the delivery of events from the embedded checkout to the SDK client runtime. The sessions machine-to-machine `callback_url` will be delivered at least once. Read more about the [callback_url parameter](https://docs.dintero.com/checkout-api.html#operation/checkout_session_profile_post) in our api spec.

For payments on devices with the Vipps app installed, after payment is completed in the Vipps app, the end user will be returned to the browser where **the `return_url` on the payment is opened in a ew browser tab** leaving the site that has the embedded checkout still open in a background browser tab on the device. In this case the SDK cannot guarantee that the handlers for `onPaymentAuthorized` or `onPaymentError` will be called.

If no custom handler are added for `onPaymentError`, `onPaymentAuthorized` and `onPaymentCanceled` the SDK will redirect the user to the `return_url` in the payment session.

## Installation

**NPM package**

```
npm install @dintero/checkout-web-sdk
```

**unpkg**

Load the Dintero Checkout SDK in a script tag on your site.

```
<script src="https://unpkg.com/@dintero/checkout-web-sdk@0.0.4/dist/checkout-web-sdk.umd.js" integrity="sha384-kspprVhMn1vXnNrJt8siBT8IniHvZyqFMGgU29s4nprJGcPcCnTdADgLth/5c2hz"></script>
```

## Using the SDK for an embedded checkout

The Dintero Checkout will be added to the `<div id="checkout-container"></div>` DOM-node.

### Inline HTML JavaScript example

_The checkout sdk will add a polyfill for promises if the browser does not support promises natively._

```html
<script type="text/javascript">
    const container = document.getElementById("#checkout-container");

    dintero
        .embed({
            container,
            sid: "T11223344.<short-uuid>",
            onSession: function(event, checkout) {
                console.log("session", event.session);
            },
            onSessionPaymentAuthorized: function(event, checkout) {
                console.log("transaction_id", event.transaction_id);
                console.log("href", event.href);
                checkout.destroy();
            },
            onSessionPaymentError: function(event, checkout) {
                console.log("href", event.href);
                checkout.destroy();
            },
            onSessionCancel: function(event, checkout) {
                console.log("href", event.href);
                checkout.destroy();
            },
        })
        .then(function(checkout) {
            console.log("checkout", checkout);
        });
</script>
```

### Typescript example

```ts
import {
    dintero,
    SessionLoaded,
    SessionUpdated,
    SessionPaymentAuthorized,
    SessionPaymentError,
    SessionCancel,
} from "dintero-checkout-web-sdk";

const container = document.getElementById("#checkout-container");

const checkout = await dintero.embed({
    container,
    sid: "T11223344.<short-uuid>",
    onSession: (event: SessionLoaded | SessionUpdated) => {
        console.log("session", event.session);
    },
    onSessionPaymentAuthorized: (event: SessionPaymentAuthorized) => {
        console.log("transaction_id", event.transaction_id);
        console.log("href", event.href);
        checkout.destroy();
    },
    onSessionPaymentError: (event: SessionPaymentError) => {
        console.log("href", event.href);
        checkout.destroy();
    },
    onSessionCancel: (event: SessionCancel) => {
        console.log("href", event.href);
        checkout.destroy();
    },
});
```

## Using the SDK for a redirect checkout

The user is redirected to the Dintero Checkout to complete payment.

```ts
import { dintero, SessionPaymentAuthorized } from "dintero-checkout-web-sdk";

const checkout = dintero.redirect({
    sid: "T11223344.<short-uuid>",
});
```

## Bugs

Bugs can be reported to https://github.com/dintero/checkout-web-sdk/issues

## Security

Contact us at [security@dintero.com](mailto:security@dintero.com)

## Browser support

All major browsers above version `N - 1`, where `N` is the most recent version. For Internet Explorer, only version 11 is supported.

The SDK includes a [polyfill for promises](https://github.com/getify/native-promise-only) that is added to the global scope if promises is not supported by the browser.

## Building from source

```bash
npm install
npm run build
```

The dintero-checkout-web-sdk is built with [microbundle](https://github.com/developit/microbundle).

## Creating a new release checklist

1. Bump the package version in `package.json`.
2. Regenerate integrity hash and update the unpgk install instructions in this file `shasum -b -a 384 dist/checkout-web-sdk.umd.js | awk '{ print $1 }' | xxd -r -p | base64 | sed "s/^/sha384-/g"`
3. Publish new version to npm with `npm publish --access=public`.
