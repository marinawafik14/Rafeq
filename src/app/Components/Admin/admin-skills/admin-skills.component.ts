import { Component, OnInit } from '@angular/core';
import { AddSkillComponent } from "../add-skill/add-skill.component";
import { SkillService } from '../../../Services/skill.service';
import { Skills } from '../../../Models/Skills';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-skills',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './admin-skills.component.html',
  styleUrl: './admin-skills.component.css'
})
export class AdminSkillsComponent implements OnInit {
  skills: Skills[] = [];
  showAddSkillForm = false;
  newSkillName: string = '';
  editSkillId: number | null = null;
  editSkillName: string = '';
  selectedMentorId: number | '' = '';
  mentors: { MentorId: number, MentorName: string }[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 20;
  sortOption: string = 'name';
  // Add Math property for template access
  Math = Math;

  constructor(private skillService: SkillService) { }
  ngOnInit(): void {
    this.getAllSkills();
  }

  //add skill
  addSkill() {
    if (!this.newSkillName.trim()) return;

    // Check if skill already exists (case-insensitive, not deleted)
    const exists = this.skills.some(
      skill => skill.Name.trim().toLowerCase() === this.newSkillName.trim().toLowerCase() && !skill.IsDeleted
    );

    if (exists) {
      Swal.fire({
        icon: 'warning',
        title: 'Skill already exists',
        text: 'This skill is already in the list.',
      });
      return;
    }

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


  saveEditSkill(skill: Skills) {
    if (!this.editSkillName.trim() || this.editSkillId === null) return;
    this.skillService.updateSkill(skill.SkillId, {
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
      }
    },
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

  updateSkill(skill: Skills) {
    this.skillService.updateSkill(skill.SkillId, skill).subscribe({
      next: (Updateddata) => {
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
  getAllSkills() {
    this.skillService.getAllSkills().subscribe({
      next: (data) => {
        this.skills = data.map((s: any) => ({
          SkillId: s.id,
          Name: s.name,
          MentorsCount: s.mentorsCount,
          MentorId: s.mentorId,
          MentorName: s.mentorName,
          IsDeleted: s.isDeleted
        }));
        // this.getAllMentorSkills();
        console.log("skills is ", this.skills);
      },
      error: (err) => {
        console.error('Error fetching mentors:', err);
      }
    });
  }

  // Search skills
 filterSkills(): Skills[] {
  const query = this.searchQuery.toLowerCase();
  let filtered = this.skills.filter(skill =>
    !skill.IsDeleted &&
    (!this.selectedMentorId || skill.MentorId === this.selectedMentorId) &&
    (skill.Name && skill.Name.toLowerCase().includes(query))
  );

  // Sorting 
  switch (this.sortOption) {
    case 'name':
      filtered = filtered.sort((a, b) => a.Name.localeCompare(b.Name));
      break;
    case 'mentors':
      filtered = filtered.sort((a, b) => (b.MentorsCount || 0) - (a.MentorsCount || 0));
      break;
    case 'recent':
      filtered = filtered.sort((a, b) => (b.SkillId || 0) - (a.SkillId || 0));
      break;
  }

  return filtered;
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


  getTotalMentors(): number {
    
    const totalMentorSkillRelationships = this.skills
      .filter(skill => !skill.IsDeleted && skill.MentorsCount && skill.MentorsCount > 0)
      .reduce((sum, skill) => sum + skill.MentorsCount, 0);

    const estimatedUniqueMentors = Math.ceil(totalMentorSkillRelationships / 3);

    //console.log('Total mentor-skill relationships:', totalMentorSkillRelationships);
    //console.log('Estimated unique mentors:', estimatedUniqueMentors);

    return estimatedUniqueMentors;
  }

  getMostPopularSkill(): string {
    if (this.skills.length === 0) return 'N/A';

    // Find skill with highest MentorsCount
    const skillsWithMentors = this.skills.filter(skill =>
      !skill.IsDeleted && skill.MentorsCount && skill.MentorsCount > 0
    );

    if (skillsWithMentors.length === 0) return 'N/A';

    const mostPopular = skillsWithMentors.reduce((max, current) =>
      (current.MentorsCount || 0) > (max.MentorsCount || 0) ? current : max
    );

    console.log('Most popular skill:', mostPopular.Name, 'with', mostPopular.MentorsCount, 'mentors');
    return mostPopular.Name;
  }

  getAverageSkillsPerMentor(): string {
    const totalMentors = this.getTotalMentors();

    if (totalMentors === 0) return '0.0';

    // Count total skills that have mentors
    const skillsWithMentors = this.skills.filter(skill =>
      !skill.IsDeleted && skill.MentorsCount && skill.MentorsCount > 0
    ).length;

    const average = skillsWithMentors / totalMentors;

    console.log('Skills with mentors:', skillsWithMentors);
    console.log('Total mentors:', totalMentors);
    console.log('Average skills per mentor:', average.toFixed(1));

    return average.toFixed(1);
  }

  // Alternative more accurate method if you want to call a different API
  getActualMentorStats(): void {
    this.skillService.getAllMentors().subscribe({
      next: (mentors: any[]) => {
        console.log('Actual mentors from API:', mentors);
      },
      error: (err) => {
        console.error('Error fetching mentors:', err);
      }
    });
  }

  // Add methods for stats cards that were missing
  getTotalActiveSkills(): number {
    const uniqueActiveSkills = new Set(
      this.skills
        .filter(skill => !skill.IsDeleted)
        .map(skill => skill.Name)
    );
    return uniqueActiveSkills.size;
  }


  // debugSkillsData(): void {
  //   console.log('=== SKILLS DEBUG ===');
  //   console.log('Total skills from API:', this.skills.length);
  //   console.log('Sample skills data:', this.skills.slice(0, 3));

  //   // Check mentor associations
  //   const skillsWithMentors = this.skills.filter(skill => skill.MentorId && skill.MentorId > 0);
  //   console.log('Skills with mentors:', skillsWithMentors.length);
  //   console.log('Skills with mentors sample:', skillsWithMentors.slice(0, 3));

  //   // Check mentor counts
  //   const skillsWithMentorCounts = this.skills.filter(skill => skill.MentorsCount && skill.MentorsCount > 0);
  //   console.log('Skills with mentor counts > 0:', skillsWithMentorCounts.length);
  //   console.log('Skills with mentor counts sample:', skillsWithMentorCounts.slice(0, 3));

  //   // Check for deleted skills
  //   const deletedSkills = this.skills.filter(skill => skill.IsDeleted);
  //   console.log('Deleted skills:', deletedSkills.length);

  //   console.log('===================');
  // }

  
}