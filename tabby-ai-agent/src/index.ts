import { NgModule, Injectable } from '@angular/core'
import { ConfigProvider, ConfigService, ToolbarButtonProvider, ToolbarButton, HotkeyProvider, HotkeyDescription, HotkeysService, LogService, NotificationsService, AppService } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'
import { BaseTerminalTabComponent } from 'tabby-terminal'

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
      model: 'glm-4.7-flash',
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
    private context: ContextService,
    private hotkeys: HotkeysService,
    private log: LogService,
    private notifications: NotificationsService,
    private config: ConfigService,
    private app: AppService,
    private classifier: ClassifierService,
  ) {
    this.log.info('AI Agent plugin loaded ✅')

    // Set up command execution callback
    this.agent.setCommandCallback((command: string) => {
      this.injectCommand(command)
    })

    // Monitor active tab changes and collect terminal output
    this.app.activeTabChange$.subscribe((tab: any) => {
      this.attachOutputCollector(tab)
    })

    // Attach to current active tab if any
    if (this.app.activeTab) {
      this.attachOutputCollector(this.app.activeTab)
    }
  }

  /**
   * Get the active terminal tab
   */
  private getActiveTerminalTab (): BaseTerminalTabComponent<any> | null {
    const tab = this.app.activeTab
    if (tab instanceof BaseTerminalTabComponent) {
      return tab
    }
    // If it's a split tab, find the focused terminal
    if (tab && tab.tabs) {
      for (const t of tab.tabs) {
        if (t instanceof BaseTerminalTabComponent) {
          return t
        }
      }
    }
    return null
  }

  /**
   * Inject a command into the active terminal
   */
  private injectCommand (command: string): void {
    const terminal = this.getActiveTerminalTab()
    if (terminal?.session) {
      const data = Buffer.from(command + '\r')
      terminal.session.feedFromTerminal(data)
      this.log.info(`AI Agent: Injected command: ${command}`)
    } else {
      this.notifications.error('No active terminal session found')
    }
  }

  /**
   * Attach output collector and input interceptor to a terminal tab
   */
  private attachOutputCollector (tab: any): void {
    if (tab instanceof BaseTerminalTabComponent) {
      const terminal = tab as BaseTerminalTabComponent<any>

      // Collect output for context
      terminal.output$.subscribe((data: string) => {
        this.context.appendOutput(data)
      })

      // Install AI Agent middleware for input interception
      if (terminal.session?.middleware) {
        const mw = new AIAgentMiddleware(this.classifier)
        terminal.session.middleware.unshift(mw)

        // When natural language is detected, send to agent
        mw.naturalLanguage$.subscribe((input: string) => {
          const cwd = terminal.session?.reportedCWD
          this.agent.handleInput(input, cwd)
        })

        // Remove middleware when session closes
        terminal.session.closed$.subscribe(() => {
          terminal.session?.middleware?.remove(mw)
          mw.close()
        })
      }
    }
  }
}
