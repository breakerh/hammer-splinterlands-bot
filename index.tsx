import app from "./splinterlands/index";
import path from 'path'
const fs   = require('fs');
const AutoGitUpdate = require('auto-git-update');
const tmpLocation  = path.resolve(__dirname,'../splinterbot-updater');
try {
	fs.accessSync(tmpLocation, fs.constants.R_OK | fs.constants.W_OK);
	const config = {
		repository: 'https://github.com/breakerh/hammer-splinterlands-bot',
		fromReleases: true,
		tempLocation: tmpLocation,
		executeOnComplete: 'start.bat',
		exitOnComplete: false
	}

	const updater = new AutoGitUpdate(config);
	updater.compareVersions().then(response => {
		if(response.upToDate){
			const APP = new app();
			APP.isReady.then(async () => {await APP.versionCheck()}).then(() => {
				APP.loopAccounts();
			});
		}else{
			updater.forceUpdate();
		}
	});
}catch(e){
	console.error('Couldn\'t make update folder. Please create '+tmpLocation);

	/*const APP = new app();
	APP.isReady.then(async () => {await APP.versionCheck()}).then(() => {
		APP.loopAccounts();
	});*/
}