@Injectable()
export class ContextService {
  private recentOutput: string = ''
  private maxOutputLength = 5000

  appendOutput (data: string): void {
    this.recentOutput += data
    if (this.recentOutput.length > this.maxOutputLength) {
      this.recentOutput = this.recentOutput.slice(-this.maxOutputLength)
    }
  }

  getRecentOutput (): string {
    return this.recentOutput
  }

  clearOutput (): void {
    this.recentOutput = ''
  }

  getContext (cwd?: string, username?: string): {
    cwd?: string
    recentOutput: string
    osInfo: string
    username?: string
  } {
    return {
      cwd,
      recentOutput: this.recentOutput,
      osInfo: 'Linux',
      username,
    }
  }
}

import { Injectable } from '@angular/core'
