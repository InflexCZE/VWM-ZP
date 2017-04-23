import env from './env'

const nodeEnv = env.NODE_ENV || 'development'

export default {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',

  host: env.HOST || '0.0.0.0',
  port: +env.PORT || 1337,
}
