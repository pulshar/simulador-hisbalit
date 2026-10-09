import React, { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';
import styles from './BeforeAfterSlider.module.css';

interface BeforeAfterSliderProps {
  originalImage: string;
  simulationImage: string;
  tileName: string;
  collectionName: string;
}

type ViewMode = 'split' | 'simulation' | 'original';

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalImage,
  simulationImage,
  tileName,
  collectionName,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sliderPercent, setSliderPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const updateSliderFromClientX = (clientX: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPercent(Math.max(2, Math.min(98, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (viewMode !== 'split') return;
    setIsDragging(true);
    updateSliderFromClientX(e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || viewMode !== 'split') return;
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={styles.viewerContainer}>
      <div className={`hide-mobile ${styles.topControlsRow}`}>
        <div className={styles.modeToggleGroup} role="group" aria-label="Modo de visualización">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`${styles.modeBtn} ${viewMode === 'split' ? styles.modeBtnActive : ''}`}
          >
            Comparador Antes / Después
          </button>
          <button
            type="button"
            onClick={() => setViewMode('simulation')}
            className={`${styles.modeBtn} ${viewMode === 'simulation' ? styles.modeBtnActive : ''
              }`}
          >
            Simulación
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`${styles.modeBtn} ${viewMode === 'original' ? styles.modeBtnActive : ''}`}
          >
            Original
          </button>
        </div>

        {viewMode === 'split' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label htmlFor="comparison-range" className="text-metadata">
              Deslizar comparación:
            </label>
            <input
              id="comparison-range"
              type="range"
              min={2}
              max={98}
              value={Math.round(sliderPercent)}
              onChange={(e) => setSliderPercent(Number(e.target.value))}
              aria-label="Porcentaje de comparación entre original y simulación"
              style={{ width: '110px', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        )}
      </div>

      <div
        ref={stageRef}
        className={styles.stageFrame}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: viewMode === 'split' ? 'ew-resize' : 'default' }}
        data-testid="simulation-comparison-stage"
      >
        <img
          src={viewMode === 'original' ? originalImage : simulationImage}
          alt={
            viewMode === 'original'
              ? 'Fotografía original del espacio'
              : `Simulación con mosaico ${tileName} de la colección ${collectionName}`
          }
          referrerPolicy="no-referrer"
          className={styles.baseImage}
        />

        {viewMode === 'split' && (
          <>
            <div
              className={styles.overlayClipLayer}
              style={{
                clipPath: `inset(0 ${100 - sliderPercent}% 0 0)`,
              }}
            >
              <img
                src={originalImage}
                alt="Fotografía original antes del revestimiento"
                referrerPolicy="no-referrer"
                className={styles.overlayImage}
              />
            </div>

            <div
              className={styles.dividerLine}
              style={{ left: `${sliderPercent}%` }}
              aria-hidden="true"
            >
              <div className={styles.dividerHandle}>
                <MoveHorizontal size={18} />
              </div>
            </div>

            <span className={styles.cornerLabelLeft}>Original</span>
            <span className={styles.cornerLabelRight}>
              {/* Simulación · {collectionName} {tileName} */}
              Simulación
            </span>
          </>
        )}

        {viewMode === 'simulation' && (
          <span className={styles.cornerLabelRight}>
            Simulación · {collectionName} {tileName}
          </span>
        )}

        {viewMode === 'original' && (
          <span className={styles.cornerLabelLeft}>Fotografía Original</span>
        )}
      </div>
    </div>
  );
};
