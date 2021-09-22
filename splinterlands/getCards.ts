import fetch from "node-fetch";

class GetCards {
	// @ts-ignore
	public cardsReady: Promise.IThenable<any>;
	private cards: object[];
	public makeCardId = (id) => id;
	public validDecks = ['Red', 'Blue', 'White', 'Black', 'Green'];
	public colorToDeck = { 'Red': 'Fire', 'Blue': 'Water', 'White': 'Life', 'Black': 'Death', 'Green': 'Earth' };

	constructor() {
		this.cardsReady = new Promise((resolve, reject) => {
			fetch("https://api.splinterlands.io/cards/get_details",
				{
					"credentials":"omit",
					"headers":{
						"accept":"application/json, text/javascript, */*; q=0.01",
						"accept-language":"en-GB,en-US;q=0.9,en;q=0.8"
					},
					"referrer":"https://splinterlands.io/?p=collection",
					"referrerPolicy":"no-referrer-when-downgrade",
					"body":null,
					"method":"GET",
					"mode":"cors"
				})
				.then(async response => {
					const text = await response.text()
					try {
						return JSON.parse(text)
					}catch (e) {
						throw new Error("no valid response")
					}
				})
				.then((jsonResponse) => {
					this.cards = jsonResponse;
					//console.log(this.cards);
					resolve(undefined);
				})
				.catch((error) => {
					console.error('There has been a problem with your fetch operation:', error);
					reject();
				});
		});
	}

	async deckValidColor(accumulator, currentValue) {
		const color = await this.color(currentValue);
		return await this.validDecks.includes(color) ? this.colorToDeck[color] : accumulator
	}

	async teamActualSplinterToPlay(teamIdsArray){
		return await teamIdsArray.reduce(await this.deckValidColor, '');
	}

	async getAllCards() {
		return this.cards.map((y) => ({
			'id': y["id"],
			'name': y["name"],
			'color': y["color"]})
		)
	}

	async getAllCardIds() {
		return this.cards.map((y) => y["id"])
	}

	async color(id){
		const card = await this.cards.find(o => parseInt(o["id"]) === parseInt(id));
		return await card && card["color"] ? card["color"] : '';
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