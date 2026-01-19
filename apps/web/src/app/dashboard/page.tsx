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

interface PastReport {
  id: string;
  date: string;
  projectKey: string;
  boardName: string | null;
  report: string;
}

const daysOptions = [
  { id: '7', name: 'Last 7 days' },
  { id: '14', name: 'Last 14 days' },
  { id: '30', name: 'Last 30 days' },
];

type TabId = 'new-report' | 'past-reports' | 'formatting';

const FORMATTING_INSTRUCTIONS = `You are a helpful assistant that generates weekly standup reports from Jira ticket data.

Format requirements:
- Start directly with "## Last Week" (no title header)
- Ticket format: [PROJ-123](https://jira.example.com/browse/PROJ-123) - Concise Name
- Each ticket gets 1-3 bullet points describing work done or planned
- Organize into three sections:

## Last Week
Tickets with activity in the past 7 days. Focus on what was accomplished.

## This Week
"In Progress" and "To Do" tickets. Focus on planned actions. Include due dates when applicable. Put the due date in parentheses after the ticket name.

## Blockers
Dependencies or items you're waiting on. If none, just say "None"
- If a blocker is related to a specific ticket, use the same format: [PROJ-123](url) - Blocker description
- If a blocker is general (not ticket-specific), just describe it without a ticket link

Additional formatting:
- Keep ticket names to 3-5 words that capture the essence
- Use relative due dates: "Due tomorrow", "Due Friday", "Due next Tuesday", "Due 02/01"
- Be concise - 1-3 bullet points per ticket
- If a ticket has recent comments, incorporate relevant context`;

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
  const [activeTab, setActiveTab] = useState<TabId>('new-report');
  const [pastReports, setPastReports] = useState<PastReport[]>([]);
  const [selectedPastReport, setSelectedPastReport] = useState<PastReport | null>(null);
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

    // Load past reports from localStorage
    const savedReports = localStorage.getItem('pastReports');
    if (savedReports) {
      try {
        setPastReports(JSON.parse(savedReports));
      } catch {
        // Invalid JSON, ignore
      }
    }

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

      // Save to past reports
      const boardName = selectedBoard 
        ? boards.find(b => String(b.id) === selectedBoard)?.name || null
        : null;
      
      const newReport: PastReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        projectKey: String(selectedProject),
        boardName,
        report: data.report,
      };

      const updatedReports = [newReport, ...pastReports].slice(0, 20); // Keep last 20 reports
      setPastReports(updatedReports);
      localStorage.setItem('pastReports', JSON.stringify(updatedReports));
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

  const deletePastReport = (reportId: string) => {
    const updatedReports = pastReports.filter(r => r.id !== reportId);
    setPastReports(updatedReports);
    localStorage.setItem('pastReports', JSON.stringify(updatedReports));
    if (selectedPastReport?.id === reportId) {
      setSelectedPastReport(null);
    }
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
      <div className="max-w-[800px] mx-auto px-[2rem] py-[2rem]">
        <div className="flex items-center gap-[0.5rem] text-gray-600">
          <div className="w-[16px] h-[16px] border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'new-report', label: 'New Report' },
    { id: 'past-reports', label: 'Past Reports' },
    { id: 'formatting', label: 'Formatting' },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-[2rem] py-[2rem]">
      {/* Header */}
      <div className="bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] px-[1.5rem] py-[1.5rem] mb-[1.5rem]">
        <div className="flex justify-between items-center mb-[1rem]">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 m-0">Standup Generator</h1>
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

      {/* Tabs */}
      <div className="bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-[1.5rem]">
        {/* Tab Navigation */}
        <nav className="flex border-b border-gray-200" data-referenceid="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-[1.5rem] py-[1rem] text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-referenceid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="px-[1.5rem] py-[1.5rem]">
          {/* New Report Tab */}
          {activeTab === 'new-report' && (
            <div data-referenceid="new-report-tab">
              {loadingProjects ? (
                <div className="flex items-center gap-[0.5rem] text-gray-600">
                  <div className="w-[16px] h-[16px] border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
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
                        <div className="flex items-center gap-[0.5rem] py-2 text-sm text-gray-500">
                          <div className="w-[16px] h-[16px] border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
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
                  <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-[1.5rem] py-[1.5rem] mt-[1rem] report-content">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Reports Tab */}
          {activeTab === 'past-reports' && (
            <div data-referenceid="past-reports-tab">
              {pastReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No past reports yet.</p>
                  <p className="text-sm mt-2">Generate a report to see it here.</p>
                </div>
              ) : (
                <div className="flex gap-6">
                  {/* Report List */}
                  <div className="w-1/3 border-r border-gray-200 pr-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Reports</h3>
                    <div className="space-y-2">
                      {pastReports.map((pastReport) => (
                        <div
                          key={pastReport.id}
                          className={`p-3 rounded-[6px] cursor-pointer transition-colors ${
                            selectedPastReport?.id === pastReport.id
                              ? 'bg-brand-50 border border-brand-200'
                              : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                          }`}
                          onClick={() => setSelectedPastReport(pastReport)}
                          data-referenceid="past-report-item"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {pastReport.projectKey}
                                {pastReport.boardName && (
                                  <span className="text-gray-500"> / {pastReport.boardName}</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(pastReport.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePastReport(pastReport.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                              data-referenceid="delete-report"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Report Preview */}
                  <div className="flex-1">
                    {selectedPastReport ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700">Report Preview</h3>
                          <Button
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              setReport(selectedPastReport.report);
                              copyReport();
                            }}
                            data-referenceid="copy-past-report"
                          >
                            Copy
                          </Button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-[1.5rem] py-[1.5rem] report-content">
                          <ReactMarkdown>{selectedPastReport.report}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p>Select a report to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formatting Tab */}
          {activeTab === 'formatting' && (
            <div data-referenceid="formatting-tab">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Report Formatting Instructions</h3>
                <p className="text-sm text-gray-500 mt-1">
                  These are the instructions given to Claude when generating your standup report.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-[1.5rem] py-[1.5rem]">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {FORMATTING_INSTRUCTIONS}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
