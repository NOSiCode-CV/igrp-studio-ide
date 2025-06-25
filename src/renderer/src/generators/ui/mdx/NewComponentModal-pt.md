# Componente NewComponentModal

## Visão Geral

O `NewComponentModal` é um componente React abrangente que fornece uma interface amigável para criar novos componentes no IGRP Studio. Este modal oferece funcionalidades avançadas para criação de componentes, incluindo configuração de argumentos, seleção de ícones e associação de páginas.

## 🎯 **Propósito**

O NewComponentModal serve como interface principal para:
- Criar componentes React reutilizáveis
- Configurar argumentos e parâmetros de componentes
- Associar componentes a páginas específicas
- Configurar metadados e propriedades de componentes
- Gerar assinaturas de componentes automaticamente

## 🚀 **Funcionalidades Principais**

### Funcionalidade Básica
- **Criação de Componentes**: Criar novos componentes com configuração completa
- **Gestão de Argumentos**: Definir e configurar argumentos de componentes
- **Seleção de Ícones**: Escolher de uma biblioteca de ícones para componentes
- **Associação de Páginas**: Ligar componentes a páginas específicas ou mantê-los globais
- **Pré-visualização em Tempo Real**: Ver assinaturas de componentes geradas enquanto escreve
- **Validação**: Validação abrangente de formulários com tratamento de erros

### Funcionalidades Avançadas
- **Argumentos de Função**: Suporte para parâmetros de função complexos
- **Sistema de Tipos**: Suporte completo para tipos TypeScript
- **Gestão de Escopo**: Componentes de nível de aplicação ou específicos de página
- **Auto-geração**: Geração inteligente de nomes e caminhos
- **Integração Git**: Criação automática de commits após criação de componentes

## 📋 **Interface do Componente**

### Interface de Props
```typescript
interface NewComponentModalProps {
    isOpen: boolean;
    basePath: string;
    pageOptions: any[];
    currentComponent?: PageDefinition;
    onClose: () => void;
    onConfirm: () => void;
}
```

### Campos do Formulário
1. **Título do Componente** (Descrição)
   - Campo obrigatório
   - Auto-gera nome do componente no blur
   - Placeholder: "Todo Item"

2. **Nome do Componente**
   - Campo obrigatório
   - Deve seguir convenções de nomenclatura (sem espaços/hífens)
   - Auto-gerado a partir do título

3. **Associação de Página**
   - Dropdown opcional
   - Liga componente a páginas específicas
   - Altera escopo de 'app' para 'page'

4. **Navegador de Ícones**
   - Seleção visual de ícones
   - Biblioteca de ícones pesquisável
   - Pré-visualização do ícone selecionado

5. **Argumentos de Função**
   - Configuração complexa de argumentos
   - Suporte para parâmetros opcionais
   - Validação de tipos
   - Suporte para listas/arrays

## 🔧 **Implementação Técnica**

### Gestão de Formulário
- **Integração Formik**: Gerencia estado e validação do formulário
- **Validação Yup**: Esquema de validação abrangente
- **Auto-geração**: Preenchimento inteligente de campos
- **Tratamento de Erros**: Mensagens de erro amigáveis

### Gestão de Estado
```typescript
const [arguments_, setArguments] = useState<Arguments[]>([]);
```

### Esquema de Validação
```typescript
const validationSchema = Yup.object({
    description: Yup.string().required(
        t('thisFieldRequired', { name: t('componentTitle') })
    ),
    name: Yup.string()
        .required(t('thisFieldRequired', { name: t('name') }))
        .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
});
```

## 🎨 **Interface do Utilizador**

### Layout do Modal
- **Layout de Duas Colunas**: Campos do formulário à esquerda, argumentos à direita
- **Design Responsivo**: Adapta-se a diferentes tamanhos de ecrã
- **Separador Visual**: Distinção clara entre secções

### Secções do Formulário
1. **Informação Básica**
   - Título e nome do componente
   - Dropdown de associação de página

2. **Configuração Visual**
   - Navegador de ícones com pesquisa
   - Pré-visualização de ícone

