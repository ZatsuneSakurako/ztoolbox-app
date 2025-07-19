#!/usr/bin/env ts-node

import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass";

const currentPath = path.resolve(import.meta.dirname, '..'),
	libPath = path.resolve(currentPath, './browserViews/lib/')
;

if (fs.existsSync(libPath)) {
	fs.rmSync(libPath, { recursive: true, force: true });
}
fs.mkdirSync(libPath);


const vuePath = path.resolve(libPath, './vue');
if (fs.existsSync(vuePath)) {
	fs.rmSync(vuePath, { recursive: true, force: true });
}

fs.cpSync(path.resolve(currentPath, './node_modules/@fontsource/ubuntu/'), path.resolve(libPath, './fontsource-ubuntu'), {
	recursive: true,
});

fs.cpSync(path.resolve(currentPath, './node_modules/yaml/browser/dist/'), path.resolve(libPath, './yaml'), {
	recursive: true,
});


fs.mkdirSync(path.resolve(libPath, './material-symbols'), {
	recursive: true,
});
fs.cpSync("./node_modules/material-symbols/material-symbols-outlined.woff2", path.resolve(libPath, './material-symbols/material-symbols-outlined.woff2'));
fs.cpSync("./node_modules/material-symbols/material-symbols-rounded.woff2", path.resolve(libPath, './material-symbols/material-symbols-rounded.woff2'));
fs.cpSync("./node_modules/material-symbols/material-symbols-sharp.woff2", path.resolve(libPath, './material-symbols/material-symbols-sharp.woff2'));
fs.writeFileSync(path.resolve(libPath, './material-symbols/material-symbols.css'),
	sass.compile("./node_modules/material-symbols/index.scss").css
		.replace(/ {2}/g, '\t')
		.replace(/(font-family: "Material Symbols \w+?";)/g, '/*noinspection CssNoGenericFontName*/\n\t$1 /* stylelint-disable-line font-family-no-missing-generic-family-keyword */'),
	{ encoding: 'utf-8' }
);
