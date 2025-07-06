import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFaqListComponent } from './admin-faq-list.component';

describe('AdminFaqListComponent', () => {
  let component: AdminFaqListComponent;
  let fixture: ComponentFixture<AdminFaqListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFaqListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminFaqListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