3. **Configuração Avançada**
   - Painel de argumentos de função
   - Seleção de tipos
   - Configuração de parâmetros

4. **Secção de Pré-visualização**
   - Assinatura de componente gerada
   - Pré-visualização de código em tempo real

## 🔧 **Componente FunctionArguments**

### Visão Geral
O componente `FunctionArguments` é uma ferramenta poderosa dentro do NewComponentModal que permite aos utilizadores definir e configurar parâmetros de função para os seus componentes. Este componente fornece uma interface intuitiva para criar assinaturas de componentes complexas com tipagem TypeScript adequada.

### Propósito
- **Definição de Parâmetros**: Definir parâmetros de função com tipos adequados
- **Segurança de Tipos**: Garantir compatibilidade TypeScript
- **Parâmetros Opcionais**: Marcar parâmetros como opcionais
- **Tipos Complexos**: Suporte para objetos, arrays e funções
- **Pré-visualização em Tempo Real**: Ver como os argumentos afetam a assinatura do componente

### Funcionalidades Principais

#### 1. **Gestão de Argumentos**
- **Adicionar Argumentos**: Clicar "+" para adicionar novos parâmetros de função
- **Remover Argumentos**: Eliminar parâmetros indesejados
- **Reordenar Argumentos**: Arrastar e largar para reordenar parâmetros
- **Duplicar Argumentos**: Copiar argumentos existentes para parâmetros semelhantes

#### 2. **Sistema de Tipos**
- **Tipos Básicos**: string, number, boolean, Date, etc.
- **Tipos Complexos**: object, array, function, tipos personalizados
- **Tipos Opcionais**: Marcar parâmetros como opcionais com '?'
- **Tipos de Array**: Suporte para arrays tipados (ex: string[], number[])
- **Tipos de Função**: Definir funções de callback com parâmetros

#### 3. **Configuração de Parâmetros**
- **Nome**: Nome do parâmetro (deve ser identificador JavaScript válido)
- **Tipo**: Tipo de dados para o parâmetro
- **Obrigatório/Opcional**: Alternar requisito do parâmetro
- **Valor Padrão**: Definir valores padrão para parâmetros opcionais
- **Descrição**: Adicionar documentação para o parâmetro

#### 4. **Funcionalidades Avançadas**
- **Parâmetros de Função**: Definir parâmetros para funções de callback
- **Tipos de Retorno**: Especificar tipos de retorno para parâmetros de função
- **Tipos Genéricos**: Suporte para parâmetros de tipo genérico
- **Tipos de União**: Combinar múltiplos tipos (ex: string | number)
- **Tipos Personalizados**: Referenciar interfaces TypeScript personalizadas

### Elementos da Interface do Utilizador

#### Lista de Argumentos
- **Lista Visual**: Cada argumento exibido como um cartão
- **Cartões Expansíveis**: Clicar para expandir/colapsar detalhes do argumento
- **Ações Rápidas**: Botões editar, eliminar, duplicar em cada cartão
- **Alça de Arrastar**: Reordenar argumentos arrastando

#### Formulário de Argumento
- **Campo de Nome**: Entrada do nome do parâmetro
- **Seletor de Tipo**: Dropdown com tipos disponíveis
- **Alternância Obrigatório**: Checkbox para opcional/obrigatório
- **Valor Padrão**: Entrada para valores padrão
- **Descrição**: Área de texto para documentação do parâmetro

#### Configuração de Tipos
- **Seletor de Tipo Básico**: Escolher de tipos primitivos
- **Construtor de Tipos Complexos**: Construir tipos complexos passo a passo
- **Construtor de Tipos de Função**: Definir assinaturas de função
- **Construtor de Tipos de Array**: Configurar tipos de array
- **Referência de Tipo Personalizado**: Ligar a interfaces TypeScript existentes

### Exemplos de Uso

#### Parâmetro String Básico
```typescript
// Configuração
{
    name: "title",
    type: "string",
    required: true,
    description: "O título do componente"
}

// Assinatura Gerada
function myComponent(title: string) {
    // Implementação do componente
}
```

