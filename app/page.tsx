"use client";
import Image from "next/image";
import { SessionProvider } from "next-auth/react";
import { Providers } from "../Providers";
import { Appbar } from "./components/Appbar";
import Footer from "./components/Footer";
import Homepage from "./components/Homepage";

export default function Home() {
  return (
    <SessionProvider>
      <Providers>
        <MainContent />
      </Providers>
    </SessionProvider>
  );
}

import { useSession } from "next-auth/react";

function MainContent() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col">
      <header className="shadow bg-white py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/favicon.ico" alt="Logo" width={50} height={60} />
          <span className="text-xl font-bold text-blue-700"></span>
        </div>
        <Appbar />
      </header>
      <section className="flex-1 flex flex-col items-center justify-center w-full">
        {status === "authenticated" ? (
          <Homepage />
        ) : (
          <>
            <h1 className="text-4xl font-extrabold text-blue-800 mb-4">
              Welcome to Serge!
              A tool for Text removal and Image Compression
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center max-w-xl">
              This is your starting point. Sign in to get started with your personalized experience.
            </p>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
