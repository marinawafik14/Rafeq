export interface BookingAction {
  type: 'confirm' | 'cancel' | 'complete' | 'join' | 'reschedule' | 'view';
  label: string;
  icon: string;
  cssClass: string;
  enabled: boolean;
}
