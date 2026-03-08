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

export class YoutubeTranscript {
	constructor(private config?: TranscriptConfig) {}

	async fetchTranscript(videoId: string): Promise<TranscriptResponse[]> {
		const identifier = retrieveVideoId(videoId);
		const lang = this.config?.lang;

		const apiKey = await fetchApiKey(identifier, this.config);
		const playerJson = await fetchPlayerResponse(
			identifier,
			apiKey,
			this.config,
		);
		const tracks = extractCaptionTracks(playerJson, identifier);
		const track = selectTrack(tracks, lang, identifier);
		const transcriptUrl = buildTranscriptUrl(track, identifier);
		const xml = await fetchTranscriptXml(
			transcriptUrl,
			identifier,
			this.config,
		);
		const transcript = parseTranscriptXml(xml, lang, track, identifier);

		return transcript;
	}

	static async fetchTranscript(
		videoId: string,
		config?: TranscriptConfig,
	): Promise<TranscriptResponse[]> {
		const instance = new YoutubeTranscript(config);
		return instance.fetchTranscript(videoId);
	}
}

export * from './errors';
export type {
	FetchParams,
	TranscriptConfig,
	TranscriptResponse,
} from './types';

// Export the static method directly for convenience
export const fetchTranscript = YoutubeTranscript.fetchTranscript;
