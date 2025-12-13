'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Connection, Position } from '@/lib/types';
import { BackgroundCanvas } from './BackgroundCanvas';
import { ConnectorCanvas } from './ConnectorCanvas';
import { EntityCard } from './EntityCard';
import { DenizenModalV3 } from './DenizenModalV3';
import { clamp } from '@/lib/utils';
import { CONSTELLATION } from '@/lib/constants';

interface ConstellationViewProps {
  denizens: Denizen[];
  connections: Connection[];
}

export function ConstellationView({ denizens, connections }: ConstellationViewProps) {
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.3); // Start more zoomed in
  const [selectedDenizen, setSelectedDenizen] = useState<Denizen | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastMouseRef = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate clustered positions for entities based on their domain.
   * Entities in the same domain are pulled closer together around the first entity's position.
   * Different domains are pushed apart to maintain visual separation.
   * WHY: Improves UX by keeping related entities visible together without scrolling,
   * while ensuring different aesthetic domains are clearly distinct clusters.
   * 
   * Algorithm:
   * 1. Calculate initial domain centers (average position of entities in each domain)
   * 2. Apply repulsion between domain centers to push different domains apart
   * 3. Position entities around their (adjusted) domain center using golden angle spiral
   */
  const clusteredDenizens = useMemo(() => {
    // Group denizens by domain, preserving original order
    const domainGroups = new Map<string, Denizen[]>();
    denizens.forEach(d => {
      const domain = d.domain || 'default';
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(d);
    });

    // Calculate initial cluster center for each domain (average of all entity positions in that domain)
    const domainCenters = new Map<string, Position>();
    domainGroups.forEach((group, domain) => {
      const avgX = group.reduce((sum, d) => sum + d.position.x, 0) / group.length;
      const avgY = group.reduce((sum, d) => sum + d.position.y, 0) / group.length;
      domainCenters.set(domain, { x: avgX, y: avgY });
    });

    // Apply repulsion between domain centers to ensure minimum separation
    // WHY: Domains with different aesthetics should be visually separate in the constellation
    const domains = Array.from(domainCenters.keys());
    if (domains.length > 1) {
      const minSeparation = CONSTELLATION.DOMAIN_MIN_SEPARATION;
      
      // Iterative repulsion - push overlapping domain centers apart
      for (let iter = 0; iter < CONSTELLATION.DOMAIN_REPULSION_ITERATIONS; iter++) {
        for (let i = 0; i < domains.length; i++) {
          for (let j = i + 1; j < domains.length; j++) {
            const centerA = domainCenters.get(domains[i])!;
            const centerB = domainCenters.get(domains[j])!;
            
            const dx = centerB.x - centerA.x;
            const dy = centerB.y - centerA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If domains are too close, push them apart
            if (distance < minSeparation && distance > 0) {
              const overlap = minSeparation - distance;
              const pushX = (dx / distance) * overlap * 0.5;
              const pushY = (dy / distance) * overlap * 0.5;
              
              // Push both domains in opposite directions
              domainCenters.set(domains[i], {
                x: centerA.x - pushX,
                y: centerA.y - pushY,
              });
              domainCenters.set(domains[j], {
                x: centerB.x + pushX,
                y: centerB.y + pushY,
              });
            } else if (distance === 0) {
              // If exactly overlapping, push in a deterministic direction based on domain name
              // WHY: Consistent positioning when domains have identical center positions
              const angle = (domains[i].charCodeAt(0) + domains[j].charCodeAt(0)) * 0.1;
              domainCenters.set(domains[i], {
                x: centerA.x - Math.cos(angle) * minSeparation * 0.5,
                y: centerA.y - Math.sin(angle) * minSeparation * 0.5,
              });
              domainCenters.set(domains[j], {
                x: centerB.x + Math.cos(angle) * minSeparation * 0.5,
                y: centerB.y + Math.sin(angle) * minSeparation * 0.5,
              });
            }
          }
        }
      }
    }

    // Reposition entities within each domain cluster
    return denizens.map(d => {
      const domain = d.domain || 'default';
      const group = domainGroups.get(domain) || [];
      const center = domainCenters.get(domain)!;
      
      // If only one entity in domain, position at domain center
      if (group.length <= 1) {
        return {
          ...d,
          position: { x: center.x, y: center.y },
        };
      }

      const indexInGroup = group.findIndex(g => g.id === d.id);

      // Calculate position within cluster using golden angle spiral
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
      const angle = indexInGroup * goldenAngle;
      
      // Distance from center based on index (spiral outward)
      // Ensure minimum separation to prevent card overlap (cards are 200px wide)
      const baseRadius = CONSTELLATION.CLUSTER_MIN_SPACING * CONSTELLATION.SPIRAL.BASE_RADIUS_FACTOR;
      const spiralRadius = baseRadius + (indexInGroup * CONSTELLATION.CLUSTER_MIN_SPACING * CONSTELLATION.SPIRAL.GROWTH_FACTOR);
      const radius = Math.min(spiralRadius, CONSTELLATION.CLUSTER_MAX_DISTANCE * CONSTELLATION.SPIRAL.MAX_RADIUS_FACTOR);

      return {
        ...d,
        position: {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        },
      };
    });
  }, [denizens]);

  /**
   * Generate automatic connections between entities.
   * Only connect entities within the SAME domain - different domains are separate territories.
   * WHY: Visual cohesion within domains, but clear separation between different aesthetic territories.
   */
  const allConnections = useMemo(() => {
    // Start with explicit connections (only same-domain ones)
    const existingPairs = new Set<string>();
    
    // Build domain lookup
    const domainLookup = new Map<string, string>();
    denizens.forEach(d => {
      domainLookup.set(d.id, d.domain || 'default');
    });
    
    // Filter explicit connections to only include same-domain pairs
    const filteredConnections = connections.filter(c => {
      const fromDomain = domainLookup.get(c.from);
      const toDomain = domainLookup.get(c.to);
      return fromDomain === toDomain;
    });
    
    filteredConnections.forEach(c => {
      existingPairs.add(`${c.from}-${c.to}`);
      existingPairs.add(`${c.to}-${c.from}`);
    });

    // Generate automatic connections - ONLY within same domain
    const autoConnections: Connection[] = [];
    
    // Group entities by domain
    const domainGroups = new Map<string, Denizen[]>();
    denizens.forEach(d => {
      const domain = d.domain || 'default';
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(d);
    });

    // Connect entities within each domain
    domainGroups.forEach((group) => {
      // Only create connections if there are multiple entities in the domain
      if (group.length < 2) return;
      
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const pairKey = `${group[i].id}-${group[j].id}`;
          if (!existingPairs.has(pairKey)) {
            autoConnections.push({
              from: group[i].id,
              to: group[j].id,
              strength: CONSTELLATION.AUTO_CONNECTION_STRENGTH_SAME_DOMAIN,
              type: 'semantic',
            });
            existingPairs.add(pairKey);
          }
        }
      }
    });

    return [...filteredConnections, ...autoConnections];
  }, [denizens, connections]);

  const [currentDenizens, setCurrentDenizens] = useState<Denizen[]>(clusteredDenizens);

  // Update currentDenizens when clustered denizens change
  useEffect(() => {
    setCurrentDenizens(clusteredDenizens);
  }, [clusteredDenizens]);

  // Wait for mount to ensure window dimensions are available
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-center view on entities when first loaded
  useEffect(() => {
    if (!mounted || currentDenizens.length === 0) return;
    
    // Calculate the center of all entities
    const avgX = currentDenizens.reduce((sum, d) => sum + d.position.x, 0) / currentDenizens.length;
    const avgY = currentDenizens.reduce((sum, d) => sum + d.position.y, 0) / currentDenizens.length;
    
    // Set offset to center the view on entities
    // We negate because offset moves the view, not the entities
    setOffset({ x: -avgX, y: -avgY });
  }, [mounted, currentDenizens.length]); // Only run when mounted or entity count changes

  // Calculate screen position for a denizen
  const getScreenPosition = useCallback(
    (id: string): Position | null => {
      if (!mounted) return null;

      const denizen = currentDenizens.find((d) => d.id === id);
      if (!denizen) return null;

      const centerX = window.innerWidth / 2 + offset.x;
      const centerY = window.innerHeight / 2 + offset.y;

      return {
        x: centerX + denizen.position.x * scale,
        y: centerY + denizen.position.y * scale,
      };
    },
    [currentDenizens, offset, scale, mounted]
  );

  // Handle card click
  const handleCardClick = useCallback((denizen: Denizen) => {
    setSelectedDenizen(denizen);
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback((denizen: Denizen) => {
    // TODO: Open edit modal
    console.log('Edit denizen:', denizen.id, denizen.name);
    // For now, this just logs - a full edit modal would go here
    alert(`Edit mode for: ${denizen.name}\n\nThis will open an editor modal in a future update.`);
  }, []);

  // Handle navigation to a connected denizen from modal
  const handleNavigate = useCallback((denizenId: string) => {
    const denizen = currentDenizens.find((d) => d.id === denizenId);
    if (denizen) {
      setSelectedDenizen(denizen);
    }
  }, [currentDenizens]);

  // Handle denizen update after media upload
  const handleDenizenUpdate = useCallback((updatedDenizen: Denizen) => {
    // Update the denizen in the current list
    setCurrentDenizens((prev) =>
      prev.map((d) => (d.id === updatedDenizen.id ? updatedDenizen : d))
    );
    // Update selected denizen if it's the one that was updated
    if (selectedDenizen?.id === updatedDenizen.id) {
      setSelectedDenizen(updatedDenizen);
    }
  }, [selectedDenizen]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if clicking on the canvas area, not on cards
    if ((e.target as HTMLElement).closest('.entity-card')) return;

    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle wheel for zooming - zoom towards mouse position
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    // Get mouse position relative to container center
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the world position under the mouse before zoom
    // worldPos = (screenPos - center - offset) / scale
    const worldX = (mouseX - centerX - offset.x) / scale;
    const worldY = (mouseY - centerY - offset.y) / scale;
    
    // Apply zoom
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = clamp(scale * zoomFactor, 0.3, 3);
    
    // Calculate what offset is needed to keep worldPos under mouse after zoom
    // screenPos = center + offset + worldPos * newScale
    // offset = screenPos - center - worldPos * newScale
    const newOffsetX = mouseX - centerX - worldX * newScale;
    const newOffsetY = mouseY - centerY - worldY * newScale;
    
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [scale, offset]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Background canvas layer - with domain nebulae */}
      <BackgroundCanvas 
        denizens={currentDenizens} 
        offset={offset} 
        scale={scale} 
      />

      {/* Connector canvas layer - includes auto-generated domain connections */}
      <ConnectorCanvas 
        connections={allConnections} 
        getPosition={getScreenPosition}
        denizens={currentDenizens}
      />

      {/* Cards container */}
      <div className="absolute inset-0 z-[3]">
        {currentDenizens.map((denizen) => {
          const pos = getScreenPosition(denizen.id);
          if (!pos) return null;

          const isSelected = selectedDenizen?.id === denizen.id;

          // Non-thumbnail media only
          // Check if entity has multiple media for visual stack hint
          // WHY: Use CSS-only visual hints instead of rendering actual cards to save resources
          const allMedia = denizen.media?.filter(m => m.mediaType !== 'thumbnail') || [];
          const mediaCount = allMedia.length;
          const hasMultipleMedia = mediaCount > 1;
          const stackedLayers = hasMultipleMedia ? Math.min(3, mediaCount - 1) : 0; // Max 3 stacked hints

          const baseLeft = `${pos.x}px`;
          const baseTop = `${pos.y}px`;

          return (
            <div key={denizen.id} style={{ position: 'relative' }}>
              {/* Visual stacked cards hint - CSS-only, no actual card rendering */}
              {/* WHY: Performance optimization - visual hint only, saves GPU/bandwidth */}
              {hasMultipleMedia && (
                <>
                  {Array.from({ length: stackedLayers }).map((_, layerIdx) => {
                    const offsetX = (layerIdx + 1) * 3; // px - slight horizontal offset
                    const offsetY = -(layerIdx + 1) * 8; // px - negative to move up, showing top
                    const rotation = (layerIdx % 2 === 0 ? 1 : -1) * 2; // degrees
                    const opacity = 0.15 - (layerIdx * 0.03); // Decreasing opacity
                    
                    return (
                      <div
                        key={`stacked-hint-${denizen.id}-${layerIdx}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: baseLeft,
                          top: baseTop,
                          width: '200px',
                          aspectRatio: '3/4',
                          transform: `translate(-50%, -50%) scale(${scale}) translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
                          border: '1px solid rgba(236, 227, 214, 0.08)',
                          background: 'rgba(5, 4, 3, 0.3)',
                          opacity,
                          filter: 'grayscale(0.4) brightness(0.7)',
                          zIndex: isSelected ? 90 + layerIdx : 5 + layerIdx,
                        }}
                      />
                    );
                  })}
                </>
              )}

              {/* Main card */}
              <EntityCard
                denizen={denizen}
                isSelected={isSelected}
                onClick={handleCardClick}
                onEdit={handleEditClick}
                style={{
                  left: baseLeft,
                  top: baseTop,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  zIndex: isSelected ? 100 : 10,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Denizen modal - Xenobiologist Research Interface */}
      <DenizenModalV3
        denizen={selectedDenizen}
        onClose={() => setSelectedDenizen(null)}
        onNavigate={handleNavigate}
        allDenizens={currentDenizens}
        onDenizenUpdate={handleDenizenUpdate}
      />

      {/* Legend */}
      <div
        className="fixed bottom-8 left-8 z-50 text-[10px] text-[var(--dawn-30)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="mb-1">Drag — Pan</div>
        <div>Scroll — Zoom</div>
      </div>

      {/* Stats bars */}
      <div className="fixed bottom-8 right-8 z-50 flex items-end gap-[3px]">
        <div className="w-[3px] h-3 bg-[var(--dawn-30)]" />
        <div className="w-[3px] h-5 bg-[var(--dawn-30)]" />
        <div className="w-[3px] h-2 bg-[var(--dawn-30)]" />
        <div className="w-[3px] h-4 bg-[var(--dawn-30)]" />
        <div className="w-[3px] h-6 bg-[var(--dawn-30)]" />
      </div>
    </div>
  );
}
