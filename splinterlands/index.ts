import {config} from "dotenv";
import fetch from "node-fetch";
config();


import systemCheck from '../api/systemCheck';
import GetCards from "./getCards";
import GetQuest from "./getQuest";
import playerBot from "../api/playerBot";

class app {
	public draw: number = 0;
	public wins: number = 0;
	public losses: number = 0;
	readonly checkUpdate: boolean = JSON.parse(process.env.CHECK_UPDATES.toLowerCase());
	readonly loginViaEmail: boolean = JSON.parse(process.env.LOGIN_VIA_EMAIL.toLowerCase());
	readonly accountusers: string[] = process.env.ACCUSERNAME.split(',');
	readonly accounts: string[] = this.loginViaEmail ? process.env.EMAIL.split(',') : this.accountusers;
	readonly passwords: string[] = process.env.PASSWORD.split(',');
	readonly headless: boolean = JSON.parse(process.env.HEADLESS.toLowerCase());
	readonly keepBrowserOpen: boolean = JSON.parse(process.env.KEEP_BROWSER_OPEN.toLowerCase());
	readonly claimQuestReward: boolean = JSON.parse(process.env.CLAIM_QUEST_REWARD.toLowerCase());
	readonly claimSeasonReward: boolean = JSON.parse(process.env.CLAIM_SEASON_REWARD.toLowerCase());
	readonly prioritizeQuest: boolean = JSON.parse(process.env.QUEST_PRIORITY.toLowerCase());
	readonly sleepingTime: number = (parseInt(process.env.MINUTES_BATTLES_INTERVAL) || 30) * 60000;
	private browsers: any = []; // ?Browser[]
	public playerSettings: any = [];

	// @ts-ignore
	public isReady: Promise.IThenable<any>;

	constructor() {
		this.isReady = new Promise((resolve, reject) => {
			try{
				let checks = new systemCheck();

				checks.checkForMissingConfigs();
				if (systemCheck.isDebug()) {
					console.log('Headless', this.headless);
					console.log('Keep Browser Open', this.keepBrowserOpen);
					console.log('Login via Email', this.loginViaEmail);
					console.log('Claim Quest Reward', this.claimQuestReward);
					console.log('Prioritize Quests', this.prioritizeQuest);
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

		/*const allCards = new GetCards();
		await allCards.cardsReady
			.then(async cards => {

				let test = allCards.teamActualSplinterToPlay([162,160,163,158]);
				console.log(test);
			});
		return;*/
		while (true) {
			for (let i = 0; i < this.accounts.length; i++) {
				process.env['EMAIL'] = this.accounts[i];
				process.env['PASSWORD'] = this.passwords[i];
				process.env['ACCUSERNAME'] = this.accountusers[i];

				const bot = new playerBot(this.wins,this.losses, this.draw);

				console.log('Opening browser');
				if (this.keepBrowserOpen && this.browsers.length == 0)
					this.browsers = await bot.createBrowsers(this.accounts.length, this.headless);
				else if (!this.keepBrowserOpen)
					this.browsers = await bot.createBrowsers(1, this.headless);

				const page = (await (this.keepBrowserOpen ? this.browsers[i] : this.browsers[0]).pages())[1];

				const playerSettings = await this.getPlayerSettings();
				const allCards = new GetCards(playerSettings.starter_editions.map(id => parseInt(id)));
				const allQuests = new GetQuest();
				if (systemCheck.isDebug())
					console.log('getting user cards collection from splinterlands API...')
				const myCards = await allCards.cardsReady
					.then(() => allCards.getPlayerCards(process.env['ACCUSERNAME']))
					.catch(() => console.log('cards collection api didnt respond. Did you use username? avoid email!'));
				if (systemCheck.isDebug())
					console.log('getting user quest info from splinterlands API...');
				console.log(myCards.length);
				bot.passCards(allCards);
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

				await bot.launchBattle(page, myCards, quest, this.claimQuestReward, this.prioritizeQuest, allCards)
					.then((outcome) => {
						if(outcome===null)
							this.draw++;
						else if(outcome===true)
							this.wins++;
						else
							this.losses++;
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
			const sleepingTime = this.randBetween(this.sleepingTime*.8,this.sleepingTime*1.2);
			console.log('Waiting for the next battle in', (sleepingTime / 1000 / 60).toFixed(2), ' minutes at ', new Date(Date.now() + sleepingTime).toLocaleString());
			console.log('Want to speed things up? or just support me? https://bunq.me/bramhammer');
			console.log('This session you have '+this.wins+' wins, '+this.losses+' losses and '+this.draw+' draws!');
			await new Promise(r => setTimeout(r, sleepingTime));
		}
	}

	async getPlayerSettings() {
		return await fetch("https://api2.splinterlands.com/settings?config_version=5&username="+process.env.ACCUSERNAME,
			{
				"credentials":"omit",
				"headers":{
					"accept":"application/json, text/javascript, */*; q=0.01",
					"accept-language":"en-GB,en-US;q=0.9,en;q=0.8"
				},
				"referrer":"https://splinterlands.io/?p=battle_history",
				"referrerPolicy":"no-referrer-when-downgrade",
				"body":null,
				"method":"GET",
				"mode":"cors"
			})
			.then(response=>response.json())
			.then(response => {
				return response;
			})
			.catch((error) => {
				console.error('There has been a problem with your fetch operation:', error);
				return false;
			});
	}

	randBetween(min, max) {
		let delta = max - min;
		return Math.round(min + Math.random() * delta);
	}

	async versionCheck() {
		const checks = new systemCheck();
		if (this.checkUpdate) {
			await checks.checkVersion();
		}
	}
}
export default app