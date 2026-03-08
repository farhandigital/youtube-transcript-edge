import { RE_XML_TRANSCRIPT } from '../constants';
import { YoutubeTranscriptNotAvailableError } from '../errors';
import type { CaptionTrack, TranscriptResponse } from '../types';
import { decodeXmlEntities } from '../utils';

export function parseTranscriptXml(
	body: string,
	lang: string | undefined,
	track: CaptionTrack,
	identifier: string,
): TranscriptResponse[] {
	const results = [...body.matchAll(RE_XML_TRANSCRIPT)];

	const transcript: TranscriptResponse[] = results.map((m) => ({
		text: decodeXmlEntities(m[3]),
		duration: parseFloat(m[2]),
		offset: parseFloat(m[1]),
		lang: lang ?? track.languageCode,
	}));

	if (transcript.length === 0) {
		throw new YoutubeTranscriptNotAvailableError(identifier);
	}

	return transcript;
}
