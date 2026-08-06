# Relatorio Tecnico de Correcoes - iGRP Studio Horizon

Projeto: `iGRP Studio Horizon`  
Camada principal afetada: `Renderer`

## 1. Dark Mode Nao Respeitava o Tema

### Onde estava o erro
Arquivo: `src/renderer/src/generators/ui/components/sidebar/custom-code/functions-settings.tsx`

### Causa raiz
O componente usava cores fixas como `bg-white`, `bg-gray-50` e `text-gray-500`. Essas classes definem cores literais e nao acompanham automaticamente o tema light/dark.

### Como foi corrigido
```tsx
// Antes
<div className="mt-6 p-4 border rounded-lg bg-white"> 

// Depois
<div className="mt-6 p-4 border rounded-lg bg-card"> 

// Antes
<div className="flex items-center gap-2 p-3 border rounded bg-gray-50"> 

// Depois
<div className="flex items-center gap-2 p-3 border rounded bg-muted/50"> 

// Antes
<p className="text-sm text-gray-500 text-center py-4"> 

// Depois
<p className="text-sm text-muted-foreground text-center py-4"> 
```

### Porque esta tecnica foi usada
Foram usados tokens semanticos porque o design system centraliza as variaveis de tema. O componente deixa de depender de uma cor exata e passa a depender do papel visual do elemento, como `card`, `muted` e `foreground`.

### Beneficio
A UI passa a respeitar corretamente light e dark mode com uma alteracao pequena, localizada e alinhada a boa pratica.

## 2. Request Body Voltava de None para JSON

### Onde estava o erro
Arquivo: `src/renderer/src/generators/api/pages/controller/body-request.tsx`

### Causa raiz
Ao clicar em `None`, a UI mudava o `bodyType` local, mas o `requestBody` anterior continuava guardado no `Formik`. Depois, um `useEffect` lia `formik.values.requestBody.content` e reidratava o componente para `application/json`.

### Como foi corrigido
```tsx
// Antes
onClick={() => setBodyType('none')}

// Depois
onClick={() => {
    setBodyType('none')
    formik.setFieldValue(routeFormData, undefined)
    setLocalSchema(null)
    setName('')
    setData([])
    setCollectionType('none')
}}
```

### Porque esta tecnica foi usada
A tecnica foi cirurgica: corrigir o bug exatamente no clique do `None`, que era o ponto onde o comportamento errado nascia. Ao limpar o `requestBody` no proprio clique, retirou-se a origem que fazia a UI voltar para `JSON`.

### Beneficio
Dentro do Studio, o utilizador consegue manter o estado `None` ativo sem a interface voltar automaticamente para `JSON`.

## 3. Navegacao, Tabs e Remontagem de Editor

### Onde estavam os erros
Arquivos:
- `src/renderer/src/generators/api/pages/PageWrapper.tsx`
- `src/renderer/src/layouts/components/dropdown-sidebar.tsx`
- `src/renderer/src/layouts/components/nav-data.tsx`

### Causa raiz
Havia dois problemas combinados:
- IDs de criacao pouco explicitos
- reaproveitamento indevido de estado pelo React ao trocar tabs/componentes

### Como foi corrigido
```tsx
// PageWrapper.tsx
// Antes
<Component selectors={selectors} currentItem={tab.item} onCloseTab={hangleClose} />

// Depois
<Component key={tab.id} selectors={selectors} currentItem={tab.item} onCloseTab={hangleClose} />
```

```tsx
// nav-data.tsx
newDto: {
    id: 'new-dto',
    label: t('newDto'),
    ...
}

newAction: {
    id: 'new-action',
    label: t('newAction'),
    ...
}
```

```tsx
// dropdown-sidebar.tsx
const actionId = `new-action-${menuItem.id || menuItem.label}`
```

### Porque esta tecnica foi usada
A `key` baseada em `tab.id` for?a o React a desmontar e montar novamente o componente quando a identidade muda. Os IDs explicitos evitam colisao de tabs e ambiguidade na criacao de novos itens.

### Beneficio
A navegacao fica mais previsivel, com menor risco de um editor herdar estado do anterior ou abrir um tab com identidade ambigua.

## Conclusao
As correcoes foram pequenas, localizadas e alinhadas ao principio de corrigir o problema na origem. O historico foi reorganizado em tres commits separados para facilitar a revisao do time:

1. `fix(ui): replace fixed colors with semantic theme tokens`
2. `fix(api): keep body request as none without reverting to json`
3. `fix(navigation): ensure unique tab ids and force editor remount`
