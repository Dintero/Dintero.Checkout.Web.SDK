type BackdropEvent = {
    focusLabel: string;
    descriptionLabel: string;
    closeLabel: string;
}

type BackdropOptions = {
    close: () => void;
    focus: () => void;
    event: BackdropEvent;
}

const getBackdropZIndex = () => {
    // Iterate all DOM items to get current highest element.
    const elements = document.getElementsByTagName('*');
    const highest = Array.from(elements).reduce((acc, element) => {
        try {
            const zIndexStr = document.defaultView.getComputedStyle(element, null).getPropertyValue("z-index");
            const zIndex = parseInt(zIndexStr || '0');
            if (!isNaN(zIndex) && zIndex > acc) {
                return zIndex
            }
        } catch (e) {
            // Ignore errors when getting z-index
            console.error(e);
        }
        return acc;
    }, 0);
    if (highest < 9999) {
        return '9999';
    }
    return (highest + 1).toString();
}

const STYLE_ID = 'dintero-checkout-sdk-style';
const BACKDROP_ID = 'dintero-checkout-sdk-backdrop';
const BACKDROP_DESCRIPTION = 'dintero-checkout-sdk-backdrop-desciption';
const FOCUS_CHECKOUT_BUTTON_ID = 'dintero-checkout-sdk-backdrop-focus';
const CLOSE_BACKDROP_BUTTON_ID = 'dintero-checkout-sdk-backdrop-close';

const wrapPreventDefault = (fn: () => void) => {
    // Creates a wrapped function that will invoke preventDefault() to stop
    // the event from bubling up the DOM tree.
    return (e: MouseEvent) => {
        e.preventDefault();
        fn();
    }
}

const appendBackdropStyles = () => {
    // Check if exists before appending to DOM
    if (document.getElementById(STYLE_ID)) {
        return;
    }
    // Add style to DOM
    const style = document.createElement('style');
    style.setAttribute('id', STYLE_ID);
    style.innerHTML = `
        @keyframes ${BACKDROP_ID}-fade-in {
            from {opacity: 0;}
            to {opacity: 1;}
        }

        #${BACKDROP_ID} {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100vh;
            width: 100vw;
            background-color: rgba(0,0,0,0.9);
            background: radial-gradient(rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%);
            cursor: pointer;
            animation:  20ms ease-out ${BACKDROP_ID}-fade-in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 20px;
            color: #ffffff;
            font-family:  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            font-size: 18px;
            font-weight: 400;
            line-height: normal;
            text-rendering: geometricPrecision;
            margin: 0;
            padding: 0;
            border: 0;
            vertical-align: baseline;
            line-height: normal;
        }

        #${BACKDROP_ID} p {
            padding: 0;
            margin: 0;
            border: 0;
            user-select: none;
        }

        #${FOCUS_CHECKOUT_BUTTON_ID} {
            background-color: #efefef !important;
            color: #000000 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            border-radius: 200px !important;
            margin: 0 !important;
            line-height: normal !important;
            border: none !important;
            padding: 10px 20px !important;
            user-select: none !important;
            cursor: pointer !important;
        }
        #${FOCUS_CHECKOUT_BUTTON_ID}:hover,
        #${FOCUS_CHECKOUT_BUTTON_ID}:focus {
            outline: none !important;
            background-color: #ffffff !important;
            border: none !important;
            color: #000000 !important;
            padding: 10px 20px !important;
            margin: 0 !important;
        }
        #${FOCUS_CHECKOUT_BUTTON_ID}:focus{
            outline-offset: 2px;
            outline: 1px #ffffff solid !important;
        }

        #${CLOSE_BACKDROP_BUTTON_ID} {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 4px !important;
            height: 24px !important;
            width: 24px !important;
            color: #efefef !important;
            position: absolute !important;
            top: 16px !important;
            right: 24px !important;
            transition: all 200ms ease-out !important;
            cursor: pointer !important;
        }

        #${CLOSE_BACKDROP_BUTTON_ID}:hover,
        #${CLOSE_BACKDROP_BUTTON_ID}:focus {
            outline: none !important;
            color: #ffffff !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            position: absolute;
            top: 16px;
            right: 24px;
        }
        #${CLOSE_BACKDROP_BUTTON_ID}:focus{
            outline: 1px #ffffff solid !important;
        }

        #${BACKDROP_ID}:before,
        #${BACKDROP_ID}:after,
        #${BACKDROP_ID} > *:before,
        #${BACKDROP_ID} > *:after {
            content: '';
            content: none;
        }
    `;
    document.head.appendChild(style);
}

