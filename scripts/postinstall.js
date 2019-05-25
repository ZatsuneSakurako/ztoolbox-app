const fs = require('fs-extra'),
	path = require('path'),
	currentPath = path.resolve(path.dirname(__filename), '..'),

	libPath = path.resolve(currentPath, './browserViews/lib/')
;

if (!fs.existsSync(libPath)){
	fs.mkdirSync(libPath);
}

fs.copy(path.resolve(currentPath, './node_modules/codemirror/'), path.resolve(libPath, './codemirror'), function (err) {
	if (err) {
		throw err;
	}
});
