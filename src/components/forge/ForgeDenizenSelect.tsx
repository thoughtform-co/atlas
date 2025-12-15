'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ForgeDenizenSelect.module.css';

interface Denizen {
  id: string;
  name: string;
  entityClass?: string;
  thumbnail?: string;
}

interface ForgeDenizenSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function ForgeDenizenSelect({ value, onChange, disabled }: ForgeDenizenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [denizens, setDenizens] = useState<Denizen[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch denizens
  const fetchDenizens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/denizens');
      if (response.ok) {
        const data = await response.json();
        setDenizens(data.denizens || []);
      }
    } catch (error) {
      console.error('Failed to fetch denizens:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && denizens.length === 0) {
      fetchDenizens();
    }
  }, [isOpen, denizens.length, fetchDenizens]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter denizens by search
  const filteredDenizens = denizens.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.entityClass?.toLowerCase().includes(search.toLowerCase())
  );

  // Get selected denizen
  const selectedDenizen = value ? denizens.find(d => d.id === value) : null;

  const handleSelect = (denizen: Denizen | null) => {
    onChange(denizen?.id || null);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Trigger Button */}
      <button
        className={`${styles.trigger} ${value ? styles.triggerSelected : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={selectedDenizen ? `Linked to: ${selectedDenizen.name}` : 'Link to Denizen'}
      >
        {selectedDenizen ? (
          <>
            <span className={styles.selectedIcon}>◇</span>
            <span className={styles.selectedName}>{selectedDenizen.name}</span>
          </>
        ) : (
          <span className={styles.linkIcon}>LINK</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search denizens..."
              className={styles.searchInput}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className={styles.options}>
            {/* Clear Option */}
            {value && (
              <button
                className={styles.option}
                onClick={() => handleSelect(null)}
              >
                <span className={styles.clearIcon}>×</span>
                <span className={styles.optionName}>Clear link</span>
              </button>
            )}

            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : filteredDenizens.length === 0 ? (
              <div className={styles.empty}>No denizens found</div>
            ) : (
              filteredDenizens.map(denizen => (
                <button
                  key={denizen.id}
                  className={`${styles.option} ${value === denizen.id ? styles.optionSelected : ''}`}
                  onClick={() => handleSelect(denizen)}
                >
                  {denizen.thumbnail ? (
                    <img 
                      src={denizen.thumbnail} 
                      alt="" 
                      className={styles.optionThumb}
                    />
                  ) : (
                    <span className={styles.optionIcon}>◇</span>
                  )}
                  <div className={styles.optionInfo}>
                    <span className={styles.optionName}>{denizen.name}</span>
                    {denizen.entityClass && (
                      <span className={styles.optionClass}>{denizen.entityClass}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
