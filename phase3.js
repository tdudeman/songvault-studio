/* SongVault Studio Phase 3 — additive features over the v2 IndexedDB schema.
   Album artwork is compressed to JPEG inside the album metadata record so the
   existing JSON / ZIP backup and restore formats continue to include it. */
(() => {
'use strict';
const previousAlbumEditor = albumEditor;
const previousBulkBar = bulkBar;
let activeAlbum = '';
let pendingCover; // undefined=unchanged, null=remove, string=new image
const goodCover = a => typeof a?.coverDataURL === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(a.coverDataURL) && a.coverDataURL.length < 1000000;
const coverHTML = a => goodCover(a) ? `<img class="sv-cover-image" src="${a.coverDataURL}" alt="Cover for ${escapeHTML(a.title)}" loading="lazy">` : '<span aria-hidden="true">♫</span>';
const albumTracks = id => state.songs.filter(s=>s.albumId===id).sort((a,b)=>{
  const x=Number.isFinite(Number(a.trackNo))&&Number(a.trackNo)>0?Number(a.trackNo):Infinity;
  const y=Number.isFinite(Number(b.trackNo))&&Number(b.trackNo)>0?Number(b.trackNo):Infinity;
  return (x-y) || (a.createdAt||'').localeCompare(b.createdAt||'') || a.id.localeCompare(b.id);
});
const albumCard = a => {const n=state.songs.filter(s=>s.albumId===a.id).length;
  return `<article class="album sv-album-card" data-action="open-album" data-id="${escapeHTML(a.id)}" role="button" tabindex="0" aria-label="Open album ${escapeHTML(a.title)}"><div class="albumart sv-albumart" style="--from:${escapeHTML(a.color||'#8558a8')}">${coverHTML(a)}</div><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML([a.genre,a.subgenre].filter(Boolean).join(' · ')||'Uncategorized')} · ${n} ${n===1?'track':'tracks'}${a.year?' · '+escapeHTML(a.year):''}</p><button type="button" class="btn small" data-action="edit-album" data-id="${escapeHTML(a.id)}" style="margin-top:10px">Edit album</button></article>`;
};
function albumDetails(a){
 const tracks=albumTracks(a.id);
 return `${head('ALBUM LIBRARY',escapeHTML(a.title),'Organize tracks in their listening order.',`<button class="btn minor" data-action="back-to-albums">← All albums</button>`)}<div class="sv-album-detail"><div class="albumart sv-albumart sv-detail-art" style="--from:${escapeHTML(a.color||'#8558a8')}">${coverHTML(a)}</div><div class="sv-detail-info"><div class="eyebrow">${escapeHTML([a.genre,a.subgenre].filter(Boolean).join(' · ')||'Uncategorized')}</div><p>${a.releaseDate?escapeHTML(a.releaseDate):escapeHTML(a.year||'Year not set')}</p><p class="sv-album-description">${escapeHTML(a.description||'No album description yet.')}</p><div class="inlinebuttons"><button class="btn" data-action="edit-album" data-id="${escapeHTML(a.id)}">Edit artwork & details</button><button class="btn primary" data-action="add-to-album" data-id="${escapeHTML(a.id)}">＋ New track</button></div></div></div><div class="sectionhead"><h2>Track order (${tracks.length})</h2>${tracks.length>1?'<span class="subtle">Use ↑ / ↓ to reorder</span>':''}</div><div class="songlist">${tracks.length?tracks.map((s,i)=>`<article class="song sv-track-row"><span class="sv-track-number">${i+1}</span><div class="songmain"><div class="songtitle">${escapeHTML(s.title)}</div><div class="songmeta">${escapeHTML(s.artist||'Unknown artist')} · ${escapeHTML([s.genre,s.subgenre].filter(Boolean).join(' / ')||'Uncategorized')}</div></div><div class="songactions">${s.versions?.some(v=>v.fileName)?`<button class="btn small" data-action="play" data-id="${escapeHTML(s.id)}" aria-label="Play ${escapeHTML(s.title)}">▶</button>`:''}<button class="btn small" data-action="move-track" data-id="${escapeHTML(s.id)}" data-direction="-1" ${i===0?'disabled':''} aria-label="Move ${escapeHTML(s.title)} up">↑</button><button class="btn small" data-action="move-track" data-id="${escapeHTML(s.id)}" data-direction="1" ${i===tracks.length-1?'disabled':''} aria-label="Move ${escapeHTML(s.title)} down">↓</button><button class="btn small" data-action="edit-song" data-id="${escapeHTML(s.id)}">Edit</button></div></article>`).join(''):'<div class="empty"><h3>No tracks in this album</h3><p>Create a draft here, or assign existing songs to the album using Library → Select multiple.</p><button class="btn primary" data-action="add-to-album" data-id="'+escapeHTML(a.id)+'">＋ Add a draft</button></div>'}</div>`;
}

albumsView = function(){
 const a=state.albums.find(a=>a.id===activeAlbum);
 if(a)return albumDetails(a);
 if(activeAlbum)activeAlbum='';
 const sorted=[...state.albums].sort((a,b)=>(a.title||'').localeCompare(b.title||''));
 return `${head('COLLECTIONS','Albums & collections','Custom covers, descriptions, release dates and track ordering.',`<button class="btn primary" data-action="new-album">＋ New album</button>`)}<div class="albumgrid">${sorted.map(albumCard).join('')}${!sorted.length?'<div class="empty"><div class="symbol">▦</div><h3>No albums yet</h3><p>Create an album and assign tracks in the Library editor or bulk organizer.</p><button class="btn primary" data-action="new-album">Create album</button></div>':''}</div>`;
};

albumEditor = function(id=null){
 pendingCover=undefined;
 previousAlbumEditor(id);
 const a=state.albums.find(a=>a.id===id);
 const fields=$('#modalBody .fields');
 fields.insertAdjacentHTML('beforeend',`<div class="field full"><label>Album cover (optional)</label><div class="sv-cover-upload"><div id="svCoverPreview" class="sv-cover-preview" style="--from:${escapeHTML(a?.color||'#8558a8')}">${coverHTML(a||{})}</div><div><label class="btn small sv-upload-button" for="svCoverFile">Choose image</label><input type="file" id="svCoverFile" accept="image/png,image/jpeg,image/webp" hidden><button type="button" class="btn small minor" data-action="remove-album-cover">Remove cover</button><small>PNG, JPG or WebP. Cropped to a square and compressed locally (max 10 MB input). Included in library backups.</small></div></div></div><div class="field"><label for="svReleaseDate">Release date</label><input type="date" id="svReleaseDate" value="${escapeHTML(a?.releaseDate||'')}"><small>Optional. Year is shown when no date is entered.</small></div>`);
};

saveAlbum = async function(){
 const title=$('#aTitle')?.value.trim();if(!title){toast('Album title required.');$('#aTitle')?.focus();return;}
 const old=state.editId?state.albums.find(a=>a.id===state.editId):null;
 const a={...(!old?{id:uuid(),createdAt:now()}:old),title,genre:$('#aGenre').value,subgenre:$('#aSubgenre').value.trim(),year:$('#aYear').value,color:$('#aColor').value,description:$('#aDescription').value.trim(),releaseDate:$('#svReleaseDate')?.value||'',updatedAt:now()};
 if(pendingCover!==undefined){if(pendingCover===null)delete a.coverDataURL;else a.coverDataURL=pendingCover;}
 await storePut('albums',a);pendingCover=undefined;closeModal();await load();toast('Album saved.');
};

async function readCover(file){
 if(!file || !['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPG or WebP image.');
 if(file.size>10*1024*1024)throw Error('Choose a cover smaller than 10 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not read image.'));});
  if(image.naturalWidth<1||image.naturalHeight<1)throw Error('Invalid image.');
  const canvas=document.createElement('canvas');canvas.width=560;canvas.height=560;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image processing unavailable.');
  const side=Math.min(image.naturalWidth,image.naturalHeight);
  ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,560,560);
  const data=canvas.toDataURL('image/jpeg',0.77);
  if(!/^data:image\/jpeg;base64,/.test(data)||data.length>1000000)throw Error('Cover image is too large after compression.');
  return data;
 } finally {URL.revokeObjectURL(url);}
}
function updateCover(){const el=$('#svCoverPreview');if(!el)return;const a=state.albums.find(a=>a.id===state.editId);const d=pendingCover===undefined?a?.coverDataURL:pendingCover;
 el.innerHTML=d&&/^data:image\/jpeg;base64,/.test(d)?`<img class="sv-cover-image" src="${d}" alt="Selected cover">`:'<span aria-hidden="true">♫</span>';
}

