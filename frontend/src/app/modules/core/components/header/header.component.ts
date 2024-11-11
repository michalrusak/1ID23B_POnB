import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectAuthUser } from 'src/app/modules/auth/store/auth.selector';
import { AppState } from 'src/app/store/app.reducer';
import { RouterEnum } from 'src/enums/router.enum';
import * as AuthActions from '../../../auth/store/auth.actions';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  constructor(private store: Store<AppState>) {}

  user$: Observable<User | null> = this.store.select(selectAuthUser);

  RouterEnum = RouterEnum;

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
