const gulp = require('gulp'),
	del = require('del'),
	fs = require('fs-extra'),
	gulpSass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	gulpPug = require('gulp-pug'),
	gulpTs = require('gulp-typescript'),
	tsOptions = fs.readJsonSync('./tsconfig.json')
;

const paths = {
	html: {
		src: 'browserViews/*.pug',
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

function css() {
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
exports.css = gulp.series(clearCss, css);





function clearHtml() {
	return del([
		'browserViews/*.html',
	]);
}

function html() {
	return gulp.src([paths.html.src, '!_*.pug'])
		.pipe(gulpPug({
			// Your options in here.
		}))
		.pipe(gulp.dest(paths.html.dest))
}
exports.html = gulp.series(clearHtml, html);





function clearMainJs() {
	return del([
		'./*.js',
		'./*.map',
		'!./gulpfile.js'
	])
}

function mainJs() {
	return gulp.src([paths.mainJs.src, '!_*.ts'])
		.pipe(sourcemaps.init())

		.pipe(gulpTs(tsOptions.compilerOptions))

		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.mainJs.dest))
}
function mainClassJs() {
	return gulp.src([paths.mainClassJs.src, '!**/_*.ts'])
		.pipe(sourcemaps.init())

		.pipe(gulpTs(tsOptions.compilerOptions))

		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.mainClassJs.dest))
}
exports.mainJs = gulp.series(clearMainJs, mainJs, mainClassJs);





function clearJs() {
	return del([
		'browserViews/js/**/*.js',
		'browserViews/js/**/*.map',
	]);
}

function js() {
	return gulp.src([paths.js.src, '!**/_*.ts'])
		.pipe(sourcemaps.init())

		.pipe(gulpTs(tsOptions.compilerOptions))

		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.js.dest))
}
exports.js = gulp.series(clearJs, js);





const clear = gulp.series(clearCss, clearHtml, clearJs, clearMainJs);
exports.clear = clear;

const build = gulp.series(clear, gulp.parallel(css, html, js, mainJs));
exports.build = build;

/*function watch() {
	gulp.watch(paths.styles.src, styles);
}
exports.watch = gulp.series(clear, build, watch);*/

//Watch task
exports.default = build;

