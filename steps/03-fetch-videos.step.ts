import { EventConfig } from "motia";

// Step - 3: retrieves the latest 5 videos from channel id
export const config = {
    name: "fetchVideos",
    type: "event",
    subscribes: ['yt.channel.resolved'],
    emits: ['yt.videos.fetched', "yt.videos.error"],
};

interface Video {
    video: string;
    title: string;
    url: string;
    publishedAt: string;
    thumbnail: string;
}

export const handler = async (eventData: any, { emit, logger, state }: any) => {
    let jobId: string | undefined;
    let email: string | undefined;

    try {
        
        const data = eventData || {};
        jobId = data.jobId;
        email = data.email;

        const channelId = data.channelId;
        const channelName = data.channelName;

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if(!YOUTUBE_API_KEY) {
            throw new Error("Youtube API key not configured");
        }

        const jobData = await state.get(`job:${jobId}`);
        await state.set(`job:${jobId}`, {
            ...jobData,
            status: 'fetching videos'
        });

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&maxResults=5&order=date&type=video&key=${YOUTUBE_API_KEY}`;

        const response = await fetch(searchUrl);
        const youtubeData = await response.json();

        if(!youtubeData.items || youtubeData.items.length == 0) {
            logger.warn('No videos found for channel', {jobId, channelId});

            await state.set(`job:${jobId}`, {
                ...jobData,
                status: "failed",
                error: "No videos found for channel"
            });

            await emit({
                topic: 'yt.videos.error',
                data: {
                    jobId,
                    email,
                    error: "No videos found for this channel",
                },
            });

            return;
        }

        const videos: Video[] = youtubeData.items.map((item:any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            url: `https://ww.youtube.com/watch?v=${item.id.videoId}`,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails.default.url
        }));

        logger.info("Videos fetched successfullt", {
            jobId,
            videoCount: videos.length
        })

        await state.set(`job:${jobId}`, {
            ...jobData,
            status: "success",
            videos
        });

        await emit({
            topic: 'yt.videos.fetched',
            data: {
                jobId,
                email,
                channelName,
                videos,
            },
        });

    } catch (error: any) {
        logger.error("Error fetching videos", {error: error.message});

        if(!jobId || !email) {
            logger.error("Cannot send error notification - missing jobid or email")
            return;
        }

        const jobData = await state.get(`job:${jobId}`);

        await state.set(`job:${jobId}`, {
            ...jobData,
            status: 'failed',
            error: error.message
        })

        await emit({
            topic: 'yt.videos.error',
            data: {
                jobId,
                email,
                error: 'Failed to fetch videos. Please try again',
            }
        })
    }
}  