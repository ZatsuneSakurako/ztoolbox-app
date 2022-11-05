#!/usr/bin/env ts-node

import fs from "fs-extra";
import path from "path";
import browserify from "browserify";

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

fs.copy(path.resolve(currentPath, './node_modules/@fontsource/ubuntu/'), path.resolve(libPath, './fontsource-ubuntu'))
	.catch(console.error)
;

fs.ensureDirSync(path.resolve(libPath, './locutus'));
const b = browserify([ path.resolve(currentPath, './node_modules/locutus/index.js') ], {
		standalone: 'locutus'
	}),
	locutusPhp = fs.createWriteStream(path.resolve(libPath, './locutus/_index.js'))
;
b.bundle().pipe(locutusPhp);
fs.writeFileSync(path.resolve(libPath, './locutus/index.js'), `import './_index.js';export default window['locutus']`)
fs.copyFileSync(path.resolve(currentPath, './node_modules/@types/locutus/index.d.ts'), path.resolve(libPath, './locutus/index.d.ts'));
