import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Skills } from '../Models/Skills';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private skillUrl = `${environment.apiUrl}/admin/skills`;
  private publicSkillUrl = `${environment.apiUrl}/skills`;
  
  constructor(private http : HttpClient) { }
  // get all skills
  getAllSkills() : Observable<Skills[]>{
    return this.http.get<Skills[]>(this.skillUrl);
  }
  
  // get skill by id
  getSkillById(skillId: number): Observable<Skills> {
    return this.http.get<Skills>(`${this.skillUrl}/${skillId}`);
  }

  //put
  updateSkill (SkillId: number, skill: Skills):Observable<Skills>{
    return this.http.put<Skills>(`${this.skillUrl}/${SkillId}`, skill);
  } 
  
  //post
  addSkill(skill: Skills): Observable<Skills> {
    return this.http.post<Skills>(this.skillUrl, skill);
  }
  
  //delete
  deleteSkill(skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.skillUrl}/${skillId}`);
  }

  // //get all mentors
  getAllMentors(): Observable<Skills []> {
    return this.http.get<Skills[]>(`${environment.apiUrl}/admin/mentors`);
  }

  // get all skills for mentee (public endpoint)
  getAllSkillsForMentee(): Observable<Skills[]> {
    console.log('Making API call to:', this.publicSkillUrl);
    return this.http.get<any[]>(this.publicSkillUrl).pipe(
      map((apiSkills: any[]) => 
        apiSkills.map((skill: any) => ({
          SkillId: skill.id,
          Name: skill.name,
          MentorsCount: skill.mentorsCount || 0,
          MentorName: skill.mentorName || '',
          MentorId: skill.mentorId || 0,
          IsDeleted: skill.isDeleted || false
        } as Skills))
      )
    );
  }





}
