import { type NextPage } from "next/types";
import { useState } from "react";
import { LoadingPage } from "~/components/loading";
import { AlbumView } from "~/components/albumview";
import { ErrorView } from "~/components/errorview";
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

  if (!data) return <ErrorView />;

  return (
    <div className="container:none grid grid-cols-12 gap-y-12 gap-x-4 overflow-y-scroll pt-12 pb-12">
      {data.map((album) => (
        <AlbumView {...album} key={album.url} />
      ))}
    </div>
  );
};

const getAlbumsByYear = (year: number | "All") => {
  if (year === "All") {
    return api.music.getMostListenedToAlbums.useQuery({ limit: 24 });
  } else {
    return api.music.getMostListenedToAlbumsByYear.useQuery({
      limit: 24,
      year,
    });
  }
};

const MusicPage: NextPage = () => {
  const supportedYears = getSupportedYears();
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

const getSupportedYears = (): Array<number | string> => {
  const firstSupportedYear = 2022;
  const currentYear = new Date().getFullYear();
  const supportedYears = [];
  for (let year = currentYear; year >= firstSupportedYear; year--) {
    supportedYears.push(year);
  }
  supportedYears.push("All");

  return supportedYears;
}; 

export default MusicPage;