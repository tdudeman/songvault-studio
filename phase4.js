/* SongVault Studio Phase 4: playlists and playback queue.
   Stored playlists live in a new v2 IndexedDB object store; old library stores
   are untouched. Audio always comes from local, user-imported media. */
(() => {
'use strict';
const audio = document.getElementById('audioPlayer');
const player = document.getElementById('player');
const playerV4 = {queue:[],index:-1,shuffle:false,repeat:'off',loadToken:0,playlistId:'',queueVisible:false};
window.songVaultPlayer = playerV4; // Useful for smoke tests and troubleshooting.
const playable = s => !!s?.versions?.some(v => v.fileName);
const selectedVersion = (s,id) => s?.versions?.find(v=>v.id===(id||s.activeVersionId)&&v.fileName) || s?.versions?.find(v=>v.fileName);
const usableTrackIds = ids => [...new Set(ids)].filter(id => playable(state.songs.find(s=>s.id===id)));
const songById = id => state.songs.find(s=>s.id===id);
const playlistById = id => state.playlists.find(p=>p.id===id);
const nameOf = id => escapeHTML(songById(id)?.title||'Missing song');
const escapeAttr = escapeHTML;
const randomize = xs => {const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function albumIds(albumId){return state.songs.filter(s=>s.albumId===albumId).sort((a,b)=>{
 const x=Number(a.trackNo)>0?Number(a.trackNo):Infinity;
 const y=Number(b.trackNo)>0?Number(b.trackNo):Infinity;
 return x-y||(a.createdAt||'').localeCompare(b.createdAt||'')||a.id.localeCompare(b.id);
}).map(s=>s.id);}
function playlistIds(id){return playlistById(id)?.songIds?.filter(s=>!!songById(s))||[];}
function playbackContext(id){const song=songById(id);if(!song)return [id];
 if(state.view==='playlists'&&playerV4.playlistId)return playlistIds(playerV4.playlistId);
 if(state.view==='albums'&&song.albumId)return albumIds(song.albumId);
 if(state.view==='library')return matchingSongs().map(s=>s.id);
 return [id];
}
function nowPlaying(){return playerV4.queue[playerV4.index]||null;}
function mediaMetadata(song){if(!('mediaSession' in navigator))return;
 try{const album=state.albums.find(a=>a.id===song.albumId);const art=album?.coverDataURL&&/^data:image\/jpeg;base64,/.test(album.coverDataURL)?[{src:album.coverDataURL,type:'image/jpeg',sizes:'560x560'}]:[];
 navigator.mediaSession.metadata = new MediaMetadata({title:song.title||'Untitled',artist:song.artist||'SongVault Studio',album:album?.title||'',artwork:art});}
 catch(err){console.info('Media Session metadata unavailable',err);}}
function mediaState(){if('mediaSession' in navigator){try{navigator.mediaSession.playbackState=audio.paused?'paused':'playing';}catch{}}}
function updateControls(){
 const prev=document.getElementById('svPrevious'),next=document.getElementById('svNext'),shuffle=document.getElementById('svShuffle'),repeat=document.getElementById('svRepeat'),queue=document.getElementById('svQueue');
 if(!prev)return;
 const has=playerV4.queue.length>0;
 prev.disabled=!has; next.disabled=!has;
 shuffle.classList.toggle('sv-selected',playerV4.shuffle);shuffle.setAttribute('aria-pressed',String(playerV4.shuffle));
 repeat.textContent=playerV4.repeat==='one'?'🔂':'🔁';repeat.title=`Repeat: ${playerV4.repeat}`;repeat.setAttribute('aria-label',`Repeat ${playerV4.repeat}`);repeat.classList.toggle('sv-selected',playerV4.repeat!=='off');
 queue.textContent=`☷ ${playerV4.queue.length}`;
}
async function playAt(index, options={}){
 const entry=playerV4.queue[index];if(!entry)return;
 const song=songById(entry.songId);const version=selectedVersion(song,entry.versionId);
 if(!song||!version?.fileName){toast('A queued track has no audio; skipping.');return advance({fromError:true,skipCount:(options.skipCount||0)+1});}
 const token=++playerV4.loadToken;
 let item;
 try{item=await storeGet('audio',version.id);}catch(err){console.error(err);}
 if(token!==playerV4.loadToken)return;
 if(!item?.blob){toast(`Audio unavailable for ${song.title}. Restore a full backup.`);return advance({fromError:true,skipCount:(options.skipCount||0)+1});}
 const url=URL.createObjectURL(item.blob);
 audio.pause();const old=state.playerURL;state.playerURL=url;audio.src=url;
 if(old)URL.revokeObjectURL(old);
 playerV4.index=index;
 document.getElementById('playingTitle').textContent=`${song.title} · ${version.label||'Audio'}`;
 player.classList.add('show');mediaMetadata(song);updateControls();
 try{await audio.play();}catch(err){if(token===playerV4.loadToken&&!options.silent)toast('Tap the audio play button to start playback.');}
 mediaState();
}
async function advance({fromError=false,skipCount=0}={}){
 const p=playerV4;if(!p.queue.length)return;
 if(skipCount>=p.queue.length){audio.pause();toast('No playable audio remains in the queue.');return;}
 if(!fromError && p.repeat==='one' && p.index>=0){audio.currentTime=0;try{await audio.play();}catch{toast('Tap play to resume.');}return;}
 let next=p.index+1;
 if(next>=p.queue.length){
  if(p.repeat==='all')next=0;
  else {audio.pause();mediaState();updateControls();return;}
 }
 // Never infinitely recurse if a bad entry is encountered while skipping.
 if(fromError && p.queue.length===1){audio.pause();toast('No playable audio for this queue.');return;}
 await playAt(next,{silent:fromError,skipCount});
}
async function previous(){
 if(audio.currentTime>3){audio.currentTime=0;return;}
 const p=playerV4;const idx=p.index>0?p.index-1:(p.repeat==='all'?p.queue.length-1:0);
 if(p.queue[idx])await playAt(idx);
}
function resetPlayback(){
 playerV4.loadToken++;audio.pause();audio.removeAttribute('src');audio.load();
 if(state.playerURL){URL.revokeObjectURL(state.playerURL);state.playerURL=null;}
 player.classList.remove('show');playerV4.queue=[];playerV4.index=-1;
 document.getElementById('playingTitle').textContent='Song';
 if('mediaSession' in navigator){try{navigator.mediaSession.metadata=null;}catch{}}
 mediaState();updateControls();
}
function queueFrom(ids,startId,versionId){
 const clean=usableTrackIds(ids);
 if(!clean.includes(startId))clean.unshift(startId);
 if(!clean.length){toast('Import audio first to play this selection.');return;}
 let queue=clean.map(songId=>({songId}));
 const index=queue.findIndex(x=>x.songId===startId);
 const [entry]=queue.splice(index,1);
 entry.versionId=versionId||'';
 if(playerV4.shuffle)queue=randomize(queue);
 playerV4.queue=[entry,...queue];playerV4.index=0;
 playAt(0);
}
function addToQueue(id,next=false){
 const song=songById(id);if(!playable(song))return toast('This song has no imported audio yet.');
 const idx=next&&playerV4.index>=0?playerV4.index+1:playerV4.queue.length;
 playerV4.queue.splice(idx,0,{songId:id});
 updateControls();toast(next?'Song added to play next.':'Song added to queue.');
}
function queuePanel(){const p=playerV4;const list=p.queue.map((q,i)=>{
 const song=songById(q.songId),missing=!playable(song);
 return `<div class="sv-queue-row ${i===p.index?'sv-nowplaying':''}"><span class="sv-qnum">${i===p.index?'♫':i+1}</span><div class="songmain"><div class="songtitle">${nameOf(q.songId)}</div><div class="songmeta">${escapeHTML(song?.artist||'Unknown artist')}${missing?' · Audio missing':''}</div></div><button class="btn small" data-action="sv-queue-jump" data-index="${i}" aria-label="Play this song">▶</button><button class="btn small" data-action="sv-queue-up" data-index="${i}" ${i===0?'disabled':''} aria-label="Move up">↑</button><button class="btn small" data-action="sv-queue-down" data-index="${i}" ${i===p.queue.length-1?'disabled':''} aria-label="Move down">↓</button><button class="btn small danger" data-action="sv-queue-remove" data-index="${i}" aria-label="Remove from queue">×</button></div>`;
 }).join('');
 modal('Playing next',`<div class="sv-queue-header"><p>${p.queue.length} queued track${p.queue.length===1?'':'s'} · Shuffle ${p.shuffle?'on':'off'} · Repeat ${p.repeat}</p><button class="btn small danger" data-action="sv-clear-queue">Clear queue</button></div>${list||'<div class="empty"><h3>Queue is empty</h3><p>Play a song or choose an album or playlist to start.</p></div>'}`,`<button class="btn primary" data-action="close-modal">Done</button>`);
}
function queueReorder(i,j){const p=playerV4;if(i<0||j<0||i>=p.queue.length||j>=p.queue.length)return;
 const active=nowPlaying();[p.queue[i],p.queue[j]]=[p.queue[j],p.queue[i]];
 if(active)p.index=p.queue.indexOf(active);
 updateControls();queuePanel();
}
function queueRemove(i){const p=playerV4;if(i<0||i>=p.queue.length)return;
 const playing=i===p.index;
 p.queue.splice(i,1);
 if(!p.queue.length){resetPlayback();queuePanel();return;}
 if(playing){p.index=Math.min(i,p.queue.length-1);playAt(p.index);}
 else if(i<p.index)p.index--;
 updateControls();queuePanel();
}
// Playlist persistence: database name unchanged; optional playlists are included
// in existing v1-format JSON/ZIP exports. A backup from v3 has no playlists.
async function savePlaylist(){const name=document.getElementById('svPlaylistName')?.value.trim();if(!name)return toast('Playlist name required.');
 const description=document.getElementById('svPlaylistDesc')?.value.trim()||'';
 const existing=playlistById(playerV4.editingPlaylistId);
 const p={...(existing||{id:uuid(),songIds:[],createdAt:now()}),name,description,updatedAt:now()};
 await storePut('playlists',p);closeModal();await load();toast('Playlist saved.');
}
function playlistEditor(id=''){
 playerV4.editingPlaylistId=id;const p=playlistById(id);
 modal(p?'Edit playlist':'Create playlist',`<div class="fields"><div class="field full"><label for="svPlaylistName">Playlist name *</label><input id="svPlaylistName" maxlength="140" value="${escapeAttr(p?.name||'')}" placeholder="Late night synths"></div><div class="field full"><label for="svPlaylistDesc">Description (optional)</label><textarea id="svPlaylistDesc">${escapeHTML(p?.description||'')}</textarea></div></div>`, `<button class="btn minor" data-action="close-modal">Cancel</button><button class="btn primary" data-action="sv-save-playlist">Save playlist</button>`);
 document.getElementById('svPlaylistName').focus();
}
function playlistView(){const id=playerV4.playlistId,p=playlistById(id);
 if(id&&!p)playerV4.playlistId='';
 if(p){const ids=playlistIds(p.id);const list=ids.map((songId,i)=>{const s=songById(songId);
 return `<article class="song sv-playlist-song"><span class="sv-qnum">${i+1}</span><div class="songmain"><div class="songtitle">${escapeHTML(s.title)}</div><div class="songmeta">${escapeHTML(s.artist||'Unknown artist')} · ${escapeHTML([s.genre,s.subgenre].filter(Boolean).join(' / ')||'Uncategorized')}</div></div><div class="songactions">${playable(s)?`<button class="btn small" data-action="sv-play-song" data-id="${escapeAttr(songId)}">▶</button><button class="btn small" data-action="sv-add-queue" data-id="${escapeAttr(songId)}" aria-label="Add to queue">＋</button>`:''}<button class="btn small" data-action="sv-pl-move" data-direction="-1" data-id="${escapeAttr(songId)}" ${i===0?'disabled':''}>↑</button><button class="btn small" data-action="sv-pl-move" data-direction="1" data-id="${escapeAttr(songId)}" ${i===ids.length-1?'disabled':''}>↓</button><button class="btn small danger" data-action="sv-pl-remove" data-id="${escapeAttr(songId)}" aria-label="Remove song">×</button></div></article>`;
 }).join('');
 return `${head('YOUR PLAYLISTS',escapeHTML(p.name),escapeHTML(p.description||'Custom playlist'),`<button class="btn minor" data-action="sv-list-playlists">← Playlists</button>`)}<div class="inlinebuttons sv-playlist-actions"><button class="btn primary" data-action="sv-play-playlist" data-id="${escapeAttr(p.id)}">▶ Play all</button><button class="btn" data-action="sv-add-to-playlist" data-id="${escapeAttr(p.id)}">＋ Add songs</button><button class="btn" data-action="sv-edit-playlist" data-id="${escapeAttr(p.id)}">Edit details</button><button class="btn danger" data-action="sv-delete-playlist" data-id="${escapeAttr(p.id)}">Delete</button></div><div class="songlist">${list||'<div class="empty"><h3>No songs yet</h3><p>Tap Add songs to select music from your library.</p></div>'}</div>`;
 }
 const sorted=[...state.playlists].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
 return `${head('YOUR PLAYLISTS','Playlists','Custom listening collections separate from albums.',`<button class="btn primary" data-action="sv-new-playlist">＋ New playlist</button>`)}<div class="albumgrid">${sorted.map(p=>`<article class="album sv-playlist-card"><div class="albumart sv-playlist-art">♫</div><h3>${escapeHTML(p.name)}</h3><p>${p.songIds.length} track${p.songIds.length===1?'':'s'}</p><div class="inlinebuttons"><button class="btn small primary" data-action="sv-open-playlist" data-id="${escapeAttr(p.id)}">Open</button><button class="btn small" data-action="sv-play-playlist" data-id="${escapeAttr(p.id)}">▶ Play</button></div></article>`).join('')}${sorted.length?'':'<div class="empty"><h3>No playlists yet</h3><p>Create a playlist and choose songs from your library.</p><button class="btn primary" data-action="sv-new-playlist">＋ New playlist</button></div>'}</div>`;
}
function addSongsDialog(id){const p=playlistById(id);if(!p)return;
 const chosen=new Set(p.songIds);
 const rows=[...state.songs].sort((a,b)=>a.title.localeCompare(b.title)).map(s=>`<label class="sv-picker-row"><input type="checkbox" class="sv-playlist-check" value="${escapeAttr(s.id)}" ${chosen.has(s.id)?'checked':''}><span>${escapeHTML(s.title)} <small>${playable(s)?'♫ Imported audio':'Draft / no audio'}</small></span></label>`).join('');
 playerV4.editingPlaylistId=id;
 modal('Choose playlist songs',`<p class="sv-picker-help">Checked songs will appear in this playlist. You can include drafts, but only tracks with imported audio will play.</p><div class="sv-picker-list">${rows||'<p>No songs to add yet. Import some audio first.</p>'}</div>`,`<button class="btn minor" data-action="close-modal">Cancel</button><button class="btn primary" data-action="sv-save-playlist-songs">Save selection</button>`);
}
async function savePlaylistSelection(){const p=playlistById(playerV4.editingPlaylistId);if(!p)return;
 const selected=new Set([...document.querySelectorAll('.sv-playlist-check:checked')].map(e=>e.value));
 const songIds=[...p.songIds.filter(id=>selected.has(id)),...state.songs.map(s=>s.id).filter(id=>selected.has(id)&&!p.songIds.includes(id))];
 p.songIds=songIds;p.updatedAt=now();await storePut('playlists',p);closeModal();await load();toast('Playlist updated.');
}
function addSongPlaylistDialog(id){const list=[...state.playlists];if(!list.length){toast('Create a playlist first.');playlistEditor();return;}
 playerV4.addingSongId=id;
 modal('Add to playlist',`<p class="sv-picker-help">Choose a playlist for ${nameOf(id)}.</p><div class="field"><label for="svTargetPlaylist">Playlist</label><select id="svTargetPlaylist">${list.map(p=>`<option value="${escapeAttr(p.id)}">${escapeHTML(p.name)}</option>`).join('')}</select></div>`,`<button class="btn minor" data-action="close-modal">Cancel</button><button class="btn primary" data-action="sv-add-song-confirm">Add song</button>`);
}
async function mutatePlaylistSong(id,fn){const p=playlistById(playerV4.playlistId);if(!p)return;fn(p);p.updatedAt=now();await storePut('playlists',p);await load();}
const baseNav=renderNav;
renderNav=function(){baseNav();const desktop=document.getElementById('desktopNav'),mobile=document.getElementById('mobileNav');
 const d=`<button class="navbtn ${state.view==='playlists'?'active':''}" data-action="view" data-view="playlists"><span class="navico">☷</span>Playlists</button>`;
 const m=`<button class="${state.view==='playlists'?'active':''}" data-action="view" data-view="playlists"><b>☷</b>Playlists</button>`;
 desktop.insertAdjacentHTML('beforeend',d);mobile.insertAdjacentHTML('beforeend',m);
};
const baseRender=render;
render=function(){baseRender();if(state.view==='playlists')document.getElementById('content').innerHTML=playlistView();
 // Add queue/playlist affordances to library and album song rows.
 if(state.view==='library')document.querySelectorAll('.song[data-song-id],.song').forEach(row=>{
  if(row.querySelector('.sv-extra-song-actions'))return;
  const songButton=row.querySelector('[data-action="play"]');const edit=row.querySelector('[data-action="edit-song"]');const id=songButton?.dataset.id||edit?.dataset.id;
  if(!id)return;
  const area=row.querySelector('.songactions');if(!area)return;
  area.insertAdjacentHTML('beforeend',`<span class="sv-extra-song-actions"><button class="btn small" data-action="sv-add-song-playlist" data-id="${escapeAttr(id)}" title="Add to playlist" aria-label="Add to playlist">☷＋</button>${playable(songById(id))?`<button class="btn small" data-action="sv-add-queue" data-id="${escapeAttr(id)}" title="Add to queue" aria-label="Add to queue">＋</button>`:''}</span>`);
 });
 if(state.view==='albums'){
  document.querySelectorAll('.sv-album-card').forEach(card=>{const btn=card.querySelector('[data-action="edit-album"]');if(btn&&!card.querySelector('[data-action="sv-play-album"]'))btn.insertAdjacentHTML('afterend',` <button class="btn small" data-action="sv-play-album" data-id="${escapeAttr(btn.dataset.id)}">▶ Play</button>`);});
  document.querySelectorAll('.sv-track-row').forEach(row=>{const target=row.querySelector('[data-action="edit-song"]');const area=row.querySelector('.songactions');if(!target||!area)return;
   area.insertAdjacentHTML('beforeend',`<button class="btn small" data-action="sv-add-song-playlist" data-id="${escapeAttr(target.dataset.id)}" aria-label="Add to playlist">☷＋</button>`);
  });
 }
 updateControls();
};
// Player bar: previous/next, shuffle, repeat, queue and native progress/seek controls.
player.classList.add('sv-player');
player.insertAdjacentHTML('beforeend',`<div class="sv-player-actions"><button class="btn small sv-player-button" id="svPrevious" data-action="sv-prev" aria-label="Previous track" title="Previous">⏮</button><button class="btn small sv-player-button" id="svNext" data-action="sv-next" aria-label="Next track" title="Next">⏭</button><button class="btn small sv-player-button" id="svShuffle" data-action="sv-shuffle" aria-label="Shuffle upcoming songs" aria-pressed="false" title="Shuffle">🔀</button><button class="btn small sv-player-button" id="svRepeat" data-action="sv-repeat" aria-label="Repeat off" title="Repeat off">🔁</button><button class="btn small sv-player-button" id="svQueue" data-action="sv-queue" aria-label="View queue" title="Queue">☷ 0</button></div>`);
audio.setAttribute('playsinline','');audio.addEventListener('ended',()=>advance());audio.addEventListener('play',mediaState);audio.addEventListener('pause',mediaState);
if('mediaSession' in navigator){const handlers={play:()=>audio.play().catch(()=>{}),pause:()=>audio.pause(),previoustrack:()=>previous(),nexttrack:()=>advance({fromError:true}),seekbackward:details=>{audio.currentTime=Math.max(0,audio.currentTime-(details.seekOffset||10));},seekforward:details=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,audio.currentTime+(details.seekOffset||10));},seekto:details=>{if(Number.isFinite(details.seekTime))audio.currentTime=details.seekTime;}};
 for(const [k,fn] of Object.entries(handlers))try{navigator.mediaSession.setActionHandler(k,fn);}catch{}
}
const v4Actions=new Set(['play','play-version','stop-audio','sv-play-song','sv-prev','sv-next','sv-shuffle','sv-repeat','sv-queue','sv-queue-jump','sv-queue-up','sv-queue-down','sv-queue-remove','sv-clear-queue','sv-new-playlist','sv-edit-playlist','sv-save-playlist','sv-list-playlists','sv-open-playlist','sv-delete-playlist','sv-add-to-playlist','sv-save-playlist-songs','sv-add-song-playlist','sv-add-song-confirm','sv-pl-move','sv-pl-remove','sv-play-playlist','sv-play-album','sv-add-queue','sv-play-next','sv-play-library']);
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el||!v4Actions.has(el.dataset.action))return;
 e.preventDefault();e.stopImmediatePropagation();
 const a=el.dataset.action,id=el.dataset.id,p=playerV4;
 try{
  if(a==='play'||a==='sv-play-song')queueFrom(playbackContext(id),id);
  else if(a==='play-version')queueFrom([id],id,el.dataset.version);
  else if(a==='stop-audio')resetPlayback();
  else if(a==='sv-prev')await previous();
  else if(a==='sv-next')await advance({fromError:true});
  else if(a==='sv-shuffle'){p.shuffle=!p.shuffle;if(p.shuffle&&p.index>=0){p.queue=[...p.queue.slice(0,p.index+1),...randomize(p.queue.slice(p.index+1))];}updateControls();toast(p.shuffle?'Shuffle on for upcoming tracks.':'Shuffle off.');}
  else if(a==='sv-repeat'){p.repeat=p.repeat==='off'?'all':p.repeat==='all'?'one':'off';updateControls();toast('Repeat: '+p.repeat);}
  else if(a==='sv-queue')queuePanel();
  else if(a==='sv-queue-jump'){await playAt(Number(el.dataset.index));queuePanel();}
  else if(a==='sv-queue-up')queueReorder(Number(el.dataset.index),Number(el.dataset.index)-1);
  else if(a==='sv-queue-down')queueReorder(Number(el.dataset.index),Number(el.dataset.index)+1);
  else if(a==='sv-queue-remove')queueRemove(Number(el.dataset.index));
  else if(a==='sv-clear-queue'){resetPlayback();queuePanel();}
  else if(a==='sv-new-playlist')playlistEditor();
  else if(a==='sv-edit-playlist')playlistEditor(id);
  else if(a==='sv-save-playlist')await savePlaylist();
  else if(a==='sv-list-playlists'){p.playlistId='';render();}
  else if(a==='sv-open-playlist'){p.playlistId=id;state.view='playlists';render();}
  else if(a==='sv-delete-playlist'){const target=playlistById(id);if(target&&confirm(`Delete playlist “${target.name}”? The songs will remain in your library.`)){await storeDelete('playlists',id);p.playlistId='';await load();toast('Playlist deleted; songs kept.');}}
  else if(a==='sv-add-to-playlist')addSongsDialog(id);
  else if(a==='sv-save-playlist-songs')await savePlaylistSelection();
  else if(a==='sv-add-song-playlist')addSongPlaylistDialog(id);
  else if(a==='sv-add-song-confirm'){const pl=playlistById(document.getElementById('svTargetPlaylist')?.value);if(pl&&!pl.songIds.includes(p.addingSongId)){pl.songIds.push(p.addingSongId);pl.updatedAt=now();await storePut('playlists',pl);}closeModal();await load();toast('Song added to playlist.');}
  else if(a==='sv-pl-move')await mutatePlaylistSong(id,pl=>{const i=pl.songIds.indexOf(id),j=i+Number(el.dataset.direction);if(i>=0&&j>=0&&j<pl.songIds.length)[pl.songIds[i],pl.songIds[j]]=[pl.songIds[j],pl.songIds[i]];});
  else if(a==='sv-pl-remove')await mutatePlaylistSong(id,pl=>{pl.songIds=pl.songIds.filter(x=>x!==id);});
  else if(a==='sv-play-playlist'){const ids=playlistIds(id);const available=usableTrackIds(ids);if(!available.length){toast('Playlist has no imported audio yet.');return;}p.playlistId=id;queueFrom(ids,available[0]);}
  else if(a==='sv-play-album'){const ids=albumIds(id),available=usableTrackIds(ids);if(!available.length){toast('Album has no imported audio yet.');return;}queueFrom(ids,available[0]);}
  else if(a==='sv-add-queue')addToQueue(id,false);
  else if(a==='sv-play-next')addToQueue(id,true);
  else if(a==='sv-play-library'){const available=usableTrackIds(matchingSongs().map(s=>s.id));if(!available.length){toast('No imported audio in this selection.');return;}queueFrom(available,available[0]);}
 }catch(err){console.error(err);toast('Player error: '+err.message);}
},true);
// Enrich library toolbar once its main view is in the DOM (and after every render).
const originalRenderV4=render;
render=function(){originalRenderV4();if(state.view==='library'){
 const area=document.querySelector('#content .top .inlinebuttons');if(area&&!area.querySelector('[data-action="sv-play-library"]'))area.insertAdjacentHTML('afterbegin','<button class="btn" data-action="sv-play-library">▶ Play library</button>');
 }if(state.view==='playlists'&&!playlistById(playerV4.playlistId))playerV4.playlistId='';};
// Keep deleted songs from lingering in saved playlists (but only after deletion is confirmed).
const originalDeleteSong=delSong;
delSong=async function(id){const before=!!songById(id);await originalDeleteSong(id);if(before&&!songById(id)){
 for(const pl of state.playlists.filter(p=>p.songIds.includes(id))){pl.songIds=pl.songIds.filter(x=>x!==id);await storePut('playlists',pl);}
 playerV4.queue=playerV4.queue.filter(q=>q.songId!==id);if(!playerV4.queue.length)resetPlayback();else playerV4.index=Math.min(Math.max(0,playerV4.index),playerV4.queue.length-1);
 await load();updateControls();
 }};
updateControls();
})();