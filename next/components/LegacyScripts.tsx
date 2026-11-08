"use client";

import { useEffect } from "react";

// ponytail: interim for Steps 3-5. Runs the old behaviour after React has hydrated, so nothing
// touches the DOM before React adopts it. Step 6 replaces it with React and deletes this file.
// Only what still does something is loaded: the rest of the old vendor block served main.js.
const load = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });

let started = false; // once per page load, also under React's dev double-effects

export function LegacyScripts() {
  useEffect(() => {
    if (started) return;
    started = true;
    (async () => {
      for (const f of ["jquery/jquery.min.js", "jquery.easing/jquery.easing.min.js", "php-email-form/validate.js"])
        await load(`/assets/vendor/${f}`);
      mobileNav((window as unknown as { jQuery: JQ }).jQuery);
      await load("/assets/js/tavron-modern.js");
    })();
  }, []);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JQ = any;

// The mobile navigation handlers from assets/js/main.js, unchanged.
function mobileNav($: JQ) {
  $(document).on("click", ".mobile-nav-toggle", function () {
    $("body").toggleClass("mobile-nav-active");
    $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
    $(".mobile-nav-overly").toggle();
  });

  $(document).on("click", ".mobile-nav .drop-down > a", function (this: Element, e: Event) {
    e.preventDefault();
    $(this).next().slideToggle(300);
    $(this).parent().toggleClass("active");
  });

  $(document).click(function (e: Event) {
    const container = $(".mobile-nav, .mobile-nav-toggle");
    if (!container.is(e.target) && container.has(e.target).length === 0) {
      if ($("body").hasClass("mobile-nav-active")) {
        $("body").removeClass("mobile-nav-active");
        $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
        $(".mobile-nav-overly").fadeOut();
      }
    }
  });
}
