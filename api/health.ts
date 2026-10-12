export default function handler(_req: any, res: any) {
    res.status(200).json({
        status: "ok",
        aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    });
}