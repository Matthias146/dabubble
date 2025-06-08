import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { addDoc, collection, doc, Firestore, setDoc } from '@angular/fire/firestore';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';
import { ChannelService } from '../services/channel.service';
import { ChatService } from '../services/chat.service';
import { CommonModule } from '@angular/common';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { UserService } from '../services/user.service';
import { User } from '../models/user.class';

@Component({
  selector: 'app-dialog-add-channel',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './dialog-add-channel.component.html',
  styleUrl: './dialog-add-channel.component.scss'
})

export class DialogAddChannelComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogAddChannelComponent>,
    public dialog: MatDialog, public firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    public channelService: ChannelService,
    public chatService: ChatService,
    public userService: UserService) { }

  closeButtonIcon = 'close.png'

  channelName = new FormControl('', [Validators.required, Validators.minLength(2)]);
  channelDescription = new FormControl('', [Validators.required, Validators.minLength(2)]);

  channel: Channel = new Channel();

  channelExists: boolean = false;

  @Output() channelCreated = new EventEmitter<any>();

  async createNewChannel() {
    const enteredName = this.channelName.value?.trim();
    if (!enteredName || await this.channelService.checkChannelExists(enteredName)) return;
    this.setChannelData(enteredName);
    await this.saveNewChannel(this.channel.toJson());
    this.channelCreated.emit(this.channel);
    this.resetAndCloseDialog();
    this.dialog.open(DialogAddUserComponent, { data: { channel: this.channel, source: 'createNewChannel' } });
  }

  setChannelData(channelName: string) { 
    if (!channelName) {
      return;
    }
    this.channel.channelName = channelName;
    this.channel.channelDescription = this.channelDescription.value!;
    this.channel.tagIcon = 'tag.png';
    if (this.data.userId) {
      const creator = this.userService.findUserById(this.data.userId);
      if (creator) {
        this.channel.creator = creator;
        this.channel.creatorName= creator.name;
        this.channel.members.push(creator); 
      } 
    } else {
      console.error('Creator-ID fehlt in den Daten.');
    }
  }

  async saveNewChannel(channelData: any) {
    try {
      const docRef = await addDoc(collection(this.firestore, 'channels'), channelData);
      await this.setChannelId(docRef.id, channelData)
    } catch (error: any) {
      console.error('Fehler beim erstellen des Channels:', error);
    }
  }

  async setChannelId(id: string, channelData: any) {
    this.channel.id = id;
    channelData = this.channel.toJson();
    await setDoc(doc(this.firestore, "channels", id), channelData)
  }

  async validateChannelName() {
    const enteredName = this.channelName.value?.trim();
    if (!enteredName) {
      this.channelExists = false;
      return;
    }
    this.channelExists = await this.channelService.checkChannelExists(enteredName);
  }

  resetAndCloseDialog() {
    this.channelName.setValue('');
    this.channelDescription.setValue('');
    this.dialogRef.close();
  }
}