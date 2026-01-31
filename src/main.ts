import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, TagIndexSettings, TagsInOnePlaceSettingTab } from "./settings";
import { TagCollector } from "./tag-collector";
import { FileWriter } from "./file-writer";
import { Formatter } from "./formatter";

export default class TagsInOnePlacePlugin extends Plugin {
	settings: TagIndexSettings;
	private tagCollector: TagCollector;
	private fileWriter: FileWriter;
	private formatter: Formatter;

	async onload() {
		await this.loadSettings();

		this.tagCollector = new TagCollector(this.app);
		this.fileWriter = new FileWriter(this.app);
		this.formatter = new Formatter();

		this.addCommand({
			id: "update-tag-index",
			name: "Update tag index",
			callback: async () => {
				try {
					await this.updateTagIndex();
					new Notice("Tag index updated successfully!");
				} catch (error) {
					const msg = error instanceof Error ? error.message : String(error);
					new Notice(`Failed to update tag index: ${msg}`);
					console.error("Tag index update error:", error);
				}
			},
		});

		this.addSettingTab(new TagsInOnePlaceSettingTab(this.app, this));
	}

	async updateTagIndex(): Promise<void> {
		const targetPath = this.settings.targetFilePath || DEFAULT_SETTINGS.targetFilePath;
		const tags = this.tagCollector.collectAllTags();
		const content = this.formatter.formatTagIndex(tags);
		await this.fileWriter.writeToFile(targetPath, content);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TagIndexSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
