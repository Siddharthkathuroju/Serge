"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white shadow mt-8 py-4 px-8 flex flex-col sm:flex-row items-center justify-between text-gray-500 text-sm">
      <div className="mb-2 sm:mb-0">
        &copy; {new Date().getFullYear()} Serge. All rights reserved.
      </div>
      <div className="flex gap-4">
        <Link href="/about" className="hover:text-blue-700">
          About
        </Link>
        <Link href="/contacts" className="hover:text-blue-700">
          Contacts
        </Link>
      </div>
    </footer>
  )};