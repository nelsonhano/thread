import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import TopBar from "@/components/shared/TopBar";
import LeftSideBar from "@/components/shared/LeftSideBar";
import RightSideBar from "@/components/shared/RightSideBar";
import ButtomBar from "@/components/shared/ButtomBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Threads',
  description: 'A Next.js 13 Meta Threads Application',
  icons: {
    icon: '/assets/logo.svg'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      // appearance={{
      //   baseTheme: dark,
      // }}
    >
      <html lang='en'>
        <body className={inter.className}>
          <TopBar />

          <main className='flex flex-row'>
            <LeftSideBar />
            <section className='main-container'>
              <div className='w-full max-w-4xl'>{children}</div>
            </section>
            <RightSideBar />
          </main>

          <ButtomBar />
        </body>
      </html>
    </ClerkProvider>
  );
}
