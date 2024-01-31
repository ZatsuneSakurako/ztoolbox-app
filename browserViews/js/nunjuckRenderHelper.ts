import {BridgedWindow} from "./bo/bridgedWindow.js";

declare var window : BridgedWindow;

interface IRenderOutputTypes {
	'string': string
	'document': Document
	'head': HTMLHeadElement
	'body': HTMLElement
	'bodyElements': HTMLCollection
}
export async function nunjuckRender<T, K extends keyof IRenderOutputTypes>(templateName: string, data: T, output:K): Promise<IRenderOutputTypes[K]>
export async function nunjuckRender<T>(templateName: string, data: T): Promise<IRenderOutputTypes['bodyElements']>
export async function nunjuckRender<T>(templateName: string, data: T, output:keyof IRenderOutputTypes='bodyElements'): Promise<IRenderOutputTypes[keyof IRenderOutputTypes]> {
	const string = await window.znmApi.nunjuckRender(templateName, data);
	if (output === 'string') return string;

	const parser = new DOMParser(),
		doc = parser.parseFromString(string, 'text/html')
	;
	switch (output) {
		case 'document':
			return doc;
		case "bodyElements":
			return doc.body.children;
		case "head":
			return doc.head;
		case "body":
			return doc.body;
		default:
			throw new Error('UNKNOWN_OUTPUT_TYPE');
	}
}
