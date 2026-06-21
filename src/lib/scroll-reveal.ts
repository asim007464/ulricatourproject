const EXCLUDED_ANCESTOR =
  ".elementor-location-header, .elementor-location-footer, .joinchat";

const HERO_CARD_SELECTOR =
  ".elementor-element-90f95b7, .elementor-element-741101e";

const REVEAL_SELECTOR = [
  "#ronicas-site .elementor-widget-image",
  "#ronicas-site .e-loop-item",
  "#ronicas-site .elementor-invisible",
  "#ronicas-site .elementor-widget-video",
  "#ronicas-site .jkit-icon-box",
].join(", ");

type RevealVariant = "up" | "left" | "right" | "zoom";

function isExcluded(element: Element): boolean {
  return Boolean(element.closest(EXCLUDED_ANCESTOR));
}

function getVariantFromSettings(element: Element): RevealVariant {
  const raw = element.getAttribute("data-settings");
  if (!raw) return "up";

  try {
    const settings = JSON.parse(raw.replace(/&quot;/g, '"')) as Record<
      string,
      unknown
    >;
    const animation = String(settings._animation || settings.animation || "");

    if (animation.includes("Left")) return "left";
    if (animation.includes("Right")) return "right";
    if (animation.includes("zoom") || animation.includes("Zoom")) return "zoom";
  } catch {
    // Ignore malformed Elementor JSON.
  }

  return "up";
}

function getDelayMs(element: Element): number {
  const raw = element.getAttribute("data-settings");
  if (raw) {
    try {
      const settings = JSON.parse(raw.replace(/&quot;/g, '"')) as Record<
        string,
        unknown
      >;
      const delay = Number(settings.animation_delay || settings._animation_delay);
      if (!Number.isNaN(delay) && delay > 0) return Math.round(delay * 0.35);
    } catch {
      // Ignore malformed Elementor JSON.
    }
  }

  if (element.classList.contains("e-loop-item") && element.parentElement) {
    const index = Array.from(element.parentElement.children).indexOf(element);
    return (index % 3) * 40;
  }

  return 0;
}

function applyRevealClasses(element: Element): void {
  if (element.classList.contains("ronicas-reveal")) return;

  const variant = element.classList.contains("elementor-invisible")
    ? getVariantFromSettings(element)
    : element.classList.contains("elementor-widget-image")
      ? "zoom"
      : "up";

  element.classList.remove("elementor-invisible");
  element.classList.add("ronicas-reveal", `ronicas-reveal--${variant}`);

  const delay = getDelayMs(element);
  if (delay > 0) {
    (element as HTMLElement).style.transitionDelay = `${delay}ms`;
  }
}

export function initScrollReveal(): () => void {
  const root = document.getElementById("ronicas-site");
  if (!root) return () => {};

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const candidates = Array.from(root.querySelectorAll(REVEAL_SELECTOR)).filter(
    (element) =>
      !isExcluded(element) || element.matches(HERO_CARD_SELECTOR)
  );

  candidates.forEach(applyRevealClasses);

  if (prefersReducedMotion) {
    candidates.forEach((element) =>
      element.classList.add("ronicas-reveal--visible")
    );
    return () => {};
  }

  const revealVisible = (element: Element) => {
    element.classList.add("ronicas-reveal--visible");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealVisible(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -6% 0px",
      threshold: 0.1,
    }
  );

  candidates.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      const delay = getDelayMs(element);
      window.setTimeout(() => revealVisible(element), 40 + delay);
      return;
    }
    observer.observe(element);
  });

  return () => observer.disconnect();
}
