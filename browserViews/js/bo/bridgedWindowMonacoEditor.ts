export interface ZEditorAPI {
	openFileDialog: () => Promise<{ filePath: string, content: string } | null>;
	saveFile: (filePath: string, content: string) => Promise<boolean>;
	autoSaveTrigger: (filePath: string, content: string) => Promise<boolean>;
	readPath: (file: File) => string | null;
	resolveMonacoLanguage: (filePath: string) => Promise<{ mimeType:string|false, langId:string } | null>;
}
