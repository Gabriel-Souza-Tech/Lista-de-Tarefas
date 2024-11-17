import express from 'express';
import cors from 'cors';

import {criarEPopularTabelaTarefas, incluirTarefas, buscarTarefasPorId, buscarTarefasPorNome, listarTarefas, editarTarefas, excluirTarefas, atualizarOrdemTarefas} from './database.js';

const app = express();
app.use(cors());
app.use(express.json());


//  - Rota para listar tarefas(GET)
app.get('/tarefas', async (req, res) => {
    try {
        const tarefas = await listarTarefas(); 
        if (tarefas) {
            res.json(tarefas);
        } else {
            res.status(500).send('Erro ao buscar tarefas');
        }
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).send('Erro ao buscar tarefas');
    }
});

//  - Rota para buscar tarefa por Id(GET)
app.get('/tarefas/:id', async (req, res) => {
    try {
        const tarefa = await buscarTarefasPorId(req.params.id); 
        if (tarefa) {
            res.json(tarefa);
        } else {
            res.status(404).json({ error: "Tarefa não encontrada" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

//  -  Rota para criar uma tarefa
app.post('/tarefas', async (req, res) => {
    try {
        const { nome, custo, data_limite } = req.body;

        if (!nome || typeof nome !== "string") {
            return res.status(400).json({ error: "Nome é obrigatório e deve ser uma string." });
        }
        if (isNaN(custo) || custo < 0) {
            return res.status(400).json({ error: "Custo deve ser um número positivo." });
        }

        await incluirTarefas(nome, custo, data_limite);
        res.status(201).json({ message: "Tarefa criada com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar a tarefa." });
    }
});

//  -  Rota para deletar uma tarefa
app.delete('/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await excluirTarefas(id);

        if (resultado) {
            res.status(200).json({ message: "Tarefa excluída com sucesso!" });
        } else {
            res.status(404).json({ message: "Tarefa não encontrada ou já excluída." });
        }
    } catch (error) {
        console.error("Erro ao excluir tarefa:", error);
        res.status(500).json({ error: "Erro ao excluir tarefa" });
    }
});

//  -  Rota para atualizar uma tarefa
app.put('/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, custo, data_limite } = req.body;

        if (!nome || typeof nome !== "string") {
            return res.status(400).json({ error: "Nome é obrigatório e deve ser uma string." });
        }
        if (isNaN(custo) || custo < 0) {
            return res.status(400).json({ error: "Custo deve ser um número positivo." });
        }
        if (!data_limite || isNaN(Date.parse(data_limite))) {
            return res.status(400).json({ error: "Data limite deve ser uma data válida." });
        }

        const resultado = await editarTarefas(id, nome, custo, data_limite);

        if (resultado) {
            res.status(200).json({ message: "Tarefa atualizada com sucesso!" });
        } else {
            res.status(404).json({ message: "Tarefa não encontrada ou não foi possível atualizar." });
        }
    } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
        res.status(500).json({ error: "Erro ao atualizar tarefa" });
    }
});

//  -  Rota para atualizar a ordem de apresentaçao do drag and drop
app.put('/tarefas/atualizar-ordem/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ordem_apresentacao } = req.body;

        if (!Number.isInteger(ordem_apresentacao) || ordem_apresentacao <= 0) {
            return res.status(400).json({ error: "A nova ordem deve ser um número inteiro positivo." });
        }

        const resultado = await atualizarOrdemTarefas(id, ordem_apresentacao);

        if (resultado) {
            res.status(200).json({ message: "Ordem da tarefa atualizada com sucesso!" });
        } else {
            res.status(404).json({ message: "Tarefa não encontrada ou não foi possível atualizar." });
        }
    } catch (error) {
        console.error("Erro ao atualizar ordem_apresentacao:", error);
        res.status(500).json({ error: "Ocorreu um erro inesperado ao atualizar a tarefa." });
    }
});

//  -  Validar tarefa pelo nome
app.post('/tarefas/validar-nome', async (req, res) => {
    try {
        const { nome } = req.body;
        const tarefaExistente = await buscarTarefasPorNome(nome); 

        if (tarefaExistente) {
            return res.status(400).json({ error: 'Já existe uma tarefa com esse nome.' });
        }

        res.status(200).json({ message: 'Nome disponível' });
    } catch (error) {
        console.error('Erro ao validar nome da tarefa:', error);
        res.status(500).json({ error: 'Erro ao validar nome' });
    }
});

app.get('/', (req, res) => {
    res.send('Servidor está funcionando corretamente!');
});

export default app;