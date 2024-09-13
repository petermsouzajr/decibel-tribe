"use client";

import { Button } from "@/components/ui/button";
import { UserData } from "@/lib/types";
import { useState } from "react";
import UpdatePasswordDialog from "./UpdatePasswordDialog";

interface UpdatePasswordButtonProps {
  user: UserData;
}

export default function UpdatePasswordButton({
  user,
}: UpdatePasswordButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        Update Password
      </Button>
      <UpdatePasswordDialog
        //@ts-ignore
        user={user}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
