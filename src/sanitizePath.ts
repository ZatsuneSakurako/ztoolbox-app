import path from "node:path";
import fs from "node:fs";

export function sanitizePath(inputUserPath: string, rootDir: string): string {
	// 1. Normalize the root directory to an absolute, resolved path
	const resolvedRoot = path.resolve(rootDir);


	inputUserPath = inputUserPath.replace(/^[/\\]+/, '');
	if (!inputUserPath) {
		throw new Error("Invalid path: Empty string provided");
	}

	// path.resolve() handles:
	// - Relative paths (../, ./)
	// - Normalizing slashes
	// - Resolving symlinks (if on the system)
	const fullPath = path.resolve(resolvedRoot, inputUserPath);

	if (!fs.existsSync(fullPath)) {
		throw new Error(`FILE_NOT_FOUND ${inputUserPath} => ${JSON.stringify(fullPath)}`);
	}

	// 3. Verify the final path starts with the resolved root.
	// We append a separator to prevent matching partial directory names
	// (e.g., preventing "/safe" from matching when the root is "/safely").
	if (!fullPath.startsWith(resolvedRoot + path.sep)) {
		throw new Error(`Path traversal attempt detected: "${inputUserPath}" resolves to outside root "${resolvedRoot}"`);
	}

	return fullPath;
}
