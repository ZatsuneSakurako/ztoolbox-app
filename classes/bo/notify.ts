import {NativeImage, NotificationAction} from "electron";

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
export interface INotificationTimeout {
	response: 'timeout'
}
export type NotificationResponse = INotificationClose | INotificationAction | INotificationClick | INotificationTimeout;



export interface NotifyElectron_Options {
	title:string
	message:string
	icon?:string | NativeImage
	sound?:boolean
	timeoutType?: Electron.Notification['timeoutType']
	actions?: (Omit<NotificationAction, 'type' | 'text'> & {
		text: NonNullable<NotificationAction['text']>,
	})[]
}
