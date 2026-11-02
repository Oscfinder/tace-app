// Decorative stock photography only, never used for real beneficiary photos.
// Kept in /public/images/stock (from Unsplash, free to use) so the landing page's
// biggest image comes from our own server instead of another site.
export const STOCK_IMAGES = {
  hero: "/images/stock/hero.jpg",
  journey: "/images/stock/journey.jpg",
  stories: [
    "/images/stock/story-1.jpg",
    "/images/stock/journey.jpg",
    "/images/stock/hero.jpg",
  ],
} as const;
