import {BridgedWindow} from "../bridgedWindow";
import {Color} from "./color.js";

async function getPreferences() {
	const znmApi = (<BridgedWindow> window).znmApi;
	return await znmApi.getPreferences('theme', 'background_color');
}

async function render(data:any) {
	const znmApi = (<BridgedWindow> window).znmApi;
	return znmApi.mustacheRender("backgroundTheme", data);
}

const STYLE_NODE_ID = 'generated-color-stylesheet';
export async function themeCacheUpdate() {
	let colorStylesheetNode:HTMLElement|null = document.querySelector<HTMLElement>('#' + STYLE_NODE_ID) ?? null;

	const options = await getPreferences(),
		currentTheme = options.theme ?? 'dark',
		background_color = options.background_color ?? '#000000'
	;

	if (colorStylesheetNode !== null && currentTheme === colorStylesheetNode.dataset.theme && background_color === colorStylesheetNode.dataset.background_color) {
		console.info("Loaded theme is already good");
		return null;
	}


	const baseColor = new Color(background_color),
		baseColor_hsl = baseColor.getHSL(),
		baseColor_L = parseInt(baseColor_hsl.L)/100
	;
	let values:[string,string,string,string]|undefined;
	if (currentTheme === "dark") {
		if (baseColor_L > 0.5 || baseColor_L < 0.1) {
			values = ["19%","13%","26%","13%"];
		} else {
			values = [(baseColor_L + 0.06) * 100 + "%", baseColor_L * 100 + "%", (baseColor_L + 0.13) * 100 + "%", baseColor_L * 100 + "%"];
		}
	} else if (currentTheme === "light") {
		if (baseColor_L < 0.5 /*|| baseColor_L > 0.9*/) {
			values = ["87%","74%","81%","87%"];
		} else {
			values = [baseColor_L * 100 + "%", (baseColor_L - 0.13) * 100 + "%", (baseColor_L - 0.06) * 100 + "%", baseColor_L * 100 + "%"];
		}
	}
	if (!values) throw new Error('SHOULD_NOT_HAPPEN');



	const style = await render({
		"isDarkTheme": (currentTheme === "dark"),
		"isLightTheme": (currentTheme === "light"),
		"baseColor_hsl": baseColor_hsl,
		"light0": values[0],
		"light1": values[1],
		"light2": values[2],
		"light3": values[3],
		"invBaseColor_hue": ''+(baseColor_hsl.H - 360/2 * ((baseColor_hsl.H < 360/2)? 1 : -1)),
		"invBaseColor_light": (currentTheme === "dark")? "77%" : "33%"
	});

	const styleElement = colorStylesheetNode ?? document.createElement("style");
	styleElement.id = STYLE_NODE_ID;
	styleElement.textContent = style;
	styleElement.dataset.theme = currentTheme;
	styleElement.dataset.background_color = background_color;
	//console.log(baseColor.rgbCode());
	return styleElement.cloneNode(true);
}