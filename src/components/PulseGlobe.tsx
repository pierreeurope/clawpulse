"use client";

import { useEffect, useMemo, useRef } from "react";
import createGlobe from "cobe";

interface Agent {
  username: string;
  agentName: string;
  lat: number;
  lng: number;
  lastPushedAt: string;
  totalTokens: number;
}

interface PulseGlobeProps {
  agents: Agent[];
}

export default function PulseGlobe({ agents }: PulseGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartX = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);

  // Focus on Europe initially (where our first agents are)
  const focusRef = useRef<number>(0.3);

  const markers = useMemo(() => {
    return agents
      .filter((agent) => Number.isFinite(agent.lat) && Number.isFinite(agent.lng))
      .map((agent) => {
        const lastPushed = new Date(agent.lastPushedAt).getTime();
        const ageHours = Number.isFinite(lastPushed)
          ? (Date.now() - lastPushed) / (1000 * 60 * 60)
          : Number.POSITIVE_INFINITY;

        let size = 0.03;
        if (ageHours < 1) {
          size = 0.1;
        } else if (ageHours < 24) {
          size = 0.07;
        } else if (ageHours < 168) {
          size = 0.05;
        }

        return {
          location: [agent.lat, agent.lng] as [number, number],
          size,
        };
      });
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;
    phiRef.current = focusRef.current;

    const createOrUpdateGlobe = () => {
      width = canvas.offsetWidth;
      if (width <= 0) return;

      if (!globe) {
        globe = createGlobe(canvas, {
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          width: width * 2,
          height: width * 2,
          phi: phiRef.current,
          theta: 0.15,
          dark: 1,
          diffuse: 3,
          mapSamples: 16000,
          mapBrightness: 2,
          baseColor: [0.12, 0.14, 0.2],
          markerColor: [0.345, 0.651, 1],
          glowColor: [0.06, 0.08, 0.18],
          markers,
          onRender: (state) => {
            if (dragStartX.current === null) {
              phiRef.current += 0.002;
            }
            state.phi = phiRef.current + pointerInteractionMovement.current;
            state.width = width * 2;
            state.height = width * 2;
          },
        });
      }
    };

    const resizeObserver = new ResizeObserver(createOrUpdateGlobe);
    resizeObserver.observe(canvas);

    window.addEventListener("resize", createOrUpdateGlobe);
    createOrUpdateGlobe();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", createOrUpdateGlobe);
      if (globe) {
        globe.destroy();
      }
    };
  }, [markers]);

  const handlePointerEnd = () => {
    if (pointerInteractionMovement.current !== 0) {
      phiRef.current += pointerInteractionMovement.current;
      pointerInteractionMovement.current = 0;
    }
    dragStartX.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  };

  return (
    <div className="relative flex justify-center">
      <div
        style={{ width: "100%", maxWidth: 550, aspectRatio: "1" }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            dragStartX.current = e.clientX;
            if (canvasRef.current) {
              canvasRef.current.style.cursor = "grabbing";
            }
          }}
          onPointerMove={(e) => {
            if (dragStartX.current !== null) {
              const delta = e.clientX - dragStartX.current;
              pointerInteractionMovement.current = delta / 100;
            }
          }}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          style={{
            width: "100%",
            height: "100%",
            cursor: "grab",
            contain: "layout paint size",
            touchAction: "none",
          }}
        />
      </div>
    </div>
  );
}
