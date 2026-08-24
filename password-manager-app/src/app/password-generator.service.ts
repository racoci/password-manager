import { Injectable } from '@angular/core';
import { SecurityLevel } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class PasswordGeneratorService {
  async generate(
    site: string, 
    user: string, 
    master: string, 
    created: string, 
    level: SecurityLevel = SecurityLevel.Low
  ): Promise<string> {
    // Incluir o nível de segurança na semente para mudar a senha completamente a cada nível
    const data = `${site}|${user}|${created}|${master}|${level}`;
    const enc = new TextEncoder().encode(data);
    let hash = await crypto.subtle.digest('SHA-256', enc);
    
    // Para o nível Ultra, faremos uma computação mais intensiva (ex: hash do hash)
    if (level === SecurityLevel.Ultra) {
      hash = await crypto.subtle.digest('SHA-256', hash);
    }
    
    const bytes = Array.from(new Uint8Array(hash));
    
    // Configurações de comprimento e caracteres baseado no nível de segurança
    let length = 16;
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    switch (level) {
      case SecurityLevel.Low:
        length = 12;
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // apenas alfanuméricos
        break;
      case SecurityLevel.Medium:
        length = 16;
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*'; // alfanuméricos + símbolos básicos
        break;
      case SecurityLevel.High:
        length = 24;
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*()_+-=[]{}|;:,.<>'; // símbolos avançados
        break;
      case SecurityLevel.Ultra:
        length = 32;
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*()_+-=[]{}|;:,.<>?/`~'; // segurança máxima
        break;
    }
    
    let result = '';
    for (let i = 0; i < length; i++) {
      // Usar XOR de bytes vizinhos para aumentar a variabilidade e evitar repetição de padrões na semente de 32 bytes
      const byteVal = bytes[i % bytes.length] ^ bytes[(i + 3) % bytes.length];
      const idx = byteVal % chars.length;
      result += chars[idx];
    }
    return result;
  }
}
