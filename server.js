import http from 'http';
import app from './app.js';

const port = process.env.PORT || 3000;

http.createServer(app).listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
