// The Daylight design's CSS, copied unchanged from reference/daylight-reference.html.
// Don't edit colors or sizes here without changing the prototype first: it is the
// reference for every visual decision (see SPEC.md, "The card").
import { css } from "lit";

export const daylightStyles = css`
.app{--bg:#F3ECE0;--glow:#FCF7EE;--ink:#2A2019;--muted:#7A6B5A;--card:#FFFBF4;--line:#E2D5C1;--soft:#EDE3D3;--btn:#2A2019;--btnInk:#FBF6EE;--urg:#C2452F;--urgBg:#FFF0EA;
  position:relative;width:1280px;height:800px;overflow:hidden;font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);background:radial-gradient(ellipse at 22% 38%,var(--glow) 0%,var(--bg) 58%);transition:background .6s,color .6s}
.app.dark{--bg:#12181C;--glow:#232C2C;--ink:#F1E8DA;--muted:#A3988A;--card:#1D2529;--line:#2F3A3F;--soft:#243035;--btn:#F1E8DA;--btnInk:#1A1F22;--urg:#FF8F6B;--urgBg:#2C1F1C}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.eb{font:700 11px 'DM Sans',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
/* top strip */
.top{position:absolute;left:44px;right:44px;top:26px;height:64px;display:flex;align-items:center;gap:28px}
.clock{font:400 58px/1 'Instrument Serif',Georgia,serif;letter-spacing:-.01em}
.clock span{font:600 18px 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-left:6px}
.date{font:500 16px 'DM Sans',system-ui,sans-serif;color:var(--muted);line-height:1.3}
.sep{width:1px;height:40px;background:var(--line)}
.wx{display:flex;align-items:baseline;gap:8px;font:500 16px 'DM Sans',system-ui,sans-serif;color:var(--muted)}
.wx b{font:400 34px 'Instrument Serif',Georgia,serif;color:var(--ink)}
.airok{color:#5E8A5A}.dark .airok{color:#ADDFB9}
.demo{margin-left:auto;display:flex;gap:8px}
.upc{margin-left:auto;min-width:0;max-width:470px;display:flex;flex-direction:column;align-items:flex-end;gap:3px;text-align:right}
.upc .eb{margin-bottom:1px}
.upc .ul{font:500 15px/1.3 'DM Sans',system-ui,sans-serif;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.upc .ul b{font-weight:700}
.upc .ul i{font-style:normal;color:var(--muted)}
.upc.ph .ul{color:var(--muted);white-space:normal;font-size:14px;max-width:330px}
.dbtn{height:44px;padding:0 14px;border-radius:22px;border:1px dashed var(--line);background:transparent;color:var(--muted);font:600 13px 'DM Sans',system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.dbtn.on{border-style:solid;border-color:var(--ink);color:var(--ink)}
.ghost{height:44px;padding:0 14px;border-radius:22px;border:1px dashed var(--line);background:transparent;color:var(--muted);font:600 13px 'DM Sans',system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.ghost.on{border-style:solid;border-color:var(--ink);color:var(--ink)}
/* stage */
.stage{position:absolute;left:44px;right:44px;top:118px;height:452px;display:flex;align-items:center;gap:34px}
.pikcol{width:300px;flex-shrink:0;display:flex;flex-direction:column;align-items:center}
.pikbtn{width:280px;height:280px;transition:width .4s,height .4s;padding:0;border:none;background:transparent;cursor:pointer;border-radius:50%}
.pikbtn:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.pikname{display:flex;align-items:center;gap:10px;margin-top:4px}
.pikname b{font:400 34px 'Instrument Serif',Georgia,serif}
.pill{display:inline-block;border:1px solid var(--line);border-radius:100px;padding:5px 11px;font:700 10px 'DM Sans',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);background:var(--card)}
.pill.alert{color:var(--urg);border-color:var(--urg)}
.mic{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border-radius:22px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 14px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.mic.off{border-color:var(--urg);color:var(--urg)}
.bubble{position:relative;flex:1;min-width:0;height:420px;box-sizing:border-box;padding:30px 36px 28px;border-radius:34px;background:var(--card);border:1px solid var(--line);box-shadow:0 30px 60px -30px rgba(80,55,30,.35);display:flex;flex-direction:column;transition:background .4s,border-color .4s}
.dark .bubble{box-shadow:0 30px 60px -30px rgba(0,0,0,.7)}
.bubble::before{content:"";position:absolute;left:-13px;top:150px;width:24px;height:24px;background:var(--card);border-left:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg);transition:background .4s,border-color .4s}
.bubble.urgent{background:var(--urgBg);border-color:var(--urg)}
.bubble.urgent::before{background:var(--urgBg);border-color:var(--urg)}
.btop{display:flex;align-items:center;gap:12px}
.pdots{display:flex;gap:6px;margin-left:4px}
.pdots i{width:7px;height:7px;border-radius:50%;background:var(--line);display:block}
.pdots i.on{background:var(--ink)}
.nav{margin-left:auto;display:flex;gap:8px}
.nbtn{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.nbtn.dim{opacity:.3;cursor:default}
.cat{display:flex;align-items:center;gap:8px;margin-top:26px}
.cd{width:10px;height:10px;border-radius:50%;display:block;background:#B7A58C}
.cd.plant{background:#6E9A68}.cd.weather{background:#5F94C4}.cd.bill{background:#D8953F}.cd.home{background:#8B76C9}.cd.package{background:#D07B5E}.cd.energy{background:#E0A93E}.cd.door{background:var(--urg)}.cd.air{background:#8D9C96}.cd.light{background:#E0A93E}.cd.water{background:#4F9BC4}
.utag{color:var(--urg)}
.btitle{font:400 46px/1.05 'Instrument Serif',Georgia,serif;letter-spacing:-.01em;margin:12px 0 0}
.bdetail{font:400 19px/1.5 'DM Sans',system-ui,sans-serif;color:var(--muted);margin:14px 0 0;max-width:640px}
.acts{display:flex;gap:12px;margin-top:auto}
.pbtn{height:56px;padding:0 26px;border-radius:28px;border:none;background:var(--btn);color:var(--btnInk);font:700 16px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.urgent .pbtn{background:var(--urg);color:#fff}
.sbtn{height:56px;padding:0 24px;border-radius:28px;border:1px solid var(--line);background:transparent;color:var(--ink);font:600 16px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.peek{margin-left:auto;max-width:340px;min-width:0;display:flex;align-items:center;gap:10px;height:56px;padding:0 20px;border-radius:28px;border:1px solid var(--line);background:transparent;color:var(--muted);font:500 15px 'DM Sans',system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.peek .pt{overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.peek:hover{border-color:var(--muted)}
.urgent .peek{display:none}
.q{font:italic 400 30px/1.2 'Instrument Serif',Georgia,serif;color:var(--muted);margin:26px 0 0}
.ans{font:400 40px/1.15 'Instrument Serif',Georgia,serif;margin:18px 0 0}
.wait{font:600 13px 'DM Sans',system-ui,sans-serif;color:var(--muted)}
/* pebbles */
.pebs{position:absolute;left:44px;right:44px;top:598px;height:166px;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:14px}
.peb{min-width:0}
.pebs.five .pv{font-size:44px}
.pebs.six{gap:10px}.pebs.six .peb{padding:16px 16px}.pebs.six .pv{font-size:38px}.pebs.six .ps{font-size:13px}
.peb.outab{cursor:default}.peb.outab.map{cursor:pointer;border-color:var(--muted)}.peb.outab .pv{font-size:40px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.peb .ps{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.peb{box-sizing:border-box;padding:18px 20px;border-radius:28px;border:1px solid var(--line);background:var(--soft);color:var(--ink);text-align:left;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;transition:background .4s,border-color .4s}
.peb:hover{border-color:var(--muted)}
.peb.out{border-color:var(--urg);background:var(--urgBg)}
.pv{font:400 50px/1 'Instrument Serif',Georgia,serif;margin-top:10px}
.pv small{font:500 15px 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-left:6px}
.pv.dry{color:var(--urg)}
.ps{font:500 14px/1.35 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-top:auto}
.mini{display:flex;align-items:center;gap:6px;margin-top:10px}
.mini b{width:8px;height:8px;border-radius:50%;display:block}
.dots{flex:1;display:flex;justify-content:space-between;padding:0 3px}
.dots i{width:4px;height:4px;border-radius:50%;background:var(--line);display:block}
.dots.on i{background:var(--w);animation:dot 1.2s ease-in-out infinite}
.dots.on i:nth-child(2){animation-delay:.2s}.dots.on i:nth-child(3){animation-delay:.4s}
.dots.on.rev i:nth-child(1){animation-delay:.4s}.dots.on.rev i:nth-child(3){animation-delay:0s}
@keyframes dot{0%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1.4)}}

.pikbtn svg{transition:width .4s,height .4s}
.tmode .pikbtn{width:214px;height:214px}
.tmode .pikbtn svg{width:214px;height:214px}
.timers{display:flex;flex-direction:column;gap:10px;margin-top:12px;width:100%}
.tchip{display:flex;align-items:center;gap:12px;padding:8px 10px 8px 8px;border-radius:40px;background:var(--card);border:1px solid var(--line)}
.tchip svg{flex-shrink:0;transform:rotate(-90deg)}
.tr-bg{fill:none;stroke:var(--soft);stroke-width:6}
.tr-fg{fill:none;stroke:#E0A93E;stroke-width:6;stroke-linecap:round;stroke-dasharray:163.4;transition:stroke-dashoffset 1s linear}
.tt{flex:1;min-width:0;line-height:1}
.tt b{display:block;font:400 34px 'Instrument Serif',Georgia,serif;font-variant-numeric:tabular-nums}
.tt span{display:block;font:600 12px 'DM Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.tx{height:44px;min-width:44px;padding:0 14px;border-radius:22px;border:1px solid var(--line);background:transparent;color:var(--ink);font:700 14px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.tchip.tdone{border-color:var(--urg);background:var(--urgBg);animation:tpulse 1s ease-in-out infinite}
.tchip.tdone .tr-fg{stroke:var(--urg)}
.tchip.tdone .tt b{color:var(--urg)}
.tchip.tdone .tx{background:var(--urg);border-color:var(--urg);color:#fff}
@keyframes tpulse{0%,100%{box-shadow:0 0 0 0 rgba(194,69,47,.0)}50%{box-shadow:0 0 0 8px rgba(194,69,47,.18)}}
.np{cursor:default;background:var(--card)}
.nphead{display:flex;align-items:center;gap:8px}
.eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px}
.eq i{width:3px;height:4px;border-radius:1px;background:#E0A93E;display:block}
.eq.on i{animation:eq .9s ease-in-out infinite}
.eq.on i:nth-child(2){animation-delay:.2s}.eq.on i:nth-child(3){animation-delay:.45s}
@keyframes eq{0%,100%{height:4px}50%{height:12px}}
.npt{font:400 32px/1.05 'Instrument Serif',Georgia,serif;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.npc{display:flex;gap:6px;margin-top:auto}
.nc{width:44px;height:44px;border-radius:22px;border:1px solid var(--line);background:transparent;color:var(--ink);font:600 18px/1 'DM Sans',system-ui,sans-serif;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}
.nc.main{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.cd.reminder{background:#C98A3A}
@media (prefers-reduced-motion: reduce){.eq i,.tchip.tdone{animation:none!important}}
.bbar{position:relative;display:block;height:8px;border-radius:8px;background:var(--line);overflow:hidden;margin-top:16px}
.bfill{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background-color:#6E9A68;transition:width .6s}
.bfill.chg,.bfill.dis{background-image:linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 100%);background-size:60px 100%;background-repeat:no-repeat;animation:shim 1.8s linear infinite}
.bfill.dis{animation-direction:reverse}
.bfill.out{background-color:var(--urg)}
@keyframes shim{from{background-position:-60px 0}to{background-position:calc(100% + 60px) 0}}
.gd{display:flex;gap:7px;margin-top:12px}
.gd i{width:16px;height:16px;border-radius:50%;display:block;background:#9BC096}
.dark .gd i{background:#3E5A44}
.gd i.dry{background:var(--urg)}
.gd i.wet{background:#8EC3CF}
.dark .gd i.wet{background:#2E4F4C}
/* sheets */
.scrim{position:absolute;inset:0;background:rgba(30,22,15,.38);z-index:20;animation:fade .3s ease-out;border:0;padding:0;cursor:pointer}
.dark .scrim{background:rgba(0,0,0,.55)}
.sheet{position:absolute;left:24px;right:24px;bottom:0;height:612px;z-index:21;box-sizing:border-box;padding:14px 36px 30px;border-radius:34px 34px 0 0;background:var(--card);border:1px solid var(--line);border-bottom:0;box-shadow:0 -20px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;animation:up .38s cubic-bezier(.2,.8,.25,1)}
@keyframes up{0%{transform:translateY(100%)}100%{transform:none}}
@keyframes fade{0%{opacity:0}100%{opacity:1}}
.handle{width:56px;height:5px;border-radius:5px;background:var(--line);margin:0 auto 10px}
.shead{display:flex;align-items:center;gap:16px}
.stitle{font:400 44px/1 'Instrument Serif',Georgia,serif;margin:0}
.done{margin-left:auto;height:48px;padding:0 24px;border-radius:24px;border:none;background:var(--btn);color:var(--btnInk);font:700 15px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.sbody{flex:1;min-height:0;display:grid;gap:22px;margin-top:22px}
/* energy sheet */
.esb{grid-template-columns:1fr 340px}
.ewin{border-radius:26px;background:#1C221E;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ewin.out{box-shadow:inset 0 0 0 1.5px #C46A50}
.nlbl{fill:#CDBDA6;font:700 10.5px 'DM Sans',system-ui,sans-serif;letter-spacing:.1em}
.nval{fill:#FAEDD8;font:700 16px 'DM Sans',system-ui,sans-serif}
.hval{fill:#FFE1AA;font:700 19px 'DM Sans',system-ui,sans-serif}
.flow .wire{fill:none;stroke:#A59986;stroke-width:2;opacity:.3;stroke-dasharray:2 7;stroke-linecap:round}
.flow .pk{fill:none;stroke-linecap:round;stroke-width:5;stroke-dasharray:1 15;display:none}
.flow.on .wire{stroke:var(--w);opacity:.55;stroke-dasharray:none;stroke-width:2.4}
.flow.on .pk{display:inline;stroke:var(--w);animation:pkt 1.6s linear infinite;filter:drop-shadow(0 0 3px var(--w))}
.flow.on.rev .pk{animation-direction:reverse}
.w-sun{--w:#FFC580}.w-grid{--w:#A8C9D9}.w-bat{--w:#ADDFB9}
@keyframes pkt{to{stroke-dashoffset:-32}}
.moon,.cut{display:none}
.dark .sunic{display:none}.dark .moon{display:inline}
.out .cut{display:inline}
.out .gridnode{stroke:#FAA192;fill:#352A22}
.win{fill:#6B5240}
.dark .win{fill:#FFD28D;filter:drop-shadow(0 0 4px #FFC580)}
.stats{display:flex;flex-direction:column;gap:10px}
.lead{font:400 30px/1.12 'Instrument Serif',Georgia,serif}
.leadsub{font:400 15px/1.45 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-top:4px}
.stat{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid var(--line);font:500 15px 'DM Sans',system-ui,sans-serif;color:var(--muted)}
.stat b{font:700 17px 'DM Sans',system-ui,sans-serif;color:var(--ink)}
.bigbtn{height:56px;border-radius:28px;border:none;background:var(--urg);color:#fff;font:700 16px 'DM Sans',system-ui,sans-serif;cursor:pointer;margin-top:6px}
.bigbtn.ink{background:var(--btn);color:var(--btnInk)}
/* plants sheet */
.psb{grid-template-columns:1fr 330px}
.plist{display:flex;flex-direction:column}
.prow{flex:1;display:grid;grid-template-columns:34px 1fr 210px 52px 76px 104px;align-items:center;gap:14px;border-bottom:1px solid var(--line)}
.prow:last-child{border-bottom:0}
.stopn{width:28px;height:28px;border-radius:50%;background:var(--urg);color:#fff;font:700 13px/28px 'DM Sans',system-ui,sans-serif;text-align:center}
.okdot{width:12px;height:12px;border-radius:50%;background:#9BC096;margin-left:8px}
.dark .okdot{background:#5E8A5A}
.wet .okdot{background:#8EC3CF}
.pname b{display:block;font:600 18px 'DM Sans',system-ui,sans-serif}
.pname span{display:block;font:400 13px 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-top:2px}
.meter{position:relative;height:8px;border-radius:8px;background:var(--soft);overflow:hidden}
.mfill{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:#7FAE79;transition:width .6s}
.mtick{position:absolute;top:0;bottom:0;width:2px;background:var(--ink);opacity:.5}
.dry .mfill{background:var(--urg)}.wet .mfill{background:#6FB0C2}
.ppct{font:700 18px 'DM Sans',system-ui,sans-serif;text-align:right}
.pst{font:600 13px 'DM Sans',system-ui,sans-serif;color:var(--muted)}
.dry .ppct,.dry .pst{color:var(--urg)}
.wbtn{height:44px;border-radius:22px;border:none;background:var(--btn);color:var(--btnInk);font:700 14px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.rcol{display:flex;flex-direction:column;gap:10px;padding:22px;border-radius:26px;background:var(--soft)}
.rstop{display:flex;align-items:center;gap:12px;font:600 16px 'DM Sans',system-ui,sans-serif}
.rstop .rp{margin-left:auto;font:500 14px 'DM Sans',system-ui,sans-serif;color:var(--muted)}
.note{font:400 13px/1.5 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-top:auto}
/* home sheet */
.hsb{grid-template-columns:1.1fr 1.3fr 1fr}
.hpanel{padding:22px 24px;border-radius:26px;background:var(--soft);display:flex;flex-direction:column}
.thermo{display:flex;align-items:center;justify-content:center;gap:22px;margin:auto 0}
.tbtn{width:64px;height:64px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--ink);font:400 30px/1 'DM Sans',system-ui,sans-serif;cursor:pointer;padding:0}
.tset{font:400 96px/1 'Instrument Serif',Georgia,serif}
.csub{font:500 14px 'DM Sans',system-ui,sans-serif;color:var(--muted);text-align:center}
.lights{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.lp{height:64px;border-radius:20px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 17px 'DM Sans',system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;padding:0 18px}
.lp i{width:14px;height:14px;border-radius:50%;background:var(--line);display:block}
.lp small{margin-left:auto;font:600 13px 'DM Sans',system-ui,sans-serif;color:var(--muted)}
.lights.many{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lights.many .lp{height:50px;font-size:15px;padding:0 12px;gap:8px;border-radius:16px}
.lights.many .lp i{width:11px;height:11px;flex:none}
.lights.many .lp small{font-size:12px;white-space:nowrap}
.lp.on{border-color:#D8953F}
.lp.on i{background:#F0A54E;box-shadow:0 0 12px #F0A54E}
.zone{padding:12px 0;border-bottom:1px solid var(--line)}
.zone b{display:block;font:600 17px 'DM Sans',system-ui,sans-serif}
.zone span{display:block;font:400 14px 'DM Sans',system-ui,sans-serif;color:var(--muted);margin-top:3px}
.zbtn{margin-top:10px;height:44px;padding:0 18px;border-radius:22px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 14px 'DM Sans',system-ui,sans-serif;cursor:pointer}
.cam{margin-top:auto;height:56px;border-radius:28px;border:none;background:var(--btn);color:var(--btnInk);font:700 15px 'DM Sans',system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
.toast{position:absolute;left:50%;top:34px;transform:translateX(-50%);z-index:30;padding:13px 22px;border-radius:24px;background:var(--btn);color:var(--btnInk);font:600 14px 'DM Sans',system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);animation:toastin .35s ease-out;white-space:nowrap}
@keyframes toastin{0%{opacity:0;transform:translate(-50%,-10px)}100%{opacity:1;transform:translate(-50%,0)}}
.app.night{--bg:#0B0F12;--glow:#141B1E}
.night .pebs{opacity:.3}
.night .top{opacity:.55}
.night .pikbtn{transform:scale(.84)}
.pikbtn{transition:transform .6s}
.night .bubble:not(.urgent){opacity:.72}
.night .top .clock{color:var(--muted)}
.night .pik{filter:brightness(.8)}
@media (prefers-reduced-motion: reduce){.flow .pk,.dots i,.sheet,.scrim{animation:none!important}}
/* Pik */
.pik svg{display:block;overflow:visible}
.pik .ring{fill:none;stroke:#A99070;stroke-width:1.45;opacity:.58;transform-origin:128px 128px;transition:stroke .4s,opacity .4s,stroke-width .4s}
.pik .hs{stop-color:#A99070;transition:stop-color .5s}
.pik .mute,.pik .badge2{opacity:0;transition:opacity .4s}
.pik .light{transition:opacity .4s}
.pik .f{opacity:0;transition:opacity .28s}
.pik .body{transform-origin:128px 128px}
.pik .mouth{transform-origin:135px 145px}
.p-rest .f-rest,.p-listen .f-listen,.p-think .f-think,.p-speak .f-speak,.p-muted .f-muted,.p-alert .f-alert{opacity:1}
.p-listen .ring{stroke:#ADDFB9;stroke-width:2.4;opacity:.96;animation:pkPulse 1.8s ease-in-out infinite}
.p-listen .hs{stop-color:#ADDFB9}
.p-think .ring{stroke:#C1AFF6;opacity:.96;stroke-dasharray:1 9;stroke-linecap:round;animation:pkSpin 8s linear infinite}
.p-think .hs{stop-color:#C1AFF6}
.p-speak .ring{stroke:#FFD28D;stroke-width:2.4;opacity:.96}
.p-speak .hs{stop-color:#FFD28D}
.p-speak .body{animation:pkBob 1.6s ease-in-out infinite}
.p-speak .mouth{animation:pkTalk .34s ease-in-out infinite alternate}
.p-muted .ring{stroke:#A9AAA1;opacity:.96;stroke-dasharray:4 8}
.p-muted .hs{stop-color:#A9AAA1}
.p-muted .mute,.p-muted .badge2{opacity:1}
.p-muted .light{opacity:.4}
.p-alert .ring{stroke:#FF8F6B;stroke-width:2.8;opacity:1;animation:pkPulse 1.1s ease-in-out infinite}
.p-alert .hs{stop-color:#FF8F6B}
@keyframes pkPulse{0%,100%{transform:scale(1);opacity:.96}50%{transform:scale(1.045);opacity:.5}}
@keyframes pkSpin{to{transform:rotate(360deg)}}
@keyframes pkBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes pkTalk{from{transform:scaleY(.35)}to{transform:scaleY(1.1)}}
@media (prefers-reduced-motion: reduce){.pik *{animation:none!important}}
`;

