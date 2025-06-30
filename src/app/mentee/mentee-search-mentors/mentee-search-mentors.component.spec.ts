import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenteeSearchMentorsComponent } from './mentee-search-mentors.component';

describe('MenteeSearchMentorsComponent', () => {
  let component: MenteeSearchMentorsComponent;
  let fixture: ComponentFixture<MenteeSearchMentorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenteeSearchMentorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenteeSearchMentorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
