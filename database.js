import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function criarEPopularTabelaTarefas() {
    const db = await open({
        filename: './Tarefas.db', 
        driver: sqlite3.Database,
    });

    await db.run(
        `CREATE TABLE IF NOT EXISTS tarefas (
            id INTEGER PRIMARY KEY,
            nome TEXT,
            custo REAL,
            data_limite TEXT,
            ordem_apresentacao INTEGER UNIQUE
        )`
    );
    await db.close();
}

export async function incluirTarefas(nome, custo, data_limite) {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
    });

    try {
        const result = await db.get(`SELECT MAX(ordem_apresentacao) as maxOrder FROM tarefas`);
        const novaOrdem = (result?.maxOrder !== null && result?.maxOrder !== undefined) ? result.maxOrder + 1 : 1;    

        await db.run(
            `INSERT INTO tarefas (nome, custo, data_limite, ordem_apresentacao) VALUES (?, ?, ?, ?)`,
            [nome, custo, data_limite, novaOrdem]
        );
    } catch (error) {
        console.error("Erro ao inserir tarefa:", error);
    } finally {
        await db.close();
    }
}

export async function buscarTarefasPorId(id) {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
    });

    try {
        const tarefa = await db.get('SELECT * FROM tarefas WHERE id = ?', [id]);
        return tarefa;
      } catch (error) {
        console.error('Erro ao buscar tarefa:', error);
            return null;
      } finally {
            await db.close();
      }

}

export async function buscarTarefasPorNome(nome) {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
    });
    try {
        const resultado = await db.get('SELECT * FROM tarefas WHERE nome = ?', [nome]);
        return resultado;
    } catch (error) {
        console.error('Erro ao buscar tarefa:', error);
            return null;
    } finally {
        await db.close();
    }
    
}

export async function listarTarefas() {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
    });

    try {
        const tarefa = await db.all('SELECT id, nome, custo, data_limite, ordem_apresentacao FROM tarefas ORDER BY ordem_apresentacao ASC');
        return tarefa;
      } catch (error) {
            console.error('Erro ao listar tarefa:', error);
            return null;
      } finally {
            await db.close();
      }
}

export async function editarTarefas(id, nome, custo, data_limite) {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
    });

    try {
        // Verifique se já existe uma tarefa com o mesmo nome e id
        const nomeExistente = await db.get('SELECT id, nome FROM tarefas WHERE nome = ? AND id = ?', [id, nome]);

        if (nomeExistente) {
            console.log("Já existe uma tarefa com esse mesmo nome!");
            return false;
        }

        const tarefa = await db.run(
            'UPDATE tarefas SET nome = ?, custo = ?, data_limite = ? WHERE id = ?', 
            [nome, custo, data_limite, id]
        );

        if (tarefa.changes) {
            console.log(`Tarefa com id ${id} foi atualizada com sucesso.`);
            return true;
        } else {
            console.log(`Nenhuma tarefa encontrada com id ${id}.`);
            return false;
        }

    } catch (error) {
        console.error('Erro ao editar tarefa:', error);
        return null;
    } finally {
        await db.close();
    }
}

export async function excluirTarefas(id) {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
    });

    try {
        const tarefa = await db.get('SELECT * FROM tarefas WHERE id = ?', [id]);
        if (!tarefa) {
            console.log(`Nenhuma tarefa encontrada com id ${id}.`);
            return false;
        }

        const resultado = await db.run('DELETE FROM tarefas WHERE id = ?', [id]);
        if (resultado.changes) {
            console.log(`Tarefa com id ${id} foi excluída com sucesso.`);
            return true;
        } else {
            console.log(`Erro ao tentar excluir a tarefa com id ${id}.`);
            return false;
        }
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        return null;
    } finally {
        await db.close();
    }
}

export async function atualizarOrdemTarefas(id, novaOrdem) {
    const db = await open({
        filename: './Tarefas.db',
        driver: sqlite3.Database,
        busyTimeout: 3000,
    });

    try {
        // Inicia uma transação
        await db.run('BEGIN TRANSACTION');

        // Obtém a ordem atual da tarefa
        const tarefaAtual = await db.get('SELECT ordem_apresentacao FROM tarefas WHERE id = ?', [id]);
        if (!tarefaAtual) {
            throw new Error(`Tarefa com id ${id} não encontrada.`);
        }

        const ordemAtual = tarefaAtual.ordem_apresentacao;

        // Define um valor temporário para a tarefa a ser movida
        const ordemTemporaria = -1; // Um valor fora do intervalo válido

        await db.run('UPDATE tarefas SET ordem_apresentacao = ? WHERE id = ?', [ordemTemporaria, id]);

        // Ajusta as ordens das outras tarefas
        if (novaOrdem > ordemAtual) {
            // Move para baixo
            await db.run(
                'UPDATE tarefas SET ordem_apresentacao = ordem_apresentacao - 1 WHERE ordem_apresentacao > ? AND ordem_apresentacao <= ?',
                [ordemAtual, novaOrdem]
            );
        } else if (novaOrdem < ordemAtual) {
            // Move para cima
            await db.run(
                'UPDATE tarefas SET ordem_apresentacao = ordem_apresentacao + 1 WHERE ordem_apresentacao >= ? AND ordem_apresentacao < ?',
                [novaOrdem, ordemAtual]
            );
        }

        // Define a nova ordem para a tarefa
        await db.run('UPDATE tarefas SET ordem_apresentacao = ? WHERE id = ?', [novaOrdem, id]);

        // Confirma a transação
        await db.run('COMMIT');

        return true;
    } catch (error) {
        console.error('Erro ao atualizar a ordem de apresentação:', error);

        // Reverte a transação em caso de erro
        await db.run('ROLLBACK');
        return false;
    } finally {
        await db.close();
    }
}

