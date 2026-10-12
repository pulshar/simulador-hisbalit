
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

        const prompt = `
PHOTOREALISTIC ARCHITECTURAL POOL RENOVATION — STRICT IMAGE EDITING.

PRIMARY OBJECTIVE
Edit Image 1, the original pool photograph, by realistically applying the exact Hisbalit mosaic shown in Image 2. The final result must look like a genuine photograph taken after the pool renovation, never like CGI, a 3D render, a drawing, or an AI illustration.

1. PRESERVE THE ORIGINAL PHOTOGRAPH
- Use Image 1 as the immutable photographic foundation.
- Preserve the exact pool geometry, dimensions, perspective, camera position, lens characteristics, and framing.
- Keep all existing steps, corners, curves, drains, waterlines, coping, decking, furniture, vegetation, buildings, and background unchanged.
- Do not redesign, enlarge, shrink, straighten, or reconstruct any architectural element.
- Modify only the pool surfaces that should receive the mosaic.

2. APPLY THE EXACT MOSAIC
- Image 2 is the authoritative reference for the mosaic's appearance.
- Reproduce its actual colour, colour variation, texture, pattern, finish, and visual character as faithfully as possible.
- Do not invent a new pattern, add decorative motifs, shift the hue, or introduce colours absent from the reference.
- Use ${formattedSize} mosaic pieces with realistic, consistent proportions.
- Keep the tiles aligned with the actual three-dimensional pool surfaces and their perspective.
- Tile dimensions must visually diminish with distance and follow the geometry of steps, walls, corners, and the pool floor.
- Render fine, consistent grout joints. Avoid oversized tiles, irregular spacing, floating pieces, warped grids, and repeated artificial patterns.

3. REALISTIC WATER AND OPTICS
- Preserve the existing water level, waterline, and overall scene lighting.
- Where water is present, show believable transparency, depth-dependent colour, natural reflections, subtle refraction, and realistic light scattering.
- The mosaic must remain perceptible beneath the water, with optical distortion appropriate to its depth.
- Add natural caustic light patterns only where physically plausible and consistent with the original lighting.
- Reflections must follow the existing environment and light direction. Do not add imaginary objects or reflections.
- Avoid neon-blue water, uniform artificial colour, excessive clarity, plastic-like surfaces, and exaggerated gloss.

4. PHYSICAL MATERIAL AND FINISH
- Respect the specified mosaic finish: ${finishInstructions}
- Grout appearance: ${groutInstructions}
- Preserve the material characteristics of the selected collection: ${collectionTraitInstructions}
- The mosaic must feel like a real installed ceramic or glass mosaic, with subtle surface irregularities and physically plausible light response.
- Keep the grout colour consistent with the selected specification.

5. EDGES AND BOUNDARIES
- ${edgeInstructions}
- Make every transition between tiled and untiled areas clean, physically plausible, and accurately aligned with the pool boundaries.
- Never spill mosaic onto the coping, terrace, walls outside the pool, or surrounding objects.

6. PHOTOGRAPHIC INTEGRATION
- Match the original image's exposure, white balance, contrast, sharpness, grain, shadows, and ambient lighting.
- Maintain realistic local contrast and natural colour relationships.
- Preserve fine details and avoid excessive smoothing, oversharpening, halos, seams, or blurry boundaries.
- The result must be visually coherent at both full-image and close-up viewing sizes.

STRICT NEGATIVE CONSTRAINTS
Do not change the architecture, camera angle, water level, surrounding environment, or objects.
Do not add people, furniture, plants, lights, decorative elements, or new pool features.
Do not create a synthetic showroom image or an idealized redesign.
Do not alter the specified mosaic to make the image more attractive.
Do not tile surfaces that are outside the intended pool interior.

FINAL QUALITY REQUIREMENT
Produce one convincing, high-quality photographic edit of the original image. Realism, architectural fidelity, and exact mosaic appearance take priority over artistic interpretation.
`;

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
