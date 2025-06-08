import { Injectable } from '@angular/core';
import { Message } from '../models/message.class';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, writeBatch } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { FileService } from './file.service';
import { ChatService } from './chat.service';
import { DatabaseService } from './database.service';
import { ChannelService } from './channel.service';
import { SharedService } from './shared.service';

@Injectable({
    providedIn: 'root'
})

export class MessagesService {
    allMessages: any[] = [];
    message = new Message();
    emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    constructor(
        public firestore: Firestore,
        public userService: UserService,
        public fileService: FileService,
        public chatService: ChatService,
        public dbService: DatabaseService,
        public channelService: ChannelService,
        public sharedService: SharedService
    ) { }

    getAllMessages(channelId: string | null, callback: () => void) {
        const messagesQuery = query(
            collection(this.firestore, `channels/${channelId}/messages`),
            orderBy('timestamp', 'asc')
        );
        this.allMessages = [];
        onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => {
                const data = doc.data();
                const userId = data['user']; // Benutzer-ID aus der Nachricht
                const user = this.userService.userData.find(u => u.userId === userId); // Benutzer anhand der ID finden
                return new Message({
                    text: data['text'],
                    user: user ? user : data['user'], // Füge die Benutzerdaten statt nur der ID hinzu
                    timestamp: data['timestamp'],
                    emojis: data['emojis'] || [],
                    fileUrl: data['fileUrl'] || null,
                    fileType: data['fileType'] || null,
                    fileName: data['fileName'] || null,
                    answersCount: data['answersCount'] || 0,
                }, doc.id);

            });
            const groupedMessages: { [date: string]: Message[] } = {};

            messagesData.forEach(message => {
                const messageDate = message.fullDate;
                if (!groupedMessages[messageDate]) {
                    groupedMessages[messageDate] = [];
                }
                groupedMessages[messageDate].push(message);
            });

