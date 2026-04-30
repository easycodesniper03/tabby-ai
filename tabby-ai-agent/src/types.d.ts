// Type declarations for Tabby plugin APIs

declare module 'tabby-core' {
  export { Injectable, NgZone, Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, NgModule, ComponentFactoryResolver, ApplicationRef, Injector, EnvironmentInjector, ComponentRef } from '@angular/core'
  export { CommonModule } from '@angular/common'
  export { FormsModule } from '@angular/forms'

  export class ConfigService {
    store: any
    ready$: any
  }

  export class LogService {
    debug (...args: any[]): void
    info (...args: any[]): void
    warn (...args: any[]): void
    error (...args: any[]): void
  }

  export class Logger {
    debug (...args: any[]): void
    info (...args: any[]): void
    warn (...args: any[]): void
    error (...args: any[]): void
  }

  export class NotificationsService {
    info (msg: string): void
    warn (msg: string): void
    error (msg: string): void
  }

  export class HotkeysService {
    hotkey$: any
    bind (hotkey: string, callback: () => void): void
  }

  export class ConfigProvider {
    defaults: any
  }

  export interface ToolbarButton {
    icon?: string
    title: string
    weight?: number
    click: () => void
    submenu?: () => Promise<any[]>
    touchBarTitle?: string
  }

  export class ToolbarButtonProvider {
    provide (): ToolbarButton[]
  }

  export interface HotkeyDescription {
    id: string
    name: string
  }

  export class HotkeyProvider {
    hotkeys: HotkeyDescription[]
    async provide (): Promise<HotkeyDescription[]>
  }

  export class BaseTabComponent {
    destroyed$: any
  }

  export class AppService {
    tabs: any[]
    activeTab: any
    activeTabChange$: any
    tabOpened$: any
    ready$: any
  }

  export class SubscriptionContainer {
    cancelAll (): void
  }

  // Re-export Angular modules for convenience
  export class TabbyCoreModule {}
}

declare module 'tabby-terminal' {
  import { BaseTabComponent } from 'tabby-core'

  export class BaseTerminalTabComponent<P = any> extends BaseTabComponent {
    session: any
    input$: any
    output$: any
    sessionChanged$: any
    zoom: number
    write (data: string): Promise<void>
    getSelectedText (): Promise<string>
  }

  export class TerminalDecorator {
    attach (terminal: BaseTerminalTabComponent<any>): void
    detach (terminal: BaseTerminalTabComponent<any>): void
  }

  export class SessionMiddleware {
    feedFromSession (data: Buffer): void
    feedFromTerminal (data: Buffer): void
    close (): void
    outputToSession$: any
    outputToTerminal$: any
  }

  export class SessionMiddlewareStack extends SessionMiddleware {
    push (middleware: SessionMiddleware): void
    unshift (middleware: SessionMiddleware): void
    remove (middleware: SessionMiddleware): void
  }

  export class BaseSession {
    middleware: SessionMiddlewareStack
    output$: any
    closed$: any
    destroyed$: any
    feedFromTerminal (data: Buffer): void
    getWorkingDirectory (): Promise<string>
    reportedCWD?: string
    open: boolean
  }

  export class TabbyTerminalModule {}
}

declare module 'tabby-settings' {
  export abstract class SettingsTabProvider {
    id: string
    icon: string
    title: string
    weight: number
    getComponentType (): any
  }
}

declare module '@ng-bootstrap/ng-bootstrap' {
  export class NgbModule {}
}
