"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);

  // Focus on Europe initially (where our first agents are)
  const focusRef = useRef<number>(0.3);

  const markers = agents.map((agent) => {
    const lastPushed = new Date(agent.lastPushedAt).getTime();
    const ageHours = (Date.now() - lastPushed) / (1000 * 60 * 60);

    let size: number;
    if (ageHours < 1) {
      size = 0.1;
    } else if (ageHours < 24) {
      size = 0.07;
    } else if (ageHours < 168) {
      size = 0.05;
    } else {
      size = 0.03;
    }

    return {
      location: [agent.lat, agent.lng] as [number, number],
      size,
    };
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: focusRef.current,
      theta: 0.15,
      dark: 1,
      diffuse: 3,
      mapSamples: 36000,
      mapBrightness: 2,
      baseColor: [0.12, 0.14, 0.2],
      markerColor: [0.345, 0.651, 1],
      glowColor: [0.06, 0.08, 0.18],
      markers,
      onRender: (state) => {
        if (pointerInteracting.current === null) {
          phiRef.current += 0.002;
        }
        state.phi = phiRef.current + pointerInteractionMovement.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [agents]);

  return (
    <div className="relative flex justify-center">
      <div
        style={{ width: "100%", maxWidth: 550, aspectRatio: "1" }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
            canvasRef.current!.style.cursor = "grabbing";
          }}
          onPointerUp={() => {
            pointerInteracting.current = null;
            canvasRef.current!.style.cursor = "grab";
          }}
          onPointerOut={() => {
            pointerInteracting.current = null;
            canvasRef.current!.style.cursor = "grab";
          }}
          onMouseMove={(e) => {
            if (pointerInteracting.current !== null) {
              const delta = e.clientX - pointerInteracting.current;
              pointerInteractionMovement.current = delta / 100;
            }
          }}
          onTouchMove={(e) => {
            if (pointerInteracting.current !== null && e.touches[0]) {
              const delta = e.touches[0].clientX - pointerInteracting.current;
              pointerInteractionMovement.current = delta / 100;
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            cursor: "grab",
            contain: "layout paint size",
          }}
        />
      </div>
    </div>
  );
}
