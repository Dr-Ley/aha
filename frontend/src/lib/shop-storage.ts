import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { isPortfolioVideo, isStoredImage } from "@/lib/shop-images";

export type ShopImagePrefix = "demo" | "brands_ke";

const BUCKET = "shop-images";

type StorageEnv = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function storageEnv(): StorageEnv {
  const bucket = process.env.NEON_STORAGE_BUCKET?.trim();
  const endpoint = process.env.NEON_STORAGE_ENDPOINT?.trim();
  const region = process.env.NEON_STORAGE_REGION?.trim();
  const accessKeyId = process.env.NEON_STORAGE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.NEON_STORAGE_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Neon storage environment variables are not set");
  }
  if (bucket !== BUCKET) {
    throw new Error(`NEON_STORAGE_BUCKET must be ${BUCKET}`);
  }
  return { bucket, endpoint, region, accessKeyId, secretAccessKey };
}

type GlobalStorage = typeof globalThis & { __shopStorage?: S3Client };

export function shopBucket(): string {
  return storageEnv().bucket;
}

export function shopStorage(): S3Client {
  const g = globalThis as GlobalStorage;
  if (!g.__shopStorage) {
    const env = storageEnv();
    g.__shopStorage = new S3Client({
      region: env.region,
      endpoint: env.endpoint,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }
  return g.__shopStorage;
}

export async function putShopImage(
  body: Uint8Array,
  contentType: "image/webp" | "image/jpeg",
  prefix: ShopImagePrefix = "demo"
): Promise<string> {
  const key = `${prefix}/${crypto.randomUUID()}.${contentType === "image/webp" ? "webp" : "jpg"}`;
  await shopStorage().send(
    new PutObjectCommand({
      Bucket: shopBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return key;
}

export async function readShopImage(
  key: string,
  accept: (value: string) => boolean = isStoredImage
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!accept(key)) return null;
  try {
    const result = await shopStorage().send(new GetObjectCommand({ Bucket: shopBucket(), Key: key }));
    if (!result.Body) return null;
    return {
      bytes: await result.Body.transformToByteArray(),
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}

export async function openPortfolioVideo(key: string, range?: string) {
  if (!isPortfolioVideo(key)) return null;
  try {
    const result = await shopStorage().send(
      new GetObjectCommand({
        Bucket: shopBucket(),
        Key: key,
        ...(range ? { Range: range } : {}),
      })
    );
    if (!result.Body) return null;
    return result;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}

export async function deleteShopImages(
  keys: string[],
  accept: (value: string) => boolean = isStoredImage
): Promise<void> {
  const stored = [...new Set(keys.filter(accept))];
  if (stored.length === 0) return;
  const client = shopStorage();
  const bucket = shopBucket();
  await Promise.all(stored.map((key) => client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))));
}
