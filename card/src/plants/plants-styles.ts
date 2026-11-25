// Styles for the plant catalog, in the Daylight palette used by the other Pik cards.
import { css } from "lit";

export const plantsStyles = css`
:host{--bg:#F3ECE0;--ink:#2A2019;--muted:#7A6B5A;--card:#FFFBF4;--line:#E2D5C1;--soft:#EDE3D3;--btn:#2A2019;--btnInk:#FBF6EE;--green:#4F7A4A;--greenBg:#E4EEDD;--dry:#C2452F;--dryBg:#FBE7E1;
display:block;background:var(--bg);color:var(--ink);font-family:'DM Sans',system-ui,sans-serif;min-height:100%}
*{box-sizing:border-box}
button,input,select{font:inherit;color:inherit}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.wrap{position:relative;min-height:100vh;padding-bottom:60px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px 10px;max-width:1200px;margin:0 auto}
header h1{margin:0;font-size:40px;line-height:1}
.sub{color:var(--muted);font-size:14px}
nav{display:flex;gap:8px;padding:6px 24px 14px;max-width:1200px;margin:0 auto;overflow-x:auto}
.chip{flex:none;height:38px;padding:0 14px;border-radius:19px;border:1px solid var(--line);background:var(--card);font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:7px;white-space:nowrap}
.chip b{font-weight:700;color:var(--muted)}
.chip i{font-style:normal;font-size:12px;font-weight:700;padding:2px 7px;border-radius:10px;background:var(--greenBg);color:var(--green)}
.chip.dry i{background:var(--dryBg);color:var(--dry)}
.chip.on{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}.chip.on b{color:inherit}
main{max-width:1200px;margin:0 auto;padding:0 24px}
section{margin:6px 0 22px}
.gh{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px}
.gh h2{margin:0;font:700 20px 'DM Sans',sans-serif}
.soil{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);font-weight:600}
.soil.dry{color:var(--dry)}
.thr{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);font-weight:600}
.thr .tb{width:26px;height:26px;border-radius:50%;border:1px solid var(--line);background:none;color:inherit;font:700 15px/1 'DM Sans',sans-serif;cursor:pointer}
.bar{width:80px;height:8px;border-radius:4px;background:var(--soft);overflow:hidden;display:inline-block}
.bar i{display:block;height:100%;background:var(--green);border-radius:4px}
.soil.dry .bar i{background:var(--dry)}
.lnk{margin-left:auto;border:0;background:none;color:var(--muted);font-weight:700;font-size:14px;cursor:pointer;padding:6px 4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.tile{position:relative;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:0 0 10px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;gap:3px}
.tile img,.tile .ph{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--soft)}
.ph,.tile .ph{display:flex;align-items:center;justify-content:center;color:#B7A68F;background:var(--soft)}
.ph svg{width:38%;height:38%}
.tn{font-weight:700;font-size:15px;line-height:1.25;padding:6px 10px 0}
.ts{font-size:12.5px;color:var(--muted);padding:0 10px;line-height:1.3}
.badge{position:absolute;top:8px;left:8px;font-size:11px;font-weight:800;letter-spacing:.04em;background:var(--btn);color:var(--btnInk);border-radius:9px;padding:3px 8px}
.tile.ind{border-color:var(--btn)}
.empty{color:var(--muted);font-size:14px;margin:0 0 6px}
.grid.past .tile{opacity:.6}
.pastsec .lnk{margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 18px;border-radius:22px;border:1px solid var(--line);background:var(--card);font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap}
.btn.ink{background:var(--btn);color:var(--btnInk);border-color:var(--btn)}
.btn.sm{height:34px;padding:0 13px;font-size:13px}
.btn[disabled]{opacity:.6}
.scrim{position:fixed;inset:0;background:rgba(42,32,25,.35);z-index:30}
.sheet{position:fixed;z-index:31;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:92vh;overflow:auto;background:var(--card);border-radius:24px;box-shadow:0 20px 60px rgba(42,32,25,.3)}
.sheet .x{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:20px;border:0;background:rgba(255,251,244,.9);font-size:24px;cursor:pointer;z-index:2}
.big{width:100%;max-height:52vh;object-fit:cover;display:block}
.big.ph{height:220px}
.body{padding:18px 22px 22px}
.body h2{margin:0 0 10px;font-size:32px;line-height:1.1}
.row{display:flex;gap:12px;padding:7px 0;border-bottom:1px solid var(--soft);font-size:15px}
.row span{width:110px;flex:none;color:var(--muted)}
.muted{color:var(--muted);font-size:14px;line-height:1.45}
.eb{display:block;font:700 11px/1.2 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px}
.hrow{display:flex;align-items:center;gap:10px;font-size:14px;margin:6px 0}
.hrow img,.ph.sm{width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none}
.acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;align-items:center}
.cf{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600}
.form label{display:flex;flex-direction:column;gap:5px;margin:10px 0;font-size:13px;font-weight:700;color:var(--muted)}
.form input:not([type=file]),.form select{height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;padding:0 12px;font-size:16px;font-weight:500;color:var(--ink)}
.form .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form .two label{margin:0}
.form label.photo{flex-direction:row;align-items:center;gap:14px;cursor:pointer}
.form label.photo img,.form label.photo .ph{width:96px;height:96px;border-radius:16px;object-fit:cover;flex:none}
.form label.photo input{position:absolute;width:1px;height:1px;opacity:0}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--btn);color:var(--btnInk);padding:12px 18px;border-radius:14px;font-weight:600;font-size:14px;z-index:40;max-width:90vw}
@media (max-width:600px){header{padding:14px 14px 6px}header h1{font-size:32px}nav,main{padding-left:14px;padding-right:14px}.grid{grid-template-columns:repeat(2,1fr)}.form .two{grid-template-columns:1fr}}
`;
