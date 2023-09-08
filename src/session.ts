export interface Address {
    /**
     * example:
     * Sommerkroveien 34
     */
    address_line: string;
    /**
     * example:
     * PB 123
     */
    address_line_2?: string;
    /**
     * example:
     * 4515
     */
    postal_code?: string;
    /**
     * example:
     * Oslo
     */
    postal_place: string;
    /**
     * ISO 3166-1 country code
     *
     * example:
     * NO
     */
    country: string; // iso-3166-1
}
export interface Store {
    /**
     * example:
     * sc029
     */
    id: string;
    /**
     * name of the store, aka trade name of the store
     *
     * example:
     * SC Oslo
     */
    name?: string;
    /**
     * Official name of the person or entity that owns the store.
     *
     * example:
     * SC Oslo AS
     */
    business_name?: string;
    address?: Address;
    /**
     * example:
     * SuperChain
     */
    chain?: string;
    /**
     * example:
     * contact@superchain.com
     */
    email?: string;
    /**
     * example:
     * 5790001398644
     */
    gln?: string;
    /**
     * example:
     * 123456789MVA
     */
    organization_number?: string;
    /**
     * example:
     * +4738260107
     */
    phone_number?: string;
    /**
     * A four-digit Merchant Category Code (MCC) for the store
     * [ISO 18245:2003](https://www.iso.org/standard/33365.html)
     *
     * example:
     * 5814
     */
    mcc?: string; // iso-18245
    /**
     * Merchant number associated with the stores
     * payment terminal
     *
     * example:
     * 102603
     */
    bax?: string;
    /**
     * Id to a specific point-of-sale (POS) terminal
     * or workstation
     *
     * example:
     * T0292
     */
    terminal_id?: string;
}
export interface ShippingOption {
    /**
     * Id of this shipping option product.
     *
     * The express checkout will group all products with the same id. Used for
     * grouping delivery to the same address at different time slots, or for
     * grouping deliveries to different pick up points.
     *
     * example:
     * bring-pick-up-00001
     */
    id: string;
    /**
     * Unique id of the specific configuration of this shipping product
     *
     * example:
     * bring-pick-up-00001-location-0a1f6b
     */
    line_id: string;
    /**
     * Countries where this shipping option can be used
     */
    countries?: string /* iso3166-alpha2 */[];
    /**
     * The monetary amount of the shipping option
     *
     * example:
     * 3900
     */
    amount: number;
    /**
     * The VAT of the `amount` parameter. Only
     * used for display purposes.
     *
     * example:
     * 975
     */
    vat_amount?: number;
    /**
     * The VAT percentage
     *
     * example:
     * 25
     */
    vat?: number;
    /**
     * A shipping option title. Eg. "Standard"
     *
     * example:
     * Standard
     */
    title: string;
    /**
     * A short description of the shipping option product
     *
     * example:
     * Pick up at your nearest postal office
     */
    description?: string;
    /**
     * example:
     * pick_up
     */
    delivery_method?: "delivery" | "pick_up" | "none";
    /**
     * Name of company that provides shipping service
     *
     * example:
     * Bring
     */
    operator: string;
    /**
     * The operators own id for this shipping product
     *
     * example:
     * pick-up-00001-location-0a1f6b
     */
    operator_product_id?: string;
    /**
     * Estimated time of arrival
     */
    eta?: {
        /**
         * example:
         * 2020-10-14T19:00:00Z
         */
        starts_at?: string; // date-time
        /**
         * example:
         * 2020-10-14T20:00:00Z
         */
        ends_at?: string; // date-time
    };
    /**
     * A specified time for delivery to customer
     */
    time_slot?: {
        /**
         * example:
         * 2020-10-14T19:00:00Z
         */
        starts_at?: string; // date-time
        /**
         * example:
         * 2020-10-14T20:00:00Z
         */
        ends_at?: string; // date-time
    };
    /**
     * Address
     */
    pick_up_address?: {
        /**
         * example:
         * John
         */
        first_name?: string;
        /**
         * example:
         * Doe
         */
        last_name?: string;
        /**
         * Gaustadalleen 21
         */
        address_line?: string;
        /**
         * PB 123
         */
        address_line_2?: string;
        /**
         * example:
         * Land Lord
         */
        co_address?: string;
        /**
         * Name of the company
         */
        business_name?: string;
        /**
         * The zip code / postal code of the address.
         * example:
         * O349
         */
        postal_code?: string;
        /**
         * The name of the postal code
         * example:
         * Oslo
         */
        postal_place?: string;
        /**
         * Country of the location
         * example:
         * NO
         */
        country?: string; // iso3166-alpha2
        /**
         * mobile number of a person / company, ITU/E.123 format with
         * international prefix (+PPNNNNNNNNN...)
         *
         */
        phone_number?: string; // ^\+?\d{5,15}$
        /**
         * The email address of a person or an organization
         *
         */
        email?: string;
        latitude?: number;
        longitude?: number;
        /**
         * Comment about the address
         *
         */
        comment?: string;
        /**
         * Distance in kilometers from the shipping_address.
         *
         */
        distance?: number;
    };
}
/**
 * Address in an Order
 */
