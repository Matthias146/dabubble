import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyBwJPfmT6PTkBT7Fluis_wfLDUbt7Y8mDY',
        authDomain: 'dabubble-ea8ed.firebaseapp.com',
        projectId: 'dabubble-ea8ed',
        storageBucket: 'dabubble-ea8ed.firebasestorage.app',
        messagingSenderId: '316136888446',
        appId: '1:316136888446:web:5a1f9c3171adb23706202f',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnimationsAsync(),
  ],
};
