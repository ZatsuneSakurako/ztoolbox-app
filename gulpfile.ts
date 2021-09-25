import gulp from "gulp";
import del from "del";
import fs from "fs-extra";
import gulpSass from "gulp-sass";
import sourcemaps from "gulp-sourcemaps";
import gulpPug from "gulp-pug";
import gulpVue from "./scripts/gulp-vue";
import gulpTs from "gulp-typescript";

const tsOptions = fs.readJsonSync('./tsconfig.json');

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
		src: 'classes/*.ts',
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
	return gulp.src([paths.styles.src, '!**/_*.sass'])
		.pipe(sourcemaps.init())
		.pipe(
			gulpSass({
				indentedSyntax: true,
				indentType: 'tab',
				indentWidth: 1,
				linefeed: 'lf',
				sourceComments: true
			})
				.on('error', gulpSass.logError)
		)
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.styles.dest))
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





function clearVue() {
	return del([
		'browserViews/*.js',
	]);
}

function _vue() {
	return gulp.src(paths.vue.src)
		.pipe(gulpVue())
		.pipe(gulp.dest(paths.vue.dest))
}
export const vue = gulp.series(clearVue, _vue);





function clearMainJs() {
	return del([
		'./*.js',
		'./*.map',
		'!./gulpfile.js'
	])
}

function _mainJs() {
	return gulp.src([paths.mainJs.src, '!_*.ts'])
		.pipe(sourcemaps.init())

		.pipe(gulpTs(tsOptions.compilerOptions))

		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.mainJs.dest))
}





function clearMainClassJs() {
	return del([
		'classes/*.js',
		'classes/*.map',
	])
}

function mainClassJs() {
	return gulp.src([paths.mainClassJs.src, '!**/_*.ts'])
		.pipe(sourcemaps.init())

		.pipe(gulpTs(tsOptions.compilerOptions))

		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.mainClassJs.dest))
}
export const mainJs = gulp.series(clearMainJs, _mainJs, mainClassJs);





function clearJs() {
	return del([
		'browserViews/js/**/*.js',
		'browserViews/js/**/*.map',
	]);
}

function _js() {
	return gulp.src([paths.js.src, '!**/_*.ts'])
		.pipe(sourcemaps.init())

		.pipe(gulpTs(tsOptions.compilerOptions))

		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.js.dest))
}
export const js = gulp.series(clearJs, _js);





export const clear = gulp.series(clearCss, clearHtml, clearVue, clearJs, clearMainJs, clearMainClassJs);

export const build = gulp.series(clear, gulp.parallel(_css, _html, _vue, _js, _mainJs, mainClassJs));

/*function watch() {
	gulp.watch(paths.styles.src, styles);
}
exports.watch = gulp.series(clear, build, watch);*/

//Watch task
export default build;

