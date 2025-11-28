'use client';

import { useEffect, useRef } from 'react';

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

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const noisePointsRef = useRef<NoisePoint[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

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

    const draw = () => {
      // Clear with void color
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, width, height);

      // Draw background noise
      updateNoise();
      drawNoise();

      // Draw stars
      updateStars();
      drawStars();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />;
}
