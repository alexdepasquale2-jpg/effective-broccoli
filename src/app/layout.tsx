import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Polymath Academy — Language, AI Coding, Automation & Math",
  description:
    "An interactive polymath educational platform teaching natural languages, AI prompting & coding, systems automation, and visual mathematics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/60 py-8 bg-card/40 mt-16 text-center text-xs text-muted-foreground">
          <div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Polymath Academy — Built for curious minds, AI builders, and polyglots.</p>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span>Natural Languages</span>
              <span>•</span>
              <span>AI Coding</span>
              <span>•</span>
              <span>Automation</span>
              <span>•</span>
              <span>Simple Math</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
