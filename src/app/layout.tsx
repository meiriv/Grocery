import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/hooks/useSettings';
import { TranslationProvider } from '@/hooks/useTranslation';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Smart Grocery Companion',
  description: 'Smart grocery list management with AI categorization',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Grocery',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {/* Apply the stored theme and text direction before first paint so the
            app does not flash the wrong colours or direction on start-up. */}
        <Script id="app-appearance" strategy="beforeInteractive">
          {`(function(){try{var s=JSON.parse(localStorage.getItem('grocery-settings')||'{}');var d=document.documentElement;var t=s.theme||'dark';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',dark);var lang=s.language==='he'?'he':'en';d.setAttribute('lang',lang);d.setAttribute('dir',lang==='he'?'rtl':'ltr');}catch(e){}})();`}
        </Script>
        <SettingsProvider>
          <TranslationProvider>
            {children}
            <ServiceWorkerRegistration />
          </TranslationProvider>
        </SettingsProvider>
        <Script
          src="https://serviceagent-production.up.railway.app/widget/service-agent-widget.js"
          data-token="widget_3b09ef395a16332e894d1952c0e6d205"
          data-position="bottom-right"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

