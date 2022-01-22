import fetch from "node-fetch";
import GetCards from "../splinterlands/getCards";
import {config} from "dotenv";
import fs from "fs";
config();

class teamCreator {
	historyFallback = require("../data/newHistory.json");
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
	private chosenTeam = null;
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

	async battlesFilterByManacap(mana, ruleset, summoners) {
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

	private cardsIdsforSelectedBattles = (mana, ruleset, splinters, summoners) => this.battlesFilterByManacap(mana, ruleset, summoners)
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
					.map(element => element))
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

		//check if daily quest is not completed
		console.log('quest custom option set as:', process.env.QUEST_PRIORITY, typeof process.env.QUEST_PRIORITY)
		let priorityToTheQuest = JSON.parse(process.env.QUEST_PRIORITY.toLowerCase());
		if(priorityToTheQuest && possibleTeams.length > 25 && quest && quest.total) {
			const left = quest.total - quest.completed;
			const questCheck = matchDetails.splinters.includes(quest.splinter) && left > 0;
			const filteredTeams = possibleTeams.filter(team=>team[7]===quest.splinter)
			console.log(left + ' battles left for the '+quest.splinter+' quest')
			console.log('play for the quest ',quest.splinter,'? ',questCheck)
			if(left > 0 && filteredTeams && filteredTeams.length > 5 && this.splinters.includes(quest.splinter)) {
				console.log('PLAY for the quest with Teams: ',filteredTeams.length , filteredTeams)
				const res = await this.mostWinningSummonerTankCombo(filteredTeams, matchDetails);
				console.log('Play this for the quest:', res)
				if (res[0] && res[1]) {
					this.chosenTeam = { summoner: res[0], cards: res[1] };
					return this.chosenTeam;
				}
			}
		}

		//find best combination (most used)
		const res = await this.mostWinningSummonerTankCombo(possibleTeams, matchDetails);
		console.log('Dont play for the quest, and play this:', res)
		if (res[0] && res[1]) {
			this.chosenTeam =  { summoner: res[0], cards: res[1] };
			return this.chosenTeam;
		}

		let i = 0;
		for (i = 0; i <= possibleTeams.length - 1; i++) {
			const check = this.getCards.teamActualSplinterToPlay(possibleTeams[i]);
			if (matchDetails.splinters.includes(possibleTeams[i][7]) && check !== '' && matchDetails.splinters.includes(check.toLowerCase())) {
				console.log('Less than 25 teams available. SELECTED: ', possibleTeams[i]);
				const summoner = this.getCards.makeCardId(possibleTeams[i][0].toString());
				this.chosenTeam = { summoner: summoner, cards: possibleTeams[i] };
				return this.chosenTeam;
			}
			console.log('DISCARDED: ', possibleTeams[i])
		}
		throw new Error('NO TEAM available to be played.');
	}

	async getLastBattle(player = '', data = {}) {
		const battleHistory = await fetch('https://api2.splinterlands.com/battle/history?player=' + player)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response;
			})
			.then((battleHistory) => {
				return battleHistory.json();
			})
			.catch((error) => {
				console.error('There has been a problem with your fetch operation:', error);
			});
		return battleHistory.battles[0];
	}

	extractMonster = (team) => {
		const monster1 = team.monsters[0];
		const monster2 = team.monsters[1];
		const monster3 = team.monsters[2];
		const monster4 = team.monsters[3];
		const monster5 = team.monsters[4];
		const monster6 = team.monsters[5];

		return {
			summoner_id: team.summoner.card_detail_id,
			summoner_level: team.summoner.level,
			monster_1_id: monster1 ? monster1.card_detail_id : '',
			monster_1_level: monster1 ? monster1.level : '',
			monster_1_abilities: monster1 ? monster1.abilities : '',
			monster_2_id: monster2 ? monster2.card_detail_id : '',
			monster_2_level: monster2 ? monster2.level : '',
			monster_2_abilities: monster2 ? monster2.abilities : '',
			monster_3_id: monster3 ? monster3.card_detail_id : '',
			monster_3_level: monster3 ? monster3.level : '',
			monster_3_abilities: monster3 ? monster3.abilities : '',
			monster_4_id: monster4 ? monster4.card_detail_id : '',
			monster_4_level: monster4 ? monster4.level : '',
			monster_4_abilities: monster4 ? monster4.abilities : '',
			monster_5_id: monster5 ? monster5.card_detail_id : '',
			monster_5_level: monster5 ? monster5.level : '',
			monster_5_abilities: monster5 ? monster5.abilities : '',
			monster_6_id: monster6 ? monster6.card_detail_id : '',
			monster_6_level: monster6 ? monster6.level : '',
			monster_6_abilities: monster6 ? monster6.abilities : ''
		}
	}

	extractGeneralInfo = (x) => {
		return {
			created_date: x.created_date ? x.created_date : '',
			match_type: x.match_type ? x.match_type : '',
			mana_cap: x.mana_cap ? x.mana_cap : '',
			ruleset: x.ruleset ? x.ruleset : '',
			inactive: x.inactive ? x.inactive : ''
		}
	}

	reportWin(username) {
		this.getLastBattle(username).then(lastBattle => {
			const details = JSON.parse(lastBattle.details);
			const monstersDetails = this.extractMonster(details.team1)
			const info = this.extractGeneralInfo(lastBattle)
			this.historyFallback.push({
				...monstersDetails,
				...info,
				battle_queue_id: lastBattle.battle_queue_id_1,
				player_rating_initial: lastBattle.player_1_rating_initial,
				player_rating_final: lastBattle.player_1_rating_final,
				winner: username==lastBattle.player_1?lastBattle.player_1:lastBattle.player_2,
			});
			fs.writeFile(__dirname.replace('api','data/newHistory.json'), JSON.stringify(this.historyFallback), err => {});
		});
	}

	reportLoss(username) {
		this.getLastBattle(username).then(lastBattle => {
			const details = JSON.parse(lastBattle.details);
			const monstersDetails = this.extractMonster(details.team1)
			const info = this.extractGeneralInfo(lastBattle)
			this.historyFallback.push({
				...monstersDetails,
				...info,
				battle_queue_id: lastBattle.battle_queue_id_2,
				player_rating_initial: lastBattle.player_2_rating_initial,
				player_rating_final: lastBattle.player_2_rating_final,
				winner: username!=lastBattle.player_1?lastBattle.player_1:lastBattle.player_2,
			});
			fs.writeFile(__dirname.replace('api','data/newHistory.json'), JSON.stringify(this.historyFallback), err => {});
		});
	}
}

export default teamCreator;