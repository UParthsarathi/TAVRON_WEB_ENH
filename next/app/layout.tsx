import type { Viewport } from "next";
import { Behaviour } from "@/components/Behaviour";

// The old pages say "1.0", and the markup has to match character for character.
export const viewport: Viewport = { width: "device-width", initialScale: "1.0" as unknown as number };

const vendorCss = [
  "bootstrap/css/bootstrap.min.css",
  "icofont/icofont.min.css",
  "boxicons/css/boxicons.min.css",
  "remixicon/remixicon.css",
  "animate.css/animate.min.css",
  "venobox/venobox.css",
  "aos/aos.css",
];

// The <head> tail that every old page shares, from the favicons on, in the same order.
// React hoists <title>, <meta> and non-stylesheet <link> into <head> in render order, ahead of the
// stylesheets. Each page renders its own title, meta tags and canonical link; the favicons and
// preconnects are rendered after the page so they land behind those, where the old pages had them.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Sora:wght@400..800&display=swap"
          rel="stylesheet"
        />
        {vendorCss.map((f) => (
          <link key={f} href={`assets/vendor/${f}`} rel="stylesheet" />
        ))}
        <link href="assets/css/style.css" rel="stylesheet" />
        <link href="assets/css/tavron-modern.css" rel="stylesheet" />
      </head>
      {/* The data-aos-* attributes are what main.js's AOS.init() left on every old page. Nothing on
          the site uses AOS, but they are part of the markup, so they stay until a separate decision. */}
      <body className="tv tv--light-top tv-numbered" data-aos-easing="ease" data-aos-duration="1000" data-aos-delay="0">
        {children}
        <link href="assets/img/favicon.png" rel="icon" />
        <link href="assets/img/apple-touch-icon.png" rel="apple-touch-icon" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <Behaviour />
      </body>
    </html>
  );
}
