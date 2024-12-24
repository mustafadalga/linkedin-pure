import { useEffect, useState } from 'react';
import InputSwitch from './components/InputSwitch.tsx';

function App() {
    const [enableCleanFeed, setIsCleanFeedEnabled] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    useEffect(() => {
        chrome.storage.local.get('enableCleanFeed', (data) => {
            if (typeof data.enableCleanFeed !== 'undefined') {
                setIsCleanFeedEnabled(data.enableCleanFeed);
            }

            setIsInitialized(true);
        });

    }, []);

    useEffect(() => {
        chrome.storage.local.set({ enableCleanFeed }, () => {
            console.log('State saved to storage:', enableCleanFeed);
        });
    }, [ enableCleanFeed ]);

    if (!isInitialized) return null;

    return (
        <article className="grid place-content-end gap-5 p-5 border w-[260px]">
            <InputSwitch
                id="clean-feed"
                name="option"
                checked={enableCleanFeed}
                labelText="Enable Clean Linkedin Feed"
                onChange={(value) => setIsCleanFeedEnabled(value)}
            />
        </article>
    );
}

export default App;