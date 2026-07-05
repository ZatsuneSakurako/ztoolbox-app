declare module "*.css" {
	const css: CSSStyleSheet;
	export default css;
}

declare module "*.module.css" {
	const classes: { readonly [key: string]: string };
	export default classes;
}
