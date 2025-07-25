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
  Math = Math;

  constructor(private skillService: SkillService) { }
  ngOnInit(): void {
    this.getAllSkills();
  }

  addSkill() {
    if (!this.newSkillName.trim()) return;

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
        this.showAddSkillForm = false; 
        this.newSkillName = '';
        this.getAllSkills(); 
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
        this.editSkillId = null; 
        this.editSkillName = ''; 
        this.getAllSkills();
      }
    },
    )
  }

  cancelEditSkill() {
    this.editSkillId = null; 
    this.editSkillName = ''; 
  }



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
            this.getAllSkills(); 
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
        
        console.log("skills is ", this.skills);
      },
      error: (err) => {
        console.error('Error fetching mentors:', err);
      }
    });
  }

 
 filterSkills(): Skills[] {
  const query = this.searchQuery.toLowerCase();
  let filtered = this.skills.filter(skill =>
    !skill.IsDeleted &&
    (!this.selectedMentorId || skill.MentorId === this.selectedMentorId) &&
    (skill.Name && skill.Name.toLowerCase().includes(query))
  );

 
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

 
  getAllMentorSkills() {
    this.skillService.getAllMentors().subscribe({
      next: (mentors: any[]) => {
        
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

    
    return estimatedUniqueMentors;
  }

  getMostPopularSkill(): string {
    if (this.skills.length === 0) return 'N/A';

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

    const skillsWithMentors = this.skills.filter(skill =>
      !skill.IsDeleted && skill.MentorsCount && skill.MentorsCount > 0
    ).length;

    const average = skillsWithMentors / totalMentors;

    console.log('Skills with mentors:', skillsWithMentors);
    console.log('Total mentors:', totalMentors);
    console.log('Average skills per mentor:', average.toFixed(1));

    return average.toFixed(1);
  }

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

  getTotalActiveSkills(): number {
    const uniqueActiveSkills = new Set(
      this.skills
        .filter(skill => !skill.IsDeleted)
        .map(skill => skill.Name)
    );
    return uniqueActiveSkills.size;
  }

  exportSkills(): void {
    const filteredSkills = this.filterSkills();
    if (filteredSkills.length === 0) {
      Swal.fire('No Data', 'There are no skills to export.', 'info');
      return;
    }
    const csvData = filteredSkills.map(skill => ({
      'Skill ID': skill.SkillId,
      'Skill Name': skill.Name,
      'Mentor Count': skill.MentorsCount,
      'Mentor Name': skill.MentorName || '',
      'Mentor ID': skill.MentorId || ''
    }));
    const csvContent = this.convertToCSV(csvData);
    this.downloadCSV(csvContent, 'skills-export.csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    return [header, ...rows].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  

  
}