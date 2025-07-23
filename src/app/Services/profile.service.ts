import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment.development';
import { UserProfile } from '../Models/User/user-profile';
import { ProfileUpdateRequest } from '../Models/User/profile-update-request';
import { Skill } from '../Models/Skills/skill';
import { UserSkill } from '../Models/Skills/user-skill';
import { FileUploadResponse } from '../Models/Upload/file-upload-response';
import { ChangePassword } from '../Models/UserProfile/ChangePassword';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<{success: boolean, data: UserProfile}>(`${this.apiUrl}/users/profile`)
      .pipe(
        map(response => response.data)
      );
  }

 
  updateProfile(profileData: ProfileUpdateRequest): Observable<UserProfile> {
    return this.http.put<{success: boolean, data: UserProfile}>(`${this.apiUrl}/users/profile`, profileData)
      .pipe(
        map(response => response.data)
      );
  }



 
  updateHourlyRate(hourlyRate: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/hourly-rate`, { hourlyRate });
  }

 
  uploadProfilePicture(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(`${this.apiUrl}/users/profile-picture`, formData)
      .pipe(
        map(response => response.profilePictureUrl)
      );
  }


  getAllSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/skills`);
  }


  getUserSkills(): Observable<UserSkill[]> {
    return this.http.get<{success: boolean, data: UserSkill[]}>(`${this.apiUrl}/skills/user`)
      .pipe(
        map(response => response.data)
      );
  }

 
  addSkillToUser(skillId: number): Observable<UserSkill[]> {
    return this.http.post<{success: boolean, skills: UserSkill[]}>(`${this.apiUrl}/skills/user`, { skillId })
      .pipe(
        map(response => response.skills)
      );
  }

  removeSkillFromUser(skillId: number): Observable<UserSkill[]> {
    return this.http.delete<{success: boolean, skills: UserSkill[]}>(`${this.apiUrl}/skills/user/${skillId}`)
      .pipe(
        map(response => response.skills)
      );
  }

    
}
