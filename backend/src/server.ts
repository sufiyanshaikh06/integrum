import { env } from './config/env.js';
import app from './app.js';

const startServer = () => {
  const PORT = env.PORT || 5000;
  
  app.listen(PORT, () => {
    console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
