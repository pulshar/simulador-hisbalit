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


      const prompt = `
TASK: PHOTOREALISTIC SWIMMING POOL MOSAIC RENOVATION.

INPUT IMAGES:
- IMAGE 1: The original photograph uploaded by the user. This is the image to edit.
- IMAGE 2: The actual Hisbalit mosaic product reference. Use it as the primary reference for the tile design, colors, pattern and visual material.

PRODUCT:
- Brand: Hisbalit
- Collection: ${collectionName}
- Model: ${tileName}
- Color: ${tileColor}
- Tonality: ${tileTonality}
- Pattern: ${tilePattern}
- Description: ${tileDescription}
- Tile format: ${formattedSize}
- Grout: 2 mm, color ${groutColorName || 'neutral'}
- ${finishInstructions}
- ${collectionTraitInstructions}
- ${edgeInstructions}

PRIMARY OBJECTIVE:
Edit the original photograph to show the existing swimming pool
finished with the selected mosaic.

SURFACE SELECTION:
Identify ONLY the interior surfaces belonging to the swimming pool:
1. The submerged pool floor.
2. The submerged vertical walls.
3. Built-in underwater steps, benches and internal ledges.

Do NOT tile the terrace, pool coping, outdoor paving, house walls,
furniture, planters or any other surrounding surface.

If a surface is not clearly part of the pool interior, leave it unchanged.

PRESERVE THE ORIGINAL PHOTOGRAPH:
Keep the original camera viewpoint, framing, pool outline, dimensions,
depth, steps, architecture, landscape, furniture and all surrounding objects.

Do not redesign, reconstruct, replace or regenerate the scene.
Do not change the shape or position of any architectural element.

MOSAIC FIDELITY:
Image 2 is the authoritative visual reference for the mosaic.
Reproduce its actual colors, individual tesserae, color distribution,
pattern and grout appearance as faithfully as possible.

Do not replace the reference with a generic blue mosaic.
Do not invent a new pattern, simplify the pattern or turn it into
a uniform color.

The ${formattedSize} tile format determines the apparent physical
size of the individual pieces. Maintain consistent scale across
the pool, with smaller apparent pieces in more distant areas.

PERSPECTIVE AND SURFACES:
Fit the mosaic independently to each visible pool surface.
Follow the perspective, vanishing lines, boundaries and orientation
of the floor, walls, steps and benches.
Keep tile rows and grout joints coherent across each plane.
Do not stretch one flat texture across the entire pool.

UNDERWATER REALISM:
The mosaic must appear beneath the water, not on top of it.
Preserve the original waterline, reflections, ripples, highlights,
shadows, refraction and visible depth wherever possible.
Allow natural water color and light to affect the appearance of the
mosaic without destroying its recognizable design.

FINAL CONSTRAINT:
Change only the pool's interior finish.
Every pixel outside the pool interior should remain as close as
possible to the original photograph.

The result should look like a real photograph of the same pool
after installation of the selected Hisbalit mosaic, not a new
AI-generated architectural scene.
`;

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
