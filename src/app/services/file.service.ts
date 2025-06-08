import { Injectable } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { getDownloadURL, uploadBytes } from '@angular/fire/storage';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class FileService {

  fileUrl: SafeResourceUrl | null = null;
  selectedFile: File | null = null;
  fileDownloadUrl: string = '';
  selectedFileName: string = '';  // Neuer Dateiname-String
  selectedFileType: string = '';
  safeFileUrl: SafeResourceUrl | null = null;
  fileSize: boolean = false;
  fileType: boolean = false;

  private _errorMessage = new BehaviorSubject<string | null>(null);
  errorMessage$ = this._errorMessage.asObservable();

  constructor(private sanitizer: DomSanitizer) { }

  extractFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    const decodedUrl = decodeURIComponent(fileUrl);
    const parts = decodedUrl.split('/');
    const lastPart = parts[parts.length - 1];
    const fileName = lastPart.split('?')[0];
    return fileName;
  }


  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (!this.isFileSizeAllowed(file)) {
        this._errorMessage.next('Die Datei darf maximal 500 KB groß sein.');
        this.resetFile();
        return;
      }
      if (!this.isFileTypeAllowed(file)) {
        this._errorMessage.next('Nur Bilder oder PDF-Dateien sind erlaubt.');
        this.resetFile();
        return;
      }
      this.selectedFile = file;
      const objectUrl = URL.createObjectURL(file);
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      this._errorMessage.next(null);
    } else {
      this.resetErrorMessage();
    }
  }

  resetErrorMessage(): void {
    this._errorMessage.next(null);
  }

  setFileUrl(file: File) {
    this.selectedFile = file;
    const objectUrl = URL.createObjectURL(file);
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
  }

  resetFile() {
    this.selectedFile = null;
    this.fileUrl = null;
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getFileNameFromUrl(fileUrl: string): string {
    return fileUrl.split('/').pop() || 'Datei';
  }

  closePreview() {
    this.fileUrl = null; 
    this.selectedFile = null; 
  }
  
  async uploadFiles(): Promise<string | null> {
    if (!this.selectedFile) return null;
    const filePath = `files/${this.selectedFile.name}`;
    const storageRef = ref(getStorage(), filePath);
    try {
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      const fileUrl = await getDownloadURL(snapshot.ref);

      this.fileDownloadUrl = fileUrl;
      return fileUrl;
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      return null;
    }
  }


  async uploadFileIfSelected(type: 'message' | 'answer') {
    if (!this.selectedFile) return null;
  
    const uniqueFileName = `${Date.now()}_${this.selectedFile.name}`;
    const filePath = `${type === 'answer' ? 'answers' : 'messages'}/${uniqueFileName}`;
    const storageRef = ref(getStorage(), filePath);
  
    try {
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      throw error;
    }
  }
  
  removeFile(message: any) {
    message.fileUrl = '';
    message.fileName = '';
    message.fileType = '';
    message.selectedFile = null;
  }

  //CHAT-FILE-UPLOAD
  //Datei hinzufügen
  onFileSelectedChat(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return; // Keine Datei ausgewählt
    }
    const file = input.files[0];
    if (!this.isFileTypeAllowed(file)) {
      this.showFileTypeInfo();
      return;
    }
    if (!this.isFileSizeAllowed(file)) {
      this.showFileSizeInfo();
      return;
    }
    this.processSelectedFile(file);
  }


  //Datei ändern
  async onChangeFileSelected(event: Event, fileToDelete: string) {
    this.deleteFile(fileToDelete); //Alte Datei löschen
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return; // Keine Datei ausgewählt
    }
    const file = input.files[0];
    if (!this.isFileTypeAllowed(file)) {
      this.showFileTypeInfo();
      return;
    }
    if (!this.isFileSizeAllowed(file)) {
      this.showFileSizeInfo();
      return;
    }
    this.processSelectedFile(file);
  }


  isFileTypeAllowed(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    return allowedTypes.includes(file.type);
  }


  isFileSizeAllowed(file: File): boolean {
    const maxSize = 500 * 1024; // 500 kB in Bytes
    return file.size <= maxSize;
  }


  showFileTypeInfo() {
    this.fileType = true;
    setTimeout(() => {
      this.fileType = false;
    }, 3000);
  }


  showFileSizeInfo() {
    this.fileSize = true;
    setTimeout(() => {
      this.fileSize = false;
    }, 3000);
  }


  processSelectedFile(file: File) {
    this.selectedFile = file;
    this.selectedFileName = file.name; // Dateiname speichern
    this.selectedFileType = file.type;
    this.uploadFile(); // Datei hochladen
  }


  //Holt sich eine sichere URL
  async loadSafeFile(fileUrl: string, fileType: string) {
    if (!fileUrl) {
      console.error('Die Datei-URL ist ungültig.');
      return;
    }
    if (fileType == 'image/png' || 'image/jpeg' || 'application/pdf') {
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }
  }


  //File in den Storage hochladen
  async uploadFile() {
    if (!this.selectedFile) return;

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `files/${this.selectedFileName}`);
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      const url = await getDownloadURL(snapshot.ref);
      this.fileDownloadUrl = url;
      this.loadPdfPreview();
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
    }
  }


  async loadPdfPreview() {
    if (this.selectedFileType == 'application/pdf') {
      await this.loadSafeFile(this.fileDownloadUrl, this.selectedFileType)
    }
  }


  //File im Browser abrufen und laden
  downloadFile(fileDownloadUrl: string, fileName: string) {
    const link = document.createElement('a');
    link.href = fileDownloadUrl;
    link.target = '_blank';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  //Datei löschen
  deleteFile(fileName: string) {
    const storage = getStorage();
    const fileRef = ref(storage, '/files/' + fileName);

    deleteObject(fileRef).then(() => {
    }).catch((error) => {
      console.error('Fehler beim Löschen der Datei:', error);
    });
  }
}