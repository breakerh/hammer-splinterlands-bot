import fetch from "node-fetch";
import {config} from "dotenv";
import chalk from "chalk";
config();

class systemCheck {
	// @ts-ignore
	public versionChecked: Promise.IThenable<any>;
	readonly version: number = 0.5;

	constructor() {

	}

	async checkVersion() {

			console.log('-----------------------------------------------------------------------------------------------------');
			await fetch('https://raw.githubusercontent.com/breakerh/hammer-splinterlands-bot/main/version.json')
				.then(response=>response.json())
				.then(versionData=>{
					if (versionData.version > this.version) {
						console.error('There\'s a \x1b[30m\x1b[41mnew update\x1b[0m available! Please `git pull` or download on https://github.com/breakerh/hammer-splinterlands-bot/releases');
					} else {
						console.log('No update available');
					}
				})
				.catch(err => console.log('Repository could\'t be reached.'));
			console.log('-----------------------------------------------------------------------------------------------------');
	}

	static sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	async checkForMissingConfigs() {
		if (!process.env.LOGIN_VIA_EMAIL) {
			console.log("Missing \x1b[30m\x1b[41mLOGIN_VIA_EMAIL\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.HEADLESS) {
			console.log("Missing\x1b[30m\x1b[41mHEADLESS\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.KEEP_BROWSER_OPEN) {
			console.log("Missing \x1b[30m\x1b[41mKEEP_BROWSER_OPEN\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.CLAIM_QUEST_REWARD) {
			console.log("Missing \x1b[30m\x1b[41mCLAIM_QUEST_REWARD\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.ERC_THRESHOLD) {
			console.log("Missing \x1b[30m\x1b[41mERC_THRESHOLD\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.RATING_MIN) {
			console.log("Missing \x1b[30m\x1b[41mRATING_MIN\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.RATING_MAX) {
			console.log("Missing \x1b[30m\x1b[41mRATING_MAX\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
	}

	static isDebug(): boolean {
		return JSON.parse(process.env.DEBUG.toLowerCase());
	}

	isMaintenance() {
		return false;
	}
}

export default systemCheck
