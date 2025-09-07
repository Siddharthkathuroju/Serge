"use client";
import { useSession } from "next-auth/react";

import TextRemovalUpload from "./TextRemovalUpload";
import ImageCompressionUpload from "./ImageCompressionUpload";
import ImageToTextUpload from "./ImageToTextUpload";

export default function Homepage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
        <span className="text-blue-700 text-2xl font-bold animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col items-center justify-center">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name || "Profile"}
          className="w-40 h-40 rounded-full mb-8 shadow-lg border-4 border-blue-200 object-cover"
        />
      )}
      <h1 className="text-6xl font-extrabold text-blue-800 mb-6 drop-shadow text-center">
        Welcome, {session.user.name || "User"}!
      </h1>
      <p className="text-2xl text-gray-700 mb-10 text-center max-w-2xl">
        We're glad to have you here.
        <br />
        <span className="text-blue-600 font-semibold">
          Enjoy exploring Serge!
          A tool for Text removal and Image Compression
        </span>
      </p>
      {/* Two independent uploaders for two features */}
      <div className="mt-16 mb-8 w-full flex flex-col md:flex-row gap-8 justify-center items-start">
        <TextRemovalUpload />
        <ImageCompressionUpload />
        <ImageToTextUpload />
      </div>
      <footer className="absolute bottom-0 left-0 w-full text-center text-gray-400 py-4 text-base bg-transparent">
        
        
      </footer>
    </main>
  );
}