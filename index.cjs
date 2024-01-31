require = require("esm")(module/* , options */);
const {app} = require("electron");
app.whenReady().then(() => {
	console.log('This code may execute before the above import')
	import('./main.js')
		.catch(console.error)
	;
});
