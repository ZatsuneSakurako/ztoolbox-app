export interface IZnmApi {
	nonce(): Promise<string>
	openStreamlink(): Promise<void>
	_(key:string): Promise<string>
	getPreference(preferenceId:string): Promise<any>
	savePreference(preferenceId:string, newValue:any): Promise<boolean>
	mustacheRender(templateName:string, context:any): Promise<string>
}

export type BridgedWindow = Window & typeof globalThis & {
	znmApi: IZnmApi
};