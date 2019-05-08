const gulp = require('gulp'),
	gulpSass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps')
;





gulp.task('styles', function() {
	return gulp.src('browserViews/css/**/*.sass')
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
		.pipe(gulp.dest('./browserViews/css/'))
});





//Watch task
gulp.task('default', function() {
	gulp.watch('src/sass/**/*.sass',['styles']);
});
