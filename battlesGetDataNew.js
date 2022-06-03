const fetch = require("node-fetch")
const fs = require("fs")
const moment = require("moment")

const _usersToGrab = require("./data/userSelection")
const JSONStream = require("JSONStream");

const wait = delay => new Promise((resolve) => setTimeout(resolve, delay))
const getBattleHistory = async (player = "", tries = 2) => {
    console.log("History for "+player);
    const onError = (Err) => {
        console.log(Err);
        console.error("Looks like there's a short ban. Waiting 10 minutes. " + tries + " left!")
        const triesLeft = tries - 1
        if (!triesLeft)
            throw Err;
        return wait(600000).then(async () => await getBattleHistory(player, triesLeft));
    };
    return await fetch("https://api2.splinterlands.com/battle/history?player=" + player)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response;
        })
        .then(async (battleHistory) => await battleHistory.json().then(json => json.battles))
        .then(battles => battles.filter(battle => minDate.diff(moment(battle.created_date)) < 0))
        .then(battles => battles.map(
            battle => {
                const details = JSON.parse(battle.details)
                if (details.type !== "Surrender" && battle.winner && battle.winner !== "DRAW") {
                    extraUsers.push(battle[(battle["player_1"] === player) ? "player_2" : "player_1"]);
                    const info = extractGeneralInfo(battle)
                    const winner = extractMonster((battle["winner"] === battle["player_1"]) ? details["team1"] : details["team2"])
                    const loser = extractMonster((battle["winner"] === battle["player_1"]) ? details["team2"] : details["team1"])
                    return {
                        ...info,
                        winner: winner,
                        loser: loser,
                        ratio: 1
                    };
                }
            })
        ).then(x => battlesList = [...battlesList, ...x])
        .catch(onError);
}
const extractGeneralInfo = (x) => ({
    match_type: x?.match_type ?? "",
    mana_cap: x?.mana_cap ?? "",
    ruleset: x?.ruleset ?? "",
    inactive: x?.inactive ?? ""
})
const extractMonster = (team) => {
    const monster1 = team.monsters[0]
    const monster2 = team.monsters[1]
    const monster3 = team.monsters[2]
    const monster4 = team.monsters[3]
    const monster5 = team.monsters[4]
    const monster6 = team.monsters[5]

    return {
        summoner_id: team.summoner?.card_detail_id ?? "",
        summoner_level: team.summoner?.level ?? "",
        monster_1_id: monster1?.card_detail_id ?? "",
        monster_1_level: monster1?.level ?? "",
        monster_1_abilities: monster1?.abilities ?? "",
        monster_2_id: monster2?.card_detail_id ?? "",
        monster_2_level: monster2?.level ?? "",
        monster_2_abilities: monster2?.abilities ?? "",
        monster_3_id: monster3?.card_detail_id ?? "",
        monster_3_level: monster3?.level ?? "",
        monster_3_abilities: monster3?.abilities ?? "",
        monster_4_id: monster4?.card_detail_id ?? "",
        monster_4_level: monster4?.level ?? "",
        monster_4_abilities: monster4?.abilities ?? "",
        monster_5_id: monster5?.card_detail_id ?? "",
        monster_5_level: monster5?.level ?? "",
        monster_5_abilities: monster5?.abilities ?? "",
        monster_6_id: monster6?.card_detail_id ?? "",
        monster_6_level: monster6?.level ?? "",
        monster_6_abilities: monster6?.abilities ?? ""
    }
}
const multiDimensionalUnique = (arr) => {
    let uniques = []
    let itemsFound = {}
    for (let i = 0, l = arr.length; i < l; i++) {
        let stringified = JSON.stringify(arr[i])
        if (itemsFound[stringified])
            continue;
        uniques.push(arr[i])
        itemsFound[stringified] = true
    }
    return uniques;
}

let ratio = {}
let extraUsers = []
let battlesList = []
let minDate = moment("2021-12-01")
let counter = 0
let userCount = 0;

