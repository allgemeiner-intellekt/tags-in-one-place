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

	constructor(app: App, plugin: TagsInOnePlacePlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
					.onChange(async (value) => {
						this.plugin.settings.targetFilePath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
