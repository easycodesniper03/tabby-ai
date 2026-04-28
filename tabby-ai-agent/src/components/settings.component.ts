import { Component } from '@angular/core'
import { ConfigService } from 'tabby-core'

@Component({
  selector: 'ai-agent-settings',
  template: `
    <div class="ai-settings">
      <h3>🤖 AI Agent Settings</h3>
      <div class="setting-group">
        <label>API Key</label>
        <input type="password" [(ngModel)]="apiKey" (change)="save()" placeholder="Your API key" />
      </div>
      <div class="setting-group">
        <label>Model</label>
        <select [(ngModel)]="model" (change)="save()">
          <option value="glm-4.7-flash">GLM-4.7-Flash (Free)</option>
          <option value="glm-4-flash-250414">GLM-4-Flash (Free)</option>
          <option value="glm-4.5-flash">GLM-4.5-Flash (Free)</option>
          <option value="glm-5-turbo">GLM-5-Turbo</option>
          <option value="glm-5.1">GLM-5.1</option>
        </select>
      </div>
      <div class="setting-group">
        <label>API Base URL</label>
        <input type="text" [(ngModel)]="baseUrl" (change)="save()" />
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" [(ngModel)]="enabled" (change)="save()" />
          Enable AI Agent
        </label>
      </div>
    </div>
  `,
  styles: [`
    .ai-settings { padding: 16px; }
    .ai-settings h3 { margin-bottom: 16px; }
    .setting-group { margin-bottom: 12px; }
    .setting-group label { display: block; margin-bottom: 4px; font-weight: 600; font-size: 13px; }
    .setting-group input[type="text"],
    .setting-group input[type="password"],
    .setting-group select {
      width: 100%; max-width: 400px; padding: 6px 10px; border-radius: 4px;
      background: var(--bs-body-bg); color: var(--bs-body-color);
      border: 1px solid var(--bs-border-color);
    }
  `],
})
export class AISettingsComponent {
  apiKey: string
  model: string
  baseUrl: string
  enabled: boolean

  constructor (private config: ConfigService) {
    const store = config.store.aiAgent ?? {}
    this.apiKey = store.apiKey ?? ''
    this.model = store.model ?? 'glm-4.7-flash'
    this.baseUrl = store.baseUrl ?? 'https://open.bigmodel.cn/api/paas/v4'
    this.enabled = store.enabled ?? false
  }

  save (): void {
    this.config.store.aiAgent = {
      apiKey: this.apiKey,
      model: this.model,
      baseUrl: this.baseUrl,
      enabled: this.enabled,
    }
  }
}
