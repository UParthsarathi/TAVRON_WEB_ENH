"use client";

import { useEffect } from "react";

// The site's behaviour, ported from assets/js/tavron-modern.js, the mobile-nav part of
// assets/js/main.js and assets/vendor/php-email-form/validate.js, without jQuery.
// Pages are server components and never re-render, so this attaches to the server-rendered
// markup after hydration and leaves exactly the classes and inline styles the old scripts left:
// the visual harness compares them in every state. [data-count] counters were not ported, because
// no page uses them.
let started = false; // once per page load, also under React's dev double-effects

export function Behaviour() {
  useEffect(() => {
    if (started) return;
    started = true;
    initReveal();
    initHero();
    initViewer();
    initLightbox();
    initMarquee();
    initHeader();
    initMobileNav();
    initContactForm();
  }, []);
  return null;
}

// ---------------------------------------------------------------- jQuery's show/hide animations

// The old pages loaded jquery.easing, which turns jQuery's default "swing" into easeOutQuad.
const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"; // easeOutQuad
const SLIDE = ["height", "paddingTop", "paddingBottom", "marginTop", "marginBottom"]; // slideDown/Up
const SHOW = [...SLIDE, "width", "paddingLeft", "paddingRight", "marginLeft", "marginRight", "opacity"]; // .show(ms)
const FADE = ["opacity"];

const isHidden = (el: HTMLElement) => getComputedStyle(el).display === "none";

// Like jQuery: animate the properties from/to 0 and leave only `display` inline when done. Elements
// already in the target state are skipped. Every element animated here is a block (div, ul).
function animate(el: HTMLElement, props: string[], ms: number, show: boolean) {
  if (isHidden(el) !== show) return;
  if (el.getAnimations().length) return; // ponytail: a click mid-animation is ignored; jQuery queued it
  if (show) el.style.display = "block";
  const cs = getComputedStyle(el) as unknown as Record<string, string>;
  const full: Keyframe = {};
  const zero: Keyframe = {};
  for (const p of props) {
    full[p] = cs[p];
    zero[p] = p === "opacity" ? "0" : "0px";
  }
  if (props.includes("height")) full.overflow = zero.overflow = "hidden";
  const a = el.animate(show ? [zero, full] : [full, zero], { duration: ms, easing: EASE, fill: show ? "none" : "forwards" });
  if (!show)
    a.onfinish = () => {
      el.style.display = "none";
      a.cancel();
    };
}

// ---------------------------------------------------------------- tavron-modern.js

function initReveal() {
  const items = document.querySelectorAll(".tv-reveal");
  if (!items.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );
  items.forEach((el) => io.observe(el));
}

function initHero() {
  const slides = document.querySelectorAll(".tv-hero__slide");
  if (slides.length < 2) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove("is-active");
    i = (i + 1) % slides.length;
    slides[i].classList.add("is-active");
  }, 6000);
}

function initViewer() {
  const viewer = document.querySelector("[data-viewer]");
  const stage = viewer?.querySelector<HTMLImageElement>("[data-viewer-stage]");
  const buttons = viewer?.querySelectorAll("[data-viewer-thumb]") ?? [];
  if (!stage || !buttons.length) return;
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");
      stage.style.opacity = "0";
      setTimeout(() => {
        stage.src = btn.getAttribute("data-src")!;
        stage.alt = btn.getAttribute("data-alt") || "";
        stage.style.opacity = "1";
      }, 180);
    }),
  );
}

function initLightbox() {
  const triggers = document.querySelectorAll<HTMLElement>("[data-lightbox]");
  if (!triggers.length) return;
  const box = document.createElement("div");
  box.className = "tv-lightbox";
  box.innerHTML = '<button class="tv-lightbox__close" aria-label="Close">&times;</button><img alt="">';
  document.body.appendChild(box);
  const img = box.querySelector("img")!;
  const close = () => {
    box.classList.remove("is-open");
    document.body.style.overflow = "";
  };
  triggers.forEach((t) => {
    t.style.cursor = "zoom-in";
    t.addEventListener("click", (e) => {
      e.preventDefault();
      img.src = t.getAttribute("data-lightbox") || t.getAttribute("src")!;
      img.alt = t.getAttribute("alt") || t.getAttribute("aria-label") || "";
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });
  box.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t === box || t.classList.contains("tv-lightbox__close")) close();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && close());
}

