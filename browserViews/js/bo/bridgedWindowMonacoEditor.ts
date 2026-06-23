export type ZFile = { path: string, content: string };
export type onUpdateFileCallback = (newFile:ZFile) => void;
export interface ZEditorAPI {
	openFileDialog: () => Promise<ZFile | null>;
	saveFile: (filePath: string, content: string) => Promise<boolean>;
	autoSaveTrigger: (filePath: string, content: string) => Promise<boolean>;
	readPath: (file: File) => string | null;
	markdownRender: (markdownContent: string) => Promise<string>;
	resolveMonacoLanguage: (filePath: string) => Promise<{ mimeType:string|false, langId:string } | null>;
	onUpdateFile: (callback: onUpdateFileCallback) => void;
}
