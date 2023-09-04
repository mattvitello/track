import { type NextPage } from "next/types";
import { useState } from "react";
import { LoadingPage } from "~/components/loading";
import { AlbumView } from "~/components/albumview";
import { api } from "~/utils/api";

const Albums = (props: { year: number | "All" }) => {
  const { year } = props;
  const { data, isLoading: albumsLoading } = getAlbumsByYear(year);

  if (albumsLoading) {
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );
  }

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="container:none grid grid-cols-12 gap-y-9 gap-x-4 overflow-y-scroll max-w-4xl pt-12">
      {data.map((album) => (
        <AlbumView {...album} key={album.url} />
      ))}
    </div>
  );
};

const getAlbumsByYear = (year: number | "All") => {
  if (year === "All") {
    return api.music.getMostListenedToAlbums.useQuery({ limit: 25 });
  } else {
    return api.music.getMostListenedToAlbumsByYear.useQuery({
      limit: 25,
      year,
    });
  }
};

const MusicPage: NextPage = () => {
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
      <Albums year={selectedYear} />
    </div>
  );
};

export default MusicPage;