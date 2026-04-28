declare module 'tabby-core' {
  export { Injectable, NgZone, Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, NgModule } from '@angular/core'

  export class ConfigService {
    store: any
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
    bind (hotkey: any, callback: () => void): void
  }

  export class ConfigProvider {
    defaults: any
  }

  export interface ToolbarButton {
    icon?: string
    title: string
    weight?: number
    click: () => void
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
  }

  export class BaseTabComponent {}

  export class SubscriptionContainer {
    cancelAll (): void
  }

  export class AppService {
    tabs: any[]
    activeTab: any
    activeTabChange$: any
  }
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

declare module 'tabby-terminal' {
  import { BaseTabComponent } from 'tabby-core'

  export class BaseTerminalTabComponent<P = any> extends BaseTabComponent {
    session: any
    input$: any
    output$: any
    sessionChanged$: any
    write (data: string): Promise<void>
  }

  export class TerminalDecorator {
    attach (terminal: BaseTerminalTabComponent<any>): void
  }
}
