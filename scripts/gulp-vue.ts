import * as path from "path";
import * as through from "through2";
import * as compiler from "vue-template-compiler";
import * as pug from "pug";
import PluginError from "plugin-error";
// @ts-ignore
import templateEs2015 from "vue-template-es2015-compiler";
import ts from "typescript";
import * as Vinyl from 'vinyl';
import fs from "fs-extra";

const PLUGIN_NAME = 'gulp-vue';



export interface TsConfig {
	files?: string[];
	include?: string[];
	exclude?: string[];
	compilerOptions?: ts.CompilerOptions;
}

function tsCompile(tsProject:TsConfig, inputFile:Vinyl, source: string, start:number): string {
	const options: TsConfig = JSON.parse(JSON.stringify(tsProject));
	if (options === null) throw new Error('NO_TS_PROJECT')

	if (!options.compilerOptions) {
		options.compilerOptions = {};
	}
	options.compilerOptions.moduleResolution = ts.ModuleResolutionKind.NodeJs;

	let rootDirs:string[] = [
		inputFile.dirname
	];
	console.dir(rootDirs)
	if (!!options.compilerOptions?.rootDir) {
		let rootDir = path.resolve(options.compilerOptions.rootDir);
		if (!path.isAbsolute(rootDir)) {
			rootDir = path.relative(process.cwd(), rootDir);
		}
		rootDirs.push(rootDir);
		delete options.compilerOptions.rootDir;
	}
	console.dir(rootDirs);
	(<ts.TranspileOptions> options).reportDiagnostics = true;

	const filename = path.basename(inputFile.path, path.extname(inputFile.path)) + '.vue.ts';
	const sourceFile = ts.createSourceFile(
		filename, source, ts.ScriptTarget.Latest
	);

	const defaultCompilerHost = ts.createCompilerHost(options.compilerOptions);
	const customCompilerHost: ts.CompilerHost = {
		getSourceFile: (name, languageVersion, onError) => {
			// console.log(`getSourceFile ${name}`);

			if (name === filename) {
				return sourceFile;
			} else {
				if (!name.startsWith('nodes_modules') && !path.isAbsolute(name)) {
					for (let rootDir of rootDirs) {
						const testPath = path.resolve(rootDir, name);
						if (fs.existsSync(testPath)) {
							name = testPath;
							break;
						}
						const testTsPath = testPath
							.replace(/\.js\.ts$/i, '.ts')
							.replace(/\.js$/i, '.ts')
						;
						if (fs.existsSync(testTsPath)) {
							name = testTsPath;
							break;
						}
					}
				}
				if (!name.startsWith('nodes_modules/') && !path.isAbsolute(name)) {
					const projectRoot = path.normalize(__dirname + '/../');
					const testPath = path.resolve(projectRoot, name);
					if (fs.existsSync(testPath)) {
						name = testPath;
					}
				}
				return defaultCompilerHost.getSourceFile(
					name, languageVersion, onError
				);
			}
		},
		writeFile: (filename, data) => {},
		getDefaultLibFileName: () => ts.getDefaultLibFilePath({
			"target": ts.ScriptTarget.ESNext
		}),
		useCaseSensitiveFileNames: () => false,
		getCanonicalFileName: filename => filename,
		getCurrentDirectory: () => "",
		getNewLine: () => "\n",
		getDirectories: () => [],
		fileExists: () => true,
		readFile: () => ""
	};

	let program:ts.Program|undefined;
	try {
		program = ts.createProgram(
			[filename], options.compilerOptions ?? {}, customCompilerHost
		);
	} catch (e) {
		console.error(e)
	}
	if (!program) throw new Error('ts error')


	const diagnostics = ts.getPreEmitDiagnostics(program);
	for (const diagnostic of diagnostics) {
		const message = diagnostic.messageText;
		const file = diagnostic.file ?? sourceFile;


		if (!file || !diagnostic.start) {
			console.log(message);
			continue;
		}
		if (!inputFile.contents) {
			throw new Error('EMPTY_FILE_CONTENT');
		}

		/*const filename = file.fileName;
		const lineAndChar = file.getLineAndCharacterOfPosition(
			diagnostic.start
		);*/
		const vueJsFile = ts.createSourceFile(
			path.basename(inputFile.path), inputFile.contents.toString('utf8'), ts.ScriptTarget.Latest
		);
		const lineAndChar = vueJsFile.getLineAndCharacterOfPosition(start + diagnostic.start);
		const line = lineAndChar.line + 1,
			character = lineAndChar.character + 1
		;
		throw {
			message: `${message.toString()}\n    ${inputFile.path}:${line}:${character}`,
			lineNumber: line,
		};
	}

	if (diagnostics?.length) {
		throw diagnostics;
	}

	return ts.transpileModule(source, options).outputText;
}

