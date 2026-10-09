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

      const formattedSize =
        tileFormat === '2.5x2.5'
          ? '2.5 × 2.5 cm (small square tesserae)'
          : '4 × 4 cm (medium square tesserae)';

      let finishInstructions = '';
      if (tileFinish === 'Brillo') {
        finishInstructions =
          'Finish: Brillo (Glossy vitreous glass finish). Give the mosaic a subtly glossy and reflective vitreous appearance without exaggerating the effect.';
      } else if (tileFinish === 'Antideslizante A3') {
        finishInstructions =
          'Finish: Antideslizante A3 (Non-slip satin finish). Give the mosaic a softer, less specular satin appearance without exaggerating the effect.';
      } else {
        finishInstructions =
          'Finish: Mate (Matte stone-like finish). Give the mosaic a natural matte and diffuse appearance without specular glare.';
      }

      const colId = (collectionId || collectionName || '').toLowerCase();
      let collectionTraitInstructions = '';
      if (colId.includes('marmore')) {
        collectionTraitInstructions =
          'Collection trait (Marmore): Apply controlled destonification ("destonificación controlada"). Individual 4 × 4 cm mosaic pieces must show subtle, natural stone-veined tonal variations from piece to piece, avoiding a flat uniform color.';
      } else if (colId.includes('aqualuxe')) {
        collectionTraitInstructions =
          'Collection trait (Aqualuxe): Pearlescent and iridescent vitreous mosaic ("acabado nacarado e iridiscente") with controlled destonification, producing subtle, sophisticated shimmering light reflections matching the reference image.';
      } else if (colId.includes('reef')) {
        collectionTraitInstructions =
          'Collection trait (Reef): Coral-reef inspired vitreous mosaic with irregular natural tonal effects and controlled destonification ("destonificación controlada"), reproducing the exact colors of the reference mosaic image.';
      } else if (colId.includes('deep')) {
        collectionTraitInstructions =
          'Collection trait (Deep): Deep, intense dark volcanic/oceanic vitreous mosaic with controlled destonification, enhancing water depth and natural surface reflections.';
      } else if (colId.includes('water-mix') || colId.includes('water mix')) {
        collectionTraitInstructions =
          'Collection trait (Water Mix): Harmonious multi-tone vitreous mosaic blend inspired by natural coves, maintaining the exact proportion of colors shown in the reference mosaic image.';
      } else {
        collectionTraitInstructions =
          'Collection trait (Marine): Artisanal coastal vitreous glass mosaic in 100% recycled glass, blending the exact chromatic tones shown in the reference mosaic image.';
      }

      let edgeInstructions =
        'Special Edge / Coping Trim Pieces (Hisbalit EDGE): Not enabled (apply standard continuous mosaic tiling across all planes).';
      if (applyEdge) {
        edgeInstructions = `Special Edge / Coping Trim Pieces (Hisbalit EDGE System): Enabled with finish/color "${edgeColorName}". Automatically identify and apply this Hisbalit EDGE finishing piece color along visible step edges (bordes de peldaños), stair nosings, pool corners, coping edges, or curved transitions wherever architecturally appropriate in the photograph.`;
      }

      const prompt = `Edit the provided photograph (Image 1) to realistically visualize the selected mosaic (Image 2) installed on the appropriate visible architectural surface.

Use the provided product/mosaic image (Image 2) as the exact visual reference for the selected mosaic.

PRODUCT TECHNICAL SPECIFICATIONS:
- Brand & Collection: Hisbalit — Colección ${collectionName}
- Mosaic Model: ${tileName} (${tileColor} / ${tileTonality} — ${tilePattern})
- Visual Description: ${tileDescription}
- Selected Format (Tile Size): ${formattedSize}. Note: 2.5 × 2.5 cm pieces must appear visually smaller and denser than 4 × 4 cm pieces, scaled realistically according to the surface distance and perspective depth.
- Grout Joint Width: 2 mm (${groutColorName || 'neutral architectural grout'}).
- ${finishInstructions}
- ${collectionTraitInstructions}
- ${edgeInstructions}

STRICT ARCHITECTURAL & PHOTOREALISM INSTRUCTIONS:
Identify the most appropriate visible surface to tile based on the photograph (such as swimming pool interior basin, pool floor, pool walls, submerged steps/stairs, terrace floor, or architectural wall).

Apply the selected mosaic only to that surface.

Preserve the original photograph, camera angle, composition, architecture, geometry and perspective.

The individual mosaic pieces must maintain their correct physical proportions according to the selected product format (${formattedSize}).

Respect the specified grout width (2 mm).

The mosaic pattern must follow the perspective, depth, contours and vanishing lines of the existing surface. If there are stairs, steps, or multiple visible planes (e.g. vertical pool walls and horizontal pool floor), apply the mosaic respecting each plane and its individual 3D perspective—do not treat the entire pool as a single flat surface.

Do not apply the mosaic as a flat rectangular overlay.

Make the mosaic appear physically installed on the surface.

If the photograph contains a swimming pool with water, integrate the mosaic visually beneath/inside the water, preserving all existing water reflections, ripples, waves, caustics, shadows, refractions, depth, and existing illumination. The mosaic must look situated inside/under the water where appropriate, never pasted on top of the water.

Preserve the original lighting, shadows, reflections, highlights, water appearance and depth.

Preserve all objects and elements that are not part of the tiled surface.

Do not modify people, furniture, plants, fixtures, architectural elements or decorative objects.

Do not change the camera position or composition.

Do not redesign or reconstruct the environment.

Only change the surface material to the selected mosaic.

The final result must look like a realistic professional photograph of the original space after installing the selected mosaic.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: sourceImageMimeType || 'image/jpeg',
                data: cleanSourceBase64,
              },
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
            'El modelo Gemini no devolvió una imagen editada en esta solicitud. Por favor, inténtalo de nuevo.',
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
      res.status(500).json({
        error: `No se pudo generar la simulación con Gemini: ${message}`,
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
