import {ZAlarm} from "../classes/ZAlarm.js";
import {sendNotification} from "../classes/notify.js";
import {settings} from "../classes/Settings.js";

const zAlarm = ZAlarm.start('0 * * * *', function (date:Date) {
	console.info(date.toLocaleString('fr'));

	if (settings.getBoolean('hourlyNotification', true)) {
		const msg = `It is now ${new Intl.DateTimeFormat("fr", { timeStyle: 'short' }).format(new Date(date))}`;

		sendNotification({
			title: 'Z-Toolbox - Hourly alarm',
			message: msg,
			sound: false
		})
			.catch(console.error)
		;
	}
});

export default zAlarm;
