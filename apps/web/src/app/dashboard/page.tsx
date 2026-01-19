'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Button, Field, Status, DotStatus } from '@oxymormon/chg-unified-ds';
import { Select, type Key } from '@/components/Select';

interface Board {
  id: number;
  name: string;
}

const daysOptions = [
  { id: '7', name: 'Last 7 days' },
  { id: '14', name: 'Last 14 days' },
  { id: '30', name: 'Last 30 days' },
];

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Key | null>(null);
  const [daysBack, setDaysBack] = useState<Key>('7');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [error, setError] = useState('');
  const [jiraConnected, setJiraConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const id = localStorage.getItem('userId');

    if (!email || !id) {
      router.push('/');
      return;
    }

    setUserEmail(email);
    setUserId(id);

    // Fetch boards
    fetchBoards(id);
  }, [router]);

  const fetchBoards = async (id: string) => {
    try {
      const response = await fetch(`/api/boards?userId=${id}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.needsAuth) {
          // Redirect to Jira auth
          window.location.href = data.jiraAuthUrl;
          return;
        }
        throw new Error(data.error || 'Failed to fetch boards');
      }

      setBoards(data.boards);
      setJiraConnected(true);

      // Select first board by default
      if (data.boards.length > 0) {
        setSelectedBoard(data.boards[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoadingBoards(false);
    }
  };

  const generateReport = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          boardId: selectedBoard ? Number(selectedBoard) : undefined,
          daysBack: Number(daysBack),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    router.push('/');
  };

  const handleDisconnectJira = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/disconnect-jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Refresh the page to trigger re-authentication
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to disconnect Jira:', err);
    }
  };

  const copyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!userEmail) {
    return (
      <div className="app-container">
        <div className="app-loading">
          <div className="app-spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  const boardOptions = [
    { id: '', name: 'All boards' },
    ...boards.map((b) => ({ id: String(b.id), name: b.name })),
  ];

  return (
    <div className="app-container">
      <div className="app-card">
        <div className="app-header">
          <h1>Standup Generator</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DotStatus appearance={jiraConnected ? 'green' : 'red'} />
              <span className="text-sm text-gray-600">
                {jiraConnected ? 'Jira Connected' : 'Jira Disconnected'}
              </span>
              {jiraConnected && (
                <Button variant="outline" size="sm" onPress={handleDisconnectJira}>
                  Reconnect Jira
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" onPress={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        <p className="user-email">Logged in as: {userEmail}</p>
      </div>

      <div className="app-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>

        {loadingBoards ? (
          <div className="app-loading">
            <div className="app-spinner"></div>
            Loading boards...
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Jira Board (optional)">
              <Select
                options={boardOptions}
                selectedKey={selectedBoard ?? ''}
                onSelectionChange={(key) => setSelectedBoard(key === '' ? null : key)}
                placeholder="All boards"
              />
            </Field>

            <Field label="Days to look back">
              <Select
                options={daysOptions}
                selectedKey={daysBack}
                onSelectionChange={(key) => setDaysBack(key ?? '7')}
              />
            </Field>

            <Button
              variant="primary"
              onPress={generateReport}
              isDisabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Standup Report'}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <Status appearance="red">{error}</Status>
          </div>
        )}

        {report && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Your Standup Report</h2>
              <Button variant="outline" size="sm" onPress={copyReport}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
            <div className="app-report">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
