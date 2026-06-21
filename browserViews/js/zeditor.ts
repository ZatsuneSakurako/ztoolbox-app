import * as monacoNamespace from 'monaco-editor';
import {ZEditorAPI} from "./bo/bridgedWindowMonacoEditor.js";

declare var monaco:typeof monacoNamespace;
const win = <typeof window & { ZEditor:ZEditorAPI }>window;

require.config({ paths: { vs: './lib/vscode/vs' } });

const loadEditor = new Promise<void>(resolve => {
	require(['vs/editor/editor.main'], resolve);
});
await loadEditor;


monaco.editor.defineTheme('zeditor-monokai', {
	base: 'vs-dark',
	inherit: true,
	rules: [
		{ token: '', foreground: 'f8f8f2', background: '272822' },
		{ token: 'comment', foreground: '75715e' },
		{ token: 'string', foreground: 'e6db74' },
		{ token: 'keyword', foreground: 'f92672' },
		{ token: 'number', foreground: 'ae81ff' },
		{ token: 'type', foreground: '66d9ef' },
		{ token: 'variable', foreground: 'f8f8f2' },
		{ token: 'operator', foreground: 'f8f8f2' }
	],
	colors: {
		'editor.background': '#272822',
		'editor.foreground': '#F8F8F2',
		'editorCursor.foreground': '#F8F8F0',
		'editor.lineHighlightBackground': '#3E3D32',
		'editorLineNumber.foreground': '#75715E',
		'editor.selectionBackground': '#49483E',
		'editor.inactiveSelectionBackground': '#49483E'
	}
});


class ZEditor extends HTMLDivElement {
	readonly #editor: monacoNamespace.editor.IStandaloneCodeEditor;

	#currentFilePath:string|null = null;
	#autoSaveTimeout: ReturnType<typeof setTimeout>|undefined = undefined;
	constructor() {
		super();

		this.#editor = monaco.editor.create(this, {
			value: '# Welcome to Z-Editor\n=> Open a file to start editing...',
			language: 'markdown',
			theme: 'zeditor-monokai', // Our custom theme below
			automaticLayout: true,
			fontSize: 16,
			minimap: { enabled: true },
			scrollBeyondLastLine: false,
			suggestOnTriggerCharacters: true,
			folding: true,
			wordWrap: 'on',
		});
		this.#init();
	}

	get editor() {
		return this.#editor;
	}
	get currentFilePath() {
		return this.#currentFilePath;
	}
	set status(newStatus:string) {
		for (let zStatus of ZEditorStatus.statusList) {
			zStatus.innerText = newStatus;
		}
	}

	#init() {
		this.#editor.onDidChangeModelContent(this.#onDidChangeModelContent.bind(this));

		// Keyboard Shortcuts
		document.addEventListener('keydown', this.#onKey.bind(this));

		// Listen for incoming data from the main Process
		win.ZEditor.onUpdateFile(this.#onUpdateFile.bind(this));

		// Drag-and-Drop Handling
		document.body.addEventListener('drop', (e) => {
			e.preventDefault();
			e.stopPropagation();

			const file = e.dataTransfer?.files[0];
			if (!file) return;
			this.#onDrop(file)
				.catch(console.error)
		});

		document.body.addEventListener('dragover', (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
	}

	#detectLanguageForExtension(path:string) {
		if (!path) return;
		const ext = path.split('.').pop()?.toLowerCase();
		if (ext === undefined) console.warn(`Unexpected extension with ${JSON.stringify(path)}`);

		const model = this.#editor.getModel();
		if (!model) throw new Error('EDITOR_NO_MODEL');

		switch (ext) {
			case 'html':
				monaco.editor.setModelLanguage(model, 'html');
				break;
			case 'json':
			case 'json5':
				monaco.editor.setModelLanguage(model, 'json');
				break;
			case 'md':
				monaco.editor.setModelLanguage(model, 'markdown');
				break;
			case 'ts':
			case 'cts':
			case 'mts':
				monaco.editor.setModelLanguage(model, 'typescript');
				break;
			case 'js':
			case 'cjs':
			case 'mjs':
				monaco.editor.setModelLanguage(model, 'javascript');
				break;
			default:
				monaco.editor.setModelLanguage(model, 'plaintext');
		}
	}

	#onDidChangeModelContent() {
		if (!this.currentFilePath) return;

		this.status = 'Unsaved changes...';

		clearTimeout(this.#autoSaveTimeout);
		this.#autoSaveTimeout = setTimeout(async () => {
			if (!this.currentFilePath) {
				console.warn('No filed selected !');
				return;
			}

			const content = this.#editor.getValue();
			const success = await win.ZEditor.autoSaveTrigger(this.currentFilePath, content);
			this.status = success ? `Saved at ${new Date().toLocaleTimeString()}` : 'Save failed!';
		}, 2000);
	}

	#onKey(e:KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
			e.preventDefault();

			win.ZEditor.openFileDialog()
				.then(filePath => {
					if (filePath) this.#currentFilePath = filePath;
				})
				.catch(console.error);
		}
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			if (this.#currentFilePath) {
				const content = this.#editor.getValue();
				win.ZEditor.saveFile(this.#currentFilePath, content)
					.then(success => {
						if (success) this.status = `Saved at ${new Date().toLocaleTimeString()}`;
					})
					.catch(console.error);
			}
		}
	}

	#onUpdateFile(path: string, content: string) {
		this.#editor.setValue(content);
		this.#currentFilePath = path;
		this.#detectLanguageForExtension(path);
		this.status = 'File opened';
	}

	async #onDrop(file:File) {
		// Read file via main process
		this.#editor.setValue(await file.text());

		const finalPath = await win.ZEditor.readPath(file);
		if (finalPath) {
			this.#currentFilePath = finalPath;
			this.#detectLanguageForExtension(finalPath);
			this.status = `Editing: ${finalPath}`;
		}
	}
}
customElements.define('z-editor', ZEditor, {
	extends: 'div',
});

class ZEditorStatus extends HTMLDivElement {
	static #statusList = new Set<ZEditorStatus>();

	constructor() {
		super();
		ZEditorStatus.#statusList.add(this);
	}

	static get statusList() {
		return ZEditorStatus.#statusList.values();
	}
}
customElements.define('z-editor-status', ZEditorStatus, {
	extends: 'div',
});
