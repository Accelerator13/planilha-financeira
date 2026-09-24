const CATS=["Alimentação","Moradia","Transporte","Saúde","Lazer","Educação","Salário","Outros"];
const CORES=["#0f6e8c","#e0a030","#7a5cc4","#c4433a","#1a8a55","#d16aa0","#5d6b78","#8a6d3b"];
const $=id=>document.getElementById(id);
const brl=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let dados=[],editId=null;
try{dados=JSON.parse(localStorage.getItem("planilha_fin")||"[]");if(!Array.isArray(dados))dados=[]}catch(e){dados=[]}
function salvar(){try{localStorage.setItem("planilha_fin",JSON.stringify(dados))}catch(e){}}
const mesDe=d=>d.slice(0,7);
const nomeMes=m=>{const[a,n]=m.split("-");return new Date(a,n-1,1).toLocaleDateString("pt-BR",{month:"short",year:"numeric"})};
const hoje=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};

function opts(sel,list,extra){sel.innerHTML=(extra||"")+list.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}
opts($("cat"),CATS);
opts($("fCat"),CATS,'<option value="">Todas</option>');
$("data").value=hoje();

function meses(){
  const set=new Set(dados.map(l=>mesDe(l.data)));set.add(mesDe(hoje()));
  return [...set].sort().reverse();
}
function atualizaMeses(){
  const atual=$("fMes").value||"";
  $("fMes").innerHTML='<option value="">Todos</option>'+meses().map(m=>`<option value="${m}">${nomeMes(m)}</option>`).join("");
  $("fMes").value=[...$("fMes").options].some(o=>o.value===atual)?atual:"";
}
function filtrados(){
  const m=$("fMes").value,c=$("fCat").value;
  return dados.filter(l=>(!m||mesDe(l.data)===m)&&(!c||l.cat===c)).sort((a,b)=>b.data.localeCompare(a.data));
}
function render(){
  atualizaMeses();
  const lista=filtrados();
  let rec=0,des=0;
  lista.forEach(l=>l.tipo==="R"?rec+=l.valor:des+=l.valor);
  $("tIn").textContent=brl(rec);$("tOut").textContent=brl(des);
  const s=rec-des;$("tSal").textContent=brl(s);$("tSal").className=s>=0?"in":"out";
  $("vazio").hidden=lista.length>0;
  $("corpo").innerHTML=lista.map(l=>`<tr><td>${l.data.split("-").reverse().join("/")}</td><td>${esc(l.desc)}</td><td>${esc(l.cat)}</td>
  <td class="v ${l.tipo==="R"?"in":"out"}">${l.tipo==="R"?"+":"−"} ${brl(l.valor)}</td>
  <td class="a"><button class="mini" data-e="${l.id}">Editar</button> <button class="mini del" data-x="${l.id}">Excluir</button></td></tr>`).join("");
  graficos(lista);
}
function graficos(lista){
  const por={};lista.filter(l=>l.tipo==="D").forEach(l=>por[l.cat]=(por[l.cat]||0)+l.valor);
  const ent=Object.entries(por).sort((a,b)=>b[1]-a[1]),tot=ent.reduce((s,e)=>s+e[1],0);
  if(!tot){$("donut").style.background="var(--line)";$("leg").innerHTML='<li>Sem despesas no filtro.</li>'}
  else{
    let acc=0;const seg=[];
    ent.forEach(([c,v],i)=>{const a=acc/tot*100;acc+=v;seg.push(`${CORES[CATS.indexOf(c)%CORES.length]} ${a}% ${acc/tot*100}%`)});
    $("donut").style.background=`conic-gradient(${seg.join(",")})`;
    $("leg").innerHTML=ent.map(([c,v])=>`<li><i style="background:${CORES[CATS.indexOf(c)%CORES.length]}"></i>${esc(c)}<span>${(v/tot*100).toFixed(0)}% · ${brl(v)}</span></li>`).join("");
  }
  const c=$("fCat").value,ult=[];const d=new Date();d.setDate(1);
  for(let i=5;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);ult.push(x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0"))}
  const soma=ult.map(m=>{let r=0,dd=0;dados.filter(l=>mesDe(l.data)===m&&(!c||l.cat===c)).forEach(l=>l.tipo==="R"?r+=l.valor:dd+=l.valor);return{m,r,dd}});
  const max=Math.max(1,...soma.map(s=>Math.max(s.r,s.dd)));
  $("bars").innerHTML=soma.map(s=>`<div class="col"><div class="pair"><i style="background:var(--in);height:${s.r/max*100}%" title="Receitas ${brl(s.r)}"></i><i style="background:var(--out);height:${s.dd/max*100}%" title="Despesas ${brl(s.dd)}"></i></div><small>${nomeMes(s.m).replace(" de ","/").replace(".","")}</small></div>`).join("");
}
function limpaForm(){editId=null;$("f").reset();$("data").value=hoje();$("fTitulo").textContent="Novo lançamento";$("salvar").textContent="Adicionar";$("cancelar").hidden=true}
$("f").addEventListener("submit",e=>{
  e.preventDefault();
  const v=parseFloat($("valor").value);
  if(!(v>0)||!$("desc").value.trim())return;
  const item={id:editId||Date.now(),data:$("data").value,desc:$("desc").value.trim(),cat:$("cat").value,tipo:$("tipo").value,valor:Math.round(v*100)/100};
  if(editId)dados=dados.map(l=>l.id===editId?item:l);else dados.push(item);
  salvar();limpaForm();render();
});
$("cancelar").onclick=limpaForm;
$("corpo").addEventListener("click",e=>{
  const ed=e.target.dataset.e,ex=e.target.dataset.x;
  if(ex){if(confirm("Excluir este lançamento?")){dados=dados.filter(l=>String(l.id)!==ex);salvar();render()}}
  if(ed){const l=dados.find(l=>String(l.id)===ed);if(!l)return;editId=l.id;
    $("data").value=l.data;$("desc").value=l.desc;$("cat").value=l.cat;$("tipo").value=l.tipo;$("valor").value=l.valor;
    $("fTitulo").textContent="Editar lançamento";$("salvar").textContent="Salvar alterações";$("cancelar").hidden=false;$("desc").focus();window.scrollTo({top:0,behavior:"smooth"})}
});
$("fMes").onchange=$("fCat").onchange=render;
$("csv").onclick=()=>{
  const lista=filtrados();if(!lista.length){alert("Não há lançamentos para exportar.");return}
  const q=s=>'"'+String(s).replace(/"/g,'""')+'"';
  const linhas=["Data;Descrição;Categoria;Tipo;Valor"].concat(lista.map(l=>[l.data,q(l.desc),l.cat,l.tipo==="R"?"Receita":"Despesa",l.valor.toFixed(2).replace(".",",")].join(";")));
  const blob=new Blob(["\ufeff"+linhas.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="lancamentos.csv";document.body.appendChild(a);a.click();a.remove();
};
render();

if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
