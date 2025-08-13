import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CartProvider } from "@/contexts/CartContext"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ChatProvider } from "@/contexts/ChatContext"

export const metadata: Metadata = {
  title: "Store name",
  description: "Store description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <TooltipProvider>
            <CartProvider>
              <ChatProvider>
                <Toaster />
                <Sonner />
                {children}
              </ChatProvider>
            </CartProvider>
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
