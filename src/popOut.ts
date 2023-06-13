import { getPopOutUrl, SessionUrlOptions } from "./url";

const WIDTH = Math.min(480, window.screen.width);
const HEIGHT = Math.min(800, window.screen.height);
export const OPEN_POP_OUT_BUTTON_ID = "dintero-checkout-sdk-launch-pop-out";
let popOutWindow: undefined | Window;

const createPopOutWindow = (url: string, width: number, height: number) => {
    // Opens a centered pop up window
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},location=no,menubar=no,toolbar=no,status=no`;
    return window.open(url, 'dintero-checkout', features);
};

type PopOutOptions = SessionUrlOptions & {
    onOpen: (popOut: Window) => void;
    onClose: () => void;
}

export const openPopOut = (options: PopOutOptions) => {
    let intervalId = -1;
    if (popOutWindow && !popOutWindow.closed) {
        // Skip if already open.
        return;
    }

    // Open popup window
    const url = getPopOutUrl(options);
    popOutWindow = createPopOutWindow(url, WIDTH, HEIGHT);

    const focusPopOut = () => {
        popOutWindow.focus();
    }

    const cleanUpClosed = () => {
        window.clearInterval(intervalId);
        intervalId = -1;
        window.removeEventListener('beforeunload', closePopOut);
        popOutWindow = undefined;
        options.onClose();
    }

    const closePopOut = () => {
        popOutWindow.close();
        cleanUpClosed();
    }

    const checkIfPopupClosed = () => {
        if (popOutWindow && popOutWindow.closed) {
            cleanUpClosed();
        }
    }

    // Close pop out if current window is closed
    window.addEventListener('beforeunload', closePopOut);

    // Check if checkout is still open
    intervalId = window.setInterval(checkIfPopupClosed, 50);

    // Tell embedded checkout that the pop out is opened
    options.onOpen(popOutWindow);

    return {
        close: closePopOut,
        focus: focusPopOut
    };
};

type PopOutButtonOptions = {
    container: HTMLElement;
    id: string;
    label: string;
    disabled: string;
    top: string;
    left: string;
    right: string;
    styles: { [key: string]: string }
    onClick: () => void;
}


const configureButton = (button: HTMLElement, { id, label, disabled, top, left, right, styles, onClick }: PopOutButtonOptions) => {
    button.setAttribute('id', id);

    // Is clickable
    if (disabled === 'true') {
        button.setAttribute('disabled', disabled);
    } else {
        button.removeAttribute('disabled')
    }

    // Click handler
    button.onclick = () => {
        button.style.boxShadow = 'inset 0 0 10px rgba(34, 84, 65, 0.9)';
        onClick();
        window.setTimeout(() => {
            button.style.boxShadow = 'none';
        }, 200);
    }

    // Label
    button.innerText = label;

    // Position
    button.style.position = 'absolute';
    button.style.top = top;
    button.style.left = left;
    button.style.right = right;

    // Appearance from checkout
    for (const [key, value] of Object.entries(styles)) {
        button.style[key] = value;
    }

}

export const addButton = (options: PopOutButtonOptions) => {
    // Will add or update existing button
    const { container, id } = options;
    const exists = document.getElementById(id);
    const button = exists || document.createElement('button');
    configureButton(button, options);
    if (!exists) {
        container.appendChild(button);
    }
}

export const removeButton = (id: string) => {
    try {
        const button = document.getElementById(id);
        if (button) {
            button.remove();
        }
    } catch (e) {
        // Ignore error and continue
        console.error(e);
    }
}
