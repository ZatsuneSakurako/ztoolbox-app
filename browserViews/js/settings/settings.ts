import {SettingsConfig} from "../../../classes/bo/settings.js";

const settings:SettingsConfig = {
	"theme": {
		"type": "menulist",
		"value": "dark",
		"options": [
			{
				"value": "dark",
				"label": "Dark"
			},
			{
				"value": "light",
				"label": "Light"
			}
		],
		"title": "Theme",
		"group": "theme"
	},
	"background_color": {
		"type": "color",
		"value": "#000000",
		"title": "Background color",
		"group": "theme"
	},

	"storageDir": {
		"type": "path",
		"value": "",
		"opts": {
			"asText": true,
			"asFile": true
		},
		"title": "Settings storage",
	},
	"autostart": {
		"type": "bool",
		"value": false,
		"title": "Launch on login",
		"description": "Directory to use",
	},
	"hourlyNotification": {
		"type": "bool",
		"value": false,
		"title": "Hourly notification",
	},
	"testNotification": {
		"type": "button",
		"title": "Notification test",
		"description": "Send a notification (result in the console)",
	},



	"check_enabled": {
		"type": "bool",
		"value": false,
		"group": "website_data",
		"title": "Automatic deviantArt/freshRss data refresh enabled",
	},
	"check_delay": {
		"type": "integer",
		"value": 5,
		"minValue": 5,
		"maxValue": 60,
		"stepValue": 5,
		"rangeInput": true,
		"title":  "deviantArt/freshRss verification delay (minutes)",
		"group": "website_data"
	},
	"freshRss_baseUrl": {
		"type": "string",
		"value": '',
		"title": "URL of your FreshRss instance (should end with /i/)",
		"group": "website_data"
	},
	"notify_checkedData": {
		"type": "bool",
		"value": true,
		"title": "Show a notification for deviantArt/freshRss",
		"group": "website_data"
	},
};

export default settings;
