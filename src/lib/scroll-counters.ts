function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function formatCounterValue(value: number, delimiter: string): string {
  const formatted = Math.round(value).toLocaleString("en-US");
  return delimiter === "," ? formatted : formatted.replace(/,/g, delimiter);
}

function animateCounter(counter: HTMLElement): void {
  if (counter.dataset.ronicasAnimated === "true") return;
  counter.dataset.ronicasAnimated = "true";

  const to = Number(counter.getAttribute("data-to-value") || 0);
  const from = Number(counter.getAttribute("data-from-value") || 0);
  const rawDuration = Number(counter.getAttribute("data-duration") || 2000);
  const duration = Math.max(700, Math.round(rawDuration * 0.4));
  const delimiter = counter.getAttribute("data-delimiter") || ",";

  counter.textContent = formatCounterValue(from, delimiter);

  const start = performance.now();

  const tick = (now: number) => {
    const progress = easeOutCubic(Math.min((now - start) / duration, 1));
    const value = from + (to - from) * progress;
    counter.textContent = formatCounterValue(value, delimiter);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    counter.textContent = formatCounterValue(to, delimiter);
  };

  requestAnimationFrame(tick);
}

export function initScrollCounters(): () => void {
  const root = document.getElementById("ronicas-site");
  if (!root) return () => {};

  const counters = Array.from(
    root.querySelectorAll<HTMLElement>(".elementor-counter-number")
  );

  if (counters.length === 0) return () => {};

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    counters.forEach((counter) => {
      const to = Number(counter.getAttribute("data-to-value") || 0);
      const delimiter = counter.getAttribute("data-delimiter") || ",";
      counter.textContent = formatCounterValue(to, delimiter);
      counter.dataset.ronicasAnimated = "true";
    });
    return () => {};
  }

  counters.forEach((counter) => {
    counter.textContent = formatCounterValue(
      Number(counter.getAttribute("data-from-value") || 0),
      counter.getAttribute("data-delimiter") || ","
    );
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.35,
    }
  );

  counters.forEach((counter) => observer.observe(counter));

  return () => observer.disconnect();
}
