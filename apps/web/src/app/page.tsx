'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Status } from '@oxymormon/chg-unified-ds';
import { TextInput } from '@/components/TextInput';

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already logged in (skip if just logged out)
  useEffect(() => {
    // Check URL params on client side
    const urlParams = new URLSearchParams(window.location.search);
    const justLoggedOut = urlParams.get('logout') === 'true';
    
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user info
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', data.userId);

      // Check if Jira is connected
      if (data.jiraConnected) {
        router.push('/dashboard');
      } else {
        // Redirect to Jira OAuth
        window.location.href = data.jiraAuthUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
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

        <form onSubmit={handleLogin}>
          <Field label="Email Address">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </Field>

          {error && (
            <div className="mt-4">
              <Status appearance="red">{error}</Status>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6"
            isDisabled={loading}
          >
            {loading ? 'Signing in...' : 'Continue with Jira'}
          </Button>
        </form>
      </div>
    </div>
  );
}
