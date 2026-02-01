import { App, PluginSettingTab, Setting } from "obsidian";
import type TagsInOnePlacePlugin from "./main";
import { resolveTargetFilePath } from "./path-utils";

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

		const targetSetting = new Setting(containerEl)
			.setName("Target file path")
			.setDesc("Vault-relative output file path (e.g., Tags or Index/Tags). If you omit an extension, .md is appended.");

		const statusEl = document.createElement("div");
		targetSetting.descEl.appendChild(statusEl);

		function updateTargetStatus(rawValue: string): void {
			const resolved = resolveTargetFilePath(rawValue, DEFAULT_SETTINGS.targetFilePath);
			if (resolved.ok) {
				statusEl.textContent = `Resolved path: ${resolved.path}`;
			} else {
				statusEl.textContent = `Invalid path: ${resolved.error}`;
			}
		}

		targetSetting.addText((text) =>
			text
				.setPlaceholder("Tags")
				.setValue(this.plugin.settings.targetFilePath)
				.onChange((value) => {
					this.plugin.settings.targetFilePath = value;
					updateTargetStatus(value);
					this.scheduleSave();
				})
		);

		updateTargetStatus(this.plugin.settings.targetFilePath);
	}
}
