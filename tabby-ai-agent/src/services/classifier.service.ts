@Injectable()
export class ClassifierService {

  /**
   * Determine if input is natural language (vs a shell command)
   */
  isNaturalLanguage (input: string): boolean {
    const trimmed = input.trim()
    if (!trimmed) return false

    // Contains Chinese characters
    if (/[\u4e00-\u9fff]/.test(trimmed)) return true

    // Ends with question mark or period
    if (/[？。！?!.]$/.test(trimmed)) return true

    // Long input with no shell operators = likely natural language
    const hasShellOps = /[|>&;$`{}()]/.test(trimmed)
    const words = trimmed.split(/\s+/)
    if (words.length > 4 && !hasShellOps) return true

    return false
  }
}

import { Injectable } from '@angular/core'
