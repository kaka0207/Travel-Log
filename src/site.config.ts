/**
 * ============================================================================
 * SITE CONFIGURATION
 * ============================================================================
 * This is the ONLY file you need to edit to customize the site for your own use.
 * All branding, personal info, social links, and site metadata are defined here.
 *
 * After editing this file, restart the dev server to see changes.
 * ============================================================================
 */

import type { ContactCardTitle } from "@/components/contact-card";

export const siteConfig = {
  /** Site name used in metadata, logo, and branding */
  name: "我的世界",

  /** Tagline shown alongside name (e.g. "Photo", "Photography") */
  tagline: "allan",

  /** Your role/title shown in profile cards and footer */
  role: "一个极致自由的人",

  /** Short bio shown on the home page profile card */
  bio: "我热爱生活，肆意洒脱，欢迎你走进我的世界。",

  /** Avatar image path (place your avatar in /public/avatar.jpg) */
  avatar: "/avatar.jpg",

  /** Initials used as avatar fallback */
  initials: "A",

  /** Site metadata for SEO */
  metadata: {
    title: {
      template: "%s - 我的世界",
      default: "我的世界",
    },
    description: "我热爱生活，肆意洒脱，欢迎你走进我的世界。",
  },

  /** Social links shown in profile card and footer */
  socialLinks: [] as { title: ContactCardTitle; href: string; primary?: boolean }[],

  /** Footer attribution */
  footer: {
    designCredit: {
      name: "",
      href: "",
    },
    poweredBy: {
      name: "",
      href: "",
    },
  },

  /** OpenStreetMap is used for maps and free geocoding. */
  mapProvider: "OpenStreetMap",

  /**
   * Image loader configuration.
   * Set to "cloudflare" to use the Cloudflare custom image loader,
   * or "default" to use Next.js built-in image optimization.
   */
  imageLoader: "default" as "cloudflare" | "default",

  /**
   * Gear / equipment shown on the About page.
   * Each item has a brand and model name.
   */
  gear: [
    { brand: "SONY", model: "Alpha 7RⅡ" },
    { brand: "DJI", model: "Air 2S" },
    { brand: "Tamron", model: "50-400mm F/4.5-6.3 Di III VC VXD" },
    { brand: "Sigma", model: "35mm F/1.4 DG HSM" },
    { brand: "Viltrox", model: "AF 40mm F/2.5 FE" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
