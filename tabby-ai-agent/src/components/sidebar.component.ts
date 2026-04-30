import { Component, NgZone } from '@angular/core'
import { AIService, ChatMessage } from '../services/ai.service'
import { TerminalService } from '../services/terminal.service'
import { SecurityService } from '../services/security.service'

@Component({
  selector: 'ai-agent-sidebar',
  template: `
    <div class="ai-sidebar">
      <div class="ai-header">
        <span class="ai-title">🤖 AI Agent</span>
        <div class="ai-header-actions">
          <button class="ai-btn" (click)="clearChat()" title="清除对话">🗑️</button>
          <button class="ai-btn" (click)="close()" title="关闭">✕</button>
        </div>
      </div>

      <div class="ai-messages" #scrollTarget>
        <div *ngIf="messages.length === 0" class="ai-welcome">
          <p>👋 你好！我是 AI Agent</p>
          <p>输入自然语言，我帮你生成 Shell 命令</p>
          <div class="ai-examples">
            <button class="ai-example-btn" (click)="sendPreset('查看磁盘使用情况')">查看磁盘使用情况</button>
            <button class="ai-example-btn" (click)="sendPreset('查看占用80端口的进程')">查看占用端口的进程</button>
            <button class="ai-example-btn" (click)="sendPreset('查看系统内存使用')">查看系统内存使用</button>
          </div>
        </div>

        <div *ngFor="let msg of messages" class="ai-msg" [class]="'msg-' + msg.role">
          <div *ngIf="msg.role === 'user'" class="msg-user">{{ msg.content }}</div>
          <div *ngIf="msg.role === 'assistant'" class="msg-assistant">
            <div class="msg-text" [innerHTML]="renderMarkdown(msg.content)"></div>
            <div *ngIf="msg.command" class="msg-command" [class.risk-high]="msg.risk === 'high'" [class.risk-medium]="msg.risk === 'medium'">
              <code>{{ msg.command }}</code>
              <div class="command-actions">
                <button class="btn-exec" (click)="executeCommand(msg.command)">▶ 执行</button>
                <button class="btn-copy" (click)="copyToClipboard(msg.command)">📋</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="loading" class="ai-loading">
          <span class="loading-dots">🤔 思考中</span>
        </div>
        <div *ngIf="error" class="ai-error">❌ {{ error }}</div>
      </div>

      <div class="ai-input-area">
        <textarea
          #inputBox
          class="ai-input"
          [(ngModel)]="inputText"
          (keydown.enter)="onEnter($event)"
          placeholder="输入自然语言或提问..."
          rows="2"
          [disabled]="loading"
        ></textarea>
        <button class="ai-send" (click)="send()" [disabled]="loading || !inputText.trim()">发送</button>
      </div>
    </div>
  `,
  styles: [`
    .ai-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--background, #1a1a2e);
      color: var(--foreground, #e0e0e0);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
    }
    .ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--tbackground, #16213e);
      border-bottom: 1px solid var(--border-color, #333);
    }
    .ai-title { font-weight: 600; font-size: 14px; }
    .ai-header-actions { display: flex; gap: 4px; }
    .ai-btn {
      background: none; border: none; color: var(--foreground, #ccc);
      cursor: pointer; padding: 2px 6px; font-size: 14px; border-radius: 4px;
    }
    .ai-btn:hover { background: rgba(255,255,255,0.1); }

    .ai-messages { flex: 1; overflow-y: auto; padding: 12px; }
    .ai-welcome { text-align: center; padding: 20px 10px; color: #888; }
    .ai-welcome p { margin: 6px 0; }
    .ai-examples { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
    .ai-example-btn {
      background: rgba(255,255,255,0.05); border: 1px solid #333;
      color: #aaa; padding: 6px 12px; border-radius: 6px; cursor: pointer;
      font-size: 12px; text-align: left;
    }
    .ai-example-btn:hover { background: rgba(255,255,255,0.1); color: #ddd; }

    .ai-msg { margin-bottom: 10px; }
    .msg-user {
      background: #1a3a5c; padding: 8px 12px; border-radius: 12px 12px 4px 12px;
      margin-left: 20px; word-break: break-word;
    }
    .msg-assistant {
      background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 12px 12px 12px 4px;
      margin-right: 10px; word-break: break-word;
    }
    .msg-text { line-height: 1.6; }
    .msg-text :is(code, pre) { background: #111; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .msg-command {
      margin-top: 8px; padding: 8px; background: #0d1117; border-radius: 6px;
      border-left: 3px solid #2ea043;
    }
    .msg-command.risk-high { border-left-color: #f85149; }
    .msg-command.risk-medium { border-left-color: #d29922; }
    .msg-command code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; color: #e6edf3; }
    .command-actions { display: flex; gap: 6px; margin-top: 6px; }
    .btn-exec {
      background: #238636; color: white; border: none; padding: 3px 10px;
      border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    .btn-exec:hover { background: #2ea043; }
    .btn-copy {
      background: #333; color: white; border: none; padding: 3px 8px;
      border-radius: 4px; cursor: pointer; font-size: 12px;
    }

    .ai-loading { padding: 8px 12px; color: #888; }
    .loading-dots { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .ai-error { padding: 8px 12px; color: #f85149; font-size: 12px; }

    .ai-input-area {
      padding: 8px 12px;
      border-top: 1px solid var(--border-color, #333);
      display: flex; gap: 8px; align-items: flex-end;
    }
    .ai-input {
      flex: 1; background: #0d1117; color: #e0e0e0;
      border: 1px solid #333; border-radius: 8px; padding: 8px 10px;
      outline: none; font-size: 13px; resize: none; font-family: inherit;
      min-height: 36px; max-height: 120px;
    }
    .ai-input:focus { border-color: #58a6ff; }
    .ai-send {
      background: #238636; color: white; border: none;
      padding: 8px 16px; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; white-space: nowrap;
    }
    .ai-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-send:hover:not(:disabled) { background: #2ea043; }
  `],
})
export class SidebarComponent {
  messages: ChatMessage[] = []
  inputText = ''
  loading = false
  error = ''

