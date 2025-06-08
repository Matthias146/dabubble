import { Injectable, Input } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { Message } from '../models/message.class';
import { collection, doc, Firestore, getDocs, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { SearchService } from './search.service';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { UserService } from './user.service';
import { SharedService } from './shared.service';
import { AddChannelUserComponent } from '../main/channel/add-channel-user/add-channel-user.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChannelService {

    selectedChannel: Channel | any;
    userData: User[] = [];
    userId!: string;
    channelMembers: any = [];
    message = new Message();
    channel = new Channel();
    channelData: Channel[] = [];
    filteredChannels: Channel[] = [];
    enableScroll: boolean = true;

    @Input() selectedChannelId: string | null = null;

    constructor(public firestore: Firestore,
        public dialog: MatDialog,
        public searchService: SearchService,
        public userService: UserService,
        public sharedService: SharedService,
    ) { }

    async loadChannel(id: string): Promise<void> {
        const channelDocRef = doc(this.firestore, `channels/${id}`);
        try {
            onSnapshot(channelDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const channel = new Channel({ ...data, id });
                    const creator = this.userService.userData.find(
                        (user: User) => user.userId === channel.creator?.userId
                    );
                    if (creator) {
                        channel.creator = creator;
                        channel.creatorName = creator.name;
                    }
                    const membersWithDetails = channel.members.map((member: User) => {
                        const memberDetails = this.userService.userData.find(
                            (user: User) => user.userId === member.userId
                        );
                        return memberDetails || member; 
                    });
                    channel.members = membersWithDetails;
                    this.selectedChannel = channel;
                    this.saveUpdatedChannel(channel)
                } else {
                    this.selectedChannel = null;
                }
            });
        } catch (error) {
            console.error('Fehler beim Laden des Kanals:', error);
            this.selectedChannel = null;
        }
    }
    async saveUpdatedChannel(channel: Channel): Promise<void> {
        const channelDocRef = doc(this.firestore, `channels/${channel.id}`);
        try {
            await updateDoc(channelDocRef, {
                creatorName: channel.creatorName,
                creator: channel.creator ? channel.creator.toJson() : null,
                members: channel.members.map(member => member instanceof User ? member.toJson() : member),
                channelName: channel.channelName,
                channelDescription: channel.channelDescription,
                tagIcon: channel.tagIcon
            });
          
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Kanals:", error);
        }
    }


    getAllChannels(): void {
        const channelCollection = collection(this.firestore, 'channels');
        onSnapshot(channelCollection, (snapshot) => {
            this.channelData = [];
            snapshot.forEach((doc) => {
                let channel = new Channel({ ...doc.data(), id: doc.id });
                this.channelData.push(channel);
            });
        });
    }

    getChannelIdByName(channelName: string): string | null {
        this.searchService.filteredChannels$.subscribe(channels => {
            this.filteredChannels = channels;
        });
        const channel = this.filteredChannels.find(channel => channel.channelName === channelName);
        return channel ? channel.id : null;
    }

    openUsersList(channelId: string) {
        this.dialog.open(AddChannelUserComponent, {
            data: {
                channelId: channelId,
                channel: this.selectedChannel
            }
        });
    }

    openDialogAddUser() {
        if (this.sharedService.isMobile) {
            this.openUsersList(this.selectedChannel.id)
        }
        else {
            this.dialog.open(DialogAddUserComponent, {
                data: { channel: this.selectedChannel, source: 'channelComponent' }
            });
        }
    }

    getChannelMembers(channelId: string | null) {
        const channelRef = doc(this.firestore, `channels/${channelId}`);
        onSnapshot(channelRef, (doc) => {
            if (doc.exists()) {
                this.channel.members = doc.data()?.['members'] || [];
            }
        })
    }

    async checkChannelExists(channelName: string) {
        const channelsCollection = collection(this.firestore, 'channels');
        const q = query(channelsCollection, where('channelName', '==', channelName));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }
}
