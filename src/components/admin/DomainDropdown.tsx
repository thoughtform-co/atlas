'use client';

import { useState, useRef, useEffect } from 'react';
import { Domain } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import styles from './ParameterForm.module.css';

interface DomainDropdownProps {
  value: string;
  options: Domain[];
  onChange: (value: string) => void;
  onAddNew: () => void;
  onEdit?: (domain: Domain) => void;
  placeholder?: string;
}

export function DomainDropdown({
  value,
  options,
  onChange,
  onAddNew,
  onEdit,
  placeholder = 'Select domain...',
}: DomainDropdownProps) {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingDomainName, setEditingDomainName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
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
    // If the typed value matches an option exactly, select it
    const matchingDomain = options.find(d => d.name.toLowerCase() === newValue.toLowerCase());
    if (matchingDomain) {
      onChange(matchingDomain.name);
      setIsOpen(false);
      setIsTyping(false);
      setInputValue('');
    }
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

  const handleSelectOption = (domainName: string) => {
    onChange(domainName);
    setIsOpen(false);
    setIsTyping(false);
    setInputValue('');
  };

  // Handle domain name update
  const handleUpdateDomainName = async (domain: Domain, newName: string) => {
    if (!newName.trim() || newName.trim() === domain.name) {
      setEditingDomain(null);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        // Refresh the page to update all denizens
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to update domain: ${error.error || 'Unknown error'}`);
        setEditingDomain(null);
      }
    } catch (error) {
      console.error('Error updating domain:', error);
      alert('Failed to update domain');
      setEditingDomain(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedDomain = options.find(d => d.name === value);
  const displayValue = isTyping ? inputValue : (selectedDomain?.name || value);

  // Filter options based on input
  const filteredOptions = isTyping && inputValue
    ? options.filter(d => d.name.toLowerCase().includes(inputValue.toLowerCase()))
    : options;

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
        {value && selectedDomain && isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(selectedDomain);
              } else {
                setEditingDomain(selectedDomain.id);
                setEditingDomainName(selectedDomain.name);
              }
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
            title="Edit domain name"
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
          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: '0.5rem 0.625rem',
                fontSize: '0.625rem',
                color: 'rgba(236, 227, 214, 0.3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              No domains found
            </div>
          ) : (
            filteredOptions.map((domain) => {
              const isEditing = editingDomain === domain.id;
              return (
                <div
                  key={domain.id}
                  style={{
                    padding: '0.5rem 0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.6875rem',
                    fontFamily: 'var(--font-mono)',
                    color: value === domain.name ? '#CAA554' : 'rgba(236, 227, 214, 0.6)',
                    background: value === domain.name ? 'rgba(202, 165, 84, 0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(236, 227, 214, 0.05)',
                  }}
                  onMouseEnter={() => setHoveredOption(domain.name)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => !isEditing && handleSelectOption(domain.name)}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                      <input
                        type="text"
                        value={editingDomainName}
                        onChange={(e) => setEditingDomainName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateDomainName(domain, editingDomainName);
                          } else if (e.key === 'Escape') {
                            setEditingDomain(null);
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'rgba(5, 4, 3, 0.8)',
                          border: '1px solid var(--gold)',
                          color: 'var(--dawn-50)',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateDomainName(domain, editingDomainName);
                        }}
                        disabled={isUpdating}
                        style={{
                          background: 'rgba(202, 165, 84, 0.2)',
                          border: '1px solid rgba(202, 165, 84, 0.4)',
                          color: '#CAA554',
                          padding: '0.25rem 0.4rem',
                          fontSize: '0.5rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: isUpdating ? 'wait' : 'pointer',
                        }}
                      >
                        {isUpdating ? '...' : 'SAVE'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDomain(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(236, 227, 214, 0.3)',
                          color: 'rgba(236, 227, 214, 0.5)',
                          padding: '0.25rem 0.4rem',
                          fontSize: '0.5rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>
                        {domain.name} {domain.srefCode ? `(SREF: ${domain.srefCode})` : ''}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDomain(domain.id);
                            setEditingDomainName(domain.name);
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
                            opacity: hoveredOption === domain.name ? 1 : 0,
                            transition: 'opacity 0.15s ease',
                            pointerEvents: hoveredOption === domain.name ? 'auto' : 'none',
                          }}
                          title="Edit domain name"
                        >
                          ✎
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })
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
            <span>+ Add New Domain</span>
          </div>
        </div>
      )}
    </div>
  );
}
