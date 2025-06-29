import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from './core/Card';
import Button from './core/Button';

const EmailVerificationGuard = ({ children }) => {
  const { user, resendVerification, logout } = useAuth();

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verification Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Please verify your email address to access SmartSpend. We've sent a verification link to{' '}
              <strong>{user.email}</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={resendVerification} className="w-full">
              Resend Verification Email
            </Button>
            <Button onClick={logout} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Check your spam folder if you don't see the email in your inbox.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

export default EmailVerificationGuard;