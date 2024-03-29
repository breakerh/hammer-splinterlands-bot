import fetch from "node-fetch";
import {config} from "dotenv";
import fs from "fs";
import JSONStream from "JSONStream";
import chalk from "chalk";
config();
let isWriting = false;

class teamCreator {
    public historyFallback = [];//require("../data/newHistory.json");
    private basicCards:number[] = require("../data/basicCards.js");
    public cardDetails = [];
    public summoners = [{260:"fire"},{257:"water"},{437:"water"},{224:"dragon"},{189:"earth"},{145:"death"},{240:"dragon"},{167:"fire"},{438:"death"},{156:"life"},{440:"fire"},{114:"dragon"},{441:"life"},{439:"earth"},{262:"dragon"},{261:"life"},{178:"water"},{258:"death"},{27:"earth"},{38:"life"},{49:"death"},{5:"fire"},{70:"fire"},{73:"life"},{259:"earth"},{74:"death"},{72:"earth"},{442:"dragon"},{71:"water"},{88:"dragon"},{78:"dragon"},{200:"dragon"},{16:"water"},{239:"life"},{254:"water"},{235:"death"},{113:"life"},{109:"death"},{110:"fire"},{291:"dragon"},{278:"earth"},{236:"fire"},{56:"dragon"},{112:"earth"},{111:"water"},{205:"dragon"},{130:"dragon"}]
    readonly splinters = ["fire", "life", "earth", "water", "death", "dragon"]
    private chosenTeam = null;
    public getCards;
    // @ts-ignore
    public isReady: Promise.IThenable<any>;

    constructor(history,summoners = [],cardDetails=[]) {
        if(summoners.length>0)
            this.summoners = summoners;
        this.cardDetails = cardDetails;
        console.log('card',this.basicCards)
        console.log(this.basicCards.includes(157))
        const counter = 0;
        this.historyFallback = history;
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
        //return this.getCards.deck(id);
        const summonerDetails = this.summoners.find(x => x[id]);
        return summonerDetails ? summonerDetails[id] : "";
    }

    availabilityCheck(base, toCheck) { return toCheck.slice(0, 7).every(v => base.includes(v)) }

    async battlesFilterByManacap(mana, ruleset, summoners) {
        return this.historyFallback.filter( battle => battle.mana_cap == mana && (ruleset ? battle.ruleset === ruleset : true) )
    }

