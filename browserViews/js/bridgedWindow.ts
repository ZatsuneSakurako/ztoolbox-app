import Dict = NodeJS.Dict;
import {VersionState} from "../../classes/bo/versionState";
import {IPathConfigFilter, RandomJsonData} from "../../classes/bo/settings";
import {NotificationResponse} from "../../classes/bo/notify";
import {IData} from "./bo/IData";

export type PreferenceTypes = 'string' | 'boolean' | 'number' | 'date'

export interface IZnmApi {
	nonce(): Promise<string>
	openStreamlink(url?: string): Promise<void>
	digCmd(domain: string): Promise<string>
	preferenceFileDialog(prefId:string): Promise<{ canceled: boolean, filePaths: string[] }|string>
	_(key: string): Promise<string>
	getWsClientNames(): Promise<string[]>

	getVersionState(): Promise<VersionState|null>

	getPreference(preferenceId: string): Promise<RandomJsonData|undefined>
	getPreference(preferenceId: string, type?:'string'): Promise<string|undefined>
	getPreference(preferenceId: string, type?:'boolean'): Promise<boolean|undefined>
	getPreference(preferenceId: string, type?:'number'): Promise<number|undefined>
	getPreference(preferenceId: string, type?:'date'): Promise<Date|undefined>
	getPreference(preferenceId: string, type?:PreferenceTypes): Promise<RandomJsonData|undefined>
	getPreferences(...preferenceIds: string[]): Promise<Dict<RandomJsonData|undefined>>
	savePreference(preferenceId: string, newValue: RandomJsonData): Promise<boolean>

	sendNotification(message: string, title?: string, sound?: boolean): Promise<NotificationResponse>

	mustacheRender(templateName: string, context: any): Promise<string>
	onUpdatePreference(cb: (preferenceId: string, newValue: any) => void): void
	onShowSection(cb: (sectionName:string) => void): void
	onThemeUpdate(cb: (theme:string, background_color:string) => void): void
}

export type BridgedWindow = Window & typeof globalThis & {
	znmApi: IZnmApi,
	data: IData
};