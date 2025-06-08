import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  constructor(
    public firestore: Firestore, 
    private sanitizer: DomSanitizer
  ) {}

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isTouchEvent = false; // Verhindert doppelte Ausführung bei Touch und Maus
  private seconds: number = 0;
  private timerInterval: any;
  recordingAudio: boolean = false;
  displayTime: string = '00:00';
  audioDownloadUrl: string = '';
  fileType: string = '';
  safeAudioUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert


  async startRecording(event: MouseEvent | TouchEvent){
    // Prüfen, ob es sich um ein Touch-Event handelt
    if (event.type === 'touchstart') {
      this.isTouchEvent = true;
    }

    // Verhindert Doppelereignisse (z. B. auf Touch-Laptops)
    if (this.isTouchEvent && event.type === 'mousedown') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.safeAudioUrl = '';
    this.audioDownloadUrl = '';
    this.recordingAudio = true;
    this.startTimer();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }
  

  stopRecording(event: MouseEvent | TouchEvent){
    // Prüfen, ob es sich um ein Touch-Event handelt
    if (event.type === 'touchend') {
      this.isTouchEvent = true;
    }

    // Verhindert Doppelereignisse (z. B. auf Touch-Laptops)
    if (this.isTouchEvent && event.type === 'mouseup') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.mediaRecorder?.stop();
    this.recordingAudio = false;
    this.resetTimer();
    this.mediaRecorder?.addEventListener("stop", () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/mpeg' });
      this.uploadAudio(audioBlob);
    });
      // Zurücksetzen für zukünftige Ereignisse
    if (event.type === 'touchend' || event.type === 'mouseup') {
      this.isTouchEvent = false;
    }
  }


  startTimer(){
    this.timerInterval = setInterval(() => {
      this.seconds++;
      this.updateDisplay();
    }, 1000);
  }
  

  stopTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }


  resetTimer(): void {
    this.stopTimer();
    this.seconds = 0;
    this.updateDisplay();
  }


  private updateDisplay(): void {
    const minutes = Math.floor(this.seconds / 60);
    const remainingSeconds = this.seconds % 60;
    this.displayTime = 
      `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }


  async uploadAudio(audioBlob: Blob) {
    const storage = getStorage();
    const audioRef = ref(storage, `audios/${Date.now()}.mp3`);
    // Datei zu Firebase Storage hochladen
    const snapshot = await uploadBytes(audioRef, audioBlob);
    const url = await getDownloadURL(snapshot.ref);
    this.audioDownloadUrl = url;
    this.fileType = audioBlob.type;
    await this.loadSafeAudioFile(this.audioDownloadUrl, this.fileType)
  }


  //Audio löschen
  deleteAudio(audioName: string) {
    const storage = getStorage();
    const fileRef = ref(storage, audioName);
    deleteObject(fileRef).then(() => {
    }).catch((error) => {
      console.error('Fehler beim Löschen der Datei:', error);
    });
  }
  
  
  //Holt sich eine sichere URL
  async loadSafeAudioFile(fileUrl: string, fileType:string) {
    if (!fileUrl) {
      console.error('Die Datei-URL ist ungültig.');
      return;
    }
    if(fileType == 'audio/mpeg'){
      this.safeAudioUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }
  }
}
