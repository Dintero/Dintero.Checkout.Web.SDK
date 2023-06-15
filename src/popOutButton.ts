const OPEN_POP_OUT_BUTTON_ID = "dintero-checkout-sdk-launch-pop-out";

type PopOutButtonOptions = {
    container: HTMLElement;
    label: string;
    disabled: string;
    top: string;
    left: string;
    right: string;
    styles: { [key: string]: string }
    onClick: () => void;
}


const configureButton = (button: HTMLElement, { label, disabled, top, left, right, styles, onClick }: PopOutButtonOptions) => {
    button.setAttribute('id', OPEN_POP_OUT_BUTTON_ID);

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

export const addPopOutButton = (options: PopOutButtonOptions) => {
    // Will add or update existing button
    const { container } = options;
    const exists = document.getElementById(OPEN_POP_OUT_BUTTON_ID);
    const button = exists || document.createElement('button');
    configureButton(button, options);
    if (!exists) {
        container.appendChild(button);
    }
}


export const setPopOutButtonDisabled = (disabled: boolean) => {
    try {
        const button = document.getElementById(OPEN_POP_OUT_BUTTON_ID);
        if (button) {
            if (disabled) {
                button.setAttribute('disabled', disabled.toString())
            } else {
                button.removeAttribute('disabled');
            }
        }
    } catch (e) {
        // Ignore error and continue
        console.error(e);
    }
}

export const removePopOutButton = () => {
    try {
        const button = document.getElementById(OPEN_POP_OUT_BUTTON_ID);
        if (button) {
            button.remove();
        }
    } catch (e) {
        // Ignore error and continue
        console.error(e);
    }
}
