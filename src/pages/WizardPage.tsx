import React, { useState } from 'react';
import { Check, Info } from 'lucide-react';
import styles from './WizardPage.module.css';
import { HISBALIT_COLLECTIONS } from '../data/collections';
import { useSimulationStore } from '../hooks/useSimulationStore';
import {
  generateGeminiMosaicSimulation,
  SimulationProgressStage,
} from '../services/geminiSimulationService';
import {
  Collection,
  EdgeColorMode,
  Tile,
  TileFinish,
  TileFormat,
} from '../types/simulation';
import { ProgressStepper } from '../components/ProgressStepper/ProgressStepper';
import { CollectionSelector } from '../components/CollectionSelector/CollectionSelector';
import { TileSelector } from '../components/TileSelector/TileSelector';
import { ImageUploader } from '../components/ImageUploader/ImageUploader';
import { SimulationViewer } from '../components/SimulationViewer/SimulationViewer';

export const WizardPage: React.FC = () => {
  const {
    state,
    favoriteTileIds,
    history,
    toggleFavoriteTile,
    selectCollection,
    selectTile,
    setSourceImage,
    updateRenderParams,
    goToStep,
    addHistoryEntry,
    restoreHistoryItem,
    resetAll,
  } = useSimulationStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<SimulationProgressStage | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'info') => {
    setNotification({ text, type });
    window.setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  const handleStepNavigation = (targetStep: number) => {
    if (isGenerating) return;
    setGenerationError(null);
    const res = goToStep(targetStep);
    if (!res.ok && res.error) {
      showToast(res.error, 'info');
    }
  };

  const handleRunSimulation = async (override?: {
    collection?: Collection;
    tile?: Tile;
    tileFormat?: TileFormat;
    tileFinish?: TileFinish;
    groutColor?: string;
    applyEdge?: boolean;
    edgeColor?: EdgeColorMode;
  }) => {
    const activeCollection = override?.collection || state.selectedCollection;
    const activeTile = override?.tile || state.selectedTile;
    const activeFormat = override?.tileFormat || state.tileFormat;
    const activeFinish = override?.tileFinish || state.tileFinish;
    const activeGrout = override?.groutColor || state.groutColor;
    const activeApplyEdge =
      override?.applyEdge !== undefined ? override.applyEdge : state.applyEdge;
    const activeEdgeColor = override?.edgeColor || state.edgeColor;

    if (!activeCollection || !activeTile || !state.sourceImage) {
      showToast('Completa la selección de colección, mosaico y fotografía.', 'info');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStage('Analizando fotografía...');

    try {
      const generatedDataUrl = await generateGeminiMosaicSimulation({
        sourceImage: state.sourceImage,
        collection: activeCollection,
        tile: activeTile,
        tileFormat: activeFormat,
        tileFinish: activeFinish,
        groutColor: activeGrout,
        applyEdge: activeApplyEdge,
        edgeColor: activeEdgeColor,
        onStageChange: (stage) => setGenerationStage(stage),
      });

      addHistoryEntry(generatedDataUrl, {
        collection: activeCollection,
        tile: activeTile,
        tileFormat: activeFormat,
        tileFinish: activeFinish,
        groutColor: activeGrout,
        applyEdge: activeApplyEdge,
        edgeColor: activeEdgeColor,
      });

      if (state.currentStep !== 4) {
        goToStep(4, true);
      }
      showToast(`Simulación generada con ${activeTile.name} (${activeCollection.name}).`, 'success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo generar la simulación. Por favor, inténtalo de nuevo.';
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
      setGenerationStage(null);
    }
  };

  const handleShareConfig = () => {
    const url = new URL(window.location.href);
    if (state.selectedCollection) {
      url.searchParams.set('collection', state.selectedCollection.id);
    }
    if (state.selectedTile) {
      url.searchParams.set('tile', state.selectedTile.id);
    }
    const shareString = url.toString();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareString)
        .then(() => {
          showToast('Enlace de configuración copiado al portapapeles.', 'success');
        })
        .catch(() => {
          showToast(`URL de configuración: ${shareString}`, 'info');
        });
    } else {
      showToast(`URL de configuración: ${shareString}`, 'info');
    }
  };

  const handleResetWizard = () => {
    if (isGenerating) return;
    setGenerationError(null);
    resetAll();
    showToast('Configuración reiniciada. Selecciona una colección para comenzar.', 'info');
  };

  return (
    <div id="top" className={styles.pageWrapper} data-step={state.currentStep}>
      <ProgressStepper
        currentStep={state.currentStep}
        selectedCollection={state.selectedCollection}
        selectedTile={state.selectedTile}
        hasSourceImage={Boolean(state.sourceImage)}
        hasResultImage={Boolean(state.resultImage)}
        onStepClick={handleStepNavigation}
        onReset={handleResetWizard}
        onShare={handleShareConfig}
      />

      <main className={styles.mainContent}>
        {state.currentStep === 1 && (
          <CollectionSelector
            collections={HISBALIT_COLLECTIONS}
            selectedCollection={state.selectedCollection}
            onSelectCollection={(col) => selectCollection(col)}
            onContinue={() => handleStepNavigation(2)}
          />
        )}

        {state.currentStep === 2 && state.selectedCollection && (
          <TileSelector
            collections={HISBALIT_COLLECTIONS}
            selectedCollection={state.selectedCollection}
            selectedTile={state.selectedTile}
            selectedFormat={state.tileFormat}
            favoriteTileIds={favoriteTileIds}
            onSelectCollection={(col) => selectCollection(col)}
            onSelectTile={(tile) => selectTile(tile)}
            onSelectFormat={(fmt) => updateRenderParams({ tileFormat: fmt })}
            onToggleFavorite={toggleFavoriteTile}
            onBack={() => handleStepNavigation(1)}
            onContinue={() => handleStepNavigation(3)}
          />
        )}

        {state.currentStep === 3 && state.selectedCollection && state.selectedTile && (
          <ImageUploader
            selectedCollection={state.selectedCollection}
            selectedTile={state.selectedTile}
            tileFormat={state.tileFormat}
            tileFinish={state.tileFinish}
            groutColor={state.groutColor}
            sourceImage={state.sourceImage}
            sourceImageName={state.sourceImageName}
            sourceImageDimensions={state.sourceImageDimensions}
            isGenerating={isGenerating}
            generationStage={generationStage}
            generationError={generationError}
            onImageChange={(dataUrl, name, dims) => {
              setGenerationError(null);
              setSourceImage(dataUrl, name, dims);
            }}
            onBack={() => handleStepNavigation(2)}
            onGenerateSimulation={() => handleRunSimulation()}
          />
        )}

        {state.currentStep === 4 &&
          state.selectedCollection &&
          state.selectedTile &&
          state.sourceImage &&
          state.resultImage && (
            <SimulationViewer
              collections={HISBALIT_COLLECTIONS}
              selectedCollection={state.selectedCollection}
              selectedTile={state.selectedTile}
              sourceImage={state.sourceImage}
              resultImage={state.resultImage}
              tileFormat={state.tileFormat}
              tileFinish={state.tileFinish}
              groutColor={state.groutColor}
              applyEdge={state.applyEdge}
              edgeColor={state.edgeColor}
              favoriteTileIds={favoriteTileIds}
              history={history}
              isGenerating={isGenerating}
              generationStage={generationStage}
              generationError={generationError}
              onUpdateParams={updateRenderParams}
              onToggleFavorite={toggleFavoriteTile}
              onSelectTileAndCollection={(tile, col) => selectTile(tile, col)}
              onRegenerateSimulation={(override) => handleRunSimulation(override)}
              onRestoreHistory={restoreHistoryItem}
              onEditStep={handleStepNavigation}
            />
          )}
      </main>

      {notification && (
        <div className={styles.toastBanner} role="status" aria-live="polite">
          {notification.type === 'success' ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Info size={16} aria-hidden="true" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={`studio-container ${styles.footerInner}`}>
          <span>
            © 2026 - Hisbalit Simulador
          </span>
          <div className={styles.footerLinks}>
            {HISBALIT_COLLECTIONS.map((col) => (
              <a
                key={col.id}
                href={col.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                Colección {col.name}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
