import nunjucks from "nunjucks";
import path from "path";
import {resourcePath} from "../classes/constants.js";

export const nunjucksEnv = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(path.normalize(`${resourcePath}/browserViews/`)),
);
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
