type BackdropOptions = {
    close: () => void;
    focus: () => void;
    label?: string;
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
            background-color: rgba(0,0,0,0.8);
            cursor: pointer;
            animation:  20ms ease-out ${BACKDROP_ID}-fade-in;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ffffff;
        }

        #${CLOSE_BACKDROP_BUTTON_ID} {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            height: 24px !important;
            width: 24px !important;
            color: #efefef !important;
            position: absolute;
            top: 16px;
            right: 24px;
            transition: all 200ms ease-out;
        }
        #${CLOSE_BACKDROP_BUTTON_ID}:hover,
        #${CLOSE_BACKDROP_BUTTON_ID}:focus {
            outline: none;
            color: #ffffff !important;
        }
    `;
    document.head.appendChild(style);
}

const createBackdropDOM = () => {
    // Dark translucent backdrop element
    const backdrop = document.createElement('div');
    backdrop.setAttribute("id", BACKDROP_ID);
    backdrop.style.zIndex = getBackdropZIndex();
    return backdrop
}

const createCloseButtonDOM = () => {
    // Close button for the top right corner
    const button = document.createElement('button');
    button.setAttribute("id", CLOSE_BACKDROP_BUTTON_ID);
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
        >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
    return button;
}

const createBackdropView = (options: BackdropOptions) => {
    // Add styles needed for the backdrop;
    appendBackdropStyles();
    // Create DOM nodes
    const backdrop = createBackdropDOM();
    backdrop.innerText = options.label || '';
    const closeButton = createCloseButtonDOM();

    // Add click handlers
    backdrop.onclick = wrapPreventDefault(options.focus);
    closeButton.onclick = wrapPreventDefault(options.close);

    // Append to document
    backdrop.appendChild(closeButton);
    document.body.appendChild(backdrop);
    return backdrop;
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
    } catch (e) {
        // Ignore errors when closing backdrop. If it fails we should not stop
        // the rest of the application from working.
        console.error(e);
    }
}
