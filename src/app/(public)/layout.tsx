import type { ReactNode } from "react";
import { Roboto, Open_Sans } from "next/font/google";
import Script from "next/script";
import "./landing.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`landing-root ${roboto.variable} ${openSans.variable}`}>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-XBJN2BKNKF"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XBJN2BKNKF');
      `}</Script>
      {children}
    </div>
  );
}
