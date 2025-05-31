#!/usr/bin/env ts-node

import fs from "fs-extra";
import path from "path";
import * as sass from "sass";

const currentPath = path.resolve(import.meta.dirname, '..'),
	libPath = path.resolve(currentPath, './browserViews/lib/')
;

if (!fs.existsSync(libPath)){
	fs.mkdirSync(libPath);
}

const vuePath = path.resolve(libPath, './vue');
if (fs.existsSync(vuePath)) {
	fs.removeSync(vuePath);
}

await fs.copy(path.resolve(currentPath, './node_modules/@fontsource/ubuntu/'), path.resolve(libPath, './fontsource-ubuntu'))
	.catch(console.error)
;

await fs.copy(path.resolve(currentPath, './node_modules/yaml/browser/dist/'), path.resolve(libPath, './yaml'))
	.catch(console.error)
;

await fs.copy(path.resolve(currentPath, './node_modules/flems/dist/'), path.resolve(libPath, './flems'))
	.catch(console.error)
;


await fs.mkdirp(path.resolve(libPath, './material-symbols'));
await fs.copy("./node_modules/material-symbols/material-symbols-outlined.woff2", path.resolve(libPath, './material-symbols/material-symbols-outlined.woff2'));
await fs.copy("./node_modules/material-symbols/material-symbols-rounded.woff2", path.resolve(libPath, './material-symbols/material-symbols-rounded.woff2'));
await fs.copy("./node_modules/material-symbols/material-symbols-sharp.woff2", path.resolve(libPath, './material-symbols/material-symbols-sharp.woff2'));
fs.writeFileSync(path.resolve(libPath, './material-symbols/material-symbols.css'),
	sass.compile("./node_modules/material-symbols/index.scss").css
		.replace(/ {2}/g, '\t')
		.replace(/(font-family: "Material Symbols \w+?";)/g, '/*noinspection CssNoGenericFontName*/\n\t$1 /* stylelint-disable-line font-family-no-missing-generic-family-keyword */'),
	{ encoding: 'utf-8' }
);
