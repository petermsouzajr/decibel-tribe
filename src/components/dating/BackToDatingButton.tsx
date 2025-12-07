"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

export default function BackToDatingButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push("/dating")}
      className="flex items-center gap-2 mb-4 mt-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dating
    </Button>
  );
}



