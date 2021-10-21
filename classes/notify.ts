import notifier, {NotificationMetadata, NotificationCallback} from "node-notifier";
import NotifySend from "node-notifier/notifiers/notifysend";
import WindowsToaster from "node-notifier/notifiers/toaster";
import NotificationCenter from "node-notifier/notifiers/notificationcenter";



let appIcon:string;
function notify(options:{id?: number, title:string, message:string, icon?:string, remove?:number, sound?:boolean}):Promise<{ response:string, metadata?: NotificationMetadata }> {
	return new Promise((resolve, reject) => {
		if (options === null || typeof options !== 'object') {
			reject('WrongArgument');
			return;
		}

		let opts : notifier.Notification | NotifySend.Notification | WindowsToaster.Notification | NotificationCenter.Notification = <notifier.Notification>{
			id: options.id,
			title: options.title,
			message: options.message,
			icon: appIcon,
			remove: options.remove,
			wait: true,
		};
		if (process.platform === "win32") {
			const _opts = <WindowsToaster.Notification>opts;
			_opts.sound = options.sound ?? true;
		} else if (process.platform === "linux") {
			const _opts = <NotifySend.Notification>opts;
		} else if (process.platform === 'darwin') {
			const _opts = <NotificationCenter.Notification>opts;
			_opts.sound = options.sound ?? true;
		}

		notifier.notify(opts, <NotificationCallback>function (error:Error | null, response:string, metadata?: NotificationMetadata) {
			if (!!error) {
				reject(error);
			} else if (!(typeof response === 'string' && response.indexOf('clicked'))) {
				resolve({
					response,
					metadata
				});
			}
		});
	})
}



export default function(appIconPath:string) {
	appIcon = appIconPath;
	return {
		notify
	}
};
