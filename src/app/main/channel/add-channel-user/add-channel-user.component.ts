import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../models/user.class';
import { Channel } from '../../../models/channel.class';
import { UserService } from '../../../services/user.service';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../services/chat.service';
import { DialogAddUserComponent } from '../../../dialog-add-user/dialog-add-user.component';

@Component({
  selector: 'app-add-channel-user',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './add-channel-user.component.html',
  styleUrl: './add-channel-user.component.scss'
})
export class AddChannelUserComponent {

  userData: any = [];
  user = new User();
  channel = new Channel();
  userId!: string;

  constructor(
    public firestore: Firestore,
    private route: ActivatedRoute,
    public chatService: ChatService,
    public dialogRef:
      MatDialogRef<AddChannelUserComponent>,
    public userService: UserService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.userService.getAllUsers();
    this.channel = new Channel(data.channel);
  }
 
  openDialogAddUser() {
    this.dialogRef.close()
    this.dialog.open(DialogAddUserComponent, {
      data: { channel: this.channel, source: 'channelComponent' }
    });
  }
}