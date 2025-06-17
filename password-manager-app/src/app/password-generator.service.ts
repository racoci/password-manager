import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PasswordGeneratorService {
  async generate(site: string, user: string, master: string, created: string, length = 16): Promise<string> {
    const data = `${site}|${user}|${created}|${master}`;
    const enc = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(hash));
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const idx = bytes[i % bytes.length] % chars.length;
      result += chars[idx];
    }
    return result;
  }
}
