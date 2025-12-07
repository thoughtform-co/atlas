'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Denizen, Connection, Position } from '@/lib/types';
import { BackgroundCanvas } from './BackgroundCanvas';
import { ConnectorCanvas } from './ConnectorCanvas';
import { EntityCard } from './EntityCard';
import { DenizenModalV3 } from './DenizenModalV3';
import { clamp } from '@/lib/utils';

interface ConstellationViewProps {
  denizens: Denizen[];
  connections: Connection[];
}

export function ConstellationView({ denizens, connections }: ConstellationViewProps) {
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedDenizen, setSelectedDenizen] = useState<Denizen | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentDenizens, setCurrentDenizens] = useState<Denizen[]>(denizens);
  const lastMouseRef = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update currentDenizens when denizens prop changes (e.g., after page refresh)
  useEffect(() => {
    setCurrentDenizens(denizens);
  }, [denizens]);

  // Wait for mount to ensure window dimensions are available
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Handle wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    setScale((prev) => clamp(prev * zoomFactor, 0.4, 2.5));
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Background canvas layer */}
      <BackgroundCanvas />

      {/* Connector canvas layer */}
      <ConnectorCanvas connections={connections} getPosition={getScreenPosition} />

      {/* Cards container */}
      <div className="absolute inset-0 z-[3]">
        {currentDenizens.map((denizen) => {
          const pos = getScreenPosition(denizen.id);
          if (!pos) return null;

          return (
            <EntityCard
              key={denizen.id}
              denizen={denizen}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
              onClick={handleCardClick}
              onEdit={handleEditClick}
              isSelected={selectedDenizen?.id === denizen.id}
            />
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
