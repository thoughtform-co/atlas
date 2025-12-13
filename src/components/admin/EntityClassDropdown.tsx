'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ParameterForm.module.css';

interface EntityClassDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddNew: () => void;
  onEdit: (className: string) => void;
  onEnterNewClass?: (className: string) => void;
  placeholder?: string;
}

export function EntityClassDropdown({
  value,
  options,
  onChange,
  onAddNew,
  onEdit,
  onEnterNewClass,
  placeholder = 'Select class...',
}: EntityClassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
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

  // Handle input for typing new classes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);
    onChange(newValue);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !options.includes(inputValue.trim())) {
      e.preventDefault();
      const newClass = inputValue.trim();
      onChange(newClass);
      setIsTyping(false);
      setInputValue('');
      setIsOpen(false);
      // Notify parent to add the new class to the list
      if (onEnterNewClass) {
        onEnterNewClass(newClass);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsTyping(false);
      setInputValue('');
      onChange('');
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

  const displayValue = isTyping ? inputValue : (options.includes(value) ? value : '');

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
            onClick={() => setIsOpen(!isOpen)}
          >
            ▼
          </div>
        </div>
        {/* Hover edit button */}
        {value && options.includes(value) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(value);
            }}
            style={{
              background: hoveredOption === value ? 'rgba(202, 165, 84, 0.2)' : 'transparent',
              border: '1px solid rgba(202, 165, 84, 0.3)',
              color: '#CAA554',
              padding: '0.4rem 0.5rem',
              fontSize: '0.5rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              borderRadius: '2px',
              opacity: hoveredOption === value ? 1 : 0,
              transition: 'opacity 0.15s ease',
              pointerEvents: hoveredOption === value ? 'auto' : 'none',
              whiteSpace: 'nowrap',
            }}
            title="Edit class name"
            onMouseEnter={() => setHoveredOption(value)}
            onMouseLeave={() => setHoveredOption(null)}
          >
            ✎
          </button>
        )}
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
          {options.length === 0 ? (
            <div
              style={{
                padding: '0.5rem 0.625rem',
                fontSize: '0.625rem',
                color: 'rgba(236, 227, 214, 0.3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              No classes available
            </div>
          ) : (
            options.map((option) => (
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
                onMouseEnter={() => setHoveredOption(option)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={() => handleSelectOption(option)}
              >
                <span>{option}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(option);
                    setIsOpen(false);
                  }}
                  style={{
                    background: 'rgba(202, 165, 84, 0.1)',
                    border: '1px solid rgba(202, 165, 84, 0.3)',
                    color: '#CAA554',
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.5rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    opacity: hoveredOption === option ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                    pointerEvents: hoveredOption === option ? 'auto' : 'none',
                  }}
                  title="Edit class name"
                >
                  ✎
                </button>
              </div>
            ))
          )}
          <div
            style={{
              padding: '0.5rem 0.625rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(202, 165, 84, 0.8)',
              borderTop: '1px solid rgba(236, 227, 214, 0.1)',
              background: 'rgba(202, 165, 84, 0.05)',
            }}
            onClick={() => {
              onAddNew();
              setIsOpen(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(202, 165, 84, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(202, 165, 84, 0.05)';
            }}
          >
            <span>+ Add New Class</span>
          </div>
        </div>
      )}

      {/* Helper text when typing new class */}
      {isTyping && inputValue && !options.includes(inputValue) && (
        <div style={{ marginTop: '0.25rem', fontSize: '0.5rem', color: 'rgba(236, 227, 214, 0.5)' }}>
          Press Enter to save "{inputValue}" as a new class (will be saved when entity is saved)
        </div>
      )}
    </div>
  );
}
