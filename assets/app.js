const state={specimens:[],category:'全部',query:''};
const $=s=>document.querySelector(s);
const grid=$('#specimenGrid'),dialog=$('#specimenDialog'),content=$('#dialogContent');
const rarityRank={'宇宙唯一':6,'神话':5,'史诗':4,'限定':3,'稀有':2,'普通':1};
const quotes=['“可猫可猪；若必须二选一，仍然是猪。”','“爸爸爸爸——”','“咪————”','“今天已经是明晚了。”','“蜗牛胜出，芝士沉默。”','“本猪合格，可以继续抱。”','“一只宇宙无敌第一可爱萌猪诞生惹。”'];

async function init(){
  try{state.specimens=await fetch('data/specimens.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()})}
  catch(e){grid.innerHTML='<p>档案数据加载失败。请通过 HTTP 服务器访问本站。</p>';return}
  buildFilters();render();
  $('#countAll').textContent=state.specimens.length;
  $('#countMythic').textContent=state.specimens.filter(x=>x.rarity==='神话').length;
  $('#updatedAt').textContent=new Intl.DateTimeFormat('zh-CN',{dateStyle:'long'}).format(new Date());
}
function buildFilters(){
  const cats=['全部',...new Set(state.specimens.map(x=>x.category))];
  $('#filters').innerHTML=cats.map((c,i)=>`<button class="filter ${i===0?'active':''}" data-category="${c}">${c}</button>`).join('');
}
function render(){
  const q=state.query.toLowerCase().trim();
  const list=state.specimens.filter(x=>(state.category==='全部'||x.category===state.category)&&(!q||[x.name,x.latin,x.description,x.habitat,x.status,...x.tags,...x.abilities].join(' ').toLowerCase().includes(q))).sort((a,b)=>(rarityRank[b.rarity]||0)-(rarityRank[a.rarity]||0));
  grid.innerHTML=list.map(card).join('');
  $('#resultCount').textContent=`DISPLAYING ${list.length} / ${state.specimens.length} RECORDS`;
  $('#emptyState').hidden=list.length!==0;
  grid.querySelectorAll('.card').forEach(btn=>btn.addEventListener('click',()=>openSpecimen(btn.dataset.id)));
}
function card(x){return `<button class="card" data-id="${x.id}"><span class="card-top"><span>${x.number}</span><span class="rarity">${x.rarity}</span></span><span class="card-art"><span class="mini-pig" style="--pig-color:${x.color}">${x.number.replace('081-','')}</span></span><h3>${x.name}</h3><span class="latin">${x.latin}</span><p class="desc">${x.description}</p><span class="tag-row">${x.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</span></button>`}
function openSpecimen(id){
  const x=state.specimens.find(v=>v.id===id);if(!x)return;
  content.innerHTML=`<section class="detail-hero"><span class="detail-number">ARCHIVE ${x.id} · ${x.rarity}</span><h2>${x.name}</h2><span class="latin">${x.latin}</span></section><section class="detail-body"><p>${x.description}</p><div class="facts"><div class="fact"><small>首次观测</small><b>${x.firstObserved}</b></div><div class="fact"><small>主要栖息地</small><b>${x.habitat}</b></div><div class="fact"><small>当前状态</small><b>${x.status}</b></div><div class="fact"><small>档案分类</small><b>${x.category}</b></div></div><div class="abilities"><h3>KNOWN ABILITIES · 已知能力</h3><ul>${x.abilities.map(a=>`<li>${a}</li>`).join('')}</ul></div><div class="tag-row">${x.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></section>`;
  dialog.showModal();
}
function randomPig(){const list=state.specimens;if(!list.length)return;openSpecimen(list[Math.floor(Math.random()*list.length)].id)}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200)}
$('#filters').addEventListener('click',e=>{if(!e.target.matches('.filter'))return;state.category=e.target.dataset.category;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===e.target));render()});
$('#searchInput').addEventListener('input',e=>{state.query=e.target.value;render()});
$('#resetFilters').addEventListener('click',()=>{state.category='全部';state.query='';$('#searchInput').value='';document.querySelectorAll('.filter').forEach((x,i)=>x.classList.toggle('active',i===0));render()});
$('#randomPig').addEventListener('click',randomPig);$('#callPig').addEventListener('click',()=>toast('捕获回应：咪———— ୯(*´ω｀*)୬'));$('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
$('#pigQuote').textContent=quotes[Math.floor(Math.random()*quotes.length)];
init();
