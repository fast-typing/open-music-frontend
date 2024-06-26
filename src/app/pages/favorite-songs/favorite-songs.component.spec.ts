import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoriteSongsComponent } from './favorite-songs.component';

describe('FavoriteSongsComponent', () => {
  let component: FavoriteSongsComponent;
  let fixture: ComponentFixture<FavoriteSongsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoriteSongsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FavoriteSongsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
