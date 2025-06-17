import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PasswordGeneratorService } from './password-generator.service';
import { ConfigService, PasswordRecord, SecurityLevel } from './config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
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

  constructor(private gen: PasswordGeneratorService, private config: ConfigService) {}

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
  }

  async exportConfig() {
    const pw = prompt('Export password') || '';
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
    const pw = prompt('Import password') || '';
    if (!pw) return;
    const file = input.files[0];
    const text = await file.text();
    await this.config.import(pw, text.trim());
    input.value = '';
  }
}
