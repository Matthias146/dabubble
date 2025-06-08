import { SafeResourceUrl } from "@angular/platform-browser";
import { User } from "./user.class";

export class directMessage {

    text!: string;
    senderId!: string;
    receiverId!: string;
    dayDateMonth!: string;
    time!: string;
    timestamp!: string;
    messageId!: string;
    chatId!: string;
    fileDownloadUrl!: string;
    audioDownloadUrl!:string;
    fileName!: string;
    fileType!: string;
    safeFileUrl?: SafeResourceUrl;  // Neue Property für die sichere URL
    safeAudioUrl?: SafeResourceUrl;
    //Reactions
    reactionCelebrate!: User[];
    reactionCheck!: User[];
    reactionNerd!: User[];
    reactionRocket!: User[];
    //gelesen vom Empfänger
    isRead:boolean = false;


    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.senderId = obj ? obj.senderID : '';
        this.receiverId = obj ? obj.receiverID : '';
        this.dayDateMonth = obj ? obj.dayDateMonth : '';
        this.time = obj ? obj.time : '';
        this.timestamp = obj ? obj.timestamp : '';
        this.messageId = obj ? obj.messageId : '';
        this.chatId = obj ? obj.chatId : '';
        this.fileDownloadUrl = obj ? obj.fileDownloadUrl : '';
        this.audioDownloadUrl = obj ? obj.audioDownloadUrl : '';
        this.fileName = obj ? obj.fileName : '';
        this.fileType = obj ? obj.fileType : '';
        this.safeFileUrl = obj ? obj.safeFileUrl : '';
        this.safeAudioUrl = obj ? obj.safeAudioUrl : '';

        this.reactionCelebrate = Array.isArray(obj?.reactionCelebrate) ? obj.reactionCelebrate : []; 
        this.reactionCheck = Array.isArray(obj?.reactionCheck) ? obj.reactionCheck : []; 
        this.reactionNerd = Array.isArray(obj?.reactionNerd) ? obj.reactionNerd : []; 
        this.reactionRocket = Array.isArray(obj?.reactionRocket) ? obj.reactionRocket : []; 
        this.isRead = false;
    }

    public toJson(){
        return{
            text:this.text,
            senderID:this.senderId,
            receiverID:this.receiverId,
            dayDateMonth:this.dayDateMonth,
            time:this.time,
            timestamp:this.timestamp,
            messageId:this.messageId,
            chatId:this.chatId,
            fileDownloadUrl:this.fileDownloadUrl,
            audioDownloadUrl:this.audioDownloadUrl,
            fileName:this.fileName,
            fileType:this.fileType,
            reactionCelebrate: this.reactionCelebrate,
            reactionCheck: this.reactionCheck,
            reactionNerd: this.reactionNerd,
            reactionRocket: this.reactionRocket,
            isRead: this.isRead
        }
    }
}