            this.allMessages = Object.keys(groupedMessages).map(date => ({
                date,
                messages: groupedMessages[date]
            }));
            callback()
        });
    }

    async saveMessageEdit(message: Message, channelId: string | null): Promise<void> {
        if (!channelId || !message.messageId) return;
        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${message.messageId}`);
        try {
            const updateData: any = { text: message.editedText };
            if (!message.fileUrl) {
                updateData.fileUrl = null;
                updateData.fileType = null;
                updateData.fileName = null;
            }
            await updateDoc(messageRef, updateData);
            message.text = message.editedText;
            if (!message.text.trim() && !message.fileUrl) {
                await this.deleteMessage(message.messageId, channelId);
            } else {
                message.isEditing = false;
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Nachricht:', error);
        }
    }

    cancelMessageEdit(message: Message) {
        message.isEditing = false;
        message.editedText = message.text;
    }

    removeFile(message: Message) {
        message.fileName = null;
        message.fileUrl = null;
    }

    async sendChannelMessage(channelId: string | null, message: string, fileUrl: string | null, userId: string) {
        if (message.trim() === '' && !fileUrl) return;
        const user = this.userService.findUserById(userId);
        if (!user) return;
        const userJson = user.toJson();
        const messageData = {
            text: message,
            user: userJson,
            timestamp: Timestamp.now(),
            fullDate: new Date().toDateString(),
            emojis: [],
            ...(fileUrl && { fileUrl, fileType: this.fileService.selectedFile?.type, fileName: this.fileService.selectedFile?.name })
        };
        try {
            await addDoc(collection(this.firestore, `channels/${channelId}/messages`), messageData);
            this.fileService.selectedFile = null;
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht an den Channel:', error);
        }
    }

    async sendChatMessage(chatId: string, messageText: string, fileUrl: string | null, userId: string) {
        const fileName = this.fileService.selectedFile ? this.fileService.selectedFile.name : '';
        const fileType = this.fileService.selectedFile ? this.fileService.selectedFile.type : '';
        const finalFileUrl = fileUrl || this.fileService.fileDownloadUrl;
        try {
            await this.chatService.sendMessageToChat(
                chatId,
                messageText,
                finalFileUrl,
                fileName,
                fileType,
                userId
            );
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht:', error);
        }
    }

    async sendDirectMessage(recipientName: string, messageText: string, fileUrl: string | null, userId: string) {
        if (!messageText.trim() && !fileUrl) {
            return;
        }
        const receiverID = this.userService.getUserIdByname(recipientName);
        if (!receiverID) {
            return;
        }
        const chatId = await this.initializeChat(receiverID, userId);
        if (!chatId) return;
        await this.sendChatMessage(chatId, messageText, fileUrl, userId);
        this.resetInputFields();
    }

    async initializeChat(receiverID: string, userId: string) {
        const chatId = await this.chatService.createChatID(userId, receiverID);
        const chatExists = await this.chatService.doesChatExist(chatId);
        if (!chatExists) {
            await this.dbService.createNewChat(chatId, userId, receiverID);
        }
        return chatId;
    }

    resetInputFields() {
        this.fileService.selectedFile = null;
        this.fileService.fileDownloadUrl = '';
    }

    async updateMessages(channelId: string | null, messageId: string | null, newMessage: string) {
        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
        if (!channelId || !messageId) return;
        try {
            const updateData: any = { text: newMessage };
            const message = this.allMessages.find(m => m.messageId === messageId);
            if (message && !message.fileUrl) {
                updateData.fileUrl = null;
                updateData.fileType = null;
                updateData.fileName = null;
            }
            await updateDoc(messageRef, updateData)

            if (message) {
                message.text = newMessage;
                if (!message.text.trim() && !message.fileUrl) {
                    this.deleteMessage(messageId, channelId);
                    return;
                }
                message.isEditing = false;
            }
        } catch (error) {
            console.error("Fehler beim Speichern der Nachricht: ", error);
        }
        return;
    }

    async deleteMessage(messageId: string | null, channelId: string | null) {
        if (!channelId || !messageId) return;
        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
        const answersCollectionRef = collection(this.firestore, `channels/${channelId}/messages/${messageId}/answers`);
        const batch = writeBatch(this.firestore);
        const answersSnapshot = await getDocs(answersCollectionRef);
        answersSnapshot.forEach((answerDoc) => {
            batch.delete(answerDoc.ref); // Antwort löschen
        });
        batch.delete(messageRef);
        try {
            await batch.commit();
        } catch (error) {
            console.error('Fehler beim Löschen der Nachricht und Antworten:', error);
        }
    }

    findMessageById(messageId: string) {
        return this.allMessages.find((message) => message.messageId === messageId);
    }

    async handleDirectMessageOrEmail(fileUrl: string | null, value: string, messageText: string, userId: string) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const inputValue = value.trim();
        if (emailPattern.test(inputValue)) {
            await this.sendEmail(inputValue, messageText, fileUrl, userId);
        } else if (inputValue.startsWith('@')) {
            const userName = inputValue.slice(1).trim();
            await this.sendDirectMessage(userName, messageText, fileUrl, userId);
        } else if (inputValue.startsWith('#')) {
            const channelName = inputValue.slice(1).trim();
            const channelId = this.channelService.getChannelIdByName(channelName);
            if (channelId) {
                await this.sendChannelMessage(channelId, messageText, fileUrl, userId);
            }
        }
    }

    async sendEmail(email: string, message: string, fileUrl: string | null, userId: string) {
        try {
            const user = this.userService.findUserByEmail(email);
            if (!user) return;
            await this.sendDirectMessage(user.name, message, fileUrl, userId);
        } catch (error) {
            console.error("Fehler beim Suchen des Benutzers: ", error);
        }
    }

    async sendMessage(messageText: string, value: string, userId: string, selectedChannelId: string | null, editingMessageId: string | null) {
        const fileUrl = await this.fileService.uploadFiles();
        if (messageText.trim() === '' && !this.fileService.selectedFile) return;
        await this.editMessageForMobile(messageText, editingMessageId, selectedChannelId);
        if (!fileUrl && !messageText.trim()) return;
        if (this.channelService.selectedChannel) {
            await this.sendChannelMessage(selectedChannelId, messageText, fileUrl, userId);
        } else {
            await this.handleDirectMessageOrEmail(fileUrl, value, messageText, userId);
        }
        await this.sendTaggedMessages(fileUrl, messageText, userId);
        this.fileService.resetFile();
    }

    async sendTaggedMessages(fileUrl: string | null, newMessageText: string, userId: string) {
        const taggedUsernames = this.extractTaggedUsernames(newMessageText);
        for (const username of taggedUsernames) {
            await this.sendDirectMessage(username, newMessageText, fileUrl, userId);
        }
    }

    async editMessageForMobile(messageText: string, editingMessageId: string | null, selectedChannelId: string | null) {
        if (!this.sharedService.isMobile) return;
        try {
            if (!messageText.trim() && !this.fileService.selectedFile) {
                await this.deleteMessage(editingMessageId, selectedChannelId);
            }
            else {
                const updateData: any = { text: messageText };
                if (!this.fileService.selectedFile) {
                    updateData.fileUrl = null;
                    updateData.fileType = null;
                    updateData.fileName = null;
                }
                if (!editingMessageId || !selectedChannelId) {
                    return;
                }
                const messageRef = doc(this.firestore, `channels/${selectedChannelId}/messages/${editingMessageId}`);
                await updateDoc(messageRef, updateData);
                const message = this.allMessages.find(m => m.messageId === editingMessageId);
                if (message) {
                    message.text = messageText;
                    if (!message.text.trim() && !message.fileUrl) {
                        await this.deleteMessage(editingMessageId, selectedChannelId);
                    } else {
                        message.isEditing = false;
                    }
                }
            }
            messageText = '';
            editingMessageId = null;
        } catch (error) {
            console.error('Fehler beim Bearbeiten der Nachricht (Mobile):', error);
        }
    }

    extractTaggedUsernames(message: string): string[] {
        const tagRegex = /@([A-Za-z0-9_]+)/g;
        const taggedUsernames = [];
        let match;
        while ((match = tagRegex.exec(message)) !== null) {
            taggedUsernames.push(match[1].trim());
        }
        return taggedUsernames;
    }

    async editMessage(message: Message, newText: string, editingId: string | null, channelId: string | null) {
        if (this.sharedService.isMobile) {
            await this.editMessageForMobile(newText, editingId, channelId);
        } else {
            message.isEditing = true;
            message.editedText = newText;
        }
    }

    async editDirectMessage(message: Message, newMessage: string, editingMessageId: string | null) {
        if (!this.sharedService.isMobile) {
            message.isEditing = true;
            message.editedText = message.text;
        } else {
            newMessage = message.text;
            editingMessageId = message.messageId;
            if (message.fileUrl) {
                this.fileService.fileUrl = this.fileService.getSafeUrl(message.fileUrl);
                const fakeFile = new File([''], message.fileName || 'Unbenannte Datei', {
                    type: message.fileType || 'application/octet-stream',
                });
                this.fileService.selectedFile = fakeFile;
            } else {
                this.fileService.closePreview();
            }
        }
    }

    updateUserInMessages(message: any, channelId: string | any) {
        if (typeof message.user === 'string') {
            const updatedUser = this.userService.userData.find(
                user => user.name === message.user
            );
            if (updatedUser) {
                message.user = updatedUser;
                this.saveUpdatedMessage(message, channelId)
            }
        } else if (message.user && message.user.userId) {
            const updatedUser = this.userService.userData.find(
                user => user.userId === message.user.userId
            );
            if (updatedUser) {
                message.user = updatedUser;
                this.saveUpdatedMessage(message, channelId)
            }
        }
    }

    async saveUpdatedMessage(message: any, channelId: string): Promise<void> {
        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${message.messageId}`);
        try {
            const docSnap = await getDoc(messageRef);
            if (docSnap.exists()) {
                await updateDoc(messageRef, { user: message.user.toJson() });
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Nachricht:', error);
        }
    }

}