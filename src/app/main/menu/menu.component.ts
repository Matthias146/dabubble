import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../../dialog-add-channel/dialog-add-channel.component';
import { SharedService } from '../../services/shared.service';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})

export class MenuComponent {
  constructor(
    public firestore: Firestore,
    public route: ActivatedRoute,
    public dialog: MatDialog,
    public sharedService: SharedService,
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    private breakpointObserver: BreakpointObserver
  ) { }

  newDmIcon = 'edit_square.png'
  channelIcon1: string = 'arrow_drop_down.png';
  channelIcon2: string = 'workspaces.png';
  addChannelIcon = 'add_circle.png';
  addChannelIcon1 = 'add-1.png';
  dmIcon1 = 'arrow_drop_down.png';
  dmIcon2 = 'account_circle.png';
  openCloseIcon = "Hide-navigation.png";
  showMenu: boolean = true;
  closeMenu:boolean = false;
  openCloseButtonText = 'Workspace-Menü schließen';
  userData: any[] = [];
  filteredUsers: any[] = [];
  channelData: any[] = [];
  filteredChannels: any[] = [];
  initialChannels: any[] = [];
  showChannel: boolean = true;
  showUser: boolean = true;
  openChatWithID: string = '';
  currentUserId: string = '';
  currentUser: any;
  userId!: string;
  selectedChannel: any = null;
  unreadCounts = new Map<string, number>();

  @Output() channelSelected = new EventEmitter<any>();
  @Output() chatSelected = new EventEmitter<void>();


  async ngOnInit() {

    await this.getAllChannels('channels');
    await this.getAllUsers('users');

    this.subscribeToSearch();
    this.aboUser();
    this.aboRoute();
    this.userService.getAllUsers().then(() => {
      this.currentUser = this.userService.findUserNameById(this.userId);
    });
    this.chatService.initializeUnreadCounts(this.currentUserId); // Verschiebe hierher
    this.aboUnreadChatCount();

  }

