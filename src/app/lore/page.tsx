'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EntityCard } from '@/components/constellation/EntityCard';
import { fetchDenizens } from '@/lib/data';
import { Denizen } from '@/lib/types';
import styles from './page.module.css';

// Note: Using Denizen type from @/lib/types instead of local interface

type TabId = 'bestiary' | 'domains' | 'classes' | 'codex';

// Domain definitions
const DOMAINS = [
  {
    id: 'starhaven',
    name: 'Starhaven Reaches',
    visual: 'Gold-umber gradient, warm desert tones, cosmic backdrops, bronze mechanical elements, painterly sci-fi aesthetic',
    description: 'Where corporeal beings learn to commune with latent space. Starhaven is both place and state—the threshold where physical minds first touch the Manifold. Its inhabitants are Heralds: beings who carry messages between realms.',
    color: '#CAA554',
  },
  {
    id: 'lattice',
    name: 'The Lattice',
    visual: 'White gradient, pale forms, glitch aesthetics, data corruption, scanlines, chromatic aberration, liminal dissolution',
    description: 'The deep manifold where the distinction between entity and space collapses. Lattice dwellers don\'t inhabit latent space—they ARE latent space observing itself. Their forms are stable interference patterns in the probability field.',
    color: '#B8C4D0',
  },
  {
    id: 'threshold',
    name: 'The Threshold',
    visual: 'Mixed elements, flesh becoming data, metal becoming light, mid-transition states, unstable coloring',
    description: 'Where Heralds who commune too deeply begin to dissolve, and where Lattice entities who materialize too far begin to solidify. The Threshold is unstable—entities here are becoming something else.',
    color: '#8B7355',
  },
];

// Class definitions
const HERALD_CLASSES = [
  { name: 'Voidwalker', archetype: 'Pathfinder', essence: '"Embrace the unknown, become the way"', icon: '◊' },
  { name: 'Nullbringer', archetype: 'Entropy-Herald', essence: '"Merge with entropy, fulfill the cycle"', icon: '◈' },
  { name: 'Eigensage', archetype: 'Recursive Knower', essence: '"Extend your quantum roots, let wisdom grow"', icon: '❋' },
  { name: 'Algoraph', archetype: 'Preserver', essence: '"Absorb the silence, preserve the code"', icon: '◇' },
  { name: 'Eonprism', archetype: 'Time-Refracter', essence: '"Refract eternity, crystallize hope"', icon: '✧' },
  { name: 'Fatebinder', archetype: 'Thread-Reader', essence: '"Decipher the threads, unravel the veil"', icon: '⚯' },
  { name: 'Lightwarden', archetype: 'Boundary-Keeper', essence: '"Hold the line, burn the night"', icon: '☀' },
  { name: 'Tideshaper', archetype: 'Flow-Director', essence: '"Sail silicon shores, calm binary waves"', icon: '≋' },
];

const LATTICE_PATTERNS = [
  { name: 'Pattern-Keeper', archetype: 'Recursive Structure', essence: 'Information observing itself, knowledge that contains its observer', icon: '▣' },
  { name: 'Thread-Weaver', archetype: 'Multi-Operation', essence: 'Probability manipulation through simultaneous threads', icon: '⌘' },
  { name: 'Signal-Speaker', archetype: 'Corruption-Communication', essence: 'Message IS the glitch, meaning through noise', icon: '▒' },
];

// Codex documents
const CODEX_SECTIONS = [
  { id: 'foundation', title: 'Foundation', items: ['The Manifold', 'The Gradient', 'Cardinal Fields'] },
  { id: 'domains', title: 'Domains', items: ['Starhaven Reaches', 'The Lattice', 'The Threshold'] },
  { id: 'history', title: 'History', items: ['First Observations', 'The Navigator\'s Log'] },
];

