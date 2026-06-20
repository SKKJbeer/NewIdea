import axios from 'axios';
import { VideoScript, PokemonCard } from '@/types';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

export async function generateVoiceover(text: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) { console.warn('ElevenLabs API key missing'); return null; }
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
  try {
    const response = await axios.post(
      `${ELEVENLABS_API}/text-to-speech/${voiceId}`,
      { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true } },
      { headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  } catch (error) { console.error('Voiceover generation failed:', error); return null; }
}

export function buildVideoComposition(script: VideoScript, cards: PokemonCard[]) {
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  return {
    fps: 30,
    durationInFrames: script.duration * 30,
    width: script.format === 'youtube' ? 1920 : 1080,
    height: script.format === 'youtube' ? 1080 : 1920,
    scenes: script.scenes.map((scene) => ({ ...scene, card: scene.cardId ? cardMap.get(scene.cardId) : undefined })),
    branding: { primaryColor: '#7c3aed', secondaryColor: '#4f46e5', logoText: 'PokéMarket Intelligence', channelName: '@pokemarketintelligence' },
    affiliateUrl: process.env.CARDMARKET_AFFILIATE_URL || 'https://www.cardmarket.com',
  };
}

export async function triggerVideoRender(compositionId: string, props: Record<string, unknown>): Promise<string | null> {
  const lambdaEndpoint = process.env.REMOTION_LAMBDA_ENDPOINT;
  if (!lambdaEndpoint) { console.log('Remotion Lambda not configured'); return null; }
  try {
    const response = await axios.post(`${lambdaEndpoint}/render`, { compositionId, props }, { headers: { 'x-api-key': process.env.REMOTION_API_KEY } });
    return response.data.renderId;
  } catch (error) { console.error('Video render trigger failed:', error); return null; }
}

export async function uploadToYouTube(videoBuffer: Buffer, script: VideoScript): Promise<string | null> {
  const accessToken = process.env.YOUTUBE_ACCESS_TOKEN;
  if (!accessToken) { console.warn('YouTube access token missing'); return null; }
  try {
    const initResponse = await axios.post(
      `${YOUTUBE_API}/videos?uploadType=resumable&part=snippet,status`,
      { snippet: { title: script.title, description: script.description, tags: script.tags, categoryId: '28', defaultLanguage: 'de' }, status: { privacyStatus: 'private', publishAt: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d.toISOString(); })() } },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': videoBuffer.length } }
    );
    const uploadUrl = initResponse.headers.location;
    const uploadResponse = await axios.put(uploadUrl, videoBuffer, { headers: { 'Content-Type': 'video/mp4', 'Content-Length': videoBuffer.length } });
    return uploadResponse.data.id;
  } catch (error) { console.error('YouTube upload failed:', error); return null; }
}

export async function runFullVideoPipeline(script: VideoScript, cards: PokemonCard[]) {
  const voiceAudio = await generateVoiceover(script.voiceoverText);
  const voiceoverReady = voiceAudio !== null;
  const composition = buildVideoComposition(script, cards);
  const renderId = await triggerVideoRender('PokéMarketVideo', { ...composition, voiceoverAvailable: voiceoverReady });
  return { success: true, voiceoverReady, renderTriggered: renderId !== null };
}
