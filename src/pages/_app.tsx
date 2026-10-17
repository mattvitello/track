import { type AppType } from "next/app";
import { api } from "~/utils/api";
import Head from "next/head";
import { PageLayout } from "~/components/layout";
import "~/styles/globals.css";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { restoreQueryClient } from "~/utils/query-cache";

const MyApp: AppType = ({ Component, pageProps }) => {
  const queryClient = useQueryClient();
  useEffect(() => restoreQueryClient(queryClient), [queryClient]);

  return (
    <>
      <Head>
        <title>Track | Matt Vitello</title>
        <meta name="description" content="Tracking Matt Vitello and all that he does." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <Component {...pageProps} />
      </PageLayout>
    </>
  );
};

export default api.withTRPC(MyApp);
