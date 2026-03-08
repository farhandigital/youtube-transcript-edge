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
		const protocol = this.config?.disableHttps ? 'http' : 'https';

		// Cache lookup
		const cache = this.config?.cache;
		const cacheTTL = this.config?.cacheTTL;
		const cacheKey = `yt:transcript:${identifier}:${lang ?? ''}`;
		if (cache) {
			const cached = await cache.get(cacheKey);
			if (cached) {
				try {
					return JSON.parse(cached) as TranscriptResponse[];
				} catch {
					// ignore parse errors and continue
				}
			}
		}

		const apiKey = await fetchApiKey(identifier, protocol, this.config);
		const playerJson = await fetchPlayerResponse(
			identifier,
			apiKey,
			protocol,
			this.config,
		);
		const tracks = extractCaptionTracks(playerJson, identifier);
		const track = selectTrack(tracks, lang, identifier);
		const transcriptUrl = buildTranscriptUrl(
			track,
			identifier,
			this.config?.disableHttps ?? false,
		);
		const xml = await fetchTranscriptXml(
			transcriptUrl,
			identifier,
			this.config,
		);
		const transcript = parseTranscriptXml(xml, lang, track, identifier);

		// Cache store
		if (cache) {
			try {
				await cache.set(cacheKey, JSON.stringify(transcript), cacheTTL);
			} catch {
				// non-fatal
			}
		}

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

export { InMemoryCache } from './cache';
export * from './errors';
export type {
	CacheStrategy,
	FetchParams,
	TranscriptConfig,
	TranscriptResponse,
} from './types';

// Export the static method directly for convenience
export const fetchTranscript = YoutubeTranscript.fetchTranscript;
