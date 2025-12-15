import 'dotenv/config';
import { app, database } from './app';

const port = process.env.PORT || 5000;

// Initialize and start server
async function start() {
  try {
    await database.initialize();
    console.log('Database initialized');

    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await database.close();
  process.exit(0);
});

start();
