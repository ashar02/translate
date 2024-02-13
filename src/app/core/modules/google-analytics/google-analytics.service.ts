import {Injectable, PLATFORM_ID, Inject} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {getCLS, getFID, getLCP} from 'web-vitals';
//import {FirebaseAnalytics} from '@capacitor-firebase/analytics';
//import {FirebasePerformance} from '@capacitor-firebase/performance';
import {environment} from '../../../../environments/environment';

function isPromise(promise) {
  return !!promise && typeof promise.then === 'function';
}

declare var gtag: Function;

declare global {
  interface Window {
    dataLayer: any[];
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAnalyticsService {
  traces: {name: string; time: number}[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeGoogleAnalytics();
      this.logPerformanceMetrics();
    }
  }

  get isSupported() {
    return environment.firebase.measurementId1 && 'window' in globalThis && 'document' in globalThis;
  }

  initializeGoogleAnalytics() {
    if (environment.firebase.measurementId1) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${environment.firebase.measurementId1}`;
      // Append the script element to the document head
      document.head.appendChild(script);
      // Initialize Google Analytics with the custom Measurement ID
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', environment.firebase.measurementId1);
    }
  }

  async setCurrentScreen(screenName: string) {
    if (!this.isSupported) {
      return;
    }
    //await FirebaseAnalytics.setCurrentScreen({screenName});
    gtag('config', environment.firebase.measurementId1, {'page_path': screenName});
  }

  logPerformanceMetrics() {
    if (!this.isSupported) {
      return;
    }

    const sendToGoogleAnalytics = ({name, delta, value, id}) => {
      /*return FirebaseAnalytics.logEvent({
        name,
        params: {
          value: delta,
          metric_id: id,
          metric_value: value,
          metric_delta: delta,
        },
      });*/
      gtag('event', name, {
        'event_category': 'Web Vitals',
        'event_label': name,
        'value': delta,
      });
    };

    getCLS(sendToGoogleAnalytics);
    getFID(sendToGoogleAnalytics);
    getLCP(sendToGoogleAnalytics);
  }

  async trace<T>(timingCategory: string, timingVar: string, callable: () => T): Promise<T> {
    //if (!this.isSupported) {
      return callable();
    //}

    const startTime = performance.now();
    /*const traceName = `${timingCategory}:${timingVar}`;
    await FirebasePerformance.startTrace({traceName});
    const stopTrace = () => {
      this.traces.push({name: traceName, time: performance.now() - startTime});
      FirebasePerformance.stopTrace({traceName}).catch().then();
    };

    let call = callable();
    if (isPromise(call)) {
      call = (call as any).then(async res => {
        stopTrace();
        return res;
      }) as any;
    } else {
      stopTrace();
    }*/
    const call = callable();
    if (isPromise(call)) {
      await (call as Promise<any>);
    }
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.traces.push({ name: `${timingCategory}:${timingVar}`, time: duration });

    const sendToGoogleAnalytics = ({ name, delta }) => {
      gtag('event', 'Web Vitals', {
        'event_category': 'Performance',
        'event_label': name,
        'value': delta,
      });
    };
    sendToGoogleAnalytics({name: `${timingCategory}:${timingVar}`, delta: duration});

    return call;
  }
}
