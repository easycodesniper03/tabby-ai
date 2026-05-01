import { Subject, Observable } from 'rxjs'
import { SessionMiddleware } from 'tabby-terminal'

/**
 * Middleware that intercepts terminal input to detect natural language (Chinese).
 * When detected, the input is consumed and forwarded to the AI agent instead of the shell.
 */
export class NaturalLanguageMiddleware extends SessionMiddleware {
  private detected = new Subject<string>()
  private enabled = true

  get naturalLanguage$ (): Observable<string> { return this.detected }

  setEnabled (v: boolean): void { this.enabled = v }

  feedFromTerminal (data: Buffer): void {
    if (!this.enabled) {
      this.outputToSession.next(data)
      return
    }

    const text = data.toString('utf-8')

    // Only intercept lines that end with Enter
    if (text.endsWith('\r') || text.endsWith('\n')) {
      const line = text.replace(/[\r\n]+$/, '').trim()
      if (line && this.isNaturalLanguage(line)) {
        // Consume this input — don't pass to shell
        this.detected.next(line)
        return
      }
    }

    // Pass through to session normally
    this.outputToSession.next(data)
  }

  private isNaturalLanguage (input: string): boolean {
    // Contains Chinese characters → natural language
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(input)) return true
    // Ends with Chinese/English punctuation
    if (/[？。！?!.]$/.test(input)) return true
    return false
  }
}
