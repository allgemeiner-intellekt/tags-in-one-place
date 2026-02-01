import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, TagIndexSettings, TagsInOnePlaceSettingTab } from "./settings";
import type { TagCollectProgress } from "./tag-collector";
import { TagCollector } from "./tag-collector";
import { FileWriteResult, FileWriter } from "./file-writer";
import { Formatter } from "./formatter";
import { resolveTargetFilePath } from "./path-utils";

export default class TagsInOnePlacePlugin extends Plugin {
	settings: TagIndexSettings;
	private tagCollector: TagCollector;
	private fileWriter: FileWriter;
	private formatter: Formatter;
	private updateInProgress = false;

	async onload() {
		await this.loadSettings();

		this.tagCollector = new TagCollector(this.app);
		this.fileWriter = new FileWriter(this.app);
		this.formatter = new Formatter();

		this.addCommand({
			id: "update-tag-index",
			name: "Update tag index",
			callback: async () => {
				if (this.updateInProgress) {
					new Notice("Tag index update already in progress.");
					return;
				}

				this.updateInProgress = true;
				const progressNotice = new Notice("Updating tag index...", 0);
				const startedAt = performance.now();
				let lastProgressUpdate = 0;

				try {
					const result = await this.updateTagIndex({
						onProgress: ({ processedFiles, totalFiles }: TagCollectProgress) => {
							const now = performance.now();
							if (processedFiles !== totalFiles && now - lastProgressUpdate < 150) {
								return;
							}

							lastProgressUpdate = now;
							progressNotice.setMessage(`Updating tag index... ${processedFiles}/${totalFiles}`);
						},
					});

					const elapsedMs = performance.now() - startedAt;
					const elapsedSeconds = (elapsedMs / 1000).toFixed(1);
					const message = this.formatResultNoticeMessage(result.writeResult, result.tagCount, elapsedSeconds, result);

					progressNotice.setMessage(message);
					window.setTimeout(() => progressNotice.hide(), 4000);
				} catch (error) {
					const msg = error instanceof Error ? error.message : String(error);
					progressNotice.hide();
					new Notice(`Failed to update tag index: ${msg}`);
					console.error("Tag index update error:", error);
				} finally {
					this.updateInProgress = false;
				}
			},
		});

		this.addSettingTab(new TagsInOnePlaceSettingTab(this.app, this));
	}

	private formatResultNoticeMessage(
		writeResult: FileWriteResult,
		tagCount: number,
		elapsedSeconds: string,
		collectionStats: { totalFiles: number; excludedFiles: number; filesWithCache: number }
	): string {
		const scannedFiles = collectionStats.totalFiles - collectionStats.excludedFiles;
		const missingCache = Math.max(0, scannedFiles - collectionStats.filesWithCache);
		const missingRatio = scannedFiles > 0 ? missingCache / scannedFiles : 0;
		const suggestRetry = missingCache >= 50 || missingRatio >= 0.1;
		const cacheNote =
			missingCache > 0
				? ` (cache missing for ${missingCache} files${suggestRetry ? "; try running again in a moment" : ""})`
				: "";

		if (writeResult === "skipped") {
			return `Tag index is already up to date (${tagCount} tags, ${elapsedSeconds}s)${cacheNote}.`;
		}

		if (writeResult === "created") {
			return `Tag index created (${tagCount} tags, ${elapsedSeconds}s)${cacheNote}.`;
		}

		return `Tag index updated (${tagCount} tags, ${elapsedSeconds}s)${cacheNote}.`;
	}

	async updateTagIndex(options: { onProgress?: (progress: TagCollectProgress) => void } = {}): Promise<{
		tagCount: number;
		writeResult: FileWriteResult;
		totalFiles: number;
		excludedFiles: number;
		filesWithCache: number;
	}> {
		const targetPath = this.getTargetPath();
		const collection = await this.tagCollector.collectAllTags({
			excludePaths: [targetPath],
			onProgress: options.onProgress,
		});

		const content = this.formatter.formatTagIndex(collection.tags);
		const writeResult = await this.fileWriter.writeToFile(targetPath, content);
		return {
			tagCount: collection.tags.length,
			writeResult,
			totalFiles: collection.totalFiles,
			excludedFiles: collection.excludedFiles,
			filesWithCache: collection.filesWithCache,
		};
	}

	private getTargetPath(): string {
		const resolved = resolveTargetFilePath(this.settings.targetFilePath, DEFAULT_SETTINGS.targetFilePath);
		if (!resolved.ok) {
			throw new Error(resolved.error);
		}
		return resolved.path;
	}

	async loadSettings(): Promise<void> {
		const data: unknown = await this.loadData();
		const targetFilePath = (() => {
			if (!data || typeof data !== "object") {
				return DEFAULT_SETTINGS.targetFilePath;
			}

			const record = data as Record<string, unknown>;
			const value = record.targetFilePath;
			return typeof value === "string" ? value : DEFAULT_SETTINGS.targetFilePath;
		})();

		this.settings = {
			...DEFAULT_SETTINGS,
			targetFilePath,
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
