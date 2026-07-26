// src/components/common/AnimeLayoutGrid.jsx
import { useEffect, useRef, useLayoutEffect } from "react";
import { animate } from "animejs";
import "./AnimeLayoutGrid.css";

/**
 * AnimeLayoutGrid (Powered by Anime.js Layout Animations)
 * --------------------------------------------------------
 * Implements smooth Anime.js FLIP layout transitions when children or filter state
 * changes (filtering, reordering, adding, removing cards in a grid).
 */
export default function AnimeLayoutGrid({ children, filterKey, className = "" }) {
  const containerRef = useRef(null);
  const positionsRef = useRef(new Map());

  // Capture initial positions before DOM mutation
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const items = Array.from(containerRef.current.children);
    const newPositions = new Map();

    items.forEach((item, idx) => {
      const rect = item.getBoundingClientRect();
      const id = item.dataset.id || idx;
      newPositions.set(id, rect);
    });

    positionsRef.current = newPositions;
  }, [filterKey, children]);

  // Animate FLIP transitions after DOM updates
  useEffect(() => {
    if (!containerRef.current) return;
    const items = Array.from(containerRef.current.children);
    const oldPositions = positionsRef.current;

    items.forEach((item, idx) => {
      const id = item.dataset.id || idx;
      const oldRect = oldPositions.get(id);
      const newRect = item.getBoundingClientRect();

      if (oldRect) {
        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;

        if (deltaX !== 0 || deltaY !== 0) {
          // Play smooth Anime.js FLIP layout animation
          animate(item, {
            translateX: [deltaX, 0],
            translateY: [deltaY, 0],
            scale: [0.95, 1],
            opacity: [0.6, 1],
            ease: "outExpo",
            duration: 650,
          });
        }
      } else {
        // New item enter animation
        animate(item, {
          scale: [0.7, 1],
          opacity: [0, 1],
          translateY: [30, 0],
          ease: "outExpo",
          duration: 550,
        });
      }
    });
  }, [filterKey, children]);

  return (
    <div className={`alg-container ${className}`} ref={containerRef}>
      {children}
    </div>
  );
}
