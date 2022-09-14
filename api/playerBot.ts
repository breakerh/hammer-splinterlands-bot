import {config} from "dotenv";
config();

import fetch from "node-fetch";
import puppeteer from "puppeteer";
import systemCheck from "./systemCheck";
import chalk from "chalk";
import teamCreator from "./teamCreator";
import connector from "./connector";
import GetCards from "../splinterlands/getCards";
import fs from "fs";
const {Webhook, MessageBuilder} = require('discord-webhook-node');
const IMAGE_URL = 'https://i.imgur.com/Ide54Jx.png';
//import getCards from "../splinterlands/getCards";

class playerBot {
	// @ts-ignore
	readonly ercThreshold: number = parseInt(process.env.ERC_THRESHOLD);
	// @ts-ignore
	readonly ratingThresholdMin: number = parseInt(process.env.RATING_MIN);
	// @ts-ignore
	readonly ratingThresholdMax: number = parseInt(process.env.RATING_MAX);

	private wins: number = 0;
	private losses: number = 0;
	private draw: number = 0;

	public getCards;
	private browsers: any = [];
	private teamCreator: teamCreator;
	private api: connector;
	private decWon: any;
	private spsWon: any;

	private hook: any = false;

	private disableDiscord: boolean = false;

	constructor(wins,losses,draw, history, disableDiscord = false, summoners=[], cardDetails=[]) {
		this.teamCreator = new teamCreator(history,summoners,cardDetails);
		this.api = new connector();
		this.wins = wins;
		this.losses = losses;
		this.draw = draw;
		this.disableDiscord = disableDiscord;

		if(!this.disableDiscord && process.env.DISCORD_BOT!==undefined && (process.env.DISCORD_BOT).length>1 && (process.env.DISCORD_BOT)!=="false") {
			this.hook = new Webhook(process.env.DISCORD_BOT);
			this.hook.setUsername(process.env.ACCUSERNAME + ' bot');
			this.hook.setAvatar(IMAGE_URL);
		}

		if(this.wins===0&&this.losses===0&&this.draw===0&&this.hook!==false) {
			const embed = new MessageBuilder()
				.setTitle('Firing up the engines!')
				.setAuthor('Splinterlands Bot', IMAGE_URL, 'https://splinterlands.com/')
				.addField('ERC threshold', this.ercThreshold.toString(), false)
				.addField('Rating Threshold Min/Max', this.ratingThresholdMin.toString() + '/' + this.ratingThresholdMax.toString(), false)
				.setColor('#212121')
				.setFooter('Want more information?, look in your npm log!')
				.setTimestamp();

			this.hook.send(embed);
		}
	}

