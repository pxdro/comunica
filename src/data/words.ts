// Dicionário base de português (ordem ~ frequência). Usado na predição de
// palavras. A predição também aprende as palavras que ele mais usa (storage).
// Não precisa ser gigante: o aprendizado por uso cobre o resto.
const RAW = `
que nao não de o a e do da em um para com uma os no se na por mais as dos como
mas foi ao ele das seu sua ou quando muito nos ja já eu tambem também so só pelo
pela ate até isso ela entre era depois sem mesmo aos seus quem nas me esse eles
voce você essa num nem suas meu minha numa elas qual nos lhe deles esta estes
estas isto aquilo estou esta está estamos estao estão estava ser sou somos sao
são tenho tem temos tinha sim agora hoje amanha amanhã ontem aqui ali la lá bem
mal obrigado obrigada favor ajuda ajudar agua água comida comer beber dor doi
dói cansado cansaco cansaço frio calor banheiro xixi remedio remédio medico
médico dormir deitar sentar levantar travesseiro cobertor cama cadeira televisao
televisão musica música telefone familia família esposa marido filho filha neto
neta casa quero queria preciso pode poderia chamar vir perto longe abrir fechar
ligar desligar luz janela porta mao mão pe pé perna braco braço cabeca cabeça
costas olho boca nariz respirar aspirar engasgo cocar coçar virar mexer parar
esperar devagar rapido rápido mudar posicao posição sede fome sono dia noite
tarde manha manhã gente coisa tempo vez hora momento por favor agora pouco muito
melhor pior quente gelada gelado doce salgado leve forte direita esquerda cima
baixo frente atras atrás mais menos outra outro nova novo ainda quase logo
sempre nunca talvez certo errado bom boa ruim feliz triste medo amor saudade
nao consigo consigo entendi entende ouvindo ouviu vendo viu volta fica fique
calma obrigadinho desculpa licenca licença
`

export interface WordEntry {
  w: string
  f: number
}

function build(): WordEntry[] {
  const tokens = RAW.trim().split(/\s+/)
  const seen = new Set<string>()
  const out: WordEntry[] = []
  // frequência decrescente pela ordem de aparição
  let f = tokens.length
  for (const t of tokens) {
    const w = t.toLowerCase()
    if (!seen.has(w) && w.length > 0) {
      seen.add(w)
      out.push({ w, f })
    }
    f--
  }
  return out
}

export const BASE_WORDS: WordEntry[] = build()
