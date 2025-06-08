import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SharedService {

  //Variablen für Mobile Ansicht, word in der app.component gecheckt
  isMobile: boolean = false;
  goBackHeader: boolean = false;
  term2!:string;

  // Observable für den Suchbegriff
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  // Observable für den Zustand des Logout-Containers
  private logoutContainerActiveSubject = new BehaviorSubject<boolean>(false);
  logoutContainerActive$ = this.logoutContainerActiveSubject.asObservable();

  constructor(public dialog: MatDialog) { }
  // Aktuellen Suchbegriff verwenden -> wird in der header component bei input angewendet
  updateSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }

  // Methode zum Umschalten des Logout-Container-Zustands
  toggleLogoutContainer() {
    const currentStatus = this.logoutContainerActiveSubject.value;
    this.logoutContainerActiveSubject.next(!currentStatus);
  }

  // Methode zum Setzen des Logout-Container-Zustands
  setLogoutContainerActive(isActive: boolean) {
    this.logoutContainerActiveSubject.next(isActive);
  }


  // Timestamp generieren
  async getTimeStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };


  // Formatiertes Datum generieren
  async getFormattedDate(): Promise<string> {
    const now = new Date();
    const daysOfWeek = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const dayOfWeek = daysOfWeek[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];

    return `${dayOfWeek}, ${day}. ${month}`;
  }

  private mailChangeSuccessSubject = new BehaviorSubject<boolean>(false);
  mailChangeSuccess$ = this.mailChangeSuccessSubject.asObservable();

  // Methode, um den Zustand des Erfolgsdialogs zu ändern
  setMailChangeSuccess(state: boolean): void {
    this.mailChangeSuccessSubject.next(state);
  }


  private _loadingShown: boolean = false;

  set loadingShown(value: boolean) {
    this._loadingShown = value;
  }

  get loadingShown(): boolean {
    return this._loadingShown;
  }
}
