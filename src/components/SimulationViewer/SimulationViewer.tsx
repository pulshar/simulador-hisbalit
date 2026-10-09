import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Grid,
  Heart,
  Image as ImageIcon,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import styles from './SimulationViewer.module.css';
import {
  Collection,
  EdgeColorMode,
  SimulationHistoryItem,
  Tile,
  TileFinish,
  TileFormat,
} from '../../types/simulation';
import { EDGE_COLORS, GROUT_COLORS } from '../../data/collections';
import { SimulationProgressStage } from '../../services/geminiSimulationService';
import { BeforeAfterSlider } from '../BeforeAfterSlider/BeforeAfterSlider';
import { DownloadButton } from '../DownloadButton/DownloadButton';

interface SimulationViewerProps {
  collections: Collection[];
  selectedCollection: Collection;
  selectedTile: Tile;
  sourceImage: string;
  resultImage: string;
  tileFormat: TileFormat;
  tileFinish: TileFinish;
  groutColor: string;
  applyEdge: boolean;
  edgeColor: EdgeColorMode;
  favoriteTileIds: string[];
  history: SimulationHistoryItem[];
  isGenerating: boolean;
  generationStage: SimulationProgressStage | null;
  generationError: string | null;
  onUpdateParams: (
    partial: Partial<{
      tileFormat: TileFormat;
      tileFinish: TileFinish;
      groutColor: string;
      applyEdge: boolean;
      edgeColor: EdgeColorMode;
    }>
  ) => void;
  onToggleFavorite: (tileId: string) => void;
  onSelectTileAndCollection: (tile: Tile, collection: Collection) => void;
  onRegenerateSimulation: (override?: {
    collection?: Collection;
    tile?: Tile;
    tileFormat?: TileFormat;
    tileFinish?: TileFinish;
    groutColor?: string;
    applyEdge?: boolean;
    edgeColor?: EdgeColorMode;
  }) => void;
  onRestoreHistory: (item: SimulationHistoryItem) => void;
  onEditStep: (step: number) => void;
}

const FAVORITES_TAB_ID = '__favorites__';

