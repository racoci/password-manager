import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('DeterminaPass');
  });

  it('should generate different passwords and lengths based on security level', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.site = 'github.com';
    app.user = 'user@test.com';
    app.master = 'supersecret';
    app.created = '2026-08-24';

    // Test Low level
    app.level = 1; // SecurityLevel.Low
    await app.generate();
    const passLow = app.password;
    expect(passLow.length).toBe(12);

    // Test Medium level
    app.level = 2; // SecurityLevel.Medium
    await app.generate();
    const passMedium = app.password;
    expect(passMedium.length).toBe(16);
    expect(passMedium).not.toBe(passLow);

    // Test Ultra level
    app.level = 4; // SecurityLevel.Ultra
    await app.generate();
    const passUltra = app.password;
    expect(passUltra.length).toBe(32);
    expect(passUltra).not.toBe(passMedium);
  });
});
