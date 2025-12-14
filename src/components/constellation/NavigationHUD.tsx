'use client';

import { useMemo } from 'react';
import { Denizen, DenizenType, Allegiance } from '@/lib/types';

export interface FilterState {
  domains: Set<string>;
  entityTypes: Set<DenizenType>;
  allegiances: Set<Allegiance>;
}

interface NavigationHUDProps {
  denizens: Denizen[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}

export function NavigationHUD({
  denizens,
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
}: NavigationHUDProps) {
  // Extract unique values for filter options
  const availableDomains = useMemo(() => {
    const domains = new Set<string>();
    denizens.forEach(d => {
      if (d.domain) domains.add(d.domain);
    });
    return Array.from(domains).sort();
  }, [denizens]);

  const availableEntityTypes = useMemo(() => {
    const types = new Set<DenizenType>();
    denizens.forEach(d => {
      types.add(d.type);
    });
    return Array.from(types).sort();
  }, [denizens]);

  const toggleDomain = (domain: string) => {
    const newDomains = new Set(filters.domains);
    if (newDomains.has(domain)) {
      newDomains.delete(domain);
    } else {
      newDomains.add(domain);
    }
    onFiltersChange({ ...filters, domains: newDomains });
  };

  const toggleEntityType = (type: DenizenType) => {
    const newTypes = new Set(filters.entityTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFiltersChange({ ...filters, entityTypes: newTypes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      domains: new Set(),
      entityTypes: new Set(),
      allegiances: new Set(),
    });
  };

  const hasActiveFilters = 
    filters.domains.size > 0 || 
    filters.entityTypes.size > 0 || 
    filters.allegiances.size > 0;

  // Generate landmark label based on active filters
  const landmarkLabel = useMemo(() => {
    if (!hasActiveFilters) {
      return 'semantic terrain / latent topology';
    }
    const parts: string[] = [];
    if (filters.domains.size > 0) {
      parts.push(Array.from(filters.domains).join(' / '));
    }
    if (filters.entityTypes.size > 0) {
      parts.push(Array.from(filters.entityTypes).join(' / '));
    }
    return parts.join(' / ') || 'semantic terrain / latent topology';
  }, [filters, hasActiveFilters]);

  // Calculate signal strength (percentage of entities visible)
  const signalStrength = Math.round((filteredCount / totalCount) * 100);

  // Generate tick marks (matching Thoughtform implementation)
  const tickCount = 20;
  const tickLabels: Record<number, string> = {
    0: "0",
    5: "2",
    10: "5",
    15: "7",
    20: "10",
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50" data-navigation-hud>
      {/* Corner Brackets */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Top Bar */}
      <header 
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          padding: '20px clamp(48px, 8vw, 120px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 51,
        }}
      >
        <div 
          className="pointer-events-auto"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--dawn-50)',
          }}
        >
          <span>ATLAS</span>
          <span style={{ color: 'var(--dawn-30)', margin: '0 8px' }}>/</span>
          <span style={{ color: hasActiveFilters ? 'var(--gold)' : 'var(--dawn-50)' }}>
            {hasActiveFilters ? 'FILTERED' : 'CONSTELLATION'}
          </span>
        </div>

        <div 
          className="pointer-events-auto"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--dawn-30)',
          }}
        >
          <span>SIGNAL</span>
          <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>{signalStrength}%</span>
        </div>
      </header>

      {/* Left Rail - VECTOR Labels (Entity Types) */}
      <aside className="hud-rail hud-rail-left pointer-events-none" style={{ zIndex: 51 }}>
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: tickCount + 1 }).map((_, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div
                  className={`tick ${i % 5 === 0 ? 'tick-major' : 'tick-minor'}`}
                />
                {tickLabels[i] && (
                  <span
                    className="tick-label"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '28px',
                    }}
                  >
                    {tickLabels[i]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VECTOR Labels (Entity Types) */}
        <div 
          className="pointer-events-auto rail-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {availableEntityTypes.map((type) => {
            const isActive = filters.entityTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleEntityType(type)}
                className="text-left transition-opacity"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--gold)' : 'var(--dawn-30)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--dawn-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--dawn-30)';
                  }
                }}
              >
                <span style={{ fontSize: '8px', opacity: 0.5 }}>VECTOR</span>
                <span>{type}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Rail - Section Markers (Domains) */}
      <aside className="hud-rail hud-rail-right pointer-events-none" style={{ zIndex: 51 }}>
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: tickCount + 1 }).map((_, i) => (
              <div
                key={i}
                className={`tick ${i % 5 === 0 ? 'tick-major' : 'tick-minor'}`}
              />
            ))}
          </div>
        </div>

        {/* Section Markers (Domains) */}
        <div 
          className="pointer-events-auto rail-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {availableDomains.map((domain, index) => {
            const isActive = filters.domains.has(domain);
            return (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                className="transition-opacity"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: isActive ? 1 : 0.4,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.4';
                  }
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    border: `1px solid ${isActive ? 'var(--gold)' : 'var(--dawn-30)'}`,
                    background: isActive ? 'var(--gold)' : 'transparent',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: isActive ? 'var(--dawn-70)' : 'var(--dawn-30)',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Bottom Bar */}
      <footer 
        className="fixed bottom-0 left-0 right-0 pointer-events-none"
        style={{
          padding: '20px clamp(48px, 8vw, 120px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to top, var(--void) 60%, transparent)',
          zIndex: 51,
        }}
      >
        {/* Coordinates */}
        <div 
          className="pointer-events-auto"
          style={{
            display: 'flex',
            gap: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.03em',
            color: 'var(--dawn-30)',
          }}
        >
          <span>δ: <span style={{ color: 'var(--dawn-50)' }}>{filteredCount}</span></span>
          <span>θ: <span style={{ color: 'var(--dawn-50)' }}>{totalCount}°</span></span>
          <span>ρ: <span style={{ color: 'var(--dawn-50)' }}>{(filteredCount / totalCount).toFixed(2)}</span></span>
        </div>

        {/* LANDMARK Label */}
        <div 
          className="pointer-events-auto"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.02em',
            color: 'var(--dawn-30)',
            textAlign: 'right',
          }}
        >
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>LANDMARK:</span>{' '}
          <span style={{ color: 'var(--dawn-50)' }}>{landmarkLabel}</span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{
                marginLeft: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--dawn-30)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dawn-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--dawn-30)';
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
