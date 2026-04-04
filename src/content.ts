let enableCleanFeed: boolean = false;
let observerActive: boolean = false;

const observer = new MutationObserver(() => {
  removeSocialAndPromotedPosts();
});

const ACTIVITY_PATTERN =
  /\b(likes? this|loves? this|celebrates? this|supports? this|finds? this insightful|finds? this funny|commented on this|reposted this|repost this|shared this|follows?)\b/i;

const EXACT_HEADER_LABELS = ["Recommended for you", "Suggested", "Promoted"];

function getInnerWrapper(card: Element): Element | null {
  const h2 = card.querySelector("h2");
  if (!h2) return null;
  return h2.parentElement;
}

function getSocialActivityText(card: Element): string | null {
  const wrapper = getInnerWrapper(card);
  if (!wrapper) {
    console.log(`[LinkedIn Pure]   ↳ No inner wrapper (h2 not found)`);
    return null;
  }

  const avatarStack = wrapper.querySelector("div._2f50fdd4");
  if (!avatarStack) return null;

  const activityP = avatarStack.querySelector("p[componentkey]");
  if (!activityP) return null;

  const text = activityP.textContent?.trim() ?? "";
  if (text.length > 0) {
    console.log(`[LinkedIn Pure]   ↳ Activity text: "${text}"`);
  }
  return text || null;
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

    const activityText = getSocialActivityText(card);
    if (activityText !== null) {
      if (
        ACTIVITY_PATTERN.test(activityText) ||
        EXACT_HEADER_LABELS.includes(activityText)
      ) {
        card.style.display = "none";
        card.dataset.lpHidden = "true";
        console.log(`[LinkedIn Pure]   ✕ HIDDEN ("${activityText}")`);
        return;
      }
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
