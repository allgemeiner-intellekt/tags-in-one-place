import { App, getAllTags, normalizePath } from "obsidian";

export interface TagCollectorOptions {
	/**
	 * Exact file paths (vault-relative) to exclude from scanning.
	 *
	 * Used primarily to avoid scanning the output file itself.
	 */
	excludePaths?: string[];
	/**
	 * Folder paths (vault-relative) to exclude from scanning.
	 *
	 * Any markdown file whose path starts with `<folder>/` is skipped.
	 */
	excludeFolderPaths?: string[];
	/**
	 * Batch size for chunked processing. After each batch, we yield to the event
	 * loop to keep the UI responsive in large vaults.
	 */
	batchSize?: number;
	onProgress?: (progress: TagCollectProgress) => void;
}

export interface TagCollectProgress {
	processedFiles: number;
	totalFiles: number;
}

export interface TagCollectResult {
	tags: string[];
	totalFiles: number;
	processedFiles: number;
	excludedFiles: number;
	filesWithCache: number;
}

export class TagCollector {
	constructor(private app: App) {}

	async collectAllTags(options: TagCollectorOptions = {}): Promise<TagCollectResult> {
		const files = this.app.vault.getMarkdownFiles();
		const excludePaths = new Set(
			(options.excludePaths ?? [])
				.map((path) => path.trim())
				.filter((path) => path.length > 0)
				.map((path) => normalizePath(path))
		);
		const excludeFolderPrefixes = (options.excludeFolderPaths ?? [])
			.map((path) => path.trim())
			.filter((path) => path.length > 0)
			.map((path) => path.replace(/\\/g, "/").replace(/\/+$/, ""))
			.filter((path) => path.length > 0)
			.map((path) => normalizePath(path))
			.filter((path) => path.length > 0)
			.map((path) => `${path}/`);
		const tagSet = new Set<string>();

		const totalFiles = files.length;
		const batchSize = Math.max(1, options.batchSize ?? 250);

		let excludedFiles = 0;
		let filesWithCache = 0;
		let processedFiles = 0;

		for (const file of files) {
			processedFiles++;
			if (
				excludePaths.has(file.path) ||
				(excludeFolderPrefixes.length > 0 && excludeFolderPrefixes.some((prefix) => file.path.startsWith(prefix)))
			) {
				excludedFiles++;
				continue;
			}

			const cache = this.app.metadataCache.getFileCache(file);
			if (cache) {
				filesWithCache++;
				const tags = getAllTags(cache);
				if (tags) {
					tags.forEach((tag) => tagSet.add(tag));
				}
			}

			if (processedFiles % batchSize === 0) {
				options.onProgress?.({ processedFiles, totalFiles });
				await yieldToNextFrame();
			}
		}

		options.onProgress?.({ processedFiles, totalFiles });

		return {
			tags: Array.from(tagSet).sort(),
			totalFiles,
			processedFiles,
			excludedFiles,
			filesWithCache,
		};
	}
}

function yieldToNextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
