import { App, getAllTags } from "obsidian";

export class TagCollector {
	constructor(private app: App) {}

	collectAllTags(): string[] {
		const files = this.app.vault.getMarkdownFiles();
		const tagSet = new Set<string>();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache) {
				const tags = getAllTags(cache);
				if (tags) {
					tags.forEach((tag) => tagSet.add(tag));
				}
			}
		}

		return Array.from(tagSet).sort();
	}
}