export interface OrderAddress {
    /**
     * example:
     * John
     */
    first_name?: string;
    /**
     * example:
     * Doe
     */
    last_name?: string;
    /**
     * Gaustadalleen 21
     */
    address_line?: string;
    /**
     * PB 123
     */
    address_line_2?: string;
    /**
     * example:
     * Land Lord
     */
    co_address?: string;
    /**
     * Name of the company
     */
    business_name?: string;
    /**
     * The zip code / postal code of the address.
     * example:
     * O349
     */
    postal_code?: string;
    /**
     * The name of the postal code
     * example:
     * Oslo
     */
    postal_place?: string;
    /**
     * Country of the location
     * example:
     * NO
     */
    country?: string; // iso3166-alpha2
    /**
     * mobile number of a person / company, ITU/E.123 format with
     * international prefix (+PPNNNNNNNNN...)
     *
     */
    phone_number?: string; // ^\+?\d{5,15}$
    /**
     * The email address of a person or an organization
     *
     */
    email?: string;
    latitude?: number;
    longitude?: number;
    /**
     * Comment about the address
     *
     */
    comment?: string;
}
export interface DiscountItem {
    /**
     * Monetary amount in smallest unit for the currency
     *
     * example:
     * 23130
     */
    amount?: number;
    /**
     * Optional, set if the amount given was from a percentage discount
     *
     * example:
     * 10
     */
    percentage?: number;
    discount_type?:
        | "customer"
        | "periodic"
        | "manual"
        | "loyalty"
        | "total"
        | "employee"
        | "external";
    /**
     * example:
     * 766da0ef-9283-42bd-b012-0582344ec53c
     */
    discount_id?: string;
    description?: string;
    /**
     * example:
     * 1
     */
    line_id?: number;
}
/**
 * Publish checkout message to the customer.
 *
 */
