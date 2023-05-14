import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { createContext } from "react";
import { appRouter } from "~/server/api/root";
import { api } from "~/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { prisma } from "~/server/db";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/postview";
const ProfileFeed = (props: {userId: string}) => {
  const {data, isLoading} = api.posts.getPostsByUserId.useQuery({userId: props.userId});

  if(isLoading) return <LoadingPage />;

  if(!data || data.length === 0) return <div>User has not posted</div>;

  return (
    <div className="flex grow flex-col text-2xl text-white overflow-y-scroll">
      {data.map((fullPost) => (<PostView {...fullPost} key={fullPost.post.id} />))}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {

  const { data } = api.profile.getUserByUsername.useQuery({username,});

  if (!data) return <div>404 User not found</div>;
  return (
    <>
    <Head>
      <title>{data.username}</title>
    </Head>
      <PageLayout>
        <div className="h-36 bg-slate-600 relative">
          <Image src={data.profileImageUrl} alt={`${data.username ?? ""}'s profile pic`} width={128} height={128}
          className="-mb-[64px] absolute bottom-0 left-0 ml-4 rounded-full border-2 border-black"/>
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold bg-black">{`@${data.username ?? ""}`}</div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
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
