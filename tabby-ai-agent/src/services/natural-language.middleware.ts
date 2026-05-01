import { Subject, Observable } from 'rxjs'
import { SessionMiddleware } from 'tabby-terminal'
import { AIService } from './ai.service'
import { TerminalService } from './terminal.service'
import { SecurityService } from './security.service'

/**
 * Middleware that intercepts Chinese input and shows AI-generated commands
 * directly in the terminal — no extra UI needed.
 */
export class NaturalLanguageMiddleware extends SessionMiddleware {
  private enabled = true
  private waitingForConfirm = false
  private pendingCommand = ''

  constructor (
    private ai: AIService,
    private terminal: TerminalService,
    private security: SecurityService,
  ) { super() }

  setEnabled (v: boolean): void { this.enabled = v }

  feedFromSession (data: Buffer): void {
    // Terminal output passes through normally
    this.outputToTerminal.next(data)
  }

  feedFromTerminal (data: Buffer): void {
    if (!this.enabled) {
      this.outputToSession.next(data)
      return
    }

    const text = data.toString('utf-8')

    // If we're waiting for confirm (Enter to execute / Esc/Ctrl+C to cancel)
    if (this.waitingForConfirm) {
      if (text === '\r' || text === '\n') {
        // Enter → execute the command
        this.waitingForConfirm = false
        const cmd = this.pendingCommand
        this.pendingCommand = ''
        this.outputToSession.next(Buffer.from(cmd + '\r'))
        return
      }
      if (text === '\x1b' || text === '\x03') {
        // Esc or Ctrl+C → cancel
        this.writeToTerminal('\r\n\x1b[2m[已取消]\x1b[0m\r\n')
        this.waitingForConfirm = false
        this.pendingCommand = ''
        return
      }
      // Any other key → ignore while waiting
      return
    }

    // Detect natural language in input
    if ((text.endsWith('\r') || text.endsWith('\n')) && !this.waitingForConfirm) {
      const line = text.replace(/[\r\n]+$/, '').trim()
      if (line && this.isNaturalLanguage(line)) {
        // Consume this input, don't pass to shell
        // Show "thinking" indicator
        this.writeToTerminal('\r\n\x1b[33m🤔 AI Agent 思考中...\x1b[0m')

        this.handleNaturalLanguage(line)
        return
      }
    }

    // Normal pass-through
    this.outputToSession.next(data)
  }

  private async handleNaturalLanguage (text: string): Promise<void> {
    try {
      const cwd = this.terminal.getWorkingDirectory()
      const output = this.terminal.getRecentOutput(30)
      const result = await this.ai.generateCommand(text, { cwd, recentOutput: output })

      const risk = this.security.assessRisk(result.command)
      const riskLabel = risk === 'high' ? '🔴 高风险' : risk === 'medium' ? '🟡 中风险' : '🟢 低风险'

      // Clear the "thinking" line and show the command
      this.writeToTerminal(`\r\x1b[2K`)  // Clear current line
      this.writeToTerminal(`\x1b[36m> ${result.command}\x1b[0m`)
      this.writeToTerminal(`\r\n  ${result.explanation}`)
      this.writeToTerminal(`\r\n  ${riskLabel}`)
      this.writeToTerminal(`\r\n\x1b[2m[Enter 执行 / Esc 取消]\x1b[0m\r\n`)

      this.pendingCommand = result.command
      this.waitingForConfirm = true
    } catch (err: any) {
      this.writeToTerminal(`\r\x1b[2K`)
      this.writeToTerminal(`\x1b[31m❌ ${err.message ?? String(err)}\x1b[0m\r\n`)
      this.waitingForConfirm = false
    }
  }

  private writeToTerminal (text: string): void {
    this.outputToTerminal.next(Buffer.from(text))
  }

  private isNaturalLanguage (input: string): boolean {
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(input)) return true
    if (/[？。！?!.]$/.test(input)) return true
    return false
  }
}
