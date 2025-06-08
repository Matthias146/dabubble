import { Timestamp } from "@angular/fire/firestore";
import { EmojiData } from './emoji-data.models';
import { User } from "./user.class";

export class Answer {
    id!: string;
    messageId!: string;
    text!: string;
    user!: User
    timestamp!: Date;
    isEditing: boolean = false;
    editedText: string = '';
    emojis: EmojiData[] = [];
    fileUrl?: string | null;
    fileType?: string | null;
    fileName?: string | null;

    constructor(obj?: any) {
        this.id = obj?.id;
        this.messageId = obj?.messageId; // ID der zugehörigen Nachricht
        this.text = obj ? obj.text : '';
        this.user = obj.user ? new User(obj.user) : new User();
        const date = obj && obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
        this.timestamp = date;
        this.editedText = this.text;
        this.emojis = (obj?.emojis || []).map((e: any) =>
            typeof e === 'string' ? { emoji: e, userIds: [] } : e
        );
        this.fileUrl = obj?.fileUrl || null;
        this.fileType = obj?.fileType || null;
        this.fileName = obj?.fileName || null;
    }

    private getDateFromTimestamp(timestamp: any): Date {
        return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    }
    public formatTimestamp(): string {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-Stunden-Format
        };
        return new Intl.DateTimeFormat('de-DE', options).format(this.timestamp) + ' Uhr';
    }

    public toJson() {
        const json: any = {
            id: this.id,
            messageId: this.messageId,
            text: this.text,
            user: this.user,
            timestamp: this.timestamp,
            emojis: this.emojis,
            fileUrl: this.fileUrl,
            fileType: this.fileType,
            fileName: this.fileName,
        };
        return json;
    }
    public hasFile(): boolean {
        return !!this.fileUrl;
    }
}
