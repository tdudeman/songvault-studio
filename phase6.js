/* SongVault Phase 6 — review-first bulk import and metadata organization.
   File contents never leave the user's browser. No external calls or audio AI claims. */
(()=>{
'use strict';
const MAX_FILES=500, PAGE_SIZE=25;
const SUPPORTED=/\.(mp3|wav|m4a|flac|ogg|oga|opus|aac|aiff|aif|webm)$/i;
const CATALOG=[
 {sub:'Synth-Pop',genre:'Electronic',test:/\bsynth[ -]?pop\b/i},
 {sub:'Synthwave',genre:'Electronic',test:/\b(synthwave|retrowave|outrun)\b/i},
 {sub:'Darkwave',genre:'Electronic',test:/\bdarkwave\b/i},
 {sub:'Drum & Bass',genre:'Electronic',test:/\b(drum[ -]?(?:and|&|n)[ -]?bass|dnb)\b/i},
 {sub:'House',genre:'Electronic',test:/\b(deep house|house music|progressive house|electro house|house)\b/i},
 {sub:'Trance',genre:'Electronic',test:/\btrance\b/i},
 {sub:'EDM',genre:'Electronic',test:/\b(edm|electronic dance)\b/i},
 {sub:'Electropop',genre:'Electronic',test:/\belectro[ -]?pop\b/i},
 {sub:'Ambient',genre:'Ambient',test:/\bambient\b/i},
 {sub:'K-Pop',genre:'K-Pop',test:/\bk[ -]?pop\b/i},
 {sub:'J-Pop',genre:'Pop',test:/\bj[ -]?pop\b/i},
 {sub:'Swing',genre:'Jazz',test:/\bswing\b/i},
 {sub:'Jazz',genre:'Jazz',test:/\bjazz\b/i},
 {sub:'Orchestral',genre:'Orchestral',test:/\b(orchestral|symphonic|symphony)\b/i},
 {sub:'Film Score',genre:'Cinematic',test:/\b(film score|soundtrack|cinematic)\b/i},
 {sub:'Metal',genre:'Metal',test:/\bmetal\b/i},
 {sub:'Rock',genre:'Rock',test:/\brock\b/i},
 {sub:'Country',genre:'Country',test:/\bcountry\b/i},
 {sub:'Blues',genre:'Blues',test:/\bblues\b/i},
 {sub:'Hip-Hop',genre:'Hip-Hop',test:/\b(hip[ -]?hop|trap|boom bap)\b/i},
 {sub:'R&B',genre:'R&B / Soul',test:/\b(r[& ]?b|soul)\b/i},
 {sub:'Folk',genre:'Folk',test:/\bfolk\b/i},
 {sub:'Latin',genre:'Latin',test:/\b(latin|reggaeton|salsa|bachata)\b/i},
 {sub:'Pop',genre:'Pop',test:/\bpop\b/i}
];
const esc=escapeHTML;
const st={items:[],page:0,busy:false,organize:[],reviewOpen:false,lastReport:''};
const N=id=>document.getElementById(id);
const fnameBase=n=>String(n||'').replace(/\.[^./\\]+$/,'');
const cleanText=t=>String(t||'').replace(/^\s*\d{1,3}[.\s_-]+/,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
const parseName=name=>{let n=cleanText(fnameBase(name));n=n.replace(/\s*\((?:final|mastered|remaster(?:ed)?|v\d+|audio)\)\s*$/i,'').trim();
 const p=n.match(/^(.{2,90}?)\s+[–—-]\s+(.{2,150})$/);return p?{artist:p[1].trim(),title:p[2].trim()}:{artist:'',title:n||'Imported track'};};
function suggest(text){const s=String(text||'');const hits=CATALOG.filter(r=>r.test.test(s));if(!hits.length)return null;const first=hits[0];const different=hits.some(r=>r.genre!==first.genre);return different?null:{genre:first.genre,subgenre:first.sub,source:'text'};}
function byFolder(file){const path=String(file.webkitRelativePath||'');const seg=path.split('/').filter(Boolean);return seg.length>1?seg.slice(0,-1):[];}
function fileSuggestion(file){const folders=byFolder(file);const candidate=folders.slice(1).reverse().find(x=>suggest(x))||folders.slice().reverse().find(x=>suggest(x));return candidate?suggest(candidate):null;}
function existingFingerprint(s,v){return `${(v.fileName||'').toLowerCase()}|${v.fileSize??v.size??''}`;}
function probableDuplicates(file){const lower=file.name.toLowerCase();const out=[];for(const song of state.songs)for(const v of song.versions||[]){if((v.fileName||'').toLowerCase()!==lower)continue;
 const sz=v.fileSize??v.size; if(sz!=null&&Number(sz)!==file.size)continue;out.push({song,version:v,uncertain:sz==null});}return out;}
function sameSelection(file,idx,arr){return arr.findIndex((r,i)=>i<idx && r.file.name.toLowerCase()===file.name.toLowerCase()&&r.file.size===file.size)>=0;}
function rowFor(file){const meta=parseName(file.name);const folders=byFolder(file);const sug=fileSuggestion(file);
 const folder=folders.length>1?folders[folders.length-1]:'';
 const album=state.albums.find(a=>a.title.toLowerCase()===folder.toLowerCase());
 return {file,title:meta.title,artist:meta.artist,genre:sug?.genre||album?.genre||'',subgenre:sug?.subgenre||album?.subgenre||'',albumId:album?.id||'',folderAlbum:folder,enabled:true,duplicate:false,duplicateText:'',suggestion:sug?'Folder label':'',hash:'',done:false};}
function setDuplicates(){st.items.forEach((r,i)=>{const matches=probableDuplicates(r.file);const repeated=sameSelection(r.file,i,st.items);r.duplicate=!!matches.length||repeated;r.duplicateText=repeated?'Repeated in selected files':matches.length?(matches.some(m=>m.uncertain)?'Same filename in library; size unrecorded':'Same name & size in library'):'';
 if(r.duplicate)r.enabled=false;
 });}
function chosen(){return st.items.filter(i=>i.enabled&&!i.done);}
const choices=(current,blank='Unassigned')=>`<option value="">${esc(blank)}</option>${state.albums.map(a=>`<option value="${esc(a.id)}" ${a.id===current?'selected':''}>${esc(a.title)}</option>`).join('')}`;
function importPanel(){const total=st.items.length,start=st.page*PAGE_SIZE,pageItems=st.items.slice(start,start+PAGE_SIZE),pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
 return `<div class="sv6-summary"><span><b>${total}</b> supported audio file(s)</span><span><b>${chosen().length}</b> selected</span><span><b>${st.items.filter(x=>x.duplicate).length}</b> potential duplicates</span></div>
 <div class="sv6-info">Suggestions come from filenames and folder names, <b>not</b> audio analysis. Possible duplicates are deselected by default; nothing is deleted. Review before saving.</div>
 <div class="sv6-tools"><label class="field"><span>Apply genre to selected</span><select id="sv6AllGenre">${genreOptions('')}</select></label><label class="field"><span>Apply subgenre to selected</span><input id="sv6AllSub" placeholder="Optional"></label><label class="field"><span>Album for selected</span><select id="sv6AllAlbum">${choices('', 'Keep suggestions / unassigned')}</select></label><button type="button" class="btn small" data-action="sv6-apply-batch">Apply to selected</button></div>
 <div class="sv6-table">${pageItems.map((r,i)=>{const ix=start+i;return `<section class="sv6-track ${r.duplicate?'sv6-dupe':''}">
 <div class="sv6-trackhead"><label class="sv6-check"><input type="checkbox" data-sv6-field="enabled" data-ix="${ix}" ${r.enabled?'checked':''} ${r.done?'disabled':''}><b>${ix+1}.</b> <span>${esc(r.file.name)}</span></label><span class="sv6-filesize">${(r.file.size/1024/1024).toFixed(1)} MB</span></div>
 ${r.duplicate?`<small class="sv6-warning">⚠ ${esc(r.duplicateText)}. Review before importing another copy.</small>`:''}
 <div class="sv6-row"><label>Song title<input data-sv6-field="title" data-ix="${ix}" value="${esc(r.title)}" maxlength="150"></label><label>Artist<input data-sv6-field="artist" data-ix="${ix}" value="${esc(r.artist)}" maxlength="150"></label></div>
 <div class="sv6-row"><label>Genre<select data-sv6-field="genre" data-ix="${ix}">${genreOptions(r.genre)}</select></label><label>Subgenre<input data-sv6-field="subgenre" data-ix="${ix}" value="${esc(r.subgenre)}"></label></div>
 <label class="sv6-album-label">Album<select data-sv6-field="albumId" data-ix="${ix}">${choices(r.albumId)}</select></label>${r.suggestion?`<small class="sv6-note">Suggested from: ${esc(r.suggestion)}</small>`:''}</section>`}).join('')}</div>
 <div class="sv6-pages"><button type="button" class="btn small" data-action="sv6-prev-page" ${st.page===0?'disabled':''}>← Previous</button><span>${st.page+1} / ${pages}</span><button type="button" class="btn small" data-action="sv6-next-page" ${st.page+1>=pages?'disabled':''}>Next →</button></div>
 <div class="sv6-progress" id="sv6Progress" role="status" aria-live="polite"></div>`;
}
function redrawImport(){if(!st.reviewOpen)return;N('modalBody').innerHTML=importPanel();N('modalFoot').innerHTML=`<button class="btn minor" data-action="sv6-cancel">Cancel</button><button class="btn primary" data-action="sv6-confirm" ${st.busy||!chosen().length?'disabled':''}>Import ${chosen().length} file(s)</button>`;}
function openReview(files){const incoming=[...files].filter(f=>f && (f.type.startsWith('audio/')||SUPPORTED.test(f.name)));const tooMany=incoming.length>MAX_FILES;st.items=incoming.slice(0,MAX_FILES).map(rowFor);st.page=0;st.busy=false;st.reviewOpen=true;setDuplicates();
 if(!st.items.length)return toast('No supported audio files selected.');
 modal('Review bulk audio import',`<div class="sv6-info">Preparing your import…</div>`,`<button class="btn" data-action="sv6-cancel">Cancel</button>`);redrawImport();
 if(tooMany)toast(`Showing first ${MAX_FILES}. Import other files in another batch.`);}
// Same-size/name is a flag, not enough evidence to silently merge files. Hash only if a plausible match.
async function sha256(file){if(!crypto?.subtle?.digest||file.size>100*1024*1024)return '';
 const data=await file.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
async function identicalExisting(row){const found=probableDuplicates(row.file);if(!found.length)return false;let hash='';
 for(const match of found){const stored=await storeGet('audio',match.version.id);if(!stored?.blob)continue;
 if(stored.blob.size!==row.file.size)continue;
 try{hash ||=await sha256(row.file);if(!hash)continue;
 const oldHash=match.version.sha256 || await sha256(stored.blob);
 if(oldHash&&oldHash===hash)return true;}catch(err){console.warn('Hash unavailable:',err);break;}}
 return false;}
function putSongAndFile(song,v,file){return new Promise((resolve,reject)=>{const tx=state.db.transaction(['audio','songs'],'readwrite');
 tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Storage transaction aborted'));
 tx.onerror=()=>{};
 tx.objectStore('audio').put({id:v.id,blob:file});tx.objectStore('songs').put(song);
 });}
async function importSelected(){if(st.busy)return;const selected=chosen();if(!selected.length)return toast('Choose at least one track.');
 st.busy=true;redrawImport();let completed=0,failed=0;
 for(const r of selected){try{const progress=N('sv6Progress');if(progress)progress.textContent=`Importing ${completed+failed+1} of ${selected.length}: ${r.file.name}`;
 // Duplicate warnings are advisory. Users may explicitly select a flagged file to import it.
 const v={id:uuid(),label:'Original import',fileName:r.file.name,type:r.file.type||'application/octet-stream',fileSize:r.file.size,addedAt:now()};
 // Compute checksum for reasonably-sized audio, enabling safe comparison against later batches.
 try{v.sha256=await sha256(r.file);}catch(e){console.info('Checksum not recorded:',e)}
 const t=now();const song={id:uuid(),title:r.title.trim()||'Imported track',artist:r.artist.trim(),genre:r.genre,subgenre:r.subgenre.trim(),albumId:r.albumId,status:'finished',kind:'song',mood:'',lyrics:'',style:'',voice:'',audioNotes:'',script:'',tone:'',backingMusic:'',notes:'',versions:[v],activeVersionId:v.id,createdAt:t,updatedAt:t};
 await putSongAndFile(song,v,r.file);completed++;r.done=true;
 }catch(error){failed++;console.error('Import failed',r.file.name,error);if(error?.name==='QuotaExceededError'){toast('Device storage full. Back up your library and free storage.');break;}}
 }
 st.busy=false;st.reviewOpen=false;st.items=[];closeModal();await load();toast(`Imported ${completed}; ${failed} failed. Unselected files were left untouched.`);
 if(failed)console.warn('Some imports failed — check available browser storage.');}
// Metadata organizer — never replaces existing assignments; requires individual approval.
function metadataSuggestion(song){const source=[song.subgenre,song.style,song.mood,song.notes].filter(Boolean).join(' ');const guess=suggest(source);if(!guess)return null;
 if(song.genre&&song.subgenre)return null;
 if(song.genre && song.genre!==guess.genre)return null;
 return {songId:song.id,genre:song.genre||guess.genre,subgenre:song.subgenre||guess.subgenre,enabled:true};}
function organizeView(){st.organize=state.songs.map(metadataSuggestion).filter(Boolean);
 const groups=[...new Set(state.songs.map(s=>s.genre||'Uncategorized'))].sort((a,b)=>a.localeCompare(b));
 return `${head('IMPORT & CATEGORIZE','Organize your collection','Preview multiple files and apply only metadata suggestions you approve.',`<button class="btn primary" data-action="import-audio">↑ Import audio files</button>`)}
 <section class="sv6-block"><h2>📥 Bulk import</h2><p>Choose multiple MP3, WAV, M4A, FLAC and other supported formats. Review song titles, artist, genre, subgenre, albums and possible duplicates before storing.</p><div class="inlinebuttons" style="margin-top:12px"><button class="btn primary" data-action="import-audio">Select audio files</button><button class="btn" data-action="sv6-folder-picker">Select folder (supported browsers)</button></div><p class="smallprint">Local files remain on this device. SongVault cannot automatically access your Suno account.</p></section>
 <section class="sv6-block"><div class="sv6-sectiontop"><h2>🏷 Suggested missing categories</h2><span>${st.organize.length} suggestions</span></div><p>Uses existing style descriptions, mood and subgenre text — not musical analysis. Existing genres and subgenres are never overwritten.</p>
 ${st.organize.length?`<div class="sv6-suggestlist">${st.organize.slice(0,100).map((x,i)=>{const s=state.songs.find(song=>song.id===x.songId);return `<label class="sv6-suggestion"><input type="checkbox" data-sv6-organize="${i}" ${x.enabled?'checked':''}><span><b>${esc(s.title)}</b><small>${esc([x.genre,x.subgenre].filter(Boolean).join(' / '))}</small></span></label>`}).join('')}</div>${st.organize.length>100?'<p class="smallprint">Showing first 100 suggestions.</p>':''}<button class="btn primary" data-action="sv6-apply-organize">Apply checked suggestions</button>`:'<div class="sv6-info">No missing categories can be inferred confidently from the saved text. Add styles or metadata in Song Editor to enable future suggestions.</div>'}</section>
 <section class="sv6-block"><h2>📁 Library overview</h2><div class="sv6-genregrid">${groups.map(g=>{const songs=state.songs.filter(s=>(s.genre||'Uncategorized')===g);return `<button class="sv6-genre" data-action="open-genre" data-genre="${esc(g==='Uncategorized'?'__none__':g)}"><strong>${esc(g)}</strong><small>${songs.length} tracks · ${new Set(songs.map(s=>s.subgenre||'Uncategorized')).size} subgenres</small></button>`}).join('')||'<p>No music imported yet.</p>'}</div></section>`;
}
const navBase=renderNav;
renderNav=function(){navBase();const d=N('desktopNav'),m=N('mobileNav');const desktop=`<button class="navbtn ${state.view==='organize'?'active':''}" data-action="view" data-view="organize"><span class="navico">⇅</span>Organize</button>`;const mobile=`<button class="${state.view==='organize'?'active':''}" data-action="view" data-view="organize"><b>⇅</b>Organize</button>`;d?.insertAdjacentHTML('beforeend',desktop);m?.insertAdjacentHTML('beforeend',mobile);};
const renderBase=render;
render=function(){renderBase();if(state.view==='organize')N('content').innerHTML=organizeView();};
// Existing hidden input continues to call this function. Replace the eager importer with a review-first workflow.
importAudio=async function(files){openReview(files);};
const folderInput=document.createElement('input');folderInput.type='file';folderInput.multiple=true;folderInput.hidden=true;folderInput.accept='audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac,.opus';folderInput.setAttribute('webkitdirectory','');folderInput.setAttribute('directory','');folderInput.id='sv6FolderInput';document.body.appendChild(folderInput);
folderInput.addEventListener('change',e=>{const files=[...e.target.files];e.target.value='';openReview(files)});
const actions=new Set(['sv6-folder-picker','sv6-prev-page','sv6-next-page','sv6-cancel','sv6-confirm','sv6-apply-batch','sv6-apply-organize']);
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||!actions.has(el.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();
 try{switch(el.dataset.action){
 case 'sv6-folder-picker':folderInput.click();break;
 case 'sv6-prev-page':st.page=Math.max(0,st.page-1);redrawImport();break;
 case 'sv6-next-page':st.page=Math.min(Math.ceil(st.items.length/PAGE_SIZE)-1,st.page+1);redrawImport();break;
 case 'sv6-cancel':if(st.busy)return;st.reviewOpen=false;st.items=[];closeModal();break;
 case 'sv6-confirm':await importSelected();break;
 case 'sv6-apply-batch':{const genre=N('sv6AllGenre')?.value||'',sub=N('sv6AllSub')?.value.trim()||'',album=N('sv6AllAlbum')?.value||'';
 if(!genre&&!sub&&!album)return toast('Choose a genre, subgenre or album first.');
 for(const r of chosen()){if(genre)r.genre=genre;if(sub)r.subgenre=sub;if(album)r.albumId=album;}
 redrawImport();break;}
 case 'sv6-apply-organize':{const checked=st.organize.filter(x=>x.enabled).slice(0,100);let n=0;
 for(const x of checked){const song=state.songs.find(s=>s.id===x.songId);if(!song)continue;
 const copy={...song,genre:song.genre||x.genre,subgenre:song.subgenre||x.subgenre,updatedAt:now()};await storePut('songs',copy);n++;}
 await load();toast(`Updated categories on ${n} track(s).`);break;}
 }}catch(error){console.error(error);toast('Organizer error: '+error.message);}
},true);
document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-sv6-field]')){const row=st.items[Number(el.dataset.ix)];if(!row||st.busy)return;const f=el.dataset.sv6Field;row[f]=f==='enabled'?el.checked:el.value;if(f==='enabled')N('modalFoot').innerHTML=`<button class="btn minor" data-action="sv6-cancel">Cancel</button><button class="btn primary" data-action="sv6-confirm" ${chosen().length?'':'disabled'}>Import ${chosen().length} file(s)</button>`;}
 if(el.matches('[data-sv6-organize]')){const x=st.organize[Number(el.dataset.sv6Organize)];if(x)x.enabled=el.checked;}
},true);
// Initial nav is already rendered by core app initialization; refresh once ready.
const doRender=()=>{if(state.db)render()};if(document.readyState==='complete')doRender();else window.addEventListener('load',doRender,{once:true});
})();