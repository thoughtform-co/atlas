'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ParameterForm.module.css';

interface PhaseStateDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const PHASE_STATE_OPTIONS = ['Solid', 'Liminal', 'Spectral', 'Fluctuating', 'Crystallized'];

export function PhaseStateDropdown({
  value,
  onChange,
  placeholder = 'Select phase state...',
}: PhaseStateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        setInputValue('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle input for typing/filtering
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsTyping(false);
      setInputValue('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setIsTyping(false);
    setInputValue('');
  };

  const displayValue = isTyping ? inputValue : value;

  // Filter options based on input
  const filteredOptions = isTyping && inputValue
    ? PHASE_STATE_OPTIONS.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()))
    : PHASE_STATE_OPTIONS;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            className={styles.fieldSelect}
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            style={{
              cursor: 'text',
              paddingRight: '1.5rem',
            }}
          />
          {/* Dropdown arrow */}
          <div
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              fontSize: '0.5rem',
              color: 'rgba(236, 227, 214, 0.3)',
            }}
          >
            ▼
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            background: 'var(--surface-1, #0F0E0C)',
            border: '1px solid rgba(236, 227, 214, 0.08)',
            borderRadius: '2px',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {filteredOptions.map((option) => (
            <div
              key={option}
              style={{
                padding: '0.5rem 0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                color: value === option ? '#CAA554' : 'rgba(236, 227, 214, 0.6)',
                background: value === option ? 'rgba(202, 165, 84, 0.1)' : 'transparent',
                borderBottom: '1px solid rgba(236, 227, 214, 0.05)',
              }}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(202, 165, 84, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = value === option ? 'rgba(202, 165, 84, 0.1)' : 'transparent';
              }}
            >
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
