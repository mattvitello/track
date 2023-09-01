import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";
import Link from "next/link";

type Film = RouterOutputs["movie"]["getByLetterboxdId"];
export const FilmView = (props: Film) => {
  const film = props!;
  const posterImageUrl = film.poster_image_url
    ? film.poster_image_url
    : "/empty-poster.png";

  return (
    <div key={film.id} className="col-span-4 sm:col-span-3 lg:col-span-2">
      <Link href={film.letterboxd_url} rel="noopener noreferrer" target="_blank">
        <Image
          src={posterImageUrl}
          alt="Movie Poster"
          width={130}
          height={0}
          className="-mt-5"
        />
      </Link>
    </div>
  );
};