async function moveTrack(id,direction){
 const s=state.songs.find(s=>s.id===id);if(!s||!s.albumId)return;
 const items=albumTracks(s.albumId),i=items.findIndex(s=>s.id===id),j=i+direction;
 if(i<0||j<0||j>=items.length)return;
 [items[i],items[j]]=[items[j],items[i]];
 for(let k=0;k<items.length;k++){const item=items[k];item.trackNo=k+1;item.updatedAt=now();await storePut('songs',item);}
 await load();toast('Track order saved.');
}

// A genre → subgenre view including albums with no tracks yet.
genresView = function(){
 const groups=new Map();
 const ensure=(g,sub)=>{g=g||'Uncategorized';sub=sub||'Uncategorized';if(!groups.has(g))groups.set(g,new Map());const m=groups.get(g);if(!m.has(sub))m.set(sub,{songs:[],albums:[]});return m.get(sub);};
 state.songs.forEach(s=>ensure(s.genre,s.subgenre).songs.push(s));
 state.albums.forEach(a=>ensure(a.genre,a.subgenre).albums.push(a));
 const html=[...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([genre,submap])=>{
  const all=[...submap.values()],count=all.reduce((n,g)=>n+g.songs.length,0),ac=all.reduce((n,g)=>n+g.albums.length,0);
  const subrows=[...submap.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([sub,obj])=>{
   const genCode=genre==='Uncategorized'?'__none__':genre,subCode=sub==='Uncategorized'?'__none__':sub;
   return `<div class="sv-subgroup"><button class="sv-sub-title" data-action="open-subgenre" data-genre="${escapeHTML(genCode)}" data-subgenre="${escapeHTML(subCode)}">📁 ${escapeHTML(sub)} <span>${obj.songs.length} tracks</span></button>${obj.albums.length?`<div class="sv-linked-albums">${obj.albums.sort((a,b)=>a.title.localeCompare(b.title)).map(a=>`<button class="sv-album-link" data-action="open-album" data-id="${escapeHTML(a.id)}">▦ ${escapeHTML(a.title)}</button>`).join('')}</div>`:''}</div>`;
  }).join('');
  return `<section class="sv-genre-panel"><header><div><h2>${escapeHTML(genre)}</h2><p>${count} tracks · ${ac} albums · ${submap.size} subgenres</p></div><button class="btn small" data-action="open-genre" data-genre="${escapeHTML(genre==='Uncategorized'?'__none__':genre)}">All tracks →</button></header>${subrows}</section>`;
 }).join('');
 return `${head('BROWSE COLLECTION','Genres & subgenres','Browse genres, open subgenre folders or jump directly into albums.',`<button class="btn primary" data-action="new-album">＋ New album</button>`)}<div class="sv-genres-grid">${html||'<div class="empty"><h3>No genres yet</h3><p>Add your first track or album to get started.</p></div>'}</div>`;
};

