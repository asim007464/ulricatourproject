export function initHeaderMenus() {
  const header = document.querySelector(".elementor-location-header");
  if (!header) return () => {};

  const updateHeaderOffset = () => {
    const height = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty(
      "--ronicas-header-offset",
      `${Math.ceil(height)}px`
    );
  };

  updateHeaderOffset();
  window.addEventListener("resize", updateHeaderOffset);

  const toggles = header.querySelectorAll<HTMLElement>(".elementor-menu-toggle");
  const cleanups: Array<() => void> = [];

  const setNavOpen = (open: boolean) => {
    document.body.classList.toggle("ronicas-nav-open", open);
  };

  const closeToggle = (toggle: HTMLElement) => {
    const dropdown = toggle.nextElementSibling;
    toggle.classList.remove("elementor-active");
    toggle.setAttribute("aria-expanded", "false");
    if (dropdown?.classList.contains("elementor-nav-menu--dropdown")) {
      dropdown.classList.remove("elementor-nav-menu--dropdown-open");
      dropdown.setAttribute("aria-hidden", "true");
    }
  };

  const closeAll = (except?: HTMLElement) => {
    toggles.forEach((toggle) => {
      if (toggle !== except) {
        closeToggle(toggle);
      }
    });
  };

  toggles.forEach((toggle) => {
    const dropdown = toggle.nextElementSibling;
    if (!dropdown?.classList.contains("elementor-nav-menu--dropdown")) return;

    const onToggle = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      const willOpen = !toggle.classList.contains("elementor-active");
      closeAll(willOpen ? toggle : undefined);

      toggle.classList.toggle("elementor-active", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
      dropdown.classList.toggle("elementor-nav-menu--dropdown-open", willOpen);
      dropdown.setAttribute("aria-hidden", String(!willOpen));
      setNavOpen(willOpen);

      if (willOpen) updateHeaderOffset();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        onToggle(event);
      }
      if (event.key === "Escape") {
        closeAll();
        setNavOpen(false);
      }
    };

    toggle.addEventListener("click", onToggle);
    toggle.addEventListener("keydown", onKeyDown);
    cleanups.push(() => toggle.removeEventListener("click", onToggle));
    cleanups.push(() => toggle.removeEventListener("keydown", onKeyDown));

    dropdown.querySelectorAll("a").forEach((link) => {
      const onLinkClick = () => {
        closeToggle(toggle);
        setNavOpen(false);
      };
      link.addEventListener("click", onLinkClick);
      cleanups.push(() => link.removeEventListener("click", onLinkClick));
    });
  });

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target as Node;
    toggles.forEach((toggle) => {
      if (!toggle.classList.contains("elementor-active")) return;
      const dropdown = toggle.nextElementSibling;
      if (toggle.contains(target) || dropdown?.contains(target)) return;
      closeToggle(toggle);
      setNavOpen(false);
    });
  };

  const onEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    closeAll();
    setNavOpen(false);
  };

  const onResize = () => {
    if (window.innerWidth >= 1025) {
      closeAll();
      setNavOpen(false);
    }
    updateHeaderOffset();
  };

  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onEscape);
  window.addEventListener("resize", onResize);
  cleanups.push(() => document.removeEventListener("click", onDocumentClick));
  cleanups.push(() => document.removeEventListener("keydown", onEscape));
  cleanups.push(() => window.removeEventListener("resize", onResize));
  cleanups.push(() => window.removeEventListener("resize", updateHeaderOffset));
  cleanups.push(() => {
    document.body.classList.remove("ronicas-nav-open");
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}
