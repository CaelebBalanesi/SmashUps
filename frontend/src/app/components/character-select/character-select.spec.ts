import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterSelect } from './character-select';

describe('CharacterSelect', () => {
  let component: CharacterSelect;
  let fixture: ComponentFixture<CharacterSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
