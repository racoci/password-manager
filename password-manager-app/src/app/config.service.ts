import { Injectable } from '@angular/core';

export interface PasswordRecord {
  id: string;
  site: string;
  user: string;
  created: string;
  level: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private records: PasswordRecord[] = [];

  getRecords() {
    return [...this.records];
  }

  addRecord(r: PasswordRecord) {
    this.records.push(r);
  }

  async export(password: string): Promise<string> {
    const data = JSON.stringify(this.records);
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
    this.records = JSON.parse(dec) as PasswordRecord[];
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
