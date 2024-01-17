import {Notification} from "electron";
import {RandomJsonData, SettingsConfig} from "./settings";
import {Dict} from "../../browserViews/js/bo/Dict";

export type SocketMessage<T> = {error: false} & {result: T} | {error: true|string};
export type ResponseCallback<T> = (response:SocketMessage<T>) => void;

export type preferenceData = { id: string, value: undefined|RandomJsonData };

export interface ServerToClientEvents {
	'ws open'(data: SocketMessage<{ connected: string }>): void
	log(...data: any[]): void
	ping(cb: ResponseCallback<'pong'>): void
	onSettingUpdate(preference: {
		id: preferenceData['id'],
		oldValue: preferenceData['value'],
		newValue: preferenceData['value']
	}): void
	sendNotification<T>(opts: ISendNotificationOptions, cb: ResponseCallback<T>): void
	clearNotifications(): void
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
	updateSocketData(data: Partial<IChromeExtensionName|IChromeExtensionData>): void
}
export interface InterServerEvents {}

export interface SocketData extends IChromeExtensionName, IChromeExtensionData {
}

export interface IChromeExtensionName {
	browserName: string
	userAgent: string
	extensionId: string
	notificationSupport?: boolean
}
export interface IChromeExtensionData extends IChromeExtensionName {
	tabData?: {
		name: string
		faviconUrl: string
		error?: string
		statusCode?: number

		url?: string
		domain?: string
		ip?: string
		ipMore: string|false
		openGraph: Dict<string>
	} | null
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
