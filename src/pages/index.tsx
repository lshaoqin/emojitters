import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import { api, RouterOutputs } from "~/utils/api";
import { toast } from "react-hot-toast";  
import { useState } from "react";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { toNamespacedPath } from "path";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error(err.message);
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3 border-b border-slate-400">
      <UserButton />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }
        }
      />
      {input !== "" && (<button
        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={() => mutate({ content: input })}
        disabled={isPosting}
      >
        Post
      </button>)}
      {isPosting && (
        <div className="flex items-center justify-center">
      <LoadingSpinner size={20} />
      </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>No posts so far :/</div>;

  return (
    <div className="flex grow flex-col text-2xl text-white overflow-y-scroll">
      {[...data]?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const {isLoaded: userLoaded, isSignedIn } = useUser();

  api.posts.getAll.useQuery();

  if (!userLoaded) return <LoadingPage />;
  return (
    <>
      <PageLayout>
          <div className="flex border-b border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
              )}
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
          
       </PageLayout>
    </>
  );
};

export default Home;
