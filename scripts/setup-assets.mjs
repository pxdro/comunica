// Copia o runtime wasm do MediaPipe e baixa o modelo de face para /public,
// deixando tudo local (funciona offline depois da primeira carga).
// Rode com:  npm run setup
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const wasmSrc = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const wasmDest = path.join(root, 'public', 'mediapipe', 'wasm')
const modelDir = path.join(root, 'public', 'models')
const modelPath = path.join(modelDir, 'face_landmarker.task')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

async function main() {
  if (!existsSync(wasmSrc)) {
    console.error('wasm do MediaPipe não encontrado. Rode "npm install" antes.')
    process.exit(1)
  }
  console.log('Copiando runtime wasm do MediaPipe...')
  await cp(wasmSrc, wasmDest, { recursive: true })

  await mkdir(modelDir, { recursive: true })
  if (existsSync(modelPath)) {
    console.log('Modelo já existe, pulando download.')
  } else {
    console.log('Baixando modelo face_landmarker (~3.7MB)...')
    const res = await fetch(MODEL_URL)
    if (!res.ok) throw new Error('Falha ao baixar modelo: ' + res.status)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(modelPath, buf)
    console.log('Modelo salvo em', modelPath)
  }
  console.log('Setup concluído.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
