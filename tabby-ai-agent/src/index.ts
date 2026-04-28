import { NgModule, Injectable } from '@angular/core'
import { ConfigProvider, ConfigService, ToolbarButtonProvider, ToolbarButton, HotkeyProvider, HotkeyDescription, HotkeysService, LogService, NotificationsService, AppService } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'
import { BaseTerminalTabComponent, TerminalDecorator } from 'tabby-terminal'

import { LLMService } from './services/llm.service'
import { AgentService } from './services/agent.service'
import { ContextService } from './services/context.service'
import { AIAgentMiddleware } from './services/agentMiddleware'
import { ClassifierService } from './services/classifier.service'
import { AgentPanelComponent } from './components/agentPanel.component'
import { AISettingsComponent } from './components/settings.component'

/**
 * Provides AI Agent config defaults
 */
@Injectable()
export class AIAgentConfigProvider extends ConfigProvider {
  defaults = {
    aiAgent: {
      enabled: false,
      apiKey: '',
      model: 'glm-4-flash-250414',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    },
  }
}

/**
 * Provides the toolbar button to toggle AI Agent panel
 */
@Injectable()
export class AIAgentToolbarProvider extends ToolbarButtonProvider {
  provide (): ToolbarButton[] {
    return [{
      icon: '🤖',
      title: 'AI Agent',
      weight: 100,
      click: () => {
        window.dispatchEvent(new CustomEvent('tabby-ai-agent-toggle'))
      },
    }]
  }
}

/**
 * Hotkey provider for AI Agent toggle
 */
@Injectable()
export class AIAgentHotkeyProvider extends HotkeyProvider {
  hotkeys: HotkeyDescription[] = [{
    id: 'ai-agent-toggle',
    name: 'Toggle AI Agent panel',
  }]
}

/**
 * Settings tab provider for AI Agent configuration
 */
@Injectable()
export class AIAgentSettingsTabProvider extends SettingsTabProvider {
  id = 'ai-agent'
  icon = '🤖'
  title = 'AI Agent'
  weight = 1000

  getComponentType (): any {
    return AISettingsComponent
  }
}

/**
 * Terminal decorator that attaches the AI Agent to terminal tabs
 */
@Injectable()
export class AIAgentTerminalDecorator extends TerminalDecorator {
  constructor (
    private agent: AgentService,
    private context: ContextService,
    private classifier: ClassifierService,
    private log: LogService,
  ) {
    super()
  }

  attach (terminal: BaseTerminalTabComponent<any>): void {
    this.log.info('AI Agent: Attaching to terminal')

    // Collect terminal output for AI context
    terminal.output$.subscribe((data: string) => {
      this.context.appendOutput(data)
    })

    // Install middleware for input interception
    if (terminal.session?.middleware) {
      const mw = new AIAgentMiddleware(this.classifier)
      terminal.session.middleware.unshift(mw)

      mw.naturalLanguage$.subscribe((input: string) => {
        const cwd = terminal.session?.reportedCWD
        this.agent.handleInput(input, cwd)
      })

      terminal.session.closed$.subscribe(() => {
        terminal.session?.middleware?.remove(mw)
        mw.close()
      })
    }

    // Listen for session changes (reconnects)
    terminal.sessionChanged$.subscribe(() => {
      if (terminal.session?.middleware) {
        const mw = new AIAgentMiddleware(this.classifier)
        terminal.session.middleware.unshift(mw)

        mw.naturalLanguage$.subscribe((input: string) => {
          const cwd = terminal.session?.reportedCWD
          this.agent.handleInput(input, cwd)
        })

        terminal.session.closed$.subscribe(() => {
          terminal.session?.middleware?.remove(mw)
          mw.close()
        })
      }
    })
  }
}

@NgModule({
  providers: [
    AIAgentConfigProvider,
    { provide: ConfigProvider, useExisting: AIAgentConfigProvider, multi: true },
    AIAgentToolbarProvider,
    { provide: ToolbarButtonProvider, useExisting: AIAgentToolbarProvider, multi: true },
    AIAgentHotkeyProvider,
    { provide: HotkeyProvider, useExisting: AIAgentHotkeyProvider, multi: true },
    AIAgentSettingsTabProvider,
    { provide: SettingsTabProvider, useExisting: AIAgentSettingsTabProvider, multi: true },
    AIAgentTerminalDecorator,
    { provide: TerminalDecorator, useExisting: AIAgentTerminalDecorator, multi: true },
    LLMService,
    AgentService,
    ContextService,
    ClassifierService,
  ],
  declarations: [
    AgentPanelComponent,
    AISettingsComponent,
  ],
  exports: [
    AgentPanelComponent,
    AISettingsComponent,
  ],
})
export default class AIAgentModule {
  constructor (
    private agent: AgentService,
    private config: ConfigService,
    private app: AppService,
    private log: LogService,
  ) {
    this.log.info('AI Agent plugin loaded ✅')

    // Set up command execution callback — inject into active terminal
    this.agent.setCommandCallback((command: string) => {
      const tab = this.app.activeTab
      if (tab instanceof BaseTerminalTabComponent && tab.session) {
        tab.session.feedFromTerminal(Buffer.from(command + '\r'))
        this.log.info(`AI Agent: Injected command: ${command}`)
      } else {
        this.log.warn('AI Agent: No active terminal to inject command')
      }
    })
  }
}
