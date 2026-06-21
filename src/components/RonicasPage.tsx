"use client";

import { useEffect, useLayoutEffect } from "react";
import { initScrollReveal } from "@/lib/scroll-reveal";
import { initScrollCounters } from "@/lib/scroll-counters";

const HERO_SLIDES = [
  "/wp-content/uploads/2026/02/jamaica-boat-2-scaled.jpg",
  "/wp-content/uploads/2026/02/jamaica-rafting.jpeg",
  "/wp-content/uploads/2026/02/jamaica-waterfall-1-scaled.jpg",
  "/wp-content/uploads/2026/02/montego-bay-boat-ride-scaled.jpg",
  "/wp-content/uploads/2026/02/jamaica-flag-boat.jpeg",
];

type RonicasPageProps = {
  bodyHtml: string;
  bodyClassName: string;
  enableHeroSlideshow?: boolean;
  loadBookingScripts?: boolean;
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function initHeaderMenus() {
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
      if (toggle !== except) closeToggle(toggle);
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

      if (willOpen) updateHeaderOffset();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        onToggle(event);
      }
    };

    toggle.addEventListener("click", onToggle);
    toggle.addEventListener("keydown", onKeyDown);
    cleanups.push(() => toggle.removeEventListener("click", onToggle));
    cleanups.push(() => toggle.removeEventListener("keydown", onKeyDown));

    dropdown.querySelectorAll("a").forEach((link) => {
      const onLinkClick = () => closeToggle(toggle);
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
    });
  };

  document.addEventListener("click", onDocumentClick);
  cleanups.push(() => document.removeEventListener("click", onDocumentClick));
  cleanups.push(() =>
    window.removeEventListener("resize", updateHeaderOffset)
  );

  return () => cleanups.forEach((cleanup) => cleanup());
}

export default function RonicasPage({
  bodyHtml,
  bodyClassName,
  enableHeroSlideshow = false,
  loadBookingScripts = false,
}: RonicasPageProps) {
  useEffect(() => {
    document.body.className = bodyClassName;
  }, [bodyClassName]);

  useEffect(() => {
    document
      .querySelectorAll(".e-con.e-parent:not(.e-lazyloaded)")
      .forEach((el) => el.classList.add("e-lazyloaded"));
  }, [bodyHtml]);

  useLayoutEffect(() => {
    const cleanupReveal = initScrollReveal();
    const cleanupCounters = initScrollCounters();
    return () => {
      cleanupReveal();
      cleanupCounters();
    };
  }, [bodyHtml]);

  useEffect(() => {
    if (!enableHeroSlideshow) return;

    const hero = document.querySelector(".elementor-element-d098ac4");
    if (hero && !hero.querySelector(".elementor-background-slideshow")) {
      const slideshow = document.createElement("div");
      slideshow.className = "elementor-background-slideshow";
      HERO_SLIDES.forEach((src, index) => {
        const slide = document.createElement("div");
        slide.className = "elementor-background-slideshow__slide";
        if (index === 0) {
          slide.classList.add("elementor-background-slideshow__slide--active");
        }

        const image = document.createElement("div");
        image.className = "elementor-background-slideshow__slide__image";
        image.style.backgroundImage = `url("${src}")`;
        slide.appendChild(image);
        slideshow.appendChild(slide);
      });
      hero.prepend(slideshow);

      let current = 0;
      const slides = slideshow.querySelectorAll(
        ".elementor-background-slideshow__slide"
      );
      const interval = window.setInterval(() => {
        slides[current]?.classList.remove(
          "elementor-background-slideshow__slide--active"
        );
        current = (current + 1) % slides.length;
        slides[current]?.classList.add(
          "elementor-background-slideshow__slide--active"
        );
      }, 5000);

      return () => window.clearInterval(interval);
    }
  }, [enableHeroSlideshow]);

  useEffect(() => {
    document.querySelectorAll(".qodef-qi--has-appear").forEach((el) => {
      el.classList.add("qodef-qi--appeared");
    });

    const cleanupHeaderMenus = initHeaderMenus();

    document
      .querySelectorAll(
        "#ronicas-site .elementor-location-footer a.elementor-social-icon[href]"
      )
      .forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("target", "_blank");
      });

    return () => {
      cleanupHeaderMenus();
    };
  }, [bodyHtml]);

  useEffect(() => {
    if (!loadBookingScripts) return;

    let cancelled = false;

    const initBooking = async () => {
      try {
        await loadScript("/wp-includes/js/jquery/jquery.min.js");
        await loadScript("/wp-includes/js/jquery/jquery-migrate.min.js");
        await loadScript(
          "/wp-content/plugins/elementor/assets/lib/flatpickr/flatpickr.min.js"
        );

        if (!document.getElementById("enix-booking-data")) {
          const config = document.createElement("script");
          config.id = "enix-booking-data";
          config.textContent =
            'window.enixBookingData = {"ajax_url":"#","nonce":"","i18n":{"booking_success":"Booking successful!","booking_failed":"Could not process booking. Please try again."}};';
          document.body.appendChild(config);
        }

        await loadScript(
          "/wp-content/plugins/enix-booking-rental-woocommerce/public/js/enix-booking-form.js"
        );
        await loadScript(
          "/wp-content/plugins/enix-booking-rental-woocommerce/public/js/enix-calendar.js"
        );
      } catch (error) {
        if (!cancelled) {
          console.warn("Booking scripts failed to load", error);
        }
      }
    };

    void initBooking();

    return () => {
      cancelled = true;
    };
  }, [loadBookingScripts, bodyHtml]);

  return (
    <div id="ronicas-site" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  );
}
