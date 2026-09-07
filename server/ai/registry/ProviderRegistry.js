/**
 * ENGINEERVERSE — AI Provider Registry
 * Decouples provider registration and dynamic model inventory from Pritee logic.
 * Enables zero-code registration of future free/free-tier providers.
 */

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  registerProvider(adapter) {
    if (!adapter || !adapter.name) {
      throw new Error('Valid AIProviderAdapter instance is required for registration.');
    }
    this.providers.set(adapter.name, adapter);
  }

  getProvider(name) {
    return this.providers.get(name) || null;
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  getConfiguredProviders() {
    return this.getAllProviders().filter((p) => p.isConfigured());
  }

  /**
   * Aggregates available models across all configured providers.
   * @returns {Array<{ provider: string, id: string, name: string, isFree: boolean, capabilities: string[], priority: number }>}
   */
  getAllAvailableModels() {
    const allModels = [];
    for (const provider of this.getAllProviders()) {
      const isConfigured = provider.isConfigured();
      const models = provider.getAvailableModels();
      for (const m of models) {
        allModels.push({
          ...m,
          provider: provider.name,
          providerConfigured: isConfigured,
        });
      }
    }
    return allModels;
  }

  /**
   * Refreshes model discovery across all providers.
   */
  async discoverAllModels() {
    const results = {};
    for (const provider of this.getAllProviders()) {
      if (provider.isConfigured()) {
        try {
          const models = await provider.discoverModels();
          results[provider.name] = { success: true, count: models.length };
        } catch (err) {
          results[provider.name] = { success: false, error: err.message };
        }
      } else {
        results[provider.name] = { success: true, unconfigured: true };
      }
    }
    return results;
  }
}

export const globalProviderRegistry = new ProviderRegistry();
export default globalProviderRegistry;
