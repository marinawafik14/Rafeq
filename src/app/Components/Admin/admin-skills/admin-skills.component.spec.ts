import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSkillsComponent } from './admin-skills.component';

describe('AdminSkillsComponent', () => {
  let component: AdminSkillsComponent;
  let fixture: ComponentFixture<AdminSkillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSkillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
