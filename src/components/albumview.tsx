import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";
import Link from "next/link";

type Album = RouterOutputs["music"]["getMostListenedToAlbums"][0];
export const AlbumView = (props: Album) => {
  const album = props;
  const albumCoverUrl = album.imageUrl ? album.imageUrl : "/empty-poster.png";

  return (
    <div key={album.url} className="relative col-span-4 sm:col-span-3">
      <Link href={album.url} rel="noopener noreferrer" target="_blank">
        <Image
          src={albumCoverUrl}
          alt="Album cover"
          sizes="100vw"
          style={{
            width: "100%",
            height: "auto",
          }}
          width={200}
          height={200}
        />
      </Link>
      <div>
        <p className="opacity-88 line-clamp-1 pt-1 text-xs leading-4 text-black">
          {album.name}
        </p>
        <p className="opacity-56 pt-0005 line-clamp-1 text-xs leading-4 text-black">
          {album.artist}
        </p>
        <p className="opacity-88 pt-0005 opacity-56 text-xs text-black">
          {album.playcount} Song Plays
        </p>
      </div>
    </div>
  );
};
