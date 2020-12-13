const Discord = require('discord.js'),
YTDL = require("ytdl-core"),
FFMPEG = require("ffmpeg"),
YouTube = require('simple-youtube-api'),
YTapi = new YouTube(process.env.ytapikey ? process.env.ytapikey : require("./config.json").ytapikey);
prefix = process.env.prefix ? process.env.prefix : require("./config.json").prefix,
bot = new Discord.Client({
  messageCacheMaxSize: 10,
  messageCacheLifetime: 0,
  messageSweepInterval: 2600,
  disableEveryone: true,
  fetchAllMembers: false,
  disabledEvents: [
    'channelCreate', 'channelDelete', 'channelPinsUpdate', 'channelUpdate', 'clientUserGuildSettingsUpdate',
	'clientUserSettingsUpdates', 'emojiCreate', 'emojiDelete', 'guildBanAdd', 'guildBanRemove', 'guildCreate',
	'guildDelete', 'guildMemberAdd', 'guildMemberAvailable', 'guildMemberRemove', 'guildMembersChunck',
	'guildMemberSpeaking','guildMemberUpdate','guildUnavailable','guildUpdate','messageDelete', 'meesageDeleteBulk',
	'messageReactionAdd', 'messageReactionRemove', 'messageReactionRemoveAll', 'messageUpdate', 'presenceUpdate',
	'roleCreate', 'roleDelete', 'roleUpdate', 'typingStart', 'typingStop', 'userNoteUpdate', 'userUpdate', 'voiceStateUpdate'
  ],
  ws: { large_threshold: 250, compress: false }
});
console.log(process.pid);
bot.on(`ready`, () => {
	console.log(`${bot.user.username} ready!`)
	bot.user.setActivity(`Music | ${prefix}`, { type: "streaming", url: "https://www.twitch.tv/twitch" });
});
process.on('unhandledRejection', console.error);
bot.login(process.env.token ? process.env.token : require("./config.json").token);

var servers = {};

function queueShift(server) {
  server.queueList.shift();
  server.queueNames.shift();
  server.queueAuthor.shift();
  server.queueImage.shift();
  server.queueLength.shift();
  server.queueMessages.shift();
  server.skipNum = 0;
  server.skipUsers = [];
}

function end_Connection(bot, server, connect, msg) {
  if (server.queueList.length > 1) {
    queueShift(server);
    play(connect, msg, bot);
  } else {
    queueShift(server);
    connect.disconnect();
    let endem = new Discord.RichEmbed()
      .setColor("0x36393E")
      .setDescription(`I have now stopped playing in ${connect.channel.name}`)
      .setAuthor(`${bot.user.username}`, bot.user.avatarURL);

    msg.channel.send({ embed: endem });
  }
}

function play(connect, msg, bot) {
  let server = servers[msg.guild.id];

  //if (server.queueLength[0] !== 1800) {
  if (server.queueLength[0] !== "0:0:0") {
    let em = new Discord.RichEmbed()
      .setColor("0x36393E")
      .setAuthor(`${bot.user.username}`, bot.user.avatarURL)
      .setThumbnail(server.queueImage[0])
      .setDescription(`I will now start playing **${server.queueNames[0]}** in ${connect.channel.name}\n\n**By:** ${server.queueAuthor[0]}\n**Link:** ${server.queueList[0]}\n**Length:** ${server.queueLength[0]}`)
      .setFooter(`Requester: ${server.queueMessages[0].author.tag}`, server.queueMessages[0].author.avatarURL);

    msg.channel.send({ embed: em });
	server.dispatcher = msg.guild.voiceConnection.playStream(YTDL(server.queueList[0], { audioonly: true }), { passes: process.env.passes ? process.env.passes : require("./config.json").passes});
   // passes -- can be increased to reduce packetloss at the expense of upload bandwidth, 4-5 should be lossless at the expense of 4-5x upload

    server.dispatcher.on("end", (reason) => {
      end_Connection(bot, server, connect, msg);
    });
  } else {
    end_Connection(bot, server, connect, msg);
    let em = new Discord.RichEmbed()
      .setColor("0x36393E")
      .setAuthor(`${bot.user.username}`, bot.user.avatarURL)
      .setThumbnail(server.queueImage[0])
      .setDescription(`I have skipped **${server.queueNames[0]}** in ${connect.channel.name}\n\n**Reason:** Livestream Error`);

    msg.channel.send({ embed: em });
  }
}

function removedat(msg) {
  if (msg.channel.type === "dm") return;
  if (!msg.deletable) {
    return;
  }
  msg.delete();
}

function parseTime(hour, min, seconds) {

  var hourt = hour !== 0 ? `${hour}` : "";
  var mint = min !== 0 ? `${min}` : "";
  var secondst = seconds !== 0 ? `${seconds}` : "";

  hourt = hourt < 10 && hourt !== 0 ? `0${hourt}` : `${hourt}`;
  mint = mint < 10 && mint !== 0 ? `0${mint}` : `${mint}`;
  secondst = secondst < 10 && secondst !== 0 ? `0${secondst}` : `${secondst}`;

  return `${hourt==""?"":hourt + ":"}${mint==""?"":mint + ":"}${secondst==""?"":secondst}`;
}