#### Parâmetro Number Opcional
```typescript
// Configuração
{
    name: "count",
    type: "number",
    required: false,
    defaultValue: 0,
    description: "Número de itens a exibir"
}

// Assinatura Gerada
function myComponent(title: string, count?: number = 0) {
    // Implementação do componente
}
```

#### Parâmetro Array
```typescript
// Configuração
{
    name: "items",
    type: "array",
    arrayType: "string",
    required: true,
    description: "Lista de itens a exibir"
}

// Assinatura Gerada
function myComponent(title: string, count?: number = 0, items: string[]) {
    // Implementação do componente
}
```

#### Parâmetro Função
```typescript
// Configuração
{
    name: "onClick",
    type: "function",
    functionParameters: [
        { name: "event", type: "MouseEvent", required: true },
        { name: "data", type: "any", required: false }
    ],
    returnType: "void",
    description: "Função de callback para eventos de clique"
}

// Assinatura Gerada
function myComponent(
    title: string, 
    count?: number = 0, 
    items: string[], 
    onClick: (event: MouseEvent, data?: any) => void
) {
    // Implementação do componente
}
```

### Fluxo de Trabalho

#### Passo 1: Adicionar Argumentos
1. Clicar no botão "+" no painel FunctionArguments
2. Um novo cartão de argumento aparece
3. Preencher informação básica (nome, tipo)

#### Passo 2: Configurar Tipos
1. Selecionar o tipo apropriado do dropdown
2. Para tipos complexos, usar o construtor de tipos
3. Configurar opções adicionais de tipo (array, opcional, etc.)

#### Passo 3: Definir Propriedades
1. Marcar como obrigatório ou opcional
2. Adicionar valores padrão se opcional
3. Fornecer descrição para documentação

#### Passo 4: Revisar Pré-visualização
1. Verificar a assinatura gerada no painel de pré-visualização
2. Verificar a compatibilidade TypeScript
3. Fazer ajustes conforme necessário

### Melhores Práticas

#### Convenções de Nomenclatura
- **Nomes Descritivos**: Usar nomes de parâmetros claros e significativos
- **Camel Case**: Seguir convenções de nomenclatura JavaScript
- **Evitar Abreviações**: Usar palavras completas para clareza
- **Nomenclatura Consistente**: Manter consistência entre parâmetros semelhantes

#### Seleção de Tipos
- **Escolher Tipos Apropriados**: Selecionar o tipo mais específico possível
- **Usar Tipos Opcionais**: Marcar parâmetros como opcionais quando apropriado
- **Considerar Valores Padrão**: Fornecer padrões sensatos para parâmetros opcionais
- **Documentar Tipos Complexos**: Adicionar descrições para parâmetros complexos

#### Organização
- **Ordem Lógica**: Organizar parâmetros em ordem lógica
- **Obrigatórios Primeiro**: Colocar parâmetros obrigatórios antes dos opcionais
- **Parâmetros Relacionados**: Agrupar parâmetros relacionados
- **Padrões Consistentes**: Seguir padrões consistentes entre componentes

### Casos de Uso Comuns

#### Componentes de Formulário
```typescript
// Parâmetros comuns de componentes de formulário
{
    name: "value",
    type: "string",
    required: true
},
{
    name: "onChange",
    type: "function",
    functionParameters: [{ name: "value", type: "string" }],
    returnType: "void"
},
{
    name: "placeholder",
    type: "string",
    required: false
}
```

#### Componentes de Lista
```typescript
// Parâmetros comuns de componentes de lista
{
    name: "items",
    type: "array",
    arrayType: "object",
    required: true
},
{
    name: "renderItem",
    type: "function",
    functionParameters: [{ name: "item", type: "object" }],
    returnType: "ReactNode"
},
{
    name: "loading",
    type: "boolean",
    required: false,
    defaultValue: false
}
```

#### Componentes Modal
```typescript
// Parâmetros comuns de componentes modal
{
    name: "isOpen",
    type: "boolean",
    required: true
},
{
    name: "onClose",
    type: "function",
    functionParameters: [],
    returnType: "void"
},
{
    name: "title",
    type: "string",
    required: false
}
```

