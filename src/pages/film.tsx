import { type NextPage } from "next";
import { useMemo, useState } from "react";
import { FilmView } from "~/components/filmview";
import { LoadingPage } from "~/components/loading";
import { StarRating } from "~/components/stars";
import { type RouterOutputs, api } from "~/utils/api";

type Film = RouterOutputs["movie"]["getAllByMinimumRating"][0];
const Films = (props: { year: number | "All" }) => {
  const { year } = props;
  const { data, isLoading: filmsLoading } = getFilmsByYear(year);
  const fiveStarFilms = useMemo(
    () => data?.filter((film) => Number(film.my_rating) === 5),
    [data]
  );
  const fourAndHalfStarFilms = useMemo(
    () => data?.filter((film) => Number(film.my_rating) === 4.5),
    [data]
  );
  const fourStarFilms = useMemo(
    () => data?.filter((film) => Number(film.my_rating) === 4),
    [data]
  );

  if (filmsLoading) {
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );
  }

  if (!data) return <div>Something went wrong</div>;

  return (
    <div>
      {fiveStarFilms && fiveStarFilms.length > 0 ? (
        <FilmsByStarRating films={fiveStarFilms} rating={5} className="pt-12" />
      ) : (
        ""
      )}
      <div className="relative flex py-11 items-center">
        <div className="flex-grow border-t border-gray-400 opacity-30"></div>
      </div>
      {fourAndHalfStarFilms && fourAndHalfStarFilms.length > 0 ? (
        <FilmsByStarRating films={fourAndHalfStarFilms} rating={4.5} />
      ) : (
        ""
      )}
      <div className="relative flex py-10 items-center">
        <div className="flex-grow border-t border-gray-400 opacity-30"></div>
      </div>
      {fourStarFilms && fourStarFilms.length > 0 ? (
        <FilmsByStarRating films={fourStarFilms} rating={4} className="pb-12"/>
      ) : (
        ""
      )}
    </div>
  );
};

const FilmsByStarRating = (props: { films: Film[]; rating: number, className?: string }) => {
  const { films, rating, className } = props;

  return (
    <div className={`container:none grid grid-cols-12 gap-8 overflow-y-scroll ${className}`}>
      <div className="col-span-12 text-2xl opacity-80 mb-4">
        <StarRating rating={rating} />
      </div>
      {films.map((film) => (
        <FilmView {...film} key={film.id} />
      ))}
    </div>
  );
};

const getFilmsByYear = (year: number | "All") => {
  if (year === "All") {
    return api.movie.getAllByMinimumRating.useQuery({ rating: 4 });
  } else {
    return api.movie.getByMinimumRatingAndWatchedYear.useQuery({
      rating: 4,
      year,
    });
  }
};

const FilmPage: NextPage = () => {
  const supportedYears = [2023, 2022, "All"];
  const [selectedYear, setSelectedYear] = useState<number | "All">(
    supportedYears[0] as number
  );

  return (
    <div>
      <ul>
        {supportedYears.map((year, index) => {
          return (
            <li
              key={index}
              className={`hover:bg-highlight mr-8 inline ${
                year === selectedYear ? "bg-highlight" : ""
              }`}
            >
              <button
                className={`${year === selectedYear ? "underline" : ""}`}
                onClick={() => setSelectedYear(year as number | "All")}
              >
                {year}
              </button>
            </li>
          );
        })}
      </ul>
      <Films year={selectedYear} />
    </div>
  );
};

export default FilmPage;
