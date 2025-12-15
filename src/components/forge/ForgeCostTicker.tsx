'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './ForgeCostTicker.module.css';

interface CostData {
  total_cents: number;
  total_dollars: number;
  by_model: Record<string, number>;
  period: string;
  generation_count: number;
}

export function ForgeCostTicker() {
  const [cost, setCost] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchCost = useCallback(async () => {
    try {
      const response = await fetch('/api/forge/cost');
      if (response.ok) {
        const data = await response.json();
        setCost(data);
      }
    } catch (error) {
      console.error('Failed to fetch cost:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCost();
    
    // Refresh cost every 30 seconds
    const interval = setInterval(fetchCost, 30000);
    return () => clearInterval(interval);
  }, [fetchCost]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div 
      className={styles.ticker}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Main Cost Display */}
      <div className={styles.main}>
        <span className={styles.label}>REPLICATE</span>
        <span className={styles.value}>
          {loading ? (
            <span className={styles.loading}>---</span>
          ) : (
            formatCurrency(cost?.total_dollars || 0)
          )}
        </span>
      </div>

      {/* Expanded Details */}
      {expanded && cost && (
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>GENERATIONS</span>
            <span className={styles.detailValue}>{cost.generation_count}</span>
          </div>
          {Object.entries(cost.by_model).map(([model, amount]) => (
            <div key={model} className={styles.detailRow}>
              <span className={styles.detailLabel}>{model.toUpperCase()}</span>
              <span className={styles.detailValue}>{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
