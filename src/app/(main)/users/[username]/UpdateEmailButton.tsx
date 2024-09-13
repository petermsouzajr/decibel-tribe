"use client";

import { Button } from "@/components/ui/button";
import { UserData } from "@/lib/types";
import { useState } from "react";
import UpdateEmailDialog from "./UpdateEmailDialog";

interface UpdateEmailButtonProps {
  user: UserData;
}

export default function UpdateEmailButton({ user }: UpdateEmailButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        Update Email
      </Button>
      <UpdateEmailDialog
        //@ts-ignore
        user={user}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
