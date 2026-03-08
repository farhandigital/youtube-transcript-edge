import { XMLParser } from 'fast-xml-parser';
import { YoutubeTranscriptNotAvailableError } from '../errors';
import type { CaptionTrack, TranscriptResponse } from '../types';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
});

interface TranscriptTextNode {
	'#text': string | number;
	start: string;
	dur: string;
}

export function parseTranscriptXml(
	body: string,
	lang: string | undefined,
	track: CaptionTrack,
	identifier: string,
): TranscriptResponse[] {
	const parsed = parser.parse(body);
	const items = parsed?.transcript?.text;

	if (!items || items.length === 0) {
		throw new YoutubeTranscriptNotAvailableError(identifier);
	}

	return items.map((m: TranscriptTextNode) => ({
		text: String(m['#text'] ?? ''),
		duration: parseFloat(m.dur),
		offset: parseFloat(m.start),
		lang: lang ?? track.languageCode,
	}));
}
