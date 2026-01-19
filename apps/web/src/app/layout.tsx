import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Standup Generator',
  description: 'Generate weekly standup reports from your Jira tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body data-theme="comphealth">{children}</body>
    </html>
  );
}
