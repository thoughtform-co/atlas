'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('[LoginModal] Starting authentication...');
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout. Please check your connection and try again.')), 10000);
      });

      const authPromise = signIn(email, password);
      console.log('[LoginModal] Auth promise created, waiting for response...');
      
      const result = await Promise.race([
        authPromise,
        timeoutPromise,
      ]);

      console.log('[LoginModal] Auth result:', result);

      if (result.error) {
        console.error('[LoginModal] Auth failed:', result.error);
        setError(result.error.message);
        setIsLoading(false);
      } else {
        // Auth succeeded - wait a brief moment for auth state to update
        console.log('[LoginModal] Auth succeeded, closing modal...');
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsLoading(false);
        onClose();
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('[LoginModal] Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        padding: '16px',
        background: 'rgba(5, 4, 3, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="relative w-full"
        style={{
          maxWidth: '320px',
          padding: '28px 24px 24px 24px',
          background: '#0A0908',
          border: '1px solid rgba(236, 227, 214, 0.15)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors"
          style={{
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
            color: 'rgba(236, 227, 214, 0.4)',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ECE3D6'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.4)'}
        >
          x
        </button>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#CAA554',
            }}
          >
            Atlas Research
          </span>
          <h2
            style={{
              marginTop: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              color: '#ECE3D6',
            }}
          >
            Authentication
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'rgba(236, 227, 214, 0.4)',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="outline-none transition-colors"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#ECE3D6',
                background: 'rgba(236, 227, 214, 0.04)',
                border: '1px solid rgba(236, 227, 214, 0.1)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.1)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'rgba(236, 227, 214, 0.4)',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="outline-none transition-colors"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#ECE3D6',
                background: 'rgba(236, 227, 214, 0.04)',
                border: '1px solid rgba(236, 227, 214, 0.1)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.1)'}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#C17F59',
                background: 'rgba(193, 127, 89, 0.1)',
                border: '1px solid rgba(193, 127, 89, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full transition-all duration-150"
            style={{
              marginTop: '8px',
              padding: '12px 0',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isLoading ? 'rgba(236, 227, 214, 0.3)' : '#ECE3D6',
              background: isLoading ? 'rgba(202, 165, 84, 0.1)' : 'rgba(202, 165, 84, 0.2)',
              border: '1px solid rgba(202, 165, 84, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'rgba(202, 165, 84, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLoading ? 'rgba(202, 165, 84, 0.1)' : 'rgba(202, 165, 84, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.3)';
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
