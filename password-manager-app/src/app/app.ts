import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordGeneratorService } from './password-generator.service';
import { ConfigService, PasswordRecord, SecurityLevel } from './config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
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

  constructor(private gen: PasswordGeneratorService, private config: ConfigService) {}

  ngOnInit() {
    this.loadRecords();
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
}
