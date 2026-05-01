import { NgModule, Injectable } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { ConfigProvider, ConfigService, ToolbarButtonProvider, ToolbarButton, HotkeyProvider, HotkeyDescription, HotkeysService, LogService, AppService } from 'tabby-core'
import TabbyCoreModule from 'tabby-core'
import TabbyTerminalModule, { TerminalDecorator } from 'tabby-terminal'
import { SettingsTabProvider } from 'tabby-settings'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'

import { AIService } from './services/ai.service'
import { TerminalService } from './services/terminal.service'
import { SidebarService } from './services/sidebar.service'
import { SecurityService } from './services/security.service'
import { InlinePreviewService } from './services/inline-preview.service'
import { AITerminalDecorator } from './services/terminal-decorator.service'

import { SidebarComponent } from './components/sidebar.component'
import { SettingsComponent } from './components/settings.component'
import { CommandPreviewComponent } from './components/command-preview.component'

// ─── Tabby Integration Providers ─────────────────────

@Injectable()
export class AIConfigProvider extends ConfigProvider {
  defaults = {
    hotkeys: {
      'ai-agent-toggle': ['Ctrl-Shift-A'],
    },
    aiAgent: {
      enabled: true,
      apiKey: '',
      model: 'glm-4-flash-250414',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      sidebarWidth: 340,
      language: 'zh',
    },
  }
}

@Injectable()
export class AIToolbarProvider extends ToolbarButtonProvider {
  constructor (private sidebar: SidebarService) { super() }

  provide (): ToolbarButton[] {
    return [{
      icon: '🤖',
      title: 'AI Agent',
      weight: 100,
      click: () => this.sidebar.toggle(),
    }]
  }
}

@Injectable()
export class AIHotkeyProvider extends HotkeyProvider {
  hotkeys: HotkeyDescription[] = [
    { id: 'ai-agent-toggle', name: 'AI Agent 面板' },
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
    AIToolbarProvider,
    { provide: ToolbarButtonProvider, useExisting: AIToolbarProvider, multi: true },
    AIHotkeyProvider,
    { provide: HotkeyProvider, useExisting: AIHotkeyProvider, multi: true },
    AISettingsProvider,
    { provide: SettingsTabProvider, useExisting: AISettingsProvider, multi: true },
    AITerminalDecorator,
    { provide: TerminalDecorator, useExisting: AITerminalDecorator, multi: true },
    AIService,
    TerminalService,
    SidebarService,
    SecurityService,
    InlinePreviewService,
  ],
  declarations: [
    SidebarComponent,
    SettingsComponent,
    CommandPreviewComponent,
  ],
  entryComponents: [
    SidebarComponent,
    CommandPreviewComponent,
  ],
})
export default class AIAgentModule {
  constructor (
    private app: AppService,
    private config: ConfigService,
    private sidebar: SidebarService,
    private hotkeys: HotkeysService,
    private log: LogService,
  ) {
    this.log.info('[AI Agent] Plugin loaded')

    this.app.ready$.subscribe(() => {
      setTimeout(() => {
        this.sidebar.initialize()
      }, 1000)
    })

    this.hotkeys.hotkey$.subscribe((hotkey: string) => {
      if (hotkey === 'ai-agent-toggle') {
        this.sidebar.toggle()
      }
    })
  }
}
