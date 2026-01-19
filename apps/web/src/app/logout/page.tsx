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
    <div className="max-w-[800px] mx-auto px-[2rem] py-[2rem]">
      <div className="bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] px-[1.5rem] py-[1.5rem] mb-[1.5rem] mt-[4rem] max-w-[400px] mx-auto text-center">
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
