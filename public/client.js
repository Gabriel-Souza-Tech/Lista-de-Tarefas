async function listarTarefas() {
    try {
        const response = await fetch('http://localhost:3000/tarefas');
        const tarefas = await response.json();

        const listaTarefas = document.getElementById('lista-tarefas');
        listaTarefas.innerHTML = ''; // Limpa a lista atual

        tarefas.forEach(tarefa => {
            const itemTarefa = document.createElement('li');
            itemTarefa.classList.add('list-group-item');
            itemTarefa.dataset.id = tarefa.id;
            itemTarefa.dataset.ordem = tarefa.ordem_apresentacao; // Atribui a ordem

            function inverterData(data) {
                const dataInvertida = data.split("-").reverse();
                return dataInvertida.join("-");
            }

            const dataLimiteInvertida = inverterData(tarefa.data_limite);

            itemTarefa.innerHTML = `
                ${tarefa.nome} - R$${tarefa.custo} - ${dataLimiteInvertida}
                <i class="ph-fill ph-note-pencil" data-id="${tarefa.id}" style="cursor: pointer;"></i>
                <i class="ph-fill ph-trash" data-id="${tarefa.id}" style="cursor: pointer;"></i>
            `;

            const noteIcon = itemTarefa.querySelector('.ph-note-pencil');
            noteIcon.addEventListener('click', () => editarTarefa(tarefa.id));

            const trashIcon = itemTarefa.querySelector('.ph-trash');
            trashIcon.addEventListener('click', () => excluirTarefa(tarefa.id));

            // Configurar Drag and Drop
            configurarDragAndDrop(itemTarefa);

            listaTarefas.appendChild(itemTarefa);
        });
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
    }
}
async function adicionarTarefa() {
    const nome = document.getElementById('nome-tarefa').value;
    const custo = document.getElementById('custo-tarefa').value;
    const dataLimite = document.getElementById('data-limite').value;

    try {
        const responseValidacao = await fetch('http://localhost:3000/tarefas/validar-nome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({nome})
        });

        if (!responseValidacao.ok) {
            throw new Error('Já existe uma tarefa com esse nome.');
        }

        const response = await fetch('http://localhost:3000/tarefas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, custo, data_limite: dataLimite })
        });

        if (!response.ok) {
            throw new Error('Erro ao criar tarefa');
        }

        // Fechar o modal e resetar o formulário após a criação da tarefa
        const modalElement = document.getElementById('criarTarefa');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        document.getElementById('form-tarefa').reset();

        listarTarefas();
    } catch (error) {
        console.log("Erro ao criar tarefa.", error);
        alert(error.message); // Exibe a mensagem de erro ao usuário
    }
}

async function excluirTarefa(tarefaId) {
    // Crie um modal Bootstrap para confirmar a exclusão
    const modal = new bootstrap.Modal(document.getElementById('excluirTarefaModal'));
    modal.show();

    // Adicione um evento de clique ao botão "Sim"
    document.getElementById('confirmarExclusao').addEventListener('click', async () => {
        try {
            const response = await fetch(`http://localhost:3000/tarefas/${tarefaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert("Tarefa excluída com sucesso!");
                listarTarefas();
                modal.hide();
            } else {
                console.error("Erro ao excluir tarefa", response.statusText);
            }
        } catch (error) {
            console.error("Erro ao excluir tarefa:", error);
        }
    });
}

async function editarTarefa(id) {
    try {
        // Buscar a tarefa atual para preencher o modal
        const response = await fetch(`http://localhost:3000/tarefas/${id}`);
        const tarefa = await response.json();
        // Preencher os campos do modal com os dados atuais da tarefa
        document.getElementById('edit-nome-tarefa').value = tarefa.nome;
        document.getElementById('edit-custo-tarefa').value = tarefa.custo;
        document.getElementById('edit-data-limite').value = tarefa.data_limite;

        const editModal = new bootstrap.Modal(document.getElementById('editarTarefa'));
        editModal.show();

        document.getElementById('salvar-edicao').onclick = async () => {
            const novoNome = document.getElementById('edit-nome-tarefa').value;
            const novoCusto = document.getElementById('edit-custo-tarefa').value;
            const novaDataLimite = document.getElementById('edit-data-limite').value;

            // Validação de nome único
            try {
                const responseValidacao = await fetch('http://localhost:3000/tarefas/validar-nome', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome: novoNome })
                });

                if (!responseValidacao.ok) {
                    throw new Error('Já existe uma tarefa com esse nome.');
                }

                // Se a validação for bem-sucedida, prosseguir com a atualização
                const responseAtualizacao = await fetch(`http://localhost:3000/tarefas/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome: novoNome, custo: novoCusto, data_limite: novaDataLimite })
                });

                if (responseAtualizacao.ok) {
                    alert('Tarefa editada com sucesso!');
                    listarTarefas();
                    editModal.hide();
                } else {
                    throw new Error('Erro ao editar tarefa');
                }
            } catch (error) {
                alert(error.message); // Mostra a mensagem de erro ao usuário
            }
        };
    } catch (error) {
        console.error('Erro ao buscar dados da tarefa para edição:', error);
    }
}

function configurarDragAndDrop(item) {
    item.draggable = true; // Permite arrastar o item
    item.addEventListener('dragstart', dragStart); // Quando começa a arrastar
    item.addEventListener('dragover', dragOver); // Quando arrasta sobre outro elemento
    item.addEventListener('drop', drop); // Quando solta
    item.addEventListener('dragend', dragEnd); // Quando termina de arrastar
}

let dragSrcEl = null; // Elemento sendo arrastado

function dragStart(e) {
    dragSrcEl = this; // Salva o elemento sendo arrastado
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function drop(e) {
    e.stopPropagation();

    if (dragSrcEl !== this) {
        // Troca o HTML dos elementos arrastados
        const dragSrcOrder = dragSrcEl.dataset.ordem;
        const dropTargetOrder = this.dataset.ordem;

        dragSrcEl.dataset.ordem = dropTargetOrder;
        this.dataset.ordem = dragSrcOrder;

        // Atualiza as tarefas visualmente
        dragSrcEl.innerHTML = this.innerHTML;
        this.innerHTML = e.dataTransfer.getData('text/html');

        // Atualiza a ordem no banco
        atualizarOrdemNoBanco(dragSrcEl.dataset.id, dropTargetOrder);
        atualizarOrdemNoBanco(this.dataset.id, dragSrcOrder);
    }
    return false;
}

function dragEnd() {
    this.classList.remove('dragging');
}

async function atualizarOrdemNoBanco(id, novaOrdem) {
    try {
        await fetch(`http://localhost:3000/tarefas/atualizar-ordem/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem_apresentacao: parseInt(novaOrdem) })
        });
    } catch (error) {
        console.error(`Erro ao atualizar ordem da tarefa ${id}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', listarTarefas);
document.querySelector('#criarTarefa .modal-footer .btn-primary').addEventListener('click', adicionarTarefa);

/* Oque falta   

    Cria o drag and drop
    adicionar iteraçao de mudança de cor quando o custo for >= 1000
    formatar o front com estilização
    
*/