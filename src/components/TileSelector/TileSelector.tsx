import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Heart } from 'lucide-react';
import styles from './TileSelector.module.css';
import { Collection, Tile, TileFormat } from '../../types/simulation';

interface TileSelectorProps {
  collections: Collection[];
  selectedCollection: Collection;
  selectedTile: Tile | null;
  selectedFormat: TileFormat;
  favoriteTileIds: string[];
  onSelectCollection: (collection: Collection) => void;
  onSelectTile: (tile: Tile) => void;
  onSelectFormat: (format: TileFormat) => void;
  onToggleFavorite: (tileId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const TileSelector: React.FC<TileSelectorProps> = ({
  collections,
  selectedCollection,
  selectedTile,
  selectedFormat,
  favoriteTileIds,
  onSelectCollection,
  onSelectTile,
  onSelectFormat,
  onToggleFavorite,
  onBack,
  onContinue,
}) => {
  const [colorFilter, setColorFilter] = useState<string>('Todos');
  const [tonalityFilter, setTonalityFilter] = useState<string>('Todas');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const collectionMap = useMemo(() => {
    const map = new Map<string, Collection>();
    collections.forEach((c) => map.set(c.id, c));
    return map;
  }, [collections]);

  // Base pool of tiles: if onlyFavorites is active, gather favorites across ALL collections
  const baseTilesPool = useMemo(() => {
    if (onlyFavorites) {
      return collections
        .flatMap((c) => c.tiles)
        .filter((t) => favoriteTileIds.includes(t.id));
    }
    return selectedCollection.tiles;
  }, [onlyFavorites, collections, selectedCollection.tiles, favoriteTileIds]);

  const availableColors = useMemo(() => {
    const set = new Set<string>(baseTilesPool.map((t) => t.color));
    return ['Todos', ...Array.from(set)];
  }, [baseTilesPool]);

  const availableTonalities = useMemo(() => {
    const set = new Set<string>(baseTilesPool.map((t) => t.tonality));
    return ['Todas', ...Array.from(set)];
  }, [baseTilesPool]);

  const handleCollectionSwitch = (col: Collection) => {
    setColorFilter('Todos');
    setTonalityFilter('Todas');
    setOnlyFavorites(false);
    onSelectCollection(col);
  };

  const handleToggleOnlyFavorites = () => {
    setOnlyFavorites((prev) => {
      const next = !prev;
      setColorFilter('Todos');
      setTonalityFilter('Todas');
      return next;
    });
  };

  const handleSelectTile = (tile: Tile) => {
    if (selectedTile && tile.id === selectedTile.id) return;
    onSelectTile(tile);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  const filteredTiles = useMemo(() => {
    return baseTilesPool.filter((tile) => {
      if (colorFilter !== 'Todos' && tile.color !== colorFilter) return false;
      if (tonalityFilter !== 'Todas' && tile.tonality !== tonalityFilter) return false;
      return true;
    });
  }, [baseTilesPool, colorFilter, tonalityFilter]);

  const activeFormat = selectedCollection.specs.formats.includes(selectedFormat)
    ? selectedFormat
    : selectedCollection.specs.formats[0];

  const selectedPreviewUrl = selectedTile ? selectedTile.image : '';

  return (
    <section className={styles.sectionWrapper} aria-labelledby="step2-heading">
      <div className="studio-container">
        <div className={styles.headerArea}>
          <span className="text-kicker">Paso 02 · Catálogo de Mosaicos</span>
          <div className={styles.titleRow}>
            <div className="title-group">
              <h1 id="step2-heading" className="heading-display">
                {onlyFavorites
                  ? 'Tus mosaicos favoritos de todas las colecciones'
                  : `Elige tu mosaico de la colección ${selectedCollection.name}`}
              </h1>
              <p className="text-prose">
                {onlyFavorites
                  ? 'Aquí se reúnen todos los diseños que has marcado como favoritos en cualquier colección para que puedas compararlos y elegir el tuyo.'
                  : 'Selecciona el modelo para aplicar sobre tu espacio. Puedes filtrar por color, universo cromático o alternar el formato de tesela.'}
              </p>
            </div>

            <div className={`hide-scrollbar ${styles.collectionSwitcher}`} role="group" aria-label="Cambiar colección">
              {collections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleCollectionSwitch(col)}
                  className={`${styles.collectionTab} ${!onlyFavorites && col.id === selectedCollection.id
                    ? styles.collectionTabActive
                    : ''
                    }`}
                >
                  Colección {col.name} ({col.tiles.length})
                </button>
              ))}
            </div>
          </div>

          <div className={styles.selectionSummaryBox} aria-live="polite">
            <div className={styles.summaryLeft}>
              {selectedTile && selectedPreviewUrl && (
                <img
                  src={selectedPreviewUrl}
                  alt={`Muestra ${selectedTile.name}`}
                  referrerPolicy="no-referrer"
                  className={styles.summarySwatch}
                />
              )}
              <div className={styles.summaryMetaGroup}>
                <span className={styles.summaryLabel}>Tu selección</span>
                <p className={styles.summaryLine}>
                  <strong>Colección:</strong> {selectedCollection.name}
                  <span aria-hidden="true"> · </span>
                  <strong>Mosaico:</strong>{' '}
                  {selectedTile ? (
                    <>
                      {selectedTile.name} ({selectedTile.color} / {selectedTile.tonality})
                    </>
                  ) : (
                    'No seleccionado'
                  )}
                  <span aria-hidden="true"> · </span>
                  <strong>Formato:</strong> {activeFormat} cm
                </p>
              </div>
            </div>

            <div className="flex-stepper-buttons">
              <button type="button" onClick={onBack} className="btn-secondary">
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={onContinue}
                disabled={!selectedTile}
                className="btn-primary btn-w-100"
              >
                <span>Continuar</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.filtersToolbar}>
          <div className={styles.filterGroupsRow}>
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>Color:</span>
              <div className={`hide-scrollbar ${styles.segmentedBar}`} role="group" aria-label="Filtrar por color">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorFilter(color)}
                    className={`${styles.filterBtn} ${colorFilter === color ? styles.filterBtnActive : ''
                      }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>Tonalidad:</span>
              <div className={`hide-scrollbar ${styles.segmentedBar}`} role="group" aria-label="Filtrar por tonalidad">
                {availableTonalities.map((ton) => (
                  <button
                    key={ton}
                    type="button"
                    onClick={() => setTonalityFilter(ton)}
                    className={`${styles.filterBtn} ${tonalityFilter === ton ? styles.filterBtnActive : ''
                      }`}
                  >
                    {ton}
                  </button>
                ))}
              </div>
            </div>

            {selectedCollection.specs.formats.length > 1 && (
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupLabel}>Formato:</span>
                <div className={`hide-scrollbar ${styles.segmentedBar}`} role="group" aria-label="Tamaño de pieza">
                  {selectedCollection.specs.formats.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onSelectFormat(fmt)}
                      className={`${styles.filterBtn} ${activeFormat === fmt ? styles.filterBtnActive : ''
                        }`}
                    >
                      {fmt} cm
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleOnlyFavorites}
            className={`${styles.filterBtn} ${onlyFavorites ? styles.filterBtnActive : ''}`}
            style={{
              border: '1px solid var(--border-hairline)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
            }}
          >
            <Heart
              size={14}
              fill={onlyFavorites ? '#B8332A' : 'none'}
              color={onlyFavorites ? '#B8332A' : 'currentColor'}
              aria-hidden="true"
            />
            <span>
              Favoritos (<span className="tabular-nums">{favoriteTileIds.length}</span>)
            </span>
          </button>
        </div>

        {filteredTiles.length === 0 ? (
          <div className={styles.emptyFilterState}>
            <p className="text-prose">
              {onlyFavorites && favoriteTileIds.length === 0
                ? 'Todavía no has guardado ningún mosaico en tus favoritos. Pulsa el icono del corazón (♥) sobre cualquier diseño de las colecciones para reunirlos aquí.'
                : 'No se han encontrado mosaicos que coincidan con los filtros seleccionados.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setColorFilter('Todos');
                setTonalityFilter('Todas');
                setOnlyFavorites(false);
              }}
              className="btn-secondary"
            >
              {onlyFavorites && favoriteTileIds.length === 0
                ? `Volver a la colección ${selectedCollection.name}`
                : 'Restablecer filtros'}
            </button>
          </div>
        ) : (
          <div className={styles.tilesGrid}>
            {filteredTiles.map((tile) => {
              const isSelected = selectedTile?.id === tile.id;
              const isFav = favoriteTileIds.includes(tile.id);
              const previewUrl = tile.image;
              const tileCol = collectionMap.get(tile.collectionId) || selectedCollection;
              const tileDisplayFormat = tile.availableFormats.includes(activeFormat)
                ? activeFormat
                : tile.availableFormats[0];

              return (
                <article
                  key={tile.id}
                  className={`${styles.tileCard} ${isSelected ? styles.tileCardSelected : ''}`}
                >
                  <div
                    className={styles.tileImageWrapper}
                    onClick={() => handleSelectTile(tile)}
                  >
                    <img
                      src={previewUrl}
                      alt={`Mosaico ${tile.name} — Color ${tile.color}, tonalidad ${tile.tonality}`}
                      referrerPolicy="no-referrer"
                      className={styles.tileImage}
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(tile.id);
                      }}
                      aria-label={
                        isFav
                          ? `Quitar ${tile.name} de favoritos`
                          : `Guardar ${tile.name} en favoritos`
                      }
                      className={`${styles.favButton} ${isFav ? styles.favActive : ''}`}
                    >
                      <Heart
                        size={16}
                        fill={isFav ? '#B8332A' : 'none'}
                        aria-hidden="true"
                      />
                    </button>

                    {isSelected && (
                      <div className={styles.selectedCheckBadge}>
                        <Check size={13} aria-hidden="true" />
                        <span>Seleccionado</span>
                      </div>
                    )}

                    <div className={styles.waterPreviewStrip}>
                      <span>
                        {onlyFavorites ? `${tileCol.name} · ${tile.tonality}` : tile.tonality}
                      </span>
                      <span className="tabular-nums">{tileDisplayFormat} cm</span>
                    </div>
                  </div>

                  <div className={styles.tileBody}>
                    {/* <div className={styles.tileMetaTop}>
                      {onlyFavorites && (
                        <>
                          <strong style={{ color: 'var(--accent-primary)' }}>
                            {tileCol.name}
                          </strong>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span>{tile.color}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tile.tonality}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tile.pattern}</span>
                    </div> */}

                    <div className={styles.tileTitleRow}>
                      <h2 className={styles.tileName}>{tile.name}</h2>
                      {/* <span className={styles.tileRef}>{tile.referenceCode}</span> */}
                      {onlyFavorites && (
                        <>
                          <button
                            type="button"
                            className={styles.tileCollectionLink}
                            onClick={() => handleCollectionSwitch(tileCol)}>
                            Colección {tileCol.name}
                          </button>
                        </>
                      )}
                    </div>

                    <p className={styles.tileDesc}>{tile.description}</p>

                    <div className={styles.tileFooter}>
                      <span className="text-metadata">
                        {tile.availableFinishes.join(' / ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => !isSelected && handleSelectTile(tile)}
                        className={isSelected ? 'btn-primary' : 'btn-secondary'}
                        style={{
                          padding: '0.45rem 0.95rem',
                          minHeight: '38px',
                          fontSize: '0.8125rem',
                          ...(isSelected
                            ? { pointerEvents: 'none', cursor: 'default' }
                            : {}),
                        }}
                      >
                        {isSelected ? 'Mosaico activo' : `Elegir ${tile.name}`}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.wizardFooterBar}>

          <div className="text-metadata">
            {selectedTile ? (
              <>
                Mosaico seleccionado: <strong>{selectedTile.name}</strong> ({selectedCollection.name})
              </>
            ) : (
              'Haz clic sobre un diseño de mosaico para continuar.'
            )}
          </div>
          <div className="flex-stepper-buttons">
            <button type="button" onClick={onBack} className="btn-secondary">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Atrás a Colecciones</span>
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={!selectedTile}
              className="btn-primary btn-w-100"
            >
              <span>Continuar a Fotografía</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
