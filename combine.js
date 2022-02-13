const fs = require('fs');
const JSONStream = require( "JSONStream" );

const history = require("./data/newHistory.json");
const history1 = require("./data/History.json");

const transformStream = JSONStream.stringify();
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
const newHistory = multiDimensionalUnique(history.concat(multiDimensionalUnique(history1)));
const outputStream = fs.createWriteStream('./data/newHistory.json');
transformStream.pipe( outputStream );
newHistory.forEach( transformStream.write );
transformStream.end();

outputStream.on(
    "finish",
    () => {
        console.log("Done");
    }
);