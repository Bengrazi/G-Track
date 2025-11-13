export const metadata = {
  title: "Daily Tracker v2",
  description: "Local-first daily tracker with light AI",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-slate-50 text-slate-800">
        <div className="mx-auto max-w-xl p-4 md:p-6">{children}</div>
        <script dangerouslySetInnerHTML={{__html:`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
          }
        `}} />
      </body>
    </html>
  );
}
