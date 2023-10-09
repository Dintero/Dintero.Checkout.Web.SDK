## [0.6.0]

### Changed

-   Changes iframe to also have `allow="payment"` property to support Apple Pay when embedded

## [0.4.0]

### Changed

-   Changes `lockSession` to return a promise that resolves when the following `SessionLocked` event is returned from the checkout.
-   Changes `refreshSession` to return a promise that resolves when the following `SessionUpdated` event is returned from the checkout.

## [0.3.1]

### Bug Fixes

-   Add correct package version to url

## [0.3.0]

### Features

-   **lock:** Add callback function to `onSessionLocked`

## [0.2.0]

### Features

-   Handling of session validation when embedded

## [0.0.17]

### Changed

-   Adds `onActivePaymentProductType` callback.
-   Adds `setActivePaymentProductType` function.

## [0.0.16]

### Changed

-   Changed build tool from microbundle to preconstruct, should fix exported types, updated/fixed documentation

## [0.0.15]

### Changed

-   Added `lockSession` and `refreshSession` functions

## [0.0.14]

### Changed

-   Added `onSessionLocked` and `onSessionLockFailed` callbacks
-   Bumped dev dependencies to fix security issues with some of the
    dev dependencies

## [0.0.13]

### Changed

-No changes but the build published to NPM for version `0.0.12` vas outdated.

## [0.0.12]

### Added

-   Support embed with `onPayment` event handler.
-   _Deprecate_ support for embed with `onPaymentAuthorized` event handler.

## [0.0.11]

### Added

-   Support for language updates and embedResult page

## [0.0.10]

### Changed

-   Use correct callback names in README examples

## [0.0.9]

### Added

-   sdk version as url query parameter
