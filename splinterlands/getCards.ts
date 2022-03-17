import fetch from "node-fetch";

class GetCards {
	// @ts-ignore
	public cardsReady: Promise.IThenable<any>;
	public cards: any;
	public makeCardId = (id) => id;
	public validDecks = ['Red', 'Blue', 'White', 'Black', 'Green'];
	public colorToDeck = { 'Red': 'Fire', 'Blue': 'Water', 'White': 'Life', 'Black': 'Death', 'Green': 'Earth' };
	readonly basicCards = require('../data/basicCards.js');
	readonly exclude = [158,162,180,183,184,185,194,367,371,373,374,395,398,401];
	public starters = [];

	constructor(starters, cards) {
		this.starters = starters;
		if(cards===false) {
			this.cardsReady = new Promise((resolve, reject) => {
				fetch("https://api2.splinterlands.com/cards/get_details",
					{
						"credentials": "omit",
						"headers": {
							"accept": "application/json, text/javascript, */*; q=0.01",
							"accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
						},
						"referrer": "https://splinterlands.io/?p=collection",
						"referrerPolicy": "no-referrer-when-downgrade",
						"body": null,
						"method": "GET",
						"mode": "cors"
					})
					.then(async response => {
						const text = await response.text()
						try {
							return JSON.parse(text)
						} catch (e) {
							throw new Error("no valid response")
						}
					})
					.then((jsonResponse) => {
						this.cards = jsonResponse;
						console.log(this.cards.length);
						resolve(this.cards);
					})
					.catch((error) => {
						console.error('There has been a problem with your fetch operation:', error);
						reject();
					});
			});
		}else{
			this.cards = cards;
			this.cardsReady = new Promise((resolve, reject) => resolve(this.cards)); // to keep the promise
		}
	}

	deck(id){
		const card = this.cards.find(o => parseInt(o["id"]) === parseInt(id));
		return card && card["color"] ? this.colorToDeck[card["color"]] : '';
	}

	async color(id){
		const card = await this.cards.find(o => parseInt(o["id"]) === parseInt(id));
		return await card && card["color"] ? card["color"] : '';
	}

	deckValidColor(accumulator, currentValue, cards) {
		//const color = await this.color(currentValue);
		const card = cards.find(o => parseInt(o["id"]) === parseInt(currentValue));
		const color = card && card["color"] ? card["color"] : '';
		return (this.validDecks.includes(color) ? this.colorToDeck[color] : accumulator)
	}

	teamActualSplinterToPlay(teamIdsArray){
		return teamIdsArray.reduce((acc,curr)=> this.deckValidColor(acc,curr,this.cards), '');
	}

	async getAllCards() {
		return this.cards.map((y) => ({
			'id': y["id"],
			'name': y["name"],
			'color': y["color"]})
		)
	}

	async getPlayerCards(username) {
		return await fetch(`https://api2.splinterlands.com/cards/collection/${username}`,
			{
				"credentials": "omit",
				"headers": {
					"accept": "application/json, text/javascript, */*; q=0.01"
				},
				"referrer": `https://splinterlands.com/?p=collection&a=${username}`,
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": null,
				"method": "GET",
				"mode": "cors"
			})
			.then(x => x && x.json())
			.then(x => x['cards'] ? x['cards'].filter(x=>x.delegated_to === null || x.delegated_to === username).map(card => card.card_detail_id) : '')
			.then(advanced => this.basicCards.concat(advanced))
			.catch(e => {console.log('Using only basic cards due to error when getting user collection from splinterlands: ',e); return this.basicCards})
		/*
		let cards = this.cards.filter(c => (c.editions===null || c.editions.split(',').find(id=>this.starters.includes(parseInt(id))))&&c.rarity<3).map(c=>parseInt(c.id));
				if (systemCheck.isDebug()) {
					console.log(cards.filter(id => !this.basicCards.includes(parseInt(id))));
					console.log(cards.length);
					console.log(cards.concat(advanced).length);
				}
				//console.log(this.basicCards.filter(id=>!test.includes(parseInt(id))))
				return cards.concat(advanced)
		*/
	}

	async getCardDetails(username, cardId) {
		return await fetch(`https://api2.splinterlands.com/cards/find/?ids=${cardId}`,
			{
				"credentials": "omit",
				"headers": {
					"accept": "application/json, text/javascript, */*; q=0.01"
				},
				"referrer": `https://splinterlands.com/?p=collection&a=${username}`,
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": null,
				"method": "GET",
				"mode": "cors"
			})
			.then(x => x && x.json())
			.then(x => ({
				'id': x.card_detail_id,
				'level': x.details.rarity,
				'abilities': []
			}))
			.catch(e => {console.log('Could not find card, error returned: ',e); return false;})
	}

	async getAllCardIds() {
		return this.cards.map((y) => y["id"])
	}

	async getAllCardsDetails() {
		return this.cards
	}

	async getCardById(ids: any[] = []) {
		return this.cards.filter(card => ids.includes(card["id"])).map((y) => ({
			'id': y["id"],
			'name': y["name"],
			'color': y["color"]})
		)
	}

}

export default GetCards