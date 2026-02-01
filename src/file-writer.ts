import { App, TFile, TFolder } from "obsidian";

export type FileWriteResult = "created" | "modified" | "skipped";

export class FileWriter {
	constructor(private app: App) {}

	private async ensureFolderTree(folderPath: string): Promise<void> {
		const parts = folderPath.split("/").filter((part) => part.length > 0);
		let current = "";

		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			const existing = this.app.vault.getAbstractFileByPath(current);

			if (!existing) {
				await this.app.vault.createFolder(current);
				continue;
			}

			if (!(existing instanceof TFolder)) {
				throw new Error(`Cannot create folder "${current}" because a file exists at that path.`);
			}
		}
	}

	async writeToFile(path: string, content: string): Promise<FileWriteResult> {
		let file = this.app.vault.getAbstractFileByPath(path);

		if (!file) {
			// Ensure parent folders exist
			const folderPath = path.substring(0, path.lastIndexOf("/"));
			if (folderPath) {
				await this.ensureFolderTree(folderPath);
			}
			await this.app.vault.create(path, content);
			return "created";
		}

		if (file instanceof TFolder) {
			throw new Error("Target path is a folder, not a file");
		}

		if (file instanceof TFile) {
			const existing = await this.app.vault.cachedRead(file);
			if (normalizeForComparison(existing) === normalizeForComparison(content)) {
				return "skipped";
			}
			await this.app.vault.modify(file, content);
			return "modified";
		}

		throw new Error("Target path is not a file");
	}
}

function normalizeForComparison(content: string): string {
	// The generated index includes a timestamp line that changes on every run.
	// Treat it as volatile so we can skip unnecessary writes when tags haven't changed.
	return content.replace(/^Last updated:.*$/m, "Last updated:");
}
