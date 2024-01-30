import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GlobalFeatureFlagService {
  private appHeader: boolean = environment.features.appHeader;
  private appFooter: boolean = environment.features.appFooter;
  private translationButton: boolean = environment.features.translationButton;
  private languageSwapButton: boolean = environment.features.languageSwapButton;
  private languageDetectionButton: boolean = environment.features.languageDetectionButton;
  private signedLanguageViewSelector: boolean = environment.features.signedLanguageViewSelector;
  private feedbackButton: boolean = environment.features.feedbackButton;
  private textLanguages: Array<string> = environment.features.textLanguages;
  private signedLanguages: Array<string> = environment.features.signedLanguages;

  constructor() {}

  setEnableAppHeader(value: boolean) {
    this.appHeader = value;
  }

  getEnableAppHeader(): boolean {
    return this.appHeader;
  }

  setEnableAppFooter(value: boolean) {
    this.appFooter = value;
  }

  getEnableAppFooter(): boolean {
    return this.appFooter;
  }

  setEnablTranslationButton(value: boolean) {
    this.translationButton = value;
  }

  getEnableTranslationButton(): boolean {
    return this.translationButton;
  }

  setEnableLanguageSwapButton(value: boolean) {
    this.languageSwapButton = value;
  }

  getEnableLanguageSwapButton(): boolean {
    return this.languageSwapButton;
  }

  setEnableLanguageDetectionButton(value: boolean) {
    this.languageDetectionButton = value;
  }

  getEnableLanguageDetectionButton(): boolean {
    return this.languageDetectionButton;
  }

  setEnableSignLanguageViewSelector(value: boolean) {
    this.signedLanguageViewSelector = value;
  }

  getEnableSignLanguageViewSelector(): boolean {
    return this.signedLanguageViewSelector;
  }

  setEnableFeedbackButton(value: boolean) {
    this.feedbackButton = value;
  }

  getEnableFeedbackButton() {
    return this.feedbackButton;
  }

  getTextLanguages() {
    return this.textLanguages;
  }

  getSignedLanguages() {
    return this.signedLanguages;
  }
}
