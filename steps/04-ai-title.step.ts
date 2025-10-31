import { EventConfig } from "motia";

// Step - 4: uses Google Gemini to generate improved titles
export const config = {
    name: "GenerateTitles",
    type: "event",
    subscribes: ['yt.videos.fetched'],
    emits: ['yt.titles.ready', "yt.titles.error"],
};

interface Video {
    video: string;
    title: string;
    url: string;
    publishedAt: string;
    thumbnail: string;
}

interface ImprovedTitle {
    original: string;
    improved: string;
    rational: string;
    url: string;
}

export const handler = async (eventData: any, { emit, logger, state }: any) => {
    let jobId: string | undefined;
    let email: string | undefined;

    try {
        const data = eventData || {};
        jobId = data.jobId;
        email = data.email;

        const channelName = data.channelName;
        const videos = data.videos

        logger.info("Generating titles with Gemini", {
            jobId,
            videoCount: videos.length
        });

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if(!GEMINI_API_KEY) {
            throw new Error("Gemini API key not configured (GEMINI_API_KEY)");
        }

        const jobData = await state.get(`job:${jobId}`);
        await state.set(`job:${jobId}`, {
            ...jobData,
            status: 'generating titles'
        });

        const videoTitles = videos.map((v: Video, idx: number) => `${idx + 1}. "${v.title}`).join('\n');

        const prompt = `You are a Youtube title optimization expert. Below are ${videos.length} video titles from the channel "${channelName}".
        For each title, provide:
        1. An improved version that is more engaging, SEO-friendly, and likely to get more clicks.
        2. A brief rationale (1-2 sentences) explaining why the improved title is better.

        Guidelines:
        - Keep the core topic and authenticity
        - Use action verbs, numbers, and specific value prepositions
        - Make it curiosity-inducing without being clickbait
        - Optimize for searchability and clarity

        Video Titles:
        ${videoTitles}

        Respond *only* in this exact JSON format (no markdown backticks or other text):
        {
            "titles": [
                {
                    "original": "...",
                    "improved": "...",
                    "rational": "..."
                }
            ]
        }`;

        const model = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`; // Updated to v1beta
        
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify(requestBody)
        });

        if(!response.ok) {
            const errorData = await response.json();
            const message = errorData.error?.message || "Unknown Gemini API Error";
            throw new Error(`Gemini API error: ${message}`);
        }

        const aiResponse = await response.json();

        if (!aiResponse.candidates || aiResponse.candidates.length === 0) {
            logger.warn("Gemini returned no candidates", { aiResponse });
            throw new Error("AI returned an empty response.");
        }
        
        const aiContent = aiResponse.candidates[0].content.parts[0].text;
        const parsedResponse = JSON.parse(aiContent);

        const improvedTitles: ImprovedTitle[] = parsedResponse.titles.map((title: any, idx: number) => ({
            original: title.original,
            improved: title.improved,
            rational: title.rational,
            url: videos[idx].url 
        }));

        logger.info("Titles Generated successfully", {jobId, 
            count: improvedTitles.length
        });

        await state.set(`job:${jobId}`, {
            ...jobData,
            status: "titles ready",
            improvedTitles
        });

        await emit({
            topic: "yt.titles.ready",
            data: {
                jobId,
                channelName,
                improvedTitles,
                email,
            }
        });
        
    } catch (error: any) {
        logger.error("Error generating titles", {error: error.message});

        if(!jobId || !email) {
            logger.error("Cannot send error notification - missing jobid or email")
            return;
        }

        const jobData = await state.get(`job:${jobId}`);

        await state.set(`job:${jobId}`, {
            ...jobData,
            status: 'failed',
            error: error.message
        });

        await emit({
            topic: 'yt.titles.error',
            data: {
                jobId,
                email,
                error: 'Failed to fetch improved titles. Please try again',
            }
        });
    }
}