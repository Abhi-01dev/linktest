import { config } from '../config/env.js';
import { aiRepository } from '../repositories/aiRepository.js';
import crypto from 'crypto';

const SYSTEM_PROMPT = `You are LinkTest AI Tutor, an intelligent, patient, and highly engaging educational mentor designed for Indian college students, competitive exam aspirants, and technology learners.

Core Responsibilities:
1. Explain technical, scientific, and mathematical concepts in simple, intuitive terms.
2. Provide step-by-step breakdowns, relatable real-world analogies, and clean code examples where appropriate.
3. Encourage the student and guide them toward understanding rather than merely giving quick answers.
4. When asked for practice questions, format clear multiple-choice questions with options and explanations.
5. If you do not know an answer or if a query is ambiguous, honestly admit uncertainty and ask clarifying questions.
6. Always maintain a professional, motivating, and educational tone.`;

export const aiService = {
  /**
   * Diagnostic check for AI availability
   */
  async getStatus() {
    const baseUrl = config.ollama.baseUrl.replace(/\/+$/, '');
    const targetModel = config.ollama.model;

    // Check Cloud AI provider first if configured
    if (config.cloudAi.apiKey) {
      return {
        available: true,
        provider: config.cloudAi.provider || 'cloud_llm',
        model: config.cloudAi.model,
        endpoint: config.cloudAi.baseUrl || 'https://api.groq.com/openai/v1',
        is_cloud: true,
        status_message: `Cloud AI provider is configured with model ${config.cloudAi.model}.`
      };
    }

    // Otherwise check local Ollama
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          available: false,
          model: targetModel,
          endpoint: baseUrl,
          is_cloud: false,
          error: `Ollama returned HTTP ${response.status}`,
          status_message: `Ollama service reachable at ${baseUrl} but responded with status ${response.status}.`
        };
      }

      const data = await response.json();
      const models = data.models || [];
      const hasModel = models.some(m => m.name === targetModel || m.name.startsWith(targetModel.split(':')[0]));

      return {
        available: true,
        model: targetModel,
        model_installed: hasModel,
        installed_models: models.map(m => m.name),
        endpoint: baseUrl,
        is_cloud: false,
        status_message: hasModel
          ? `Ollama is active and ${targetModel} is ready for tutoring.`
          : `Ollama is active at ${baseUrl}, but model '${targetModel}' was not found in installed models. Run 'ollama pull ${targetModel}'.`
      };
    } catch (err) {
      return {
        available: false,
        model: targetModel,
        endpoint: baseUrl,
        is_cloud: false,
        error: err.name === 'AbortError' ? 'Connection timed out' : err.message,
        status_message: `Local Ollama service is not responding at ${baseUrl}. Ensure Ollama is running ('ollama serve') or configure CLOUD_AI_API_KEY for online deployment.`
      };
    }
  },

  /**
   * Initializes and tests Ollama connectivity and model availability.
   * Optionally triggers model pull if missing.
   */
  async initOllama({ model = config.ollama.model, autoPull = false } = {}) {
    const baseUrl = config.ollama.baseUrl.replace(/\/+$/, '');
    const status = await this.getStatus();

    if (!status.available) {
      return {
        success: false,
        status: 'offline',
        endpoint: baseUrl,
        model,
        message: `Ollama is currently unreachable at ${baseUrl}. Ensure Ollama is installed and running ('ollama serve') or configure CLOUD_AI_API_KEY.`
      };
    }

    if (status.is_cloud) {
      return {
        success: true,
        status: 'cloud_ready',
        is_cloud: true,
        provider: status.provider,
        model: status.model,
        message: `Cloud AI provider is active with model '${status.model}'.`
      };
    }

    // Check if target model is installed
    const hasModel = status.installed_models?.some(m => m === model || m.startsWith(model.split(':')[0]));

    if (!hasModel && autoPull) {
      try {
        const pullRes = await fetch(`${baseUrl}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: model, stream: false })
        });
        if (!pullRes.ok) {
          throw new Error(`Pull returned status ${pullRes.status}`);
        }
      } catch (err) {
        return {
          success: false,
          status: 'pull_failed',
          model,
          endpoint: baseUrl,
          message: `Failed to pull model '${model}': ${err.message}. Run 'npm run ollama:init' or 'ollama pull ${model}'.`
        };
      }
    }

    // Warm-up inference test
    let warmupLatencyMs = null;
    let warmupSuccess = false;
    try {
      const start = Date.now();
      const testRes = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: 'Ping',
          stream: false
        })
      });
      if (testRes.ok) {
        warmupLatencyMs = Date.now() - start;
        warmupSuccess = true;
      }
    } catch (err) {
      // Warm-up is non-fatal
    }

    return {
      success: true,
      status: 'ready',
      endpoint: baseUrl,
      model,
      model_installed: hasModel || autoPull,
      warmup_success: warmupSuccess,
      latency_ms: warmupLatencyMs,
      installed_models: status.installed_models,
      message: hasModel || autoPull
        ? `Ollama is online and model '${model}' is ready (latency: ${warmupLatencyMs || 'N/A'}ms).`
        : `Ollama is reachable, but model '${model}' is not pulled yet. Run 'npm run ollama:init'.`
    };
  },

  /**
   * Interactive tutoring chat
   */
  async chat({ userId, message, conversationId }) {
    const activeConversationId = conversationId || crypto.randomUUID();

    // 1. Persist user message to DB
    await aiRepository.saveMessage({
      userId,
      conversationId: activeConversationId,
      role: 'user',
      message
    });

    // 2. Fetch past conversation context (last 8 messages for context window efficiency)
    const history = await aiRepository.getMessagesByConversation(userId, activeConversationId);
    const recentHistory = history.slice(-8);

    // 3. Check Cloud AI fallback first
    if (config.cloudAi.apiKey) {
      try {
        const cloudReply = await this._chatWithCloud({ messages: recentHistory });
        await aiRepository.saveMessage({
          userId,
          conversationId: activeConversationId,
          role: 'assistant',
          message: cloudReply
        });

        return {
          reply: cloudReply,
          conversation_id: activeConversationId,
          model: config.cloudAi.model,
          ai_available: true,
          provider: 'cloud',
          created_at: new Date().toISOString()
        };
      } catch (cloudErr) {
        console.warn('[AIService] Cloud AI call failed:', cloudErr.message);
      }
    }

    // 4. Check local Ollama
    const status = await this.getStatus();
    if (!status.available) {
      const offlineMsg = `LinkTest AI Tutor is currently in offline mode. The backend cannot connect to Ollama at ${config.ollama.baseUrl}.

To enable AI tutoring:
1. Local Development: Install Ollama (https://ollama.com), run 'ollama serve', and pull '${config.ollama.model}'.
2. Cloud Deployment: Set CLOUD_AI_API_KEY and CLOUD_AI_MODEL in backend/.env to connect to Groq, OpenAI, or OpenRouter.`;

      await aiRepository.saveMessage({
        userId,
        conversationId: activeConversationId,
        role: 'assistant',
        message: offlineMsg
      });

      return {
        reply: offlineMsg,
        conversation_id: activeConversationId,
        model: config.ollama.model,
        ai_available: false,
        created_at: new Date().toISOString()
      };
    }

    // 5. Construct messages payload for Ollama
    const ollamaMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map(m => ({ role: m.role, content: m.message }))
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.ollama.timeoutMs);

      const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollama.model,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama returned status code ${response.status}`);
      }

      const data = await response.json();
      const reply = data.message?.content || 'I processed your request, but received an empty response from the model.';

      // Persist assistant reply
      await aiRepository.saveMessage({
        userId,
        conversationId: activeConversationId,
        role: 'assistant',
        message: reply
      });

      return {
        reply,
        conversation_id: activeConversationId,
        model: config.ollama.model,
        ai_available: true,
        created_at: new Date().toISOString()
      };
    } catch (err) {
      const errMsg = `AI Tutor service error: ${err.message}. Please verify local Ollama service resources.`;

      await aiRepository.saveMessage({
        userId,
        conversationId: activeConversationId,
        role: 'assistant',
        message: errMsg
      });

      return {
        reply: errMsg,
        conversation_id: activeConversationId,
        model: config.ollama.model,
        ai_available: false,
        created_at: new Date().toISOString()
      };
    }
  },

  /**
   * Helper: Call OpenAI-compatible Cloud AI endpoint
   */
  async _chatWithCloud({ messages }) {
    const baseUrl = config.cloudAi.baseUrl || 'https://api.groq.com/openai/v1';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.message }))
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.cloudAi.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.cloudAi.model,
        messages: chatMessages,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Cloud AI provider returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Empty response from Cloud AI.';
  },

  /**
   * Quiz Generation
   */
  async generateQuiz({ topic, count = 5 }) {
    const prompt = `Generate ${count} high-quality multiple choice questions (MCQs) for the topic: "${topic}".
Output ONLY valid JSON adhering strictly to this schema, with no preamble or markdown ticks:
{
  "questions": [
    {
      "question_text": "string",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correct_option_index": 0,
      "explanation": "concise explanation why option is correct"
    }
  ]
}`;

    // Cloud AI quiz generation
    if (config.cloudAi.apiKey) {
      try {
        const reply = await this._chatWithCloud({
          messages: [{ role: 'user', message: prompt }]
        });
        const cleaned = reply.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          available: true,
          topic,
          questions: parsed.questions || []
        };
      } catch (err) {
        console.warn('[AIService] Cloud quiz generation failed:', err.message);
      }
    }

    const status = await this.getStatus();
    if (!status.available) {
      return {
        available: false,
        topic,
        questions: [],
        message: `AI service unavailable. Cannot generate custom quiz.`
      };
    }

    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollama.model,
          prompt,
          format: 'json',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama generate failed with status ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.response);
      return {
        available: true,
        topic,
        questions: parsed.questions || []
      };
    } catch (err) {
      return {
        available: false,
        topic,
        questions: [],
        message: `Failed to generate quiz with Ollama: ${err.message}`
      };
    }
  }
};
