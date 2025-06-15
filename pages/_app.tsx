import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // This CSS variable can be used in Tailwind config or global CSS
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.variable} font-sans`}> {/* Apply font variable and a base font family */}
      <Component {...pageProps} />
    </main>
  );
}
