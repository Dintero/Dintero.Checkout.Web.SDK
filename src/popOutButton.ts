export const OPEN_POP_OUT_BUTTON_ID = "dintero-checkout-sdk-launch-pop-out";

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


export const setButtonDisabled = (id: string, disabled: boolean) => {
    try {
        const button = document.getElementById(id);
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
