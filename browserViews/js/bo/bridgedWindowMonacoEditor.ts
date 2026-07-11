export type ZFile = { path: string, content: string } | { partialPath: string, content: string };
export type onUpdateFileCallback = (newFile:ZFile) => void;
export interface ZEditorAPI {
	openFileDialog: () => Promise<ZFile | null>;
	saveFile: (filePath: string, content: string) => Promise<boolean>;
	autoSaveTrigger: (filePath: string, content: string) => Promise<boolean>;
	readPath: (file: File) => string | null;
	markdownRender: (markdownContent: string) => Promise<string>;
	onUpdateFile: (callback: onUpdateFileCallback) => void;
}
