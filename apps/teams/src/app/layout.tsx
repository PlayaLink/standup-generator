import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weekly Standup Generator - Teams',
  description: 'Generate weekly standup reports from your Jira tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
