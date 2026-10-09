import React from 'react';
import { Check, MoveRight, RotateCcw, Share2 } from 'lucide-react';
import styles from './ProgressStepper.module.css';
import { Collection, Tile } from '../../types/simulation';

interface ProgressStepperProps {
  currentStep: number;
  selectedCollection: Collection | null;
  selectedTile: Tile | null;
  hasSourceImage: boolean;
  hasResultImage: boolean;
  onStepClick: (step: number) => void;
  onReset: () => void;
  onShare: () => void;
}

const STEPS = [
  { number: 1, indexLabel: '01', label: 'Colección' },
  { number: 2, indexLabel: '02', label: 'Mosaico' },
  { number: 3, indexLabel: '03', label: 'Fotografía' },
  { number: 4, indexLabel: '04', label: 'Resultado' },
];

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  selectedCollection,
  selectedTile,
  hasSourceImage,
  hasResultImage,
  onStepClick,
  onReset,
  onShare,
}) => {
  const isStepCompleted = (stepNumber: number): boolean => {
    if (stepNumber === 1) return Boolean(selectedCollection);
    if (stepNumber === 2) return Boolean(selectedCollection && selectedTile);
    if (stepNumber === 3) return Boolean(selectedCollection && selectedTile && hasSourceImage && hasResultImage);
    if (stepNumber === 4) return currentStep === 4 && hasResultImage;
    return false;
  };

  const isStepUnlocked = (stepNumber: number): boolean => {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return Boolean(selectedCollection);
    if (stepNumber === 3) return Boolean(selectedCollection && selectedTile);
    if (stepNumber === 4) return Boolean(selectedCollection && selectedTile && hasSourceImage && hasResultImage);
    return false;
  };

  const renderStepItems = () =>
    STEPS.map((step, idx) => {
      const isActive = currentStep === step.number;
      const completed = isStepCompleted(step.number) && !isActive;
      const unlocked = isStepUnlocked(step.number);

      let subtitle = '';
      if (step.number === 1 && selectedCollection) subtitle = ` · ${selectedCollection.name}`;
      if (step.number === 2 && selectedTile) subtitle = ` · ${selectedTile.name}`;

      return (
        <React.Fragment key={step.number}>
          <button
            type="button"
            onClick={() => onStepClick(step.number)}
            disabled={!unlocked}
            aria-current={isActive ? 'step' : undefined}
            className={`${styles.stepButton} ${isActive ? styles.stepActive : ''} ${completed ? styles.stepCompleted : ''
              }`}
          >
            {completed ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <span className={styles.stepIndex}>{step.indexLabel}</span>
            )}
            <span>
              {step.label}
              {subtitle}
            </span>
          </button>
          {idx < STEPS.length - 1 && (
            <span className={styles.stepArrow} aria-hidden="true">
              <MoveRight size={14} aria-hidden="true" />
            </span>
          )}
        </React.Fragment>
      );
    });

  return (
    <header className={styles.headerWrapper}>
      <div className="studio-container">
        <div className={styles.topBar}>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onStepClick(1);
            }}
            className={styles.brandWordmark}
          >
            <svg width="488" height="115" viewBox="0 0 488 115" xmlns="http://www.w3.org/2000/svg">
              <g fill="currentColor">
                <path d="M0.000298474 0C29.2225 4.39757 27.7618 28.9709 27.7601 29V114.24C-1.41648 109.858 -0.00492828 85.3294 0.000298474 85.2402V0Z" />
                <path d="M343.241 0C372.45 4.39728 370.993 28.9671 370.991 29V114.24C341.812 109.858 343.235 85.3266 343.241 85.2402V0Z" />
                <path d="M428.441 0C457.647 4.3969 456.193 28.9621 456.191 29V114.24C427.011 109.858 428.436 85.3245 428.441 85.2402V0Z" />
                <path d="M295.88 114.16C266.538 109.746 268.137 85.0638 268.141 85V61.7402C268.141 61.7402 266.51 36.9999 295.88 32.5898V114.16Z" />
                <path d="M385.84 32.6807C415.052 37.0782 413.592 61.6613 413.59 61.6904V114.16C384.36 109.77 385.84 85.1602 385.84 85.1602V32.6807Z" />
                <path d="M225.531 32.5801C254.892 36.9976 253.283 61.7097 253.281 61.7402V85C253.283 85.0305 254.892 109.743 225.531 114.15V32.5801Z" />
                <path d="M192.66 0C222.222 4.44454 220.764 29.3168 220.76 29.3799V114.1C191.16 109.649 192.66 84.7197 192.66 84.7197V0Z" />
                <path d="M300.641 32.6299C329.803 36.9917 328.397 61.5431 328.391 61.6396V114.1C299.161 109.72 300.641 85.0996 300.641 85.0996V32.6299Z" />
                <path d="M145.5 114.06C130.497 113.944 118.141 101.732 117.851 86.7305H140C127.37 84.1035 118.147 73.0171 117.861 60.1201V60C118.21 45.0461 130.542 32.9041 145.5 32.79V114.06Z" />
                <path d="M150.13 32.79C165.143 32.9003 177.51 45.1191 177.8 60.1299H151.741C165.859 61.0481 177.145 72.5946 177.741 86.7305V87.3604C177.121 102.107 164.889 113.934 150.13 114.06V32.79Z" />
                <path d="M32.5208 32.5801C61.6944 36.992 60.286 61.4967 60.2806 61.5898V114.05C31.0506 109.67 32.5208 85.0498 32.5208 85.0498V32.5801Z" />
                <path d="M75.2601 32.5801C104.437 36.9924 103.015 61.5023 103.01 61.5898V114.05C73.7905 109.67 75.2601 85.0498 75.2601 85.0498V32.5801Z" />
                <path d="M461 32.79C475.742 32.9723 487.818 45.0482 488 59.79H461V32.79Z" />
                <path d="M88.43 0C95.6316 0.00023452 101.47 5.83839 101.47 13.04C101.47 20.2417 95.6316 26.0798 88.43 26.0801C81.2284 26.0798 75.3909 20.2417 75.3909 13.04C75.3909 5.8384 81.2284 0.00024327 88.43 0Z" />
                <path d="M398.991 0C406.192 0.000300488 412.031 5.83843 412.031 13.04C412.031 20.2416 406.192 26.0798 398.991 26.0801C391.789 26.0801 385.951 20.2418 385.951 13.04C385.951 5.83825 391.789 0 398.991 0Z" />
              </g>
            </svg>
          </a>

          <nav className={styles.stepperNav} aria-label="Progreso del configurador">
            {renderStepItems()}
          </nav>

          <div className={styles.actionsZone}>
            <button
              type="button"
              onClick={onShare}
              className="btn-ghost"
              title="Copiar enlace de configuración"
            >
              <Share2 size={15} aria-hidden="true" />
              <span>Compartir</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="btn-ghost"
              title="Reiniciar configuración desde el paso 1"
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        <nav className={`hide-scrollbar ${styles.mobileProgressRow}`} aria-label="Pasos en dispositivo móvil">
          {renderStepItems()}
        </nav>
      </div>
    </header>
  );
};
