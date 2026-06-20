/**
 * User-friendly error handling for AI API errors
 */

export interface ApiErrorDetails {
  code?: number
  message: string
  userMessage: string
  isRetryable: boolean
  action?: string
}

/**
 * Parse and convert API errors into user-friendly messages
 */
export function parseApiError(error: unknown, provider: 'claude' | 'gemini' | 'openai' | 'local'): ApiErrorDetails {
  // Default error details
  const defaultError: ApiErrorDetails = {
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    isRetryable: true,
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      ...defaultError,
      message: error,
      userMessage: error,
    }
  }

  // Handle Error objects
  if (!(error instanceof Error)) {
    return defaultError
  }

  const errorMessage = error.message.toLowerCase()

  // Parse Gemini-specific errors
  if (provider === 'gemini') {
    // Quota/billing errors (429)
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return {
        code: 429,
        message: error.message,
        userMessage: 'Google AI quota exceeded. Please check your billing details and ensure you have an active payment method set up.',
        isRetryable: false,
        action: 'Visit https://aistudio.google.com/apikey to check your API settings and billing',
      }
    }

    // Authentication errors (401, 403)
    if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('api key')) {
      return {
        code: 401,
        message: error.message,
        userMessage: 'Invalid API key. Please check your Google AI API key in settings.',
        isRetryable: false,
        action: 'Go to Settings and verify your Gemini API key',
      }
    }

    // Rate limit errors (different from quota)
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        code: 429,
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        isRetryable: true,
      }
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        message: error.message,
        userMessage: 'Network error. Please check your internet connection and try again.',
        isRetryable: true,
      }
    }

    // Model not available
    if (errorMessage.includes('model') || errorMessage.includes('not found')) {
      return {
        code: 404,
        message: error.message,
        userMessage: 'The AI model is temporarily unavailable. Please try again later.',
        isRetryable: true,
      }
    }

    // Content filter/safety
    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      return {
        message: error.message,
        userMessage: 'The AI could not process this image due to content safety filters.',
        isRetryable: false,
      }
    }
  }

  // Parse Claude-specific errors
  if (provider === 'claude') {
    // Quota/billing errors
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return {
        code: 429,
        message: error.message,
        userMessage: 'Anthropic API quota exceeded. Please check your API credits and billing.',
        isRetryable: false,
        action: 'Visit https://console.anthropic.com/ to check your API usage and billing',
      }
    }

    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('api key')) {
      return {
        code: 401,
        message: error.message,
        userMessage: 'Invalid API key. Please check your Anthropic API key in settings.',
        isRetryable: false,
        action: 'Go to Settings and verify your Claude API key',
      }
    }

    // Rate limit
    if (errorMessage.includes('rate limit')) {
      return {
        code: 429,
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        isRetryable: true,
      }
    }

    // Overloaded
    if (errorMessage.includes('overloaded') || errorMessage.includes('529')) {
      return {
        code: 529,
        message: error.message,
        userMessage: 'The Claude API is currently overloaded. Please try again in a few moments.',
        isRetryable: true,
      }
    }
  }

  // Parse OpenAI-specific errors
  if (provider === 'openai') {
    // Quota/billing errors
    if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('insufficient_quota')) {
      return {
        code: 429,
        message: error.message,
        userMessage: 'OpenAI API quota exceeded. Please check your API credits and billing.',
        isRetryable: false,
        action: 'Visit https://platform.openai.com/usage to check your API usage and billing',
      }
    }

    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('api key') || errorMessage.includes('invalid_api_key')) {
      return {
        code: 401,
        message: error.message,
        userMessage: 'Invalid API key. Please check your OpenAI API key in settings.',
        isRetryable: false,
        action: 'Go to Settings and verify your OpenAI API key',
      }
    }

    // Rate limit
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        code: 429,
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        isRetryable: true,
      }
    }

    // Model not available
    if (errorMessage.includes('model') || errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return {
        code: 404,
        message: error.message,
        userMessage: 'The AI model is temporarily unavailable. Please try again later.',
        isRetryable: true,
      }
    }

    // Content policy
    if (errorMessage.includes('content_policy') || errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      return {
        message: error.message,
        userMessage: 'The AI could not process this image due to content policy restrictions.',
        isRetryable: false,
      }
    }

    // Server errors
    if (errorMessage.includes('server_error') || errorMessage.includes('500')) {
      return {
        code: 500,
        message: error.message,
        userMessage: 'OpenAI server error. Please try again in a few moments.',
        isRetryable: true,
      }
    }
  }

  // Parse local llama-server errors. The most common failure is the server not
  // running yet (model not downloaded / sidecar not started) — a connection
  // refused / network error to loopback rather than an auth or quota problem.
  if (provider === 'local') {
    if (
      errorMessage.includes('connection refused') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch')
    ) {
      return {
        message: error.message,
        userMessage:
          'Local AI is not ready. The model may still be downloading, or the local AI server has not started yet. Please wait for the download to finish and try again.',
        isRetryable: true,
        action: 'Check the model download in Settings → AI',
      }
    }

    // Model id typo / not loaded by the server.
    if (errorMessage.includes('model') || errorMessage.includes('not found')) {
      return {
        code: 404,
        message: error.message,
        userMessage:
          'The selected local model is not available. Check the model name in Settings → AI, or download it first.',
        isRetryable: false,
        action: 'Verify the model id in Settings → AI',
      }
    }
  }

  // Generic response parsing errors
  if (errorMessage.includes('json') || errorMessage.includes('parse')) {
    return {
      message: error.message,
      userMessage: 'Failed to understand the AI response. Please try again.',
      isRetryable: true,
    }
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      message: error.message,
      userMessage: 'Request timed out. The AI is taking too long to respond. Please try again.',
      isRetryable: true,
    }
  }

  // Fallback to a generic error with the original message if it's reasonably short
  const cleanMessage = error.message.length > 150
    ? 'An error occurred while processing your request.'
    : error.message

  return {
    message: error.message,
    userMessage: cleanMessage,
    isRetryable: true,
  }
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: unknown, provider: 'claude' | 'gemini' | 'openai' | 'local'): string {
  const details = parseApiError(error, provider)

  let message = details.userMessage

  if (details.action) {
    message += `\n\n${details.action}`
  }

  return message
}
