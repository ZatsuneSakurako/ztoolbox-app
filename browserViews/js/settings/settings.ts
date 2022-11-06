import {SettingsConfig} from "../../../classes/bo/settings";

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
		"group": "theme"
	},
	"background_color": {
		"type": "color",
		"value": "#000000",
		"group": "theme"
	},

	"storageDir": {
		"type": "path",
		"value": "",
		"opts": {
			"asText": true,
			"asFile": true
		}
	},
	"autostart": {
		"type": "bool",
		"value": false
	},
	"hourlyNotification": {
		"type": "bool",
		"value": false
	},
	"clipboardWatch": {
		"type": "bool",
		"value": false
	}
};

export default settings;