// Styles for the smoking card: same Daylight palette and type as the holiday kitchen page.
import { css } from "lit";

export const smokeStyles = css`
:host{--bg:#F3ECE0;--glow:#FCF7EE;--ink:#2A2019;--muted:#7A6B5A;--card:#FFFBF4;--line:#E2D5C1;--soft:#EDE3D3;--btn:#2A2019;--btnInk:#FBF6EE;
--amber:#C98A3A;--amberBg:#FBF0DD;--amberInk:#8A5A1C;--red:#C2452F;--redBg:#FBE7E1;--green:#4F7A4A;--greenBg:#E4EEDD;--smoke:#8C5A3C;
--shadow:0 1px 2px rgba(60,40,20,.06),0 6px 18px rgba(60,40,20,.07);
display:block;height:calc(100vh - var(--header-height, 0px));overflow:auto;background:radial-gradient(ellipse at 20% 0%,var(--glow) 0%,var(--bg) 60%) fixed;color:var(--ink);font-family:'DM Sans',system-ui,sans-serif}
*{box-sizing:border-box}
button{font:inherit;color:inherit}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.eb{font:700 11px/1.2 'DM Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.wrap{max-width:1280px;margin:0 auto;padding:18px 28px 28px;min-height:100%;display:flex;flex-direction:column}
header{display:flex;align-items:flex-end;gap:16px;margin-bottom:14px}
.ti{display:flex;flex-direction:column;gap:2px}
h1{margin:0;font-size:46px;line-height:1}
.sub{color:var(--muted);font-size:15px}
.acts{margin-left:auto;display:flex;align-items:center;gap:10px}
.cf{font-weight:600;font-size:14px}
.btn{height:44px;padding:0 18px;border-radius:22px;border:1px solid var(--line);background:var(--card);font-weight:700;font-size:14px;cursor:pointer}
.btn.ink{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.btn.sm{height:36px;padding:0 14px;font-size:13px}
.btn:disabled{opacity:.4;cursor:default}
.ico{width:44px;height:44px;border-radius:22px;border:1px solid var(--line);background:var(--card);font-size:18px;cursor:pointer}
.ico.off{background:var(--soft)}
.banner{display:flex;align-items:center;gap:14px;background:var(--amberBg);border-radius:18px;padding:12px 14px 12px 20px;margin-bottom:14px;font-weight:600;font-size:16px}
.banner span{flex:1}
.grid{flex:1;display:grid;gap:16px;grid-template-columns:repeat(2,1fr);grid-auto-rows:minmax(0,1fr)}
.grid.g1{grid-template-columns:1fr}
.tile{background:var(--card);border-radius:26px;box-shadow:var(--shadow);padding:18px 22px 18px;display:flex;flex-direction:column;gap:8px;cursor:pointer;min-height:250px;position:relative;border:2px solid transparent}
.th{display:flex;align-items:center;gap:12px}
.em{position:relative;width:34px;height:34px;color:var(--smoke);flex:none}
.em svg{width:100%;height:100%;display:block}
.pn{position:absolute;top:-6px;right:-8px;min-width:19px;height:19px;border-radius:10px;background:var(--red);color:#fff;font:700 11px/19px 'DM Sans',sans-serif;text-align:center;padding:0 5px;box-shadow:0 0 0 2px var(--card)}
.nm{font-weight:700;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.nm.none{color:var(--muted);font-weight:600}
.word{margin-left:auto;flex:none;height:28px;line-height:28px;padding:0 12px;border-radius:14px;font-weight:700;font-size:13px;background:var(--soft);color:var(--muted)}
.mid{display:flex;align-items:flex-end;gap:14px}
.temp{font-size:84px;line-height:.9;letter-spacing:-.01em}
.temp small{font:600 18px 'DM Sans',sans-serif;color:var(--muted);margin-left:4px;vertical-align:top;position:relative;top:10px}
.tg{margin-left:auto;text-align:right;display:flex;flex-direction:column;gap:2px;padding-bottom:6px}
.tg b{font:400 34px/1 'Instrument Serif',Georgia,serif}
.bar{height:8px;border-radius:4px;background:var(--soft);overflow:hidden}
.bar i{display:block;height:100%;border-radius:4px;background:var(--amber)}
.spark{width:100%;flex:1;min-height:36px;height:46px;display:block}
.spark .ln2{fill:none;stroke:var(--smoke);stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round;opacity:.75}
.spark .tl{stroke:var(--muted);stroke-width:1;stroke-dasharray:4 4;vector-effect:non-scaling-stroke;opacity:.6}
.ln{font-size:15px;line-height:1.4;color:var(--ink);margin-top:auto}
.got{position:absolute;right:20px;bottom:16px}
.tile.done .ln{padding-right:110px}
/* one meaning per color: amber = close / watch, red = problem, green = done */
.tile.off,.tile.idle{background:#FBF6EC}
.tile.off .temp,.tile.idle .temp{color:var(--muted)}
.tile.warn{border-color:var(--amber)}.tile.warn .word{background:var(--amberBg);color:var(--amberInk)}
.tile.stall .word{background:var(--amberBg);color:var(--amberInk)}
.tile.bad{border-color:var(--red);background:#FFF6F2}.tile.bad .word{background:var(--red);color:#fff}
.tile.done{border-color:var(--green);background:#F6FAF2}.tile.done .word{background:var(--green);color:#fff}.tile.done .bar i{background:var(--green)}
.tile.ok .word{background:var(--greenBg);color:var(--green)}
/* editor */
.scrim{position:fixed;inset:0;background:rgba(42,32,25,.35);display:flex;align-items:flex-end;justify-content:center;z-index:30}
.sheet{width:min(860px,100%);background:var(--card);border-radius:28px 28px 0 0;padding:22px 26px 24px;display:flex;flex-direction:column;gap:16px;max-height:92vh;overflow:auto}
.sh h2{margin:4px 0 0;font-size:34px}
.chips,.kinds{display:flex;flex-wrap:wrap;gap:8px}
.chip{height:44px;padding:0 18px;border-radius:22px;border:1px solid var(--line);background:#fff;font-weight:600;font-size:15px;cursor:pointer}
.chip.on{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.txt{height:48px;border-radius:14px;border:1px solid var(--line);padding:0 16px;font:500 17px 'DM Sans',sans-serif;background:#fff}
.row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.stepper{display:flex;align-items:center;gap:6px}
.stepper button{width:52px;height:44px;border-radius:14px;border:1px solid var(--line);background:#fff;font-weight:700;cursor:pointer}
.stepper b{min-width:120px;text-align:center;font:400 30px 'Instrument Serif',Georgia,serif}
.foot{display:flex;gap:10px;align-items:center;padding-top:4px}
@media (max-width:760px){
  .wrap{padding:14px}
  header{flex-wrap:wrap}
  .acts{margin-left:0}
  .grid{grid-template-columns:1fr;grid-auto-rows:auto}
  .tile{min-height:0}
  .temp{font-size:64px}
}
@media (max-height:760px) and (min-width:761px){
  .tile{min-height:0;padding:14px 20px}
  .temp{font-size:68px}
  h1{font-size:38px}
}
`;
