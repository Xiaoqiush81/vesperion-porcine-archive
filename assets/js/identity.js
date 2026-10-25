import { escapeHtml as escape } from './specimen-art.js?v=20261015-specimens-51';
import { QUESTION_BANK } from './identity-data.js?v=20261025-expanded-1';
import { drawQuestionSet, matchSpecimen } from './identity-engine.js?v=20261025-expanded-1';
import { addIdentityRecord, loadIdentityHistory, loadLastQuestionIds, saveLastQuestionIds } from './identity-storage.js?v=20261020-bank-1';

const artworkOf = specimen => specimen.artwork || `assets/cards/${specimen.id.toLowerCase()}.webp`;

async function downloadCertificate(specimen, toast) {
  const canvas=document.createElement('canvas'); canvas.width=1080; canvas.height=1350;
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#10263d'; ctx.fillRect(0,0,1080,1350); ctx.strokeStyle='#cfb98f'; ctx.lineWidth=2; ctx.strokeRect(42,42,996,1266); ctx.strokeRect(58,58,964,1234);
  const image=new Image(); image.src=artworkOf(specimen); try{await image.decode();ctx.drawImage(image,96,164,440,660);}catch{/* text fallback */}
  const line=(text,x,y,width,step,font)=>{ctx.font=font;let part='';for(const char of [...text]){if(ctx.measureText(part+char).width>width){ctx.fillText(part,x,y);part=char;y+=step;}else part+=char;}ctx.fillText(part,x,y);return y;};
  ctx.fillStyle='#cfb98f';ctx.font='26px serif';ctx.fillText('VESPERION SPECIES IDENTIFICATION OFFICE',96,112);
  ctx.fillStyle='#f3efe5';ctx.font='54px serif';ctx.fillText('猪种鉴定身份牌',586,240);ctx.fillStyle='#cfb98f';ctx.font='24px serif';ctx.fillText(`ARCHIVE ${specimen.id} · ${specimen.rarity}`,586,300);
  ctx.fillStyle='#f3efe5';let y=line(specimen.name,586,380,390,62,'bold 46px serif');ctx.fillStyle='#c2c8cb';ctx.font='24px serif';ctx.fillText(specimen.latin,586,y+46);ctx.fillStyle='#f3efe5';line(specimen.description,586,y+120,390,42,'25px serif');
  ctx.fillStyle='#cfb98f';ctx.font='22px serif';ctx.fillText('OFFICIAL FINDING · 本次正式鉴定',96,900);ctx.fillStyle='#f3efe5';ctx.font='bold 48px serif';ctx.fillText('此猪身份成立，萌度合法。',96,970);ctx.fillStyle='#c2c8cb';ctx.font='24px serif';ctx.fillText(`主要栖息地  ${specimen.habitat}`,96,1040);ctx.fillText(`当前状态    ${specimen.status}`,96,1090);ctx.fillText(`签发日期    ${new Intl.DateTimeFormat('zh-CN',{dateStyle:'long'}).format(new Date())}`,96,1140);ctx.fillStyle='#cfb98f';ctx.font='bold 72px serif';ctx.textAlign='right';ctx.fillText('081',984,1240);
  const link=document.createElement('a');link.download=`PIGDEX-081-${specimen.id}.png`;link.href=canvas.toDataURL('image/png');link.click();toast('身份牌已经签发。');
}

