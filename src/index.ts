import {
	buildTranscriptUrl,
	extractCaptionTracks,
	selectTrack,
} from './lib/caption-track';
import { parseTranscriptXml } from './lib/transcript-parser';
import {
	fetchApiKey,
	fetchPlayerResponse,
	fetchTranscriptXml,
} from './lib/youtube-api';
import type { TranscriptConfig, TranscriptResponse } from './types';
import { retrieveVideoId } from './utils';

export async function fetchTranscript(
	videoId: string,
	config?: TranscriptConfig,
): Promise<TranscriptResponse[]> {
	const identifier = retrieveVideoId(videoId);
	const lang = config?.lang;

	const apiKey = await fetchApiKey(identifier, config);
	const playerJson = await fetchPlayerResponse(identifier, apiKey, config);
	const tracks = extractCaptionTracks(playerJson, identifier);
	const track = selectTrack(tracks, lang, identifier);
	const transcriptUrl = buildTranscriptUrl(track, identifier);
	const xml = await fetchTranscriptXml(transcriptUrl, identifier, config);
	const transcript = parseTranscriptXml(xml, lang, track, identifier);

	return transcript;
}

export * from './errors';
export type {
	FetchParams,
	TranscriptConfig,
	TranscriptResponse,
} from './types';
