
## Plano: Corrigir Erro de Sintaxe no FeedPost.tsx

### Problema Identificado
O arquivo `src/components/feed/FeedPost.tsx` tem **imports declarados depois de variáveis de módulo (`let`)**, o que viola a especificação ES modules e causa falha silenciosa em Safari e Chrome:

```tsx
// Linha 11
import { usePostTags } from "@/hooks/usePostTags";

// Linhas 12-14 - variáveis de módulo
let currentlyPlayingFeedMusic: HTMLAudioElement | null = null;
let currentlyPlayingFeedMusicStop: (() => void) | null = null;

// Linhas 15+ - IMPORTS DEPOIS DAS VARIÁVEIS (ERRO!)
import { FullscreenVideoViewer } from "./FullscreenVideoViewer";
```

Em ES modules, todos os `import` devem estar no topo do arquivo, antes de qualquer outra declaração de código.

---

### Solução

Mover todas as declarações `import` para o topo do arquivo, antes das variáveis de módulo.

---

### Mudanças no Arquivo

**Arquivo:** `src/components/feed/FeedPost.tsx`

**Antes (linhas 1-28):**
```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// ... outros imports ...
import { usePostTags } from "@/hooks/usePostTags";

// Module-level variables
let currentlyPlayingFeedMusic: HTMLAudioElement | null = null;
let currentlyPlayingFeedMusicStop: (() => void) | null = null;

import { FullscreenVideoViewer } from "./FullscreenVideoViewer";  // ❌ ERRO
import { FullscreenImageViewer } from "./FullscreenImageViewer";  // ❌ ERRO
// ... mais imports ...
```

**Depois (estrutura correta):**
```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Bookmark } from "lucide-react";
import { useLikePost, useSavePost, useUpdatePost, useDeletePost, useReportPost, type Post } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { CommentsSheet } from "./CommentsSheet";
import { LikesSheet } from "./LikesSheet";
import { MusicDetailsSheet } from "./MusicDetailsSheet";
import { usePostTags } from "@/hooks/usePostTags";
import { FullscreenVideoViewer } from "./FullscreenVideoViewer";      // ✅ Movido para cima
import { FullscreenImageViewer } from "./FullscreenImageViewer";      // ✅ Movido para cima
import { useStories } from "@/hooks/useStories";                      // ✅ Movido para cima
import { StoryViewer } from "./StoryViewer";                          // ✅ Movido para cima
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";

// Module-level variables to track currently playing music across all FeedPost instances
let currentlyPlayingFeedMusic: HTMLAudioElement | null = null;       // ✅ Depois dos imports
let currentlyPlayingFeedMusicStop: (() => void) | null = null;       // ✅ Depois dos imports

interface FeedPostProps {
  post: Post;
  disableVideoViewer?: boolean;
}
// ... resto do código
```

---

### Por que isso resolve o problema?

1. **ES Modules Specification**: Os `import` são "hoisted" (elevados) semanticamente, mas declarações mistas podem causar comportamento inconsistente entre navegadores
2. **Safari/Chrome strict mode**: Esses navegadores podem falhar silenciosamente quando encontram código estruturado incorretamente
3. **Build tooling**: Mesmo que Vite/ESBuild processem o código, a estrutura incorreta pode gerar bundles problemáticos

---

### Arquivos a Modificar

1. **`src/components/feed/FeedPost.tsx`**
   - Reorganizar imports para o topo do arquivo
   - Mover variáveis de módulo (`let currentlyPlayingFeedMusic...`) para depois de todos os imports
