"use client"; // Mark as a Client Component

import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchField from "@/components/SearchField";
import { useSearchParams } from "next/navigation";

// Note: generateMetadata still works in a Client Component file,
// but it runs on the server.
// interface PageProps {
//   searchParams: { q: string };
// }
// export function generateMetadata({ searchParams: { q } }: PageProps): Metadata {
//   return !q ? { title: "Search" } : { title: `Search results for "${q}"` };
// }
// For simplicity with 'use client', let's remove server-side metadata generation for now.
// It can be added back if needed using different patterns.

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "users/posts"; // Keep this for Tabs default value for now

  return (
    <main className="p-5">
      <h1 className="text-center text-3xl font-bold">Search</h1>
      <div className="mx-auto my-3 max-w-xl">
        <SearchField />
      </div>
      <Tabs defaultValue={type} className="mx-auto mt-5 max-w-2xl">
        <TabsList className="w-full">
          <TabsTrigger value="users/posts" className="flex-1">
            Users/Posts
          </TabsTrigger>
          <TabsTrigger value="instruments/skills" className="flex-1">
            Instruments/Skills
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1">
            Events
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users/posts">
          <SearchResults query={q} />
        </TabsContent>
        <TabsContent value="instruments/skills">
          <SearchResults query={q} />
        </TabsContent>
        <TabsContent value="events">
          <SearchResults query={q} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
