import type { Metadata, Viewport } from "next";
import { Caveat, Quicksand, Press_Start_2P, VT323, Chakra_Petch } from "next/font/google";
import { Providers } from "@/shared/components/Providers";
import "./globals.css";

const fontCaveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin-ext", "latin"],
  weight: ["400", "500", "600", "700"],
});

const fontQuicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fontPressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin-ext", "latin"],
  weight: "400",
});

const fontVT323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

const fontChakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hàng Rong - Game Mô Phỏng Bán Hàng Việt Nam",
  description: "Trải nghiệm gánh hàng rong phố cổ Việt Nam sinh động, đồ họa chibi hoài niệm và hệ thống buôn bán chân thực.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${fontCaveat.variable} ${fontQuicksand.variable} ${fontPressStart.variable} ${fontVT323.variable} ${fontChakra.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-[#0F172A] text-slate-100">
        <Providers>

          {children}
        </Providers>
      </body>
    </html>
  );
}
