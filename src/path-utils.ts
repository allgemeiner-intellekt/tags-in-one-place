import { normalizePath } from "obsidian";

export type TargetPathResolution =
	| { ok: true; path: string; didAppendMd: boolean }
	| { ok: false; error: string };

/**
 * Resolve the user-configured target file path into a normalized, vault-relative
 * markdown file path.
 *
 * Rules:
 * - Empty input falls back to `fallbackValue`.
 * - Backslashes are treated as path separators and converted to `/`.
 * - The result must be vault-relative (no absolute paths / drive letters).
 * - `..` segments are rejected.
 * - If no file extension is provided, `.md` is appended automatically.
 * - If an extension is provided, it must be `.md`.
 */
export function resolveTargetFilePath(rawValue: unknown, fallbackValue: string): TargetPathResolution {
	const configured = typeof rawValue === "string" ? rawValue.trim() : "";
	const fallback = typeof fallbackValue === "string" ? fallbackValue.trim() : "";
	const initial = configured.length > 0 ? configured : fallback;

	if (initial.length === 0) {
		return { ok: false, error: "Target file path is empty." };
	}

	const replacedSlashes = initial.replace(/\\/g, "/");

	// Reject absolute paths / URLs (Obsidian vault paths are always relative).
	if (replacedSlashes.startsWith("/")) {
		return { ok: false, error: "Target file path must be a vault-relative path (not an absolute path)." };
	}
	if (/^[A-Za-z]:[\\/]/.test(initial) || /^[A-Za-z]:\//.test(replacedSlashes)) {
		return { ok: false, error: "Target file path must be a vault-relative path (Windows drive paths are not supported)." };
	}
	if (replacedSlashes.includes("://")) {
		return { ok: false, error: "Target file path must be a vault-relative path." };
	}

	// Reject paths that look like folders.
	if (replacedSlashes.endsWith("/")) {
		return { ok: false, error: "Target file path must be a file path (remove the trailing '/')." };
	}

	// Reject `..` early, before normalizePath potentially alters the shape of the path.
	const rawSegments = replacedSlashes.split("/").filter((segment) => segment.length > 0);
	if (rawSegments.some((segment) => segment === "..")) {
		return { ok: false, error: "Target file path cannot contain '..'." };
	}

	const normalized = normalizePath(replacedSlashes);
	const segments = normalized.split("/").filter((segment) => segment.length > 0);
	const basename = segments.length > 0 ? segments[segments.length - 1] : normalized;

	if (!basename || basename.trim().length === 0) {
		return { ok: false, error: "Target file path is invalid." };
	}

	const lastDot = basename.lastIndexOf(".");
	if (lastDot <= 0) {
		return { ok: true, path: `${normalized}.md`, didAppendMd: true };
	}

	const ext = basename.slice(lastDot).toLowerCase();
	if (ext !== ".md") {
		return { ok: false, error: "Target file path must end with .md (or omit the extension to auto-append it)." };
	}

	return { ok: true, path: normalized, didAppendMd: false };
}

