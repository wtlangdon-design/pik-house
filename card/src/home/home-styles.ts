// The Pik House system screen: Home, Ambient stories and Moments (1280×800, scaled to fit).
import { css } from "lit";

export const homeStyles = css`
:host{display:block;--cream:#F1E8DA;--card:#FCF8F1;--ink:#2A221B;--mute:#7A6C5E;--mute2:#5E5145;--line:#E6DACB;--line2:#EFE5D8;--clay:#9A5530;--sun:#F0B25E;--green:#5E8A5A;--blue:#3F6E9A;--serif:'Instrument Serif',Georgia,serif;--sans:'Instrument Sans',system-ui,sans-serif;font-family:var(--sans);color:var(--ink)}
*{box-sizing:border-box}
button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.root{width:1280px;height:800px;position:relative;overflow:hidden;background:var(--cream)}
.eb{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mute);font-weight:600}
.serif{font-family:var(--serif);font-weight:400}

/* ---------- Home ---------- */
.home{position:absolute;inset:0;padding:24px 26px;display:grid;grid-template-columns:292px minmax(0,1fr);grid-template-rows:minmax(0,1fr) 196px;gap:16px}
.left{display:flex;flex-direction:column;gap:10px;min-height:0}
.clock{display:flex;align-items:baseline;gap:10px}
.clock b{font-family:var(--serif);font-weight:400;font-size:58px;line-height:.9}
.clock span{font-size:14px;color:var(--mute)}
.wxl{font-size:14px;color:var(--mute2)}
.pikbtn{background:none;border:0;padding:0;align-self:center;margin:2px 0;border-radius:50%}
.pikbtn svg{width:184px;height:184px}
.mini{display:block}.mini svg{width:100%!important;height:100%!important}
.bubble{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:15px 18px;display:flex;flex-direction:column;gap:6px;min-height:0;overflow:hidden}
.bubble .who{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--clay);font-weight:600;display:flex;justify-content:space-between;align-items:center}
.bubble .line{font-family:var(--serif);font-size:23px;line-height:1.16}
.bubble .line.s2{font-size:20px}.bubble .line.s3{font-size:18px}
.bubble .q{font-size:14px;color:var(--mute2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cdots{display:flex;gap:4px}.cdots i{width:6px;height:6px;border-radius:50%;background:#D6C8B6}.cdots i.on{background:var(--clay)}
.leftfoot{margin-top:auto;display:flex;gap:8px;align-items:center;justify-content:center;font-size:13px;color:var(--mute)}
.chip{border:1px solid var(--line);background:transparent;border-radius:999px;padding:0 14px;min-height:40px;font-size:13px;color:var(--mute2);display:inline-flex;align-items:center;gap:6px}
.chip.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.main{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:16px;min-height:0}
.us{grid-column:span 2;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.person{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:13px 18px;display:flex;align-items:center;gap:14px;min-width:0;text-align:left}
.av{width:46px;height:46px;border-radius:50%;color:#FCF8F1;display:flex;align-items:center;justify-content:center;font-weight:600;flex:none;position:relative}
.av.sm{width:28px;height:28px;font-size:13px}
.av .dot{position:absolute;right:-1px;bottom:-1px;width:13px;height:13px;border-radius:50%;border:2px solid var(--card)}
.person b{font-size:16px;font-weight:600;display:block}
.person span{font-size:14px;color:var(--mute2);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.panel{background:var(--card);border:1px solid var(--line);border-radius:26px;padding:16px 20px;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.phead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;gap:8px}
.legend{font-size:13px;color:var(--mute);white-space:nowrap}
.legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px 0 10px}
.rows{overflow:hidden;min-height:0}
.row{display:flex;align-items:center;gap:14px;padding:9px 0;border-top:1px solid var(--line2);width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left}
.row .t{width:74px;flex:none;font-size:15px;font-weight:600}
.row .t small{display:block;font-size:11px;font-weight:500;color:var(--mute);letter-spacing:.5px;text-transform:uppercase}
.row .c{width:10px;height:10px;border-radius:50%;flex:none}
.row .w{flex:1;min-width:0;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .n{font-size:13px;color:var(--mute);text-align:right;max-width:40%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row.past{opacity:.45}
.empty{font-size:15px;color:var(--mute);padding:14px 0;line-height:1.5}
.fitem{display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line2);align-items:flex-start}
.fitem .fb{flex:1;min-width:0;background:none;border:0;padding:0;text-align:left}
.fitem .ft{font-size:15px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fitem .fs{font-size:12px;color:var(--mute);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fitem .fx{width:34px;height:34px;border-radius:50%;border:0;background:transparent;color:var(--mute);font-size:18px;flex:none}
.fitem.urgent .ft{color:#A2412B;font-weight:600}
.house{background:#E9DFD0;color:var(--mute2)}
.tiles{grid-column:1 / -1;display:grid;gap:12px;min-height:0}
.tile{border-radius:24px;padding:15px 17px;display:flex;flex-direction:column;gap:6px;min-width:0;overflow:hidden;text-align:left;border:1px solid var(--line);background:var(--card)}
.tile .big{font-family:var(--serif);font-size:28px;line-height:1.02}
.tile .sub{font-size:13px;color:var(--mute2);line-height:1.38}
.tile.dark{background:#1F2A2E;color:#F3EDE3;border-color:#1F2A2E}.tile.dark .eb{color:#9FB4BC}.tile.dark .sub{color:#C9D3D6}
.tile.wine{background:#2B1B1E;color:#F5ECE4;border-color:#2B1B1E}.tile.wine .eb{color:#E2A6A0}.tile.wine .sub{color:#D8C6C1}
.tile.smoke{background:#2E2520;color:#F5ECE4;border-color:#2E2520}.tile.smoke .eb{color:#E9C08C}.tile.smoke .sub{color:#D9CBBE}
.tile.tmr{background:var(--ink);color:#F5ECE4;border-color:var(--ink)}.tile.tmr .eb{color:#E9C08C}
.pots{display:flex;gap:5px;align-items:flex-end}
.pot{width:18px;display:flex;flex-direction:column;align-items:center;gap:3px}
.pot i{display:block;width:15px;height:24px;border-radius:8px 8px 3px 3px;background:var(--green)}
.pot u{display:block;width:17px;height:8px;border-radius:2px 2px 5px 5px;background:#C98F65}
.pot s{display:block;width:6px;height:6px;border-radius:50%;background:#6FA3C7}
.pot.dry i{background:#7D8F5A}.pot.dry s{background:#E39B4B}
.shelf{display:flex;gap:2px;align-items:flex-end;height:40px;border-bottom:2px solid #6B4A3A}
.shelf i{display:block;width:6px;height:36px;border-radius:3px 3px 1px 1px}
.mbtns{display:flex;gap:6px;margin-top:auto}
.rb{width:44px;height:44px;border-radius:50%;border:1px solid #D6C8B6;background:transparent;display:flex;align-items:center;justify-content:center}
.rb.ink{background:var(--ink);color:#FCF8F1;border-color:var(--ink)}
.trow{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}
.trow b{font-family:var(--serif);font-weight:400;font-size:24px}
.trow.rang b{color:#FFB58A}
@keyframes flow{to{stroke-dashoffset:-24}}
.flow{stroke-dasharray:3 9;animation:flow .9s linear infinite}
.flow.off{animation:none;opacity:.18}

/* ---------- Ambient stories ---------- */
.amb{position:absolute;inset:0;display:flex;flex-direction:column;animation:fade .7s ease}
@keyframes fade{from{opacity:0}to{opacity:1}}
.story{flex:1;min-height:0;padding:46px 60px 0;display:flex;flex-direction:column;gap:22px}
.sfoot{display:flex;align-items:center;justify-content:space-between;padding:14px 60px 26px;font-size:13px}
.sdots{display:flex;gap:6px;align-items:center}.sdots i{width:6px;height:6px;border-radius:3px;background:currentColor;opacity:.3;transition:width .4s,opacity .4s}.sdots i.on{width:22px;opacity:.9}
.skip{border:0;background:transparent;font-size:13px;min-height:40px;padding:0 6px;opacity:.75}
.shead{display:flex;align-items:center;gap:26px}
.shead svg{width:140px;height:140px;flex:none}
.kicker{font-size:13px;letter-spacing:1.8px;text-transform:uppercase;font-weight:600}
.h1{font-family:var(--serif);font-weight:400;font-size:56px;line-height:1.02;margin:8px 0 0}
.glass{background:rgba(252,248,241,.75);border:1px solid var(--line);border-radius:28px;padding:22px 28px}
.lanes{display:flex;flex-direction:column;gap:14px}
.lane{display:grid;grid-template-columns:96px minmax(0,1fr);align-items:center}
.lane b{font-weight:600}
.track{position:relative;height:50px;border-radius:12px}
.ev{position:absolute;top:0;bottom:0;border-radius:10px;color:#FCF8F1;font-size:13px;padding:0 10px;display:flex;align-items:center;white-space:nowrap;overflow:hidden;min-width:10px}
.nowline{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--clay);border-radius:1px}
.hours{display:grid;grid-template-columns:96px minmax(0,1fr);font-size:13px;color:var(--mute);margin-bottom:8px}
.hours i{display:block}.hours div{position:relative;height:16px}.hours span{position:absolute;transform:translateX(-50%)}
.cards4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.sc{border-radius:24px;padding:18px 22px;background:rgba(252,248,241,.75);border:1px solid var(--line)}
.sc .big{font-family:var(--serif);font-size:36px;line-height:1.02;margin-top:6px}
.sc .sub{font-size:15px;color:var(--mute2);margin-top:6px;line-height:1.4}
.dark-s{color:#F3EDE3}
.dark-s .glass,.dark-s .sc{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}
.dark-s .sc .sub{color:#C7CEE3}
.bigplants{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px;align-items:end}
.bp{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.bp .bar{width:22px;height:300px;border-radius:9px;background:rgba(94,138,90,.14);position:relative;overflow:hidden}
.bp .bar i{position:absolute;left:0;right:0;bottom:0;background:var(--green);border-radius:9px}
.bp .bar u{position:absolute;left:-4px;right:-4px;height:2px;background:#E39B4B}
.bp.dry .bar i{background:#E39B4B}
.bp b{font-size:15px}.bp span{font-size:13px;color:var(--mute)}
.bigshelf{display:flex;gap:8px;align-items:flex-end;justify-content:center;border-bottom:4px solid #6B4A3A;padding:0 20px}
.bigshelf svg{width:34px;height:118px}

/* ---------- Moments ---------- */
.mom{position:absolute;inset:0;display:flex;flex-direction:column;animation:fade .45s ease;z-index:5}
.mom.navy{background:#17213A;color:#F3EDE3}
.mom.paper{background:#F4E9DA}
.mom.storm{background:#20262E;color:#EEF0F2}
.mom.ring{background:radial-gradient(ellipse at 30% 20%,#26305A 0%,#1B2240 45%,#121730 100%);color:#E9E6F2}
.mpad{flex:1;min-height:0;padding:40px 56px 30px;display:flex;flex-direction:column;gap:20px}
.mbar{display:flex;align-items:center;gap:14px}
.mbar .grow{flex:1;font-size:16px;opacity:.85}
.pill{font:600 17px var(--sans);border:0;border-radius:999px;padding:0 28px;min-height:56px}
.pill.sun{background:var(--sun);color:#17213A}
.pill.ink{background:var(--ink);color:#FCF8F1}
.pill.ghost{background:transparent;border:1px solid currentColor;opacity:.85;font-weight:500}
.cnt{width:220px;height:220px;flex:none;position:relative;display:flex;align-items:center;justify-content:center}
.cnt svg{position:absolute;inset:0}
.cnt b{font-family:var(--serif);font-weight:400;font-size:84px;line-height:.9;display:block;text-align:center}
.cnt span{font-size:15px;opacity:.8;display:block;text-align:center}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.mcard{border-radius:26px;padding:20px 24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.mcard .big{font-family:var(--serif);font-size:36px;line-height:1.05;margin-top:8px}
.mcard .sub{font-size:16px;opacity:.8;margin-top:6px;line-height:1.5}
.paper .mcard{background:var(--card);border-color:var(--line)}
.camwrap{position:relative;border-radius:22px;overflow:hidden;background:#20263A;flex:1;min-height:0}
.camwrap img{width:100%;height:100%;object-fit:cover;display:block}
.camtag{position:absolute;left:16px;top:14px;font-size:13px;display:flex;gap:8px;align-items:center;background:rgba(0,0,0,.35);padding:4px 10px;border-radius:999px}
.camtag i{width:8px;height:8px;border-radius:50%;background:#E0645A}

/* ---------- Sheets (Energy, Pik's notes) ---------- */
.scrim{position:absolute;inset:0;background:rgba(42,34,27,.35);z-index:8;animation:fade .3s}
.sheet{position:absolute;left:40px;right:40px;bottom:0;top:70px;background:var(--card);border-radius:30px 30px 0 0;z-index:9;padding:26px 34px;display:flex;flex-direction:column;gap:16px;animation:up .35s ease;overflow:hidden}
@keyframes up{from{transform:translateY(100%)}to{transform:none}}
.sheet.darkx{background:#1F2A2E;color:#F3EDE3}
.shtop{display:flex;align-items:center;gap:14px}
.shtop h2{font-family:var(--serif);font-weight:400;font-size:40px;margin:0;flex:1}
.done{min-height:48px;padding:0 22px;border-radius:999px;border:1px solid currentColor;background:transparent;opacity:.85}
.rule{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line2)}
.rule .rw{flex:1;font-size:17px}
.rule small{display:block;font-size:13px;color:var(--mute)}
.bars{display:flex;flex-direction:column;gap:8px}
.lbar{display:grid;grid-template-columns:110px minmax(0,1fr) 54px;gap:10px;align-items:center;font-size:14px}
.lbar .tk{height:10px;border-radius:5px;background:var(--line2);position:relative}
.lbar .tk i{position:absolute;top:0;bottom:0;border-radius:5px}
.vbub{position:absolute;left:50%;bottom:112px;transform:translateX(-50%);width:720px;max-width:calc(100% - 80px);background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:26px;padding:16px 22px;z-index:7;box-shadow:0 30px 60px -20px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:6px;animation:fade .3s}
.vbub.inline{position:static;transform:none;width:auto;max-width:none;box-shadow:none;animation:none}.vbub.inline .line{font-size:22px}
.vbub .who{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--clay);font-weight:600;display:flex;justify-content:space-between}
.vbub .q{font-size:14px;color:var(--mute2)}
.vbub .line{font-family:var(--serif);font-size:26px;line-height:1.15}
.toast{position:absolute;left:50%;top:22px;transform:translateX(-50%);background:var(--ink);color:#FCF8F1;padding:12px 22px;border-radius:999px;font-size:15px;z-index:20;animation:fade .3s}

/* ---------- Illustrated pieces ---------- */
.tile.scene,.tile.photo,.tile.wall{position:relative;padding:0;border:0}
.tile.scene{background:#0F1720}
.tile.scene svg{position:absolute;inset:0}
.sov{position:absolute;left:0;right:0;top:0;padding:14px 16px 26px;background:linear-gradient(180deg,rgba(10,14,22,.62),rgba(10,14,22,0));color:#fff}
.sov .eb{color:rgba(255,255,255,.8)}
.sov .big{font-family:var(--serif);font-size:26px;line-height:1.02;color:#fff}
.sov .sub{font-size:12.5px;color:rgba(255,255,255,.86);margin-top:2px}
.sov.low{top:auto;bottom:0;padding:26px 16px 13px;background:linear-gradient(0deg,rgba(18,26,16,.78),rgba(18,26,16,0))}
.tile.photo{background:#3F5A38}
.tile.photo .hero{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:kb 24s ease-in-out infinite alternate}
@keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.12) translate(-2%,-2%)}}
.pshade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,0) 40%)}
.prow{position:absolute;left:10px;right:10px;top:10px;display:flex;gap:3px;justify-content:space-between}
.pring{position:relative;flex:none;border-radius:50%}
.pring img,.pring .noimg{position:absolute;border-radius:50%;object-fit:cover;background:#5E8A5A;display:block}
.pring svg{position:absolute;inset:0}
.pring.dry{animation:thirst 2.2s ease-in-out infinite}
@keyframes thirst{0%,100%{filter:drop-shadow(0 0 0 rgba(227,137,59,0))}50%{filter:drop-shadow(0 0 10px rgba(227,137,59,.85))}}
.pring .drop{position:absolute;right:-2px;top:-2px;width:22px;height:22px;border-radius:50%;background:#E3893B;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.prow .pring .drop{width:14px;height:14px;right:-3px;top:-3px}.prow .pring .drop svg{width:9px;height:9px}
.rlab{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:8px;width:112px;text-align:center;font-size:12px;line-height:1.25;color:var(--mute)}
.rlab b{display:block;font-size:13px;color:var(--ink)}
.ringgrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;justify-items:center;padding-bottom:44px}
.thumbs{display:flex;gap:10px;overflow:hidden}
.thumb{width:78px;flex:none;text-align:center;font-size:11px;color:var(--mute2)}
.thumb img{width:78px;height:78px;border-radius:16px;object-fit:cover;display:block;margin-bottom:4px}
.mosaic{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
.thumb.big{width:auto;font-size:13px}.thumb.big img{width:100%;height:auto;aspect-ratio:1;border-radius:20px}
.thumb span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile.wall{background:linear-gradient(180deg,#3B2418,#24150F);color:#F5ECE4;padding:10px 10px 12px;display:flex;flex-direction:column;gap:8px}
.minirack{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;flex:1;min-height:0}
.minirack .niche{height:auto!important;min-height:0}
.wtxt .eb{color:#E2A6A0}.wtxt .sub{color:#D8C6C1;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.niche{position:relative;border:0;padding:6px 4px 4px;border-radius:10px;overflow:hidden;background:radial-gradient(ellipse at 50% 18%,#FFF4E2 0%,#F1DEC2 55%,#C9A983 100%);box-shadow:inset 0 0 0 2px rgba(60,34,20,.55),inset 0 -10px 18px rgba(80,45,20,.25);display:flex;align-items:flex-end;justify-content:center}
.niche img{height:100%;width:100%;object-fit:contain;transform:scale(1.32);transform-origin:50% 92%;mix-blend-mode:multiply;filter:saturate(1.05) contrast(1.05);position:relative;z-index:1}
.niche .nart{display:flex;align-items:flex-end;justify-content:center;height:100%;position:relative;z-index:1}
.niche .nart svg{height:100%;width:auto;filter:drop-shadow(0 4px 4px rgba(0,0,0,.25))}
.niche .nlight{position:absolute;left:15%;right:15%;top:0;height:8px;border-radius:0 0 50% 50%;background:rgba(255,236,190,.9);filter:blur(3px)}
.niche .ncount{position:absolute;right:5px;top:5px;z-index:2;background:#5A1626;color:#FCF8F1;font-size:11px;font-weight:600;border-radius:999px;padding:2px 7px}
.niche.hot{box-shadow:inset 0 0 0 2px #F0B25E,0 0 18px rgba(240,178,94,.55)}
.winestory{flex-direction:row;gap:44px;align-items:stretch}
.wfeat{width:380px;flex:none;display:flex;flex-direction:column;gap:12px}
.wbig .niche{width:100%;border-radius:22px;padding:18px 18px 10px}
.wmeta{font-size:16px;color:#D8C6C1;line-height:1.5}.wmeta b{color:#fff;font-weight:600}
.wright{flex:1;min-width:0;display:flex;flex-direction:column;gap:16px}
.rack{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;padding:16px;border-radius:22px;background:linear-gradient(180deg,#5A3726,#3A2218);box-shadow:inset 0 2px 0 rgba(255,255,255,.08),0 30px 60px -30px rgba(0,0,0,.6)}
.scenestory{position:relative;padding:0!important}
.amb.over .sfoot{position:absolute;left:0;right:0;bottom:0;z-index:2;color:#fff!important;background:linear-gradient(0deg,rgba(8,12,20,.5),rgba(8,12,20,0))}
.scenebg{position:absolute;inset:0}
.sceneov{position:relative;z-index:1;display:flex;flex-direction:column;gap:12px;padding:46px 60px 0;max-width:720px;height:100%}
.scenestory .sceneov{background:linear-gradient(90deg,rgba(8,12,20,.6),rgba(8,12,20,.25) 70%,rgba(8,12,20,0));max-width:none;width:52%}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
.echip{background:rgba(255,255,255,.16);backdrop-filter:blur(6px);color:#fff;border-radius:999px;padding:8px 16px;font-size:15px}
.echip b{font-family:var(--serif);font-weight:400;font-size:22px;margin-right:4px}
@media (prefers-reduced-motion: reduce){.tile.photo .hero,.pring.dry{animation:none!important}}

/* ---------- Phone ---------- */
.root.phone{width:auto;height:auto;overflow:visible;background:var(--cream);min-height:100vh}
.phonewrap{display:flex;flex-direction:column;gap:12px;padding:14px 12px 24px;max-width:760px;margin:0 auto}
.ph-top{display:flex;align-items:center;gap:12px}
.ph-clock{font-family:var(--serif);font-size:40px;line-height:1}.ph-clock span{font-family:var(--sans);font-size:14px;color:var(--mute)}
.ph-bub .line{font-size:20px}
.ph-us{grid-column:auto}
.phone .us{display:grid;grid-template-columns:1fr;gap:8px}
@media (min-width:560px){.phone .us{grid-template-columns:1fr 1fr}}
.phone .person{padding:11px 14px}.phone .av{width:40px;height:40px}
.ph-row{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -12px;padding:0 12px 4px;scrollbar-width:none}
.ph-row::-webkit-scrollbar{display:none}
.ph-card{flex:none;width:min(78vw,340px);height:210px;scroll-snap-align:start;display:flex}
.ph-card>*{flex:1;width:100%;height:100%}
.phone .panel{padding:14px 16px}
.phone .row .n{display:none}
.phone .sheet{position:fixed;left:0;right:0;top:56px;bottom:0;border-radius:24px 24px 0 0;padding:20px;z-index:20}
.phone .sheet .shtop h2{font-size:28px}
.phone .scrim{position:fixed;z-index:19}
.phone .sheet [style*="grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr)"]{grid-template-columns:1fr!important;overflow:auto}
.phone .toast{position:fixed;top:70px}
.ban{border-radius:24px;padding:16px 18px;display:flex;flex-direction:column;gap:6px}
.ban .bk{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;opacity:.8}
.ban .bt{font-family:var(--serif);font-size:28px;line-height:1.08}
.ban .bs{font-size:14px;opacity:.85}
.ban .bb{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.ban .pill{min-height:44px;font-size:15px;padding:0 18px}
.ban.navy{background:#17213A;color:#F3EDE3}.ban.storm{background:#20262E;color:#EEF0F2}
.ban.ring{background:#1B2240;color:#E9E6F2}.ban.paper{background:var(--card);border:1px solid var(--line)}
.ban.paper .pill.ghost{color:var(--ink)}
.bimg{width:100%;border-radius:14px;margin-top:4px;cursor:pointer}
.lightsT{gap:8px}
.lgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;overflow:auto;min-height:0}
.lg{border:1px solid var(--line);background:transparent;border-radius:12px;padding:6px 10px;text-align:left;display:flex;justify-content:space-between;gap:6px;font-size:13px;min-height:40px;align-items:center}
.lg b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lg span{color:var(--mute);font-size:12px;flex:none}
.lg.on{background:#FFF1D6;border-color:#F0B25E}

/* ---------- Energy (live chart) & plants (no photos) ---------- */
.tile.etile{position:relative;background:radial-gradient(120% 90% at 80% 0%,#22324A 0%,#121B2B 55%,#0C1320 100%);color:#F3EDE3;border:0;padding:13px 15px 0;gap:4px}
.etop{display:flex;justify-content:space-between;gap:8px}
.etile .eb{color:#9FB0C4}
.enum{font-family:var(--serif);font-size:30px;line-height:1.02;color:#fff;white-space:nowrap}.enum small{font-family:var(--sans);font-size:12px;color:#C9D3DE}
.esub{font-size:12.5px;color:#C9D3DE;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.egauge{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;color:#A8E6A0;font-weight:600;flex:none}
.echart{flex:1;min-height:0;margin:0 -15px;position:relative}
.ebig{display:flex;flex-direction:column;gap:16px;height:100%;min-height:0;color:#F3EDE3}
.ebhead{display:flex;align-items:flex-start;gap:16px}
.ebchart{flex:1;min-height:180px;position:relative;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0));border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:14px 8px 4px}
.elegend{position:absolute;right:52px;top:12px;display:flex;gap:14px;font-size:12px;color:#C9D3DE}
.elegend i{display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}
.elegend i.ghost{background:repeating-linear-gradient(90deg,rgba(255,200,97,.6) 0 2px,transparent 2px 5px)}
.elegend i.dash{background:repeating-linear-gradient(90deg,#DDE7F3 0 4px,transparent 4px 7px)}
.flowrow{display:flex;align-items:center;gap:0}
.fnode{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:10px 14px;flex:none}
.fnode .fi{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.fnode.fn-sun .fi{background:rgba(255,200,97,.16);color:#FFC861}.fnode.fn-home .fi{background:rgba(255,255,255,.1);color:#F3EDE3}
.fnode.fn-bat .fi{background:rgba(142,219,154,.16);color:#8EDB9A}.fnode.fn-grid .fi{background:rgba(143,194,240,.16);color:#8FC2F0}
.fk{display:block;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9FB0C4}
.fnode b{display:block;font-family:var(--serif);font-weight:400;font-size:24px;line-height:1.05;color:#fff}
.fs2{display:block;font-size:12px;color:#C9D3DE}
.flink{flex:1;min-width:24px;height:3px;border-radius:2px;margin:0 8px;background:rgba(255,255,255,.12);position:relative;overflow:hidden}
.flink.on{background:linear-gradient(90deg,transparent 0 30%,var(--fc) 30% 45%,transparent 45% 100%);background-size:60px 3px;animation:flowx 1.1s linear infinite;box-shadow:0 0 8px var(--fc)}
.flink.on.rev{animation-direction:reverse}
@keyframes flowx{from{background-position:0 0}to{background-position:60px 0}}
.sheet.esheet{padding:26px 34px}
.tile.ptile{gap:5px;padding:11px 14px}
.prows{display:flex;flex-direction:column;gap:1px;flex:1;justify-content:space-between;min-height:0}
.prow2{display:grid;grid-template-columns:15px minmax(0,1fr) 60px 30px;align-items:center;gap:6px;font-size:12px;line-height:16px}
.prow2 .pn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.prow2 .pb{position:relative;height:7px;border-radius:4px;background:rgba(94,138,90,.15)}
.prow2 .pb i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--green)}
.prow2 .pb u{position:absolute;top:-3px;bottom:-3px;width:2px;background:#E3893B;border-radius:1px}
.prow2 b{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
.prow2.dry .pn,.prow2.dry b{color:#C2671F;font-weight:600}.prow2.dry .pb i{background:#E3893B}
.gring{position:relative;flex:none}
.gring svg{display:block}
.gring .gicon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.gring.dry{animation:thirst 2.2s ease-in-out infinite;border-radius:50%}
.gcell{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.gcell b{font-size:13px;line-height:1.2}.gcell span{font-family:var(--serif);font-size:24px;line-height:1}.gcell span.hot{color:#C2671F}
.ringgrid{padding-bottom:0}
.bigpct{font-family:var(--serif);font-size:56px;line-height:1}.bigpct small{font-family:var(--sans);font-size:14px;color:var(--mute)}
.namechips{display:flex;flex-wrap:wrap;gap:6px}.namechips span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:13px}
@media (prefers-reduced-motion: reduce){.flow,.amb,.mom,.sheet,.flink{animation:none!important}}
`;
