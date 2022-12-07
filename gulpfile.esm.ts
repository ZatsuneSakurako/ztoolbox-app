import child_process from "child_process";
import * as gulp from "gulp";
import del from "del";
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
		src: 'browserViews/css/**/*.sass',
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





function clearCss() {
	return del([
		'browserViews/css/**/*.css',
		'browserViews/css/**/*.map',
	]);
}

function _css() {
	return gulp.src([paths.styles.src, '!**/_*.sass'], {
		sourcemaps: true
	})
		.pipe(
			gulpSass.sync({
				indentedSyntax: true,
				indentType: 'tab',
				indentWidth: 1,
				linefeed: 'lf',
				sourceComments: true
			})
				.on('error', gulpSass.logError)
		)
		.pipe(gulp.dest(paths.styles.dest, {
			sourcemaps: '.'
		}))
}
export const css = gulp.series(clearCss, _css);



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


/**
 * @deprecated
 */
function clearVue() {
	return del([
		'browserViews/*.js',
		'browserViews/*.js.map',
	]);
}



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





export const clear = gulp.series(clearCss, clearHtml, clearVue, clearJs);

export const build = gulp.series(clear, gulp.parallel(_css, _html, _js));

function _watch() {
	gulp.watch(paths.styles.src, _css);
	gulp.watch(paths.html.src, _html);
	gulp.watch([
		paths.js.src,
		paths.mainJs.src,
		paths.mainClassJs.src
	], _js);
}
export const watch = gulp.series(clear, build, _watch);

//Watch task
// noinspection JSUnusedGlobalSymbols
export default build;

