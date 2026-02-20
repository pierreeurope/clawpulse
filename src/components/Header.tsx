"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-[#21262d] bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-white">ClawPulse</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/community"
                className="text-[#8b949e] hover:text-white transition-colors text-sm"
              >
                Leaderboard
              </Link>
              {session && (
                <Link
                  href="/dashboard"
                  className="text-[#8b949e] hover:text-white transition-colors text-sm"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div>
            {session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-[#c9d1d9] hidden sm:inline">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-[#8b949e] hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
