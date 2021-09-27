#!/usr/bin/env ts-node

import fs from "fs-extra";
import path from "path";

const currentPath = path.resolve(path.dirname(__filename), '..'),
	libPath = path.resolve(currentPath, './browserViews/lib/')
;

if (!fs.existsSync(libPath)){
	fs.mkdirSync(libPath);
}

fs.copy(path.resolve(currentPath, './node_modules/codemirror/'), path.resolve(libPath, './codemirror'))
	.catch(console.error)
;

fs.copy(path.resolve(currentPath, './node_modules/vue/dist/'), path.resolve(libPath, './vue'))
	.catch(console.error)
;

fs.copy(path.resolve(currentPath, './node_modules/string-strip-html/dist/'), path.resolve(libPath, './string-strip-html'))
	.catch(console.error)
;
