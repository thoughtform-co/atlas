'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Connection, Position, Denizen } from '@/lib/types';
import { getDomainColor } from '@/lib/constants';

interface Particle {
  t: number;
  baseOffset: number;
  phase: number;
  size: number;
  speed: number; // Individual particle speed for streaming effect
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
    // Initialize connectors with more particles for visibility
    connectorsRef.current = connections.map((conn) => {
      // More particles = more visible beams (scaled by strength)
      const particleCount = Math.floor(120 + conn.strength * 80);
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Distribute particles evenly along the line with slight randomization
        const t = (i / particleCount) + (Math.random() - 0.5) * 0.02;
        particles.push({
          t: Math.max(0, Math.min(1, t)), // Clamp to 0-1
          baseOffset: (Math.random() - 0.5) * 6, // Slightly tighter spread
          phase: Math.random() * Math.PI * 2,
          size: 2 + Math.random() * 1.5,
          speed: 0.0008 + Math.random() * 0.0006, // Gentle streaming speed (varied per particle)
        });
      }

      // Determine domain color: use domain color if both entities are in same domain, otherwise neutral
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
        pulseSpeed: 0.012 + Math.random() * 0.008, // Slightly slower, more elegant pulse
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
        // Stream particles along the connection (update position)
        p.t += p.speed;
        if (p.t > 1) {
          p.t -= 1; // Wrap around for continuous streaming
        }
        
        const x = fromPos.x + dx * p.t + nx * p.baseOffset;
        const y = fromPos.y + dy * p.t + ny * p.baseOffset;

        // Subtle shimmer instead of harsh pulse
        const shimmer = Math.sin(connector.pulsePhase * 1.5 + p.phase) * 0.1 + 0.9;

        // Fade at endpoints - gentler fade for smooth entry/exit
        const edgeFade = Math.min(p.t, 1 - p.t) * 5;
        const alpha = Math.min(1, edgeFade) * globalPulse * shimmer * connector.strength;

        // Pixelated rendering
        const px = Math.floor(x / gridSize) * gridSize;
        const py = Math.floor(y / gridSize) * gridSize;

        // Higher base visibility - beams should be clearly visible
        // Same-domain: strong gold/domain color, cross-domain: subtle neutral
        const domainMultiplier = connector.domainColor ? 1.0 : 0.7;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * domainMultiplier})`;
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