  constructor (
    private ai: AIService,
    private terminal: TerminalService,
    private security: SecurityService,
    private zone: NgZone,
  ) {}

  send (): void {
    const text = this.inputText.trim()
    if (!text || this.loading) return
    this.inputText = ''
    this.error = ''
    this.loading = true

    const cwd = this.terminal.getWorkingDirectory()
    const output = this.terminal.getRecentOutput(30)

    this.ai.chat(text, { cwd, recentOutput: output }, (chunk) => {
      // Streaming update
      this.zone.run(() => {
        if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'assistant') {
          this.messages[this.messages.length - 1].content += chunk
        } else {
          this.messages.push({ role: 'assistant', content: chunk, timestamp: Date.now() })
        }
      })
    }).then((fullContent) => {
      // Try to extract command from response
      const cmdMatch = fullContent.match(/```(?:bash|sh|shell)?\s*\n?([^\n`]+)\n?```/)
      if (cmdMatch) {
        const cmd = cmdMatch[1].trim()
        const risk = this.security.assessRisk(cmd)
        if (this.messages.length > 0) {
          this.messages[this.messages.length - 1].command = cmd
          this.messages[this.messages.length - 1].risk = risk
        }
      }
    }).catch((err: any) => {
      this.error = err.message ?? String(err)
    }).finally(() => {
      this.loading = false
    })
  }

  sendPreset (text: string): void {
    this.inputText = text
    this.send()
  }

  executeCommand (command: string): void {
    if (this.security.isHighRisk(command)) {
      if (!confirm(`⚠️ 高风险命令！\n\n${command}\n\n确定要执行吗？`)) return
    }
    const ok = this.terminal.injectCommand(command)
    if (!ok) {
      this.error = '没有活跃的终端会话'
    }
  }

  copyToClipboard (text: string): void {
    navigator.clipboard.writeText(text)
  }

  clearChat (): void {
    this.messages = []
    this.ai.clearHistory()
    this.error = ''
  }

  close (): void {
    // Dispatch event for sidebar service to handle
    window.dispatchEvent(new CustomEvent('ai-agent-close'))
  }

  onEnter (event: KeyboardEvent): void {
    if (event.shiftKey) return // Shift+Enter = newline
    event.preventDefault()
    this.send()
  }

  renderMarkdown (text: string): string {
    // Simple markdown: code blocks, inline code, bold, newlines
    return text
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
  }
}
