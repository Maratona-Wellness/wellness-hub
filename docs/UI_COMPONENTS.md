# Componentes UI Base (Design System - Atoms)

## Visão Geral

Este documento descreve todos os componentes atômicos do Design System do Wellness Hub. Todos os componentes seguem a paleta de cores definida (70-20-10), utilizam a fonte Varela Round e seguem o espaçamento base de 8px.

## Paleta de Cores

- **Primary (70%)**: `#efefef` - `var(--color-primary)`
- **Secondary (20%)**: `#444444` - `var(--color-secondary)`
- **Accent (10%)**: `#97181B` - `var(--color-accent)`

## Componentes

### 1. Button

Botão com múltiplas variantes e estados.

**Props:**

- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `loading`: `boolean` - Mostra spinner de loading
- `icon`: `React.ReactNode` - Ícone à esquerda do texto
- Todas as props nativas de `<button>`

**Exemplo:**

```tsx
import { Button } from '@/components/ui';
import { User } from 'lucide-react';

<Button variant="primary" size="md">
  Salvar
</Button>

<Button variant="danger" loading>
  Deletando...
</Button>

<Button variant="ghost" icon={<User />}>
  Perfil
</Button>
```

---

### 2. Input

Campo de entrada de texto com suporte para ícones e estados de erro.

**Props:**

- `leftIcon`: `React.ReactNode` - Ícone à esquerda
- `rightIcon`: `React.ReactNode` - Ícone à direita
- `error`: `boolean` - Estado de erro
- Todas as props nativas de `<input>`

**Exemplo:**

```tsx
import { Input } from '@/components/ui';
import { Mail, Search } from 'lucide-react';

<Input
  type="email"
  placeholder="Email"
  leftIcon={<Mail />}
/>

<Input
  type="text"
  placeholder="Buscar..."
  rightIcon={<Search />}
/>

<Input
  type="text"
  error
  placeholder="Campo obrigatório"
/>
```

---

### 3. Select

Campo de seleção (dropdown) com placeholder.

**Props:**

- `placeholder`: `string` - Texto do placeholder
- `error`: `boolean` - Estado de erro
- Todas as props nativas de `<select>`

**Exemplo:**

```tsx
import { Select } from "@/components/ui";

<Select placeholder="Selecione uma opção">
  <option value="1">Opção 1</option>
  <option value="2">Opção 2</option>
  <option value="3">Opção 3</option>
</Select>;
```

---

### 4. Checkbox

Caixa de seleção com label opcional.

**Props:**

- `label`: `string` - Label do checkbox
- Todas as props nativas de `<input type="checkbox">`

**Exemplo:**

```tsx
import { Checkbox } from "@/components/ui";

const [checked, setChecked] = useState(false);

<Checkbox
  label="Aceito os termos e condições"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>;
```

---

### 5. Radio

Botão de opção com label.

**Props:**

- `label`: `string` - Label do radio button
- Todas as props nativas de `<input type="radio">`

**Exemplo:**

```tsx
import { Radio } from '@/components/ui';

const [value, setValue] = useState('option1');

<Radio
  label="Opção 1"
  name="options"
  value="option1"
  checked={value === 'option1'}
  onChange={(e) => setValue(e.target.value)}
/>
<Radio
  label="Opção 2"
  name="options"
  value="option2"
  checked={value === 'option2'}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### 6. Switch

Toggle switch (interruptor) com label opcional.

**Props:**

- `label`: `string` - Label do switch
- Todas as props nativas de `<input type="checkbox">`

**Exemplo:**

```tsx
import { Switch } from "@/components/ui";

const [enabled, setEnabled] = useState(false);

<Switch
  label="Ativar notificações"
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
/>;
```

---

### 7. Badge

Etiqueta (tag) para exibir status ou categorias.

**Props:**

- `variant`: `'success' | 'warning' | 'error' | 'info'` (default: `'info'`)
- Todas as props nativas de `<span>`

**Exemplo:**

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>
<Badge variant="info">Em análise</Badge>
```

---

### 8. Avatar

Avatar do usuário com fallback para iniciais ou ícone.

**Props:**

- `src`: `string` - URL da imagem
- `alt`: `string` - Texto alternativo
- `name`: `string` - Nome para gerar iniciais
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)

**Exemplo:**

```tsx
import { Avatar } from '@/components/ui';

<Avatar
  src="/images/user.jpg"
  alt="John Doe"
  size="md"
/>

<Avatar
  name="John Doe"
  size="lg"
/>

<Avatar size="sm" />
```

**Comportamento:**

- Se `src` for fornecido, mostra a imagem
- Se `src` falhar ou não for fornecido e `name` existir, mostra iniciais
- Se nenhum estiver disponível, mostra ícone de usuário padrão

---

### 9. Spinner

Indicador de loading (carregamento).

**Props:**

- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- Todas as props nativas de `<div>`

**Exemplo:**

```tsx
import { Spinner } from '@/components/ui';

<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

---

### 10. Icon

Wrapper para ícones do Lucide React com tamanhos consistentes.

**Props:**

- `icon`: `LucideIcon` - Componente de ícone do lucide-react
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)

**Exemplo:**

```tsx
import { Icon } from '@/components/ui';
import { User, Calendar, Mail } from 'lucide-react';

<Icon icon={User} size="sm" />
<Icon icon={Calendar} size="md" />
<Icon icon={Mail} size="lg" />
```

---

### 11. Text

Componente de tipografia polimórfico para todos os elementos de texto.

**Props:**

- `as`: `'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label'` - Tag HTML a ser renderizada
- `variant`: `'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label'` - Estilo visual
- Todas as props nativas do elemento correspondente

**Exemplo:**

```tsx
import { Text } from '@/components/ui';

<Text variant="h1">Título Principal</Text>
<Text variant="h2">Subtítulo</Text>
<Text variant="p">Parágrafo de texto</Text>
<Text variant="label">Label de formulário</Text>

// Renderizar <h2> com estilo de h3
<Text as="h2" variant="h3">Título Semântico</Text>
```

---

## Importação Centralizada

Todos os componentes podem ser importados de um único local:

```tsx
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
  Radio,
  Select,
  Spinner,
  Switch,
  Text,
} from "@/components/ui";
```

---

## Utilitários

### cn()

Utilitário para combinar classes CSS com suporte a classes condicionais.

```tsx
import { cn } from "@/lib/utils/cn";

const className = cn(
  "base-class",
  condition && "conditional-class",
  "another-class",
);
```

---

## Showcase

Para visualizar todos os componentes em ação, acesse a rota `/components-showcase` no navegador.

---

## Próximos Passos

Os próximos componentes a serem desenvolvidos são os **Molecules** (Etapa 1.5):

- FormField
- Card
- Modal
- Dropdown
- DatePicker
- Table
- Tabs
- Accordion
- Toast
- Pagination
