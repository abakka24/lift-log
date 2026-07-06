// ── Built-in exercise illustrations (inline SVG, stroke-based) ─────────
// Classes: .s = ink stroke · .a = accent stroke · .hd = head (filled) · .gd = ground

const ART = {

  bench: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="25" y1="56" x2="95" y2="56"/>
    <line class="s" x1="32" y1="56" x2="32" y2="70"/><line class="s" x1="88" y1="56" x2="88" y2="70"/>
    <circle class="hd" cx="34" cy="50" r="4.5"/>
    <line class="s" x1="40" y1="52" x2="70" y2="53"/>
    <polyline class="s" points="70,53 82,58 86,70"/>
    <line class="a" x1="46" y1="52" x2="46" y2="32"/>
    <line class="a" x1="24" y1="30" x2="70" y2="30"/>
    <circle class="s" cx="27" cy="30" r="7"/><circle class="s" cx="67" cy="30" r="7"/>
  </svg>`,

  ohp: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="52" y1="58" x2="52" y2="32"/>
    <line class="s" x1="46" y1="58" x2="74" y2="58"/><line class="s" x1="60" y1="58" x2="60" y2="70"/>
    <circle class="hd" cx="62" cy="20" r="4.5"/>
    <line class="s" x1="62" y1="26" x2="62" y2="50"/>
    <polyline class="s" points="62,50 76,52 76,70"/>
    <line class="a" x1="62" y1="30" x2="48" y2="18"/><line class="a" x1="62" y1="30" x2="76" y2="18"/>
    <circle class="af" cx="46" cy="16" r="3.5"/><circle class="af" cx="78" cy="16" r="3.5"/>
  </svg>`,

  incline: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="34" y1="64" x2="78" y2="34"/>
    <line class="s" x1="56" y1="50" x2="62" y2="72"/>
    <circle class="hd" cx="82" cy="30" r="4.5"/>
    <line class="s" x1="76" y1="36" x2="52" y2="52"/>
    <polyline class="s" points="52,52 44,60 44,72"/>
    <line class="a" x1="66" y1="42" x2="72" y2="22"/>
    <circle class="af" cx="73" cy="19" r="3.5"/>
  </svg>`,

  lateral: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="30" y1="72" x2="90" y2="72"/>
    <circle class="hd" cx="60" cy="16" r="4.5"/>
    <line class="s" x1="60" y1="22" x2="60" y2="46"/>
    <line class="s" x1="60" y1="46" x2="52" y2="72"/><line class="s" x1="60" y1="46" x2="68" y2="72"/>
    <line class="a" x1="60" y1="28" x2="36" y2="24"/><line class="a" x1="60" y1="28" x2="84" y2="24"/>
    <circle class="af" cx="33" cy="23" r="3.5"/><circle class="af" cx="87" cy="23" r="3.5"/>
  </svg>`,

  pushdown: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <circle class="s" cx="74" cy="9" r="3"/>
    <line class="a" x1="74" y1="12" x2="74" y2="48"/>
    <circle class="hd" cx="56" cy="18" r="4.5"/>
    <line class="s" x1="57" y1="24" x2="58" y2="48"/>
    <line class="s" x1="58" y1="48" x2="52" y2="72"/><line class="s" x1="58" y1="48" x2="64" y2="72"/>
    <line class="s" x1="57" y1="28" x2="66" y2="38"/>
    <line class="a" x1="66" y1="38" x2="72" y2="50"/>
    <line class="s" x1="64" y1="52" x2="82" y2="50"/>
  </svg>`,

  cablecrunch: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <circle class="s" cx="82" cy="8" r="3"/>
    <line class="a" x1="80" y1="10" x2="64" y2="26"/>
    <circle class="hd" cx="66" cy="30" r="4.5"/>
    <path class="a" d="M48,54 Q50,38 62,32"/>
    <line class="s" x1="48" y1="54" x2="52" y2="70"/>
    <line class="s" x1="52" y1="70" x2="66" y2="70"/>
    <line class="s" x1="62" y1="32" x2="58" y2="24"/>
    <line class="gd" x1="36" y1="72" x2="90" y2="72"/>
  </svg>`,

  birddog: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="16" y1="68" x2="104" y2="68"/>
    <line class="s" x1="44" y1="44" x2="74" y2="44"/>
    <circle class="hd" cx="80" cy="41" r="4.5"/>
    <line class="s" x1="72" y1="45" x2="72" y2="66"/>
    <polyline class="s" points="48,45 48,66 58,66"/>
    <line class="a" x1="74" y1="43" x2="96" y2="35"/>
    <line class="a" x1="44" y1="44" x2="22" y2="37"/>
  </svg>`,

  pullup: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="34" y1="12" x2="86" y2="12"/>
    <circle class="hd" cx="60" cy="24" r="4.5"/>
    <line class="s" x1="60" y1="30" x2="60" y2="50"/>
    <line class="a" x1="60" y1="30" x2="46" y2="13"/><line class="a" x1="60" y1="30" x2="74" y2="13"/>
    <line class="s" x1="60" y1="50" x2="54" y2="66"/><line class="s" x1="60" y1="50" x2="66" y2="66"/>
  </svg>`,

  chestrow: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="36" y1="62" x2="72" y2="34"/>
    <line class="s" x1="54" y1="50" x2="60" y2="72"/>
    <circle class="hd" cx="76" cy="30" r="4.5"/>
    <line class="s" x1="70" y1="36" x2="46" y2="54"/>
    <polyline class="s" points="46,54 38,62 38,72"/>
    <line class="a" x1="60" y1="43" x2="58" y2="58"/>
    <circle class="af" cx="58" cy="61" r="3.5"/>
  </svg>`,

  dbrow: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="30" y1="58" x2="64" y2="58"/>
    <line class="s" x1="34" y1="58" x2="34" y2="72"/><line class="s" x1="60" y1="58" x2="60" y2="72"/>
    <circle class="hd" cx="86" cy="31" r="4.5"/>
    <line class="s" x1="50" y1="38" x2="80" y2="34"/>
    <line class="s" x1="56" y1="38" x2="48" y2="56"/>
    <line class="a" x1="72" y1="36" x2="72" y2="52"/>
    <circle class="af" cx="72" cy="55" r="3.5"/>
    <polyline class="s" points="80,34 88,52 88,72"/>
  </svg>`,

  facepull: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <circle class="s" cx="96" cy="26" r="3"/>
    <line class="a" x1="93" y1="26" x2="74" y2="27"/>
    <circle class="hd" cx="52" cy="20" r="4.5"/>
    <line class="s" x1="55" y1="26" x2="57" y2="48"/>
    <line class="s" x1="57" y1="48" x2="50" y2="72"/><line class="s" x1="57" y1="48" x2="65" y2="72"/>
    <line class="a" x1="56" y1="27" x2="72" y2="22"/><line class="a" x1="56" y1="31" x2="72" y2="33"/>
  </svg>`,

  curl: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="34" y1="72" x2="86" y2="72"/>
    <circle class="hd" cx="60" cy="15" r="4.5"/>
    <line class="s" x1="60" y1="21" x2="60" y2="46"/>
    <line class="s" x1="60" y1="46" x2="54" y2="72"/><line class="s" x1="60" y1="46" x2="66" y2="72"/>
    <line class="s" x1="55" y1="26" x2="53" y2="40"/><line class="s" x1="65" y1="26" x2="67" y2="40"/>
    <line class="a" x1="53" y1="40" x2="50" y2="28"/><line class="a" x1="67" y1="40" x2="70" y2="28"/>
    <line class="a" x1="44" y1="27" x2="76" y2="27"/>
  </svg>`,

  backext: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="24" y1="72" x2="96" y2="72"/>
    <line class="s" x1="32" y1="68" x2="60" y2="48"/>
    <line class="s" x1="48" y1="58" x2="48" y2="72"/>
    <line class="s" x1="34" y1="60" x2="40" y2="70"/>
    <line class="s" x1="36" y1="66" x2="58" y2="50"/>
    <line class="a" x1="58" y1="50" x2="82" y2="36"/>
    <circle class="hd" cx="88" cy="33" r="4.5"/>
  </svg>`,

  pallof: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <circle class="s" cx="100" cy="33" r="3"/>
    <line class="a" x1="97" y1="33" x2="74" y2="32"/>
    <circle class="hd" cx="52" cy="16" r="4.5"/>
    <line class="s" x1="52" y1="22" x2="52" y2="48"/>
    <line class="s" x1="52" y1="48" x2="44" y2="72"/><line class="s" x1="52" y1="48" x2="60" y2="72"/>
    <line class="s" x1="52" y1="30" x2="72" y2="32"/>
    <circle class="af" cx="73" cy="32" r="3"/>
  </svg>`,

  squat: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="26" y1="14" x2="26" y2="72"/><line class="s" x1="94" y1="14" x2="94" y2="72"/>
    <line class="s" x1="26" y1="36" x2="33" y2="36"/><line class="s" x1="94" y1="36" x2="87" y2="36"/>
    <circle class="hd" cx="60" cy="24" r="4.5"/>
    <line class="s" x1="60" y1="29" x2="60" y2="44"/>
    <line class="s" x1="60" y1="44" x2="48" y2="54"/><line class="s" x1="60" y1="44" x2="72" y2="54"/>
    <line class="s" x1="48" y1="54" x2="48" y2="70"/><line class="s" x1="72" y1="54" x2="72" y2="70"/>
    <line class="a" x1="38" y1="31" x2="82" y2="31"/>
    <circle class="s" cx="38" cy="31" r="7"/><circle class="s" cx="82" cy="31" r="7"/>
  </svg>`,

  rdl: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="30" y1="72" x2="95" y2="72"/>
    <circle class="hd" cx="82" cy="25" r="4.5"/>
    <line class="a" x1="54" y1="40" x2="77" y2="28"/>
    <polyline class="s" points="54,40 58,56 56,72"/>
    <line class="s" x1="74" y1="30" x2="72" y2="48"/>
    <circle class="s" cx="72" cy="54" r="7"/>
  </svg>`,

  legpress: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="28" y1="70" x2="94" y2="70"/>
    <line class="s" x1="34" y1="42" x2="52" y2="64"/>
    <circle class="hd" cx="35" cy="37" r="4.5"/>
    <line class="s" x1="40" y1="44" x2="54" y2="60"/>
    <line class="a" x1="54" y1="60" x2="70" y2="48"/>
    <line class="a" x1="70" y1="48" x2="79" y2="39"/>
    <line class="s" x1="86" y1="30" x2="72" y2="52"/>
    <line class="s" x1="86" y1="30" x2="90" y2="70"/>
  </svg>`,

  legcurl: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="44" y1="32" x2="44" y2="56"/>
    <line class="s" x1="44" y1="56" x2="66" y2="56"/>
    <line class="s" x1="56" y1="56" x2="56" y2="72"/>
    <circle class="hd" cx="48" cy="25" r="4.5"/>
    <line class="s" x1="48" y1="31" x2="48" y2="54"/>
    <line class="s" x1="48" y1="54" x2="68" y2="54"/>
    <line class="a" x1="68" y1="54" x2="75" y2="68"/>
    <line class="s" x1="71" y1="70" x2="81" y2="66"/>
  </svg>`,

  calf: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="28" y1="72" x2="96" y2="72"/>
    <polyline class="s" points="48,66 80,66 80,72"/>
    <circle class="hd" cx="60" cy="12" r="4.5"/>
    <line class="s" x1="60" y1="17" x2="59" y2="40"/>
    <line class="s" x1="59" y1="40" x2="58" y2="62"/>
    <line class="a" x1="54" y1="66" x2="64" y2="61"/>
    <path class="a" d="M44,68 L44,58 M40,61 L44,58 L48,61"/>
  </svg>`,

  abmachine: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="46" y1="36" x2="46" y2="56"/>
    <line class="s" x1="44" y1="56" x2="68" y2="56"/>
    <line class="s" x1="56" y1="56" x2="56" y2="72"/>
    <circle class="hd" cx="68" cy="31" r="4.5"/>
    <path class="a" d="M50,54 Q52,38 64,33"/>
    <line class="s" x1="64" y1="36" x2="72" y2="42"/>
    <polyline class="s" points="50,54 66,56 66,70"/>
  </svg>`,

  sideplank: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="22" y1="68" x2="98" y2="68"/>
    <circle class="hd" cx="47" cy="41" r="4.5"/>
    <line class="s" x1="52" y1="48" x2="46" y2="66"/>
    <line class="s" x1="42" y1="66" x2="58" y2="66"/>
    <line class="a" x1="52" y1="48" x2="92" y2="64"/>
  </svg>`,

  snatch: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <circle class="hd" cx="60" cy="30" r="4.5"/>
    <line class="s" x1="60" y1="35" x2="60" y2="48"/>
    <line class="s" x1="60" y1="48" x2="50" y2="58"/><line class="s" x1="60" y1="48" x2="70" y2="58"/>
    <line class="s" x1="50" y1="58" x2="50" y2="70"/><line class="s" x1="70" y1="58" x2="70" y2="70"/>
    <line class="a" x1="60" y1="36" x2="42" y2="20"/><line class="a" x1="60" y1="36" x2="78" y2="20"/>
    <line class="a" x1="30" y1="18" x2="90" y2="18"/>
    <circle class="s" cx="30" cy="18" r="7"/><circle class="s" cx="90" cy="18" r="7"/>
  </svg>`,

  cleanjerk: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="30" y1="70" x2="94" y2="70"/>
    <circle class="hd" cx="60" cy="27" r="4.5"/>
    <line class="s" x1="60" y1="32" x2="60" y2="46"/>
    <polyline class="s" points="60,46 46,52 42,70"/>
    <polyline class="s" points="60,46 74,58 80,70"/>
    <line class="a" x1="60" y1="33" x2="58" y2="15"/>
    <circle class="s" cx="58" cy="12" r="7"/>
  </svg>`,

  frontsquat: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="32" y1="72" x2="92" y2="72"/>
    <circle class="hd" cx="56" cy="23" r="4.5"/>
    <line class="s" x1="56" y1="28" x2="54" y2="47"/>
    <line class="s" x1="54" y1="47" x2="68" y2="51"/>
    <line class="s" x1="68" y1="51" x2="68" y2="71"/>
    <line class="a" x1="57" y1="32" x2="73" y2="29"/>
    <circle class="s" cx="61" cy="30" r="6.5"/>
  </svg>`,

  boxjump: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <path class="s" d="M64,44 L94,44 L94,72 L64,72 Z"/>
    <circle class="hd" cx="40" cy="17" r="4.5"/>
    <line class="s" x1="40" y1="22" x2="42" y2="37"/>
    <polyline class="a" points="42,37 52,39 50,49"/>
    <line class="s" x1="40" y1="25" x2="30" y2="17"/>
    <path class="a" style="stroke-dasharray:4 4" d="M28,52 Q48,8 74,38"/>
  </svg>`,

  curlup: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="70" x2="100" y2="70"/>
    <line class="s" x1="52" y1="64" x2="86" y2="68"/>
    <polyline class="s" points="52,64 62,52 70,68"/>
    <line class="a" x1="52" y1="64" x2="34" y2="54"/>
    <circle class="hd" cx="30" cy="50" r="4.5"/>
  </svg>`,

  catcow: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="68" x2="100" y2="68"/>
    <line class="s" x1="44" y1="48" x2="44" y2="66"/>
    <line class="s" x1="76" y1="48" x2="76" y2="66"/>
    <path class="a" d="M44,48 Q60,32 76,48"/>
    <circle class="hd" cx="38" cy="54" r="4.5"/>
  </svg>`,

  anklerock: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="26" y1="68" x2="98" y2="68"/>
    <circle class="hd" cx="62" cy="24" r="4.5"/>
    <line class="s" x1="62" y1="30" x2="66" y2="48"/>
    <line class="s" x1="66" y1="48" x2="44" y2="50"/>
    <line class="a" x1="44" y1="50" x2="50" y2="66"/>
    <line class="s" x1="66" y1="48" x2="76" y2="66"/>
    <line class="s" x1="76" y1="66" x2="90" y2="68"/>
    <path class="a" d="M40,58 L33,60 M36,55 L33,60 L38,63"/>
  </svg>`,

  glutebridge: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="68" x2="100" y2="68"/>
    <circle class="hd" cx="30" cy="61" r="4.5"/>
    <line class="a" x1="36" y1="62" x2="64" y2="44"/>
    <line class="s" x1="64" y1="44" x2="78" y2="48"/>
    <line class="s" x1="78" y1="48" x2="78" y2="66"/>
    <line class="s" x1="40" y1="64" x2="56" y2="66"/>
  </svg>`,

  deadbug: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="68" x2="100" y2="68"/>
    <circle class="hd" cx="32" cy="60" r="4.5"/>
    <line class="s" x1="38" y1="63" x2="66" y2="63"/>
    <line class="a" x1="46" y1="61" x2="46" y2="38"/>
    <line class="a" x1="66" y1="63" x2="78" y2="46"/>
    <line class="a" x1="78" y1="46" x2="88" y2="52"/>
    <polyline class="s" points="66,63 76,60 80,67"/>
  </svg>`,

  hipflexor: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="26" y1="68" x2="98" y2="68"/>
    <circle class="hd" cx="57" cy="19" r="4.5"/>
    <line class="s" x1="58" y1="25" x2="60" y2="48"/>
    <line class="a" x1="58" y1="28" x2="65" y2="11"/>
    <line class="s" x1="60" y1="48" x2="45" y2="50"/>
    <line class="s" x1="45" y1="50" x2="45" y2="66"/>
    <line class="s" x1="60" y1="48" x2="73" y2="66"/>
    <line class="s" x1="73" y1="66" x2="88" y2="68"/>
  </svg>`,

  deepsquat: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="32" y1="70" x2="90" y2="70"/>
    <circle class="hd" cx="56" cy="27" r="4.5"/>
    <line class="s" x1="56" y1="32" x2="53" y2="47"/>
    <line class="a" x1="53" y1="47" x2="70" y2="53"/>
    <line class="a" x1="70" y1="53" x2="66" y2="69"/>
    <line class="s" x1="55" y1="35" x2="74" y2="31"/>
  </svg>`,

  reach: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="32" y1="72" x2="88" y2="72"/>
    <circle class="hd" cx="67" cy="18" r="4.5"/>
    <path class="s" d="M58,46 Q59,30 64,23"/>
    <path class="a" d="M63,26 Q72,12 82,18"/>
    <line class="s" x1="59" y1="38" x2="50" y2="46"/>
    <line class="s" x1="58" y1="46" x2="52" y2="72"/>
    <line class="s" x1="58" y1="46" x2="64" y2="72"/>
  </svg>`,

  kneeschest: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="22" y1="68" x2="98" y2="68"/>
    <circle class="hd" cx="36" cy="56" r="4.5"/>
    <path class="s" d="M42,60 Q58,54 68,62"/>
    <line class="a" x1="64" y1="60" x2="52" y2="44"/>
    <line class="a" x1="52" y1="44" x2="42" y2="52"/>
    <line class="s" x1="48" y1="58" x2="54" y2="46"/>
  </svg>`,

  figure4: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="68" x2="100" y2="68"/>
    <circle class="hd" cx="30" cy="61" r="4.5"/>
    <line class="s" x1="36" y1="64" x2="60" y2="64"/>
    <line class="s" x1="60" y1="64" x2="72" y2="48"/>
    <line class="s" x1="72" y1="48" x2="82" y2="58"/>
    <line class="a" x1="72" y1="48" x2="58" y2="42"/>
    <line class="a" x1="58" y1="42" x2="54" y2="47"/>
  </svg>`,

  hamstring: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="68" x2="100" y2="68"/>
    <circle class="hd" cx="32" cy="59" r="4.5"/>
    <line class="s" x1="38" y1="63" x2="62" y2="64"/>
    <line class="a" x1="62" y1="64" x2="57" y2="33"/>
    <line class="s" x1="62" y1="64" x2="88" y2="66"/>
    <line class="s" x1="50" y1="58" x2="57" y2="42"/>
  </svg>`,

  pigeon: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="22" y1="68" x2="100" y2="68"/>
    <circle class="hd" cx="58" cy="26" r="4.5"/>
    <line class="s" x1="58" y1="31" x2="53" y2="56"/>
    <line class="a" x1="42" y1="63" x2="62" y2="58"/>
    <line class="s" x1="56" y1="58" x2="88" y2="65"/>
    <line class="s" x1="56" y1="40" x2="46" y2="58"/>
  </svg>`,

  openbook: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="22" y1="68" x2="98" y2="68"/>
    <circle class="hd" cx="40" cy="51" r="4.5"/>
    <line class="s" x1="46" y1="54" x2="66" y2="58"/>
    <line class="s" x1="66" y1="58" x2="78" y2="50"/>
    <line class="s" x1="78" y1="50" x2="86" y2="60"/>
    <line class="s" x1="48" y1="54" x2="32" y2="50"/>
    <line class="a" x1="48" y1="54" x2="60" y2="32"/>
  </svg>`,

  childpose: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="68" x2="100" y2="68"/>
    <line class="s" x1="66" y1="64" x2="82" y2="66"/>
    <path class="s" d="M66,60 Q56,48 40,58"/>
    <circle class="hd" cx="36" cy="55" r="4.5"/>
    <line class="a" x1="38" y1="60" x2="24" y2="62"/>
  </svg>`,

  calfstretch: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="26" y1="12" x2="26" y2="70"/>
    <line class="gd" x1="26" y1="70" x2="98" y2="70"/>
    <circle class="hd" cx="36" cy="26" r="4.5"/>
    <line class="s" x1="28" y1="36" x2="42" y2="34"/>
    <line class="s" x1="42" y1="34" x2="58" y2="48"/>
    <line class="s" x1="58" y1="48" x2="54" y2="68"/>
    <line class="a" x1="58" y1="48" x2="78" y2="68"/>
  </svg>`,

  tibraise: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="94" y1="12" x2="94" y2="70"/>
    <line class="gd" x1="26" y1="70" x2="94" y2="70"/>
    <circle class="hd" cx="80" cy="21" r="4.5"/>
    <line class="s" x1="83" y1="27" x2="88" y2="52"/>
    <line class="s" x1="88" y1="52" x2="72" y2="68"/>
    <line class="a" x1="72" y1="68" x2="64" y2="60"/>
    <path class="a" d="M56,66 L56,56 M52,59 L56,56 L60,59"/>
  </svg>`,

  ninety: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="22" y1="66" x2="100" y2="66"/>
    <circle class="hd" cx="56" cy="22" r="4.5"/>
    <line class="s" x1="56" y1="28" x2="57" y2="55"/>
    <line class="a" x1="57" y1="56" x2="78" y2="56"/>
    <line class="a" x1="78" y1="56" x2="86" y2="64"/>
    <line class="s" x1="57" y1="56" x2="42" y2="60"/>
    <line class="s" x1="42" y1="60" x2="32" y2="52"/>
  </svg>`,

  adductor: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="gd" x1="20" y1="66" x2="102" y2="66"/>
    <circle class="hd" cx="40" cy="38" r="4.5"/>
    <line class="s" x1="46" y1="42" x2="68" y2="44"/>
    <line class="s" x1="48" y1="42" x2="48" y2="64"/>
    <line class="s" x1="66" y1="46" x2="66" y2="64"/>
    <line class="a" x1="68" y1="44" x2="94" y2="62"/>
  </svg>`,

  wallslide: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="90" y1="10" x2="90" y2="70"/>
    <line class="gd" x1="30" y1="70" x2="90" y2="70"/>
    <circle class="hd" cx="77" cy="23" r="4.5"/>
    <line class="s" x1="81" y1="29" x2="83" y2="55"/>
    <line class="a" x1="81" y1="31" x2="87" y2="14"/>
    <line class="s" x1="83" y1="55" x2="72" y2="70"/>
    <line class="s" x1="83" y1="55" x2="82" y2="70"/>
  </svg>`,

  latstretch: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="28" y1="12" x2="28" y2="70"/>
    <line class="gd" x1="28" y1="70" x2="98" y2="70"/>
    <circle class="hd" cx="52" cy="26" r="4.5"/>
    <line class="a" x1="30" y1="24" x2="56" y2="32"/>
    <line class="s" x1="56" y1="32" x2="76" y2="44"/>
    <line class="s" x1="76" y1="44" x2="80" y2="68"/>
  </svg>`,

  machinepress: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="s" x1="48" y1="56" x2="48" y2="30"/>
    <line class="s" x1="44" y1="56" x2="70" y2="56"/><line class="s" x1="58" y1="56" x2="58" y2="72"/>
    <circle class="hd" cx="58" cy="22" r="4.5"/>
    <line class="s" x1="58" y1="28" x2="58" y2="52"/>
    <line class="a" x1="58" y1="32" x2="46" y2="16"/><line class="a" x1="58" y1="32" x2="70" y2="16"/>
    <line class="s" x1="41" y1="15" x2="50" y2="15"/><line class="s" x1="66" y1="15" x2="75" y2="15"/>
    <path class="s" d="M86,36 L100,36 L100,62 L86,62 Z"/>
    <line class="s" x1="86" y1="45" x2="100" y2="45"/><line class="s" x1="86" y1="54" x2="100" y2="54"/>
  </svg>`,

  cablerow: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <path class="s" d="M14,36 L28,36 L28,62 L14,62 Z"/>
    <line class="s" x1="14" y1="49" x2="28" y2="49"/>
    <circle class="s" cx="33" cy="47" r="3"/>
    <line class="a" x1="36" y1="47" x2="52" y2="45"/>
    <circle class="hd" cx="68" cy="25" r="4.5"/>
    <line class="s" x1="66" y1="31" x2="64" y2="52"/>
    <line class="a" x1="65" y1="36" x2="52" y2="45"/>
    <polyline class="s" points="64,52 84,55 90,49"/>
    <line class="s" x1="90" y1="45" x2="94" y2="60"/>
    <line class="s" x1="56" y1="58" x2="76" y2="58"/>
  </svg>`,

  bar: `<svg viewBox="0 0 120 80" class="art" aria-hidden="true">
    <line class="a" x1="22" y1="44" x2="98" y2="44"/>
    <circle class="s" cx="32" cy="44" r="10"/><circle class="s" cx="88" cy="44" r="10"/>
    <line class="s" x1="44" y1="38" x2="44" y2="50"/><line class="s" x1="76" y1="38" x2="76" y2="50"/>
  </svg>`,
};

function artFor(key) {
  return ART[key] || ART.bar;
}
