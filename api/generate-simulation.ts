
import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido.' });
    }

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
        } = req.body ?? {};

        if (!sourceImageBase64 || !mosaicImageBase64) {
            return res.status(400).json({
                error: 'Faltan la fotografía original o la imagen de referencia del mosaico.',
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
            return res.status(500).json({
                error: 'La variable GEMINI_API_KEY no está configurada correctamente.',
            });
        }

        const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
                headers: { 'User-Agent': 'aistudio-build' },
            },
        });

        const cleanSourceBase64 = String(sourceImageBase64).replace(
            /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
            ''
        );
        const cleanMosaicBase64 = String(mosaicImageBase64).replace(
            /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
            ''
        );

        const tilePhysicalMm = tileFormat === '2.5x2.5' ? 25 : 40;
        const tilesPerMeter = Math.round(1000 / (tilePhysicalMm + 2));
        const formattedSize =
            tileFormat === '2.5x2.5'
                ? `2.5 × 2.5 cm individual square tesserae (approximately ${tilesPerMeter} tesserae per linear meter, separated by a crisp 2 mm grout joint)`
                : `4.0 × 4.0 cm individual square tesserae (approximately ${tilesPerMeter} tesserae per linear meter, separated by a crisp 2 mm grout joint)`;

        let finishInstructions = '';
        if (tileFinish === 'Brillo') {
            finishInstructions =
                'Surface Finish: Glossy recycled vitreous glass, with subtle reflections without artificial glare.';
        } else if (tileFinish === 'Antideslizante A3') {
            finishInstructions =
                'Surface Finish: Satin non-slip barefoot finish, soft diffuse reflection and fine anti-slip texture.';
        } else {
            finishInstructions =
                'Surface Finish: Natural matte mineral finish, diffuse reflection without specular highlights.';
        }

        const groutInstructions = `Grout joints: 2 mm width in color "${groutColorName || 'Blanco/Neutro'}". Maintain a crisp, orthogonal, continuous grid separating every square tessera. Grout must be slightly recessed. Do not blur or erase grout lines.`;

        const colId = String(collectionId || collectionName || '').toLowerCase();
        let collectionTraitInstructions = '';

        if (colId.includes('marmore')) {
            collectionTraitInstructions =
                'Marmore collection: subtle natural stone and marble veining with controlled tonal variation.';
        } else if (colId.includes('aqualuxe')) {
            collectionTraitInstructions =
                'Aqualuxe collection: pearlescent iridescent vitreous mosaic with delicate opalescent reflections matching the reference.';
        } else if (colId.includes('reef')) {
            collectionTraitInstructions =
                'Reef collection: natural coral reef and lagoon tones with organic tonal gradations matching the reference.';
        } else if (colId.includes('deep')) {
            collectionTraitInstructions =
                'Deep collection: intense dark volcanic and oceanic tones with visible tesserae.';
        } else if (colId.includes('water-mix') || colId.includes('water mix')) {
            collectionTraitInstructions =
                'Water Mix collection: preserve the exact proportions of differently colored tesserae in the reference. Never blend them into one uniform color.';
        } else {
            collectionTraitInstructions =
                'Marine / Clásica collection: reproduce the exact color mix, saturation and tonal variation in the reference sample.';
        }

        const edgeInstructions = applyEdge
            ? `Apply Hisbalit EDGE rounded safety bullnose pieces along all exposed underwater step front edges, stair nosings and bench perimeters in color "${edgeColorName}". Keep the flat treads and risers tiled with the primary mosaic.`
            : 'Hisbalit EDGE disabled. Maintain continuous planar mosaic tiling across steps and edges.';

        const prompt = `TASK: HIGH-PRECISION PHOTOREALISTIC RENOVATION OF A SWIMMING POOL MOSAIC.

INPUT REFERENCES:
IMAGE 1 is the original pool photograph.
IMAGE 2 is the authoritative Hisbalit mosaic sample. Match its tessera colors, distribution, finish and grout.

PRODUCT SPECIFICATION:
Brand: Hisbalit Mosaico Ecológico, 100% recycled vitreous glass.
Collection: ${collectionName}
Model: ${tileName}
Primary color: ${tileColor}
Tonality: ${tileTonality}
Pattern / blend: ${tilePattern}
Description: ${tileDescription}
Tile format: ${formattedSize}
${groutInstructions}
${finishInstructions}
${collectionTraitInstructions}
${edgeInstructions}

CRITICAL REQUIREMENTS:
1. Apply the mosaic to 100% of the submerged pool basin: foreground steps and ledges, shallow platforms, the entire deep pool floor and all submerged perimeter walls.
2. The entire basin is one continuous pool. Do not add dividing walls, partitions, barriers or raised curbs. Preserve the original pool geometry.
3. Do not tile or modify the sandstone coping, terrace, wooden deck, furniture, sunbeds, umbrellas, house, garden or any other surroundings.
4. Preserve the exact camera angle, perspective, lighting, waterline, ripples and natural underwater caustics.
5. Tesserae must follow the pool's true perspective, remain aligned with the pool edges and become naturally smaller with distance. Keep the grout grid crisp and visible.
6. Produce a realistic professional photograph of the pool renovated with the specified Hisbalit material. Change only the pool's interior surfaces.`;

        const targetModel =
            process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

        const response = await ai.models.generateContent({
            model: targetModel,
            contents: {
                parts: [
                    {
                        text: 'IMAGE 1: ORIGINAL POOL PHOTOGRAPH. MODIFY ONLY THE POOL INTERIOR.',
                    },
                    {
                        inlineData: {
                            mimeType: sourceImageMimeType || 'image/jpeg',
                            data: cleanSourceBase64,
                        },
                    },
                    {
                        text: 'IMAGE 2: AUTHORITATIVE HISBALIT MOSAIC SAMPLE.',
                    },
                    {
                        inlineData: {
                            mimeType: mosaicImageMimeType || 'image/png',
                            data: cleanMosaicBase64,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio:
                        (aspectRatio as '16:9' | '4:3' | '1:1' | '3:4' | '9:16') ||
                        '16:9',
                },
                temperature: 0.1,
            },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((part) => part.inlineData?.data);

        if (!imagePart?.inlineData?.data) {
            return res.status(502).json({
                error: 'Gemini no devolvió una imagen editada. Inténtalo de nuevo.',
            });
        }

        const mime = imagePart.inlineData.mimeType || 'image/png';

        return res.status(200).json({
            resultImage: `data:${mime};base64,${imagePart.inlineData.data}`,
        });
    } catch (error: unknown) {
        console.error('Error generating simulation with Gemini:', error);

        const message =
            error instanceof Error ? error.message : 'Error desconocido.';

        const userMessage = message.includes(
            'Image generation is not available in your country'
        )
            ? 'La generación de imágenes no está disponible en esta región para la configuración actual de Gemini.'
            : `No se pudo generar la simulación con Gemini: ${message}`;

        return res.status(500).json({
            error: userMessage,
            details: message,
        });
    }
}
