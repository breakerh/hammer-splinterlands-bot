import fetch from "node-fetch";
import GetCards from "../splinterlands/getCards";
import {config} from "dotenv";
config();

class teamCreator {
	readonly historyFallback = require("../data/newHistory.json");
	readonly basicCards = require('../data/basicCards.js');
	readonly summoners = [{ 224: 'dragon' },
		{ 27: 'earth' },
		{ 16: 'water' },
		{ 156: 'life' },
		{ 189: 'earth' },
		{ 167: 'fire' },
		{ 145: 'death' },
		{ 5: 'fire' },
		{ 71: 'water' },
		{ 114: 'dragon' },
		{ 178: 'water' },
		{ 110: 'fire' },
		{ 49: 'death' },
		{ 88: 'dragon' },
		{ 38: 'life' },
		{ 239: 'life' },
		{ 74: 'death' },
		{ 78: 'dragon' },
		{ 260: 'fire' },
		{ 70: 'fire' },
		{ 109: 'death' },
		{ 111: 'water' },
		{ 112: 'earth' },
		{ 130: 'dragon' },
		{ 72: 'earth' },
		{ 235: 'dragon' },
		{ 56: 'dragon' },
		{ 113: 'life' },
		{ 200: 'dragon' },
		{ 236: 'fire' },
		{ 240: 'dragon' },
		{ 254: 'water' },
		{ 257: 'water' },
		{ 258: 'death' },
		{ 259: 'earth' },
		{ 261: 'life' },
		{ 262: 'dragon' },
		{ 278: 'earth' },
		{ 73: 'life' }]
	readonly splinters = ['fire', 'life', 'earth', 'water', 'death', 'dragon']
	private getCards = new GetCards();

	constructor() {
	}

	getSummoners(myCards) {
		try {
			const sumArray = this.summoners.map(x=>Number(Object.keys(x)[0]))
			return myCards.filter(value => sumArray.includes(Number(value)));
		} catch(e) {
			console.log(e);
			return [];
		}
	}

	summonerColor(id) {
		const summonerDetails = this.summoners.find(x => x[id]);
		return summonerDetails ? summonerDetails[id] : '';
	}

	availabilityCheck(base, toCheck) { return toCheck.slice(0, 7).every(v => base.includes(v)) }

	async getBattlesWithRuleset(ruleset, mana, summoners) {
		const rulesetEncoded = encodeURIComponent(ruleset);
		const host = process.env.API_URL || 'https://splinterlands-data-service.herokuapp.com/'

		let url = ''
		const useClassicPrivateAPI = JSON.parse(process.env.USE_CLASSIC_BOT_PRIVATE_API.toLowerCase());
		if (useClassicPrivateAPI)
			url = `battlesruleset?ruleset=${rulesetEncoded}&mana=${mana}&player=${process.env.ACCUSERNAME}&summoners=${summoners ? JSON.stringify(summoners) : ''}`;
		console.log('API call: ', host+url)
		return fetch(host+url)
			.then(x => x && x.json())
			.then(data => data)
			.catch((e) => console.log('fetch ', e))
	}

	async battlesFilterByManacap(mana, ruleset, summoners) {
		const backupLength = this.historyFallback && this.historyFallback.length
		const useClassicPrivateAPI = JSON.parse(process.env.USE_CLASSIC_BOT_PRIVATE_API.toLowerCase());
		if (useClassicPrivateAPI) {
			const history = await this.getBattlesWithRuleset(ruleset, mana, summoners);
			if (history) {
				console.log('API battles returned ', history.length)
				return history.filter(
					battle =>
						battle.mana_cap == mana &&
						(ruleset ? battle.ruleset === ruleset : true)
				)
			}
		}
		console.log('Using Backup ', backupLength)

		return this.historyFallback.filter( battle => battle.mana_cap == mana && (ruleset ? battle.ruleset === ruleset : true) )
	}

	compare(a, b) {
		const totA = a[9];
		const totB = b[9];

		let comparison = 0;
		if (totA < totB) {
			comparison = 1;
		} else if (totA > totB) {
			comparison = -1;
		}
		return comparison;
	}

