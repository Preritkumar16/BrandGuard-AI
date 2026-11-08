import './globals.css';

export const metadata = {
  title: 'BrandGuard AI',
  description: 'AI-powered brand protection platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}