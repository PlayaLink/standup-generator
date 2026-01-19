'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Avatar, Button, Field, Status } from '@oxymormon/chg-unified-ds';
import { Select, type Key } from '@/components/Select';

interface Project {
  id: string;
  name: string;
  key: string;
}

interface Board {
  id: number;
  name: string;
  type: string;
}

const daysOptions = [
  { id: '7', name: 'Last 7 days' },
  { id: '14', name: 'Last 14 days' },
  { id: '30', name: 'Last 30 days' },
];

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Key | null>('MC');
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Key | null>(null);
  const [daysBack, setDaysBack] = useState<Key>('7');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [error, setError] = useState('');
  const [jiraConnected, setJiraConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

    // Fetch projects and user profile
    fetchProjects(id);
    fetchUserProfile(id);
  }, [router]);

  const fetchUserProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/user-profile?userId=${id}`);
      const data = await response.json();
      if (response.ok && data.profile) {
        if (data.profile.avatarUrl) {
          setUserAvatar(data.profile.avatarUrl);
        }
        if (data.profile.displayName) {
          setUserName(data.profile.displayName);
        }
      }
    } catch (err) {
      // Silently fail - profile is not critical
      console.error('Failed to fetch user profile:', err);
    }
  };

  // Fetch boards when project is selected
  useEffect(() => {
    if (selectedProject && userId) {
      const project = projects.find((p) => p.key === selectedProject);
      if (project) {
        fetchBoardsForProject(project.key);
      }
    } else {
      setBoards([]);
      setSelectedBoard(null);
    }
  }, [selectedProject, userId, projects]);

  const fetchProjects = async (id: string) => {
    setLoadingProjects(true);
    setError('');
    try {
      const response = await fetch(`/api/boards?userId=${id}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.needsAuth) {
          window.location.href = data.jiraAuthUrl;
          return;
        }
        throw new Error(data.error || 'Failed to fetch projects');
      }

      if (!data.boards || data.boards.length === 0) {
        setError('No Jira projects found. Make sure you have access to at least one project.');
      }

      setProjects(data.boards || []);
      setJiraConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchBoardsForProject = async (projectKey: string) => {
    setLoadingBoards(true);
    setSelectedBoard(null);
    try {
      const response = await fetch(
        `/api/boards-for-project?userId=${userId}&projectKey=${projectKey}`
      );
      const data = await response.json();

      if (!response.ok) {
        if (data.needsAuth) {
          window.location.href = data.jiraAuthUrl;
          return;
        }
        throw new Error(data.error || 'Failed to fetch boards');
      }

      setBoards(data.boards);
      
      // Default to "Cred UX Updates" board if available
      const defaultBoard = data.boards.find((b: Board) => b.name === 'Cred UX Updates');
      if (defaultBoard) {
        setSelectedBoard(String(defaultBoard.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoadingBoards(false);
    }
  };

  const generateReport = async () => {
    if (!userId || !selectedProject) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectKey: selectedProject,
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
    window.location.href = '/?logout=true';
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

  /**
   * Convert markdown to HTML for rich text clipboard
   */
  const formatReportAsHtml = (text: string): string => {
    return text
      // Convert markdown links [text](url) to HTML anchor tags
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Convert ## headers to bold
      .replace(/^## (.+)$/gm, '<strong>$1</strong>')
      // Convert ### headers to bold
      .replace(/^### (.+)$/gm, '<strong>$1</strong>')
      // Convert bullet points
      .replace(/^- (.+)$/gm, '• $1')
      // Convert newlines to <br> for HTML
      .replace(/\n/g, '<br>');
  };

  const copyReport = async () => {
    if (report) {
      const html = formatReportAsHtml(report);
      const plainText = report
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Strip URLs, keep text
        .replace(/^## /gm, '')
        .replace(/^### /gm, '')
        .replace(/^- /gm, '• ');

      try {
        // Copy as rich text (HTML) so hyperlinks are preserved
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback to plain text if rich text copy fails
        navigator.clipboard.writeText(plainText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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

  const projectOptions = projects.map((p) => ({ id: p.key, name: `${p.name} (${p.key})` }));

  const boardOptions = [
    { id: '', name: 'All boards' },
    ...boards.map((b) => ({ id: String(b.id), name: b.name })),
  ];

  return (
    <div className="app-container">
      <div className="app-card">
        <div className="app-header">
          <div>
            <h1>Standup Generator</h1>
            <p className="text-sm text-gray-500" data-referenceid="app-subtitle">
              Generate standup reports from recent activity on your Jira tickets.
            </p>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              onPress={() => setUserMenuOpen(!userMenuOpen)}
              iconLeading={
                <Avatar
                  src={userAvatar || undefined}
                  name={userName || userEmail || ''}
                  size="sm"
                  data-referenceid="user-avatar"
                />
              }
              iconTrailing={({ className }: { className?: string }) => (
                <svg 
                  className={`${className} transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              data-referenceid="user-menu-button"
            >
              {userName || userEmail}
            </Button>
            
            {userMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setUserMenuOpen(false)}
                  data-referenceid="user-menu-backdrop"
                />
                <div 
                  className="absolute right-0 top-full mt-2 w-[250px] rounded-4 border border-gray-300 bg-base-white py-8 shadow-lg z-20"
                  data-referenceid="user-menu-dropdown"
                >
                  <div className="px-16 py-8 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onPress={handleLogout}
                    className="w-full justify-start"
                    iconLeading={({ className }: { className?: string }) => (
                      <svg 
                        className={className}
                        viewBox="0 0 24 24" 
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    )}
                    data-referenceid="logout-button"
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="app-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-12">Generate Report</h2>

        {loadingProjects ? (
          <div className="app-loading">
            <div className="app-spinner"></div>
            Loading projects...
          </div>
        ) : (
          <div className="space-y-12">
            <Field label="Jira Project">
              <Select
                options={projectOptions}
                selectedKey={selectedProject ?? ''}
                onSelectionChange={(key) => setSelectedProject(key === '' ? null : key)}
                placeholder="Select a project"
              />
            </Field>

            {selectedProject && (
              <Field label="Board (optional)">
                {loadingBoards ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                    <div className="app-spinner w-4 h-4"></div>
                    Loading boards...
                  </div>
                ) : (
                  <Select
                    options={boardOptions}
                    selectedKey={selectedBoard ?? ''}
                    onSelectionChange={(key) => setSelectedBoard(key === '' ? null : key)}
                    placeholder="All boards"
                  />
                )}
              </Field>
            )}

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
              isDisabled={loading || !selectedProject}
              className="w-full mt-12"
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
              <Button
                variant="primary"
                size="sm"
                onPress={copyReport}
                data-referenceid="copy-report"
              >
                {copied ? 'Copied!' : 'Copy'}
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
