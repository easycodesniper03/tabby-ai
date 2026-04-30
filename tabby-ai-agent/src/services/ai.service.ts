import { Injectable } from '@angular/core'
import { ConfigService, LogService } from 'tabby-core'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  command?: string
  risk?: 'low' | 'medium' | 'high'
  timestamp: number
}

/**
 * AI Service — calls LLM API and manages conversation
 */
@Injectable()
export class AIService {
  private history: ChatMessage[] = []

  constructor (
    private config: ConfigService,
    private log: LogService,
  ) {}

  getConfig (): { apiKey: string; model: string; baseUrl: string } {
    const c = this.config.store.aiAgent ?? {}
    return {
      apiKey: c.apiKey ?? '',
      model: c.model ?? 'glm-4-flash-250414',
      baseUrl: c.baseUrl ?? 'https://open.bigmodel.cn/api/paas/v4',
    }
  }

  getHistory (): ChatMessage[] { return this.history }
  clearHistory (): void { this.history = [] }

  /**
   * Send a message to the AI and get a streaming response
   */
  async chat (
    userInput: string,
    context: { cwd?: string; recentOutput?: string },
    onChunk: (text: string) => void,
  ): Promise<string> {
    const { apiKey, model, baseUrl } = this.getConfig()
    if (!apiKey) throw new Error('请先在设置中配置 API Key')

    this.history.push({ role: 'user', content: userInput, timestamp: Date.now() })

    const systemPrompt = this.buildSystemPrompt(context)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.history.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ]

    const body = { model, messages, temperature: 0.3, max_tokens: 1024, stream: true }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`API 错误 (${resp.status}): ${text}`)
    }

    // Stream SSE response
    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break

        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            fullContent += delta
            onChunk(delta)
          }
        } catch {}
      }
    }

    this.history.push({ role: 'assistant', content: fullContent, timestamp: Date.now() })
    return fullContent
  }

  /**
   * Quick command generation — returns parsed JSON
   */
  async generateCommand (
    userInput: string,
    context: { cwd?: string; recentOutput?: string },
  ): Promise<{ command: string; explanation: string; risk: string }> {
    const { apiKey, model, baseUrl } = this.getConfig()
    if (!apiKey) throw new Error('请先在设置中配置 API Key')

    const systemPrompt = `你是一个 Linux/Unix 运维助手。根据用户的自然语言描述，生成需要执行的 Shell 命令。

## 规则
- 只返回一个命令，不要命令链
- 危险操作 risk 标记为 high
- 中等风险 risk 标记为 medium
- 普通操作 risk 标记为 low

## 输出格式（严格 JSON，不要其他文字）
{"command": "命令", "explanation": "解释", "risk": "low|medium|high"}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.recentOutput ? [{ role: 'user', content: `[终端输出]\n${context.recentOutput.slice(-1000)}` }] : []),
      { role: 'user', content: userInput },
    ]

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 256 }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`API 错误 (${resp.status}): ${text}`)
    }

    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`AI 返回格式异常: ${content}`)

    return JSON.parse(jsonMatch[0])
  }

  private buildSystemPrompt (context: { cwd?: string; recentOutput?: string }): string {
    return `你是 AI Agent，一个专业的 Linux/Unix 运维助手，运行在 Tabby 终端中。

## 当前环境
- 工作目录: ${context.cwd ?? '~'}
${context.recentOutput ? `- 最近终端输出:\n\`\`\`\n${context.recentOutput.slice(-2000)}\n\`\`\`` : ''}

## 你的能力
1. **生成命令** — 用户用自然语言描述需求，你生成 Shell 命令
2. **解释命令** — 解释命令的含义和每个参数
3. **诊断问题** — 分析终端输出中的错误，给出修复建议
4. **编写脚本** — 根据需求生成完整的 Shell 脚本

## 规则
- 用中文回复
- 生成命令时用代码块包裹：\`command\`
- 解释要简洁明了
- 危险命令要特别提醒
- 不要编造不存在的命令或参数`
  }
}
