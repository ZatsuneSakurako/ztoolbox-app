import {BridgedWindow} from "../bo/bridgedWindow.js";
import {Color} from "./color.js";

declare var window : BridgedWindow;

interface IThemePreferences {
	theme: string
	background_color: string
}
const THEME_LS_PREF_CACHE_KEY = '__theme_pref_cache';
const defaultThemePreferences : Readonly<IThemePreferences> = Object.freeze({
	theme: 'dark',
	background_color: '#000000',
});



async function getPreferences(): Promise<IThemePreferences> {
	const theme = await window.znmApi.getPreference('theme', 'string'),
		background_color = await window.znmApi.getPreference('background_color', 'string'),

		output = {
			theme: theme ?? defaultThemePreferences.theme,
			background_color: background_color ?? defaultThemePreferences.background_color,
		}
	;

	localStorage.setItem(THEME_LS_PREF_CACHE_KEY, JSON.stringify(output));
	return output;
}

export async function themeOnLoad() {
	const optionCache = localStorage.getItem(THEME_LS_PREF_CACHE_KEY);
	if (!!optionCache) {
		const _cache = JSON.parse(optionCache);
		if (_cache.theme !== undefined && _cache.background_color !== undefined) {
			const result = themeCacheUpdate(
				_cache.theme,
				_cache.background_color
			);

			getPreferences()
				.then(preferences => {
					if (preferences.theme !== _cache.theme || preferences.background_color !== _cache.background_color) {
						themeCacheUpdate(
							preferences.theme,
							preferences.background_color
						)
							.catch(console.error)
						;
					}
				})
				.catch(console.error)
			;

			return await result;
		}
	}

	const options = await getPreferences();
	return await themeCacheUpdate(
		options.theme,
		options.background_color
	);
}

const STYLE_NODE_ID = 'theme-stylesheet';
export async function themeCacheUpdate(theme: string, background_color: string) {
	let colorStylesheetNode = document.querySelector<HTMLLinkElement>('#' + STYLE_NODE_ID) ?? null;
	if (colorStylesheetNode !== null && theme === colorStylesheetNode.dataset.theme && background_color === colorStylesheetNode.dataset.background_color) {
		console.info("Loaded theme is already good");
		return;
	} else if (colorStylesheetNode && theme !== colorStylesheetNode.dataset.theme) {
		console.info("Changing stylesheet href");
		colorStylesheetNode.href = colorStylesheetNode.href.replace(/-(dark|light)/i, `-${theme}`);
		colorStylesheetNode.dataset.theme = theme;
	}


	if (colorStylesheetNode && background_color === colorStylesheetNode.dataset.background_color) {
		console.info("Theme color is already good");
	}


	const baseColor = new Color(background_color),
		baseColor_hsl = baseColor.getHSL(),
		baseColor_L = parseInt(baseColor_hsl.L)/100
	;
	let values:[string,string,string]|undefined;
	if (theme === "dark") {
		if (baseColor_L > 0.5 || baseColor_L < 0.25) {
			values = ['35%', '25%', '45%'];
		} else {
			values = [`${baseColor_L * 100}%`, `${(baseColor_L - 0.1) * 100}%`, `${(baseColor_L + 0.15) * 100}%`];
		}
	} else if (theme === "light") {
		if (baseColor_L < 0.5 || baseColor_L > 0.75) {
			values = ['65%', '40%', '80%'];
		} else {
			values = [`${baseColor_L * 100}%`, `${(baseColor_L - 0.25) * 100}%`, `${(baseColor_L + 0.25) * 100}%`];
		}
	}
	if (!values) throw new Error('SHOULD_NOT_HAPPEN');

	const primary = values[0],
		primaryDark = values[1],
		primaryLight = values[2],
		invBaseColor_hue = (baseColor_hsl.H - 360/2 * ((baseColor_hsl.H < 360/2)? 1 : -1)),
		invBaseColor_light = (theme === "dark")? "77%" : "33%";

	const root = document.documentElement;
	root.classList.toggle('light', theme === 'light');
	root.style.setProperty('--primary-color', `hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${primary})`);
	root.style.setProperty('--primary-color-dark', `hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${primaryDark})`);
	root.style.setProperty('--primary-color-light', `hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${primaryLight})`);

	// root.style.setProperty('--bgLight2_Opacity', `hsla(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${light2}, 0.95)`);
	// root.style.setProperty('--bgLight2_Opacity50', `hsla(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${light2}, 0.5)`);

	root.style.setProperty('--InvColor', `hsl(${invBaseColor_hue}, ${baseColor_hsl.S}, ${invBaseColor_light})`);

	if (colorStylesheetNode && colorStylesheetNode.dataset.background_color) {
		colorStylesheetNode.dataset.background_color = background_color;
	}
}
