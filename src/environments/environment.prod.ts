import type {InitialNavigation} from '@angular/router';

export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyAtVDGmDVCwWunWW2ocgeHWnAsUhHuXvcg',
    authDomain: 'sign-mt.firebaseapp.com',
    projectId: 'sign-mt',
    storageBucket: 'sign-mt.appspot.com',
    messagingSenderId: '665830225099',
    appId: '1:665830225099:web:18e0669d5847a4b047974e',
    measurementId: null,
    measurementId1: 'G-KEZV2TK7R6',
  },
  reCAPTCHAKey: '6Ldsxb8oAAAAAGyUZbyd0QruivPSudqAWFygR-4t',
  initialNavigation: 'enabledBlocking' as InitialNavigation,
  features: {
    appHeader: false,
    appFooter: false,
    translationButton: false,
    languageSwapButton: false,
    languageDetectionButton: false,
    signedLanguageViewSelector: false,
    feedbackButton: false,
    textLanguages: ['en'],
    signedLanguages: ['ase', 'csl', 'pks'],
  },
  apiBaseUrl: 'http://localhost:3001',
};
