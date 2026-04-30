const HIGH_RISK = [
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s|--recursive\s|--force\s)/,
  /\bkill\s+-9/,
  /\bdd\s+(if|of)=/,
  /\bmkfs\b/,
  />\s*\/dev\//,
  /\bshutdown\b/,
  /\breboot\b/,
  /\biptables\s+-F/,
  /\bchmod\s+(-R\s+)?000/,
]

const MEDIUM_RISK = [
  /\b(sudo|systemctl|service)\s/,
  /\b(apt|yum|dnf|pip|npm)\s+install/,
]

@Injectable()
export class SecurityService {
  assessRisk (command: string): 'low' | 'medium' | 'high' {
    for (const p of HIGH_RISK) if (p.test(command)) return 'high'
    for (const p of MEDIUM_RISK) if (p.test(command)) return 'medium'
    return 'low'
  }

  isHighRisk (command: string): boolean {
    return this.assessRisk(command) === 'high'
  }
}

import { Injectable } from '@angular/core'
