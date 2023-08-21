import Head from "next/head";
import { api } from "~/utils/api";

export default function Home() {
  const numberOfMoviesWatched = api.movie.getCount.useQuery();
  const numberOfMoviesRated = api.movie.getCountWhereRated.useQuery();

  return (
    <>
      <Head>
        <title>Track Matthew</title>
        <meta name="description" content="Track Me!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="text-[hsl(280,100%,70%)]">TRACK</span> Matthew
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {numberOfMoviesWatched.data
                ? `${numberOfMoviesWatched.data} movies watched`
                : ""}
            </p>
            <p className="text-2xl text-white">
              {numberOfMoviesRated.data
                ? `${numberOfMoviesRated.data} rated`
                : ""}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
