import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Store} from '@ngxs/store';
import {takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../../../components/base/base.component';
import {GlobalFeatureFlagService} from 'src/app/features/services/feature-control-flag.service';

@Component({
  selector: 'app-translate-desktop',
  templateUrl: './translate-desktop.component.html',
  styleUrls: ['./translate-desktop.component.scss'],
})
export class TranslateDesktopComponent extends BaseComponent implements OnInit {
  spokenToSigned$: Observable<boolean>;
  spokenToSigned: boolean;
  enableTranslation: boolean;

  constructor(private store: Store, public globalFeatureFlagService: GlobalFeatureFlagService) {
    super();

    this.spokenToSigned$ = this.store.select<boolean>(state => state.translate.spokenToSigned);
    this.enableTranslation = this.globalFeatureFlagService.getEnableTranslationButton();
  }

  ngOnInit(): void {
    this.spokenToSigned$
      .pipe(
        tap(spokenToSigned => (this.spokenToSigned = spokenToSigned)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }
}
