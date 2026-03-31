import {
	buildTranscriptUrl,
	extractCaptionTracks,
	selectTrack,
} from './lib/caption-track';
import { DebugWriter } from './lib/debug';
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
import {
	extractVideoMetadata,
	metadataObjToYaml,
	retrieveVideoId,
} from './utils';

type TranscriptResult<C extends TranscriptConfig | undefined> = C extends {
	format: 'text';
	includeMetadata: true;
}
	? string
	: C extends { includeMetadata: true }
		? TranscriptWithMetadata
		: C extends { format: 'srt' | 'vtt' | 'text' }
			? string
			: TranscriptResponse[];

export async function fetchTranscript<
	C extends TranscriptConfig | undefined = undefined,
>(videoId: string, config?: C): Promise<TranscriptResult<C>>;

export async function fetchTranscript(
	videoId: string,
	config?: TranscriptConfig,
): Promise<TranscriptResponse[] | TranscriptWithMetadata | string> {
	const identifier = retrieveVideoId(videoId);
	const lang = config?.lang;

	// Initialize debug writer if debug mode is enabled
	const debugWriter = config?.debug
		? new DebugWriter(identifier, config?.debugDir ?? './debug')
		: null;

	const apiKey = await fetchApiKey(identifier, config);
	const playerJson = await fetchPlayerResponse(identifier, apiKey, config);

	if (debugWriter) {
		await debugWriter.writeJson('01-player-response.json', playerJson);
	}

	const tracks = extractCaptionTracks(playerJson, identifier);

	if (debugWriter) {
		await debugWriter.writeJson('02-caption-tracks.json', {
			count: tracks.length,
			tracks,
		});
	}

	const track = selectTrack(tracks, lang, identifier);

	if (debugWriter) {
		await debugWriter.writeJson('03-selected-track.json', track);
	}

	const transcriptUrl = buildTranscriptUrl(track, identifier);
	const xml = await fetchTranscriptXml(transcriptUrl, identifier, config);

	if (debugWriter) {
		await debugWriter.write('04-transcript.xml', xml);
	}

	const transcript = parseTranscriptXml(xml, identifier);

	if (debugWriter) {
		await debugWriter.writeJson('05-parsed-transcript.json', transcript);
	}

	// Extract metadata early for debug output
	const metadata = config?.includeMetadata
		? extractVideoMetadata(playerJson, identifier)
		: undefined;

	if (debugWriter && metadata) {
		await debugWriter.writeJson('06-metadata.json', metadata);
	}

	// Generate all formats for debug output
	const jsonOutput = transcript;
	const srtOutput = jsonTranscriptToSrt(transcript);
	const vttOutput = jsonTranscriptToVtt(transcript);
	const textOutput = jsonTranscriptToPlaintext(transcript);

	if (debugWriter) {
		await debugWriter.writeJson('07-output.json', jsonOutput);
		await debugWriter.write('08-output.srt', srtOutput);
		await debugWriter.write('09-output.vtt', vttOutput);
		await debugWriter.write('10-output.txt', textOutput);

		if (metadata) {
			const yamlMetadata = metadataObjToYaml(metadata);
			await debugWriter.write(
				'11-output-text-with-metadata.txt',
				`${yamlMetadata}\n\n${textOutput}`,
			);
			await debugWriter.writeJson('12-output-json-with-metadata.json', {
				transcript: jsonOutput,
				metadata,
			});
		}

		console.error(`📁 Debug files saved to: ${debugWriter.getVideoDir()}`);
	}

	// Handle format conversion
	switch (config?.format) {
		case 'json': {
			if (config?.includeMetadata && metadata) {
				return { transcript, metadata };
			}
			return transcript;
		}
		case 'srt': {
			return srtOutput;
		}
		case 'vtt': {
			return vttOutput;
		}
		case 'text': {
			if (config?.includeMetadata && metadata) {
				const yamlMetadata = metadataObjToYaml(metadata);
				return `${yamlMetadata}\n\n${textOutput}`;
			}
			return textOutput;
		}
		default: {
			if (config?.includeMetadata && metadata) {
				return { transcript, metadata };
			}
			return transcript;
		}
	}
}

export * from './errors';
export { DebugWriter } from './lib/debug';
export type {
	PlayerInspectionDebugResult,
	PlayerInspectionResult,
} from './lib/inspector';
export {
	inspectPlayerResponse,
	inspectPlayerResponseDebug,
} from './lib/inspector';
export type {
	FetchParams,
	TranscriptConfig,
	TranscriptResponse,
	TranscriptWithMetadata,
	VideoMetadata,
} from './types';
