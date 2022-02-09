const fs = require('fs');

const history = require("./data/newHistory.json");
const history1 = require("./data/History.json");

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
};
const newHistory = history.concat(history1);
fs.writeFile(`./data/newHistory.json`, JSON.stringify(multiDimensionalUnique(newHistory)), function (err) {
    if (err) {
        console.log(err);
    }
});
