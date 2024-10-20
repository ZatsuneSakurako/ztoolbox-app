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
	},
	"testNotification": {
		"type": "button"
	},



	"check_enabled": {
		"type": "bool",
		"value": false,
		"group": "website_data"
	},
	"check_delay": {
		"type": "integer",
		"value": 5,
		"minValue": 5,
		"maxValue": 60,
		"stepValue": 5,
		"rangeInput": true,
		"group": "website_data"
	},
	"freshRss_baseUrl": {
		"type": "string",
		"value": '',
		"group": "website_data"
	},
	"notify_checkedData": {
		"type": "bool",
		"value": true,
		"group": "website_data"
	},
	"notify_all_viewed": {
		"type": "bool",
		"value": false,
		"group": "website_data"
	},
	"tabPageServerIp_alias": {
		"type": "yaml",
		"value": {},
		"group": "web_extension"
	},
	"newTabStylesheet": {
		"type": "string",
		"value": '',
		"group": "web_extension",
		"options": {
			displayAs: "textarea",
		}
	},
	"panelAlwaysShowMoveInNewWindow": {
		"type": "bool",
		"value": false,
		"group": "web_extension"
	},
	"newTab_folders": {
		"type": "yaml",
		"value": [],
		"group": "web_extension"
	},
};

export default settings;
