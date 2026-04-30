import { Component } from '@angular/core'
import { ConfigService } from 'tabby-core'

@Component({
  selector: 'ai-agent-settings',
  template: `
    <div class="settings-container">
      <h3>🤖 AI Agent 设置</h3>

      <div class="setting-group">
        <label>启用 AI Agent</label>
        <input type="checkbox" [(ngModel)]="enabled" (change)="save()">
      </div>

      <div class="setting-group">
        <label>API Key</label>
        <input type="password" [(ngModel)]="apiKey" (change)="save()" placeholder="输入你的 API Key">
      </div>

      <div class="setting-group">
        <label>模型</label>
        <select [(ngModel)]="model" (change)="save()">
          <option value="glm-4-flash-250414">GLM-4-Flash (免费)</option>
          <option value="glm-4.7-flash">GLM-4.7-Flash (免费)</option>
          <option value="glm-4.5-flash">GLM-4.5-Flash (免费)</option>
          <option value="glm-5-turbo">GLM-5-Turbo</option>
          <option value="glm-5.1">GLM-5.1</option>
        </select>
      </div>

      <div class="setting-group">
        <label>API Base URL</label>
        <input type="text" [(ngModel)]="baseUrl" (change)="save()">
        <small class="hint">支持任何 OpenAI 兼容接口</small>
      </div>

      <div class="setting-group">
        <label>侧边栏宽度 (px)</label>
        <input type="number" [(ngModel)]="sidebarWidth" (change)="save()" min="280" max="500">
      </div>

      <div class="setting-group" *ngIf="saved">
        <span class="saved-hint">✅ 已保存</span>
      </div>
    </div>
  `,
  styles: [`
    .settings-container { padding: 20px; max-width: 500px; }
    .settings-container h3 { margin-bottom: 20px; }
    .setting-group { margin-bottom: 16px; }
    .setting-group label { display: block; margin-bottom: 4px; font-weight: 600; font-size: 13px; }
    .setting-group input[type="text"],
    .setting-group input[type="password"],
    .setting-group input[type="number"],
    .setting-group select {
      width: 100%; padding: 8px 12px; border-radius: 6px;
      background: var(--background, #1a1a2e); color: var(--foreground, #e0e0e0);
      border: 1px solid var(--border-color, #333); font-size: 13px;
    }
    .setting-group input:focus, .setting-group select:focus {
      outline: none; border-color: #58a6ff;
    }
    .hint { color: #888; font-size: 11px; margin-top: 4px; display: block; }
    .saved-hint { color: #2ea043; font-size: 12px; }
  `],
})
export class SettingsComponent {
  enabled: boolean
  apiKey: string
  model: string
  baseUrl: string
  sidebarWidth: number
  saved = false

  constructor (private config: ConfigService) {
    const c = config.store.aiAgent ?? {}
    this.enabled = c.enabled ?? true
    this.apiKey = c.apiKey ?? ''
    this.model = c.model ?? 'glm-4-flash-250414'
    this.baseUrl = c.baseUrl ?? 'https://open.bigmodel.cn/api/paas/v4'
    this.sidebarWidth = c.sidebarWidth ?? 340
  }

  save (): void {
    this.config.store.aiAgent = {
      enabled: this.enabled,
      apiKey: this.apiKey,
      model: this.model,
      baseUrl: this.baseUrl,
      sidebarWidth: this.sidebarWidth,
    }
    this.saved = true
    setTimeout(() => this.saved = false, 2000)
  }
}
