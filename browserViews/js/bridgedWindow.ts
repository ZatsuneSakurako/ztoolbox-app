import Dict = NodeJS.Dict;

export interface IZnmApi {
	nonce(): Promise<string>
	openStreamlink(): Promise<void>
	_(key: string): Promise<string>
	getPreference(preferenceId: string): Promise<any>
	getPreferences(...preferenceIds: string[]): Promise<Dict<any>>
	savePreference(preferenceId: string, newValue: any): Promise<boolean>
	mustacheRender(templateName: string, context: any): Promise<string>
	onUpdatePreference(cb: (preferenceId: string, newValue: any) => void): void
}

export type BridgedWindow = Window & typeof globalThis & {
	znmApi: IZnmApi
};