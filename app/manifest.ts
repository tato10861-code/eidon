import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eidon — The AI Employee Company",
    short_name: "Eidon",
    description:
      "Build, deploy and manage production-ready AI employees that reason, use your tools and finish real work.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060a",
    theme_color: "#05060a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
