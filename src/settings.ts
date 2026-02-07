import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import type TagsInOnePlacePlugin from "./main";
import { normalizeVaultFolderPath, resolveTargetFilePath } from "./path-utils";

export interface TagIndexSettings {
	targetFilePath: string;
	excludedFolderPaths: string[];
}

export const DEFAULT_SETTINGS: TagIndexSettings = {
	targetFilePath: "Tags.md",
	excludedFolderPaths: [],
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

		new Setting(containerEl).setName("Exclude folders").setHeading();

		const allFolderPaths = this.app.vault
			.getAllLoadedFiles()
			.filter((file): file is TFolder => file instanceof TFolder)
			.map((folder) => folder.path)
			.filter((path) => path.length > 0)
			.sort((a, b) => a.localeCompare(b));

		const excludedSet = new Set(this.plugin.settings.excludedFolderPaths);
		const excludedPrefixes = this.plugin.settings.excludedFolderPaths
			.map((path) => path.replace(/\\/g, "/").replace(/\/+$/, ""))
			.filter((path) => path.length > 0)
			.map((path) => `${path}/`);
		function isCoveredByExcludedFolder(path: string): boolean {
			// Exact match.
			if (excludedSet.has(path)) {
				return true;
			}
			// Covered by a parent folder exclusion, e.g. excluding `A` should also exclude `A/B`.
			return excludedPrefixes.some((prefix) => path.startsWith(prefix));
		}

		const availableFolderPaths = allFolderPaths.filter((path) => !isCoveredByExcludedFolder(path));
		const hasAvailableFolder = availableFolderPaths.length > 0;
		let selectedFolderPath = availableFolderPaths[0] ?? "";

		new Setting(containerEl).setDesc(
			`Excluded: ${this.plugin.settings.excludedFolderPaths.length}. Available: ${availableFolderPaths.length}. Total folders: ${allFolderPaths.length}.`
		);

		const addExcludedFolderSetting = new Setting(containerEl)
			.setName("Add excluded folder")
			.setDesc("Choose a folder to exclude from scanning.");

		addExcludedFolderSetting.addDropdown((dropdown) => {
			const placeholder =
				allFolderPaths.length === 0 ? "No folders found" : hasAvailableFolder ? "Select a folder..." : "All folders are excluded";
			dropdown.addOption("", placeholder);
			for (const path of availableFolderPaths) {
				dropdown.addOption(path, path);
			}

			dropdown.setValue(selectedFolderPath.length > 0 ? selectedFolderPath : "");
			dropdown.onChange((value) => {
				selectedFolderPath = value;
			});
		});

		addExcludedFolderSetting.addButton((button) => {
			button
				.setButtonText("Add")
				.setDisabled(!hasAvailableFolder)
				.onClick(() => {
					const normalized = normalizeVaultFolderPath(selectedFolderPath);
					if (!normalized) {
						return;
					}
					if (this.plugin.settings.excludedFolderPaths.includes(normalized)) {
						return;
					}

					this.plugin.settings.excludedFolderPaths = [...this.plugin.settings.excludedFolderPaths, normalized].sort((a, b) =>
						a.localeCompare(b)
					);
					this.scheduleSave();
					this.display();
				});
		});

		if (this.plugin.settings.excludedFolderPaths.length === 0) {
			new Setting(containerEl).setDesc("No excluded folders.");
		}

		for (const folderPath of this.plugin.settings.excludedFolderPaths) {
			const row = new Setting(containerEl).setName(folderPath);
			row.addExtraButton((button) => {
				button.setIcon("cross").setTooltip("Remove").onClick(() => {
					this.plugin.settings.excludedFolderPaths = this.plugin.settings.excludedFolderPaths.filter((p) => p !== folderPath);
					this.scheduleSave();
					this.display();
				});
			});
		}
	}
}
