import fetch from "node-fetch";
import systemCheck from "../api/systemCheck";

class GetQuest {
	readonly quests: object[] = [
		{name: "Defend the Borders", element: "life"},
		{name: "Pirate Attacks", element: "water"},
		{name: "High Priority Targets", element: "snipe"},
		{name: "Lyanna's Call", element: "earth"},
		{name: "Stir the Volcano", element: "fire"},
		{name: "Rising Dead", element: "death"},
		{name: "Stubborn Mercenaries", element: "neutral"},
		{name: "Gloridax Revenge", element: "dragon"},
		{name: "Stealth Mission", element: "sneak"},


		{name: "defend", element: "life"},
		{name: "pirate", element: "water"},
		/*{name: "High Priority Targets", element: "snipe"},*/
		{name: "lyanna", element: "earth"},
		{name: "stir", element: "fire"},
		{name: "rising", element: "death"},
		/*{name: "Stubborn Mercenaries", element: "neutral"},*/
		{name: "gloridax", element: "dragon"},

		{name: "stealth", element: "sneak"},
		/*{name: "armor", element: "life"},
		{name: "healing", element: "life"},
		{name: "flying", element: "dragon"},
		{name: "anti-melee", element: "fire"},
		{name: "anti-magic", element: "life"},
		{name: "exploits", element: "neutral"},
		{name: "disable", element: "neutral"},*/
	]

	getQuestSplinter = (questName) => {
		const playerQuest = this.quests.find(quest=> quest["name"] === questName)
		if(systemCheck.isDebug()) {
			console.log(playerQuest);
			console.log(questName);
		}
		return typeof playerQuest === "undefined"?null:playerQuest["element"];
	}

	getPlayerQuest = (username) => (
		fetch(`https://api2.splinterlands.com/players/quests?username=${username}`,
			{
				"credentials": "omit",
				"headers": {
					"accept": "application/json, text/javascript, */*; q=0.01"
				},
				"referrer": `https://splinterlands.com/?p=collection&a=${username}`,
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": null,
				"method": "GET",
				"mode": "cors" })
			.then(x => x && x.json())
			.then(x => {
				if (x[0]) {
					const splinter = this.getQuestSplinter(x[0].name);
					if(splinter === null)
						return null;
					else
						return {
							name: x[0].name,
							splinter: splinter,
							total: x[0].total_items,
							completed: x[0].completed_items
					};
				}
				})
			.catch(e => console.log(e,'[ERROR QUEST] Check if Splinterlands is down. Are you using username or email? please use username'))
	)
}

export default GetQuest