function initMarquee() {
  const track = document.querySelector<HTMLElement>(".tv-marquee__track");
  if (!track || track.dataset.cloned === "true") return;
  track.innerHTML += track.innerHTML; // a second copy makes the CSS loop seamless
  track.dataset.cloned = "true";
}

function initHeader() {
  const header = document.getElementById("header"); // the outer one, as before
  if (!header) return;
  const onScroll = () => header.classList.toggle("tv-header--solid", window.scrollY > 60);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ---------------------------------------------------------------- main.js: mobile navigation

function initMobileNav() {
  const body = document.body;
  const overlay = document.querySelector<HTMLElement>(".mobile-nav-overly")!;
  const flipIcon = () => {
    const i = document.querySelector(".mobile-nav-toggle i")!;
    i.classList.toggle("icofont-navigation-menu");
    i.classList.toggle("icofont-close");
  };
  // One listener, in the order jQuery ran its three: toggle, submenu, click outside.
  document.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t.closest(".mobile-nav-toggle")) {
      body.classList.toggle("mobile-nav-active");
      flipIcon();
      overlay.style.display = isHidden(overlay) ? "block" : "none"; // jQuery .toggle()
    }
    const a = t.closest(".mobile-nav .drop-down > a");
    if (a) {
      e.preventDefault();
      const sub = a.nextElementSibling as HTMLElement | null;
      if (sub) animate(sub, SLIDE, 300, isHidden(sub)); // slideToggle(300)
      a.parentElement!.classList.toggle("active");
    }
    if (!t.closest(".mobile-nav, .mobile-nav-toggle") && body.classList.contains("mobile-nav-active")) {
      body.classList.remove("mobile-nav-active");
      flipIcon();
      animate(overlay, FADE, 400, false); // fadeOut()
    }
  });
}

// ---------------------------------------------------------------- validate.js: contact form

const EMAIL = /^[^\s()<>@,;:\/]+@\w[\w\.-]+\.[a-z]{2,}$/i;
const ENDPOINT = "https://us-central1-tavron-3fa96.cloudfunctions.net/sendMailOverHTTP";

// The rules the form uses (data-rule="required" | "minlen:N" | "email"); anything else passes,
// as an unknown rule did before.
function fieldError(field: HTMLInputElement | HTMLTextAreaElement) {
  const [rule, arg] = field.getAttribute("data-rule")!.split(/:(.*)/);
  if (rule === "required") return field.value === "";
  if (rule === "minlen") return field.value.length < parseInt(arg);
  if (rule === "email") return !EMAIL.test(field.value);
  return false;
}

// jQuery.param: encodeURIComponent, spaces as "+"
const urlencode = (data: Record<string, string>) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")
    .replace(/%20/g, "+");

function initContactForm() {
  const form = document.querySelector<HTMLFormElement>("form.php-email-form");
  if (!form) return;
  const find = (sel: string) => form.querySelector<HTMLElement>(sel)!;
  const value = (sel: string) => document.querySelector<HTMLInputElement>(sel)!.value;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Inputs first, then textareas, as validate.js went through them.
    const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".form-group > input, .form-group > textarea")]
      .filter((f) => f.hasAttribute("data-rule"))
      .sort((a, b) => Number(a.tagName === "TEXTAREA") - Number(b.tagName === "TEXTAREA"));
    let failed = false;
    for (const f of fields) {
      const error = fieldError(f);
      failed ||= error;
      const note = f.nextElementSibling as HTMLElement | null;
      if (!note?.classList.contains("validate")) continue;
      note.textContent = error ? (f.getAttribute("data-msg") ?? "wrong Input") : "";
      animate(note, SHOW, 400, true); // .show('blind'): without jQuery UI, a plain 400 ms show
    }
    if (failed) return;

    const body = urlencode({
      name: value("#name"),
      email: value("#email"),
      subject: value("#subject"),
      message: value("textarea#message"),
    });
    // As before: nothing happens on a failed request or a non-2xx reply. On a reply that does
    // not start with "Sent!", the old code showed the error box and then threw on an undefined
    // `msg`, so the box stays empty. Kept as it was (open question in NEXTJS-MIGRATION.md).
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((reply) => {
        animate(find(".loading"), SLIDE, 400, false);
        if (reply.startsWith("Sent!")) {
          animate(find(".sent-message"), SLIDE, 400, true);
          form.querySelectorAll<HTMLInputElement>("input:not([type=submit]), textarea").forEach((f) => (f.value = ""));
        } else {
          animate(find(".error-message"), SLIDE, 400, true);
        }
      })
      .catch(() => {});
  });
}
