import type { ImageLoaderProps } from "next/image";

export function isCloudinaryImage(src: string) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.includes("/image/upload/")
    );
  } catch {
    return false;
  }
}

/** Resize at the source, so neither Next nor the browser downloads the original photo. */
export function cookingImageLoader({ src, width }: ImageLoaderProps) {
  const url = new URL(src);
  url.pathname = url.pathname.replace(
    "/image/upload/",
    `/image/upload/c_fill,g_auto,w_${width},h_${width}/f_auto,q_auto/`
  );
  return url.toString();
}
