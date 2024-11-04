import express from 'express';
import criarEPopularTabelaTarefas from './database.js';

const app = express();

app.use(express.json());

export default app;