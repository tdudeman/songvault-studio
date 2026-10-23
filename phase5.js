/* SongVault Studio Phase 5 — songwriting workbench, offline-only and backward-compatible. */
'use strict';
(() => {
const PRESETS = [
  {id:'neon',label:'Neon Synth-Pop',icon:'⚡',genre:'Electronic',subgenre:'Synth-Pop',mood:'Energetic, nostalgic, futuristic',bpm:128,musicalKey:'A Minor',style:'Energetic melodic synth-pop, driving drum machine, deep pulsing analog bass, sparkling arpeggios, atmospheric verses, soaring chorus, explosive electronic drops, polished mix.',voice:'Powerful melodic lead vocal; tight doubled chorus harmonies',excludedStyles:'Acoustic folk, muddy percussion'},
  {id:'carousel',label:'Haunted Carousel',icon:'🎠',genre:'Cinematic',subgenre:'Dark Cabaret',mood:'Eerie, bittersweet, hypnotic',bpm:106,musicalKey:'D Minor',style:'Haunting antique carousel waltz with music-box bells, detuned calliope, delicate strings, crisp electronic pulse and memorable looping hook; intimate verses rising into a striking chorus.',voice:'Expressive female lead with delicate, ghostly doubles',excludedStyles:'Harsh screaming, abrasive distortion'},
  {id:'starlight',label:'Dreamy Electropop',icon:'✨',genre:'Electronic',subgenre:'Dream Pop / Electropop',mood:'Hopeful, wistful, starry',bpm:112,musicalKey:'C Major',style:'Bright dreamy electropop, shimmering plucked synths, warm pads, light four-on-the-floor drums, buoyant melodies, glistening arpeggios and a wide euphoric chorus.',voice:'Soft, clear, melodic lead; breathy harmonies',excludedStyles:'Aggressive trap, heavy metal'},
  {id:'swing',label:'Irish Swing',icon:'🎷',genre:'Jazz',subgenre:'Vintage Swing',mood:'Upbeat, playful, danceable',bpm:154,musicalKey:'G Major',style:'Lively old-time swing, walking upright bass, brushed-to-snappy drums, brass stabs, warm piano, gypsy-jazz guitar, foot-tapping chorus with vintage recording warmth.',voice:'Cheerful Irish-accented lead, conversational phrasing',excludedStyles:'Modern EDM, pitch-corrected trap vocals'},
  {id:'ballad',label:'Cinematic Sad Ballad',icon:'🌧',genre:'Pop',subgenre:'Cinematic Ballad',mood:'Heartbroken, reflective, atmospheric',bpm:78,musicalKey:'E Minor',style:'Emotional slow pop ballad, intimate piano, airy pads, sparse electronic percussion, gradual string swell, heartbreaking melodic hook and a restrained final chorus.',voice:'Vulnerable female lead, natural phrasing, expressive sustained notes',excludedStyles:'Comedy, aggressive dance drop'},
  {id:'kpop',label:'Melodic K-Pop',icon:'🌸',genre:'K-Pop',subgenre:'Melodic Dance Pop',mood:'Catchy, youthful, bittersweet',bpm:118,musicalKey:'F Major',style:'Modern melodic K-pop, lush synth chords, elastic bass, crisp pop drums, playful hooks, polished vocal stacks and a chorus that emphasizes singing over rap.',voice:'Expressive female lead, layered harmonies, occasional light rhythmic phrases',excludedStyles:'Long rap verses, harsh growls'}
];
const BY_ID = Object.fromEntries(PRESETS.map(p=>[p.id,p]));
const KEYS = ['','C Major','G Major','D Major','A Major','E Major','B Major','F# Major','C# Major','F Major','Bb Major','Eb Major','Ab Major','Db Major','Gb Major','Cb Major','A Minor','E Minor','B Minor','F# Minor','C# Minor','G# Minor','D# Minor','A# Minor','D Minor','G Minor','C Minor','F Minor','Bb Minor','Eb Minor','Ab Minor'];
const SECTIONS = ['[Intro]','[Verse 1]','[Pre-Chorus]','[Chorus]','[Verse 2]','[Bridge]','[Instrumental Break]','[Final Chorus]','[Outro]'];
const by = id => document.getElementById(id);
const safe = v => escapeHTML(v ?? '');
const value = id => by(id)?.value?.trim() || '';
const editorVisible = () => !!document.querySelector('#shade.open #songForm');
const formIsSpeech = () => state.modalKind === 'speech';
function styleText(s){
 const tags=[];
 if(s.genre)tags.push([s.genre,s.subgenre].filter(Boolean).join(' / '));
 if(s.bpm)tags.push(`${s.bpm} BPM`);
 if(s.musicalKey)tags.push(s.musicalKey);
 if(s.timeSignature&&s.timeSignature!=='4/4')tags.push(`${s.timeSignature} time signature`);
 if(s.mood)tags.push(`Mood: ${s.mood}`);
 if(s.style)tags.push(s.style);
 if(s.instrumental)tags.push('Instrumental only, no singing or spoken vocals');
 else if(s.voice)tags.push(`Vocals: ${s.voice}`);
 if(s.excludedStyles)tags.push(`Avoid: ${s.excludedStyles}`);
 return tags.join('. ').replace(/\.\./g,'.').trim();
}
function songPack(s){
 if(s.kind==='speech')return `TITLE: ${s.title||'Untitled'}\n\nSCRIPT:\n${s.script||''}\n\nTONE:\n${s.tone||''}\n\nBACKING MUSIC:\n${s.backingMusic||''}\n\nNOTES:\n${s.notes||''}`;
 return `TITLE: ${s.title||'Untitled'}\nMODE: ${s.instrumental?'Instrumental':'Song with vocals'}\n\nSTYLES:\n${styleText(s)}\n\n${s.instrumental?'INSTRUMENTAL: No lyrics or vocals.':`LYRICS:\n${s.lyrics||''}`}\n\nVOICE:\n${s.instrumental?'None':(s.voice||'Unspecified')}\n\nREFERENCE AUDIO NOTES:\n${s.audioNotes||''}`;
}
function presetCard(p){return `<article class="sv5-preset"><div class="sv5-preset-icon">${p.icon}</div><div class="sv5-preset-info"><b>${safe(p.label)}</b><span>${safe(p.subgenre)} · ${p.bpm} BPM</span></div><button class="btn small" data-action="sv5-start-preset" data-id="${p.id}">Use</button></article>`;}
const previousCreateView=createView;
createView=function(){const original=previousCreateView();return `<section class="sv5-intro">${head('SONG CREATION','Creation Studio','Build and save vocal, instrumental, and speech projects. Copy individual fields into Suno when ready.',`<div class="inlinebuttons"><button class="btn primary" data-action="new-song">＋ Song</button><button class="btn minor" data-action="new-speech">🎙 Speech</button></div>`)}</section><div class="callout"><span>🔒</span><div><b>Manual Suno workflow.</b> No Suno account connection or remote generation is active. Drafts and imported audio remain in this device’s library.</div></div><div class="sv5-sectionhead"><div><h2>Start from a sound</h2><p>Apply a preset, then make it yours. None of these changes affect an existing song unless you save it.</p></div></div><div class="sv5-preset-grid">${PRESETS.map(presetCard).join('')}</div><div class="sv5-sectionhead"><h2>Recent drafts</h2><span>${state.songs.filter(s=>s.status==='draft').length} drafts</span></div><div class="songlist">${[...state.songs].filter(s=>s.status==='draft').sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')).slice(0,10).map(songCard).join('')||'<div class="empty"><h3>No drafts yet</h3><p>Start with a preset or create an empty song or speech draft.</p></div>'}</div><div class="advanced"><b>Workflow:</b> Save your draft, copy Lyrics / Styles / Voice separately, then use <a href="https://suno.com" target="_blank" rel="noopener noreferrer">Suno’s creation page</a>. Templates are starting points, not guarantees of a particular output.</div>`;};
const previousFields=fieldsFromEditor;
fieldsFromEditor=function(){const d=previousFields();if(formIsSpeech())return d;return {...d,instrumental:!!by('sv5Instrumental')?.checked,bpm:Number(value('sv5Bpm'))||'',musicalKey:value('sv5Key'),timeSignature:value('sv5TimeSig')||'4/4',excludedStyles:value('sv5Exclude')};};
const previousSongEditor=songEditor;
songEditor=function(id=null,kind='song'){
 previousSongEditor(id,kind);
 const s=id?state.songs.find(v=>v.id===id):null;
 const fields=document.querySelector('#songForm .fields');if(!fields)return;
 if(state.modalKind==='speech'){
  const panel=document.createElement('section');panel.className='sv5-editor-pane';panel.innerHTML=`<div class="sv5-editor-title"><h3>🎙 Speech creation toolkit</h3><p>Write or paste your script, then copy each field into Suno’s Speech view.</p></div><div class="sv5-toolbar"><button type="button" class="btn small" data-action="sv5-copy" data-field="script">Copy script</button><button type="button" class="btn small" data-action="sv5-copy" data-field="tone">Copy tone</button><button type="button" class="btn small" data-action="sv5-copy" data-field="backing">Copy backing music</button><button type="button" class="btn small" data-action="sv5-copy" data-field="pack">Copy complete brief</button></div><div class="sv5-count" id="sv5Count">0 characters</div>`;
  fields.parentElement.insertBefore(panel,fields);
 }else{
  const panel=document.createElement('section');panel.className='sv5-editor-pane';panel.innerHTML=`<div class="sv5-editor-title"><h3>🎚 Creation controls</h3><p>Set your arrangement, use a preset, and copy fields separately.</p></div><div class="sv5-toprow"><div class="field"><label for="sv5Preset">Style preset</label><select id="sv5Preset"><option value="">Choose a starting sound…</option>${PRESETS.map(p=>`<option value="${p.id}">${safe(p.label)}</option>`).join('')}</select></div><button type="button" class="btn small" data-action="sv5-apply-preset">Apply preset</button></div><label class="sv5-toggle"><input type="checkbox" id="sv5Instrumental" ${s?.instrumental?'checked':''}> <span><b>Instrumental only</b><small>Exclude sung or spoken vocals from the creation instructions. Existing lyrics stay saved.</small></span></label><div class="sv5-fields"><div class="field"><label for="sv5Bpm">Tempo (BPM)</label><input type="number" id="sv5Bpm" min="40" max="240" step="1" inputmode="numeric" placeholder="e.g. 128" value="${safe(s?.bpm||'')}"></div><div class="field"><label for="sv5Key">Musical key (optional)</label><select id="sv5Key">${KEYS.map(k=>`<option value="${safe(k)}" ${k===(s?.musicalKey||'')?'selected':''}>${safe(k||'Not specified')}</option>`).join('')}</select></div><div class="field"><label for="sv5TimeSig">Time signature</label><select id="sv5TimeSig">${['4/4','3/4','6/8','5/4','7/8'].map(k=>`<option value="${k}" ${k===(s?.timeSignature||'4/4')?'selected':''}>${k}</option>`).join('')}</select></div><div class="field"><label for="sv5Exclude">Avoid / exclude styles</label><input id="sv5Exclude" placeholder="e.g. screaming, acoustic guitar" value="${safe(s?.excludedStyles||'')}"></div></div><div class="sv5-toolbar"><button type="button" class="btn small" data-action="sv5-copy" data-field="lyrics">Copy lyrics</button><button type="button" class="btn small" data-action="sv5-copy" data-field="styles">Copy styles</button><button type="button" class="btn small" data-action="sv5-copy" data-field="voice">Copy voice</button><button type="button" class="btn small" data-action="sv5-copy" data-field="pack">Copy full brief</button></div><p class="sv5-count" id="sv5Count">Lyrics: 0 characters</p><div class="sv5-lyric-tools"><b>Insert section</b><div>${SECTIONS.map((label,i)=>`<button type="button" class="btn small" data-action="sv5-insert-section" data-i="${i}">${safe(label.replace(/[\[\]]/g,''))}</button>`).join('')}</div></div>`;
  fields.parentElement.insertBefore(panel,fields);
  syncInstrumental();
 }
 const foot=by('modalFoot'); if(foot)foot.insertAdjacentHTML('afterbegin',`<button class="btn minor" type="button" data-action="sv5-export-txt">⇩ Brief .txt</button>${s?`<button class="btn minor" type="button" data-action="sv5-duplicate" data-id="${safe(s.id)}">Duplicate draft</button>`:''}`);
 refreshCounts();
};
function syncInstrumental(){
 const checked=!!by('sv5Instrumental')?.checked;
 for(const id of ['fLyrics','fVoice']){const el=by(id);const field=el?.closest('.field');if(field){field.classList.toggle('sv5-muted',checked);field.title=checked?'Saved for later but omitted from an instrumental brief':'';}}
}
function refreshCounts(){const el=by('sv5Count');if(!el)return;
 if(formIsSpeech())el.textContent=`Script: ${value('fScript').length.toLocaleString()} characters`;
 else el.textContent=`Lyrics: ${value('fLyrics').length.toLocaleString()} characters · Styles: ${styleText(fieldsFromEditor()).length.toLocaleString()} characters`;
}
function applyPreset(id){const preset=BY_ID[id];if(!preset)return;
 const hasData=['fStyle','fVoice','fGenre','fSubgenre','fMood'].some(k=>!!value(k));
 if(hasData&&!confirm('Apply this preset? It will replace the current style, genre, mood, and voice fields, but not your lyrics or title.'))return;
 for(const [key,v] of [['fGenre',preset.genre],['fSubgenre',preset.subgenre],['fMood',preset.mood],['fStyle',preset.style],['fVoice',preset.voice],['sv5Bpm',preset.bpm],['sv5Key',preset.musicalKey],['sv5Exclude',preset.excludedStyles]]){if(by(key))by(key).value=v;}
 if(by('sv5Instrumental'))by('sv5Instrumental').checked=false;
 syncInstrumental();refreshCounts();toast(`Applied ${preset.label}. Lyrics are unchanged.`);
}
function currentDraft(){return {...fieldsFromEditor(),id:state.editId||'',title:value('fTitle')||'Untitled',kind:state.modalKind};}
function fieldText(s,field){switch(field){
 case 'lyrics':return s.instrumental?'Instrumental only; no lyrics.':s.lyrics||'';
 case 'styles':return styleText(s);
 case 'voice':return s.instrumental?'Instrumental only — no vocals':s.voice||'';
 case 'script':return s.script||'';
 case 'tone':return s.tone||'';
 case 'backing':return s.backingMusic||'';
 case 'pack':return songPack(s);
 default:return '';
}}
function saveTextFile(contents,name){const file=new Blob([contents],{type:'text/plain;charset=utf-8'});downloadBlob(file,`${(name||'songvault-draft').replace(/[^a-z0-9-_]+/gi,'-').slice(0,90)}-brief.txt`);}
async function duplicateDraft(id){const s=state.songs.find(x=>x.id===id);if(!s)return toast('Song no longer exists.');
 // Do not duplicate imported audio IDs: the copy is a metadata-only draft.
 const copy={...s,id:uuid(),title:`${s.title} (copy)`,status:'draft',versions:[],activeVersionId:'',createdAt:now(),updatedAt:now()};
 await storePut('songs',copy);await load();songEditor(copy.id);toast('Created an independent draft without audio files.');
}
const previousPrompt=promptFor;
promptFor=function(s){return s? songPack(s) : previousPrompt(s);};
// Capture these actions ahead of the legacy delegated click handler.
const OUR_ACTIONS=new Set(['sv5-start-preset','sv5-apply-preset','sv5-insert-section','sv5-copy','sv5-export-txt','sv5-duplicate']);
document.addEventListener('click',async event=>{
 const el=event.target.closest('[data-action]');if(!el||!OUR_ACTIONS.has(el.dataset.action))return;
 event.preventDefault();event.stopImmediatePropagation();
 try{
  if(el.dataset.action==='sv5-start-preset'){songEditor();by('sv5Preset').value=el.dataset.id;applyPreset(el.dataset.id);}
  else if(el.dataset.action==='sv5-apply-preset'){const id=value('sv5Preset');if(!id)return toast('Choose a preset first.');applyPreset(id);}
  else if(el.dataset.action==='sv5-insert-section'){
   const ta=by('fLyrics');if(!ta)return;const label=SECTIONS[Number(el.dataset.i)];if(!label)return;
   const at=ta.selectionStart??ta.value.length,after=ta.selectionEnd??at;
   const before=ta.value.slice(0,at),suffix=ta.value.slice(after);
   const addition=`${before&&!before.endsWith('\n')?'\n':''}${label}\n\n`;
   ta.value=before+addition+suffix;ta.focus();ta.setSelectionRange(before.length+addition.length,before.length+addition.length);refreshCounts();
  }else if(el.dataset.action==='sv5-copy'){
   const s=editorVisible()?currentDraft():state.songs.find(x=>x.id===el.dataset.id);
   if(!s)return toast('Open a draft first.');const txt=fieldText(s,el.dataset.field);
   if(!txt.trim())return toast('Nothing to copy in that field.');await copyText(txt);
  }else if(el.dataset.action==='sv5-export-txt'){
   const s=editorVisible()?currentDraft():state.songs.find(x=>x.id===el.dataset.id);
   if(s)saveTextFile(songPack(s),s.title);
  }else if(el.dataset.action==='sv5-duplicate')await duplicateDraft(el.dataset.id);
 }catch(err){console.error(err);toast('Creation tool error: '+err.message);}
},true);
document.addEventListener('input',e=>{if(editorVisible() && e.target.closest('#songForm'))refreshCounts();},true);
document.addEventListener('change',e=>{if(e.target.id==='sv5Instrumental'){syncInstrumental();refreshCounts();}},true);
})();