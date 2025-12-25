"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type TourSlide = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  bullets: string[];
};

export default function WhatsInsideTour({
  buttonLabel = "What\u2019s inside?",
}: {
  buttonLabel?: string;
}) {
  const slides: TourSlide[] = useMemo(
    () => [
      {
        imageSrc: "/tour/01-profile.png",
        imageAlt: "Tour slide: Create your profile",
        title: "Become discoverable!",
        bullets: [
          "Get discovered by instrument",
          "Get hired by job skill",
          "make your calendar public or private"
        ],
      },
      {
        imageSrc: "/tour/02-showcase.png",
        imageAlt: "Tour slide: Showcase your talent",
        title: "Showcase Your Talent",
        bullets: [
          "Add instruments you play",
          "List job skills (merchandising, lighting, recording, etc.)",
          "Get discovered by instrument or skill",
        ],
      },
      {
        imageSrc: "/tour/03-events.png",
        imageAlt: "Tour slide: Find events and collaborate",
        title: "Find Events & Collaborate",
        bullets: [
          "Discover local shows and sessions",
          "Create or join events",
          "Create public or private events",
        ],
      },
      {
        imageSrc: "/tour/04-dating.png",
        imageAlt: "Tour slide: Optional dating mode",
        title: "Find Love Through Music",
        bullets: ["Optional dating mode", "Safe, only verified profiles", "All premium dating features are FREE"],
      },
      {
        imageSrc: "/tour/01-profile.png",
        imageAlt: "Tour slide: Get started",
        title: "Connect with musicians and stay human",
        bullets: ["Create your profile", "Start connecting today", "Explore events, gigs, and dating"],
      },
    ],
    [],
  );

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const lastIdx = slides.length - 1;
  const slide = slides[idx]!;

  const goPrev = () => setIdx((i) => (i === 0 ? 0 : i - 1));
  const goNext = () => setIdx((i) => (i === lastIdx ? lastIdx : i + 1));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, lastIdx]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-40 h-20 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-lg">
        {buttonLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setIdx(0);
        }}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative bg-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full p-2 hover:bg-gray-100"
              aria-label="Close tour"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[420px] bg-gradient-to-br from-purple-50 to-blue-50">
                <Image src={slide.imageSrc} alt={slide.imageAlt} fill className="object-contain p-6" priority />
              </div>

              <div className="p-6 md:p-8 flex flex-col">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{slide.title}</h2>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {slide.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Skip tour
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goPrev} disabled={idx === 0} aria-label="Previous slide">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goNext} disabled={idx === lastIdx} aria-label="Next slide">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2" aria-label="Slide navigation">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIdx(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                          i === idx ? "bg-purple-600" : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>

                  {idx === lastIdx ? (
                    <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                      <Link href="/signup" onClick={() => setOpen(false)}>
                        Get started
                      </Link>
                    </Button>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {idx + 1}/{slides.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