const createModel = async () => {
    for(const user of _usersToGrab)
        await getBattleHistory(user)

    //console.log(battlesList.length+" battles");
    let users = extraUsers.filter((value, index, array) => array.indexOf(value) === index)
    extraUsers = []
    for(const user of users)
        await getBattleHistory(user)

    //console.log(battlesList.length+" battles");
    users = extraUsers.filter((value, index, array) => array.indexOf(value) === index)
    extraUsers = []
    for(const user of users)
        await getBattleHistory(user)

    console.log(battlesList.length+" battles");
    battlesList = multiDimensionalUnique(battlesList).filter(x => x !== undefined)
    console.log(battlesList.length+" after filtering");
    console.log("calculating ratio's")
    for (const battle of battlesList) {
        let winner = ratio[JSON.stringify(battle.winner)+battle.mana_cap+battle.ruleset+battle.inactive]
        ratio[JSON.stringify(battle.winner)+battle.mana_cap+battle.ruleset+battle.inactive] = winner===undefined?[1,0]:[winner[0]+1,winner[1]]
        let loser = ratio[JSON.stringify(battle.loser)+battle.mana_cap+battle.ruleset+battle.inactive]
        ratio[JSON.stringify(battle.loser)+battle.mana_cap+battle.ruleset+battle.inactive] = loser===undefined?[0,1]:[loser[0],loser[1]+1]
    }
    console.log("Total of "+Object.keys(ratio).length+" ratio's")
    console.log(Math.round((battlesList.length*2)/Object.keys(ratio).length)+" teams per ratio")
    let calculatedRatios = {};
    for (const battleKey in ratio)
        calculatedRatios[battleKey] = (ratio[battleKey][0]===0||ratio[battleKey][1]===0) ? (ratio[battleKey][0] === 0 ? -20 : 20) : ratio[battleKey][0] /ratio[battleKey][1];
    console.log("Starting magic")
    const magic = battlesList.map(battle => {
        const check = JSON.stringify(battle.winner)+battle.mana_cap+battle.ruleset+battle.inactive;
        for (const loserBattle of battlesList) {
            if (loserBattle.loser.summoner_id !== battle.winner.summoner_id || loserBattle.loser.monster_1_id !== battle.winner.monster_1_id || loserBattle.mana_cap !== battle.mana_cap || loserBattle.ruleset !== battle.ruleset)
                continue;
            const loserCheck = JSON.stringify(loserBattle.loser)+loserBattle.mana_cap+loserBattle.ruleset+loserBattle.inactive;
            const winnerCheck = JSON.stringify(loserBattle.winner)+loserBattle.mana_cap+loserBattle.ruleset+loserBattle.inactive;
            if (loserCheck === check && calculatedRatios[winnerCheck] <= calculatedRatios[check])
                calculatedRatios[winnerCheck] = calculatedRatios[check] + 1
        }
    })
    await Promise.all(magic)
    console.log("Magic is finished, compressing battles")
    const update = battlesList.map(battle => {
        const winner = JSON.stringify(battle.winner)+battle.mana_cap+battle.ruleset+battle.inactive;
        if (calculatedRatios[winner] !== undefined) {
            battle.ratio = calculatedRatios[winner]
            battle.tot = ratio[winner][0] + ratio[winner][1];
        }
        delete battle.loser;
        battle.summoner_id = battle.winner.summoner_id
        battle.summoner_level = battle.winner.summoner_level
        battle.monster_1_id = battle.winner.monster_1_id
        battle.monster_1_level = battle.winner.monster_1_level
        battle.monster_1_abilities = battle.winner.monster_1_abilities
        battle.monster_2_id = battle.winner.monster_2_id
        battle.monster_2_level = battle.winner.monster_2_level
        battle.monster_2_abilities = battle.winner.monster_2_abilities
        battle.monster_3_id = battle.winner.monster_3_id
        battle.monster_3_level = battle.winner.monster_3_level
        battle.monster_3_abilities = battle.winner.monster_3_abilities
        battle.monster_4_id = battle.winner.monster_4_id
        battle.monster_4_level = battle.winner.monster_4_level
        battle.monster_4_abilities = battle.winner.monster_4_abilities
        battle.monster_5_id = battle.winner.monster_5_id
        battle.monster_5_level = battle.winner.monster_5_level
        battle.monster_5_abilities = battle.winner.monster_5_abilities
        battle.monster_6_id = battle.winner.monster_6_id
        battle.monster_6_level = battle.winner.monster_6_level
        battle.monster_6_abilities = battle.winner.monster_6_abilities
        delete battle.winner;
        return battle;
    })
    await Promise.all(update)
    console.log("Writing to file...")
    const writeStream = fs.createWriteStream("./data/ai_model_smart4.json")
    const JSONStream = require("JSONStream");
    const transformStream = JSONStream.stringify();
    transformStream.pipe(writeStream);
    battlesList.forEach(transformStream.write);
    transformStream.end();

    writeStream.on(
        "finish",
        () => {
            console.log("Done");
        }
    )
};
createModel()