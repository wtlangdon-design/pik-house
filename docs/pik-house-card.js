var at=globalThis,lt=at.ShadowRoot&&(at.ShadyCSS===void 0||at.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,At=Symbol(),jt=new WeakMap,J=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==At)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(lt&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=jt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&jt.set(t,e))}return e}toString(){return this.cssText}},Vt=o=>new J(typeof o=="string"?o:o+"",void 0,At),Y=(o,...e)=>{let t=o.length===1?o[0]:e.reduce((s,i,r)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+o[r+1],o[0]);return new J(t,o,At)},Wt=(o,e)=>{if(lt)o.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=at.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,o.appendChild(s)}},St=lt?o=>o:o=>o instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return Vt(t)})(o):o;var{is:Le,defineProperty:Ge,getOwnPropertyDescriptor:Re,getOwnPropertyNames:Ie,getOwnPropertySymbols:He,getPrototypeOf:Ne}=Object,pt=globalThis,Zt=pt.trustedTypes,Ue=Zt?Zt.emptyScript:"",qe=pt.reactiveElementPolyfillSupport,Q=(o,e)=>o,Ct={toAttribute(o,e){switch(e){case Boolean:o=o?Ue:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){let t=o;switch(e){case Boolean:t=o!==null;break;case Number:t=o===null?null:Number(o);break;case Object:case Array:try{t=JSON.parse(o)}catch{t=null}}return t}},Yt=(o,e)=>!Le(o,e),Jt={attribute:!0,type:String,converter:Ct,reflect:!1,useDefault:!1,hasChanged:Yt};Symbol.metadata??=Symbol("metadata"),pt.litPropertyMetadata??=new WeakMap;var _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Jt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Ge(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){let{get:i,set:r}=Re(this.prototype,e)??{get(){return this[t]},set(n){this[t]=n}};return{get:i,set(n){let d=i?.call(this);r?.call(this,n),this.requestUpdate(e,d,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Jt}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;let e=Ne(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){let t=this.properties,s=[...Ie(t),...He(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(St(i))}else e!==void 0&&t.push(St(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Wt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:Ct).toAttribute(t,s.type);this._$Em=e,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(e,t){let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let r=s.getPropertyOptions(i),n=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:Ct;this._$Em=i;let d=n.fromAttribute(t,r.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(e,t,s,i=!1,r){if(e!==void 0){let n=this.constructor;if(i===!1&&(r=this[e]),s??=n.getPropertyOptions(e),!((s.hasChanged??Yt)(r,t)||s.useDefault&&s.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:r},n){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),r!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,r]of s){let{wrapped:n}=r,d=this[i];n!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,r,d)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[Q("elementProperties")]=new Map,_[Q("finalized")]=new Map,qe?.({ReactiveElement:_}),(pt.reactiveElementVersions??=[]).push("2.1.2");var Mt=globalThis,Qt=o=>o,dt=Mt.trustedTypes,Kt=dt?dt.createPolicy("lit-html",{createHTML:o=>o}):void 0,Et="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,Ft="?"+M,ze=`<${Ft}>`,R=document,X=()=>R.createComment(""),tt=o=>o===null||typeof o!="object"&&typeof o!="function",Dt=Array.isArray,oe=o=>Dt(o)||typeof o?.[Symbol.iterator]=="function",_t=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Xt=/-->/g,te=/>/g,L=RegExp(`>|${_t}(?:([^\\s"'>=/]+)(${_t}*=${_t}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ee=/'/g,se=/"/g,re=/^(?:script|style|textarea|title)$/i,Tt=o=>(e,...t)=>({_$litType$:o,strings:e,values:t}),f=Tt(1),hs=Tt(2),us=Tt(3),$=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),ie=new WeakMap,G=R.createTreeWalker(R,129);function ne(o,e){if(!Dt(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return Kt!==void 0?Kt.createHTML(e):e}var ae=(o,e)=>{let t=o.length-1,s=[],i,r=e===2?"<svg>":e===3?"<math>":"",n=K;for(let d=0;d<t;d++){let l=o[d],g,b,c=-1,m=0;for(;m<l.length&&(n.lastIndex=m,b=n.exec(l),b!==null);)m=n.lastIndex,n===K?b[1]==="!--"?n=Xt:b[1]!==void 0?n=te:b[2]!==void 0?(re.test(b[2])&&(i=RegExp("</"+b[2],"g")),n=L):b[3]!==void 0&&(n=L):n===L?b[0]===">"?(n=i??K,c=-1):b[1]===void 0?c=-2:(c=n.lastIndex-b[2].length,g=b[1],n=b[3]===void 0?L:b[3]==='"'?se:ee):n===se||n===ee?n=L:n===Xt||n===te?n=K:(n=L,i=void 0);let p=n===L&&o[d+1].startsWith("/>")?" ":"";r+=n===K?l+ze:c>=0?(s.push(g),l.slice(0,c)+Et+l.slice(c)+M+p):l+M+(c===-2?d:p)}return[ne(o,r+(o[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},et=class o{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let r=0,n=0,d=e.length-1,l=this.parts,[g,b]=ae(e,t);if(this.el=o.createElement(g,s),G.currentNode=this.el.content,t===2||t===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(i=G.nextNode())!==null&&l.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(let c of i.getAttributeNames())if(c.endsWith(Et)){let m=b[n++],p=i.getAttribute(c).split(M),k=/([.?@])?(.*)/.exec(m);l.push({type:1,index:r,name:k[2],strings:p,ctor:k[1]==="."?ht:k[1]==="?"?ut:k[1]==="@"?gt:H}),i.removeAttribute(c)}else c.startsWith(M)&&(l.push({type:6,index:r}),i.removeAttribute(c));if(re.test(i.tagName)){let c=i.textContent.split(M),m=c.length-1;if(m>0){i.textContent=dt?dt.emptyScript:"";for(let p=0;p<m;p++)i.append(c[p],X()),G.nextNode(),l.push({type:2,index:++r});i.append(c[m],X())}}}else if(i.nodeType===8)if(i.data===Ft)l.push({type:2,index:r});else{let c=-1;for(;(c=i.data.indexOf(M,c+1))!==-1;)l.push({type:7,index:r}),c+=M.length-1}r++}}static createElement(e,t){let s=R.createElement("template");return s.innerHTML=e,s}};function I(o,e,t=o,s){if(e===$)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl,r=tt(e)?void 0:e._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(o),i._$AT(o,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=I(o,i._$AS(o,e.values),i,s)),e}var ct=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??R).importNode(t,!0);G.currentNode=i;let r=G.nextNode(),n=0,d=0,l=s[0];for(;l!==void 0;){if(n===l.index){let g;l.type===2?g=new q(r,r.nextSibling,this,e):l.type===1?g=new l.ctor(r,l.name,l.strings,this,e):l.type===6&&(g=new ft(r,this,e)),this._$AV.push(g),l=s[++d]}n!==l?.index&&(r=G.nextNode(),n++)}return G.currentNode=R,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},q=class o{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=I(this,e,t),tt(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==$&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):oe(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&tt(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=et.createElement(ne(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{let r=new ct(i,this),n=r.u(this.options);r.p(t),this.T(n),this._$AH=r}}_$AC(e){let t=ie.get(e.strings);return t===void 0&&ie.set(e.strings,t=new et(e)),t}k(e){Dt(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let r of e)i===t.length?t.push(s=new o(this.O(X()),this.O(X()),this,this.options)):s=t[i],s._$AI(r),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let s=Qt(e).nextSibling;Qt(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},H=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,r){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(e,t=this,s,i){let r=this.strings,n=!1;if(r===void 0)e=I(this,e,t,0),n=!tt(e)||e!==this._$AH&&e!==$,n&&(this._$AH=e);else{let d=e,l,g;for(e=r[0],l=0;l<r.length-1;l++)g=I(this,d[s+l],t,l),g===$&&(g=this._$AH[l]),n||=!tt(g)||g!==this._$AH[l],g===h?e=h:e!==h&&(e+=(g??"")+r[l+1]),this._$AH[l]=g}n&&!i&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ht=class extends H{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},ut=class extends H{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},gt=class extends H{constructor(e,t,s,i,r){super(e,t,s,i,r),this.type=5}_$AI(e,t=this){if((e=I(this,e,t,0)??h)===$)return;let s=this._$AH,i=e===h&&s!==h||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,r=e!==h&&(s===h||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ft=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){I(this,e)}},le={M:Et,P:M,A:Ft,C:1,L:ae,R:ct,D:oe,V:I,I:q,H,N:ut,U:gt,B:ht,F:ft},je=Mt.litHtmlPolyfillSupport;je?.(et,q),(Mt.litHtmlVersions??=[]).push("3.3.3");var pe=(o,e,t)=>{let s=t?.renderBefore??e,i=s._$litPart$;if(i===void 0){let r=t?.renderBefore??null;s._$litPart$=i=new q(e.insertBefore(X(),r),r,void 0,t??{})}return i._$AI(o),i};var Pt=globalThis,F=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=pe(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return $}};F._$litElement$=!0,F.finalized=!0,Pt.litElementHydrateSupport?.({LitElement:F});var Ve=Pt.litElementPolyfillSupport;Ve?.({LitElement:F});(Pt.litElementVersions??=[]).push("4.2.2");var mt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},T=o=>(...e)=>({_$litDirective$:o,values:e}),D=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:We}=le,de=o=>o;var ce=()=>document.createComment(""),z=(o,e,t)=>{let s=o._$AA.parentNode,i=e===void 0?o._$AB:e._$AA;if(t===void 0){let r=s.insertBefore(ce(),i),n=s.insertBefore(ce(),i);t=new We(r,n,o,o.options)}else{let r=t._$AB.nextSibling,n=t._$AM,d=n!==o;if(d){let l;t._$AQ?.(o),t._$AM=o,t._$AP!==void 0&&(l=o._$AU)!==n._$AU&&t._$AP(l)}if(r!==i||d){let l=t._$AA;for(;l!==r;){let g=de(l).nextSibling;de(s).insertBefore(l,i),l=g}}}return t},P=(o,e,t=o)=>(o._$AI(e,t),o),Ze={},bt=(o,e=Ze)=>o._$AH=e,he=o=>o._$AH,yt=o=>{o._$AR(),o._$AA.remove()};var ue=(o,e,t)=>{let s=new Map;for(let i=e;i<=t;i++)s.set(o[i],i);return s},kt=T(class extends D{constructor(o){if(super(o),o.type!==mt.CHILD)throw Error("repeat() can only be used in text expressions")}dt(o,e,t){let s;t===void 0?t=e:e!==void 0&&(s=e);let i=[],r=[],n=0;for(let d of o)i[n]=s?s(d,n):n,r[n]=t(d,n),n++;return{values:r,keys:i}}render(o,e,t){return this.dt(o,e,t).values}update(o,[e,t,s]){let i=he(o),{values:r,keys:n}=this.dt(e,t,s);if(!Array.isArray(i))return this.ut=n,r;let d=this.ut??=[],l=[],g,b,c=0,m=i.length-1,p=0,k=r.length-1;for(;c<=m&&p<=k;)if(i[c]===null)c++;else if(i[m]===null)m--;else if(d[c]===n[p])l[p]=P(i[c],r[p]),c++,p++;else if(d[m]===n[k])l[k]=P(i[m],r[k]),m--,k--;else if(d[c]===n[k])l[k]=P(i[c],r[k]),z(o,l[k+1],i[c]),c++,k--;else if(d[m]===n[p])l[p]=P(i[m],r[p]),z(o,i[c],i[m]),m--,p++;else if(g===void 0&&(g=ue(n,p,k),b=ue(d,c,m)),g.has(d[c]))if(g.has(d[m])){let v=b.get(n[p]),V=v!==void 0?i[v]:null;if(V===null){let B=z(o,i[c]);P(B,r[p]),l[p]=B}else l[p]=P(V,r[p]),z(o,i[c],V),i[v]=null;p++}else yt(i[m]),m--;else yt(i[c]),c++;for(;p<=k;){let v=z(o,l[k+1]);P(v,r[p]),l[p++]=v}for(;c<=m;){let v=i[c++];v!==null&&yt(v)}return this.ut=n,bt(o,l),$}});var ge=T(class extends D{constructor(){super(...arguments),this.key=h}render(o,e){return this.key=o,e}update(o,[e,t]){return e!==this.key&&(bt(o),this.key=e),t}});var fe=Y`
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
.pebs{position:absolute;left:44px;right:44px;top:598px;height:166px;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:14px}
.pebs.five .pv{font-size:44px}
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
`,me=Y`
:host{display:block;width:1280px;height:800px;font-size:16px;font-weight:400;font-style:normal;line-height:normal;letter-spacing:normal;text-transform:none;text-align:start;white-space:normal}
`,be=Y`
.scrim,.dark .scrim{background:transparent;animation:none}
.top{z-index:22;pointer-events:none}
.top .demo{pointer-events:auto}
@media (prefers-reduced-motion: reduce){.bfill{animation:none!important}}
`;var N=class extends D{constructor(e){if(super(e),this.it=h,e.type!==mt.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===h||e==null)return this._t=void 0,this.it=e;if(e===$)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};N.directiveName="unsafeHTML",N.resultType=1;var Ws=T(N);var st=class extends N{};st.directiveName="unsafeSVG",st.resultType=2;var ye=T(st);var ke=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Pik: Resting">
  <defs>
    <radialGradient id="restinghalo"><stop stop-color="#A99070" stop-opacity=".25"/><stop offset="1" stop-color="#A99070" stop-opacity="0"/></radialGradient>
    <linearGradient id="restingclay" x1=".14" y1=".03" x2=".79" y2=".95" gradientUnits="objectBoundingBox"><stop stop-color="#FFDF9B"/><stop offset=".52" stop-color="#F0AF64"/><stop offset="1" stop-color="#BD6A42"/></linearGradient>
    <linearGradient id="restingmutedglow" x1=".14" y1=".03" x2=".79" y2=".95"><stop stop-color="#CDC1A4"/><stop offset="1" stop-color="#9E846D"/></linearGradient>
    <radialGradient id="restinglight" cx=".28" cy=".15" r=".77"><stop stop-color="#FFF3C3" stop-opacity=".64"/><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="128" cy="130" r="124" fill="url(#restinghalo)"/>
  <circle cx="128" cy="128" r="98" stroke="#A99070" stroke-width="1.45" opacity="0.58" fill="none" />
  <ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#restingclay)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#restinglight)" opacity="1"/>
  <path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"/>
  <g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M101 135q11-10 22 0m23-2q11-10 22 0m-37 14q5 4 10-1"/></g>
  
</svg>`;var xe=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Pik: Listening">
  <defs>
    <radialGradient id="listeninghalo"><stop stop-color="#ADDFB9" stop-opacity=".25"/><stop offset="1" stop-color="#ADDFB9" stop-opacity="0"/></radialGradient>
    <linearGradient id="listeningclay" x1=".14" y1=".03" x2=".79" y2=".95" gradientUnits="objectBoundingBox"><stop stop-color="#FFDF9B"/><stop offset=".52" stop-color="#F0AF64"/><stop offset="1" stop-color="#BD6A42"/></linearGradient>
    <linearGradient id="listeningmutedglow" x1=".14" y1=".03" x2=".79" y2=".95"><stop stop-color="#CDC1A4"/><stop offset="1" stop-color="#9E846D"/></linearGradient>
    <radialGradient id="listeninglight" cx=".28" cy=".15" r=".77"><stop stop-color="#FFF3C3" stop-opacity=".64"/><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="128" cy="130" r="124" fill="url(#listeninghalo)"/>
  <circle cx="128" cy="128" r="98" stroke="#ADDFB9" stroke-width="2.4" opacity="0.96" fill="none" />
  <ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#listeningclay)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#listeninglight)" opacity="1"/>
  <path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"/>
  <g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="111" cy="130" rx="5" ry="9" fill="#3B291C" stroke="none"/><ellipse cx="155" cy="125" rx="5" ry="9" fill="#3B291C" stroke="none"/><path d="M131 144q6 5 12-1"/></g>
  
</svg>`;var ve=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Pik: Thinking">
  <defs>
    <radialGradient id="thinkinghalo"><stop stop-color="#C1AFF6" stop-opacity=".25"/><stop offset="1" stop-color="#C1AFF6" stop-opacity="0"/></radialGradient>
    <linearGradient id="thinkingclay" x1=".14" y1=".03" x2=".79" y2=".95" gradientUnits="objectBoundingBox"><stop stop-color="#FFDF9B"/><stop offset=".52" stop-color="#F0AF64"/><stop offset="1" stop-color="#BD6A42"/></linearGradient>
    <linearGradient id="thinkingmutedglow" x1=".14" y1=".03" x2=".79" y2=".95"><stop stop-color="#CDC1A4"/><stop offset="1" stop-color="#9E846D"/></linearGradient>
    <radialGradient id="thinkinglight" cx=".28" cy=".15" r=".77"><stop stop-color="#FFF3C3" stop-opacity=".64"/><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="128" cy="130" r="124" fill="url(#thinkinghalo)"/>
  <circle cx="128" cy="128" r="98" stroke="#C1AFF6" stroke-width="1.45" opacity="0.96" fill="none" stroke-dasharray="1 9" stroke-linecap="round"/>
  <ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#thinkingclay)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#thinkinglight)" opacity="1"/>
  <path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"/>
  <g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="117" cy="125" rx="4.5" ry="7" fill="#3B291C" stroke="none"/><ellipse cx="160" cy="120" rx="4.5" ry="7" fill="#3B291C" stroke="none"/><path d="M135 146l9-1"/></g>
  
</svg>`;var we=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Pik: Speaking">
  <defs>
    <radialGradient id="speakinghalo"><stop stop-color="#FFD28D" stop-opacity=".25"/><stop offset="1" stop-color="#FFD28D" stop-opacity="0"/></radialGradient>
    <linearGradient id="speakingclay" x1=".14" y1=".03" x2=".79" y2=".95" gradientUnits="objectBoundingBox"><stop stop-color="#FFDF9B"/><stop offset=".52" stop-color="#F0AF64"/><stop offset="1" stop-color="#BD6A42"/></linearGradient>
    <linearGradient id="speakingmutedglow" x1=".14" y1=".03" x2=".79" y2=".95"><stop stop-color="#CDC1A4"/><stop offset="1" stop-color="#9E846D"/></linearGradient>
    <radialGradient id="speakinglight" cx=".28" cy=".15" r=".77"><stop stop-color="#FFF3C3" stop-opacity=".64"/><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="128" cy="130" r="124" fill="url(#speakinghalo)"/>
  <circle cx="128" cy="128" r="98" stroke="#FFD28D" stroke-width="2.4" opacity="0.96" fill="none" />
  <ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#speakingclay)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#speakinglight)" opacity="1"/>
  <path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"/>
  <g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M101 130q10-10 20 0m26-4q10-10 20 0"/><ellipse cx="135" cy="145" rx="8" ry="6" fill="#3B291C" stroke="none"/></g>
  
</svg>`;var Bt=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Pik: Mic off">
  <defs>
    <radialGradient id="mutedhalo"><stop stop-color="#A9AAA1" stop-opacity=".25"/><stop offset="1" stop-color="#A9AAA1" stop-opacity="0"/></radialGradient>
    <linearGradient id="mutedclay" x1=".14" y1=".03" x2=".79" y2=".95" gradientUnits="objectBoundingBox"><stop stop-color="#FFDF9B"/><stop offset=".52" stop-color="#F0AF64"/><stop offset="1" stop-color="#BD6A42"/></linearGradient>
    <linearGradient id="mutedmutedglow" x1=".14" y1=".03" x2=".79" y2=".95"><stop stop-color="#CDC1A4"/><stop offset="1" stop-color="#9E846D"/></linearGradient>
    <radialGradient id="mutedlight" cx=".28" cy=".15" r=".77"><stop stop-color="#FFF3C3" stop-opacity=".64"/><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="128" cy="130" r="124" fill="url(#mutedhalo)"/>
  <circle cx="128" cy="128" r="98" stroke="#A9AAA1" stroke-width="1.45" opacity="0.96" fill="none" stroke-dasharray="4 8"/>
  <ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#mutedmutedglow)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"/>
  <path d="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z" fill="url(#mutedlight)" opacity="0.4"/>
  <path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"/>
  <g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M103 134l17-2m28-2 17-2m-34 18 9-1"/></g>
  <g transform="translate(203 187)"><circle r="22" fill="#242925" stroke="#A9AAA1"/><path d="M-10-10 10 10M-4-5v-3a4 4 0 0 1 8 0v7M-8-1v1a8 8 0 0 0 14 5M0 8v4" fill="none" stroke="#F0E8D9" stroke-width="2" stroke-linecap="round"/></g>
</svg>`;function it(o,e){let t=o.match(/<g fill="none" stroke="#3B291C"[^>]*>([\s\S]*?)<\/g>/);if(!t)throw new Error(`pik-house-card: couldn't find the face in ${e}.svg`);return t[1]}function ts(o){let e=o.match(/<g transform="translate\(203 187\)">([\s\S]*?)<\/g>/);if(!e)throw new Error("pik-house-card: couldn't find the mic-off badge in muted.svg");return e[1]}var es=it(we,"speaking").replace("<ellipse ",'<ellipse class="mouth" '),ss='<ellipse cx="111" cy="129" rx="6" ry="10.5" fill="#3B291C" stroke="none"></ellipse><ellipse cx="155" cy="124" rx="6" ry="10.5" fill="#3B291C" stroke="none"></ellipse><path d="M103 111q8-5 15-2m30-5q8-3 15 2" stroke-width="3.5"></path><ellipse cx="134" cy="148" rx="4.5" ry="5.5" fill="#3B291C" stroke="none"></ellipse>',Ot="M57 139C55 110 67 70 98 59c25-9 67-7 82 13 20 25 27 72 13 96-12 20-36 27-69 26-41 0-65-17-67-55Z",is=`<defs>
<radialGradient id="pkHalo"><stop class="hs" offset="0" stop-opacity=".25"></stop><stop class="hs" offset="1" stop-opacity="0"></stop></radialGradient>
<linearGradient id="pkClay" x1=".14" y1=".03" x2=".79" y2=".95"><stop offset="0" stop-color="#FFDF9B"></stop><stop offset=".52" stop-color="#F0AF64"></stop><stop offset="1" stop-color="#BD6A42"></stop></linearGradient>
<linearGradient id="pkMute" x1=".14" y1=".03" x2=".79" y2=".95"><stop offset="0" stop-color="#CDC1A4"></stop><stop offset="1" stop-color="#9E846D"></stop></linearGradient>
<radialGradient id="pkLight" cx=".28" cy=".15" r=".77"><stop offset="0" stop-color="#FFF3C3" stop-opacity=".64"></stop><stop offset="1" stop-color="#FFF3C3" stop-opacity="0"></stop></radialGradient>
</defs>
<circle cx="128" cy="130" r="124" fill="url(#pkHalo)"></circle>
<circle class="ring" cx="128" cy="128" r="98"></circle>
<ellipse cx="129" cy="196" rx="52" ry="8" fill="#20160C" opacity=".28"></ellipse>
<g class="body">
<path d="${Ot}" fill="url(#pkClay)" stroke="#FFDC9C" stroke-opacity=".53" stroke-width="1.2"></path>
<path class="mute" d="${Ot}" fill="url(#pkMute)"></path>
<path class="light" d="${Ot}" fill="url(#pkLight)"></path>
<path d="M82 99q11-24 30-27" fill="none" stroke="#FFF3C8" opacity=".58" stroke-width="3.2" stroke-linecap="round"></path>
<path d="M89 154l8 1m76-7 7-2" fill="none" stroke="#8B452E" stroke-opacity=".31" stroke-width="2" stroke-linecap="round"></path>
<g fill="none" stroke="#3B291C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
<g class="f f-rest">${it(ke,"resting")}</g>
<g class="f f-listen">${it(xe,"listening")}</g>
<g class="f f-think">${it(ve,"thinking")}</g>
<g class="f f-speak">${es}</g>
<g class="f f-muted">${it(Bt,"muted")}</g>
<g class="f f-alert">${ss}</g>
</g>
</g>
<g class="badge2" transform="translate(203 187)">${ts(Bt)}</g>`;function $e(o){return f`<svg viewBox="0 0 256 256" width="280" height="280" role="img" aria-label=${o}>${ye(is)}</svg>`}function Ae(o){return f`<div class="sheet">
<div class="handle"></div>
<div class="shead"><span class="eb">Energy · Tesla</span><h2 class="stitle">Power in motion</h2><button type="button" class="done" @click=${o.goHome}>Done</button></div>
<div class="sbody esb">
<div class=${o.ewinCls}>
<svg class="emap" viewBox="0 0 392 214" width="760" height="415" role="img" aria-label=${o.energyAria}>
<defs>
<radialGradient id="eGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#E8B97C" stop-opacity=".18"></stop><stop offset="1" stop-color="#E8B97C" stop-opacity="0"></stop></radialGradient>
<linearGradient id="eBat" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#609975"></stop><stop offset="1" stop-color="#C5E5A4"></stop></linearGradient>
<linearGradient id="eRoof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEE0A4"></stop><stop offset="1" stop-color="#BC7D4B"></stop></linearGradient>
</defs>
<ellipse cx="196" cy="98" rx="170" ry="96" fill="url(#eGlow)"></ellipse>
<g fill="none" stroke="#E4C29B" opacity=".12"><ellipse cx="196" cy="98" rx="96" ry="62"></ellipse><ellipse cx="196" cy="98" rx="140" ry="86" stroke-dasharray="2 7"></ellipse></g>
<g class=${o.solarFlow}><path class="wire" d="M80 54Q122 60 156 82"></path><path class="pk" d="M80 54Q122 60 156 82"></path></g>
<g class=${o.gridFlow}><path class="wire" d="M80 150Q122 140 156 116"></path><path class="pk" d="M80 150Q122 140 156 116"></path></g>
<g class=${o.batFlow}><path class="wire" d="M312 150Q270 140 236 116"></path><path class="pk" d="M312 150Q270 140 236 116"></path></g>
<g transform="translate(52 46)">
<circle r="28" fill="#23271F" stroke="#7B6A50"></circle>
<g class="sunic" stroke="#FFC580" stroke-width="2" stroke-linecap="round"><circle r="10" fill="#FFC580" fill-opacity=".32"></circle><path d="M0-19v4M0 15v4M-19 0h4M15 0h4M-13-13l3 3M10 10l3 3M13-13l-3 3M-10 10l-3 3"></path></g>
<path class="moon" d="M6 12A13 13 0 0 1-7-10c-1.5 7 3 14 10.5 15.5 3 .7 5.8.4 7.6-.5A13 13 0 0 1 6 12Z" fill="#BCD0DD" stroke="#E0EDF2" stroke-width="1"></path>
</g>
<text class="nlbl" x="90" y="24">${o.solarLbl}</text>
<text class="nval" x="90" y="43">${o.solarVal}</text>
<g transform="translate(196 98)">
<circle r="40" fill="#28291F" stroke="#A88958" stroke-opacity=".75"></circle>
<circle r="34" fill="none" stroke="#E6C086" stroke-opacity=".28" stroke-dasharray="1 5"></circle>
<path d="M-17 0V15H17V0" fill="#8A6448" stroke="#33271E" stroke-width="1.2"></path>
<path d="M-22 2 0-17 22 2Z" fill="url(#eRoof)" stroke="#33271E" stroke-width="1.2"></path>
<rect class="win" x="-11" y="4" width="7" height="6" rx="1"></rect>
<rect class="win" x="4" y="4" width="7" height="6" rx="1"></rect>
<rect x="-3" y="8" width="6" height="7" fill="#4A3628"></rect>
<text class="nlbl" text-anchor="middle" y="29">HOUSE</text>
</g>
<text class="hval" text-anchor="middle" x="196" y="162">${o.houseVal}</text>
<g transform="translate(52 158)">
<circle class="gridnode" r="28" fill="#222820" stroke="#697D75"></circle>
<path d="M-10 16-3-14h6l7 30M-7 2H7M-4-6h8M-14-8h28" fill="none" stroke="#C2D8DD" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
<path class="cut" d="M-14 14 14-14" stroke="#FAA192" stroke-width="4" stroke-linecap="round"></path>
</g>
<text class="nlbl" text-anchor="middle" x="52" y="200">${o.gridLbl}</text>
<text class="nval" text-anchor="middle" x="52" y="214" style="font-size: 13px">${o.gridVal}</text>
<g transform="translate(340 158)">
<circle r="30" fill="#222820" stroke="#74937A"></circle>
<rect x="-12" y="-20" width="24" height="40" rx="4" fill="#18231D" stroke="#B0D3AC" stroke-width="1.5"></rect>
<path d="M-5-21v-3H5v3" fill="none" stroke="#B0D3AC" stroke-width="1.5"></path>
<rect class="batfill" x="-8.5" width="17" rx="2" fill="url(#eBat)" style=${o.batStyle}></rect>
</g>
<text class="nlbl" text-anchor="middle" x="334" y="200">POWERWALL 2</text>
<text class="nval" text-anchor="middle" x="334" y="214" style="font-size: 13px">${o.batVal}</text>
</svg>
</div>
<div class="stats">
<div class="lead">${o.e.main}</div>
<div class="leadsub">${o.e.sub}</div>
<div class="stat">Solar right now<b>${o.solarVal}</b></div>
<div class="stat">House is using<b>${o.houseVal}</b></div>
<div class="stat">Powerwall<b>${o.batVal}</b></div>
<div class="stat">Grid<b>${o.gridStat}</b></div>
${o.showEssentials?f`<button type="button" class="bigbtn" @click=${o.essentialsOn}>Switch to essentials only</button>`:h}
</div>
</div>
</div>`}function Se(o){return f`<div class="sheet">
<div class="handle"></div>
<div class="shead"><span class="eb">${o.plantsEb}</span><h2 class="stitle">${o.plHead}</h2><button type="button" class="done" @click=${o.goHome}>Done</button></div>
<div class="sbody psb">
<div class="plist">
${kt(o.groups,e=>e.id,e=>f`<div class=${e.cls}>
${e.hasStop?f`<span class="stopn">${e.stop}</span>`:f`<span class="okdot"></span>`}
<span class="pname"><b>${e.room}</b><span>${e.sub}</span></span>
<span class="meter"><span class="mfill" style=${e.fill}></span><span class="mtick" style=${e.tick}></span></span>
<span class="ppct">${e.m}%</span>
<span class="pst">${e.status}</span>
${e.isDry?f`<button type="button" class="wbtn" @click=${e.tap}>Watered</button>`:f`<span></span>`}
</div>`)}
</div>
<div class="rcol">
<span class="eb">${o.routeLbl}</span>
<div class="lead">${o.routeHead}</div>
${o.routeStops.map(e=>f`<div class="rstop"><span class="stopn">${e.n}</span>${e.room}<span class="rp">${e.plants} plants</span></div>`)}
${o.hasRoute?f`<button type="button" class="bigbtn ink" @click=${o.logRoute}>${o.routeBtn}</button>`:h}
<p class="note">One sensor sits in each group's thirstiest plant. When it dips below its line (the tick on the bar), the whole group gets water.</p>
</div>
</div>
</div>`}function Ce(o){return f`<div class="sheet">
<div class="handle"></div>
<div class="shead"><span class="eb">Around the house</span><h2 class="stitle">Home</h2><button type="button" class="done" @click=${o.goHome}>Done</button></div>
<div class="sbody hsb">
<div class="hpanel"><span class="eb">Heat · Ecobee</span><div class="thermo"><button type="button" class="tbtn" aria-label="Lower the heat" @click=${o.down}>−</button><span class="tset">${o.setpoint}°</span><button type="button" class="tbtn" aria-label="Raise the heat" @click=${o.up}>+</button></div><div class="csub">${o.thermoSub}</div></div>
<div class="hpanel"><span class="eb">Lights · Wemo + Leviton</span><div class="lights">${o.lights.map(e=>f`<button type="button" class=${e.cls} aria-pressed=${e.pressed} @click=${e.toggle}><i></i>${e.name}<small>${e.state}</small></button>`)}</div></div>
<div class="hpanel"><span class="eb">Outside</span>
<div class="zone"><b>Yard · Rachio</b><span>Skipping while it's freezing</span></div>
<div class="zone"><b>Garden · B-Hyve</b><span>${o.gardenTxt}</span><button type="button" class="zbtn" @click=${o.toggleGarden}>${o.gardenBtn}</button></div>
<button type="button" class="cam" @click=${o.camera}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"></rect><path d="M16 10l5-3v10l-5-3"></path></svg>Ring live view</button>
</div>
</div>
</div>`}var A=[{id:"kitchen",room:"Kitchen",ind:"nerve plant",plants:14,thr:30,m:36},{id:"aroids",room:"Big aroids",ind:"monstera by the shoe rack",plants:11,thr:28,m:41},{id:"bedroom",room:"Bedroom & office",ind:"spider plant",plants:8,thr:28,m:19},{id:"trees",room:"Trees & palms",ind:"bedroom fiddle leaf fig",plants:12,thr:25,m:21},{id:"tough",room:"Tough guys",ind:"big ZZ in the yellow pot",plants:9,thr:12,m:30},{id:"jungle",room:"Jungle cacti",ind:"blooming Christmas cactus",plants:10,thr:20,m:33},{id:"desert",room:"Desert cacti",ind:"middle succulent trough",plants:18,thr:8,m:14}],os=1,Lt=A.reduce((o,e)=>o+e.plants,0)+os,E={freeze:{cat:"weather",label:"Weather \xB7 Rachio",title:"First freeze tonight. Low of 28\xB0",detail:"Rachio already skipped tomorrow's yard watering. Bring the 3 patio pots in before dark.",primary:"Done",toast:"Nice. The patio pots are safe."},internet:{cat:"bill",label:"Bills \xB7 from email",title:"Your internet bill went up $12",detail:"The promo rate ended. Want a short script for the call to get it back?",primary:"Write the script",secondary:"Ignore",toast:"Script's ready in this week's report."},doorbell:{cat:"door",urgent:!0,label:"Front door \xB7 Ring",title:"Someone's at the front door",detail:"The doorbell rang just now. It looks like a delivery driver.",primary:"Show camera",secondary:"Dismiss",toast:"Opening the front door camera."},outage:{cat:"energy",urgent:!0,label:"Energy \xB7 Powerwall",title:"The power's out. The Powerwall has it.",detail:"The grid went down a minute ago. Switch to essentials only to stretch the battery?",primary:"Essentials only",secondary:"Keep everything on",fx:"essentials",arrive:"outageOn",toast:"Essentials only. That roughly doubles the time left."},heat:{cat:"home",label:"Heat \xB7 Ecobee",title:"Nobody's home and the heat is at 70\xB0",detail:"Want me to drop it to 64\xB0 until one of you gets back?",primary:"Drop to 64\xB0",secondary:"Leave it",fx:"heat64",toast:"Done. Holding 64\xB0 until someone's home."},restore:{cat:"energy",label:"Energy \xB7 Powerwall",title:"The power's back",detail:"The grid came back. The Powerwall got you through and is topping itself off.",primary:"Nice",arrive:"outageOff",toast:"Back to normal."},garden:{cat:"water",label:"Garden \xB7 B-Hyve",title:"Time to winterize the garden drip?",detail:"Three nights below freezing this week. Pause the garden schedule until March?",primary:"Pause until March",secondary:"Not yet",fx:"gardenOff",toast:"The garden drip is paused until March 1."},smoke:{cat:"air",label:"Air \xB7 outdoor sensor",title:"Smoky air outside",detail:"The air sensor is picking up wood smoke (PM2.5 at 48). Keep the windows closed tonight.",primary:"Got it",arrive:"smokeOn",fx:"smokeOff",toast:"Windows stay shut. I'll tell you when it clears."},soil:{cat:"package",label:"Delivery \xB7 Ring",title:"Your potting soil was delivered",detail:"Ring saw it land on the porch at 2:41 PM. It's 40 pounds, so bring a friend.",primary:"Got it",toast:"I'll stop thinking about the soil now."},lamps:{cat:"light",label:"Lights \xB7 Wemo",title:"The living room lamps are on. Nobody's home.",detail:"They've been keeping an empty room company for 2 hours.",primary:"Turn them off",secondary:"Leave them on",fx:"livingOff",toast:"Lamps off. The room will cope."},trash:{cat:"reminder",label:"Reminder \xB7 every Tuesday, 8 AM",title:"Trash goes out this morning",detail:"Bins to the curb before pickup. This one comes back every Tuesday.",primary:"Done",secondary:"In an hour",toast:"Nice. See you next Tuesday."},report:{cat:"home",label:"Weekly report",title:"Your Sunday house report is ready",detail:"2 bills due, 1 price change, nothing broken. Solar covered 71% of the house this week.",primary:"Open report",toast:"Opening this week's report."}},Gt=["freeze","plants","internet"],Rt=["doorbell","trash","ferns","outage","heat","restore","garden","smoke","soil","lamps","report"],xt=["Set a pasta timer for one minute.","Play some Robyn.","What's tonight looking like?","Put Judy Justice back on.","How's the Powerwall doing?","Which plants need water?","Turn off the porch light."],_e="M8 5v14l11-7z",Me="M7 5h4v14H7zM13 5h4v14h-4z",It={rest:"Resting",listen:"Listening",think:"Thinking",speak:"Speaking",muted:"Mic off",alert:"Heads up"},Ee=13.5;var rs="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";function j(o){return Math.abs(o||0).toFixed(1)+" kW"}var vt=class extends F{constructor(){super(...arguments);this.config={type:"custom:pik-house-card",mock:!0};this._hass=void 0;this.st={};this.toastN=0;this._hold=0}setConfig(t){if(!t)throw new Error("pik-house-card: missing config");this.config=t,this.requestUpdate()}set hass(t){let s=this.isMock;this._hass=t,s!==this.isMock&&this.requestUpdate()}get hass(){return this._hass}getCardSize(){return 16}static getStubConfig(){return{type:"custom:pik-house-card",mock:!0}}get isMock(){return this.config.mock===!0||!this._hass}connectedCallback(){super.connectedCallback(),ns(),this._tick=window.setInterval(()=>this.setState({now:Date.now()}),3e4),this._cycle=window.setInterval(()=>this.autoAdvance(),25e3),this._sec=window.setInterval(()=>this.tickTimers(),1e3)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this._tick),clearInterval(this._cycle),clearInterval(this._sec),clearTimeout(this._toastT),clearTimeout(this._idle),this.clearTalk()}setState(t){this.st=Object.assign({},this.st,t),this.requestUpdate()}tickTimers(){let t=this.st.timers||[];if(!t.length)return;let s=Date.now(),i=!1,r=t.map(n=>!n.rang&&n.end<=s?(i=!0,Object.assign({},n,{rang:!0})):n);i&&this.chime(),this.setState({timers:r,sec:s})}chime(){try{let t=window.AudioContext||window.webkitAudioContext,s=this._ac||(this._ac=new t);[0,.35,.7].forEach(i=>{let r=s.createOscillator(),n=s.createGain();r.frequency.value=880,r.connect(n),n.connect(s.destination);let d=s.currentTime+i;n.gain.setValueAtTime(1e-4,d),n.gain.exponentialRampToValueAtTime(.25,d+.02),n.gain.exponentialRampToValueAtTime(1e-4,d+.25),r.start(d),r.stop(d+.3)})}catch{}}addTimer(t,s){let i=Date.now(),r=(this.st.timers||[]).concat([{id:i,label:t,total:s,end:i+s,rang:!1}]).slice(-2);this.setState({timers:r})}stopTimer(t){this.setState({timers:(this.st.timers||[]).filter(s=>s.id!==t)})}autoAdvance(){let t=this._last,s=this.st;!t||t.count<2||t.urgent||s.talk||s.page&&s.page!=="home"||Date.now()<this._hold||this.setState({idx:(t.curIdx+1)%t.count,focus:null})}go(t){clearTimeout(this._idle),this.clearTalk(),this.setState({page:t,talk:null}),t!=="home"&&(this._idle=window.setTimeout(()=>this.setState({page:"home"}),9e4))}clearTalk(){clearTimeout(this._t1),clearTimeout(this._t2),clearTimeout(this._t3)}cur(){let t=this.st,s=t.moist;return s||(s={},A.forEach(i=>{s[i.id]=i.m})),{cards:t.cards||Gt.slice(),queue:t.queue||Rt.slice(),newest:t.newest||null,moist:s,setpoint:t.setpoint||70,lights:t.lights||{living:!0,porch:!0,kitchen:!1},garden:t.garden===void 0?!0:t.garden,outage:!!t.outage,essentials:!!t.essentials,smoky:!!t.smoky,np:t.np===void 0?{kind:"video",title:"Judy Justice",sub:"Prime Video",playing:!0}:t.np}}hour(){let t=this.st;return t.mode==="day"?16:t.mode==="night"?23:new Date(t.now||Date.now()).getHours()}thirsty(t){return A.filter(s=>t[s.id]<s.thr)}energy(t,s){let i;if(t.outage){let r=s?t.essentials?.7:1.4:t.essentials?.9:1.7;i=s?{solar:0,house:r,bat:-r,grid:null,pct:71}:{solar:4.8,house:r,bat:4.8-r,grid:null,pct:82}}else s?i={solar:0,house:1.5,bat:-1.5,grid:0,pct:71}:i={solar:4.8,house:1.6,bat:2.1,grid:1.1,pct:78};return i.hours=i.bat<0?Math.round(i.pct/100*Ee/-i.bat):null,t.outage&&s?(i.main="Power's out. The Powerwall has it.",i.sub=(t.essentials?"Essentials only \xB7 about ":"About ")+i.hours+" hours left at this rate"):t.outage?(i.main="Power's out. Solar and the Powerwall have it.",i.sub="Still charging the battery while the grid is down"):s?(i.main="The Powerwall is running the house",i.sub="Solar's asleep until about 7 AM"):(i.main="The sun is running the house",i.sub="Charging the Powerwall \xB7 sending the extra to the grid"),i}flash(t){clearTimeout(this._toastT),this.toastN++,this.setState({toast:t}),this._toastT=window.setTimeout(()=>this.setState({toast:""}),2600)}water(t){let s=this.cur(),i=Object.assign({},s.moist);return A.forEach(r=>{t.indexOf(r.id)>=0&&(i[r.id]=Math.min(60,r.thr+22))}),this.setState({moist:i}),i}applyFx(t){let s=this.cur();t==="heat64"&&this.setState({setpoint:64}),t==="gardenOff"&&this.setState({garden:!1}),t==="livingOff"&&this.setState({lights:Object.assign({},s.lights,{living:!1})}),t==="porchOff"&&this.setState({lights:Object.assign({},s.lights,{porch:!1})}),t==="essentials"&&this.setState({essentials:!0}),t==="outageOn"&&this.setState({outage:!0,essentials:!1}),t==="outageOff"&&this.setState({outage:!1,essentials:!1}),t==="smokeOn"&&this.setState({smoky:!0}),t==="smokeOff"&&this.setState({smoky:!1})}resolve(t,s,i,r){let n=this.cur(),d=i?n.queue.concat([t]):n.queue;this.setState({cards:n.cards.filter(l=>l!==t),queue:d,newest:null,focus:null}),r&&this.applyFx(r),this.flash(s)}next(){let t=this.cur();if(!t.queue.length){let r={};A.forEach(n=>{r[n.id]=n.m}),this.setState({cards:Gt.slice(),queue:Rt.slice(),newest:null,moist:r,setpoint:70,garden:!0,outage:!1,essentials:!1,smoky:!1,lights:{living:!0,porch:!0,kitchen:!1},timers:[],np:void 0}),this.flash("Demo restarted.");return}let s=t.queue[0],i=t.queue.slice(1);if(s==="ferns"){let r=A.find(d=>d.id==="kitchen"),n=Object.assign({},t.moist);n.kitchen=r.thr-12,this.setState({moist:n,cards:["plants"].concat(t.cards.filter(d=>d!=="plants")),queue:i,newest:"plants",focus:"plants"});return}E[s]&&E[s].arrive&&this.applyFx(E[s].arrive),E[s]&&E[s].urgent&&(clearTimeout(this._idle),this.setState({page:"home"})),this.setState({cards:[s].concat(t.cards.filter(r=>r!==s)),queue:i,newest:s,focus:s})}answer(t){let s=this.cur(),i=this.hour()>=17||this.hour()<7,r=this.energy(s,i),n=xt[t];if(n.indexOf("pasta timer")>=0)return this.addTimer("Pasta",6e4),"Pasta timer, one minute. Starting now.";if(n.indexOf("Robyn")>=0)return this.setState({np:{kind:"music",title:"Robyn",sub:"Amazon Music",playing:!0}}),"Playing Robyn on the Echo Show.";if(n.indexOf("Judy")>=0)return this.setState({np:{kind:"video",title:"Judy Justice",sub:"Prime Video",playing:!0}}),"Judy Justice is back on the Echo Show. Court is in session.";if(n.indexOf("tonight")>=0)return(i?"31\xB0 now":"48\xB0 now")+", down to 28\xB0 tonight. It's the first freeze, so the patio pots should come in.";if(n.indexOf("Powerwall")>=0)return s.outage?"The grid's down. The Powerwall is at "+r.pct+"%"+(r.hours?" with about "+r.hours+" hours left.":" and still charging from solar."):i?"It's at "+r.pct+"% and running the house. Solar picks back up around 7.":"Solar's making 4.8 kW, the house is using 1.6, and the Powerwall is at 78% and charging. Smug, but earned.";if(n.indexOf("plants")>=0){let d=this.thirsty(s.moist);if(!d.length)return"Nobody. All 7 groups are fine.";let l=d.reduce((g,b)=>g+b.plants,0);return d.map(g=>g.room).join(", then ")+". That's "+l+" plants, about "+l+" minutes. The "+d[0].ind+" is doing most of the complaining."}return this.applyFx("porchOff"),"Done. The porch light is off."}talk(){let t=this.st;if(t.muted){this.flash("My mic is off. Tap \u201CMic off\u201D to turn it back on.");return}if(t.talk)return;let s=(t.qi||0)%xt.length;this.clearTalk(),this.setState({talk:"listen",q:xt[s],a:"",qi:s+1}),this._t1=window.setTimeout(()=>this.setState({talk:"think"}),1600),this._t2=window.setTimeout(()=>this.setState({talk:"speak",a:this.answer(s)}),2900),this._t3=window.setTimeout(()=>this.setState({talk:null}),8e3)}renderVals(){let t=this.cur(),s=this.st,i=this.hour(),r=i>=23||i<7,n=i>=17||i<7,d=new Date(s.now||Date.now()),l=d.getMinutes(),g,b;s.mode==="day"?(g="4:32",b="PM"):s.mode==="night"?(g="11:42",b="PM"):(g=(i%12===0?12:i%12)+":"+(l<10?"0":"")+l,b=i<12?"AM":"PM");let c=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],m=["January","February","March","April","May","June","July","August","September","October","November","December"],p=this.thirsty(t.moist),k=p.map(a=>a.id),v=p.length>=2,V=A.map(a=>{let u=t.moist[a.id],w=u<a.thr?"dry":u>=55?"wet":"ok",C=v?k.indexOf(a.id)+1:0,Oe=w==="dry"?"Thirsty":w==="wet"?"Moist":"Steady";return{id:a.id,cls:"prow "+w,room:a.room,sub:a.ind.charAt(0).toUpperCase()+a.ind.slice(1)+" \xB7 "+a.plants+" plants",m:u,status:Oe,fill:"width:"+Math.min(100,u/70*100).toFixed(0)+"%",tick:"left:"+(a.thr/70*100).toFixed(0)+"%",hasStop:C>0,isDry:w==="dry",stop:C,tap:()=>{t.moist[a.id]<a.thr?(this.water([a.id]),this.flash("Logged: "+a.room.toLowerCase()+" group watered.")):this.flash(a.room+" is at "+u+"%. No water needed.")}}}),B=p.reduce((a,u)=>a+u.plants,0),U=a=>!!(E[a]&&E[a].urgent),ot=t.cards.filter(a=>a!=="plants"||p.length>0),S=r?ot.filter(U):ot;S=S.filter(U).concat(S.filter(a=>!U(a)));let W=ot.length-S.length,Ht=S.map(a=>{let u=E[a];if(a==="plants"){let w=p.length===1;u={cat:"plant",label:"Plants \xB7 indicator sensors",title:w?p[0].id==="kitchen"?"The nerve plant has fainted again":"The "+p[0].room.toLowerCase()+" group is thirsty":p.length+" plant groups need water",detail:w?"The "+p[0].ind+" is at "+t.moist[p[0].id]+"%. Water all "+p[0].plants+" plants in the "+p[0].room.toLowerCase()+" group"+(p[0].id==="kitchen"?". It perks up within the hour.":"."):p.map(C=>C.room).join(" \u2192 ")+". "+B+" plants, about "+B+" minutes. Tap Plants for the route.",primary:w?"Watered":"Watered them all",secondary:"Snooze 1 day",toast:w?"Logged: "+p[0].room.toLowerCase()+" group watered.":"Logged: "+p.length+" groups watered."}}return{cat:u.cat,urgent:!!u.urgent,label:u.label,title:u.title,detail:u.detail,primary:u.primary,secondary:u.secondary||"",hasSecondary:!!u.secondary,onPrimary:()=>{a==="plants"&&this.water(k),this.resolve(a,u.toast,!1,u.fx)},onSecondary:()=>this.resolve(a,u.secondary==="Snooze 1 day"?"Snoozed. I'll bring it back tomorrow.":u.secondary==="In an hour"?"Okay. I'll remind you in an hour.":"Okay, dismissed.",u.secondary==="Snooze 1 day"||u.secondary==="In an hour",null)}}),x=S.length,Fe=ot.some(U),y=this.energy(t,n),Nt=(y.pct*.34).toFixed(1),De=y.grid===null?"flow w-grid":y.grid>0?"flow w-grid on rev":y.grid<0?"flow w-grid on":"flow w-grid",Ut=Date.now(),wt=s.timers||[],Te=wt.some(a=>a.end<=Ut),rt=s.talk||(Fe||Te?"alert":s.muted?"muted":"rest"),qt=s.page||"home",Pe=["living","porch","kitchen"].filter(a=>t.lights[a]).length,Be=p.map((a,u)=>({n:u+1,room:a.room,plants:a.plants})),$t=S.some(U),O=!!s.focus&&S.indexOf(s.focus)>=0&&(!$t||U(s.focus))?S.indexOf(s.focus):$t?0:Math.min(s.idx||0,Math.max(0,x-1));this._last={count:x,curIdx:O,urgent:$t};let zt=Ht[O]||{cat:"",label:"",title:"",detail:"",primary:"",secondary:"",hasSecondary:!1,urgent:!1,onPrimary:()=>{},onSecondary:()=>{}},Z=t.lights,nt=a=>()=>this.go(a);return{appCls:(r?"night ":"")+(n?"dark":""),themeCls:n?"":"light",pik:rt,pikAria:"Pik: "+It[rt],pikLabel:It[rt],pillCls:rt==="alert"?"pill alert":"pill",talk:()=>this.talk(),q:s.q||"",a:s.talk==="listen"?"Listening\u2026":s.talk==="think"?"Thinking\u2026":s.a||"",micCls:s.muted?"mic off":"mic",micPressed:s.muted?"true":"false",micLabel:s.muted?"Mic off":"Mic on",micSlash:s.muted?"M3 3l18 18":"",toggleMic:()=>{this.clearTalk(),this.setState({muted:!s.muted,talk:null})},clock:g,ampm:b,dayName:c[d.getDay()],monthDay:m[d.getMonth()]+" "+d.getDate(),outTemp:n?"31\xB0":"48\xB0",outLine:(n?"Clear":"Sunny")+" \xB7 low 28\xB0",airShort:t.smoky?"air smoky":"air good",airCls2:t.smoky?"":"airok",demoLabel:t.queue.length?"Simulate event":"Restart demo",next:()=>this.next(),dayBtnCls:s.mode==="day"?"ghost on":"ghost",dayBtn:s.mode==="day"?"Back to live":"Preview day",previewDay:()=>this.setState({mode:s.mode==="day"?null:"day"}),nightBtnCls:s.mode==="night"?"ghost on":"ghost",nightBtn:s.mode==="night"?"Back to live":"Preview night",previewNight:()=>this.setState({mode:s.mode==="night"?null:"night"}),showTalk:!!s.talk,showCard:!s.talk&&x>0,showEmpty:!s.talk&&x===0,bubbleCls:"bubble"+(!s.talk&&zt.urgent?" urgent":""),cur:zt,pagerTxt:x===1?"1 thing for you":O+1+" of "+x,pdots:x>1?S.map((a,u)=>u===O?"on":""):[],hasWaiting:r&&W>0,waiting:W,prevCls:x>1?"nbtn":"nbtn dim",nextCls:x>1?"nbtn":"nbtn dim",goPrev:()=>{x>1&&(this._hold=Date.now()+6e4,this.setState({idx:(O-1+x)%x,focus:null}))},goNext:()=>{x>1&&(this._hold=Date.now()+6e4,this.setState({idx:(O+1)%x,focus:null}))},hasPeek:x>1,peekTitle:x>1?Ht[(O+1)%x].title:"",emptyEb:r?"Quiet hours":"Pik's list",emptyT:r?"Nothing urgent":"All caught up",emptyS:r?W>0?W+(W===1?" thing is":" things are")+" waiting for 7 AM. Sleep well.":"Nothing is waiting. Sleep well.":"Even the nerve plant has nothing to say.",tmodeCls:wt.length?"tmode":"",timers:wt.map(a=>{let u=Math.max(0,a.end-Ut),w=Math.ceil(u/1e3),C=u<=0;return{id:a.id,cls:"tchip"+(C?" tdone":""),left:C?"Done":Math.floor(w/60)+":"+("0"+w%60).slice(-2),label:a.label,dash:"stroke-dashoffset:"+(163.4*(1-u/a.total)).toFixed(1),btn:C?"Stop":"\xD7",aria:C?"Stop the "+a.label+" timer":"Cancel the "+a.label+" timer",stop:()=>{this.stopTimer(a.id),C||this.flash(a.label+" timer canceled.")}}}),pebsCls:t.np?"pebs five":"pebs",np:t.np,npTitle:t.np?t.np.title:"",npSub:t.np?(t.np.playing?"":"Paused \xB7 ")+"Echo Show \xB7 "+t.np.sub:"",eqCls:t.np&&t.np.playing?"eq on":"eq",npIcon:t.np&&t.np.playing?Me:_e,npToggleLbl:t.np&&t.np.playing?"Pause":"Play",npToggle:()=>{t.np&&this.setState({np:Object.assign({},t.np,{playing:!t.np.playing})})},volDown:()=>{let a=Math.max(1,(s.vol||5)-1);this.setState({vol:a}),this.flash("Echo volume "+a)},volUp:()=>{let a=Math.min(10,(s.vol||5)+1);this.setState({vol:a}),this.flash("Echo volume "+a)},npStop:()=>{this.setState({np:null}),this.flash("Stopped the Echo Show.")},pebEnCls:"peb"+(t.outage?" out":""),modeTxt:t.outage?"Grid outage":n?"After dark":"Solar day",bfillCls:"bfill"+(y.bat>0?" chg":y.bat<0?" dis":"")+(t.outage?" out":""),bfillStyle:"width:"+y.pct+"%",pebEnLine:t.outage?"Grid's down \xB7 tap for details":n?"The battery is running the house":"Charging from the sun",pebPlCls:"pv"+(p.length?" dry":""),plBig:p.length?String(p.length):String(Lt),plBigSub:p.length?p.length===1?"group thirsty":"groups thirsty":"plants happy",gdots:A.map(a=>{let u=t.moist[a.id];return u<a.thr?"dry":u>=55?"wet":""}),plShort:p.length?p.map(a=>a.room).join(" \u2192 "):"Everyone's had a drink",setpoint:t.setpoint,heatWord:t.setpoint>68?"heating":"holding",nOn:Pe,waterWord:t.garden?"Freeze skip \xB7 drip on":"Both paused",page:qt,sheetOpen:qt!=="home",goHome:nt("home"),openEnergy:nt("energy"),openPlants:nt("plants"),openControls:nt("controls"),e:y,ewinCls:"ewin"+(t.outage?" out":""),energyAria:y.main+". "+y.sub+".",solarFlow:y.solar>0?"flow w-sun on":"flow w-sun",gridFlow:De,batFlow:y.bat<0?"flow w-bat on":y.bat>0?"flow w-bat on rev":"flow w-bat",solarLbl:n?"SOLAR \xB7 ASLEEP":"SOLAR",solarVal:j(y.solar),houseVal:j(y.house),gridLbl:t.outage?"GRID \xB7 DOWN":(y.grid||0)>0?"GRID \xB7 EXPORT":(y.grid||0)<0?"GRID \xB7 IMPORT":"GRID \xB7 IDLE",gridVal:t.outage?"Offline":j(y.grid),batStyle:"height:"+Nt+"px;y:"+(17-Number(Nt)).toFixed(1)+"px",batVal:y.pct+"% \xB7 "+(y.bat>0?"+":"\u2212")+j(y.bat),gridStat:t.outage?"Down":(y.grid||0)>0?"Sending "+j(y.grid):(y.grid||0)<0?"Using "+j(y.grid):"Idle",showEssentials:t.outage&&!t.essentials,essentialsOn:()=>{this.applyFx("essentials"),this.setState({cards:this.cur().cards.filter(a=>a!=="outage")}),this.flash("Essentials only. That roughly doubles the time left.")},groups:V,plantsEb:"Plants \xB7 "+Lt+" in "+A.length+" groups",plHead:p.length?p.length+" thirsty":"All happy",routeLbl:p.length?"Watering route":"All caught up",routeHead:p.length>1?p.length+" stops, about "+B+" minutes":p.length?"One stop, about "+B+" minutes":"Nothing to water today",routeStops:Be,hasRoute:p.length>0,routeBtn:v?"Log the whole route":"Log it",logRoute:()=>{this.water(k),this.setState({cards:this.cur().cards.filter(a=>a!=="plants")}),this.flash(v?"Logged: "+p.length+" groups watered.":"Logged: watered.")},down:()=>this.setState({setpoint:Math.max(60,t.setpoint-1)}),up:()=>this.setState({setpoint:Math.min(78,t.setpoint+1)}),thermoSub:t.setpoint>68?"Heating \xB7 it's 68\xB0 inside":"Holding \xB7 it's 68\xB0 inside",lights:[["living","Living room"],["porch","Porch"],["kitchen","Kitchen"]].map(a=>({name:a[1],cls:Z[a[0]]?"lp on":"lp",state:Z[a[0]]?"On":"Off",pressed:Z[a[0]]?"true":"false",toggle:()=>{let u=Object.assign({},Z);u[a[0]]=!Z[a[0]],this.setState({lights:u})}})),gardenTxt:t.garden?"Drip runs on its schedule":"Paused until March 1",gardenBtn:t.garden?"Pause until March":"Resume",toggleGarden:()=>{this.setState({garden:!t.garden}),this.flash(t.garden?"The garden drip is paused until March 1.":"The garden drip is back on schedule.")},camera:()=>this.flash("Opening the front door camera."),hasToast:!!s.toast,toast:s.toast||""}}render(){let t=this.renderVals(),s=t.cur;return f`<div class="app ${t.appCls} ${t.themeCls}">
<header class="top">
<div class="clock">${t.clock}<span>${t.ampm}</span></div>
<div class="date">${t.dayName}<br>${t.monthDay}</div>
<div class="sep"></div>
<div class="wx"><b>${t.outTemp}</b>${t.outLine} · <span class=${t.airCls2}>${t.airShort}</span></div>
<div class="sep"></div>
<div class="wx"><b>68°</b>inside</div>
${this.isMock?f`<div class="demo">
<button type="button" class="dbtn" @click=${t.next}>＋ ${t.demoLabel}</button>
<button type="button" class=${t.dayBtnCls} @click=${t.previewDay}>${t.dayBtn}</button>
<button type="button" class=${t.nightBtnCls} @click=${t.previewNight}>${t.nightBtn}</button>
</div>`:h}
</header>
<section class="stage">
<div class="pikcol ${t.tmodeCls}">
<button type="button" class="pikbtn pik p-${t.pik}" aria-label="Talk to Pik" @click=${t.talk}>
${$e(t.pikAria)}
</button>
<div class="pikname"><b>Pik</b><span class=${t.pillCls}>${t.pikLabel}</span><button type="button" class=${t.micCls} aria-pressed=${t.micPressed} aria-label=${t.micLabel} @click=${t.toggleMic}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3"></path><path d=${t.micSlash}></path></svg></button></div>
${t.timers.length?f`<div class="timers">${kt(t.timers,i=>i.id,i=>f`<div class=${i.cls}><svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle class="tr-bg" cx="32" cy="32" r="26"></circle><circle class="tr-fg" cx="32" cy="32" r="26" style=${i.dash}></circle></svg><div class="tt"><b>${i.left}</b><span>${i.label}</span></div><button type="button" class="tx" aria-label=${i.aria} @click=${i.stop}>${i.btn}</button></div>`)}</div>`:h}
</div>
<div class=${t.bubbleCls} aria-live="polite">
${t.showTalk?f`<div class="btop"><span class="eb">You asked</span></div>
<p class="q">“${t.q}”</p>
<p class="ans">${t.a}</p>`:h}
${t.showCard?f`<div class="btop"><span class="eb">${t.pagerTxt}</span><span class="pdots">${t.pdots.map(i=>f`<i class=${i}></i>`)}</span>${t.hasWaiting?f`<span class="wait">· ${t.waiting} waiting for morning</span>`:h}
<span class="nav"><button type="button" class=${t.prevCls} aria-label="Previous" @click=${t.goPrev}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></button><button type="button" class=${t.nextCls} aria-label="Next" @click=${t.goNext}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg></button></span></div>
<div class="cat"><i class="cd ${s.cat}"></i><span class="eb">${s.urgent?f`<span class="utag">Urgent · </span>`:h}${s.label}</span></div>
<h2 class="btitle">${s.title}</h2>
<p class="bdetail">${s.detail}</p>
<div class="acts"><button type="button" class="pbtn" @click=${s.onPrimary}>${s.primary}</button>${s.hasSecondary?f`<button type="button" class="sbtn" @click=${s.onSecondary}>${s.secondary}</button>`:h}${t.hasPeek?f`<button type="button" class="peek" @click=${t.goNext}><span class="eb">Next</span><span class="pt">${t.peekTitle}</span><span aria-hidden="true">›</span></button>`:h}</div>`:h}
${t.showEmpty?f`<div class="btop"><span class="eb">${t.emptyEb}</span></div>
<h2 class="btitle" style="margin-top: 26px">${t.emptyT}</h2>
<p class="bdetail">${t.emptyS}</p>`:h}
</div>
</section>
<section class=${t.pebsCls}>
${t.np?f`<div class="peb np">
<span class="nphead"><span class=${t.eqCls}><i></i><i></i><i></i></span><span class="eb">Now playing</span></span>
<span class="npt">${t.npTitle}</span>
<span class="ps" style="margin-top: 4px">${t.npSub}</span>
<span class="npc">
<button type="button" class="nc main" aria-label=${t.npToggleLbl} @click=${t.npToggle}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d=${t.npIcon}></path></svg></button>
<button type="button" class="nc" aria-label="Volume down" @click=${t.volDown}>−</button>
<button type="button" class="nc" aria-label="Volume up" @click=${t.volUp}>+</button>
<button type="button" class="nc" aria-label="Stop" @click=${t.npStop}>×</button>
</span>
</div>`:h}
<button type="button" class=${t.pebEnCls} @click=${t.openEnergy}>
<span class="eb">Energy · ${t.modeTxt}</span>
<span class="pv">${t.e.pct}%<small>Powerwall</small></span>
<span class="bbar"><span class=${t.bfillCls} style=${t.bfillStyle}></span></span>
<span class="ps">${t.pebEnLine}</span>
</button>
<button type="button" class="peb" @click=${t.openPlants}>
<span class="eb">Plants · ${A.length} groups</span>
<span class=${t.pebPlCls}>${t.plBig}<small>${t.plBigSub}</small></span>
<span class="gd">${t.gdots.map(i=>f`<i class=${i}></i>`)}</span>
<span class="ps">${t.plShort}</span>
</button>
<button type="button" class="peb" @click=${t.openControls}>
<span class="eb">Heat · Ecobee</span>
<span class="pv">${t.setpoint}°<small>${t.heatWord}</small></span>
<span class="ps">It's 68° inside</span>
</button>
<button type="button" class="peb" @click=${t.openControls}>
<span class="eb">Lights &amp; watering</span>
<span class="pv">${t.nOn}<small>of 3 lights on</small></span>
<span class="ps">${t.waterWord}</span>
</button>
</section>
${t.sheetOpen?f`<button type="button" class="scrim" aria-label="Close" @click=${t.goHome}></button>`:h}
${t.page==="energy"?Ae(t):h}
${t.page==="plants"?Se(t):h}
${t.page==="controls"?Ce(t):h}
${t.hasToast?ge(this.toastN,f`<div class="toast" role="status">${t.toast}</div>`):h}
</div>`}};vt.styles=[me,fe,be];function ns(){if(document.querySelector('link[data-pik-fonts], link[href*="family=Instrument+Serif"]'))return;let o=document.createElement("link");o.rel="stylesheet",o.href=rs,o.dataset.pikFonts="",document.head.appendChild(o)}if(!customElements.get("pik-house-card")){customElements.define("pik-house-card",vt);let o=window;o.customCards=o.customCards||[],o.customCards.push({type:"pik-house-card",name:"Pik House Feed",description:"Pik, the kitchen counter house feed (Daylight design).",preview:!1})}export{vt as PikHouseCard};
