import _mimeDbExtensions from '../js/mime-db_extensions.json' with { type: 'json' };
const mimeDbExtensions = new Map<string, string>();
for (let [mime, value] of Object.entries(_mimeDbExtensions)) {
	for (let extension of value) {
		mimeDbExtensions.set(extension, mime);
	}
}

function getExtensionFromName(name: string): string|null {
	const slashIndex = name.lastIndexOf("/"),
		filename = slashIndex >= 0 ? name.slice(slashIndex + 1) : name,
		dotIndex = filename.lastIndexOf(".");
	if (dotIndex <= 0) return null; // no extension or hidden file like ".env"
	return filename.slice(dotIndex + 1);
}

export function getMonacoLanguage(filePath: string) {
	let mimeType:string|null = null;
	const ext = getExtensionFromName(filePath);
	if (ext) {
		mimeType = mimeDbExtensions.get(ext) ?? null;
	}

	/**
	 * Generic extraction :
	 * - remove the prefix
	 * - some vendor "x-" (e.g., 'text/x-python' -> 'python', 'text/x-sh' -> 'sh')
	 * - use file extension as a fallback
	 */
	let langId = !mimeType ? ext :
		mimeType.split('/').pop()?.toLowerCase().replace(/^x-/, '');
	if (!langId || langId === 'plain') {
		langId = 'plaintext';
	}

	if (langId === 'plaintext') {
		const PLAIN_OVERRIDES : Set<string> = new Set([
			'conf',
		]);
		if (ext && PLAIN_OVERRIDES.has(ext)) {
			langId = ext;
		}
	}

	const OVERRIDE_MAP: Record<string, string> = {
		'json5': 'json', // JSON variants all map to monaco 'json'

		'sh': 'shell',        // Note: Monaco uses 'shell', 'bash', or 'shellscript' depending on config
		'bash': 'shell',
		'shellscript': 'shell',

		'conf': 'ini',
		'cfg': 'ini',

		'njk': 'twig', // Use Twig for njk
		'stylus': 'styl', // Monaco may not support stylus out-of-box
		'toml': 'ini', // Monaco doesn't have 'toml', 'ini' is closest
		'cpp': 'c++', // Monaco uses 'cpp'
	};

	return {
		mimeType,
		langId: langId && langId in OVERRIDE_MAP ? OVERRIDE_MAP[langId] : langId,
	};
}
