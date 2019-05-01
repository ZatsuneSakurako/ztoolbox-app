const fs = require('fs'),
	path = require('path'),
	currentPath = path.resolve(path.dirname(__filename), '..'),

	libPath = path.resolve(currentPath, './lib/')
;

if (!fs.existsSync(libPath)){
	fs.mkdirSync(libPath);
}

fs.copyFile(path.resolve(currentPath, './node_modules/vue/dist/vue.js'), path.resolve(libPath, './vue.js'), (err) => {
	if (err) {
		throw err;
	}
});
