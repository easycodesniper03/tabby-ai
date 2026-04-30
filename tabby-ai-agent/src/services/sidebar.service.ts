import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EnvironmentInjector, ComponentRef } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { SidebarComponent } from '../components/sidebar.component'

/**
 * Manages the AI Agent sidebar lifecycle
 * Injects sidebar into Tabby's app-root as a flexbox sibling
 */
@Injectable()
export class SidebarService {
  private componentRef: ComponentRef<SidebarComponent> | null = null
  private sidebarEl: HTMLElement | null = null
  private _visible = false
  private readonly DEFAULT_WIDTH = 340

  get visible (): boolean { return this._visible }

  constructor (
    private resolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector,
    private envInjector: EnvironmentInjector,
    private config: ConfigService,
  ) {}

  initialize (): void {
    // Auto-restore if was visible last time
    const cfg = this.config.store.aiAgent ?? {}
    if (cfg.sidebarVisible) {
      this.show()
    }
  }

  toggle (): void {
    this._visible ? this.hide() : this.show()
  }

  show (): void {
    if (this._visible) return
    this.create()
    this._visible = true
    this.saveState(true)
  }

  hide (): void {
    if (!this._visible) return
    this.destroy()
    this._visible = false
    this.saveState(false)
  }

  private create (): void {
    const appRoot = document.querySelector('app-root')
    if (!appRoot) {
      console.error('[AI Agent] app-root not found')
      return
    }

    // Make app-root a flex container
    const appEl = appRoot as HTMLElement
    appEl.style.display = 'flex'
    appEl.style.flexDirection = 'row'

    // Create sidebar component
    const factory = this.resolver.resolveComponentFactory(SidebarComponent)
    this.componentRef = factory.create(this.injector)
    this.appRef.attachView(this.componentRef.hostView)

    this.sidebarEl = (this.componentRef.hostView as any).rootNodes[0] as HTMLElement
    this.sidebarEl.id = 'ai-agent-sidebar'
    this.sidebarEl.style.width = this.getWidth() + 'px'
    this.sidebarEl.style.minWidth = '280px'
    this.sidebarEl.style.maxWidth = '500px'
    this.sidebarEl.style.height = '100%'
    this.sidebarEl.style.flexShrink = '0'
    this.sidebarEl.style.borderLeft = '1px solid var(--border-color, #333)'
    this.sidebarEl.style.overflow = 'hidden'

    // Insert as first child
    appEl.insertBefore(this.sidebarEl, appEl.firstChild)
  }

  private destroy (): void {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView)
      this.componentRef.destroy()
      this.componentRef = null
    }
    this.sidebarEl = null

    // Reset app-root
    const appRoot = document.querySelector('app-root') as HTMLElement
    if (appRoot) {
      appRoot.style.display = ''
      appRoot.style.flexDirection = ''
    }
  }

  private getWidth (): number {
    return this.config.store.aiAgent?.sidebarWidth ?? this.DEFAULT_WIDTH
  }

  private saveState (visible: boolean): void {
    if (!this.config.store.aiAgent) this.config.store.aiAgent = {}
    this.config.store.aiAgent.sidebarVisible = visible
  }
}
