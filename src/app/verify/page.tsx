'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email');

  const sendOTP = async () => {
    try {
      setIsSending(true);
      setError('');
      
      const response = await fetch(
        'https://api-server.krontiva.africa/api:uEBBwbSs/reset/user/password/email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!email) {
      router.push('/');
    } else {
      sendOTP(); // Send OTP when component mounts
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const verifyResponse = await fetch(
        'https://api-server.krontiva.africa/api:uEBBwbSs/verify/otp/code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact: email,
            type: true,
            code: otp
          }),
        }
      );

      if (!verifyResponse.ok) {
        throw new Error('Invalid OTP code');
      }

      // Get auth token from localStorage (set during login)
      const authToken = localStorage.getItem('tempAuthToken');
      if (authToken) {
        localStorage.setItem('authToken', authToken); // Set permanent token
        localStorage.removeItem('tempAuthToken'); // Remove temporary token
      }

      router.push('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[360px] space-y-6 p-4 md:p-8">
        <div>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-black">
            Enter Verification Code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 break-words">
            We sent a code to<br/>{email}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              required
              className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18] text-center text-3xl tracking-[0.75em] font-mono"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              maxLength={4}
              autoComplete="one-time-code"
            />
            <p className="text-xs text-center text-gray-500">
              Enter the 4-digit code
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading || otp.length !== 4}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FE5B18] hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify'}
            </button>
            
            <button
              type="button"
              onClick={sendOTP}
              disabled={isSending}
              className="text-[#FE5B18] text-sm font-medium hover:text-[#e54d0e] disabled:opacity-50 py-2"
            >
              {isSending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </span>
              ) : 'Resend Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-[360px] space-y-6 p-4 md:p-8">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-[#FE5B18]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
} 