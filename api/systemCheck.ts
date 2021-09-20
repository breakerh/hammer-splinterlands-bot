import fetch from "node-fetch";
import {config} from "dotenv";
config();

class systemCheck {
	// @ts-ignore
	public versionChecked: Promise.IThenable<any>;
	readonly version: number = 0.3;

	constructor() {

	}

	checkVersion() {
		this.versionChecked = new Promise((resolve, reject) => {
			console.log('-----------------------------------------------------------------------------------------------------');
			fetch('https://raw.githubusercontent.com/breakerh/hammer-splinterlands-bot/main/version.json')
				.then(response=>response.json())
				.then(versionData=>{
					if (versionData.version > this.version) {
						console.error('There\'s a \x1b[30m\x1b[41mnew update\x1b[0m available! Please `git pull` or download on https://github.com/breakerh/hammer-splinterlands-bot/releases');
					} else {
						console.log('No update available');
					}
					resolve(undefined);
				})
				.catch(err => reject(err));
			console.log('-----------------------------------------------------------------------------------------------------');
		});
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
		if (!process.env.USE_CLASSIC_BOT_PRIVATE_API) {
			console.log("Missing \x1b[30m\x1b[41mUSE_CLASSIC_BOT_PRIVATE_API\x1b[0m parameter in .env - see updated .env-example!");
			await systemCheck.sleep(60000);
		}
		if (!process.env.USE_API) {
			console.log("Missing \x1b[30m\x1b[41mUSE_API\x1b[0m parameter in .env - see updated .env-example!");
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
}

export default systemCheck