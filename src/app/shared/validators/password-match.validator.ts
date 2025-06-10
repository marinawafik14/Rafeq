import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordsMatchValidator(
  passwordControlName: string,
  confirmPasswordControlName: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const passwordControl = control.get(passwordControlName);
    const confirmPasswordControl = control.get(confirmPasswordControlName);

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    if (passwordControl.value !== confirmPasswordControl.value) {
      confirmPasswordControl.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    } else {
      if (confirmPasswordControl.hasError('passwordsMismatch')) {
        confirmPasswordControl.setErrors(null);
      }
    }
    return null;
  };
}
