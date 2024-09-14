import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchField from "@/components/SearchField";

interface PageProps {
  searchParams: { q: string };
}

export function generateMetadata({ searchParams: { q } }: PageProps): Metadata {
  return !q ? { title: "Search" } : { title: `Search results for "${q}"` };
}

export default function Page({ searchParams: { q } }: PageProps) {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <Tabs defaultValue="users/posts">
          <TabsList>
            <TabsTrigger value="users/posts">Users/Posts</TabsTrigger>
            <TabsTrigger value="instruments/skills">
              Instruments/Skills
            </TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="users/posts">
            <SearchResults query={q} type="users/posts" />
          </TabsContent>
          <TabsContent value="instruments/skills">
            <SearchResults query={q} type="instruments/skills" />
          </TabsContent>
          <TabsContent value="events">
            <SearchResults query={q} type="events" />
          </TabsContent>
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}
