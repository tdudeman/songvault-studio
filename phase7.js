/* Phase 7 — audio metadata and alternate takes. No schema change. */
'use strict';
const sv7Time = secs => Number.isFinite(Number(secs)) && Number(secs)>0 ? `${Math.floor(Number(secs)/60)}:${String(Math.floor(Number(secs)%60)).padStart(2,'0')}` : '—';
const sv7SafeCover = cover => typeof cover === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(cover) && cover.length<1000000;
const sv7CoverFor = s => s?.artworkDataURL || state.albums.find(a=>a.id===s?.albumId)?.coverDataURL || '';
let sv7PendingArt;
const sv7EditorBase = songEditor;
songEditor = function(id=null,kind='song') {
  sv7PendingArt = undefined;
  sv7EditorBase(id,kind);
  const s=id ? state.songs.find(x=>x.id===id):null, form=document.querySelector('#songForm .fields');
  if(!form)return;
  const cover=sv7CoverFor(s),preview=sv7SafeCover(cover)?`<img src="${cover}" class="sv7-art-preview" alt="Song artwork">`:'<span>♫</span>';
  form.insertAdjacentHTML('beforeend',`<div class="field full sv7-artbox"><label>Song artwork (optional)</label><div class="sv7-artline"><div class="sv7-art-preview-wrap" id="sv7ArtPreview">${preview}</div><div><label class="btn small" for="sv7ArtFile">Choose artwork</label><input type="file" id="sv7ArtFile" accept="image/png,image/jpeg,image/webp" hidden><button type="button" class="btn small minor" data-action="sv7-clear-art">Clear song artwork</button><small>Square crop, stored locally; album cover remains available as fallback.</small></div></div></div>`);
  if(s?.versions?.length){
    const el=document.createElement('section');el.className='sv7-versions';
    el.innerHTML=`<h3>🎚 Take details</h3><p>Rename versions and add notes without removing their original audio. Save song edits before adjusting takes.</p>${s.versions.map(v=>`<div class="sv7-take"><div><b>${escapeHTML(v.fileName||'No audio')}</b><small>${sv7Time(v.durationSec)} · ${v.fileSize? (v.fileSize/1048576).toFixed(1)+' MB':'Unknown size'}${s.activeVersionId===v.id?' · ACTIVE':''}</small></div><label>Version name<input maxlength="120" data-sv7-label="${escapeHTML(v.id)}" value="${escapeHTML(v.label||'')}"></label><label>Version notes<input maxlength="240" data-sv7-note="${escapeHTML(v.id)}" value="${escapeHTML(v.notes||'')}"></label><button class="btn small" data-action="sv7-save-take" data-id="${escapeHTML(s.id)}" data-version="${escapeHTML(v.id)}">Save take</button></div>`).join('')}`;
    document.querySelector('#modalBody').appendChild(el);
  }
};
const sv7FieldsBase=fieldsFromEditor;
fieldsFromEditor=function(){const data=sv7FieldsBase();if(document.getElementById('sv7ArtPreview')){
  const old=state.songs.find(s=>s.id===state.editId);
  data.artworkDataURL=sv7PendingArt===undefined ? old?.artworkDataURL||'' : sv7PendingArt||'';
}return data;};
const sv7SongCardBase=songCard;
songCard=function(s){let html=sv7SongCardBase(s);const cover=sv7CoverFor(s);if(sv7SafeCover(cover))html=html.replace('<div class="art">',`<div class="art"><img class="sv7-song-cover" src="${cover}" alt="">`);
 const v=s.versions?.find(v=>v.id===s.activeVersionId)||s.versions?.[0];
 if(v?.durationSec)html=html.replace(' · <span class="pill',` · ${sv7Time(v.durationSec)} · <span class="pill`);
 return html;};
const sv7ProbeDuration=blob=>new Promise(resolve=>{if(!blob){resolve(0);return;}const el=document.createElement('audio'),url=URL.createObjectURL(blob);let done=false;
 const timer=setTimeout(()=>finish(0),12000);function finish(value){if(done)return;done=true;clearTimeout(timer);el.removeAttribute('src');el.load();URL.revokeObjectURL(url);resolve(Number.isFinite(value)&&value>0&&value<86400 ? Math.round(value*100)/100 :0)}
 el.preload='metadata';el.onloadedmetadata=()=>finish(el.duration);el.onerror=()=>finish(0);el.src=url;
});
let sv7Scanning=false;
async function sv7ScanDurations(){if(sv7Scanning)return;sv7Scanning=true;const btn=document.querySelector('[data-action="sv7-scan"]');if(btn)btn.disabled=true;
 let found=0,unreadable=0;let todo=[];
 for(const song of state.songs)for(const v of song.versions||[])if(v.fileName && !Number(v.durationSec))todo.push({songId:song.id,id:v.id});
 const max=todo.length;let seen=0;
 try{for(const item of todo){const song=state.songs.find(s=>s.id===item.songId),v=song?.versions.find(x=>x.id===item.id);if(!v)continue;
  const f=await storeGet('audio',v.id);const duration=await sv7ProbeDuration(f?.blob);if(duration){v.durationSec=duration;song.updatedAt=now();await storePut('songs',song);found++;}else unreadable++;
  seen++;const status=document.getElementById('sv7ScanStatus');if(status)status.textContent=`Scanned ${seen} of ${max} · ${found} durations recorded`;
 }}catch(e){console.error(e);toast('Scan interrupted: '+e.message);}finally{sv7Scanning=false;await load();toast(`Scan finished: ${found} updated; ${unreadable} unavailable.`);}}
