import {SettingsConfig} from "./bo/settings-config";

const settings:SettingsConfig = {
	"panel_theme": {
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
};

export default settings;