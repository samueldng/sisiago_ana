/**
 * Utilitários para integração com o Netlify
 */

/**
 * Verifica se a aplicação está rodando no ambiente Netlify
 * @returns {boolean} true se estiver no ambiente Netlify
 */
export const isNetlifyEnvironment = () => {
  return (
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.NETLIFY === 'true' || process.env.CONTEXT === 'production' || process.env.NETLIFY_LOCAL === 'true')
  );
};

/**
 * Obtém a URL base do site no Netlify
 * @returns {string} URL base do site
 */
export const getNetlifySiteUrl = () => {
  if (typeof process !== 'undefined' && process.env) {
    // Em produção no Netlify
    if (process.env.URL) {
      return process.env.URL;
    }
    // Em preview deploys
    if (process.env.DEPLOY_PRIME_URL) {
      return process.env.DEPLOY_PRIME_URL;
    }
  }
  
  // Fallback para localhost em desenvolvimento
  return 'http://localhost:3000';
};

/**
 * Obtém o contexto de deploy do Netlify
 * @returns {string} Contexto de deploy (production, deploy-preview, branch-deploy)
 */
export const getNetlifyContext = () => {
  if (typeof process !== 'undefined' && process.env && process.env.CONTEXT) {
    return process.env.CONTEXT;
  }
  return 'development';
};