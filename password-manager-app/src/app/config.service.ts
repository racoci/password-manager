import { Injectable } from '@angular/core';

export enum SecurityLevel {
  Low = 1,
  Medium = 2,
  High = 3,
  Ultra = 4
}

export interface SecurityLevelConfig {
  level: SecurityLevel;
  description: string;
  defaultPRNG: string;
  requiresMasterPassword: boolean;
}

export interface PasswordRecord {
  id: string;
  site: string;
  user: string;
  created: string;
  level: SecurityLevel;
}

export interface PasswordConfig {
  records: PasswordRecord[];
  mnemonicHints: any[]; // placeholder for future MnemonicHint type
  prngAlgorithm: string;
  userSalt: string;
  securityLevels: SecurityLevelConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: PasswordConfig = {
    records: [],
    mnemonicHints: [],
    prngAlgorithm: 'SimpleHashPRNG',
    userSalt: '',
    securityLevels: [
      { level: SecurityLevel.Low, description: 'Low security', defaultPRNG: 'SimpleHashPRNG', requiresMasterPassword: false },
      { level: SecurityLevel.Medium, description: 'Medium security', defaultPRNG: 'SimpleHashPRNG', requiresMasterPassword: true },
      { level: SecurityLevel.High, description: 'High security', defaultPRNG: 'SimpleHashPRNG', requiresMasterPassword: true },
      { level: SecurityLevel.Ultra, description: 'Ultra security', defaultPRNG: 'SimpleHashPRNG', requiresMasterPassword: true }
    ]
  };

  getConfig(): PasswordConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  getRecords() {
    return [...this.config.records];
  }

  addRecord(r: PasswordRecord) {
    this.config.records.push(r);
  }

  async export(password: string): Promise<string> {
    const data = JSON.stringify(this.config);
    const enc = new TextEncoder().encode(data);
    const pwKey = await this.deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, pwKey, enc);
    const buf = new Uint8Array(iv.byteLength + cipher.byteLength);
    buf.set(iv, 0);
    buf.set(new Uint8Array(cipher), iv.byteLength);
    return btoa(String.fromCharCode(...buf));
  }

  async import(password: string, encoded: string) {
    const buf = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const iv = buf.slice(0, 12);
    const data = buf.slice(12);
    const pwKey = await this.deriveKey(password);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, pwKey, data);
    const dec = new TextDecoder().decode(plain);
    const parsed = JSON.parse(dec) as PasswordConfig;
    for (const rec of parsed.records) {
      if (rec.level === undefined) {
        (rec as PasswordRecord).level = SecurityLevel.Low;
      }
    }
    this.config = parsed;
  }

  private async deriveKey(password: string) {
    const enc = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new Uint8Array(16), iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
