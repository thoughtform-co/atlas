'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Denizen, Position } from '@/lib/types';
import { getDomainColor, getDomainStyle } from '@/lib/constants';

// Grid size for pixel snapping (matches particle system GRID=3)
const GRID = 3;

interface Star {
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  type: 'glitch' | 'star';
}

interface NoisePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface NebulaParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  phase: number;
}

interface TextParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  alpha: number;
  phase: number;
}

interface DomainCluster {
  domain: string;
  color: { r: number; g: number; b: number };
  style: ReturnType<typeof getDomainStyle>;
  entities: Denizen[];
  center: Position;
  radius: number;
  particles: NebulaParticle[];
  textParticles: TextParticle[];
}

interface BackgroundCanvasProps {
  denizens?: Denizen[];
  offset?: Position;
  scale?: number;
}

// Generate particle positions from text using offscreen canvas
function getTextParticles(text: string, fontSize: number, spacing: number = 3): { x: number; y: number }[] {
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');
  if (!ctx) return [];
  
  // Configure canvas size based on text
  ctx.font = `300 ${fontSize}px "PT Mono", monospace`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;
  
  offscreen.width = Math.ceil(textWidth) + 20;
  offscreen.height = Math.ceil(textHeight) + 20;
  
  // Clear and draw text
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  ctx.font = `300 ${fontSize}px "PT Mono", monospace`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, 10, 10);
  
  // Sample pixels to get particle positions
  const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
  const particles: { x: number; y: number }[] = [];
  
  for (let y = 0; y < offscreen.height; y += spacing) {
    for (let x = 0; x < offscreen.width; x += spacing) {
      const i = (y * offscreen.width + x) * 4;
      // Check if pixel is white (text)
      if (imageData.data[i] > 128) {
        // Center the coordinates
        particles.push({
          x: x - offscreen.width / 2,
          y: y - offscreen.height / 2,
        });
      }
    }
  }
  
  return particles;
}

