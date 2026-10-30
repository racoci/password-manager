import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordGeneratorService } from './password-generator.service';
import { ConfigService, PasswordRecord, SecurityLevel } from './config.service';
import { QrSyncService } from './qr-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  site = '';
  user = '';
  globalMaster = '';
  serviceMaster = '';
  created = new Date().toISOString().substring(0,10);
  password = '';
  level: SecurityLevel = SecurityLevel.Low;

  levels = [
    { value: SecurityLevel.Low, label: 'Low - Básico' },
    { value: SecurityLevel.Medium, label: 'Medium - Recomendado' },
    { value: SecurityLevel.High, label: 'High - Sensível' },
    { value: SecurityLevel.Ultra, label: 'Ultra - Máxima Segurança' }
  ];

  records: PasswordRecord[] = [];
  searchQuery = '';
  showGlobalMaster = false;
  showServiceMaster = false;
  copied = false;

  // QR Sync State
  qrModalOpen = false;
  qrDataUrl = '';
  qrTitle = '';
  scanModalOpen = false;
  isScanningCamera = false;
  scanStatus = '';
  private videoStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerCanvas') scannerCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(
    private gen: PasswordGeneratorService, 
    private config: ConfigService,
    public qrSync: QrSyncService
  ) {}

  ngOnInit() {
    this.loadRecords();
  }

  ngOnDestroy() {
    this.stopCameraScan();
  }

  loadRecords() {
    this.records = this.config.getRecords();
  }

  get filteredRecords(): PasswordRecord[] {
    if (!this.searchQuery) return this.records;
    const q = this.searchQuery.toLowerCase();
    return this.records.filter(r => 
      r.site.toLowerCase().includes(q) || 
      r.user.toLowerCase().includes(q)
    );
  }

  selectRecord(rec: PasswordRecord) {
    this.site = rec.site;
    this.user = rec.user;
    this.created = rec.created;
    this.level = rec.level;
    this.generate(); // Recalcula automaticamente se ambas as senhas mestras estiverem preenchidas
  }

  deleteRecord(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Deseja realmente remover este serviço salvo?')) {
      this.config.removeRecord(id);
      this.loadRecords();
    }
  }

  async generate() {
    if (this.site && this.user && this.globalMaster && this.serviceMaster) {
      this.password = await this.gen.generate(
        this.site, 
        this.user, 
        this.globalMaster, 
        this.serviceMaster, 
        this.created, 
        this.level
      );
    } else {
      this.password = '';
    }
  }

  async saveRecord() {
    if (!this.site || !this.user) return;
    const rec: PasswordRecord = {
      id: Date.now().toString(),
      site: this.site,
      user: this.user,
      created: this.created,
      level: this.level
    };
    this.config.addRecord(rec);
    this.loadRecords();
    alert('Serviço salvo nos favoritos locais com sucesso!');
  }

  copyPassword() {
    if (!this.password) return;
    navigator.clipboard.writeText(this.password);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  exportYaml() {
    const data = this.config.exportYaml();
    const blob = new Blob([data], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importConfig(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const text = await file.text();

    if (file.name.endsWith('.yaml') || file.name.endsWith('.yml') || text.trim().startsWith('services:')) {
      this.config.importYaml(text);
      this.loadRecords();
      alert('Arquivo YAML público importado com sucesso!');
      input.value = '';
      return;
    }

    // Se for arquivo criptografado legado
    const pw = prompt('Digite a senha mestra usada na criptografia do backup legado:') || '';
    if (!pw) {
      input.value = '';
      return;
    }

    try {
      await this.config.import(pw, text.trim());
      this.loadRecords();
      alert('Configuração legada importada com sucesso!');
    } catch (e) {
      alert('Erro ao descriptografar arquivo.');
    } finally {
      input.value = '';
    }
  }

  // === QR Code Sync (Exportação & Importação Criptografada) ===

  async exportQr(currentOnly = false) {
    let targets: PasswordRecord[] = [];
    if (currentOnly) {
      if (!this.site || !this.user) {
        alert('Preencha ao menos o Site e Usuário para exportar o serviço atual.');
        return;
      }
      targets = [{
        id: Date.now().toString(),
        site: this.site,
        user: this.user,
        created: this.created,
        level: this.level
      }];
      this.qrTitle = `QR Code: ${this.site}`;
    } else {
      targets = this.config.getRecords();
      if (targets.length === 0) {
        alert('Não há serviços salvos para exportar via QR Code.');
        return;
      }
      this.qrTitle = `QR Code: ${targets.length} Serviços Salvos`;
    }

    const passphrase = prompt('Crie uma senha de transferência / PIN para criptografar este QR Code (ex: 6 dígitos ou palavra-chave):') || '';
    if (!passphrase) return;

    try {
      const payload = await this.qrSync.encryptAndEncode(targets, passphrase);
      this.qrDataUrl = await this.qrSync.generateQrDataUrl(payload);
      this.qrModalOpen = true;
    } catch (err: any) {
      alert('Erro ao gerar QR Code criptografado: ' + err.message);
    }
  }

  closeQrModal() {
    this.qrModalOpen = false;
    this.qrDataUrl = '';
  }

  openScanModal() {
    this.scanModalOpen = true;
    this.scanStatus = 'Aponte a câmera para o QR Code ou selecione uma imagem.';
    setTimeout(() => this.startCameraScan(), 200);
  }

  closeScanModal() {
    this.stopCameraScan();
    this.scanModalOpen = false;
    this.scanStatus = '';
  }

  async startCameraScan() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.scanStatus = 'Câmera não suportada neste navegador. Use a opção de imagem abaixo.';
      return;
    }

    try {
      this.isScanningCamera = true;
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (this.scannerVideo?.nativeElement) {
        this.scannerVideo.nativeElement.srcObject = this.videoStream;
        this.scannerVideo.nativeElement.setAttribute('playsinline', 'true');
        await this.scannerVideo.nativeElement.play();
        this.scanStatus = 'Câmera ativa. Buscando QR Code...';
        this.scanFrame();
      }
    } catch (err) {
      this.isScanningCamera = false;
      this.scanStatus = 'Permissão de câmera negada ou dispositivo indisponível. Carregue uma imagem do QR Code.';
    }
  }

  private scanFrame = () => {
    if (!this.isScanningCamera || !this.scannerVideo?.nativeElement || !this.scannerCanvas?.nativeElement) {
      return;
    }

    const video = this.scannerVideo.nativeElement;
    const canvas = this.scannerCanvas.nativeElement;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrContent = this.qrSync.scanFromImageData(imageData);
        if (qrContent) {
          this.processScannedPayload(qrContent);
          return;
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.scanFrame);
  };

  stopCameraScan() {
    this.isScanningCamera = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  async handleQrImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrContent = this.qrSync.scanFromImageData(imageData);
        URL.revokeObjectURL(img.src);
        input.value = '';
        if (qrContent) {
          this.processScannedPayload(qrContent);
        } else {
          alert('Nenhum QR Code legível foi detectado nesta imagem.');
        }
      }
    };
  }

  private async processScannedPayload(payload: string) {
    this.stopCameraScan();
    const passphrase = prompt('QR Code detectado! Digite a senha / PIN de transferência para descriptografar:') || '';
    if (!passphrase) {
      this.closeScanModal();
      return;
    }

    try {
      const records = await this.qrSync.decodeAndDecrypt(payload, passphrase);
      for (const r of records) {
        this.config.addRecord(r);
      }
      this.loadRecords();
      alert(`Sucesso! ${records.length} serviço(s) importado(s) e adicionado(s) aos seus favoritos.`);
      this.closeScanModal();
    } catch (err: any) {
      alert('Falha ao descriptografar QR Code: ' + err.message);
      this.closeScanModal();
    }
  }
}
