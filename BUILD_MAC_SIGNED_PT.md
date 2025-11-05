# IGRP Studio - Guia de Build Assinado para macOS

Guia completo para construir e assinar o IGRP Studio para distribuição em macOS.

---

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração da Conta Apple Developer](#configuração-da-conta-apple-developer)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Configuração do Projeto](#configuração-do-projeto)
5. [Construção da Aplicação](#construção-da-aplicação)
6. [Verificação](#verificação)
7. [Resolução de Problemas](#resolução-de-problemas)
8. [Notas e Boas Práticas](#notas-e-boas-práticas)

---

## Pré-requisitos

### Requisitos do Sistema

- **macOS**: 10.15 (Catalina) ou superior recomendado
- **Xcode Command Line Tools**: Necessário para assinatura de código

    ```bash
    xcode-select --install
    ```

### Requisitos de Software

- **Node.js**: Versão `^20.19.0` ou `>=22.12.0`

    ```bash
    node --version
    ```

- **Yarn**: Gestor de pacotes

    ```bash
    npm install -g yarn
    ```

### Requisitos da Apple Developer

- **Conta Apple Developer** (subscrição paga necessária)
- **Certificado Developer ID Application** instalado no Keychain
- **Team ID** da sua conta Apple Developer
- **Palavra-passe específica da aplicação** para notarização

---

## Configuração da Conta Apple Developer

### 1. Aceder ao Portal Apple Developer

1. Aceda a [https://developer.apple.com](https://developer.apple.com)
2. Inicie sessão com o seu Apple ID
3. Certifique-se de que tem uma subscrição de programador paga ativa

### 2. Encontrar o Seu Team ID

1. Navegue até à secção **Membership**
2. O seu **Team ID** é apresentado (formato: `XXXXXXXXXX`)
3. Copie e guarde este valor

### 3. Criar Certificado Developer ID Application

#### Opção A: Usando o Keychain Access (Recomendado)

1. Abra o **Keychain Access** (Aplicações → Utilitários)
2. Vá a **Keychain Access** → **Assistente de Certificado** → **Solicitar um Certificado de uma Autoridade de Certificação**
3. Preencha o formulário:
    - **Endereço de Email do Utilizador**: O email do seu Apple ID
    - **Nome Comum**: O seu nome ou nome da empresa
    - **Endereço de Email da AC**: Deixe vazio
    - Selecione **"Guardado em disco"**
4. Guarde o ficheiro Certificate Signing Request (CSR)
5. Aceda a [Certificados Apple Developer](https://developer.apple.com/account/resources/certificates/list)
6. Clique em **+** para criar um novo certificado
7. Selecione **Developer ID Application** em "Software"
8. Carregue o seu ficheiro CSR
9. Descarregue o certificado
10. Faça duplo clique para o instalar no seu Keychain

#### Opção B: Usar Certificado Existente

Se o certificado já estiver instalado, verifique que existe:

```bash
security find-identity -v -p codesigning
```

Deve ver uma entrada como:

```
1) XXXXX "Developer ID Application: Seu Nome (TEAM_ID)"
```

### 4. Gerar Palavra-passe Específica da Aplicação

1. Aceda a [https://appleid.apple.com](https://appleid.apple.com)
2. Inicie sessão com o seu Apple ID
3. Navegue até à secção **Segurança**
4. Em **Palavras-passe Específicas de Apps**, clique em **Gerar Palavra-passe**
5. Nomeie: "IGRP Studio Notarization"
6. Copie a palavra-passe gerada (formato: `xxxx-xxxx-xxxx-xxxx`)
7. **Importante**: Guarde esta palavra-passe de forma segura, não poderá visualizá-la novamente

---

## Configuração do Ambiente

### Criar Ficheiro `.env.signing`

No diretório raiz do projeto, crie um ficheiro chamado `.env.signing`:

```bash
cd /caminho/para/igrp-studio-ide
touch .env.signing
```

### Adicionar Credenciais

Abra `.env.signing` e adicione o seguinte:

```env
APPLE_ID=seu.email@example.com
APPLE_TEAM_ID=QT6DP36974
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Substitua pelos seus valores reais:**

- `APPLE_ID`: O email da sua conta Apple Developer
- `APPLE_TEAM_ID`: O seu Team ID de 10 caracteres
- `APPLE_APP_SPECIFIC_PASSWORD`: A palavra-passe específica da aplicação que gerou

### Considerações de Segurança

**CRÍTICO**: Nunca faça commit do `.env.signing` para controlo de versão!

Verifique que está no `.gitignore`:

```bash
grep "\.env\.signing" .gitignore
```

Se não estiver presente, adicione:

```bash
echo ".env.signing" >> .gitignore
```

---

## Configuração do Projeto

### 1. Navegar para o Diretório do Projeto

```bash
cd /caminho/para/igrp-studio-ide
```

### 2. Instalar Dependências

```bash
yarn install
```

Saída esperada:

```
✓ Dependências instaladas com sucesso
```

### 3. Verificar Ficheiros de Configuração

Certifique-se de que estes ficheiros existem:

- `build/entitlements.mac.plist` ✓
- `scripts/sign-and-build.sh` ✓
- `.env.signing` (acabou de criar)

```bash
ls -la build/entitlements.mac.plist
ls -la scripts/sign-and-build.sh
ls -la .env.signing
```

### 4. Tornar o Script de Build Executável

```bash
chmod +x scripts/sign-and-build.sh
```

---

## Construção da Aplicação

### Comandos de Build Disponíveis

O projeto fornece quatro opções de build:

#### 1. Build Universal (Recomendado)

Constrói para Macs Intel e Apple Silicon:

```bash
yarn release:mac:universal:signed
```

**Usar quando**: Deseja máxima compatibilidade (mais comum)

#### 2. Build Intel (x64)

Constrói apenas para Macs baseados em Intel:

```bash
yarn release:mac:x64:signed
```

**Usar quando**: Apenas pretende suportar Macs Intel

#### 3. Build Apple Silicon (ARM64)

Constrói apenas para Macs Apple Silicon (M1, M2, M3, etc.):

```bash
yarn release:mac:arm64:signed
```

**Usar quando**: Apenas pretende suportar Macs Apple Silicon

#### 4. Construir Todas as Arquiteturas

Cria as três versões (Universal, x64, ARM64):

```bash
yarn release:mac:all:signed
```

**Usar quando**: Precisa de builds separados para cada arquitetura

### Processo de Build

Quando executa um comando de build, acontece o seguinte:

1. **Carrega credenciais** do `.env.signing`
2. **Verifica tipos** do código TypeScript
3. **Constrói** a aplicação Electron com Vite
4. **Assina o código** da aplicação com o seu certificado Developer ID
5. **Notariza** a aplicação com a Apple (requer internet)
6. **Anexa** o ticket de notarização à aplicação
7. **Cria DMG** instalador
8. **Publica** para S3 (se configurado)

### Saída Esperada

```
✓ Loaded signing credentials
  APPLE_ID: seu.email@example.com
  APPLE_TEAM_ID: QT6DP36974
  Password: [HIDDEN]

Building with notarization...
  • electron-builder  version=26.0.12
  • loaded configuration  file=package.json ("build" field)
  • building        target=macOS application  arch=universal  file=IGRP-Studio-0.1.0-beta.14-universal.dmg
  • signing         identity=Developer ID Application: NOSi (QT6DP36974)
  • notarizing      bundleId=cv.nosi.igrpstudio.alpha
  • notarization successful
  • stapling ticket
  • creating DMG
  • publishing      provider=s3  target=darwin/universal
```

### Tempo de Build

- **Universal**: ~10-15 minutos
- **x64 ou ARM64**: ~8-12 minutos
- **Todas as arquiteturas**: ~25-35 minutos

_O tempo de notarização depende dos servidores da Apple e pode variar_

---

## Verificação

### 1. Localizar Artefactos de Build

Após um build bem-sucedido, encontre a sua aplicação em:

```bash
cd dist
ls -lh *.dmg
```

Deve ver:

- `IGRP-Studio-0.1.0-beta.14-universal.dmg` (Universal)
- `IGRP-Studio-0.1.0-beta.14-x64.dmg` (Intel)
- `IGRP-Studio-0.1.0-beta.14-arm64.dmg` (Apple Silicon)

### 2. Verificar Assinatura de Código

Verifique se a aplicação está devidamente assinada:

```bash
codesign -dv --verbose=4 dist/mac-universal/IGRP\ Studio.app
```

A saída esperada deve incluir:

```
Authority=Developer ID Application: NOSi (QT6DP36974)
Authority=Developer ID Certification Authority
Authority=Apple Root CA
TeamIdentifier=QT6DP36974
Signed Time=...
```

### 3. Verificar Notarização

Verifique se a aplicação está notarizada:

```bash
spctl -a -vvv -t install dist/mac-universal/IGRP\ Studio.app
```

Saída esperada:

```
dist/mac-universal/IGRP Studio.app: accepted
source=Notarized Developer ID
```

### 4. Testar a Aplicação

1. **Montar o DMG**:

    ```bash
    open dist/IGRP-Studio-0.1.0-beta.14-universal.dmg
    ```

2. **Copiar para Aplicações** (ou executar diretamente)

3. **Iniciar a aplicação**:
    - Se devidamente assinada e notarizada, deve abrir sem avisos
    - O macOS verificará a assinatura no primeiro lançamento

### 5. Testar Noutro Mac (Recomendado)

Para melhor verificação:

1. Copie o DMG para outro Mac
2. Tente instalar e executar
3. Certifique-se de que não aparecem avisos de segurança

---

## Resolução de Problemas

### Problema: "Error: .env.signing file not found"

**Solução**:

- Certifique-se de que `.env.signing` existe na raiz do projeto
- Verifique o nome do ficheiro (sem erros de digitação)
- Verifique permissões do ficheiro: `ls -la .env.signing`

### Problema: "No identity found"

**Solução**:

- Verifique que o certificado está instalado no Keychain:
    ```bash
    security find-identity -v -p codesigning
    ```
- Se faltar, reinstale o certificado Developer ID Application
- Certifique-se de que o certificado é válido (não expirado)

### Problema: "Notarization failed"

**Soluções**:

1. **Verifique credenciais**:
    - Verifique que `APPLE_ID` está correto
    - Verifique que `APPLE_TEAM_ID` corresponde à sua conta
    - Regenere `APPLE_APP_SPECIFIC_PASSWORD` se necessário

2. **Verifique ligação à internet**:
    - A notarização requer envio para servidores Apple
    - Verifique configurações de firewall

3. **Verifique conta Apple Developer**:
    - Certifique-se de que a subscrição está ativa
    - Verifique que o email está confirmado

4. **Veja logs de notarização**:
    ```bash
    xcrun notarytool log --apple-id seu@email.com --team-id QT6DP36974 <submission-id>
    ```

### Problema: "Build falha durante verificação TypeScript"

**Solução**:

```bash
# Execute verificação de tipos separadamente para ver erros
yarn typecheck

# Corrija quaisquer erros TypeScript antes de construir
```

### Problema: "Permission denied on sign-and-build.sh"

**Solução**:

```bash
chmod +x scripts/sign-and-build.sh
```

### Problema: "Certificate is not trusted"

**Solução**:

- Certifique-se de que está a usar certificado **Developer ID Application** (não "Mac Development")
- Verifique que a cadeia completa de certificados está instalada
- Verifique no Keychain Access que o certificado aparece como válido

### Problema: Build tem sucesso mas app não abre noutros Macs

**Soluções**:

1. **Verifique notarização** (passo 3 na secção Verificação)
2. **Verifique Gatekeeper**:
    ```bash
    spctl -a -vvv -t install /caminho/para/app
    ```
3. **Certifique-se de que o DMG foi criado corretamente** (não apenas o bundle .app)

---

## Notas e Boas Práticas

### Segurança

- **Nunca partilhe** o seu ficheiro `.env.signing`
- **Nunca faça commit** de credenciais para git
- **Altere** palavras-passe específicas de aplicações periodicamente
- **Use** palavras-passe diferentes para projetos diferentes

### Recomendações de Build

- **Para distribuição**: Use build Universal (melhor compatibilidade)
- **Para testes**: Use builds específicos de arquitetura (mais rápido)
- **Para lançamento**: Construa todas as arquiteturas e deixe os utilizadores escolher

### Guia de Arquitetura

| Tipo de Mac                   | Build Recomendado  |
| ----------------------------- | ------------------ |
| Mac Intel (2020 e anteriores) | x64 ou Universal   |
| Apple Silicon (M1/M2/M3)      | ARM64 ou Universal |
| Frota mista                   | Universal          |

### Notas de Performance

- **Builds Universal** são maiores (~2x tamanho) mas mais compatíveis
- **Builds nativos** (x64/ARM64) são menores e podem ter melhor desempenho
- **Builds nativos Apple Silicon** oferecem melhor desempenho em chips série M

### Controlo de Versão

O `.gitignore` já deve incluir:

```
.env.signing
dist/
out/
*.dmg
```

### Publicação

Após build bem-sucedido:

- Ficheiros DMG são automaticamente enviados para S3 (configurado em `package.json`)
- Endpoint: `https://storage-api.nosi.cv`
- Caminho: `darwin/universal/` (ou `x64`/`arm64`)

### Limpeza de Build

Para começar de fresco:

```bash
# Remover artefactos de build
rm -rf dist out

# Limpar dependências e reinstalar
yarn clean
yarn install
```

### Obter Ajuda

Se encontrar problemas:

1. Consulte esta secção de resolução de problemas
2. Reveja logs de build cuidadosamente
3. Verifique que todos os pré-requisitos estão cumpridos
4. Contacte a equipa de desenvolvimento com:
    - Comando de build usado
    - Mensagens de erro (sem credenciais)
    - Versão do macOS
    - Versão do Node.js

---

## Referência Rápida

### Comandos Essenciais

```bash
# Instalar dependências
yarn install

# Build Universal (mais comum)
yarn release:mac:universal:signed

# Verificar assinatura
codesign -dv --verbose=4 dist/mac-universal/IGRP\ Studio.app

# Verificar notarização
spctl -a -vvv -t install dist/mac-universal/IGRP\ Studio.app

# Testar a app
open dist/IGRP-Studio-*.dmg
```

### Variáveis de Ambiente Necessárias

```env
APPLE_ID=seu.email@example.com
APPLE_TEAM_ID=QT6DP36974
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

---

**Última Atualização**: 17-01-2025
**Versão IGRP Studio**: 0.1.0-beta.14
**Mantido por**: NOSi E.P.E - Núcleo Operacional Para a Sociedade de Informação
