import child_process from "child_process";
import gulp from "gulp";
import {deleteAsync as del} from "del";
import _gulpSass from "gulp-sass";
import * as sass from "sass-embedded";
import gulpPug from "gulp-pug";

const gulpSass = _gulpSass(sass);

const paths = {
	html: {
		src: 'browserViews/*.pug',
		dest: 'browserViews/'
	},
	vue: {
		src: 'browserViews/*.vue',
		dest: 'browserViews/'
	},
	styles: {
		src: 'browserViews/css/**/*.scss',
		dest: 'browserViews/css/'
	},
	js: {
		src: 'browserViews/js/**/*.ts',
		dest: 'browserViews/js/'
	},
	mainJs: {
		src: './*.ts',
		dest: '.'
	},
	mainClassJs: {
		src: 'classes/**/*.ts',
		dest: 'classes/'
	}
};





export function css() {
	return gulp.src([paths.styles.src])
		.pipe(
			gulpSass.sync({
				silenceDeprecations: [
					'global-builtin',
					'import',
				],
				sourceMapIncludeSources: true,
				sourceMap: true,
			}).on('error', gulpSass.logError)
		)
		.pipe(gulp.dest(paths.styles.dest))
}



function clearHtml() {
	return del([
		'browserViews/*.html',
	]);
}

function _html() {
	return gulp.src([paths.html.src, '!_*.pug'])
		.pipe(gulpPug({
			// Your options in here.
		}))
		.pipe(gulp.dest(paths.html.dest))
}
export const html = gulp.series(clearHtml, _html);



function clearJs() {
	return del([
		'./*.js',
		'./*.d.ts',
		'./*.map',
		'browserViews/js/**/*.js',
		'browserViews/js/**/*.d.ts',
		'browserViews/js/**/*.map',
		'chrome_messaging/**/*.js',
		'chrome_messaging/**/*.d.ts',
		'chrome_messaging/**/*.map',
		'classes/**/*.js',
		'classes/**/*.d.ts',
		'classes/**/*.map',
		'src/**/*.js',
		'src/**/*.d.ts',
		'src/**/*.map'
	])
}

async function _js() {
	return child_process.execSync('tsc --project tsconfig-nomodule.json && tsc')
}

export const js = gulp.series(clearJs, _js);





export const clear = gulp.series(clearHtml, clearJs);

export const build = gulp.series(clear, gulp.parallel(css, _html, _js));

function _watch() {
	gulp.watch(paths.styles.src, css);
	gulp.watch(paths.html.src, _html);
	gulp.watch([
		paths.js.src,
		paths.mainJs.src,
		paths.mainClassJs.src
	], _js);
}
export const watch = gulp.series(clear, build, _watch);

// noinspection JSUnusedGlobalSymbols
export default build;

