import Link from "next/link";
import { type NextPage } from "next/types";

const Home: NextPage = () => {
  return (
    <div className="pb-4 my-4 sm:my-12 lg:mx-8 lg:my-20 text-md items-center">
      <p className="mb-4">
        {`For the past few years, I've been logging and aggregating data about my
        consumption habits from two primary sources: `}
        <Link
          href="https://letterboxd.com/"
          rel="noopener noreferrer"
          target="_blank"
          className="underline text-blue-600 hover:text-blue-800"
        >
          Letterboxd
        </Link>
        {` and `}
        <Link
          href="https://www.last.fm/"
          rel="noopener noreferrer"
          target="_blank"
          className="underline text-blue-600 hover:text-blue-800"
        >
          Last.fm
        </Link>
        .
      </p>
      <p className="mb-4">
        {`Through Letterboxd, I rate/review, and log every movie I watch. With
        Last.fm, I keep track of every song I play, across all my devices and
        from any music streaming service (e.g. Apple Music,
        Spotify, YouTube, etc.). Synchronizing these datasets with my own
        application provides me with direct access to all of my raw and
        up-to-date data, which enables me to analyze and visualize my
        information in any way I see fit.`}
      </p>
      <p className="mb-4">
        {`In a broader sense, my goal here is to observe how I invest my time,
        capture my experiences, identify what was most present
        with me during different junctures of my life, and utilize this
        information to perform analysis on myself such as predicting my habits/behaviors, 
        or informing future decisions I make. Currently, the most conveniently accessible
        data pertains to just films and music, which I primarily use for simple
        nostalgic "What was last year like?" purposes. Despite the contrast between this use case and my grander aspirations, these initial
        datasets lay the foundation for this system which will
        evolve and expand over time.`}
      </p>
    </div>
  );
};

export default Home;
