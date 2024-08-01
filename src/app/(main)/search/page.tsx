import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
  searchParams: { q: string };
}

export function generateMetadata({ searchParams: { q } }: PageProps): Metadata {
  return {
    title: `Search results for "${q}"`,
  };
}

export default function Page({ searchParams: { q } }: PageProps) {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="line-clamp-2 break-all text-center text-2xl font-bold">
            Search results for &quot;{q}&quot;
          </h1>
        </div>
        <Tabs defaultValue="users/posts">
          <TabsList>
            <TabsTrigger value="users/posts">Users/Posts</TabsTrigger>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
          <TabsContent value="users/posts">
            <SearchResults query={q} type="posts" />
          </TabsContent>
          <TabsContent value="instruments">
            <SearchResults query={q} type="instruments" />
          </TabsContent>
          <TabsContent value="skills">
            <SearchResults query={q} type="skills" />
          </TabsContent>
          {/* <TabsContent value="groups">
            <SearchResults query={q} />
          </TabsContent> */}
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}
