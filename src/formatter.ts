export class Formatter {
	formatTagIndex(tags: string[]): string {
		const now = new Date();
		const timestamp = now.toLocaleString("en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});

		const lines: string[] = [
			"# Tag Index",
			"",
			`Last updated: ${timestamp}`,
			"",
			`## All Tags (${tags.length})`,
			"",
		];

		if (tags.length === 0) {
			lines.push("*No tags found.*");
		} else {
			for (const tag of tags) {
				lines.push(`- ${tag}`);
			}
		}

		lines.push("");
		return lines.join("\n");
	}
}
