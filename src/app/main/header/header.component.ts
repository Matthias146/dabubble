import {
  Component,
  OnInit,
  HostListener,
  EventEmitter,
  Output,
} from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { DialogLogoutComponent } from './dialog-logout/dialog-logout.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.class';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  onSnapshot,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ChangeDetectorRef } from '@angular/core';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  isMobile = false;
  currentUser: User | null = null;
  userData: any = [];
  userId!: string;
  showUsers: boolean = false;
  showChannels: boolean = false;
  userList: User[] = [];
  filteredUserList: User[] = [];
  noUserResults: boolean = false;
  searchTerm: string = '';
  channelData: any[] = [];
  filteredChannels: any[] = [];
  initialChannels: any[] = [];
  selectedChannel: any = null;
  noChannelResults: boolean = false;

  constructor(
    public dialog: MatDialog,
    public sharedService: SharedService,
    public chatService: ChatService,
    public userService: UserService,
    public firestore: Firestore,
    public route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = window.innerWidth <= 600;
  }

  async ngOnInit() {
    await this.getAllChannels('channels');
    this.getAllUsers();
    this.isMobile = window.innerWidth <= 600;
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      this.cdr.detectChanges();
    }
    this.route.params.subscribe((params) => {
      this.userId = params['userId'];
      if (this.userId) {
        this.subscribeToUserChanges(this.userId);
      }
    });
    this.filteredUserList = [];
    if (this.userData) {
      this.chatService.initializeUnreadCounts(this.userId);
    }
  }

  subscribeToUserChanges(userId: string): void {
    const userDocRef = doc(this.firestore, `users/${userId}`);

    // Abonniere Firestore-Daten mit onSnapshot
    onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Aktuelle Benutzerdaten übernehmen
          this.currentUser = new User({
            ...docSnapshot.data(),
            userId: docSnapshot.id,
          });
          this.cdr.detectChanges(); // Ansicht manuell aktualisieren
        }
        // else {
        //   console.error('Benutzer nicht gefunden');
        // }
      },
      (error) => {
        console.error('Fehler beim Abonnieren der Benutzerdaten:', error);
      }
    );
  }

  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
    });
  }

  getUserById(userId: string) {
    const userCollection = collection(this.firestore, 'users');
    const userDoc = doc(userCollection, userId);
    getDoc(userDoc)
      .then((doc) => {
        if (doc.exists()) {
          this.currentUser = new User({ ...doc.data(), userId: doc.id });
        }
      })
      .catch((error) => {
        console.error('Fehler beim Abrufen des Benutzers:', error);
      });
  }

  handleInput(event: any) {
    const searchTerm = event.target.value;

    if (searchTerm.startsWith('@')) {
      this.handleUsers(searchTerm);
    } else if (searchTerm.startsWith('#')) {
      this.handleChannels(searchTerm);
    } else {
      this.onSearchInput(event);
    }

    this.hideSearchLayers(searchTerm);
  }

  handleUsers(searchTerm: string) {
    const query = searchTerm.slice(1);
    this.filterUsers(query);
    this.toggleUserList();
  }

  filterUsers(searchTerm: string) {
    const searchQuery = searchTerm.slice(1).toLowerCase();

    if (searchQuery.length === 0) {
      this.filteredUserList = [...this.userList];
      this.noUserResults = false;
    } else {
      this.filteredUserList = this.userList.filter((user) =>
        user.name.toLowerCase().includes(searchQuery)
      );
      this.noUserResults = this.filteredUserList.length === 0;
    }
  }

  toggleUserList() {
    if (this.userList.length === 0) {
      this.userService
        .loadUsers()
        .then(() => {
          this.userList = this.userService.userData;
          this.filteredUserList = [...this.userList];
          this.showUsers = true;
        })
        .catch((error) => {
          console.error('Fehler beim Laden der Benutzer:', error);
        });
    } else {
      this.showUsers = true;
    }
  }

  handleChannels(searchTerm: string) {
    const query = searchTerm.slice(1);
    if (query === '') {
      this.filterOwnChannels();
    } else {
      this.filterFurtherChannels(query);
    }
    this.showChannels = true;
  }

  filterOwnChannels() {
    this.initialChannels = this.channelData.filter((channel) => {
      return channel.members.some(
        (member: any) =>
          member.userId === this.currentUser?.userId ||
          member.name === this.currentUser ||
          channel.creatorName === this.currentUser
      );
    });
    this.filteredChannels = [...this.initialChannels];
  }

  filterFurtherChannels(term: string) {
    const searchQuery = term.toLowerCase();

    if (searchQuery.length === 0) {
      // Keine weitere Eingabe -> Zeige initiale Channels
      this.filteredChannels = [...this.initialChannels];
      this.noChannelResults = false; // Kein "no result" anzeigen
    } else {
      // Filtere die Channels basierend auf der Eingabe
      this.filteredChannels = this.initialChannels.filter((channel) =>
        channel.channelName.toLowerCase().includes(searchQuery)
      );

      // Setze noChannelResults auf true, wenn keine Ergebnisse gefunden wurden
      this.noChannelResults = this.filteredChannels.length === 0;
    }
  }

  filterFurtherChannels2(term: string) {
    const searchQuery = term.toLowerCase();
    this.filteredChannels = this.initialChannels.filter((channel) =>
      channel.channelName.toLowerCase().includes(searchQuery)
    );
  }

  onSearchInput(event: any) {
    const searchTerm = event.target.value;

    if (searchTerm.length >= 3) {
      this.sharedService.updateSearchTerm(searchTerm);
    } else {
      this.sharedService.updateSearchTerm('');
      this.resetFilteredChannels();
    }
  }

  resetFilteredChannels() {
    this.filteredChannels = this.channelData;
  }

  hideSearchLayers(searchTerm: string) {
    if (!searchTerm.includes('@')) {
      this.showUsers = false;
    }
    if (!searchTerm.includes('#')) {
      this.showChannels = false;
    }
  }

  changeToUser(user: User) {
    if (!this.currentUser?.userId) {
      console.error('Fehler: Der aktuelle Benutzer ist nicht definiert.');
      return;
    }
    this.userService.loadCurrentUser(this.currentUser.userId);
    this.showUsers = false;
    this.searchTerm = '';
    const currentUserId = this.currentUser.userId;
    const userId = user.userId;

    this.chatService
      .openDirectMessage(currentUserId, userId)
      .then(() => this.chatService.onChatSelected())
      .catch((error) => console.error('Fehler beim Öffnen des Chats:', error));
  }

  openDialogLogout() {
    this.dialog.open(DialogLogoutComponent, {
      data: { user: this.currentUser },
    });
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find(
      (u: { name: string }) => u.name === userName
    );
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png';
      } else {
        return user.avatar;
      }
    }
    return './assets/avatars/avatar_0.png';
  }

  hideChatChannel() {
    this.chatService.showChannel = false;
    this.chatService.showChat = false;
    this.chatService.showMenu = true;
    this.sharedService.goBackHeader = false;
  }

  getAvatarSrc(): string {
    if (!this.currentUser) {
      return './assets/avatars/avatar_1.png';
    }

    const avatar = this.currentUser.avatar.toString();

    return this.userService.isNumber(this.currentUser.avatar)
      ? `./assets/avatars/avatar_${avatar}.png`
      : avatar;
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
        this.channelData = snapshot.docs.map((doc) => ({
          id: doc.id,
          channelName: doc.data()['channelName'],
          creatorName: doc.data()['creatorName'],
          tagIcon: doc.data()['tagIcon'],
          members: doc.data()['members'] || [],
        }));
      },
      (error) => console.error('Fehler beim Laden der Channel-Daten:', error)
    );
  }

  changeToChannel(channel: any) {
    this.showChannels = false;
    this.searchTerm = '';
    try {
      this.chatService.onChannelSelected(channel);
    } catch (error) {
      console.error('Fehler beim Öffnen des Channels:', error);
    }
  }
}
