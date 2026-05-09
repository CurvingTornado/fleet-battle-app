const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, Partials } = require('discord.js');
const logger = require('./logger');
require('dotenv').config();

/**
 * Initializes and connects the Discord bot.
 * Registers slash commands and listens for reactions to sync with LobbyManager.
 */
function initDiscordBot(lobbyManager) {
    if (!process.env.DISCORD_TOKEN) {
        logger.warn('DISCORD_TOKEN not provided. Discord bot will not start.');
        return null;
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent
        ],
        partials: [Partials.Message, Partials.Reaction, Partials.User]
    });

    const commands = [
        {
            name: 'link_lobby',
            description: 'Link this channel to a Fleet Command lobby',
            options: [
                {
                    name: 'lobby_id',
                    type: 3, // STRING
                    description: 'The 6-character JOIN TOKEN of the lobby',
                    required: true
                }
            ]
        }
    ];

    client.once('ready', async () => {
        logger.info(`Discord Bot logged in as ${client.user.tag}`);
        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            logger.info('Successfully registered global application commands.');
        } catch (error) {
            logger.error(`Error registering Discord commands: ${error}`);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'link_lobby') {
            const rawLobbyId = interaction.options.getString('lobby_id');
            const lobbyId = rawLobbyId ? rawLobbyId.trim().toUpperCase() : '';
            
            const room = lobbyManager.getRoom(lobbyId);
            if (!room) {
                logger.warn(`DISCORD: Command /link_lobby failed - Room ${lobbyId} not found.`);
                await interaction.reply({ content: `Lobby \`${lobbyId}\` does not exist or has expired.`, ephemeral: true });
                return;
            }

            logger.info(`DISCORD: Linking lobby ${lobbyId} to channel ${interaction.channelId}`);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Fleet Command Operation: ${room.lobbyName || 'Untitled'}`)
                .setDescription(`Commander: **${room.commanderName || room.commanderId}**\n\nReact with 🚢 to sign up for this operation!`)
                .setFooter({ text: `Lobby ID: ${lobbyId}` });

            const message = await interaction.reply({ embeds: [embed], fetchReply: true });
            await message.react('🚢');
            
            room.discordMessageId = message.id;
            room.discordChannelId = message.channelId;
            lobbyManager.saveState();
        }
    });

    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                logger.error(`Error fetching reaction: ${error}`);
                return;
            }
        }

        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                logger.error(`Error fetching message: ${error}`);
                return;
            }
        }

        if (reaction.emoji.name === '🚢') {
            const embed = reaction.message.embeds[0];
            if (embed && embed.footer && embed.footer.text) {
                const lobbyIdMatch = embed.footer.text.match(/Lobby ID: ([A-Z0-9]+)/);
                if (lobbyIdMatch) {
                    const lobbyId = lobbyIdMatch[1];
                    const discordUser = {
                        id: user.id,
                        name: user.displayName || user.username,
                        avatar: user.displayAvatarURL(),
                        status: 'applicant'
                    };
                    lobbyManager.addDiscordApplicant(lobbyId, discordUser);
                    logger.info(`Discord user ${user.username} applied to lobby ${lobbyId}`);
                }
            }
        }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot) return;
        
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                logger.error(`Error fetching reaction: ${error}`);
                return;
            }
        }

        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                logger.error(`Error fetching message: ${error}`);
                return;
            }
        }

        if (reaction.emoji.name === '🚢') {
            const embed = reaction.message.embeds[0];
            if (embed && embed.footer && embed.footer.text) {
                const lobbyIdMatch = embed.footer.text.match(/Lobby ID: ([A-Z0-9]+)/);
                if (lobbyIdMatch) {
                    const lobbyId = lobbyIdMatch[1];
                    lobbyManager.removeDiscordApplicant(lobbyId, user.id);
                    logger.info(`Discord user ${user.username} withdrew from lobby ${lobbyId}`);
                }
            }
        }
    });

    client.login(process.env.DISCORD_TOKEN).catch(err => {
        logger.error(`Discord login failed: ${err.message}`);
    });

    lobbyManager.onRoomDeleted = async (room) => {
        if (room.discordChannelId && room.discordMessageId) {
            try {
                const channel = await client.channels.fetch(room.discordChannelId);
                if (channel) {
                    const message = await channel.messages.fetch(room.discordMessageId);
                    if (message) {
                        const embed = EmbedBuilder.from(message.embeds[0])
                            .setTitle(`[CONCLUDED] ${room.lobbyName || 'Untitled'}`)
                            .setDescription(`This operation has concluded or the lobby has expired.`)
                            .setColor(0x808080);
                        await message.edit({ embeds: [embed] });
                    }
                }
            } catch (err) {
                logger.error(`Failed to update concluded embed for lobby ${room.lobbyName}: ${err.message}`);
            }
        }
    };

    return client;
}

module.exports = { initDiscordBot };
