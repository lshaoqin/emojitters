import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { createContext } from "react";
import { appRouter } from "~/server/api/root";
import { api } from "~/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { prisma } from "~/server/db";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {

  const { data } = api.profile.getUserByUsername.useQuery({username,});

  if (!data) return <div>404 User not found</div>;
  return (
    <>
    <Head>
      <title>{data.username}</title>
    </Head>
      <main className="flex h-screen justify-center">
          {data.username}
      </main>
    </>
  );
};


export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null},
    transformer: superjson,
  });

  const slug = context.params?.slug;

  if (typeof slug !== 'string') throw new Error("No slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
}
export default ProfilePage;
