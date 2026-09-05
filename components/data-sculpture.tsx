"use client";

import { useEffect, useRef, useState } from "react";

export function DataSculpture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let phase = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    const pointer = { x: 0, y: 0 };
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    });
    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const size = Math.min(width, height) * 0.32;
      const points = [];
      for (let ring = 0; ring < 39; ring++) {
        const latitude = (ring / 38) * Math.PI;
        for (let j = 0; j < 70; j++) {
          const longitude = (j / 70) * Math.PI * 2;
          const ripple = 1 + 0.12 * Math.sin(latitude * 5 + longitude * 3 + phase);
          const x = Math.sin(latitude) * Math.cos(longitude + phase * 0.18) * ripple;
          const y = Math.cos(latitude) * ripple;
          const z = Math.sin(latitude) * Math.sin(longitude + phase * 0.18) * ripple;
          const tilt = 0.4 + pointer.y * 0.16;
          const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
          const zz = y * Math.sin(tilt) + z * Math.cos(tilt);
          points.push({ x: x + yy * (0.18 + pointer.x * 0.1), y: yy, z: zz });
        }
      }
      points.sort((a, b) => a.z - b.z);
      for (const point of points) {
        const depth = (point.z + 1.3) / 2.6;
        context.beginPath();
        context.arc(width / 2 + point.x * size, height / 2 + point.y * size, 0.45 + depth * 1.1, 0, Math.PI * 2);
        context.fillStyle = `rgba(${point.z > 0.45 ? "204, 231, 154" : "120, 155, 131"}, ${0.15 + depth * 0.8})`;
        context.fill();
      }
    }
    const tick = () => {
      if (visible && !document.hidden && !paused && !motion.matches) {
        phase += 0.007;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(canvas);
    resize.observe(canvas);
    canvas.addEventListener("pointermove", move);
    tick();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
    };
  }, [paused]);

  return (
    <div className="sculpture">
      <div className="sculpture-top"><span><i /> EXPLORING THE LATENT SPACE</span><span>FIG. 001</span></div>
      <canvas ref={canvasRef} aria-label="An animated three-dimensional sphere formed from thousands of data points" role="img" />
      <div className="sculpture-axis" aria-hidden="true">Y<br />│<br />└── X</div>
      <div className="sculpture-bottom"><span>COMPLEXITY → CLARITY</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Play motion ↗" : "Pause motion Ⅱ"}</button></div>
    </div>
  );
}
