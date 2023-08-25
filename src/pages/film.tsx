import { type NextPage } from "next";
import { useMemo, useState } from "react";
import { FilmView } from "~/components/filmview";
import { LoadingPage } from "~/components/loading";
import { api } from "~/utils/api";

const Films = (props: { year: number | "All" }) => {
  const { year } = props;
  const { data, isLoading: filmsLoading } = getFilmsByYear(year);
  const films = useMemo(() => data, [data]);

  if (filmsLoading) {
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );
  }

  if (!films) return <div>Something went wrong</div>;

  return (
    <div className="container:none grid grid-cols-12 gap-8 overflow-y-scroll pt-12">
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
              className={`mr-8 inline hover:bg-highlight ${
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
