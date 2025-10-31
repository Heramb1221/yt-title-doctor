import { EventConfig } from "motia";

export const config = {
    name: "SendEmail",
    type: "event",
    subscribes: ['yt.channel.error', 'yt.videos.error', 'yt.titles.error'],
    emits: ['yt.error.notified'],
};

export const handler = async (eventData: any, { emit, logger, state }: any) => {
    try {
        
        const data = eventData || {};
        const jobId = data.jobId;
        const email = data.email;
        const error = data.error;

        logger.info("Hnadling error notifications", {
            jobId,
            email,
        });

        const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if(!RESEND_API_KEY) {
            throw new Error("Resend API key not configured (GEMINI_API_KEY)");
        }

        const emailText = `We are facing some issues in generating better titles for your channel.`

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: [email],
                sunject: `Request Failed for youtube-enhancer`,
                text: emailText
            })
        });

        if(!response.ok) {
            const errorData = await response.json();
            const message = errorData.error?.message || "Unknown Gemini API Error";
            throw new Error(`Resned API error: ${message}`);
        }

        const emailResult = await response.json();

        await emit({
            topic: "yt.error.notified",
            data: {
                jobId,
                email,
                emailId: emailResult.id,

            }
        });

    } catch (error: any) {
        logger.error("Failed to send error notification", {
            error: error.message,
        })
    }
}