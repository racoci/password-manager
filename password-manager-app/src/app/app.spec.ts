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
    app.globalMaster = 'supersecretglobal';
    app.serviceMaster = 'servicespecific';
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

  it('should export and import public records in YAML symmetrically', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const config = (app as any).config;

    config.addRecord({
      id: '1',
      site: 'gitlab.com',
      user: 'dev@gitlab.com',
      created: '2026-01-01',
      level: 3
    });

    const yaml = config.exportYaml();
    expect(yaml).toContain('site: "gitlab.com"');
    expect(yaml).toContain('user: "dev@gitlab.com"');
    expect(yaml).toContain('security_level: 3');

    // Symmetrical import
    config.importYaml(yaml);
    const records = config.getRecords();
    const imported = records.find((r: any) => r.site === 'gitlab.com');
    expect(imported).toBeDefined();
    expect(imported?.user).toBe('dev@gitlab.com');
    expect(imported?.level).toBe(3);
  });

  it('should encrypt, compress, and symmetrically decrypt records via QR payload', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const qrSync = (app as any).qrSync;

    const sampleRecords = [
      { id: '1', site: 'github.com', user: 'alice@test.com', created: '2026-10-30', level: 2 },
      { id: '2', site: 'amazon.com', user: 'bob@test.com', created: '2026-10-25', level: 4 }
    ];

    const passphrase = 'SecretTransferPassword123!';

    // Encrypt and compress
    const qrPayload = await qrSync.encryptAndEncode(sampleRecords, passphrase);
    expect(qrPayload.startsWith('DP1:')).toBeTrue();

    // Verify it generates a valid QR data URL
    const qrDataUrl = await qrSync.generateQrDataUrl(qrPayload);
    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBeTrue();

    // Decrypt and decompress
    const decrypted = await qrSync.decodeAndDecrypt(qrPayload, passphrase);
    expect(decrypted.length).toBe(2);
    expect(decrypted[0].site).toBe('github.com');
    expect(decrypted[0].user).toBe('alice@test.com');
    expect(decrypted[0].level).toBe(2);
    expect(decrypted[1].site).toBe('amazon.com');
    expect(decrypted[1].level).toBe(4);

    // Verify wrong password fails
    let failed = false;
    try {
      await qrSync.decodeAndDecrypt(qrPayload, 'WrongPassword!');
    } catch {
      failed = true;
    }
    expect(failed).toBeTrue();
  });
});
