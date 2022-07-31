const ms = require("ms")
const { QuickDB } = require("quick.db")
const token = require("./token.json")
const db = new QuickDB()
const Discord = require("discord.js")
const client = new Discord.Client({intents: [Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers]})

client.on("ready", () => {

    console.log("Ready !")
})

client.on("messageCreate", async message => {

    const dbTempBan = db.table("tempBan")

    const prefix = "bdg!"

    await (await dbTempBan.all()).map(async e => {
        if(e["value"] < message.createdTimestamp) message.guild.members.unban(e["id"]) && await dbTempBan.delete(e["id"])
    })

    if(!message.content.startsWith(prefix)) return

    const args = message.content.trim().split(/ +/)
    const command = args.shift().slice(prefix.length)

    if(message.channelId != "1002930627441598574" && message.author.id != "454939105411858432") return message.channel.send("Le bot n'est pas ouvert au public pour le moment, veuillez vous diriger dans le salon <#1002930627441598574> pour l'utiliser !")

    if(command == "ban"){

        // Verification des permissions

        if(!message.member.permissions.has("BanMembers")) return message.channel.send(`:warning: • Tututut mon grand, tu n'as pas les permissions necessaires !`)

        // Verification des mentions

        if(!message.mentions.members.size) return message.channel.send(`:warning: • Tu dois mentionner au moins une personne à bannir !`)
        if(message.mentions.members.size > 3) return message.channel.send(`:warning: • Tu ne peux bannir que trois personnes à la fois !`)

        // Verification de la position des roles

        let verification = false

        message.mentions.members.forEach(member => {
            if(message.member.roles.highest.position <= member.roles.highest.position) verification = true
        });

        verification = false

        if(verification) return message.channel.send(`:warning: • Désolé, l'un des membres mentionné a un role égal ou superieur au votre...`)

        // Demande de la raison

        message.channel.send({embeds: [new Discord.EmbedBuilder({
            title: "Bannissement de membre",
            description: "Veuillez fournir une raison ci dessous s'il vous plait !\nPour annuler la commande, veuillez taper `annuler`",
            //// thumbnail: client.user.avatarURL({extension: "png"})
        })]})

        raison = null
        const collectRaison = message.channel.createMessageCollector({time: 120000})

        collectRaison.on("collect", msg => {
            if(msg.author.id != message.author.id) return
            raison = msg.content

            if(raison == "annuler"){ 
                message.channel.send({embeds: [new Discord.EmbedBuilder({
                    title: "Bannissement de membre",
                    description: "Commande annulée !",
                    // thumbnail: client.user.avatarURL()
                })]})
                return collectRaison.stop()
            }
            collectRaison.stop()
        })

        console.log(collectRaison.checkEnd())

        if(!collectRaison.checkEnd()) return

         // Demande du temps

       message.channel.send({embeds: [new Discord.EmbedBuilder({
            title: "Bannissement de membre",
            description: "Veuillez fournir un temps de ban ci dessous s'il vous plait !\nPour annuler la commande, veuillez taper `annuler`\nPour bannir defitivement, veuillez taper `0`",
            // thumbnail: client.user.avatarURL()
        })]})

        time = null
        timeFinal = null
        const collectTime = message.channel.createMessageCollector({time: 120000})

        collectTime.on("collect", msg => {
            if(msg.author.id != message.author.id) return

            if(msg.content == "annuler"){
                message.channel.send({embeds: [new Discord.EmbedBuilder({
                    title: "Bannissement de membre",
                    description: "Commande annulée !",
                    //thumbnail: client.user.avatarURL()
                })]})
                return collectTime.stop()
            }

            /*if(ms(msg.content) == undefined || msg.content.includes("-")){
                console.log("On est la")
                while(ms(msg.content) == undefined || msg.content.includes("-")){
                    console.log("Petit soucis")
                    message.channel.send(`:warning: • Désolé, le temps de ban renseigné n'est pas valide !`)
                        
                }
            }

            if(ms(msg.content) == undefined || msg.content.includes("-")) 

            time = msg.content

            if(time = 0) timeFinal = "définitif"
            else timeFinal = `de ${time}`*/
            collectTime.stop()
        })

            // Application du ban

            list = message.mentions.members.map(e => " - " + e.user.tag).toString().replaceAll(",", "\n")

            const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                .setCustomId("yes")
                .setLabel("OUI, banni moi ça !")
                .setStyle(Discord.ButtonStyle.Danger),

                new Discord.ButtonBuilder()
                .setCustomId("no")
                .setLabel("NON, ils sont cools en fait !")
                .setStyle(Discord.ButtonStyle.Primary)
            )

            message.channel.send({embeds: [new Discord.EmbedBuilder({
                title: "Bannissement de membre",
                description: `Voulez vous bannir:\n${list}\nAvec comme raison \`${raison}\` et avec un temps de ban \`${timeFinal}\` ?`,
                // thumbnail: client.user.avatarURL(),
            })], components: [row]})

            const collectButtons = message.channel.createMessageComponentCollector({time: 120000})

            collectButtons.on("collect", button => {
                if(message.author.id != button.member.user.id) return
                if(button.customId == "no"){

                    message.channel.send({embeds: [new Discord.EmbedBuilder({
                        title: "Bannissement de membre",
                        description: `Commande annulée !`,
                        // thumbnail: client.user.avatarURL(),
                    })]})
                }

                if(button.customId == "yes"){

                    message.mentions.members.forEach(async element => {
                        if(time != 0) await dbTempBan.set(element.id, message.createdTimestamp + ms(time))
                        element.ban({reason: raison})
                    });

                    message.channel.send({embeds: [new Discord.EmbedBuilder({
                        title: "Bannissement de membre",
                        description: `Dites au revoir !`,
                        // thumbnail: client.user.avatarURL(),
                    })]})


                }
            })

    }

})

client.login(token.token)