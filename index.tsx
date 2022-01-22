import app from "./splinterlands/index";

const APP = new app();
APP.isReady.then(async () => {await APP.versionCheck()}).then(() => {
	APP.loopAccounts();
});