export const SimulationViewer: React.FC<SimulationViewerProps> = ({
  collections,
  selectedCollection,
  selectedTile,
  sourceImage,
  resultImage,
  tileFormat,
  tileFinish,
  groutColor,
  applyEdge,
  edgeColor,
  favoriteTileIds,
  history,
  isGenerating,
  generationStage,
  generationError,
  onUpdateParams,
  onToggleFavorite,
  onSelectTileAndCollection,
  onRegenerateSimulation,
  onRestoreHistory,
  onEditStep,
}) => {
  const [quickSwapColId, setQuickSwapColId] = useState<string>(selectedCollection.id);

  const collectionMap = useMemo(() => {
    const map = new Map<string, Collection>();
    collections.forEach((c) => map.set(c.id, c));
    return map;
  }, [collections]);

  const activeEdgeColorObj =
    EDGE_COLORS.find((c) => c.id === edgeColor) || EDGE_COLORS[0];
  const specificEdgeColors = EDGE_COLORS.filter((c) => c.id !== 'coordinated');

  const handleExportHighRes = async (
    format: 'png' | 'jpeg',
    onProgress: (pct: number) => void
  ) => {
    onProgress(25);
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        onProgress(70);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 2048;
        canvas.height = img.naturalHeight || img.height || 1365;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo exportar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.96);
        onProgress(100);

        const link = document.createElement('a');
        const cleanTile = selectedTile.name.toLowerCase().replace(/\s+/g, '-');
        const edgeSuffix = applyEdge ? `-remate-${edgeColor}` : '';
        link.download = `hisbalit-simulador-${selectedCollection.id}-${cleanTile}-${tileFormat}${edgeSuffix}.${format === 'png' ? 'png' : 'jpg'
          }`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      };
      img.onerror = () => reject(new Error('Error al exportar la imagen'));
      img.src = resultImage;
    });
  };

  const tileSwatchUrl = selectedTile.image;
  const isCurrentTileFav = favoriteTileIds.includes(selectedTile.id);

  const isFavoritesTab = quickSwapColId === FAVORITES_TAB_ID;
  const quickSwapCollection =
    collections.find((c) => c.id === quickSwapColId) || selectedCollection;

  const quickSwapTiles = useMemo(() => {
    if (isFavoritesTab) {
      return collections
        .flatMap((c) => c.tiles)
        .filter((t) => favoriteTileIds.includes(t.id));
    }
    return quickSwapCollection.tiles;
  }, [isFavoritesTab, collections, favoriteTileIds, quickSwapCollection.tiles]);

  const handleQuickTileSelect = (tile: Tile) => {
    if (isGenerating) return;
    const col = collectionMap.get(tile.collectionId) || selectedCollection;
    const validFormat = tile.availableFormats.includes(tileFormat)
      ? tileFormat
      : tile.availableFormats[0];
    const validFinish = tile.availableFinishes.includes(tileFinish)
      ? tileFinish
      : tile.availableFinishes[0];

    onSelectTileAndCollection(tile, col);
    onRegenerateSimulation({
      collection: col,
      tile,
      tileFormat: validFormat,
      tileFinish: validFinish,
      groutColor,
      applyEdge,
      edgeColor,
    });
  };

  return (
    <section className={styles.sectionWrapper} aria-labelledby="step4-heading">
      <div className="studio-container">
        <div className={styles.headerRow}>
          <div>
            <span className="text-kicker">
              Paso 04 · Simulación Arquitectónica y Especificaciones
            </span>
            <h1 id="step4-heading" className="heading-display" style={{ marginTop: "1.25rem" }}>
              Descubre cómo quedaría {selectedTile.name} en tu espacio
            </h1>
          </div>

          <div className={styles.editActionsGroup}>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onEditStep(2)}
              className="btn-secondary btn-show-text"
              style={{ padding: '0.55rem 1rem', minHeight: '40px', fontSize: '0.8125rem' }}
            >
              <Grid size={14} aria-hidden="true" />
              <span>Cambiar mosaico</span>
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onEditStep(3)}
              className="btn-secondary btn-show-text"
              style={{ padding: '0.55rem 1rem', minHeight: '40px', fontSize: '0.8125rem' }}
            >
              <ImageIcon size={14} aria-hidden="true" />
              <span>Cambiar foto</span>
            </button>
          </div>
        </div>

        {generationError && (
          <div className={styles.errorBanner} role="alert">
            <div className="flex-stepper-buttons">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{generationError}</span>
            </div>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onRegenerateSimulation()}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', minHeight: '36px', fontSize: '0.8125rem' }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        <div className={styles.workspaceGrid}>
          <div className={styles.leftViewportCol}>
            <div className={styles.viewportWrapper}>
              <BeforeAfterSlider
                originalImage={sourceImage}
                simulationImage={resultImage}
                tileName={selectedTile.name}
                collectionName={selectedCollection.name}
              />

              {isGenerating && (
                <div className={styles.regeneratingOverlay} role="status" aria-live="polite">
                  <div className={styles.spinnerRing} aria-hidden="true" />
                  <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                    {generationStage || 'Aplicando mosaico...'}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', maxWidth: 380 }}>
                    Generando nueva simulación realista con {selectedTile.name} (
                    {tileFormat === '2.5x2.5' ? '2,5 × 2,5 cm' : '4 × 4 cm'} · {tileFinish})...
                  </p>
                </div>
              )}
            </div>

            <div className={styles.quickSwapSection}>
              <div className={styles.quickSwapHeader}>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                    Probar otro mosaico sobre esta misma fotografía
                  </h2>
                  <p className="text-metadata">
                    Selecciona cualquier diseño de nuestras colecciones o de tus favoritos para actualizar la simulación sobre tu fotografía.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setQuickSwapColId(FAVORITES_TAB_ID)}
                    className={`${styles.optionBtn} ${isFavoritesTab ? styles.optionBtnActive : ''
                      }`}
                    style={{
                      minWidth: 'auto',
                      padding: '0.35rem 0.75rem',
                      minHeight: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Heart
                      size={13}
                      fill={isFavoritesTab ? '#FFFFFF' : favoriteTileIds.length > 0 ? '#B8332A' : 'none'}
                      color={isFavoritesTab ? '#FFFFFF' : favoriteTileIds.length > 0 ? '#B8332A' : 'currentColor'}
                      aria-hidden="true"
                    />
                    <span>Favoritos ({favoriteTileIds.length})</span>
                  </button>

                  {collections.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setQuickSwapColId(col.id)}
                      className={`${styles.optionBtn} ${!isFavoritesTab && quickSwapColId === col.id ? styles.optionBtnActive : ''
                        }`}
                      style={{ minWidth: 'auto', padding: '0.35rem 0.75rem', minHeight: '34px' }}
                    >
                      {col.name} ({col.tiles.length})
                    </button>
                  ))}
                </div>
              </div>

              {quickSwapTiles.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border-strong)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <span>
                    Aún no tienes mosaicos guardados en favoritos. Puedes marcarlos en el Paso 02 o pulsar el corazón junto al mosaico actual.
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuickSwapColId(selectedCollection.id)}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', minHeight: '34px', fontSize: '0.78rem' }}
                  >
                    Ver {selectedCollection.name}
                  </button>
                </div>
              ) : (
                <div className={styles.quickTilesRow}>
                  {quickSwapTiles.map((t) => {
                    const isCurrent = t.id === selectedTile.id;
                    const thumb = t.image;
                    const tileCol = collectionMap.get(t.collectionId);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleQuickTileSelect(t)}
                        className={`${styles.quickTileBtn} ${isCurrent ? styles.quickTileActive : ''
                          }`}
                      >
                        <img
                          src={thumb}
                          alt={`Probar mosaico ${t.name}`}
                          referrerPolicy="no-referrer"
                          className={styles.quickTileImg}
                        />
                        <span className={styles.quickTileName}>{t.name}</span>
                        <span className={styles.quickTileMeta}>
                          {isFavoritesTab && tileCol ? `${tileCol.name} · ` : ''}
                          {t.color} · {t.tonality}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {history.length > 1 && (
              <div className={styles.quickSwapSection}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
                    Historial de simulaciones en esta sesión ({history.length})
                  </h2>
                  <p className="text-metadata">
                    Haz clic en cualquier simulación generada anteriormente para compararla al instante.
                  </p>
                </div>

                <div className={styles.historyGrid}>
                  {history.map((item) => {
                    const histEdgeCol = EDGE_COLORS.find((c) => c.id === item.edgeColor);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => onRestoreHistory(item)}
                        className={styles.historyCard}
                      >
                        <img
                          src={item.previewDataUrl}
                          alt={`Historial ${item.tile.name}`}
                          referrerPolicy="no-referrer"
                          className={styles.historyImg}
                        />
                        <div className={styles.historyInfo}>
                          <span className={styles.quickTileName}>
                            {item.collection.name} · {item.tile.name}
                          </span>
                          <span className={styles.quickTileMeta}>
                            {item.tileFormat} cm · {item.tileFinish}
                            {item.applyEdge
                              ? ` · Remate ${item.edgeColor === 'coordinated'
                                ? 'Coordinado'
                                : histEdgeCol?.name || ''
                              }`
                              : ''}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <aside className={styles.rightControlsCol}>
            <div className={styles.controlPanel}>
              <div className={styles.selectedTileBanner}>
                <img
                  src={tileSwatchUrl}
                  alt={`Muestra ${selectedTile.name}`}
                  referrerPolicy="no-referrer"
                  className={styles.tileThumb}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="text-kicker">
                    Colección {selectedCollection.name}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.2 }}>
                    {selectedTile.name}
                  </h2>
                  <p className="text-metadata">
                    {selectedTile.color} · {selectedTile.tonality} · {tileFormat} cm ({tileFinish})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(selectedTile.id)}
                  aria-label={
                    isCurrentTileFav
                      ? `Quitar ${selectedTile.name} de favoritos`
                      : `Guardar ${selectedTile.name} en favoritos`
                  }
                  title={isCurrentTileFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCurrentTileFav ? '#B8332A' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  <Heart
                    size={16}
                    fill={isCurrentTileFav ? '#B8332A' : 'none'}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <DownloadButton
                onExportHighRes={handleExportHighRes}
                disabled={isGenerating}
              />

              {/* <div className={styles.specsSummaryList}>
                <span>{selectedCollection.specs.thickness}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCollection.specs.joint}</span>
                <span aria-hidden="true">·</span>
                <span>Paredes y suelo</span>
                <span aria-hidden="true">·</span>
                <span>Vidrio reciclado</span>
                {applyEdge && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                      Remates EDGE:{' '}
                      {edgeColor === 'coordinated'
                        ? `Coordinado con ${selectedTile.name}`
                        : activeEdgeColorObj.name}
                    </span>
                  </>
                )}
              </div> */}
            </div>

            <div className={styles.controlPanel}>
              <div className={styles.panelHeader}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Layers size={16} aria-hidden="true" />
                  <span>Características técnicas</span>
                </span>
              </div>

              <div className={styles.controlGroup}>
                <div className={styles.controlLabelRow}>
                  <span>Tamaño del mosaico</span>
                  {/* <span className={styles.controlValue}>{tileFormat} cm</span> */}
                </div>
                <div className={styles.segmentedOptions} role="group" aria-label="Tamaño del mosaico">
                  {selectedTile.availableFormats.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => onUpdateParams({ tileFormat: fmt })}
                      className={`${styles.optionBtn} ${tileFormat === fmt ? styles.optionBtnActive : ''
                        }`}
                    >
                      {fmt === '2.5x2.5' ? '2,5 × 2,5 cm' : '4 × 4 cm'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <div className={styles.controlLabelRow}>
                  <span>Acabado superficial</span>
                  {/* <span className={styles.controlValue}>{tileFinish}</span> */}
                </div>
                <div className={styles.segmentedOptions} role="group" aria-label="Acabado del mosaico">
                  {selectedTile.availableFinishes.map((fin) => (
                    <button
                      key={fin}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => onUpdateParams({ tileFinish: fin })}
                      className={`${styles.optionBtn} ${tileFinish === fin ? styles.optionBtnActive : ''
                        }`}
                    >
                      {fin}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <div className={styles.controlLabelRow}>
                  <span>Color de junta de 2mm</span>
                  {/* <span className={styles.controlValue}>
                    {(
                      GROUT_COLORS.find((g) => g.hex.toLowerCase() === groutColor.toLowerCase()) ||
                      GROUT_COLORS[0]
                    ).name}
                  </span> */}
                </div>
                <div className={styles.groutSwatches}>
                  {GROUT_COLORS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => onUpdateParams({ groutColor: g.hex })}
                      className={`${styles.groutBtn} ${groutColor.toLowerCase() === g.hex.toLowerCase()
                        ? styles.groutBtnActive
                        : ''
                        }`}
                    >
                      <span
                        className={styles.groutDot}
                        style={{ backgroundColor: g.hex }}
                      />
                      <span>{g.name.replace(' (2mm)', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remates y piezas especiales simplificados (Hisbalit EDGE) */}
              <div className={styles.edgeSectionDivider}>
                <div className={styles.edgeHeaderRow}>
                  <div className={styles.controlLabelRow} style={{ flex: 1 }}>
                    <span>Remates (EDGE)</span>
                  </div>
                  <a
                    href="https://hisbalit.es/productos/piscinas/edge/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.edgeLink}
                  >
                    <span>Ver EDGE</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>

                <div
                  className={styles.segmentedOptions}
                  role="group"
                  aria-label="Aplicar remates Hisbalit EDGE"
                >
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onUpdateParams({ applyEdge: false })}
                    className={`${styles.optionBtn} ${!applyEdge ? styles.optionBtnActive : ''
                      }`}
                  >
                    Sin remates
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onUpdateParams({ applyEdge: true })}
                    className={`${styles.optionBtn} ${applyEdge ? styles.optionBtnActive : ''
                      }`}
                  >
                    Aplicar remates
                  </button>
                </div>

                {applyEdge && (
                  <div className={styles.controlGroup}>
                    <div className={styles.edgeDescriptionNote}>
                      La simulación aplicará el color elegido en bordes de peldaños, esquinas o encuentros curvos donde resulte apropiado.
                    </div>

                    <div className={styles.controlLabelRow} style={{ marginTop: '0.2rem' }}>
                      <span>Color del remate</span>
                      {/* <span className={styles.controlValue}>
                        {edgeColor === 'coordinated'
                          ? `Coordinado`
                          : activeEdgeColorObj.name}
                      </span> */}
                    </div>

                    {/* Opción 1: Coordinado con el mosaico principal */}
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => onUpdateParams({ edgeColor: 'coordinated' })}
                      className={`${styles.groutBtn} ${edgeColor === 'coordinated' ? styles.groutBtnActive : ''
                        }`}
                    >
                      <img
                        src={tileSwatchUrl}
                        alt={selectedTile.name}
                        referrerPolicy="no-referrer"
                        className={styles.edgeCoordinatedThumb}
                      />
                      <div>
                        <span style={{ display: 'block', fontSize: '0.78rem' }}>
                          Coordinado con {selectedTile.name}
                        </span>
                        <span className={styles.edgeSwatchSub}>
                          Continuidad cromática con el vaso
                        </span>
                      </div>
                    </button>

                    {/* Opción 2: 6 Tonos propios de remate / señalización EDGE */}
                    <div className={styles.edgeSwatchesGrid}>
                      {specificEdgeColors.map((ec) => (
                        <button
                          key={ec.id}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => onUpdateParams({ edgeColor: ec.id })}
                          className={`${styles.groutBtn} ${edgeColor === ec.id ? styles.groutBtnActive : ''
                            }`}
                        >
                          <span
                            className={`${styles.groutDot} ${ec.isPhotoluminescent ? styles.glowDot : ''
                              }`}
                            style={{ backgroundColor: ec.hex }}
                          />
                          <span>
                            <span style={{ display: 'block', lineHeight: 1.15 }}>{ec.name}</span>
                            <span className={styles.edgeSwatchSub}>{ec.subtitle}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRegenerateSimulation()}
                disabled={isGenerating}
                className="btn-primary btn-w-100"
                style={{ marginTop: '0.25rem' }}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>
                  {isGenerating
                    ? generationStage || 'Actualizando simulación...'
                    : 'Actualizar simulación'}
                </span>
              </button>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onEditStep(3)}
              className="btn-secondary btn-show-text"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Atrás a Fotografía</span>
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
};
