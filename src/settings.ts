import { App, PluginSettingTab, Setting } from "obsidian";
import type TagsInOnePlacePlugin from "./main";

export interface TagIndexSettings {
	targetFilePath: string;
}

export const DEFAULT_SETTINGS: TagIndexSettings = {
	targetFilePath: "Tags.md",
};

export class TagsInOnePlaceSettingTab extends PluginSettingTab {
	plugin: TagsInOnePlacePlugin;
	private saveTimeoutId: number | null = null;

	constructor(app: App, plugin: TagsInOnePlacePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private scheduleSave(): void {
		if (this.saveTimeoutId !== null) {
			window.clearTimeout(this.saveTimeoutId);
		}

		this.saveTimeoutId = window.setTimeout(() => {
			this.saveTimeoutId = null;
			void this.plugin.saveSettings().catch((error) => console.error("Failed to save settings:", error));
		}, 400);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Target file path")
			.setDesc("Path to the tag index file (e.g., Tags.md or Index/Tags.md)")
			.addText((text) =>
				text
					.setPlaceholder("Tags.md")
					.setValue(this.plugin.settings.targetFilePath)
					.onChange((value) => {
						this.plugin.settings.targetFilePath = value;
						this.scheduleSave();
					})
			);
	}
}
