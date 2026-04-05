let enableCleanFeed: boolean = false;
let observerActive: boolean = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const observer = new MutationObserver(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(removeSocialAndPromotedPosts, 250);
});

// Matches activity labels like ".... likes this", "commented on this", etc.
const ACTIVITY_PATTERN =
  /\b(likes?\s+this|loves?\s+this|celebrates?\s+this|supports?\s+this|finds?\s+this\s+insightful|finds?\s+this\s+funny|commented\s+on\s+this|reposted\s+this|repost\s+this|shared\s+this|follows?)\b/i;

// Exact labels for non-connection posts
const EXACT_HEADER_LABELS = new Set([
  "Recommended for you",
  "Suggested",
  "Promoted",
]);

/**
 * Extracts the header label from a feed post card WITHOUT relying on any
 * dynamic CSS class names.
 *
 * Strategy (uses only stable HTML attributes):
 *  1. Find the <h2> inside the card — always present in feed posts.
 *  2. Walk the direct children of h2.parentElement.
 *  3. Stop walking at the first <hr role="presentation"> (the separator
 *     between the header section and the actual post content).
 *  4. In each child before the <hr>, grab the first <p componentkey> and
 *     return its text.
 *
 * For activity posts  → text is e.g. "Ali İmran Bali likes this"
 * For Suggested posts → text is "Suggested"
 * For Recommended    → text is "Recommended for you"
 * For normal posts   → text is the author's name (won't match patterns)
 */
function getHeaderLabel(card: Element): string | null {
  const h2 = card.querySelector("h2");
  if (!h2) return null;

  const wrapper = h2.parentElement;
  if (!wrapper) return null;

  for (const child of Array.from(wrapper.children)) {
    if (child === h2 || child.tagName === "H2") continue;
    if (child.tagName === "HR") break; // stop at the post-body separator

    const p = child.querySelector("p[componentkey]");
    if (!p) continue;

    const text = p.textContent?.trim() ?? "";
    if (text) {
      console.log(`[LinkedIn Pure]   ↳ Header label: "${text}"`);
      return text;
    }
  }

  return null;
}

function shouldHideCard(card: Element): boolean {
  const label = getHeaderLabel(card);
  if (label === null) return false;

  if (EXACT_HEADER_LABELS.has(label)) {
    console.log(`[LinkedIn Pure]   ↳ Exact label match → HIDE`);
    return true;
  }
  if (ACTIVITY_PATTERN.test(label)) {
    console.log(`[LinkedIn Pure]   ↳ Activity pattern match → HIDE`);
    return true;
  }
  return false;
}

function removeSocialAndPromotedPosts(): void {
  const cards = document.querySelectorAll<HTMLElement>('[role="listitem"]');
  console.log(`[LinkedIn Pure] Scanning ${cards.length} listitem(s)...`);

  cards.forEach((card, index) => {
    if (card.dataset.lpHidden === "true") return;

    const componentKey = card.getAttribute("componentkey") ?? "";
    if (!componentKey.includes("FeedType_MAIN_FEED")) return;

    console.log(
      `[LinkedIn Pure] Card #${index} key="${componentKey.slice(0, 60)}..."`,
    );

    if (shouldHideCard(card)) {
      card.style.display = "none";
      card.dataset.lpHidden = "true";
      console.log(`[LinkedIn Pure]   ✕ HIDDEN`);
    } else {
      console.log(`[LinkedIn Pure]   ✓ KEPT`);
    }
  });
}

function loadSettings(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get("enableCleanFeed", (data) => {
      resolve(data.enableCleanFeed || false);
    });
  });
}

function enableObserver(): void {
  if (observerActive) return;
  observerActive = true;
  observer.observe(document.body, { childList: true, subtree: true });
  removeSocialAndPromotedPosts();
  console.log("[LinkedIn Pure] Observer enabled");
}

function disableObserver(): void {
  if (!observerActive) return;
  observerActive = false;
  observer.disconnect();
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  document
    .querySelectorAll<HTMLElement>('[data-lp-hidden="true"]')
    .forEach((card) => {
      card.style.display = "";
      delete card.dataset.lpHidden;
    });
  console.log("[LinkedIn Pure] Observer disabled — all posts restored");
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enableCleanFeed) {
    enableCleanFeed = changes.enableCleanFeed.newValue ?? false;
    if (enableCleanFeed) {
      enableObserver();
    } else {
      disableObserver();
    }
  }
});

async function init(): Promise<void> {
  try {
    enableCleanFeed = await loadSettings();
    console.log(`[LinkedIn Pure] Init — enableCleanFeed=${enableCleanFeed}`);
    if (enableCleanFeed) enableObserver();
  } catch (error) {
    console.error("[LinkedIn Pure] Init error:", error);
  }
}

init();
