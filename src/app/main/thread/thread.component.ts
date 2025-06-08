import { Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { User } from '../../models/user.class';
import { Message } from '../../models/message.class';
import { doc, Firestore, Timestamp, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ThreadService } from '../../services/thread.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiData } from './../../models/emoji-data.models';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { AnswersService } from '../../services/answers.service';
import { SharedService } from '../../services/shared.service';
import { FileService } from '../../services/file.service';
import { EmojisService } from '../../services/emojis.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, PickerComponent],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})
export class ThreadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('answersContainer') answersContainer!: ElementRef;

  userId!: string;
  newAnswerText: string = "";
  selectedFile: File | null = null;
  showEmoji: boolean = false;
  showAnswerEmoji: boolean = false;
  showAllAnswerEmoji: boolean = false;
  clickedAnswer: string = '';
  fileUrl: SafeResourceUrl | null = null;
  showEmojiPicker: boolean = false;
  editingAnswerId: string | null = null;
  taggedUser: boolean = false;
  errorMessage: string | null = null;
  filteredSearchAnswers: Answer[] = [];
  originalAnswers: any[] = [];

  @Output() threadClosed = new EventEmitter<void>();
  @Input() selectedChannelId: string | null = null;
  @Input() channelName: string | undefined;
  @Input() message!: Message;
  selectedAnswers: Answer[] = [];

  mutationObserver!: MutationObserver;

  constructor(
    public firestore: Firestore,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    public userService: UserService,
    public threadService: ThreadService,
    public answersService: AnswersService,
    private sanitizer: DomSanitizer,
    public sharedService: SharedService,
    public fileService: FileService,
    public emojiService: EmojisService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => { this.userId = params['userId']; });
    
    this.userService.userData$.subscribe(() => {
      this.answersService.updateUserInAnswers(this.selectedAnswers, this.selectedChannelId, this.message.messageId);
    });
      this.subscribeToSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message && this.message.messageId) {
      this.loadAnswers();
      this.subscribeToSearch();

    }
    if (changes['selectedChannelId'] && !changes['selectedChannelId'].isFirstChange()) {
      Promise.resolve().then(() => {
        this.selectedAnswers = [];
        this.originalAnswers = [];
        this.closeThread();
      });
    }
  }

  loadAnswers(): void {
    if (this.selectedChannelId && this.message?.messageId) {
      this.answersService.getAnswers(this.selectedChannelId, this.message.messageId, () => {
        this.selectedAnswers = this.answersService.allAnswers;
        this.originalAnswers = [...this.selectedAnswers];
        this.answersService.updateUserInAnswers(
          this.selectedAnswers,
          this.selectedChannelId,
          this.message.messageId
        );
      }
      );
    }
  }

  subscribeToSearch(): void {
    this.sharedService.searchTerm$.subscribe((term) => {
      if (term.length >= 3) {
        setTimeout(() => {
          this.filterAnswers(term);
        }, 100);
      } else {
        this.resetFilteredAnswers();
      }
    });
  }

  filterAnswers(term: string): void {
    this.selectedAnswers = (this.originalAnswers || []).filter((answer: Answer) => {
      const matchesUser = answer.user?.name.toLowerCase()?.includes(term.toLowerCase()) || false;
      const matchesText = answer.text?.toLowerCase()?.includes(term.toLowerCase()) || false;
      return matchesUser || matchesText;
    });
  }

  resetFilteredAnswers(): void {
    this.selectedAnswers = [...this.originalAnswers];
  }

  deleteFile(answer: Answer) {
    this.answersService.deleteFile(answer);
    this.fileInput.nativeElement.value = '';
  }
  deleteAnswer(answer:Answer){
    this.answersService.deleteAnswer(answer,this.selectedChannelId)
  }
  async addAnswer(messageId: string) {
    const fileUrl = await this.uploadFileIfSelected();
    const user = this.userService.userData.find(u => u.userId === this.userId);
    const userJson = user?.toJson();

    if (this.editingAnswerId) {
      await this.answersService.editAnswer(messageId, this.newAnswerText, this.selectedChannelId, this.selectedAnswers, this.editingAnswerId, fileUrl);
      this.newAnswerText = '';
      this.editingAnswerId = null;

    } else {
      if (this.newAnswerText.trim() === '' && this.selectedFile === null) return;

      const answerData = {
        messageId,
        text: this.newAnswerText,
        user: userJson,
        timestamp: Timestamp.now(),
        fullDate: new Date().toDateString(),
        emojis: [],
        ...(fileUrl && { fileUrl, fileType: this.selectedFile?.type, fileName: this.selectedFile?.name })
      };
      await this.answersService.addNewAnswer(messageId, this.selectedChannelId, this.newAnswerText, this.userId, answerData);
      this.resetAnswerData();
      this.scrollToBottom()
    }
  }

  resetAnswerData() {
    this.newAnswerText = '';
    this.selectedFile = null;
    this.editingAnswerId = null;
  }

  async uploadFileIfSelected() {
    if (!this.selectedFile) return null;
    const filePath = `files/${this.selectedFile.name}`;
    const storageRef = ref(getStorage(), filePath);
    try {
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      throw error;
    }
  }

  editDirectAnswer(answer: Answer) {
    if (!this.sharedService.isMobile) {
      answer.isEditing = true;
      answer.editedText = answer.text;
    } else {
      this.newAnswerText = answer.text;
      this.editingAnswerId = answer.id;
      if (answer.fileUrl) {
        this.fileUrl = this.fileService.getSafeUrl(answer.fileUrl);
        const fakeFile = new File([''], answer.fileName || 'Unbenannte Datei', {
          type: answer.fileType || 'application/octet-stream',
        });
        this.selectedFile = fakeFile;
      } else {
        this.closePreview();
      }
    }
  }

  toggleEmojiReaction(message: Message, emojiData: EmojiData) {
    const currentUserId = this.userId; // Aktuelle Benutzer-ID
    const currentUserIndex = emojiData.userIds.indexOf(currentUserId);
    if (currentUserIndex > -1) {
      emojiData.userIds.splice(currentUserIndex, 1);
    } else {
      emojiData.userIds.push(currentUserId);
    }
    this.updateEmojisInMessage(message);
  }

  updateEmojisInMessage(message: Message) {
    const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${message.messageId}`);
    updateDoc(messageRef, {
      emojis: message.emojis
    });
  }

  toggleUserEmoji(message: Message, emoji: string, userId: string) {
    const emojiData = message.emojis.find((e: EmojiData) => e.emoji === emoji);
    if (!emojiData) {
      message.emojis.push({ emoji, userIds: [userId] });
    } else {
      const userIdIndex = emojiData.userIds.indexOf(userId);
      if (userIdIndex === -1) {
        emojiData.userIds.push(userId);
      } else {
        emojiData.userIds.splice(userIdIndex, 1);
      }
    }
    this.updateEmojisInMessage(message);
  }

  toggleEmojiReactionForAnswer(answer: Answer, emojiData: EmojiData) {
    if (!emojiData || !emojiData.userIds) return;
    const currentUserId = this.userId;
    const currentUserIndex = emojiData.userIds.indexOf(currentUserId);
    if (currentUserIndex > -1) {
      emojiData.userIds.splice(currentUserIndex, 1);
    } else {
      emojiData.userIds.push(currentUserId);
    }
    this.emojiService.updateEmojisInAnswer(answer, this.selectedChannelId);
  }

  toggleUserEmojiAnswer(answer: Answer, emoji: string, userId: string) {
    this.emojiService.toggleUserEmojiAnswer(answer, emoji, userId, this.selectedChannelId)
  }

  toggleShowEmoji() { this.showEmoji = !this.showEmoji }

  toggleAllEmojitoAnswer(event: any, clickedAnswer: string) {
    event.stopPropagation();
    this.clickedAnswer = clickedAnswer;
    this.showAllAnswerEmoji = !this.showAllAnswerEmoji;
  }

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker
  }

  toggleAutoListe(event: MouseEvent) {
    event.stopPropagation();
    this.taggedUser = !this.taggedUser
  }

  addEmoji(event: any) {
    this.newAnswerText += event.emoji.native;
    this.showEmojiPicker = false;
  }

  addEmojiToAnswer(event: any, answer: Answer) {
    answer.editedText += event.emoji.native;
    this.showAnswerEmoji = false;
  }

  toggleEmojitoAnswer(event: MouseEvent) {
    event.stopPropagation();
    this.showAnswerEmoji = !this.showAnswerEmoji;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (!this.fileService.isFileSizeAllowed(file)) {
        this.errorMessage = 'Nur Bilder oder PDF-Dateien sind erlaubt.';
        this.fileService.resetFile();
        return;
      }
      if (!this.fileService.isFileTypeAllowed(file)) {
        this.errorMessage = 'Nur Bilder oder PDF-Dateien sind erlaubt.';
        this.fileService.resetFile();
        return;
      }
      this.selectedFile = file;
      const objectUrl = URL.createObjectURL(file);
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      this.resetErrorMessage();
    } else {
      this.resetErrorMessage();
    }
  }

  resetErrorMessage(): void { this.errorMessage = null; }


  closePreview() {
    this.fileUrl = null;
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const searchList = document.querySelector('.searchListe');
    const taggedUserDiv = document.querySelector('.tagged-user-list');
    const emojiPicker = document.querySelector('.emoji-picker');
    if (this.taggedUser && searchList && taggedUserDiv &&
      !searchList.contains(event.target as Node) && !taggedUserDiv.contains(event.target as Node)) {
      this.taggedUser = false;
    }
    if ((this.showEmojiPicker || this.showAnswerEmoji) && emojiPicker && !emojiPicker.contains(event.target as Node)) {
      this.showEmojiPicker = false;
      this.showAnswerEmoji = false;
    }
  }

  selectUser(user: User) {
    this.newAnswerText += `@${user.name}`;
    this.taggedUser = false;
  }

  ngAfterViewInit(): void {
    if (this.answersContainer?.nativeElement) {
      this.mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && this.answersService.shouldScrollToBottom) {
            this.scrollToBottom();
            this.answersService.shouldScrollToBottom = false; // Nach dem Scrollen zurücksetzen
          }
        }
      });

      this.mutationObserver.observe(this.answersContainer.nativeElement, { childList: true, subtree: false });
    }
  }

  scrollToBottom(): void {
    if (this.answersContainer?.nativeElement) {
      try {
        this.answersContainer.nativeElement.scrollTop = this.answersContainer.nativeElement.scrollHeight;
        this.answersService.shouldScrollToBottom = false;
      } catch (err) {
        console.error('Scrollen fehlgeschlagen:', err);
      }
    }
  }

  closeThread() { this.threadClosed.emit(); }
}