### Resolução de Problemas

#### Problemas Comuns

**P: Por que não consigo adicionar um novo argumento?**
R: Verifique se o argumento anterior está devidamente configurado. Todos os campos obrigatórios devem estar preenchidos.

**P: Por que o dropdown de tipos está vazio?**
R: Certifique-se de que está a usar a versão mais recente do componente. As definições de tipo são carregadas dinamicamente.

**P: Como crio um tipo de função complexo?**
R: Use o construtor de tipos de função para definir parâmetros e tipos de retorno passo a passo.

**P: Por que o meu argumento não aparece na pré-visualização?**
R: Verifique se o nome do argumento é válido (sem espaços, caracteres especiais) e se todos os campos obrigatórios estão preenchidos.

**P: Como faço um parâmetro opcional?**
R: Desmarque a caixa "Obrigatório" e opcionalmente forneça um valor padrão.

### Integração com Criação de Componentes

O componente FunctionArguments integra-se perfeitamente com o NewComponentModal:

1. **Atualizações em Tempo Real**: Alterações no FunctionArguments atualizam imediatamente a pré-visualização da assinatura do componente
2. **Validação**: A validação de argumentos está incluída na validação geral do formulário
3. **Persistência**: As configurações de argumentos são guardadas com o componente
4. **Exportação**: Os argumentos estão incluídos no código do componente gerado

### Funcionalidades Avançadas

#### Suporte de Tipos Personalizados
- **Referências de Interface**: Ligar a interfaces TypeScript existentes
- **Tipos Genéricos**: Suporte para parâmetros de tipo genérico
- **Tipos de União**: Combinar múltiplos tipos com operadores de união
- **Tipos de Interseção**: Mesclar múltiplos tipos com operadores de interseção

#### Regras de Validação
- **Validação de Nome**: Garantir identificadores JavaScript válidos
- **Validação de Tipo**: Verificar compatibilidade TypeScript
- **Validação de Campo Obrigatório**: Garantir que todos os campos obrigatórios estão preenchidos
- **Prevenção de Nomes Duplicados**: Prevenir nomes de parâmetros duplicados

#### Otimização de Performance
- **Carregamento Preguiçoso**: Definições de tipo carregadas sob demanda
- **Atualizações com Debounce**: Atualizações de pré-visualização com debounce para performance
- **Scrolling Virtual**: Listas grandes de argumentos usam scrolling virtual
- **Memoização**: Cálculos dispendiosos são memoizados

---

## 📝 **Exemplos de Uso**

### Criação Básica de Componente
```typescript
<NewComponentModal
    isOpen={showFormComponent}
    basePath={basePath}
    pageOptions={pageOptions}
    onClose={() => setFormComponent(false)}
    onConfirm={handleNewComponent}
/>
```

### Com Componente Atual (Edição)
```typescript
<NewComponentModal
    isOpen={showFormComponent}
    basePath={basePath}
    pageOptions={pageOptions}
    currentComponent={existingComponent}
    onClose={() => setFormComponent(false)}
    onConfirm={handleNewComponent}
/>
```

## 🔄 **Fluxo de Trabalho**

### Passo 1: Abrir Modal
- Utilizador clica no botão "Criar Novo Componente"
- Modal abre com formulário vazio

### Passo 2: Preencher Informação Básica
- Inserir título do componente
- Nome do componente auto-gera
- Selecionar associação de página (opcional)

### Passo 3: Configurar Elementos Visuais
- Escolher ícone do navegador
- Pré-visualizar ícone selecionado

### Passo 4: Configurar Argumentos
- Adicionar argumentos de função
- Configurar tipos de parâmetros
- Definir status opcional/obrigatório

### Passo 5: Revisar e Criar
- Revisar assinatura gerada
- Validar formulário
- Criar componente

## ⚙️ **Opções de Configuração**

### Escopo do Componente
- **Escopo de App**: Disponível globalmente na aplicação
- **Escopo de Página**: Disponível apenas em páginas específicas

