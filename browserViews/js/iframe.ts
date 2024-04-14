import {FlemInstance, IEditorData, IFlemOptions} from "./bo/iframe.js";

let flemInstance : FlemInstance|null = null;
async function init(data: IEditorData) {
	console.info('init');
	let opts : IFlemOptions = {
		theme: 'material',
		shareButton: false,

		files: data.files,
        selected: data.files.find(file => {
			return file.name.endsWith('.js')
        })?.name,
		links: data.libs
			.map(lib => {
				return {
				name: lib,
				type: 'script',
				url: 'https://unpkg.com/' + lib
				}
			})
	};
	flemInstance = Flems(document.body, opts);

	flemInstance.onchange(function (instance) {
		window.parent.postMessage({
			type: 'export-data',
			files: instance.files
				.map(file => {
					const clonedFileData = {
						...file
					};
					delete clonedFileData.doc;
					return clonedFileData;
				}),
			links: instance.links.map(link => link.name)
		}, '*');
	})
}

window.addEventListener('message', function (e) {
	if (!['http://localhost:42080', 'file://'].includes(e.origin)) {
		throw new Error(`WRONG_ORIGIN "${e.origin}"`);
	}
	if (!e.data && typeof e.data !== 'object') {
		console.error('UnexpectedData', e);
		return;
	}

	switch (e.data.type) {
		case 'loadData':
			init(e.data.editors)
				.catch(console.error)
			;
			break;
		default:
			console.warn('Unknown data type', e);
	}
}, {
	passive: true
});

console.info('iframe init !');
window.parent.postMessage({
	type: 'iframe-init',
}, '*');

declare var Flems : (target:HTMLElement, opts: IFlemOptions) => FlemInstance;
