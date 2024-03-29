#!/usr/bin/env ts-node

import fs from "fs-extra";
import path from "path";
import browserify from "browserify";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url),
	currentPath = path.resolve(path.dirname(__filename), '..'),
	libPath = path.resolve(currentPath, './browserViews/lib/')
;

if (!fs.existsSync(libPath)){
	fs.mkdirSync(libPath);
}

const vuePath = path.resolve(libPath, './vue');
if (fs.existsSync(vuePath)) {
	fs.removeSync(vuePath);
}

fs.copy(path.resolve(currentPath, './node_modules/@fontsource/ubuntu/'), path.resolve(libPath, './fontsource-ubuntu'))
	.catch(console.error)
;

fs.copy(path.resolve(currentPath, './node_modules/yaml/browser/dist/'), path.resolve(libPath, './yaml'))
	.catch(console.error)
;

fs.copy(path.resolve(currentPath, './node_modules/flems/dist/'), path.resolve(libPath, './flems'))
	.catch(console.error)
;
