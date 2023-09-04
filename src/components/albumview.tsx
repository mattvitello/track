import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";
import Link from "next/link";

type Album = RouterOutputs["music"]["getMostListenedToAlbums"][0];
export const AlbumView = (props: Album) => {
  const album = props;
  const albumCoverUrl = album.imageUrl ? album.imageUrl : "/empty-poster.png";

  return (
    <div key={album.url} className="col-span-4 sm:col-span-3 lg:col-span-2">
      <Link href={album.url} rel="noopener noreferrer" target="_blank">
        <Image
          src={albumCoverUrl}
          alt="Cover Art"
          width={130}
          height={0}
          className="-mt-5"
        />
      </Link>
        <p>{album.name}</p>
        <p>{album.artist}</p>
        <p>{album.playcount}</p>
    </div>
  );
};
