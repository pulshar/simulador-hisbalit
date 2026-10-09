import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import styles from './ImageUploader.module.css';
import {
  Collection,
  DemoPhotograph,
  Tile,
  TileFinish,
  TileFormat,
} from '../../types/simulation';
import { DEMO_PHOTOGRAPHS, GROUT_COLORS } from '../../data/collections';
import { SimulationProgressStage } from '../../services/geminiSimulationService';

interface ImageUploaderProps {
  selectedCollection: Collection;
  selectedTile: Tile;
  tileFormat: TileFormat;
  tileFinish: TileFinish;
  groutColor: string;
  sourceImage: string | null;
  sourceImageName: string | null;
  sourceImageDimensions: { width: number; height: number } | null;
  isGenerating: boolean;
  generationStage: SimulationProgressStage | null;
  generationError: string | null;
  onImageChange: (
    dataUrl: string | null,
    name: string | null,
    dimensions: { width: number; height: number } | null
  ) => void;
  onBack: () => void;
  onGenerateSimulation: () => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  selectedCollection,
  selectedTile,
  tileFormat,
  tileFinish,
  groutColor,
  sourceImage,
  sourceImageName,
  sourceImageDimensions,
  isGenerating,
  generationStage,
  generationError,
  onImageChange,
  onBack,
  onGenerateSimulation,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const tileSwatchUrl = selectedTile.image;

  const groutLabel = useMemo(() => {
    const found = GROUT_COLORS.find((g) => g.hex === groutColor);
    return found ? found.name : 'Junta 2mm';
  }, [groutColor]);

