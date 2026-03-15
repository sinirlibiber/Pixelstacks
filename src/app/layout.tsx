import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

const URL = process.env.NEXT_PUBLIC_URL || "https://skillswap.xyz";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SkillSwap — Decentralized Freelance on Base",
    description: "Hire talent or find work with trustless escrow payments on Base blockchain.",
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${URL}/og-image.png`,
        button: {
          title: "Open SkillSwap",
          action: {
            type: "launch_frame",
            name: "SkillSwap",
            url: URL,
            splashImageUrl: `${URL}/splash.png`,
            splashBackgroundColor: "#0A0A0F",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
