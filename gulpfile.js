const gulp = require('gulp'),
	del = require('del'),
	gulpSass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps')
;

const paths = {
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
const clear = gulp.series(clearStyles);

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





exports.clean = clear;


const build = gulp.series(clear, styles);
exports.build = build;

/*function watch() {
	gulp.watch(paths.styles.src, styles);
}
exports.watch = gulp.series(clear, build, watch);*/

//Watch task
exports.default = build;

