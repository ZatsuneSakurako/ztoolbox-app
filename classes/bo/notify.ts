import {NativeImage} from "electron";

export interface INotificationClose {
	response: 'close',
	byUser?: boolean
}
export interface INotificationAction {
	response: 'action'
	index: number
}
export interface INotificationClick {
	response: 'click'
}
export type NotificationResponse = INotificationClose | INotificationAction | INotificationClick;



export interface NotifyElectron_Options {
	title:string
	message:string
	icon?:string | NativeImage
	sound?:boolean
	timeoutType?: Electron.Notification['timeoutType']
}
