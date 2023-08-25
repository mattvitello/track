import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";
import { StarRating } from "./stars";
import Link from "next/link";

type Film = RouterOutputs["movie"]["getByLetterboxdId"];
export const FilmView = (props: Film) => {
  const film = props!;
  const poster_image_url = film.poster_image_url
    ? film.poster_image_url
    : "/empty-poster.png";

  return (
    <div key={film.id} className="col-span-2">
      <Link href={film.letterboxd_url} rel="noopener noreferrer" target="_blank">
        <Image
          src={poster_image_url}
          alt="Movie Poster"
          width={130}
          height={0}
          className="-mt-5"
        />
      </Link>
      <p className="text-sm">
        <StarRating rating={Number(film.my_rating)} />
      </p>
    </div>
  );
};
