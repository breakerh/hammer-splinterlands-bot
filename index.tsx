import app from "./splinterlands/index";

const APP = new app();
APP.isReady.then(() => {
	APP.loopAccounts();
});