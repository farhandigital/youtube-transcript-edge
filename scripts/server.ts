#!/usr/bin/env bun

/**
 * Local HTTP server that accepts a YouTube video ID or URL
 * and runs the transcript CLI with: --format text --metadata --copy
 *
 * Usage:
 *   bun server.ts
 *
 * Endpoints:
 *   POST /transcript        Body: { "videoId": "<id-or-url>" }
 *   GET  /transcript/:id    Path param as video ID or encoded URL
 */

const CLI_SCRIPT = 'scripts/cli.ts';
const API_KEY = process.env.SERVER_API_KEY;
const PORT = Number(process.env.PORT ?? 3456);

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
	if (!API_KEY) return true; // No key set → local-only trust model
	const header =
		req.headers.get('x-api-key') ??
		req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	return header === API_KEY;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runTranscript(
	videoId: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(
		[
			'bun',
			'run',
			CLI_SCRIPT,
			'--format',
			'text',
			'--metadata',
			'--copy',
			videoId,
		],
		{
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);

	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);

	return { stdout, stderr, exitCode };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(raw: string): string {
	// Accept full YouTube URLs or bare IDs
	try {
		const url = new URL(raw);
		return url.searchParams.get('v') ?? url.pathname.split('/').pop() ?? raw;
	} catch {
		return raw; // Already a bare ID
	}
}

function jsonError(message: string, status: number): Response {
	return Response.json({ error: message }, { status });
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = Bun.serve({
	port: PORT,
	idleTimeout: 60, // transcripts can take a moment

	routes: {
		// POST /transcript  →  { "videoId": "..." }
		'/transcript': {
			// GET /transcript?videoId=<id>  →  video ID or URL-encoded URL as query param
			GET: async (req) => {
				if (!isAuthorized(req)) return jsonError('Unauthorized', 401);

				const raw = new URL(req.url).searchParams.get('videoId');
				if (!raw) return jsonError('Missing video ID', 400);

				const videoId = extractVideoId(raw);
				console.log(`[transcript] running for: ${videoId}`);

				const { stdout, stderr, exitCode } = await runTranscript(videoId);

				if (exitCode !== 0) {
					console.error(`[transcript] CLI error (exit ${exitCode}): ${stderr}`);
					return Response.json(
						{ error: stderr.trim() || 'CLI failed' },
						{ status: 502 },
					);
				}

				return Response.json({ videoId, transcript: stdout.trim() });
			},
		},
	},

	// Fallback
	fetch(req) {
		return Response.json(
			{
				error: 'Not found',
				hint: 'GET /transcript?videoId=<id-or-url>',
			},
			{ status: 404 },
		);
	},

	error(err) {
		console.error('[server] unhandled error:', err);
		return Response.json({ error: 'Internal server error' }, { status: 500 });
	},
});

console.log(`🎬 Transcript server listening on ${server.url}`);
if (!API_KEY) {
	console.warn(
		'⚠️  No SERVER_API_KEY set — requests are unauthenticated. Set it for security.',
	);
} else {
	console.log('🔑 API key auth enabled (x-api-key header or Bearer token).');
}
