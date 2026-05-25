import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/confessions",
    "/golge",
    "/plus",
    "/about",
    "/community-rules",
    "/privacy-policy",
    "/terms",
    "/safety",
    "/contact",
    "/login",
    "/register",
  ];

  return routes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/confessions" || path === "/golge" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
