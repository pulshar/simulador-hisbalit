import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Gemini Image Editing Endpoint for Mosaic Simulation
  app.post('/api/generate-simulation', async (req, res) => {
    try {
      const {
        sourceImageBase64,
        sourceImageMimeType,
        aspectRatio,
        mosaicImageBase64,
        mosaicImageMimeType,
        collectionName,
        collectionId,
        tileName,
        tileColor,
        tileTonality,
        tilePattern,
        tileDescription,
        tileFormat,
        tileFinish,
        groutColorName,
        applyEdge,
        edgeColorName,
      } = req.body;

      if (!sourceImageBase64 || !mosaicImageBase64) {
        res.status(400).json({
          error: 'Faltan la fotografía original o la imagen de referencia del mosaico.',
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(400).json({
          error:
            'No se ha detectado una API Key de Gemini configurada. Genera una clave en Google AI Studio (https://aistudio.google.com/) y configúrala en la variable de entorno GEMINI_API_KEY (panel Settings > Secrets).',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const cleanSourceBase64 = sourceImageBase64.replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        ''
      );
      const cleanMosaicBase64 = mosaicImageBase64.replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        ''
      );

      const tilePhysicalMm = tileFormat === '2.5x2.5' ? 25 : 40;
      const tilesPerMeter = Math.round(1000 / (tilePhysicalMm + 2)); // 2mm continuous grout
      const formattedSize =
        tileFormat === '2.5x2.5'
          ? `2.5 × 2.5 cm individual square tesserae (Small format: approximately ${tilesPerMeter} tesserae per linear meter, separated by a crisp 2 mm continuous grout joint)`
          : `4.0 × 4.0 cm individual square tesserae (Medium format: approximately ${tilesPerMeter} tesserae per linear meter, separated by a crisp 2 mm continuous grout joint)`;

      let finishInstructions = '';
      if (tileFinish === 'Brillo') {
        finishInstructions =
          'Surface Finish: Brillo (Glossy 100% recycled vitreous glass). Each individual tessera has a subtle vitreous micro-specular sheen and light reflection, catching the sun without obscuring the underlying tile color or drowning the scene in artificial white glare.';
      } else if (tileFinish === 'Antideslizante A3') {
        finishInstructions =
          'Surface Finish: Antideslizante A3 (Satin non-slip barefoot finish). Soft, velvety diffuse reflection with fine anti-slip micro-texture, reducing specular glares.';
      } else {
        finishInstructions =
          'Surface Finish: Mate (Natural matte mineral finish). Purely diffuse reflection, organic stone-like feel without specular highlights.';
      }

      const groutInstructions = `Grout joints: 2 mm width in color "${groutColorName || 'Blanco/Neutro'}".
- The grout lines must form a crisp, orthogonal, continuous grid separating every square tessera.
- The grout is slightly recessed between tesserae (subtle micro-shadow along joints), never flat or smeared over the glass face.
- Do NOT blur, erase, or blend the grout lines into the tile colors.`;

      const colId = (collectionId || collectionName || '').toLowerCase();
      let collectionTraitInstructions = '';
      if (colId.includes('marmore')) {
        collectionTraitInstructions =
          'Collection trait (Marmore): Controlled destonification (Grade V3/V4). Each individual 4 × 4 cm piece exhibits subtle natural stone/marble veining with controlled tone variation between adjacent tiles, avoiding flat monochromatic uniformity.';
      } else if (colId.includes('aqualuxe')) {
        collectionTraitInstructions =
          'Collection trait (Aqualuxe): Pearlescent and iridescent vitreous mosaic ("acabado nacarado e iridiscente"). Individual tesserae reflect delicate rainbow/opalescent micro-shimmers when struck by daylight, exactly matching the reference tile sample.';
      } else if (colId.includes('reef')) {
        collectionTraitInstructions =
          'Collection trait (Reef): Natural coral-reef and lagoon inspired vitreous mosaic with organic tonal gradations and controlled destonification, reproducing the vibrant aquatic mineral tones of the reference sample.';
      } else if (colId.includes('deep')) {
        collectionTraitInstructions =
          'Collection trait (Deep): Deep, intense dark volcanic and oceanic vitreous mosaic with controlled destonification, producing profound water depth while preserving the visible tessera grid.';
      } else if (colId.includes('water-mix') || colId.includes('water mix')) {
        collectionTraitInstructions =
          'Collection trait (Water Mix): Harmonious multi-tone vitreous mosaic blend. CRITICAL: Preserve the exact proportional mixture of different colored tesserae shown in Image 2. Do NOT blend or average them into a single uniform cyan or blue color.';
      } else {
        collectionTraitInstructions =
          'Collection trait (Marine / Clásica): Artisanal coastal vitreous glass mosaic in 100% recycled glass, reproducing the exact color mix, saturation, and subtle destonification shown in the reference image.';
      }

      let edgeInstructions =
        'Special Edge / Coping Trim Pieces (Hisbalit EDGE): Disabled (maintain continuous planar mosaic tiling across all steps and edges).';
      if (applyEdge) {
        edgeInstructions = `Special Edge / Coping Trim Pieces (Hisbalit EDGE Safety System): ENABLED in color/finish "${edgeColorName}".
- Apply the Hisbalit EDGE rounded safety bullnose pieces (curved profile, ~15-20 mm radius) along all exposed underwater step front edges (bordes/aristas de peldaños), stair nosings, and bench perimeters in color "${edgeColorName}".
- The flat horizontal treads and vertical risers behind the EDGE trim remain tiled with the primary mosaic.`;
      }

      const prompt = `TASK: HIGH-PRECISION PHOTOREALISTIC RENOVATION OF COMPLETE SWIMMING POOL MOSAIC.

INPUT REFERENCES PROVIDED:
- IMAGE 1: Base photograph of the swimming pool and its terrace to renovate.
- IMAGE 2: The authoritative Hisbalit mosaic material sample. Every tessera color, distribution, finish and grout line must be derived from this exact product sample.

HISBALIT PRODUCT SPECIFICATION:
- Brand: Hisbalit Mosaico Ecológico (100% recycled vitreous glass)
- Collection: ${collectionName}
- Model: ${tileName}
- Primary Color: ${tileColor}
- Tonality: ${tileTonality}
- Pattern / Blend: ${tilePattern}
- Description: ${tileDescription}
- Tile Format: ${formattedSize}
- ${groutInstructions}
- ${finishInstructions}
- ${collectionTraitInstructions}
- ${edgeInstructions}

[CRITICAL DIRECTIVE 1: THE COMPLETE WATER BASIN IS ONE SINGLE UNIFIED POOL]
In Image 1, the entire continuous body of water—from the immediate foreground sunken pit, stairs and ledges all the way to the farthest rear wall/edge—is ONE SINGLE CONTINUOUS SWIMMING POOL.
- You MUST apply the Hisbalit mosaic across 100% OF THE SUBMERGED BASIN:
  * The foreground sunken lounge / steps / spa zone.
  * The submerged shallow platform / ledges.
  * The entire deep main pool floor all the way to the farthest rear edge.
  * All submerged vertical perimeter walls on all sides of the pool (front, left, right, and rear).
- Do NOT tile only the foreground pit!
- Do NOT stop at the steps!
- Do NOT leave any portion of the pool with the old finish or old water color! The entire body of water must reflect the new Hisbalit mosaic finish uniformly from front to back.

[CRITICAL DIRECTIVE 2: ZERO STRUCTURAL MODIFICATIONS - NO INTERNAL WALLS]
- Do NOT build, invent, or add any dividing walls, partitions, barriers, or raised curbs inside the pool.
- Keep the existing open water surface and pool architecture 100% identical to Image 1.
- Do NOT alter the existing pool shape, stairs geometry, or depth transitions.

[CRITICAL DIRECTIVE 3: STRICT EXCLUSIONS - PRESERVE COPING AND SURROUNDINGS 100%]
- The flat sandstone coping rim (albardilla / perimeter pool rim / bordillo de coronación) framing the pool MUST REMAIN UNTOUCHED natural stone. ZERO tiles on top of the coping stones! The mosaic stops strictly at the vertical inner waterline.
- ZERO MODIFICATIONS OUTSIDE POOL INTERIOR:
  * Do NOT alter the surrounding terrace paving, wooden deck, porcelain tiles, or lawn/grass.
  * Do NOT alter or move any patio furniture, sunbeds, loungers, umbrellas, house facade, pergola, fences, garden planters, trees, background mountains, sea, or sky.
  * Preserve the exact camera angle, perspective, field of view, focal depth, and scene lighting.

[CRITICAL DIRECTIVE 4: PERSPECTIVE AND UNDERWATER OPTICS]
- Apply the exact mosaic from Image 2 across all submerged surfaces.
- Follow the true 3D geometric perspective of the pool:
  * In the foreground (shallow steps, near walls), individual tesserae are distinct, crisp, and clearly visible.
  * With distance, they scale down naturally along perspective lines.
  * The mosaic rows must remain orthogonal and parallel to pool edges, not warped or distorted.
- The mosaic is installed beneath the existing water layer: preserve the natural waterline, surface ripples, and solar caustics dancing over the tiled floor and steps.

[FINAL RESULT TARGET]
The resulting image must look like a real, professional photograph taken after the pool was retiled with Hisbalit ${collectionName} ${tileName}, with 100% of the surrounding environment kept untouched.`;

      const targetModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [
            {
              text: 'IMAGE 1 (BASE PHOTOGRAPHY TO RENOVATE - MODIFY ONLY THE POOL INTERIOR SURFACES):',
            },
            {
              inlineData: {
                mimeType: sourceImageMimeType || 'image/jpeg',
                data: cleanSourceBase64,
              },
            },
            {
              text: 'IMAGE 2 (AUTHORITATIVE HISBALIT MOSAIC MATERIAL SAMPLE - EXACT TESSERAE, COLOR & GROUT TO APPLY):',
            },
            {
              inlineData: {
                mimeType: mosaicImageMimeType || 'image/png',
                data: cleanMosaicBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: (aspectRatio as '16:9' | '4:3' | '1:1' | '3:4' | '9:16') || '16:9',
          },
          temperature: 0.1,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let generatedImageDataUrl: string | null = null;

      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!generatedImageDataUrl) {
        res.status(502).json({
          error:
            'El modelo no devolvió una imagen editada en esta solicitud. Por favor, inténtalo de nuevo.',
        });
        return;
      }

      res.json({
        resultImage: generatedImageDataUrl,
      });
    } catch (error: unknown) {
      console.error('Error generating simulation with Gemini:', error);
      const message =
        error instanceof Error ? error.message : 'Error desconocido al procesar la imagen con Gemini.';

      let userFriendlyMessage = `No se pudo generar la simulación con Gemini: ${message}`;
      if (message.includes('Image generation is not available in your country')) {
        userFriendlyMessage =
          'Google AI Studio restringe la generación de imágenes en tu país/región (UE/España). Conecta una VPN hacia EE.UU. o configura Vertex AI (us-central1).';
      }

      res.status(500).json({
        error: userFriendlyMessage,
        details: message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hisbalit Simulador server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
