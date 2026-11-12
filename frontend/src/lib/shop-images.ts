const STORED_IMAGE = /^demo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpe?g)$/;
const LEGACY_IMAGE = /^\/images\/[A-Za-z0-9._-]+$/;
const REMOTE_IMAGE = /^https:\/\/\S+$/;

export const MAX_PRODUCT_IMAGES = 8;

export function isStoredImage(value: string): boolean {
  return STORED_IMAGE.test(value);
}

export function isProductImage(value: string): boolean {
  return isStoredImage(value) || LEGACY_IMAGE.test(value) || REMOTE_IMAGE.test(value);
}

export function imageSrc(value: string): string {
  if (value.startsWith("/") || value.startsWith("https://")) return value;
  return `/api/shop/media/${value}`;
}
