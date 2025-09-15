
const listaTarefas = document.getElementById('listaTarefas');
const inputTarefa = document.getElementById('novaTarefa');

// Carregar tarefas salvas
window.addEventListener('load', () => {
  const tarefasSalvas = JSON.parse(localStorage.getItem('tarefas')) || [];
  tarefasSalvas.forEach(tarefa => {
    adicionarTarefaNaLista(tarefa.texto, tarefa.concluida);
  });
  atualizarContador();
});

// Adicionar nova tarefa
document.getElementById('adicionarTarefa').addEventListener('click', () => {
  const texto = inputTarefa.value.trim();
  if (texto !== '') {
    adicionarTarefaNaLista(texto, false);
    inputTarefa.value = '';
    salvarTarefas();
    atualizarContador();
  }
});

// Limpar todas as tarefas
document.getElementById('limparTarefas').addEventListener('click', () => {
  listaTarefas.innerHTML = '';
  localStorage.removeItem('tarefas');
  atualizarContador();
});

// Alternar tema
document.getElementById('alternarTema').addEventListener('click', () => {
  const body = document.body;
  body.classList.toggle('claro');
  body.classList.toggle('escuro');
});

// Função para adicionar tarefa na lista
function adicionarTarefaNaLista(texto, concluida) {
  const li = document.createElement('li');
  li.textContent = texto;
  if (concluida) li.classList.add('concluida');

  li.addEventListener('click', () => {
    li.classList.toggle('concluida');
    salvarTarefas();
    atualizarContador();
  });

  listaTarefas.appendChild(li);
}

// Função para salvar tarefas no localStorage
function salvarTarefas() {
  const tarefas = [];
  listaTarefas.querySelectorAll('li').forEach(li => {
    tarefas.push({
      texto: li.textContent,
      concluida: li.classList.contains('concluida')
    });
  });
  localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

// Função para atualizar o contador de tarefas
function atualizarContador() {
  const todas = listaTarefas.querySelectorAll('li');
  const concluidas = listaTarefas.querySelectorAll('li.concluida');
  const pendentes = todas.length - concluidas.length;

  document.getElementById('contadorTarefas').textContent =
    `Total: ${todas.length} | Concluídas: ${concluidas.length} | Pendentes: ${pendentes}`;
}

document.querySelectorAll('#filtros button').forEach(botao => {
  botao.addEventListener('click', () => {
    const filtro = botao.getAttribute('data-filtro');
    filtrarTarefas(filtro);
  });
});
// Função para filtrar tarefas
function filtrarTarefas(filtro) {
  const tarefas = listaTarefas.querySelectorAll('li');

  tarefas.forEach(tarefa => {
    switch (filtro) {
      case 'todas':
        tarefa.style.display = 'list-item';
        break;
      case 'pendentes':
        tarefa.style.display = tarefa.classList.contains('concluida') ? 'none' : 'list-item';
        break;
      case 'concluidas':
        tarefa.style.display = tarefa.classList.contains('concluida') ? 'list-item' : 'none';
        break;
    }
  });
}
