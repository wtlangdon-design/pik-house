// Styles for the holiday cooking card: the Thanksgiving Kitchen page's Daylight styles, scoped to the card.
import { css } from "lit";

export const holidayStyles = css`
:host{--bg:#F3ECE0;--glow:#FCF7EE;--ink:#2A2019;--muted:#7A6B5A;--card:#FFFBF4;--line:#E2D5C1;--soft:#EDE3D3;--btn:#2A2019;--btnInk:#FBF6EE;
--urg:#C2452F;--chk:#C98A3A;--chkBg:#FBF0DD;--done:#4F7A4A;--doneBg:#E4EEDD;--temp:#B5452F;--tempBg:#FBE7E1;
--smoker:#8C5A3C;--oven:#C2452F;--stove:#C98A3A;--prep:#5F7F96;--fridge:#4E8FB0}
*{box-sizing:border-box}
:host{display:block;height:calc(100vh - var(--header-height, 0px));overflow:hidden;position:relative;margin:0;background:radial-gradient(ellipse at 20% 0%,var(--glow) 0%,var(--bg) 60%) fixed;color:var(--ink);font-family:'DM Sans',system-ui,sans-serif}
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
.planhead{position:sticky;top:-18px;z-index:5;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line)}
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
/* ---------- one page (v3 design) ---------- */
.op{position:relative;height:100%;display:flex;flex-direction:column;overflow:hidden}
.op header{position:relative;flex:none}
.hd{height:74px;display:flex;align-items:center;gap:14px;padding:0 22px;border-bottom:1px solid var(--line);background:rgba(243,236,224,.95)}
.hd .clock{white-space:nowrap}
.ttl{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.ttl b{font:600 16px 'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl span{font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ringbar{flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:var(--btn);color:var(--btnInk);border-radius:18px;padding:7px 8px 7px 16px;animation:rgp 1.2s ease-in-out infinite}
.ringbar b{color:#F3D9A8;font-variant-numeric:tabular-nums;white-space:nowrap}
.ringbar span{flex:1;font-size:14.5px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ringbar small{color:#E2CFB0;white-space:nowrap;font-size:12.5px}
.ringbar button{height:40px;padding:0 18px;border-radius:20px;border:0;background:var(--btnInk);color:var(--ink);font-weight:700;font-size:14px;white-space:nowrap;cursor:pointer}
@keyframes rgp{0%,100%{box-shadow:0 0 0 0 rgba(201,138,58,0)}50%{box-shadow:0 0 0 5px rgba(201,138,58,.45)}}
.tkb{display:flex;align-items:center;gap:10px;height:50px;padding:0 14px 0 8px;border-radius:25px;background:var(--card);border:1px solid var(--line);white-space:nowrap;cursor:pointer}
.tkb .dot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 12px 'DM Sans',sans-serif}
.dot.hot{background:var(--temp)}.dot.warn{background:var(--chk)}.dot.ok{background:var(--done)}.dot.off{background:#9C8B78}
.tkb .t{display:flex;flex-direction:column;line-height:1.2;text-align:left}.tkb .t b{font-size:14px}.tkb .t span{font-size:12px;color:var(--muted)}
.ico{width:46px;height:46px;border-radius:23px;border:1px solid var(--line);background:var(--card);display:grid;place-items:center;font-size:18px;cursor:pointer;flex:none}
.ico.off{background:var(--soft);color:#9C8B78}
.ibtn{height:46px;padding:0 18px;border-radius:23px;border:1px solid var(--btn);background:var(--btn);color:var(--btnInk);font-weight:600;font-size:14px;white-space:nowrap;cursor:pointer;flex:none}
.cdn{text-align:right;white-space:nowrap}.cdn .big{font:400 30px/1 'Instrument Serif',Georgia,serif}
.stn{min-height:100px;display:grid;grid-template-columns:200px 250px 1fr;gap:10px;padding:10px 22px;flex:none;border-bottom:1px solid var(--line)}
.sn{border-radius:16px;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--line);padding:9px 12px;display:flex;flex-direction:column;gap:3px;min-width:0;text-align:left}
.sn.smoker{border-left-color:var(--smoker)}.sn.oven{border-left-color:var(--oven)}
.sn.idle{opacity:.6;border-left-color:var(--line)}
.sn b{font-size:14.5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sn i{font-style:normal;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp{font:700 12px 'DM Sans',sans-serif;color:var(--oven);letter-spacing:0;text-transform:none}
.stovebox{border-radius:16px;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--stove);padding:8px 10px 8px 12px;display:flex;flex-direction:column;gap:5px;min-width:0}
.burners{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;flex:1}
.bn{display:flex;gap:7px;align-items:flex-start;border-radius:11px;padding:5px 7px;background:#F6EEE2;min-width:0}
.bn.free{background:transparent;border:1px dashed var(--line)}
.bn div{display:flex;flex-direction:column;min-width:0}
.bn b{font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bn i{font-style:normal;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bdy{flex:1;display:grid;grid-template-columns:1fr 330px;gap:18px;padding:14px 22px 10px;min-height:0}
.lc{display:flex;flex-direction:column;min-height:0;gap:8px}
.rc{display:flex;flex-direction:column;min-height:0;gap:12px}
.nowh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.nowh h2{font-size:34px;margin:0;line-height:1;white-space:nowrap}
.prev{font-size:13px;color:var(--muted)}
.tlist{display:flex;flex-direction:column;gap:8px;overflow:auto;min-height:0;flex:1;padding-bottom:4px}
.tc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:11px 12px 11px 14px;display:grid;grid-template-columns:76px 1fr auto;gap:12px;align-items:start}
.tc.due{background:linear-gradient(90deg,#FFF3DF,var(--card) 60%);border-color:#EBCB98}
.tc.ringing{border:2px solid var(--chk);animation:rgp 1.2s ease-in-out infinite}
.tc.done{opacity:.72;padding-top:6px;padding-bottom:6px;align-items:center}.tc.done .x{text-decoration:line-through;font-size:14.5px}.tc.done .meta{display:none}
/* time cells: .tt (the page's old .tm is the timer pill) */
.tc .tt{font:700 16px 'DM Sans',sans-serif;font-variant-numeric:tabular-nums;padding-top:2px}
.tc .x{font-size:17px;line-height:1.35}
.tc .meta{margin-top:6px;font-size:12.5px;color:var(--muted)}
.tc .acts{display:flex;gap:6px;align-items:center;flex-wrap:nowrap;max-width:none}
.sb{height:38px;padding:0 13px;border-radius:19px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:13px;white-space:nowrap;font-variant-numeric:tabular-nums;cursor:pointer}
.sb.chk{border-color:var(--chk);color:#8A5A1C;background:var(--chkBg)}.sb.dn{border-color:var(--done);color:var(--done);background:var(--doneBg)}.sb.tp{border-color:var(--temp);color:var(--temp);background:var(--tempBg)}
.sb.run{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.sb.rang{background:var(--urg);color:#fff;border-color:var(--urg)}
.sb.ink{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.tc .tick{width:38px;height:38px}
.tc.done .tick{width:30px;height:30px}
.how{grid-column:2 / 4;border-top:1px dashed var(--line);padding-top:10px;margin-top:2px;display:grid;grid-template-columns:1fr 260px;gap:18px}
.how p{margin:4px 0 0;font-size:15.5px;line-height:1.45}
.snav{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}
.pips{display:flex;gap:4px;margin-left:4px}.pips i{width:8px;height:8px;border-radius:50%;background:var(--line)}.pips i.on{background:var(--ink)}.pips i.past{background:#B8A58C}
.hing{max-height:190px;overflow:auto;border-left:1px solid var(--line);padding-left:14px}
.hing .ig{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:13px;margin-top:5px}
.hing .ig b{white-space:nowrap;font-variant-numeric:tabular-nums}
.hing .ig .sec{grid-column:1 / 3;font:700 10px 'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.how .lnk{font-weight:700;font-size:13px;text-decoration:underline;cursor:pointer;display:inline-block;margin-top:8px;background:none;border:0;padding:0}
.nextbox{flex:none;border-top:1px solid var(--line);padding-top:6px}
.nx{display:grid;grid-template-columns:112px 1fr;gap:12px;align-items:center;padding:5px 14px;font-size:15px}
.nx .tt{font:700 14px 'DM Sans',sans-serif;color:var(--muted);font-variant-numeric:tabular-nums}
.nx span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.earl summary{font-size:13px;color:var(--muted);cursor:pointer;padding:0 2px}
.rcard2{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:13px 16px}
.tgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.tg{display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;padding:6px 8px 6px 10px;border-radius:12px;background:#F6EEE2;min-width:0}
.tg.ring{background:var(--urg);color:#fff}
.tg .l{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;grid-column:1 / 3}
.tg .tl{font:700 19px 'DM Sans',sans-serif;font-variant-numeric:tabular-nums}
.tg .mini{display:flex;gap:4px;justify-content:flex-end}
.tg .mini button{height:26px;padding:0 8px;border-radius:13px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:11.5px;font-weight:600;cursor:pointer}
.tg .k{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:middle}
.k.check{background:var(--chk)}.k.done{background:var(--done)}.k.temp{background:var(--temp)}.tg.ring .k{background:#fff}
.dcard{flex:1;min-height:0;display:flex;flex-direction:column}
.dlist{display:flex;flex-direction:column;margin-top:6px;overflow:auto;min-height:0}
.dr{display:grid;grid-template-columns:12px 1fr auto;gap:9px;align-items:center;padding:4px 2px;border-bottom:1px solid #F0E7DA;text-align:left;background:transparent;border-left:0;border-right:0;border-top:0;width:100%;cursor:pointer}
.dr:last-child{border-bottom:0}
.dr .sd{width:10px;height:10px;border-radius:50%}
.sd.wait{background:#D8C8B1}.sd.cold{background:var(--fridge)}.sd.act{background:var(--chk)}.sd.hot{background:var(--oven)}.sd.ok{background:var(--done)}
.dr b{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dr span{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
.dr span.g{color:var(--done);font-weight:700}.dr span.w{color:#8A5A1C;font-weight:700}
.dr.tky{background:#FFF6E8;border-radius:8px;box-shadow:0 0 0 4px #FFF6E8;margin:4px 0;border-bottom:0}.dr.tky span{font-weight:700;color:#8A5A1C}
.dr.grp span{white-space:normal;max-width:none}
.hotbtn{height:28px;padding:0 10px;border-radius:14px;border:1px solid var(--done);background:var(--doneBg);color:var(--done);font:700 12px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.dkey{font-size:11.5px;color:var(--muted);margin-top:2px}
.rbn{height:56px;flex:none;display:flex;align-items:center;gap:14px;padding:0 22px;border-top:1px solid var(--line);background:rgba(243,236,224,.95)}
.rbn .days{display:flex;gap:4px}
.rbn .days button{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:12.5px;cursor:pointer}
.rbn .days button.on{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.track{position:relative;flex:1;height:38px;cursor:pointer}
.track .ln{position:absolute;left:0;right:0;top:19px;height:2px;background:var(--line)}
.track .fh{position:absolute;top:13px;height:14px;background:#F3E0C2;border-radius:7px}
.track .hr{position:absolute;top:27px;font-size:10.5px;color:#9C8B78;transform:translateX(-50%);white-space:nowrap}
.track .d{position:absolute;top:14px;width:12px;height:12px;border-radius:50%;transform:translateX(-50%);border:2px solid var(--card)}
.d.smoker{background:var(--smoker)}.d.oven{background:var(--oven)}.d.stove{background:var(--stove)}.d.prep{background:var(--prep)}.d.fridge{background:var(--fridge)}
.d.past{opacity:.3}
.track .nowl{position:absolute;top:2px;bottom:0;width:2px;background:var(--urg)}
.track .nowl:before{content:'now';position:absolute;top:-2px;left:5px;font:700 10px 'DM Sans',sans-serif;color:var(--urg)}
.scrim2{position:absolute;inset:0;background:rgba(42,32,25,.35);z-index:38;border:0}
.psheet{position:absolute;left:30px;right:30px;top:20px;bottom:0;background:var(--card);border-radius:28px 28px 0 0;border:1px solid var(--line);z-index:40;padding:18px 26px 40px;display:flex;flex-direction:column;gap:12px;overflow:auto}
.seg{display:flex;gap:4px;background:var(--soft);border-radius:20px;padding:3px;align-self:flex-start;flex-wrap:wrap}
.seg button{height:34px;padding:0 16px;border:0;border-radius:17px;background:transparent;font-weight:600;font-size:13px;color:var(--muted);cursor:pointer}
.seg button.on{background:var(--card);color:var(--ink)}
.tpop{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(480px,calc(100% - 40px));max-height:calc(100% - 30px);overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:24px;box-shadow:0 24px 60px -24px rgba(0,0,0,.45);z-index:40;padding:20px 22px 18px}
.tph{display:flex;align-items:flex-start;gap:14px}
.tph>div{flex:1;min-width:0}
.tph h3{margin:0;font-size:30px;font-weight:400;line-height:1.05}
.tph p{margin:4px 0 0;font-size:14px;color:var(--muted);line-height:1.35}
.tpn{margin:12px 0 0;font-size:13px;color:var(--muted);line-height:1.4;text-align:center}
.spots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}
.spots button{height:84px;border-radius:14px;border:1px solid var(--line);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer}
.spots button.on{border:2px solid var(--ink)}
.spots b{font:400 30px/1 'Instrument Serif',serif}.spots span{font-size:12px;color:var(--muted)}.spots .sp{font:600 13px 'DM Sans',sans-serif;color:var(--ink)}
.spots button.ok{background:var(--doneBg);border-color:var(--done)}
.entry{margin-top:10px;height:52px;border-radius:14px;background:var(--soft);display:flex;align-items:center;justify-content:center;font:700 26px 'DM Sans',sans-serif;font-variant-numeric:tabular-nums}
.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.pad button{height:52px;border-radius:14px;border:1px solid var(--line);background:#fff;font:600 20px 'DM Sans',sans-serif;cursor:pointer}
.pad button.go{background:var(--btn);color:var(--btnInk);border-color:var(--btn);font-size:17px}
.entry .muted{font:500 15px 'DM Sans',sans-serif}
:host([layout=echo]) .rbn{display:none}

.stp{grid-column:2 / 4;border-top:1px dashed var(--line);padding-top:8px;margin-top:-2px}
.stp .sh{display:flex;align-items:center;gap:8px;font:700 11px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.stp .arr{margin-left:auto;display:flex;gap:6px}
.stp .ar{width:44px;height:36px;border-radius:18px;border:1px solid var(--line);background:var(--card);font:600 22px/1 'DM Sans',sans-serif;cursor:pointer;color:var(--ink)}
.stp .ar:disabled{opacity:.3;cursor:default}
.stp p{margin:6px 0 0;font-size:15.5px;line-height:1.45}
.dlink{border:0;background:none;padding:0;font:inherit;color:var(--ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;cursor:pointer}
span.dlink{text-decoration:none;cursor:default}
.tc .nm{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font:700 19px/1.25 'DM Sans',sans-serif;min-height:36px}
.tc .nm .pips{display:inline-flex;gap:3px;align-items:center}.tc .nm .pips i{width:7px;height:7px;border-radius:50%;background:#E5D7C3}.tc .nm .pips i.past{background:#BFAE98}.tc .nm .pips i.part{background:#D9B98A}.tc .nm .pips i.on{background:var(--ink);width:9px;height:9px}
.tc .nm .arr{margin-left:auto;display:flex;gap:6px}.tc .nm .ar{width:44px;height:36px;border-radius:18px;border:1px solid var(--line);background:var(--card);font:600 22px/1 'DM Sans',sans-serif;cursor:pointer;color:var(--ink)}.tc .nm .ar:disabled{opacity:.3;cursor:default}
.rc3 .acts{align-self:start;padding-top:0}
.rc3 .stp{margin-top:0}
.tc .nm .sc{font:600 12px 'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.tc .nm+.x{margin-top:3px;font-size:15.5px;color:#4A3D31}
.tc .tt small{display:block;font:600 11px 'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:3px}
.tc.ahead{background:repeating-linear-gradient(135deg,var(--card),var(--card) 12px,#FBF5EC 12px,#FBF5EC 24px);border-style:dashed}
.tc.done .nm{font-size:15px}.tc.done .nxt{margin-top:3px;font-size:13.5px;color:var(--muted)}
.tc.done.late{opacity:.8}.tc.done.late .x{text-decoration:none}
.stp .sh{min-height:36px}
.sb.set{border-color:var(--chk);color:#8A5A1C;background:var(--chkBg)}
details.settings{margin-top:22px}
details.settings summary{cursor:pointer;font-weight:600;color:var(--muted);font-size:14px}
details.settings .card{margin-top:10px;display:flex;flex-direction:column;gap:8px;max-width:640px}
details.settings p{margin:0}
details.settings textarea{width:100%;border-radius:14px;border:1px solid var(--line);padding:10px;font:12px monospace}
/* the step on the left, this step's ingredients in a column on the right */
.stp .sb2.two{display:grid;grid-template-columns:1fr 250px;gap:18px;align-items:start}
.stp .si{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;align-content:start;font-size:13.5px;line-height:1.35;border-left:1px solid var(--line);padding-left:14px;margin-top:6px}
.stp .si b{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.tc.due .stp p{font-size:16px}
/* review 2: badges, estimates, reminders */
.tc .tt small.now{display:inline-block;margin-top:5px;padding:2px 9px;border-radius:10px;background:var(--btn);color:var(--btnInk);letter-spacing:.08em}
.tc .nm .est,.steps .est{font:600 12px 'DM Sans',sans-serif;font-style:normal;color:#6B5A48;background:var(--soft);border-radius:10px;padding:3px 9px;white-space:nowrap}
.tc.rem{padding-top:9px;padding-bottom:9px;align-items:center}.tc.rem .x{font-size:16.5px}
/* put on a burner / in the oven / on the smoker */
.pl{position:relative;width:46px;height:42px;border-radius:14px;border:1.5px solid var(--stove);background:var(--card);color:#8A5A1C;cursor:pointer;display:grid;place-items:center;padding:0;flex:none}
.pl svg{width:24px;height:24px}
.pl.on{background:var(--btn);border-color:var(--btn);color:var(--btnInk)}.pl.on .pn{background:#C9822F}
.pl.busy{border-color:var(--urg);color:var(--urg);background:#FFF1EC}.pl.busy .pn{background:#B9A48A}
.pl .bang{position:absolute;bottom:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--urg);color:#fff;font:800 12px/18px 'DM Sans',sans-serif;text-align:center;border:2px solid var(--card)}
.bn.plan{background:transparent;border:1px dashed var(--stove);opacity:.75}.bn.plan b{font-style:italic;font-weight:600}
.bn.on{background:#F8E6CC}
.bn.clash{background:#FDE4DA;border:1px solid var(--urg)}.bn i.w{color:var(--urg);font-weight:700}
.sn b.pl8{font-style:italic;opacity:.65}
.bpick{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px}
.bpick button{position:relative;height:96px;border-radius:14px;border:1px solid var(--line);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding:14px 4px 6px}
.bpick button:disabled{opacity:.55;cursor:default;background:var(--soft)}
.bpick b{font-size:14px}.bpick span{font-size:11.5px;color:var(--muted);text-align:center}
.tpop.pick{width:min(560px,calc(100% - 40px))}
/* one emblem everywhere: station icon + a notification-style number badge in the top-right corner */
.ic{position:relative;display:inline-grid;place-items:center;width:28px;height:28px;flex:none;color:var(--stove)}
.ic svg{width:100%;height:100%}
.ic .pn{position:absolute;top:-6px;right:-8px;min-width:17px;height:17px;border-radius:9px;background:#E5484D;color:#fff;font:700 10.5px/17px 'DM Sans',sans-serif;text-align:center;padding:0 4px;border:2px solid var(--card);box-sizing:border-box}
.pl .ic{width:26px;height:26px;color:inherit}
.pl .ic .pn{top:-14px;right:-16px;min-width:20px;height:20px;line-height:16px;font-size:11.5px}
.pl.busy .ic .pn{background:#B9A48A}
.pl .bang{bottom:-7px;right:-7px}
.bn{align-items:center}.bn .ic{width:26px;height:26px;margin:0 4px 0 1px}
.bn.free .ic{color:#C9B79E}.bn.plan .ic{opacity:.7}.bn.on .ic{color:#8A5A1C}.bn.on .ic .pn,.bn.clash .ic .pn{background:#E5484D}
.bn.free .ic .pn{background:#C9B79E}
.sn{flex-direction:row;align-items:center;gap:10px}.sn .snb{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.sn .ic{width:30px;height:30px}.sn.smoker .ic{color:var(--smoker)}.sn.oven .ic{color:var(--oven)}.sn.idle .ic{color:#C9B79E}
.bpick .ic{width:30px;height:30px;margin-bottom:4px}.bpick button:disabled .ic .pn{background:#B9A48A}
.pl.oven{border-color:var(--oven);color:var(--oven)}.pl.smoker{border-color:var(--smoker);color:var(--smoker)}
.pl.on.oven,.pl.on.smoker{background:var(--btn);border-color:var(--btn);color:var(--btnInk)}
.tc.done{align-items:start}.tc.done .tick{margin-top:2px}
/* polish: badge digits dead-center; card emblems look like the tiles (dashed = not on yet, warm amber = on) */
.ic .pn{display:flex;align-items:center;justify-content:center;width:17px;min-width:0;height:17px;padding:0;line-height:1;font-size:10.5px;font-variant-numeric:tabular-nums}
.pl .ic .pn{width:20px;height:20px;line-height:1;font-size:11.5px;top:-14px;right:-16px}
.pl{border-style:dashed;background:var(--card)}
.pl.on,.pl.on.oven,.pl.on.smoker{border-style:solid;background:#F8E6CC;border-color:#E3B474;color:#8A5A1C;box-shadow:0 0 0 3px #F6E1C2}
.pl.on.oven{color:var(--oven)}.pl.on.smoker{color:var(--smoker)}
.pl.busy{border-style:solid}
.pl .bang{display:flex;align-items:center;justify-content:center;line-height:1;padding:0}
.pl .ic .pn,.pl.on .ic .pn{background:#E5484D}.pl.busy .ic .pn{background:#B9A48A}
.pl.pre{opacity:.45;cursor:default}
.stp.car{display:grid;grid-template-columns:40px 1fr 40px;gap:12px;align-items:center}
.stp.car .ar{width:40px;height:56px;border-radius:14px;border:1px solid var(--line);background:var(--card);font:500 26px/1 'DM Sans',sans-serif;cursor:pointer;color:var(--ink);padding:0}
.stp.car .ar:disabled{opacity:.25;cursor:default}
.stp.car p.muted{color:var(--muted);font-size:14px}
/* rush-ready: focus mode, tips, day buttons in the header, slimmer dish list */
.bdy.fh{grid-template-columns:1fr 420px}
.bdy:not(.fh) .dkey{display:none}
.nowh .dayseg{margin-left:auto;display:flex;gap:4px}
.nowh .dayseg button{height:32px;padding:0 13px;border-radius:16px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:12.5px;cursor:pointer}
.nowh .dayseg button.on{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.tc.cmp{align-items:center;padding-top:8px;padding-bottom:8px;cursor:pointer}
.tc.cmp .cl{display:flex;align-items:baseline;gap:10px;min-width:0}
.tc.cmp .cl b{font-size:17px;white-space:nowrap}
.tc.cmp .cl span{font-size:15px;color:#4A3D31;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.tc.cmp .cl em{font-style:normal;color:var(--muted);font-size:14px}
.tc.cmp .cl .tipdot{font-style:normal;color:#B25A1C}
.tips{grid-column:2 / 4;display:flex;flex-direction:column;gap:6px;margin-top:-4px}
.tipq{align-self:flex-start;border:1px solid #EBCB98;background:#FFF6E8;color:#8A5A1C;border-radius:14px;padding:5px 12px;font-weight:600;font-size:13px;cursor:pointer}
.tipq.on{background:#FBE7C6}
.tipa{margin:0;font-size:14.5px;line-height:1.45;background:#FFF6E8;border-left:3px solid #E3B474;border-radius:0 10px 10px 0;padding:8px 12px}
/* time cell: the time, then its badge underneath, both flush left with room to breathe */
.tc .tt{display:flex;flex-direction:column;align-items:flex-start;gap:7px;padding-top:2px;line-height:1.15}
.tc .tt small{margin-top:0}
.tc .tt small.now{display:inline-flex;align-items:center;justify-content:center;height:20px;padding:0 9px;margin:0;border-radius:6px;font-size:10.5px;letter-spacing:.1em;line-height:1}
.tc.cmp{padding-top:12px;padding-bottom:12px;min-height:64px}
.tc.cmp .tt{gap:6px}
/* ===== design pass: calmer surfaces, one meaning per color, bigger step text ===== */
/* colors: amber = now / in progress, red = a problem, green = done. Nothing else carries meaning. */
.op{--amber:#C9822F;--amberInk:#7A4E17;--amberBg:#FBEBD3;--amberBg2:#FFF4E4;--shadow:0 1px 2px rgba(60,40,20,.06),0 3px 10px rgba(60,40,20,.05)}
/* cards: no outlines, soft shading; "now" cards are warm with an amber edge */
.tc{border:0;box-shadow:var(--shadow);border-radius:18px}
.tc.due{background:var(--amberBg2);border:0;box-shadow:inset 4px 0 0 var(--amber),var(--shadow)}
.tc.ahead{border:0;box-shadow:var(--shadow)}
.tc.done{box-shadow:none;background:rgba(255,255,255,.45)}
.tc.ringing{border:0;box-shadow:inset 0 0 0 2px var(--urg),var(--shadow)}
.stp{border-top:0;padding-top:4px}
.rcard2{border:0;box-shadow:var(--shadow)}
/* step text: the thing you read from the stove */
.tc.due .stp p,.tc.ahead .stp p{font-size:20px;line-height:1.45}
.tc.due .stp .si{font-size:15px}
.tc .nm{font-size:20px}
/* Now badge: amber, not black */
.tc .tt small.now{background:var(--amber);color:#fff}
/* Done button: as big as the timer button, green only because it means done */
.dbtn{height:42px;padding:0 16px;border-radius:21px;border:1.5px solid var(--done);background:#fff;color:var(--done);font:700 14px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap;flex:none}
.dbtn:active{background:var(--done);color:#fff}
.donetag{color:var(--done);font:700 13px 'DM Sans',sans-serif;white-space:nowrap}
.ubtn{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--line);background:#fff;color:var(--muted);font:600 12.5px 'DM Sans',sans-serif;cursor:pointer}
.tc.done .acts{gap:10px}
/* timer button: amber when set, amber filled while running, red when time's up */
.sb.set{border-color:var(--amber);color:var(--amberInk);background:#fff;height:42px;border-radius:21px;padding:0 15px;font-size:13.5px}
.sb.run{background:var(--amberBg);color:var(--amberInk);border-color:var(--amber);height:42px;border-radius:21px}
.sb.rang{height:42px;border-radius:21px}
.tc .acts{gap:8px}
/* the alarm bar is "now", so amber, not black */
.ringbar{background:var(--amberInk)}
/* header: Plan & recipes is a plain button; sound is a small button here, not a note over the cards */
.ibtn{background:#fff;color:var(--ink);border-color:var(--line)}
.sndb{height:40px;padding:0 14px;border-radius:20px;border:1px solid var(--line);background:#fff;color:var(--muted);font:600 13px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap;flex:none}
.sound{display:none!important}
.nowh .dayseg button{border:0;background:rgba(255,255,255,.7)}
.nowh .dayseg button.on{background:var(--amberBg);color:var(--amberInk)}
/* stations: shaded tiles, no edges; two lines each, readable */
.stn{border-bottom:0}
.sn,.stovebox{border:0;box-shadow:var(--shadow)}
.sn.idle{opacity:1}.sn.idle b{color:var(--muted)}
.sn .ic,.sn.smoker .ic,.sn.oven .ic{color:var(--amberInk)}.sn.idle .ic{color:#CDBBA2}
.tp{color:var(--amberInk)}
.sn i,.bn i{font-size:12.5px;line-height:1.3}
.bn{padding:7px 8px;border-radius:12px}
.bn.free{border:0;background:rgba(246,238,226,.55)}
.bn.free b{color:var(--muted);font-weight:600}
.bn.plan{border:1.5px dashed var(--amber);background:transparent;opacity:1}.bn.plan b{color:var(--amberInk)}
.bn.on{background:var(--amberBg)}
.bn.clash{background:#FDE4DA;border:0;box-shadow:inset 0 0 0 1.5px var(--urg)}
/* small status words: amber in progress, green done, nothing red unless it's a problem */
.sd.act,.sd.hot{background:var(--amber)}.sd.cold{background:#A99883}.sd.wait{background:#E3D6C3}
.dot.hot,.dot.warn{background:var(--amber)}
.k.check,.k.done,.k.temp{background:var(--amber)}
.dr span.w{color:var(--amberInk)}
/* dish list outside the final hour: a quiet reference, not a second to-do list */
.bdy:not(.fh) .dr b{font-weight:500;font-size:13px}
.bdy:not(.fh) .dr span{font-size:12px}
.bdy:not(.fh) .dr span.w{font-weight:600}
.bdy:not(.fh) .dr{border-bottom-color:#F4ECE0}
.dr.tky{background:var(--amberBg2);box-shadow:0 0 0 4px var(--amberBg2)}.dr.tky span{color:var(--amberInk)}
/* emblems follow the same colors */
.pl,.pl.oven,.pl.smoker{border-color:var(--amber);color:var(--amberInk)}
.pl.on,.pl.on.oven,.pl.on.smoker{background:var(--amberBg);border-color:var(--amber);color:var(--amberInk);box-shadow:0 0 0 3px #F6E1C2}
.pl.busy{border-color:var(--urg);color:var(--urg)}
.tipq{border:0;background:var(--amberBg)}
.tc.cmp .cl .tipdot{color:var(--amber)}
.nextbox{border-top:0}
.bdy.fh .dr span.w{font-size:12.5px;flex:none;line-height:1.3}
/* the tile's second line may wrap onto a second row rather than be cut off */
.sn i,.bn i{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tc .nm .clp{margin-left:auto;height:30px;padding:0 12px;border-radius:15px;border:1px solid var(--line);background:#fff;color:var(--muted);font:600 12.5px 'DM Sans',sans-serif;cursor:pointer}
.dbtn,.donetag{display:inline-flex;align-items:center;gap:7px}.pie{width:18px;height:18px;flex:none}
/* time column: day on its own line, time never splits; Fold sits with the card's buttons */
.tc{grid-template-columns:96px 1fr auto}
.tc .tt{gap:4px}
.tc .tt .dy{font:700 11.5px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.tc .tt .hm{white-space:nowrap}
.tc .tt small{margin-top:3px}
.tc .acts .clp{width:34px;height:34px;border-radius:17px;border:1px solid var(--line);background:#fff;color:var(--muted);font:600 14px/1 'DM Sans',sans-serif;cursor:pointer;flex:none;margin:0 2px 0 0;padding:0}
.tc.cmp .cl em{font-size:15px;width:34px;text-align:center}
.donehd{margin:10px 2px 2px;font:700 11.5px 'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
`;
