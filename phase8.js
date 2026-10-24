/* Phase 8 — search, favourites, tags, and metadata discovery. */
'use strict';
const sv8 = {term:'',genre:'',kind:'',flag:'all',sort:'recent',tag:''};
function sv8Tags(song){return Array.isArray(song?.tags)?song.tags.filter(t=>typeof t==='string'):[];}
function sv8TagList(raw){return [...new Set(String(raw||'').split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.slice(0,36)))].slice(0,15);}
const sv8EditorBase=songEditor;
songEditor=function(id=null,kind='song'){
 sv8EditorBase(id,kind);const s=state.songs.find(s=>s.id===id),fields=document.querySelector('#songForm .fields');if(!fields)return;
 fields.insertAdjacentHTML('beforeend',`<div class="field full"><label for="sv8Tags">Search tags (comma-separated)</label><input id="sv8Tags" maxlength="500" placeholder="night drive, synthwave, demo, 2026" value="${escapeHTML(sv8Tags(s).join(', '))}"><small>Independent of the Mood field. Tags work in Discover and stay in backups.</small></div>`);
};
const sv8FieldsBase=fieldsFromEditor;
fieldsFromEditor=function(){const data=sv8FieldsBase();if(document.getElementById('sv8Tags'))data.tags=sv8TagList(document.getElementById('sv8Tags').value);return data;};
const sv8CardBase=songCard;
songCard=function(s){const html=sv8CardBase(s);return html.replace(/(<div class="songactions">)/,`$1<button class="btn small sv8-fav ${s.favorite?'sv8-isfav':''}" data-action="sv8-fav" data-id="${escapeHTML(s.id)}" title="${s.favorite?'Remove favourite':'Add favourite'}" aria-label="${s.favorite?'Remove favourite':'Add favourite'}">${s.favorite?'★':'☆'}</button>`);};
const sv8Text=(s)=>[s.title,s.artist,s.genre,s.subgenre,s.mood,s.style,s.voice,s.notes,s.lyrics,s.model,s.script,s.tone,s.backingMusic,albumName(s.albumId),...sv8Tags(s),...(s.versions||[]).flatMap(v=>[v.label,v.notes,v.fileName])].filter(Boolean).join(' ').toLowerCase();
function sv8Results(){const q=sv8.term.trim().toLowerCase(),words=q.split(/\s+/).filter(Boolean);
 let found=state.songs.filter(s=>words.every(w=>sv8Text(s).includes(w)) && (!sv8.genre||s.genre===sv8.genre) && (!sv8.kind||s.kind===sv8.kind) && (sv8.flag==='all'||(sv8.flag==='fave'&&s.favorite)||(sv8.flag==='audio'&&s.versions?.some(v=>v.fileName))||(sv8.flag==='draft'&&s.status==='draft')) && (!sv8.tag||sv8Tags(s).includes(sv8.tag)));
 found.sort((a,b)=>sv8.sort==='az'?(a.title||'').localeCompare(b.title||''):sv8.sort==='artist'?(a.artist||'').localeCompare(b.artist||''):sv8.sort==='oldest'?(a.createdAt||'').localeCompare(b.createdAt||''):(b.updatedAt||'').localeCompare(a.updatedAt||''));return found;
}
const sv8Select=(key,current,items,empty)=>`<label>${empty}<select id="sv8-${key}"><option value="">All</option>${items.map(x=>`<option value="${escapeHTML(x)}" ${current===x?'selected':''}>${escapeHTML(x)}</option>`).join('')}</select></label>`;
function sv8Discover(){const songs=sv8Results(),genres=[...new Set(state.songs.map(s=>s.genre).filter(Boolean))].sort(),tags=[...new Set(state.songs.flatMap(s=>sv8Tags(s)))].sort();
 return `${head('PHASE 8','Discover your music','Search song titles, lyrics, production notes, genres, albums, tags, and version names.')}
 <section class="sv8-filters"><label class="sv8-search">Search entire catalog<input id="sv8-q" type="search" placeholder="Try a lyric, mood, artist or song title…" value="${escapeHTML(sv8.term)}" autocomplete="off"></label><div class="sv8-selects">${sv8Select('genre',sv8.genre,genres,'Genre')}${sv8Select('tag',sv8.tag,tags,'Tag')}
 <label>Type<select id="sv8-kind"><option value="">All</option><option value="song" ${sv8.kind==='song'?'selected':''}>Songs</option><option value="speech" ${sv8.kind==='speech'?'selected':''}>Speech</option></select></label>
 <label>Show<select id="sv8-flag"><option value="all" ${sv8.flag==='all'?'selected':''}>All tracks</option><option value="fave" ${sv8.flag==='fave'?'selected':''}>★ Favorites</option><option value="audio" ${sv8.flag==='audio'?'selected':''}>With audio</option><option value="draft" ${sv8.flag==='draft'?'selected':''}>Drafts</option></select></label>
 <label>Sort<select id="sv8-sort"><option value="recent" ${sv8.sort==='recent'?'selected':''}>Recently changed</option><option value="az" ${sv8.sort==='az'?'selected':''}>Title A–Z</option><option value="artist" ${sv8.sort==='artist'?'selected':''}>Artist A–Z</option><option value="oldest" ${sv8.sort==='oldest'?'selected':''}>Oldest first</option></select></label></div><div class="inlinebuttons"><button class="btn small minor" data-action="sv8-clear">Clear filters</button><span class="pill" id="sv8-result-count">${songs.length} results</span></div></section>
 <div class="songlist" id="sv8-result-list">${songs.slice(0,200).map(songCard).join('')||'<div class="empty"><h3>No matches</h3><p>Try fewer search words or clear a filter.</p></div>'}</div>${songs.length>200?'<p class="smallprint">Showing 200 matches. Narrow filters to see more.</p>':''}`;
}
const sv8NavBase=renderNav;renderNav=function(){sv8NavBase();document.getElementById('desktopNav')?.insertAdjacentHTML('beforeend',`<button class="navbtn ${state.view==='discover'?'active':''}" data-action="view" data-view="discover"><span class="navico">⌕</span>Discover</button>`);document.getElementById('mobileNav')?.insertAdjacentHTML('beforeend',`<button class="${state.view==='discover'?'active':''}" data-action="view" data-view="discover"><b>⌕</b>Discover</button>`);};
const sv8RenderBase=render;render=function(){sv8RenderBase();if(state.view==='discover')document.getElementById('content').innerHTML=sv8Discover();};
function sv8RepaintResults(){if(state.view!=='discover')return;const area=document.getElementById('sv8-result-list');if(!area)return;const songs=sv8Results();area.innerHTML=songs.slice(0,200).map(songCard).join('')||'<div class="empty"><h3>No matches</h3><p>Try fewer search words or clear a filter.</p></div>';const n=document.getElementById('sv8-result-count');if(n)n.textContent=songs.length+' results';}
document.addEventListener('input',e=>{if(e.target?.id==='sv8-q'){sv8.term=e.target.value;sv8RepaintResults();}},true);
document.addEventListener('change',e=>{const id=e.target?.id;if(['sv8-genre','sv8-kind','sv8-flag','sv8-sort','sv8-tag'].includes(id)){sv8[id.slice(4)]=e.target.value;sv8RepaintResults();}},true);
const sv8Actions=new Set(['sv8-clear','sv8-fav']);
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||!sv8Actions.has(el.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();
 try{if(el.dataset.action==='sv8-clear'){Object.assign(sv8,{term:'',genre:'',kind:'',flag:'all',tag:'',sort:'recent'});render();}
 else{const song=state.songs.find(s=>s.id===el.dataset.id);if(!song)return;song.favorite=!song.favorite;song.updatedAt=now();await storePut('songs',song);render();toast(song.favorite?'Added to favorites.':'Removed from favorites.');}}
 catch(err){console.error(err);toast('Discovery error: '+err.message)}
},true);