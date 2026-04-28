const HIGH_RISK_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s|--recursive\s|--force\s)/,
  /\bkill\s+-9/,
  /\bdd\s+(if|of)=/,
  /\bmkfs\b/,
  /\bformat\b/i,
  />\s*\/dev\//,
  /\bshutdown\b/,
  /\breboot\b/,
  /\biptables\s+-F/,
  /\bchmod\s+(-R\s+)?000/,
  /\bchown\s+.*\/\//,
]

export function assessRisk (command: string): 'low' | 'medium' | 'high' {
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(command)) return 'high'
  }
  // Medium risk patterns
  if (/\b(sudo|systemctl|service|apt|yum|pip|npm)\s/.test(command)) return 'medium'
  return 'low'
}
