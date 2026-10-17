import axios from "axios";
import sharp from "sharp";
import { type PrismaClient, type album } from "@prisma/client";
import { type AlbumInfoResponse } from "~/server/api/models/albuminforesponse";
import { buildLastFmUrl } from "~/server/music/lastfm";

const MAX_COVER_BYTES = 96 * 1024;
const RETRY_AFTER_MS = 24 * 60 * 60 * 1000;
const MISSING_COVER = "missing:v1";
const IMAGE_HOSTS = new Set([
  "lastfm.freetls.fastly.net",
  "lastfm-img.freetls.fastly.net",
]);
const pendingCovers = new Map<string, Promise<StoredCover | null>>();

type StoredCover = { bytes: Buffer; contentType: string };
type CoverAlbum = {
  artist: string;
  name: string;
  url: string;
  imageUrl?: string;
};

export const getAlbumCoverUrls = async <Entry extends CoverAlbum>(
  prisma: PrismaClient,
  albums: Entry[]
) => {
  const savedAlbums = await prisma.album.findMany({
    where: { last_fm_url: { in: albums.map((entry) => entry.url) } },
    select: { id: true, last_fm_url: true, updated_at: true },
  });
  const covers = new Map<string, { id: string; updated_at: Date }>(
    savedAlbums.map((entry) => [entry.last_fm_url, entry])
  );

  for (const entry of albums) {
    if (covers.has(entry.url)) continue;
    const saved = await prisma.album.upsert({
      where: { last_fm_url: entry.url },
      create: {
        name: entry.name,
        artist: entry.artist,
        last_fm_url: entry.url,
        cover_art_image_url: entry.imageUrl ? entry.imageUrl : null,
      },
      update: {},
      select: { id: true, updated_at: true },
    });
    covers.set(entry.url, saved);
  }

  return albums.map((entry) => {
    const cover = covers.get(entry.url)!;
    return {
      ...entry,
      imageUrl: `/api/music/cover/${cover.id}?v=${cover.updated_at.getTime()}`,
    };
  });
};

const imageContentType = (bytes: Buffer) => {
  if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)))
    return "image/gif";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return "image/jpeg";
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
};

const readStoredCover = (value: string | null): StoredCover | null => {
  const match = value?.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
  );
  if (!match?.[2]) return null;
  const bytes = Buffer.from(match[2], "base64");
  const contentType = imageContentType(bytes);
  if (
    !bytes.length ||
    bytes.length > MAX_COVER_BYTES ||
    contentType !== match[1]
  )
    return null;
  return { bytes, contentType };
};

const downloadCover = async (
  source: string | null
): Promise<StoredCover | null> => {
  if (!source) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || !IMAGE_HOSTS.has(url.hostname) || url.port)
      return null;
    const image = url.pathname.match(
      /^\/i\/u\/[^/]+\/([a-f0-9]{32}\.(?:jpg|jpeg|png|webp|gif))$/i
    );
    if (!image?.[1] || image[1].startsWith("2a96cbd8b46e442fc41c2b86b821562f"))
      return null;
    url.pathname = `/i/u/300x300/${image[1]}`;
    url.search = "";
    const response = await axios.get<ArrayBuffer>(url.toString(), {
      responseType: "arraybuffer",
      timeout: 5000,
      maxContentLength: 2 * 1024 * 1024,
      maxRedirects: 0,
    });
    const input = Buffer.from(response.data);
    if (!imageContentType(input)) return null;
    const bytes = (await sharp(input, {
      limitInputPixels: 1024 * 1024,
      pages: 1,
    })
      .resize(300, 300, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer()) as Buffer;
    return bytes.length <= MAX_COVER_BYTES
      ? { bytes, contentType: "image/webp" }
      : null;
  } catch {
    return null;
  }
};

const preserveCover = async (prisma: PrismaClient, entry: album) => {
  let cover = await downloadCover(entry.cover_art_image_url);
  let missing = false;
  if (!cover) {
    try {
      const response = await axios.get<AlbumInfoResponse>(
        buildLastFmUrl({
          method: "album.getInfo",
          album: entry.name,
          artist: entry.artist,
        }),
        { timeout: 5000 }
      );
      if (!response.data.album) return null;
      const images = (response.data.album.image ?? []).filter(
        (image) => image["#text"]
      );
      const staticImages = images.filter(
        (image) => !/\.gif(?:[?#]|$)/i.test(image["#text"])
      );
      const preferredImages = staticImages.length ? staticImages : images;
      const source =
        preferredImages.find((image) => image.size === "extralarge") ??
        [...preferredImages].reverse()[0];
      cover = await downloadCover(source?.["#text"] ?? null);
      missing = !source;
    } catch {
      cover = null;
    }
  }

  if (!cover && !missing) return null;

  await prisma.album.update({
    where: { id: entry.id },
    data: {
      cover_art_image_url: cover
        ? `data:${cover.contentType};base64,${cover.bytes.toString("base64")}`
        : MISSING_COVER,
    },
  });
  return cover;
};

export const getAlbumCover = async (prisma: PrismaClient, id: string) => {
  const entry = await prisma.album.findUnique({ where: { id } });
  if (!entry) return null;
  const stored = readStoredCover(entry.cover_art_image_url);
  if (stored) return stored;
  if (
    entry.cover_art_image_url === MISSING_COVER &&
    Date.now() - entry.updated_at.getTime() < RETRY_AFTER_MS
  )
    return null;

  const pending = pendingCovers.get(id);
  if (pending) return pending;
  const request = preserveCover(prisma, entry);
  pendingCovers.set(id, request);
  try {
    return await request;
  } finally {
    pendingCovers.delete(id);
  }
};
