import * as fs from "node:fs";
import * as path from "node:path";
import {UserscriptMeta} from "./UserscriptMeta.js";
import * as sass from "sass-embedded";
import {Dict} from "../../browserViews/js/bo/Dict.js";

export interface IUserscriptJson {
	name: string
	fileName: string
	ext: string
	content: string
	tags: string[]
	meta: Dict<string | boolean>
}

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
			if (!file.isFile() || file.name.endsWith('.bak')) continue;

			output.push(new this(file.name, sourcePath));
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
		}
	}

	get name(): string {
		const name = this.userscriptMeta.get('name');
		return typeof name === 'string' ? name : this.#fileName;
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
		return {
			name: this.name,
			fileName: this.#fileName,
			ext: this.#fileExtension,
			content: this.fileContent,
			tags: this.tags,
			meta: this.userscriptMeta.toJSON(),
		}
	}
}
