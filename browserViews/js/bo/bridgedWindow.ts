import {VersionState} from "../../../classes/bo/versionState.js";
import {RandomJsonData} from "../../../classes/bo/settings.js";
import {NotificationResponse} from "../../../classes/bo/notify.js";
import {Dict} from "./Dict.js";
import {IJsonWebsiteData} from "./websiteData.js";
import {IChromeExtensionData, IWsMoveSourceData} from "../../../classes/bo/chromeNative.js";
import {IUpdateStatus} from "./update.js";
import {getNetworkIps} from "../../../src/getNetConnectionAddress.js";
import {MapValueType} from "./MapValueType.js";

export type PreferenceTypes = 'string' | 'boolean' | 'number' | 'date'

export interface IZnmApi {
	nonce(): Promise<string>
	openExternal(url: string): Promise<void>
	preferenceFileDialog(prefId:string): Promise<{ canceled: boolean, filePaths: string[] }|string>
	_(key: string): Promise<string>
	getWsClientDatas(): Promise<Dict<IChromeExtensionData>>
	moveWsClientUrl(data: IWsMoveSourceData, targetId: string): Promise<void>
	getUpdateStatus(): Promise<IUpdateStatus>
	doUpdate(): Promise<string[]>

	parseIni(rawContent: string): Promise<Dict<any>>

	getProcessArgv(): Promise<string[]>
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

	nunjuckRender(templateName: string, context: any): Promise<string>

	getNetworkIps(): Promise<Dict<MapValueType<ReturnType<typeof getNetworkIps>>>>

	onFocus(cb: () => void): void

	onUpdatePreference(cb: (preferenceId: string, newValue: any) => void): void
	onShowSection(cb: (sectionName:string) => void): void
	onThemeUpdate(cb: (theme:string, background_color:string) => void): void
	onWebsiteDataUpdate(cb: (data: Dict<IJsonWebsiteData>, lastUpdate:Date|string) => void): void
	onWsClientDatasUpdate(cb: (data: Dict<IChromeExtensionData>) => void): void
	refreshWebsitesData(): Promise<void>
	openLoginUrl(website:string): Promise<boolean>
}

export type BridgedWindow = Window & typeof globalThis & {
	znmApi: IZnmApi
};
