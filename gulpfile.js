const gulp = require('gulp'),
	del = require('del'),
	gulpSass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	gulpPug = require('gulp-pug')
;

const paths = {
	html: {
		src: 'browserViews/*.pug',
		dest: 'browserViews/'
	},
	styles: {
		src: 'browserViews/css/**/*.sass',
		dest: 'browserViews/css/'
	}
};





function clearStyles() {
	return del([
		'browserViews/css/**/*.css',
		'browserViews/css/**/*.map',
		// 'browserViews/css/**/*',
		// '!browserViews/css/**/*.sass',
	]);
}

function styles() {
	return gulp.src(paths.styles.src)
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
exports.styles = gulp.series(clearStyles, styles);





function clearHtml() {
	return del([
		'browserViews/*.html',
	]);
}

function HTML() {
	return gulp.src(paths.html.src)
		.pipe(gulpPug({
			// Your options in here.
		}))
		.pipe(gulp.dest(paths.html.dest))
}
exports.html = gulp.series(clearHtml, HTML);






const clear = gulp.series(clearStyles, clearHtml);
exports.clean = clear;

const build = gulp.series(clear, gulp.parallel(styles, HTML));
exports.build = build;

/*function watch() {
	gulp.watch(paths.styles.src, styles);
}
exports.watch = gulp.series(clear, build, watch);*/

//Watch task
exports.default = build;

