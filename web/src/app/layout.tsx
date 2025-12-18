import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ResizableLayout } from "@/components/ResizableLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CV Tailoring Agent",
  description: "AI-powered CV tailoring tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ResizableLayout>
          {children}
        </ResizableLayout>

        {/* Remove Next.js dev badge */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove Next.js dev badge on load
                function removeDevBadge() {
                  const selectors = [
                    '#nextjs-portal',
                    '#nextjs-dev-tools',
                    '[data-nextjs-dev-tools]',
                    '[data-nextjs-portal]',
                    '.__next-dev-tools',
                    '.nextjs-dev-tools',
                    '.next-dev-tools',
                    '.dev-tools',
                    '.dev-badge',
                    '[aria-label*="Next.js"]',
                    '[aria-label*="Development"]',
                    '#nextjs-dev-overlay'
                  ];

                  selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                      el.style.display = 'none';
                      el.style.visibility = 'hidden';
                      el.style.opacity = '0';
                      el.remove();
                    });
                  });

                  // Also remove any fixed positioned elements in bottom-left
                  const allDivs = document.querySelectorAll('div[style*="position: fixed"]');
                  allDivs.forEach(div => {
                    const style = div.getAttribute('style') || '';
                    if (style.includes('bottom') && style.includes('left') && style.includes('z-index')) {
                      div.style.display = 'none';
                      div.remove();
                    }
                  });
                }

                // Run immediately and also on DOM changes
                removeDevBadge();
                const observer = new MutationObserver(removeDevBadge);
                observer.observe(document.body, { childList: true, subtree: true });

                // Run again after a short delay
                setTimeout(removeDevBadge, 1000);
                setTimeout(removeDevBadge, 3000);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
