'use client';

import { useMemo } from 'react';
import { Denizen, DenizenType } from '@/lib/types';

export interface FilterState {
  domains: Set<string>;
  entityTypes: Set<DenizenType>;
  allegiances: Set<string>;
}

interface SemanticNavigatorProps {
  denizens: Denizen[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}

/**
 * SemanticNavigator - Navigate latent space through position and landmarks
 * 
 * Based on semantic design principles:
 * - Position = meaning (coordinates show semantic location)
 * - Landmarks = regions (domains/types as destinations to navigate toward)
 * - Distance = relationship (proximity reveals entities)
 * - Navigation is thinking (filtering happens through movement, not selection)
 * 
 * This component replaces traditional filters with spatial navigation.
 * Users adjust their position in semantic space to reveal entities.
 */
export function SemanticNavigator({
  denizens,
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
}: SemanticNavigatorProps) {
  // Extract unique values
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

  // Calculate current position in semantic space
  // Position is determined by active landmarks (where you've navigated to)
  const semanticPosition = useMemo(() => {
    const activeDomainCount = filters.domains.size;
    const activeTypeCount = filters.entityTypes.size;
    const totalPossible = availableDomains.length + availableEntityTypes.length;
    
    // Position coordinates (0-1 range, like embedding space)
    // X: Domain axis (0 = no domain, 1 = all domains)
    // Y: Type axis (0 = no type, 1 = all types)  
    // Z: Depth/zoom (how many landmarks active)
    const x = totalPossible > 0 ? activeDomainCount / availableDomains.length : 0.5;
    const y = totalPossible > 0 ? activeTypeCount / availableEntityTypes.length : 0.5;
    const z = totalPossible > 0 ? (activeDomainCount + activeTypeCount) / totalPossible : 0;
    
    return { 
      x: Math.min(1, Math.max(0, x)), 
      y: Math.min(1, Math.max(0, y)), 
      z: Math.min(1, Math.max(0, z))
    };
  }, [filters, availableDomains.length, availableEntityTypes.length]);

  // Navigate to a landmark (move position toward that region)
  const navigateToLandmark = (landmark: string, isDomain: boolean) => {
    if (isDomain) {
      const newDomains = new Set(filters.domains);
      if (newDomains.has(landmark)) {
        // Navigating away from landmark (remove)
        newDomains.delete(landmark);
      } else {
        // Navigating toward landmark (add)
        newDomains.add(landmark);
      }
      onFiltersChange({ ...filters, domains: newDomains });
    } else {
      const newTypes = new Set(filters.entityTypes);
      const type = landmark as DenizenType;
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      onFiltersChange({ ...filters, entityTypes: newTypes });
    }
  };

  // Reset to origin (clear position)
  const resetToOrigin = () => {
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

  // Current landmark (location description)
  const currentLandmark = useMemo(() => {
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

  const signalStrength = Math.round((filteredCount / totalCount) * 100);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 pointer-events-none z-50"
      style={{
        padding: '20px clamp(48px, 8vw, 120px)',
        background: 'linear-gradient(to top, var(--void) 60%, transparent)',
      }}
    >
      <div 
        className="pointer-events-auto" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end', 
          gap: '48px' 
        }}
      >
        {/* Left: Position Coordinates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--dawn-30)',
            }}
          >
            POSITION
          </div>
          <div 
            style={{ 
              display: 'flex', 
              gap: '24px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', 
              letterSpacing: '0.03em',
              color: 'var(--dawn-30)',
            }}
          >
            <span>δ: <span style={{ color: 'var(--dawn-50)' }}>{semanticPosition.x.toFixed(2)}</span></span>
            <span>θ: <span style={{ color: 'var(--dawn-50)' }}>{semanticPosition.y.toFixed(2)}</span></span>
            <span>ζ: <span style={{ color: 'var(--dawn-50)' }}>{semanticPosition.z.toFixed(2)}</span></span>
          </div>
          <div 
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.05em',
              color: 'var(--dawn-30)',
              marginTop: '4px',
            }}
          >
            {filteredCount} / {totalCount} entities
          </div>
        </div>

        {/* Center: Landmark Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, maxWidth: '600px' }}>
          <div 
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--dawn-30)',
            }}
          >
            NAVIGATE TO LANDMARK
          </div>
          
          {/* Domain Landmarks */}
          {availableDomains.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {availableDomains.map((domain) => {
                const isActive = filters.domains.has(domain);
                return (
                  <button
                    key={domain}
                    onClick={() => navigateToLandmark(domain, true)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isActive ? 'var(--gold)' : 'var(--dawn-30)',
                      background: isActive ? 'rgba(202, 165, 84, 0.1)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--gold)' : 'var(--dawn-08)'}`,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--dawn-50)';
                        e.currentTarget.style.borderColor = 'var(--dawn-15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--dawn-30)';
                        e.currentTarget.style.borderColor = 'var(--dawn-08)';
                      }
                    }}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          )}

          {/* Entity Type Landmarks */}
          {availableEntityTypes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {availableEntityTypes.map((type) => {
                const isActive = filters.entityTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => navigateToLandmark(type, false)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isActive ? 'var(--gold)' : 'var(--dawn-30)',
                      background: isActive ? 'rgba(202, 165, 84, 0.1)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--gold)' : 'var(--dawn-08)'}`,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--dawn-50)';
                        e.currentTarget.style.borderColor = 'var(--dawn-15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--dawn-30)';
                        e.currentTarget.style.borderColor = 'var(--dawn-08)';
                      }
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          )}

          {/* Current Location */}
          <div 
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.05em',
              color: 'var(--dawn-30)',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--dawn-08)',
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>LOCATION:</span>{' '}
            <span style={{ color: 'var(--dawn-50)' }}>{currentLandmark}</span>
            {hasActiveFilters && (
              <button
                onClick={resetToOrigin}
                style={{
                  marginLeft: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
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
                RESET
              </button>
            )}
          </div>
        </div>

        {/* Right: Signal Strength */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          <div 
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--dawn-30)',
            }}
          >
            SIGNAL
          </div>
          <div 
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              letterSpacing: '0.05em',
              color: 'var(--gold)',
            }}
          >
            {signalStrength}%
          </div>
        </div>
      </div>
    </div>
  );
}
