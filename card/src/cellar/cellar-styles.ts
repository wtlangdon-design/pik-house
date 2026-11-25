// Styles for the wine cellar, in the Daylight palette used by the other Pik cards, with a wine accent.
import { css } from "lit";
import { plantsStyles } from "../plants/plants-styles";

export const cellarStyles = [plantsStyles, css`
:host{--wine:#7A2E3A;--wineBg:#F4E3E3;--gold:#C98A3A}
.tot{display:flex;gap:22px;align-items:flex-end}
.tot div{display:flex;flex-direction:column;align-items:flex-end}
.tot b{font:400 34px/1 'Instrument Serif',Georgia,serif}
.tot span{font-size:12px;color:var(--muted);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
.tile .bt{width:100%;aspect-ratio:3/4;background:linear-gradient(#FBF6EE,#EFE5D6);display:flex;align-items:center;justify-content:center;overflow:hidden}
.tile .bt img{width:auto;height:92%;max-width:90%;object-fit:contain;aspect-ratio:auto;background:none;mix-blend-mode:multiply}
.bt>span,.bigbt>span{height:100%;width:100%;display:flex;align-items:center;justify-content:center;color:#B7A68F}
.tile .bt svg{height:62%;width:auto}
.val{font-weight:800;font-size:14px;padding:2px 10px 0;color:var(--wine)}
.cnt{position:absolute;top:8px;right:8px;font-size:12px;font-weight:800;background:var(--wine);color:#fff;border-radius:10px;padding:3px 8px}
.stars{display:flex;gap:2px;padding:0 10px;color:var(--gold);font-size:15px;letter-spacing:1px}
.stars .off{color:#D9CBB6}
.rate{display:flex;gap:6px;margin:10px 0 4px}
.rate button{width:52px;height:52px;border-radius:26px;border:1px solid var(--line);background:var(--card);font-size:28px;line-height:1;cursor:pointer;color:#D9CBB6}
.rate button.on{color:var(--gold);border-color:var(--gold);background:#FBF1E2}
.bigbt{width:100%;height:min(46vh,420px);background:linear-gradient(#FBF6EE,#EFE5D6);display:flex;align-items:center;justify-content:center}
.bigbt img{height:92%;max-width:90%;object-fit:contain;mix-blend-mode:multiply}
.bigbt svg{height:60%;width:auto}
.note{width:100%;min-height:70px;border-radius:12px;border:1px solid var(--line);padding:10px 12px;font-size:16px;resize:vertical;background:#fff}
.how{background:var(--card);border:1px dashed var(--line);border-radius:18px;padding:16px 18px;max-width:640px}
.how b{display:block;font-size:16px;margin-bottom:4px}
.src{font-size:12px;color:var(--muted)}
.sort{margin-left:auto;display:flex;gap:6px}
@media (max-width:600px){.tot b{font-size:26px}.grid{grid-template-columns:repeat(2,1fr)}header{flex-wrap:wrap}}
`];
