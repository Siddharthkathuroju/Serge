"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from 'next-auth/react';

export function Appbar() {
    const { data: session } = useSession();
    return (
        <div className="flex items-center gap-6">
            <Link href="/about" className="text-gray-700 hover:text-blue-700">
                About
            </Link>
            <Link href="/contacts" className="text-gray-700 hover:text-blue-700">
                Contacts
            </Link>
            {session?.user ? (
                <button
                    onClick={() => signOut()}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Sign Out
                </button>
            ) : (
                <button
                    onClick={() => signIn()}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Sign In
                </button>
            )}
        </div>
    );
}