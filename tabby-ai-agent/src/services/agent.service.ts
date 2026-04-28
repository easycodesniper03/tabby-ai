import { Injectable, NgZone } from '@angular/core'
import { LogService, NotificationsService } from 'tabby-core'
import { LLMService, LLMResponse } from './llm.service'
import { ContextService } from './context.service'
import { assessRisk } from './safety.service'

export interface AgentMessage {
  type: 'user' | 'assistant' | 'command' | 'error' | 'system'
  content: string
  command?: string
  risk?: 'low' | 'medium' | 'high'
  explanation?: string
}

@Injectable()
export class AgentService {
  private conversationHistory: Array<{ role: string; content: string }> = []
  private messages: AgentMessage[] = []
  private onMessagesChanged: ((messages: AgentMessage[]) => void)[] = []
  private processing = false
  private commandCallback: ((command: string) => void) | null = null

  constructor (
    private llm: LLMService,
    private context: ContextService,
    private log: LogService,
    private notifications: NotificationsService,
    private zone: NgZone,
  ) {}

  onMessages (cb: (messages: AgentMessage[]) => void): void {
    this.onMessagesChanged.push(cb)
  }

  getMessages (): AgentMessage[] {
    return this.messages
  }

  isProcessing (): boolean {
    return this.processing
  }

  setCommandCallback (cb: (command: string) => void): void {
    this.commandCallback = cb
  }

  /**
   * Handle natural language input from the user
   */
  async handleInput (input: string, cwd?: string): Promise<void> {
    if (this.processing) return

    this.addMessage({ type: 'user', content: input })
    this.conversationHistory.push({ role: 'user', content: input })

    this.processing = true
    this.notifyChanged()

    try {
      const ctx = this.context.getContext(cwd)
      ctx.conversationHistory = this.conversationHistory.slice(0, -1) // exclude current input

      const response = await this.llm.generateCommand(input, ctx)

      // Double-check risk with local safety service
      const localRisk = assessRisk(response.command)
      const finalRisk = localRisk === 'high' ? 'high' : response.risk

      this.addMessage({
        type: 'command',
        content: response.explanation,
        command: response.command,
        risk: finalRisk,
        explanation: response.explanation,
      })

      this.conversationHistory.push({
        role: 'assistant',
        content: `Generated: ${response.command}\nExplanation: ${response.explanation}`,
      })
    } catch (error: any) {
      this.addMessage({ type: 'error', content: error.message ?? String(error) })
      this.log.error('AI Agent error:', error)
    } finally {
      this.processing = false
      this.notifyChanged()
    }
  }

  /**
   * Execute a confirmed command and set up result collection
   */
  executeCommand (command: string): void {
    if (this.commandCallback) {
      this.commandCallback(command)
      this.addMessage({ type: 'system', content: `Executing: ${command}` })
      this.conversationHistory.push({ role: 'assistant', content: `Executed: ${command}` })

      // Set up a one-shot output collector to capture result
      // The context service will collect output automatically
      // After a delay, we'll check if the agent should suggest next steps
      this.context.clearOutput()
    }
  }

  /**
   * Check execution results and potentially suggest follow-up
   */
  async checkAndFollowUp (): Promise<void> {
    const output = this.context.getRecentOutput().trim()
    if (!output) return

    // If there's substantial output, add it to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: `[命令执行结果]\n${output.slice(-1000)}`,
    })
  }

  /**
   * Clear conversation history
   */
  clearHistory (): void {
    this.conversationHistory = []
    this.messages = []
    this.notifyChanged()
  }

  private addMessage (msg: AgentMessage): void {
    this.messages.push(msg)
    this.notifyChanged()
  }

  private notifyChanged (): void {
    this.zone.run(() => {
      for (const cb of this.onMessagesChanged) {
        cb([...this.messages])
      }
    })
  }
}
