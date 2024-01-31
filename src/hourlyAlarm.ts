import {ZAlarm} from "../classes/ZAlarm.js";
import i18next from "i18next";
import {sendNotification} from "../classes/notify.js";
import {settings} from "../main.js";

const zAlarm = ZAlarm.start('0 * * * *', function (date:Date) {
	console.info(date.toLocaleString('fr'));

	if (settings.getBoolean('hourlyNotification', true)) {
		const language = i18next.t('language'),
			msg = i18next.t('timeIsNow', {
				// currentTime: new Date(date).toLocaleTimeString()
				currentTime: new Intl.DateTimeFormat(language, { timeStyle: 'short' }).format(new Date(date))
			})
		;

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
