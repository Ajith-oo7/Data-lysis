export const productionConfig = {
  port: process.env.PORT || 5000,
  cors: {
    origin: 'https://ajith-anna.cloud',
    credentials: true
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    cookie: {
      secure: true,
      domain: 'ajith-anna.cloud',
      sameSite: 'none' as const
    }
  },
  websocket: {
    path: '/ws',
    pingInterval: 30000,
    pingTimeout: 5000
  }
}; 