	async createBrowsers(count: number, headless: boolean) {
		for (let i = 0; i < count; i++) {
			const browser = await puppeteer.launch({
				args: [
					'--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas','--no-first-run','--no-zygote','--disable-gpu'
				],
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
		let htmloutput = await page.content();
		fs.writeFile(`./test2.html`, htmloutput, function (err) {
			if (err) {
				console.log(err);
			}
		});
		/*let item = await page.waitForSelector('#log_in_button > button', {
			visible: true,
			timeout: 15000
		}).then(res => res)
			.catch(()=> console.log('Already logged in'))*/
		const maintenance = await page.waitForSelector('.maintenance',{ timeout:2000 }).then(e => true).catch(err => false);
		if(maintenance) {
			console.log(chalk.yellowBright('[MAINTENANCE MODE] ')+chalk.redBright('Splinterlands is in maintenance!'));
			return false;
		}
		const username = await this.getElementText(page, '.dropdown-toggle .bio__name__display', 10000);

		let htmloutput2 = await page.content();
		fs.writeFile(`./test3.html`, htmloutput2, function (err) {
			if (err) {
				console.log(err);
			}
		});
		if (username == process.env.ACCUSERNAME) {
			console.log('Already logged in!');
		} else {
			console.log(username)
			console.log('Login')
			await this.login(page)
				.catch(e=>{
				console.log(e);
				throw new Error('Login Error');
			});
			await page.goto('https://splinterlands.com/?p=battle_history');
			await page.waitForTimeout(4000);

			await page.waitForSelector('#log_in_button > button', {
				visible: true,
				timeout: 5000
			}).then(res => res)
				.catch(()=> {
					console.log('Login verified')
				})
		}

		await this.waitUntilLoaded(page);
		return true;
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
		let htmloutput2 = await page.content();
		fs.writeFile(`./test4.html`, htmloutput2, function (err) {
			if (err) {
				console.log(err);
			}
		});
		const tryLogin = async () => {
			try {
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
							.then(() => {
								console.log('logged in!')
							})
							.catch(() => {
								console.log('didnt login');
								throw new Error('Didnt login');
							})
					})
					.then(() => page.waitForTimeout(500))
			}catch (e) {
				console.error('Check that you used correctly username and posting key or email and password.')
				throw new Error(e);
			}
		}
		try {
			console.log(
				'search it'
			)
			let t = await this.clickOnElement(page, '.new-button', 15000)
			let tt = await this.clickOnElement(page, '.form-horizontal[name="keychainLogin"] > .form-group > div > a.sm-input-option.pull-right[name="emailPwLoginBtn"]', 15000)
			await tryLogin();
			/*page.waitForSelector('.new-button',{ timeout: 15000 })
				.then(async () => {

				console.log(
					'click it'
				)
				page.click('.new-button')

				console.log(
					'wait...'
				)
				await page.waitForTimeout(3000);
				console.log(
					'we waited'
				)
				await page.waitForSelector('.form-horizontal[name="keychainLogin"] > .form-group > div > a.sm-input-option.pull-right[name="emailPwLoginBtn"]')
					.then(async () => {
						try {
							page.click('.form-horizontal[name="keychainLogin"] > .form-group > div > a.sm-input-option.pull-right[name="emailPwLoginBtn"]')
						} catch (e) {
							console.error("can\t click on email/password login button")
							throw new Error(e);
						}
						await tryLogin();
					})
			}).catch(async e => {
				let htmloutput = await page.content();
				fs.writeFile(`./test.html`, htmloutput, function (err) {
					if (err) {
						console.log(err);
					}
				});
				console.error(e);
				throw new Error(e);
			})*/
		} catch (e) {
			let htmloutput = await page.content();
			fs.writeFile(`./test.html`, htmloutput, function (err) {
				if (err) {
					console.log(err);
				}
			});
			console.error('Check that you used correctly username and posting key or email and password.')
			throw new Error(e);
		}
	}

	async checkThreshold(page){
		const embed = new MessageBuilder();
			embed.setAuthor('Splinterlands Bot', IMAGE_URL, 'https://splinterlands.com/')
			.setColor('#60de15')
			.setFooter('Want more information?, look in your npm log!')
			.setTimestamp();
		if(this.ratingThresholdMin!=0&&this.ratingThresholdMax!=0){
			const userrating = await fetch("https://api2.splinterlands.com/players/details?name="+process.env.ACCUSERNAME,
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

						embed.setTitle('Fun is over.. Rating has hit threshold')
							.addField('Min/Max', this.ratingThresholdMin.toString()+' / '+this.ratingThresholdMax.toString(), false);
						console.log('Rating has hit the threshold (min: ' + this.ratingThresholdMin + ', max: ' + this.ratingThresholdMax + ')');
						return false;
					}
					embed.addField('Rating', response.rating, false);
					return true;
				})
				.catch((error) => {

					embed.setTitle('Fun is over.. Unknown error')
						.setDescription(error);
					console.error('There has been a problem with your fetch operation:', error);
					return false;
				});
			if(!userrating&&this.hook!==false) {
				embed.setColor('#ff0000');
				this.hook.send(embed);
				return;
			}
		}
		const erc = (await this.getElementTextByXpath(page, "//div[@class='dec-options'][1]/div[@class='value']/div", 1000)).split('.')[0];
		console.log('Current Energy Capture Rate is ' + erc + "%");
		if (parseInt(erc) < this.ercThreshold) {
			console.log('ERC is below threshold of ' + this.ercThreshold + '% - skipping this account');

			embed.setTitle('Fun is over.. ERC threshold hit')
				.addField('ERC Rating', erc, false)
				.setColor('#ff0000');
			if(this.hook!==false)
				this.hook.send(embed);
			return false;
		}
		embed.addField('ERC Rating', erc, false);
		if(this.hook!==false)
			this.hook.send(embed);
		return true;
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
		if (systemCheck.isDebug())
			console.info('Current page: '+page.url())
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
			await page.waitForSelector("#bh_modern_toggle", { timeout: 20000 }).then(btn=>btn.click())
			/*let battleType = (await page.$eval('#battle_category_type', el => el.innerText)).trim();
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
			}*/

		} catch (error) {
			if (systemCheck.isDebug())
				console.log("Error: couldn't find #bh_modern_toggle", error);
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
		const mana = await page.$$eval(".combat_info div.mana-cap__icon", el => el.map(x => x.getAttribute("data-original-title")));
		const manaValue = parseInt(mana[0].split(':')[1], 10);
		if (systemCheck.isDebug())
			console.log(manaValue);
		return manaValue;
	}

	async checkMatchRules(page) {
		const rules = await page.$$eval("div.combat__rules > div > div >  img", el => el.map(x => x.getAttribute("data-original-title")));
		return rules.map(x => x.split(':')[0]).join('|')
	}

	async checkMatchActiveSplinters(page) {
		const splinterUrls = await page.$$eval("div.combat__splinters > div.active_element_list > img", el => el.map(x => x.getAttribute("src")));
		return splinterUrls.map(splinter => this.splinterIsActive(splinter)).filter(x => x);
	}

	splinterIsActive(splinterUrl) {
		const splinter = splinterUrl.split('/').slice(-1)[0].replace('.svg', '').replace('icon_splinter_', '');
		return splinter.indexOf('inactive') === -1 ? splinter : '';
	}

	async buildTeam(matchDetails, quest, getCards){
		let teamToPlay;

		this.teamCreator.getCards = this.getCards;

		const possibleTeams = await this.teamCreator.possibleTeam(matchDetails,getCards).catch(e=>console.log('Error from possible team API call: ',e));

		if (possibleTeams && possibleTeams.length) {
			//console.log('Possible Teams based on your cards: ', possibleTeams.length, '\n', possibleTeams);
			console.log('Possible Teams based on your cards: ', possibleTeams.length);
		} else {
			console.log('Error:', matchDetails, possibleTeams)
			throw new Error('NO TEAMS available to be played');
		}
		teamToPlay = await this.teamCreator.teamSelection(possibleTeams, matchDetails, quest);
		return teamToPlay;
	}

	async launchBattle(page, myCards, quest, claimQuestReward, prioritizeQuest, allCards){
		try {
			if (systemCheck.isDebug())
				console.log('waiting for battle button...')
			await this.changeBattleType(page);

			await page.waitForXPath("//button[contains(., 'BATTLE')]", { timeout: 3000 })
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
								.catch(async (e) => {
									console.log('third attempt failed');
									await page.goto('https://splinterlands.io/');
									await page.waitForTimeout(3600000);
									await page.waitForXPath("//button[contains(., 'BATTLE')]", {timeout: 20000})
										.then(button => button.click())
										.catch(e => console.error('[ERROR] waiting for Battle button second time'));
									await page.waitForTimeout(5000);
									await page.waitForSelector('.btn--create-team', {timeout: 25000})
										.then(() => console.log('start the match'))
										.catch((e) => {
											console.log('third attempt failed');
											throw new Error(e);
										})
								})
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
			quest: (prioritizeQuest && quest && (quest.total != quest.completed)) ? quest : '',
		}
		console.log("splinters: ",splinters);
		console.log("Rules: ",rules);
		console.log("mana: ",mana);
		await page.waitForTimeout(2000);

		const teamToPlay = await this.buildTeam(matchDetails,quest,allCards);
		/*let htmloutput = await page.content();
		fs.writeFile(`./selectTeam.html`, htmloutput, function (err) {
			if (err) {
				console.log(err);
			}
		});*/
		if (teamToPlay)
			await page.waitForXPath(`//button[@class="btn btn--create-team"]`, { timeout: 10000 }).then(teamButton => {console.log('click');teamButton.click()});
		else
			throw new Error('Team Selection error');

		await page.waitForTimeout(10000);
		let outcome = false;
		try {
			outcome = await this.battle(page,teamToPlay,allCards)
		} catch (e) {
			if(systemCheck.isDebug())
				console.log(e);
			console.warn('No cards to select! Waiting 5 seconds')
			await page.waitForTimeout(5000);
			try {
				outcome = await this.battle(page,teamToPlay,allCards);
			} catch (e) {
				throw new Error(e);
			}
		}
		const embed = new MessageBuilder();
		if(outcome===null){
			embed.setTitle('Uhm - that\'s a draw!')
				.setAuthor('Splinterlands Bot', IMAGE_URL, 'https://splinterlands.com/')
				.addField('Wins / Losses / Draw', this.wins.toString()+' / '+this.losses.toString()+' / '+this.draw.toString(), false)
				.setColor('#cccdb3')
				.setFooter('Want more information?, look in your npm log!')
				.setTimestamp();
		}else if(outcome===true){
			embed.setTitle('Yeah - that\'s a win!')
				.setAuthor('Splinterlands Bot', IMAGE_URL, 'https://splinterlands.com/')
				.addField(this.decWon!==false?'Dec Won':'SPS won', this.decWon!==false?this.decWon:this.spsWon, false)
				.addField('Wins / Losses / Draw', this.wins.toString()+' / '+this.losses.toString()+' / '+this.draw.toString(), false)
				.setColor('#57de39')
				.setFooter('Want more information?, look in your npm log!')
				.setTimestamp();
		}else{
			embed.setTitle('Ahw - you\'ve lost!')
				.setAuthor('Splinterlands Bot', IMAGE_URL, 'https://splinterlands.com/')
				.addField('Wins / Losses / Draw', this.wins.toString()+' / '+this.losses.toString()+' / '+this.draw.toString(), false)
				.setColor('#dc2727')
				.setFooter('Want more information?, look in your npm log!')
				.setTimestamp();
		}
		if(this.hook!==false)
			this.hook.send(embed);
		return outcome;
	}

	async battle(page, teamToPlay, allCards) {

		await page.waitForXPath(`//div[@card_detail_id="${teamToPlay.summoner}"]`, { timeout: 10000 }).then(summonerButton => summonerButton.click());
		if (await allCards.color(teamToPlay.cards[0]) === 'Gold') {
			let tasplinter = allCards.teamActualSplinterToPlay(teamToPlay.cards.slice(0, 6));
			console.log('Dragon play TEAMCOLOR', tasplinter)
			await page.waitForXPath(`//div[@data-original-title="${tasplinter}"]`, { timeout: 8000 })
				.then(selector => selector.click())
		}
		await page.waitForTimeout(5000);
		let date = new Date();
		for (let i = 1; i <= 6; i++) {
			console.log('play: ', teamToPlay.cards[i].toString())
			if(teamToPlay.cards[i]) {
				await page.$$eval('.filter-attack-type.selected', selected => {
					if(selected.length>0 && selected.length<3) {
						selected.forEach(select => {
							select.click();
						})
					}
				});
				const cardid = teamToPlay.cards[i].toString();
				const click = await page.evaluate(cardid => {
					const element = document.querySelector(`div[card_detail_id="${cardid}"]`)
					if(element){
						element.scrollIntoView(false)
						return true;
					}
					return false;
				}, cardid)
				if(click){
					await page.waitForSelector(`div[card_detail_id="${cardid}"]`, {timeout: 10000})
						.then(selector => selector.click())
						.catch(async e=> {
							if (systemCheck.isDebug()) {
								console.log(e)
								console.log('normal click isn\'t working')
							}
						});
				}else if(systemCheck.isDebug())
					console.log("can't click or not found")

				await page.waitForSelector(`ul.monsters-list div[id="${teamToPlay.cards[i].toString()}"]`, {timeout: 4000}).then(element=>{
					if(systemCheck.isDebug())
						console.log('card selected');
				}).catch(async e => {
					if(systemCheck.isDebug())
						console.error('no card, repeat click?!');
					await page.waitForXPath(`//div[@card_detail_id="${teamToPlay.cards[i].toString()}"]`, {timeout: 5000})
						.then(selector => {
							if(systemCheck.isDebug())
								console.log('found it');
							try {
								selector.click();
							}catch (e) {
								console.error("[ERROR] Found, but can't click!")
							}
						}).catch(async e => {
							console.error('[ERROR] can\'t find card at all!');
							if (systemCheck.isDebug()) {
								await page.screenshot({path: 'carderror-' + teamToPlay.cards[i].toString() + '-' + date.toDateString().replace(/\s+/g, '-') + '-pre.png'});
								let htmloutput = await page.content();
								fs.writeFile(`./selectcarderror` + teamToPlay.cards[i].toString() + `.html`, htmloutput, function (err) {
									if (err) {
										console.log(err);
									}
								});
							}
						});
				});
			}else{
				console.log('nocard ', i);
			}
			await page.waitForTimeout(3000);
		}

		await page.waitForTimeout(2000);
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
		let outcome = false;
		try {
			const winner = await this.getElementText(page, '.player.winner .bio__name__display', 15000);
			if (winner.trim() == process.env.ACCUSERNAME.trim()) {
				this.wins++;
				this.decWon = false;
				this.spsWon = false;
				let newRating = false;
				try{
					newRating = await this.getElementText(page, '.player.winner .rating-total', 1000);
				}catch (e){}
				try {
					const decWon = await this.getElementText(page, '.player.winner span.dec-reward span', 1000);
					this.decWon = decWon;
					console.log(chalk.green(`You won! Reward: ${decWon} DEC; ${newRating ? `New Rating: ${newRating}` : ''}`));
				}catch (e) {
					try{
						const spsWon = await this.getElementText(page, '.player.winner span.sps-reward span', 1000);
						this.spsWon = spsWon;
						console.log(chalk.green(`You won! Reward: ${spsWon} SPS; ${newRating ? `New Rating: ${newRating}` : ''}`));
					}catch (e) {
						console.log(chalk.blueBright(`You won! ${newRating ? `New Rating: ${newRating};` : ''} But no reward yet.. sorry`))
					}
				}
				this.teamCreator.reportWin(process.env.ACCUSERNAME.trim());
				outcome = true;
			}
			else {
				this.losses++;
				console.log(chalk.red('You lost :('));
				this.teamCreator.reportLoss(process.env.ACCUSERNAME.trim());
			}
		} catch(e) {
			console.log(e);
			console.log('Could not find winner - draw?!');
			this.draw++;
			outcome = null;
		}
		await this.clickOnElement(page, '.btn--done', 1000, 2500);
		return outcome;
	}

	passCards() {
		this.teamCreator.getCards = this.getCards;
		this.teamCreator.passCards();
	}
}


export default playerBot
