# Validação de Formulários no IGRP Studio

Bem-vindo ao recurso de Validação de Formulários no IGRP Studio! Este guia mostrará como adicionar facilmente regras de validação aos seus campos de formulário usando nossa interface visual.

## 🎯 O que é Validação de Formulário?

A validação de formulário garante que os usuários insiram informações corretas e completas em seus formulários. Por exemplo:

- Garantir que um campo de email contenha um endereço de email válido
- Exigir que uma senha tenha pelo menos 8 caracteres
- Garantir que um campo numérico aceite apenas valores positivos

## 🚀 Como Usar a Validação de Formulário

### Passo 1: Abrir Seu Formulário

1. Navegue até seu projeto no IGRP Studio
2. Abra o formulário ao qual deseja adicionar validação
3. Selecione o campo do formulário que deseja validar

### Passo 2: Acessar Configurações de Validação

1. Nas propriedades do campo do formulário, procure pelo **ícone de Escudo** 🔒
2. Clique no ícone do escudo para abrir o popover de validação
3. Você verá três abas: **Validações**, **Schema Zod** e **Pré-visualização**

### Passo 3: Configurar Validações

#### Aba de Validações Básicas

É aqui que você passará a maior parte do tempo configurando regras de validação.

**Obrigatório vs Opcional:**

- **Obrigatório**: Campo deve ser preenchido (padrão para a maioria dos campos)
- **Opcional**: Campo pode ficar vazio

**Validações Específicas por Tipo:**
As validações disponíveis mudam com base no tipo do seu campo:

**Para Campos de Texto (String, Email, Senha):**

- **Comprimento Mín/Máx**: Definir limites mínimo e máximo de caracteres
- **Email**: Valida formato de email
- **URL**: Valida formato de endereço web
- **UUID**: Valida formato UUID
- **Regex**: Correspondência de padrão personalizado (avançado)
- **Começa Com**: Campo deve começar com texto específico
- **Termina Com**: Campo deve terminar com texto específico
- **Inclui**: Campo deve conter texto específico

**Para Campos Numéricos:**

- **Mín/Máx**: Definir valores mínimo e máximo
- **Positivo**: Apenas números positivos permitidos
- **Negativo**: Apenas números negativos permitidos
- **Inteiro**: Apenas números inteiros (sem decimais)
- **Finito**: Exclui valores infinitos

**Para Campos de Data:**

- **Data Mín**: Data mais antiga permitida
- **Data Máx**: Data mais recente permitida

**Para Campos Booleanos:**

- **Obrigatório/Opcional**: Se o campo deve ser marcado

### Passo 4: Pré-visualizar Suas Validações

Mude para a aba **Pré-visualização** para ver:

- Todas as validações ativas para o campo atual
- Um resumo das regras aplicadas
- Indicação clara se nenhuma validação está definida

### Passo 5: Gerar Schema Zod (Opcional)

A aba **Schema Zod** mostra o código de validação gerado automaticamente:

- Perfeito para desenvolvedores que querem usar a validação em seu código
- Clique em "Copiar para Área de Transferência" para copiar o schema gerado
- Use este código em suas aplicações React com bibliotecas como React Hook Form

## 📝 Exemplos do Mundo Real

### Exemplo 1: Formulário de Registro de Usuário

**Campo de Email:**

- ✅ Obrigatório
- ✅ Validação de email
- Resultado: Garante que os usuários insiram um endereço de email válido

**Campo de Senha:**