    private cardsIdsforSelectedBattles = (mana, ruleset, splinters, summoners, getCards) => this.battlesFilterByManacap(mana, ruleset, summoners)
        .then(x => x.map(
                (x) => {
                    return [
                        x.summoner_id ? parseInt(x.summoner_id) : "",
                        x.monster_1_id ? parseInt(x.monster_1_id) : "",
                        x.monster_2_id ? parseInt(x.monster_2_id) : "",
                        x.monster_3_id ? parseInt(x.monster_3_id) : "",
                        x.monster_4_id ? parseInt(x.monster_4_id) : "",
                        x.monster_5_id ? parseInt(x.monster_5_id) : "",
                        x.monster_6_id ? parseInt(x.monster_6_id) : "",
                        this.summonerColor(x.summoner_id) ? this.summonerColor(x.summoner_id) : "",
                        x.tot ? parseInt(x.tot) : "",
                        x.ratio ? parseInt(x.ratio) : "",
                    ]
                }
            ).filter(
                team => splinters.includes(team[7])
            ).sort((a, b) => {
                const testCards = [157, 158, 159, 160, 395, 398, 399, 161, 162, 163, 167, 400, 401, 402, 403, 440, 168, 169, 170, 171, 381, 382, 383, 384, 385, 172, 173, 174, 178, 386, 387, 388, 389, 179, 180, 181, 182, 368, 369, 183, 184, 185, 189, 372, 373, 374, 375, 439, 146, 147, 148, 149, 409, 410, 411, 412, 413, 150, 151, 152, 156, 414, 415, 416, 417, 441, 135, 136, 137, 138, 353, 354, 355, 357, 139, 140, 141, 145, 358, 359, 360, 438, 224, 190, 191, 192, 193, 423, 424, 426, 194, 195, 196, 427, 428, 429];
                //console.log(testCards)

                //console.log('testkaart',a[1])
                const t = getCards.checkReplacement(a[1]);
                //console.log('nieuwe?',t)
                let amonsters = [t];
                if(a[2]!=='') {
                    //console.log('testkaart',a[2])
                    const t2 = getCards.checkReplacement(a[2]);
                    //console.log('nieuwe?',t2)
                    amonsters.push(t2);
                }
                if(a[3]!=='') {
                    //console.log('testkaart',a[3])
                    const t3 = getCards.checkReplacement(a[3]);
                    //console.log('nieuwe?',t3)
                    amonsters.push(t3);
                }
                if(a[4]!=='') {
                    //console.log('testkaart',a[4])
                    const t4 = getCards.checkReplacement(a[4]);
                    //console.log('nieuwe?',t4)
                    amonsters.push(t4);
                }
                if(a[5]!=='') {
                   // console.log('testkaart',a[5])
                    const t5 = getCards.checkReplacement(a[5]);
                   // console.log('nieuwe?',t5)
                    amonsters.push(t5);
                }
                if(a[6]!=='') {
                   // console.log('testkaart',a[6])
                    const t6 = getCards.checkReplacement(a[6]);
                   // console.log('nieuwe?',t6)
                    amonsters.push(t6);
                }
                const maxA = amonsters.length;
                const percentageA = (amonsters.filter(mid=>!(testCards.includes(mid))).length) / maxA * 100

            //console.log('testkaart',a[1])
            const tb = getCards.checkReplacement(a[1]);
            //console.log('nieuwe?',t)
            let bmonsters = [tb];
            if(b[2]!=='') {
                //console.log('testkaart',b[2])
                const tb2 = getCards.checkReplacement(b[2]);
                //console.log('nieuwe?',t2)
                bmonsters.push(tb2);
            }
            if(b[3]!=='') {
                //console.log('testkaart',b[3])
                const tb3 = getCards.checkReplacement(b[3]);
                //console.log('nieuwe?',t3)
                bmonsters.push(tb3);
            }
            if(b[4]!=='') {
                //console.log('testkaart',b[4])
                const tb4 = getCards.checkReplacement(b[4]);
                //console.log('nieuwe?',t4)
                bmonsters.push(tb4);
            }
            if(b[5]!=='') {
                // console.log('testkaart',b[5])
                const tb5 = getCards.checkReplacement(b[5]);
                // console.log('nieuwe?',t5)
                bmonsters.push(tb5);
            }
            if(b[6]!=='') {
                // console.log('testkaart',a[6])
                const tb6 = getCards.checkReplacement(b[6]);
                // console.log('nieuwe?',t6)
                bmonsters.push(tb6);
            }
                const maxB = bmonsters.length;
                const percentageB = (bmonsters.filter(mid=>!(testCards.includes(mid))).length) / maxB * 100
                const totA = a[9];
                const totB = b[9];
                if(percentageA > percentageB && totA > 10)
                    return -1
                if(percentageA > percentageB && totA < totB && totA > 10)
                    return -1
                /*if(percentageA > percentageB && totA<20 && totB>=20)
                    return 1*/
                if((percentageA < 10 && percentageA<percentageB)||totA<totB)
                    return 1
                return 0
            })
        )

    async askFormation(matchDetails, getCards) {
        const cards = matchDetails.myCards || this.basicCards;
        const mySummoners = this.getSummoners(cards);
        console.log("INPUT: ", matchDetails.mana, matchDetails.rules, matchDetails.splinters, cards.length);
        return await this.cardsIdsforSelectedBattles(matchDetails.mana, matchDetails.rules, matchDetails.splinters, mySummoners, getCards)
            .then(x => x.filter(
                x => this.availabilityCheck(cards, x))
                .map(element => element))
    }

    async possibleTeam(matchDetails, getCards) {
        let possibleTeams = [];
        while (matchDetails.mana > 10) {
            console.log("check battles based on mana: "+matchDetails.mana)
            possibleTeams = await this.askFormation(matchDetails, getCards)
            if (possibleTeams.length > 0) {
                return possibleTeams;
            }
            matchDetails.mana--;
        }
        return possibleTeams;
    }

