export type onUpdateFileCallback = (path: string, content: string) => void;

export interface ZEditorAPI {
	openFileDialog: () => Promise<string | null>;
	saveFile: (filePath: string, content: string) => Promise<boolean>;
	autoSaveTrigger: (filePath: string, content: string) => Promise<boolean>;
	readPath: (file: File) => Promise<string | null>;
	onUpdateFile: (callback: onUpdateFileCallback) => void;
}
