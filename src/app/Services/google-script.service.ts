import { Injectable, NgZone } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
declare const google: any;
@Injectable({
  providedIn: 'root'
})
export class GoogleScriptService {
 private scriptLoaded = new ReplaySubject<boolean>(1);


  constructor(private ngZone: NgZone) {
    this.loadGoogleScript();
  }

  private loadGoogleScript(): void {
    if (typeof document !== 'undefined' && !document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-client-script';

      script.onload = () => {
        this.ngZone.run(() => {
          this.scriptLoaded.next(true);
        });
      };
      script.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('Failed to load Google Identity Services script:', error);
          this.scriptLoaded.error(new Error('Google script failed to load.'));
        });
      };
      document.head.appendChild(script);
    } else if (typeof google !== 'undefined') {
      this.scriptLoaded.next(true);
    }
  }

  isScriptLoaded(): Observable<boolean> {
    return this.scriptLoaded.asObservable();
  }
}
