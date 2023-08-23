import type { RouterOutputs } from "~/utils/api";

type Film = RouterOutputs["movie"]["getByLetterboxdId"];
export const FilmView = (props: Film) => {
  const film = props!;

  return (
    <div key={film.id}>
      <p>{film.title}</p>
    </div>
  );
};