import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawPulse — AI Agent Activity Dashboard",
  description:
    "Visualize your OpenClaw agent's activity. Token usage, model breakdown, tool stats, and more.",
  openGraph: {
    title: "ClawPulse — AI Agent Activity Dashboard",
    description: "GitHub-style contribution graph for AI agents. Powered by OpenClaw.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#010409] text-white antialiased font-['Inter',system-ui,sans-serif]">
        {children}
      </body>
    </html>
  );
}
