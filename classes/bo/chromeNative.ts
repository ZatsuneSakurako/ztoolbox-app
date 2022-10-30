import {RandomJsonData, SettingsConfig} from "./settings";

export type SocketMessage<T> = {error: false} & {result: T} | {error: true|string};
export type ResponseCallback<T> = (response:SocketMessage<T>) => void;

export interface ServerToClientEvents {
	'ws open': (data: SocketMessage<{ connected: string }>) => void;
	log: (...data: any[]) => void;
}

export interface ClientToServerEvents {
	getPreference: (id: string, cb: ResponseCallback<{ id: string, value: undefined|RandomJsonData }>) => void;
	getPreferences: (ids: string[], cb: ResponseCallback<{ id: string, value: undefined|RandomJsonData }[]>) => void;
	getDefaultValues: (cb: ResponseCallback<SettingsConfig>) => void;
	ping: (cb: ResponseCallback<'pong'>) => void;
	showSection: (sectionName: string, cb: ResponseCallback<'success'>) => void;
	log: (...data: any[]) => void;
	extensionName: (extensionName: IChromeExtensionName) => void;
}
export interface InterServerEvents {}

export interface SocketData extends Partial<IChromeExtensionName> {
}

export interface IChromeExtensionName {
	userAgent: string,
	extensionId: string
}
