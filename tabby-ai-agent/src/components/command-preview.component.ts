import { Component } from '@angular/core'

@Component({
  selector: 'ai-command-preview',
  template: `
    <div class="ai-preview" *ngIf="!cancelled">
      <div class="ai-preview-header">
        <span class="ai-preview-label">🤖 AI Agent</span>
        <button class="ai-preview-close" (click)="cancel()">✕</button>
      </div>

      <div *ngIf="loading" class="ai-preview-loading">
        <span class="loading-dots">🤔 正在生成命令...</span>
      </div>

      <div *ngIf="error" class="ai-preview-error">
        ❌ {{ error }}
      </div>

      <div *ngIf="!loading && !error && command" class="ai-preview-content">
        <div class="ai-preview-nl">💬 {{ naturalLanguage }}</div>
        <div class="ai-preview-cmd" [class.risk-high]="risk === 'high'" [class.risk-medium]="risk === 'medium'">
          <code>{{ command }}</code>
        </div>
        <div class="ai-preview-explain">{{ explanation }}</div>
        <div *ngIf="risk === 'high'" class="ai-preview-warning">⚠️ 高风险命令，请仔细确认</div>
        <div class="ai-preview-actions">
          <button class="btn-exec" (click)="execute()">▶ 执行 (Enter)</button>
          <button class="btn-cancel" (click)="cancel()">取消 (Esc)</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-preview {
      background: #1a1a2e;
      border-top: 2px solid #58a6ff;
      padding: 8px 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      color: #e0e0e0;
      min-height: 40px;
    }
    .ai-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .ai-preview-label { font-weight: 600; font-size: 11px; color: #58a6ff; }
    .ai-preview-close {
      background: none; border: none; color: #888; cursor: pointer;
      font-size: 14px; padding: 0 4px;
    }
    .ai-preview-loading { padding: 4px 0; color: #888; }
    .loading-dots { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .ai-preview-error { color: #f85149; }
    .ai-preview-nl { color: #8b949e; margin-bottom: 4px; }
    .ai-preview-cmd {
      background: #0d1117; padding: 6px 10px; border-radius: 4px;
      margin: 4px 0; border-left: 3px solid #2ea043;
    }
    .ai-preview-cmd.risk-high { border-left-color: #f85149; }
    .ai-preview-cmd.risk-medium { border-left-color: #d29922; }
    .ai-preview-cmd code {
      font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #e6edf3;
    }
    .ai-preview-explain { color: #8b949e; font-size: 11px; margin: 4px 0; }
    .ai-preview-warning { color: #f85149; font-size: 11px; margin: 4px 0; }
    .ai-preview-actions { display: flex; gap: 8px; margin-top: 6px; }
    .btn-exec {
      background: #238636; color: white; border: none; padding: 4px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    .btn-cancel {
      background: #333; color: #ccc; border: none; padding: 4px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px;
    }
  `],
})
export class CommandPreviewComponent {
  loading = true
  error = ''
  command = ''
  explanation = ''
  risk: 'low' | 'medium' | 'high' = 'low'
  naturalLanguage = ''
  cancelled = false

  onExecute: (cmd: string) => void = () => {}
  onCancel: () => void = () => {}

  execute (): void { this.onExecute(this.command) }
  cancel (): void { this.cancelled = true; this.onCancel() }
}
