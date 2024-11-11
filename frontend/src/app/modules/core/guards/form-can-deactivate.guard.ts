import {
  ActivatedRouteSnapshot,
  CanDeactivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import { AddTransactionComponent } from '../../finance/components/add-transaction/add-transaction.component';
import { EditTransactionComponent } from '../../finance/components/edit-transaction/edit-transaction.component';
import { PreferencesComponent } from '../../preferences/components/preferences/preferences.component';
import { ChangePasswordComponent } from '../../settings/components/change-password/change-password.component';
import { SettingsComponent } from '../../settings/components/settings/settings.component';

export const formCanDeactivateGuard: CanDeactivateFn<unknown> = (
  component: unknown,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot
) => {
  if (component instanceof AddTransactionComponent) {
    return component.form.dirty
      ? window.confirm('Do you really leave this page without save?')
      : true;
  }

  if (component instanceof EditTransactionComponent) {
    return component.activeButton
      ? window.confirm('Do you really leave this page without save?')
      : true;
  }

  if (component instanceof PreferencesComponent) {
    return component.activeButton
      ? window.confirm('Do you really leave this page without save?')
      : true;
  }

  if (component instanceof ChangePasswordComponent) {
    return component.changePasswordForm.dirty
      ? window.confirm('Do you really leave this page without save?')
      : true;
  }

  if (component instanceof SettingsComponent) {
    return component.activeButton
      ? window.confirm('Do you really leave this page without save?')
      : true;
  }

  return true;
};
