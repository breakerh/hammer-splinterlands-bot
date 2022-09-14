const fetch = require("node-fetch")
const fs = require("fs")
const moment = require("moment")
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
                if (details.type !== "Surrender" && battle.winner && battle.winner !== "DRAW" && battle.winner === player) {
                    //extraUsers.push(battle[(battle["player_1"] === player) ? "player_2" : "player_1"]);
                    //const info = extractGeneralInfo(battle)
                    //const winner = extractMonster((battle["winner"] === battle["player_1"]) ? details["team1"] : details["team2"])
                    //const loser = extractMonster((battle["winner"] === battle["player_1"]) ? details["team2"] : details["team1"])
                    return extractMonster((battle["winner"] === battle["player_1"]) ? details["team1"] : details["team2"]);
                }
            }).filter(x => typeof x !== "undefined").reduce((prev,monsters)=>{
                console.log(monsters)
                return [...prev,...monsters];
            },[])
        ).then(x => {
            battlesList = x.reduce((prev,monster)=>{
                const testCards = [157, 158, 159, 160, 395, 398, 399, 161, 162, 163, 167, 400, 401, 402, 403, 440, 168, 169, 170, 171, 381, 382, 383, 384, 385, 172, 173, 174, 178, 386, 387, 388, 389, 179, 180, 181, 182, 368, 369, 183, 184, 185, 189, 372, 373, 374, 375, 439, 146, 147, 148, 149, 409, 410, 411, 412, 413, 150, 151, 152, 156, 414, 415, 416, 417, 441, 135, 136, 137, 138, 353, 354, 355, 357, 139, 140, 141, 145, 358, 359, 360, 438, 224, 190, 191, 192, 193, 423, 424, 426, 194, 195, 196, 427, 428, 429];
                if(testCards.includes(monster)) {
                    if (typeof prev[monster] === "undefined")
                        prev[monster] = 1
                    else
                        prev[monster] = ++prev[monster];
                }
                return prev;
                },{})
        })
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

    let data = [];
    if(typeof team?.summoner?.card_detail_id !== "undefined")
        data.push(team.summoner.card_detail_id);
    if(typeof monster1?.card_detail_id !== "undefined")
        data.push(monster1.card_detail_id);
    if(typeof monster2?.card_detail_id !== "undefined")
        data.push(monster2.card_detail_id);
    if(typeof monster3?.card_detail_id !== "undefined")
        data.push(monster3.card_detail_id);
    if(typeof monster4?.card_detail_id !== "undefined")
        data.push(monster4.card_detail_id);
    if(typeof monster5?.card_detail_id !== "undefined")
        data.push(monster5.card_detail_id);
    if(typeof monster6?.card_detail_id !== "undefined")
        data.push(monster6.card_detail_id);
    return data
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
    await getBattleHistory('breakerh')

    console.log(battlesList);
};
createModel()