	private cardsIdsforSelectedBattles = async (mana, ruleset, splinters, summoners) => await this.battlesFilterByManacap(mana, ruleset, summoners)
		.then(x => x.map(
				(x) => {
					return [
						x.summoner_id ? parseInt(x.summoner_id) : '',
						x.monster_1_id ? parseInt(x.monster_1_id) : '',
						x.monster_2_id ? parseInt(x.monster_2_id) : '',
						x.monster_3_id ? parseInt(x.monster_3_id) : '',
						x.monster_4_id ? parseInt(x.monster_4_id) : '',
						x.monster_5_id ? parseInt(x.monster_5_id) : '',
						x.monster_6_id ? parseInt(x.monster_6_id) : '',
						this.summonerColor(x.summoner_id) ? this.summonerColor(x.summoner_id) : '',
						x.tot ? parseInt(x.tot) : '',
						x.ratio ? parseInt(x.ratio) : '',
					]
				}
			).filter(
				team => splinters.includes(team[7])
			).sort(this.compare)
		)

	async askFormation(matchDetails) {
		const cards = matchDetails.myCards || this.basicCards;
		const mySummoners = this.getSummoners(cards);
		console.log('INPUT: ', matchDetails.mana, matchDetails.rules, matchDetails.splinters, cards.length);
		return await this.cardsIdsforSelectedBattles(matchDetails.mana, matchDetails.rules, matchDetails.splinters, mySummoners)
			.then(x => x.filter(
					x => this.availabilityCheck(cards, x))
					.map(element => element)//cards.cardByIds(element)
			)
	}

	async possibleTeam(matchDetails) {
		let possibleTeams = [];
		while (matchDetails.mana > 10) {
			console.log('check battles based on mana: '+matchDetails.mana)
			possibleTeams = await this.askFormation(matchDetails)
			if (possibleTeams.length > 0) {
				return possibleTeams;
			}
			matchDetails.mana--;
		}
		return possibleTeams;
	}