bulkBar = function(){return previousBulkBar().replace('</div>',`<label class="sv-bulk-clear"><input type="checkbox" id="svClearGenre"> Clear genre</label><label class="sv-bulk-clear"><input type="checkbox" id="svClearSubgenre"> Clear subgenre</label></div>`);};
applyBulk = async function(){
 const ids=[...state.selected];if(!ids.length){toast('Select at least one song.');return;}
 const genre=$('#bulkGenre').value,sub=$('#bulkSubgenre').value.trim(),album=$('#bulkAlbum').value;
 const clearG=$('#svClearGenre')?.checked,clearS=$('#svClearSubgenre')?.checked;
 if(!genre&&!sub&&!album&&!clearG&&!clearS){toast('Choose at least one change.');return;}
 for(const id of ids){const s=state.songs.find(x=>x.id===id);if(!s)continue;
  if(clearG)s.genre='';else if(genre)s.genre=genre;
  if(clearS)s.subgenre='';else if(sub)s.subgenre=sub;
  if(album){s.albumId=album==='__none'?'':album;if(!s.albumId)delete s.trackNo;}
  s.updatedAt=now();await storePut('songs',s);
 }
 state.selected.clear();state.bulk=false;await load();toast(`${ids.length} song${ids.length===1?'':'s'} organized.`);
};

// Intercept only new actions, keeping the original SongVault handlers unchanged.
const ownActions=new Set(['open-album','back-to-albums','add-to-album','move-track','remove-album-cover']);
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const actionName=el.dataset.action;
 if(actionName==='view')activeAlbum='';
 if(!ownActions.has(actionName))return;
 e.preventDefault();e.stopPropagation();
 try{
  if(actionName==='open-album'){activeAlbum=el.dataset.id;state.view='albums';render();window.scrollTo(0,0);}
  else if(actionName==='back-to-albums'){activeAlbum='';render();}
  else if(actionName==='add-to-album'){songEditor();const target=$('#fAlbum');if(target)target.value=el.dataset.id;}
  else if(actionName==='move-track')await moveTrack(el.dataset.id,Number(el.dataset.direction));
  else if(actionName==='remove-album-cover'){pendingCover=null;updateCover();}
 }catch(err){console.error(err);toast('Unable to complete action: '+err.message);}
},true);
document.addEventListener('keydown',e=>{const el=e.target.closest('[data-action="open-album"]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();el.click();}},true);
document.addEventListener('change',async e=>{
 if(e.target.id!=='svCoverFile')return;
 try{pendingCover=await readCover(e.target.files?.[0]);updateCover();toast('Cover ready; save the album to keep it.');}
 catch(err){console.error(err);toast(err.message);}
},true);
})();