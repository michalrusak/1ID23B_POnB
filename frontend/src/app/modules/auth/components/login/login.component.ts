import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.reducer';
import { RouterEnum } from 'src/enums/router.enum';
import * as AuthActions from '../../store/auth.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  RouterEnum = RouterEnum;

  form = new FormGroup({
    username: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
      ],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30),
      ],
      nonNullable: true,
    }),
  });

  constructor(private store: Store<AppState>) {}

  get controls() {
    return this.form.controls;
  }

  getErrorMessage(control: FormControl) {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('minlength')) {
      return 'Not enough characters';
    }
    if (control.hasError('maxlength')) {
      return 'Too many characters';
    }
    return '';
  }

  onSubmit() {
    if (this.form.valid) {
      this.store.dispatch(
        AuthActions.login({ loginData: this.form.getRawValue() })
      );
    }
  }
}