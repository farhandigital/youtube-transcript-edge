import { YoutubeTranscript } from '../src/index';

const video_id_or_url = 'https://www.youtube.com/watch?v=RTTCbb_2G4s';
const transcript = await YoutubeTranscript.fetchTranscript(video_id_or_url);
console.log(transcript);
