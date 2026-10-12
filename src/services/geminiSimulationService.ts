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

export type GeminiAspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

function calculateClosestAspectRatio(width: number, height: number): GeminiAspectRatio {
  const r = width / height;
  const options: Array<{ ratio: GeminiAspectRatio; val: number }> = [
    { ratio: '16:9', val: 16 / 9 }, // ~1.778
    { ratio: '4:3', val: 4 / 3 },   // ~1.333
    { ratio: '1:1', val: 1.0 },     // 1.0
    { ratio: '3:4', val: 3 / 4 },   // ~0.75
    { ratio: '9:16', val: 9 / 16 }, // ~0.5625
  ];
  let best = options[0];
  let minDiff = Math.abs(r - best.val);
  for (const opt of options) {
    const diff = Math.abs(r - opt.val);
    if (diff < minDiff) {
      minDiff = diff;
      best = opt;
    }
  }
  return best.ratio;
}

export interface ProcessedImageResult {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: GeminiAspectRatio;
}

/**
 * Loads any image URL or Data URL into an HTMLImageElement, resizes it if needed,
 * and returns a normalized base64 Data URL with high-fidelity encoding:
 * - Pool scene photographs: JPEG with 0.95 quality at optimal 1536px dimension.
 * - Mosaic reference samples: lossless PNG to preserve 2 mm grout lines, tessera edges and true pigment colors.
 */
async function ensureImageBase64(
  imageSrc: string,
  maxDim = 1536,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.95
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const origW = img.naturalWidth || img.width || 1280;
      const origH = img.naturalHeight || img.height || 800;
      const aspectRatio = calculateClosestAspectRatio(origW, origH);

      let w = origW;
      let h = origH;
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl =
        outputFormat === 'image/png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl,
        mimeType: outputFormat,
        width: origW,
        height: origH,
        aspectRatio,
      });
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

  // Pool photograph: optimal 1536px resolution with aspect ratio detection
  const sourceImageInfo = await ensureImageBase64(sourceImage, 1536, 'image/jpeg', 0.95);

  // Mosaic texture reference: lossless PNG to preserve 2 mm grout lines and precise tessera colors
  const mosaicImageInfo = await ensureImageBase64(tile.image, 1024, 'image/png');

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
        sourceImageBase64: sourceImageInfo.dataUrl,
        sourceImageMimeType: sourceImageInfo.mimeType,
        aspectRatio: sourceImageInfo.aspectRatio,
        mosaicImageBase64: mosaicImageInfo.dataUrl,
        mosaicImageMimeType: mosaicImageInfo.mimeType,
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
        'No se pudo generar la simulación. Verifica tu conexión o configuración de API Key.'
      );
    }

    onStageChange?.('Preparando simulación...');
    return data.resultImage;
  } finally {
    window.clearTimeout(stageTimer1);
    window.clearTimeout(stageTimer2);
  }
}
