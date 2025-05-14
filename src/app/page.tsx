'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const router = useRouter();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authenticate the user with phone number
      const loginResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/login/phoneNumber/rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Invalid phone number');
      }

      // Show OTP input after successful phone number verification
      setShowOtpInput(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verify OTP
      const verifyResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/verify/otp/code/phoneNumber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          OTP: parseInt(otp),
          contact: phoneNumber
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Invalid OTP code');
      }

      const verifyData = await verifyResponse.json();
      
      if (!verifyData.otpValidate) {
        throw new Error('Invalid OTP code');
      }

      // Get auth token after successful OTP verification
      const loginResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/login/phoneNumber/rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Authentication failed');
      }

      const { authToken } = await loginResponse.json();
      
      // Store token
      localStorage.setItem('authToken', authToken);
      
      router.push('/orders');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/reset/user/password/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: phoneNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      alert('OTP resent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8 p-4 md:p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-black">
            {showOtpInput ? 'Enter Verification Code' : 'Sign in to your account'}
          </h2>
          {showOtpInput && (
            <p className="mt-2 text-center text-sm text-gray-600">
              We sent a code to {phoneNumber}
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={showOtpInput ? handleOtpSubmit : handlePhoneSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!showOtpInput ? (
              <div>
                <label htmlFor="phoneNumber" className="sr-only">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18]"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={4}
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18] text-center text-2xl tracking-widest"
                  placeholder="••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="mt-2 text-sm text-[#FE5B18] hover:text-[#e54d0e] disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FE5B18] hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {showOtpInput ? 'Verifying...' : 'Signing in...'}
                </span>
              ) : showOtpInput ? 'Verify' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
