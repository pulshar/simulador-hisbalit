import { useState, useEffect, useCallback } from 'react';
import {
  Collection,
  EdgeColorMode,
  SimulationHistoryItem,
  SimulationState,
  Tile,
  TileFinish,
  TileFormat,
} from '../types/simulation';
import { DEMO_PHOTOGRAPHS, GROUT_COLORS, HISBALIT_COLLECTIONS } from '../data/collections';

const STORAGE_KEY_PREFS = 'hisbalit_studio_prefs_v1';
const STORAGE_KEY_FAVS = 'hisbalit_studio_favs_v2';

const ALL_VALID_TILE_IDS = new Set(
  HISBALIT_COLLECTIONS.flatMap((col) => col.tiles.map((t) => t.id))
);

export function useSimulationStore() {
  const [favoriteTileIds, setFavoriteTileIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === 'string' && ALL_VALID_TILE_IDS.has(id));
    } catch {
      return [];
    }
  });

  const [state, setState] = useState<SimulationState>(() => {
    const params = new URLSearchParams(window.location.search);
    const colParam = params.get('collection');
    const tileParam = params.get('tile');

    let initialCollection: Collection | null = null;
    let initialTile: Tile | null = null;
    let initialFormat: TileFormat = '4x4';
    let initialFinish: TileFinish = 'Brillo';
    const initialGrout = GROUT_COLORS[0].hex;

    if (colParam) {
      const foundCol = HISBALIT_COLLECTIONS.find((c) => c.id === colParam);
      if (foundCol) {
        initialCollection = foundCol;
        if (tileParam) {
          initialTile = foundCol.tiles.find((t) => t.id === tileParam) || null;
        }
      }
    }

    if (initialTile) {
      if (!initialTile.availableFormats.includes(initialFormat)) {
        initialFormat = initialTile.availableFormats[0];
      }
      if (!initialTile.availableFinishes.includes(initialFinish)) {
        initialFinish = initialTile.availableFinishes[0];
      }
    }

    return {
      currentStep: 1,
      selectedCollection: initialCollection,
      selectedTile: initialTile,
      tileFormat: initialFormat,
      tileFinish: initialFinish,
      groutColor: initialGrout,
      applyEdge: false,
      edgeColor: 'coordinated',
      sourceImage: DEMO_PHOTOGRAPHS[0].imageUrl,
      sourceImageName: DEMO_PHOTOGRAPHS[0].title,
      sourceImageDimensions: { width: 1440, height: 810 },
      resultImage: null,
    };
  });

  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);

  useEffect(() => {
    try {
      const prefs = {
        collectionId: state.selectedCollection?.id || null,
        tileId: state.selectedTile?.id || null,
        tileFormat: state.tileFormat,
        tileFinish: state.tileFinish,
        groutColor: state.groutColor,
        applyEdge: state.applyEdge,
        edgeColor: state.edgeColor,
      };
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch {
      // ignore quota errors
    }
  }, [
    state.selectedCollection,
    state.selectedTile,
    state.tileFormat,
    state.tileFinish,
    state.groutColor,
    state.applyEdge,
    state.edgeColor,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favoriteTileIds));
    } catch {
      // ignore
    }
  }, [favoriteTileIds]);

  const toggleFavoriteTile = useCallback((tileId: string) => {
    setFavoriteTileIds((prev) =>
      prev.includes(tileId) ? prev.filter((id) => id !== tileId) : [...prev, tileId]
    );
  }, []);

  const selectCollection = useCallback((collection: Collection | null) => {
    setState((prev) => {
      if (!collection) {
        return {
          ...prev,
          selectedCollection: null,
          selectedTile: null,
        };
      }
      const sameCollection = prev.selectedCollection?.id === collection.id;
      const nextTile = sameCollection ? prev.selectedTile : null;
      const nextFormat = sameCollection
        ? prev.tileFormat
        : collection.specs.formats[0] || prev.tileFormat;
      const nextFinish = sameCollection
        ? prev.tileFinish
        : collection.specs.finishes[0] || prev.tileFinish;

      return {
        ...prev,
        selectedCollection: collection,
        selectedTile: nextTile,
        tileFormat: nextFormat,
        tileFinish: nextFinish,
      };
    });
  }, []);

  const selectTile = useCallback((tile: Tile, collection?: Collection) => {
    setState((prev) => {
      const targetCol =
        collection ||
        HISBALIT_COLLECTIONS.find((c) => c.id === tile.collectionId) ||
        prev.selectedCollection;

      const validFormat = tile.availableFormats.includes(prev.tileFormat)
        ? prev.tileFormat
        : tile.availableFormats[0];
      const validFinish = tile.availableFinishes.includes(prev.tileFinish)
        ? prev.tileFinish
        : tile.availableFinishes[0];

      return {
        ...prev,
        selectedCollection: targetCol,
        selectedTile: tile,
        tileFormat: validFormat,
        tileFinish: validFinish,
      };
    });
  }, []);

  const setSourceImage = useCallback(
    (
      dataUrl: string | null,
      name: string | null,
      dimensions: { width: number; height: number } | null
    ) => {
      setState((prev) => ({
        ...prev,
        sourceImage: dataUrl,
        sourceImageName: name,
        sourceImageDimensions: dimensions,
        resultImage: null,
      }));
    },
    []
  );

  const updateRenderParams = useCallback(
    (
      partial: Partial<
        Pick<
          SimulationState,
          'tileFormat' | 'tileFinish' | 'groutColor' | 'applyEdge' | 'edgeColor' | 'resultImage'
        >
      >
    ) => {
      setState((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const canNavigateToStep = useCallback(
    (targetStep: number): { allowed: boolean; reason?: string } => {
      if (targetStep <= 1) return { allowed: true };
      if (!state.selectedCollection) {
        return {
          allowed: false,
          reason: 'Selecciona primero una colección para continuar.',
        };
      }
      if (targetStep === 2) return { allowed: true };
      if (!state.selectedTile) {
        return {
          allowed: false,
          reason: 'Elige un diseño de mosaico dentro de la colección antes de continuar.',
        };
      }
      if (targetStep === 3) return { allowed: true };
      if (!state.sourceImage) {
        return {
          allowed: false,
          reason: 'Sube una fotografía de tu espacio o selecciona una imagen de muestra.',
        };
      }
      if (!state.resultImage) {
        return {
          allowed: false,
          reason: 'Pulsa "Generar simulación" para analizar y procesar la fotografía.',
        };
      }
      return { allowed: true };
    },
    [state.selectedCollection, state.selectedTile, state.sourceImage, state.resultImage]
  );

  const goToStep = useCallback(
    (step: number, force = false): { ok: boolean; error?: string } => {
      if (!force) {
        const check = canNavigateToStep(step);
        if (!check.allowed) {
          return { ok: false, error: check.reason };
        }
      }
      setState((prev) => ({ ...prev, currentStep: step }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return { ok: true };
    },
    [canNavigateToStep]
  );

  const addHistoryEntry = useCallback(
    (
      previewDataUrl: string,
      customOverride?: {
        collection?: Collection;
        tile?: Tile;
        tileFormat?: TileFormat;
        tileFinish?: TileFinish;
        groutColor?: string;
        applyEdge?: boolean;
        edgeColor?: EdgeColorMode;
      }
    ) => {
      setState((current) => {
        const col = customOverride?.collection || current.selectedCollection;
        const tile = customOverride?.tile || current.selectedTile;
        const fmt = customOverride?.tileFormat || current.tileFormat;
        const fin = customOverride?.tileFinish || current.tileFinish;
        const grt = customOverride?.groutColor || current.groutColor;
        const appEdge =
          customOverride?.applyEdge !== undefined
            ? customOverride.applyEdge
            : current.applyEdge;
        const edgCol = customOverride?.edgeColor || current.edgeColor;

        if (!col || !tile) return current;

        const newEntry: SimulationHistoryItem = {
          id: `${tile.id}_${fmt}_${fin}_${appEdge ? edgCol : 'noedge'}_${Date.now()}`,
          timestamp: Date.now(),
          collection: col,
          tile,
          tileFormat: fmt,
          tileFinish: fin,
          groutColor: grt,
          applyEdge: appEdge,
          edgeColor: edgCol,
          previewDataUrl,
        };

        setHistory((prev) => {
          const filtered = prev.filter(
            (item) =>
              !(
                item.tile.id === newEntry.tile.id &&
                item.tileFormat === newEntry.tileFormat &&
                item.tileFinish === newEntry.tileFinish &&
                item.applyEdge === newEntry.applyEdge &&
                item.edgeColor === newEntry.edgeColor
              )
          );
          return [newEntry, ...filtered].slice(0, 8);
        });

        return { ...current, resultImage: previewDataUrl };
      });
    },
    []
  );

  const restoreHistoryItem = useCallback((item: SimulationHistoryItem) => {
    setState((prev) => ({
      ...prev,
      selectedCollection: item.collection,
      selectedTile: item.tile,
      tileFormat: item.tileFormat,
      tileFinish: item.tileFinish,
      groutColor: item.groutColor,
      applyEdge: item.applyEdge,
      edgeColor: item.edgeColor,
      resultImage: item.previewDataUrl,
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState({
      currentStep: 1,
      selectedCollection: null,
      selectedTile: null,
      tileFormat: '4x4',
      tileFinish: 'Brillo',
      groutColor: GROUT_COLORS[0].hex,
      applyEdge: false,
      edgeColor: 'coordinated',
      sourceImage: DEMO_PHOTOGRAPHS[0].imageUrl,
      sourceImageName: DEMO_PHOTOGRAPHS[0].title,
      sourceImageDimensions: { width: 1440, height: 810 },
      resultImage: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    state,
    favoriteTileIds,
    history,
    toggleFavoriteTile,
    selectCollection,
    selectTile,
    setSourceImage,
    updateRenderParams,
    canNavigateToStep,
    goToStep,
    addHistoryEntry,
    restoreHistoryItem,
    resetAll,
  };
}
