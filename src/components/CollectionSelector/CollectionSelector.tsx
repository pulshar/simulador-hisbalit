import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import styles from './CollectionSelector.module.css';
import { Collection } from '../../types/simulation';

interface CollectionSelectorProps {
  collections: Collection[];
  selectedCollection: Collection | null;
  onSelectCollection: (collection: Collection | null) => void;
  onContinue: () => void;
}

export const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  collections,
  selectedCollection,
  onSelectCollection,
  onContinue,
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <section className={styles.sectionWrapper} aria-labelledby="step1-heading">
      <div className="studio-container">
        <div className={styles.introHeader}>
          <span className="text-kicker"><span className="number">01</span> · Selección de Colección</span>
          <div className="title-group">
            <div className={styles.headerTopRow}>
              <h1 id="step1-heading" className="heading-display">
                ¿Qué colección inspira tu proyecto?
              </h1>
              <p className="text-metadata">
                {/* {collections.length} colecciones oficiales Hisbalit · Vidrio 100% reciclado */}
                {collections.length} colecciones Hisbalit · Vidrio 100% reciclado
              </p>
            </div>
            <p className="text-prose">
              Explora nuestras colecciones de mosaico ecológico para piscinas, spas y superficies arquitectónicas. Selecciona una línea para descubrir sus diseños, formatos y tonalidades de agua.
            </p>
          </div>
          {selectedCollection && (
            <div className={styles.selectionSummaryBox} aria-live="polite">
              <div className={styles.summaryLeft}>
                {!imgErrors[selectedCollection.id] && (
                  <img
                    src={selectedCollection.image}
                    alt={`Colección ${selectedCollection.name}`}
                    referrerPolicy="no-referrer"
                    className={styles.summarySwatch}
                  />
                )}
                <div className={styles.summaryMetaGroup}>
                  <span className={styles.summaryLabel}>Tu selección</span>
                  <p className={styles.summaryLine}>
                    <strong>Colección:</strong> {selectedCollection.name}
                  </p>
                </div>
              </div>

              <div className="flex-stepper-buttons">
                <button
                  type="button"
                  onClick={() => onSelectCollection(null)}
                  className="btn-secondary"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={onContinue}
                  className="btn-primary btn-w-100"
                >
                  <span>Continuar</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.collectionsGrid}>
          {collections.map((collection) => {
            const isSelected = selectedCollection?.id === collection.id;
            const hasError = imgErrors[collection.id];

            return (
              <article
                key={collection.id}
                className={`${styles.collectionCard} ${isSelected ? styles.cardSelected : ''}`}
              >
                <div
                  className={styles.mediaContainer}
                  onClick={() => !isSelected && onSelectCollection(collection)}
                  style={{ cursor: isSelected ? 'default' : 'pointer' }}
                >
                  {!hasError ? (
                    <img
                      src={collection.image}
                      alt={`Piscina revestida con la colección ${collection.name} de Hisbalit`}
                      referrerPolicy="no-referrer"
                      className={styles.cardImage}
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [collection.id]: true }))
                      }
                    />
                  ) : (
                    <div className={styles.imageFallback}>
                      <span className={styles.scrimTitle}>{collection.name}</span>
                    </div>
                  )}

                  <div className={styles.mediaScrim}>
                    <span className={styles.scrimMeta}>
                      {/* Colección Hisbalit · <span className="tabular-nums">{collection.tiles.length}</span> diseños disponibles */}
                      <span className="tabular-nums">{collection.tiles.length}</span> diseños disponibles
                    </span>
                    <h2 className={styles.scrimTitle}>{collection.name}</h2>
                  </div>

                  {isSelected && (
                    <div className={styles.selectedIndicator}>
                      <Check size={14} aria-hidden="true" />
                      <span>Seleccionada</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div>
                    <h3 className={styles.subtitleText}>{collection.subtitle}</h3>
                  </div>
                  <p className={styles.descriptionText}>{collection.description}</p>

                  <div className={styles.specsBlock}>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>Formatos disponibles</span>
                      <span className={styles.specValue}>
                        {collection.specs.formats.map((f) => `${f} cm`).join(' · ')}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>Acabados</span>
                      <span className={styles.specValue}>
                        {collection.specs.finishes.join(' · ')}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>Especificación técnica</span>
                      <span className={styles.specValue}>
                        {collection.specs.thickness} · {collection.specs.joint}
                      </span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>Aplicación</span>
                      <span className={styles.specValue}>
                        {collection.specs.application.slice(0, 2).join(' · ')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.swatchesPreviewRow}>
                    <div className={styles.swatchGroup} aria-label="Muestras de la colección">
                      {collection.tiles.slice(0, 6).map((tile) => (
                        <img
                          key={tile.id}
                          src={tile.image}
                          alt={tile.name}
                          referrerPolicy="no-referrer"
                          className={styles.colorDot}
                          style={{ objectFit: 'cover' }}
                          title={`${tile.name} (${tile.tonality})`}
                        />
                      ))}
                    </div>
                    <span className="text-metadata">
                      {collection.specs.sustainability}
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <a
                      href={collection.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      Ver ficha <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />
                    </a>

                    <div className="flex-stepper-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isSelected) onSelectCollection(collection);
                        }}
                        className={isSelected ? 'btn-secondary' : 'btn-secondary'}
                        style={
                          isSelected
                            ? { pointerEvents: 'none', cursor: 'default' }
                            : undefined
                        }
                      >
                        {isSelected ? (
                          <>
                            <Check size={16} aria-hidden="true" />
                            <span>Seleccionada</span>
                          </>
                        ) : (
                          <>
                            <span>Seleccionar {collection.name}</span>
                            <ArrowRight size={16} aria-hidden="true" />
                          </>
                        )}
                      </button>

                      {isSelected && (
                        <button
                          type="button"
                          onClick={onContinue}
                          className="btn-primary btn-w-100"
                        >
                          <span>Continuar</span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.bottomActionBar}>
          <div className={styles.selectionSummaryText}>
            {selectedCollection ? (
              <>
                Has seleccionado la colección <strong>{selectedCollection.name}</strong> (
                <span className="tabular-nums">{selectedCollection.tiles.length}</span> modelos disponibles en formato{' '}
                {selectedCollection.specs.formats.map((f) => `${f} cm`).join(' y ')}).
              </>
            ) : (
              <span>Selecciona una de las colecciones superiores para continuar al catálogo de mosaicos.</span>
            )}
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedCollection}
            className="btn-primary btn-w-100"
          >
            <span>Continuar a Mosaicos</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
