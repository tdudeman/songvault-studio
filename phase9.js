/* Phase 9 — backup preview, integrity audit, portable catalog export. */
'use strict';
let sv9Report=null, sv9BackupFile=null,sv9Summary=null;
const sv9FileInput=document.createElement('input');sv9FileInput.type='file';sv9FileInput.accept='.zip,.json,application/zip,application/json';sv9FileInput.id='sv9BackupPicker';sv9FileInput.hidden=true;document.body.appendChild(sv9FileInput);
const sv9Bytes=n=>Number.isFinite(n)?(n>1e9?(n/1e9).toFixed(2)+' GB':(n/1e6).toFixed(1)+' MB'):'Unknown';
function sv9GetAudioKeys(){return new Promise((resolve,reject)=>{const t=state.db.transaction('audio','readonly');const r=t.objectStore('audio').getAllKeys();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function sv9Audit(){const referenced=[];for(const s of state.songs)for(const v of (s.versions||[]))if(v.fileName)referenced.push({song:s.title,version:v.label||v.fileName,id:v.id});
 const keys=new Set(await sv9GetAudioKeys());const present=new Set(referenced.map(x=>x.id));
 const missing=referenced.filter(x=>!keys.has(x.id)),orphan=[...keys].filter(k=>!present.has(k));
 const quota=await navigator.storage?.estimate?.().catch(()=>null);
 sv9Report={tracks:state.songs.length,albums:state.albums.length,playlists:state.playlists.length,versionCount:referenced.length,missing,orphan,usage:quota?.usage||0,quota:quota?.quota||0,time:new Date().toLocaleString()};
 if(state.view==='health')render();toast(missing.length?`${missing.length} missing audio files detected.`:'Library health scan complete.');
}
function sv9HealthView(){const r=sv9Report;
 return `${head('PHASE 9','Library health & backups','Check files, preview restores, and export a portable music catalog.')}
 <div class="sv9-panel"><h2>🔎 Storage audit</h2><p>Checks that locally attached audio versions still have corresponding files. It does not modify, delete, or upload anything.</p><button class="btn primary" data-action="sv9-audit">Run library health check</button>
 ${r?`<div class="sv9-summary"><b>Last scan: ${escapeHTML(r.time)}</b><div class="sv9-stats"><span>${r.tracks} songs</span><span>${r.versionCount} audio versions</span><span>${r.missing.length} missing files</span><span>${r.orphan.length} unreferenced blobs</span></div><p>Estimated browser storage: ${sv9Bytes(r.usage)} / ${sv9Bytes(r.quota)}. This is for the entire site's storage, not just songs.</p></div>
 ${r.missing.length?`<div class="sv9-warning"><b>Missing audio:</b><ul>${r.missing.slice(0,35).map(x=>`<li>${escapeHTML(x.song)} — ${escapeHTML(x.version)}</li>`).join('')}</ul>${r.missing.length>35?'<p>More missing versions were found.</p>':''}<p>Restore from a known good full ZIP backup to recover missing audio. Do not delete metadata just because audio is missing.</p></div>`:'<p class="sv9-good">No missing audio references detected in this scan.</p>'}${r.orphan.length?'<p class="smallprint">Unreferenced audio blobs were found. They were not deleted.</p>':''}`:'<p class="smallprint">No audit has been run yet.</p>'}</div>
 <div class="sv9-panel"><h2>📦 Portable backups</h2><p>Download a full library ZIP (metadata + audio), a catalog-only JSON, or a spreadsheet-friendly CSV.</p><div class="inlinebuttons"><button class="btn primary" data-action="export-zip">⇩ Full ZIP backup</button><button class="btn" data-action="export-json">⇩ Metadata JSON</button><button class="btn" data-action="sv9-csv">⇩ Catalog CSV</button><button class="btn" data-action="sv9-pick-backup">↑ Preview a restore</button></div><p class="smallprint">A CSV is for organizing song metadata in Excel/Sheets, not restoring audio. Keep your complete ZIP in a safe location outside SongVault.</p></div>
 <div class="sv9-panel"><h2>🔐 Private by design</h2><p>Your audio, notes, favorites, and artwork stay in this device's browser storage. GitHub Pages only delivers application code. No Suno connection and no multi-device cloud sync.</p></div>`;
}
const sv9NavBase=renderNav;renderNav=function(){sv9NavBase();document.getElementById('desktopNav')?.insertAdjacentHTML('beforeend',`<button class="navbtn ${state.view==='health'?'active':''}" data-action="view" data-view="health"><span class="navico">♡</span>Health</button>`);document.getElementById('mobileNav')?.insertAdjacentHTML('beforeend',`<button class="${state.view==='health'?'active':''}" data-action="view" data-view="health"><b>♡</b>Health</button>`);};
const sv9RenderBase=render;render=function(){sv9RenderBase();if(state.view==='health')document.getElementById('content').innerHTML=sv9HealthView();};
function sv9CSV(){const columns=['Title','Artist','Genre','Subgenre','Album','Status','Kind','Mood','Tags','Favorite','Audio versions','Active version','Duration seconds','Created','Updated','Notes'];
 const rows=state.songs.map(s=>{const v=s.versions?.find(v=>v.id===s.activeVersionId)||s.versions?.[0];return [s.title,s.artist,s.genre,s.subgenre,albumName(s.albumId),s.status,s.kind,s.mood,(s.tags||[]).join('; '),s.favorite?'yes':'no',s.versions?.length||0,v?.label||'',v?.durationSec||'',s.createdAt,s.updatedAt,s.notes]});
 const csv=(s)=>'"'+String(s??'').replace(/"/g,'""').replace(/^[=+\-@\t\r]/,'\'$&')+'"';
 downloadBlob(new Blob(['\ufeff'+[columns,...rows].map(row=>row.map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),`songvault-catalog-${new Date().toISOString().slice(0,10)}.csv`);toast('CSV metadata catalog exported (no audio).');
}
async function sv9InspectBackup(file){if(!file||file.size>10*1024*1024*1024)throw Error('File too large.');let manifest,entries=[];
 if(file.name.toLowerCase().endsWith('.json')){manifest=JSON.parse(await file.text());}
 else{entries=await parseZip(file);const data=entries.find(e=>e.name==='songvault-library.json');if(!data)throw Error('Not a SongVault full ZIP backup.');if(data.blob.size>50*1024*1024)throw Error('Manifest is too large to review.');manifest=JSON.parse(await data.blob.text());}
 if(manifest.format!=='songvault-v1'||!Array.isArray(manifest.songs)||!Array.isArray(manifest.albums))throw Error('Backup format not recognized.');
 if(manifest.songs.some(s=>typeof s.id!=='string'||!Array.isArray(s.versions))||manifest.albums.some(a=>typeof a.id!=='string'))throw Error('Backup contains invalid records.');
 if(new Set(manifest.songs.map(s=>s.id)).size!==manifest.songs.length)throw Error('Duplicate song IDs inside backup.');
 const ids=new Set(manifest.songs.flatMap(s=>s.versions.filter(v=>v.fileName).map(v=>v.id)));const found=new Set(entries.filter(e=>e.name.startsWith('audio/')).map(e=>e.name.slice(6)));
 const absent=[...ids].filter(id=>!found.has(id));const overwrites=manifest.songs.filter(s=>state.songs.some(x=>x.id===s.id)).length;
 const summary={songs:manifest.songs.length,albums:manifest.albums.length,playlists:manifest.playlists?.length||0,audioFiles:found.size,missingAudio:absent.length,overwrites,full:!!entries.length,filename:file.name,date:manifest.exportedAt||'unknown'};
 return summary;
}
function sv9PreviewDialog(summary){const w=summary;
 modal('Review backup before restore',`<div class="sv9-preview"><p><b>File:</b> ${escapeHTML(w.filename)}</p><div class="sv9-stats"><span>${w.songs} songs</span><span>${w.albums} albums</span><span>${w.playlists} playlists</span><span>${w.audioFiles} audio files</span></div><p><b>Backup date:</b> ${escapeHTML(String(w.date))}</p>${!w.full?'<p class="sv9-warning">Metadata-only JSON: no audio files are included.</p>':''}${w.missingAudio?`<p class="sv9-warning">${w.missingAudio} version references lack audio in this backup. If this is metadata-only, that is expected.</p>`:''}${w.overwrites?`<p class="sv9-warning">${w.overwrites} existing song records have matching IDs and will be overwritten. Other songs are retained.</p>`:''}<p>The restore adds or overwrites matching IDs. It does not delete other library records, and it cannot be automatically undone. Keep a current full ZIP backup before restoring.</p></div>`,`<button class="btn minor" data-action="sv9-cancel-restore">Cancel</button><button class="btn primary" data-action="sv9-confirm-restore">I understand · Restore</button>`);
}
const sv9Actions=new Set(['sv9-audit','sv9-csv','sv9-pick-backup','sv9-confirm-restore','sv9-cancel-restore','import-backup']);
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||!sv9Actions.has(el.dataset.action))return;e.preventDefault();e.stopImmediatePropagation();
 try{switch(el.dataset.action){
 case 'sv9-audit':await sv9Audit();break;
 case 'sv9-csv':sv9CSV();break;
 case 'sv9-pick-backup':case 'import-backup':sv9FileInput.click();break;
 case 'sv9-cancel-restore':sv9BackupFile=null;sv9Summary=null;closeModal();break;
 case 'sv9-confirm-restore':if(!sv9BackupFile)return toast('No backup selected.');{const file=sv9BackupFile;sv9BackupFile=null;sv9Summary=null;closeModal();await restoreBackup(file);}break;
 }}catch(err){console.error(err);toast('Backup action failed: '+err.message);}
},true);
sv9FileInput.addEventListener('change',async()=>{const file=sv9FileInput.files?.[0];sv9FileInput.value='';if(!file)return;
 try{const summary=await sv9InspectBackup(file);sv9BackupFile=file;sv9Summary=summary;sv9PreviewDialog(summary);}catch(e){sv9BackupFile=null;console.error(e);toast('Backup preview failed: '+e.message);}
});