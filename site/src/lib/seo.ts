// Shared SEO metadata for the public marketing pages.
//
// Every public route builds its <head> with `pageHead()` so titles, descriptions,
// canonicals and social cards can never drift apart. Values are emitted by the
// route's `head()` function, which TanStack Start renders server-side — so the
// tags are in the HTML a crawler (or a link unfurler) receives, not injected
// later by client JavaScript.
//
// Absolute URLs matter here: Open Graph, canonicals and the sitemap must all use
// the public origin, because relative values are meaningless to a crawler that
// found the page through a shared link.

/** The one public origin. Everything the owner can open lives under this host. */
export const SITE_URL = "https://b1030a08ef30e5884826c2e6eaf3d383.cto.site";

export const SITE_NAME = "Douglas Real Estate Systems";

/**
 * Social share card, 1200×630, served from the site root (site/public/og-image.png).
 * Regenerate it if the brand or tagline changes.
 */
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const OG_IMAGE_ALT =
  "Douglas Real Estate Systems — deal analysis, portfolio tracking and CRM for real estate agents, investors and brokerages";

export interface PageHeadOptions {
  /** Unique <title> for the page. Brand suffix is added by the caller. */
  title: string;
  /** Unique meta description, ~150–160 characters. */
  description: string;
  /** Route path, leading slash. Used for the canonical and og:url. */
  path: string;
  type?: "website" | "article";
  /** Structured data rendered as an application/ld+json script tag. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Build the head tags for a public page.
 *
 * Returned as a plain object for `head: () => pageHead({...})`. The cast at the
 * end is because React's meta attribute types omit the `property` attribute that
 * Open Graph requires.
 */
export function pageHead({ title, description, path, type = "website", jsonLd }: PageHeadOptions) {
  const url = `${SITE_URL}${path}`;

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    // Open Graph — used by Slack, LinkedIn, Facebook, iMessage, Discord.
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: OG_IMAGE_ALT },
    // Twitter / X falls back to og:* but the card type must be explicit.
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
    { name: "twitter:image:alt", content: OG_IMAGE_ALT },
  ];

  const links = [{ rel: "canonical", href: url }];

  const scripts = jsonLd
    ? [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ]
    : [];

  return {
    meta: meta as unknown as Array<{ title?: string; name?: string; content?: string }>,
    links,
    scripts,
  };
}
