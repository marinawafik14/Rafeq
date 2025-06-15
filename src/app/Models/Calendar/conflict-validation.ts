export interface ConflictValidation {
  hasConflict: boolean;
  conflictingSlots: number[];
  message: string;
}
