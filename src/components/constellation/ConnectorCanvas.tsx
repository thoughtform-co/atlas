'use client';

import { useEffect, useRef } from 'react';
import { Connection, Position } from '@/lib/types';

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
}

interface ConnectorCanvasProps {
  connections: Connection[];
  getPosition: (id: string) => Position | null;
}

export function ConnectorCanvas({ connections, getPosition }: ConnectorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const connectorsRef = useRef<ConnectorState[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

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

      return {
        from: conn.from,
        to: conn.to,
        strength: conn.strength,
        particles,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.01,
      };
    });
  }, [connections]);

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

        ctx.fillStyle = `rgba(236, 227, 214, ${alpha * 0.7})`;
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
