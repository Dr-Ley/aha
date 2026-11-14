const STORED_IMAGE = /^demo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpe?g)$/;
const BRANDS_KE_IMAGE = /^brands_ke\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpe?g)$/;

export const portfolioDemoVideos = {
  desktop: "demo/lnl_dktp.mp4",
  mobile: "demo/lnl_mble.mp4",
} as const;

export const portfolioBrandsKeVideos = {
  desktop: "brands_ke/brands_dsktp.mp4",
  mobile: "brands_ke/brands_mobile.mp4",
} as const;
const LEGACY_IMAGE = /^\/images\/[A-Za-z0-9._-]+$/;
const REMOTE_IMAGE = /^https:\/\/\S+$/;

export const MAX_PRODUCT_IMAGES = 8;

export function isStoredImage(value: string): boolean {
  return STORED_IMAGE.test(value);
}

export function isBrandsKeImage(value: string): boolean {
  return BRANDS_KE_IMAGE.test(value);
}

export function isPortfolioVideo(value: string): boolean {
  return (
    value === portfolioDemoVideos.desktop ||
    value === portfolioDemoVideos.mobile ||
    value === portfolioBrandsKeVideos.desktop ||
    value === portfolioBrandsKeVideos.mobile
  );
}

export function isProductImage(value: string): boolean {
  return isStoredImage(value) || LEGACY_IMAGE.test(value) || REMOTE_IMAGE.test(value);
}

export function isBrandsKeProductImage(value: string): boolean {
  return isBrandsKeImage(value) || LEGACY_IMAGE.test(value) || REMOTE_IMAGE.test(value);
}

export function imageSrc(value: string, mediaBase = "/api/shop/media"): string {
  if (value.startsWith("/") || value.startsWith("https://")) return value;
  return `${mediaBase}/${value}`;
}
