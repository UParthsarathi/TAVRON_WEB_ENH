/**
 * Tavron Engineers — Modern interaction layer
 * Vanilla JS, no dependencies. Loaded only by pages with <body class="tv">.
 */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
   * Header: transparent over the hero, solid once you scroll
   * The header markup is injected asynchronously by main.js ($.load),
   * so we retry until #header actually has children.
   * ---------------------------------------------------------------- */
  function initHeader() {
    var header = document.getElementById("header");
    if (!header) return;

    var solidAfter = 60;
    var onScroll = function () {
      header.classList.toggle("tv-header--solid", window.scrollY > solidAfter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
   * Scroll reveal
   * ---------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".tv-reveal");
    if (!items.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
   * Animated counters — data-count="2004" data-suffix="+"
   * ---------------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var group = el.getAttribute("data-group") === "true";
    var dur = 1500;
    var start = null;

    if (reduced) {
      el.textContent = prefix + (group ? target.toLocaleString("en-IN") : target) + suffix;
      return;
    }

    function fmt(v) {
      var n = Math.round(v);
      return prefix + (group ? n.toLocaleString("en-IN") : String(n)) + suffix;
    }

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      // easeOutExpo
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(animateCount);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
   * Hero background crossfade
   * ---------------------------------------------------------------- */
  function initHero() {
    var slides = document.querySelectorAll(".tv-hero__slide");
    if (slides.length < 2) return;
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 6000);
  }

  /* ------------------------------------------------------------------
   * Product image viewer (thumbnails -> main stage)
   * ---------------------------------------------------------------- */
  function initViewer() {
    var viewer = document.querySelector("[data-viewer]");
    if (!viewer) return;
    var stage = viewer.querySelector("[data-viewer-stage]");
    var buttons = viewer.querySelectorAll("[data-viewer-thumb]");
    if (!stage || !buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-selected", "false"); });
        btn.setAttribute("aria-selected", "true");
        var src = btn.getAttribute("data-src");
        var alt = btn.getAttribute("data-alt") || "";
        stage.style.opacity = "0";
        setTimeout(function () {
          stage.src = src;
          stage.alt = alt;
          stage.style.opacity = "1";
        }, 180);
      });
    });
  }

  /* ------------------------------------------------------------------
   * Lightbox for drawings / gallery images
   * ---------------------------------------------------------------- */
  function initLightbox() {
    var triggers = document.querySelectorAll("[data-lightbox]");
    if (!triggers.length) return;

    var box = document.createElement("div");
    box.className = "tv-lightbox";
    box.innerHTML =
      '<button class="tv-lightbox__close" aria-label="Close">&times;</button>' +
      '<img alt="">';
    document.body.appendChild(box);

    var img = box.querySelector("img");
    var close = function () {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
    };

    triggers.forEach(function (t) {
      t.style.cursor = "zoom-in";
      t.addEventListener("click", function () {
        img.src = t.getAttribute("data-lightbox") || t.getAttribute("src");
        img.alt = t.getAttribute("alt") || "";
        box.classList.add("is-open");
        document.body.style.overflow = "hidden";
      });
    });

    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("tv-lightbox__close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ------------------------------------------------------------------
   * Sticky enquiry bar — appears after the hero scrolls away
   * ---------------------------------------------------------------- */
  function initStickyBar() {
    var bar = document.querySelector(".tv-stickybar");
    if (!bar) return;
    var anchor = document.querySelector(".tv-phero, .tv-doc__top");
    var trigger = anchor ? anchor.offsetHeight : 500;
    var onScroll = function () {
      bar.classList.toggle("is-visible", window.scrollY > trigger);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
   * Client logo marquee — duplicate the track so the loop is seamless
   * ---------------------------------------------------------------- */
  function initMarquee() {
    var track = document.querySelector(".tv-marquee__track");
    if (!track || track.dataset.cloned === "true") return;
    track.innerHTML += track.innerHTML;
    track.dataset.cloned = "true";
  }

  /* ------------------------------------------------------------------
   * Boot
   * ---------------------------------------------------------------- */
  function boot() {
    initReveal();
    initCounters();
    initHero();
    initViewer();
    initLightbox();
    initStickyBar();
    initMarquee();
    initHeader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
