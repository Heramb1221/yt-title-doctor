import { EventConfig } from "motia";

// Step - 5: sends formatted email with improved titles to the user using resend
export const config = {
    name: "SendSuccessEmail",
    type: "event",
    subscribes: ['yt.titles.ready'],
    emits: ['yt.email.sent'],
};

interface ImprovedTitle {
    original: string;
    improved: string;
    rational: string;
    url: string;
}

function generateEmailText(
    channelName: string, 
    titles: ImprovedTitle[]
): string {
    let text = `Youtube Title Doctor - Improved Titles for ${channelName}\n`;
    text += `${"=".repeat(60)}\n\n`;

    titles.forEach((title, index) => {
        text+= `Video ${index + 1}:\n`;
        text += `-------------\n`;
        text += `Original Title: ${title.original}\n`;
        text += `Improved: ${title.improved}\n`;
        text += `Why: ${title.rational}\n`;
        text += `Watch: ${title.url}\n\n`;
    });

    text += `${"=".repeat(60)}\n`;
    text += `Powered by Motia.dev\n`;

    return text;
}

export const handler = async (eventData: any, { emit, logger, state }: any) => {
    let jobId: string | undefined;

    try {
        const data = eventData || {};
        jobId = data.jobId;
        const email = data.email;
        const channelName = data.channelName;
        const improvedTitles = data.improvedTitles;

        logger.info("Sending Success Email", {
            jobId,
            email,
            titleCount: improvedTitles.length
        });

        const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
        if (!RESEND_FROM_EMAIL) {
            throw new Error("Resend from email not configured (RESEND_FROM_EMAIL)");
        }

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if(!RESEND_API_KEY) {
            throw new Error("Resend API key not configured (RESEND_API_KEY)");
        }

        const jobData = await state.get(`job:${jobId}`);
        await state.set(`job:${jobId}`, {
            ...jobData,
            status: 'sending email'
        });

        const emailText = generateEmailText(channelName, improvedTitles);

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: [email],
                subject: `New titles for ${channelName}`,
                text: emailText
            })
        });

        if(!response.ok) {
            const errorData = await response.json();
            const message = errorData.error?.message || "Unknown Resend API Error";
            throw new Error(`Resend API error: ${message}`);
        }

        const emailResult = await response.json();

        logger.info("Email sent successfully", {
            jobId,
            emailId: emailResult.id,
        });

        await state.set(`job:${jobId}`, {
            ...jobData,
            status: "completed",
            emailId: emailResult.id,
            completedAt: new Date().toISOString(),
        });

        await emit({
            topic: "yt.email.sent",
            data: {
                jobId,
                email,
                emailId: emailResult.id,
            }
        });

    } catch (error: any) {
        logger.error("Error sending email", {error: error.message});

        if(!jobId) {
            logger.error("Cannot update job state - missing jobid")
            return;
        }

        const jobData = await state.get(`job:${jobId}`);

        await state.set(`job:${jobId}`, {
            ...jobData,
            status: 'failed',
            error: error.message
        });
    }
};