// Additions for running inside a custom element. They reset inherited text settings to
// the browser defaults the prototype relies on, so a host page (Home Assistant) can't leak in.
export const hostStyles = css`
:host{display:block;position:relative;z-index:0;isolation:isolate;width:1280px;height:800px;font-size:16px;font-weight:400;font-style:normal;line-height:normal;letter-spacing:normal;text-transform:none;text-align:start;white-space:normal}
`;

// Deliberate differences from the prototype, each for a behavior SPEC.md asks for.
// 1. Sheets close on "a tap above". The prototype's template has a .scrim button for
//    that, but its logic never sets sheetOpen, so the scrim never appears there and the
//    page behind an open sheet is not dimmed. The card keeps the scrim for the tap and
//    makes it transparent so it looks the same as the prototype. The top strip sits
//    above the scrim so the demo buttons still work with a sheet open (taps elsewhere
//    on the strip fall through to the scrim and close the sheet).
// 2. Reduced motion means no shimmer (SPEC.md rule 7). The prototype's reduced-motion
//    rules stop packets, pulsing and Pik's bob but miss the battery bar's shimmer.
export const adjustStyles = css`
/* Phone layouts ("flow"): the same parts stacked so they fit a narrower screen.
   mid = an unfolded Galaxy Z Fold or a small tablet; narrow = a phone, or the Fold's cover screen. */
:host([flow]){width:100%;height:auto}
.app.flow{width:100%;height:auto;min-height:calc(100vh - 64px);box-sizing:border-box;padding:18px 18px 28px;display:flex;flex-direction:column;gap:18px;overflow:visible}
.flow .top{position:static;height:auto;flex-wrap:wrap;gap:8px 18px;pointer-events:auto}
.flow .clock{font-size:46px}
.flow .wx b{font-size:28px}
.flow .upc{margin-left:0;width:100%;align-items:flex-start;text-align:left;max-width:none}
.flow .upc.ph .ul{max-width:none}
.flow .stage{position:static;height:auto;gap:18px}
.flow .bubble{min-width:0;height:auto;min-height:280px;padding:22px 24px 22px}
.flow .btitle{font-size:36px}
.flow .bdetail{font-size:17px}
.flow .acts{flex-wrap:wrap;margin-top:22px}
.flow .peek{display:none}
.flow .pebs{position:static;height:auto;grid-auto-flow:row;grid-auto-columns:auto;grid-template-columns:repeat(3,minmax(0,1fr))}
.flow .peb{min-height:140px;min-width:0;overflow:hidden}
.flow .npc{flex-wrap:wrap}
.flow .pv{font-size:42px}
.flow .scrim{position:fixed}
.flow .sheet{position:fixed;left:0;right:0;bottom:0;height:auto;max-height:90vh;overflow-y:auto;padding:12px 18px 28px;border-radius:26px 26px 0 0}
.flow .stitle{font-size:34px}
.flow .sbody{grid-template-columns:1fr}
.flow .emap{width:100%;height:auto}
.flow .ewin{padding:10px}
.flow .prow{padding:10px 0;grid-template-columns:30px 1fr 120px 52px 92px;column-gap:10px}
.flow .prow .pst{display:none}
.flow .rcol .note{margin-top:12px}
.flow .thermo{margin:18px 0}
.flow .lights.many .lp{height:54px}
.flow .cam{margin-top:16px}
.flow .toast{position:fixed;top:18px;white-space:normal;max-width:86vw;text-align:center}
/* mid: Pik beside the bubble, three tiles across */
.mid .pikcol{width:200px}
.mid .pikbtn,.mid .tmode .pikbtn{width:180px;height:180px}
.mid .pikbtn svg,.mid .tmode .pikbtn svg{width:180px;height:180px}
.mid .hsb{grid-template-columns:1fr 1fr}
.mid .hsb .hpanel:last-child{grid-column:1 / -1}
/* narrow: one column, Pik small beside its name, two tiles across */
.narrow .stage{flex-direction:column;align-items:stretch}
.narrow .pikcol{width:auto;flex-direction:row;flex-wrap:wrap;align-items:center;gap:10px 14px}
.narrow .pikbtn,.narrow .tmode .pikbtn{width:92px;height:92px}
.narrow .pikbtn svg,.narrow .tmode .pikbtn svg{width:92px;height:92px}
.narrow .pikname{margin-top:0}
.narrow .timers{margin-top:0;flex:1 1 100%}
.narrow .bubble::before{display:none}
.narrow .bubble{min-height:240px;padding:20px}
.narrow .btitle{font-size:32px}
.narrow .nav .nbtn{width:40px;height:40px}
.narrow .pbtn,.narrow .sbtn{height:52px;padding:0 20px}
.narrow .pebs{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.narrow .np{grid-column:1 / -1}
.narrow .peb{min-height:124px;padding:14px 16px}
.narrow .pv{font-size:36px}
.narrow .clock{font-size:40px}
.narrow .sep{display:none}
.narrow .prow{grid-template-columns:28px 1fr 44px 84px}
.narrow .prow .meter{display:none}
.narrow .lights.many{grid-template-columns:1fr}

.scrim,.dark .scrim{background:transparent;animation:none}
.top{z-index:22;pointer-events:none}
.top .demo{pointer-events:auto}
@media (prefers-reduced-motion: reduce){.bfill{animation:none!important}}
`;
