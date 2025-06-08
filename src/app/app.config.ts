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
        apiKey: 'AIzaSyClzhAFdytdihNb8kRl9LMYBeKK5DkNAmM',
        authDomain: 'dabubble-fbfe2.firebaseapp.com',
        projectId: 'dabubble-fbfe2',
        storageBucket: 'abubble-fbfe2.firebasestorage.app',
        messagingSenderId: '866605276491',
        appId: '1:866605276491:web:c767f1877083ab7c175cce"',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnimationsAsync(),
  ],
};
