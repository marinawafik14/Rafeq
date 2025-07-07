import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminArticleListComponent } from './admin-article-list.component';

describe('AdminArticleListComponent', () => {
  let component: AdminArticleListComponent;
  let fixture: ComponentFixture<AdminArticleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminArticleListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminArticleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