  async getAllChannels(channels: string) {
    try {
      const channelsCollectionRef = collection(this.firestore, channels);
      this.getChannelDataOnSnapshot(channelsCollectionRef);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }

  getChannelDataOnSnapshot(channelsCollectionRef: any) {
    onSnapshot(
      channelsCollectionRef,
      (snapshot: { docs: any[] }) => {
        this.channelData = [];

        this.channelData = snapshot.docs.map((doc) => {
          const channel = doc.data();

          return {
            id: doc.id,
            channelName: channel['channelName'],
            creatorName: channel['creatorName'],
            tagIcon: channel['tagIcon'],
            members: channel['members'] || [],
          };

        });
        this.filterOwnChannels();
        this.initialChannels = this.filteredChannels;
      },
      (error) => {
        console.error('Fehler beim laden der Channel-Daten:', error);
      }
    );
  }

  async getAllUsers(users: string) {
    try {
      const usersCollectionRef = collection(this.firestore, users);
      await this.getUsersDataOnSnapshot(usersCollectionRef);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }

  async getUsersDataOnSnapshot(usersCollectionRef: any) {
    onSnapshot(
      usersCollectionRef,
      (snapshot: { docs: any[] }) => {
        this.userData = [];
        this.userData = snapshot.docs.map((doc) => {
          const user = doc.data();

          return {
            userId: doc.id,
            name: user['name'],
            avatar: user['avatar'],
            mail: user['mail'],
            online: user['online'],
          };
        });

        this.filteredUsers = this.userData;
        this.assignChatIds();
      },
      (error) => {
        console.error('Fehler beim laden der User-Daten:', error);
      }
    );
  }

  aboUser(){
    // Benutzer abonnieren und in currentUser speichern
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserId = user.userId;
        this.chatService.currentUserId = this.currentUserId;
      }
    });
  }

  aboRoute(){
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.currentUserId = this.userId;
    });
  }

  aboUnreadChatCount(){
    // Abonniere die ungelesenen Zähler für alle Chats
    this.chatService.unreadCount$.subscribe((counts) => {
      this.unreadCounts = counts;
    });
  }

  subscribeToSearch() {
    this.sharedService.searchTerm$.subscribe((term) => {
      if (term.length >= 3) {
        this.filterData(term);
      } else {
        this.resetFilteredData();
      }
    });
  }

  filterData(term: string) {
    this.filteredChannels = this.initialChannels.filter((channel: any) =>
      channel.channelName.toLowerCase().includes(term.toLowerCase())
    );
    this.filteredUsers = this.userData.filter((user: any) =>
      user.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  resetFilteredData() {
    this.filterOwnChannels();
    this.filteredUsers = this.userData;
  }

  filterOwnChannels() {
      this.filteredChannels = this.channelData.filter(channel => {
      return channel.members.some((member: any) =>
        member.userId === this.currentUserId ||
        member.name === this.currentUser ||
        channel.creatorName === this.currentUser);
    }
    );
  }

  async assignChatIds() {
    for (const user of this.filteredUsers) {
      user.chatId = await this.chatService.createChatID(this.currentUserId, user.userId);
    }
  }

  //öffnet und schließt die Untermenüs im Menü-Panel
  openCloseDiv(div: string) {
    if (div == 'showChannel') {
      if (this.showChannel == true) {
        this.showChannel = false
      } else {
        this.showChannel = true;
      }
    }
    if (div == 'showUser') {
      if (this.showUser == true) {
        this.showUser = false
      } else {
        this.showUser = true;
      }
    }
  }

  //öffnet und schließt das Menü-Panel
  openCloseMenu() {
    if (this.showMenu) {
      this.closeMenu = true;
      setTimeout(() => {
        this.showMenu = false;
      }, 101);
      this.openCloseButtonText = 'Workspace-Menü öffnen';
      this.openCloseIcon = 'Hide-navigation-1.png'
    } else {
      this.closeMenu = false;
      this.showMenu = true;
      this.openCloseButtonText = 'Workspace-Menü schließen';
      this.openCloseIcon = 'Hide-navigation.png'
    }
  };

  get containerClass() {
    return this.sharedService.isMobile ? 'mobile-menu-container menu-container gap-25' : 'menu-container gap-25';
  }
  
  get animationClass() {
    if (this.sharedService.isMobile) {
      return ''; // Keine Animationen für Mobilgeräte
    }
    return !this.closeMenu ? 'open-menu' : 'close-menu';
  }

  //öffnet den Channel hinzufügen Dialog
  openDialogAddChannel() {
    const isMobile = this.breakpointObserver.isMatched('(max-width: 600px)');
    const dialogConfig = {
      width: isMobile ? '100vw' : '600px',
      height: isMobile ? '100vh' : 'auto',
      maxWidth: '100vw',
      panelClass: isMobile ? 'full-screen-dialog' : '', // Mobile CSS-Klasse
      data: { userId: this.userId }        // Weitergabe von Daten an den Dialog
    };
    const dialogRef = this.dialog.open(DialogAddChannelComponent, dialogConfig);
    dialogRef.componentInstance.channelCreated.subscribe((channel: any) => {
      this.onChannelClick(channel);
    });
  }

  //öffnet einen ausgewählten channel
  onChannelClick(channel: any) {
    this.selectedChannel = channel;
    this.channelSelected.emit(channel);
    this.selectedChannel.id = channel.id;
    this.channelService.enableScroll = true;
  }

  //Öffnet eine neue Nachricht
  onNewMessageClick() {
    if (this.chatService.showChat) {
      this.chatService.showChat = false;
      this.chatService.showChannel = true
      this.channelSelected.emit(null);
    }
    this.channelSelected.emit(null);
  }

  trackByChannelId(channel: any): string {
    return channel.id;  // Optimiert die Performance von *ngFor
  }

  selectChat() {
    this.chatSelected.emit();
    this.chatService.enableScroll = true
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png';  // Local asset avatar
      } else {
        return user.avatar;  // External URL avatar
      }
    }
    return './assets/avatars/avatar_0.png';  // Default avatar when user not found
  }
};