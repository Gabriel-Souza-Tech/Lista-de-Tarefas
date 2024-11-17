async function listarTarefas() {
    try {
        const response = await fetch('https://lista-de-tarefas-j5k3.onrender.com//tarefas');
        const tarefas = await response.json();

        const listaTarefas = document.getElementById('lista-tarefas');
        listaTarefas.innerHTML = '';

        tarefas.forEach(tarefa => {
            const itemTarefa = document.createElement('li');
            itemTarefa.classList.add('custom-list-group-item');
            itemTarefa.classList.add('mb-1');
            itemTarefa.classList.add('d-flex');

            if(tarefa.custo >= 1000) {
                itemTarefa.style.backgroundColor = '#E48858';
            }


            itemTarefa.dataset.id = tarefa.id;
            itemTarefa.dataset.ordem = tarefa.ordem_apresentacao; 

            function inverterData(data) {
                const dataInvertida = data.split("-").reverse();
                return dataInvertida.join("-");
            }

            const dataLimiteInvertida = inverterData(tarefa.data_limite);

            itemTarefa.innerHTML = `
                <div class="d-flex w-100">
                    <span class="col-4 text-start">${tarefa.nome}</span>
                    <span class="col-4 text-center">R$ ${tarefa.custo}</span>
                    <span class="col-4 text-end">
                        ${dataLimiteInvertida}
                        <i class="ph-fill ph-note-pencil ms-2" data-id="${tarefa.id}" style="cursor: pointer;"></i>
                        <i class="ph-fill ph-trash ms-2" data-id="${tarefa.id}" style="cursor: pointer;"></i>
                    </span>
                </div>
            `;

            const noteIcon = itemTarefa.querySelector('.ph-note-pencil');
            noteIcon.addEventListener('click', () => editarTarefa(tarefa.id));

            const trashIcon = itemTarefa.querySelector('.ph-trash');
            trashIcon.addEventListener('click', () => excluirTarefa(tarefa.id));

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
        const responseValidacao = await fetch('https://lista-de-tarefas-j5k3.onrender.com//tarefas/validar-nome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({nome})
        });

        if (!responseValidacao.ok) {
            throw new Error('Já existe uma tarefa com esse nome.');
        }

        const response = await fetch('https://lista-de-tarefas-j5k3.onrender.com//tarefas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, custo, data_limite: dataLimite })
        });

        if (!response.ok) {
            throw new Error('Erro ao criar tarefa');
        }

        const modalElement = document.getElementById('criarTarefa');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        document.getElementById('form-tarefa').reset();

        listarTarefas();
    } catch (error) {
        console.log("Erro ao criar tarefa.", error);
        alert(error.message); 
    }
}

async function excluirTarefa(tarefaId) {
    const modal = new bootstrap.Modal(document.getElementById('excluirTarefaModal'));
    modal.show();

    document.getElementById('confirmarExclusao').addEventListener('click', async () => {
        try {
            const response = await fetch(`https://lista-de-tarefas-j5k3.onrender.com//tarefas/${tarefaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
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
        const response = await fetch(`https://lista-de-tarefas-j5k3.onrender.com//tarefas/${id}`);
        const tarefa = await response.json();

        document.getElementById('edit-nome-tarefa').value = tarefa.nome;
        document.getElementById('edit-custo-tarefa').value = tarefa.custo;
        document.getElementById('edit-data-limite').value = tarefa.data_limite;

        const editModal = new bootstrap.Modal(document.getElementById('editarTarefa'));
        editModal.show();

        document.getElementById('salvar-edicao').onclick = async () => {
            const novoNome = document.getElementById('edit-nome-tarefa').value;
            const novoCusto = document.getElementById('edit-custo-tarefa').value;
            const novaDataLimite = document.getElementById('edit-data-limite').value;

            try {
                const responseValidacao = await fetch('https://lista-de-tarefas-j5k3.onrender.com//tarefas/validar-nome', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome: novoNome })
                });

                if (!responseValidacao.ok) {
                    throw new Error('Já existe uma tarefa com esse nome.');
                }

                const responseAtualizacao = await fetch(`https://lista-de-tarefas-j5k3.onrender.com//tarefas/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome: novoNome, custo: novoCusto, data_limite: novaDataLimite })
                });

                if (responseAtualizacao.ok) {
                    listarTarefas();
                    editModal.hide();
                } else {
                    throw new Error('Erro ao editar tarefa');
                }
            } catch (error) {
                alert(error.message); 
            }
        };
    } catch (error) {
        console.error('Erro ao buscar dados da tarefa para edição:', error);
    }
}

function configurarDragAndDrop(item) {
    item.draggable = true; 
    item.addEventListener('dragstart', dragStart); 
    item.addEventListener('dragover', dragOver);
    item.addEventListener('drop', drop); 
    item.addEventListener('dragend', dragEnd); 
}

let dragSrcEl = null; 

function dragStart(e) {
    dragSrcEl = this; 
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
        const dragSrcOrder = dragSrcEl.dataset.ordem;
        const dropTargetOrder = this.dataset.ordem;

        dragSrcEl.dataset.ordem = dropTargetOrder;
        this.dataset.ordem = dragSrcOrder;

        dragSrcEl.innerHTML = this.innerHTML;
        this.innerHTML = e.dataTransfer.getData('text/html');

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
        await fetch(`https://lista-de-tarefas-j5k3.onrender.com//tarefas/atualizar-ordem/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem_apresentacao: parseInt(novaOrdem) })
        });
    } catch (error) {
        console.error(`Erro ao atualizar ordem da tarefa ${id}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', listarTarefas);
document.querySelector('#criarTarefa .modal-footer .modal-button').addEventListener('click', adicionarTarefa);

/* Oque falta   
    adicionar feedback ao realizar açoes de criar, excluir e editar tarefas.    
*/