function transpile(fn:string|Function) {
	return templateEs2015(`function r(){${typeof fn === 'function'? fn.toString() : fn}}`, {
		stripWith: true
	})
}

function compileVue(file:Vinyl, options:any, tsProject?:TsConfig) {
	if (!file.contents) {
		throw new Error('EMPTY_FILE_CONTENT');
	}

	let inputText = file.contents.toString('utf8'),
		vueComponent = compiler.parseComponent(inputText),
		content
	;



	if ((vueComponent as any).errors.length > 0) {
		throw (vueComponent as any).errors;
	}

	if (Array.isArray(vueComponent.customBlocks) && vueComponent.customBlocks.length > 0) {
		throw 'Unknown unsupported tag(s) present';
	}

	if (vueComponent.styles !== null && Array.isArray(vueComponent.styles)) {
		const filteredStyles = vueComponent.styles.filter(item => {
			return item.content.trim().length > 0
		});

		if (filteredStyles.length > 0) {
			console.warn('Style tag not supported');
		}
	}



	if (vueComponent.template) {
		let lang = 'html';
		if (!!vueComponent.template.attrs && !!vueComponent.template.attrs.lang) {
			if (vueComponent.template.attrs.lang !== 'pug' && vueComponent.template.attrs.lang !== 'html') {
				throw `Unsupported template language "${vueComponent.template.attrs.lang}"`
			}

			lang = vueComponent.template.attrs.lang;
		}

		if (lang === 'pug') {
			inputText = pug.compile(vueComponent.template.content)();
		} else {
			inputText = vueComponent.template.content;
		}
	}



	if (vueComponent.script) {
		let lang = 'js';

		if (!!vueComponent.script.attrs && !!vueComponent.script.attrs.lang) {
			if ((tsProject && vueComponent.script.attrs.lang !== 'ts') && vueComponent.script.attrs.lang !== 'js') {
				throw `Unsupported script language "${vueComponent.script.attrs.lang}"`
			}

			lang = vueComponent.script.attrs.lang;
		}


		content = vueComponent.script.content;
		if (tsProject && lang === 'ts') {
			try {
				content = tsCompile(tsProject, file, content, vueComponent.script.start ?? 0);
			} catch (e) {
				throw e;
			}
		}
	}
	if (content === undefined) {
		content = `\texport default ${JSON.stringify({
			name: options.outputName
		})}`;
	}



	const compiledData = options.compiler.compile(inputText, options.compilerOptions),
		staticRenderFns = (Array.isArray(compiledData.staticRenderFns))? compiledData.staticRenderFns.map(transpile) : []
	;

	if (!content.includes('render:') && !content.includes('staticRenderFns:')) {
		content = content.replace(
			/export default[^{]*{/,
			`export default {\n	"render": ${transpile(compiledData.render)},\n	"staticRenderFns": [\n\t\t${staticRenderFns.join(',\n\t')}\n\t],`
		);
	}

	return content;
}



function gulpVue(opt:any={}, tsProject?:TsConfig) {
	function replaceExtension(path:string) {
		return path.replace(/\.vue$/, '.js');
	}
	function capitalize(str:string) {
		return str.charAt(0).toUpperCase() + str.slice(1)
	}



	function transform(file:any, enc:string, cb:Function) {
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



		let data;
		try {
			// data = umd(capitalize(options.outputName), compileVue(file.contents.toString('utf8'), options));
			data = compileVue(file, options, tsProject);
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
export default gulpVue;
