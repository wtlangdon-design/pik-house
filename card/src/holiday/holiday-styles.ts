// Styles for the holiday cooking card: the Thanksgiving Kitchen page's Daylight styles, scoped to the card.
import { css } from "lit";

export const holidayStyles = css`
:host{--bg:#F3ECE0;--glow:#FCF7EE;--ink:#2A2019;--muted:#7A6B5A;--card:#FFFBF4;--line:#E2D5C1;--soft:#EDE3D3;--btn:#2A2019;--btnInk:#FBF6EE;
--urg:#C2452F;--chk:#C98A3A;--chkBg:#FBF0DD;--done:#4F7A4A;--doneBg:#E4EEDD;--temp:#B5452F;--tempBg:#FBE7E1;
--smoker:#8C5A3C;--oven:#C2452F;--stove:#C98A3A;--prep:#5F7F96;--fridge:#4E8FB0}
*{box-sizing:border-box}
:host{display:block;height:calc(100vh - var(--header-height, 0px));overflow-y:auto;overflow-x:hidden;position:relative;margin:0;background:radial-gradient(ellipse at 20% 0%,var(--glow) 0%,var(--bg) 60%) fixed;color:var(--ink);font-family:'DM Sans',system-ui,sans-serif}
button{font:inherit;color:inherit}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.eb{font:700 11px/1.2 'DM Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
header{position:sticky;top:0;z-index:20;background:rgba(243,236,224,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.hrow{display:flex;align-items:center;gap:22px;padding:14px 28px 10px;max-width:1280px;margin:0 auto}
.clock{font:400 44px/1 'Instrument Serif',Georgia,serif}
.clock small{font:500 15px 'DM Sans',sans-serif;color:var(--muted);margin-left:4px}
.title{display:flex;flex-direction:column;gap:2px}
.title b{font:600 17px 'DM Sans',sans-serif}
.count{margin-left:auto;text-align:right}
.count .big{font:400 30px/1 'Instrument Serif',Georgia,serif}
nav{display:flex;gap:6px;padding:0 28px 12px;max-width:1280px;margin:0 auto;overflow-x:auto}
nav button{height:40px;padding:0 18px;border-radius:20px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap}
nav button.on{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
nav .badge{display:inline-block;min-width:20px;height:20px;line-height:20px;margin-left:6px;border-radius:10px;background:var(--urg);color:#fff;font-size:11px;text-align:center;padding:0 5px}
main{max-width:1280px;margin:0 auto;padding:22px 28px 140px}
.card{background:var(--card);border:1px solid var(--line);border-radius:26px;padding:22px 24px}
.grid2{display:grid;grid-template-columns:1.35fr 1fr;gap:20px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
h1,h2,h3{margin:0}
h2.serif{font-size:34px;line-height:1.1;margin:6px 0 14px}
h3{font:700 16px 'DM Sans',sans-serif;margin-bottom:8px}
p{line-height:1.5;margin:0 0 10px}
.muted{color:var(--muted)}
.pill{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:12px;font:700 11px 'DM Sans',sans-serif;letter-spacing:.04em;background:var(--soft);color:var(--muted);white-space:nowrap}
.pill.a{background:#EBE3F4;color:#5E4D86}.pill.b{background:#E4ECDD;color:#4F6B45}.pill.ab{background:#F3E6CF;color:#8A6427}
.lane{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
.l-smoker{background:var(--smoker)}.l-oven{background:var(--oven)}.l-stove{background:var(--stove)}.l-prep{background:var(--prep)}.l-fridge{background:var(--fridge)}
.btn{height:44px;padding:0 18px;border-radius:22px;border:1px solid var(--line);background:var(--card);font-weight:700;font-size:14px;cursor:pointer}
.btn.ink{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.btn.sm{height:34px;padding:0 13px;font-size:13px;border-radius:17px}
.btn.chk{border-color:var(--chk);color:#8A5A1C;background:var(--chkBg)}
.btn.dn{border-color:var(--done);color:var(--done);background:var(--doneBg)}
.btn.tp{border-color:var(--temp);color:var(--temp);background:var(--tempBg)}
.flag{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:14px;background:#FFF3E8;border:1px solid #F1D2B3;font-size:14px;line-height:1.4;margin-bottom:8px}
.flag b{color:#9A4E1A}
.flag.conf{background:#EEF3FA;border-color:#C9D8EA}.flag.conf b{color:#3A5F86}
.flag.safe{background:#FBEDEA;border-color:#EFC7BE}.flag.safe b{color:var(--urg)}
.task{display:grid;grid-template-columns:78px 1fr auto;gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid var(--line)}
.task:last-child{border-bottom:0}
.task .t{font:700 15px 'DM Sans',sans-serif;font-variant-numeric:tabular-nums;padding-top:2px}
.task .w{font-size:16px;line-height:1.4}
.task .w small{display:block;color:var(--muted);font-size:13px;margin-top:4px}
.task .acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:300px}
.task.done .w{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--line)}
.task.now{background:linear-gradient(90deg,#FFF6E6,transparent);margin:0 -12px;padding:14px 12px;border-radius:14px}
.tick{width:30px;height:30px;border-radius:50%;border:2px solid var(--line);background:var(--card);cursor:pointer;flex-shrink:0;display:grid;place-items:center;font-size:15px;color:#fff}
.tick.on{background:var(--done);border-color:var(--done)}
/* plan grid */
.daybar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.planhead,.planrow{display:grid;grid-template-columns:70px repeat(4,1fr);gap:10px}
.planhead{position:sticky;top:118px;z-index:5;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line)}
.planrow{padding:8px 0;border-bottom:1px dashed var(--line)}
.planrow .t{font:700 14px 'DM Sans',sans-serif;padding-top:8px;font-variant-numeric:tabular-nums}
.cell{display:flex;flex-direction:column;gap:6px}
.blk{border-radius:14px;padding:9px 11px;font-size:13.5px;line-height:1.35;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--line);cursor:pointer}
.blk.done{opacity:.45;text-decoration:line-through}
.blk .who{float:right;margin-left:6px}
.blk.smoker{border-left-color:var(--smoker)}.blk.oven{border-left-color:var(--oven)}.blk.stove{border-left-color:var(--stove)}.blk.prep{border-left-color:var(--prep)}.blk.fridge{border-left-color:var(--fridge)}
.oventrack{display:flex;gap:0;margin:0 0 18px;border-radius:14px;overflow:hidden;border:1px solid var(--line)}
.oventrack div{padding:9px 10px;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-right:1px solid rgba(255,255,255,.6)}
/* recipes */
.rgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rcard{text-align:left;cursor:pointer;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:16px 16px 14px;display:flex;flex-direction:column;gap:8px;min-height:168px}
.rcard:hover{border-color:var(--ink)}
.rcard .n{font:400 30px/1 'Instrument Serif',Georgia,serif;color:var(--muted)}
.rcard .nm{font:600 16px/1.3 'DM Sans',sans-serif}
.rcard .tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:auto}
.sheet{position:fixed;inset:0;z-index:40;background:rgba(42,32,25,.35);display:none}
.sheet.open{display:block}
.sheet .panel{position:absolute;left:50%;top:18px;bottom:0;transform:translateX(-50%);width:min(1240px,calc(100% - 24px));background:var(--card);border-radius:30px 30px 0 0;border:1px solid var(--line);overflow:auto;padding:24px 30px 120px}
.sheet .x{position:sticky;top:0;float:right;z-index:2}
.rdet{display:grid;grid-template-columns:380px 1fr;gap:26px}
.ing{list-style:none;margin:0;padding:0}
.ing li{display:grid;grid-template-columns:92px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14.5px;line-height:1.35}
.ing li b{font-weight:700}
.ing li i{display:block;color:var(--muted);font-style:normal;font-size:12.5px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.meta div{background:var(--soft);border-radius:14px;padding:10px 12px;font-size:13px}
.meta div b{display:block;font-size:15px;margin-top:2px}
.steps{list-style:none;margin:0;padding:0;counter-reset:s}
.steps li{display:grid;grid-template-columns:34px 1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);align-items:start}
.steps li .num{width:30px;height:30px;border-radius:50%;background:var(--soft);display:grid;place-items:center;font:700 13px 'DM Sans',sans-serif}
.steps li .tx{font-size:15.5px;line-height:1.45}
.steps li .tx small{display:block;color:var(--muted);font-size:12.5px;margin-top:3px}
.dayhd{margin:18px 0 4px}
/* cook mode */
.cook{display:grid;grid-template-columns:300px 1fr;gap:24px;min-height:520px}
.clist{display:flex;flex-direction:column;gap:4px;max-height:640px;overflow:auto}
.cstep{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:center;padding:8px 10px;border-radius:14px;background:none;border:0;text-align:left;cursor:pointer;color:var(--muted);font-size:14px}
.cstep .cn{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;font:700 12px 'DM Sans',sans-serif}
.cstep.now{background:var(--soft);color:var(--ink);font-weight:700}
.cstep.now .cn{background:var(--btn);border-color:var(--btn);color:var(--btnInk)}
.cstep.past{text-decoration:line-through;text-decoration-color:var(--line)}
.cnow{background:var(--soft);border-radius:26px;padding:28px 32px;display:flex;flex-direction:column;gap:16px}
.cbig{font:400 40px/1.12 'Instrument Serif',Georgia,serif;margin:0}
.cnav{display:flex;gap:12px;margin-top:auto}
.cnav .btn{height:56px;font-size:16px;flex:1}
.cnav .btn:first-child{flex:0 0 140px}
/* timers */
#timerbar{position:fixed;right:18px;bottom:18px;z-index:50;display:flex;flex-direction:column;gap:10px;align-items:flex-end;max-width:440px}
.tm{display:flex;align-items:center;gap:12px;padding:10px 10px 10px 16px;border-radius:22px;background:var(--card);border:2px solid var(--line);box-shadow:0 14px 34px -16px rgba(60,40,20,.45);min-width:320px}
.tm .k{font:800 10.5px 'DM Sans',sans-serif;letter-spacing:.1em;padding:4px 8px;border-radius:8px}
.tm.check{border-color:var(--chk)}.tm.check .k{background:var(--chkBg);color:#8A5A1C}
.tm.done{border-color:var(--done)}.tm.done .k{background:var(--doneBg);color:var(--done)}
.tm.temp{border-color:var(--temp)}.tm.temp .k{background:var(--tempBg);color:var(--temp)}
.tm .tl{font:700 24px 'DM Sans',sans-serif;font-variant-numeric:tabular-nums;min-width:74px}
.tm .lb{flex:1;font-size:13.5px;line-height:1.3;font-weight:600}
.tm.ring{animation:ring 1s ease-in-out infinite}
.tm.ring .tl{color:var(--urg)}
@keyframes ring{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
.alert{position:fixed;left:50%;top:22px;transform:translateX(-50%);z-index:60;background:var(--btn);color:var(--btnInk);padding:16px 22px;border-radius:22px;display:none;align-items:center;gap:16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.6);width:min(860px,calc(100vw - 40px))}
.alert.show{display:flex}
.alert ul{flex:1;margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:16px;line-height:1.35}
.alert li{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:start}
.alert li b{font-variant-numeric:tabular-nums}
.alert li .btn{white-space:nowrap;margin-top:-4px}
.alert #alertOk{white-space:nowrap;align-self:flex-start;padding:10px 18px}
.alert li.k-task b{color:#F3D9A8}.alert li.k-temp b{color:#F2B8A8}.alert li.k-done b{color:#BFE3C4}
.sound{position:fixed;left:18px;bottom:18px;z-index:55;background:var(--card);border:2px solid var(--chk);border-radius:18px;padding:10px 14px;font-size:14px;font-weight:600;display:none;align-items:center;gap:10px;box-shadow:0 14px 34px -16px rgba(60,40,20,.45)}
.sound.show{display:flex}
.alert .btn{background:var(--btnInk);color:var(--ink)}
/* turkey */
.tstat{display:flex;align-items:center;gap:18px}
.tdot{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font:400 30px 'Instrument Serif',Georgia,serif;color:#fff;background:var(--muted);flex-shrink:0}
.tdot.ok{background:var(--done)}.tdot.warn{background:var(--chk)}.tdot.hot{background:var(--temp)}
.probe{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
.probe label{background:var(--soft);border-radius:18px;padding:12px 14px;font-size:13px;font-weight:600;color:var(--muted);display:flex;flex-direction:column;gap:6px}
.probe input{height:46px;border-radius:12px;border:1px solid var(--line);background:var(--card);font:700 22px 'DM Sans',sans-serif;padding:0 12px;width:100%}
.probe .last{font-size:12px;font-weight:500}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font:700 11px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.4}
.st{display:inline-block;padding:3px 9px;border-radius:9px;font:700 11px 'DM Sans',sans-serif;white-space:nowrap}
.st.ok{background:var(--doneBg);color:var(--done)}.st.chk{background:var(--chkBg);color:#8A5A1C}.st.miss{background:var(--tempBg);color:var(--urg)}.st.jc{background:#EEF3FA;color:#3A5F86}.st.no{background:var(--soft);color:var(--muted)}
.fh{display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}
.fh .t{font:700 15px 'DM Sans',sans-serif;width:54px;flex-shrink:0;padding-top:4px;font-variant-numeric:tabular-nums}
.fh .w{flex:1;font-size:15.5px;line-height:1.4}
.fh.on .w{color:var(--muted);text-decoration:line-through}
.kv{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14px}
.kv b{white-space:nowrap}
.note{font-size:13px;color:var(--muted);line-height:1.45}
.brine td,.brine th{text-align:center}
@media (max-width:1000px){.grid2,.rdet,.cook{grid-template-columns:1fr}.rgrid{grid-template-columns:repeat(2,1fr)}.planhead,.planrow{grid-template-columns:56px repeat(4,1fr)}}
.toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:70;background:var(--btn);color:var(--btnInk);padding:12px 20px;border-radius:18px;font-weight:600;box-shadow:0 14px 34px -16px rgba(0,0,0,.5)}
.wrap{min-height:100%}
.btick{display:block;margin-top:7px;height:26px;padding:0 10px;border-radius:13px;border:1px solid var(--line);background:var(--card);font:600 12px 'DM Sans',sans-serif;cursor:pointer}
.btick.on{background:var(--doneBg);border-color:var(--done);color:var(--done)}
.blk.done .btick{text-decoration:none}
`;
