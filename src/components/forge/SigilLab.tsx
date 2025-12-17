'use client';

/**
 * SigilLab - Generative Sigil Explorer
 * 
 * Showcases the algorithmic particle sigil system:
 * - Domain patterns: Unique genetic signatures for each domain
 * - Entity variants: How entities inherit and mutate domain patterns
 * - Interactive builder: Explore the generation algorithms
 * 
 * Inspired by Grafana's pillar configurations and Thoughtform's glitch aesthetic.
 */

import { useState, useMemo } from 'react';
import {
  GenerativeSigil,
  DOMAIN_DNA,
  DOMAIN_COLORS,
} from '@/components/shared';
import styles from './SigilLab.module.css';

interface SigilLabProps {
  onClose: () => void;
}

type TabId = 'domains' | 'entities' | 'explorer';

// Domain names for gallery
const DOMAINS = [
  'Starhaven Reaches',
  'Gradient Throne',
  'The Lattice',
  'The Threshold',
];

// Example entity names for each domain (for demonstration)
const EXAMPLE_ENTITIES: Record<string, string[]> = {
  'Starhaven Reaches': [
    'Herald of Dawn',
    'Lightwarden Axis',
    'Eigensage Primis',
    'Navigator Vel',
    'Seeker Thren',
    'Compass-Bearer',
  ],
  'Gradient Throne': [
    'Voidwalker Null',
    'Shadow-Keeper',
    'Mist-Weaver',
    'Etherform',
    'Dusk-Singer',
    'Penumbral',
  ],
  'The Lattice': [
    'Algoraph Prime',
    'Pattern-Keeper Zeta',
    'Data-Shepherd',
    'Grid-Walker',
    'Syntax Error',
    'Recursion',
  ],
  'The Threshold': [
    'Gate-Keeper Alpha',
    'Liminal One',
    'Transit-Warden',
    'Between-Walker',
    'Edge-Dancer',
    'Boundary',
  ],
};

// Pattern descriptions for the explorer
const PATTERN_DESCRIPTIONS: Record<string, string> = {
  'constellation': 'Star-like radiating arms with scattered satellites',
  'cross': 'X-shaped axis pattern with thickness variation',
  'scatter': 'Organic cloud with cluster points using golden ratio',
  'grid': 'Data-like grid structure with corruption gaps',
  'spiral': 'Fibonacci spiral arms extending outward',
};

