"use client";

import GroupList from "./GroupList";
import GroupActivityFeed from "./GroupActivityFeed";
import { useState } from "react";
import { Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-2xl font-bold">Groups</h1>
          <Button
            onClick={openModal}
            className="h-8 bg-primary text-foreground"
          >
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        </div>
        <div className="m-8">
          <GroupList />
        </div>
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
        <GroupActivityFeed />
      </div>
      <CreateGroupModal open={isModalOpen} onClose={closeModal} />
    </main>
  );
}