- ✅ Obrigatório
- ✅ Comprimento Mín: 8
- ✅ Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)` (requer minúscula, maiúscula e número)
- Resultado: Requisitos de senha forte

**Campo de Idade:**

- ✅ Obrigatório
- ✅ Mín: 18
- ✅ Máx: 100
- ✅ Inteiro
- Resultado: Idade deve estar entre 18-100

### Exemplo 2: Formulário de Produto

**Nome do Produto:**

- ✅ Obrigatório
- ✅ Comprimento Mín: 2
- ✅ Comprimento Máx: 100
- Resultado: Nome do produto entre 2-100 caracteres

**Preço:**

- ✅ Obrigatório
- ✅ Positivo
- ✅ Finito
- Resultado: Deve ser um número positivo

**SKU:**

- ✅ Obrigatório
- ✅ Regex: `^[A-Z]{2}-\d{4}-[A-Z]{2}$`
- Resultado: Deve seguir o padrão como "AB-1234-CD"

## 🎨 Guia da Interface do Usuário

### Layout do Popover de Validação

```
┌─────────────────────────────────────┐
│ [Validações] [Schema Zod] [Pré-visualização] │
├─────────────────────────────────────┤
│ Definir validações para campo do formulário  │
│                                             │
│ Validações Básicas:                        │
│ ☑ Obrigatório    ☐ Opcional               │
│                                             │
│ Validações Específicas por Tipo:           │
│ Comprimento Mín: [___]                     │
│ Comprimento Máx: [___]                     │
│ ☑ Email                                    │
└─────────────────────────────────────┘
```

### Indicadores Visuais

- **Ícone de Escudo** 🔒: Clique para abrir configurações de validação
- **Marcações de verificação** ☑: Validações ativas
- **Caixas vazias** ☐: Validações inativas
- **Campos de entrada**: Digite valores específicos (mín/máx, datas, etc.)

## 💡 Dicas para Melhor Validação

### 1. Comece Simples

- Comece com configurações básicas obrigatório/opcional
- Adicione validações específicas conforme necessário
- Não exagere na validação - foque em regras essenciais

### 2. Mensagens Amigáveis ao Usuário

- Mantenha regras de validação razoáveis
- Considere a experiência do usuário ao definir limites
- Teste suas validações com dados reais

### 3. Padrões Comuns

- **Email**: Sempre use validação de email para campos de email
- **Senhas**: Use comprimento mínimo + regex para segurança
- **Telefones**: Use regex para consistência de formato
- **Datas**: Use datas mín/máx para intervalos lógicos

### 4. Considerações de Performance

- Evite padrões regex excessivamente complexos
- Mantenha regras de validação focadas e necessárias
- Considere validação no servidor para dados críticos

## 🔧 Recursos Avançados

### Padrões Regex Personalizados

Para usuários avançados, você pode criar padrões de validação personalizados:

**Número de Telefone (Universal):**

```
^\+?[1-9]\d{1,14}$
```

**NIF (Número de Identificação Fiscal):**

```
^\d{9}$
```

**Número de Cartão de Crédito:**

```
^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$
```

### Validação de Data

- Use formato de data ISO (AAAA-MM-DD)
- Defina intervalos de data lógicos
- Considere implicações de fuso horário

## 🚨 Solução de Problemas

### Problemas Comuns

**Validação não aparece:**

- Certifique-se de que selecionou um campo do formulário
- Verifique se o tipo de campo é suportado
- Confirme se o ícone do escudo está visível

**Validação não funciona:**

- Certifique-se de que as regras de validação estão configuradas corretamente
- Verifique se os tipos de campo correspondem aos tipos de validação
- Teste com dados válidos e inválidos

**Erros no schema Zod:**

- Verifique se todas as regras de validação são compatíveis
- Verifique erros de sintaxe em regex personalizado
- Certifique-se da seleção adequada do tipo de campo

### Obtendo Ajuda

Se você encontrar problemas:

1. Verifique a aba de pré-visualização de validação
2. Verifique a compatibilidade do tipo de campo
3. Teste com regras de validação simples primeiro
4. Consulte a aba Schema Zod para problemas de código

## 🎯 Melhores Práticas

### Para Designers de Formulários

- **Seja Consistente**: Use padrões de validação semelhantes em formulários
- **Seja Claro**: As regras de validação devem ser óbvias para os usuários
- **Seja Útil**: Forneça mensagens de erro claras
- **Seja Razoável**: Não torne os formulários muito restritivos

### Para Desenvolvedores

- **Teste Completamente**: Valide com vários cenários de entrada
- **Considere Casos Extremos**: Trate dados vazios, nulos e inválidos
- **Performance**: Mantenha regras de validação eficientes
- **Segurança**: Valide tanto no cliente quanto no servidor

## 📚 Próximos Passos

Agora que você entende a validação de formulários:

1. **Experimente**: Adicione validação a um campo de formulário simples
2. **Experimente**: Teste diferentes combinações de validação
3. **Construa confiança**: Comece com validações básicas, depois adicione complexidade
4. **Compartilhe conhecimento**: Ajude membros da equipe a entender o recurso

## 🎉 Parabéns!

Agora você está pronto para criar formulários robustos e amigáveis ao usuário com validação adequada no IGRP Studio. A interface visual torna fácil adicionar regras de validação profissionais sem escrever código.

Feliz criação de formulários! 🚀
