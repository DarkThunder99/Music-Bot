# 🤖 Music-Bot Please Give a 🌟 If you like the Bot!!

## 🔎 Deploy Links
[![Heroku Deploy](https://www.herokucdn.com/deploy/button.svg)](https://dashboard.heroku.com/new?template=https%3A%2F%2Fgithub.com%2Feritislami%2Fevobot)

## 🔎 Requirements

1. Discord Bot Token **[Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)**
2. YouTube Data API v3 Key **[Guide](https://developers.google.com/youtube/v3/getting-started)**
3. Node.js v12.0.0 or newer

## 📝 Features
This Bot a lot of Features.
You can Play Playlists from YouTube.

## 🚀 Getting Started
I have all the files you need you can simply push to heroku and make some Config Vars under (Settings >> Config Vars)
or if you wanna run it on a raspberry pi you can with the *config.json.example* file just simple rename it to *config.json*

## ⚙️ Self Hosting
Copy or Rename `config.json.example` to `config.json` and fill out the values:

⚠️ Note: Never commit or share your token or api keys publicly ⚠️
```
{
  "TOKEN": "",
  "YOUTUBE_API_KEY": "",
  "SOUNDCLOUD_CLIENT_ID": "", (Optional)
  "MAX_PLAYLIST_SIZE": 10,
  "PREFIX": "/",
  "PRUNING": false,
  "STAY_TIME": 30
}
```

## ⚙️ Heroku Hosting
Fork the Project,
Go to Heroku.com and Make a New App,
Then Go to Deploy and Connect the Repository,
Then Go to Config Vars and Make New Vars Like this
```
TOKEN
YOUTUBE_API_KEY
SOUNDCLOUD_CLIENT_ID (Optional)
MAX_PLAYLIST_SIZE
PREFIX
PRUNING
STAY_TIME
```