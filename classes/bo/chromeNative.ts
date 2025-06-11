import {Notification} from "electron";
import {RandomJsonData, SettingsConfig} from "./settings.js";
import {Dict} from "../../browserViews/js/bo/Dict.js";
import {IUserscriptJson} from "./userscript.js";

export type SocketMessage<T> = {error: false} & {result: T} | {error: true|string};
export type ResponseCallback<T> = (response:SocketMessage<T>) => void;

export type preferenceData = { id: string, value: undefined|RandomJsonData };

export interface ServerToClientEvents {
	'ws open'(data: SocketMessage<{ connected: string }>): void
	doRestart(): void
	log(...data: any[]): void
	ping(cb: ResponseCallback<'pong'>): void
	onSettingUpdate(preference: {
		id: preferenceData['id'],
		oldValue: preferenceData['value'],
		newValue: preferenceData['value']
	}): void
	openUrl(url:string, cb: ResponseCallback<boolean>): void
	userScriptDataUpdated(fileName:string, newData:Dict<any>):void
	closeActiveUrl(url:string): void
}

export interface ClientToServerEvents {
	getPreference(id: string, cb: ResponseCallback<preferenceData>): void
	getPreferences(ids: string[], cb: ResponseCallback<preferenceData[]>): void
	getDefaultValues(cb: ResponseCallback<SettingsConfig>): void
	ping(cb: ResponseCallback<'pong'>): void
	openUrl(browserName:string, url: string, cb: ResponseCallback<boolean>): void
	showSection(sectionName: string, cb: ResponseCallback<'success'>): void
	updateSocketData(data: Partial<IChromeExtensionData>): void
	getUserscripts(cb: ResponseCallback<IUserscriptJson[]>): void
	getUserscriptData(fileName:string, cb: ResponseCallback<Dict<any>>): void
	setUserscriptData(fileName:string, newData:Dict<any>|null, cb: ResponseCallback<boolean>): void
	writeClipboard(data: Electron.Data, cb: ResponseCallback<boolean>): void
	nunjuckRender(templateName:string, context: object, cb: ResponseCallback<string>): void
}
export interface InterServerEvents {}

export interface SocketData extends IChromeExtensionData {
}

export interface IChromeExtensionData {
	browserName: string
	userAgent: string
	extensionId: string
	tabData?: {
		name: string
		faviconUrl: string
		statusCode?: number

		url?: string
		domain?: string
		ip?: string
		ipMore: string|false
		pageRating: string[]
	} | null
}

export interface IWsMoveSourceData {
	id?: string
	tabDataUrl:string
}

export interface ISendNotificationOptions {
	title?: string
	message: string
	contextMessage?: string
	buttons?: {
		title: string;
		/**
		 * This url must be available from the browser
		 */
		iconUrl?: string | undefined;
	}[]
	/**
	 * This url must be available from the browser
	 */
	iconURL?: string
	timeoutType?: Notification['timeoutType']
}
