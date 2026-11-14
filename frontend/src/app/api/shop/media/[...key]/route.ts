
import { NextResponse } from "next/server";
import { isPortfolioVideo } from "@/lib/shop-images";
import { openPortfolioVideo, readShopImage } from "@/lib/shop-storage";

type Context = { params: Promise<{ key: string[] }> };

async function streamPortfolioVideo(request: Request, key: string) {
  const range = request.headers.get("range") ?? undefined;
  const video = await openPortfolioVideo(key, range);
  if (!video?.Body) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  });
  if (video.ContentLength != null) headers.set("Content-Length", String(video.ContentLength));
  if (video.ContentRange) headers.set("Content-Range", video.ContentRange);

  return new NextResponse(video.Body.transformToWebStream(), {
    status: video.ContentRange ? 206 : 200,
    headers,
  });
}

export async function GET(request: Request, context: Context) {
  const key = (await context.params).key.join("/");
  if (isPortfolioVideo(key)) {
    try {
      return await streamPortfolioVideo(request, key);
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "InvalidRange") return new NextResponse("Range not satisfiable", { status: 416 });
      console.error("shop media GET", error);
      return new NextResponse("Could not load the video", { status: 500 });
    }
  }

  try {
    const image = await readShopImage(key);

    if (!image) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Convert Uint8Array into a standard ArrayBuffer
    const buffer = new ArrayBuffer(image.bytes.byteLength);
    new Uint8Array(buffer).set(image.bytes);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("shop media GET", error);
    return new NextResponse("Could not load the image", { status: 500 });
  }
}