const createBackdropDOM = () => {
    // Dark translucent backdrop element
    const backdrop = document.createElement('div');
    backdrop.setAttribute("id", BACKDROP_ID);
    backdrop.setAttribute("role", "dialog");
    backdrop.style.zIndex = getBackdropZIndex();
    return backdrop
}

const createCloseButtonDOM = (label: string) => {
    // Close button for the top right corner
    const button = document.createElement('button');
    button.setAttribute("id", CLOSE_BACKDROP_BUTTON_ID);
    button.setAttribute("aria-label", label);
    button.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            alt="close icon"
        >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
    return button;
}

const createDinteroLogoDOM = () => {
    // Close button for the top right corner
    const div = document.createElement('div');
    div.innerHTML = `
        <svg width="120px" height="22px" viewBox="0 0 630 111" version="1.1" >
            <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="Dintero" fill="#ffffff" fillRule="nonzero">
                    <path d="M376.23,60.48 L376.23,73.54 L454.13,73.54 C456.31,41.55 435.85,23.71 410.61,23.71 C385.37,23.71 367.09,41.77 367.09,66.79 C367.09,92.03 386.02,110.31 411.91,110.31 C433.02,110.31 448.9,97.25 453.25,82.24 L436.5,82.24 C432.37,89.42 423.88,95.51 411.91,95.51 C395.16,95.51 382.75,83.11 382.75,66.79 C382.75,50.69 394.72,38.5 410.6,38.5 C426.48,38.5 438.45,50.68 438.45,66.79 L444.54,60.48 L376.23,60.48 Z M154.29,17.83 L171.7,17.83 L171.7,0.42 L154.29,0.42 L154.29,17.83 Z M120.34,108.13 L191.27,108.13 L191.27,93.77 L120.34,93.77 L120.34,108.13 Z M156.46,40.24 L156.46,108.13 L171.69,108.13 L171.69,45.47 C171.69,32.85 165.82,25.89 151.89,25.89 L120.34,25.89 L120.34,40.25 L156.46,40.25 L156.46,40.24 Z M499.17,25.88 L464.36,25.88 L464.36,40.24 L483.94,40.24 L484.16,108.13 L499.39,108.13 L499.17,62.44 C499.17,48.51 508.53,40.25 521.58,40.25 L535.29,40.25 L535.29,25.89 L524.41,25.89 C509.18,25.89 501.78,31.33 497.65,41.56 L495.47,47 L499.17,47.65 L499.17,25.88 Z M288.76,25.88 L310.52,25.88 L310.52,6.3 L325.75,6.3 L325.75,25.88 L359.69,25.88 L359.69,40.24 L325.75,40.24 L325.75,93.77 L359.69,93.77 L359.69,108.13 L332.49,108.13 C318.56,108.13 310.51,98.99 310.51,86.37 L310.51,40.24 L288.75,40.24 L288.75,25.88 L288.76,25.88 Z M464.35,108.13 L535.28,108.13 L535.28,93.77 L464.35,93.77 L464.35,108.13 Z M108.6,54.17 C108.6,23.06 85.54,0.43 53.77,0.43 L0.9,0.43 L0.9,108.14 L53.77,108.14 C85.53,108.13 108.6,85.5 108.6,54.17 M248.07,23.71 C234.58,23.71 223.92,31.98 220,41.55 L220,25.88 L204.77,25.88 L204.77,108.13 L220,108.13 L220,66.35 C220,53.08 224.79,38.93 243.72,38.93 C259.39,38.93 267.44,48.07 267.44,67.43 L267.44,108.12 L282.67,108.12 L282.67,64.6 C282.67,35.02 265.91,23.71 248.07,23.71 M586.2,110.31 C611.22,110.31 629.72,92.03 629.72,67.01 C629.72,41.99 611.23,23.71 586.2,23.71 C560.96,23.71 542.68,41.99 542.68,67.01 C542.68,92.03 560.96,110.31 586.2,110.31 M586.2,95.51 C570.32,95.51 558.35,83.33 558.35,67.01 C558.35,50.69 570.32,38.51 586.2,38.51 C602.08,38.51 614.05,50.69 614.05,67.01 C614.05,83.33 602.08,95.51 586.2,95.51 M16.99,92.9 L16.99,15.66 L51.8,15.66 C75.3,15.66 92.05,31.98 92.05,54.61 C92.05,76.8 75.3,92.91 51.8,92.91 L16.99,92.91 L16.99,92.9 Z" id="Shape"></path>
                </g>
            </g>
        </svg>`;
    return div;
}