export function SigilLab({ onClose }: SigilLabProps) {
  const [activeTab, setActiveTab] = useState<TabId>('domains');
  
  // Explorer state
  const [explorerDomain, setExplorerDomain] = useState(DOMAINS[0]);
  const [customEntityId, setCustomEntityId] = useState('');
  const [explorerSize, setExplorerSize] = useState(96);
  const [showVariants, setShowVariants] = useState(true);

  // Get DNA info for current domain
  const currentDNA = DOMAIN_DNA[explorerDomain] || DOMAIN_DNA['default'];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>SIGIL LAB</h1>
          <p className={styles.subtitle}>Generative Particle System</p>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'domains' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('domains')}
          >
            DOMAINS
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'entities' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('entities')}
          >
            ENTITIES
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'explorer' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            EXPLORER
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* DOMAINS TAB */}
          {activeTab === 'domains' && (
            <div className={styles.gallery}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>DOMAIN SIGNATURES</h2>
                <p className={styles.sectionDesc}>
                  Each domain has unique genetic &ldquo;DNA&rdquo; that produces its signature pattern.
                  Patterns are generated algorithmically using seeded randomness, golden ratio distributions, and glitch offsets.
                </p>
                
                <div className={styles.domainGrid}>
                  {DOMAINS.map(domain => {
                    const dna = DOMAIN_DNA[domain];
                    return (
                      <div key={domain} className={styles.domainCard}>
                        <div className={styles.domainPreview}>
                          <GenerativeSigil
                            domain={domain}
                            size={96}
                          />
                        </div>
                        <div className={styles.domainInfo}>
                          <h3 className={styles.domainName}>{domain}</h3>
                          <div className={styles.domainMeta}>
                            <span className={styles.metaLabel}>PATTERN</span>
                            <span className={styles.metaValue}>{dna?.pattern.toUpperCase()}</span>
                          </div>
                          <div className={styles.domainMeta}>
                            <span className={styles.metaLabel}>GLITCH</span>
                            <span className={styles.metaValue}>{Math.round((dna?.glitchChance || 0) * 100)}%</span>
                          </div>
                          <div className={styles.domainMeta}>
                            <span className={styles.metaLabel}>ARMS</span>
                            <span className={styles.metaValue}>{dna?.arms}</span>
                          </div>
                        </div>
                        
                        {/* Size variants */}
                        <div className={styles.sizeVariants}>
                          {[18, 24, 36, 48].map(s => (
                            <div key={s} className={styles.sizeVariant}>
                              <GenerativeSigil domain={domain} size={s} />
                              <span>{s}px</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              
              {/* Pattern comparison */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>PATTERN COMPARISON</h2>
                <p className={styles.sectionDesc}>
                  All domains at the same scale for direct comparison.
                </p>
                <div className={styles.comparisonRow}>
                  {DOMAINS.map(domain => (
                    <div key={domain} className={styles.comparisonItem}>
                      <GenerativeSigil domain={domain} size={72} />
                      <span className={styles.comparisonLabel}>
                        {domain.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ENTITIES TAB */}
          {activeTab === 'entities' && (
            <div className={styles.gallery}>
              {DOMAINS.map(domain => (
                <section key={domain} className={styles.section}>
                  <h2 className={styles.sectionTitle}>{domain.toUpperCase()}</h2>
                  <p className={styles.sectionDesc}>
                    Entities inherit domain DNA with unique mutations based on their identity.
                  </p>
                  
                  <div className={styles.entityRow}>
                    {/* Domain base sigil */}
                    <div className={styles.entityCard}>
                      <div className={styles.entityPreview}>
                        <GenerativeSigil domain={domain} size={64} />
                      </div>
                      <div className={styles.entityInfo}>
                        <span className={styles.entityName}>BASE</span>
                        <span className={styles.entityType}>Domain Pattern</span>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className={styles.entityArrow}>→</div>
                    
                    {/* Entity variants */}
                    {EXAMPLE_ENTITIES[domain]?.map(entity => (
                      <div key={entity} className={styles.entityCard}>
                        <div className={styles.entityPreview}>
                          <GenerativeSigil
                            domain={domain}
                            entityId={entity}
                            size={64}
                          />
                        </div>
                        <div className={styles.entityInfo}>
                          <span className={styles.entityName}>{entity.split(' ')[0]}</span>
                          <span className={styles.entityType}>
                            {entity.split(' ').slice(1).join(' ') || 'Entity'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* EXPLORER TAB */}
          {activeTab === 'explorer' && (
            <div className={styles.explorer}>
              {/* Live Preview */}
              <div className={styles.explorerPreview}>
                <div className={styles.mainPreview}>
                  <GenerativeSigil
                    domain={explorerDomain}
                    entityId={customEntityId || undefined}
                    size={explorerSize}
                  />
                </div>
                
                <div className={styles.previewMeta}>
                  <div className={styles.previewSeed}>
                    SEED: {customEntityId ? `${explorerDomain}:${customEntityId}` : explorerDomain}
                  </div>
                  <div className={styles.previewPattern}>
                    {PATTERN_DESCRIPTIONS[currentDNA?.pattern] || 'Unknown pattern'}
                  </div>
                </div>

                {/* Variant preview */}
                {showVariants && (
                  <div className={styles.variantGrid}>
                    <span className={styles.variantLabel}>VARIANTS</span>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className={styles.variantItem}>
                        <GenerativeSigil
                          domain={explorerDomain}
                          entityId={customEntityId ? `${customEntityId}-${i}` : `variant-${i}`}
                          size={36}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className={styles.explorerControls}>
                {/* Domain Selection */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>DOMAIN</label>
                  <div className={styles.domainButtons}>
                    {DOMAINS.map(d => (
                      <button
                        key={d}
                        className={`${styles.domainButton} ${explorerDomain === d ? styles.domainButtonActive : ''}`}
                        onClick={() => setExplorerDomain(d)}
                      >
                        <GenerativeSigil domain={d} size={24} />
                        <span>{d.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entity ID Input */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>ENTITY ID (optional)</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={customEntityId}
                    onChange={e => setCustomEntityId(e.target.value)}
                    placeholder="Enter any string to generate variant..."
                  />
                  <p className={styles.controlHint}>
                    Each unique string produces a deterministic variant
                  </p>
                </div>

                {/* Size Slider */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>SIZE ({explorerSize}px)</label>
                  <input
                    type="range"
                    className={styles.slider}
                    min="24"
                    max="128"
                    value={explorerSize}
                    onChange={e => setExplorerSize(Number(e.target.value))}
                  />
                </div>

                {/* Show Variants Toggle */}
                <div className={styles.controlGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={showVariants}
                      onChange={e => setShowVariants(e.target.checked)}
                    />
                    Show variant grid
                  </label>
                </div>

                {/* DNA Info */}
                <div className={styles.dnaInfo}>
                  <h3 className={styles.dnaTitle}>DOMAIN DNA</h3>
                  <div className={styles.dnaGrid}>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Pattern</span>
                      <span className={styles.dnaValue}>{currentDNA?.pattern}</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Particles</span>
                      <span className={styles.dnaValue}>{currentDNA?.baseParticles}</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Spread</span>
                      <span className={styles.dnaValue}>{currentDNA?.spread.toFixed(2)}</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Glitch</span>
                      <span className={styles.dnaValue}>{(currentDNA?.glitchChance * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Rotation</span>
                      <span className={styles.dnaValue}>{(currentDNA?.rotation * 180 / Math.PI).toFixed(0)}°</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Arms</span>
                      <span className={styles.dnaValue}>{currentDNA?.arms}</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Core</span>
                      <span className={styles.dnaValue}>{currentDNA?.hasCore ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={styles.dnaItem}>
                      <span className={styles.dnaLabel}>Falloff</span>
                      <span className={styles.dnaValue}>{currentDNA?.densityFalloff.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
