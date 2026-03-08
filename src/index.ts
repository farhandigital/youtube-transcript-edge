import {
	buildTranscriptUrl,
	extractCaptionTracks,
	selectTrack,
} from './lib/caption-track';
import {
	jsonTranscriptToPlaintext,
	jsonTranscriptToSrt,
	jsonTranscriptToVtt,
	parseTranscriptXml,
} from './lib/transcript-parser';
import {
	fetchApiKey,
	fetchPlayerResponse,
	fetchTranscriptXml,
} from './lib/youtube-api';
import type {
	TranscriptConfig,
	TranscriptResponse,
	TranscriptWithMetadata,
} from './types';
import { extractVideoMetadata, retrieveVideoId } from './utils';

export async function fetchTranscript(
	videoId: string,
	config: TranscriptConfig & { format: 'json'; includeMetadata: true },
): Promise<TranscriptWithMetadata>;

export async function fetchTranscript(
	videoId: string,
	config: TranscriptConfig & { includeMetadata: true },
): Promise<TranscriptWithMetadata>;

export async function fetchTranscript(
	videoId: string,
	config: TranscriptConfig & { format: 'json' },
): Promise<TranscriptResponse[]>;

export async function fetchTranscript(
	videoId: string,
	config: TranscriptConfig & { format: 'srt' | 'vtt' | 'text' },
): Promise<string>;

export async function fetchTranscript(
	videoId: string,
	config?: TranscriptConfig,
): Promise<TranscriptResponse[]>;

export async function fetchTranscript(
	videoId: string,
	config?: TranscriptConfig,
): Promise<TranscriptResponse[] | TranscriptWithMetadata | string> {
	const identifier = retrieveVideoId(videoId);
	const lang = config?.lang;

	const apiKey = await fetchApiKey(identifier, config);
	const playerJson = await fetchPlayerResponse(identifier, apiKey, config);
	const tracks = extractCaptionTracks(playerJson, identifier);
	const track = selectTrack(tracks, lang, identifier);
	const transcriptUrl = buildTranscriptUrl(track, identifier);
	const xml = await fetchTranscriptXml(transcriptUrl, identifier, config);
	const transcript = parseTranscriptXml(xml, identifier);

	// Extract metadata if requested
	const metadata = config?.includeMetadata
		? extractVideoMetadata(playerJson, identifier)
		: null;

	// Handle format conversion
	switch (config?.format) {
		case 'json': {
			return config?.includeMetadata
				? { transcript, metadata: metadata! }
				: transcript;
		}
		case 'srt': {
			return jsonTranscriptToSrt(transcript);
		}
		case 'vtt': {
			return jsonTranscriptToVtt(transcript);
		}
		case 'text': {
			return jsonTranscriptToPlaintext(transcript);
		}
		default: {
			return config?.includeMetadata
				? { transcript, metadata: metadata! }
				: transcript;
		}
	}
}

export * from './errors';
export type {
	FetchParams,
	TranscriptConfig,
	TranscriptResponse,
	TranscriptWithMetadata,
	VideoMetadata,
} from './types';
