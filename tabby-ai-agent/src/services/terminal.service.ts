import { Injectable } from '@angular/core'
import { ConfigService, LogService, AppService } from 'tabby-core'
import { BaseTerminalTabComponent, BaseSession } from 'tabby-terminal'

/**
 * Manages terminal instances — read output, inject commands, get context
 */
@Injectable()
export class TerminalService {
  private terminals = new Map<string, BaseTerminalTabComponent<any>>()
  private outputBuffers = new Map<string, string>()
  private readonly MAX_OUTPUT = 8000

  constructor (
    private app: AppService,
    private log: LogService,
  ) {}

  register (terminal: BaseTerminalTabComponent<any>): void {
    const id = this.getTerminalId(terminal)
    this.terminals.set(id, terminal)
    this.outputBuffers.set(id, '')

    // Collect output
    terminal.output$.subscribe((data: string) => {
      const buf = this.outputBuffers.get(id) ?? ''
      this.outputBuffers.set(id, (buf + data).slice(-this.MAX_OUTPUT))
    })

    terminal.destroyed$.subscribe(() => {
      this.terminals.delete(id)
      this.outputBuffers.delete(id)
    })
  }

  unregister (terminal: BaseTerminalTabComponent<any>): void {
    const id = this.getTerminalId(terminal)
    this.terminals.delete(id)
    this.outputBuffers.delete(id)
  }

  getActive (): BaseTerminalTabComponent<any> | null {
    const tab = this.app.activeTab
    if (tab instanceof BaseTerminalTabComponent) {
      return tab
    }
    return null
  }

  injectCommand (command: string): boolean {
    const terminal = this.getActive()
    if (!terminal?.session?.open) {
      return false
    }
    terminal.session.feedFromTerminal(Buffer.from(command + '\r'))
    this.log.info(`[AI Agent] Injected: ${command}`)
    return true
  }

  getRecentOutput (lines: number = 50): string {
    const terminal = this.getActive()
    if (!terminal) return ''
    const id = this.getTerminalId(terminal)
    const buf = this.outputBuffers.get(id) ?? ''
    const allLines = buf.split('\n')
    return allLines.slice(-lines).join('\n')
  }

  getWorkingDirectory (): string {
    const terminal = this.getActive()
    return terminal?.session?.reportedCWD ?? '~'
  }

  async getSelectedText (): Promise<string> {
    const terminal = this.getActive()
    if (!terminal) return ''
    try {
      return await (terminal as any).getSelectedText?.() ?? ''
    } catch {
      return ''
    }
  }

  private getTerminalId (t: BaseTerminalTabComponent<any>): string {
    return (t as any).id ?? String(Math.random())
  }
}