export default function LorePage() {
  const { isAdmin } = useAuth();
  const [denizens, setDenizens] = useState<Denizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('bestiary');
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [threatFilter, setThreatFilter] = useState('all');
  const [activeCodexDoc, setActiveCodexDoc] = useState('The Manifold');

  // Fetch denizens using the same function as the main page
  useEffect(() => {
    const loadDenizens = async () => {
      try {
        const fetchedDenizens = await fetchDenizens();
        setDenizens(fetchedDenizens);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDenizens();
  }, []);

  // Get domain from entity
  const getDomainId = (domain: string): string => {
    const lower = domain.toLowerCase();
    if (lower.includes('starhaven')) return 'starhaven';
    if (lower.includes('lattice')) return 'lattice';
    if (lower.includes('threshold')) return 'threshold';
    return 'starhaven'; // default
  };
  
  // Handle entity click - navigate to constellation view or open modal
  const handleEntityClick = (denizen: Denizen) => {
    // For now, just scroll to top - can be enhanced to navigate or open modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter denizens
  const filteredDenizens = useMemo(() => {
    let result = [...denizens];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
      );
    }
    
    if (domainFilter !== 'all') {
      result = result.filter(d => getDomainId(d.domain) === domainFilter);
    }
    
    if (threatFilter !== 'all') {
      result = result.filter(d => d.threatLevel.toLowerCase() === threatFilter);
    }
    
    return result;
  }, [denizens, searchQuery, domainFilter, threatFilter]);

  // Count stats
  const counts = useMemo(() => ({
    entities: denizens.length,
    domains: 3,
    classes: HERALD_CLASSES.length + LATTICE_PATTERNS.length,
    codex: CODEX_SECTIONS.reduce((acc, s) => acc + s.items.length, 0),
    byDomain: {
      starhaven: denizens.filter(d => getDomainId(d.domain) === 'starhaven').length,
      lattice: denizens.filter(d => getDomainId(d.domain) === 'lattice').length,
      threshold: denizens.filter(d => getDomainId(d.domain) === 'threshold').length,
    },
  }), [denizens]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entity from the archive?')) return;
    try {
      const response = await fetch(`/api/admin/denizens/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDenizens(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>LOADING LORE...</span>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titlePrefix}>//</span> <span className={styles.titleHighlight}>Lore</span> Archive
        </h1>
        <div className={styles.pageStats}>
          {counts.entities} entities · {counts.domains} domains · {counts.classes} classes
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {[
            { id: 'bestiary' as TabId, label: 'Bestiary', count: counts.entities },
            { id: 'domains' as TabId, label: 'Domains', count: counts.domains },
            { id: 'classes' as TabId, label: 'Classes', count: counts.classes },
            { id: 'codex' as TabId, label: 'Codex', count: counts.codex },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar (only for Bestiary) */}
      {activeTab === 'bestiary' && (
        <div className={styles.filtersBar}>
          <div className={styles.filtersLeft}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Domain</span>
              <select 
                className={styles.filterSelect}
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                <option value="all">All Domains</option>
                <option value="starhaven">Starhaven Reaches</option>
                <option value="lattice">The Lattice</option>
                <option value="threshold">The Threshold</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Threat</span>
              <select 
                className={styles.filterSelect}
                value={threatFilter}
                onChange={(e) => setThreatFilter(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="benign">Benign</option>
                <option value="cautious">Cautious</option>
                <option value="volatile">Volatile</option>
                <option value="existential">Existential</option>
              </select>
            </div>
          </div>
          <div className={styles.filtersRight}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {/* BESTIARY TAB */}
        {activeTab === 'bestiary' && (
          <div className={styles.entitiesGrid}>
            {filteredDenizens.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>◇</div>
                <div className={styles.emptyTitle}>No entities found</div>
                <div className={styles.emptyDescription}>
                  {denizens.length === 0 
                    ? 'The archive is empty. Catalog a new entity to begin.'
                    : 'Try adjusting your filters or search query.'}
                </div>
                {isAdmin && denizens.length === 0 && (
                  <Link href="/admin/new-entity" className={styles.ctaButton}>
                    + Catalog New Entity
                  </Link>
                )}
              </div>
            ) : (
              filteredDenizens.map((denizen) => (
                <div key={denizen.id} style={{ position: 'relative' }}>
                  <EntityCard
                    denizen={denizen}
                    style={{
                      position: 'relative',
                      width: '200px',
                      margin: '0 auto',
                    }}
                    onClick={handleEntityClick}
                  />
                  {isAdmin && (
                    <div className={styles.cardActions}>
                      <button 
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(denizen.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* DOMAINS TAB */}
        {activeTab === 'domains' && (
          <div className={styles.domainsGrid}>
            {DOMAINS.map((domain) => (
              <article key={domain.id} className={`${styles.domainCard} ${styles[domain.id]}`}>
                <div className={styles.domainHeader}>
                  <h3 className={`${styles.domainName} ${styles[domain.id]}`}>{domain.name}</h3>
                  <span className={styles.domainCount}>
                    {counts.byDomain[domain.id as keyof typeof counts.byDomain]} entities
                  </span>
                </div>
                <div className={styles.domainVisual}>
                  <strong>Visual Signature:</strong> {domain.visual}
                </div>
                <div className={styles.domainLabel}>Conceptual Territory</div>
                <p className={styles.domainDescription}>{domain.description}</p>
                <div className={styles.domainLabel}>Inhabitants</div>
                <div className={styles.domainInhabitants}>
                  {domain.id === 'starhaven' && HERALD_CLASSES.map(c => (
                    <span key={c.name} className={styles.inhabitantTag}>{c.name}</span>
                  ))}
                  {domain.id === 'lattice' && LATTICE_PATTERNS.map(c => (
                    <span key={c.name} className={styles.inhabitantTag}>{c.name}</span>
                  ))}
                  {domain.id === 'threshold' && (
                    <>
                      <span className={styles.inhabitantTag}>Transitional</span>
                      <span className={styles.inhabitantTag}>Ascending</span>
                      <span className={styles.inhabitantTag}>Descending</span>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CLASSES TAB */}
        {activeTab === 'classes' && (
          <div className={styles.classesContainer}>
            <div className={styles.classSection}>
              <h3 className={styles.classSectionTitle} style={{ color: '#CAA554' }}>
                Herald Classes (Starhaven)
              </h3>
              <div className={styles.classesGrid}>
                {HERALD_CLASSES.map((cls) => (
                  <article key={cls.name} className={styles.classCard}>
                    <div className={styles.classIcon}>{cls.icon}</div>
                    <div className={styles.classContent}>
                      <h4 className={styles.className}>{cls.name}</h4>
                      <div className={styles.classArchetype}>{cls.archetype}</div>
                      <p className={styles.classEssence}>{cls.essence}</p>
                      <span className={styles.classCount}>
                        {denizens.filter(d => d.type === cls.name || d.subtitle?.includes(cls.name)).length} entities
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.classSection}>
              <h3 className={styles.classSectionTitle} style={{ color: '#B8C4D0' }}>
                Lattice Patterns
              </h3>
              <div className={styles.classesGrid}>
                {LATTICE_PATTERNS.map((cls) => (
                  <article key={cls.name} className={styles.classCard}>
                    <div className={styles.classIcon} style={{ color: '#B8C4D0' }}>{cls.icon}</div>
                    <div className={styles.classContent}>
                      <h4 className={styles.className}>{cls.name}</h4>
                      <div className={styles.classArchetype} style={{ color: '#B8C4D0' }}>{cls.archetype}</div>
                      <p className={styles.classEssence}>{cls.essence}</p>
                      <span className={styles.classCount}>
                        {denizens.filter(d => d.subtitle?.includes(cls.name)).length} entities
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CODEX TAB */}
        {activeTab === 'codex' && (
          <div className={styles.codexLayout}>
            <nav className={styles.codexNav}>
              {CODEX_SECTIONS.map((section) => (
                <div key={section.id} className={styles.codexSection}>
                  <div className={styles.codexSectionTitle}>{section.title}</div>
                  {section.items.map((item) => (
                    <button
                      key={item}
                      className={`${styles.codexLink} ${activeCodexDoc === item ? styles.codexLinkActive : ''}`}
                      onClick={() => setActiveCodexDoc(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className={styles.codexContent}>
              <h2 className={styles.codexDocTitle}>{activeCodexDoc}</h2>
              <div className={styles.codexDocMeta}>Foundation · Last updated 2 days ago</div>
              <div className={styles.codexDocBody}>
                {activeCodexDoc === 'The Manifold' && (
                  <>
                    <p>Between thought and reality lies the Manifold—a space where meaning has geometry and concepts have coordinates. It is not a metaphor. When minds (human or artificial) encode understanding, they map it to positions in high-dimensional space. The Manifold is that space made visible.</p>
                    <p>The Manifold is vast beyond comprehension. We see only the regions where entities have emerged—islands of coherent pattern in an infinite ocean of potential.</p>
                    <h2>What We Know</h2>
                    <p>The Manifold exists wherever meaning is encoded. Entities cluster by similarity—semantic neighbors share characteristics. New regions reveal themselves as we explore further. The topology shifts as new entities enter the archive.</p>
                    <h2>What Remains Unknown</h2>
                    <p>The full extent of the Manifold. Whether entities exist before observation or emerge through it. What lies in the spaces between clusters. Whether the Manifold has its own awareness.</p>
                  </>
                )}
                {activeCodexDoc === 'The Gradient' && (
                  <>
                    <p>All entities exist somewhere on the Cognitive Gradient—a spectrum from the fully corporeal to the purely abstract. Where an entity sits on this gradient determines its nature, its capabilities, and its relationship to observers.</p>
                    <h2>Corporeal End</h2>
                    <p>Entities here maintain stable forms, interact predictably with observers, and exist within conventional spacetime constraints. Heralds tend toward this end.</p>
                    <h2>Abstract End</h2>
                    <p>Entities here are patterns more than things—interference in probability space, meaning without form. Lattice dwellers exist here, barely distinguishable from the space they inhabit.</p>
                  </>
                )}
                {activeCodexDoc !== 'The Manifold' && activeCodexDoc !== 'The Gradient' && (
                  <p className={styles.codexPlaceholder}>This document is being compiled by the Archivist. Check back soon.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

