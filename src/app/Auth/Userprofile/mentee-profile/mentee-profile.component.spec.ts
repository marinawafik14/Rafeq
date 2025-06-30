import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenteeProfileComponent } from './mentee-profile.component';

describe('MenteeProfileComponent', () => {
  let component: MenteeProfileComponent;
  let fixture: ComponentFixture<MenteeProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenteeProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenteeProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