function parseUpload(bot, server, link, message, playlist) {
  //  YTDL.getInfo(link).then(info => {
  YTapi.getVideo(link).then(info => {

      let length = parseTime(info.duration.hours, info.duration.minutes, info.duration.seconds);
      if (length == "0:0:0") {
        if (!playlist) {
          let em = new Discord.RichEmbed()
            .setColor("0x36393E")
            .setAuthor(`${bot.user.username}`, bot.user.avatarURL)
            .setThumbnail(info.thumbnails.default.url)
            .setDescription(`I could not add **${info.title}** to play in ${message.member.voiceChannel.name}\n\n**Reason:** Livestream`)
            .setFooter(`Requester: ${message.author.tag}`, message.author.avatarURL);

          message.channel.send({ embed: em });
          return;
        }
      }
      //console.log(info);
      server.queueList.push(link);
      server.queueNames.push(info.title);
      server.queueAuthor.push(info.channel.title);
      server.queueImage.push(info.thumbnails.default.url);
      server.queueLength.push(length);
      server.queueMessages.push(message);

      if (!message.guild.voiceConnection) {
        message.member.voiceChannel.join().then(function(connection) { play(connection, message, bot); });
      } else {
        if (!playlist) {
          let em = new Discord.RichEmbed()
            .setColor("0x36393E")
            .setAuthor(`${bot.user.username}`, bot.user.avatarURL)
            .setThumbnail(info.thumbnails.default.url)
            .setDescription(`I have added **${info.title}** to play in ${message.member.voiceChannel.name}\n\n**By:** ${info.channel.title}\n**Link:** ${link}\n**Length:** ${length} `)
            .setFooter(`Requester: ${message.author.tag}`, message.author.avatarURL);

          message.channel.send({ embed: em });
        }
      }
    })
    .catch(console.log);
}


