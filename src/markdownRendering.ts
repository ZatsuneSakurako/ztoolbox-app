import {marked} from "marked";
import sanitizeHtml from "sanitize-html";

export function markdownRender(markdownContent:string) {
	return sanitizeHtml(marked(markdownContent, {
		async: false,
	}), {
		allowedAttributes: false,
	});
}
