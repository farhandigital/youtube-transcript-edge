# Debug System

The debug system captures the entire transcript fetching pipeline, saving every intermediate step to an organized directory structure. This is invaluable for troubleshooting, inspecting API responses, and understanding the data flow.

## Directory Structure

When debug mode is enabled, files are organized by video ID with ISO timestamps to handle multiple requests for the same video:

```
debug/
├── videoId1/
│   ├── 2024-04-01T14-30-45-123Z.01-player-response.json
│   ├── 2024-04-01T14-30-45-123Z.02-caption-tracks.json
│   ├── 2024-04-01T14-30-45-123Z.03-selected-track.json
│   ├── 2024-04-01T14-30-45-123Z.04-transcript.xml
│   ├── 2024-04-01T14-30-45-123Z.05-parsed-transcript.json
│   ├── 2024-04-01T14-30-45-123Z.06-metadata.json
│   ├── 2024-04-01T14-30-45-123Z.07-output.json
│   ├── 2024-04-01T14-30-45-123Z.08-output.srt
│   ├── 2024-04-01T14-30-45-123Z.09-output.vtt
│   ├── 2024-04-01T14-30-45-123Z.10-output.txt
│   ├── 2024-04-01T14-30-45-123Z.11-output-text-with-metadata.txt
│   └── 2024-04-01T14-30-45-123Z.12-output-json-with-metadata.json
├── videoId2/
│   └── ... (same structure)
```

## Usage

### CLI

Enable debug mode with the `--debug` flag:

```bash
# Use default debug directory (./debug)
bun scripts/cli.ts <video-id> --debug

# Specify a custom debug directory
bun scripts/cli.ts <video-id> --debug --debug-dir /tmp/youtube-debug

# Combine with other options
bun scripts/cli.ts dQw4w9WgXcQ --debug --format json --metadata
```

### Programmatic API

Enable debug mode by passing configuration:

```typescript
import { fetchTranscript } from './src/index';

const transcript = await fetchTranscript('dQw4w9WgXcQ', {
  debug: true,
  debugDir: './debug',
  format: 'text',
  includeMetadata: true,
});
```

Or use the `DebugWriter` class directly:

```typescript
import { DebugWriter } from './src/index';

const debugWriter = new DebugWriter('videoId', './debug');
await debugWriter.writeJson('my-data.json', { foo: 'bar' });
await debugWriter.write('my-file.txt', 'some content');

console.log(debugWriter.getVideoDir()); // ./debug/videoId
```

## Debug Files Explained

| File | Purpose |
|------|---------|
| `01-player-response.json` | Raw YouTube Innertube API player response |
| `02-caption-tracks.json` | Extracted caption tracks with language info |
| `03-selected-track.json` | Selected caption track based on language preference |
| `04-transcript.xml` | Raw XML transcript from YouTube |
| `05-parsed-transcript.json` | Parsed transcript objects with timings and text |
| `06-metadata.json` | Video metadata (title, author, description, etc.) |
| `07-output.json` | Final parsed transcript as JSON |
| `08-output.srt` | Final transcript in SRT format |
| `09-output.vtt` | Final transcript in VTT format |
| `10-output.txt` | Final transcript as plaintext |
| `11-output-text-with-metadata.txt` | Plaintext transcript with YAML metadata header |
| `12-output-json-with-metadata.json` | JSON with transcript and metadata combined |

## Timestamps

Each file includes an ISO 8601 timestamp in its name (with colons replaced by hyphens for filesystem compatibility):

```
2024-04-01T14-30-45-123Z
├─ Date: 2024-04-01
├─ Time: 14:30:45.123
└─ Timezone: UTC (Z)
```

This ensures that multiple requests for the same video don't conflict, as each gets its own timestamped file while remaining in the same video directory.

## Deprecated Directories

The following debug directories are now deprecated and should be removed:

- `pipeline-debug/` - Old test logging directory
- `error-pipeline-debug/` - Old error test logging directory

Use the new `debug/` system instead. You can safely delete these old directories.

## Performance Notes

- Debug mode adds minimal overhead (mainly file I/O)
- All intermediate API responses are saved, which can help identify API changes
- Debug files are human-readable when possible (JSON, XML, TXT formats)
