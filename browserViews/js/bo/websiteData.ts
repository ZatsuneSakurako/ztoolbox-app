export interface INotificationState {
	logged: boolean
	count: number
}
export interface IFolderItem {
	folderCount: number
	folderName: string
}
export interface IJsonWebsiteData {
	websiteIcon: string
	notificationState: INotificationState
	folders: [string, IFolderItem][]
	loginId?: string
	logged?: boolean
	count: number
	href?: string
}