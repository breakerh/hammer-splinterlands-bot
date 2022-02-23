const fetch = require("node-fetch")
const fs = require("fs")
const moment = require("moment")

const _usersToGrab = require("./data/userDatabase")
const JSONStream = require("JSONStream");
let ratio = []

const wait = delay => new Promise((resolve) => setTimeout(resolve, delay));
const getBattleHistory = async (player = "", tries = 2) => {
    const onError = (Err) => {
        console.log(Err);
        console.error("Looks like there's a short ban. Waiting 15 minutes. "+tries+" left!")
        const triesLeft = tries - 1
        if(!triesLeft)
            throw Err;
        return wait(900000).then(async () => await getBattleHistory(player, triesLeft));
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
                if (details.type !== "Surrender" && battle.winner && battle.winner!=="DRAW") {
                    const info = extractGeneralInfo(battle)
                    const winner = extractMonster((battle["winner"] === battle["player_1"])?details["team1"]:details["team2"])
                    const loser = extractMonster((battle["winner"] === battle["player_1"])?details["team2"]:details["team1"])
                    return {
                        ...info,
                        winner: winner,
                        loser: loser,
                        ratio: 1
                    };
                }
            })
        ).then(x => [...battlesList, ...x])
        .catch(onError);
}
const expandUserList = async(users) => {
    const topUsers = await fetch("https://api.steemmonsters.io/players/leaderboard")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((userlist) => userlist.map(user => user.player))
        .catch((error) => {
            console.error("There has been a problem with your fetch operation:", error)
        });
    const combine = users.concat(topUsers)
    return await combine.filter((x, y) => combine.indexOf(x) === y);
}
const extractGeneralInfo = (x) => {
    return {
        match_type: x?.match_type ?? "",
        mana_cap: x?.mana_cap ?? "",
        ruleset: x?.ruleset ?? "",
        inactive: x?.inactive ?? ""
    }
}
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
    let uniques = [];
    let itemsFound = {};
    for(let i = 0, l = arr.length; i < l; i++) {
        let stringified = JSON.stringify(arr[i]);
        if(itemsFound[stringified]) { continue; }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
    }
    return uniques;
}

let battlesList = []
let minDate = moment("2021-12-01")
expandUserList(_usersToGrab).then(async newUsers => {

    console.log("Getting "+newUsers.length+" users last 50 battles.")
    for(const user of newUsers) {
        console.log(user)
        battlesList = await getBattleHistory(user)
        console.log(battlesList.length)
    }
    let cleanBattleList = battlesList.filter(x => x !== undefined)
    console.log("Parsing "+cleanBattleList.length+" battles")

    const writeStreamDebug = fs.createWriteStream("./data/ai_model_debug.json")
    const JSONStreamDebug = require("JSONStream");
    const transformStreamDebug = JSONStreamDebug.stringify();
    transformStreamDebug.pipe( writeStreamDebug );
    cleanBattleList.forEach( transformStreamDebug.write );
    transformStreamDebug.end();
    //writeStream.write(JSON.stringify(cleanBattleList));
    writeStreamDebug.on(
        "finish",
        () => {
            console.log("debug saved");
        }
    );
    /*const debugStream = fs.createWriteStream("./data/ai_model_debug.json")
    debugStream.write(JSON.stringify(cleanBattleList));
    debugStream.on(
        "finish",
        () => {
            console.log("Done saving debug data");
        }
    );*/
    //let cleanBattleList = require('./data/ai_model_debug.json');

    for(const battle of cleanBattleList){
        if(ratio[JSON.stringify(battle.winner)]!==undefined)
            ratio[JSON.stringify(battle.winner)] = [(ratio[JSON.stringify(battle.winner)][0]||0)+1,ratio[JSON.stringify(battle.winner)][1]||0]
        else
            ratio[JSON.stringify(battle.winner)] = [1,0]

        if(ratio[JSON.stringify(battle.loser)]!==undefined)
            ratio[JSON.stringify(battle.loser)] = [ratio[JSON.stringify(battle.loser)][0]||0,(ratio[JSON.stringify(battle.loser)][1]||0)+1]
        else
            ratio[JSON.stringify(battle.loser)] = [0,1]
    }
    console.log(Object.keys(ratio).length+" Ratio's to update")
    let calculatedRatios = {};
    for(const battleKey in ratio){
        let calculatedRatio = 1;
        if(ratio[battleKey][0]===0)
            calculatedRatio = 0.001;
        else if(ratio[battleKey][1]===0&&ratio[battleKey][0]>20)
            calculatedRatio = ratio[battleKey][0] / 1;
        else if(ratio[battleKey][0]!==0 && ratio[battleKey][1]!==0)
            calculatedRatio = ratio[battleKey][0] / ratio[battleKey][1]
        calculatedRatios[battleKey] = calculatedRatio;
    }
    console.log('remove duplicates of '+cleanBattleList.length+' battles')
    cleanBattleList = multiDimensionalUnique(cleanBattleList)
    console.log('start magic with '+cleanBattleList.length+' battles')
    const magic = cleanBattleList.map(battle => {
        const checkSummoner = battle.winner.summoner_id;
        const checkMonster = battle.winner.monster_1_id;
        const check = JSON.stringify(battle.winner);
        for(const loserBattle of cleanBattleList){
            if(loserBattle.loser.summoner_id!==checkSummoner || loserBattle.loser.monster_1_id!==checkMonster)
                continue;
            const loserCheck = JSON.stringify(loserBattle.loser);
            if(loserCheck === check) {
                calculatedRatios[loserCheck] = (calculatedRatios[loserCheck] <= calculatedRatios[check]) ? calculatedRatios[check] + 1 : calculatedRatios[loserCheck];
                break;
            }
        }
    })
    await Promise.all(magic)
    console.log('magic happened!')
    const update = cleanBattleList.map(battle => {
        const winner = JSON.stringify(battle.winner);
        if(calculatedRatios[winner]!==undefined) {
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
    console.log("Compressed to "+cleanBattleList.length+" battles")
    console.log("Writing to file...")

    const writeStream = fs.createWriteStream("./data/ai_model_smart.json")
    const JSONStream = require("JSONStream");
    const transformStream = JSONStream.stringify();
    transformStream.pipe( writeStream );
    cleanBattleList.forEach( transformStream.write );
    transformStream.end();
    //writeStream.write(JSON.stringify(cleanBattleList));
    writeStream.on(
        "finish",
        () => {
            console.log("Done");
        }
    );
});
