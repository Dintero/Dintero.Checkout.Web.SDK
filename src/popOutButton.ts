const OPEN_POP_OUT_BUTTON_ID = "dintero-checkout-sdk-launch-pop-out";

type PopOutButtonOptions = {
    container: HTMLElement;
    label: string;
    disabled: string;
    top: string;
    left: string;
    right: string;
    styles: {
        [key: string]: string
    };
    stylesHover?: { [key: string]: string };
    stylesFocusVisible?: { [key: string]: string };
    onClick: () => void;
};

const configureButton = (
    button: HTMLElement,
    { label, disabled, top, left, right, styles, onClick, stylesHover, stylesFocusVisible}: PopOutButtonOptions,
) => {
    button.setAttribute("id", OPEN_POP_OUT_BUTTON_ID);
    button.setAttribute("type", "button");

    // Is clickable
    if (disabled === "true") {
        button.setAttribute("disabled", disabled);
    } else {
        button.removeAttribute("disabled");
    }

    // Click handler
    button.onclick = (event) => {
        // Do not submit any form on the page using the SDK
        event.preventDefault();
        event.stopPropagation();

        // Update look
        button.style.boxShadow = "inset 0 0 10px rgba(34, 84, 65, 0.9)";

        // Invoke handler
        onClick();

        // Reset look
        window.setTimeout(() => {
            button.style.boxShadow = "none";
        }, 200);
    };

    // Label
    button.innerText = label;

    // Position
    button.style.position = "absolute";
    button.style.top = top + "px";
    button.style.left = left + "px";
    button.style.right = right + "px";

    // Appearance from checkout
    const {
        ...directStyles
    } = styles;

    for (const [key, value] of Object.entries(directStyles)) {
        button.style[key] = value;
    }

    // Add hover and focus-visible styles
    try{
        addHoverAndFocusVisibleStyles(stylesHover, stylesFocusVisible);
    } catch (e) {
        console.error(e);
    }
};

const addHoverAndFocusVisibleStyles = (stylesHover?: { [key: string]: string }, stylesFocusVisible?: { [key: string]: string })=>{
    if(!stylesHover && !stylesFocusVisible){
        return;
    }
    const styleId = `${OPEN_POP_OUT_BUTTON_ID}-styles`;
    const hasStyles = document.getElementById(styleId);
    if(hasStyles ){
        return;
    }
    const style = document.createElement('style');
    style.setAttribute('id', styleId);
    let content = []
    if(stylesHover){
        content.push(
            toCssEntity(
                `#${OPEN_POP_OUT_BUTTON_ID}:hover:not(:disabled)`,
                stylesHover
            )
        );
    }
    if(stylesFocusVisible){
        content.push(
            toCssEntity(
                `#${OPEN_POP_OUT_BUTTON_ID}:focus-visible`,
                stylesFocusVisible
            )
        );
    }
    style.textContent = content.join('\n');
    document.head.appendChild(style);
}

const toCssEntity = (selector:string, keyValues: { [key: string]: string }) =>{
    return [
        `${selector} {`,
        toCssParameters(keyValues),
        `}`
    ].join('\n')
}

const toCssParameters = (keyValues: { [key: string]: string })=>{
    return Object.entries(keyValues)
        .map(([key, value])=>`    ${slugify(key)}: ${value} !important;`)
        .join('\n');
}

const slugify = (str:string) => {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export const addPopOutButton = (options: PopOutButtonOptions) => {
    // Will add or update existing button
    const { container } = options;
    const exists = document.getElementById(OPEN_POP_OUT_BUTTON_ID);
    const button = exists || document.createElement("button");
    configureButton(button, options);
    if (!exists) {
        container.appendChild(button);
    }
};

export const setPopOutButtonDisabled = (disabled: boolean) => {
    try {
        const button = document.getElementById(OPEN_POP_OUT_BUTTON_ID);
        if (button) {
            if (disabled) {
                button.setAttribute("disabled", disabled.toString());
            } else {
                button.removeAttribute("disabled");
            }
        }
    } catch (e) {
        // Ignore error and continue
        console.error(e);
    }
};

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
};
