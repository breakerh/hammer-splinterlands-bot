# Hammer Splinterlands Bot by Bram Hammer
A fast and efficient multi-account splinderlands bot based on 'ultimate-splinterlands-bot'

![GitHub](https://img.shields.io/github/license/breakerh/hammer-splinterlands-bot?style=plastic)
![GitHub all releases](https://img.shields.io/github/downloads/breakerh/hammer-splinterlands-bot/total?style=plastic)
![GitHub issues](https://img.shields.io/github/issues/breakerh/hammer-splinterlands-bot?style=plastic)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/breakerh/hammer-splinterlands-bot?style=plastic)

Based on https://github.com/PCJones/ultimate-splinterlands-bot

## Preamble 
As PC Jones stated he hacked the code together and it needs quite a bit of cleaning.  
I rewritten the code to Typescript and added some functionalities.
  
Feel free to give suggestions for features/code refurbishing via [github as an issue](https://github.com/breakerh/hammer-splinterlands-bot/issues).

## New Features
- Multiple accounts with only one instance  
  _**Note**: we support this function however don't recommend it since we aren't sure of possible blocks from splinterlands._
- Login via Email (preferred)
- Better Team Selection - the bot will choose cards with best win rate, not the ones that are most used
- Faster Login & Fighting:
    - The bot no longer refreshes the page all the time (which often got you blocked from splinterlands for a few minutes)
    - The bot clicks away popups
    - The bot waits if there is a loading circle from splinterlands
    - Checks if there are limitations for team selection
- Minimum Energy Capture Rate - the bot will pause automatically if the energy capture rate is below a specified percentage
- Minimum & maximum Rating - the bot will pause automatically if the rating is below or above a specified score
- Option to disable automatic quest reward chest opening
- **Coming Soon**: Statistics on how each account is performing
- **Coming Soon**: Zapier integration
- Any suggestions?

# Support / Community

[Issues or ideas?](
https://github.com/breakerh/hammer-splinterlands-bot/issues)

## How to install
- Download and install [NodeJs](https://nodejs.org/it/download/)
- Download the [bot](https://github.com/breakerh/hammer-splinterlands-bot) (extract if its .zip)
- Create .env file (duplicate .env-example and rename, fill in your details)
- On MacOS/Linux/Windows: open terminal in bot folder and execute command `npm install`
- Windows, not familiar terminal: Execute `install.bat` in bot folder

## Create battle history ( to learn the script how to win )
- Run `node battleGetData.js`
- And run `node combine.js`

## How to start the bot
- On MacOS/Linux/Windows: open terminal in bot folder and execute command `npm start`
- Windows, not familiar terminal: Execute `start.bat` in bot folder

## How to update?

### With NPM
- Run `git pull`

### With normall download
- Download the zip again, and replace all files except: `.env` and everything in `/data/`

## Bot configuration:

Configuration with default values:

- `QUEST_PRIORITY=true` Disable/Enable quest priority

- `MINUTES_BATTLES_INTERVAL=30` Sleep time before the bot will fight with all accounts again. Subtract 2-3 minutes per account

- `ERC_THRESHOLD=80` If your energy capture rate goes below this the bot will stop fighting with this account until it's above again. Set to 0 to disable

- `RATING_MIN=80` If your rating goes below this the bot will stop fighting with this account until it's above again. Set to 0 to disable

- `RATING_MAX=1000` If your rating goes below this the bot will stop fighting with this account until it's above again. Set to 0 to disable

- `CLAIM_SEASON_REWARD=false` Disable/Enable season reward claiming

- `CLAIM_QUEST_REWARD=true` Disable/Enable quest reward claiming

- `HEADLESS=true` Disable/Enable headless("invisible") browser (e.g. to see where the bot fails)

- `KEEP_BROWSER_OPEN=true` Disable/Enable keeping the browser instances open after fighting. Recommended to have it on true to avoid having each account to login for each fight. Disable if CPU/Ram usage is too high (check in task manager)

- `LOGIN_VIA_EMAIL=true` Disable/Enable login via e-mail adress. See below for further explanation

- `EMAIL=account1@email.com,account2@email.com,account3@email.com` Your login e-mails, each account seperated by comma. Ignore line if `LOGIN_VIA_EMAIL` is `false`

- `ACCUSERNAME=username1,username2,username3` Your login usernames, each account seperated by comma. **Even if you login via email you have to also set the usernames!**

- `PASSWORD=password1,password2,password3` Your login passwords/posting keys. Use password if you login via email, **use the posting key if you login via username**

- `CHECK_UPDATE=true` Set to true unless you don't want to update your application

# Donations

In case you want to donate to me for updating this bot, I would be very happy! Please also consider donating to the original bot creator.

- DEC into the game to the player **breakerh** 
- Pay me a little something [on bunq](https://bunq.me/bramhammer)

# FAQ
**Can I have some accounts that login via email and some via username?**

Yes! Config Example:
```
LOGIN_VIA_EMAIL=true
EMAIL=account1@email.com,account2@email.com,username3
ACCUSERNAME=username1,username2,username3
PASSWORD=password1,password2,POST_KEY3
```

**How to get history data from users of my choice?**

1. Open battlesGetData.js in notepad and change the usersToGrab on line 88 to the users of your choice
2. Run `node battlesGetData.js` in the bot folder
3. File history.json is created, rename it to newHistory.json to replace the existing history data OR extend the newHistory.json file (see below)

**How to extend the newHistory.json without deleting existing data?**

1. Backup newHistory.json in case something goes wrong
2. Run `node combine.js` to add the data from history.json to the newHistory.json file