const createLabelDOM = (text: string) => {
    // Text about the pop out
    const p = document.createElement('p');
    p.setAttribute('id', BACKDROP_DESCRIPTION);
    p.innerText = text;
    return p;
}

const createFocusButtonDOM = (text: string) => {
    // Mock button to give the user a call to action element to click, even
    // though the entire backdrop (except the close button) returns focus to the
    // checkout.
    const div = document.createElement('button');
    div.setAttribute("id", FOCUS_CHECKOUT_BUTTON_ID);
    div.innerText = text;
    return div;
}

const focusTrap = (e: KeyboardEvent) => {
    // Prevent the user focusing outside of the backdrop while it is visible
    const focusButton = document.getElementById(FOCUS_CHECKOUT_BUTTON_ID);
    const closeButton = document.getElementById(CLOSE_BACKDROP_BUTTON_ID);
    if (e.key === 'Tab' || e.code === "Tab") {
        if (document.activeElement === focusButton) {
            closeButton.focus();
            e.preventDefault();
        } else {
            // Tab
            focusButton.focus();
            e.preventDefault();
        }
    }
}

const createBackdropView = (options: BackdropOptions) => {
    // Add styles needed for the backdrop;
    appendBackdropStyles();
    // Create DOM nodes
    const backdrop = createBackdropDOM();
    const closeButton = createCloseButtonDOM(options.event.closeLabel);
    const dinteroLogo = createDinteroLogoDOM();
    const label = createLabelDOM(options.event.descriptionLabel);
    const focusButton = createFocusButtonDOM(options.event.focusLabel);

    // Add click handlers
    backdrop.onclick = wrapPreventDefault(options.focus);
    focusButton.onclick = wrapPreventDefault(options.focus);
    closeButton.onclick = wrapPreventDefault(options.close);

    // Add focus trap when backdrop is visible
    document.addEventListener('keydown', focusTrap);

    // Append to document
    backdrop.appendChild(closeButton);
    backdrop.appendChild(dinteroLogo);
    backdrop.appendChild(label);
    backdrop.appendChild(focusButton);
    document.body.appendChild(backdrop);
    backdrop.focus();
    return backdrop;
}

export const setBackdropLabels = (event: BackdropEvent) => {
    const focusButton = document.getElementById(FOCUS_CHECKOUT_BUTTON_ID);
    if (focusButton) {
        focusButton.innerText = event.focusLabel;
    }
    const description = document.getElementById(BACKDROP_DESCRIPTION);
    if (description) {
        description.innerText = event.descriptionLabel;
    }
    const closeButton = document.getElementById(CLOSE_BACKDROP_BUTTON_ID);
    if (closeButton) {
        closeButton.setAttribute('aria-label', event.descriptionLabel);
    }
}

export const createBackdrop = (options: BackdropOptions) => {
    try {
        // Check if backdrop already exists
        const backdrop = document.getElementById(BACKDROP_ID);
        if (backdrop) {
            return;
        }
        return createBackdropView(options);
    } catch (e) {
        // Ignore errors when creating backdrop. If it fails we should not
        // block the payment.
        console.error(e);
    }
}

export const removeBackdrop = () => {
    try {
        const backdrop = document.getElementById(BACKDROP_ID);
        if (backdrop) {
            document.body.removeChild(backdrop);
        }
        document.removeEventListener('keydown', focusTrap);
    } catch (e) {
        // Ignore errors when closing backdrop. If it fails we should not stop
        // the rest of the application from working.
        console.error(e);
    }
}
