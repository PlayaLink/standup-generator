'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Status } from '@oxymormon/chg-unified-ds';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already logged in (skip if just logged out)
  useEffect(() => {
    // Check URL params on client side
    const urlParams = new URLSearchParams(window.location.search);
    const justLoggedOut = urlParams.get('logout') === 'true';
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear the error param from URL
      window.history.replaceState({}, '', '/');
      return;
    }

    if (justLoggedOut) {
      // Clear the logout param from URL
      window.history.replaceState({}, '', '/');
      return;
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Get the OAuth URL from the API
      const response = await fetch('/api/auth/login');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate login');
      }

      // Store the state in sessionStorage for CSRF verification (optional client-side check)
      sessionStorage.setItem('jira_oauth_state', data.state);

      // Redirect to Jira OAuth
      window.location.href = data.jiraAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-[2rem] py-[2rem]">
      <div className="bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] px-[1.5rem] py-[1.5rem] mb-[1.5rem] mt-[4rem] max-w-[400px] mx-auto">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">Standup Generator</h1>
        <p className="text-center text-gray-600 mb-8">
          Generate weekly standup reports from your Jira tickets
        </p>

        {error && (
          <div className="mt-4">
            <Status appearance="red">{error}</Status>
          </div>
        )}

        <Button
          variant="primary"
          className="w-full mt-6"
          isDisabled={loading}
          onPress={handleLogin}
        >
          {loading ? 'Signing in...' : 'Login with Jira'}
        </Button>
      </div>
    </div>
  );
}
