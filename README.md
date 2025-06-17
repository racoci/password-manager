### Plano de Divisão de Tarefas

---

#### **Fase 1 – Refatoração e Base de Dados Configurável**

* ✅ **Criar um novo tipo para o Config JSON exportável**, por exemplo:

```ts
export interface PasswordConfig {
  records: PasswordRecord[];
  mnemonicHints: MnemonicHint[];
  prngAlgorithm: string;
  userSalt: string;
  securityLevels: SecurityLevelConfig[];
}
```

---

#### **Fase 2 – Hierarquia de Níveis de Segurança**

* ✅ Criar um enum de níveis:

```ts
export enum SecurityLevel {
  Low = 1,
  Medium = 2,
  High = 3,
  Ultra = 4,
}
```

* ✅ Adicionar campo `level: SecurityLevel` nos `PasswordRecord`
* ✅ Modificar o form para permitir escolher o nível ao gerar a senha

---

#### **Fase 3 – Abstração de PRNG**

* ⬜ Criar uma interface `IPseudoRandomGenerator`:

```ts
export interface IPseudoRandomGenerator {
  seed(seedInput: string): void;
  nextBytes(length: number): Uint8Array;
  nextInt(min: number, max: number): number;
}
```

* ⬜ Criar implementações como:

| Nome           | Método                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| SimpleHashPRNG | SHA-256+counter                                                         |
| HMACPRNG       | HMAC-based Deterministic PRNG                                           |
| WebCryptoPRNG  | Wrapper sobre crypto.subtle (não determinístico, para futuras features) |

* ⬜ Deixar o `PasswordGeneratorService` usar uma PRNG injetável

---

#### **Fase 4 – Gerador de Senhas Hierárquico**

* ⬜ Para cada nível de segurança:

| Nível  | Método                                                                   |
| ------ | ------------------------------------------------------------------------ |
| Low    | Hash(site+user+created) → base64 de 8 a 12 chars                         |
| Medium | Adiciona palavras mnemônicas como prefixo ou sufixo                      |
| High   | Exige master password, PBKDF2(master+site+user+created)                  |
| Ultra  | Permite processo interativo (exemplo: 3 rodadas de sugestões mnemônicas) |

---

#### **Fase 5 – Sistema de Dicas Mnemônicas**

* ⬜ Criar um tipo `MnemonicHint`:

```ts
export interface MnemonicHint {
  id: string;
  prompt: string;
  userResponse: string;
  timestamp: string;
}
```

* ⬜ Criar UI:

  * Sugerir palavra
  * Usuário escreve o que a palavra lembra
  * Persistir isso no config

* ⬜ Adicionar a lista de dicas exportáveis junto no JSON

---

#### **Fase 6 – Export/Import Completo (Agora Incluindo Tudo)**

* ⬜ O método de exportação agora exporta o objeto completo `PasswordConfig`
* ⬜ Criptografia continua sendo AES-GCM com PBKDF2, mas agora sobre o novo JSON mais completo

---

#### **Fase 7 – Interface de Escolha de Algoritmo e Nível**

* ⬜ Dropdown ou radio buttons no formulário:

  * Escolher nível de segurança
  * Escolher algoritmo de PRNG

---

#### **Fase 8 – Testes e Validação de Determinismo**

* ⬜ Criar uma função de "replay generation":

  * Dado um config + input, re-gerar todas as senhas anteriores e conferir se bate

---

### Se quiser avançar para Fases Futuras:

* **Fase 9 – Modo Multi-Senha com um Único Master Key** (tipo derivação hierárquica)
* **Fase 10 – Integração com FIDO2 / WebAuthn para futuras autenticações**
* **Fase 11 – UI com histórico de geração e logs de uso**

---

### Para Provar que Essa Abordagem Está Correta:

* A estrutura modular permitirá adicionar, testar e modificar partes do sistema sem quebrar o resto
* Mantemos **pseudo-determinismo por construção**, porque:

  * Cada algoritmo recebe seed controlada
  * Todo estado relevante vai para o JSON exportado
* **Referência conceitual**: Esta abordagem segue a ideia de "deterministic password generators" como **LessPass** e **MasterPasswordApp**, mas expandindo para um modelo multi-nível com mais controle sobre entropia mnemônica.
