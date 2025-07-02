import { Component, OnInit } from '@angular/core';
import { AddSkillComponent } from "../add-skill/add-skill.component";
import { SkillService } from '../../../Services/skill.service';
import { Skills } from '../../../Models/Skills';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-skills',
  imports: [ CommonModule , FormsModule],
  standalone: true,
  templateUrl: './admin-skills.component.html',
  styleUrl: './admin-skills.component.css'
})
export class AdminSkillsComponent implements OnInit {
  skills :Skills[]=[];
   showAddSkillForm = false;
   newSkillName: string = '';
  editSkillId: number | null = null;
  editSkillName: string = '';
   selectedMentorId: number | '' = '';
   mentors :{ MentorId: number, MentorName: string }[] = [];
 searchQuery: string = '';
currentPage : number = 1;
  itemsPerPage: number = 20;
  
  // Add Math property for template access
  Math = Math;

constructor (private skillService: SkillService) {}
  ngOnInit(): void {
    this.getAllSkills();
  }

  //add skill
  addSkill() {
    if (!this.newSkillName.trim()) return;
    this.skillService.addSkill({
      Name: this.newSkillName,
      SkillId: 0,
      MentorsCount: 0,
      MentorName: '',
      MentorId: 0,
      IsDeleted: false
    }).subscribe({
      next: (data) => {
        this.skills.push(data);
          this.showAddSkillForm = false; // Hide the form after saving
        this.newSkillName = ''; // Clear the input field
        this.getAllSkills(); // Refresh the skills list
      },
      error: (err) => {
        console.error('Error adding skill:', err);
      }
    });
  }

startEditSkill(skill: Skills) {
  this.editSkillId = skill.SkillId;
  this.editSkillName = skill.Name;
}


saveEditSkill(skill : Skills) {
  if(!this.editSkillName.trim() || this.editSkillId === null) return;
  this.skillService.updateSkill(skill.SkillId,{
    Name: this.editSkillName,
    SkillId: 0,
    MentorsCount: 0,
    MentorName: '',
    MentorId: 0,
    IsDeleted: false
  }).subscribe({
    next: () => {
        const index = this.skills.findIndex(s => s.SkillId === this.editSkillId);
        if (index !== -1) {
          this.skills[index].Name = this.editSkillName;
        }
        this.editSkillId = null; // Reset edit state
        this.editSkillName = ''; // Clear the input field
        this.getAllSkills();
  }},
  )
}

//cancelEditSkill()
  cancelEditSkill() {
    this.editSkillId = null; // Reset edit state
    this.editSkillName = ''; // Clear the input field
  }

 

//soft delete skills
  softDeleteSkill(skill: Skills) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This skill will be deleted From all Users!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.skillService.updateSkill(skill.SkillId, {
        IsDeleted: true,
        SkillId: 0,
        Name: '',
        MentorsCount: 0,
        MentorName: '',
        MentorId: 0
      }).subscribe({
        next: () => {
          this.getAllSkills(); // Refresh the list
          Swal.fire('Deleted!', 'Skill has been deleted.', 'success');
        },
        error: (err) => {
          console.error('Error soft deleting skill:', err);
          Swal.fire('Error', 'Failed to delete skill.', 'error');
        }
      });
    }
  });
}

updateSkill(skill:Skills){
    this.skillService.updateSkill(skill.SkillId , skill).subscribe({
      next:(Updateddata)=>{
        const index = this.skills.findIndex(s => s.SkillId === skill.SkillId)
        if (index !== -1) {
          this.skills[index] = Updateddata;
        }
      },
      error: (err) => {
        console.error('Error updating skill:', err);
      }
    })
  }

  // get skill by id
  getSkillById(skillId: number) {
    this.skillService.getSkillById(skillId).subscribe({
      next: (data) => {
        const skill = this.skills.find(s => s.SkillId === skillId);
        if (skill) {
          Object.assign(skill, data);
        }
      },
      error: (err) => {
        console.error('Error fetching skill by ID:', err);
      }
    });
  }

  //get all skills
  getAllSkills (){
    this.skillService.getAllSkills().subscribe({
      next: (data) => {
       this.skills= data.map((s: any) => ({
          SkillId: s.id,
          Name: s.name,
       MentorsCount :s.mentorsCount,
          MentorId: s.mentorId,
          MentorName: s.mentorName,
          IsDeleted: s.isDeleted
        }));
       // this.getAllMentorSkills();
        console.log( "skills is ",this.skills);
      },
      error: (err) => {
        console.error('Error fetching mentors:', err);
      }
    });
  }

// Search skills
filterSkills(): Skills[] {
  const query = this.searchQuery.toLowerCase();
  return this.skills.filter(skill =>
     !skill.IsDeleted && 
    (!this.selectedMentorId || skill.MentorId === this.selectedMentorId) &&
    (
      (skill.Name && skill.Name.toLowerCase().includes(query)) ||
      (skill.MentorName && skill.MentorName.toLowerCase().includes(query))
    )
  );
}
  
// Get all mentor skills
getAllMentorSkills() {
  this.skillService.getAllMentors().subscribe({
    next: (mentors: any[]) => {
      // Flatten mentor-skill pairs
      this.skills = mentors.flatMap(mentor =>
        (mentor.skills || []).map((skill: any) => ({
          SkillId: skill.skillId,
          Name: skill.skillName,
          Usage: skill.usage,
          MentorName: mentor.fullName,
          MentorId: mentor.id
        }))
      );
      console.log(this.skills);
    },
    error: (err) => {
      console.error('Error fetching mentors:', err);
    }
  });
}

getpaginatedSkills(): Skills[] {
  const filterd = this.filterSkills();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage; 
        const endIndex = startIndex + this.itemsPerPage;     
        return filterd.slice(startIndex, endIndex);
        
      }

get totalPages(): number {
    return Math.ceil(this.filterSkills().length / this.itemsPerPage);
  }
  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
    }
  } 

// Add methods for stats cards that were missing
getTotalMentors(): number {
  const uniqueMentors = new Set(this.skills.map(skill => skill.MentorId).filter(id => id));
  return uniqueMentors.size;
}

getMostPopularSkill(): string {
  if (this.skills.length === 0) return 'N/A';
  
  const skillCounts = this.skills.reduce((acc, skill) => {
    acc[skill.Name] = (acc[skill.Name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostPopular = Object.entries(skillCounts).reduce((a, b) => 
    skillCounts[a[0]] > skillCounts[b[0]] ? a : b
  );
  
  return mostPopular[0] || 'N/A';
}

getAverageSkillsPerMentor(): string {
  const totalMentors = this.getTotalMentors();
  const totalSkills = this.skills.length;
  
  if (totalMentors === 0) return '0';
  
  const average = totalSkills / totalMentors;
  return average.toFixed(1);
}

}





