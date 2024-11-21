import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import temp from 'temp';
import fs from 'fs/promises';
import { openai } from './openai';

// Auto-track and cleanup temp files
temp.track();

export async function downloadAndTranscribeVideo(url: string) {
  try {
    // Create temp files
    const videoPath = temp.path({ suffix: '.mp4' });
    const audioPath = temp.path({ suffix: '.mp3' });

    // Download video
    const videoStream = ytdl(url, { quality: 'highest' });
    await new Promise((resolve, reject) => {
      videoStream
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', resolve)
        .on('error', reject);
    });

    // Extract audio
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(audioPath);
    });

    // Transcribe audio
    const audioFile = await fs.readFile(audioPath);
    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text"
    });

    return {
      transcription: transcript,
      duration: null // Duration not critical for recipe extraction
    };
  } catch (error) {
    console.error('Video processing error:', error);
    return {
      transcription: null,
      duration: null
    };
  }
}