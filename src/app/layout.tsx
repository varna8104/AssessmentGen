import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Assessment Generator",
  description: "Create engaging assessments quickly and easily",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?display=swap&family=Be+Vietnam+Pro:wght@400;500;700;900&family=Noto+Sans:wght@400;500;700;900"
        />
      </head>
      <body style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }} className="overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}