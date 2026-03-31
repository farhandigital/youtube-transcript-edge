import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface DebugConfig {
	enabled: boolean;
	baseDir: string;
}

/**
 * Manages debug file writes in an organized directory structure.
 * Structure: baseDir/videoId/YYYY-MM-DDTHH-mm-ss-SSSZ.<filename>
 */
export class DebugWriter {
	private baseDir: string;
	private videoId: string;
	private timestamp: string;
	private videoDir: string;

	constructor(videoId: string, baseDir: string = 'debug') {
		this.videoId = videoId;
		this.baseDir = baseDir;
		this.timestamp = new Date()
			.toISOString()
			.replace(/:/g, '-')
			.replace('.', '-');
		this.videoDir = path.join(this.baseDir, this.videoId);
	}

	/**
	 * Ensure the video directory exists
	 */
	private async ensureDir(): Promise<void> {
		await mkdir(this.videoDir, { recursive: true });
	}

	/**
	 * Get the full file path for a debug file
	 */
	private getFilePath(filename: string): string {
		// Extract extension
		const ext = path.extname(filename);
		const nameWithoutExt = path.basename(filename, ext);
		return path.join(
			this.videoDir,
			`${this.timestamp}.${nameWithoutExt}${ext}`,
		);
	}

	/**
	 * Write a debug file
	 */
	async write(filename: string, content: string | Buffer): Promise<string> {
		await this.ensureDir();
		const filePath = this.getFilePath(filename);
		await writeFile(filePath, content, 'utf-8');
		return filePath;
	}

	/**
	 * Write JSON debug file
	 */
	async writeJson(filename: string, data: unknown): Promise<string> {
		const jsonStr = JSON.stringify(data, null, 2);
		return this.write(filename, jsonStr);
	}

	/**
	 * Get the video directory path
	 */
	getVideoDir(): string {
		return this.videoDir;
	}

	/**
	 * Get the base debug directory
	 */
	getBaseDir(): string {
		return this.baseDir;
	}
}
/**
 * Debug handler that either writes files or does nothing based on enabled state.
 * This eliminates the need for `if (debugWriter)` checks throughout the code.
 */
export class DebugHandler {
	private writer: DebugWriter | null;

	constructor(videoId: string, baseDir?: string, enabled: boolean = false) {
		this.writer = enabled ? new DebugWriter(videoId, baseDir) : null;
	}

	/**
	 * Write a debug file if debug mode is enabled
	 */
	async write(filename: string, content: string | Buffer): Promise<void> {
		if (!this.writer) return;
		await this.writer.write(filename, content);
	}

	/**
	 * Write JSON debug file if debug mode is enabled
	 */
	async writeJson(filename: string, data: unknown): Promise<void> {
		if (!this.writer) return;
		await this.writer.writeJson(filename, data);
	}

	/**
	 * Get the video directory path (returns empty string if debug disabled)
	 */
	getVideoDir(): string {
		return this.writer?.getVideoDir() ?? '';
	}

	/**
	 * Check if debug mode is enabled
	 */
	isEnabled(): boolean {
		return this.writer !== null;
	}
}
