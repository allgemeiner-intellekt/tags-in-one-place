import { App, TFile, TFolder } from "obsidian";

export class FileWriter {
	constructor(private app: App) {}

	async writeToFile(path: string, content: string): Promise<void> {
		let file = this.app.vault.getAbstractFileByPath(path);

		if (!file) {
			// Ensure parent folders exist
			const folderPath = path.substring(0, path.lastIndexOf("/"));
			if (folderPath) {
				const folder = this.app.vault.getAbstractFileByPath(folderPath);
				if (!folder) {
					await this.app.vault.createFolder(folderPath);
				}
			}
			file = await this.app.vault.create(path, content);
			return;
		}

		if (file instanceof TFolder) {
			throw new Error("Target path is a folder, not a file");
		}

		if (file instanceof TFile) {
			await this.app.vault.modify(file, content);
		}
	}
}
