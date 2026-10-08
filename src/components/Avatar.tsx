import { useEffect, useState } from 'react';
import charUrl from '../assets/character.png';
import { audio } from '../game/audio';

// Suun avautumisen kuvasarja (px, 500×500-koordinaateissa)
const OPEN = [0, 7, 13, 9, 3, 11, 5, 14, 2, 8, 12, 4];
const SKIN = '#FFEBC6';

interface Props {
  size: number;
  talking: boolean;
  delayMs?: number;
  offsetX?: number;
  onClick?: () => void;
  className?: string;
  voice?: boolean;
}

/** Hessuniemi. Suu liikkuu, kun hän puhuu. */
export function Avatar({ size, talking, delayMs = 0, offsetX = 0, onClick, className = '', voice = false }: Props) {
  const [frame, setFrame] = useState(-1);

  useEffect(() => {
    if (!talking) {
      setFrame(-1);
      return;
    }
    let iv: number | undefined;
    const to = window.setTimeout(() => {
      setFrame(0);
      iv = window.setInterval(() => setFrame((f) => f + 1), 95);
    }, delayMs);
    return () => {
      window.clearTimeout(to);
      if (iv) window.clearInterval(iv);
    };
  }, [talking, delayMs]);

  const open = frame < 0 ? -1 : OPEN[frame % OPEN.length];

  useEffect(() => {
    if (voice && open >= 7) audio.talk();
  }, [frame, voice, open]);

  return (
    <svg
      viewBox="40 40 420 420"
      width={size}
      height={size}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ transform: offsetX ? `translateX(${offsetX}px)` : undefined }}
      onClick={onClick}
      role="img"
      aria-label="Hessuniemi"
    >
      <image href={charUrl} x="0" y="0" width="500" height="500" />
      {open >= 0 && (
        <g>
          {/* Peitetään alkuperäinen suu ihonvärillä */}
          <rect x="222" y="343" width="96" height="27" rx="12" fill={SKIN} />
          {open < 4 ? (
            <path d="M238 359 Q268 353 298 359" stroke="#111" strokeWidth="7" strokeLinecap="round" fill="none" />
          ) : (
            <g>
              <ellipse cx="268" cy="358" rx={20 + open * 0.5} ry={open} fill="#4a1712" stroke="#111" strokeWidth="6" />
              {open > 8 && <ellipse cx="268" cy={358 + open * 0.45} rx={10 + open * 0.2} ry={open * 0.35} fill="#c4615a" />}
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
