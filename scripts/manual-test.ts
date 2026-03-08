import { fetchTranscript } from '../src/index';

const video_id_or_url = 'https://www.youtube.com/watch?v=RTTCbb_2G4s';
const transcript = await fetchTranscript(video_id_or_url);
const folder = '../pipeline-debug';
Bun.write(`${folder}/transcript.json`, JSON.stringify(transcript, null, 2));
