import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function criarEPopularTabelaTarefas() {
    const db = await open({
        filename: './Tarefas.db', 
        driver: sqlite3.Database,
    });

    await db.run(
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY,
            nome TEXT,
            custo REAL,
            data_limite TEXT,
            ordem_apresentacao INTERGER UNIQUE
        )`
    );

    await db.close();
}

criarEPopularTabelaTarefas().then(() => {
    console.log("Tabela Tarefas criada com sucesso!");
}).catch(error => {
    console.error("Erro ao criar a tabela Tarefas:", error);
});