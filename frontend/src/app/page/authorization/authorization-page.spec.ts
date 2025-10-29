import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AuthorizationPage } from "./authorization-page";

describe("Authorization", () => {
  let component: AuthorizationPage;
  let fixture: ComponentFixture<AuthorizationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
