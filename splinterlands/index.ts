import {config} from "dotenv";
config();

import fetch from "node-fetch";
import systemCheck from '../api/systemCheck';
import GetCards from "./getCards";
import GetQuest from "./getQuest";
import playerBot from "../api/playerBot";

class app {
	readonly checkUpdate: boolean = JSON.parse(process.env.CHECK_UPDATES.toLowerCase());
	readonly loginViaEmail: boolean = JSON.parse(process.env.LOGIN_VIA_EMAIL.toLowerCase());
	readonly accountusers: string[] = process.env.ACCUSERNAME.split(',');
	readonly accounts: string[] = this.loginViaEmail ? process.env.EMAIL.split(',') : this.accountusers;
	readonly passwords: string[] = process.env.PASSWORD.split(',');
	readonly headless: boolean = JSON.parse(process.env.HEADLESS.toLowerCase());
	readonly useAPI: boolean = JSON.parse(process.env.USE_API.toLowerCase());
	readonly keepBrowserOpen: boolean = JSON.parse(process.env.KEEP_BROWSER_OPEN.toLowerCase());
	readonly claimQuestReward: boolean = JSON.parse(process.env.CLAIM_QUEST_REWARD.toLowerCase());
	readonly claimSeasonReward: boolean = JSON.parse(process.env.CLAIM_SEASON_REWARD.toLowerCase());
	readonly prioritizeQuest: boolean = JSON.parse(process.env.QUEST_PRIORITY.toLowerCase());
	readonly sleepingTime: number = (parseInt(process.env.MINUTES_BATTLES_INTERVAL) || 30) * 60000;
	private browsers: any = []; // ?Browser[]

	// @ts-ignore
	public isReady: Promise.IThenable<any>;

	constructor() {
		this.isReady = new Promise((resolve, reject) => {
			try{
				let checks = new systemCheck();

				checks.checkForMissingConfigs();
				if (this.checkUpdate)
					checks.checkVersion();
				if (systemCheck.isDebug()) {
					console.log('Headless', this.headless);
					console.log('Keep Browser Open', this.keepBrowserOpen);
					console.log('Login via Email', this.loginViaEmail);
					console.log('Claim Quest Reward', this.claimQuestReward);
					console.log('Prioritize Quests', this.prioritizeQuest);
					console.log('Use API', this.useAPI);
					console.log('Loaded', this.accounts.length, ' Accounts')
					console.log('START ', this.accounts, new Date().toLocaleString())
				}
				resolve(undefined)
			}catch (err) {
				reject(err)
			}
		})
	}

	async loopAccounts() {
		while (true) {
			for (let i = 0; i < this.accounts.length; i++) {
				process.env['EMAIL'] = this.accounts[i];
				process.env['PASSWORD'] = this.passwords[i];
				process.env['ACCUSERNAME'] = this.accountusers[i];

				const bot = new playerBot();

				console.log('Opening browser');
				if (this.keepBrowserOpen && this.browsers.length == 0)
					this.browsers = await bot.createBrowsers(this.accounts.length, this.headless);
				else if (!this.keepBrowserOpen)
					this.browsers = await bot.createBrowsers(1, this.headless);

				const page = (await (this.keepBrowserOpen ? this.browsers[i] : this.browsers[0]).pages())[1];
				const allCards = new GetCards();
				const allQuests = new GetQuest();
				if (systemCheck.isDebug())
					console.log('getting user cards collection from splinterlands API...')
				const myCards = await allCards.cardsReady
					.then(() => allCards.getPlayerCards(process.env['ACCUSERNAME']))
					.catch(() => console.log('cards collection api didnt respond. Did you use username? avoid email!'));
				if (systemCheck.isDebug())
					console.log('getting user quest info from splinterlands API...');

				const quest = await allQuests.getPlayerQuest(this.accountusers[i].split('@')[0]);

				if (!quest)
					console.log('Error for quest details. Splinterlands API didnt work or you used incorrect username')
				if (systemCheck.isDebug()) {
					if (myCards)
						console.log(process.env.ACCUSERNAME, ' deck size: ' + myCards.length)
					else
						console.log(process.env.EMAIL, ' playing only basic cards')
				}

				let prepare = await bot.prepare(page);
				if(!prepare)
					return false;
				let check = await bot.checkThreshold(page);
				if(!check)
					return false;
				await page.waitForTimeout(1000);
				if (systemCheck.isDebug())
					console.info('Closing popup')
				await bot.closePopups(page);
				await page.waitForTimeout(2000);
				await bot.changePage(page);

				if(this.claimSeasonReward)
					await bot.seasonAward(page);
				if(this.claimQuestReward)
					await bot.questAward(page,quest);

				if (!page.url().includes("battle_history")) {
					if (systemCheck.isDebug()) {
						console.log("Seems like battle button menu didn't get clicked correctly - try again");
						console.log('Clicking fight menu button again');
					}
					await bot.changePage(page);
					await page.waitForTimeout(5000);
				}

				await bot.launchBattle(page, myCards, quest, this.claimQuestReward, this.prioritizeQuest, this.useAPI, allCards)
					.then(() => {
						console.log('Closing battle', new Date().toLocaleString());
					})
					.catch((e) => {
						console.log(e)
					})

				await page.waitForTimeout(5000);
				if (this.keepBrowserOpen) {
					await page.goto('about:blank');
				} else {
					await this.browsers[0].close();
				}
			}
			await console.log('Waiting for the next battle in', this.sleepingTime / 1000 / 60, ' minutes at ', new Date(Date.now() + this.sleepingTime).toLocaleString());
			await console.log('Want to speed things up? or just support me? https://bunq.me/bramhammer');
			await new Promise(r => setTimeout(r, this.sleepingTime));
		}
	}
}
export default app