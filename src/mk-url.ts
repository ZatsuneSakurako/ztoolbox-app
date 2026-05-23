#!/usr/bin/env node

import process from "node:process";
import fs from "node:fs";
import crypto from "node:crypto";

async function getPageTitle(url:URL): Promise<string|null> {
	const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0';

	try {
		// 1. Fetch the raw HTML
		const response = await fetch(url, {
			headers: { 'User-Agent': userAgent }
		});

		if (!response.ok) {
			// noinspection ExceptionCaughtLocallyJS
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();

		// 2. Try to find the `<title>` tag
		const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
		if (titleMatch && titleMatch[1].trim()) {
			return decodeAndSanitizeFilename(titleMatch[1]);
		}

		// 3. Fallback: Try Open Graph meta tag (common for JS sites)
		const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
		if (ogMatch && ogMatch[1]) {
			return decodeAndSanitizeFilename(ogMatch[1]);
		}

		// 4. Fallback: Try Twitter Card
		const twitterMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
		if (twitterMatch && twitterMatch[1]) {
			return decodeAndSanitizeFilename(twitterMatch[1]);
		}

		return null; // No title found
	} catch (error) {
		console.error(error);
		return null;
	}
}

function decodeHtmlEntities(text: string): string {
	const entityMap: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&#x27;': "'",
		'&apos;': "'",
	};

	return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-z]+);?/gi, (match) => {
		if (entityMap[match]) return entityMap[match];

		// Handle numeric entities
		if (match.startsWith('&#x')) {
			return String.fromCharCode(parseInt(match.slice(3, -1), 16));
		}
		if (match.startsWith('&#')) {
			return String.fromCharCode(parseInt(match.slice(2, -1), 10));
		}

		return match;
	});
}

function decodeAndSanitizeFilename(str:string): string|null {
	/**
	 * Replace invalid characters with underscores
	 * Windows: < > : " / \ | ? *
	// Also remove control characters and leading/trailing dots/spaces
	 */
	let sanitized = decodeHtmlEntities(str)
		.replace(/[<>:"/\\|?*]/g, '_')         // Replace illegal chars
		.replace(/[\x00-\x1f\x80-\x9f]/g, '_') // Remove control chars
		.trim()                                // Trim whitespace
		.replace(/^\.+|\.+$/g, '');            // Remove leading/trailing dots

	// Optional: Limit length (Windows max path is 260, but filename is usually 255)
	// We'll keep it under 200 to be safe
	if (sanitized.length > 200) {
		sanitized = sanitized.substring(0, 200);
	}

	// Ensure it's not empty after sanitization
	return sanitized || null;
}

function generateChecksum(inputUrl:string): string {
	const hash = crypto.createHash('md5').update(inputUrl).digest('base64url');
	return `url-${hash}`;
}

for (const url of process.argv.slice(2)) {
	const _url = new URL(url),
		title = await getPageTitle(_url),
		outputTitle = `${title ?? generateChecksum(url)}.url`;
	fs.writeFileSync(`${process.cwd()}/${outputTitle}`, `[InternetShortcut]
URL=${url}`, 'utf8');
	console.log(`${url} -> ${outputTitle}`);
}