export type PublishConfiguration = {
    channel: "sms" | "push";
    type: "checkout-link" | "app";
    readonly id?: string;
    /**
     * status of the message sent to the customer.
     *
     * **`skipped`** will used in case where publish
     * cannot be sent given the `session.customer`.
     *
     */
    readonly status?: "sent" | "skipped" | "failed";
}[];
export interface InstabankConfiguration {
    /**
     * finance payment
     */
    finance?: {
        /**
         * enable finance payment
         */
        enabled: boolean;
    };
    /**
     * invoice payment
     */
    invoice?: {
        /**
         * enable invoice payment (only for amounts greater than 500 NOK)
         */
        enabled: boolean;
    };
}
export interface VippsConfiguration {
    /**
     * enable vipps payment
     */
    enabled: boolean;
    /**
     * A short reference / descriptor that can be displayed to
     * the end user
     *
     */
    dynamic_descriptor?: string;
}
export interface CollectorConfiguration {
    /**
     * A textual description max 40 characters of the purchase.
     *
     */
    dynamic_descriptor?: string;
    invoice?: {
        /**
         * enable Collector Bank Invoice Payment
         */
        enabled: boolean;
    };
    finance?: {
        /**
         * enable Collector Bank Finance Payment
         */
        enabled: boolean;
    };
}
export interface SantanderConfiguration {
    /**
     * Denotes what kind of config parameter this is
     */
    type?: "payment_type";
    debit_account?: {
        /**
         * Denotes what kind of config parameter this is
         */
        type?: "payment_product_type";
        /**
         * enable Santander Finance Debit Account
         */
        enabled: boolean;
        /**
         * The name of the chain
         */
        branding_name?: string;
        /**
         * Debit accounts belonging to the customer's phone number
         */
        accounts?: {
            /**
             * Token to represent the account number
             */
            account_number_token?: string;
            /**
             * Representation of the account number for display purposes
             */
            masked_account_number?: string;
        }[];
    };
}
export interface PayExConfiguration {
    /**
     * A textual description max 40 characters of the purchase.
     *
     */
    dynamic_descriptor?: string;
    swish?: {
        /**
         * enable Payex Swish Payment
         */
        enabled: boolean;
    };
    creditcard?: {
        /**
         * enable Credit Card Payment
         */
        enabled: boolean;
    };
}
export interface Session {
    url: {
        /**
         * URL to page where Checkout will redirect the
         * customer to after the Checkout process has ended.
         *
         * If a transaction was completed successfully, a `transaction_id`
         * will be appended to the URL as a `query` string parameter
         *
         * > A `transaction_id` will be appended to the URL if the
         * > Checkout failed with `error=capture`
         *
         * *Example*:
         *
         *    ```
         *    https://example.com/accept?transaction_id=T00000000.3YkJXSdSnUBXcmQSzn7uJj
         *    ```
         *
         *  query name    | type | description | required
         * -------------- | :----------: | ----------- | :-----------:
         * transaction_id |   string     | Transaction Id | false
         * error          |   string     | Error code identifying cause | false
         * merchant_reference | string   | The merchants reference | true
         *
         * In case of that something went wrong with the payment flow, an
         * `error` query parameter will be appended to the URL. The value
         * of the error is a code identifying the cause.
         *
         * error         | Description
         * ------------- | ------------
         * cancelled     | Customer cancelled the checkout payment
         * authorization | Customer failed to authorize the payment
         * capture       | The transaction capture operation failed during auto-capture
         * failed        | The transaction has been rejected by us, or an error has occurred during transaction processing
         *
         * example:
         * https://example.com/accept
         */
        return_url: string; // uri https?://*
        /**
         * URL that Checkout will call when the session
         * payment is complete and the transaction has been authorized/captured.
         *
         * > A session with `auto_capture` enabled will only receive the call
         * > when the transaction is captured.
         *
         * Unlike the `return_url` the `callback_url` is system-to-system
         * which means delivery is guaranteed.
         *
         * Once a session payment is complete the callback_url is invoked as a
         * `GET` request to notify your system that the payment has been approved.
         *
         * A successful delivery to an HTTP/HTTPS callback_url sometimes requires
         * more than one attempt. This can be the case, for example, if the server
         * hosting the callback_url is down for maintenance or is experiencing
         * heavy traffic.
         *
         * Dintero attempts a retry only after a failed delivery attempt, following
         * situations is considered as failed delivery
         *
         *  - HTTP status code 100 to 101 and 500 to 599 (inclusive)
         *    (HTTP status code 400 to 499 is considered as permanent failure)
         *  - A request timeout (10 seconds)
         *  - Any connection error such as connection timeout, bad certificate, etc
         *
         * Failed delivery will be retried 20 times.
         *
         *  query name   | type | description | required
         * ------------- | :-----------: | -----------: | :-----------:
         * transaction_id |   string   | Transaction Id | true
         * session_id     |   string   | Session Id | true
         * merchant_reference | string | The merchants reference | true
         * time | string | ISO 8601 format | true
         *
         * example:
         * https://example.com/callback
         */
        callback_url?: string; // uri https?://*
    };
    customer?: {
        /**
         * Customer id
         *
         */
        customer_id?: string;
        /**
         * Customer email address
         *
         * example:
         * john.doe@example.com
         */
        email?: string;
        /**
         * Customer phone number, ITU/E.123 format with
         * international prefix (+PPNNNNNNNNN...)
         *
         * example:
         * +4799999999
         */
        phone_number?: string;
    };
    order: {
        /**
         * The amount to authorize/capture including VAT and discounts.
         *
         * example:
         * 29990
         */
        amount: number;
        /**
         * The VAT of the `amount` parameter.
         * Only used for display purposes.
         *
         * example:
         * 6000
         */
        vat_amount?: number;
        /**
         * The three-character ISO-4217 currency. https://en.wikipedia.org/wiki/ISO_4217
         * example:
         * NOK
         */
        currency: string; // iso4217-code
        /**
         * A reference by the merchant to identify the corresponding
         * order for the Checkout Session
         *
         */
        merchant_reference: string;
        shipping_address?: OrderAddress;
        billing_address?: OrderAddress;
        /**
         * This is a partial payment where the `order.amount` can be lower or
         * equal to the sum of `order.items.amount`
         *
         */
        partial_payment?: boolean;
        /**
         * Details about the order items.
         *
         * #### Instabank
         * `required` if Instabank payment is configured in and partial_payment is false.
         * All items must include a unique `line_id`, quantity and amount
         *
         * #### Collector Bank
         * `required` if Collector Bank payment is configured in and partial_payment is false.
         * All items must include a unique `line_id`, quantity and amount
         *
         */
        items?: {
            /**
             * The ID or SKU of the product on the line
             *
             * example:
             * item_01
             */
            id?: string;
            /**
             * The groups the product on the line belongs to
             *
             * example:
             * [object Object]
             */
            groups?: {
                /**
                 * Group ID
                 */
                id: string;
                /**
                 * Group name
                 */
                name?: string;
            }[];
            /**
             * the number of the line (or id), must be `unique` between
             * all items. `required` when Instabank payment is configured.
             *
             * example:
             * 1
             */
            line_id?: string;
            /**
             * A short, localized description of the line item
             *
             * example:
             * Stablestol
             */
            description?: string;
            /**
             * The quantity of the product in the item line.
             *
             * example:
             * 1
             */
            quantity?: number;
            /**
             * The total monetary amount of the line item
             *
             * example:
             * 29990
             */
            amount?: number;
            /**
             * The VAT of the `amount` parameter. Only
             * used for display purposes.
             *
             * example:
             * 6000
             */
            vat_amount?: number;
            /**
             * The VAT percentage
             *
             * example:
             * 25
             */
            vat?: number;
            /**
             * The volume of one item in m³ (cubic meters)
             *
             */
            unit_volume?: number;
            /**
             * The volume of one item in kg (kilo grams)
             *
             */
            unit_weight?: number;
            /**
             * The dimensional weight (also known as volumetric) value unit of one item. [Dimensional weight at Wikipedia](https://en.wikipedia.org/wiki/Dimensional_weight)
             *
             */
            unit_dimensional_weight?: number;
            /**
             * The item is eligible for discount
             *
             */
            eligible_for_discount?: boolean;
            /**
             * Discount applied to amount
             *
             */
            is_changed?: boolean;
            /**
             * The origin item amount before any discount
             *
             */
            readonly gross_amount?: number;
            discount_lines?: DiscountItem[];
        }[];
        /**
         * The origin amount to authorize/capture including VAT
         * before any discount, only set if the session was updated
         * when calculating discounts.
         *
         */
        readonly gross_amount?: number;
        /**
         * The original order amount was changed by discount
         * given.
         *
         */
        readonly is_changed?: boolean;
        shipping_option?: ShippingOption;
        store?: Store;
    };
    /**
     * The session expiration time after which the
     * Checkout page wouldn't be available
     *
     */
    expires_at?: string; // date-time
    /**
     * ### Present only for _Express Checkout_ sessions.
     *
     * An _Express Checkout_ session is a session where the end user will submit a
     * shipping address and then select a shipping option before the before a
     * payment method is selected and the payment is initiated.
     *
     * Endpoints used in the _Express Checkout_ flow.
     * 1. [Set shipping address](/#operation/checkout_sid_json_order_shipping_address_put)
     * 2. [Set shipping option](/#operation/checkout_sid_json_order_items_shipping_option_put)
     *
     */
    express?: {
        /**
         * URL that Checkout will POST to when the end user has submitted/changed
         * a shipping address for an express-session.
         *
         * Dintero will not attempt a retry after a failed delivery attempt.
         * Following situations is considered as failed delivery
         *
         * - HTTP status codes that are not 200.
         * - A request timeout (60 seconds)
         * - Any connection error such as connection timeout, bad certificate, etc
         *
         * The request body of the POST request will be the
         * [ExpressSession]((https://docs.dintero.com/specs/spec-checkout.yml))
         * json object, containing a shipping address.
         *
         * The expected response has status code 200 and the response body contains a json object with a list of [ShippingOptions](https://docs.dintero.com/specs/spec-checkout.yml) that will replace the _`shipping_options`_ in the express-session.
         * If the merchant is not able to ship the order to the end users shipping address, return an object with an empty array of _`shipping_options`_.
         *
         * <strong><small>Example callback response body:</small></strong>
         * <pre>
         * {
         *   "shipping_options": [
         *     {
         *       "id": "bring-pick-up-00001",
         *       "line_id": "bring-pick-up-00001-location-0a1f6b",
         *       "country": "NO",
         *       "amount": 3900,
         *       "vat_amount": 975,
         *       "vat": 25,
         *       "title": "Standard",
         *       "description": "Pick up at your nearest postal office",
         *       "delivery_method": "pick_up",
         *       "operator": "Bring",
         *       "operator_product_id": "pick-up-00001-location-0a1f6b",
         *       "eta": {
         *         "relative": {
         *           "minutes_min": 0,
         *           "minutes_max": 0
         *         },
         *         "absolute": {
         *           "starts_at": "2020-10-14T19:00:00Z",
         *           "ends_at": "2020-10-14T20:00:00Z"
         *         }
         *       },
         *       "time_slot": {
         *         "starts_at": "2020-10-14T19:00:00Z",
         *         "ends_at": "2020-10-14T20:00:00Z"
         *       },
         *       "pick_up_address": {
         *         "first_name": "John",
         *         "last_name": "Doe",
         *         "address_line": "string",
         *         "address_line_2": "string",
         *         "co_address": "Land Lord",
         *         "business_name": "string",
         *         "postal_code": "O349",
         *         "postal_place": "Oslo",
         *         "country": "NO",
         *         "phone_number": "string",
         *         "email": "string",
         *         "latitude": 0,
         *         "longitude": 0,
         *         "comment": "string"
         *       }
         *     }
         *   ]
         * }
         * </pre>
         *
         * example:
         * https://example.com/order/00128110/address_updated
         */
        shipping_address_callback_url?: string; // uri https?://*
        /**
         * Shipping options that will be presented to the end user after the
         * end user has submitted a shipping address.
         *
         * To dynamically update the shipping_options when the _`order.shipping_address`_ is
         * changed by the end user in the checkout, use the
         * _`url.shipping_address_callback_url`_.
         *
         *  If the merchant is not able to ship the order to the end users shipping address, use an empty array.
         *
         *  If there is only one option, a free delivery, the order still has to contain one option with a _`price.amount`_ of 0.
         *
         */
        shipping_options: ShippingOption[];
    };
    configuration: {
        /**
         * If `true` the transaction from the payment session will be captured
         * automatically after the transaction has been `AUTHORIZED`. The checkout
         * sessions `callback_url` will not be called until after the transaction
         * has been `CAPTURED`.
         *
         * If `auto_capture` is not specified it defaults to `false`.
         *
         * A successful auto-capture of a transaction sometimes requires more
         * than one capture attempt. This can be the case if the payment gateway
         * is down or is experiencing heavy traffic.
         *
         * Dintero will attempts capture retries for 48 hours, the `callback_url`
         * will be invoked when capture succeeds.
         *
         * Manual capture of a transaction that is pending auto-capture will
         * stop the auto-capture process from completing the capture.
         *
         */
        auto_capture?: boolean;
        publish?: PublishConfiguration;
        /**
         * Configure the default payment type, the selected payment when
         * loading the checkout window. The value must be an enabled payment type.
         *
         */
        default_payment_type?:
            | "instabank.finance"
            | "instabank.invoice"
            | "vipps"
            | "payex.creditcard"
            | "payex.swish"
            | "collector.finance"
            | "collector.invoice"
            | "santander.debit_account";
        instabank?: InstabankConfiguration;
        payex?: PayExConfiguration;
        vipps?: VippsConfiguration;
        collector?: CollectorConfiguration;
        santander?: SantanderConfiguration;
        discounts?: {
            readonly type?: "discounts";
            /**
             * Enable discount calculation on order
             * items eligible for discount
             *
             * - A session that has the `customer.customer_id` set will have
             *   its discounts calculated when the session is created.
             *
             * - A session with no customer_id will only have the discounts
             *   calculated when the customer is identified by the checkout
             *   page.
             *
             * - The autorized amount will be the net amount from the
             *   original session amount specified when the session was
             *   created.
             *
             */
            enabled: boolean;
        };
    };
    /**
     * The ID of the Checkout
     */
    id?: string;
    /**
     * Time when the Checkout was created
     */
    created_at?: string; // date-time
    /**
     * Last time when the Checkout was updated
     */

    transaction_id?: string;
}
