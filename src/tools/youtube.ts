

import ytSearch from 'yt-search';
import open from 'open';
export const playYouTube = async (args: { query: string }) => {
  try {
    const results = await ytSearch(args.query);
    
    if (!results || results.videos.length === 0) {
      return { error: "No video found" };
    }

    const video = results.videos[0];
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    
    
await open(`${videoUrl}`,{app:{name:"brave"}})



    return { 
      success: true, 
      title: video.title,
      duration: video.duration,
      channel: video.author.name
    };
  } catch (error) {
    return { error: "Failed to play video: " + error };
  }
};
