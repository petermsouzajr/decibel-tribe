"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/app/(main)/SessionProvider";
import kyInstance from "@/lib/ky";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeletePostDialog from "@/components/posts/DeletePostDialog";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Group {
  id: string;
  name: string;
}

interface PostModalGroupDropdownProps {
  setSelectedGroup: (groupId: string | null) => void;
}

export default function PostModalGroupDropdown({
  setSelectedGroup,
}: PostModalGroupDropdownProps) {
  const { user } = useSession();
  const pathname = usePathname();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroupState] = useState<string>("Public");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch groups when the user is available
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await kyInstance
          .get(`/api/groups/my-groups`)
          .json<{ groups: Group[]; nextCursor: string | null }>();
        setGroups(response.groups);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    const groupIdFromPath = pathname.split("groups/")[1];
    if (groupIdFromPath && groups.length) {
      const currentGroup = groups.find((group) => group.id === groupIdFromPath);
      if (currentGroup) {
        setSelectedGroupState(currentGroup.name);
        setSelectedGroup(currentGroup.id); // Set the selected group ID
      }
    } else {
      setSelectedGroupState("Public");
      setSelectedGroup(null); // No group, set to null
    }
  }, [pathname, groups, setSelectedGroup]);

  if (loading) {
    return <p>Loading groups...</p>; // Or show a loading spinner
  }

  return (
    <div className="flex items-center justify-start">
      <span className="mr-2 text-lg font-medium">New Post in:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center justify-between space-x-2"
          >
            <span className="text-base">{selectedGroup}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={() => setSelectedGroupState("Public")}>
            Public
          </DropdownMenuItem>
          {groups.map((group) => (
            <DropdownMenuItem
              key={group.id}
              onClick={() => {
                setSelectedGroupState(group.name);
                setSelectedGroup(group.id);
              }}
            >
              {group.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
