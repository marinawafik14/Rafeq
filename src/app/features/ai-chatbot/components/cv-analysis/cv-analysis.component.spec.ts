import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvAnalysisComponent } from './cv-analysis.component';

describe('CvAnalysisComponent', () => {
  let component: CvAnalysisComponent;
  let fixture: ComponentFixture<CvAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
