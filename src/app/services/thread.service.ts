import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private threadClosedSource = new BehaviorSubject<boolean>(false);
  threadClosed$ = this.threadClosedSource.asObservable();

  closeThread() {
    this.threadClosedSource.next(true);
  }

  openThread() {
    this.threadClosedSource.next(false);
  }
}
