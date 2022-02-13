const fs = require('fs');
const JSONStream = require( "JSONStream" );
const history = [];
let historyDiff = 0;
/*const history = require("./data/newHistory.json");
const history1 = require("./data/History.json");*/
const getHistory = (filename) => {
    const transformStream = JSONStream.parse("*");
    const stream = fs.createReadStream("./data/"+filename+".json", { encoding: 'utf8' });
    return stream.pipe(transformStream);
};
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
let counter = 0;
getHistory('newHistory').on(
    "data",
    historyLine => {
        counter++;
        if (counter % 1000 === 0)
            console.log(counter);
        history.push(historyLine);
    }).on(
    "end",
    (err) => {
        historyDiff = history.length;
        console.log(history.length+' battles in original file');
        counter = 0;
        getHistory('History').on(
            "data",
            historyLine => {
                counter++;
                if (counter % 1000 === 0)
                    console.log(counter);
                history.push(historyLine);
            }).on(
            "end",
            (err) => {
                console.log((history.length-historyDiff)+' battles in new file');
                //const newHistory = history.filter(battle=>battle.player_rating_initial>800); // uncomment if you want to filter on player rating!
                //console.log(newHistory.length+' filtered');
                //history = multiDimensionalUnique(history); // uncomment to remove duplicates. however, this can take A LOT of time!
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
            }
        );
    }
);