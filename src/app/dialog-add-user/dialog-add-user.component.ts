import { CommonModule } from '@angular/common';
import { Component, HostListener, Inject, } from '@angular/core';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { UserService } from '../services/user.service';
import { SharedService } from '../services/shared.service';
import { ChannelService } from '../services/channel.service';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatSelectModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrl: './dialog-add-user.component.scss'
})

export class DialogAddUserComponent {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;

  userData: any = [];
  user = new User();

  selectedOption: string | null = null;
  selectedUser: any;
  selectedUsers: any = [];
  dropdownOpen = false;

  constructor(
    public firestore: Firestore,
    public dialogRef: MatDialogRef<DialogAddUserComponent>,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    public sharedService: SharedService,
    public channelService: ChannelService
  ) {
    if (data && data.channel) {
      this.channel = new Channel(data.channel);
      this.channelId = data.channel.id;
      this.channelService.getChannelMembers(this.channelId);
      this.userService.getAllUsers();
    } else {
      console.error('No channel data passed to the dialog');
    }
  }

  updateChannelMembers() {
    if (this.userData.length === 0) return;
    const currentMemberIds = this.channel.members.map((member: any) => member.userId);
    const updatedMembers = this.channel.members.filter((member: any) =>
      this.userData.some((user: User) => user.userId === member.userId)
    );

    if (updatedMembers.length !== currentMemberIds.length) {
      const channelRef = doc(this.firestore, 'channels', this.channelId);
      updateDoc(channelRef, { members: updatedMembers })
        .then(() => {
          this.channel.members = updatedMembers;
        })
        .catch((error) => {
          console.error('Error updating channel members:', error);
        });
    }
  }

  async addMember() {
    const channelRef = doc(this.firestore, `channels/${this.channel.id}`);
    try {
      const currentMembers = this.channel.members || [];
      if (this.selectedOption === 'channel') {
        await this.addAllUsers(currentMembers, channelRef);
        this.dialogRef.close(true);
      }
      else if (this.selectedOption == 'user' || this.selectedUsers) {
        const newMembers = this.selectedUsers.filter(
          (user: any) => !currentMembers.some(member => member.userId === user.userId)
        );

        if (newMembers.length > 0) {
          const updatedMembers = [
            ...currentMembers.map((member: any) => member.toJson ? member.toJson() : member),
            ...newMembers.map((user: any) => user.toJson())
          ];
          await updateDoc(channelRef, { members: updatedMembers });
        }

        this.selectedUsers = [];
        this.dialogRef.close(true);
      }

    } catch (error) {
      console.error('Fehler beim Hinzufügen der Mitglieder:', error);
      this.dialogRef.close(false);
    }
  }

  isSelected(user: any): boolean {
    return this.selectedUsers.some((selected: any) => selected.userId === user.userId);
  }

  async addAllUsers(currentMembers: any[], channelRef: any): Promise<number> {
    const currentMembersJson = currentMembers.map((member: any) => member.toJson())
    const newMembers = this.userService.userData
      .filter((user: any) => !currentMembers.some(member => member.userId === user.userId))
      .map((user: any) => user.toJson());
    if (newMembers.length > 0) {
      const updatedMembers = [...currentMembersJson, ...newMembers];
      await updateDoc(channelRef, { members: updatedMembers });
      return newMembers.length;
    }
    return 0;
  }
  
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectUser(user: any) {

    if (!this.isSelected(user)) {
      this.selectedUsers.push(user);
    }
    this.dropdownOpen = false;
  }

  removeSelectedUser(user: any, event: Event) {
    event.stopPropagation();
    this.selectedUsers = this.selectedUsers.filter((selected: any) => selected.userId !== user.userId);
  }


  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const dropdown = document.querySelector('.dropdown-options');
    const dropdownSelected = document.querySelector('.dropdown-selected');
    const clickedInsideDropdown = dropdown?.contains(event.target as Node);
    const clickedInsideSelected = dropdownSelected?.contains(event.target as Node);

    if (!clickedInsideDropdown && !clickedInsideSelected) {
      this.dropdownOpen = false;
    }
  }


  closeDialog() {
    this.dialogRef.close();
  }
}