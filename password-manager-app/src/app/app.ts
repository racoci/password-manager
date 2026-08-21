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
  master = '';
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
  showMaster = false;
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
    this.password = ''; // Limpar senha anterior para forçar nova geração segura
  }

  deleteRecord(id: string, event: Event) {
    event.stopPropagation(); // Evitar disparar o clique do card de seleção
    if (confirm('Deseja realmente remover esta credencial salva?')) {
      this.config.removeRecord(id);
      this.loadRecords();
    }
  }

  async generate() {
    this.password = await this.gen.generate(this.site, this.user, this.master, this.created);
    const rec: PasswordRecord = {
      id: Date.now().toString(),
      site: this.site,
      user: this.user,
      created: this.created,
      level: this.level
    };
    this.config.addRecord(rec);
    this.loadRecords();
  }

  copyPassword() {
    if (!this.password) return;
    navigator.clipboard.writeText(this.password);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  async exportConfig() {
    const pw = prompt('Digite uma senha mestra para criptografar a exportação:') || '';
    if (!pw) return;
    const data = await this.config.export(pw);
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json.enc';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importConfig(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const pw = prompt('Digite a senha mestra usada na criptografia da exportação:') || '';
    if (!pw) return;
    const file = input.files[0];
    try {
      const text = await file.text();
      await this.config.import(pw, text.trim());
      this.loadRecords();
      alert('Configuração importada com sucesso!');
    } catch (e) {
      alert('Erro ao descriptografar arquivo. Senha incorreta ou arquivo corrompido.');
    } finally {
      input.value = '';
    }
  }
}
