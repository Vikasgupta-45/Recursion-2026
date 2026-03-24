import { useEffect, useRef } from 'react';

const RIBBON_COUNT = 5;
const COLORS = [
  { r: 100, g: 60, b: 255 },   // deep purple
  { r: 60, g: 100, b: 255 },   // blue-purple
  { r: 140, g: 80, b: 255 },   // violet
  { r: 40, g: 140, b: 255 },   // cyan-blue
  { r: 120, g: 50, b: 220 },   // dark violet
];

interface Ribbon {
  y: number;
  speed: number;
  amplitude: number;
  frequency: number;
  thickness: number;
  phase: number;
  color: { r: number; g: number; b: number };
  yOffset: number;
}

const WaveLayer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const ribbons = useRef<Ribbon[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Init ribbons
    ribbons.current = Array.from({ length: RIBBON_COUNT }, (_, i) => ({
      y: 0.25 + (i / RIBBON_COUNT) * 0.55,
      speed: 0.3 + Math.random() * 0.5,
      amplitude: 60 + Math.random() * 80,
      frequency: 1.2 + Math.random() * 1.5,
      thickness: 80 + Math.random() * 120,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[i % COLORS.length],
      yOffset: 0,
    }));

    const handleResize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let frame = 0;
    let rafId: number;

    const draw = () => {
      frame++;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const t = frame * 0.008;

      ctx.clearRect(0, 0, W, H);

      // Mouse influence
      const mx = (mouse.current.x - 0.5) * 2; // -1 to 1
      const my = (mouse.current.y - 0.5) * 2;

      ribbons.current.forEach((ribbon) => {
        // Smooth mouse Y influence
        ribbon.yOffset += ((my * 30) - ribbon.yOffset) * 0.02;

        const baseY = ribbon.y * H + ribbon.yOffset;
        const { r, g, b } = ribbon.color;

        ctx.beginPath();

        // Draw upper edge of ribbon
        const points: { x: number; y: number }[] = [];
        const segments = 120;

        for (let i = 0; i <= segments; i++) {
          const px = (i / segments) * (W + 200) - 100;
          const progress = i / segments;

          const wave1 = Math.sin(progress * Math.PI * ribbon.frequency + t * ribbon.speed + ribbon.phase) * ribbon.amplitude;
          const wave2 = Math.sin(progress * Math.PI * ribbon.frequency * 0.7 + t * ribbon.speed * 1.3 + ribbon.phase + 1) * (ribbon.amplitude * 0.4);
          const mouseWave = Math.sin(progress * Math.PI * 2 + t) * mx * 40;

          const py = baseY + wave1 + wave2 + mouseWave;
          points.push({ x: px, y: py });
        }

        // Create gradient for this ribbon
        const grad = ctx.createLinearGradient(0, baseY - ribbon.amplitude, 0, baseY + ribbon.amplitude + ribbon.thickness);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.3, `rgba(${r},${g},${b},0.25)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.40)`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},0.25)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        // Draw filled shape: upper curve → lower curve (offset by thickness)
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        // Upper edge with smooth curves
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        // Bottom edge (reverse, offset by thickness)
        for (let i = points.length - 1; i > 0; i--) {
          const thicknessVariation = ribbon.thickness * (0.6 + 0.4 * Math.sin(i * 0.05 + t * 0.5));
          const px = points[i].x;
          const py = points[i].y + thicknessVariation;
          if (i === points.length - 1) {
            ctx.lineTo(px, py);
          } else {
            const nextI = i + 1;
            const nextThickness = ribbon.thickness * (0.6 + 0.4 * Math.sin(nextI * 0.05 + t * 0.5));
            const xc = (px + points[nextI].x) / 2;
            const yc = (py + points[nextI].y + nextThickness) / 2;
            ctx.quadraticCurveTo(px, py, xc, yc);
          }
        }

        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Bright highlight line along the top edge
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.strokeStyle = `rgba(${Math.min(r + 60, 255)},${Math.min(g + 60, 255)},${Math.min(b + 60, 255)},0.35)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="wave-canvas"
    />
  );
};

export default WaveLayer;
