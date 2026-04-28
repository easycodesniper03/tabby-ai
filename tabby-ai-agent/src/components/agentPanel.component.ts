import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core'
import { AgentService, AgentMessage } from '../services/agent.service'

@Component({
  selector: 'agent-panel',
  template: `
    <div class="agent-panel" [class.active]="visible">
      <div class="agent-header">
        <span class="agent-title">🤖 AI Agent</span>
        <button class="agent-btn" (click)="clear()" title="Clear">🗑️</button>
        <button class="agent-btn" (click)="close()" title="Close">✕</button>
      </div>
      <div class="agent-messages" #messagesContainer>
        <div *ngFor="let msg of messages" class="agent-msg" [class]="'msg-' + msg.type">
          <div *ngIf="msg.type === 'command'" class="command-preview">
            <code class="command-text" [class.risk-high]="msg.risk === 'high'" [class.risk-medium]="msg.risk === 'medium'">{{ msg.command }}</code>
            <div class="command-explanation">{{ msg.explanation }}</div>
            <div *ngIf="msg.risk === 'high'" class="risk-warning">⚠️ High risk command — please review carefully</div>
            <div class="command-actions">
              <button class="btn-execute" (click)="execute(msg.command!)">▶ Execute</button>
              <button class="btn-copy" (click)="copyCommand(msg.command!)">📋 Copy</button>
            </div>
          </div>
          <div *ngIf="msg.type !== 'command'">{{ msg.content }}</div>
        </div>
        <div *ngIf="processing" class="agent-loading">🤔 Thinking...</div>
      </div>
      <div class="agent-input-area">
        <input
          #inputBox
          class="agent-input"
          type="text"
          placeholder="Ask AI in natural language..."
          [(ngModel)]="inputText"
          (keydown.enter)="submit()"
          [disabled]="processing"
        />
        <button class="agent-send-btn" (click)="submit()" [disabled]="processing || !inputText.trim()">Send</button>
      </div>
    </div>
  `,
  styles: [`
    .agent-panel {
      display: none;
      flex-direction: column;
      height: 280px;
      background: var(--bs-body-bg, #1e1e2e);
      border-top: 1px solid var(--bs-border-color, #444);
      color: var(--bs-body-color, #ccc);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .agent-panel.active { display: flex; }
    .agent-header {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      background: var(--bs-tertiary-bg, #2a2a3a);
      border-bottom: 1px solid var(--bs-border-color, #444);
    }
    .agent-title { flex: 1; font-weight: 600; font-size: 13px; }
    .agent-btn {
      background: none;
      border: none;
      color: var(--bs-body-color, #ccc);
      cursor: pointer;
      padding: 2px 6px;
      font-size: 14px;
    }
    .agent-messages {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
      font-size: 12px;
    }
    .agent-msg { margin-bottom: 8px; padding: 6px 8px; border-radius: 4px; }
    .msg-user { background: #1a3a5c; }
    .msg-assistant { background: #1a3c1a; }
    .msg-error { background: #5c1a1a; color: #ff8888; }
    .msg-system { color: #888; font-style: italic; }
    .command-preview { padding: 4px; }
    .command-text {
      display: block;
      padding: 6px 10px;
      background: #000;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .command-text.risk-high { border-left: 3px solid #ff4444; }
    .command-text.risk-medium { border-left: 3px solid #ffaa00; }
    .command-explanation { color: #aaa; font-size: 11px; margin-bottom: 6px; }
    .risk-warning { color: #ff6666; font-size: 11px; margin-bottom: 4px; }
    .command-actions { display: flex; gap: 8px; }
    .btn-execute {
      background: #2d7d46;
      color: white;
      border: none;
      padding: 4px 12px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-copy {
      background: #444;
      color: white;
      border: none;
      padding: 4px 12px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    .agent-input-area {
      display: flex;
      padding: 6px 12px;
      border-top: 1px solid var(--bs-border-color, #444);
    }
    .agent-input {
      flex: 1;
      background: #111;
      color: #ddd;
      border: 1px solid #444;
      padding: 6px 10px;
      border-radius: 4px 0 0 4px;
      outline: none;
      font-size: 13px;
    }
    .agent-send-btn {
      background: #4a6fa5;
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      font-size: 13px;
    }
    .agent-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .agent-loading { color: #888; padding: 8px; font-style: italic; }
  `],
})
export class AgentPanelComponent implements OnInit, OnDestroy {
  @Input() visible = false
  messages: AgentMessage[] = []
  inputText = ''
  processing = false
  @ViewChild('messagesContainer') messagesContainer?: ElementRef
  @ViewChild('inputBox') inputBox?: ElementRef

  private unsub: (() => void)[] = []

  constructor (private agent: AgentService) {}

  ngOnInit (): void {
    this.messages = this.agent.getMessages()
    this.processing = this.agent.isProcessing()

    const cb = (msgs: AgentMessage[]) => {
      this.messages = msgs
      this.processing = this.agent.isProcessing()
      this.scrollToBottom()
    }
    this.agent.onMessages(cb)
    this.unsub.push(() => {
      // cleanup - we don't have a clean remove, but it's fine for MVP
    })
  }

  ngOnDestroy (): void {
    this.unsub.forEach(fn => fn())
  }

  submit (): void {
    const text = this.inputText.trim()
    if (!text) return
    this.inputText = ''
    this.agent.handleInput(text)
  }

  execute (command: string): void {
    this.agent.executeCommand(command)
  }

  copyCommand (command: string): void {
    navigator.clipboard.writeText(command)
  }

  clear (): void {
    this.agent.clearHistory()
  }

  close (): void {
    this.visible = false
  }

  private scrollToBottom (): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement
        el.scrollTop = el.scrollHeight
      }
    }, 0)
  }
}