	async mostWinningSummonerTank(possibleTeamsList) {
		let mostWinningDeck = { fire: 0, death: 0, earth: 0, water: 0, life: 0 }
		const mostWinningSummoner = {};
		const mostWinningTank = {};
		const mostWinningBackline = {};
		const mostWinningSecondBackline = {};
		const mostWinningThirdBackline = {};
		const mostWinningForthBackline = {};
		possibleTeamsList.forEach(x => {
			const summoner = x[0];
			mostWinningSummoner[summoner] = mostWinningSummoner[summoner] ? mostWinningSummoner[summoner] + 1 : 1;
		})
		const bestSummoner = Object.keys(mostWinningSummoner).length && Object.keys(mostWinningSummoner).reduce((a, b) => mostWinningSummoner[a] > mostWinningSummoner[b] ? a : b);
		console.log('BESTSUMMONER: ', bestSummoner)
		if (bestSummoner) {
			possibleTeamsList.filter(team => team[0] == bestSummoner).forEach(team => {
				const tank = team[1];
				mostWinningTank[tank] = mostWinningTank[tank] ? mostWinningTank[tank] + 1 : 1;
			})
			const bestTank = mostWinningTank && Object.keys(mostWinningTank).length && Object.keys(mostWinningTank).reduce((a, b) => mostWinningTank[a] > mostWinningTank[b] ? a : b);

			if (bestTank) {
				possibleTeamsList.filter(team => team[0] == bestSummoner && team[1] == bestTank).forEach(team => {
					const backline = team[2];
					mostWinningBackline[backline] = mostWinningBackline[backline] ? mostWinningBackline[backline] + 1 : 1;
				})
				const bestBackline = mostWinningBackline && Object.keys(mostWinningBackline).length && Object.keys(mostWinningBackline).reduce((a, b) => mostWinningBackline[a] > mostWinningBackline[b] ? a : b);

				if (bestBackline) {
					possibleTeamsList.filter(team => team[0] == bestSummoner && team[1] == bestTank && team[2] == bestBackline).forEach(team => {
						const secondBackline = team[3];
						mostWinningSecondBackline[secondBackline] = mostWinningSecondBackline[secondBackline] ? mostWinningSecondBackline[secondBackline] + 1 : 1;
					})
					const bestSecondBackline = mostWinningSecondBackline && Object.keys(mostWinningSecondBackline).length && Object.keys(mostWinningSecondBackline).reduce((a, b) => mostWinningSecondBackline[a] > mostWinningSecondBackline[b] ? a : b);

					if (bestSecondBackline) {
						possibleTeamsList.filter(team => team[0] == bestSummoner && team[1] == bestTank && team[2] == bestBackline && team[3] == bestSecondBackline).forEach(team => {
							const thirdBackline = team[4];
							mostWinningThirdBackline[thirdBackline] = mostWinningThirdBackline[thirdBackline] ? mostWinningThirdBackline[thirdBackline] + 1 : 1;
						})
						const bestThirdBackline = mostWinningThirdBackline && Object.keys(mostWinningThirdBackline).length && Object.keys(mostWinningThirdBackline).reduce((a, b) => mostWinningThirdBackline[a] > mostWinningThirdBackline[b] ? a : b);

						if (bestThirdBackline) {
							possibleTeamsList.filter(team => team[0] == bestSummoner && team[1] == bestTank && team[2] == bestBackline && team[3] == bestSecondBackline && team[4] == bestThirdBackline).forEach(team => {
								const forthBackline = team[5];
								mostWinningForthBackline[forthBackline] = mostWinningForthBackline[forthBackline] ? mostWinningForthBackline[forthBackline] + 1 : 1;
							})
							const bestForthBackline = mostWinningForthBackline && Object.keys(mostWinningForthBackline).length && Object.keys(mostWinningForthBackline).reduce((a, b) => mostWinningForthBackline[a] > mostWinningForthBackline[b] ? a : b);

							return {
								bestSummoner: bestSummoner,
								summonerWins: mostWinningSummoner[bestSummoner],
								tankWins: mostWinningTank[bestTank],
								bestTank: bestTank,
								bestBackline: bestBackline,
								backlineWins: mostWinningBackline[bestBackline],
								bestSecondBackline: bestSecondBackline,
								secondBacklineWins: mostWinningSecondBackline[bestSecondBackline],
								bestThirdBackline: bestThirdBackline,
								thirdBacklineWins: mostWinningThirdBackline[bestThirdBackline],
								bestForthBackline: bestForthBackline,
								forthBacklineWins: mostWinningForthBackline[bestForthBackline]
							}
						}

						return {
							bestSummoner: bestSummoner,
							summonerWins: mostWinningSummoner[bestSummoner],
							tankWins: mostWinningTank[bestTank],
							bestTank: bestTank,
							bestBackline: bestBackline,
							backlineWins: mostWinningBackline[bestBackline],
							bestSecondBackline: bestSecondBackline,
							secondBacklineWins: mostWinningSecondBackline[bestSecondBackline],
							bestThirdBackline: bestThirdBackline,
							thirdBacklineWins: mostWinningThirdBackline[bestThirdBackline]
						}
					}

					return {
						bestSummoner: bestSummoner,
						summonerWins: mostWinningSummoner[bestSummoner],
						tankWins: mostWinningTank[bestTank],
						bestTank: bestTank,
						bestBackline: bestBackline,
						backlineWins: mostWinningBackline[bestBackline],
						bestSecondBackline: bestSecondBackline,
						secondBacklineWins: mostWinningSecondBackline[bestSecondBackline]
					}
				}

				return {
					bestSummoner: bestSummoner,
					summonerWins: mostWinningSummoner[bestSummoner],
					tankWins: mostWinningTank[bestTank],
					bestTank: bestTank,
					bestBackline: bestBackline,
					backlineWins: mostWinningBackline[bestBackline]
				}
			}

			return {
				bestSummoner: bestSummoner,
				summonerWins: mostWinningSummoner[bestSummoner],
				tankWins: mostWinningTank[bestTank],
				bestTank: bestTank
			}
		}
		return {
	bestSummoner: bestSummoner,
	summonerWins: mostWinningSummoner[bestSummoner]
}
	}

