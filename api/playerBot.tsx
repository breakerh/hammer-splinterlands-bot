import * as puppeteer from "puppeteer";
import systemCheck from "./systemCheck";
import * as chalk from "chalk";

class playerBot {
	readonly ercThreshold: number = parseInt(process.env.ERC_THRESHOLD);
	readonly ratingThresholdMin: number = parseInt(process.env.RATING_MIN);
	readonly ratingThresholdMax: number = parseInt(process.env.RATING_MAX);

	private useAPI;

	private browsers: any = [];

	constructor() {

	}

	async createBrowsers(count, headless) {
		for (let i = 0; i < count; i++) {
			const browser = await puppeteer.launch({
				headless: headless,
			});
			const page = await browser.newPage();
			await page.setDefaultNavigationTimeout(500000);
			await page.on('dialog', async dialog => {
				await dialog.accept();
			});

			this.browsers[i] = browser;
		}

		return this.browsers;
	}

	async prepare(page) {
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36');
		await page.setViewport({
			width: 1920,
			height: 1080,
			deviceScaleFactor: 1,
		});

		await page.goto('https://splinterlands.com/?p=battle_history');
		await page.waitForTimeout(4000);

		let item = await page.waitForSelector('#log_in_button > button', {
			visible: true,
			timeout: 15000
		}).then(res => res)
			.catch(()=> console.log('Already logged in'))

		if (item != undefined){
			console.log('Login')
			await this.login(page).catch(e=>{
				console.log(e);
				throw new Error('Login Error');
			});
		}

		await this.waitUntilLoaded(page);
	}

	async waitUntilLoaded(page) {
		try {
			await page.waitForSelector('.loading', { timeout: 6000 })
				.then(() => {
					if(systemCheck.isDebug())
						console.log('Waiting until page is loaded...');
				});
		} catch (e) {
			console.info('No loading circle...')
			return;
		}

		await page.waitForFunction(() => !document.querySelector('.loading'), { timeout: 120000 });
	}

	async login(page) {
		try {
			page.waitForSelector('#log_in_button > button').then(() => page.click('#log_in_button > button'))
			await page.waitForSelector('#email')
				.then(() => page.waitForTimeout(3000))
				.then(() => page.focus('#email'))
				.then(() => page.type('#email', process.env.EMAIL))
				.then(() => page.focus('#password'))
				.then(() => page.type('#password', process.env.PASSWORD))
				.then(() => page.keyboard.press('Enter'))
				.then(() => page.waitForTimeout(8000))
				.then(async () => {
					await page.waitForSelector('#log_in_text', {
						visible: true, timeout: 3000
					})
						.then(()=>{
							console.log('logged in!')
						})
						.catch(()=>{
							console.log('didnt login');
							throw new Error('Didnt login');
						})
				})
				.then(() => page.waitForTimeout(500))
		} catch (e) {
			throw new Error('Check that you used correctly username and posting key or email and password.');
		}
	}

