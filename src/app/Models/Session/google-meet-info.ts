export interface GoogleMeetInfo {
  meetLink: string;
  isRealLink: boolean;
  linkType: string;
  canJoin: boolean;
  timeUntilSession?: number; // minutes until session starts
}
