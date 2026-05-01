import { Injectable, NgZone } from '@angular/core'
import { LogService, ConfigService } from 'tabby-core'
import { BaseTerminalTabComponent, TerminalDecorator } from 'tabby-terminal'
import { TerminalService } from './terminal.service'
import { InlinePreviewService } from './inline-preview.service'
import { NaturalLanguageMiddleware } from './natural-language.middleware'

@Injectable()
export class AITerminalDecorator extends TerminalDecorator {
  private middlewares = new Map<string, NaturalLanguageMiddleware>()

  constructor (
    private terminal: TerminalService,
    private preview: InlinePreviewService,
    private config: ConfigService,
    private log: LogService,
    private zone: NgZone,
  ) { super() }

  attach (terminal: BaseTerminalTabComponent<any>): void {
    this.terminal.register(terminal)
    this.installMiddleware(terminal)
    this.log.info('[AI Agent] Attached to terminal')

    // Re-install middleware when session changes (reconnects)
    ;(terminal as any).sessionChanged$?.subscribe(() => {
      this.installMiddleware(terminal)
    })
  }

  detach (terminal: BaseTerminalTabComponent<any>): void {
    const id = this.getTerminalId(terminal)
    const mw = this.middlewares.get(id)
    if (mw) {
      terminal.session?.middleware?.remove(mw)
      mw.close()
      this.middlewares.delete(id)
    }
    this.terminal.unregister(terminal)
  }

  private installMiddleware (terminal: BaseTerminalTabComponent<any>): void {
    if (!terminal.session?.middleware) return

    const id = this.getTerminalId(terminal)
    // Remove old middleware if any
    const old = this.middlewares.get(id)
    if (old) {
      terminal.session.middleware.remove(old)
      old.close()
    }

    const mw = new NaturalLanguageMiddleware()
    // Check if AI Agent is enabled
    const enabled = this.config.store.aiAgent?.enabled ?? true
    mw.setEnabled(enabled)

    // When natural language is detected → show inline preview
    mw.naturalLanguage$.subscribe((text: string) => {
      this.log.info(`[AI Agent] Natural language detected: ${text}`)
      this.zone.run(() => {
        this.preview.show(text)
      })
    })

    terminal.session.middleware.unshift(mw)
    this.middlewares.set(id, mw)
  }

  private getTerminalId (t: BaseTerminalTabComponent<any>): string {
    return (t as any).id ?? String(Math.random())
  }
}