bot.on(`message`, (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(`${prefix}`)) return;
  if (message.channel.type == "dm") return;
  var args = message.content.substring(prefix.length).split(" ");

  switch (args[0].toLowerCase()) {
    case "help":
      removedat(message);
      let em = new Discord.RichEmbed()
        .setColor("0x36393E")
        .setAuthor(`${bot.user.username}`)
		.setFooter(`Help`, bot.user.avatarURL)
        .setDescription("Music Bot")
        .addField(`${prefix}help`, `Sends this message.`)
        .addField(`${prefix}play [link|search|playlist]`, `Plays a song in the current channel.`)
        .addField(`${prefix}skip`, `Skips the current song.`)
        .addField(`${prefix}stop`, `Stops and drops everything.`)
        .addField(`${prefix}queue`, `Shows the first 5 songs in the queue.`)
        .addField(`${prefix}np`, `Shows what is now playing.`);

      message.channel.send({ embed: em });
      break;
    case "play":
      if (!message.member.voiceChannel) {
        removedat(message);
        message.channel.send(":x: Oh I forgot.. You need to be in a voice channel!");
        break;
      }
      if (!message.member.voiceChannel.joinable || message.member.voiceChannel.full) {
        removedat(message);
        message.channel.send(":x: Looks like I cannot join that voice channel.");
        break;
      }
      if (!args[1]) {
        removedat(message);
        message.channel.send(":x: Umm where's the link?");
        break;
      }
      message.channel.send(`<@${message.author.id}>, I will now process that song name/link!`);
      if (!servers[message.guild.id]) {
        servers[message.guild.id] = { queueList: [], queueNames: [], queueAuthor: [], queueImage: [], queueLength: [], queueMessages: [], skipNum: 0, skipUsers: [] };
      }

      if (!args[1].match(/^https?:\/\/(www.youtube.com|youtube.com)/)) {
        // message.channel.send(":x: Are you sure thats a Youtube link?")
        var server = servers[message.guild.id];

        YTapi.searchVideos(args.slice(1).join(" "), 5).then(videos => {
          //  console.log(videos)
          let choice = new Discord.RichEmbed()
            .setColor("0x36393E")
            .setAuthor(`${bot.user.username}`)
            .setDescription(`Please provide a value to select one of the search results ranging from 1-5`)
            .setFooter(`Cancelling in 10 seconds`, bot.user.avatarURL)
            .setTimestamp()
            .addField(`**1.** ${videos[0].title}`, `[${videos[0].channel.title}](https://www.youtube.com/channel/${videos[0].channel.id}) `)
            .addField(`**2.** ${videos[1].title}`, `[${videos[1].channel.title}](https://www.youtube.com/channel/${videos[1].channel.id}) `)
            .addField(`**3.** ${videos[2].title}`, `[${videos[2].channel.title}](https://www.youtube.com/channel/${videos[2].channel.id}) `)
            .addField(`**4.** ${videos[3].title}`, `[${videos[3].channel.title}](https://www.youtube.com/channel/${videos[3].channel.id}) `)
            .addField(`**5.** ${videos[4].title}`, `[${videos[4].channel.title}](https://www.youtube.com/channel/${videos[4].channel.id}) `);

          message.channel.send({ embed: choice });


          message.channel.awaitMessages(m => m.content > 0 && m.content < 6, {
              max: 1,
              max: 1,
              time: 10000,
              errors: ['time']
            })
            .then(collected => {
              collected.first().delete();
              removedat(message);

              //  message.channel.send(`Okay I'll now add **${videos[collected.first().content-1].title}**`).then(m => m.delete(5000))
              parseUpload(bot, server, `https://www.youtube.com/watch?v=${videos[collected.first() - 1].id}`, message);
            })
            .catch(err => {
              console.log(err);
              //console.log(collected.first().author.id);
              message.channel.send(`** Canceled **`);
              removedat(message);
            });

        });
      } else {
        if (args[1].match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
          YTapi.getPlaylist(args[1]).then(list => {
            message.channel.send(`⏱ Parsing Playlist: **${list.title}**\nPlease give some time. This also includes the server's parsing power and the ammount of videos provided.`);
            list.getVideos().then(videos => {
              for (const video of Object.values(videos)) {
                YTapi.getVideoByID(video.id).then(vid => {
                  parseUpload(bot, servers[message.guild.id], `https://www.youtube.com/watch?v=${vid.id}`, message, true);
                });

              }
              message.channel.send(`✅ Playlist: **${list.title}** [${videos.length > 50 ? '50+' : videos.length} videos] has been added to the queue!`);
            });
          });
        } else {
          removedat(message);
          parseUpload(bot, servers[message.guild.id], args[1], message);
        }
      }

      break;
    case "skip":
      if (!message.member.voiceChannel) {
        removedat(message);
        message.channel.send(":x: Oh I forgot.. You need to be in a voice channel!");
        break;
      }
      removedat(message);
      var server = servers[message.guild.id];
      if (!server) return;
      if (!message.guild.voiceConnection) return;
      if (!message.member.voiceChannel) {
        removedat(message);
        message.channel.send(":x: Oh I forgot.. You need to be in a voice channel!");
        break;
      }
      if (server.dispatcher) server.dispatcher.end();
      break;
    case "stop":
      if (!message.member.voiceChannel) {
        removedat(message);
        message.channel.send(":x: Oh I forgot.. You need to be in a voice channel!");
        break;
      }
      removedat(message);
      var server = servers[message.guild.id];
      if (!server) return;
      server.queueList = [];
      server.queueNames = [];
      server.queueAuthor = [];
      server.queueImage = [];
      server.queueLength = [];
      server.queueMessages = [];
      server.skipNum = 0;
      server.skipUsers = [];
      if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
      break;
    case "queue":
      removedat(message);
      var server = servers[message.guild.id];
      if (!server) {
        return;
      } else if (server.queueNames.length == 0) {
        return;
      }

      var queue = ` **Queue for ${message.guild.name}** [ ${server.queueNames.length} song${server.queueNames.length>1?"s":""} total ]\n\n `;
      var queueLength = server.queueNames.length > 5 ? 5 : server.queueNames.length;
      for (var i = 0; i < queueLength; i++) {
        var temp = ` ${i + 1}: ${i === 0 ? "*(Current Song)*":""} ${server.queueNames[i].includes("*")?server.queueNames[i].replace('*', ''):server.queueNames[i]}\n **Requester:** ${server.queueMessages[i].author.tag }\n\n`;
        queue = queue + temp;
      }
      if (queueLength == 5 && server.queueNames.length > 5) {
        var addition = `***+ ${server.queueNames.length-5} more songs***`;
        queue = queue + addition;
      }
      let queue_embed = new Discord.RichEmbed()
        .setColor("0x36393E")
        .setAuthor(`${bot.user.username }`)
        .setDescription(queue)
        .setThumbnail(message.guild.iconURL !== null ? message.guild.iconURL : "https://maxcdn.icons8.com/Share/icon/Logos//discord_logo1600.png")
		.setFooter(`Server Queue`, bot.user.avatarURL);
		
      message.channel.send({ embed: queue_embed });
      break;
    case "np":
      removedat(message);
      var server = servers[message.guild.id];
      if (!server) { return message.channel.send(`:x: looks like nothing is playing right now...`); }
      if (!server.queueList[0]) { return message.channel.send(`:x: looks like nothing is playing right now...`); }

      let npem = new Discord.RichEmbed()
        .setColor("0x36393E")
        .setAuthor(`${bot.user.username }`)
        .setThumbnail(server.queueImage[0])
        .setDescription(`**Now Playing** \n\n **Name: ** ${server.queueNames[0]}\n **By: ** ${server.queueAuthor[0]}\n **Link: ** ${server.queueList[0]}\n **Length:** ${server.queueLength[0]}\n **Requester: ** ${server.queueMessages[0].author.tag}`)
		.setFooter(`Now Playing`, bot.user.avatarURL);
		
      message.channel.send({ embed: npem });
      break;
  }
  //message.delete();
});
