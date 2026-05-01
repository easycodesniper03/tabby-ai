import { NgModule, Injectable } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { ConfigProvider, ConfigService, HotkeyProvider, HotkeyDescription, LogService, AppService } from 'tabby-core'
import TabbyCoreModule from 'tabby-core'
import TabbyTerminalModule, { TerminalDecorator } from 'tabby-terminal'
import { SettingsTabProvider } from 'tabby-settings'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'

import { AIService } from './services/ai.service'
import { TerminalService } from './services/terminal.service'
import { SecurityService } from './services/security.service'
import { AITerminalDecorator } from './services/terminal-decorator.service'

import { SettingsComponent } from './components/settings.component'

// ─── Providers ───────────────────────────────────────

@Injectable()
export class AIConfigProvider extends ConfigProvider {
  defaults = {
    aiAgent: {
      enabled: true,
      apiKey: '',
      model: 'glm-4-flash-250414',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    },
  }
}

@Injectable()
export class AIHotkeyProvider extends HotkeyProvider {
  hotkeys: HotkeyDescription[] = [
    { id: 'ai-agent-toggle', name: 'AI Agent 开关' },
  ]
}

@Injectable()
export class AISettingsProvider extends SettingsTabProvider {
  id = 'ai-agent'
  icon = 'fa fa-robot'
  title = 'AI Agent'
  weight = 1000

  getComponentType (): any { return SettingsComponent }
}

// ─── Module ──────────────────────────────────────────

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TabbyCoreModule,
    TabbyTerminalModule,
    NgbModule,
  ],
  providers: [
    AIConfigProvider,
    { provide: ConfigProvider, useExisting: AIConfigProvider, multi: true },
    AIHotkeyProvider,
    { provide: HotkeyProvider, useExisting: AIHotkeyProvider, multi: true },
    AISettingsProvider,
    { provide: SettingsTabProvider, useExisting: AISettingsProvider, multi: true },
    AITerminalDecorator,
    { provide: TerminalDecorator, useExisting: AITerminalDecorator, multi: true },
    AIService,
    TerminalService,
    SecurityService,
  ],
  declarations: [
    SettingsComponent,
  ],
  entryComponents: [],
})
export default class AIAgentModule {
  constructor (
    private log: LogService,
  ) {
    this.log.info('[AI Agent] Plugin loaded — type Chinese in terminal to activate')
  }
}
