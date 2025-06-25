# Documentação da Funcionalidade de Duplicação

## Visão Geral

A funcionalidade de Duplicação permite aos utilizadores criar cópias exatas de páginas e componentes existentes no IGRP Studio. Esta funcionalidade foi concebida para poupar tempo na criação de páginas ou componentes semelhantes que partilham funcionalidades, estilos ou estruturas comuns.

## 🎯 **Intenção e Propósito**

### Por que Duplicar?
- **Poupança de Tempo**: Em vez de criar páginas/componentes do zero, duplicar os existentes
- **Consistência**: Manter estrutura e funcionalidade consistentes entre itens semelhantes
- **Uso de Modelos**: Usar páginas/componentes existentes como modelos para novos
- **Prototipagem Rápida**: Criar rapidamente variações de designs existentes
- **À Prova do Futuro**: Itens duplicados são completamente independentes do original

### Casos de Uso
- Criar múltiplas páginas semelhantes (ex: perfil de utilizador, perfil de administrador, páginas de configurações)
- Duplicar componentes com funcionalidades semelhantes (ex: diferentes formulários, cartões, modais)
- Usar páginas existentes como modelos para novas funcionalidades
- Criar variações de designs existentes com modificações menores

## 🚀 **Como Usar**

### Passo 1: Aceder à Opção de Duplicação
1. Navegue para a secção **Páginas** no IGRP Studio
2. Encontre a página ou componente que deseja duplicar
3. Clique no **menu de três pontos** (⋮) no item
4. Selecione **"Duplicar"** no menu suspenso

### Passo 2: Configurar a Duplicação
1. Um modal abrirá com informações pré-preenchidas
2. **Descrição**: Adiciona automaticamente o sufixo "Copy" (ex: "Perfil de Utilizador Copy")
3. **Nome**: Adiciona automaticamente o sufixo "Copy" (ex: "UserProfileCopy")
4. **Caminho** (apenas Páginas): Adiciona automaticamente o sufixo "-copy" (ex: "user-profile-copy")

### Passo 3: Personalizar (Opcional)
- **Descrição**: Modifique a descrição para refletir melhor o propósito do novo item
- **Nome**: Altere o nome para algo mais específico
- **Caminho**: Atualize o caminho para corresponder à sua estrutura de roteamento

### Passo 4: Guardar
- Clique em **"Duplicar"** para criar a cópia
- O novo item aparecerá na sua lista de páginas/componentes
- Uma mensagem de sucesso confirmará a duplicação

## 🔧 **Detalhes Técnicos**

### O que é Copiado
A funcionalidade de duplicação executa uma **cópia profunda** do item original, preservando:

#### Para Páginas:
- ✅ Todas as propriedades e configurações da página
- ✅ Tipos, estados e funções
- ✅ Configurações de força dinâmica
- ✅ Relacionamentos pai-filho
- ✅ Todas as propriedades e metadados personalizados

#### Para Componentes:
- ✅ Propriedades e configurações do componente
- ✅ Argumentos e parâmetros
- ✅ Configurações de ícone
- ✅ Configurações de escopo (app/página)
- ✅ Todas as propriedades e metadados personalizados

### O que é Modificado
- **ID**: Novo identificador único gerado
- **Nome**: Adiciona sufixo "Copy"
- **Descrição**: Adiciona sufixo "Copy"
- **Caminho**: Adiciona sufixo "-copy" (apenas páginas)

### Independência
- ✅ Itens duplicados são **completamente independentes** do original
- ✅ Alterações no original não afetarão a cópia
- ✅ Alterações na cópia não afetarão o original
- ✅ Cada item tem o seu próprio ID único e propriedades

## 📁 **Estrutura de Ficheiros**

```
src/renderer/src/generators/ui/page/
├── duplicate-modal.tsx          # Componente principal do modal de duplicação
├── list-pages.tsx              # Atualizado com funcionalidade de duplicação
├── page-card.tsx               # Atualizado com opção de duplicação
├── shared.tsx                  # Atualizado com item de menu de duplicação
└── utils/
    ├── duplicate-functionality.md      # Documentação em inglês
    └── duplicate-functionality-pt.md   # Documentação em português
```

## 🎨 **Interface do Utilizador**

### Menu Suspenso
- **Editar**: Modificar o item original
- **Duplicar**: Criar uma cópia (NOVO)
- **Adicionar Componentes**: Adicionar componentes ao item
- **Criar SubPágina**: Criar páginas filhas (apenas páginas)
- **Eliminar**: Remover o item

### Interface do Modal
- **Título**: Mostra o que está a ser duplicado
- **Descrição**: Explica o processo de duplicação
- **Campos do Formulário**: Pré-preenchidos com nomes adequados para cópia
- **Validação**: Garante convenções de nomenclatura adequadas
- **Ações**: Botões Cancelar ou Duplicar

## ⚠️ **Notas Importantes**

### Convenções de Nomenclatura
- Os nomes devem seguir o padrão: `[a-zA-Z0-9]+` (sem espaços ou hífens)
- Os caminhos devem seguir padrões de roteamento Next.js
- Nomes duplicados são permitidos (cada item tem um ID único)

### Limitações
- Não é possível duplicar itens que estão atualmente a ser editados
- Não é possível duplicar itens com configurações inválidas
- Podem ocorrer conflitos de caminho se caminhos semelhantes já existirem

### Melhores Práticas
1. **Usar Nomes Descritivos**: Altere os nomes gerados automaticamente para serem mais específicos
2. **Rever Caminhos**: Certifique-se de que os caminhos se alinham com a sua estratégia de roteamento
3. **Testar Após Duplicação**: Verifique se o item duplicado funciona como esperado
4. **Limpar**: Remova duplicações não utilizadas para manter o seu projeto organizado

## 🔄 **Exemplo de Fluxo de Trabalho**

### Cenário: Criar Múltiplas Páginas de Utilizador

1. **Criar Página Base**: Criar uma página "UserProfile" com todos os componentes necessários
2. **Duplicar**: Usar duplicação para criar "UserProfileCopy"
3. **Personalizar**: Modificar a cópia para "AdminProfile"
4. **Repetir**: Duplicar novamente para "ManagerProfile"
5. **Resultado**: Três páginas semelhantes com estrutura consistente mas propósitos diferentes

### Benefícios:
- ✅ Experiência de utilizador consistente entre páginas
- ✅ Tempo de desenvolvimento reduzido
- ✅ Base de código mantível
- ✅ Fácil atualização de páginas semelhantes

## 🆘 **Resolução de Problemas**

### Problemas Comuns

**P: Por que não consigo ver a opção de duplicação?**
R: Certifique-se de que está a clicar no menu de três pontos (⋮) no item, não noutro local.

**P: Por que está em falta o campo de caminho?**
R: O campo de caminho só aparece quando duplica páginas, não componentes.

**P: Por que falha a duplicação?**
R: Verifique se o nome segue a convenção de nomenclatura (sem espaços/hífens) e se o caminho é válido.

**P: Posso duplicar uma página com componentes?**
R: Sim! A duplicação incluirá todos os componentes associados e as suas configurações.

## 📈 **Melhorias Futuras**

Possíveis melhorias para a funcionalidade de duplicação:
- Duplicação em massa de múltiplos itens
- Biblioteca de modelos para padrões comuns de páginas/componentes
- Sugestões inteligentes de nomenclatura baseadas no contexto do projeto
- Pré-visualização do que será duplicado
- Funcionalidade de desfazer para duplicações acidentais

---

**Última Atualização**: Dezembro 2024  
**Versão**: 1.0  
**Autor**: Equipa IGRP Studio 