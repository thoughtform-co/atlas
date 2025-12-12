'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Connection, Position, Denizen } from '@/lib/types';
import { getDomainColor } from '@/lib/constants';

interface Particle {
  t: number;
  baseOffset: number;
  phase: number;
  size: number;
}

interface ConnectorState {
  from: string;
  to: string;
  strength: number;
  particles: Particle[];
  pulsePhase: number;
  pulseSpeed: number;
  domainColor?: { r: number; g: number; b: number } | null; // null = cross-domain (use neutral)
}

interface ConnectorCanvasProps {
  connections: Connection[];
  getPosition: (id: string) => Position | null;
  denizens?: Denizen[];
}

// Neutral color for cross-domain connections (dawn color)
const NEUTRAL_COLOR = { r: 236, g: 227, b: 214 };

export function ConnectorCanvas({ connections, getPosition, denizens = [] }: ConnectorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const connectorsRef = useRef<ConnectorState[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  // Create a lookup map for denizen domains
  const domainLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    denizens.forEach(d => {
      lookup.set(d.id, d.domain || 'default');
    });
    return lookup;
  }, [denizens]);

  useEffect(() => {
    // Initialize connectors
    connectorsRef.current = connections.map((conn) => {
      const particleCount = Math.floor(80 + conn.strength * 60);
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const t = (i % (particleCount / 2)) / (particleCount / 2);
        particles.push({
          t,
          baseOffset: (Math.random() - 0.5) * 8,
          phase: Math.random() * Math.PI * 2,
          size: 2 + Math.random() * 2,
        });
      }

      // Determine domain color: use domain color if both entities are in same domain, otherwise null (neutral)
      const fromDomain = domainLookup.get(conn.from);
      const toDomain = domainLookup.get(conn.to);
      const domainColor = (fromDomain && toDomain && fromDomain === toDomain)
        ? getDomainColor(fromDomain)
        : null;

      return {
        from: conn.from,
        to: conn.to,
        strength: conn.strength,
        particles,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.01,
        domainColor: domainColor ? { r: domainColor.r, g: domainColor.g, b: domainColor.b } : null,
      };
    });
  }, [connections, domainLookup]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener('resize', resize);

    const gridSize = 2;

    const drawConnector = (connector: ConnectorState) => {
      const fromPos = getPosition(connector.from);
      const toPos = getPosition(connector.to);

      if (!fromPos || !toPos) return;

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) return;

      const nx = -dy / length;
      const ny = dx / length;

      // Global pulse factor
      const globalPulse = 0.5 + Math.sin(connector.pulsePhase) * 0.35;

      // Use domain color if same domain, otherwise neutral
      const color = connector.domainColor || NEUTRAL_COLOR;

      connector.particles.forEach((p) => {
        const x = fromPos.x + dx * p.t + nx * p.baseOffset;
        const y = fromPos.y + dy * p.t + ny * p.baseOffset;

        // Individual particle pulse
        const particlePulse = Math.sin(connector.pulsePhase * 2 + p.phase) * 0.3 + 0.7;

        // Fade at endpoints
        const edgeFade = Math.min(p.t, 1 - p.t) * 5;
        const alpha = Math.min(1, edgeFade) * globalPulse * particlePulse * connector.strength;

        // Pixelated rendering
        const px = Math.floor(x / gridSize) * gridSize;
        const py = Math.floor(y / gridSize) * gridSize;

        // Use domain color for same-domain connections, neutral for cross-domain
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.7})`;
        ctx.fillRect(px, py, gridSize, gridSize);
      });
    };

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update and draw connectors
      connectorsRef.current.forEach((connector) => {
        connector.pulsePhase += connector.pulseSpeed;
        drawConnector(connector);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getPosition]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[2]" />;
}
