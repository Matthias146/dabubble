import { User } from "./user.class";

export class Channel {
    channelName!: string;
    channelDescription!: string;
    id!: string;
    tagIcon!: string;
    members!: User[];
    creatorName!: string;
    creator: User | undefined;

    constructor(obj?: any) {
        this.channelName = obj ? obj.channelName : '';
        this.channelDescription = obj ? obj.channelDescription : '';
        this.id = obj ? obj.id : '';
        this.tagIcon = obj ? obj.tagIcon : '';
        this.members = Array.isArray(obj?.members) ? obj.members : [];
        this.creatorName = obj ? obj.creatorName : '';
        this.creator = obj?.creator ? new User(obj.creator) : new User(); // Vollständige Benutzerdaten
    }

    public toJson() {
        return {
            channelName: this.channelName,
            channelDescription: this.channelDescription,
            id: this.id,
            tagIcon: this.tagIcon,
            members: this.members.map(member => member instanceof User ? member.toJson() : member ),
            creatorName: this.creatorName,
            creator: this.creator ? this.creator.toJson() : null // Creator in JSON-Format umwandeln
        }
    }
} 