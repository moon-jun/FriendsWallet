import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  swing: number;
  swingSpeed: number;
  swingOffset: number;
};

function createFlake(width: number, height: number, fromTop = false): Flake {
  return {
    x: Math.random() * width,
    y: fromTop ? Math.random() * -height : Math.random() * height,
    r: Math.random() * 6 + 3,
    speed: Math.random() * 1.8 + 0.6,
    opacity: Math.random() * 0.4 + 0.35,
    swing: Math.random() * 50 + 15,
    swingSpeed: Math.random() * 0.025 + 0.008,
    swingOffset: Math.random() * Math.PI * 2,
  };
}

export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let flakes: Flake[] = [];
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      if (!canvas) return;
      flakes = Array.from({ length: 160 }, () =>
        createFlake(canvas.width, canvas.height),
      );
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;

      for (const flake of flakes) {
        const swingX = Math.sin(t * flake.swingSpeed + flake.swingOffset) * flake.swing;

        ctx.beginPath();
        ctx.arc(flake.x + swingX, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 225, 255, ${flake.opacity})`;
        ctx.fill();

        flake.y += flake.speed;

        if (flake.y > canvas.height + 10) {
          const reset = createFlake(canvas.width, canvas.height, true);
          flake.x = reset.x;
          flake.y = -flake.r * 2;
          flake.r = reset.r;
          flake.speed = reset.speed;
          flake.opacity = reset.opacity;
          flake.swing = reset.swing;
          flake.swingSpeed = reset.swingSpeed;
          flake.swingOffset = reset.swingOffset;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    window.addEventListener("resize", () => {
      resize();
      init();
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