export function createIdentityOffice(specimens, toast=()=>{}) {
  const ids=['identityIntro','identityQuiz','identityResult','identityOptions','identityHistoryList','identityHistoryCount','identityStep','identityProgressBar','identityKicker','identityQuestion','identityBack','startIdentity'];
  const el=Object.fromEntries(ids.map(id=>[id,document.querySelector(`#${id}`)]));
  const byId=new Map(specimens.map(item=>[item.id,item])); let questions=[],answers=[],step=0;

  function renderHistory(history=loadIdentityHistory()) {
    el.identityHistoryCount.textContent=history.length;
    el.identityHistoryList.innerHTML=history.length?history.map(item=>{const specimen=byId.get(item.id);if(!specimen)return'';const date=new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(item.at));return `<article><img src="${artworkOf(specimen)}" alt="" width="80" height="120" loading="lazy"><div><time>${escape(date)}</time><b>${escape(item.name)}</b><small>${escape(item.rarity)} · ${escape(item.id)}</small></div></article>`;}).join(''):'<p class="history-empty">尚无档案。完成第一次鉴定后，签发记录会保存在这台设备上。</p>';
  }
  function showQuestion(){const current=questions[step];el.identityStep.textContent=`OBSERVATION ${String(step+1).padStart(2,'0')} / ${String(questions.length).padStart(2,'0')}`;el.identityProgressBar.style.width=`${(step+1)/questions.length*100}%`;el.identityKicker.textContent=current.kicker;el.identityQuestion.textContent=current.question;el.identityBack.hidden=step===0;el.identityOptions.innerHTML=current.options.map(([label],index)=>`<button type="button" data-option="${index}"><span>0${index+1}</span><b>${escape(label)}</b></button>`).join('');}
  async function share(specimen){const data={title:'维斯珀里昂猪种鉴定',text:`维斯珀里昂猪种鉴定结果：${specimen.name}（${specimen.rarity}）\n${specimen.description}\n#PIGDEX081`,url:location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(`${data.text}\n${data.url}`);toast('鉴定结果已复制。');}}catch(error){if(error?.name!=='AbortError')toast('分享没有成功。');}}
  function showResult(specimen){el.identityQuiz.hidden=true;el.identityResult.hidden=false;el.identityResult.innerHTML=`<div class="identity-certificate"><div class="certificate-art"><img src="${artworkOf(specimen)}" alt="${escape(specimen.name)}" width="640" height="960"></div><div class="certificate-copy"><p class="eyebrow">OFFICIAL IDENTIFICATION · ${escape(specimen.id)}</p><small>本次鉴定结果</small><h3>${escape(specimen.name)}</h3><em>${escape(specimen.latin)}</em><p>${escape(specimen.description)}</p><dl><div><dt>稀有度</dt><dd>${escape(specimen.rarity)}</dd></div><div><dt>当前状态</dt><dd>${escape(specimen.status)}</dd></div><div><dt>主要栖息地</dt><dd>${escape(specimen.habitat)}</dd></div></dl><p class="certificate-verdict">经鉴定：此猪身份成立，萌度合法；准予继续在维斯珀里昂宅邸自由活动。</p><div class="certificate-actions"><button class="primary" data-action="download">保存身份牌</button><button class="secondary" data-action="share">分享结果</button><button class="secondary" data-action="restart">换一组题重新鉴定</button></div></div></div>`;el.identityResult.querySelector('[data-action="download"]').addEventListener('click',()=>downloadCertificate(specimen,toast));el.identityResult.querySelector('[data-action="share"]').addEventListener('click',()=>share(specimen));el.identityResult.querySelector('[data-action="restart"]').addEventListener('click',start);renderHistory(addIdentityRecord(specimen).history);}
  function start(){questions=drawQuestionSet(QUESTION_BANK,loadLastQuestionIds());saveLastQuestionIds(questions.map(item=>item.id));answers=[];step=0;el.identityIntro.hidden=true;el.identityResult.hidden=true;el.identityQuiz.hidden=false;showQuestion();}
  el.identityOptions.addEventListener('click',event=>{const button=event.target.closest('[data-option]');if(!button)return;answers[step]=questions[step].options[Number(button.dataset.option)][1];if(step<questions.length-1){step+=1;showQuestion();}else showResult(matchSpecimen(answers,specimens));});
  el.identityBack.addEventListener('click',()=>{if(step>0){step-=1;answers=answers.slice(0,step);showQuestion();}});el.startIdentity.addEventListener('click',start);renderHistory();
}
