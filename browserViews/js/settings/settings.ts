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

	"hourlyNotification": {
		"type": "bool",
		"value": false
	},
	"clipboardWatch": {
		"type": "bool",
		"value": false
	},
	"quality": {
		"type": "menulist",
		"value": "best",
		"options": [
			{
				value: 'worst',
				label: 'worst'
			},
			{
				value: '360p',
				label: '360p'
			},
			{
				value: '480p',
				label: '480p'
			},
			{
				value: '720p',
				label: '720p'
			},
			{
				value: '1080p',
				label: '1080p'
			},
			{
				value: 'best',
				label: 'best'
			}
		]
	},
};

export default settings;