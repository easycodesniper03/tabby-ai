import { Injectable } from '@angular/core'
import { ConfigService, LogService } from 'tabby-core'

export interface LLMResponse {
  command: string
  explanation: string
  risk: 'low' | 'medium' | 'high'
  suggestions?: string[]
}

@Injectable()
export class LLMService {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor (
    private config: ConfigService,
    private log: LogService,
  ) {
    this.apiKey = this.config.store.aiAgent?.apiKey ?? ''
    this.model = this.config.store.aiAgent?.model ?? 'glm-4.7-flash'
    this.baseUrl = this.config.store.aiAgent?.baseUrl ?? 'https://open.bigmodel.cn/api/paas/v4'
  }

  getConfig (): { apiKey: string; model: string; baseUrl: string } {
    return { apiKey: this.apiKey, model: this.model, baseUrl: this.baseUrl }
  }

  async generateCommand (
    userInput: string,
    context: {
      cwd?: string
      recentOutput?: string
      osInfo?: string
      username?: string
      conversationHistory?: Array<{ role: string; content: string }>
    },
  ): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('AI Agent API key not configured. Please set it in Settings.')
    }

    const systemPrompt = `你是一个 Linux/Unix 运维助手。根据用户的自然语言描述，生成需要执行的 Shell 命令。

## 上下文
- 操作系统: ${context.osInfo ?? 'Linux'}
- 当前目录: ${context.cwd ?? '~'}
- 用户名: ${context.username ?? 'unknown'}
${context.recentOutput ? `- 最近终端输出:\n${context.recentOutput.slice(-2000)}` : ''}

## 规则
- 只返回一个命令，不要返回命令链（&&/||/;）除非用户明确要求
- 如果需要多步操作，先执行第一步，等结果后再继续
- 危险操作（rm、kill、dd 等）risk 标记为 high
- 中等风险（服务重启、安装软件）risk 标记为 medium
- 普通查看操作 risk 标记为 low

## 输出格式（严格 JSON，不要任何其他文字）
{"command": "要执行的命令", "explanation": "命令解释", "risk": "low|medium|high", "suggestions": ["可选的其他方案"]}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory ?? []).slice(-10),
      { role: 'user', content: userInput },
    ]

    const body = {
      model: this.model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }

    this.log.info('AI Agent: Sending request to LLM')

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`LLM API error (${response.status}): ${text}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`Failed to parse LLM response: ${content}`)
    }

    const result: LLMResponse = JSON.parse(jsonMatch[0])
    this.log.info(`AI Agent: Generated command: ${result.command} (risk: ${result.risk})`)
    return result
  }
}
