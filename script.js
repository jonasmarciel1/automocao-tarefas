// ====== Elementos ======
const els = {
  input: document.getElementById('novaTarefa'),
  add: document.getElementById('adicionarTarefa'),
  clear: document.getElementById('limparTarefas'),
  theme: document.getElementById('alternarTema'),
  list: document.getElementById('listaTarefas'),
  filters: document.getElementById('filtros'),
  counter: document.getElementById('contadorTarefas'),
  root: document.documentElement
};

// ====== Estado ======
const STORAGE_KEY = 'todo/tasks';
const FILTER_KEY = 'todo/filter';
const THEME_KEY = 'theme'; // 'light' | 'dark' | 'auto'
let tasks = [];
let filter = localStorage.getItem(FILTER_KEY) || 'todas';

// ====== Constantes ======
const PRIORITIES = ['low', 'medium', 'high'];

// ====== Util ======
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
const byFilter = t => filter === 'todas' ? true : filter === 'pendentes' ? !t.done : t.done;
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const load = () => { tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); };
const setFilter = f => {
  filter = f;
  localStorage.setItem(FILTER_KEY, f);
  // Atualiza UI dos chips
  els.filters.querySelectorAll('button[data-filtro]').forEach(btn => {
    const active = btn.dataset.filtro === f;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  render();
};

function summarize() {
  const total = tasks.length;
  const concl = tasks.filter(t => t.done).length;
  const pend = total - concl;
  els.counter.textContent = `Total: ${total} | Concluídas: ${concl} | Pendentes: ${pend}`;
}

// Escapa HTML para evitar XSS em innerHTML
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ====== Render ======
function render() {
  els.list.innerHTML = '';
  const frag = document.createDocumentFragment();
  tasks.filter(byFilter).forEach(task => {
    // li
    const li = document.createElement('li');
    li.className = `task${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;
    li.dataset.priority = task.priority;
    li.draggable = true;

    // checkbox
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.done;
    check.setAttribute('aria-label', `Concluir tarefa: ${task.text}`);
    check.addEventListener('change', () => toggleDone(task.id));

    // texto (editável por duplo clique)
    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = task.text;
    span.title = 'Duplo clique para editar';
    span.addEventListener('dblclick', () => startEdit(task.id, span));
    span.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(task.id, span); }
    });
    span.addEventListener('blur', () => finishEdit(task.id, span));

    // botão de prioridade
    const priorityBtn = document.createElement('button');
    priorityBtn.className = 'priority-btn';
    priorityBtn.classList.add(`p-${task.priority}`);
    priorityBtn.title = `Prioridade: ${task.priority}. Clique para alterar.`;
    priorityBtn.setAttribute('aria-label', `Alterar prioridade da tarefa: ${task.text}`);
    priorityBtn.addEventListener('click', () => cyclePriority(task.id));

    // delete
    const del = document.createElement('button');
    del.className = 'del';
    del.setAttribute('aria-label', `Excluir tarefa: ${task.text}`);
    del.textContent = 'Excluir';
    del.addEventListener('click', () => removeTask(task.id));

    li.append(check, span, priorityBtn, del);
    frag.appendChild(li);
  });
  els.list.appendChild(frag);
  summarize();
}

function startEdit(id, span) {
  span.contentEditable = 'true';
  span.focus();
  // Move cursor ao final
  const range = document.createRange();
  range.selectNodeContents(span);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  span.dataset.old = span.textContent;
}
function cancelEdit(id, span) {
  span.contentEditable = 'false';
  span.textContent = span.dataset.old || span.textContent;
  delete span.dataset.old;
}
function finishEdit(id, span) {
  span.contentEditable = 'false';
  const newText = span.textContent.trim();
  if (!newText) {
    removeTask(id);
    return;
  }
  const t = tasks.find(t => t.id === id);
  if (t && t.text !== newText) {
    t.text = newText;
    save();
    render();
  } else {
    delete span.dataset.old;
  }
}

// ====== Ações ======
function addTask() {
  const text = els.input.value.trim();
  if (!text) return;
  tasks.unshift({
    id: uid(),
    text,
    done: false,
    createdAt: Date.now(),
    priority: 'medium'
  });
  els.input.value = '';
  save();
  render();
}

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  save();
  render();
}

function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function clearAll() {
  if (!tasks.length) return;
  const ok = confirm('Tem certeza que deseja limpar TODAS as tarefas?');
  if (!ok) return;
  tasks = [];
  save();
  render();
}

function cyclePriority(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const currentIndex = PRIORITIES.indexOf(task.priority || 'medium');
    const nextIndex = (currentIndex + 1) % PRIORITIES.length;
    task.priority = PRIORITIES[nextIndex];
    save();
    render();
}

// ====== Tema ======
function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
  const label = mode === 'light' ? 'Tema: claro'
          : mode === 'dark'  ? 'Tema: escuro'
          : 'Tema: automático';
  els.theme.setAttribute('aria-label', `Alternar tema (${label})`);
  els.theme.title = `Clique para alternar — ${label}`;
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  applyTheme(stored ?? 'auto');
}

function cycleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'auto';
  const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
  applyTheme(next);
}

// ====== Eventos ======
els.add.addEventListener('click', addTask);
els.input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});
els.clear.addEventListener('click', clearAll);

els.filters.addEventListener('click', e => {
  const btn = e.target.closest('button[data-filtro]');
  if (!btn) return;
  setFilter(btn.dataset.filtro);
});

els.theme.addEventListener('click', cycleTheme);

// ====== Eventos Drag and Drop ======
let draggedItemId = null;

els.list.addEventListener('dragstart', e => {
    const li = e.target.closest('li.task');
    if (!li) return;
    draggedItemId = li.dataset.id;
    setTimeout(() => li.style.opacity = '0.5', 0);
});

els.list.addEventListener('dragover', e => {
    e.preventDefault();
    const li = e.target.closest('li.task');
    if (!li || li.dataset.id === draggedItemId) return;
    
    const rect = li.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    const draggedElement = els.list.querySelector(`[data-id="${draggedItemId}"]`);

    if (draggedElement) {
        if (isAfter) {
            li.after(draggedElement);
        } else {
            li.before(draggedElement);
        }
    }
});

els.list.addEventListener('dragend', e => {
    const li = e.target.closest(`[data-id="${draggedItemId}"]`);
    if (li) {
        li.style.opacity = '1';
    }
    draggedItemId = null;
});

els.list.addEventListener('drop', e => {
    e.preventDefault();
    if (draggedItemId) {
        const newOrderIds = [...els.list.querySelectorAll('li.task')].map(li => li.dataset.id);
        tasks.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
        save();
    }
});

// ====== Init ======
(function init() {
  load();
  initTheme();
  setFilter(filter);
})();

// ====== Lógica do Modal de Ajuda ======
const helpBtn = document.getElementById('helpBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const modal = document.getElementById('modalAjuda');

function openModal() {
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

helpBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Fecha o modal se clicar fora dele
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});