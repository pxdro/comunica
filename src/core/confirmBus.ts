// Canal único de "confirmar". Qualquer detector de entrada (piscada, switch
// físico, toque) chama emit(). A tela ativa (varredura) escuta via subscribe().
// É isto que torna a entrada um módulo plugável: o núcleo nunca sabe COMO veio.
type Fn = () => void

const subscribers = new Set<Fn>()

export const confirmBus = {
  emit() {
    subscribers.forEach((f) => f())
  },
  subscribe(fn: Fn) {
    subscribers.add(fn)
    return () => {
      subscribers.delete(fn)
    }
  }
}
