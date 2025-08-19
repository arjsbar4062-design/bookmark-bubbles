
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
const db = new Database('app.db');

db.prepare('DELETE FROM bookmarks').run();

function addFolder(title, parent_id=null, position=0){
  const id = nanoid();
  db.prepare('INSERT INTO bookmarks(id,parent_id,type,title,position) VALUES (?,?,?,?,?)')
    .run(id, parent_id, 'folder', title, position);
  return id;
}
function addLink(title, url, parent_id=null, position=0){
  const id = nanoid();
  db.prepare('INSERT INTO bookmarks(id,parent_id,type,title,url,position) VALUES (?,?,?,?,?,?)')
    .run(id, parent_id, 'link', title, url, position);
}

const docs = addFolder('Docs', null, 0);
addLink('MDN','https://developer.mozilla.org', docs, 0);
addLink('WHATWG','https://whatwg.org', docs, 1);

const tools = addFolder('Tools', null, 1);
addLink('GitHub','https://github.com', tools, 0);
addLink('Stack Overflow','https://stackoverflow.com', tools, 1);

console.log('Seeded demo bookmarks');
