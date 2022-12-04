import i18next from "i18next";

import frTranslation from "../locales/fr.json";
import enTranslation from "../locales/en.json";
import frPreferencesTranslation from "../locales/preferences/fr.json";
import enPreferencesTranslation from "../locales/preferences/en.json";
import {app} from "electron";

export const i18n = i18next
	.init({
		lng: app.getLocaleCountryCode(),
		fallbackLng: 'fr',
		defaultNS: 'default',
		ns: [
			'default',
			'preferences',
		],
		resources: {
			en: {
				default: enTranslation,
				preferences: enPreferencesTranslation
			},
			fr: {
				default: frTranslation,
				preferences: frPreferencesTranslation
			}
		}
	})
;