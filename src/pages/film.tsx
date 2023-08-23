import { type NextPage } from "next";
import { useState } from "react";
import { FilmView } from "~/components/filmview";
import { LoadingPage } from "~/components/loading";
import { api } from "~/utils/api";

const Films = (props: { year: number | "All" }) => {
  const { year } = props;
  const { data, isLoading: filmsLoading } = getFilmsByYear(year);

  if (filmsLoading) {
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );
  }

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll">
      {data.map((film) => (
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