### Tipos de Argumentos
- **Tipos Básicos**: string, number, boolean, etc.
- **Tipos Complexos**: objetos, arrays, funções
- **Parâmetros Opcionais**: Marcados com sufixo '?'
- **Suporte de Lista**: Tipos de array com sufixo '[]'

### Sistema de Ícones
- **Biblioteca Pesquisável**: Encontrar ícones por nome
- **Pré-visualização Visual**: Ver ícone antes da seleção
- **Organização por Categoria**: Ícones organizados por tipo

## 🎯 **Saída Gerada**

### Assinatura do Componente
```typescript
export default function myComponent(
    param1: string,
    param2?: number,
    callback: (data: any) => void
) {
    // Implementação do componente
}
```

### Estrutura de Ficheiros
```
components/
├── MyComponent/
│   ├── index.tsx
│   ├── types.ts
│   └── styles.css
```

## ⚠️ **Regras de Validação**

### Convenções de Nomenclatura
- **Nome do Componente**: `[a-zA-Z0-9]+` (sem espaços/hífens)
- **Descrição**: Obrigatória, texto descritivo
- **Argumentos**: Tipos TypeScript válidos

### Campos Obrigatórios
- Título do componente (descrição)
- Nome do componente
- Tipos de argumentos válidos

### Tratamento de Erros
- **Validação de Campo**: Feedback de validação em tempo real
- **Verificação de Tipos**: Validação de tipos TypeScript
- **Prevenção de Duplicados**: Verificar nomes existentes

## 🔗 **Pontos de Integração**

### Integração com Engine
```typescript
const { error } = await window.engine.createPage(
    { ...pageConfig, id: getId() },
    ENV_TYPES.NEXTJS,
    basePath
);
```

### Integração com Git
```typescript
createGitCommit(
    basePath,
    t('addComponent', { name: pageConfig.name })
);
```

### Notificações Toast
- **Sucesso**: Componente criado com sucesso
- **Erro**: Erros de validação ou criação

## 📈 **Melhores Práticas**

### Design de Componentes
1. **Nomes Descritivos**: Usar nomes claros e significativos
2. **Escopo Adequado**: Escolher escopo apropriado (app vs página)
3. **Seleção de Ícones**: Escolher ícones relevantes para melhor UX
4. **Planeamento de Argumentos**: Planear argumentos antes da criação

### Fluxo de Desenvolvimento
1. **Planear Componente**: Definir propósito e requisitos
2. **Configurar Argumentos**: Configurar parâmetros necessários
3. **Escolher Ícone**: Selecionar representação visual apropriada
4. **Testar Criação**: Verificar se componente funciona como esperado

## 🆘 **Resolução de Problemas**

### Problemas Comuns

**P: Por que não consigo guardar o componente?**
R: Verifique se todos os campos obrigatórios estão preenchidos e se as convenções de nomenclatura são seguidas.

**P: Por que o painel de argumentos não está a funcionar?**
R: Certifique-se de que está a usar tipos de argumentos suportados e configurações válidas.

**P: Como associo um componente a uma página?**
R: Use o dropdown de associação de página para selecionar uma página específica.

**P: Posso editar um componente existente?**
R: Sim, passe o componente existente como prop `currentComponent`.

## 🔮 **Melhorias Futuras**

### Funcionalidades Planeadas
- **Biblioteca de Modelos**: Modelos de componentes pré-construídos
- **Sistema de Tipos Avançado**: Definições de tipos mais complexas
- **Pré-visualização de Componentes**: Pré-visualização ao vivo do componente
- **Criação em Massa**: Criar múltiplos componentes de uma vez
- **Importar/Exportar**: Partilha de configuração de componentes

### Melhorias Técnicas
- **Otimização de Performance**: Renderização de formulário mais rápida
- **Validação Melhorada**: Regras de validação mais sofisticadas
- **Melhor Tratamento de Erros**: Mensagens de erro mais detalhadas
- **Acessibilidade**: Navegação por teclado melhorada

---

**Componente**: NewComponentModal  
**Versão**: 1.0  
**Última Atualização**: Dezembro 2024  
**Autor**: Equipa IGRP Studio 