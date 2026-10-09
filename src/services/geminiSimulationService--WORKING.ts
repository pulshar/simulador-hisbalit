import {
  Collection,
  EdgeColorMode,
  Tile,
  TileFinish,
  TileFormat,
} from '../types/simulation';
import { EDGE_COLORS, GROUT_COLORS } from '../data/collections';

export type SimulationProgressStage =
  | 'Analizando fotografía...'
  | 'Aplicando mosaico...'
  | 'Preparando simulación...';

export interface GenerateSimulationRequest {
  sourceImage: string;
  collection: Collection;
  tile: Tile;
  tileFormat: TileFormat;
  tileFinish: TileFinish;
  groutColor: string;
  applyEdge: boolean;
  edgeColor: EdgeColorMode;
  onStageChange?: (stage: SimulationProgressStage) => void;
}

/**
 * Loads any image URL or Data URL into an HTMLImageElement, resizes it to max 2048px
 * if needed, and returns a normalized base64 Data URL ready for the Gemini API.
 */
async function ensureImageBase64(
  imageSrc: string,
  maxDim = 2048
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      let w = img.naturalWidth || img.width || 1280;
      let h = img.naturalHeight || img.height || 800;
      if (Math.max(w, h) > maxDim) {
        const ratio = maxDim / Math.max(w, h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto de imagen en el navegador.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ dataUrl, mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      reject(new Error('No se pudo cargar la fotografía seleccionada.'));
    };
    img.src = imageSrc;
  });
}

/**
 * Calls the backend Gemini image generation/editing endpoint to realistically install
 * the selected mosaic on the appropriate architectural surface of the photograph.
 */
export async function generateGeminiMosaicSimulation(
  params: GenerateSimulationRequest
): Promise<string> {
  const {
    sourceImage,
    collection,
    tile,
    tileFormat,
    tileFinish,
    groutColor,
    applyEdge,
    edgeColor,
    onStageChange,
  } = params;

  onStageChange?.('Analizando fotografía...');

  const { dataUrl: sourceImageBase64, mimeType: sourceImageMimeType } =
    await ensureImageBase64(sourceImage);

  const { dataUrl: mosaicImageBase64, mimeType: mosaicImageMimeType } =
    await ensureImageBase64(tile.image);

  const groutObj = GROUT_COLORS.find((g) => g.hex.toLowerCase() === groutColor.toLowerCase());
  const groutColorName = groutObj ? groutObj.name : 'Junta 2mm neutra';

  const edgeColorObj = EDGE_COLORS.find((c) => c.id === edgeColor);

  const stageTimer1 = window.setTimeout(() => {
    onStageChange?.('Aplicando mosaico...');
  }, 1800);

  const stageTimer2 = window.setTimeout(() => {
    onStageChange?.('Preparando simulación...');
  }, 4500);

  try {
    const response = await fetch('/api/generate-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceImageBase64,
        sourceImageMimeType,
        mosaicImageBase64,
        mosaicImageMimeType,
        collectionName: collection.name,
        collectionId: collection.id,
        tileName: tile.name,
        tileColor: tile.color,
        tileTonality: tile.tonality,
        tilePattern: tile.pattern,
        tileDescription: tile.description,
        tileFormat,
        tileFinish,
        groutColorName,
        applyEdge,
        edgeColorName:
          edgeColor === 'coordinated'
            ? `Coordinado con el mosaico ${tile.name}`
            : `${edgeColorObj?.name || 'EDGE'} (${edgeColorObj?.subtitle || ''})`,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.resultImage) {
      throw new Error(
        data.error ||
          'No se pudo generar la simulación con Gemini. Verifica tu conexión o configuración de API Key.'
      );
    }

    onStageChange?.('Preparando simulación...');
    return data.resultImage;
  } finally {
    window.clearTimeout(stageTimer1);
    window.clearTimeout(stageTimer2);
  }
}
