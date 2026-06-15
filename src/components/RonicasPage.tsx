"use client";

import { useEffect } from "react";

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

    document.querySelectorAll(".elementor-invisible").forEach((el) => {
      el.classList.remove("elementor-invisible");
      el.classList.add("elementor-animation-fadeInRight");
    });

    document.querySelectorAll(".elementor-menu-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        const dropdown = toggle.nextElementSibling;
        if (dropdown) {
          dropdown.setAttribute("aria-hidden", expanded ? "true" : "false");
          dropdown.classList.toggle(
            "elementor-nav-menu--dropdown-open",
            !expanded
          );
        }
      });
    });

    document.querySelectorAll(".elementor-counter-number").forEach((counter) => {
      const target = Number(counter.getAttribute("data-to-value") || 0);
      const duration = Number(counter.getAttribute("data-duration") || 2000);
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.floor(target * progress);
        counter.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
        else counter.textContent = target.toLocaleString();
      };

      requestAnimationFrame(tick);
    });

    const joinchat = document.querySelector(".joinchat");
    const joinchatButton = document.querySelector(".joinchat__button");
    const joinchatClose = document.querySelector(".joinchat__close");
    const joinchatOpen = document.querySelector(".joinchat__open");

    joinchatButton?.addEventListener("click", () => {
      joinchat?.classList.add("joinchat--chatbox");
    });
    joinchatClose?.addEventListener("click", () => {
      joinchat?.classList.remove("joinchat--chatbox");
    });
    joinchatOpen?.addEventListener("click", () => {
      window.open("https://wa.me/18762958113", "_blank");
    });
  }, []);

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
