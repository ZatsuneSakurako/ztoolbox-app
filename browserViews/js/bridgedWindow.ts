import Dict = NodeJS.Dict;
import {VersionState} from "../../classes/bo/versionState";
import {RandomJsonData} from "../../classes/bo/settings";

export type PreferenceTypes = 'string' | 'boolean' | 'number' | 'date'

export interface IZnmApi {
	nonce(): Promise<string>
	openStreamlink(): Promise<void>
	_(key: string): Promise<string>

	getPreference(preferenceId: string): Promise<RandomJsonData|undefined>
	getPreference(preferenceId: string, type?:'string'): Promise<string|undefined>
	getPreference(preferenceId: string, type?:'boolean'): Promise<boolean|undefined>
	getPreference(preferenceId: string, type?:'number'): Promise<number|undefined>
	getPreference(preferenceId: string, type?:'date'): Promise<Date|undefined>
	getPreference(preferenceId: string, type?:PreferenceTypes): Promise<RandomJsonData|undefined>
	getPreferences(...preferenceIds: string[]): Promise<Dict<RandomJsonData|undefined>>
	savePreference(preferenceId: string, newValue: RandomJsonData): Promise<boolean>

	mustacheRender(templateName: string, context: any): Promise<string>
	onUpdatePreference(cb: (preferenceId: string, newValue: any) => void): void
	onShowSection(cb: (sectionName:string) => void): void
	onThemeUpdate(cb: (theme:string, background_color:string) => void): void
}

export type BridgedWindow = Window & typeof globalThis & {
	znmApi: IZnmApi
};