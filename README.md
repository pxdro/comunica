# Comunica

App de comunicação aumentativa (CAA) por **varredura + confirmação**, pensado para
quem tem dificuldade de fala e de movimento (ex.: ELA), mas pisca/move bem os olhos
e lê bem. Tudo roda **localmente no aparelho** (sem backend, sem nuvem). O vídeo da
câmera nunca sai do dispositivo.

## Como funciona

A tela percorre as opções sozinha (varredura automática). Quando o destaque chega
no item desejado, o usuário **confirma**. A confirmação é um módulo plugável — hoje
há três formas, todas pelo mesmo evento interno:

1. **Piscada** (câmera frontal + MediaPipe) — piscada *deliberada*: olhos fechados
   por um tempo contínuo (ajustável). Piscadas naturais não disparam.
2. **Botão/switch físico** — qualquer switch USB/Bluetooth de acessibilidade que
   envie **Espaço** ou **Enter** (a maioria envia). Também serve a barra de espaço
   do teclado para testes.
3. **Toque** — um cuidador pode tocar direto na opção.

Telas:

- **Início:** grade de frases rápidas (faladas na hora) + acesso ao teclado e aos ajustes.
- **Teclado:** varredura em duas etapas (linha → coluna) com **predição de palavras**
  que aprende as palavras mais usadas. Voz em pt-BR via Web Speech API.

## Rodar em desenvolvimento

```bash
npm install
npm run setup     # copia o wasm do MediaPipe e baixa o modelo para /public (1x)
npm run dev       # sobe em HTTPS (necessário p/ câmera fora de localhost)
```

Abra no PC: `https://localhost:5173`
No celular (mesma rede Wi-Fi): `https://SEU_IP:5173` (aparece no terminal como *Network*).

> O `npm run dev` usa um certificado **autoassinado**. No celular vai aparecer um
> aviso de segurança — toque em **Avançado → prosseguir**. É só porque o certificado
> é local; depois disso a câmera funciona normalmente.

Na primeira vez, autorize o acesso à **câmera** quando o navegador pedir.

## Instalar como app (PWA) e usar offline

```bash
npm run build
npm run preview   # serve o build em HTTPS
```

No Chrome do Android: menu → **Instalar app / Adicionar à tela inicial**. Depois da
primeira carga (com internet), o modelo e o wasm ficam em cache e o app funciona
**offline**.

Para uso definitivo, dá pra publicar o conteúdo de `dist/` em qualquer hospedagem
estática com HTTPS (ex.: Netlify, Vercel, GitHub Pages) e instalar no celular dele.

## Ajustes (ícone ⚙)

- Velocidade da varredura
- Tempo de piscada para confirmar (anti-falso-positivo)
- Sensibilidade do olho fechado
- Ligar/desligar câmera e preview
- Som ao confirmar
- Escolha da voz
- Editar as frases rápidas

## Estrutura

```
src/
  core/        evento de confirmação (confirmBus) + engine de varredura (useAutoScan)
  input/       detectores plugáveis: BlinkDetector (câmera), KeyboardDetector (switch/tecla)
  speech/      voz (TTS) + bip de confirmação
  prediction/  predição de palavras por prefixo + aprendizado
  data/        frases padrão, dicionário pt-BR, storage local
  components/  Home, Keyboard, CameraPanel, OutputBar, Settings
  App.tsx      conexão de tudo
```

## Próximos passos possíveis

- Calibração guiada da piscada (medir a piscada natural vs. deliberada dele).
- Categorias de frases (banheiro, alimentação, conforto, social…).
- Frases montadas a partir do teclado salvas como "rápidas".
- Outros gatilhos (sopro, som, olhar/eye-gaze) como novos módulos de input.
