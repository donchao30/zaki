/* Zaki — pages façon Stumble Guys : chaque page = une image générée + des zones réelles posées dessus. */
const UI = (() => {
  const PAGES = {
    lobby: ['img/lobby2.jpg', 1344, 752], chars: ['img/casier2.jpg', 1344, 752], maps: ['img/mapsel.jpg', 1280, 716],
    online: ['img/salon.jpg', 1344, 752], shop: ['img/boutique.jpg', 1344, 752], pass: ['img/passe.jpg', 1344, 752],
    settings: ['img/reglages.jpg', 1344, 752], victory: ['img/victoire2.jpg', 1344, 752]
  };
  const stages = {};
  for (const id in PAGES) {
    const p = document.createElement('div'); p.className = 'page hide'; p.id = id;
    const s = document.createElement('div'); s.className = 'stage'; p.appendChild(s);
    document.body.appendChild(p); stages[id] = s;
  }
  // r = [x1, y1, x2, y2] en pixels de l'image de la page
  function put(page, tag, cls, r, id, text) {
    const [, W, H] = PAGES[page], e = document.createElement(tag);
    if (cls) e.className = cls; if (id) e.id = id; if (text != null) e.textContent = text;
    Object.assign(e.style, { left: (r[0] / W * 100) + '%', top: (r[1] / H * 100) + '%', width: ((r[2] - r[0]) / W * 100) + '%', height: ((r[3] - r[1]) / H * 100) + '%' });
    if (tag === 'button') { e.type = 'button'; if (text == null) e.setAttribute('aria-label', id || ''); }
    stages[page].appendChild(e); return e;
  }
  // ---------- Accueil
  put('lobby', 'button', 'hs', [12, 195, 285, 295], 'lbShop').setAttribute('aria-label', 'Boutique');
  put('lobby', 'button', 'hs', [12, 315, 285, 410], 'bChars').setAttribute('aria-label', 'Casier');
  put('lobby', 'button', 'hs', [12, 433, 285, 530], 'lbPass').setAttribute('aria-label', 'Passe');
  put('lobby', 'button', 'hs', [12, 550, 285, 645], 'bMaps').setAttribute('aria-label', 'Maps');
  put('lobby', 'button', 'hs', [910, 535, 1330, 720], 'bPlay').setAttribute('aria-label', 'Jouer');
  put('lobby', 'button', 'hs ghosths', [470, 250, 845, 600], 'lbPed').setAttribute('aria-label', 'Changer de perso');
  put('lobby', 'img', 'avatar', [24, 30, 108, 106], 'lbAvatar').alt = '';
  put('lobby', 'div', 't left', [128, 28, 415, 64], 'lbName', 'Zak');
  put('lobby', 'div', 't dark', [125, 68, 205, 105], 'lbLvl', 'Niv. 1');
  const xp = put('lobby', 'div', 'xpbar', [208, 72, 404, 103], 'lbXp'); xp.innerHTML = '<i></i><span></span>';
  put('lobby', 'div', 't cover', [945, 33, 1062, 74], 'coins', '0').style.background = '#2e2c77';
  put('lobby', 'button', 'pillbtn', [1135, 25, 1330, 82], 'bOnline', '🌐 EN LIGNE');
  put('lobby', 'div', 't', [582, 592, 750, 646], 'lname', 'RoiZaki');
  put('lobby', 'div', 't cover small', [1038, 652, 1208, 688], 'lbSub', 'Tournoi à 16').style.background = '#511785';
  put('lobby', 'button', 'hs round', [1066, 28, 1114, 78], 'lbPlus').setAttribute('aria-label', 'Acheter des pièces');
  put('lobby', 'button', 'roundbtn', [1262, 96, 1326, 160], 'lbGear', '⚙').setAttribute('aria-label', 'Réglages');
  put('lobby', 'span', 'hide', [0, 0, 1, 1], 'lcls');
  // ---------- Casier (persos)
  put('chars', 'button', 'hs', [22, 18, 95, 80], 'charsBack').setAttribute('aria-label', 'Retour');
  put('chars', 'div', 't big', [130, 90, 440, 138], 'chName', 'RoiZaki');
  put('chars', 'div', 't small', [222, 140, 352, 175], 'chCls', 'Premium');
  put('chars', 'div', 't', [1195, 28, 1270, 68], 'chCoins', '0');
  put('chars', 'button', 'hs round', [1290, 16, 1338, 64], 'chPlus').setAttribute('aria-label', 'Boutique');
  put('chars', 'button', 'hs tabhs', [560, 110, 798, 170], 'tabChars').setAttribute('aria-label', 'Persos');
  put('chars', 'button', 'hs tabhs', [805, 110, 1043, 170], 'tabEmotes').setAttribute('aria-label', 'Emotes');
  put('chars', 'button', 'hs tabhs', [1050, 110, 1293, 170], 'tabTrails').setAttribute('aria-label', 'Traînées');
  put('chars', 'div', 'cgrid', [545, 188, 1308, 702], 'charGrid');
  put('chars', 'button', 'hs', [135, 655, 420, 735], 'charsOk').setAttribute('aria-label', 'Équiper');
  put('chars', 'div', 't okcover', [168, 668, 388, 722], 'charsOkTxt', 'Équiper');
  put('chars', 'div', 'emoprev', [215, 190, 355, 330], 'emoPrev', '');
  // ---------- Choix de la map (carrousel : la map du centre est celle choisie)
  put('maps', 'button', 'pillbtn navy', [28, 18, 190, 82], 'mapsBack', '‹ RETOUR');
  put('maps', 'div', 't cover navy', [1118, 16, 1254, 74], 'mapsMode', '1 manche');
  put('maps', 'div', 't cover navy coinic', [1142, 84, 1254, 132], 'mapsCoins', '0');
  const SLOTS = [[90, 219, 277, 512], [308, 219, 495, 512], [521, 209, 755, 524], [788, 219, 975, 512], [1006, 219, 1193, 512]];
  SLOTS.forEach((r, i) => put('maps', 'button', 'mslot' + (i === 2 ? ' mid' : ''), r, 'mslot' + i));
  put('maps', 'button', 'hs round', [8, 318, 68, 378], 'mapsPrev').setAttribute('aria-label', 'Map précédente');
  put('maps', 'button', 'hs round', [1212, 318, 1272, 378], 'mapsNext').setAttribute('aria-label', 'Map suivante');
  put('maps', 'button', 'hs', [312, 595, 575, 685], 'mapsRandom').setAttribute('aria-label', 'Aléatoire');
  put('maps', 'button', 'hs', [605, 590, 950, 690], 'mapsPlay').setAttribute('aria-label', 'Jouer');
  put('maps', 'div', 'hide', [0, 0, 1, 1], 'mapGrid');
  // ---------- En ligne / salon
  put('online', 'button', 'hs round', [18, 18, 95, 95], 'onClose').setAttribute('aria-label', 'Retour');
  put('online', 'div', 't code', [318, 292, 662, 428], 'onCode', '');
  put('online', 'button', 'hs', [318, 458, 662, 562], 'onCreate').setAttribute('aria-label', 'Créer un salon');
  const inp = put('online', 'input', 'codein', [762, 322, 1108, 394], 'onInput');
  Object.assign(inp, { maxLength: 4, placeholder: 'CODE', autocomplete: 'off' }); inp.setAttribute('autocapitalize', 'characters'); inp.setAttribute('aria-label', 'Code du salon');
  put('online', 'button', 'hs', [765, 455, 1108, 562], 'onJoin').setAttribute('aria-label', 'Rejoindre');
  const bar = put('online', 'div', 'onbar', [334, 632, 1022, 718], 'onBar');
  bar.innerHTML = '<p id="onStatus">Crée un salon ou tape le code de ton ami</p><button class="minibtn hide" id="onStart">Tournoi</button><button class="minibtn ghost hide" id="onQuick">1 manche</button>';
  // ---------- Boutique
  put('shop', 'button', 'hs round', [18, 18, 105, 102], 'shopBack').setAttribute('aria-label', 'Retour');
  put('shop', 'div', 't left', [1128, 30, 1310, 80], 'shCoins', '0');
  put('shop', 'button', 't dark hs', [362, 578, 546, 640], 'sh0', '10 💎 → 500');
  put('shop', 'button', 't dark hs', [612, 578, 795, 640], 'sh1', '1 000');
  put('shop', 'button', 't dark hs', [860, 578, 1044, 640], 'sh2', '800 pièces');
  put('shop', 'button', 'hs', [345, 180, 563, 570], 'sh0b').setAttribute('aria-label', 'Pack de pièces');
  put('shop', 'button', 'hs', [843, 180, 1061, 570], 'sh2b').setAttribute('aria-label', 'Coffre surprise');
  put('shop', 'button', 't dark hs', [1108, 578, 1293, 640], 'sh3', '+50 pièces');
  // ---------- Passe
  put('pass', 'button', 'hs round', [18, 18, 95, 95], 'passBack').setAttribute('aria-label', 'Retour');
  put('pass', 'div', 't cover navy coinic', [1020, 22, 1156, 74], 'passCoins', '0');
  put('pass', 'div', 't cover navy', [1162, 26, 1262, 70], 'passGems', '0');
  put('pass', 'div', 'phead', [352, 244, 1008, 298], 'passHead').innerHTML = '<b class="pl">Niv. 1</b><div class="pbar"><i></i><span>0 / 100 XP</span></div><b class="pl pr">Niv. 2</b>';
  put('pass', 'div', 'ptrack', [158, 326, 1252, 372], 'passTrack');
  for (let i = 0; i < 9; i++) {
    const x1 = 166 + i * 108;
    put('pass', 'button', 'hs pcell', [x1, 380, x1 + 96, 484], 'passF' + i).setAttribute('aria-label', 'Récompense ' + (i + 1));
    put('pass', 'div', 'pbadge', [x1 + 70, 372, x1 + 104, 406], 'passB' + i);
    put('pass', 'div', 'pprem', [x1, 492, x1 + 96, 598], 'passP' + i);
  }
  put('pass', 'button', 'hs', [405, 645, 940, 735], 'passPrem').setAttribute('aria-label', 'Passe Premium');
  // ---------- Réglages
  put('settings', 'button', 'hs round', [1022, 72, 1105, 142], 'setClose').setAttribute('aria-label', 'Fermer');
  [['setMus', [662, 178, 1048, 220]], ['setSfx', [662, 245, 1048, 287]], ['setBtn', [662, 447, 1048, 490]]].forEach(([id, r]) => {
    const c = put('settings', 'div', 'slidebox', r); const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 100; s.id = id; s.className = 'slider'; c.appendChild(s);
  });
  const vb = put('settings', 'button', 'toggle', [918, 302, 1056, 358], 'setVib'); vb.innerHTML = '<span>On</span><i></i>';
  const gx = put('settings', 'div', 'seg', [658, 368, 1058, 424], 'setGfx');
  gx.innerHTML = '<button data-g="0">Bas</button><button data-g="1">Moyen</button><button data-g="2">Élevé</button>';
  put('settings', 'button', 'hs', [288, 598, 680, 672], 'setParent').setAttribute('aria-label', 'Contrôle parental');
  put('settings', 'button', 'hs', [710, 598, 1060, 672], 'setAccount').setAttribute('aria-label', 'Compte');
  put('settings', 'button', 'hs', [1000, 520, 1205, 568], 'setLang').setAttribute('aria-label', 'Langue');
  // ---------- Célébration (podium)
  put('victory', 'div', 't status', [440, 156, 904, 206], 'vStatus', '');
  put('victory', 'div', 't dark', [500, 545, 690, 592], 'vName1', '');
  put('victory', 'div', 't namepill', [284, 300, 464, 336], 'vName2', '');
  put('victory', 'div', 't namepill', [715, 300, 895, 336], 'vName3', '');
  put('victory', 'div', 't left', [1068, 300, 1288, 365], 'vR0', '');
  put('victory', 'div', 't left', [1068, 385, 1288, 450], 'vR1', '');
  put('victory', 'div', 't left', [1068, 470, 1288, 535], 'vR2', '');
  put('victory', 'button', 'hs', [205, 628, 470, 720], 'vReplay').setAttribute('aria-label', 'Rejouer');
  put('victory', 'div', 't cover blue', [282, 648, 458, 702], 'vReplayTxt', 'Accueil');
  put('victory', 'button', 'hs', [545, 610, 1000, 730], 'vNext').setAttribute('aria-label', 'Continuer');

  // Ancres 3D (pieds du perso, hauteur en px de l'image)
  const ANCHORS = { lobby: [[657, 548, 300]], chars: [[285, 470, 285]], victory: [[595, 447, 190], [374, 514, 160], [805, 514, 160]] };
  const bg = document.getElementById('bg'), bgImg = document.getElementById('bgImg'), bgFill = bg.querySelector('.bgfill');
  let cur = null;
  function open(id) {
    for (const k in PAGES) document.getElementById(k).classList.toggle('hide', k !== id);
    cur = id || null;
    if (cur) { const src = PAGES[cur][0]; if (bgImg.getAttribute('src') !== src) { bgImg.src = src; bgFill.style.backgroundImage = 'url(' + src + ')'; } }
    bg.classList.toggle('hide', !cur);
  }
  // point de l'image -> pixels écran
  function toScreen(page, x, y) {
    const st = stages[page].getBoundingClientRect(), [, W, H] = PAGES[page];
    return [st.left + x / W * st.width, st.top + y / H * st.height, st.height / H];
  }
  return { open, get cur() { return cur; }, put, PAGES, ANCHORS, toScreen, SLOTS };
})();
