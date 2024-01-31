import i18next from "i18next";

import frTranslation from "../locales/fr.json" assert {type: 'json'};
import enTranslation from "../locales/en.json" assert {type: 'json'};
import frPreferencesTranslation from "../locales/preferences/fr.json" assert {type: 'json'};
import enPreferencesTranslation from "../locales/preferences/en.json" assert {type: 'json'};
import frWebsitesDataTranslation from "../locales/websitesData/fr.json" assert {type: 'json'};
import enWebsitesDataTranslation from "../locales/websitesData/en.json" assert {type: 'json'};
import {app} from "electron";

export const i18n = i18next
	.init({
		lng: app.getLocaleCountryCode(),
		fallbackLng: 'fr',
		defaultNS: 'default',
		nsSeparator: '.',
		ns: [
			'default',
			'preferences',
			'websitesData',
		],
		resources: {
			en: {
				default: enTranslation,
				preferences: enPreferencesTranslation,
				websitesData: enWebsitesDataTranslation,
			},
			fr: {
				default: frTranslation,
				preferences: frPreferencesTranslation,
				websitesData: frWebsitesDataTranslation,
			}
		}
	})
;