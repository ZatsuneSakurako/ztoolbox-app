import * as fs from "node:fs";
import * as path from "node:path";
import {UserscriptMeta} from "./UserscriptMeta.js";
import * as sass from "sass-embedded";
import ts from "typescript";
import {appRootPath} from "../../classes/constants.js";
import {IUserscriptJson} from "../../classes/bo/userscript.js";


export class Userscript {
	readonly #userscriptMeta: UserscriptMeta
	readonly #sourcePath: string
	readonly #fileName: string
	#fileExtension: string
	#fileContent: string

	constructor(fileName: string, sourcePath: string) {
		this.#sourcePath = sourcePath;
		this.#fileName = fileName;
		this.#fileExtension = path.extname(fileName).replace(/^\./, '');
		const fileContent = fs.readFileSync(this.filePath, { encoding: 'utf8' });
		this.#userscriptMeta = new UserscriptMeta(fileContent.replace(/\r\n|\r/g, '\n'));
	}

	static search(sourcePath: string): Userscript[] {
		const files = fs.readdirSync(sourcePath, {
			encoding: 'utf8',
			recursive: true,
			withFileTypes: true
		});

		const output: Userscript[] = [];
		for (let file of files) {
			if (!file.isFile() || /\.(d\.ts|map|bak)$/.test(file.name)) continue;

			output.push(new this(
				path.join(path.relative(sourcePath, file.parentPath), file.name),
				sourcePath
			));
		}

		return output;
	}

	get filePath(): string {
		return path.join(this.#sourcePath, this.#fileName);
	}

	get fileContent(): string {
		if (this.#fileContent) return this.#fileContent;
		return this.#userscriptMeta.fileContent;
	}

	async processContent(): Promise<void> {
		if (['scss', 'sass'].includes(this.#fileExtension)) {
			const result = await sass.compileStringAsync(this.fileContent, {
				loadPaths: [
					path.basename(this.#sourcePath)
				],
				quietDeps: true,
				sourceMap: true,
				sourceMapIncludeSources: true,
				style: "expanded",
				syntax: this.#fileExtension === 'sass' ? 'indented' : 'scss',
				verbose: false,
			});
			this.#fileExtension = 'css';
			this.#fileContent = result.css.toString();
		} else if (this.#fileExtension === 'ts') {
			const ts = (await import('typescript')),
				result = ts.transpileModule(this.fileContent, this.#lazyLoadTypescriptOptions(ts));

			this.#fileContent = result.outputText;
			this.#fileExtension = 'js';
		}
	}

	#typescriptOptions: ts.TranspileOptions|null = null;
	#lazyLoadTypescriptOptions(tsModule:typeof ts): ts.TranspileOptions {
		if (!this.#typescriptOptions) {
			const ts = tsModule,
				tsOptions: ts.TranspileOptions = this.#typescriptOptions = {};

			const projectTsConfig:ts.TranspileOptions = JSON.parse(fs.readFileSync(path.normalize(`${appRootPath}/tsconfig.json`), 'utf8'));

			tsOptions.compilerOptions = projectTsConfig.compilerOptions ?? {};
			tsOptions.compilerOptions.types = [];
			tsOptions.compilerOptions.rootDir = undefined;

			tsOptions.compilerOptions.target = ts.ScriptTarget.ESNext;
			tsOptions.compilerOptions.module = ts.ModuleKind.ESNext;
			tsOptions.compilerOptions.moduleResolution = ts.ModuleResolutionKind.Node16;

			tsOptions.compilerOptions.sourceMap = false;
			tsOptions.compilerOptions.inlineSourceMap = false;
		}
		return this.#typescriptOptions;
	}

	get name(): string {
		const name = this.userscriptMeta.get('name');
		return typeof name === 'string' ? name : this.#fileName;
	}

	get domains(): string[] {
		const domains = this.userscriptMeta.getAll('domain');
		if (domains === false) {
			return [];
		} else if (typeof domains === 'boolean') {
			console.log(domains);
			throw new Error('UNEXPECTED_DOMAIN_VALUE');
		}
		return domains;
	}

	get tags(): string[] {
		const result = this.#userscriptMeta.getAll('tag'),
			output: string[] = Array.isArray(result) ? result : []
		;

		const relativeDirname = path.dirname(this.#fileName);
		if (relativeDirname !== '.') {
			output.push(path.dirname(this.#fileName));
		}
		return output;
	}

	get userscriptMeta(): UserscriptMeta {
		return this.#userscriptMeta;
	}

	toJSON(): IUserscriptJson {
		const matches = this.#userscriptMeta.getAll('matches'),
			excludeMatches = this.#userscriptMeta.getAll('excludeMatches');

		return {
			name: this.name,
			fileName: this.#fileName,
			ext: this.#fileExtension,
			content: this.fileContent,
			tags: this.tags,
			domains: this.domains,
			matches: Array.isArray(matches) && matches.length ? matches : undefined,
			excludeMatches: Array.isArray(excludeMatches) && excludeMatches.length ? excludeMatches : undefined,
			meta: this.userscriptMeta.toJSON(),
		}
	}
}
