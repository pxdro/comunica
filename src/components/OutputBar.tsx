export function OutputBar({ text }: { text: string }) {
  return (
    <div className="output-bar">
      {text ? (
        <span className="output-text">{text}</span>
      ) : (
        <span className="output-hint">Selecione uma frase ou escreva…</span>
      )}
    </div>
  )
}
