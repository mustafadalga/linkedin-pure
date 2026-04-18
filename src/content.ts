let enableCleanFeed = false;

// --- Filters ---

const ACTIVITY_PATTERN =
  /\b(likes?\s+this|loves?\s+this|celebrates?\s+this|supports?\s+this|finds?\s+this\s+insightful|finds?\s+this\s+funny|commented\s+on\s+this|reposted\s+this|shared\s+this|follows?)\b/i;

const EXACT_HEADER_LABELS = new Set([
  "Recommended for you",
  "Suggested",
  "Promoted",
]);

// --- DOM helpers ---

/**
 * Returns the header label text for a feed post card.
 * Walks siblings between the <h2> and the first <hr role="presentation">.
 * Uses only stable structural attributes (componentkey on <p>, role on <hr>).
 */
function getHeaderLabel(card: Element): string | null {
  const h2 = card.querySelector("h2");
  if (!h2) return null;

  const wrapper = h2.parentElement;
  if (!wrapper) return null;

  for (const child of Array.from(wrapper.children)) {
    if (child.tagName === "H2") continue;
    if (child.tagName === "HR") break;

    const p = child.querySelector("p[componentkey]");
    const text = p?.textContent?.trim();
    if (text) return text;
  }

  return null;
}

function shouldHide(card: Element): boolean {
  const label = getHeaderLabel(card);
  if (!label) return false;

  if (EXACT_HEADER_LABELS.has(label)) {
    console.log(`[LinkedIn Pure] HIDE (exact): "${label}"`);
    return true;
  }
  if (ACTIVITY_PATTERN.test(label)) {
    console.log(`[LinkedIn Pure] HIDE (activity): "${label}"`);
    return true;
  }
  return false;
}

// --- Core scan ---

function scan(): void {
  if (!enableCleanFeed) return;

  document
    .querySelectorAll<HTMLElement>('[role="listitem"][componentkey*="FeedType_MAIN_FEED"]')
    .forEach((card) => {
      if (card.dataset.lpProcessed === "1") return;
      card.dataset.lpProcessed = "1";

      if (shouldHide(card)) {
        card.style.display = "none";
        console.log(`[LinkedIn Pure] Hidden card`);
      }
    });
}

function restoreAll(): void {
  document
    .querySelectorAll<HTMLElement>('[data-lp-processed]')
    .forEach((card) => {
      card.style.display = "";
      delete card.dataset.lpProcessed;
    });
  console.log("[LinkedIn Pure] All posts restored");
}

// --- Observer (attached synchronously — never misses a DOM mutation) ---

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const observer = new MutationObserver(() => {
  if (!enableCleanFeed) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(scan, 200);
});

// Attach immediately — before any async settings load — so zero posts are missed
observer.observe(document.body, { childList: true, subtree: true });
console.log("[LinkedIn Pure] Observer attached");

// --- Settings ---

chrome.storage.local.get("enableCleanFeed", (data) => {
  enableCleanFeed = data.enableCleanFeed ?? false;
  console.log(`[LinkedIn Pure] Loaded settings — enableCleanFeed=${enableCleanFeed}`);
  if (enableCleanFeed) scan(); // catch anything already in the DOM
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !("enableCleanFeed" in changes)) return;
  enableCleanFeed = changes.enableCleanFeed.newValue ?? false;
  console.log(`[LinkedIn Pure] Setting changed — enableCleanFeed=${enableCleanFeed}`);
  if (enableCleanFeed) {
    scan();
  } else {
    restoreAll();
  }
});
