import {RandomJsonData, SettingsConfig} from "./settings";
import {IJsonWebsiteData} from "../../browserViews/js/bo/websiteData";
import Dict = NodeJS.Dict;

export type SocketMessage<T> = {error: false} & {result: T} | {error: true|string};
export type ResponseCallback<T> = (response:SocketMessage<T>) => void;

export type preferenceData = { id: string, value: undefined|RandomJsonData };

export interface ServerToClientEvents {
	'ws open'(data: SocketMessage<{ connected: string }>): void
	log(...data: any[]): void
	ping(cb: ResponseCallback<'pong'>): void
	getWebsitesData(cb: ResponseCallback<Dict<IJsonWebsiteData>>): void
	onSettingUpdate(preference: {
		id: preferenceData['id'],
		oldValue: preferenceData['value'],
		newValue: preferenceData['value']
	}): void
	sendNotification<T>(opts: ISendNotificationOptions, cb: ResponseCallback<T>): void
	openUrl(url:string, cb: ResponseCallback<boolean>): void
}

export interface ClientToServerEvents {
	getPreference(id: string, cb: ResponseCallback<preferenceData>): void
	getPreferences(ids: string[], cb: ResponseCallback<preferenceData[]>): void
	getDefaultValues(cb: ResponseCallback<SettingsConfig>): void
	ping(cb: ResponseCallback<'pong'>): void
	openUrl(browserName:string, url: string, cb: ResponseCallback<boolean>): void
	getWsClientNames(cb: ResponseCallback<IChromeExtensionName[]>): void
	showSection(sectionName: string, cb: ResponseCallback<'success'>): void
	updateSocketData(data: Partial<IChromeExtensionName>): void
	getWebsitesData(cb: ResponseCallback<Dict<IJsonWebsiteData>>): void
}
export interface InterServerEvents {}

export interface SocketData extends Partial<IChromeExtensionName> {
}

export interface IChromeExtensionName {
	browserName: string
	userAgent: string
	extensionId: string
	notificationSupport?: boolean
	sendingWebsitesDataSupport?: boolean
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
}