  const processFile = (file: File) => {
    setUploadError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !isAllowedExt) {
      setUploadError(
        'Formato de archivo no soportado. Por favor, sube una imagen en formato JPG, JPEG, PNG o WebP.'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        'La fotografía supera el límite máximo permitido de 10 MB. Por favor, selecciona un archivo más ligero.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('No se ha podido leer el archivo. Es posible que la imagen esté dañada.');
    };
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => {
        setUploadError(
          'El archivo seleccionado no es una imagen válida o está corrupto. Prueba con otra fotografía JPG, PNG o WebP.'
        );
      };
      img.onload = () => {
        onImageChange(dataUrl, file.name, {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isGenerating) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSelectDemo = (demo: DemoPhotograph) => {
    if (isGenerating) return;
    setUploadError(null);
    onImageChange(demo.imageUrl, demo.title, { width: 1440, height: 810 });
  };

  const canSimulate = Boolean(sourceImage) && !isGenerating;

  return (
    <section className={styles.sectionWrapper} aria-labelledby="step3-heading">
      <div className="studio-container">
        <div className={styles.headerBlock}>
          <span className="text-kicker">
            <span className="number">03</span> · Fotografía del Espacio ({selectedCollection.name} · {selectedTile.name})
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div className="title-group">
              <h1 id="step3-heading" className="heading-display">
                Sube una fotografía del espacio
              </h1>
              <p className="text-prose">
                Sube una fotografía de tu piscina, terraza, baño o pared, o elige una imagen de muestra. Al pulsar «Generar simulación», Gemini identificará automáticamente la superficie arquitectónica adecuada y aplicará el mosaico seleccionado respetando iluminación, agua y perspectiva.
              </p>
            </div>

            <div className="flex-stepper-buttons">
              <button
                type="button"
                onClick={onBack}
                disabled={isGenerating}
                className="btn-secondary"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={onGenerateSimulation}
                disabled={!canSimulate}
                className="btn-primary btn-w-100"
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>
                  {isGenerating
                    ? generationStage || 'Generando simulación...'
                    : 'Generar simulación'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className={styles.errorBanner} role="alert" style={{ marginBottom: '1.5rem' }}>
            <div className={styles.errorContent}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{uploadError}</span>
            </div>
          </div>
        )}

        {generationError && (
          <div className={styles.errorBanner} role="alert" style={{ marginBottom: '1.5rem' }}>
            <div className={styles.errorContent}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{generationError}</span>
            </div>
            <button
              type="button"
              onClick={onGenerateSimulation}
              disabled={isGenerating || !sourceImage}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', minHeight: '36px', fontSize: '0.8125rem' }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        <div className={styles.layoutGrid}>
          <div className={styles.mainColumn}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-label="Seleccionar archivo de fotografía"
            />

            <div className={styles.configSummaryBar}>
              <div className={styles.tileMiniCard}>
                <img
                  src={tileSwatchUrl}
                  alt={`Mosaico ${selectedTile.name}`}
                  referrerPolicy="no-referrer"
                  className={styles.tileMiniSwatch}
                />
                <div>
                  <span className="text-kicker">
                    {/* Colección {selectedCollection.name} · {selectedTile.referenceCode} */}
                    Colección {selectedCollection.name}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {selectedTile.name} ({selectedTile.color} · {selectedTile.tonality})
                  </div>
                  <div className="text-metadata">
                    Formato {tileFormat === '2.5x2.5' ? '2,5 × 2,5 cm' : '4 × 4 cm'} · Acabado{' '}
                    {tileFinish} · {groutLabel}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onBack}
                disabled={isGenerating}
                className="btn-ghost btn-show-text"
              >
                <span>Cambiar mosaico</span>
              </button>
            </div>

            {!sourceImage ? (
              <div
                onClick={() => !isGenerating && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`${styles.dropzoneBox} ${isDragging ? styles.dropzoneActive : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isGenerating) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '2.5rem 1rem',
                  }}
                >
                  <Upload size={32} color="var(--accent-primary)" aria-hidden="true" />
                  <h2 className="heading-section" style={{ fontSize: '1.35rem' }}>
                    Arrastra tu fotografía aquí o haz clic para explorar
                  </h2>
                  <p className="text-metadata">
                    Formatos admitidos: JPG, JPEG, PNG, WebP · Tamaño máximo: 10 MB
                  </p>
                  <span className="btn-primary" style={{ marginTop: '0.5rem' }}>
                    Seleccionar fotografía
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`${styles.dropzoneBox} ${styles.dropzoneCompact} ${isDragging ? styles.dropzoneActive : ''
                    }`}
                >
                  <div className={styles.fileMetaRow}>
                    <span
                      className="text-metadata"
                      style={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      Fotografía seleccionada: {sourceImageName || 'Espacio personalizado'}
                    </span>
                    {sourceImageDimensions && (
                      <span className="text-metadata">
                        · Resolución original:{' '}
                        <span className="tabular-nums">
                          {sourceImageDimensions.width} × {sourceImageDimensions.height} px
                        </span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                      className="btn-secondary btn-show-text"
                      style={{
                        padding: '0.45rem 0.9rem',
                        minHeight: '38px',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <ImagePlus size={14} aria-hidden="true" />
                      <span>Subir otra fotografía</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onImageChange(null, null, null)}
                      disabled={isGenerating}
                      className="btn-ghost"
                      title="Eliminar fotografía actual"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                <div className={styles.photoPreviewContainer}>
                  <img
                    src={sourceImage}
                    alt={sourceImageName || 'Vista previa del espacio'}
                    referrerPolicy="no-referrer"
                    className={styles.photoPreviewImg}
                  />

                  {isGenerating && (
                    <div className={styles.generatingOverlay} role="status" aria-live="polite">
                      <div className={styles.spinnerRing} aria-hidden="true" />
                      <div className={styles.stageBadge}>
                        {generationStage || 'Analizando fotografía...'}
                      </div>
                      <p className={styles.stageSubtext}>
                        Gemini está identificando la superficie arquitectónica de la imagen y aplicando el mosaico {selectedTile.name} ({tileFormat === '2.5x2.5' ? '2,5 × 2,5 cm' : '4 × 4 cm'} · {tileFinish}) conservando la iluminación, el agua y la perspectiva original.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <aside className={styles.sideColumn}>
            <div className={styles.panelSection}>
              <h2 className={styles.panelHeading}>Espacios arquitectónicos de muestra</h2>
              <p className="text-metadata">
                ¿No tienes una fotografía a mano? Selecciona uno de estos espacios de referencia para probar la simulación:
              </p>
              <div className={styles.demoPhotosList}>
                {DEMO_PHOTOGRAPHS.map((demo) => {
                  const isActive = sourceImage === demo.imageUrl;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleSelectDemo(demo)}
                      className={`${styles.demoPhotoBtn} ${isActive ? styles.demoPhotoActive : ''
                        }`}
                    >
                      <img
                        src={demo.imageUrl}
                        alt={demo.title}
                        referrerPolicy="no-referrer"
                        className={styles.demoThumb}
                      />
                      <div className={styles.demoInfo}>
                        <span className={styles.demoTitle}>{demo.title}</span>
                        <span className={styles.demoSub}>{demo.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.panelSection}>
              <h2 className={styles.panelHeading}>Recomendaciones para un resultado óptimo</h2>
              <ul className={styles.recommendationsList}>
                <li className={styles.recommendationItem}>
                  <span className={styles.bulletDot} aria-hidden="true" />
                  <span>
                    <strong>Buena iluminación:</strong> Las fotografías con luz natural conservan mejor los reflejos del agua, las cáusticas y las sombras.
                  </span>
                </li>
                <li className={styles.recommendationItem}>
                  <span className={styles.bulletDot} aria-hidden="true" />
                  <span>
                    <strong>Superficie visible:</strong> Asegúrate de que el interior de la piscina, escalones, terraza o pared sea claramente visible en el encuadre.
                  </span>
                </li>
                <li className={styles.recommendationItem}>
                  <span className={styles.bulletDot} aria-hidden="true" />
                  <span>
                    <strong>Detección inteligente:</strong> No necesitas dibujar máscaras ni seleccionar puntos; el motor interpreta automáticamente la geometría tridimensional del espacio.
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className={styles.wizardFooterBar}>

          <div className="text-metadata">
            {!sourceImage
              ? 'Sube una fotografía o selecciona una imagen de muestra para continuar.'
              : isGenerating
                ? `${generationStage || 'Generando simulación...'} Por favor, espera unos segundos.`
                : `Fotografía lista para generar la simulación con ${selectedTile.name} (${selectedCollection.name}).`}
          </div>
          <div className="flex-stepper-buttons">
            <button
              type="button"
              onClick={onBack}
              disabled={isGenerating}
              className="btn-secondary"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Atrás a Mosaicos</span>
            </button>
            <button
              type="button"
              onClick={onGenerateSimulation}
              disabled={!canSimulate}
              className="btn-primary btn-w-100"
            >
              <Sparkles size={16} aria-hidden="true" />
              <span>
                {isGenerating
                  ? generationStage || 'Generando simulación...'
                  : 'Generar simulación'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
