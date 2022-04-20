import app from "./splinterlands/index";
const AutoGitUpdate = require('auto-git-update');

const config = {
	repository: 'https://github.com/breakerh/hammer-splinterlands-bot',
	fromReleases: true,
	tempLocation: 'tmp/',
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