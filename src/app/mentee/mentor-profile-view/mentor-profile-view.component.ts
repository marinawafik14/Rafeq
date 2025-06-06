import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-mentor-profile-view',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './mentor-profile-view.component.html',
  styleUrls: ['./mentor-profile-view.component.css']
})
export class MentorProfileViewComponent implements OnInit {
  mentor: any = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const mentorId = params.get('id');
      if (mentorId) {
        this.http.get(`https://localhost:7001/api/mentors/${mentorId}`).subscribe({
          next: (data) => this.mentor = data,
          error: err => this.mentor = null
        });
      }
    });
  }
}
