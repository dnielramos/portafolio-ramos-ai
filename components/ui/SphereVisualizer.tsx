import React, { useEffect, useRef } from 'react';

interface SphereVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

export const SphereVisualizer: React.FC<SphereVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Particle sphere configuration
    const particles: { x: number; y: number; z: number; size: number }[] = [];
    const particleCount = 400;
    const baseRadius = 100;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particles.push({
        x: baseRadius * Math.sin(phi) * Math.cos(theta),
        y: baseRadius * Math.sin(phi) * Math.sin(theta),
        z: baseRadius * Math.cos(phi),
        size: Math.random() * 1.5 + 0.5
      });
    }

    const render = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update rotation
      if (isActive) {
        rotationRef.current += 0.005 + (volume * 0.05);
      } else {
        rotationRef.current += 0.002;
      }

      const rotX = rotationRef.current;
      const rotY = rotationRef.current * 0.6;

      // Expansion factor based on volume
      const scale = 1 + (volume * 0.5); 

      particles.forEach(p => {
        // Apply scale
        const px = p.x * scale;
        const py = p.y * scale;
        const pz = p.z * scale;

        // Rotate Y
        const y1 = py * Math.cos(rotX) - pz * Math.sin(rotX);
        const z1 = py * Math.sin(rotX) + pz * Math.cos(rotX);
        
        // Rotate X
        const x2 = px * Math.cos(rotY) - z1 * Math.sin(rotY);
        const z2 = px * Math.sin(rotY) + z1 * Math.cos(rotY);

        // Perspective projection
        const perspective = 300 / (300 + z2);
        const xProj = cx + x2 * perspective;
        const yProj = cy + y1 * perspective;

        // Draw
        const alpha = (z2 + baseRadius * scale) / (2 * baseRadius * scale); // Fade back particles
        
        ctx.beginPath();
        ctx.arc(xProj, yProj, p.size * perspective, 0, Math.PI * 2);
        
        // Color based on depth and Nebula theme
        const isCyan = Math.random() > 0.5;
        ctx.fillStyle = `rgba(${isCyan ? '6, 182, 212' : '34, 211, 238'}, ${alpha})`;
        ctx.fill();

        // Connections (optional, keep it light)
        particles.forEach(p2 => {
             // Simple distance check logic would be too heavy for N^2 in JS canvas without optimization
             // Skipping lines for performance to keep 60fps
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full absolute inset-0 z-0"
    />
  );
};
