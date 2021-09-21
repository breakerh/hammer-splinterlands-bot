import systemCheck from "./systemCheck";
import fetch from "node-fetch";
import {config} from "dotenv";
config();

class connector {
	constructor() {

	}

	reportLoss(winner: any) {

	}

	async getPossibleTeams(matchDetails) {
		try {
			//console.log(JSON.stringify(matchDetails));
			const response = await fetch(process.env.API_URL + 'get_team/', {
				method: 'post',
				body: JSON.stringify(matchDetails),
				headers: {'Content-Type': 'application/json'}
			});
			console.log('response back');
			let dataRaw = await response.text();

			if (systemCheck.isDebug()) {
				console.log('--------------------------------------------------------');
				console.log(JSON.stringify(matchDetails));
				console.log('response:');
				console.log(dataRaw);
				console.log('--------------------------------------------------------');
			}

			return JSON.parse(dataRaw);
		} catch(e) {
			console.log('API Error', e);
		}

		return false;
	}
}

export default connector;