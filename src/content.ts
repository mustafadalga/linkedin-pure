type StorageChange = {
    newValue?: boolean;
    oldValue?: boolean;
};

let enableCleanFeed: boolean = false;

const observer = new MutationObserver(removeContainersBasedOnHeader);

// Utility to load settings from Chrome storage
function loadSettings(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get('enableCleanFeed', (data) => {
            resolve(data.enableCleanFeed || false);
        });
    });
}


// Listen for storage changes to apply updates dynamically
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.enableCleanFeed) {
        enableCleanFeed = changes.enableCleanFeed.newValue;

        if (enableCleanFeed) {
            enableObserver();
        } else {
            disableObserver();
        }
    }
});

// Utility to listen for changes in Chrome storage
function listenForStorageChanges(): void {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.enableCleanFeed) {
            const change: StorageChange = changes.enableCleanFeed;
            updateObserver(change.newValue || false);
        }
    });
}


// Update observer based on the value of `enableCleanFeed`
function updateObserver(shouldRemoveSuggested: boolean): void {
    enableCleanFeed = shouldRemoveSuggested;
    if (enableCleanFeed) {
        enableObserver();
    } else {
        disableObserver();
    }
}


// Enable the MutationObserver
function enableObserver(): void {
    if (!observerIsActive()) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        removeContainersBasedOnHeader();
        console.log('Observer enabled');
    }
}

// Disable the MutationObserver
function disableObserver(): void {
    observer.disconnect();
    console.log('Observer disabled');
}

// Check if the observer is already active
function observerIsActive(): boolean {
    return observer.takeRecords().length > 0; // Checks if there are pending mutation records
}


// Logic to remove elements
async function removeContainersBasedOnHeader(): Promise<void> {
    const impressionContainers: NodeListOf<HTMLElement> = document.querySelectorAll('.fie-impression-container');

    impressionContainers.forEach((container) => {
        // Check if the container has the target header element
        const headerTextView = container.querySelector('.update-components-header__text-view');
        if (headerTextView) {
            const parentElement = container.closest('[data-view-name="feed-full-update"]');
            if (parentElement) {
                parentElement.remove(); // Remove the parent element
                console.log('Removed parent container with class [data-view-name="feed-full-update"]".');
            }
        }
    });
}

// Main function to initialize the script
async function init(): Promise<void> {
    try {
        enableCleanFeed = await loadSettings();
        if (enableCleanFeed) {
            enableObserver();
        }
        listenForStorageChanges();
    } catch (error) {
        console.error('Error initializing the script:', error);
    }
}

// Run the script
init();