import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, ComponentRef, NgZone } from '@angular/core'
import { LogService } from 'tabby-core'
import { BaseTerminalTabComponent } from 'tabby-terminal'
import { AIService } from './ai.service'
import { TerminalService } from './terminal.service'
import { SecurityService } from './security.service'
import { CommandPreviewComponent } from '../components/command-preview.component'

/**
 * Manages the inline command preview bar that appears at the bottom of the terminal
 */
@Injectable()
export class InlinePreviewService {
  private componentRef: ComponentRef<CommandPreviewComponent> | null = null

  constructor (
    private resolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector,
    private ai: AIService,
    private terminal: TerminalService,
    private security: SecurityService,
    private log: LogService,
    private zone: NgZone,
  ) {}

  /**
   * Show a command preview for the given natural language input
   */
  async show (naturalLanguage: string): Promise<void> {
    const terminal = this.terminal.getActive()
    if (!terminal) return

    // Show loading state
    this.create(terminal, { loading: true, text: naturalLanguage })

    try {
      const cwd = this.terminal.getWorkingDirectory()
      const output = this.terminal.getRecentOutput(30)
      const result = await this.ai.generateCommand(naturalLanguage, { cwd, recentOutput: output })

      const risk = this.security.assessRisk(result.command)

      this.zone.run(() => {
        if (this.componentRef) {
          const inst = this.componentRef.instance
          inst.loading = false
          inst.command = result.command
          inst.explanation = result.explanation
          inst.risk = risk
        }
      })
    } catch (err: any) {
      this.zone.run(() => {
        if (this.componentRef) {
          this.componentRef.instance.error = err.message ?? String(err)
          this.componentRef.instance.loading = false
        }
      })
    }
  }

  /**
   * Dismiss the preview and execute the command
   */
  executeAndClose (command: string): void {
    this.dismiss()
    this.terminal.injectCommand(command)
  }

  /**
   * Just dismiss without executing
   */
  dismiss (): void {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView)
      this.componentRef.destroy()
      this.componentRef = null
    }
  }

  private create (terminal: BaseTerminalTabComponent<any>, opts: { loading: boolean; text: string }): void {
    this.dismiss()

    const factory = this.resolver.resolveComponentFactory(CommandPreviewComponent)
    this.componentRef = factory.create(this.injector)
    this.appRef.attachView(this.componentRef.hostView)

    const inst = this.componentRef.instance
    inst.loading = opts.loading
    inst.naturalLanguage = opts.text
    inst.onExecute = (cmd: string) => this.executeAndClose(cmd)
    inst.onCancel = () => this.dismiss()

    const el = (this.componentRef.hostView as any).rootNodes[0] as HTMLElement

    // Find the terminal content container and append the preview bar
    const termContainer = (terminal as any).content?.nativeElement ?? (terminal as any).elementRef?.nativeElement
    if (termContainer) {
      const parent = termContainer.parentElement ?? termContainer
      // Style the parent as flex column if needed
      if (getComputedStyle(parent).display !== 'flex') {
        parent.style.display = 'flex'
        parent.style.flexDirection = 'column'
      }
      el.style.flexShrink = '0'
      parent.appendChild(el)
    } else {
      // Fallback: append to body
      document.body.appendChild(el)
    }
  }
}