    async mostWinningSummonerTank(possibleTeamsList) {
        const mostWinningDeck = { fire: 0, death: 0, earth: 0, water: 0, life: 0 }
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
        console.log("BESTSUMMONER: ", bestSummoner)
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
        console.log("BEST SUMMONER and TANK", bestCombination)
        console.log(possibleTeams.slice(0,3))
        if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1 && bestCombination.secondBacklineWins > 1 && bestCombination.thirdBacklineWins > 1 && bestCombination.forthBacklineWins > 1) {
            const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline && x[3] == bestCombination.bestSecondBackline && x[4] == bestCombination.bestThirdBackline && x[5] == bestCombination.bestForthBackline)
            console.log("BEST TEAM", bestTeam)
            const summoner = bestTeam[0].toString();
            return [summoner, bestTeam];
        }
        if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1 && bestCombination.secondBacklineWins > 1 && bestCombination.thirdBacklineWins > 1) {
            const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline && x[3] == bestCombination.bestSecondBackline && x[4] == bestCombination.bestThirdBackline)
            console.log("BEST TEAM", bestTeam)
            const summoner = bestTeam[0].toString();
            return [summoner, bestTeam];
        }
        if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1 && bestCombination.secondBacklineWins > 1) {
            const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline && x[3] == bestCombination.bestSecondBackline)
            console.log("BEST TEAM", bestTeam)
            const summoner = bestTeam[0].toString();
            return [summoner, bestTeam];
        }
        if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1 && bestCombination.backlineWins > 1) {
            const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank && x[2] == bestCombination.bestBackline)
            console.log("BEST TEAM", bestTeam)
            const summoner = bestTeam[0].toString();
            return [summoner, bestTeam];
        }
        if (bestCombination.summonerWins >= 1 && bestCombination.tankWins > 1) {
            const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner && x[1] == bestCombination.bestTank)
            console.log("BEST TEAM", bestTeam)
            const summoner = bestTeam[0].toString();
            return [summoner, bestTeam];
        }
        if (bestCombination.summonerWins >= 1) {
            const bestTeam = await possibleTeams.find(x => x[0] == bestCombination.bestSummoner)
            console.log("BEST TEAM", bestTeam)
            const summoner = bestTeam[0].toString();
            return [summoner, bestTeam];
        }
    }

    async teamSelection(possibleTeams, matchDetails, quest) {
        //possibleTeams = possibleTeams.sort(this.compare);
        console.log("quest custom option set as:", process.env.QUEST_PRIORITY, typeof process.env.QUEST_PRIORITY)
        const priorityToTheQuest = JSON.parse(process.env.QUEST_PRIORITY.toLowerCase());
        if(priorityToTheQuest && possibleTeams.length > 25 && quest && quest.total) {
            const left = quest.total - quest.completed;
            const questCheck = matchDetails.splinters.includes(quest.splinter) && left > 0;
            const filteredTeams = possibleTeams.filter(team=>team[7]===quest.splinter)
            console.log(left + " battles left for the "+quest.splinter+" quest")
            console.log("play for the quest ",quest.splinter,"? ",questCheck)
            if(left > 0 && filteredTeams && filteredTeams.length > 10 && this.splinters.includes(quest.splinter)) {
                console.log("PLAY for the quest with Teams: ",filteredTeams.length , filteredTeams)
                const res = await this.mostWinningSummonerTankCombo(filteredTeams, matchDetails);
                console.log("Play this for the quest:", res)
                if (res[0] && res[1]) {
                    this.chosenTeam = { summoner: res[0], cards: res[1] };
                    return this.chosenTeam;
                }
            }
            /*if(left > 0 && filteredTeams.length > 0)
                return { summoner: filteredTeams[0][0].toString(), cards: filteredTeams[0] };*/
        }

        /*if(possibleTeams.length > 0 && possibleTeams[0][9] > 1 && possibleTeams[0][9]!==20)
            return { summoner: possibleTeams[0][0].toString(), cards: possibleTeams[0] };*/
        //find best combination (most used)
        const res = await this.mostWinningSummonerTankCombo(possibleTeams, matchDetails);
        console.log("Dont play for the quest, and play this:", res)
        if (res[0] && res[1]) {
            this.chosenTeam =  { summoner: res[0], cards: res[1] };
            return this.chosenTeam;
        }

        let i = 0;
        for (i = 0; i <= possibleTeams.length - 1; i++) {
            const check = this.getCards.teamActualSplinterToPlay(possibleTeams[i]);
            if (matchDetails.splinters.includes(possibleTeams[i][7]) && check !== "" && matchDetails.splinters.includes(check.toLowerCase())) {
                console.log("Less than 25 teams available. SELECTED: ", possibleTeams[i]);
                const summoner = this.getCards.makeCardId(possibleTeams[i][0].toString());
                this.chosenTeam = { summoner: summoner, cards: possibleTeams[i] };
                return this.chosenTeam;
            }
            console.log("DISCARDED: ", possibleTeams[i])
        }
        throw new Error("NO TEAM available to be played.");
    }

    async getLastBattle(player = "", data = {}) {
        const battleHistory = await fetch("https://api2.splinterlands.com/battle/history?player=" + player)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response;
            })
            .then((battleHistory) => {
                return battleHistory.json();
            })
            .catch((error) => {
                console.error("There has been a problem with your fetch operation:", error);
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
            monster_1_id: monster1 ? monster1.card_detail_id : "",
            monster_1_level: monster1 ? monster1.level : "",
            monster_1_abilities: monster1 ? monster1.abilities : "",
            monster_2_id: monster2 ? monster2.card_detail_id : "",
            monster_2_level: monster2 ? monster2.level : "",
            monster_2_abilities: monster2 ? monster2.abilities : "",
            monster_3_id: monster3 ? monster3.card_detail_id : "",
            monster_3_level: monster3 ? monster3.level : "",
            monster_3_abilities: monster3 ? monster3.abilities : "",
            monster_4_id: monster4 ? monster4.card_detail_id : "",
            monster_4_level: monster4 ? monster4.level : "",
            monster_4_abilities: monster4 ? monster4.abilities : "",
            monster_5_id: monster5 ? monster5.card_detail_id : "",
            monster_5_level: monster5 ? monster5.level : "",
            monster_5_abilities: monster5 ? monster5.abilities : "",
            monster_6_id: monster6 ? monster6.card_detail_id : "",
            monster_6_level: monster6 ? monster6.level : "",
            monster_6_abilities: monster6 ? monster6.abilities : ""
        }
    }

    extractGeneralInfo = (x) => {
        return {
            /*created_date: x.created_date ? x.created_date : "",*/
            match_type: x.match_type ? x.match_type : "",
            mana_cap: x.mana_cap ? x.mana_cap : "",
            ruleset: x.ruleset ? x.ruleset : "",
            inactive: x.inactive ? x.inactive : ""
        }
    }

    reportWin(username) {
        /*this.getLastBattle(username).then(lastBattle => {
            const details = JSON.parse(lastBattle.details);
            const monstersDetails = this.extractMonster(details.team1)
            const info = this.extractGeneralInfo(lastBattle)
            this.historyFallback.push({
                ...monstersDetails,
                ...info/!*,
                battle_queue_id: lastBattle.battle_queue_id_1,
                player_rating_initial: lastBattle.player_1_rating_initial,
                player_rating_final: lastBattle.player_1_rating_final,
                winner: username==lastBattle.player_1?lastBattle.player_1:lastBattle.player_2,*!/
            });
            /!*if(!isWriting){
                isWriting = true;
                console.log(chalk.bgRed.white("DON'T CLOSE THE SCRIPT, WRITING MEMORY!"));
                const writeStream = fs.createWriteStream("./data/ai_model_smart.json")
                writeStream.write(JSON.stringify(this.historyFallback));
                writeStream.on(
                    "close",
                    () => {
                        console.log(chalk.bgGreen.white("MEMORY SAVED!"));
                        isWriting = false;
                    }
                );
            }*!/
            //fs.writeFile(__dirname.replace('api','data/newHistory.json'), JSON.stringify(this.historyFallback), err => {});
            /!*if(isWriting==false) {
				const writingHistory = this.historyFallback;
				isWriting = true;
				console.log('updating history file');
				const transformStream = JSONStream.stringify();
				const outputStream = fs.createWriteStream('./data/newHistory.json');
				transformStream.pipe(outputStream);
				writingHistory.forEach(transformStream.write);
				transformStream.end();
				outputStream.on(
					"finish",
					() => isWriting = false
				);
			}*!/
        });*/
    }

    reportLoss(username) {
        /*this.getLastBattle(username).then(lastBattle => {
            const details = JSON.parse(lastBattle.details);
            const monstersDetails = this.extractMonster(details.team1)
            const info = this.extractGeneralInfo(lastBattle)
            this.historyFallback.push({
                ...monstersDetails,
                ...info/!*,
                battle_queue_id: lastBattle.battle_queue_id_2,
                player_rating_initial: lastBattle.player_2_rating_initial,
                player_rating_final: lastBattle.player_2_rating_final,
                winner: username!=lastBattle.player_1?lastBattle.player_1:lastBattle.player_2,*!/
            });
            /!*if(!isWriting){
                isWriting = true;
                console.log(chalk.bgRed.white("DON'T CLOSE THE SCRIPT, WRITING MEMORY!"));
                const writeStream = fs.createWriteStream("./data/ai_model_smart.json")
                writeStream.write(JSON.stringify(this.historyFallback));
                writeStream.on(
                    "close",
                    () => {
                        console.log(chalk.bgGreen.white("MEMORY SAVED!"));
                        isWriting = false;
                    }
                );
            }*!/
            /!*if(isWriting==false) {
				const writingHistory = this.historyFallback;
				isWriting = true;
				console.log('updating history file');
				const transformStream = JSONStream.stringify();
				const outputStream = fs.createWriteStream('./data/newHistory.json');
				transformStream.pipe(outputStream);
				writingHistory.forEach(transformStream.write);
				transformStream.end();
				outputStream.on(
					"finish",
					() => isWriting = false
				);
			}*!/
        });*/
    }

    passCards() {

    }
}

export default teamCreator;