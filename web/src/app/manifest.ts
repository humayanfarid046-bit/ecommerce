import type { MetadataRoute } from "next";

/** Site-wide web app manifest (one per app). Keep storefront branding; delivery uses same origin. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Libas Collection",
    short_name: "Libas",
    description: "Shop fashion and essentials online.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0066ff",
    icons: [
      {
        src: "/file.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
