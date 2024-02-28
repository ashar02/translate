import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {GlobalFeatureFlagService} from 'src/app/features/services/feature-control-flag.service';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  baseUrl = environment.apiBaseUrl;
  signedLanguages = [
    'ase',
    'gsg',
    'fsl',
    'bfi',
    'ils',
    'sgg',
    'ssr',
    'slf',
    'ssp',
    'jos',
    'rsl-by',
    'bqn',
    'csl',
    'csq',
    'cse',
    'dsl',
    'ins',
    'nzs',
    'eso',
    'fse',
    'asq',
    'gss-cy',
    'gss',
    'icl',
    'ise',
    'jsl',
    'lsl',
    'lls',
    'psc',
    'pso',
    'bzs',
    'psr',
    'rms',
    'rsl',
    'svk',
    'aed',
    'csg',
    'csf',
    'mfs',
    'swl',
    'tsm',
    'ukl',
    'pks',
  ];

  spokenLanguages = [
    'en',
    'de',
    'fr',
    'af',
    'sq',
    'am',
    'ar',
    'hy',
    'az',
    'eu',
    'be',
    'bn',
    'bs',
    'bg',
    'ca',
    'ceb',
    'ny',
    'zh',
    'co',
    'hr',
    'cs',
    'da',
    'nl',
    'eo',
    'et',
    'tl',
    'fi',
    'fy',
    'gl',
    'ka',
    'es',
    'el',
    'gu',
    'ht',
    'ha',
    'haw',
    'he',
    'hi',
    'hmn',
    'hu',
    'is',
    'ig',
    'id',
    'ga',
    'it',
    'ja',
    'jv',
    'kn',
    'kk',
    'km',
    'rw',
    'ko',
    'ku',
    'ky',
    'lo',
    'la',
    'lv',
    'lt',
    'lb',
    'mk',
    'mg',
    'ms',
    'ml',
    'mt',
    'mi',
    'mr',
    'mn',
    'my',
    'ne',
    'no',
    'or',
    'ps',
    'fa',
    'pl',
    'pt',
    'pa',
    'ro',
    'ru',
    'sm',
    'gd',
    'sr',
    'st',
    'sn',
    'sd',
    'si',
    'sk',
    'sl',
    'so',
    'su',
    'sw',
    'sv',
    'tg',
    'ta',
    'tt',
    'te',
    'th',
    'tr',
    'tk',
    'uk',
    'ur',
    'ug',
    'uz',
    'vi',
    'cy',
    'xh',
    'yi',
    'yo',
    'zu',
  ];

  constructor(private http: HttpClient, private globalFeatureFlagService: GlobalFeatureFlagService) {
    if (globalFeatureFlagService.getSignedLanguages().length > 0) {
      this.signedLanguages = globalFeatureFlagService.getSignedLanguages();
    }
    if (globalFeatureFlagService.getTextLanguages().length > 0) {
      this.spokenLanguages = globalFeatureFlagService.getTextLanguages();
    }
  }

  normalizeSpokenLanguageText(language: string, text: string): Observable<string> {
    const params = new URLSearchParams();
    params.set('lang', language);
    params.set('text', text);
    const url = `${this.baseUrl}/api/text-normalization?${params.toString()}`;

    return this.http.get<{text: string}>(url).pipe(map(response => response.text));
  }

  describeSignWriting(fsw: string): Observable<string> {
    const url = `${this.baseUrl}/api/signwriting-description`;

    return this.http
      .post<{result: {description: string}}>(url, {data: {fsw}})
      .pipe(map(response => response.result.description));
  }

  translateSpokenToSigned(text: string, spokenLanguage: string, signedLanguage: string): string {
    let api = 'https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose';
    if (this.isMyOwnPage() === true || this.isOwnPage() === true) {
      api = `${this.baseUrl}/spoken_text_to_signed_pose`;
    }
    let url = `${api}?text=${encodeURIComponent(text)}&spoken=${spokenLanguage}&signed=${signedLanguage}`;
    if (this.isMyOwnPage() === true) {
      url += '&myown=true';
    }
    return url;
  }

  private isOwnPage(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('own') && urlParams.get('own') === 'true';
  }

  private isMyOwnPage(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('myown') && urlParams.get('myown') === 'true';
  }
}
