import { Injectable } from '@angular/core'
import { Subject, Observable, Subscription } from 'rxjs'
import { SessionMiddleware } from 'tabby-terminal'
import { ClassifierService } from './classifier.service'

/**
 * Middleware that intercepts terminal input to detect natural language.
 * When natural language is detected, it's forwarded to the agent instead of the shell.
 */
export class AIAgentMiddleware extends SessionMiddleware {
  private naturalLanguageInput = new Subject<string>()

  get naturalLanguage$ (): Observable<string> { return this.naturalLanguageInput }

  constructor (private classifier: ClassifierService) {
    super()
  }

  feedFromTerminal (data: Buffer): void {
    const text = data.toString('utf-8')

    // Only intercept if it ends with Enter (\r or \n)
    if (text.endsWith('\r') || text.endsWith('\n')) {
      const line = text.replace(/[\r\n]+$/, '').trim()
      if (line && this.classifier.isNaturalLanguage(line)) {
        // Consume this input — don't pass to shell
        this.naturalLanguageInput.next(line)
        return
      }
    }

    // Pass through to session normally
    this.outputToSession.next(data)
  }
}
