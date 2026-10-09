import React, { useState } from 'react';
import { Download } from 'lucide-react';
import styles from './DownloadButton.module.css';

interface DownloadButtonProps {
  onExportHighRes: (format: 'png' | 'jpeg', onProgress: (pct: number) => void) => Promise<void>;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onExportHighRes,
  disabled = false,
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleDownload = async () => {
    if (isExporting || disabled) return;
    setIsExporting(true);
    setProgress(15);
    try {
      await onExportHighRes(exportFormat, (pct) => {
        setProgress(pct);
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 450);
    }
  };

  return (
    <div className={styles.downloadBox}>
      <div className={styles.controlsRow}>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg')}
          disabled={isExporting || disabled}
          aria-label="Formato de descarga en alta resolución"
          className={styles.formatSelect}
        >
          <option value="png">PNG · Máxima calidad (Sin pérdida)</option>
          <option value="jpeg">JPG · Alta resolución optimizada</option>
        </select>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting || disabled}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          <Download size={16} aria-hidden="true" />
          <span>
            {isExporting ? 'Procesando alta resolución...' : 'Descargar simulación'}
          </span>
        </button>
      </div>

      {isExporting && (
        <div className={styles.progressBox} role="status" aria-live="polite">
          <div className={styles.progressHeader}>
            <span>Preparando imagen en alta resolución...</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
