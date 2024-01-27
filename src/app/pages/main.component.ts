import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs/operators';
import {GlobalFeatureFlagService} from '../features/services/feature-control-flag.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent {
  isMainPage$: Observable<boolean>;

  constructor(private router: Router, public globalFeatureFlagService: GlobalFeatureFlagService) {
    this.isMainPage$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects === '/')
    );
  }
}
