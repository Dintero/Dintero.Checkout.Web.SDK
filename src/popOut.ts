import { getPopOutUrl, SessionUrlOptions } from "./url";

const WIDTH = Math.min(480, window.screen.width);
const HEIGHT = Math.min(840, window.screen.height);
let popOutWindow: undefined | Window;

const createPopOutWindow = (url: string, width: number, height: number) => {
    return new Promise<Window| undefined>((resolve)=> {
        try {
            // Opens a centered pop up window
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            const features = `width=${width},height=${height},left=${left},top=${top},location=no,menubar=no,toolbar=no,status=no`;
            const popOut =  window.open(url, 'dintero-checkout', features);
            if(!popOut){
                console.log('createPopOutWindow no popOut');
                resolve(undefined);
                return;
            }
            const timeout = window.setTimeout(()=> {
                console.log('createPopOutWindow timeout');
                resolve(undefined);
            }, 3000);
            popOut.addEventListener('load', (event) => {
                console.log('createPopOutWindow loaded', {popOut, event});
                clearTimeout(timeout);
                resolve(popOut)
            })
        } catch (err) {
            resolve(undefined);
        }
    });

};

type Unsubscribe = () => void;

type PopOutOptions = SessionUrlOptions & {
    onOpen: (popOut: Window) => Unsubscribe;
    onClose: () => void;
}

export const openPopOut = async (options: PopOutOptions) => {
    let unsubscribe: undefined | Unsubscribe;
    let intervalId = -1;
    if (popOutWindow && !popOutWindow.closed) {
        // Skip if already open.
        return;
    }

    // Open popup window
    const url = getPopOutUrl(options);
    popOutWindow = await createPopOutWindow(url, WIDTH, HEIGHT);

    const focusPopOut = () => {
        if (popOutWindow) {
            popOutWindow.focus();
        }
    }

    const cleanUpClosed = () => {
        window.clearInterval(intervalId);
        intervalId = -1;
        window.removeEventListener('beforeunload', closePopOut);
        popOutWindow = undefined;
        options.onClose();
        if (unsubscribe) {
            unsubscribe();
        }
    }

    const closePopOut = () => {
        if (popOutWindow) {
            popOutWindow.close();
        }
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
    intervalId = window.setInterval(checkIfPopupClosed, 200);

    // Set up pub/sub of messages from pop out to SDK
    unsubscribe = options.onOpen(popOutWindow);

    return {
        close: closePopOut,
        focus: focusPopOut,
        popOutWindow,
    };
};