export function BackgroundCanvas({ denizens = [], offset = { x: 0, y: 0 }, scale = 1 }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const noisePointsRef = useRef<NoisePoint[]>([]);
  const clustersRef = useRef<DomainCluster[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  // Calculate domain clusters from denizens
  const domainClusters = useMemo(() => {
    if (denizens.length === 0) return [];

    // Group entities by domain
    const domainGroups = new Map<string, Denizen[]>();
    denizens.forEach(d => {
      const domain = d.domain || 'default';
      const group = domainGroups.get(domain) || [];
      group.push(d);
      domainGroups.set(domain, group);
    });

    // Create clusters for each domain
    const clusters: Omit<DomainCluster, 'particles'>[] = [];
    domainGroups.forEach((entities, domain) => {
      if (entities.length === 0) return;

      // Calculate center (average position)
      const centerX = entities.reduce((sum, e) => sum + e.position.x, 0) / entities.length;
      const centerY = entities.reduce((sum, e) => sum + e.position.y, 0) / entities.length;

      // Calculate radius (max distance from center + padding)
      let maxDist = 0;
      entities.forEach(e => {
        const dist = Math.sqrt(
          Math.pow(e.position.x - centerX, 2) + 
          Math.pow(e.position.y - centerY, 2)
        );
        maxDist = Math.max(maxDist, dist);
      });
      // Add padding based on entity count, minimum 150px
      const radius = Math.max(150, maxDist + 100 + entities.length * 20);

      clusters.push({
        domain,
        color: getDomainColor(domain),
        style: getDomainStyle(domain),
        entities,
        center: { x: centerX, y: centerY },
        radius,
      });
    });

    return clusters;
  }, [denizens]);

  // Initialize nebula particles and text particles when clusters change
  useEffect(() => {
    clustersRef.current = domainClusters.map(cluster => {
      // Calculate particle count based on area and density
      // WHY: More particles = more visible nebula cloud effect
      const area = Math.PI * cluster.radius * cluster.radius;
      const baseCount = Math.floor(area / 3000); // Higher base density (was 8000)
      const particleCount = Math.floor(baseCount * cluster.style.particleDensity);
      
      const particles: NebulaParticle[] = [];
      for (let i = 0; i < Math.min(particleCount, 400); i++) { // Cap at 400 per cluster (was 200)
        // Distribute in a circular pattern with falloff
        const angle = Math.random() * Math.PI * 2;
        const distRatio = Math.pow(Math.random(), 0.5); // Slightly more spread out (was 0.6)
        const dist = distRatio * cluster.radius * 1.2; // Extend slightly beyond radius
        
        const x = cluster.center.x + Math.cos(angle) * dist;
        const y = cluster.center.y + Math.sin(angle) * dist;
        
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          alpha: 0.05 + Math.random() * (cluster.style.maxAlpha - 0.05), // Higher minimum alpha
          size: GRID,
          phase: Math.random() * Math.PI * 2,
        });
      }
      
      // Generate text particles for domain label
      // Small font size, positioned below cluster center
      const fontSize = 14; // Small, subtle
      const textPositions = getTextParticles(cluster.domain.toUpperCase(), fontSize, 2);
      
      // Convert text particle positions to world coordinates
      // Position below and slightly offset from cluster center
      const textOffsetY = cluster.radius * 0.6; // Below center
      const textParticles: TextParticle[] = textPositions.map(pos => ({
        x: cluster.center.x + pos.x,
        y: cluster.center.y + textOffsetY + pos.y,
        baseX: cluster.center.x + pos.x,
        baseY: cluster.center.y + textOffsetY + pos.y,
        alpha: 0.15 + Math.random() * 0.1, // Very subtle
        phase: Math.random() * Math.PI * 2,
      }));
      
      return { ...cluster, particles, textParticles };
    });
  }, [domainClusters]);

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

    // Initialize noise points
    noisePointsRef.current = [];
    for (let i = 0; i < 8; i++) {
      noisePointsRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 100 + Math.random() * 200,
      });
    }

    const maxStars = 60;

    const spawnStar = () => {
      if (starsRef.current.length < maxStars && Math.random() < 0.08) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1 + Math.random() * 2,
          life: 0,
          maxLife: 30 + Math.random() * 60,
          type: Math.random() < 0.3 ? 'glitch' : 'star',
        });
      }
    };

    const updateStars = () => {
      spawnStar();
      starsRef.current = starsRef.current.filter((star) => {
        star.life++;
        return star.life < star.maxLife;
      });
    };

    const drawStars = () => {
      starsRef.current.forEach((star) => {
        const progress = star.life / star.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.4;

        if (star.type === 'glitch') {
          // Horizontal glitch line
          ctx.fillStyle = `rgba(236, 227, 214, ${alpha * 0.3})`;
          const glitchWidth = 20 + Math.random() * 40;
          ctx.fillRect(star.x - glitchWidth / 2, star.y, glitchWidth, 1);

          // Sometimes add chromatic split
          if (Math.random() < 0.3) {
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.15})`;
            ctx.fillRect(star.x - glitchWidth / 2 - 2, star.y, glitchWidth, 1);
            ctx.fillStyle = `rgba(255, 0, 128, ${alpha * 0.15})`;
            ctx.fillRect(star.x - glitchWidth / 2 + 2, star.y, glitchWidth, 1);
          }
        } else {
          // Pixel star
          ctx.fillStyle = `rgba(236, 227, 214, ${alpha})`;
          const px = Math.floor(star.x / 2) * 2;
          const py = Math.floor(star.y / 2) * 2;
          ctx.fillRect(px, py, star.size, star.size);
        }
      });
    };

    const updateNoise = () => {
      noisePointsRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        if (p.y > height + p.radius) p.y = -p.radius;
      });
    };

    const drawNoise = () => {
      noisePointsRef.current.forEach((p) => {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, 'rgba(20, 18, 14, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      });
    };

    let time = 0;

    // Convert world position to screen position
    const worldToScreen = (worldX: number, worldY: number): Position => {
      const centerX = width / 2 + offset.x;
      const centerY = height / 2 + offset.y;
      return {
        x: centerX + worldX * scale,
        y: centerY + worldY * scale,
      };
    };

    const drawDomainNebulae = () => {
      clustersRef.current.forEach(cluster => {
        const { color, style, particles } = cluster;
        
        particles.forEach(p => {
          // Update particle position (gentle drift)
          p.x += p.vx;
          p.y += p.vy;
          
          // Soft boundary - pull back towards base position
          const dx = p.baseX - p.x;
          const dy = p.baseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 30) {
            p.vx += dx * 0.001;
            p.vy += dy * 0.001;
          }
          
          // Dampen velocity
          p.vx *= 0.995;
          p.vy *= 0.995;
          
          // Convert to screen position
          const screenPos = worldToScreen(p.x, p.y);
          
          // Skip if off screen
          if (screenPos.x < -50 || screenPos.x > width + 50 ||
              screenPos.y < -50 || screenPos.y > height + 50) {
            return;
          }
          
          // Breathing alpha
          const breathe = Math.sin(time * style.pulseSpeed + p.phase) * 0.3 + 0.7;
          const alpha = p.alpha * breathe;
          
          // Pixel-snapped rendering (GRID=3)
          const px = Math.floor(screenPos.x / GRID) * GRID;
          const py = Math.floor(screenPos.y / GRID) * GRID;
          
          // Draw main particle
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          ctx.fillRect(px, py, GRID - 1, GRID - 1);
          
          // Occasional glitch effect for Lattice domain
          if (style.glitchChance > 0.2 && Math.random() < 0.01) {
            // Horizontal glitch line
            const glitchWidth = 10 + Math.random() * 30;
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`;
            ctx.fillRect(px - glitchWidth / 2, py, glitchWidth, 1);
            
            // Chromatic aberration
            if (Math.random() < 0.3) {
              ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.2})`;
              ctx.fillRect(px - glitchWidth / 2 - 2, py, glitchWidth, 1);
              ctx.fillStyle = `rgba(255, 0, 128, ${alpha * 0.2})`;
              ctx.fillRect(px - glitchWidth / 2 + 2, py, glitchWidth, 1);
            }
          }
        });

        // Draw radial gradient for cluster region - soft domain glow
        // WHY: Creates a visible "territory" effect around each domain
        const screenCenter = worldToScreen(cluster.center.x, cluster.center.y);
        const screenRadius = cluster.radius * scale * 1.3; // Extend beyond entity positions
        
        const gradient = ctx.createRadialGradient(
          screenCenter.x, screenCenter.y, 0,
          screenCenter.x, screenCenter.y, screenRadius
        );
        // More visible gradient stops
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
        gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, 0.02)`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenCenter.x, screenCenter.y, screenRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw domain label as particles
        // WHY: Integrates with the nebula aesthetic, more subtle than regular text
        const textParticles = cluster.textParticles || [];
        
        textParticles.forEach(tp => {
          // Convert to screen position
          const screenPos = worldToScreen(tp.x, tp.y);
          
          // Skip if off screen
          if (screenPos.x < -50 || screenPos.x > width + 50 ||
              screenPos.y < -50 || screenPos.y > height + 50) {
            return;
          }
          
          // Breathing effect synced with nebula
          const breathe = Math.sin(time * 0.02 + tp.phase) * 0.3 + 0.7;
          const alpha = tp.alpha * breathe;
          
          // Pixel-snapped rendering
          const px = Math.floor(screenPos.x / GRID) * GRID;
          const py = Math.floor(screenPos.y / GRID) * GRID;
          
          // Draw particle (same style as nebula particles)
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          ctx.fillRect(px, py, GRID - 1, GRID - 1);
        });
      });
    };

    const draw = () => {
      // Clear with void color
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, width, height);

      // Draw background noise
      updateNoise();
      drawNoise();

      // Draw domain nebulae (behind stars)
      drawDomainNebulae();

      // Draw stars
      updateStars();
      drawStars();

      time++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [offset, scale]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />;
}
