
async function api(path, opts={}){
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type':'application/json', ...(opts.headers||{}) },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

function qs(sel){ return document.querySelector(sel); }
function el(tag, cls){ const e = document.createElement(tag); if (cls) e.className=cls; return e; }

const roleEl = qs('#role');
const loginView = qs('#loginView');
const mainView = qs('#mainView');
const ownerOnly = qs('#ownerOnly');
const ownerRequests = qs('#ownerRequests');
const requestsList = qs('#requestsList');

async function refreshMe(){
  try{
    const me = await api('/api/me');
    if (me.role){
      roleEl.textContent = me.role.toUpperCase();
      loginView.classList.remove('active');
      mainView.classList.add('active');
      const isOwner = me.role === 'owner';
      ownerOnly.style.display = isOwner ? 'block' : 'none';
      ownerRequests.style.display = isOwner ? 'block' : 'none';
      loadTree();
      if (isOwner) loadRequests();
    } else {
      loginView.classList.add('active');
      mainView.classList.remove('active');
    }
  } catch(e){
    loginView.classList.add('active');
    mainView.classList.remove('active');
  }
}

qs('#loginBtn').onclick = async () => {
  const role = qs('#roleSelect').value;
  const password = qs('#password').value;
  try{
    await api('/api/login', { method:'POST', body: JSON.stringify({ role, password }) });
    qs('#password').value='';
    refreshMe();
  }catch(e){ alert(e.message); }
};

qs('#logoutBtn').onclick = async () => {
  await api('/api/logout', {method:'POST'});
  refreshMe();
};

async function loadTree(){
  const data = await api('/api/bookmarks');
  const treeRoot = qs('#tree');
  treeRoot.innerHTML = '';
  if (!data.root) return;
  renderChildren(treeRoot, data.root.children || []);
}

function renderChildren(container, children){
  children.forEach(node=>{
    const row = el('div','node');
    const chip = el('span','chip');
    chip.textContent = node.type;
    const title = el('div','title'); title.textContent = node.title;
    row.appendChild(chip);
    row.appendChild(title);
    if (node.type === 'link'){
      const a = el('a','url'); a.href = node.url; a.textContent = node.url; a.target = '_blank';
      row.appendChild(a);
    }
    const right = el('div','right');
    if (ownerOnly.style.display === 'block'){
      const edit = el('button'); edit.textContent = 'Edit';
      edit.onclick = ()=> editNode(node);
      const del = el('button'); del.textContent = 'Delete';
      del.onclick = ()=> deleteNode(node.id);
      right.appendChild(edit); right.appendChild(del);
    }
    row.appendChild(right);
    container.appendChild(row);
    if (node.type==='folder' && node.children?.length){
      const kids = el('div','children');
      renderChildren(kids, node.children);
      container.appendChild(kids);
    }
  });
}

async function deleteNode(id){
  if (!confirm('Delete this item?')) return;
  try{
    await api(`/api/bookmarks/${id}`, { method:'DELETE' });
    loadTree();
  }catch(e){ alert(e.message); }
}

async function editNode(node){
  const title = prompt('Title', node.title);
  if (title === null) return;
  let body = { title };
  if (node.type==='link'){
    const url = prompt('URL', node.url || '');
    if (url === null) return;
    body.url = url;
  }
  try{
    await api(`/api/bookmarks/${node.id}`, { method:'PUT', body: JSON.stringify(body) });
    loadTree();
  }catch(e){ alert(e.message); }
}

qs('#addFolderBtn').onclick = async ()=>{
  const title = prompt('Folder name');
  if (!title) return;
  await api('/api/bookmarks', { method:'POST', body: JSON.stringify({ type:'folder', title })});
  loadTree();
};

qs('#addLinkBtn').onclick = async ()=>{
  const title = prompt('Link title');
  if (!title) return;
  const url = prompt('URL (https://...)');
  if (!url) return;
  await api('/api/bookmarks', { method:'POST', body: JSON.stringify({ type:'link', title, url })});
  loadTree();
};

qs('#exportBtn').onclick = async ()=>{
  const data = await api('/api/bookmarks');
  const blob = new Blob([JSON.stringify(data.root, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bookmarks.json';
  document.body.appendChild(a);
  a.click(); a.remove();
};

qs('#importFile').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  let json;
  try{ json = JSON.parse(text); } catch(e){ alert('Invalid JSON'); return; }
  if (confirm('This will overwrite existing bookmarks. Continue?')){
    await api('/api/bookmarks/import', { method:'POST', body: JSON.stringify({ root: json }) });
    loadTree();
  }
  e.target.value = '';
});

qs('#requestBtn').onclick = async ()=>{
  const message = qs('#requestMsg').value.trim();
  if (!message) return alert('Please enter a message');
  await api('/api/requests', { method:'POST', body: JSON.stringify({ message }) });
  qs('#requestMsg').value='';
  alert('Request sent!');
};

async function loadRequests(){
  const data = await api('/api/requests');
  requestsList.innerHTML = '';
  data.requests.forEach(r=>{
    const row = document.createElement('div');
    row.className = 'node';
    const title = document.createElement('div'); title.className='title';
    title.textContent = `[${r.status}] ${new Date(r.created_at).toLocaleString()} — ${r.message}`;
    row.appendChild(title);
    if (r.status === 'open'){
      const btn = document.createElement('button'); btn.textContent='Resolve';
      btn.onclick = async ()=>{
        await api(`/api/requests/${r.id}/resolve`, { method:'POST' });
        loadRequests();
      };
      row.appendChild(btn);
    }
    requestsList.appendChild(row);
  });
}

refreshMe();
