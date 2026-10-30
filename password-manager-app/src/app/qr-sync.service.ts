import { Injectable } from '@angular/core';
import { PasswordRecord, SecurityLevel } from './config.service';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

export type CompactRecord = [string, string, string, number]; // [site, user, created, level]

@Injectable({
  providedIn: 'root'
})
export class QrSyncService {
  private readonly PROTOCOL_PREFIX = 'DP1:';

  // Serializa registros no formato mais compacto possível
  toCompact(records: PasswordRecord[]): CompactRecord[] {
    return records.map(r => [r.site, r.user, r.created, r.level]);
  }

  fromCompact(compacts: CompactRecord[]): PasswordRecord[] {
    return compacts.map(([site, user, created, level]) => ({
      id: Date.now().toString() + Math.random().toString().substring(2, 6),
      site,
      user,
      created,
      level: (level as SecurityLevel) || SecurityLevel.Low
    }));
  }

  // Compressão Deflate nativa de alta eficiência
  async compress(bytes: Uint8Array): Promise<Uint8Array> {
    const stream = new Response(bytes as any).body!.pipeThrough(new CompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  // Descompressão Deflate simétrica
  async decompress(bytes: Uint8Array): Promise<Uint8Array> {
    const stream = new Response(bytes as any).body!.pipeThrough(new DecompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  // Derivação de chave AES-GCM via PBKDF2 com Salt
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Criptografa, comprime e gera string do QR Code
  async encryptAndEncode(records: PasswordRecord[], passphrase: string): Promise<string> {
    const compact = this.toCompact(records);
    const jsonStr = JSON.stringify(compact);
    const rawBytes = new TextEncoder().encode(jsonStr);

    // 1. Compressão Deflate
    const compressed = await this.compress(rawBytes);

    // 2. Geração de Salt e IV aleatórios
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 3. Criptografia AES-GCM 256
    const key = await this.deriveKey(passphrase, salt);
    const encryptedBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      compressed as any
    );
    const ciphertext = new Uint8Array(encryptedBuf);

    // 4. Pacote binário: [Salt: 16] + [IV: 12] + [Ciphertext + AuthTag]
    const packet = new Uint8Array(salt.length + iv.length + ciphertext.length);
    packet.set(salt, 0);
    packet.set(iv, salt.length);
    packet.set(ciphertext, salt.length + iv.length);

    // 5. Conversão binária para Base64 segura
    let binary = '';
    for (let i = 0; i < packet.length; i++) {
      binary += String.fromCharCode(packet[i]);
    }
    const b64 = btoa(binary);

    return `${this.PROTOCOL_PREFIX}${b64}`;
  }

  // Decodifica, descriptografa e descomprime o payload do QR Code
  async decodeAndDecrypt(payload: string, passphrase: string): Promise<PasswordRecord[]> {
    const trimmed = payload.trim();
    if (!trimmed.startsWith(this.PROTOCOL_PREFIX)) {
      throw new Error('Formato de QR Code inválido ou incompatível.');
    }

    const b64 = trimmed.substring(this.PROTOCOL_PREFIX.length);
    const binary = atob(b64);
    const packet = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      packet[i] = binary.charCodeAt(i);
    }

    if (packet.length < 28) {
      throw new Error('Payload muito curto para conter cabeçalhos de segurança.');
    }

    // Extrai Salt (16B), IV (12B) e Ciphertext
    const salt = packet.slice(0, 16);
    const iv = packet.slice(16, 28);
    const ciphertext = packet.slice(28);

    const key = await this.deriveKey(passphrase, salt);
    let decryptedBuf: ArrayBuffer;
    try {
      decryptedBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        ciphertext as any
      );
    } catch {
      throw new Error('Falha na autenticação ou senha de transferência incorreta.');
    }

    // Descompressão Deflate
    const decompressed = await this.decompress(new Uint8Array(decryptedBuf));
    const jsonStr = new TextDecoder().decode(decompressed);
    const compact = JSON.parse(jsonStr) as CompactRecord[];
    return this.fromCompact(compact);
  }

  // Gera Data URL do QR code para exibição em imagem
  async generateQrDataUrl(payload: string): Promise<string> {
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  }

  // Decodifica QR code a partir de ImageData do Canvas
  scanFromImageData(imageData: ImageData): string | null {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });
    return code ? code.data : null;
  }
}
