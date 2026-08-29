/**
 * Compatibility re-export layer
 * Points all existing `import { base44 } from "@/api/base44Client"`
 * directly to our custom API client adapter.
 */
import { apiClient } from './client';

export const base44 = apiClient;
export { apiClient };
export default apiClient;