function sv7MediaView(){const audios=state.songs.flatMap(s=>(s.versions||[]).filter(v=>v.fileName).map(v=>({s,v})));const timed=audios.filter(x=>Number(x.v.durationSec)>0).length;
 return `${head('PHASE 7','Media details','Duration, per-song artwork, and alternate take metadata.')}
 <div class="stats"><div class="stat"><strong>${audios.length}</strong><span>Attached audio versions</span></div><div class="stat"><strong>${timed}</strong><span>Durations recorded</span></div><div class="stat"><strong>${audios.length-timed}</strong><span>Awaiting duration scan</span></div></div>
 <div class="sv7-toolbox"><h2>Audio metadata scanner</h2><p>Read durations from your already-imported files. Unreadable formats will stay blank; your audio will not be changed or uploaded.</p><button class="btn primary" data-action="sv7-scan" ${sv7Scanning?'disabled':''}>◷ Scan missing durations</button><p id="sv7ScanStatus" class="smallprint">Scans only versions missing duration metadata. Large collections may take time on mobile.</p></div>
 <div class="sectionhead"><h2>Audio versions</h2></div><div class="songlist">${audios.slice(0,200).map(({s,v})=>`<div class="sv7-media-row"><div class="songmain"><b>${escapeHTML(s.title)}</b><p>${escapeHTML(v.label||v.fileName)} · ${sv7Time(v.durationSec)}</p></div><button class="btn small" data-action="edit-song" data-id="${escapeHTML(s.id)}">Edit</button></div>`).join('')||'<p>No audio imported yet.</p>'}</div>${audios.length>200?'<p class="smallprint">Showing first 200 versions.</p>':''}`;}
const sv7NavBase=renderNav;renderNav=function(){sv7NavBase();document.getElementById('desktopNav')?.insertAdjacentHTML('beforeend',`<button class="navbtn ${state.view==='media'?'active':''}" data-action="view" data-view="media"><span class="navico">◷</span>Media</button>`);document.getElementById('mobileNav')?.insertAdjacentHTML('beforeend',`<button class="${state.view==='media'?'active':''}" data-action="view" data-view="media"><b>◷</b>Media</button>`);};
const sv7RenderBase=render;render=function(){sv7RenderBase();if(state.view==='media')document.getElementById('content').innerHTML=sv7MediaView();};
const sv7Actions=new Set(['sv7-clear-art','sv7-save-take','sv7-scan']);
document.addEventListener('click',async event=>{const el=event.target.closest('[data-action]');if(!el||!sv7Actions.has(el.dataset.action))return;event.preventDefault();event.stopImmediatePropagation();
 try{if(el.dataset.action==='sv7-clear-art'){sv7PendingArt='';document.getElementById('sv7ArtPreview').innerHTML='<span>♫</span>';}
 else if(el.dataset.action==='sv7-scan')await sv7ScanDurations();
 else if(el.dataset.action==='sv7-save-take'){
  const song=state.songs.find(s=>s.id===el.dataset.id),v=song?.versions.find(v=>v.id===el.dataset.version);if(!v)return;
  const label=document.querySelector('[data-sv7-label="'+CSS.escape(v.id)+'"]')?.value.trim();const note=document.querySelector('[data-sv7-note="'+CSS.escape(v.id)+'"]')?.value.trim();
  v.label=label||v.fileName||'Audio version';v.notes=note||'';song.updatedAt=now();await storePut('songs',song);toast('Take metadata saved.');
 }}catch(e){console.error(e);toast('Media action failed: '+e.message);}
},true);
document.addEventListener('change',async event=>{if(event.target.id!=='sv7ArtFile')return;const file=event.target.files?.[0];if(!file)return;
 try{sv7PendingArt=await readCover(file);document.getElementById('sv7ArtPreview').innerHTML=`<img class="sv7-art-preview" src="${sv7PendingArt}" alt="Selected song artwork">`;toast('Art prepared. Save the song to keep it.');}catch(e){toast('Artwork error: '+e.message);}event.target.value='';},true);
const sv7DurationListener=async()=>{const q=typeof nowPlaying==='function'?nowPlaying():null,s=q&&state.songs.find(s=>s.id===q.songId),v=s?.versions.find(v=>v.id===(q.versionId||s.activeVersionId));if(!v||v.durationSec||!Number.isFinite(audio.duration)||audio.duration<=0)return;
 v.durationSec=Math.round(audio.duration*100)/100;await storePut('songs',s).catch(console.warn);};
document.getElementById('audioPlayer')?.addEventListener('loadedmetadata',sv7DurationListener);