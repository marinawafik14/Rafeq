import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Skills } from '../Models/Skills';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
skillUrl = 'https://localhost:7001/api/admin/skills';
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
    return this.http.get<Skills[]>('https://localhost:7001/api/admin/mentors');
  }





}
