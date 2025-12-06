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

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      onClose();
      setEmail('');
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        background: 'rgba(5, 4, 3, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="relative w-full max-w-[320px] p-6"
        style={{
          background: '#0A0908',
          border: '1px solid rgba(236, 227, 214, 0.15)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center transition-colors"
          style={{
            color: 'rgba(236, 227, 214, 0.4)',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ECE3D6'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.4)'}
        >
          x
        </button>

        {/* Header */}
        <div className="mb-6">
          <span
            className="tracking-[0.1em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#CAA554' }}
          >
            Atlas Research
          </span>
          <h2
            className="mt-1"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#ECE3D6' }}
          >
            Authentication
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="tracking-[0.05em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.4)' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 outline-none transition-colors"
              style={{
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

          <div className="flex flex-col gap-1.5">
            <label
              className="tracking-[0.05em] uppercase"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.4)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 outline-none transition-colors"
              style={{
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
              className="px-3 py-2"
              style={{
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
            className="w-full py-2.5 mt-2 transition-all duration-150"
            style={{
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
