import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Trash2, Pencil } from 'lucide-react';

interface SwipeableCardProps {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  /** Bumping this value resets all cards (e.g. tab/category change) */
  resetKey?: string | number;
  className?: string;
}

const ACTION_WIDTH = 116;   // total width of both action buttons
const SNAP_OPEN = -ACTION_WIDTH;
const THRESHOLD = 50;       // min drag before snapping open

export function SwipeableCard({ children, onEdit, onDelete, resetKey, className = '' }: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Refs hold the live values so pointer-up reads fresh data, not stale state
  const liveOffset = useRef(0);
  const baseOffset = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<'h' | 'v' | null>(null);
  const draggingRef = useRef(false);

  const setLive = (v: number) => {
    liveOffset.current = v;
    setOffset(v);
  };

  // Reset on tab/category change
  useEffect(() => {
    setLive(0);
    baseOffset.current = 0;
  }, [resetKey]);

  const snapClose = () => {
    setLive(0);
    baseOffset.current = 0;
  };

  const snapOpen = () => {
    setLive(SNAP_OPEN);
    baseOffset.current = SNAP_OPEN;
  };

  const isOpen = offset <= SNAP_OPEN / 2;

  // --- Unified pointer handling (works for touch AND mouse) ---
  const onPointerDown = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    baseOffset.current = liveOffset.current;
    axis.current = null;
    draggingRef.current = true;
    setDragging(true);
  };

  const onPointerMove = (clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;

    if (!axis.current) {
      if (Math.abs(dx) > Math.abs(dy) + 4) {
        axis.current = 'h';
      } else if (Math.abs(dy) > Math.abs(dx) + 4) {
        axis.current = 'v';
        draggingRef.current = false;
        setDragging(false);
        return;
      } else {
        return;
      }
    }
    if (axis.current !== 'h') return;

    const raw = baseOffset.current + dx;
    // Clamp: can't go further right than 0, can't go further left than SNAP_OPEN
    const clamped = Math.min(0, Math.max(SNAP_OPEN, raw));
    setLive(clamped);
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (axis.current !== 'h') return;

    const current = liveOffset.current;
    const moved = current - baseOffset.current;

    if (moved < -THRESHOLD) {
      // Swiped left past threshold → stay OPEN
      snapOpen();
    } else if (moved > THRESHOLD) {
      // Swiped right past threshold → close
      snapClose();
    } else {
      // Released without enough movement → snap back to nearest rest
      baseOffset.current === 0 ? snapClose() : snapOpen();
    }
  };

  // --- Touch handlers ---
  const handleTouchStart = (e: React.TouchEvent) => onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchEnd = () => onPointerUp();

  // --- Mouse handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onPointerDown(e.clientX, e.clientY);

    const handleMove = (ev: MouseEvent) => onPointerMove(ev.clientX, ev.clientY);
    const handleUp = () => {
      onPointerUp();
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onClick={isOpen ? snapClose : undefined}
    >
      {/* Action buttons BEHIND the card, revealed on swipe-left */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={(e) => { e.stopPropagation(); snapClose(); onDelete(); }}
          className="w-[58px] flex items-center justify-center bg-rose-500 text-white active:brightness-90 transition-[filter]"
          aria-label="Удалить"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); snapClose(); onEdit(); }}
          className="w-[58px] flex items-center justify-center bg-[#4A90D9] text-white active:brightness-90 transition-[filter] rounded-r-2xl"
          aria-label="Редактировать"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content — solid white, sits ON TOP and fully covers the actions */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: 'transform',
          position: 'relative',
          zIndex: 1,
          background: 'white',
        }}
        className="rounded-2xl"
      >
        {children}
      </div>
    </div>
  );
}
