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