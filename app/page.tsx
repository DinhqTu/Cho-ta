"use client";

import { useEffect, useRef } from "react";
import { IzakayaExperience } from "@/components/izakaya/izakaya-experience";
import { AuthGuard } from "@/components/auth-guard";

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/assets/media/hom_nay_ban_an_gi.mp3");

    // Thử phát ngay, nếu bị block thì đợi user click
    const playAudio = () => {
      audioRef.current?.play().catch(() => {});
    };

    playAudio();

    // Nếu autoplay bị block, phát khi user click lần đầu
    const handleUserInteraction = () => {
      playAudio();
      document.removeEventListener("click", handleUserInteraction);
    };
    document.addEventListener("click", handleUserInteraction);

    // Cleanup: tắt nhạc khi rời trang
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener("click", handleUserInteraction);
    };
  }, []);

  return (
    <AuthGuard>
      <IzakayaExperience />
    </AuthGuard>
  );
}
