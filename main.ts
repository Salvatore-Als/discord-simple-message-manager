import fs from 'fs';
import { Client, Events, GatewayIntentBits, Message, MessageMentions, Partials, Role } from 'discord.js';
import { IConfig } from './config.model';

export default class App {
    private client: Client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
        partials: [
            Partials.Channel,
            Partials.GuildMember,
            Partials.Message,
        ],
    });

    private lastMessage: Map<string, string> = new Map();
    private config: IConfig = {
        TOKEN: '',
        ROLES_TRIGGER: [],
        EXCLUDE_CHANNELS: []
    };

    constructor() {

    }

    run() {
        this.config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

        this.client.login(this.config.TOKEN);

        this.client.once(Events.ClientReady, () => {
            console.log("Discord client connected");
        });

        this.client.on(Events.MessageCreate, (message: Message) => {
            if (message.author.bot || this.config.EXCLUDE_CHANNELS?.includes(message.channel.id)) {
                console.log("exclude channel");
                return;
            }

            const author: string = message.author.id
            const content: string = message.content;

            if (this.lastMessage.get(author) == content) {
                message.delete();
                return;
            }

            // 22 = mention lenght without any message
            if (content.trim().length == 22 && this.isTriggering(message.mentions)) {
                message.delete();
                return;
            }

            this.lastMessage.set(author, content);
        });
    }

    private isTriggering(mentions: MessageMentions<boolean>): boolean {
        return Array.from(mentions.roles.values())?.some((role) =>
            this.config.ROLES_TRIGGER?.includes(role.id)
        );
    }
}