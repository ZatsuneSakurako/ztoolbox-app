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
	onSettingUpdate(preference: {
		id: preferenceData['id'],
		oldValue: preferenceData['value'],
		newValue: preferenceData['value']
	}): void
}

export interface ClientToServerEvents {
	getPreference(id: string, cb: ResponseCallback<preferenceData>): void
	getPreferences(ids: string[], cb: ResponseCallback<preferenceData[]>): void
	getDefaultValues(cb: ResponseCallback<SettingsConfig>): void
	ping(cb: ResponseCallback<'pong'>): void
	showSection(sectionName: string, cb: ResponseCallback<'success'>): void
	extensionName(extensionName: IChromeExtensionName): void
	getWebsitesData(cb: ResponseCallback<Dict<IJsonWebsiteData>>): void
	sendWebsitesData(websiteData: Dict<IJsonWebsiteData>): void
}
export interface InterServerEvents {}

export interface SocketData extends Partial<IChromeExtensionName> {
}

export interface IChromeExtensionName {
	userAgent: string,
	extensionId: string
}
