const path = require('path'),
	through = require('through2'),
	compiler = require('vue-template-compiler'),
	pug = require('pug'),
	umd = require('umd'),
	templateEs2015 = require('vue-template-es2015-compiler'),
	PluginError = require('plugin-error'),



	PLUGIN_NAME = 'gulp-vue'
;





/**
 *
 * @param {string|function} fn
 */
function transpile(fn) {
	return templateEs2015(`function r(){${typeof fn === 'function'? fn.toString() : fn}}`, {
		stripWith: true
	})
}
function compileVue(inputText, options) {
	const compiledData = options.compiler.compile(inputText, options.compilerOptions),
		staticRenderFns = (Array.isArray(compiledData.staticRenderFns))? compiledData.staticRenderFns.map(transpile) : []
	;

	return `'use strict';
return Object.freeze({
\t"render": ${transpile(compiledData.render)},
\t"staticRenderFns": ${JSON.stringify(staticRenderFns)}
});`;
}



function gulpVue(opt) {
	function replaceExtension(path) {
		return path.replace(/\.vue$/, '.js');
	}
	function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1)
	}



	function transform(file, enc, cb) {
		if (file.isNull()) {
			return cb(null, file);
		}
		if (file.isStream()) {
			return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
		}



		const options = Object.assign({
			compiler,
			compilerOptions: {},
			outputName: path.basename(file.path, path.extname(file.path))
		}, opt);



		let fileContents = file.contents.toString('utf8'),
			vueComponent = null
		;
		try {
			vueComponent = compiler.parseComponent(fileContents)
		} catch (e) {
			return cb(new PluginError(PLUGIN_NAME, err));
		}

		if (vueComponent !== null) {
			if (vueComponent.errors.length > 0) {
				vueComponent.errors.forEach(console.error);
			}

			if (vueComponent.script !== null) {
				return cb(new PluginError(PLUGIN_NAME, 'Script tag not supported'));
			}
			if (vueComponent.styles !== null && vueComponent.styles.length > 0) {
				return cb(new PluginError(PLUGIN_NAME, 'Style tag not supported'));
			}



			if (vueComponent.template !== null) {
				if (!!vueComponent.template.attrs && !!vueComponent.template.attrs.lang && vueComponent.template.attrs.lang === 'pug') {
					fileContents = pug.compile(vueComponent.template.content)();
				} else {
					fileContents = vueComponent.template.content;
				}
			}
		}



		let data;
		try {
			data = umd(capitalize(options.outputName), compileVue(fileContents, options));
		} catch (err) {
			return cb(new PluginError(PLUGIN_NAME, err));
		}



		file.contents = Buffer.from(data);
		file.path = replaceExtension(file.path);
		cb(null, file);
	}

	return through.obj(transform);
}





// Exporting the plugin main function
module.exports = gulpVue;