	async mostWinningSummonerTankCombo(possibleTeams, matchDetails) {
		const bestCombination = await this.mostWinningSummonerTank(possibleTeams)
		console.log('BEST SUMMONER and TANK', bestCombination)
		if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1 && bestCombination.secondBacklineWins > 1 && bestCombination.thirdBacklineWins > 1 && bestCombination.forthBacklineWins > 1) {
			const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline && x[3] == bestCombination.bestSecondBackline && x[4] == bestCombination.bestThirdBackline && x[5] == bestCombination.bestForthBackline)
			console.log('BEST TEAM', bestTeam)
			const summoner = bestTeam[0].toString();
			return [summoner, bestTeam];
		}
		if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1 && bestCombination.secondBacklineWins > 1 && bestCombination.thirdBacklineWins > 1) {
			const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline && x[3] == bestCombination.bestSecondBackline && x[4] == bestCombination.bestThirdBackline)
			console.log('BEST TEAM', bestTeam)
			const summoner = bestTeam[0].toString();
			return [summoner, bestTeam];
		}
		if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1 && bestCombination.secondBacklineWins > 1) {
			const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline && x[3] == bestCombination.bestSecondBackline)
			console.log('BEST TEAM', bestTeam)
			const summoner = bestTeam[0].toString();
			return [summoner, bestTeam];
		}
		if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1) {
			const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline)
			console.log('BEST TEAM', bestTeam)
			const summoner = bestTeam[0].toString();
			return [summoner, bestTeam];
		}
		if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1) {
			const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank)
			console.log('BEST TEAM', bestTeam)
			const summoner = bestTeam[0].toString();
			return [summoner, bestTeam];
		}
		if (bestCombination.summonerWins >= 1) {
			const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner)
			console.log('BEST TEAM', bestTeam)
			const summoner = bestTeam[0].toString();
			return [summoner, bestTeam];
		}
	}

	async teamSelection(possibleTeams, matchDetails, quest) {
		const useClassicPrivateAPI = JSON.parse(process.env.USE_CLASSIC_BOT_PRIVATE_API.toLowerCase());
		//TEST V2 Strategy ONLY FOR PRIVATE API
		if (useClassicPrivateAPI && possibleTeams[0][8]) {
			console.log('play the most winning: ', possibleTeams[0])
			return { summoner: possibleTeams[0][0], cards: possibleTeams[0] };
		}

		//check if daily quest is not completed
		console.log('quest custom option set as:', process.env.QUEST_PRIORITY, typeof process.env.QUEST_PRIORITY)
		let priorityToTheQuest = JSON.parse(process.env.QUEST_PRIORITY.toLowerCase());
		if(priorityToTheQuest && possibleTeams.length > 25 && quest && quest.total) {
			const left = quest.total - quest.completed;
			const questCheck = matchDetails.splinters.includes(quest.splinter) && left > 0;
			const filteredTeams = possibleTeams.filter(team=>team[7]===quest.splinter)
			console.log(left + ' battles left for the '+quest.splinter+' quest')
			console.log('play for the quest ',quest.splinter,'? ',questCheck)
			if(left > 0 && filteredTeams && filteredTeams.length > 10 && this.splinters.includes(quest.splinter)) {
				console.log('PLAY for the quest with Teams: ',filteredTeams.length , filteredTeams)
				const res = await this.mostWinningSummonerTankCombo(filteredTeams, matchDetails);
				console.log('Play this for the quest:', res)
				if (res[0] && res[1]) {
					return { summoner: res[0], cards: res[1] };
				}
			}
		}

		//find best combination (most used)
		const res = await this.mostWinningSummonerTankCombo(possibleTeams, matchDetails);
		console.log('Dont play for the quest, and play this:', res)
		if (res[0] && res[1]) {
			return { summoner: res[0], cards: res[1] };
		}

		let i = 0;
		for (i = 0; i <= possibleTeams.length - 1; i++) {
			const check = await this.getCards.teamActualSplinterToPlay(possibleTeams[i]);
			if (matchDetails.splinters.includes(possibleTeams[i][7]) && check !== '' && matchDetails.splinters.includes(check.toLowerCase())) {
				console.log('Less than 25 teams available. SELECTED: ', possibleTeams[i]);
				const summoner = this.getCards.makeCardId(possibleTeams[i][0].toString());
				return { summoner: summoner, cards: possibleTeams[i] };
			}
			console.log('DISCARDED: ', possibleTeams[i])
		}
		throw new Error('NO TEAM available to be played.');
	}
}

export default teamCreator;