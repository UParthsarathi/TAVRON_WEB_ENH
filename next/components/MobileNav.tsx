import { Nav } from "./generated/Header";

// main.js built these at runtime: the toggle prepended to <body>, then a clone of .nav-menu with
// its class swapped and the overlay appended at the end. Pages render them in those places.
export function MobileNavToggle() {
  return (
    <button type="button" className="mobile-nav-toggle d-lg-none">
      <i className="icofont-navigation-menu"></i>
    </button>
  );
}

export function MobileNav({ active }: { active?: string }) {
  return (
    <>
      <Nav className="mobile-nav d-lg-none" active={active} />
      <div className="mobile-nav-overly"></div>
    </>
  );
}
