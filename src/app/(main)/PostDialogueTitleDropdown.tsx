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
import { ChevronDown } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

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
        setSelectedGroup(currentGroup.id);
      }
    } else {
      setSelectedGroupState("Public");
      setSelectedGroup(null);
    }
  }, [pathname, groups, setSelectedGroup]);

  if (loading) {
    return <p>Loading groups...</p>;
  }

  return (
    <div className="flex items-center justify-start">
      <span className="mr-2 text-lg font-medium">New Post in:</span>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center justify-between space-x-2"
          >
            <span className="text-base">{selectedGroup}</span>
            {isOpen ? "" : <ChevronDown />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="text-md w-48">
          <DropdownMenuItem
            className="text-md cursor-pointer"
            onClick={() => {
              setSelectedGroupState("Public");
              setSelectedGroup(null);
            }}
          >
            Public
          </DropdownMenuItem>
          {groups.length > 0 && (
            <div className="flex justify-center px-2 py-1 text-muted-foreground">
              Your Groups
            </div>
          )}

          {groups.map((group) => (
            <DropdownMenuItem
              className="text-md cursor-pointer"
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