	async checkThreshold(page){
		if(this.ratingThresholdMin!=0&&this.ratingThresholdMax!=0){
			const userrating = await fetch("https://api.splinterlands.io/players/details?name="+process.env.ACCUSERNAME,
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
				.then((response) => {
					let rating: number = parseInt(response.rating);
					console.log('Current Rating is ' + rating);
					if (rating < this.ratingThresholdMin || (this.ratingThresholdMax !== 0 && rating > this.ratingThresholdMax)){
						console.log('Rating has hit the threshold (min: ' + this.ratingThresholdMin + ', max: ' + this.ratingThresholdMax + ')');
						return false;
					}
					return true;
				})
				.catch((error) => {
					console.error('There has been a problem with your fetch operation:', error);
					return false;
				});
			if(!userrating)
				return;
		}
		const erc = (await this.getElementTextByXpath(page, "//div[@class='dec-options'][1]/div[@class='value'][2]/div", 100)).split('.')[0];
		console.log('Current Energy Capture Rate is ' + erc + "%");
		if (parseInt(erc) < this.ercThreshold) {
			console.log('ERC is below threshold of ' + this.ercThreshold + '% - skipping this account');
			return false;
		}
	}

	async getElementText(page, selector, timeout=20000) {
		const element = await page.waitForSelector(selector,  { timeout: timeout });
		return await element.evaluate(el => el.textContent);
	}

	async getElementTextByXpath(page, selector, timeout=20000) {
		const element = await page.waitForXPath(selector,  { timeout: timeout });
		return await element.evaluate(el => el.textContent);
	}

	async closePopups(page) {
		try {
			if (await this.clickOnElement(page, '.close', 4000)) return;
			await this.clickOnElement(page, '.modal-close-new', 1000);
		}catch (e) {
			if (systemCheck.isDebug())
				console.log('Clouldn\'t close popup.');
		}
	}

	async  clickOnElement(page, selector, timeout=20000, delayBeforeClicking = 0) {
		try {
			const elem = await page.waitForSelector(selector, { timeout: timeout });
			if(elem) {
				await systemCheck.sleep(delayBeforeClicking);
				if (systemCheck.isDebug())
					console.log('Clicking element', selector);
				await elem.click();
				return true;
			}
		} catch (e) {
		}
		if (systemCheck.isDebug())
			console.log('Error: Could not find element', selector);
		return false;
	}

	async changePage(page,force=false){
		if (!page.url().includes("battle_history")||force) {
			try {
				await page.waitForSelector('#menu_item_battle', { timeout: 6000 })
					.then(button => button.click());
			} catch (e) {
				if (systemCheck.isDebug())
					console.info('fight button not found')
			}
			await page.waitForTimeout(3000);
		}
		return;
	}

	async seasonAward(page){
		try {
			if(systemCheck.isDebug())
				console.log('Season reward check: ');
			await page.waitForSelector('#claim-btn', { visible:true, timeout: 3000 })
				.then(async (button) => {
					button.click();
					console.log(`claiming the season reward.`);
					await page.waitForTimeout(20000);
				})
				.catch(()=>{
					if (systemCheck.isDebug())
						console.log('no season reward to be claimed.')
				});
		}
		catch (e) {
			if (systemCheck.isDebug())
			console.info('no season reward to be claimed')
		}
	}

	async questAward(page, quest){
		if (systemCheck.isDebug())
			console.log('Quest details: ', quest);
		try {
			await page.waitForSelector('#quest_claim_btn', { timeout: 20000 })
				.then(button => button.click());
		} catch (e) {
			if (systemCheck.isDebug())
				console.info('no quest reward to be claimed waiting for the battle...')
		}

		await page.waitForTimeout(1000);
	}

	async changeBattleType(page) {
		try {
			await page.waitForSelector("#battle_category_type", { timeout: 20000 })
			let battleType = (await page.$eval('#battle_category_type', el => el.innerText)).trim();
			while (battleType !== "RANKED") {
				if (systemCheck.isDebug())
					console.log("Wrong battleType! battleType is", battleType, "Trying to change it");
				try {
					await page.waitForSelector('#right_slider_btn', { timeout: 500 })
						.then(button => button.click());
				} catch (e) {
					if (systemCheck.isDebug())
						console.info('Slider button not found', e)
				}
				await page.waitForTimeout(1000);
				battleType = (await page.$eval('#battle_category_type', el => el.innerText)).trim();
			}
		} catch (error) {
			if (systemCheck.isDebug())
				console.log("Error: couldn't find battle category type", error);
		}
	}

	async checkMana(page) {
		const manas = await page.evaluate(() => {
			// @ts-ignore
			const manaCap = document.querySelectorAll('div.mana-total > span.mana-cap')[0].innerText;
			// @ts-ignore
			const manaUsed = document.querySelectorAll('div.mana-total > span.mana-used')[0].innerText;
			const manaLeft = manaCap - manaUsed
			return { manaCap, manaUsed, manaLeft };
		});
		if (systemCheck.isDebug())
			console.log('manaLimit', manas);
		return manas;
	}

	async checkMatchMana(page) {
		const mana = await page.$$eval("div.col-md-12 > div.mana-cap__icon", el => el.map(x => x.getAttribute("data-original-title")));
		const manaValue = parseInt(mana[0].split(':')[1], 10);
		if (systemCheck.isDebug())
			console.log(manaValue);
		return manaValue;
	}

	async checkMatchRules(page) {
		const rules = await page.$$eval("div.combat__rules > div.row > div>  img", el => el.map(x => x.getAttribute("data-original-title")));
		return rules.map(x => x.split(':')[0]).join('|')
	}

	async checkMatchActiveSplinters(page) {
		const splinterUrls = await page.$$eval("div.col-sm-4 > img", el => el.map(x => x.getAttribute("src")));
		return splinterUrls.map(splinter => this.splinterIsActive(splinter)).filter(x => x);
	}

	splinterIsActive(splinterUrl) {
		const splinter = splinterUrl.split('/').slice(-1)[0].replace('.svg', '').replace('icon_splinter_', '');
		return splinter.indexOf('inactive') === -1 ? splinter : '';
	}

	async buildTeam(matchDetails, quest){
		let teamToPlay;
		if (this.useAPI) {
			const apiResponse = await api.getPossibleTeams(matchDetails);
			if (apiResponse && !JSON.stringify(apiResponse).includes('api limit reached')) {
				console.log('API Response', apiResponse);

				teamToPlay = { summoner: Object.values(apiResponse)[1], cards: [ Object.values(apiResponse)[1], Object.values(apiResponse)[3], Object.values(apiResponse)[5], Object.values(apiResponse)[7], Object.values(apiResponse)[9],
						Object.values(apiResponse)[11], Object.values(apiResponse)[13], Object.values(apiResponse)[15] ] };

				console.log('api team', teamToPlay);

				if (Object.values(apiResponse)[1] == '') {
					console.log('Seems like the API found no possible team - using local history');
					const possibleTeams = await ask.possibleTeams(matchDetails).catch(e=>console.log('Error from possible team API call: ',e));
					teamToPlay = await ask.teamSelection(possibleTeams, matchDetails, quest);
				}
			}
			else {
				if (apiResponse && JSON.stringify(apiResponse).includes('api limit reached')) {
					console.log('API limit per hour reached, using local backup!');
					console.log('Visit discord or telegram group to learn more about API limits: https://t.me/ultimatesplinterlandsbot and https://discord.gg/hwSr7KNGs9');
				} else {
					console.log('API failed, using local history with most cards used tactic');
				}
				const possibleTeams = await ask.possibleTeams(matchDetails).catch(e=>console.log('Error from possible team API call: ',e));

				if (possibleTeams && possibleTeams.length) {
					//console.log('Possible Teams based on your cards: ', possibleTeams.length, '\n', possibleTeams);
					console.log('Possible Teams based on your cards: ', possibleTeams.length);
				} else {
					console.log('Error:', matchDetails, possibleTeams)
					throw new Error('NO TEAMS available to be played');
				}
				teamToPlay = await ask.teamSelection(possibleTeams, matchDetails, quest);
				this.useAPI = false;
			}
		} else {
			const possibleTeams = await ask.possibleTeams(matchDetails).catch(e=>console.log('Error from possible team API call: ',e));

			if (possibleTeams && possibleTeams.length) {
				//console.log('Possible Teams based on your cards: ', possibleTeams.length, '\n', possibleTeams);
				console.log('Possible Teams based on your cards: ', possibleTeams.length);
			} else {
				console.log('Error:', matchDetails, possibleTeams)
				throw new Error('NO TEAMS available to be played');
			}
			teamToPlay = await ask.teamSelection(possibleTeams, matchDetails, quest);
			this.useAPI = false;
		}
		return teamToPlay;
	}

	async launchBattle(page, myCards, quest, claimQuestReward, prioritizeQuest, useAPI, allCards){
		this.useAPI = useAPI;
		try {
			if (systemCheck.isDebug())
				console.log('waiting for battle button...')
			await this.changeBattleType(page);

			await page.waitForXPath("//button[contains(., 'BATTLE')]", { timeout: 1000 })
				.then(button => {
					if (systemCheck.isDebug())
						console.log('Battle button clicked');
					button.click()
				})
				.catch(e=>{
					if (systemCheck.isDebug())
						console.error('[ERROR] waiting for Battle button. is Splinterlands in maintenance?')
				});
			await page.waitForTimeout(5000);
			if (systemCheck.isDebug())
				console.log('waiting for an opponent...')
			await page.waitForSelector('.btn--create-team', { timeout: 25000 })
				.then(()=>console.log('start the match'))
				.catch(async (e)=> {
					console.error('[Error while waiting for battle]');
					if (systemCheck.isDebug())
						console.log('Clicking fight menu button again');
					await this.changePage(page,true);
					if (systemCheck.isDebug())
						console.error('Refreshing the page and retrying to retrieve a battle');
					await page.waitForTimeout(2000);
					await page.reload();
					await page.waitForTimeout(5000);
					await page.waitForSelector('.btn--create-team', { timeout: 50000 })
						.then(()=>console.log('start the match'))
						.catch(async ()=>{
							console.log('second attempt failed reloading from homepage...');
							await page.goto('https://splinterlands.io/');
							await page.waitForTimeout(5000);
							await page.waitForXPath("//button[contains(., 'BATTLE')]", { timeout: 20000 })
								.then(button => button.click())
								.catch(e=>console.error('[ERROR] waiting for Battle button second time'));
							await page.waitForTimeout(5000);
							await page.waitForSelector('.btn--create-team', { timeout: 25000 })
								.then(()=>console.log('start the match'))
								.catch((e)=>{
									console.log('third attempt failed');
									throw new Error(e);})
						})
				})
		} catch(e) {
			console.error('[Battle cannot start]:', e)
			throw new Error('The Battle cannot start');

		}
		await page.waitForTimeout(10000);
		let [mana, rules, splinters] = await Promise.all([
			this.checkMatchMana(page).then((mana) => mana).catch(() => 'no mana'),
			this.checkMatchRules(page).then((rulesArray) => rulesArray).catch(() => 'no rules'),
			this.checkMatchActiveSplinters(page).then((splinters) => splinters).catch(() => 'no splinters')
		]);

		const matchDetails = {
			mana: mana,
			rules: rules,
			splinters: splinters,
			myCards: myCards,
			quest: (prioritizeQuest && quest) ? quest : '',
		}

		await page.waitForTimeout(2000);

		const teamToPlay = await this.buildTeam(matchDetails,quest);

		if (teamToPlay)
			page.click('.btn--create-team')[0];
		else
			throw new Error('Team Selection error');

		await page.waitForTimeout(5000);
		try {
			await page.waitForXPath(`//div[@card_detail_id="${teamToPlay.summoner}"]`, { timeout: 10000 }).then(summonerButton => summonerButton.click());
			if (allCards.color(teamToPlay.cards[0]) === 'Gold') {
				console.log('Dragon play TEAMCOLOR', allCards.teamActualSplinterToPlay(teamToPlay.cards.slice(0, 6)))
				await page.waitForXPath(`//div[@data-original-title="${allCards.teamActualSplinterToPlay(teamToPlay.cards.slice(0, 6))}"]`, { timeout: 8000 })
					.then(selector => selector.click())
			}
			await page.waitForTimeout(5000);
			for (let i = 1; i <= 6; i++) {
				console.log('play: ', teamToPlay.cards[i].toString())
				await teamToPlay.cards[i] ? page.waitForXPath(`//div[@card_detail_id="${teamToPlay.cards[i].toString()}"]`, { timeout: 10000 })
					.then(selector => selector.click()) : console.log('nocard ', i);
				await page.waitForTimeout(1000);
			}

			await page.waitForTimeout(5000);
			try {
				await page.click('.btn-green')[0]; //start fight
			} catch {
				console.log('Start Fight didnt work, waiting 5 sec and retry');
				await page.waitForTimeout(5000);
				await page.click('.btn-green')[0]; //start fight
			}
			await page.waitForTimeout(5000);
			await page.waitForSelector('#btnRumble', { timeout: 90000 }).then(()=>console.log('btnRumble visible')).catch(()=>console.log('btnRumble not visible'));
			await page.waitForTimeout(5000);
			await page.$eval('#btnRumble', elem => elem.click()).then(()=>console.log('btnRumble clicked')).catch(()=>console.log('btnRumble didnt click')); //start rumble
			await page.waitForSelector('#btnSkip', { timeout: 10000 }).then(()=>console.log('btnSkip visible')).catch(()=>console.log('btnSkip not visible'));
			await page.$eval('#btnSkip', elem => elem.click()).then(()=>console.log('btnSkip clicked')).catch(()=>console.log('btnSkip not visible')); //skip rumble
			try {
				const winner = await this.getElementText(page, 'section.player.winner .bio__name__display', 15000);
				if (winner.trim() == process.env.ACCUSERNAME.trim()) {
					const decWon = await this.getElementText(page, '.player.winner span.dec-reward span', 1000);
					console.log(chalk.green('You won! Reward: ' + decWon + ' DEC'));
				}
				else {
					console.log(chalk.red('You lost :('));
					if (useAPI)
						api.reportLoss(winner);
				}
			} catch(e) {
				console.log(e);
				console.log('Could not find winner - draw?');
			}
			await this.clickOnElement(page, '.btn--done', 1000, 2500);
		} catch (e) {
			throw new Error(e);
		}
	}
}


export default playerBot