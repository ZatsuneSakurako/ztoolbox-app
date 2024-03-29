const editors = {
	html: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>',
	css: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}',
	js: `function test(){return true;}
document.body.classList.add('red');
console.info("test console");

/*const {serialize, unserialize} = locutus.php.var;
console.dir(serialize(['test']));
console.dir(unserialize('a:1:{i:0;s:4:"test";}'));*/`
};

let flemInstance : FlemInstance|null = null;
async function init(data: { js: string, css: string, html: string }) {
	console.info('init');
	let opts : IFlemOptions = {
		theme: 'material',
		files: [
			{
				name: 'app.js',
				content: data.js
			},
			{
				name: 'app.css',
				content: data.css
			},
			{
				name: 'app.html',
				content: data.html
			},
		],
		links: [
			{
				name: 'lodash',
				type: 'script',
				url: 'https://unpkg.com/lodash'
			},
			{
				name: 'dayjs',
				type: 'script',
				url: 'https://unpkg.com/dayjs'
			},
		]
	};
	flemInstance = Flems(document.body, opts);
}

init({
	js: editors.js,
	css: editors.css,
	html: editors.html
});

type FlemInstance = {
	reload(): void
	focus(): void
	redraw(): void

	onchange(fn: (instance:FlemInstance) => void): void
	onload(fn: (instance:FlemInstance) => void): void
	onloaded(fn: (instance:FlemInstance) => void): void
}

interface IFlemOptions {
	files: {
		name: string,
		content: string
		compiler?: string|Function
	}[],
	links: {
		name: string,
		type: string,
		url: string
	}[],

	middle?: number,
	selected?: string, // '.js',
	color?: string, // 'rgb(38,50,56)',
	theme?: 'material'|'none'|'default', // and 'none' or 'default'
	resizeable?: boolean,
	editable?: boolean,
	toolbar?: boolean,
	fileTabs?: boolean,
	linkTabs?: boolean,
	shareButton?: boolean,
	reloadButton?: boolean,
	console?: boolean,
	autoReload?: boolean,
	autoReloadDelay?: number,
	autoHeight?: boolean
}

declare var Flems : (target:HTMLElement, opts: IFlemOptions) => FlemInstance;
