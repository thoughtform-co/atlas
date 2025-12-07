'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

// Types
interface Denizen {
  id: string;
  name: string;
  subtitle: string | null;
  type: 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';
  allegiance: 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';
  threat_level: 'Benign' | 'Cautious' | 'Volatile' | 'Existential';
  domain: string;
  description: string;
  image: string | null;
  coord_geometry: number;
  coord_alterity: number;
  coord_dynamics: number;
  created_at: string;
}

interface Filters {
  search: string;
  type: string;
  threat: string;
  allegiance: string;
}

export default function ArchivePage() {
  const { isAdmin } = useAuth();
  const [denizens, setDenizens] = useState<Denizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    threat: 'all',
    allegiance: 'all',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');

  // Fetch denizens
  useEffect(() => {
    const fetchDenizens = async () => {
      try {
        const response = await fetch('/api/admin/denizens');
        if (!response.ok) {
          throw new Error('Failed to fetch denizens');
        }
        const data = await response.json();
        setDenizens(data.denizens || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load entities');
      } finally {
        setLoading(false);
      }
    };

    fetchDenizens();
  }, []);

  // Filter and sort denizens
  const filteredDenizens = useMemo(() => {
    let result = [...denizens];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type !== 'all') {
      result = result.filter(d => d.type.toLowerCase() === filters.type);
    }

    if (filters.threat !== 'all') {
      result = result.filter(d => d.threat_level.toLowerCase() === filters.threat);
    }

    if (filters.allegiance !== 'all') {
      result = result.filter(d => {
        if (filters.allegiance === 'liminal') return d.allegiance === 'Liminal Covenant';
        if (filters.allegiance === 'nomenclate') return d.allegiance === 'Nomenclate';
        if (filters.allegiance === 'unaligned') return d.allegiance === 'Unaligned';
        return true;
      });
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'threat') {
      const threatOrder = { 'Existential': 0, 'Volatile': 1, 'Cautious': 2, 'Benign': 3 };
      result.sort((a, b) => threatOrder[a.threat_level] - threatOrder[b.threat_level]);
    } else if (sortBy === 'class') {
      result.sort((a, b) => a.type.localeCompare(b.type));
    } else {
      // Recent - by created_at desc
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [denizens, filters, sortBy]);

  // Count by category
  const counts = useMemo(() => {
    return {
      total: denizens.length,
      types: {
        architect: denizens.filter(d => d.type === 'Architect').length,
        guardian: denizens.filter(d => d.type === 'Guardian').length,
        wanderer: denizens.filter(d => d.type === 'Wanderer').length,
        'void-born': denizens.filter(d => d.type === 'Void-Born').length,
        hybrid: denizens.filter(d => d.type === 'Hybrid').length,
      },
      threats: {
        benign: denizens.filter(d => d.threat_level === 'Benign').length,
        cautious: denizens.filter(d => d.threat_level === 'Cautious').length,
        volatile: denizens.filter(d => d.threat_level === 'Volatile').length,
        existential: denizens.filter(d => d.threat_level === 'Existential').length,
      },
      allegiances: {
        nomenclate: denizens.filter(d => d.allegiance === 'Nomenclate').length,
        liminal: denizens.filter(d => d.allegiance === 'Liminal Covenant').length,
        unaligned: denizens.filter(d => d.allegiance === 'Unaligned').length,
      },
    };
  }, [denizens]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entity from the archive?')) return;

    try {
      const response = await fetch(`/api/admin/denizens/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDenizens(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      threat: 'all',
      allegiance: 'all',
    });
  };

  // Threat color helper
  const getThreatColor = (threat: string) => {
    const colors: Record<string, string> = {
      'Benign': '#5B8A7A',
      'Cautious': '#7A7868',
      'Volatile': '#C17F59',
      'Existential': '#8B5A5A',
    };
    return colors[threat] || '#7A7868';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>LOADING ARCHIVE...</span>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span className={styles.titlePrefix}>//</span>
          <span>Entity Archive</span>
        </div>
        <div className={styles.pageStats}>
          <div className={styles.stat}>Total Entities: <span>{counts.total}</span></div>
          <div className={styles.stat}>Last Catalogued: <span>Recently</span></div>
        </div>
      </div>

      <div className={styles.archiveLayout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>// Filters</div>
          
          {/* Search */}
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search entities..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Entity Class Filter */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>▸ Entity Class</div>
            <div className={styles.filterOptions}>
              {[
                { value: 'all', label: 'All Classes', count: counts.total },
                { value: 'architect', label: 'Architect', count: counts.types.architect },
                { value: 'guardian', label: 'Guardian', count: counts.types.guardian },
                { value: 'wanderer', label: 'Wanderer', count: counts.types.wanderer },
                { value: 'void-born', label: 'Void-Born', count: counts.types['void-born'] },
                { value: 'hybrid', label: 'Hybrid', count: counts.types.hybrid },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.filterOption} ${filters.type === opt.value ? styles.active : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, type: opt.value }))}
                >
                  <span className={styles.checkbox}>{filters.type === opt.value ? '✓' : ''}</span>
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionCount}>{opt.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Threat Level Filter */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>▸ Threat Level</div>
            <div className={styles.filterOptions}>
              {[
                { value: 'all', label: 'All Levels', count: counts.total },
                { value: 'benign', label: 'Benign', count: counts.threats.benign, color: '#5B8A7A' },
                { value: 'cautious', label: 'Cautious', count: counts.threats.cautious, color: '#7A7868' },
                { value: 'volatile', label: 'Volatile', count: counts.threats.volatile, color: '#C17F59' },
                { value: 'existential', label: 'Existential', count: counts.threats.existential, color: '#8B5A5A' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.filterOption} ${filters.threat === opt.value ? styles.active : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, threat: opt.value }))}
                >
                  <span className={styles.checkbox}>{filters.threat === opt.value ? '✓' : ''}</span>
                  {'color' in opt && <span className={styles.dot} style={{ background: opt.color }} />}
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionCount}>{opt.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Allegiance Filter */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>▸ Allegiance</div>
            <div className={styles.filterOptions}>
              {[
                { value: 'all', label: 'All Factions', count: counts.total },
                { value: 'nomenclate', label: 'Nomenclate', count: counts.allegiances.nomenclate },
                { value: 'liminal', label: 'Liminal Covenant', count: counts.allegiances.liminal },
                { value: 'unaligned', label: 'Unaligned', count: counts.allegiances.unaligned },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.filterOption} ${filters.allegiance === opt.value ? styles.active : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, allegiance: opt.value }))}
                >
                  <span className={styles.checkbox}>{filters.allegiance === opt.value ? '✓' : ''}</span>
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionCount}>{opt.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.sidebarActions}>
            <button className={styles.btnGhost} onClick={clearFilters}>Clear</button>
          </div>
        </aside>

        {/* Grid Section */}
        <section className={styles.gridSection}>
          {/* Grid Header */}
          <div className={styles.gridHeader}>
            <div className={styles.gridHeaderLeft}>
              <span className={styles.gridCount}>
                Showing <span>{filteredDenizens.length}</span> entities
              </span>
              <div className={styles.viewToggle}>
                <button 
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  ▦
                </button>
                <button 
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  ☰
                </button>
              </div>
            </div>
            <select 
              className={styles.sortDropdown}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name (A-Z)</option>
              <option value="threat">Threat Level</option>
              <option value="class">Entity Class</option>
            </select>
          </div>

          {/* Entity Grid */}
          {error ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚠</div>
              <div className={styles.emptyTitle}>Error Loading Archive</div>
              <div className={styles.emptyText}>{error}</div>
            </div>
          ) : filteredDenizens.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◇</div>
              <div className={styles.emptyTitle}>No entities found</div>
              <div className={styles.emptyText}>
                {denizens.length === 0 
                  ? 'The archive is empty. Catalog a new entity to begin.'
                  : 'Try adjusting your filters or search query'}
              </div>
              {isAdmin && denizens.length === 0 && (
                <Link href="/admin/new-entity" className={styles.addButton}>
                  + Catalog New Entity
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.entityGrid}>
              {filteredDenizens.map((denizen) => (
                <article key={denizen.id} className={styles.entityCard}>
                  <div className={styles.cardImage}>
                    {denizen.image ? (
                      <img src={denizen.image} alt={denizen.name} />
                    ) : (
                      <span className={styles.imagePlaceholder}>◇</span>
                    )}
                    <div className={styles.badges}>
                      <span className={styles.badgeClass}>{denizen.type}</span>
                      <span 
                        className={styles.badgeThreat}
                        style={{ color: getThreatColor(denizen.threat_level), borderColor: getThreatColor(denizen.threat_level) }}
                      >
                        {denizen.threat_level}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardName}>{denizen.name}</h3>
                    <div className={styles.cardAllegiance}>◎ {denizen.allegiance.toUpperCase()}</div>
                    <p className={styles.cardBio}>{denizen.description}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <div className={styles.cardCoords}>
                      <span style={{ color: '#CAA554' }}>◆{Math.abs(denizen.coord_geometry).toFixed(2)}</span>
                      <span style={{ color: '#ECE3D6' }}>○{Math.abs(denizen.coord_alterity).toFixed(2)}</span>
                      <span style={{ color: '#5B8A7A' }}>◇{Math.abs(denizen.coord_dynamics).toFixed(2)}</span>
                    </div>
                    {isAdmin && (
                      <div className={styles.cardActions}>
                        <Link href={`/admin/edit/${denizen.id}`} className={styles.actionBtn}>
                          Edit
                        </Link>
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(denizen.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

