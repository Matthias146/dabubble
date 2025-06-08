import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { SharedService } from '../../../services/shared.service';
import { collection, Firestore, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { DialogUserProfilComponent } from '../../dialog-user-profil/dialog-user-profil.component';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DialogUserProfilComponent],
  templateUrl: './dialog-logout.component.html',
  styleUrl: './dialog-logout.component.scss'
})
export class DialogLogoutComponent implements OnInit {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;
  userData: any = [];
  user = new User();
  selectedOption: string | null = null;
  currentUser: User | null = null;
  isLogoutContainerActive = false;

  constructor(public firestore: Firestore, 
    public dialog: MatDialog, 
    public dialogRef: MatDialogRef<DialogLogoutComponent>, 
    private userService: UserService,
    private sharedService: SharedService,
    public chatService:ChatService,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }) {
      this.currentUser = data.user;
  }

  ngOnInit() {
    this.sharedService.logoutContainerActive$.subscribe((isActive) => {
      this.isLogoutContainerActive = isActive;
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  addUser() {
    this.dialogRef.close();
  }

  async logOut() {
    if (this.currentUser) {
      const userDocRef = doc(this.firestore, `users/${this.currentUser.userId}`);

      if (this.currentUser.name === 'Gast') {
        await deleteDoc(userDocRef);
      } else {
        await updateDoc(userDocRef, { online: false });
      }
      this.chatService.selectedChannelId = null; 
      this.chatService.showChat =false;
      this.chatService.showChannel = true;
      this.dialogRef.close();
    } else {
      console.error('Kein Benutzer zum Ausloggen gefunden');
    }
  }
 
  openProfil() {
    this.dialogRef.close()
    this.dialog.open(DialogUserProfilComponent, { 
      data: { user: this.currentUser, isEditable: true } 
    });
  }
}

  
