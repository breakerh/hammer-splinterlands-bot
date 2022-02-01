const fs = require('fs');

//const history1 = require("./data/newHistory.json");
const history1 = require("./data/history1.json");
const history2 = require("./data/history2.json");
const history3 = require("./data/history3.json");
const history4 = require("./data/history4.json");
const history5 = require("./data/history5.json");
// const history5 = require("./data/history6.json");
//const history3 = require("./historyHi.json");
// const history4 = require("./history20200309.json");
// const history5 = require("./history20200520.json");

const newHistory = history1.concat(history2).concat(history3).concat(history4).concat(history5)//.concat(history3).concat(history4)

fs.writeFile(`./data/newHistory.json`, JSON.stringify(newHistory), function (err) {
    if (err) {
        console.log(err);
    }
});
