import systemCheck from '../api/systemCheck';
import GetCards from "./getCards";
import GetQuest from "./getQuest";

class app {
	readonly checkUpdate: boolean = JSON.parse(process.env.CHECK_UPDATES.toLowerCase());
	readonly loginViaEmail: boolean = JSON.parse(process.env.LOGIN_VIA_EMAIL.toLowerCase());
	readonly accountusers: object = process.env.ACCUSERNAME.split(',');
	readonly accounts: object = loginViaEmail ? process.env.EMAIL.split(',') : accountusers;
	readonly passwords: object = process.env.PASSWORD.split(',');
	readonly headless: boolean = JSON.parse(process.env.HEADLESS.toLowerCase());
	readonly useAPI: boolean = JSON.parse(process.env.USE_API.toLowerCase());
	readonly keepBrowserOpen: boolean = JSON.parse(process.env.KEEP_BROWSER_OPEN.toLowerCase());
	readonly claimQuestReward: boolean = JSON.parse(process.env.CLAIM_QUEST_REWARD.toLowerCase());
	readonly prioritizeQuest: boolean = JSON.parse(process.env.QUEST_PRIORITY.toLowerCase());
	readonly sleepingTime: number = process.env.MINUTES_BATTLES_INTERVAL || 30 * 60000;
	private browsers: object;

	public isReady: Promise.IThenable<any>;

	constructor() {
		this.isReady = new Promise((resolve, reject) => {
			try{
				let checks = new systemCheck();

				checks.checkForMissingConfigs();
				if (checkUpdate)
					checks.checkVersion();
				if (checks.isDebug()) {
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

				console.log('Opening browser');
				if (this.keepBrowserOpen && this.browsers.length == 0)
					this.browsers = await createBrowsers(this.accounts.length, this.headless);
				else if (!this.keepBrowserOpen)
					this.browsers = await createBrowsers(1, this.headless);

				const page = (await (this.keepBrowserOpen ? this.browsers[i] : this.browsers[0]).pages())[1];
				const allCards = new GetCards();
				const allQuests = new GetQuest();
				if(systemCheck.isDebug())
					console.log('getting user cards collection from splinterlands API...')
				const myCards = await allCards.cardsReady
					.then(() => allCards.getAllCards())
					.catch(() => console.log('cards collection api didnt respond. Did you use username? avoid email!'));
				if(systemCheck.isDebug())
					console.log('getting user quest info from splinterlands API...');

				const quest = await allQuests.getPlayerQuest(this.accountusers[i].split('@')[0]);

				if (!quest) {
					console.log('Error for quest details. Splinterlands API didnt work or you used incorrect username')
				}
				await startBotPlayMatch(page, myCards, quest, claimQuestReward, prioritizeQuest, useAPI)
					.then(() => {
						console.log('Closing battle', new Date().toLocaleString());
					})
					.catch((e) => {
						console.log(e)
					})

				await page.waitForTimeout(5000);
				if (keepBrowserOpen) {
					await page.goto('about:blank');
				} else {
					await browsers[0].close();
				}
			}
			await console.log('Waiting for the next battle in', sleepingTime / 1000 / 60, ' minutes at ', new Date(Date.now() + sleepingTime).toLocaleString());
			await console.log('Want to speed things up? or just support me? https://bunq.me/bramhammer');
			await new Promise(r => setTimeout(r, sleepingTime));
		}
	}
}
export default app