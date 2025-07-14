import nunjucks from "nunjucks";
import * as path from "node:path";
import {appExtensionTemplatesPath, resourcePath} from "../classes/constants.js";
import fs from "node:fs";

const searchPaths: string[] = [
	path.normalize(`${resourcePath}/browserViews/`),
];
if (fs.existsSync(appExtensionTemplatesPath)) {
	searchPaths.push(appExtensionTemplatesPath);
}
export const nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(searchPaths));
nunjucksEnv.addFilter('type', function(variable) {
	return typeof variable;
});
nunjucksEnv.addFilter('wait', function(variable, callback) {
	if (variable instanceof Promise) {
		variable.then(result => {
			callback(null, result);
		}).catch(callback);
		return;
	}
	callback(variable);
}, true);
