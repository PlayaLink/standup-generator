'use client';

import { useEffect, useState } from 'react';

export default function LogoutPage() {
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear all localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setCleared(true);
  }, []);

  return (
    <div className="app-container">
      <div className="app-card" style={{ marginTop: '4rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          {cleared ? '✓ Logged Out' : 'Logging out...'}
        </h1>
        {cleared && (
          <>
            <p className="text-gray-600 mb-6">Your session has been cleared.</p>
            <a 
              href="/" 
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
