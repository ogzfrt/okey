/* ============================================================
   OKEY ROGUELIKE — UI katmanı v4
   Ekranlar: menü → harita → oyun (+ modal / store / settings)
   Oyun mantığı engine.js'te, metinler i18n.js'te (T.*).
   Öğretici: gerçek, oynanabilir Stage 1 + bağlamsal ipuçları.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);

  const el = {};
  ['menuScreen','mapScreen','gameScreen','btnPlay','btnSettings',
   'btnCollection','btnQuit','menuLogo','btnTrainer',
   /* GRUP I (2026-09-07): harita Figma tuvaline taşındı — eski kenar
      çubuğunun kimlikleri (mapCoins/mapPermMult/mapJokers/btnMapMenu)
      tasarımda karşılığı olmadığı için KALDIRILDI. */
   'mapStage','mapRound','mapScoreVal','mapCoinVal','mapOkey','mapCards',
   'mapJokerSlots','mapDeckCount','mapDiscardSlot',
   'btnMapPause','btnMapInfo','mapMenuPop','btnMapGoMenu','btnMapSettings','btnMapSfx',
   'roundChip','coinChip','okeyChip','bossChip','turnIndicator','kahinChip',
   'scoreNow','scoreTarget','progressFill','permMult',
   'jokerSlots','slotCount','backupSlots','backupCount','btnTerazi','btnParatoner','btnRusvet','fatalityChip','borsaChip',
   'consumCount','consumRow',
   'openAreaHint','combosRow','previewBar','crimsonPeek',
   'meldArea','meldRow','stageVal','roundVal',
   'backupShoulder','totemShoulder','btnBackupToggle','btnTotemToggle',
   'rack','rackRow1','rackRow2','deckCount','discardSlot',
   'toast','overlay','modalTitle','modalBody','modalBtn','bossBanner',
   'storeOverlay','storeItems','storeCoins','storeDeckRow',
   'storeRowJokers','storeRowExtras','srJokersLbl','srExtrasLbl',
   'ssRound','ssPerm','storeSlotsRow','storeBackupRow','storeConsumRow',
   'ssSlotsCount','ssBackupCount','ssConsumCount',
   'btnReroll','btnStoreContinue',
   'upgradeOverlay','upOptions','upCoins','btnUpContinue',
   'collectionOverlay','colBody','btnColBack',
   'btnMenu','menuPop','btnGoMenu','btnPauseSettings','btnSfx','btnTutorial','btnRunInfo','coinVal',
   'btnAddCombo','btnConfirm','btnSkip','btnDiscard',
   'btnSortRank','btnSortSuit',
  ].forEach(id => el[id] = $(id));

  const t = (key, ...args) => T.t(key, ...args);
  /* PLAYTEST 22 — BU TABLO MOTORDAN KOPMUŞTU (bug).
     Elle yazılmış sabitlerdi ve Playtest 17 · Grup I'de Legendary 11→9,
     Mythic 17→15 olunca güncellenmedi: buton "Sat +11" yazıyor, kasaya 9
     coin giriyordu. Artık tek doğru kaynak motorun RARITY tablosudur ve
     Sigorta Poliçesi (satış = alış fiyatı) de yansıtılır. */
  /* PLAYTEST 25 · MADDE E10 — fiyat artık karta göre değişebiliyor
     (The World / Pinky 30 coinde kaldı, bkz. engine JOKER_PRICE_OVERRIDE).
     Bu yüzden satış fiyatı yalnız rarity'den okunamaz; motorun kendi
     hesabı kullanılır ki UI ile motor iki farklı sayı söylemesin. */
  const sellPrice = (rarity, key) => (Game.state?.sellFull
    ? Game.jokerPriceOf(key, rarity) : Game.jokerSellOf(key, rarity));

  /* ---------- Oyun kimliği (Grup D) ----------
     İsim henüz kesinleşmedi (Kısmet / Taşlık / Okeylike / Rakkam ...).
     Başlık tek yerden değişir; mascotLetter, logoda maskot görselinin
     OTURDUĞU harfin indeksidir (-1 = maskot slotu yok). */
  /* Oyun adı — Figma v3'te (node 74:3) başlık RASTER DEĞİL gerçek metin
     katmanı (94:2397 / 94:2398), o yüzden isim yine buradan sürülüyor:
     tek satır değiştirmek yeterli, Figma'dan yeniden export gerekmez. */
  const GAME_CONFIG = {
    title: 'OKEY',
    subtitle: 'ROGUELIKE',
  };

  /* Logo — Figma "OKEY-101 / yeni test" (node 74:3, 2026-08-10 sürümü):
     krem plaka (banner.svg, node 95:439) + içinde başlık kilidi.
     Kilit CSS flex ile plakaya YATAY ve DİKEY tam ortalanır (mutlak ofset
     yok) → plaka yeniden export edilse veya isim değişse bile ortalama
     bozulmaz.
     Maskot bu panonun parçası DEĞİL: tasarımda ayrı katman (94:2364),
     sahnede sağda duruyor ve index.html'den doğrudan yükleniyor.
     Kod tarafında maskot placeholder'ı YOK. */
  function renderLogo() {
    el.menuLogo.innerHTML =
      `<div class="fm-title">${pxAccents(GAME_CONFIG.title)}</div>` +
      `<div class="fm-subtitle">${pxAccents(GAME_CONFIG.subtitle)}</div>`;
  }

  /* PLAYTEST 20 · GRUP B/2 — AKSAN HACK'İ KALDIRILDI.
     Eskiden Pixel Operator SC'de ş/ğ/İ/Ğ/Ş glifleri YOKTU; bu fonksiyon
     taban harfin üstüne ayrı bir aksan glifi bindirerek harfi TAKLİT
     ediyordu (CSS .px-acc). Taklit yalnız menüde çalışıyordu — oyunun
     geri kalanındaki aynı harfler yedek fonta düşüp küçük ve kayık
     çıkıyordu (kullanıcı raporu 2026-08-30).
     Artık glifler fontun KENDİSİNE eklendi (tools/fonts/
     add_turkish_glyphs_all.py), yani hiçbir yerde taklide gerek yok.
     Fonksiyon duruyor ama yalnız HTML kaçışı yapıyor — çağrı yerlerini
     tek tek sökmek yerine tek noktadan etkisizleştirildi. */
  function pxAccents(str) {
    return String(str)
      .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  const setMenuLabel = (node, str) => { node.innerHTML = pxAccents(str); };

  /* Istaka ızgarası (2026-07-09): 2 satır × 15 sütun = 30 serbest hücre.
     MAX_HAND (21) sığar, boşluk bırakma özgürlüğü kalır. */
  const RACK_COLS = 15, RACK_CAP = 30, RACK_GAP = 12;

  /* PLAYTEST 20 · GRUP J — SERBEST ISTAKA (DENEYSEL, YALNIZ TRAINER).
     Ana oyun modu bu daldan HİÇ geçmez: `Game.trainerMode` kapalıyken
     `freeRack()` her zaman false döner, yani klasik 2×15 ızgara düzeni
     bit bit aynı kalır. Beğenilirse ileride ana moda taşınabilir. */
  const freeRack = () => !!(Game.trainerMode && Game.state
    && Game.state.trainerRack === 'free');

  /* Serbest düzende iki satırın taşları — `slot` sırasına göre sıkışık. */
  function freeRows() {
    const h = Game.state.hand || [];
    const r1 = h.filter(t => (t.slot ?? 0) < RACK_COLS).sort((a, b) => a.slot - b.slot);
    const r2 = h.filter(t => (t.slot ?? 0) >= RACK_COLS).sort((a, b) => a.slot - b.slot);
    return [r1, r2];
  }

  let selection = new Set();
  let newTileIds = new Set();
  // Grup J — son turda "Raundu Bitir" durumu (null ise normal discard)
  let finalSkip = null;
  let toastTimer = null;
  let dragging = false; // drag&drop sırasında tıklama seçimi bastırılır

  /* ---------- Otomatik ölçekleme ----------
     Oyun sabit 1240x900 tasarım tuvalinde yaşar; pencereye göre
     transform:scale ile sığdırılır → zoom/kaydırma asla gerekmez. */
  const DESIGN_W = 1240, DESIGN_H = 900;
  /* Ana menü Figma sahnesi (node 74:3) — 1920×1080 sabit tuval, COVER
     ölçekli. Ölçek CSS ile hesaplanamıyor (calc(100vw/1920) uzunluk verir,
     scale() sayı ister), o yüzden burada birimsiz sayı olarak yazılır. */
  const MENU_W = 1920, MENU_H = 1080;
  function fitMenuScale() {
    const k = Math.max(window.innerWidth / MENU_W, window.innerHeight / MENU_H);
    document.documentElement.style.setProperty('--fm-scale', String(k));
  }
  /* Oyun ekranı Figma sahnesi (2026-08-23) — 1920×1080 sabit tuval.
     Menüden farkı CONTAIN olması: oyun UI'ının hiçbir parçası kırpılamaz.
     `--ov-scale` = ESKİ 1240×900 tuvalinin ölçeği; store/güçlendirme/
     koleksiyon/modal sahneleri oyun ekranının üstünde açıldığında onu
     kullanır, böylece o sahnelerin görünümü hiç değişmez. */
  const GAME_W = 1920, GAME_H = 1080;
  function fitGameScale() {
    const k = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
    document.documentElement.style.setProperty('--gm-scale', String(k));
    const ov = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    document.documentElement.style.setProperty('--ov-scale', String(ov));
  }
  function fitScale() {
    fitMenuScale();
    fitGameScale();
    /* Oyun ekranı da tam ekran bir Figma sahnesi — tuval letterbox'ı
       burada da İSTENMEZ (CSS `body.game-open #app` tam viewport yapar). */
    if (document.body.classList.contains('game-open')) {
      $('app').style.transform = '';
      return;
    }
    /* Ana menü tam ekran bir Figma sahnesi (1920×1080, COVER ölçekli) —
       oyun tuvalinin letterbox'ı menüde İSTENMEZ, yoksa tasarım ortada
       küçük bir kutu gibi kalır. Menü açıkken tuval ölçeklemesi kapatılır;
       CSS `body.menu-open #app` kuralı #app'i tam viewport yapar. */
    if (document.body.classList.contains('menu-open')) {
      $('app').style.transform = '';
      return;
    }
    const k = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    const x = (window.innerWidth - DESIGN_W * k) / 2;
    const y = (window.innerHeight - DESIGN_H * k) / 2;
    $('app').style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }
  window.addEventListener('resize', fitScale);
  fitScale();

  /* ---------- Kayıt / devam (Grup D) ----------
     Kayıt yalnız GÜVENLİ noktalarda alınır: raund başı (harita) ve store.
     Raund ORTASINDA çıkılırsa son kayıt = o raundun başı → raund baştan.
     where: 'inRound' (raund oynanıyor) | 'between' (harita/store arası). */
  const SAVE_KEY = 'okeySave';
  function saveGame(where) {
    if (TUT.active || Game.tutorialMode || Game.trainerMode) return; // trainer: kayıt yok
    const s = Game.state;
    if (!s || s.status === 'lost' || s.status === 'runComplete') return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ where, data: Game.serialize() }));
    } catch (e) { /* depolama dolu vb. — kayıt sessizce atlanır */ }
  }
  function markInRound() {
    if (TUT.active || Game.tutorialMode || Game.trainerMode) return;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      obj.where = 'inRound';
      localStorage.setItem(SAVE_KEY, JSON.stringify(obj));
    } catch (e) { /* bozuk kayıt görmezden gelinir */ }
  }
  function loadSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function clearSave() { localStorage.removeItem(SAVE_KEY); }

  /* ---------- Ekran yönetimi ---------- */

  // Bu run'ın toplam stage sayısı gösterimi (Sonsuz Mod → ∞)
  const chCount = () => Game.totalStages() === Infinity ? '∞' : Game.totalStages();

  /* Kalıcı "TRAINER MODU" göstergesi (Grup H): trainer modunda TÜM
     ekranlarda üstte durur, oyuncu ana oyunla karıştırmasın.
     Viewport-fixed overlay DEĞİL (fitScale ölçeklemesi + tepedeki dolu
     header/harita barı yüzünden çakışıyordu, 2026-08-07) — her ekranın
     kendi üst yapısına AKIŞ İÇİ çip olarak eklenir; flex doğal yer açar. */
  function updateTrainerBadge() {
    document.querySelectorAll('.trainer-chip').forEach(e => e.remove());
    if (!Game.trainerMode) return;
    const mk = () => {
      const c = document.createElement('div');
      c.className = 'trainer-chip';
      c.textContent = t('trBadge');
      return c;
    };
    /* Oyun ekranı: Figma düzeninde sol istatistik sütununun akışına girer
       (eski `.brand` üst barı kalktı; orada konumsuz kalıp ıstakaya
       biniyordu). */
    /* Raund atlama düğmesi oyun ekranında DEĞİL, HARİTADA durur
       (kullanıcı kararı 2026-08-26): raundun içindeyken atlamak istenmiyor,
       atlama kararı raunda girmeden önce veriliyor. Bkz. renderMap(). */
    document.querySelector('#gameScreen .gm-left')?.appendChild(mk());
    // Store sahnesi başlık bloğu
    document.getElementById('storeSign')?.appendChild(mk());
    // Upgrade sahnesi başlığın üstüne
    const up = document.getElementById('upgradeScene');
    if (up) up.insertBefore(mk(), up.firstChild);
    // Harita: #trainerMapBar zaten "🧪 TRAINER" etiketi taşıyor (renderMap)
  }

  function showScreen(name) {
    el.menuScreen.classList.toggle('hidden', name !== 'menu');
    el.mapScreen.classList.toggle('hidden', name !== 'map');
    el.gameScreen.classList.toggle('hidden', name !== 'game');
    // Figma menü arka planı TÜM viewport'u kaplar (tuval letterbox'ı dahil):
    // menü açıkken gövde galaksi görselini alır, tuval şeffaflaşır
    document.body.classList.toggle('menu-open', name === 'menu');
    // Oyun ekranı da (2026-08-23 Figma düzeni) kendi 1920×1080 tuvalinde yaşar
    /* GRUP I: harita da oyun ekranıyla AYNI 1920×1080 Figma tuvalinde
       yaşıyor — `game-open` tuval kipidir, "oyun oynanıyor" demek değil. */
    document.body.classList.toggle('game-open', name === 'game' || name === 'map');
    fitScale(); // menüye girerken tuval letterbox'ı kalkar, çıkarken geri kurulur
    if (name === 'menu') fitMenuLabels(); // görünür olunca ölçülebilir
    if (name === 'map') { renderMap(); saveGame('between'); }
    if (name === 'game') render();
    updateTrainerBadge();
    if (TUT.active) TUT.update();
  }
  function curScreen() {
    if (!el.gameScreen.classList.contains('hidden')) return 'game';
    if (!el.mapScreen.classList.contains('hidden')) return 'map';
    return 'menu';
  }
  const storeOpen = () => !el.storeOverlay.classList.contains('hidden');
  const upgradeOpen = () => !el.upgradeOverlay.classList.contains('hidden');

  /* Sahne geçişi (Grup B): net bir ekran değişimi hissi — fade + kayma */
  function openScene(ov) {
    ov.classList.remove('hidden', 'scene-in');
    void ov.offsetWidth; // animasyonu yeniden tetikle
    ov.classList.add('scene-in');
  }

  /* Store'u aç (Grup B/C): tam ekran sahne + 'inStore' kaydı */
  function openStore() {
    renderStore();
    openScene(el.storeOverlay);
    updateTrainerBadge(); // trainer çipi store sahnesinde de görünsün
    saveGame('inStore');
    if (TUT.active) TUT.update();
  }

  /* ---------- Yardımcılar ---------- */

  /* Para birimi ikonu — CSS ile çizilen sikke */
  const COIN = '<span class="coin-ico" aria-label="coin"></span>';

  function toast(msg, good = false) {
    el.toast.textContent = T.ev(msg);
    el.toast.className = good ? 'good' : '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 3400);
  }

  /* Bildirim yığını — satır satır kartlar.
     PLAYTEST 17 · GRUP A/3 (kullanıcı kararı 2026-08-28): kartlar eski
     UI'dan kalma sağ-üst köşede ve 5.2 sn'de siliniyordu; Kahin kehaneti
     gibi KARAR VERDİREN bildirimler okunmadan kayboluyordu. Artık:
       · ekranın ÜST-ORTASINDA, Figma boundary box diliyle çizilirler,
       · 14 sn durur (eskisinin ~3 katı),
       · TIKLANINCA hemen kapanırlar (kart üstünde imleç de değişir).
     Kalıcılık gerektiren bildirimler `hold: true` ile hiç zaman aşımına
     uğramaz, yalnız tıklamayla kapanır.
     SÜRE AYARI (kullanıcı geri bildirimi, aynı gün): önce 5.2 sn'den
     14 sn'ye çıkarılmıştı; o kadar uzun kalınca kartlar "paso" ekranda
     duruyor gibi hissettiriyordu. 7 sn iki satırlık bir kartı rahat
     okutur ama kalıcı durmaz — okuyamadan kaçırma riski zaten tıklamayla
     kapatma ve daha görünür konumla ortadan kalktı.
     Yığın da 8 yerine en fazla 4 kart tutar: üst üste binen bildirim
     duvarı oluşmaz, en eskisi düşer. */
  const NOTE_TTL = 7000;
  const NOTE_MAX = 3;

  /* PLAYTEST 17 (kullanıcı geri bildirimi 2026-08-28) — BİLDİRİM GÜRÜLTÜSÜ.
     Raund başında altı kart birden yığılıp ekranın üçte birini kaplıyordu.
     Kök neden: motorun ürettiği HER olay satırı bir kart açıyordu; oysa
     bu satırların bir kısmı EKRANDA ZATEN GÖRÜNEN bir şeyi tekrar
     söylüyor. Aşağıdaki desenler karta değil, tek satırlık toast'a düşer:
     bilgi kaybolmaz ama arayüzü kaplamaz.
       · Paketten çıkan içerik  → paket çarkı ve store kartı zaten gösteriyor
       · "yeni okey ilan edildi" → stage açılış banner'ı + kalıcı OKEY kutusu
       · "ıstakan büyüdü"        → ıstakada anında görülüyor
       · "X eline geldi — aktif" → jokerin kendi kartında görünüyor
     Karar veren / kısıt getiren bildirimler (boss koşulları, kehanet,
     dikilen taşlar, cezalar, süresi dolan jokerler) KART olarak kalır. */
  const NOTE_QUIET = [
    /^Stage \d+ — yeni okey ilan edildi/,
    /^🖐️? Istakan büyüdü/,
    /^◈ .+ eline geldi — aktif!$/,
  ];
  const isQuiet = (line) => NOTE_QUIET.some(re => re.test(line));
  function dismissNote(n) {
    if (!n || n.classList.contains('out')) return;
    n.classList.add('out');
    setTimeout(() => n.remove(), 400);
  }
  function notify(lines, good = true, opts) {
    let wrap = document.getElementById('noteStack');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'noteStack';
    }
    /* PLAYTEST 17 (kullanıcı bildirimi 2026-08-28) — YIĞIN TUVALİN İÇİNDE.
       Kartlar `position: fixed` ile EKRAN pikselinde duruyordu; oyun sahnesi
       ise 1920×1080'lik tuvali `--gm-scale` ile ölçekliyor. Tuval küçüldükçe
       (dar pencere) kartlar ölçeklenmediği için göreli olarak büyüyor ve
       sağ üstteki TUR sayacının (x=1332) üstüne biniyordu.
       Çözüm: yığın oyun ekranındayken sahnenin ÇOCUĞU olur, yani tuval
       koordinatlarında yaşar ve her şeyle birlikte ölçeklenir. Genişlik
       700px ile sınırlı: tuval ortasından (960) en fazla 350px yayılır,
       yani solda duraklat/bilgi düğmelerine (…240) ve sağda TUR sayacına
       (1332…) hiçbir pencere boyunda değemez. */
    const stage = document.querySelector('#gameScreen .gm-stage');
    const host = (stage && document.body.classList.contains('game-open')) ? stage : document.body;
    if (wrap.parentElement !== host) host.appendChild(wrap);   // kartlar korunur
    let quiet = null;
    for (const line of [].concat(lines)) {
      if (!line) continue;
      /* Gürültü satırları karta değil toast'a: `opts.quiet` çağrı yerinden
         gelir (UI'ın kendi ürettiği, dile göre değişen metinler için),
         `isQuiet` ise motorun sabit Türkçe satırlarını yakalar. */
      if (opts?.quiet || isQuiet(line)) { quiet = line; continue; }
      const n = document.createElement('div');
      n.className = 'note-card' + (good ? ' good' : '') + (opts?.hold ? ' hold' : '');
      n.textContent = T.ev(line);
      n.title = t('noteDismiss');
      n.addEventListener('click', () => dismissNote(n));
      wrap.appendChild(n);
      if (!opts?.hold) setTimeout(() => dismissNote(n), opts?.ttl || NOTE_TTL);
    }
    while (wrap.children.length > NOTE_MAX) wrap.firstChild.remove();
    if (quiet) toast(quiet, good);
  }

  /* ---------- Deste / Atılan yığını pop-up'ı ---------- */
  function showPilePopup(kind) {
    const s = Game.state;
    const old = document.getElementById('pilePopup');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'pilePopup';
    const box = document.createElement('div');
    box.className = 'pp-box';
    if (kind === 'deck') {
      // Tüm deste görünür: renge göre gruplu, sayıya göre sıralı — çekiliş
      // SIRASI gizli kalır (gruplama draw-order bilgisi sızdırmaz).
      box.innerHTML = `<h3>${t('deckPopupTitle', s.deck.length)}</h3><p>${t('deckPopupSub')}</p>`;
      if (!s.deck.length) {
        const row = document.createElement('div');
        row.className = 'pp-tiles';
        row.innerHTML = `<span class="pp-empty">${t('deckPopupEmpty')}</span>`;
        box.appendChild(row);
      } else {
        const groups = COLORS.map(c => ({
          label: T.color(c),
          tiles: s.deck.filter(t2 => !t2.jokerTile && t2.color === c)
            .sort((a, b) => a.number - b.number),
        }));
        const jokerTiles = s.deck.filter(t2 => t2.jokerTile);
        if (jokerTiles.length) groups.push({ label: t('deckJokersTitle'), tiles: jokerTiles });
        for (const g of groups) {
          if (!g.tiles.length) continue;
          const lbl = document.createElement('div');
          lbl.className = 'pp-group-label';
          lbl.textContent = `${g.label} · ${g.tiles.length}`;
          box.appendChild(lbl);
          const row = document.createElement('div');
          row.className = 'pp-tiles';
          g.tiles.forEach(t2 => row.appendChild(tileEl(t2, false)));
          box.appendChild(row);
        }
      }
    } else {
      box.innerHTML = `<h3>${t('discardPopupTitle', s.discardPile.length)}</h3><p>${t('discardPopupSub')}</p>`;
      const row = document.createElement('div');
      row.className = 'pp-tiles';
      if (s.discardPile.length) s.discardPile.forEach(t2 => row.appendChild(tileEl(t2, false)));
      else row.innerHTML = `<span class="pp-empty">${t('discardPopupEmpty')}</span>`;
      box.appendChild(row);
    }
    const close = document.createElement('button');
    close.className = 'btn ghost';
    close.textContent = t('close');
    close.addEventListener('click', () => ov.remove());
    box.appendChild(close);
    ov.appendChild(box);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  /* PLAYTEST 18 · GRUP D — TEPSİLER İLE HESAPLAMA KUTUSU ARASINDAKİ BOŞLUK.
     CSS bu boşluğu isimli bir sabitle (`--gm-tray-gap`) garantiler; tepsi
     alanı alt kenarından sabitlenip yukarı büyüdüğü için kombinasyon sayısı
     (1…7) boşluğu değiştirmez. Bu fonksiyon o garantinin NÖBETÇİSİDİR:
     Dedikodu Masası kutusu, `dense` modu ya da bir dil değişikliği tepsiyi
     beklenenden yüksek yaparsa gerçek dikdörtgenleri ölçer ve hesaplama
     kutusunu tam gereken kadar AŞAĞI iter — asla aksiyon barının üstüne
     binmeyecek şekilde sınırlanır. Sapma yoksa hiçbir şeye dokunmaz. */
  function keepPreviewClear() {
    const row = el.combosRow, pv = el.previewBar;
    if (!row || !pv || pv.classList.contains('hidden')) return;
    const css = getComputedStyle(document.documentElement);
    const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
    const gap = num(css.getPropertyValue('--gm-tray-gap'), 18);
    const base = num(css.getPropertyValue('--gm-preview-bottom'), 474);
    /* Ölçmeden ÖNCE önceki itmeyi geri al: yoksa kutu bir kez aşağı
       itildiğinde ölçüm "boşluk yeterli" der ve her render'da yukarı-aşağı
       zıplar. Sıfırlanmış hâlde ölçüp tek seferde doğru yeri buluruz. */
    pv.style.bottom = base + 'px';
    const r1 = row.getBoundingClientRect(), r2 = pv.getBoundingClientRect();
    // ölçüm EKRAN pikselinde (tuval `scale()` ile küçültülür) → farkı
    // tuval birimine çevirmek için ölçeğe bölünür
    const scale = (r1.width / (row.offsetWidth || 1)) || 1;
    const short = (r1.bottom - r2.top) / scale + gap;
    if (short <= 0) return;                       // boşluk zaten yeterli
    // aksiyon barına (y = 618) çarpmadan inebileceği en fazla mesafe
    const push = Math.min(short, Math.max(0, base - 462));
    pv.style.bottom = (base - push) + 'px';
  }

  function scoreFly(text) {
    const fly = document.createElement('div');
    fly.className = 'score-fly';
    fly.textContent = text;
    const rect = el.combosRow.getBoundingClientRect();
    fly.style.left = Math.max(60, rect.left + rect.width / 2 - 40) + 'px';
    fly.style.top = rect.top - 20 + 'px';
    document.body.appendChild(fly);
    setTimeout(() => fly.remove(), 1100);
  }

  /* ---------- SAHNE DIŞINA TAŞINAN TAŞ KOPYALARI ----------
     PLAYTEST 20 · GRUP G — DISCARD ANİMASYONUNDA SAYI YAZISI KAYIYORDU.

     BELİRTİ: taş atılırken uçan kopyanın üstündeki sayı yukarı kayıyor,
     büyüyor ve taşın çerçevesinden taşıyordu (aynı hata sürükleme
     hayaletinde de vardı). Ölçüm (1280×720, --gm-scale 0.667): ıstakadaki
     taşta yazının mürekkebi 74px kutuda y=8..67 iken kopyada 70px kutuda
     y=0..66 — yani kutunun tepesine dayanıyordu.

     KÖK NEDEN — ölçek kaybı: oyun ekranı 1920×1080'lik SABİT bir tuvaldir
     ve `.gm-stage` üstünde `transform: scale(--gm-scale)` ile küçültülür.
     Kopya animasyon için `document.body`'ye taşınınca bu dönüşümün DIŞINA
     çıkar. Kutusu `getBoundingClientRect()` ile EKRAN pikselinden (54×73)
     kuruluyordu; oysa taşın İÇİNDEKİ katmanlar px cinsindendir ve TASARIM
     ölçüsünde kalır (sayı `calc(var(--tw) * .445)` = 36px). Sonuç: 54px
     genişliğinde bir kutunun içine 36px yazı — %50 büyük, dolayısıyla
     `top: 11%` konumundan taşarak yukarı kaçmış görünüyor. Arka plan ve
     elmas yüzdeyle ölçüldüğü için onlar doğru kalıyordu; gözle "yazı
     katmanı geride kaldı" izlenimi tam olarak buradan geliyordu.

     ÇÖZÜM: kopyanın kutusu TASARIM ölçüsünde (offsetWidth/Height) kurulur
     ve kaybedilen ölçek `transform: scale(k)` olarak geri verilir. Böylece
     çerçeve, sayı, elmas ve rozetler TEK BİR BİRİM olarak birlikte küçülür.
     `k` sabit bir değişkenden değil taşın kendisinden (ekran/düzen oranı)
     okunur — hangi sahnede olursa olsun doğrudur.
     `transform-origin: 0 0` şart: ölçek sol-üst köşeden uygulanmazsa kutu
     kendi merkezine göre büzülür ve konum kayar. */
  function stageClone(src, cls) {
    const r = src.getBoundingClientRect();
    const k = src.offsetWidth ? r.width / src.offsetWidth : 1;
    const clone = src.cloneNode(true);
    clone.classList.remove('selected', 'new', 'drag-src');
    clone.classList.add(cls);
    Object.assign(clone.style, {
      width: src.offsetWidth + 'px',
      height: src.offsetHeight + 'px',
    });
    return { clone, k, r };
  }

  function flyTileToDiscard(tileId) {
    const src = el.rack.querySelector(`[data-id="${tileId}"]`);
    if (!src) return;
    const dst = el.discardSlot.getBoundingClientRect();
    const { clone, k, r } = stageClone(src, 'fly-clone');
    Object.assign(clone.style, {
      left: r.left + 'px', top: r.top + 'px',
      transform: `scale(${k})`,
    });
    document.body.appendChild(clone);
    void clone.offsetWidth;          // başlangıç hâli uygulansın, geçiş oradan başlasın
    requestAnimationFrame(() => {
      /* Hedef: küçülmüş taş atılanlar yuvasının TAM ORTASINA otursun.
         Ötelemeler ekran pikselindedir (kopyanın ebeveyni body, ölçeksiz). */
      const dx = dst.left + (dst.width - r.width * .88) / 2 - r.left;
      const dy = dst.top + (dst.height - r.height * .88) / 2 - r.top;
      clone.style.transform =
        `translate(${dx}px, ${dy}px) scale(${k * .88}) rotate(6deg)`;
      clone.style.opacity = '.9';
    });
    setTimeout(() => clone.remove(), 480);
  }

  /* ---------- Sürükle & bırak — SERBEST HÜCRE (2026-07-09) ----------
     Taş, 2×15 ızgaranın istenen HÜCRESİNE bırakılır (boş → oraya konur,
     dolu → iki taş yer değiştirir). İşaretçi hedef hücreyi çerçeveler. */
  /* GRUP J (P20) — SERBEST DÜZENDE BIRAKMA YERİ.
     Klasik düzende hedef bir HÜCREDİR; burada hedef iki taşın ARASIDIR.
     Eşik kuralı: işaretçi bir taşın orta çizgisini geçtiğinde sıra o
     taşın öbür yanına kayar — "ray üzerinde kaydırma" hissi budur.
     Dönen değer {row, index}; işaretçi de araya ince bir çizgi çizer. */
  function computeFreeDrop(x, y, marker, dragId) {
    const r1 = el.rackRow1.getBoundingClientRect();
    const r2 = el.rackRow2.getBoundingClientRect();
    const useRow2 = Math.abs(y - (r2.top + r2.height / 2)) < Math.abs(y - (r1.top + r1.height / 2));
    const row = useRow2 ? el.rackRow2 : el.rackRow1;
    const rect = useRow2 ? r2 : r1;
    const tiles = [...row.children].filter(c => c.dataset.id !== String(dragId));
    let index = tiles.length;
    for (let i = 0; i < tiles.length; i++) {
      const cr = tiles[i].getBoundingClientRect();
      if (x < cr.left + cr.width / 2) { index = i; break; }
    }
    // işaretçi: eklenecek yerin tam önündeki ince dikey çizgi
    const h = tiles.length ? tiles[0].getBoundingClientRect().height : 90;
    const top = tiles.length ? tiles[0].getBoundingClientRect().top : rect.top + 10;
    let left;
    if (!tiles.length) left = rect.left + 28;
    else if (index >= tiles.length) {
      const cr = tiles[tiles.length - 1].getBoundingClientRect();
      left = cr.right + RACK_GAP / 2;
    } else {
      left = tiles[index].getBoundingClientRect().left - RACK_GAP / 2;
    }
    Object.assign(marker.style, {
      left: (left - 2) + 'px', top: top + 'px', width: '4px', height: h + 'px',
    });
    return { row: useRow2 ? 2 : 1, index };
  }

  /* Serbest düzende bırakma: iki satırın id listesi yeniden kurulur ve
     motora yazılır (Game.setRackOrder). */
  function applyFreeDrop(tileId, drop) {
    const [r1, r2] = freeRows();
    const ids1 = r1.map(t => t.id).filter(id => id !== tileId);
    const ids2 = r2.map(t => t.id).filter(id => id !== tileId);
    const target = drop.row === 2 ? ids2 : ids1;
    target.splice(Math.max(0, Math.min(target.length, drop.index)), 0, tileId);
    Game.setRackOrder(ids1, ids2);
  }

  function computeDropSlot(x, y, marker) {
    const r1 = el.rackRow1.getBoundingClientRect();
    const r2 = el.rackRow2.getBoundingClientRect();
    const useRow2 = Math.abs(y - (r2.top + r2.height / 2)) < Math.abs(y - (r1.top + r1.height / 2));
    const row = useRow2 ? el.rackRow2 : el.rackRow1;
    const cells = [...row.children];
    if (!cells.length) return -1;
    let col = 0, best = Infinity;
    cells.forEach((c, i) => {
      const cr = c.getBoundingClientRect();
      const d = Math.abs(x - (cr.left + cr.width / 2));
      if (d < best) { best = d; col = i; }
    });
    const cr = cells[col].getBoundingClientRect();
    Object.assign(marker.style, {
      left: cr.left + 'px',
      top: cr.top + 'px',
      width: cr.width + 'px',
      height: cr.height + 'px',
    });
    return (useRow2 ? RACK_COLS : 0) + col;
  }

  function enableDrag(d, tile) {
    d.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (Game.state.status !== 'playing') return;
      const start = { x: e.clientX, y: e.clientY };
      let started = false, ghost = null, marker = null, targetIdx = -1, ghostK = 1;
      const srcRect = d.getBoundingClientRect();
      const move = (ev) => {
        if (!started) {
          if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 7) return;
          started = true;
          dragging = true;
          hideTip();
          /* Hayalet de sahnenin dışına çıkar → aynı ölçek kaybı (bkz.
             stageClone yorumu). Kutusu tasarım ölçüsünde kurulur, ölçek
             ve tasarımdaki hafif "kaldırma" eğimi transform'da birleşir. */
          const g = stageClone(d, 'drag-ghost');
          ghost = g.clone;
          ghostK = g.k;
          document.body.appendChild(ghost);
          d.classList.add('drag-src');
          marker = document.createElement('div');
          // GRUP J (P20): serbest düzende işaretçi hücre değil ARA ÇİZGİSİDİR
          marker.className = freeRack() ? 'drop-gap' : 'drop-cell';
          document.body.appendChild(marker);
        }
        ghost.style.left = (ev.clientX - srcRect.width / 2) + 'px';
        ghost.style.top = (ev.clientY - srcRect.height / 2) + 'px';
        ghost.style.transform = `scale(${ghostK * 1.06}) rotate(2deg)`;
        targetIdx = freeRack()
          ? computeFreeDrop(ev.clientX, ev.clientY, marker, tile.id)
          : computeDropSlot(ev.clientX, ev.clientY, marker);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (ghost) ghost.remove();
        if (marker) marker.remove();
        d.classList.remove('drag-src');
        if (started) {
          setTimeout(() => { dragging = false; }, 0);
          if (freeRack()) {
            if (targetIdx && typeof targetIdx === 'object') {
              applyFreeDrop(tile.id, targetIdx);   // GRUP J (P20)
              render();
            }
          } else if (targetIdx >= 0) {
            Game.moveTile(tile.id, targetIdx); // hedef hücreye koy / takas et
            render();
          }
        }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  /* Grup E — kombinasyon içindeki taşı, okeyse YERİNE GEÇTİĞİ değerle çiz.
     values: resolveCombo'nun Map(id→değer)'i. Okey kendi sayısını değil
     temsil ettiği sayıyı gösterir; ⟡ işareti "bu bir okey" der. */
  /* Kombinasyon içindeki taş. Okey ise (PLAYTEST 9 · GRUP C) yalnız sayısı
     değil YÜZÜ de yerine geçtiği taşa döner: sayı + RENK. Böylece oyuncu
     "Mavi 13'ün yerinde duruyor" bilgisini bakar bakmaz görür.
     Okey olduğu kaybolmasın diye ★/parıltı yerine sakin bir altın çerçeve +
     alt kenarda küçük "okey" rozeti kalır.
     Per'de renk BİLİNÇLİ olarak değişmez: per'de okey belirli bir rengi
     temsil etmez, "eksik 4. renk" gibi davranır (bkz. Grup D — bu yüzden
     per'de okey geri alma da yok). Orada yalnız sayı gösterilir.
     combo: {type, tiles, values} — okeyin neyin yerine geçtiğini çözmek
     için tüm kombinasyon gerekir, tek başına values yetmez. */
  function comboTileEl(tile, combo) {
    const values = combo?.values;
    const d = tileEl(tile, false);
    const v = values?.get?.(tile.id);
    if (v == null || tile.jokerTile || !Game.isOkeyTile(tile)) return d;
    const face = Game.okeyFace ? Game.okeyFace(combo, tile) : null;
    const num = d.querySelector('.num');
    if (num) num.textContent = v;
    d.classList.add('okey-standin');
    if (face && face.color && face.color !== tile.color) {
      d.classList.remove(tile.color);
      d.classList.add(face.color);
      d.title = t('okeyStandInFull', T.color(face.color), face.number);
    } else {
      d.classList.add('okey-standin-any');   // per: renk belirsiz
      d.title = t('okeyStandIn', tile.number, v);
    }
    const badge = document.createElement('div');
    badge.className = 'okey-badge';
    badge.textContent = 'okey';
    d.appendChild(badge);
    return d;
  }

  /* PLAYTEST 14 · GRUP C — taş üstü sürekli efekt işareti.
     Taşın dikdörtgen konturuna oturan ince çerçeve + kontur boyunca dönen
     tek bir ışık. Efektin taşın dışına taşmaması istendiği için eski
     `box-shadow` glow'u bırakıldı; bu eleman `inset` gölge kullanır.
     `kind`: 'hipno' | 'bungie' (renkleri CSS'te). */
  function fxOrbit(kind) {
    const w = document.createElement('span');
    w.className = 'tile-fx fx-' + kind;
    w.setAttribute('aria-hidden', 'true');
    w.appendChild(document.createElement('i'));
    return w;
  }

  function tileEl(tile, interactive = true) {
    const d = document.createElement('div');
    // Deste jokeri taşı (GDD 10) — sayı yok, epic kimlik + isim
    if (tile.jokerTile) {
      const def = JOKER_DEFS[tile.jokerTile];
      /* DESTE JOKERİ TAŞI DA KENDİ ÇİZİMİNİ GÖSTERİR (kullanıcı isteği
         2026-09-10). Slot kartı düzeltildikten sonra bu yol geride
         kalmıştı: deste jokeri ıstakada TAŞ olarak çizilir ve burası
         ayrı bir şablondur — emoji + ad basıyordu. Çizim varsa taşın
         TAMAMINI kaplar (varlık zaten kendi çerçevesini taşır, tıpkı
         özel taşlarda olduğu gibi), ad yazılmaz; kimlik çizimde, ad ve
         açıklama ipucunda. Çizimi olmayan deste jokeri emoji + ad
         düzeninde kalır. */
      const djArt = JOKER_ART.has(tile.jokerTile);
      d.className = 'tile deck-joker' + (djArt ? ' has-art jk-' + tile.jokerTile : '');
      d.dataset.id = tile.id;
      d.innerHTML = djArt
        ? '<div class="dj-art"></div>'
        : `<div class="dj-icon">${def?.icon || '◈'}</div><div class="dj-name">${T.name({ key: tile.jokerTile, name: tile.jname })}</div>`;
      if (interactive) {
        if (selection.has(tile.id)) d.classList.add('selected');
        if (newTileIds.has(tile.id)) d.classList.add('new');
        d.addEventListener('click', () => onTileClick(tile.id));
        enableDrag(d, tile);
      }
      const j = Game.state.deckJokers.find(x => x.key === tile.jokerTile);
      /* PLAYTEST 19 · GRUP G — THE CHEATING RİSK GÖSTERGESİ.
         Motor `j.risk`i her tur büyütüyordu ama HİÇBİR YERDE çizilmiyordu:
         oyuncu ne kadar tehlikede olduğunu göremediği için jokerin tek
         kararını ("bir tur pas geçip riski sıfırlayayım mı?") veremiyordu.
         Rozet üç kademede renk değiştirir — %25 altı sakin, %50 altı uyarı,
         üstü tehlike — ki tehlike bir sayı okumadan da anlaşılsın. */
      if (j && j.key === 'cheating') {
        const pct = Math.round((j.risk || 0) * 100);
        const b = document.createElement('div');
        b.className = 'dj-risk' + (pct >= 50 ? ' hot' : pct >= 25 ? ' warm' : '');
        b.textContent = t('cheatRiskBadge', pct);
        b.title = t('cheatRiskTip', pct);
        d.appendChild(b);
      }
      if (j) attachTip(d, j, {});
      return d;
    }
    // Sahte okey (klasik 101) — okeyin NORMAL kopyası, joker değil
    if (tile.fakeOkey) {
      d.className = `tile ${tile.color} fake-okey`;
      d.dataset.id = tile.id;
      /* Figma taş şablonunun krem yüzünde mühür için bir DELİK var; sahte
         okeyde de `.dot` çizilmeli, yoksa delikten zemin görünür.
         PLAYTEST 14 · GRUP D — "FAKE"/"SAHTE" YAZISI KALDIRILDI: tasarımda
         bu taşın üstünde METİN YOKTUR, kimliği yalnız sembolde (mor kontur
         + içi boş mühür) durur. Açıklama tooltip'te kalmaya devam eder. */
      d.innerHTML = `<div class="num">${tile.number}</div><div class="dot"></div>`;
      attachTip(d, { name: t('fakeOkeyName'), rarityText: t('fakeOkeyTag'),
        desc: t('fakeOkeyDesc', okeyLabel()) }, {});
      if (interactive) {
        if (selection.has(tile.id)) d.classList.add('selected');
        if (newTileIds.has(tile.id)) d.classList.add('new');
        d.addEventListener('click', () => onTileClick(tile.id));
        enableDrag(d, tile);
      }
      return d;
    }
    d.className = `tile ${tile.color}`;
    if (Game.isOkeyTile(tile)) d.classList.add('okey');
    if (tile.apple) d.classList.add('apple-tile');        // P31 · Grup I — Yasak Elma
    if (tile.pinkyOkey) d.classList.add('pinky-okey');    // P31 · Grup C — Pinky Warrior
    if (tile.special) d.classList.add('sp-' + tile.special);
    if (tile.stoned) d.classList.add('stoned');
    if (tile.bungie) d.classList.add('bungie-back');   // Grup Q: sakızdan geri dönen taş
    // P29 · Grup B — Hayalet jokerinin bir turluk taşı
    if (tile.ghost) d.classList.add('ghost-tile');
    // P29 · Grup F — Paratoner'ın bu turki yem taşı
    if (Game.state && Game.state.paratonerBait === tile.id) d.classList.add('bait-tile');
    d.dataset.id = tile.id;
    d.innerHTML = `<div class="num">${tile.number}</div><div class="dot"></div>`;
    /* PLAYTEST 14 · GRUP C — sürekli efekt veren jokerlerin (Hipnotizör,
       Bungie Gum) işareti: taşın KENDİ dikdörtgen konturuna oturan bir
       çerçeve + o çerçeve boyunca dönen bir ışık. Eski dışa taşan glow
       kaldırıldı; çerçeve `.tile-fx`, dönen ışık içindeki `<i>`. */
    if (tile.bungie) d.appendChild(fxOrbit('bungie'));
    if (tile.ghost) d.appendChild(fxOrbit('ghost'));
    if (Game.state && Game.state.paratonerBait === tile.id) d.appendChild(fxOrbit('bait'));
    /* Grup A1 — Freedom Fighters işaretli taşı ANINDA tanınabilir yap:
       kokarda ikonu + altın kenarlık + parıltı. Bonusu ödenmişse sönük. */
    const ff = Game.freedomMark ? Game.freedomMark(tile) : null;
    if (ff) {
      d.classList.add('ff-mark');
      if (ff.paid) d.classList.add('ff-paid');
      const b = document.createElement('span');
      b.className = 'tile-mark ff';
      b.textContent = '⚔';
      d.appendChild(b);
      attachTip(d, { name: t('ffMarkName'), rarityText: t('ffMarkTag'),
        desc: ff.paid ? t('ffMarkPaid') : t('ffMarkDesc', ff.value) }, {});
    }
    /* Grup F — boss koşullarının taş üstü işaretleri. Gizli olması gerekenler
       (Uzaylı'nın hiddenAlien'ı, GLITCH'in hangi taşın bozuk olduğu)
       bilerek gösterilmez; yalnız oyuncunun görmesi gereken durum işaretlenir. */
    /* PLAYTEST 10 · GRUP A (bug) — ZOMBIE JOKERİNİN ENFEKTE TAŞI GÖRÜNMÜYORDU.
       Kök neden: bu listede yalnız boss varyantının bayrağı (bossInfected)
       vardı; jokerin `infected` bayrağı hiç kontrol edilmiyordu. Motor taşı
       düzgün enfekte ediyor, +2.0x'i de veriyordu ama oyuncu ıstakada hangi
       taşın enfekte olduğunu GÖREMEDİĞİ için joker tamamen işlevsiz
       görünüyordu. Ödül tarafı ayrı bir yeşil rozetle işaretlenir. */
    /* PLAYTEST 18 · GRUP A (bug) — TERZİ'NİN İĞNESİ GÖRÜNMÜYORDU.
       Bu listede yalnız BOSS varyantının bayrağı (bossSewn) vardı; JOKER
       varyantının diktiği taşlar (`sewn`) hiç işaretlenmiyordu. Motor taşı
       diker, discard'ı engeller, açılımda +0.6x verirdi — ama oyuncu hangi
       taşın dikili olduğunu göremediği için joker tamamen işlevsiz
       görünüyordu (Zombie'nin Playtest 10'daki hikâyesinin aynısı). */
    const bossMark = tile.bossSewn ? { c: 'bsewn', i: '🪡', k: 'bossSewn' }
      : tile.sewn ? { c: 'jsewn', i: '🪡', k: 'sewnTile' }   // JOKER dikişi (ödül)
      : tile.bossInfected ? { c: 'binf', i: '🧟', k: 'bossInfected' }
      : tile.infected ? { c: 'zinf', i: '🧟', k: 'zombieTile' }   // JOKER enfeksiyonu (ödül)
      : tile.glitch ? (tile.glitchGift
          ? { c: 'bglitchgift', i: '🌀', k: 'jokerGlitch' }   // Grup N: JOKER glitch'i (ödül)
          : { c: 'bglitch', i: '⚠', k: 'bossGlitch' })       // Grup N: BOSS glitch'i (ceza)
      : tile.ffMarkedTile ? { c: 'bff', i: '⚔', k: 'bossFf' } : null;
    if (bossMark) {
      d.classList.add('bm-' + bossMark.c);
      if (bossMark.c === 'bff' && tile.ffUsedInMeld) d.classList.add('bm-done');
      const b = document.createElement('span');
      b.className = 'tile-mark boss';
      b.textContent = bossMark.i;
      d.appendChild(b);
      attachTip(d, { name: t(bossMark.k + 'Name'), rarityText: t('bossMarkTag'),
        desc: t(bossMark.k + 'Desc') }, {});
    }
    /* Grup A7 — joker/tüketilebilir kaynaklı taşlar asıl desteden ayrı bir
       TÜR: rozetle işaretlenir ki "3 tane aynı taş" karışıklığı olmasın. */
    /* Dr. Frankenstein'ın ürettiği taşlar (dirilen / dikilmiş) da bu
       ailede işaretlenir: oyuncu
       "bunu joker yarattı, açılımda ekstra veriyor" bilgisini taşın
       üstünde görmeli — eski Frankenstein'ın işlevsiz görünmesinin
       sebeplerinden biri tam olarak buydu. */
    /* PLAYTEST 20 · GRUP G — ÇALINTI TAŞ GÖRÜNÜR.
       The Cheating'in desteden aşırdığı taş `stolen` bayrağı taşır; oyuncu
       hangi taşların jokerden geldiğini bilmeli, çünkü joker yakalanınca
       o taşların HEPSİ elinden alınıp desteye döner. */
    const srcMark = tile.stolen ? { c: 'stolen', i: '🕶', k: 'stolenTile' }
      : tile.alien ? { c: 'alien', i: '👽', k: 'alienTile' }
      : tile.copied ? { c: 'copied', i: '⧉', k: 'copiedTile' }
      : tile.plague ? { c: 'plague', i: '🦠', k: 'plagueTile' }
      : tile.gift ? { c: 'gift', i: '🎁', k: 'giftTile' }
      : tile.revived ? { c: 'revived', i: '⚡', k: 'revivedTile' }
      : tile.stitched ? { c: 'stitched', i: '🧬', k: 'stitchedTile' }
      : tile.modded ? { c: 'modded', i: '✎', k: 'moddedTile' }
      /* PLAYTEST 18 · GRUP B — DEĞERİ SONRADAN DEĞİŞEN TAŞ ARTIK GÖRÜNÜR.
         Kullanıcı raporu: "elime 3 tane Mavi 13 geldi, hiçbir kopya jokeri
         yoktu". Motor tarafında bu MEŞRUYDU — Adem ile Havva (+2), Kağıt
         Jokeri (en düşük 3 taş → 13), Robin Hood (uçurumun iki ucu → 13),
         Kara Kedi ve Sir.by taşın DEĞERİNİ değiştirir, taş da artık
         dağıtıldığı kimliği temsil etmediği için "2 kopya" sınırının
         dışındadır (bkz. IS_BASE_TILE). Ama bu taşların ıstakada HİÇBİR
         işareti yoktu: oyuncu üç özdeş Mavi 13 görüyor ve deste bozulmuş
         sanıyordu. Artık 🔁 rozeti taşır ve tooltip hangi jokerin yaptığını
         yazar. Daha özel bir köken rozeti varsa (gift/stitched/modded…) o
         kazanır — bu yalnızca "başka türlü işaretsiz kalan" dönüşümlerdir. */
      : tile.retuned ? { c: 'retuned', i: '🔁', k: 'retunedTile' } : null;
    if (srcMark) {
      d.classList.add('src-' + srcMark.c);
      const b = document.createElement('span');
      b.className = 'tile-mark src';
      b.textContent = srcMark.i;
      d.appendChild(b);
      attachTip(d, { name: t(srcMark.k + 'Name'), rarityText: t('extraTileTag'),
        desc: srcMark.c === 'retuned'
          ? t('retunedTileDesc', T.originName(tile.origin))
          : t(srcMark.k + 'Desc') }, {});
    }
    /* MIKNATIS (P28 · Grup H) — mıknatıslı taş ıstakada işaretlenir.
       Şart: oyuncu hangi taşa 10 coin verdiğini GÖREBİLMELİ, yoksa kartın
       her raund çalıştığına dair tek kanıt raund başı bildirimi olur ve o
       bildirim okunmadan kaybolur (Hipnotizör'de aynı hata yaşandı).
       Godzilla/Hipnotizör rozet dili: küçük köşe işareti, yeni bir UI dili
       icat edilmez. */
    if (tile.magnet && !tile.jokerTile) {
      d.classList.add('magnet');
      attachTip(d, { name: t('magnetName'), rarityText: t('magnetTag'),
        desc: t('magnetDesc') }, {});
    }
    // Toplu Hipnoz — transtaki sayının taşları işaretlenir (çift değer)
    if (Game.state.hipnoNumber && tile.number === Game.state.hipnoNumber
        && !tile.jokerTile && !tile.fakeOkey && !Game.isOkeyTile(tile)) {
      d.classList.add('hipno');
      d.appendChild(fxOrbit('hipno'));   // Grup C: kontur çerçevesi + dönen ışık
      attachTip(d, { name: t('hipnoName'), rarityText: t('hipnoTag'), desc: t('hipnoDesc') }, {});
    }
    if (tile.special) {
      const sp = SPECIAL_TILES[tile.special];
      attachTip(d, { name: T.specialName(tile.special, sp.name), desc: T.specialDesc(tile.special, sp.desc), rarityText: t('specialTag') }, {});
    } else if (tile.stoned) {
      attachTip(d, { name: t('stonedName'), desc: t('stonedDesc'), rarityText: t('stonedTag') }, {});
    }
    if (interactive) {
      if (selection.has(tile.id)) d.classList.add('selected');
      if (newTileIds.has(tile.id)) d.classList.add('new');
      d.addEventListener('click', () => onTileClick(tile.id));
      enableDrag(d, tile);
    }
    return d;
  }

  function okeyLabel() {
    const o = Game.state.okey;
    return `${T.color(o.color)} ${o.number}`;
  }

  /* ---------- Harita ekranı ---------- */

  /* ============================================================
     RAUND HARİTASI — Figma OKEY-101 · 221:127 / 279:10922 (GRUP I,
     2026-09-07). Ekran oyun ekranıyla aynı 1920×1080 tuvalde yaşar;
     üst şerit ve sol sütun ölçüleri onunla BİREBİR aynıdır.

     ÜÇ KART DA "SELECT" DÜĞMESİ TAŞIR ama raund SIRASI DEĞİŞMEDİ
     (kullanıcı kararı 2026-09-07): tasarımdaki üç düğme görsel dildir,
     yalnız oynanacak raundun düğmesi etkindir.

     Kart adları: normal raundlar i18n'deki adlarını kullanır (TR
     "Gösterge Eli" / "Çanak Eli", EN "Indicator Hand" / "Pot Hand" —
     Figma'daki yazılar bunların İngilizcesidir), boss kartı ise BOSS'UN
     ADINI yazar (tasarımda "Mirror king").

     ÖDÜL: tasarımda ödül satırı dört "$" glifidir, sayı yazmaz. Birebir
     kural gereği aynen öyle çizilir. */
  /* Katlanmış (geçilmiş) kartlardan oyuncunun ELLE AÇTIKLARI. Raund
     değişince sıfırlanır — yeni raundun kendi katlanma durumu olsun. */
  const mapOpenDone = new Set();
  let mapOpenDoneRound = -1;

  /* GRUP B — ödül satırındaki "$" ölçeği (kullanıcı kararı 2026-09-09).
     Tek yerde durur ki rozet ile ipucu metnindeki sayı ayrışamasın. */
  const MC_COIN_PER_GLYPH = 5;
  const MC_GLYPHS_NORMAL = 5;   // ≈ 25 coin
  const MC_GLYPHS_BOSS = 6;     // ≈ 30 coin

  function renderMap() {
    const s = Game.state;
    if (mapOpenDoneRound !== s.roundInStage) { mapOpenDone.clear(); mapOpenDoneRound = s.roundInStage; }
    el.mapStage.textContent = `${s.stage}/${chCount()}`;
    el.mapRound.textContent = `${s.roundInStage}/3`;
    el.mapScoreVal.textContent = String(s.score ?? 0);
    el.mapCoinVal.textContent = String(s.coins);
    el.mapOkey.innerHTML = '';
    el.mapOkey.appendChild(tileEl({ id: -900, color: s.okey.color, number: s.okey.number,
      isOkeyReal: true }, false));
    el.mapOkey.title = okeyLabel();

    /* Joker paneli: oyun ekranındaki kartların aynısı (süre rozeti de
       kartın kendi sağ üst köşesinde — kullanıcı kararı 2026-09-07). */
    el.mapJokerSlots.innerHTML = '';
    s.jokers.forEach(j => el.mapJokerSlots.appendChild(jokerCard(j)));
    for (let i = s.jokers.length; i < Game.slotCap(); i++) {
      const d = document.createElement('div');
      d.className = 'joker-slot-empty';
      el.mapJokerSlots.appendChild(d);
    }

    /* Deste / atılan — Figma'da METİN ETİKETİ YOK: kart, altında
       kalan/toplam sayacı ve boş atılan slotu. */
    /* Figma 237:616 — sayaç "87/108" biçiminde: KALAN / TOPLAM
       (oyun ekranındakiyle aynı kaynak). */
    el.mapDeckCount.textContent = `${(s.deck || []).length}/${Game.totalTilesInPlay()}`;

    el.mapCards.innerHTML = '';
    const names = [t('normal1'), t('normal2'), null];
    const arts = ['art-indicator', 'art-pot', null];
    for (let ric = 1; ric <= 3; ric++) {
      const done = ric < s.roundInStage;
      const active = ric === s.roundInStage;
      const boss = ric === 3;
      const card = document.createElement('div');
      /* GEÇİLMİŞ raund kartı KATLI başlar (Figma V2). Oyuncu şevrona basıp
         açabilir; `mapOpenDone` o tercihi raund boyunca hatırlar. */
      const folded = done && !mapOpenDone.has(ric);
      card.className = 'map-card mc-' + ric
        + (active ? ' active' : done ? ' done' : ' locked') + (boss ? ' boss' : '')
        + (folded ? ' collapsed' : '');
      const target = active ? s.target : Game.targetFor(s.stage, ric);

      const btn = document.createElement('button');
      /* `mc-play` görsel bir sınıf DEĞİL, "raundu başlatan düğme" kancasıdır:
         öğretici (TUT spot) ve 20'ye yakın tarayıcı testi bu seçiciyi
         kullanıyor. Tasarım sınıfı `mc-select`; kanca korunuyor. */
      btn.className = 'mc-select mc-play';
      /* PLAYTEST 26 · GRUP A — BANNER KARTIN DURUMUNU YAZAR.
         Eskiden üç kartın da banner'ında "SEÇ" yazıyordu; kilitli kartta bu
         yanlış bir davet, geçilmiş kartta ise anlamsızdı (katlanmış kartta
         yazının yerini şevron alıyordu, o da "buraya gidilebilir" hissi
         veriyordu). Artık: aktif → SEÇ, geçilmiş → GEÇİLDİ, kilitli →
         KİLİTLİ. Şevron da yalnız AKTİF kartta durur (aşağıdaki `mc-go`). */
      btn.textContent = active ? t('mcSelect') : done ? t('mcPassed') : t('mcLocked');
      btn.disabled = !active;
      btn.title = done ? t(folded ? 'mcExpand' : 'mcCollapse') : '';
      if (active) btn.addEventListener('click', () => {
        if (boss) SFX.boss();              // boss girişi (GDD 14.5)
        markInRound();                     // raund içine girildi
        showScreen('game');
        flushRoundStart();                 // raund başı olayları + pop-up'lar
      });
      else if (done) {
        /* Pasif düğme `disabled` olduğu için tıklamayı yutar — katla/aç
           dinleyicisi kartın kendisinde durur. */
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.mc-select')) return;
          if (mapOpenDone.has(ric)) mapOpenDone.delete(ric);
          else mapOpenDone.add(ric);
          renderMap();
        });
      }
      card.appendChild(btn);

      const pill = document.createElement('div');
      pill.className = 'mc-pill';
      pill.textContent = boss ? T.bossName(s.boss.key, s.boss.name) : names[ric - 1];
      card.appendChild(pill);

      const art = document.createElement('div');
      /* Boss kartının görseli o boss'un Figma kartıdır (GRUP D). Boss
         anahtarları joker anahtarlarıyla aynı olduğu için tek küme yeter;
         tasarımı hazırlanmamış boss kart arkasını gösterir (GRUP E). */
      if (boss) {
        const has = JOKER_ART.has(s.boss.key);
        art.className = 'mc-art ' + (has ? 'art-joker jk-' + s.boss.key : 'blank');
      } else {
        art.className = 'mc-art ' + arts[ric - 1];
      }
      card.appendChild(art);

      if (boss) {
        const cond = document.createElement('div');
        cond.className = 'mc-cond';
        cond.textContent = T.bossDesc(s.boss.key, s.boss.desc);
        card.appendChild(cond);
      }

      const tgt = document.createElement('div');
      tgt.className = 'mc-target';
      /* PLAYTEST 26 · GRUP B — "$" GLİFİ ARTIK BİR ÖLÇEKTİR.
         Tasarımda ödül satırı dört "$" idi ve hiçbir şeyi ölçmüyordu (üç
         kartta da aynı dördü çiziliyordu). Kullanıcı kararı: her "$" ≈
         COIN_PER_GLYPH coin; normal raund GLYPHS_NORMAL, boss raundu
         GLYPHS_BOSS glif gösterir — boss'un daha yüksek ödemesi artık
         satıra bakınca görülür. Gerçek ödeme motorun kendi tablosundan
         gelir (bitiş turu + aşım + stage ölçeği), bu satır onun KABA
         göstergesidir; kesin karşılık ipucu metnindedir. */
      const glyphs = boss ? MC_GLYPHS_BOSS : MC_GLYPHS_NORMAL;
      tgt.innerHTML =
        `<div class="mc-t-lbl">${t('mcScoreAtLeast')}</div>` +
        `<div class="mc-t-val">${target} <span class="mc-unit">${t('mcPts')}</span></div>` +
        `<div class="mc-t-rew">${t('mcReward')}<span class="mc-colon">:</span>` +
        `<span class="mc-coins">${'<i>$</i>'.repeat(glyphs)}</span></div>`;
      tgt.title = t('mcRewardTip', MC_COIN_PER_GLYPH, glyphs);
      card.appendChild(tgt);

      el.mapCards.appendChild(card);

      /* TRAINER — RAUND ATLAMA. Düğme kartların ARASINDAKİ boşlukta durur
         ve solundaki raundu atlar; her tıklama TEK raund ilerletir.
         Normal oyunda hiç çizilmez. */
      if (Game.trainerMode && ric < 3) {
        const sk = document.createElement('button');
        sk.type = 'button';
        sk.className = 'map-skip-btn sk-' + ric;
        sk.textContent = '⏭';
        sk.title = t('trSkipRoundTip', ric);
        sk.disabled = !active;
        sk.addEventListener('click', () => {
          const r = Game.skipRound({ toStore: false });
          if (!r.ok) { toast(r.error, false); return; }
          toast(t('trSkipped', r.from.stage, r.from.round), true);
          if (Game.state.status !== 'playing') { showRunComplete(); return; }
          renderMap();
        });
        el.mapCards.appendChild(sk);
      }
    }

    // Trainer modu: rozet + boss seçici + store filtresi (Grup H)
    document.getElementById('trainerMapBar')?.remove();
    if (Game.trainerMode) el.mapCards.parentElement.appendChild(trainerMapBar());
  }

  /* Trainer barı (yalnız trainer modunda; tasarımın parçası DEĞİLDİR,
     geliştirme aracıdır ve normal oyunda hiç çizilmez). */
  function trainerMapBar() {
    const s = Game.state;
    const bar = document.createElement('div');
    bar.id = 'trainerMapBar';
    const tag = document.createElement('span');
    tag.className = 'tr-tag';
    tag.textContent = t('trTag');
    bar.appendChild(tag);
    const bl = document.createElement('label');
    bl.append(t('trBossPick') + ' ');
    const sel = document.createElement('select');
    sel.id = 'trBossSel';   // testler konuma değil id'ye baksın
    for (const b of BOSSES) {
      const o = document.createElement('option');
      o.value = b.key;
      o.textContent = T.bossName(b.key, b.name);
      if (s.boss?.key === b.key) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => { Game.setBoss(sel.value); renderMap(); });
    bl.appendChild(sel);
    bar.appendChild(bl);
    // Stage atlama — Sonsuz Mod'da üst sınır yok (1..12 pratik liste)
    const jl = document.createElement('label');
    jl.append(t('trJump') + ' ');
    const jsel = document.createElement('select');
    jsel.id = 'trJumpSel';
    const maxCh = Number.isFinite(Game.totalStages()) ? Game.totalStages() : 12;
    for (let c = 1; c <= maxCh; c++) {
      const o = document.createElement('option');
      o.value = String(c);
      o.textContent = String(c);
      if (s.stage === c) o.selected = true;
      jsel.appendChild(o);
    }
    jsel.addEventListener('change', () => {
      const r = Game.jumpToStage(parseInt(jsel.value, 10));
      if (r.ok) { toast(t('trJumped', r.stage), true); renderMap(); showOkeyBanner(); }
    });
    jl.appendChild(jsel);
    bar.appendChild(jl);
    /* Grup K — Okey Taşını run içinde de elle seç. */
    const ol = document.createElement('label');
    ol.append(t('trOkey') + ' ');
    const ocol = document.createElement('select');
    ocol.id = 'trOkeyColorSel';
    const orand = document.createElement('option');
    orand.value = ''; orand.textContent = t('trOkeyRandom');
    if (!s.trainerOkey) orand.selected = true;
    ocol.appendChild(orand);
    for (const c of COLORS) {
      const o = document.createElement('option');
      o.value = c; o.textContent = T.color(c);
      if (s.trainerOkey?.color === c) o.selected = true;
      ocol.appendChild(o);
    }
    const onum = document.createElement('select');
    onum.id = 'trOkeyNumSel';
    for (let n = 1; n <= 13; n++) {
      const o = document.createElement('option');
      o.value = String(n); o.textContent = String(n);
      if ((s.trainerOkey?.number ?? s.okey.number) === n) o.selected = true;
      onum.appendChild(o);
    }
    const applyOkey = () => {
      const r = ocol.value
        ? Game.setTrainerOkey(ocol.value, parseInt(onum.value, 10))
        : Game.setTrainerOkey(null);
      if (!r.ok) { toast(r.error); return; }
      toast(r.fixed ? t('trOkeyFixed', T.color(r.okey.color), r.okey.number) : t('trOkeyFreed'), true);
      renderMap();
      showOkeyBanner();
    };
    ocol.addEventListener('change', applyOkey);
    onum.addEventListener('change', () => { if (ocol.value) applyOkey(); });
    ol.append(ocol, onum);
    bar.appendChild(ol);
    const fb = document.createElement('button');
    fb.className = 'btn ghost';
    fb.textContent = t('trFilterBtn') + (s.trainerStoreFilter?.length ? ` (${s.trainerStoreFilter.length})` : '');
    fb.addEventListener('click', showTrainerFilter);
    bar.appendChild(fb);
    /* Joker süresi — kurulumda seçilir, store'dan alım öncesi de değişir. */
    const ul = document.createElement('label');
    ul.append(t('trUses') + ' ');
    const usel = document.createElement('select');
    usel.id = 'trUsesSel';
    const cur = s.trainerJokerUses;
    const opts = [['def', t('trUsesDefault')]]
      .concat([1, 2, 3, 4, 5, 8, 10, 20].map(n => [String(n), String(n)]))
      .concat([['inf', t('trUsesInf')]]);
    for (const [v, label] of opts) {
      const o = document.createElement('option');
      o.value = v; o.textContent = label;
      const isCur = (v === 'def' && cur == null)
        || (v === 'inf' && cur === Infinity)
        || (cur != null && Number.isFinite(cur) && String(cur) === v);
      if (isCur) o.selected = true;
      usel.appendChild(o);
    }
    usel.addEventListener('change', () => {
      const r = Game.setTrainerJokerUses(
        usel.value === 'def' ? null : usel.value === 'inf' ? Infinity : usel.value);
      if (r.ok) toast(t('trUsesSet', r.uses === Infinity ? t('trUsesInf')
        : r.uses == null ? t('trUsesDefault') : r.uses), true);
    });
    ul.appendChild(usel);
    bar.appendChild(ul);
    return bar;
  }

  /* ---------- Joker tooltip (Balatro tarzı; artık eylem butonlu) ---------- */

  const tip = document.createElement('div');
  tip.id = 'jokerTip';
  tip.className = 'hidden';
  document.body.appendChild(tip);
  let tipHideTimer = null;
  tip.addEventListener('mouseenter', () => clearTimeout(tipHideTimer));
  tip.addEventListener('mouseleave', hideTip);

  /* ============================================================
     PLAYTEST 26 · GRUP C — AÇIKLAMADAKİ SAYILAR VURGULANIR
     Şikâyet: "değerler okurken zorlanacak kadar küçük". Açıklama gövdesi
     14 → 16px'e çıktı, ama asıl iş burada: cümlenin İÇİNDEKİ sayısal
     değer ("+0.8x", "%20", "+150") kendi rengiyle ve bir tık büyük
     yazılır, böylece göz cümleyi okumadan da kartın gücünü görür.

     Metin `innerHTML` ile basıldığı için etiketler KORUNUR: dizi önce
     `<...>` parçalarına bölünür, yalnız TEK indeksli olmayan (metin)
     parçalar dönüştürülür — yoksa bir etiketin içindeki sayı (örn.
     `<span class="x2">`) bozulurdu. */
  const TIP_NUM_RX = /([+\-−]?(?:%\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?%?)(?:x|×)?)/g;
  /* GODZILLA seviye etiketi (kullanıcı isteği 2026-09-10): açıklamadaki
     "S1 / S2 / S3" ifadelerinde yukarıdaki desen yalnız RAKAMI yakalıyor,
     baştaki "S" küçük ve gövde renginde kalıyordu — etiket ikiye bölünmüş
     görünüyordu. Harf de aynı `.tip-num` vurgusuna alınır (aynı altın ton,
     aynı punto/kalınlık) ki "S2" tek parça dursun. YALNIZ bu kartta
     uygulanır: `key` godzilla değilse metin hiç dokunulmadan geçer. */
  const GODZILLA_LV_RX = /\bS(<b class="tip-num">)([123])(<\/b>)/g;
  function emphNums(html, key) {
    const out = String(html ?? '')
      .split(/(<[^>]*>)/)
      .map((seg, i) => (i % 2 ? seg : seg.replace(TIP_NUM_RX, '<b class="tip-num">$1</b>')))
      .join('');
    return key === 'godzilla' ? out.replace(GODZILLA_LV_RX, '$1S$2$3') : out;
  }

  function showTip(target, j, opts = {}) {
    clearTimeout(tipHideTimer);
    /* Kategori satırı: "COMMON · DESTE JOKERİ" / "DEĞNEK" gibi. Rengi artık
       satırın kendi sınıfından değil kartın nadirliğinden (--tip-accent)
       gelir, bu yüzden `tr-*` sınıfı burada gereksizdir. */
    const rarityLine = j.rarity
      ? `<div class="tip-rarity">${T.rarity(j.rarity)}${JOKER_DEFS[j.key]?.mech === 'deck' ? ' · ' + t('deckJokerTag') : ''}</div>`
      : (j.rarityText ? `<div class="tip-rarity">${j.rarityText}</div>` : '');
    const usesLine = opts.backup
      ? `<div class="tip-uses">${t('tipBackup', j.waitLeft)}</div>`
      : (Game.isRunLong && Game.isRunLong(j) ? `<div class="tip-uses">${t('tipUsesRun')}</div>`
        : (j.usesLeft != null ? `<div class="tip-uses">${t('tipUses', j.usesLeft)}</div>` : ''));
    // Füzyonla birleşmiş alt jokerler — her birinin adı+efekti listelenir
    const fusedLines = (j.fused || []).map(f =>
      `<div class="tip-fused"><div class="tip-head">⚗ ${T.name(f)}</div>` +
      `<div class="tip-desc">${emphNums(T.desc(f), f.key)}</div></div>`).join('');
    /* P30 · Grup F — VASİYET'İN TAŞIDIĞI EFEKTLER. Füzyon satırlarıyla
       aynı dil; depo boşsa bunu da açıkça söyler. Yalnız gerçek kartta
       (id'si olan) çizilir — koleksiyon/store tanımında miras olmaz. */
    const heirRec = j.id != null && [j, ...(j.fused || [])].find(r => r.key === 'vasiyet');
    const vcap = window.VASIYET_CAP || 2;
    const legacyLines = !heirRec ? ''
      : ((heirRec.legacy || []).length
        ? heirRec.legacy.map((r, i) =>
          `<div class="tip-fused tip-legacy"><div class="tip-head">📜 ${t('tipLegacyItem', i + 1, vcap)} ${T.name(r)}</div>` +
          `<div class="tip-desc">${emphNums(T.desc(r), r.key)}</div></div>`).join('')
        : `<div class="tip-fused tip-legacy"><div class="tip-head">📜 ${t('tipLegacyEmpty')}</div></div>`);
    /* P30 · Grup G — İpotek borç durumu (kartın düğmesiyle aynı üç hâl) */
    let ipotekLine = '';
    if (j.id != null && Game._recsOf && Game.ipotekState && Game._recsOf(j).some(r => r.key === 'ipotek')) {
      const ip = Game.ipotekState();
      ipotekLine = `<div class="tip-uses">${t('ipotekState_' + (ip.paying ? 'paying' : (ip.owed ? 'owed' : 'ready')))}</div>`;
    }
    /* P30 · Grup I — KOLEKSİYONDA PANDORA'NIN ÜÇ OLASI VARYANTI. Füzyon'un
       "içerdiği efektler" satırlarının aynısı: oyuncu kutunun neye
       dönüşebileceğini satın almadan inceleyebilsin. */
    const variantLines = (j.variants || []).map(v =>
      `<div class="tip-fused"><div class="tip-head">${v.icon} ${T.ev(v.name)}</div>` +
      `<div class="tip-desc">${emphNums(T.ev(v.desc), 'truva')}</div></div>`).join('');
    /* PİKSEL-ART AÇIKLAMA KARTI (kullanıcı isteği 2026-09-07).
       Yapı: nadirlik renginde ŞERİT + büyük başlık → küçük harfli kategori
       satırı → açıklama → süre / füzyon / eylemler. Çerçevenin ve şeridin
       rengi kartın nadirliğinden gelir; nadirliği olmayan kalemler
       (özel taş, boss koşulu) nötr `tr-none` ile çizilir.
       DEĞNEK (kullanıcı isteği 2026-09-09): kategori satırı hazır metin
       (`rarityText`, "COMMON · DEĞNEK") olduğu için `rarity` alanı boş
       kalıyor ve kart nötr griye düşüyordu; artık çağıran `accent` ile
       yalnız RENGİ verir, satırın metni değişmez.
       Bkz. style.css "AÇIKLAMA KARTI (TOOLTIP)" bloğu. */
    tip.className = 'tr-' + (j.rarity || j.accent || 'none');
    tip.innerHTML =
      `<div class="tip-in">` +
      `<div class="tip-head">${j.key ? T.name(j) : j.name}</div>` + rarityLine +
      `<div class="tip-desc">${emphNums(j.key ? T.desc(j) : T.ev(j.desc), j.key)}</div>` +
      fusedLines + legacyLines + variantLines + ipotekLine + usesLine +
      `</div>`;
    const inner = tip.firstElementChild;
    // Eylem butonları (Grup G2): store açıkken slot jokerlerine Sat / →Ana / Birleştir
    const actions = typeof opts.actions === 'function' ? opts.actions() : (opts.actions || []);
    tip.classList.toggle('interactive', actions.length > 0);
    if (actions.length) {
      const row = document.createElement('div');
      row.className = 'tip-actions';
      for (const a of actions) {
        const b = document.createElement('button');
        b.className = 'tip-act' + (a.disabled ? ' locked' : '');
        b.innerHTML = a.label;
        if (a.disabled) b.disabled = true;
        else b.addEventListener('click', (e) => { e.stopPropagation(); hideTip(); a.fn(); });
        row.appendChild(b);
      }
      inner.appendChild(row);
    }
    tip.classList.remove('hidden');
    // kenarlara taşma kontrolü: önce sağa aç, sığmazsa sola; dikeyde kelepçele
    const r = target.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.right + 10;
    if (x + tw > window.innerWidth - 8) x = r.left - tw - 10;
    x = Math.max(8, x);
    let y = r.top + r.height / 2 - th / 2;
    y = Math.max(8, Math.min(y, window.innerHeight - th - 8));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  function hideTip() {
    clearTimeout(tipHideTimer);
    tip.classList.add('hidden');
  }

  function attachTip(elm, j, opts = {}) {
    elm.addEventListener('mouseenter', () => showTip(elm, j, opts));
    elm.addEventListener('mouseleave', () => {
      // eylemli tooltip'e fare geçebilsin diye kısa gecikmeyle kapat
      clearTimeout(tipHideTimer);
      tipHideTimer = setTimeout(() => tip.classList.add('hidden'), tip.classList.contains('interactive') ? 260 : 0);
    });
  }

  /* ---------- Kırılma efekti (GDD 7.3 — süre dolumu) ---------- */

  function shatterEl(card) {
    const r = card.getBoundingClientRect();
    const color = getComputedStyle(card).borderLeftColor;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'shard';
      p.style.left = (r.left + Math.random() * r.width) + 'px';
      p.style.top = (r.top + Math.random() * r.height) + 'px';
      p.style.background = i % 3 === 0 ? color : '#efe8d6';
      document.body.appendChild(p);
      const dx = (Math.random() - .5) * 150;
      const dy = 50 + Math.random() * 130;
      const rot = (Math.random() - .5) * 560;
      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(.4)`;
        p.style.opacity = '0';
      });
      setTimeout(() => p.remove(), 800);
    }
    card.classList.add('shattering');
  }

  /* ---------- Grup G (2026-08): görsel-odaklı kart dili ----------
     Kartlar artık büyük ikon + kısa vurgu çipleri + rozetlerle okunur;
     uzun açıklama tooltip'te kalır. */

  // 95 joker için ikon haritası (kartın görsel alanı)
  const JOKER_ICONS = {
    /* common */
    bereket: '🌾', kosucu: '🏃', ikizler: '👯', takim: '🧩', uzunKosu: '🛤️',
    ciftFirtina: '🌪️', kalabalikPer: '👨‍👩‍👧‍👦', renkUstasi: '🎨', sayiTapinagi: '🛕',
    doluEl: '🖐️', bosCep: '🪫', kucukTas: '🐜', buyukTas: '🐘',
    ikiYuzlu: '🌗', tekRenkRuhu: '🎯', seriAcici: '🔓', hizliTuketici: '⚡',
    ciftVurus: '🥊', sansliYedili: '🎰', islemeci: '🔧',
    /* rare */
    ayna: '🔖', kumarbaz: '🎲', copcu: '🧹', yanki: '📣', zincir: '⛓️',
    vampir: '🧛', bitki: '🌱', tercuman: '🗣️', paratoner: '⚡', anarsist: '🏴',
    tradeJokeri: '📈', hipnotizor: '🌀', katalizor: '⚗️', terazi: '⚖️',
    sarmasik: '🌿', yankee: '🤠', dedikodu: '🗨️', terzi: '🦎', bungieGum: '🍬',
    fuzyon: '🔗',
    /* legendary */
    sisyphus: '🪨', midas: '👑', kaptan: '⚓', ucuncuTeker: '🛞', truva: '📦',
    kaioken: '🔥', ankaKusu: '🐦‍🔥', theWorld: '🕰️', medusa: '🐍',
    vasiyet: '📜', ipotek: '🏦', truva: '🐴', atesTuccari: '🔥', rusvet: '💰', hidra: '🐉',
    frankenstein: '🧟‍♂️',
    /* mythic */
    seytan: '😈', pinkyWarrior: '🩷', kiyamet: '☄️', tanrininEli: '🤲', ejderha: '🐉',
    karaDelik: '🕳️', crimsonTac: '👑', nostradamus: '🔮', yasakElma: '🍎',
    kagit: '📃',
    /* epic */
    kirby: '🌸', cellat: '🪓', dervish: '🌀', misunderstood: '🎭', zombie: '🧟',
    uzayli: '👽', ahtapot: '🐙', cheating: '🃏', terziIgne: '📍', freedom: '🗽',
    avukat: '⚖️', kahin: '👁️', tuccar: '💼', fatality: '💀', ritim: '🥁',
    corporates: '🏢', godzilla: '🦖', kelebek: '🦋', aynaKral: '🪞', karaKedi: '🐈‍⬛',
  };
  const jokerIcon = (key) => JOKER_ICONS[key] || (JOKER_DEFS[key]?.mech === 'deck' ? '◈' : '🃏');

  // Açıklamadan kısa vurgu çipleri: "+0.8x", "+100 puan", "%25", "+2 raund"…
  function statChips(desc, max = 3) {
    const m = String(desc).match(
      /[+\-−]\d+(?:[.,]\d+)?x|[+\-]%\s?\d+|%\s?\d+|[+\-]\d+(?:[.,]\d+)?(?:\s?(?:puan|pts|points|coin|coins|raund|rounds?|taş|tiles?|çekiş|draws?))?/g) || [];
    const seen = new Set(); const out = [];
    for (const c of m) {
      const k = c.trim();
      if (!seen.has(k)) { seen.add(k); out.push(k); }
      if (out.length >= max) break;
    }
    return out;
  }
  function chipsHtml(desc, cls = 's-chips') {
    const cc = statChips(desc);
    return cc.length ? `<div class="${cls}">${cc.map(c => `<span class="s-chip">${c}</span>`).join('')}</div>` : '';
  }

  // "YENİ!" rozeti — bu tarayıcı profilinde daha önce hiç sahip olunmamış joker
  let ownedEver;
  try { ownedEver = new Set(JSON.parse(localStorage.getItem('okeyOwnedEver') || '[]')); }
  catch { ownedEver = new Set(); }
  function markOwnedEver(key) {
    // Trainer modu koleksiyon/istatistik sayaçlarına bulaşmaz (Grup H)
    if (!key || Game.trainerMode || ownedEver.has(key)) return;
    ownedEver.add(key);
    localStorage.setItem('okeyOwnedEver', JSON.stringify([...ownedEver]));
  }
  function syncOwnedEver() {
    const s = Game.state;
    if (!s || Game.trainerMode) return;
    for (const j of [...(s.jokers || []), ...(s.backup || []), ...(s.deckJokers || [])]) {
      markOwnedEver(j.key);
      for (const f of (j.fused || [])) markOwnedEver(f.key);
    }
  }

  /* ---------- Joker "taşı" — kompakt, rarity kimlikli ---------- */

  function jokerActions(j, backup) {
    // Store açıkken tooltip üzerinden satış (ve Füzyon/→Ana) — Grup G2
    return () => {
      /* PLAYTEST 26 · GRUP E2 (bug) — FÜZYON HER AN, HER RAFTAN.
         GDD 9.5: "Füzyon hangi rafta olursa olsun çalışır." Motor bunu
         zaten karşılıyordu (fusableJokers = ana slot + backup), ama UI
         tooltip eylemlerini `storeOpen()` koşuluna bağlıyordu: store
         kapalıyken kart hiç eylem göstermiyordu. Sonuç: Füzyon'u ilk
         geldiğinde kullanmayıp bir rafa koyan oyuncu, raund içinde ona
         bir daha ulaşamıyordu. Satış/takas gibi eylemler store'a bağlı
         KALIR (orası pazarın yeri); "Birleştir" store'dan bağımsızdır. */
      const fuseAct = j.key === 'fuzyon'
        ? [{ label: t('fuseBtn'), fn: () => pickFuzyon(j.id) }] : [];
      if (!storeOpen()) return fuseAct;
      // Grup B: satış kilitli jokerler (Lanetli Kaptan kurtardıktan sonra)
      const acts = j.noSell ? [{ label: t('sellLocked'), disabled: true, fn: () => {} }] : [{
        label: t('sellBtn', sellPrice(j.rarity, j.key), COIN),
        fn: () => {
          const res = Game.sellJoker(j.id);
          if (!res.ok) { toast(res.error || t('sellFail')); return; }
          toast(t('sellToast', T.name(res), res.gain), true); SFX.coin(); renderStore(); render();
        },
      }];
      /* MADDE E7 (2026-09-09) — TAKAS: kartı ver, farkı öde, bir üst
         nadirlikten rastgele kart al. Satışın hemen altında durur çünkü
         ikisi de "bu karttan kurtulma" eylemidir; takas onun ödeyerek
         yukarı çıkan hâlidir. Motor uygun değilse (Epic, Mythic, kilitli)
         eylem kilitli görünür — düğmeyi gizlemek yerine NEDEN yapılamadığı
         gösterilsin diye. */
      {
        const ti = Game.tradeUpInfo(j.id);
        acts.push(ti.ok ? {
          label: t('tradeBtn', ti.cost, COIN),
          disabled: (Game.state?.coins ?? 0) < ti.cost,
          fn: () => {
            const res = Game.tradeUpJoker(j.id);
            if (!res.ok) { toast(res.error || t('sellFail')); return; }
            toast(t('tradeToast', T.ev(res.gave), T.ev(res.got)), true);
            SFX.coin(); renderStore(); render();
          },
        } : { label: t('tradeLocked'), disabled: true, fn: () => {} });
      }
      if (backup) acts.push({
        label: t('moveMain'),
        fn: () => {
          const res = Game.moveToMain(j.id);
          if (!res.ok) { toast(res.error || t('moveFail')); return; }
          if (res.notes && res.notes.length) notify(res.notes);
          renderStore(); render();
        },
      });
      /* Grup A (bug): "Birleştir" eylemi eskiden YALNIZ ana slot kartında
         vardı; Füzyon backup'a düşünce erişilemez oluyordu. Artık her iki
         raftaki Füzyon kartından da açılır. */
      acts.push(...fuseAct);
      return acts;
    };
  }

  /* GİRİŞ ANİMASYONU YALNIZ YENİ KARTTA (hata raporu 2026-09-10).
     BELİRTİ: oyuncu ıstakada bir taşı taşıyıp bıraktığında slottaki
     jokerler (hepsi, yalnız boss olanlar değil) bir anlığına kaybolup
     geri geliyordu.
     KÖK NEDEN: `render()` joker ve değnek kartlarını her çağrıda
     SIFIRDAN kurar (innerHTML = '' → appendChild), taş taşımak da bir
     render tetikler. CSS'teki `fadeIn` bir GİRİŞ animasyonudur ama düğüm
     her seferinde yeniden doğduğu için her render'da baştan oynuyordu —
     ölçümde taşıma sonrası kart opaklığı 0.05 çıktı.
     ÇÖZÜM animasyonu kaldırmak değil, daha önce çizilmiş bir kimliğe
     OYNATMAMAK: kart yalnız ilk kez göründüğünde `jt-enter`/`cs-enter`
     alır. Kümeler masadan düşen kimlikleri unutur (bkz. render), yoksa
     run boyunca şişerlerdi. */
  const jokerSeen = new Set();
  const consumSeen = new Set();

  function jokerCard(j, opts = {}) {
    const tile2 = document.createElement('div');
    // Grup B2 — "run boyunca" jokerlerde raund sayacı YOKTUR: yıpranma
    // sınıfları da rozet de sayı yerine ∞ ile çalışır.
    const runLong = !!(Game.isRunLong && Game.isRunLong(j));
    tile2.className = `joker-tile r-${j.rarity}`
      + (!opts.backup && !runLong && j.usesLeft <= 2 ? ' worn' : '')
      + (!opts.backup && !runLong && j.usesLeft <= 1 ? ' dying' : '')
      + (runLong ? ' run-long' : '');
    tile2.dataset.jid = j.id;
    if (!jokerSeen.has(j.id)) { jokerSeen.add(j.id); tile2.classList.add('jt-enter'); }
    if (j.noSell) tile2.classList.add('locked-sell');
    /* BOSS (EPIC) JOKER ÇİZİMİ SLOTTA (kullanıcı isteği 2026-09-10).
       KÖK NEDEN: koleksiyon (.col-jk-art) ve harita (.mc-art.art-joker)
       `--jk-art` değişkenini okuyordu, SLOT hiç okumuyordu — bu kart
       adı + rozetten ibaret çiziliyordu. Yani sorun eksik/yanlış asset
       değil, slot şablonunda çizim katmanının HİÇ OLMAMASIYDI; aynı
       sebeple Ahtapot da Ayna Kral da görselsizdi.
       Kalıp özel taş/değnek/koleksiyonla aynı: sınıf adı JS'ten
       (`jk-<key>`), dosya YOLU style.css'ten — standalone derleyicisi
       yalnız sabit url(...) yazılarını base64'e çevirebiliyor.
       `has-art` kartın krem zeminini, çerçevesini ve gölgesini kaldırır:
       kullanıcı arkaya kendi banner'ını koyacak, altta renk dolgusu
       kalmamalı. Çizimi HENÜZ OLMAYAN boss jokerlerine dokunulmaz —
       yer tutucu uydurulmaz, eski kart görünümlerinde kalırlar. */
    const hasArt = JOKER_ART.has(j.key);
    if (hasArt) tile2.classList.add('has-art', 'jk-' + j.key);
    /* Çizimli kartta AD YAZILMAZ (kullanıcı kararı 2026-09-10) — çizim
       kartın TAMAMINI kaplar, ad ve açıklama zaten üstüne gelince
       ipucunda çıkar. Koleksiyon rafındaki (.col-jk-card) kuralın
       aynısı; kilit/füzyon işaretleri de ipucuna bırakılır. */
    tile2.innerHTML =
      (hasArt
        ? '<div class="jt-art"></div>'
        : `<div class="jt-name">${(j.noSell ? '🔒 ' : '')}${(j.fused && j.fused.length ? '⚗ ' : '')}${T.name(j)}</div>`) +
      `<span class="jt-uses${opts.backup ? ' frozen' : (!runLong && j.usesLeft <= 1 ? ' danger' : '')}">` +
      (opts.backup ? `❄${j.waitLeft}` : (runLong ? '∞' : j.usesLeft)) + `</span>`;
    // Godzilla şarj rozeti — o anki gerçek seviye canlı görünür
    if (!opts.backup && (j.key === 'godzilla' || (j.fused || []).some(f => f.key === 'godzilla'))) {
      const lv = Game.state.godzillaLevel || 0;
      const b = document.createElement('span');
      b.className = 'jt-charge' + (lv > 0 ? ' on' : '');
      b.textContent = lv >= 3 ? '⚡S3★' : (lv > 0 ? `⚡S${lv}` : 'S0');
      b.title = lv > 0 ? t('godzillaOn', lv) : t('godzillaOff');
      tile2.appendChild(b);
    }
    /* PLAYTEST 17 · GRUP B/9 — HİPNOTİZÖR'ÜN TRANS SAYISI KARTTA CANLI DURUR.
       Motorun kurası doğrulandı (400 raundluk ölçüm 1-13 arası düzgün
       dağılıyor, bkz. GDD Versiyon Geçmişi 4.47); sorun görünürlüktü:
       sayı yalnız raund başı bildiriminde bir kez geçiyordu ve o bildirim
       okunmadan kayboluyordu (aynı listenin A/3 maddesi). Godzilla şarj
       rozetiyle aynı kalıp kullanılır — yeni bir UI dili icat edilmez. */
    if (!opts.backup && Game.state.hipnoNumber
        && (j.key === 'hipnotizor' || (j.fused || []).some(f => f.key === 'hipnotizor'))) {
      const b = document.createElement('span');
      b.className = 'jt-charge on';
      b.textContent = `🌀${Game.state.hipnoNumber}`;
      b.title = t('hipnoBadge', Game.state.hipnoNumber);
      tile2.appendChild(b);
    }
    /* PLAYTEST 30 · GRUP F — VASİYET'İN MİRAS DEPOSU KARTTA CANLI DURUR.
       Rozet kaç efekt taşıdığını gösterir (📜1/2); efektlerin adı ve
       açıklaması ipucunda "Miras" satırlarında listelenir. Godzilla /
       Hipnotizör rozetiyle aynı kalıp — yeni bir UI dili icat edilmez. */
    if (!opts.backup) {
      const heir = [j, ...(j.fused || [])].find(r => r.key === 'vasiyet');
      if (heir) {
        const leg = heir.legacy || [];
        const b = document.createElement('span');
        b.className = 'jt-charge' + (leg.length ? ' on' : '');
        b.textContent = `📜${leg.length}/${window.VASIYET_CAP || 2}`;
        b.title = leg.length ? t('vasiyetBadge', leg.map(r => T.name(r)).join(' · '))
          : t('vasiyetBadgeEmpty');
        tile2.appendChild(b);
      }
    }
    /* PLAYTEST 31 · GRUP H — CRIMSON KING'İN TACI kartın sol üst köşesinde. */
    if (!opts.backup && Game.state.crownId === j.id && Game.hasActive('crimsonTac')) {
      const b = document.createElement('span');
      b.className = 'jt-crown';
      b.textContent = '👑';
      b.title = t('crownBadge');
      tile2.appendChild(b);
    }
    /* PLAYTEST 30 · GRUP G — İPOTEK DÜĞMESİ KARTIN ÜSTÜNDE.
       Damga düğmesiyle aynı yer ve dil (jt-damga, sol alt köşe). Borç
       durumu düğmenin kendi yazısıdır: HAZIR (+2 TUR) · BORÇLU (sonraki
       raund -2) · ÖDENİYOR (bu raund -2, kullanılamaz). Kilitliyken
       nedeni düğmenin ipucunda yazar. */
    if (!opts.backup && Game.ipotekState
        && Game._recsOf && Game._recsOf(j).some(r => r.key === 'ipotek')) {
      const ip = Game.ipotekState();
      const mode = ip.paying ? 'paying' : (ip.owed ? 'owed' : 'ready');
      const b = document.createElement('button');
      b.className = 'jt-damga jt-ipotek ' + mode;
      b.textContent = t('ipotekBtn_' + mode);
      b.disabled = !ip.canUse;
      b.title = ip.canUse ? t('ipotekTip') : T.ev(ip.reason || '');
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        hideTip();
        const res = Game.useIpotek();
        if (!res.ok) { toast(T.ev(res.error)); return; }
        toast(T.ev(res.note), true);
        render();
      });
      tile2.appendChild(b);
    }
    /* PLAYTEST 28 · GRUP B — DAMGA DÜĞMESİ KARTIN ÜSTÜNDE.
       Damga'nın tek kararı "bu açılıma mı basayım", yani karar açılım
       anında verilir. Düğmeyi aksiyon barına koyamayız: bar Figma'nın
       424px'lik 3 sütunlu ızgarasıdır (bkz. style.css .gm-actions) ve
       dördüncü bir slot tasarımı bozar. Bu yüzden düğme Godzilla /
       Hipnotizör / Newton rozetleriyle AYNI yerde — jokerin kendi
       kartında — durur; yeni bir UI dili icat edilmez. `jt-move`
       (Ana Slota Al) kartın içinde zaten bir <button> barındırıyor ve
       enableJokerDrag `e.target.closest('button')` ile onu atlıyor,
       dolayısıyla sürükleme ile çakışmaz.
       Rozet basılıyken hesap kutusu 2 katı gösterir (aynı puanlama
       fonksiyonu), yani oyuncu ONAYLAMADAN önce sonucu görür. */
    if (!opts.backup
        && (j.key === 'ayna' || (j.fused || []).some(f => f.key === 'ayna'))) {
      const dm = Game.damgaState && Game.damgaState();
      if (dm && dm.id === j.id) {
        const b = document.createElement('button');
        b.className = 'jt-damga' + (dm.armed ? ' on' : '') + (dm.used ? ' spent' : '');
        b.textContent = dm.used ? t('damgaSpent') : (dm.armed ? t('damgaOn') : t('damgaOff'));
        b.disabled = !!dm.used;
        b.title = dm.used ? t('damgaTipSpent') : t('damgaTip');
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          hideTip();
          const res = Game.toggleDamga();
          if (!res.ok) { toast(res.error); return; }
          toast(res.armed ? t('damgaArmed') : t('damgaDisarmed'), res.armed);
          render();
        });
        tile2.appendChild(b);
      }
    }
    if (opts.backup) {
      const btn = document.createElement('button');
      btn.className = 'jt-move';
      btn.textContent = t('moveMain');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideTip();
        const res = Game.moveToMain(j.id);
        if (!res.ok) { toast(res.error || t('moveFail')); return; }
        toast(t('movedMain', T.name(j)), true);
        // Grup G: raund içinde ana slota geçen joker ANINDA kurulur;
        // kurulum bildirimleri (masa kuruldu, trans sayısı…) gösterilir
        if (res.notes && res.notes.length) notify(res.notes);
        render();
        if (storeOpen()) renderStore();
      });
      tile2.appendChild(btn);
    }
    attachTip(tile2, j, { ...opts, actions: jokerActions(j, !!opts.backup) });
    enableJokerDrag(tile2, j, opts.backup ? 'backup' : 'main');
    return tile2;
  }

  /* GRUP G (2026-09-06) — JOKER KARTINI SÜRÜKLEYİP YENİDEN SIRALAMA.
     Taş sürüklemesiyle (enableDrag) aynı desen: pointer olayları, 6px
     eşiği (yoksa tıklama/tooltip bozulur), hayalet kart ve komşuların
     arasına düşen bir işaret. Yalnız AYNI RAF içinde çalışır. */
  function enableJokerDrag(card, j, where) {
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button')) return;      // Sat / Ana Slota Al
      const row = card.parentElement;
      if (!row) return;
      const start = { x: e.clientX, y: e.clientY };
      let started = false, ghost = null, marker = null, toIdx = -1;
      const cards = () => [...row.querySelectorAll('.joker-tile')];
      const fromIdx = cards().indexOf(card);
      if (fromIdx < 0) return;

      const move = (ev) => {
        if (!started) {
          if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return;
          started = true;
          hideTip();
          card.classList.add('jk-dragging');
          const r = card.getBoundingClientRect();
          ghost = card.cloneNode(true);
          ghost.className = 'joker-tile jk-ghost r-' + j.rarity;
          ghost.style.width = r.width + 'px';
          ghost.style.height = r.height + 'px';
          document.body.appendChild(ghost);
          marker = document.createElement('div');
          marker.className = 'jk-drop-mark';
          row.appendChild(marker);
        }
        ghost.style.left = (ev.clientX - 26) + 'px';
        ghost.style.top = (ev.clientY - 18) + 'px';
        /* Hedef indeks: imlecin hangi kartın ortasını geçtiğine bakılır. */
        const list = cards().filter(c => c !== card);
        toIdx = list.length;
        for (let i = 0; i < list.length; i++) {
          const r = list[i].getBoundingClientRect();
          if (ev.clientY < r.top || (ev.clientY <= r.bottom && ev.clientX < r.left + r.width / 2)) {
            toIdx = i; break;
          }
        }
        const ref = list[toIdx] || null;
        row.insertBefore(marker, ref);
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (!started) return;
        card.classList.remove('jk-dragging');
        ghost?.remove();
        marker?.remove();
        const res = Game.reorderJoker(where, fromIdx, toIdx);
        if (res.ok) SFX.tap?.();
        render();
        if (storeOpen()) renderStore();
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  /* Süre rozetleri (Grup F düzeltmesi): varsayılan konum HER ZAMAN sağ üst.
     Yalnızca kenardan taşma riski varsa rozet, taşma miktarı kadar YATAYDA
     içeri kayar (sol üst köşeye zıplamaz — tooltip kelepçesiyle aynı mantık). */
  function clampBadges() {
    document.querySelectorAll('.joker-tile .jt-uses, .joker-tile .jt-charge').forEach(b => {
      b.style.right = ''; // önce varsayılana (sağ üst, -6px) dön
      const host = b.closest('#jokerPanel, .store-slots, #storeDeckRow, #colBody');
      const hr = host ? host.getBoundingClientRect() : null;
      const limit = Math.min(hr && hr.width ? hr.right : Infinity, window.innerWidth - 2);
      const r = b.getBoundingClientRect();
      if (!r.width) return; // gizli/ölçüsüz — dokunma
      const over = r.right - (limit - 2);
      if (over > 0) b.style.right = (-6 + over) + 'px'; // sadece içeri kaydır
    });
  }

  /* Store kilit butonu — YALNIZ joker slotlarında çizilir. Değnek, Özel Taş
     ve Gizli Paket kartlarında kilit yoktur (kullanıcı kararı 2026-09-03,
     gerekçe motor tarafında `_locksFrom` üstünde yazıyor). */
  function lockBtn(locked, onToggle) {
    const b = document.createElement('button');
    b.className = 's-lock' + (locked ? ' on' : '');
    b.textContent = locked ? '🔒' : '🔓';
    b.title = locked ? t('lockOn') : t('lockOff');
    b.addEventListener('click', onToggle);
    return b;
  }

  /* ---------- Ses (GDD 14.5) — WebAudio mini synth ---------- */

  let sfxOn = localStorage.getItem('okeySfx') !== '0';
  let actx = null;

  function beep(freq, dur = 0.08, type = 'triangle', vol = 0.1, when = 0) {
    if (!sfxOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, actx.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + when + dur);
      o.connect(g).connect(actx.destination);
      o.start(actx.currentTime + when);
      o.stop(actx.currentTime + when + dur + 0.02);
    } catch (e) { /* ses desteklenmiyorsa sessiz devam */ }
  }

  const SFX = {
    tick: () => beep(880, .04, 'square', .05),
    draw: () => { beep(660, .05); beep(880, .05, 'triangle', .08, .06); },
    meld: (n) => { for (let i = 0; i < Math.min(n || 1, 5); i++) beep(520 + i * 110, .09, 'triangle', .1, i * .07); },
    islek: () => { beep(220, .18, 'sawtooth', .12); beep(160, .22, 'sawtooth', .12, .12); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, .16, 'triangle', .12, i * .11)),
    lose: () => [330, 262, 196].forEach((f, i) => beep(f, .25, 'sawtooth', .1, i * .18)),
    boss: () => { beep(98, .4, 'sawtooth', .15); beep(65, .5, 'sawtooth', .15, .2); },
    coin: () => { beep(1245, .05, 'square', .08); beep(1568, .09, 'square', .08, .05); },
    crack: () => { beep(140, .2, 'sawtooth', .13); beep(90, .25, 'sawtooth', .1, .08); },
    /* PLAYTEST 26 · MADDE B — Kumarbaz'ın dik duran parası. Coin'in iki
       nota'lık "tin-tin"i bu anı taşımıyordu: burada yükselen 6 notalık
       bir arpej + üstüne binen parlak bir kuyruk var, yani ses de olayın
       ×35'lik ağırlığını duyuruyor. */
    jackpot: () => {
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => beep(f, .14, 'square', .09, i * .07));
      beep(2093, .5, 'triangle', .07, .42);
    },
  };

  /* ---------- Görsel efektler ---------- */

  function flashMult(text) {
    const f = document.createElement('div');
    f.className = 'mult-flash';
    f.textContent = text;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 650);
  }

  /* ============================================================
     PLAYTEST 19 · GRUP G — THE CHEATING BÜYÜK BİLDİRİMİ.
     Eski hâlde hem joker hem boss etkileri sıradan not kartı olarak, tur
     başındaki 5-6 satırın arasında akıp gidiyordu — kullanıcı "hiçbir
     hissedilir etki fark etmedim" dedi. Artık her hile olayı ekranın
     ortasında kendi kartıyla duyurulur; motor olayı `state.cheatFlash`e
     bırakır, burada tüketilir (bir olay yalnız BİR kez gösterilir).
     ============================================================ */
  function cheatFlash() {
    const s = Game.state;
    const queue = (s && Array.isArray(s.cheatFlash)) ? s.cheatFlash : [];
    if (!queue.length) return;
    s.cheatFlash = [];                         // tüketildi
    /* Aynı anda birden fazla olay birikmişse üst üste binmesin diye
       sırayla, aralıklı gösterilir. */
    queue.forEach((f, i) => setTimeout(() => showCheatFlash(f), i * 900));
  }

  function showCheatFlash(f) {
    const bad = f.side === 'boss' ? f.kind !== 'exposed' : f.kind === 'caught';
    let title, body;
    /* PLAYTEST 20 · GRUP G — bildirimler artık SOMUT olayı yazar:
       hangi taş çalındı, kaç taş biriktı, yakalanınca kaçı geri döndü. */
    if (f.side === 'joker' && f.kind === 'steal') {
      title = t('cheatStealTitle');
      body = t('cheatStealBody', T.color(f.color), f.number, f.total, Math.round(f.risk * 100));
    } else if (f.side === 'joker' && f.kind === 'hit') {
      // eski kayıtlardan gelen çarpan olayı (P19 uyumu)
      title = t('cheatHitTitle');
      body = t('cheatHitBody', f.gain.toFixed(1), f.bank.toFixed(1), Math.round(f.risk * 100));
    } else if (f.side === 'joker') {
      title = t('cheatCaughtTitle');
      body = f.back > 0 ? t('cheatCaughtBack', f.back) : t('cheatCaughtBare');
    } else if (f.kind === 'exposed') {
      title = t('cheatBossExposedTitle');
      body = f.back ? t('cheatBossExposedBack', f.coin, T.color(f.back.color), f.back.number)
        : t('cheatBossExposedBody', f.coin);
    } else if (f.kind === 'stealHand') {
      title = t('cheatBossHitTitle');
      body = t('cheatBossStealHand', T.color(f.color), f.number);
    } else if (f.kind === 'stealDeck') {
      title = t('cheatBossHitTitle');
      body = t('cheatBossStealDeck', f.n);
    } else if (f.kind === 'score') {
      title = t('cheatBossHitTitle');
      body = t('cheatBossScore', f.amount);
    } else if (f.kind === 'mult') {
      title = t('cheatBossHitTitle');
      body = t('cheatBossMult', f.amount.toFixed(1));
    } else {
      title = t('cheatBossHitTitle');
      body = t('cheatBossTile', T.color(f.color), f.from);
    }
    const ov = document.createElement('div');
    ov.className = 'cheat-flash' + (bad ? ' bad' : ' good');
    ov.innerHTML = `<div class="cf-title">${title}</div><div class="cf-body">${body}</div>`;
    const host = document.querySelector('#gameScreen .gm-stage') || document.body;
    host.appendChild(ov);
    if (bad) { SFX.crack(); islekFlash(); } else { SFX.meld(2); }
    setTimeout(() => ov.classList.add('out'), 1500);
    setTimeout(() => ov.remove(), 1900);
  }

  function islekFlash() {
    el.gameScreen.classList.add('islek-hit');
    setTimeout(() => el.gameScreen.classList.remove('islek-hit'), 550);
  }

  /* ---------- Stage / Okey ilan banner'ı ---------- */

  function showOkeyBanner() {
    const s = Game.state;
    const old = document.getElementById('okeyBanner');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'okeyBanner';
    ov.innerHTML =
      `<div class="ob-box">` +
      `<img src="maskot.png" alt="maskot">` +
      `<div class="ob-txt">` +
      `<div class="ob-title">${t('obTitle', s.stage, chCount())}</div>` +
      `<div class="ob-sub">${t('obSub')}</div>` +
      `<div class="okey-tile-mini ${s.okey.color}">${s.okey.number}</div>` +
      `<div class="ob-name">${okeyLabel()}</div>` +
      `<div class="ob-skip">${t('obSkip')}</div>` +
      `</div></div>`;
    ov.addEventListener('click', () => ov.remove());
    setTimeout(() => ov.remove(), 2800);
    document.body.appendChild(ov);
  }

  /* ---------- Ritim Jokeri mini oyunu (GDD 10) ---------- */

  function showRitim(level, cb, isBoss) {
    const zone = [20, 14, 9][level - 1];
    const period = 1150 - level * 180;
    const ov = document.createElement('div');
    ov.id = 'ritimOv';
    ov.innerHTML =
      `<div class="rt-box"><h3>${t(isBoss ? 'ritimTitleBoss' : 'ritimTitle', level)}</h3>` +
      `<p>${t(isBoss ? 'ritimBodyBoss' : 'ritimBody')}</p>` +
      `<div class="rt-bar"><div class="rt-zone" style="left:${50 - zone}%;width:${zone * 2}%"></div>` +
      `<div class="rt-marker"></div></div>` +
      `<button class="btn primary" id="rtStop">${t('ritimStop')}</button></div>`;
    document.body.appendChild(ov);
    const marker = ov.querySelector('.rt-marker');
    const t0 = performance.now();
    let raf;
    const tickFn = (tm) => {
      const ph = ((tm - t0) % (period * 2)) / period;
      const pos = ph <= 1 ? ph : 2 - ph;
      marker.style.left = (pos * 100) + '%';
      raf = requestAnimationFrame(tickFn);
    };
    raf = requestAnimationFrame(tickFn);
    ov.querySelector('#rtStop').addEventListener('click', () => {
      cancelAnimationFrame(raf);
      const left = parseFloat(marker.style.left) || 0;
      ov.remove();
      cb(Math.abs(left - 50) <= zone);
    });
  }

  /* ============================================================
     PLAYTEST 17 · GRUP F/22 — KUMARBAZ: YAZI-TURA SEKANSI
     Kumarbaz her tur başında sessizce zar atıyordu; sonuç yalnız açılım
     onaylanınca, çarpan satırında küçük bir not olarak görünüyordu.
     Oyuncu turu PLANLARKEN ×2 mi ×0.5 mi olduğunu bilmiyor, dolayısıyla
     jokerin bütün duygusu (kumar) kayboluyordu.
     Sekans, Ritim ve Pandora ritüelleriyle aynı dili kullanır: kısa bir
     havaya atış → dönen para → sonucun net okunduğu bir yüz. Tıklanınca
     atlanır, süresi dolunca kendiliğinden kapanır.

     PLAYTEST 18 (kullanıcı geri bildirimi 2026-08-28) — SEKANS ÇOK HIZLI
     GEÇİYORDU. Ölçüm: para 1250 ms dönüyor, sonuç yazısı 250 ms'de
     belirdiği için 1500 ms'de tam okunur oluyor, kutu ise 2200 ms'de
     kapanıyordu → oyuncunun ×2 mi ×0.5 mi aldığını okumak için yalnızca
     ~700 ms'si vardı. Jokerin bütün mesajı o tek satırda olduğu için
     sekans "bir şey oldu ama ne?" hissi bırakıyordu.
     Düzeltme, süreyi tek yerden yönetilen iki sabite bağlar:
       KUMAR_SPIN — paranın dönüş süresi (CSS animasyonu da bunu okur,
                    ikisi birbirinden ayrı düşemesin diye değişkenle geçilir)
       KUMAR_HOLD — sonuç göründükten SONRA ekranda kalma süresi
     Yeni değerlerle okuma süresi ~700 ms → ~2400 ms (3.4 katı). Sekans her
     TUR tetiklendiği için daha da uzatılmadı; acelesi olan tıklayıp anında
     geçebilir (kutu zaten "geçmek için tıkla" diyor).
     ============================================================ */
  const KUMAR_SPIN = 1600;   // paranın havada dönüş süresi (ms)
  const KUMAR_HOLD = 2400;   // sonuç okunabilir kaldığı süre (ms)

  /* ============================================================
     PLAYTEST 26 · MADDE B — ÜÇÜNCÜ YÜZ: PARA DİK DURUYOR (1/37 · ×35)
     Nadir olay ancak FARK EDİLİRSE nadir hissettirir. Yazı ve tura aynı
     1600 ms'lik ritimle geldiği için dik durma da o ritimle gelseydi
     oyuncu ×35'i sonuç satırını okuyana kadar anlamazdı. Bu yüzden dik
     durma sekansı üç yerden birden ayrışır:
       · SÜRE — para 2800 ms döner (1600 yerine): son yarım turda gözle
         görülür biçimde YAVAŞLAR, "duracak mı, düşecek mi" boşluğu doğar.
       · DURUŞ — 5.25 tur (1890°) sonunda 90°'de kalır; iki yüz de kenara
         döndüğü için ekranda ince, dik bir disk kalır (.km-edge).
       · SES + IŞIK — SFX.jackpot yükselen bir arpej çalar, kutu ve para
         altın bir nabızla parlar, sonuç 3600 ms okunur kalır.
     ============================================================ */
  const KUMAR_SPIN_EDGE = 2800;  // dik durmada dönüş daha uzun ve yavaşlar
  const KUMAR_HOLD_EDGE = 3600;  // ×35 satırı ekranda daha uzun kalır

  function showCoinFlip(roll, done, edge) {
    const win = roll >= 2;
    const spin = edge ? KUMAR_SPIN_EDGE : KUMAR_SPIN;
    const hold = edge ? KUMAR_HOLD_EDGE : KUMAR_HOLD;
    /* Turlar hızlı ilerlerse ikinci bir atış öncekinin üstüne binebilir;
       sekans uzadığı için bu ihtimal arttı → önceki kutu devralınır. */
    const prev = document.getElementById('kumarOv');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.id = 'kumarOv';
    if (edge) ov.classList.add('km-edge-run');
    ov.style.setProperty('--km-spin', spin + 'ms');
    ov.innerHTML =
      `<div class="km-box">` +
      `<h3>${t(edge ? 'kumarEdgeTitle' : 'kumarTitle')}</h3>` +
      `<div class="km-coin"><span class="km-face km-heads">${t('kumarHeads')}</span>` +
      `<span class="km-face km-tails">${t('kumarTails')}</span>` +
      `<span class="km-edge">${t('kumarEdgeFace')}</span></div>` +
      `<div class="km-result ${edge ? 'edge' : (win ? 'win' : 'lose')}">` +
      `${t(edge ? 'kumarEdge' : (win ? 'kumarWin' : 'kumarLose'))}</div>` +
      `<div class="km-skip">${t('obSkip')}</div>` +
      `</div>`;
    document.body.appendChild(ov);
    const coin = ov.querySelector('.km-coin');
    /* Para 5 tam tur döner ve YAZI (×2) ya da TURA (×0.5) yüzünde durur.
       Yarım tur = 180°, dolayısıyla kayıp yüzü için +180° eklenir.
       DİK DURMA: 5.25 tur → 90°, iki yüz de kenara döner (bkz. .km-edge). */
    coin.style.setProperty('--km-end', (edge ? 5 * 360 + 90 : 5 * 360 + (win ? 0 : 180)) + 'deg');
    requestAnimationFrame(() => ov.classList.add('spin'));
    /* Sonuç, para TAM DURDUĞU anda açılır (eskiden dönüş bitmeden 1250'de
       başlıyordu) — böylece yüz ile yazı aynı anı işaret eder. */
    const tLand = setTimeout(() => {
      ov.classList.add('landed');
      if (edge) SFX.jackpot(); else SFX.tick();
    }, spin);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearTimeout(tLand); clearTimeout(tClose);
      ov.remove();
      if (done) done();
    };
    ov.addEventListener('click', close);
    const tClose = setTimeout(close, spin + hold);
  }

  /* Bekleyen yazı-tura varsa göster. render() içinden çağrılır; motor
     sonucu BİR KEZ teslim ettiği için tekrar tetiklenmez. */
  function maybeCoinFlip() {
    if (!Game.takeKumarbazFlip) return;
    const f = Game.takeKumarbazFlip();
    if (f) { SFX.tick(); showCoinFlip(f.roll, null, !!f.edge); }
  }

  /* ============================================================
     PANDORA'NIN KUTUSU (PLAYTEST 11 · GRUP F)
     Kutu ele ilk geldiğinde açılır: kapalı kutu sallanır, patlar ve
     içinden çıkan varyantın kartı büyüyerek belirir. Paket/ödül
     çarklarıyla aynı ritüel dilini kullanır (sarsıntı → patlama → altın
     çerçeveli sonuç), ama daha kısa: bu bir kumar değil, bir AÇILIŞTIR.
     ============================================================ */
  function showPandoraReveal(info, done) {
    const ov = document.createElement('div');
    ov.id = 'pandoraOv';
    ov.innerHTML =
      `<div class="pd-box">` +
      `<div class="pd-lid">📦</div>` +
      `<div class="pd-burst"></div>` +
      `<div class="pd-card">` +
      `<div class="pd-icon">${info.icon}</div>` +
      `<div class="pd-name">${T.ev(info.name)}</div>` +
      `<div class="pd-desc">${T.ev(info.desc)}</div>` +
      `</div>` +
      `<div class="pd-tag">${t('pandoraOpened')}</div>` +
      `</div>`;
    document.body.appendChild(ov);
    SFX.tick();
    setTimeout(() => { ov.classList.add('bursting'); SFX.crack(); }, 620);
    setTimeout(() => { ov.classList.add('revealed'); SFX.win(); }, 900);
    const close = () => {
      if (!ov.parentElement) return;
      ov.classList.add('closing');
      setTimeout(() => { ov.remove(); if (done) done(); }, 260);
    };
    ov.addEventListener('click', () => { if (ov.classList.contains('revealed')) close(); });
    setTimeout(close, 4200);
  }

  /* Açılmamış kutu var mı? Motor bir kez bildirir, biz sahneyi gösteririz. */
  function checkPandora() {
    if (!Game.takePandoraReveal) return false;
    const info = Game.takePandoraReveal();
    if (!info) return false;
    showPandoraReveal(info, () => render());
    return true;
  }

  /* ---------- Füzyon seçici (GDD 9) ---------- */

  /* ============================================================
     PLAYTEST 10 · GRUP A — JOKER ELE GEÇTİĞİNDE ÇALIŞAN TEK KANCA
     Joker edinmenin beş ayrı yolu var (store'dan al, hedef seçerek al,
     paket seçimi, paket içeriği, Prometheus bedava alım). Kurulum gerektiren
     jokerlerin pop-up'ı bu yolların her birine ayrı ayrı yazılmıştı; biri
     unutulunca joker sessizce kuruluşsuz kalıyordu. Artık hepsi buradan
     geçer.
     Füzyon için kullanıcı kararı: "slotta bekleyip istediğinde kullan"
     DEĞİL — ele geçtiği ANDA birleştirme seçicisi açılır. Backup'a düşse
     bile açılır (Grup A bug'ı: backup'taki Füzyon kullanılamıyordu).
     ============================================================ */
  function onJokerGained(key, jokerId) {
    if (!key) return;
    if (key === 'terzi') { pickTerziColor(jokerId); return; }
    if (key === 'fuzyon') {
      /* PLAYTEST 19 · GRUP E — artık doğrudan birleştirme ekranı açılmaz;
         önce "ne yapalım?" menüsü gelir (Ana Slot / Backup / Kullan). */
      setTimeout(() => fuzyonMenu(jokerId), 60);
    }
  }

  /* ============================================================
     PLAYTEST 19 · GRUP E — FÜZYON KULLANIM MENÜSÜ (kullanıcı isteği)
     Füzyon ele girdiğinde artık üç yol vardır:
       • "Kullan (Birleştir)"  → birleştirme ekranı hemen açılır
       • "Ana Slota Ekle"       → joker rafta bekler, sonra da kullanılabilir
       • "Backup Slota Ekle"    → aynısı, backup rafta
     Dolu raf seçeneği pasif gösterilir (gizlenmez — oyuncu neden
     seçemediğini görsün). Hiçbir seçenek açık değilse Füzyon bekleyen
     eylem olarak kalır (aksiyon barındaki "⚗ Füzyon" düğmesi geri çağırır).
     ============================================================ */
  function fuzyonMenu(fuzyonId) {
    const d = Game.fuzyonDests ? Game.fuzyonDests() : { main: false, backup: false, fuse: true };
    const ov = document.createElement('div');
    ov.id = 'fuzyonMenu';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('fzTitle')}</h3>` +
      `<p>${t('fzMenuBody')}</p>` +
      `<div class="fzm-row">` +
        `<button class="btn fzm-use" id="fzmUse"${d.fuse ? '' : ' disabled'}>${t('fzMenuUse')}</button>` +
        `<button class="btn" id="fzmMain"${d.main ? '' : ' disabled'}>${t('fzMenuMain')}</button>` +
        `<button class="btn" id="fzmBackup"${d.backup ? '' : ' disabled'}>${t('fzMenuBackup')}</button>` +
      `</div>` +
      (d.fuse ? '' : `<p class="fzm-note">${t('fzNeed')}</p>`) +
      `<button class="btn ghost" id="fzmLater">${t('fzLater')}</button></div>`;
    const close = () => ov.remove();
    ov.querySelector('#fzmUse').addEventListener('click', () => {
      close();
      pickFuzyon(fuzyonId, true);
    });
    const place = (dest) => {
      const r = Game.placeFuzyon(dest);
      close();
      if (!r.ok) { toast(r.error); return; }
      toast(t(dest === 'main' ? 'fzPutMain' : 'fzPutBackup'), true);
      SFX.coin();
      if (storeOpen()) renderStore();
      render();
    };
    ov.querySelector('#fzmMain').addEventListener('click', () => place('main'));
    ov.querySelector('#fzmBackup').addEventListener('click', () => place('backup'));
    ov.querySelector('#fzmLater').addEventListener('click', close);
    document.body.appendChild(ov);
  }

  /* PLAYTEST 10 · GRUP A — adaylar ana slot + BACKUP.
     Füzyon backup'a düştüğünde kullanılamıyordu; artık hangi rafta olursa
     olsun çalışır ve backup'taki jokerler de birleşmeye girebilir.
     `auto` true ise seçici Füzyon ELE GEÇTİĞİ AN açılmıştır (kullanıcı
     kararı: "slotta bekleyip istediğinde kullan" yerine anında sor). */
  function pickFuzyon(fuzyonId, auto = false) {
    const cands = Game.fusableJokers().filter(j => j.id !== fuzyonId && j.key !== 'fuzyon');
    if (cands.length < 2) { toast(t('fzNeed')); return; }
    let keepId = null;
    const ov = document.createElement('div');
    ov.id = 'fuzyonPick';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('fzTitle')}</h3>` +
      (auto ? `<p class="fz-auto">${t('fzAuto')}</p>` : '') +
      `<p id="fzStep">${t('fzStep1')}</p>` +
      `<div class="fz-row"></div>` +
      /* PLAYTEST 26 · GRUP E1 — SEÇİMİ GERİ AL.
         Eskiden ilk (KALACAK) joker seçildikten sonra geri dönüş yoktu:
         tek çıkış "Vazgeç"ti, o da ekranı tamamen kapatıyordu. Bu düğme
         yalnız 1. adım tamamlandıktan sonra görünür ve seçimi 1. adıma
         geri alır — birleştirme henüz yapılmadığı için motora dokunmaz. */
      `<button class="btn fz-undo hidden" id="fzUndo">${t('fzUndo')}</button>` +
      `<button class="btn ghost" id="fzCancel">${t(auto ? 'fzLater' : 'fzCancel')}</button></div>`;
    const row = ov.querySelector('.fz-row');
    const undoBtn = ov.querySelector('#fzUndo');
    const resetPick = () => {
      keepId = null;
      row.querySelectorAll('.fz-opt.picked').forEach(b => b.classList.remove('picked'));
      ov.querySelector('#fzStep').innerHTML = t('fzStep1');
      undoBtn.classList.add('hidden');
    };
    undoBtn.addEventListener('click', () => { resetPick(); toast(t('fzUndone'), true); });
    cands.forEach(j => {
      const b = document.createElement('button');
      const inBackup = Game.state.backup.some(x => x.id === j.id);
      b.className = `fz-opt r-${j.rarity}` + (inBackup ? ' fz-backup' : '');
      b.innerHTML = `<b>${T.name(j)}</b><span>${Game.isRunLong(j) ? t('tipUsesRun') : t('fzRounds', j.usesLeft)}`
        + (inBackup ? ` · ${t('fzInBackup')}` : '') + `</span>`;
      b.addEventListener('click', () => {
        if (!keepId) {
          keepId = j.id;
          b.classList.add('picked');
          ov.querySelector('#fzStep').innerHTML = t('fzStep2');
          undoBtn.classList.remove('hidden');
        } else if (j.id === keepId) {
          /* Seçili karta yeniden basmak da seçimi geri alır — düğmeyi
             görmeyen oyuncu için ikinci, sezgisel yol. */
          resetPick();
        } else if (j.id !== keepId) {
          const r = Game.fuseJokers(fuzyonId, keepId, j.id);
          ov.remove();
          if (!r.ok) { toast(r.error); return; }
          toast(r.note, true);
          SFX.coin();
          if (storeOpen()) renderStore();
          render();
        }
      });
      row.appendChild(b);
    });
    ov.querySelector('#fzCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* Terzi — satın alınınca 4 renkten biri seçtirilir (GDD 9) */
  function pickTerziColor(jokerId) {
    const ov = document.createElement('div');
    ov.id = 'terziPick';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('terziTitle')}</h3>` +
      `<p>${t('terziBody')}</p>` +
      `<div class="tp-row"></div></div>`;
    const row = ov.querySelector('.tp-row');
    for (const c of COLORS) {
      const b = document.createElement('button');
      b.className = `tp-color ${c}`;
      b.textContent = T.color(c);
      b.addEventListener('click', () => {
        Game.setTerziColor(jokerId, c);
        ov.remove();
        toast(t('terziDone', T.color(c)), true);
        if (storeOpen()) renderStore();
        render();
      });
      row.appendChild(b);
    }
    document.body.appendChild(ov);
  }

  /* Grup A — işlemede okey iki uca da oturabiliyorsa hangi taşın yerine
     geçeceğini oyuncu seçer (ıstakadaki konum tepside anlam taşımıyor). */
  function pickOkeySlot(choices, cb) {
    const ov = document.createElement('div');
    ov.id = 'okeySlotPick';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('okeySlotTitle')}</h3>` +
      `<p>${t('okeySlotBody')}</p><div class="tp-row"></div>` +
      `<button class="btn ghost" id="osCancel">${t('fzCancel')}</button></div>`;
    const row = ov.querySelector('.tp-row');
    choices.forEach(ch => {
      const b = document.createElement('button');
      b.className = 'tp-color okey-slot-opt';
      b.textContent = ch.label;
      b.addEventListener('click', () => { ov.remove(); cb(ch.start); });
      row.appendChild(b);
    });
    ov.querySelector('#osCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* Raund başı akışı tek noktadan: bildirimler + tetiklenen pop-up'lar.
     (Grup A) Şeytan'ın feda anı ve Tüccar'ın takas teklifi artık bildirim
     satırı değil, gerçek modal olarak önüne gelir. */
  function flushRoundStart() {
    const s = Game.state;
    notify(s.roundStartNotes);
    cheatFlash();   // Grup G (P19) — raundun ilk turundaki hile de duyurulsun
    s.roundStartNotes = [];
    if (s.seytanPending) { showSeytanPop(s.seytanPending); s.seytanPending = null; }
    /* Grup F: Boşluk artık sessiz çalışmıyor — ne yuttuğunu ve ne
       kazandırdığını gösteren bir pop-up açar. */
    if (s.voidPending) { showVoidPop(s.voidPending); s.voidPending = null; }
    // Grup F/22 — raundun ilk turunun yazı-turası, teklif pop-up'ından ÖNCE
    maybeCoinFlip();
    if (s.tuccarOffer) setTimeout(() => { if (Game.state.tuccarOffer) showTuccarOffer(); }, 620);
  }

  /* Tüccar takas teklifi (GDD 10, Grup A5) — raund başında NET bir pop-up.
     Eskiden ipucu satırının yanına gömülü tek bir "kabul" butonuydu; tek
     seçenek gerçek bir karar sunmadığı için havuzdan 2 farklı teklif + net
     bir "Reddet" gösteriliyor. 2 üst üste reddediş Tüccar'ı gönderir. */
  function showTuccarOffer() {
    const s = Game.state;
    if (!s.tuccarOffer) return;
    document.getElementById('tuccarPop')?.remove();
    // Grup F: boss varyantında reddetme hakkı yok — "Reddet" cezayı seçer
    const isBoss = !!s.tuccarOffer.boss;
    /* Playtest 17 · Grup B/11 — sabır eşiği motordan okunur (2 → 4;
       teklif artık her TUR geldiği için eşik tur ölçeğine çekildi). */
    const maxRef = (typeof TUCCAR_MAX_REFUSE !== 'undefined') ? TUCCAR_MAX_REFUSE : 4;
    const left = Math.max(0, maxRef - (Game.slotRecs().find(j => j.key === 'tuccar')?.refuseStreak || 0));
    let lastPicked = s.tuccarOffer.options[0]?.key;
    const ov = document.createElement('div');
    ov.id = 'tuccarPop';
    ov.className = 'offer-pop';
    ov.innerHTML =
      `<div class="tp-box offer-box${isBoss ? ' boss-box' : ''}">` +
      `<h3>${isBoss ? t('tuccarBossTitle') : t('tuccarTitle')}</h3>` +
      `<p class="offer-sub">${isBoss ? t('tuccarBossSub') : t('tuccarSub')}</p>` +
      `<div class="offer-opts"></div>` +
      `<div class="offer-foot">` +
      `<button class="btn ghost" id="tucNo">${isBoss ? t('tuccarBossRefuse') : t('tuccarRefuse')}</button>` +
      `<span class="offer-warn">${isBoss ? t('tuccarBossWarn')
        : (left <= 1 ? t('tuccarLast') : t('tuccarWarn', left))}</span>` +
      `</div></div>`;
    const opts = ov.querySelector('.offer-opts');
    for (const o of s.tuccarOffer.options) {
      const b = document.createElement('button');
      b.className = 'offer-opt';
      b.innerHTML = `<span class="oo-cost">${t('tuccarCost', o.cost, COIN)}</span>` +
        `<span class="oo-text">${T.ev(o.text)}</span>`;
      // boss'ta hangi teklifin cezasını yiyeceğin belli olsun: üzerine gelince seçilir
      b.addEventListener('mouseenter', () => {
        lastPicked = o.key;
        opts.querySelectorAll('.offer-opt').forEach(x => x.classList.remove('aimed'));
        if (isBoss) b.classList.add('aimed');
      });
      b.addEventListener('click', () => {
        const r = Game.acceptTuccar(o.key);
        if (!r.ok) { toast(r.error); return; }
        ov.remove();
        toast(T.ev(r.note), true);
        SFX.coin();
        render();
      });
      opts.appendChild(b);
    }
    ov.querySelector('#tucNo').addEventListener('click', () => {
      const r = Game.refuseTuccar(isBoss ? lastPicked : undefined);
      ov.remove();
      if (r.note) toast(T.ev(r.note), !r.gone && !r.penalty);
      render();
    });
    document.body.appendChild(ov);
  }

  /* Şeytan'ın Teklifi (GDD 12, Grup A4) — feda anı net bir pop-up olarak
     gösterilir; eskiden yalnız bir bildirim satırıydı ve fark edilmiyordu. */
  function showSeytanPop(info) {
    document.getElementById('seytanPop')?.remove();
    const ov = document.createElement('div');
    ov.id = 'seytanPop';
    ov.className = 'offer-pop';
    ov.innerHTML =
      `<div class="tp-box offer-box seytan-box"><h3>${t('seytanTitle')}</h3>` +
      `<p>${t('seytanBody', info.coins, info.score, info.mult.toFixed(1))}</p>` +
      `<div class="offer-foot"><button class="btn primary" id="syOk">${t('seytanBtn')}</button></div></div>`;
    ov.querySelector('#syOk').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* Boşluk (Void) — raund başında ne olduğunu gösteren pop-up (Grup F).
     Şeytan'ın Teklifi ile birebir aynı desen: aynı kabuk, aynı akış. */
  function showVoidPop(info) {
    document.getElementById('voidPop')?.remove();
    const ov = document.createElement('div');
    ov.id = 'voidPop';
    ov.className = 'offer-pop';
    ov.innerHTML =
      `<div class="tp-box offer-box void-box"><h3>${t('voidTitle')}</h3>` +
      `<p>${t('voidBody', info.tiles, info.score, info.mult.toFixed(2), info.drew)}</p>` +
      `<div class="offer-foot"><button class="btn primary" id="vdOk">${t('voidBtn')}</button></div></div>`;
    ov.querySelector('#vdOk').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
    SFX.coin?.();
  }

  /* Tüketilebilir kartı (Grup K v2 — hedefli kullanım destekli) */
  let consumPick = null; // { index, key } — elden taş seçme modu
  /* PLAYTEST 20 · GRUP A — Terazi artık ayrı bir "seçim modu" DEĞİL.
     Taş atma aşamasında zaten bir taş seçiyorsun; "Taş Feda Et" düğmesi
     o seçili taşı feda eder. Bayrak eski çağrı yollarını kırmamak için
     duruyor ama hep false kalır. */
  let teraziPick = false;
  let teraziSel = null;   // "Taş Feda Et" düğmesinin hedefi (tek seçili taş)
  let paratonerSel = null;  // P29 · Grup F — "Yem Seç" düğmesinin hedefi

  function finishConsum(res) {
    if (!res.ok) { toast(res.error || t('useFail')); render(); return; }
    toast(res.note, true);
    SFX.coin();
    render();
    if (storeOpen()) renderStore();
  }

  /* Boya Kabı: taş seçildikten sonra yeni renk sorulur (Terzi popup deseni) */
  function pickConsumColor(cp, tileId) {
    const ov = document.createElement('div');
    ov.id = 'terziPick';
    ov.innerHTML =
      `<div class="tp-box"><h3>🎨 ${T.consumName('boya', CONSUMABLES.boya.name)}</h3>` +
      `<p>${t('consumPickColor')}</p>` +
      `<div class="tp-row"></div>` +
      `<div class="tr-row"><button class="btn ghost" id="cpCancel">${t('cancel')}</button></div></div>`;
    const row = ov.querySelector('.tp-row');
    for (const c of COLORS) {
      const b = document.createElement('button');
      b.className = `tp-color ${c}`;
      b.textContent = T.color(c);
      b.addEventListener('click', () => {
        ov.remove();
        finishConsum(Game.useConsumable(cp.index, { tileId, color: c }));
      });
      row.appendChild(b);
    }
    ov.querySelector('#cpCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* Zaman Kumu: sahip olunan jokerlerden biri seçilir */
  function pickConsumJoker(index, def) {
    const s = Game.state;
    /* Klon Şişesi yalnız ANA SLOT jokerini kopyalayabilir; Zaman Kumu ise
       süresi olan her jokeri uzatır ("run boyunca" yaşayanlar hariç). */
    const all = def.key === 'klonSisesi'
      ? [...s.jokers]
      : [...s.jokers, ...s.backup, ...s.deckJokers].filter(j => !Game.isRunLong(j));
    if (!all.length) { toast(t('consumNoJoker')); return; }
    const ov = document.createElement('div');
    ov.id = 'terziPick';
    ov.innerHTML =
      `<div class="tp-box"><h3>${def.icon} ${T.consumName(def.key, def.name)}</h3>` +
      `<p>${t('consumPickJoker')}</p>` +
      `<div class="tp-row" style="flex-wrap:wrap"></div>` +
      `<div class="tr-row"><button class="btn ghost" id="cjCancel">${t('cancel')}</button></div></div>`;
    const row = ov.querySelector('.tp-row');
    for (const j of all) {
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = `${T.name(j)} (${Game.isRunLong(j) ? '∞' : j.usesLeft})`;
      b.addEventListener('click', () => {
        ov.remove();
        finishConsum(Game.useConsumable(index, { jokerId: j.id }));
      });
      row.appendChild(b);
    }
    ov.querySelector('#cjCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* PLAYTEST 29 · GRUP O — STORE'DA "BİR TAŞ SEÇ".
     Raund dışında (store'da) taş hedefli bir değnek kullanılmak
     istendiğinde motor deste bileşiminden rastgele 10 taş sunar
     (`Game.rollStoreTiles`); oyuncu bunlardan birini seçer. Seçim
     ıstakadan DEĞİLDİR — store'da el yoktur — ama taşlar ıstakadakiyle
     aynı görselle çizilir ki oyuncu neye baktığını bilsin.
     Boya Kabı gibi renk de soran değneklerde akış ikinci bir adıma
     (pickConsumColor) devam eder; raund içi akışın aynısı. */
  function pickStoreTile(index, def) {
    const first = Game.useConsumable(index);   // hedefsiz çağrı listeyi çeker
    if (first.ok) { finishConsum(first); return; }
    const opts = Game.storeTileOptions();
    if (!opts.length) { toast(first.error || t('useFail')); return; }
    const ov = document.createElement('div');
    ov.id = 'terziPick';
    ov.className = 'store-tile-pick';
    ov.innerHTML =
      `<div class="tp-box"><h3>${def.icon} ${T.consumName(def.key, def.name)}</h3>` +
      `<p>${t('storePickTile')}</p>` +
      `<div class="tp-tiles"></div>` +
      `<div class="tr-row"><button class="btn ghost" id="stCancel">${t('cancel')}</button></div></div>`;
    const row = ov.querySelector('.tp-tiles');
    for (const o2 of opts) {
      const wrap = document.createElement('div');
      wrap.className = 'st-opt';
      wrap.appendChild(tileEl(o2, false));
      wrap.addEventListener('click', () => {
        ov.remove();
        if (def.target === 'tileColor') { pickConsumColor({ index }, o2.id); return; }
        finishConsum(Game.useConsumable(index, { tileId: o2.id }));
      });
      row.appendChild(wrap);
    }
    ov.querySelector('#stCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* opts.sell — "Sat" butonu çizilsin mi? Yalnız STORE panelindeki değnek
     rafı true geçer. `storeOpen()` ile karar VERİLEMEZ: `openStore()` önce
     renderStore(), sonra openScene() çağırıyor, yani ilk çizimde overlay
     hâlâ gizli görünür ve buton hiç basılmazdı. */
  function consumCard(key, index, opts = {}) {
    const def = CONSUMABLES[key];
    const d = document.createElement('div');
    /* Değnek kartı da aynı kalıp — o da her render'da yeniden doğuyordu.
       Kimlik anahtar + slot: kart yer değiştirmediği sürece bir daha
       giriş animasyonu oynamaz. */
    const cid = key + ':' + index;
    const csNew = !consumSeen.has(cid);
    if (csNew) consumSeen.add(cid);
    d.className = 'consum-card' + (csNew ? ' cs-enter' : '')
      + (consumPick && consumPick.index === index ? ' picking' : '');
    /* Değnek görseli (2026-09-09): çizimi hazır olan değnek envanter
       kartında da Figma varlığıyla görünür (CONSUM_ART → .cs-<key>, yol
       style.css'te). Çizimi henüz gelmemiş olan emoji ikonuyla kalır. */
    const art = CONSUM_ART.has(key);
    d.innerHTML =
      `<span class="c-icon${art ? ' cs-art cs-' + key : ''}">${art ? '' : def.icon}</span>` +
      `<div class="c-body"><b>${T.consumName(key, def.name)}</b><span>${T.consumDesc(key, def.desc)}</span></div>`;
    attachTip(d, { name: T.consumName(key, def.name),
      rarityText: `${T.rarity(def.rarity || 'common')} · ${t('consumTag')}`,
      accent: def.rarity || 'common',
      desc: T.consumDesc(key, def.desc) }, {});
    const btn = document.createElement('button');
    btn.className = 'c-use';
    btn.textContent = consumPick && consumPick.index === index ? t('cancel') : t('useBtn');
    btn.addEventListener('click', () => {
      if (consumPick && consumPick.index === index) { consumPick = null; render(); return; }
      if (def.target === 'joker') { pickConsumJoker(index, def); return; }
      if (def.target === 'tile' || def.target === 'tileColor') {
        /* P29 · Grup O — store'da artık kullanılabilir: el yerine deste
           bileşiminden rastgele 10 taş sunulur. Raund İÇİNDE store açıksa
           da aynı yol işler (store paneli ıstakayı kapatıyor). */
        if (Game.state.status !== 'playing' || storeOpen()) { pickStoreTile(index, def); return; }
        consumPick = { index, key };
        toast(t('consumPickTile', T.consumName(key, def.name)), true);
        render();
        return;
      }
      finishConsum(Game.useConsumable(index));
    });
    d.appendChild(btn);
    /* GRUP C (P22) — DEĞNEK SATIŞI.
       Yalnız STORE panelinde çizilir: satış joker tarafında da store'a bağlı
       bir işlem ve raund ortasında coin basmak dengeyi bozardı. */
    if (opts.sell) {
      const sb = document.createElement('button');
      sb.className = 'c-sell';
      sb.innerHTML = t('sellConsumBtn', Game.consumSellPrice(key), COIN);
      sb.addEventListener('click', () => {
        const res = Game.sellConsumable(index);
        if (!res.ok) { toast(res.error || t('sellConsumFail')); return; }
        toast(t('sellToast', T.consumName(res.key, res.name), res.gain), true);
        SFX.coin(); renderStore(); render();
      });
      d.appendChild(sb);
    }
    return d;
  }

  function render() {
    const s = Game.state;
    hideTip(); // hover'daki eleman yeniden çizimde kaybolabilir
    /* PLAYTEST 9 · GRUP D (bug) — SEÇİM BUDAMASI.
       `selection` taş ID'si tutar; eldeki taş başka bir yolla elden çıkarsa
       (Okey'i Al takası, tüketilebilir, boss efekti, deste jokeri) ID
       seçimde ASILI KALIYOR ve bir sonraki "Aç" → stageCombo'da
       "Seçim geçersiz." hatasına düşüyordu (id hand'de bulunamıyor).
       Kök neden buydu: okey geri alındıktan sonra açılım yapılamaması.
       Artık her çizimde seçim, elde GERÇEKTEN duran taşlara indirgenir. */
    if (selection.size && Array.isArray(s.hand)) {
      const inHand = new Set(s.hand.map(t => t.id));
      for (const id of [...selection]) if (!inHand.has(id)) selection.delete(id);
    }
    syncOwnedEver(); // "YENİ!" rozeti için sahiplik geçmişi güncel tutulur

    /* Figma düzeni (2026-08-23): çipte artık "Stage 1/8 · Raund 1" değil
       RAUND ADI (Gösterge Eli / Çanak Eli) — boss raundunda BOSS ADI —
       yazar; stage ve raund sayaçları kendi kutularında. */
    el.roundChip.textContent = Game.isBossRound()
      ? T.bossName(s.boss.key, s.boss.name)
      : t(s.roundInStage === 1 ? 'normal1' : 'normal2');
    el.stageVal.textContent = `${s.stage}/${chCount()}`;
    el.roundVal.textContent = `${s.roundInStage}/3`;
    el.coinVal.textContent = s.coins;   // Figma: "$" ayrı katman, ikon yok
    /* Figma: sol alttaki OKEY bloğu — başlık ayrı, kutuda GERÇEK TAŞ
       görseli durur (mini çip değil), böylece oyuncu ıstakadaki okeyle
       birebir aynı yüzü görür. */
    el.okeyChip.innerHTML = '';
    const okeyFaceTile = { id: -1, color: s.okey.color, number: s.okey.number, isOkeyReal: true };
    el.okeyChip.appendChild(tileEl(okeyFaceTile, false));
    el.okeyChip.title = `${t('okeyChip')} ${okeyLabel()}`;
    if (Game.isBossRound()) {
      const bn = T.bossName(s.boss.key, s.boss.name), bd = T.bossDesc(s.boss.key, s.boss.desc);
      el.bossChip.textContent = `⚔ ${bn}`;
      el.bossChip.title = bd;
      el.bossChip.classList.remove('hidden');
      let bossHtml = `<span class="bb-name">${t('bossBanner', bn)}</span><span class="bb-desc">${bd}</span>`;
      if (s.boss.key === 'kelebek' && s.bossBan)
        bossHtml += `<span class="bb-extra">${t('bossBanExtra', T.typeName(s.bossBan))}</span>`;
      /* GRUP B/1 (P20): sınır artık üst şeritteki #fatalityChip'te yazar —
         burada ikinci kez yazılmaz. */
      /* Grup G (P19) — The Cheating artık "telegraflı" bir tehdit: bu tur ne
         DENEYECEĞİ ve şimdiye kadar kaç denemesinin tuttuğu banner'da canlı
         durur, yani oyuncu turu ona göre planlayabilir. */
      if (s.boss.key === 'cheating') {
        if (s.bossCheatPlan)
          bossHtml += `<span class="bb-extra bb-cheat">${t('bossCheatPlan',
            t('bossCheatKind_' + s.bossCheatPlan.kind),
            Math.round((s.bossCheatPlan.chance || 0.5) * 100))}</span>`;
        if (s.bossCheatStats && s.bossCheatStats.tries)
          bossHtml += `<span class="bb-extra">${t('bossCheatStats',
            s.bossCheatStats.hits, s.bossCheatStats.tries)}</span>`;
        /* GRUP G (P20) — kaç taş çaldığı somut sayaç olarak yazar */
        if (s.bossCheatTook)
          bossHtml += `<span class="bb-extra">${t('bossCheatTook', s.bossCheatTook)}</span>`;
      }
      /* Grup F — tur tur değişen boss durumları banner'da CANLI görünsün;
         yoksa oyuncu neden ceza yediğini banner'daki sabit metinden anlayamaz. */
      if (s.boss.key === 'kahin' && s.bossOracle)
        bossHtml += `<span class="bb-extra">${t('bossOracleExtra', T.ev(s.bossOracle.text))}</span>`;
      if (s.boss.key === 'avukat' && s.bossMutedJoker) {
        const mj = Game.slotRecs().find(j => j.key === s.bossMutedJoker);
        bossHtml += `<span class="bb-extra">${t('bossMutedExtra', mj ? T.name(mj) : s.bossMutedJoker)}</span>`;
      }
      if (s.boss.key === 'aynaKral' && (s.bossMirrorDebt || 0) > 0)
        bossHtml += `<span class="bb-extra">${t('bossMirrorExtra', s.bossMirrorDebt)}</span>`;
      if (s.boss.key === 'corporates' && s.corpTask)
        bossHtml += `<span class="bb-extra">${T.ev(s.corpTask.name)}: ${T.ev(s.corpTask.text)}` +
          `${s.corpTask.failed ? ' — ' + t('bossTaskFailed') : ''}</span>`;
      if (s.boss.key === 'freedom' && (s.bossFreedomMarks || []).length) {
        const owed = [...s.hand, ...s.discardPile].filter(x => x.ffMarkedTile && !x.ffUsedInMeld).length;
        bossHtml += `<span class="bb-extra">${t('bossFreedomExtra',
          s.bossFreedomMarks.map(m => `${T.color(m.color)} ${m.number}`).join(', '), owed)}</span>`;
      }
      /* Grup H — Sinsi Bulaşma: hangi taşların uzaylı olduğu GİZLİ, ama
         kaç tane olduğu banner'da canlı görünür (tehdidin okunabilir olması
         için; sürpriz taşın kimliğinde, sayısında değil). */
      if (s.boss.key === 'uzayli') {
        const n = s.hand.filter(x => x.hiddenAlien).length;
        bossHtml += `<span class="bb-extra">${t('bossAlienExtra', n)}</span>`;
      }
      /* PLAYTEST 16 · GRUP G — kutu sol menünün SAĞINDA, kendi sütununda
         durur (CSS'te absolute): metnin TAMAMI görünür, alttaki
         STAGE / RAUND / ÇARPAN kutuları hiç kaymaz.
         PLAYTEST 17 · GRUP A/2 (kullanıcı kararı 2026-08-28): kutu artık
         YANA GENİŞLEMİYOR. Genişlik 350px'te sabit, metin satır satır
         AŞAĞI akıyor; ikinci sütun mantığı ve onu tetikleyen taşma ölçümü
         tamamen kaldırıldı. */
      /* PLAYTEST 28 · GRUP F — FERMAN YAZILIYSA KOŞUL ÜSTÜ ÇİZİLİ DURUR.
         Banner GİZLENMEZ: boss hâlâ oradadır, ödülü de verecektir; iptal
         edilen tek şey koşuldur. Oyuncunun 20 coinlik kartının ne işe
         yaradığını GÖRMESİ gerekir, "boss kutusu yok oldu" değil "koşul
         iptal" okunmalı. Yukarıdaki tur-tur `bb-extra` satırları kendi
         kendine boş kalır — ferman kurulumu hiç çalıştırmadığı için
         `bossBan`, `corpTask`, `bossOracle` gibi alanların hiçbiri
         yazılmamıştır (bkz. engine _startRound). */
      if (s.bossVoided) {
        bossHtml = bossHtml.replace('class="bb-desc"', 'class="bb-desc bb-void"')
          + `<span class="bb-extra bb-ferman">${t('fermanBanner')}</span>`;
      }
      el.bossBanner.innerHTML = bossHtml;
      el.bossBanner.classList.remove('hidden', 'two-col');
      el.bossBanner.classList.toggle('boss-void', !!s.bossVoided);
    } else {
      el.bossChip.classList.add('hidden');
      el.bossBanner.classList.add('hidden');
    }
    /* Figma: tur sayacı yazı değil NOKTA dizisi (dolu = geçilen turlar).
       Tur sayısı Nefes İksiri ile artabildiği için nokta sayısı dinamik. */
    el.turnIndicator.innerHTML = `${t('turn')}<span class="gm-turn-dots">` +
      Array.from({ length: s.maxTurns }, (_, i) =>
        `<i class="${i < s.turn ? 'on' : ''}"></i>`).join('') + '</span>';
    el.turnIndicator.title = `${s.turn}/${s.maxTurns}`;
    el.scoreNow.textContent = s.score;
    el.scoreTarget.textContent = s.target;
    /* Grup L: ilerleme barı Figma'da yok, DOM'dan kaldırıldı. Eski
       kayıt/test yollarında eleman bulunmayabilir → koşullu. */
    if (el.progressFill) el.progressFill.style.width = Math.min(100, (s.score / s.target) * 100) + '%';
    /* PLAYTEST 19 · GRUP F — KALICI ÇARPAN ROZETİ OYUN EKRANINDAN KALDIRILDI
       (kullanıcı kararı). Rozet Figma tasarımında zaten yoktu; sol sütuna
       sonradan eklenmişti. Boss raundu gibi sütunun dolu olduğu ekranlarda
       (boss adı + açıklaması + raund puanı + STAGE + RAUND) en alta itiliyor,
       ekranın çok aşağısına kaçıyordu. Bilgi kaybolmuyor: kalıcı çarpan
       Run Info panelinde (Options / ℹ düğmesi, `riPerm` satırı), harita
       ekranında ve raund sonu özetinde görünmeye devam eder. */
    el.permMult.classList.add('hidden');

    // Joker panelleri
    el.slotCount.textContent = `${s.jokers.length}/${Game.slotCap()}`;  // Grup L: kapasite dinamik
    /* Masadan düşen kimlikleri unut: kart geri gelirse girişini yeniden
       oynar, küme de run boyunca şişmez (bkz. jokerSeen/consumSeen). */
    {
      const live = new Set([...s.jokers, ...s.backup, ...(s.deckJokers || [])]
        .map((x) => x && x.id));
      for (const id of jokerSeen) if (!live.has(id)) jokerSeen.delete(id);
      const liveC = new Set(s.consumables.map((k, i) => k + ':' + i));
      for (const c of consumSeen) if (!liveC.has(c)) consumSeen.delete(c);
    }
    el.jokerSlots.innerHTML = '';
    s.jokers.forEach(j => el.jokerSlots.appendChild(jokerCard(j)));
    /* PLAYTEST 20 · GRUP H (bug) — TACİR MEKTUBU SLOT AÇMIYOR GÖRÜNÜYORDU.
       KÖK NEDEN burasıydı ve MOTORDA DEĞİLDİ: `Game.slotCap()` değnek
       kullanılınca doğru şekilde 5 → 6 oluyor (üstteki sayaç metni de
       bunu yazıyordu), ama BOŞ SLOT çizimi sabit `i < 5` sayıyordu.
       Yani 6. slot ekranda hiç belirmiyor, oyuncu da "artmadı" görüyordu.
       Panel zaten sarmalayan bir ızgara (flex-wrap) olduğu için 6. kutu
       alt satıra kendiliğinden iner. */
    for (let i = s.jokers.length; i < Game.slotCap(); i++) {
      const d = document.createElement('div');
      d.className = 'joker-slot-empty';
      el.jokerSlots.appendChild(d);
    }
    el.backupCount.textContent = `${s.backup.length}/2`;
    el.backupSlots.innerHTML = '';
    s.backup.forEach(j => el.backupSlots.appendChild(jokerCard(j, { backup: true })));
    for (let i = s.backup.length; i < 2; i++) {
      const d = document.createElement('div');
      d.className = 'joker-slot-empty';
      el.backupSlots.appendChild(d);
    }
    shoulderSlots(el.backupSlots, 2);
    clampBadges(); // Grup G3 — kenardan taşan süre rozetlerini sola çevir

    // Tüketilebilir envanteri (GDD 6.5b)
    /* PLAYTEST 17 · GRUP A/8 — Değnek omzu KAPASİTE kadar slot çizer
       (eskiden boşken yalnız TEK boş kutu görünüyordu, doluyken de kapasite
       hiç okunmuyordu) ve slotlar sayıya göre ölçeklenir; Heybe Değneği ile
       4-5 slota çıkıldığında kartlar artık omuz görselinin dışına taşmaz. */
    const cap = Game.consumCap();
    el.consumCount.textContent = `${s.consumables.length}/${cap}`;
    el.consumRow.innerHTML = '';
    s.consumables.forEach((key, i) => el.consumRow.appendChild(consumCard(key, i)));
    for (let i = s.consumables.length; i < cap; i++) {
      const d = document.createElement('div');
      d.className = 'joker-slot-empty';
      el.consumRow.appendChild(d);
    }
    shoulderSlots(el.consumRow, cap);

    /* Grup C — omuz otomatiği: içerik ARTTIĞINDA kendiliğinden açılır
       (oyuncu yeni gelen kartı görsün), boşaldığında kendiliğinden
       kapanır. Oyuncunun elle yaptığı seçim aradaki turlarda korunur. */
    autoShoulder('backup', s.backup.length);
    autoShoulder('totem', s.consumables.length);   // iç anahtar: görünen ad değişse de sabit kalır

    // Istaka — SERBEST YERLEŞİMLİ 2×15 slot ızgarası (2026-07-09):
    // her taş kalıcı bir hücrede (t.slot) durur, boş hücreler bırakılabilir;
    // taşlar artık sola sıkıştırılmaz. Slotu olmayan/çakışan taşlar en
    // soldaki boş hücreye oturur (çekilen yeni taşlar dahil).
    const bySlot = new Map();
    for (const t2 of s.hand)
      if (Number.isInteger(t2.slot) && t2.slot >= 0 && t2.slot < RACK_CAP && !bySlot.has(t2.slot))
        bySlot.set(t2.slot, t2);
    let freeCur = 0;
    for (const t2 of s.hand) {
      if (bySlot.get(t2.slot) === t2) continue;
      while (bySlot.has(freeCur)) freeCur++;
      t2.slot = freeCur;
      bySlot.set(freeCur, t2);
    }
    // taş genişliği sabit 15 sütuna göre (satır iç genişliğinden)
    /* Figma ıstakası (2026-08-23): satır iç genişliği 1442 − 2×28 yatay
       dolgu, 15 hücre, 12px boşluk → taş 81px (tasarım ölçüsü). */
    const rowW = el.rackRow1.clientWidth || 1442;
    const wTw = Math.max(34, Math.min(81,
      Math.floor((rowW - 56 - (RACK_COLS - 1) * RACK_GAP) / RACK_COLS)));
    document.documentElement.style.setProperty('--tw', wTw + 'px');
    el.rackRow1.innerHTML = '';
    el.rackRow2.innerHTML = '';
    /* GRUP J (P20) — SERBEST DÜZEN (yalnız Trainer): boş hücre çizilmez,
       taşlar yan yana sıkışık durur. Klasik düzen aşağıdaki `else` dalında
       birebir korunur. */
    el.rack.classList.toggle('rack-free', freeRack());
    if (freeRack()) {
      const [r1, r2] = freeRows();
      r1.forEach(t2 => el.rackRow1.appendChild(tileEl(t2)));
      r2.forEach(t2 => el.rackRow2.appendChild(tileEl(t2)));
    } else {
      for (let i = 0; i < RACK_CAP; i++) {
        const row = i < RACK_COLS ? el.rackRow1 : el.rackRow2;
        const t2 = bySlot.get(i);
        if (t2) {
          row.appendChild(tileEl(t2));
        } else {
          const cell = document.createElement('div');
          cell.className = 'rack-empty';
          cell.dataset.slot = i;
          row.appendChild(cell);
        }
      }
    }

    /* Figma 210:3627 - sayaç "87/108" biçiminde: KALAN / TOPLAM. Toplam,
       taşın bulunabileceği tüm yerler taranarak bulunur (desteden çıkmış
       taşlar da o raundun destesine aittir). */
    el.deckCount.textContent = `${s.deck.length}/${Game.totalTilesInPlay()}`;
    el.discardSlot.innerHTML = '';
    const lastDiscard = s.discardPile[s.discardPile.length - 1];
    if (lastDiscard) el.discardSlot.appendChild(tileEl(lastDiscard, false));

    el.discardSlot.classList.remove('takeable');

    /* P31 · Grup H — Crimson King artık çekiş önizlemesi göstermiyor
       (Kanlı Taç). Kutu DOM'da duruyor ama hep gizli. */
    el.crimsonPeek.classList.add('hidden');
    /* P31 · Grup E — Tanrının Eli: bekleyen seçim varsa (ör. kayıttan
       dönüşte) seçim penceresi yeniden açılır. */
    if (s && s.godPick && s.status === 'playing' && !document.getElementById('godPickPop'))
      setTimeout(showGodPick, 0);

    /* Kombinasyon alanları — GRUP D (2026-08-23):
       ÖNCEKİ turların açık kombinasyonları ve onlara yapılan İŞLEMELER
       artık merkezdeki tepside değil, ekranın SAĞ ÜSTÜNDEKİ "Meld"
       alanında duruyor (Figma 210:3927). Merkez tepsi yalnız BU turun
       sahnelenen/onaylanan kombinasyonlarına ayrıldı. */
    el.combosRow.innerHTML = '';
    el.meldRow.innerHTML = '';
    const meldPhase = s.phase === 'meld' && s.status === 'playing';

    /* PLAYTEST 9 · GRUP Q — "SABİTLENEN TAŞLAR" ALANI TAMAMEN KALDIRILDI.
       Bungie Gum artık ayrı bir bar kurmuyor: açtığı taşlar ıstakaya geri
       döner ve orada normal taş gibi (🍬 işaretiyle) durur, oyuncu bir
       sonraki tur onları yeniden seçip açabilir. Kullanıcının üçüncü kez
       netleştirdiği davranış bu — eski bar bir daha eklenmemeli. */

    /* Dedikodu Masası (Grup F) — 3 açık taşlık yan masa. Elinden bir taş
       seçip masadaki taşa tıklayınca takas olur (tur başına 1 kez). */
    if ((s.gossipTable || []).length) {
      const canSwap = Game.canGossipSwap();
      const box = document.createElement('div');
      box.className = 'combo gossip-box' + (canSwap ? ' swappable' : '');
      const tilesDiv = document.createElement('div');
      tilesDiv.className = 'combo-tiles';
      s.gossipTable.forEach((gt) => {
        const td = tileEl(gt, false);
        td.classList.add('gossip-tile');
        if (canSwap) {
          td.classList.add('gossip-pick');
          td.addEventListener('click', () => {
            const mine = [...selection][0];
            if (selection.size !== 1) { toast(t('gossipNeedOne')); return; }
            const r = Game.gossipSwap(mine, gt.id);
            if (!r.ok) { toast(r.error); return; }
            selection.clear();
            newTileIds = new Set([r.got.id]);
            toast(T.ev(r.note), true);
            SFX.draw();
            render();
            setTimeout(() => newTileIds.clear(), 600);
          });
        }
        tilesDiv.appendChild(td);
      });
      const tag = document.createElement('div');
      tag.className = 'combo-tag gossip-tag';
      tag.innerHTML = `${t('gossipTitle')} · ${canSwap ? t('gossipReady') : t('gossipUsed')}`;
      box.append(tilesDiv, tag);
      el.combosRow.appendChild(box);
    }

    s.prevOpen.forEach((c, i) => {
      const box = document.createElement('div');
      /* Bungie Gum (Playtest 10): taşları sakızla ele geri çekilen açılım
         KAPANMIŞ görünür — solar, "işlenebilir" etiketi ve İşle düğmesi
         gösterilmez. Oyuncu geri gelen taşları yeni bir açılımda kullanır. */
      box.className = 'combo isleme-target' + (c.gumClosed ? ' gum-closed' : '');
      const tilesDiv = document.createElement('div');
      tilesDiv.className = 'combo-tiles';
      c.tiles.forEach(t2 => tilesDiv.appendChild(comboTileEl(t2, c)));
      s.islemeler.forEach((e2) => {
        if (e2.comboIndex !== i) return;
        // işleme taşları: okeyin yerini çözmek için BİRLEŞİK kombinasyon gerekir
        const merged = { type: c.type, values: e2.values, tiles: [...c.tiles, ...e2.tiles] };
        e2.tiles.forEach(t2 => {
          const td = comboTileEl(t2, merged);
          td.classList.add('isleme-tile');
          tilesDiv.appendChild(td);
        });
      });
      const tag = document.createElement('div');
      tag.className = 'combo-tag';
      tag.textContent = `${T.typeName(c.type)} · ${t(c.gumClosed ? 'gumClosedTag' : 'islenebilir')}`;
      box.append(tilesDiv, tag);
      /* Grup I — açık kombinasyondaki okeyi, yerine geçtiği gerçek taşla
         değiştir: gerçek taş kombinasyona girer, okey ele döner. */
      if (meldPhase) addOkeySwapBtn(box, 'prevOpen', i);
      /* PLAYTEST 17 · GRUP A/1 — "+ İşle" DÜĞMESİ ARTIK BOŞUNA DURMUYOR.
         Eskiden düğme, elde işlenebilir bir taş VARSA çiziliyor ama seçim
         boşken PASİF (gri) kalıyordu; oyuncuya sürekli "kullanılamayan bir
         düğme" gibi görünüyordu. Kural (kullanıcı, 2026-08-28): düğme
         yalnız GERÇEKTEN kullanılabilir bir işleme fırsatı varken görünür,
         yani seçili taşlar bu kombinasyona şu anda eklenebiliyorken.
         Fırsatın kendisi zaten kesikli çerçeveli `.isleme-target` kutusuyla
         belli oluyor, bu yüzden keşfedilebilirlik kaybı yok. */
      if (meldPhase && c.type !== 'cift' && Game.canIsleme(i)
          && Game.canIslemeWith(i, [...selection])) {
        const btn = document.createElement('button');
        btn.className = 'isleme-btn';
        btn.textContent = t('isleBtn');
        btn.title = t('isleTitle');
        btn.addEventListener('click', () => {
          const doAdd = (forceStart) => {
            const res = Game.addIsleme(i, [...selection], { forceStart });
            // Grup A: işlemede okey iki uca da oturabiliyorsa oyuncu seçsin
            if (res.needChoice) { pickOkeySlot(res.choices, (st) => doAdd(st)); return; }
            if (!res.ok) { toast(res.error); return; }
            selection.clear();
            toast(t('isleAdded'), true);
            render();
          };
          doAdd(undefined);
        });
        box.appendChild(btn);
      }
      el.meldRow.appendChild(box);
    });
    /* Figma: "İşleme" başlığı yalnız alanda açılım varken görünür
       (Varyasyon 1 = boş alan, başlık yok). */
    el.meldArea.classList.toggle('empty', !s.prevOpen.length);
    // işleme geri alma düğmeleri
    s.islemeler.forEach((e2, ei) => {
      const undo = document.createElement('button');
      undo.className = 'isleme-undo';
      undo.textContent = t('isleUndo', ei + 1);
      undo.addEventListener('click', () => { Game.undoIsleme(ei); render(); });
      el.meldRow.appendChild(undo);
    });

    const combos = [
      ...s.opened.map((c, i) => ({ ...c, locked: true, openedIndex: i })),
      ...s.staged.map((c, i) => ({ ...c, locked: false, index: i })),
    ];
    /* PLAYTEST 17 · GRUP A/5 — 4+ tepside taşlar küçülür: çoğu durumda
       hepsi tek satırda kalır, kalmazsa CSS `wrap-reverse` ile taşanlar
       ÜST satıra çıkar (yatay kaydırma yok). Dedikodu Masası kutusu da bir
       tepsi sayıldığı için sayım `combosRow`un gerçek çocuk sayısıdır. */
    combos.forEach(c => {
      const box = document.createElement('div');
      box.className = 'combo' + (c.locked ? ' locked' : '');
      const tilesDiv = document.createElement('div');
      tilesDiv.className = 'combo-tiles';
      c.tiles.forEach(t2 => tilesDiv.appendChild(comboTileEl(t2, c)));
      const tag = document.createElement('div');
      tag.className = 'combo-tag';
      tag.textContent = c.locked ? T.typeName(c.type) + ' ✓' : T.typeName(c.type);
      box.append(tilesDiv, tag);
      // Grup I: bu turun onaylanmış açılımlarında da okey geri alınabilir
      if (meldPhase && c.locked) addOkeySwapBtn(box, 'opened', c.openedIndex);
      if (!c.locked) {
        const x = document.createElement('button');
        x.className = 'combo-x';
        x.textContent = '✕';
        x.title = t('comboUndo');
        x.addEventListener('click', () => { Game.unstage(c.index); render(); });
        box.appendChild(x);
      }
      el.combosRow.appendChild(box);
    });
    el.combosRow.classList.toggle('dense', el.combosRow.children.length >= 4);

    /* İPUCU / MOD METNİ KALDIRILDI (2026-08-23, kullanıcı kararı):
       Figma tasarımında bu ekranda açıklama satırı YOKTUR. Boss durum
       bilgileri zaten sol sütundaki boss kural kutusunda canlı duruyor.
       Bu kutu artık yalnız pop-up'ı kapatılmış Tüccar teklifini geri
       çağıran düğmeyi taşır. */
    el.openAreaHint.innerHTML = '';
    /* ============================================================
       PLAYTEST 19 · GRUP I — FATALITY SINIRI TEKRAR GÖRÜNÜR.
       KÖK NEDEN: joker ÇALIŞIYORDU — motor her tur başında
       `s.fatalityLimit`i hesaplıyor (engine.js, `hasActive('fatality')`)
       ve sınır aşılınca hedefi %10 düşürüyordu. GÖSTERİLMİYORDU:
       `fatalityHint` metni i18n'de duruyor ama ui.js'ten çağrılmıyordu —
       eski "ipucu / mod metni" satırı Figma entegrasyonunda kaldırılınca
       (2026-08-23) bu satır da onunla birlikte gitmiş. Oyuncu için joker
       "hiç tetiklenmiyor" gibi görünüyordu.
       BOSS varyantı sınırı zaten boss banner'ında yazıyor
       (`bossFatalityExtra`), o yüzden burada YALNIZ joker varyantı çizilir;
       ikisi aynı anda açıksa sınır iki kez yazılmaz. */
    /* PLAYTEST 20 · GRUP D — TRADE JOKERİ PİYASA GÖSTERGESİ.
       Yalnız joker Ana Slot'tayken ve piyasa açıkken görünür. */
    {
      const b = s.borsa;
      const tdj = !s.jokersDisabled
        && Game.slotRecs().find(j => j.key === 'tradeJokeri');
      const show = !!b && !!tdj && s.status === 'playing';
      el.borsaChip.classList.toggle('hidden', !show);
      if (show) {
        /* PLAYTEST 29 · GRUP H — çipte artık PORTFÖY de yazar. Piyasa
           yönü (📈/📉) hangi hissenin temettü ödeyeceğini ve hangisinin
           yanacağını söyler; üçlü sayaç elindeki hisseleri gösterir. */
        const sh = tdj.borsaShares || { per: 0, sirali: 0, cift: 0 };
        el.borsaChip.innerHTML =
          `<span class="bs-up">${t('borsaUp', T.typeName(b.up))}</span>` +
          `<span class="bs-down">${t('borsaDown', T.typeName(b.down))}</span>` +
          `<span class="bs-sh">${t('borsaShares', sh.per, sh.sirali, sh.cift)}</span>`;
        attachTip(el.borsaChip, { name: t('borsaTipName'),
          rarityText: t('borsaTipTag'),
          desc: t('borsaTip', T.typeName(b.up), T.typeName(b.down),
            sh.per, sh.sirali, sh.cift) }, {});
      }
    }

    /* PLAYTEST 20 · GRUP B/1 — sınır artık ÜST ŞERİTTEKİ çipte.
       Joker ve BOSS varyantı aynı çipi kullanır (eskiden boss varyantı
       ayrıca boss banner'ında yazıyordu; iki ayrı yerde iki ayrı biçimde
       görünüyordu). Çip kompakttır, tam açıklama tooltip'te durur. */
    {
      const show = !!s.fatalityLimit && meldPhase && s.status === 'playing';
      el.fatalityChip.classList.toggle('hidden', !show);
      el.fatalityChip.classList.toggle('hit', !!s.fatalityHit);
      if (show) {
        el.fatalityChip.innerHTML =
          `<span class="fc-ico">☠</span><span class="fc-val">${t('fatalityChip', s.fatalityLimit)}</span>`;
        attachTip(el.fatalityChip, {
          name: T.bossName('fatality', 'Fatality'),
          rarityText: t('fatalityTipTag'),
          desc: t('fatalityTip', s.fatalityLimit),
        }, {});
      }
    }
    /* P35 · Grup J — KAHİN KEHANETİ KALICI ETİKET. Eskiden yalnız raund başı
       bildirim kartıydı ve kapanınca oyuncu hedefi hatırlamak zorundaydı.
       Artık TUR göstergesinin altında raund boyu durur; tutunca ✓ alır.
       Joker hedefi (raund) öncelikli; boss raundunda o turun zorunlu
       kehaneti gösterilir. */
    {
      const g = s.kahinGoal;
      const bo = s.boss && s.boss.key === 'kahin' && s.bossOracle ? s.bossOracle : null;
      const show = s.status === 'playing' && !!(g || bo);
      el.kahinChip.classList.toggle('hidden', !show);
      if (show) {
        const done = g ? !!g.done : !!bo.met;
        const reward = g ? ` → +${g.amount} ${g.reward === 'coin' ? t('kahinCoin') : t('kahinPts')}` : '';
        const txt = t('kahinChip', T.ev(g ? g.text : bo.text) + reward);
        el.kahinChip.classList.toggle('done', done);
        el.kahinChip.innerHTML = `<span class="kc-ico">🔮</span><span class="kc-val">${txt}</span>`
          + (done ? '<span class="kc-ok">✓</span>' : '');
        el.kahinChip.title = txt;
      }
    }
    if (s.tuccarOffer && meldPhase) {
      const b = document.createElement('button');
      b.className = 'gm-btn';
      b.innerHTML = t('tuccarBtn', '$');
      b.addEventListener('click', () => showTuccarOffer());
      el.openAreaHint.appendChild(b);
    }
    /* PLAYTEST 17 · GRUP F/23 — BEKLEYEN FÜZYON.
       Füzyon artık ne ana slotu ne backup'ı işgal eder; alındığı anda
       birleştirme ekranı açılır. Oyuncu "Sonra" derse ya da o an
       birleştirecek iki jokeri yoksa eylem BEKLER — bu düğme onu geri
       çağırır. (Tüccar teklifini geri çağıran düğmeyle aynı kalıp.) */
    if (Game.hasPendingFuzyon && Game.hasPendingFuzyon()) {
      const b = document.createElement('button');
      b.className = 'gm-btn';
      b.innerHTML = t('fzPendingBtn');
      b.title = t('fzPendingTitle');
      /* GRUP E (P19): bekleyen Füzyon geri çağrıldığında da tam menü açılır —
         oyuncu fikrini değiştirip onu bir rafa koymak isteyebilir. */
      b.addEventListener('click', () => fuzyonMenu(Game.findFuzyon().id));
      el.openAreaHint.appendChild(b);
    }

    /* PLAYTEST 20 · GRUP A (bug) — HEDEF TAŞ ÖNİZLEMEDEN ÖNCE HESAPLANIR.
       İlk yazımda `teraziSel` aksiyon barı bloğunda, yani hesap kutusunun
       ALTINDA belirleniyordu. Sonuç: taşa tıklandığında düğme hemen
       etkinleşiyor ama önizleme BİR RENDER GECİKİYORDU (kutu ilk çizimde
       hâlâ eski/boş değerle bakıyordu). Hesap artık burada, tek yerde
       yapılır; aşağıdaki buton bloğu yalnız onu GÖRÜNTÜLER. */
    {
      const canT = Game.canTeraziSacrifice && Game.canTeraziSacrifice();
      const one = selection.size === 1 ? [...selection][0] : null;
      teraziSel = canT && one != null ? one : null;
      /* P29 · Grup F — Paratoner yemi aynı kalıptan beslenir: taş atma
         aşamasında ıstakada TAM BİR taş seçiliyken düğme etkinleşir. */
      const canP = Game.canParatonerBait && Game.canParatonerBait();
      paratonerSel = canP && one != null ? one : null;
    }

    /* PLAYTEST 20 · GRUP A — FEDA ÖNİZLEMESİ.
       Taş atma aşamasında tek taş seçiliyken hesap kutusu, o taşı feda
       edersen NE OLACAĞINI tek satırda ve GERÇEK SAYIYLA yazar; oyuncu
       kafadan yüzde hesabı yapmaz. Motorla aynı fonksiyondan beslenir
       (Game.teraziPreview), yani bildirim ile puanlama ayrışamaz. */
    const tzPv = teraziSel != null && Game.teraziPreview
      ? Game.teraziPreview(teraziSel) : null;
    if (tzPv) {
      const nm = `${T.color(tzPv.tile.color)} ${tzPv.tile.number}`;
      /* P29 · Grup J — ağır feda artık PUAN değil HEDEF İNDİRİMİ yazar. */
      el.previewBar.innerHTML = tzPv.heavy
        ? `<span class="pv-tz">${t('teraziPvHeavy', nm, tzPv.cut)}</span>`
        : `<span class="pv-tz">${t('teraziPvLight', nm, tzPv.mult.toFixed(1))}</span>`;
      el.previewBar.classList.remove('hidden');
      el.previewBar.classList.add('pv-terazi');
      fitPreview();
      keepPreviewClear();
      el.btnTerazi.classList.remove('hidden');
      el.btnTerazi.disabled = false;
    } else {
      el.previewBar.classList.remove('pv-terazi');
    }
    /* P29 · Grup F — yem önizlemesi. Terazi önizlemesi varsa ona
       dokunulmaz (o daha dar bir durum: feda hakkı tur başına bir kez). */
    const ptPv = !tzPv && paratonerSel != null && Game.paratonerPreview
      ? Game.paratonerPreview(paratonerSel) : null;
    if (ptPv) {
      const nm = `${T.color(ptPv.tile.color)} ${ptPv.tile.number}`;
      el.previewBar.innerHTML = `<span class="pv-tz">${t('paratonerPv', nm, ptPv.gain)}</span>`;
      el.previewBar.classList.remove('hidden');
      el.previewBar.classList.add('pv-terazi');
      fitPreview();
      keepPreviewClear();
    }
    // Önizleme
    const pv = (tzPv || ptPv) ? null : Game.previewScore();
    if (pv && s.phase === 'meld') {
      /* Figma 210:3744 — kutu SADECE şunu gösterir: <ham>x<çarpan>=<sonuç>
         (ham mavi, x koyu, çarpan kırmızı, =sonuç koyu). Kombinasyon sayısı,
         joker dökümü gibi ek satırlar tasarımda YOKTUR. */
      /* PLAYTEST 28 · GRUP B — DAMGA BASILIYKEN SONUÇ ALTIN YANAR.
         Kutuya YENİ ELEMAN EKLENMEZ (Figma 210:3744 tek satırlıktır);
         yalnız `.pv-final` bir sınıf alıp rengini değiştirir. Gerekçe:
         kutunun eşitliği zaten "ham × çarpan = TÜM BONUSLAR DAHİL sonuç"
         demektir (flat veren jokerlerde de sayı denklemi tutmaz) — damga
         bu sözleşmeyi bozmaz ama sıçramayı görünür kılmak gerekir,
         yoksa oyuncu 36 beklerken 72 görüp sebebini arar. */
      /* PLAYTEST 18 · GRUP C — ÜÇÜNCÜ TEKER REGRESYONU DÜZELTİLDİ.
         KÖK NEDEN: burada `pv.carpan.toFixed(1)` KOŞULSUZ çağrılıyordu.
         Üçüncü Teker'le Çift + Per aynı turda açılınca tek bir çarpan
         YOKTUR (iki ayrı tablo işler) ve motor `carpan: null` döndürür →
         TypeError, render() tam ortasında kırılıyordu. Sonuç: (1) hesap
         kutusu bir önceki tek-aile değerinde donuyordu, (2) render'ın
         DEVAMINDAKİ buton mantığı (btnConfirm görünürlüğü/disabled) hiç
         çalışmıyordu → "Açılımı Onayla" ölü kalıyordu. Tek hata, iki
         semptom. Karışık açılımda artık her ailenin kendi ham×çarpanı
         ayrı ayrı yazılır: "18x3.2 + 15x3.0 = 103". */
      if (pv.parts && pv.parts.length) {
        el.previewBar.innerHTML =
          pv.parts.map((pt) =>
            `<span class="pv-raw">${pt.raw}</span>` +
            `<span class="pv-op">x</span>` +
            `<span class="pv-mult">${pt.carpan.toFixed(1)}</span>`
          ).join('<span class="pv-op pv-plus">+</span>') +
          `<span class="pv-op">=</span><span class="pv-final${pv.damgaBonus ? ' damga' : ''}">${pv.final}</span>`;
      } else {
        el.previewBar.innerHTML =
          `<span class="pv-raw">${pv.raw}</span>` +
          `<span class="pv-op">x</span>` +
          `<span class="pv-mult">${(pv.carpan || 0).toFixed(1)}</span>` +
          `<span class="pv-op">=</span><span class="pv-final${pv.damgaBonus ? ' damga' : ''}">${pv.final}</span>`;
      }
      el.previewBar.classList.remove('hidden');
      /* PLAYTEST 17 · GRUP A/4 — kutu içerikle büyür (CSS: max-width 520px);
         o sınıra da dayanırsa yazı kademeli küçültülür, yani "51x5.5=281"
         gibi uzun hesaplar hiçbir koşulda kırpılmaz. */
      fitPreview();
      /* Grup D: tepsiler çizildikten VE kutu son boyutunu aldıktan sonra
         ölçülür — aradaki boşluk hiçbir kombinasyon sayısında daralmasın. */
      keepPreviewClear();
    } else if (!tzPv) {
      el.previewBar.classList.add('hidden');
      el.previewBar.style.bottom = '';
    }

    /* PLAYTEST 20 · GRUP A — "Taş Feda Et" düğmesi.
       Koşul: Terazi ana slotta · taş atma aşaması · bu turun feda hakkı
       duruyor · ıstakada TAM BİR taş seçili. Seçili taş feda edilebilir
       değilse (okey / deste jokeri / dikili) düğme pasif olur ve neden
       olduğunu tooltip yazar. */
    {
      const canT = Game.canTeraziSacrifice && Game.canTeraziSacrifice();
      el.btnTerazi.classList.toggle('hidden', !canT);
      el.btnTerazi.textContent = t('teraziBtn');
      el.btnTerazi.disabled = !teraziSel;
      el.btnTerazi.title = teraziSel ? '' : t('teraziNeedOne');
    }
    /* P29 · Grup F — "Yem Seç". Yem zaten kuruluysa düğme "Yemi Kaldır"a
       döner; aynı taş ikinci kez verildiğinde motor da işareti kaldırır,
       yani iki yol da aynı sonucu verir. */
    {
      const canP = Game.canParatonerBait && Game.canParatonerBait();
      const set = canP && Game.state.paratonerBait != null;
      el.btnParatoner.classList.toggle('hidden', !canP);
      el.btnParatoner.textContent = set ? t('paratonerClear') : t('paratonerBtn');
      el.btnParatoner.disabled = !set && !paratonerSel;
      el.btnParatoner.title = (set || paratonerSel) ? '' : t('paratonerNeedOne');
    }
    /* P34 — "Rüşvet". Taş atma aşamasında görünür; seçili taş sayısı kadar
       coin yazar. Coin yetmiyorsa pasif kalır ve nedeni ipucunda yazar. */
    {
      const canR = Game.canRusvet && Game.canRusvet();
      const n = selection.size;
      const cost = n * (Game.rusvetCost ? Game.rusvetCost() : 2);
      const afford = !!Game.state && Game.state.coins >= cost;
      el.btnRusvet.classList.toggle('hidden', !canR);
      el.btnRusvet.textContent = n ? t('rusvetBtnN', cost) : t('rusvetBtn');
      el.btnRusvet.disabled = !n || !afford;
      el.btnRusvet.title = !n ? t('rusvetNeedOne') : (afford ? '' : t('rusvetNoCoin', cost));
    }
    /* Butonlar - Figma 210:3746: barda TEK birincil buton vardır.
       (2026-08-23 duzeltmesi: "Ac" ve "Onayla" yan yana iki buton olarak
       duruyordu; tasarimda boyle bir ikili YOK.) Kural:
         - discard asamasi           -> tas atma butonu
         - elde secim varsa (>=2 tas) -> Open Hand (yeni kombinasyon ac)
         - sahnelenmis acilim varsa   -> Confirm
         - hicbiri                    -> Open Hand (pasif)
       Boylece bir kombinasyon acildiktan SONRA barda yalniz Confirm gorunur;
       oyuncu yeni tas sectiginde slot tekrar Open Hand'e doner. */
    const canOpen = selection.size >= 2;
    const hasStaged = s.staged.length > 0 || s.islemeler.length > 0;
    const primary = s.phase === 'discard' ? 'discard'
      : (canOpen || !hasStaged) ? 'open' : 'confirm';
    el.btnAddCombo.classList.toggle('hidden', primary !== 'open');
    el.btnConfirm.classList.toggle('hidden', primary !== 'confirm');
    el.btnDiscard.classList.toggle('hidden', primary !== 'discard');
    /* PLAYTEST 14 · GRUP H — "Open Hand"ten SONRA barda yalnız Confirm
       kalır: Pass artık soluk/pasif olarak durmuyor, tamamen gizleniyor.
       (Pas, hiçbir şey açmadan turu geçme eylemidir; sahnede açılım
       varken anlamı yok.) */
    el.btnSkip.classList.toggle('hidden', !meldPhase || hasStaged);
    el.btnAddCombo.disabled = !canOpen;
    el.btnConfirm.disabled = !hasStaged;
    el.btnSkip.disabled = hasStaged;
    /* PLAYTEST 14 · GRUP I — TAŞ ATMA AŞAMASINDA SADECE "Discard".
       Rank / Suit / Confirm / Pass bu aşamada görünmez; bar tek butonlu
       ve sade kalır. */
    document.querySelector('#gameScreen .gm-actions')
      .classList.toggle('discard-only', s.phase === 'discard');
    const emptyHand = s.phase === 'discard' && s.hand.length === 0;
    /* Grup J: son turda sonuç kesinleştiyse taş atmaya gerek yok — buton
       "Raundu Bitir" olur. Taşa bağlı bir joker sonucu hâlâ çevirebiliyorsa
       (Atık Avcısı / Ayna Kırığı) normal discard istenmeye devam eder. */
    const fin = Game.canSkipFinalDiscard();
    finalSkip = !emptyHand && fin.skippable ? fin : null;
    el.btnDiscard.textContent = emptyHand ? t('btnDrawOnly')
      : finalSkip ? t(finalSkip.reason === 'won' ? 'btnFinishWon' : 'btnFinishLost')
      : (s.phase === 'discard' && selection.size > 1
        ? t('btnDiscardN', selection.size) : t('btnDiscard'));
    el.btnDiscard.classList.toggle('finish-round', !!finalSkip);
    // Grup B: 1-3 taş seçiliyken atılabilir
    el.btnDiscard.disabled = (emptyHand || finalSkip) ? false
      : (selection.size < 1 || selection.size > Game.MAX_DISCARD);

    fitActionLabels();            // uzun TR etiketleri 90px slota sığdır
    if (TUT.active) TUT.update(); // öğretici: ipucu/spot durumunu tazele
    checkPandora();               // Grup F: açılmamış kutu varsa sahnesini göster
    maybeAutoFinish();            // Grup C: kayıp kesinse tıklama bekleme
  }

  /* Grup C — hedefe ulaşmanın hiçbir yolu kalmadıysa raundu oyuncu adına
     kapat. Motor kararı verir (Game.hopelessRound); burada yalnız kısa bir
     nefes payı bırakıp normal raund-sonu akışına giriyoruz, böylece
     kurtarıcı jokerler de her zamanki gibi devreye girebilir. */
  let autoFinishing = false;
  function maybeAutoFinish() {
    if (autoFinishing || !Game.hopelessRound()) return;
    autoFinishing = true;
    toast(t('autoLoss'));
    setTimeout(() => {
      autoFinishing = false;
      if (!Game.hopelessRound()) return;
      const res = Game.autoFinishHopeless();
      if (!res.ok) return;
      if (res.events && res.events.length) notify(res.events);
      render();
      if (res.roundOver) setTimeout(showRoundEnd, 400);
    }, 900);
  }

  /* ---------- Etkileşim ---------- */

  function onTileClick(id) {
    if (dragging) return; // sürükleme bırakması tıklama sayılmasın
    const s = Game.state;
    if (s.status !== 'playing') return;
    // Grup K — tüketilebilir taş seçme modu: tık, hedef seçimidir
    if (consumPick) {
      const cp = consumPick;
      consumPick = null;
      teraziPick = false;
      const def = CONSUMABLES[cp.key];
      if (def && def.target === 'tileColor') { pickConsumColor(cp, id); render(); return; }
      finishConsum(Game.useConsumable(cp.index, { tileId: id }));
      return;
    }
    if (s.phase === 'discard') {
      /* PLAYTEST 10 · GRUP B — discard fazında artık 1-3 taş seçilebilir.
         Eskiden tek seçim vardı (yeni tıklama öncekini siliyordu); şimdi
         seçim birikir, sınıra gelince yeni tıklama uyarı verir. */
      if (selection.has(id)) selection.delete(id);
      else if (selection.size >= Game.MAX_DISCARD) {
        toast(t('discardMax', Game.MAX_DISCARD));
        return;
      } else selection.add(id);
    } else {
      if (selection.has(id)) selection.delete(id);
      else selection.add(id);
    }
    SFX.tick();
    render();
  }

  el.btnAddCombo.addEventListener('click', () => {
    const res = Game.stageSelection([...selection]);
    if (!res.ok) { toast(res.error); return; }
    if (res.count > 1) toast(t('multiStaged', res.count), true);
    selection.clear();
    render();
  });

  const doConfirm = () => {
    const res = Game.confirmMelds();
    if (!res.ok) { if (res.error) toast(res.error); return; }
    selection.clear();
    /* Grup H — Uzaylı boss: açılımın TAMAMI gizli uzaylı yüzünden çöktüyse
       puan/çarpan gösterme, taşlar ele döndü; oyuncu aynı turda yeniden
       deneyebilir. */
    if (res.collapsed) {
      notify(res.events);
      SFX.crack();
      islekFlash();
      render();
      return;
    }
    scoreFly(`+${res.final}`);
    SFX.meld(res.count);
    if (res.carpanText) flashMult(res.tamEl ? 'TAM EL!' : `×${res.carpanText}`);
    toast(t('confirmToast', res.count, res.carpanText, res.final), true);
    notify(res.triggered.map(tr => `${tr.name}: ${tr.text}`));
    notify(res.bonuses);
    notify(res.events);
    if (TUT.active && res.triggered.length && Game.state.jokers.length) TUT.flag('jokerFire');
    render();
    res.triggered.forEach(tr => {
      const card = el.jokerSlots.querySelector(`[data-jid="${tr.id}"]`);
      if (card) {
        card.classList.add('fired');
        setTimeout(() => card.classList.remove('fired'), 900);
      }
    });
    /* GRUP H — KUZEY YILDIZI. Açılımda Yıldız Taşı kullanıldıysa motor
       3 taş açtı; seçim penceresi burada belirir. */
    if (Game.state.yildizPick) setTimeout(showYildizPick, 520);
    if (Game.state.status !== 'playing') setTimeout(showRoundEnd, 900);
  };

  /* TANRININ ELİ (P31 · Grup E) — desteden seçimli çekiş penceresi.
     Deste açılır pop-up'ının (#pilePopup) kabuğu ve renk gruplaması
     kullanılır; taşlar tıklanınca seçilir, hak dolunca "Çek" onaylar.
     Pencere kapatılamaz: seçim bitmeden açılım ve atış motor tarafında
     da kilitlidir. */
  function showGodPick(after) {
    const s = Game.state;
    if (!s || !s.godPick || document.getElementById('godPickPop')) return;
    const n = s.godPick.n;
    const chosen = new Set();
    const ov = document.createElement('div');
    ov.id = 'pilePopup';
    const wrap = document.createElement('div');
    wrap.id = 'godPickPop';
    const box = document.createElement('div');
    box.className = 'pp-box gp-box';
    box.innerHTML = `<h3>${t('godPickTitle')}</h3><p>${t('godPickSub', n)}</p>`;
    const groups = COLORS.map(c => ({ label: T.color(c),
      tiles: s.deck.filter(t2 => !t2.jokerTile && t2.color === c).sort((a, b) => a.number - b.number) }));
    for (const g of groups) {
      if (!g.tiles.length) continue;
      const lbl = document.createElement('div');
      lbl.className = 'pp-group-label';
      lbl.textContent = `${g.label} · ${g.tiles.length}`;
      box.appendChild(lbl);
      const row = document.createElement('div');
      row.className = 'pp-tiles';
      for (const t2 of g.tiles) {
        const te = tileEl(t2, false);
        te.classList.add('gp-opt');
        te.addEventListener('click', () => {
          if (chosen.has(t2.id)) chosen.delete(t2.id);
          else if (chosen.size < n) chosen.add(t2.id);
          te.classList.toggle('gp-sel', chosen.has(t2.id));
          btn.textContent = t('godPickBtn', chosen.size, n);
        });
        row.appendChild(te);
      }
      box.appendChild(row);
    }
    const btn = document.createElement('button');
    btn.className = 'gp-take';
    btn.textContent = t('godPickBtn', 0, n);
    btn.addEventListener('click', () => {
      const r = Game.godPickTake([...chosen]);
      if (!r.ok) { toast(T.ev(r.error)); return; }
      ov.remove();
      newTileIds = new Set(r.drawn || []);
      SFX.draw();
      if (r.events && r.events.length) notify(r.events, true, { quiet: true });
      render();
      setTimeout(() => newTileIds.clear(), 600);
      if (typeof after === 'function') after();
    });
    box.appendChild(btn);
    wrap.appendChild(box);
    ov.appendChild(wrap);
    document.body.appendChild(ov);
  }

  /* Kuzey Yıldızı seçim penceresi — gizli paket "seçimli açılış"ıyla aynı
     desen (pk-* kabuğu): üç taş yan yana, biri tıklanır, kalanlar desteye
     karışır. Kuyrukta başka seçim varsa pencere yeniden kurulur. */
  function showYildizPick() {
    const pick = Game.state.yildizPick;
    if (!pick) return;
    document.getElementById('yildizPop')?.remove();
    const ov = document.createElement('div');
    ov.id = 'yildizPop';
    ov.className = 'pk-ov tone-gold';   /* paket sahnesiyle aynı kabuk */
    ov.innerHTML =
      `<div class="pk-box yildiz-box"><h3>${t('yildizTitle')}</h3>` +
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><span class="pk-hint">${t('yildizHint')}</span></div></div>`;
    const body = ov.querySelector('.pk-body');
    pick.options.forEach((tile, i) => {
      const c = document.createElement('button');
      c.className = 'pk-card yildiz-opt';
      c.style.animationDelay = `${i * 0.11}s`;
      const holder = document.createElement('div');
      holder.className = 'yildiz-tile';
      holder.appendChild(tileEl(tile, false));
      c.appendChild(holder);
      c.addEventListener('click', () => {
        if (ov.dataset.done) return;
        ov.dataset.done = '1';
        const r = Game.yildizTake(tile.id);
        if (!r.ok) { toast(r.error); ov.remove(); render(); return; }
        SFX.draw();
        [...body.children].forEach((el2, k) => el2.classList.add(k === i ? 'pk-won' : 'pk-lost'));
        notify(r.events, true, { quiet: true });
        setTimeout(() => {
          ov.remove();
          render();
          if (Game.state.yildizPick) showYildizPick();   // kuyrukta bir seçim daha
        }, 620);
      });
      body.appendChild(c);
    });
    document.body.appendChild(ov);
  }


  el.btnConfirm.addEventListener('click', () => {
    // Ritim Jokeri — onaydan önce mini oyun (GDD 10)
    if (Game.needsRitim()) {
      showRitim(Game.ritimLevel(), (success) => {
        /* Grup D (Playtest 7) — KÖK NEDEN: boss varyantı setRitimResult'tan
           `bonus` DÖNDÜRMEZ (bonus yok, GDD 13.4), ama burada koşulsuz
           rr.bonus.toFixed(1) çağrılıyordu → TypeError → doConfirm() hiç
           çalışmıyor, oyuncu "Açılımı Onayla"ya ikinci kez basmak zorunda
           kalıyordu. Artık boss/joker varyantı ayrı, üstelik onay bir
           finally bloğunda: mesaj katmanında ne olursa olsun sekans bitince
           açılım OTOMATİK onaylanır. */
        try {
          const rr = Game.setRitimResult(success);
          if (!success) { toast(t('ritimLose' + (rr.boss ? 'Boss' : ''))); SFX.crack(); }
          else if (rr.boss) { toast(t('ritimWinBoss'), true); SFX.meld(3); }
          else { toast(t('ritimWin', (rr.bonus || 0).toFixed(1)), true); SFX.meld(3); }
        } catch (e) {
          console.error('ritim sonucu işlenemedi', e);
        } finally {
          doConfirm();
        }
      }, Game.ritimIsBoss());
      return;
    }
    doConfirm();
  });

  el.btnSkip.addEventListener('click', () => {
    const res = Game.skipToDiscard();
    if (!res.ok) { if (res.error) toast(res.error); return; }
    selection.clear();
    render();
  });

  el.btnDiscard.addEventListener('click', () => {
    // Grup J: son turda sonuç kesinse taş atmadan raundu bitir
    const ids = finalSkip ? null : [...selection];
    if (!finalSkip) for (const tid of ids) flyTileToDiscard(tid);
    const res = Game.discard(ids);
    if (!res.ok) { if (res.error) toast(res.error); return; }
    selection.clear();
    newTileIds = new Set(res.drawn || []);
    SFX.draw();
    if (res.events && res.events.length) {
      notify(res.events);
      if (res.events.some(e => /İŞLEK|-100/.test(e))) { islekFlash(); SFX.islek(); }
      if (TUT.active && res.events.some(e => /^İŞLEK!/.test(e))) TUT.flag('islekHit');
    }
    /* Grup G (P19) — The Cheating büyük bildirimi. Bu tek çağrı hem bossun
       TUR SONU çözümünü hem de hemen ardından başlayan turun joker atışını
       kapsar (ikisi de discard()'ın olay listesinde döner). */
    cheatFlash();
    setTimeout(() => {
      render();
      setTimeout(() => newTileIds.clear(), 600);
      if (res.worldRestart) return; // raund baştan — oyun ekranında kal
      if (res.roundOver) setTimeout(showRoundEnd, 400);
      // P31 · Grup E — Tanrının Eli: önce desteden seçim, sonra yazı-tura
      else if (Game.state.godPick) showGodPick(maybeCoinFlip);
      // Grup F/22 — yeni turun yazı-turası (Kumarbaz slottaysa)
      else maybeCoinFlip();
      /* GRUP K (kullanıcı isteği 2026-09-06) — TÜCCAR TEKLİFİ OTOMATİK.
         Boss her TUR yeni teklif sunuyor (`_tuccarTurnOffer`) ama pop-up
         yalnız RAUND başında açılıyordu; turlar arasında oyuncunun barda
         beliren "$" düğmesine basması gerekiyordu — teklifin varlığı bile
         gözden kaçıyordu. Artık yeni tur başlar başlamaz kendiliğinden
         açılır. Düğme yerinde duruyor: pop-up kapatılırsa oyuncu teklife
         aynı turda geri dönebilsin. */
      if (!res.roundOver && !res.worldRestart && Game.state.tuccarOffer)
        setTimeout(() => { if (Game.state.tuccarOffer) showTuccarOffer(); }, 420);
    }, 340);
  });

  /* PLAYTEST 20 · GRUP A — "Taş Feda Et".
     Seçili TEK taşı feda eder; normal atış hakkı durur, yani oyuncu
     fedadan sonra yine bir taş atar. Feda edilen taş atılan yığınına
     GİRMEZ (motor kuralı) — o taş için işlek zarı da atılmaz. */
  el.btnParatoner.addEventListener('click', () => {
    const set = Game.state && Game.state.paratonerBait != null;
    if (!set && paratonerSel == null) { toast(t('paratonerNeedOne')); return; }
    const r = Game.setParatonerBait(set ? null : paratonerSel);
    if (!r.ok) { toast(r.error); render(); return; }
    toast(r.note, true);
    render();
  });

  /* P34 — "Rüşvet": seçili taşları desteye yollar, yerine yenilerini çeker. */
  el.btnRusvet.addEventListener('click', () => {
    if (!selection.size) { toast(t('rusvetNeedOne')); return; }
    const r = Game.useRusvet([...selection]);
    if (!r.ok) { toast(r.error); render(); return; }
    for (const id of r.gone) selection.delete(id);
    toast(r.note, true);
    SFX.coin();
    render();
  });

  el.btnTerazi.addEventListener('click', () => {
    if (teraziSel == null) { toast(t('teraziNeedOne')); return; }
    const id = teraziSel;
    const r = Game.teraziSacrifice(id);
    if (!r.ok) { toast(r.error); render(); return; }
    selection.delete(id);
    toast(r.note, true);
    SFX.crack();
    render();
  });

  el.discardSlot.addEventListener('click', () => showPilePopup('discard'));

  /* PLAYTEST 29 · GRUP P (bug) — DESTE POP-UP'I AÇILMIYORDU.
     KÖK NEDEN: `.deck-pile` sınıfı index.html'de İKİ KEZ geçiyor. Harita
     ekranı oyun ekranıyla AYNI gm-stage tuvalini ve aynı sınıf adlarını
     paylaşıyor (bkz. [[harita-figma-tuvali]]), bu yüzden belgede önce
     HARİTANIN deste kartı (#mapPileCol .deck-pile, satır ~129) geliyor.
     `document.querySelector('.deck-pile')` onu döndürdüğü için dinleyici
     ve `cursor: pointer` yanlış elemana bağlanıyordu; oyun sahnesindeki
     deste kartı (#pileCol .deck-pile) hiç tıklanabilir olmuyordu.
     Seçici artık KAPSAYICISIYLA birlikte yazılır. Harita tarafındaki
     kart da aynı pop-up'ı açar (orada da deste görünür olmalı) — ama
     kendi seçicisiyle, biri diğerini gölgelemeden. */
  for (const sel of ['#pileCol .deck-pile', '#mapPileCol .deck-pile']) {
    const node = document.querySelector(sel);
    if (!node) continue;
    node.addEventListener('click', () => showPilePopup('deck'));
    node.style.cursor = 'pointer';
  }

  /* ---------- GRUP C: backup & Değnek omuzları açılır/kapanır ----------
     Sekmeye (veya ok işaretine) tıklanınca omuz YUKARI kayıp slotları
     açar, tekrar tıklanınca AŞAĞI kayıp ıstakanın arkasına gizlenir —
     Figma "Varyasyon 1" (kapalı) / "Varyasyon 2" (açık) frame'lerindeki
     iki durum. Durum localStorage'da kalıcı; slot dolduğunda kendi
     kendine açılır ki oyuncu yeni kartı görsün. */
  const SHOULDER_KEY = 'okeyShoulders';
  const shoulderState = (() => {
    try { return JSON.parse(localStorage.getItem(SHOULDER_KEY)) || {}; }
    catch (e) { return {}; }
  })();
  function setShoulder(which, open) {
    shoulderState[which] = !!open;
    const node = which === 'backup' ? el.backupShoulder : el.totemShoulder;
    const btn = which === 'backup' ? el.btnBackupToggle : el.btnTotemToggle;
    node.classList.toggle('open', !!open);
    node.classList.toggle('collapsed', !open);
    btn.setAttribute('aria-expanded', String(!!open));
    try { localStorage.setItem(SHOULDER_KEY, JSON.stringify(shoulderState)); } catch (e) {}
  }
  function toggleShoulder(which) {
    setShoulder(which, !shoulderState[which]);
    SFX.tick();
  }
  const shoulderSeen = { backup: null, totem: null };
  function autoShoulder(which, n) {
    const prev = shoulderSeen[which];
    shoulderSeen[which] = n;
    if (prev === null) { if (n > 0) setShoulder(which, true); return; }
    if (n > prev) setShoulder(which, true);
    else if (n === 0 && prev > 0) setShoulder(which, false);
  }
  el.btnBackupToggle.addEventListener('click', () => toggleShoulder('backup'));
  el.btnTotemToggle.addEventListener('click', () => toggleShoulder('totem'));
  setShoulder('backup', shoulderState.backup);
  setShoulder('totem', shoulderState.totem);

  el.btnSortRank.addEventListener('click', () => { Game.applySort('rank'); TUT.mark('sort-rank'); render(); });
  el.btnSortSuit.addEventListener('click', () => { Game.applySort('suit'); TUT.mark('sort-suit'); render(); });

  /* ============================================================
     TUTORIAL v2 — GERÇEK, OYNANABİLİR STAGE 1 (Grup A)
     - Oyuncu Stage 1'i gerçekten baştan sona oynar: 2 normal raund,
       store'da joker alma anı ve gerçek bir boss raundu.
     - Bilgi kartları yok; oyuncu doğal akışta ilerlerken İLGİLİ ANDA
       kısa bağlamsal ipucu balonları çıkar (oyun durmaz, state akar).
     - Hedefler ×0.5 (Game.tutorialMode), boss sabit ve basit (Ahtapot).
     - İşlek AÇIK (gerçek zar); ilk işlek vuruşunda bağlamsal ipucu.
     - Adımlar arası resetleme yok: yapılan her eylem sonraki durumu üretir.
     ============================================================ */

  const TUT = {
    active: false,
    saved: null,       // öğretici öncesi gerçek state (referans)
    seen: new Set(),
    tmp: new Set(),    // sıralama butonu işaretleri
    flags: {},
    cur: null,

    /* --- bağlamsal ipuçları: sırayla taranır, ilk uyan gösterilir --- */
    get tips() {
      if (this._tips) return this._tips;
      const s = () => Game.state;
      this._tips = [
        { id: 'welcome', screen: 'map',
          when: () => s().stage === 1 && s().roundInStage === 1,
          spot: () => [document.querySelector('.mc-play')],
          gate: () => curScreen() === 'game' },
        { id: 'goal', screen: 'game',
          when: () => s().roundInStage === 1 && s().turn === 1,
          spot: () => [$('scorePanel')] },
        { id: 'rack', screen: 'game', spot: () => [el.rack] },
        { id: 'sortRank', screen: 'game', spot: () => [el.btnSortRank],
          gate: () => TUT.tmp.has('sort-rank') },
        { id: 'sortSuit', screen: 'game', spot: () => [el.btnSortSuit],
          gate: () => TUT.tmp.has('sort-suit') },
        { id: 'selectPer', screen: 'game',
          when: () => s().hand.filter(x => x.number === 7 && !x.jokerTile).length >= 3,
          spot: () => [el.rack],
          gate: () => {
            const sel = [...selection].map(id => s().hand.find(x => x.id === id)).filter(Boolean);
            return sel.filter(x => x.number === 7).length >= 3 || s().staged.length > 0;
          } },
        { id: 'openBtn', screen: 'game',
          spot: () => [el.btnAddCombo],
          gate: () => s().staged.length > 0 || s().openedThisTurn },
        { id: 'confirmBtn', screen: 'game',
          spot: () => [el.btnConfirm],
          gate: () => s().openedThisTurn || s().phase === 'discard' },
        { id: 'score', screen: 'game',
          when: () => s().score > 0 && s().roundInStage === 1,
          spot: () => [$('scorePanel')] },
        { id: 'discard1', screen: 'game',
          when: () => s().phase === 'discard' && s().roundInStage === 1,
          spot: () => [el.rack, el.btnDiscard],
          gate: () => s().turn >= 2 },
        { id: 'isleme', screen: 'game',
          when: () => s().roundInStage === 1 && s().turn === 2 && s().prevOpen.length > 0 &&
            s().hand.some(x => x.color === 'yellow' && x.number === 7 && !x.jokerTile) &&
            Game.canIsleme(0),
          spot: () => [el.meldArea, el.rack],   // Grup D: işleme alanı sağ üstte
          gate: () => s().islemeler.length >= 1 ||
            (s().prevOpen[0] && s().prevOpen[0].tiles.length >= 4) || !s().prevOpen.length },
        { id: 'islemeConfirm', screen: 'game',
          when: () => s().islemeler.length >= 1,
          spot: () => [el.btnConfirm],
          gate: () => s().islemeler.length === 0 },
        { id: 'okey', screen: 'game',
          when: () => s().turn >= 2 && s().roundInStage === 1,
          spot: () => [el.okeyChip] },
        { id: 'freeplay', screen: 'game',
          when: () => s().roundInStage === 1 },
        { id: 'islekHit', screen: 'game',
          when: () => TUT.flags.islekHit },
        { id: 'store1', store: true,
          when: () => s().roundInStage === 1,
          spot: () => [el.storeItems.querySelector('.store-item')],
          gate: () => s().jokers.length > 0 },
        { id: 'store2', store: true,
          when: () => s().roundInStage === 1 && s().jokers.length > 0,
          spot: () => [el.btnStoreContinue],
          gate: () => !storeOpen() },
        { id: 'jokerFire', screen: 'game',
          when: () => TUT.flags.jokerFire,
          spot: () => [el.jokerSlots] },
        { id: 'bossIntro', screen: 'map',
          when: () => s().roundInStage === 3,
          spot: () => [document.querySelector('.map-card.boss')],
          gate: () => curScreen() === 'game' },
        { id: 'bossBanner', screen: 'game',
          when: () => s().roundInStage === 3 && s().status === 'playing',
          spot: () => [el.bossBanner] },
        { id: 'upgrade', up: true,
          spot: () => [el.upOptions],
          gate: () => !s().upgradeOffer },
        { id: 'bossStore', store: true,
          when: () => s().roundInStage === 3 && s().status === 'won',
          spot: () => [el.btnStoreContinue] },
      ];
      return this._tips;
    },

    /* --- deterministik 1. raund: öğretilebilir el + destede Sarı 7 --- */
    seedRound1() {
      const s = Game.state;
      s.okey = { color: 'yellow', number: 5 };
      const deck = createDeck();
      for (const x of deck) if (x.fakeOkey) { x.color = 'yellow'; x.number = 5; }
      const pull = (color, num) => {
        const i = deck.findIndex(x => x.color === color && x.number === num && !x.fakeOkey);
        return i >= 0 ? deck.splice(i, 1)[0] : null;
      };
      const hand = [];
      [['red', 7], ['blue', 7], ['black', 7],        // hazır Per
       ['yellow', 3], ['yellow', 3],                  // hazır Çift
       ['red', 9], ['red', 10], ['red', 11],          // hazır Sıralı
       ['yellow', 5],                                 // okey (joker)
       ['blue', 2]].forEach(([c, n]) => {             // atılacak ufak taş
        const x = pull(c, n);
        if (x) hand.push(x);
      });
      // işleme anı: Sarı 7 destenin tepesine
      const y7i = deck.findIndex(x => x.color === 'yellow' && x.number === 7 && !x.fakeOkey);
      if (y7i > 0) deck.unshift(deck.splice(y7i, 1)[0]);
      // eli 15'e tamamla (deste tepesindeki Sarı 7'ye dokunmadan)
      while (hand.length < 15 && deck.length > 1) hand.push(deck.splice(1, 1)[0]);
      s.hand = hand;
      s.deck = deck;
      // okey artık fiziksel işaretle tespit edilir (engine isOkeyReal) —
      // kurgu el okeyi elle değiştirdiği için işaretler burada yenilenir
      for (const x of [...hand, ...deck])
        x.isOkeyReal = !x.fakeOkey && !x.jokerTile && x.color === 'yellow' && x.number === 5;
      s.discardPile = [];
      // sabit, basit boss: Ahtapot (puanın %15'i emilir)
      const aht = BOSSES.find(b => b.key === 'ahtapot');
      s.bossOrder = [aht, ...s.bossOrder.filter(b => b.key !== 'ahtapot')];
      s.boss = aht;
    },

    start() {
      this._dom();
      this.saved = { state: Game.state };
      Game.tutorialMode = true;
      Game.newRun();
      this.seedRound1();
      this.active = true;
      this.seen.clear();
      this.tmp.clear();
      this.flags = {};
      this.cur = null;
      selection.clear();
      newTileIds.clear();
      showScreen('map');
      this._spotKey = null;
      this._track();
      this.update();
    },

    mark(tag) {
      if (!this.active) return;
      this.tmp.add(tag);
      this.update();
    },

    flag(id) {
      if (!this.active) return;
      this.flags[id] = true;
      this.update();
    },

    byId(id) { return this.tips.find(x => x.id === id); },

    update() {
      if (!this.active || !this.panel) return;
      const scr = curScreen();
      const inStore = storeOpen();
      const inUp = upgradeOpen();
      const fits = (tp) => tp.up ? inUp
        : tp.store ? (inStore && !inUp)
        : (!inStore && !inUp && (!tp.screen || tp.screen === scr));
      // aktif ipucu: kapısı sağlandıysa kapat, ekran değiştiyse beklet
      if (this.cur) {
        const tp = this.byId(this.cur);
        if (tp.gate && tp.gate()) { this.seen.add(tp.id); this.cur = null; }
        else if (!fits(tp)) {
          this.cur = null;
          this._hideBalloon();
        } else {
          this._renderBalloon(tp);
          return;
        }
      }
      // sıradaki uygun ipucunu bul
      for (const tp of this.tips) {
        if (this.seen.has(tp.id)) continue;
        if (!fits(tp)) continue;
        if (tp.when && !tp.when()) continue;
        this.cur = tp.id;
        this._renderBalloon(tp);
        return;
      }
      this._hideBalloon();
    },

    /* --- balon + spot DOM'u --- */
    _dom() {
      if (this.panel) return;
      this.spotEl = document.createElement('div');
      this.spotEl.id = 'tutSpot';
      this.spotEl.style.opacity = '0';
      document.body.appendChild(this.spotEl);
      this.panel = document.createElement('div');
      this.panel.id = 'tutPanel';
      this.panel.classList.add('coach');
      this.panel.innerHTML =
        `<div class="tp-body"></div>` +
        `<div class="tp-btns">` +
        `<button class="tp-quit"></button>` +
        `<button class="btn primary tp-next"></button>` +
        `</div>`;
      document.body.appendChild(this.panel);
      this.panel.classList.add('hidden');
      this.panel.querySelector('.tp-quit').addEventListener('click', () => this.end('menu'));
      this.panel.querySelector('.tp-next').addEventListener('click', () => {
        if (this.cur) { this.seen.add(this.cur); this.cur = null; SFX.tick(); this.update(); }
      });
    },

    _renderBalloon(tp) {
      this.panel.classList.remove('hidden');
      this.panel.querySelector('.tp-body').innerHTML = T.tut(tp.id);
      this.panel.querySelector('.tp-next').classList.toggle('hidden', !!tp.gate);
      this.panel.querySelector('.tp-next').textContent = t('tutOk');
      this.panel.querySelector('.tp-quit').textContent = t('tutSkip');
      this._curSpot = tp.spot;
    },

    _hideBalloon() {
      if (this.panel) this.panel.classList.add('hidden');
      this._curSpot = null;
      if (this._spotKey !== 'off') {
        this._spotKey = 'off';
        if (this.spotEl) this.spotEl.style.opacity = '0';
      }
    },

    /* spot: hedefin GERÇEK render konumunu her frame ölç (animasyon/yeniden
       çizim çerçeveyi kaydıramaz; değişiklik yoksa stil yazılmaz) */
    _spot(els) {
      const sp = this.spotEl;
      if (!els || !els.length || els.every(e => !e)) {
        if (this._spotKey !== 'off') { this._spotKey = 'off'; sp.style.opacity = '0'; this._placePanel(null); }
        return;
      }
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      for (const e of els) {
        if (!e) continue;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top);
        x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom);
      }
      if (x1 === Infinity) {
        if (this._spotKey !== 'off') { this._spotKey = 'off'; sp.style.opacity = '0'; this._placePanel(null); }
        return;
      }
      const key = Math.round(x1) + ',' + Math.round(y1) + ',' + Math.round(x2) + ',' + Math.round(y2);
      if (key === this._spotKey) return;
      this._spotKey = key;
      const pad = 8;
      sp.style.opacity = '1';
      sp.style.left = (x1 - pad) + 'px';
      sp.style.top = (y1 - pad) + 'px';
      sp.style.width = (x2 - x1 + pad * 2) + 'px';
      sp.style.height = (y2 - y1 + pad * 2) + 'px';
      this._placePanel({ top: y1, bottom: y2 });
    },

    _track() {
      cancelAnimationFrame(this._raf);
      const loop = () => {
        if (!this.active) return;
        this._spot(this._curSpot ? this._curSpot().filter(Boolean) : []);
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    },

    _placePanel(rect) {
      const p = this.panel;
      if (!p || p.classList.contains('hidden')) return;
      if (!rect) {
        p.style.top = '50%';
        p.style.bottom = 'auto';
        p.style.transform = 'translate(-50%, -50%)';
        return;
      }
      const mid = (rect.top + rect.bottom) / 2;
      if (mid > window.innerHeight / 2) { p.style.top = '24px'; p.style.bottom = 'auto'; }
      else { p.style.top = 'auto'; p.style.bottom = '24px'; }
      p.style.transform = 'translateX(-50%)';
    },

    /* raund kaybedilirse: baştan (öğreticide run bitmez) */
    retryRound() {
      const s = Game.state;
      s.status = 'playing';
      Game._startRound();
      if (s.roundInStage === 1 && !this.seen.has('isleme')) this.seedRound1();
      selection.clear();
      newTileIds.clear();
      showScreen('game');
      flushRoundStart();
    },

    /* boss geçildi + store kapandı → tamamlama */
    finish() {
      const ov = document.createElement('div');
      ov.id = 'tutResume';
      ov.innerHTML =
        `<div class="tp-box"><h3>${t('tutFinishTitle')}</h3>` +
        `<p>${t('tutFinishBody')}</p>` +
        `<div class="tr-row">` +
        `<button class="btn primary" id="tfPlay">${t('tutFinishPlay')}</button>` +
        `<button class="btn ghost" id="tfMenu">${t('tutFinishMenu')}</button>` +
        `</div></div>`;
      document.body.appendChild(ov);
      ov.querySelector('#tfPlay').addEventListener('click', () => { ov.remove(); this.end('play'); });
      ov.querySelector('#tfMenu').addEventListener('click', () => { ov.remove(); this.end('menu'); });
    },

    end(mode) {
      if (!this.active) return;
      this.active = false;
      cancelAnimationFrame(this._raf);
      this._hideBalloon();
      if (this.spotEl) this.spotEl.style.opacity = '0';
      el.storeOverlay.classList.add('hidden');
      el.upgradeOverlay.classList.add('hidden');
      el.overlay.classList.add('hidden');
      Game.tutorialMode = false;
      localStorage.setItem('okeyTutDone', '1');
      // gerçek durumu geri yükle — öğretici oyun state'ini bozmaz
      if (this.saved) {
        Game.state = this.saved.state;
        this.saved = null;
      }
      selection.clear();
      newTileIds.clear();
      if (mode === 'play') {
        Game.newRun();
        showScreen('map');
        showOkeyBanner();
      } else {
        showScreen('menu');
      }
    },
  };

  el.btnTutorial.addEventListener('click', () => TUT.start());

  /* Grup E kancası: gerçek uygulaması aşağıda (ses düğmesi kurulurken)
     atanır; o ana kadar sessizce hiçbir şey yapmaz. */
  let refreshSfxLabel = () => {};

  /* ---------- Menüler / pause (Grup D) ---------- */

  function startNewRun(mode) {
    clearSave();
    Game.newRun(mode);
    selection.clear();
    newTileIds.clear();
    showScreen('map');
    /* MADDE D4 — açılış jokerleri varsa ÖNCE çark döner, okey banner'ı
       ondan sonra gelir: iki duyuru üst üste binmesin. */
    const opening = Game.state.openingJokers;
    if (opening && opening.length)
      showOpeningReel(opening, Game.state.openingReels, () => showOkeyBanner());
    else showOkeyBanner(); // maskot okeyi ilan eder (GDD 14.2)
    SFX.draw();
  }

  /* ============================================================
     MADDE D4 (kullanıcı kararı 2026-09-09) — RUN MODU SEÇİMİ
     Ana menü Figma frame'inin (74:3) birebir uygulanmış hâlidir ve
     "tasarıma eleman ekleme/çıkarma yok" kuralı geçerlidir; bu yüzden
     menüye YENİ DÜĞME EKLENMEDİ. Bunun yerine OYNA!'ya basınca araya
     bir seçim katmanı girer. Katman, oyunun mevcut diyalog dilini
     (#tutResume / .tp-box) kullanır — yani yeni bir görsel dil icat
     edilmedi, var olanın üstüne kuruldu.
     Kilit durumu `Modes.unlocked()`ten okunur; şu an her iki mod da
     açıktır (kullanıcı kararı: "bu modu kilitli yapma").
     ============================================================ */
  /* ============================================================
     MADDE D5 (kullanıcı kararı 2026-09-09) — KADEMELİ İPUCU
     Oyun kendi sistemlerini oyuncuya anlatmıyordu: joker yaşlanması,
     faiz, catch-up rafı, tahvil, takas ve backup slotu hiçbir yerde
     açıkça söylenmiyor. (Gambonanza araştırmasının en somut bulgusu da
     buydu: oyunun anlatmadığını üçüncü parti rehberler anlatıyor.)

     Kural: her ipucu ÖMÜR BOYU BİR KEZ gösterilir ve bunu tarayıcı
     profilinde saklar — "YENİ!" rozetiyle (okeyOwnedEver) aynı desen.
     Kartlar `hold: true` ile gelir: kendiliğinden kaybolmaz, oyuncu
     tıklayınca kapanır. Böylece ipucu okunmadan kaçmaz ama tekrar eden
     bir duvar da oluşturmaz.

     ⚠ TRAINER MODUNDA HİÇ GÖSTERİLMEZ: orası test alanıdır ve ipuçları
     koleksiyon/istatistik sayaçları gibi trainer'a bulaşmamalıdır.
     ============================================================ */
  const HINTS_KEY = 'okeyHintsSeen';
  const Hints = {
    _read() {
      try { return new Set(JSON.parse(localStorage.getItem(HINTS_KEY) || '[]')); }
      catch (e) { return new Set(); }
    },
    seen(key) { return this._read().has(key); },
    /* Bir ipucunu bir kez göster. `key` i18n'de `hint_<key>` olarak durur. */
    show(key) {
      if (Game.trainerMode || TUT.active) return false;
      const set = this._read();
      if (set.has(key)) return false;
      set.add(key);
      try { localStorage.setItem(HINTS_KEY, JSON.stringify([...set])); } catch (e) {}
      notify([`💡 ${t('hint_' + key)}`], true, { hold: true });
      return true;
    },
    /* Ayarlardan "ipuçlarını sıfırla" için (ileride bağlanabilir). */
    reset() { try { localStorage.removeItem(HINTS_KEY); } catch (e) {} },
  };

  /* ============================================================
     MADDE D3 (kullanıcı kararı 2026-09-09) — RUN SONU ÖZETİ
     Run bitince oyuncu neden kaybettiğini bilmiyordu. Dört satır, dördü de
     motorun `stat*` sayaçlarından okunur (bkz. engine gainCoins/spendCoins):
       · eksik puan          → hedefe ne kadar yaklaşıldı
       · coin gelir / gider  → ekonomi gerçekten yetmedi mi
       · süresi dolan joker  → tahta boşaldığı için mi kaybedildi
       · en yüksek açılım    → build tavanı neredeydi
     Bu aynı zamanda DENGE ÖLÇÜMÜNÜN gerçek oyuncudan gelen ilk kaynağıdır;
     şimdiye kadar yalnız bot simülasyonu (econ_audit) vardı.
     ============================================================ */
  function runSummaryHtml(s) {
    const eksik = Math.max(0, (s.target || 0) - (s.score || 0));
    const rows = [
      [t('sumMissing'), `${eksik}`],
      [t('sumCoinFlow'), `${COIN} +${s.statCoinIn || 0} / −${s.statCoinOut || 0}`],
      [t('sumExpired'), `${s.statExpired || 0}`],
      [t('sumBestMeld'), `${s.statBestMeld || 0}`],
    ];
    return `<hr style="border-color:#3a3a5e;margin:10px 0">` +
      `<div class="run-sum"><b>${t('sumTitle')}</b>` +
      rows.map(([k, v]) => `<div class="rs-line"><span>${k}</span><b>${v}</b></div>`).join('') +
      `</div>`;
  }

  function pickRunMode(onPick) {
    const ov = document.createElement('div');
    ov.id = 'tutResume';
    ov.className = 'mode-pick';
    /* İki kart da AYNI görsel ağırlıkta: hiçbiri "varsayılan" değil, ikisi de
       gerçek bir seçim. (İlk hâlde biri primary biri ghost'tu; ghost kart
       menü arkaplanında silik okunuyordu.) */
    const card = (key, name, desc, locked) =>
      `<button class="btn mp-card" data-mode="${key}"${locked ? ' disabled' : ''}>` +
      `<span class="mp-name">${name}${locked ? ' 🔒' : ''}</span>` +
      `<span class="mp-desc">${locked ? t('modeLockedTip') : desc}</span></button>`;
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('modePickTitle')}</h3>` +
      `<p>${t('modePickBody')}</p>` +
      `<div class="tr-row mp-row">` +
      card('base', t('modeName_base'), t('modeDesc_base'), !Modes.unlocked('base')) +
      card('hizli', t('modeName_hizli'), t('modeDesc_hizli'), !Modes.unlocked('hizli')) +
      `</div>` +
      `<div class="tr-row" style="margin-top:12px">` +
      `<button class="btn ghost" id="mpCancel">${t('backBtn')}</button></div></div>`;
    document.body.appendChild(ov);
    ov.querySelectorAll('.mp-card').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      ov.remove();
      onPick(b.dataset.mode);
    }));
    ov.querySelector('#mpCancel').addEventListener('click', () => ov.remove());
  }

  /* ============================================================
     MADDE D4 + PLAYTEST 26 · MADDE D — AÇILIŞ SLOT ÇARKI
     Açılış ödülü eskiden "kart yüzünü gösterir" biçiminde açılıyordu:
     ritüel değil, bir bildirimdi. Kullanıcı kararı (2026-09-09): açılış
     jokeri store paketlerindeki SLOT MAKİNESİYLE belirlensin. Artık
     birebir o sahne kullanılır — aynı `.pk-*` iskeleti, aynı şerit
     kayması, aynı "tak…tak" duraklama sırası, aynı açıklamalı sonuç
     kartları. İki yerde iki ayrı çark dili yaşamasın diye YENİ bir görsel
     dil icat EDİLMEDİ; store'da öğrenilen okuma burada da geçerlidir.

     ⚠ Rastgelelik burada DEĞİL: şeritler de kazananlar da motorda
     (`_grantOpeningJokers` → `s.openingReels`) belirlenir. Bu fonksiyon
     yalnız o sonucu seyredilir kılar. Eski kayıtlarda `openingReels`
     bulunmayabilir; o durumda tek sembollü şeritle sessizce çalışır.
     ============================================================ */
  function showOpeningReel(list, reels, done) {
    const strips = (reels && reels.length === list.length) ? reels : list.map(j => [j]);
    const ov = document.createElement('div');
    ov.id = 'packOv';
    ov.className = 'pk-ov tone-azure open-reel';
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">🎰 ${t('openReelTitle')}</div>` +
      `<div class="pk-sub-title">${t('openReelBody', list.length)}</div>` +
      `<div class="pk-body pk-slot"></div>` +
      `<div class="pk-foot"><span class="pk-hint">${t('packSlotSpin')}</span></div></div>`;
    document.body.appendChild(ov);
    const body = ov.querySelector('.pk-body');
    const foot = ov.querySelector('.pk-foot');
    const els = [];
    strips.forEach((reel) => {
      const wrap = document.createElement('div');
      wrap.className = 'pk-reel';
      const strip = document.createElement('div');
      strip.className = 'pk-strip';
      reel.forEach(sym => {
        const cell = document.createElement('div');
        cell.className = `pk-sym r-${sym.rarity || 'special'}`;
        cell.innerHTML = packFaceHtml(sym);
        strip.appendChild(cell);
      });
      wrap.appendChild(strip);
      wrap.innerHTML += '<div class="pk-reel-line"></div>' +
        `<div class="pk-stop">${t('packSlotStop')}</div>`;
      body.appendChild(wrap);
      els.push(wrap.querySelector('.pk-strip'));
    });
    requestAnimationFrame(() => {
      els.forEach((strip, i) => {
        const cellH = strip.firstElementChild.offsetHeight || 106;
        const dist = cellH * (strip.children.length - 1);
        const dur = 2.1 + i * 0.75;
        strip.style.transition = `transform ${dur}s cubic-bezier(.10,.62,.16,1)`;
        strip.style.transform = `translateY(${-dist}px)`;
        let ticks = 0;
        const tick = setInterval(() => { SFX.tick(); if (++ticks > 22) clearInterval(tick); }, dur * 1000 / 26);
        setTimeout(() => {
          clearInterval(tick);
          strip.parentElement.classList.add('landed');
          SFX.coin();
          if (i === els.length - 1) finish();
        }, dur * 1000 + 60);
      });
    });
    function finish() {
      foot.innerHTML = '';
      // açıklamalı sonuç kartları — paket çarkındakiyle aynı
      const rw = document.createElement('div');
      rw.className = 'pk-result';
      list.forEach((x, i) => {
        const c = document.createElement('div');
        c.className = `pk-rcard r-${x.rarity || 'special'}`;
        c.style.animationDelay = `${i * 0.09}s`;
        c.innerHTML = packFaceHtml(x) + `<div class="pk-desc">${packFaceDesc(x)}</div>`;
        rw.appendChild(c);
      });
      ov.querySelector('.pk-box').insertBefore(rw, foot);
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = t('packTake');
      b.addEventListener('click', () => {
        ov.remove();
        if (done) done();
      });
      foot.appendChild(b);
      b.focus();
    }
  }

  function resumeSave(save) {
    try {
      Game.restore(save.data);
    } catch (e) {
      clearSave();
      startNewRun();
      return;
    }
    Game.trainerMode = false; // kayıtlar yalnız normal moddan gelir (trainer kayıt yazmaz)
    selection.clear();
    newTileIds.clear();
    const s = Game.state;
    if (s.status === 'won' && s.upgradeOffer) {
      // boss sonrası güçlendirme seçiminde bırakılmıştı (Grup H)
      showScreen('game');
      showUpgradeScene();
    } else if (s.status === 'won' && s.store) {
      // store'da bırakılmıştı — doğrudan store sahnesine dön (Grup C)
      showScreen('game');
      openStore();
    } else {
      showScreen('map');
    }
  }

  el.btnPlay.addEventListener('click', () => {
    const save = loadSave();
    // MADDE D4 — kayıt yoksa önce mod seçimi
    if (!save) { pickRunMode(m => startNewRun(m)); return; }
    if (save.where === 'inStore') {
      // store'da (veya yükseltme seçiminde) bırakıldı → doğrudan oraya dön
      resumeSave(save);
      toast(t('resumedToast'), true);
      return;
    }
    if (save.where === 'inRound') {
      // raund içinde bırakıldı → o raundun BAŞINDAN devam (harita ekranından)
      resumeSave(save);
      toast(t('roundRestartToast'), true);
      return;
    }
    // raund arasında bırakıldı → seçenek sun
    const ov = document.createElement('div');
    ov.id = 'tutResume';
    const s2 = JSON.parse(save.data);
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('resumeTitle')}</h3>` +
      `<p>${t('resumeBody', s2.stage, t('resumeRoundName', s2.roundInStage))}</p>` +
      `<div class="tr-row">` +
      `<button class="btn primary" id="rsGo">${t('resumeBtn')}</button>` +
      `<button class="btn ghost" id="rsNew">${t('newRunBtn')}</button>` +
      `</div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#rsGo').addEventListener('click', () => {
      ov.remove();
      resumeSave(save);
      toast(t('resumedToast'), true);
    });
    // MADDE D4 — "yeni run" da mod seçiminden geçer
    ov.querySelector('#rsNew').addEventListener('click', () => {
      ov.remove(); pickRunMode(m => startNewRun(m));
    });
  });

  /* GRUP I (2026-09-07): haritadaki "Ana Menü" düğmesi kaldırıldı —
     tasarımda yok. Ana menüye artık haritanın DURAKLAT düğmesindeki
     menüden gidilir; menü oyun ekranındakinin birebir eşi, ses düğmesi
     de aynı anahtarı çevirir (tek kaynak: #btnSfx). */
  el.btnMapPause.addEventListener('click', (e) => {
    e.stopPropagation();
    el.mapMenuPop.classList.toggle('hidden');
    fitMapPauseMenu();
  });
  document.addEventListener('click', (e) => {
    if (!el.mapMenuPop.contains(e.target)) el.mapMenuPop.classList.add('hidden');
  });
  el.btnMapGoMenu.addEventListener('click', () => {
    el.mapMenuPop.classList.add('hidden');
    Game.trainerMode = false;
    showScreen('menu');
  });
  el.btnMapSettings.addEventListener('click', () => {
    el.mapMenuPop.classList.add('hidden');
    showSettings();
  });
  el.btnMapSfx.addEventListener('click', () => {
    el.btnSfx.click();                       // ses anahtarı TEK yerde durur
    el.btnMapSfx.textContent = el.btnSfx.textContent;
  });
  el.btnMapInfo.addEventListener('click', showRunInfo);
  function fitMapPauseMenu() {
    if (!el.mapMenuPop || el.mapMenuPop.classList.contains('hidden')) return;
    el.mapMenuPop.querySelectorAll('.btn').forEach(b => fitText(b, PAUSE_BASE, PAUSE_MIN, true));
  }

  /* PLAYTEST 18 · GRUP E — PAUSE MENÜSÜ ETİKETLERİ KUTULARINA SIĞSIN.
     CSS kutuyu içeriğe göre büyütür (max-content, tavan 420px); bu da
     yetmezse yazı kademeli küçültülür. Ölçüm ancak menü GÖRÜNÜRKEN doğru
     çalışır (gizli elemanın genişliği 0'dır), o yüzden menü her açıldığında
     ve dil değiştiğinde çağrılır. `fitText` aksiyon barıyla aynı yöntemdir:
     tabandan başlayıp gerçek içerik kutusu sığana kadar 1px azaltır. */
  const PAUSE_BASE = 20, PAUSE_MIN = 12;
  function fitPauseMenu() {
    if (!el.menuPop || el.menuPop.classList.contains('hidden')) return;
    el.menuPop.querySelectorAll('.btn').forEach(b => fitText(b, PAUSE_BASE, PAUSE_MIN, true));
  }

  el.btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    el.menuPop.classList.toggle('hidden');
    fitPauseMenu();
  });
  document.addEventListener('click', (e) => {
    if (!el.menuPop.contains(e.target)) el.menuPop.classList.add('hidden');
  });
  // Pause: yalnız "Ana Menüye Dön" + "Ayarlar" (Grup D)
  el.btnGoMenu.addEventListener('click', () => {
    el.menuPop.classList.add('hidden');
    if (TUT.active) { TUT.end('menu'); return; }
    Game.trainerMode = false; // trainer run'dan çıkış — badge/kayıt normale döner
    // kayıt zaten raund başında alındı (raund içi çıkış → raund baştan)
    showScreen('menu');
  });
  el.btnPauseSettings.addEventListener('click', () => {
    el.menuPop.classList.add('hidden');
    showSettings();
  });

  /* ============================================================
     PLAYTEST 20 · GRUP R — MOD KİLİT SİSTEMİ (Balatro tarzı)
     Kural (kullanıcı, 2026-08-30): "İlk Temel Run" (normal 8 stage'lik run)
     tamamlanana kadar alternatif oyun modları KİLİTLİ kalır; tamamlanınca
     açılır. TRAINER MODU bu kilidin DIŞINDADIR — test amaçlı, her zaman
     erişilebilir olmalı ve hiçbir koşulda kilitlenmemelidir.

     ANA MENÜYE YENİ DÜĞME EKLENMEDİ. Menü Figma frame'inin (74:3) birebir
     uygulanmış hâlidir ve "tasarıma eleman ekleme/çıkarma yok" kuralı
     geçerlidir. Bu yüzden sistem bir ALTYAPI olarak kuruldu:
       · `MODES` kaydı — her modun kilit koşulu tek satırda tanımlanır,
       · `Modes.unlocked(key)` — kilit sorgusu,
       · `Modes.complete('base')` — ilk run bitince çağrılır ve kilit açılır,
       · `Modes.applyLocks()` — kayıtta `btn` alanı olan her mod düğmesine
         kilit rozetini ve engelleyici tıklamayı uygular.
     Gelecekte bir mod eklendiğinde YALNIZCA `MODES`e bir satır yazmak
     yeter; menüde düğmesi olduğu anda kilidi de kendiliğinden işler.
     Durum ekranda Koleksiyon sahnesindeki "MODLAR" bölümünde görünür.
     ============================================================ */
  const MODES_KEY = 'okeyModes';
  const MODES = [
    /* Temel run — her zaman açık, kilidi AÇAN moddur. */
    { key: 'base', btn: 'btnPlay', requires: null },
    /* Trainer — KİLİDE DAHİL DEĞİL. `never: true` bunu açıkça söyler;
       requires alanı boş bırakılsa bile ileride biri yanlışlıkla koşul
       eklerse bu bayrak onu geçersiz kılar. */
    { key: 'trainer', btn: 'btnTrainer', requires: null, never: true },
    /* MADDE D4 (kullanıcı kararı 2026-09-09) — HIZLI RUN (4 stage).
       `requires: null` → KİLİTLİ DEĞİL (kullanıcı açıkça "bu modu kilitli
       yapma" dedi). `btn` alanı YOK: menüde kendi düğmesi yoktur, OYNA!'ya
       basınca çıkan mod seçim katmanından seçilir (bkz. pickRunMode) —
       çünkü ana menü Figma frame'inin birebir uygulanmış hâlidir ve ona
       eleman eklenmez. Oynanış sayıları burada değil motorda (RUN_MODES).
       Gelecekte kilitli bir mod eklenecekse örnek:
         { key: 'endless', btn: 'btnEndless', requires: 'base' } */
    { key: 'hizli', requires: null },
  ];

  const Modes = {
    _read() {
      try { return JSON.parse(localStorage.getItem(MODES_KEY)) || {}; }
      catch (e) { return {}; }
    },
    _write(o) {
      try { localStorage.setItem(MODES_KEY, JSON.stringify(o)); } catch (e) {}
    },
    /* Bir modun tamamlanıp tamamlanmadığı (kilit koşullarının kaynağı). */
    done(key) { return !!this._read()[key]; },
    /* Mod oynanabilir mi? */
    unlocked(key) {
      const m = MODES.find(x => x.key === key);
      if (!m) return true;
      if (m.never || !m.requires) return true;
      return this.done(m.requires);
    },
    /* Bir mod tamamlandı — kilitleri aç. Yeni açılan modların listesini
       döndürür ki UI bunları duyurabilsin. */
    complete(key) {
      const st = this._read();
      if (st[key]) return [];
      const before = MODES.filter(m => this.unlocked(m.key)).map(m => m.key);
      st[key] = true;
      this._write(st);
      const opened = MODES.filter(m => this.unlocked(m.key) && !before.includes(m.key));
      this.applyLocks();
      return opened;
    },
    /* Menüdeki mod düğmelerine kilit görünümünü ve engelini uygula. */
    applyLocks() {
      for (const m of MODES) {
        const b = m.btn && document.getElementById(m.btn);
        if (!b) continue;
        const open = this.unlocked(m.key);
        b.classList.toggle('mode-locked', !open);
        b.disabled = !open;
        b.title = open ? '' : t('modeLockedTip');
      }
    },
    /* Koleksiyon sahnesindeki durum listesi. */
    statusRows() {
      return MODES.map(m => ({
        key: m.key, open: this.unlocked(m.key), never: !!m.never,
        done: this.done(m.key),
      }));
    },
  };

  /* ---------- Ayarlar (Grup C) ---------- */

  /* ==========================================================================
     RENK TEMASI (Playtest 22 · kullanıcı kararı 2026-09-06)
     Kaynak: Figma OKEY-101 · 245:799 "RENK DENEME 1" ve 245:977 "RENK DENEME 2".
     Dosyada Figma DEĞİŞKENİ tanımlı değil (`get_variable_defs` boş döner) ve
     katman adlarındaki hex'ler eskimişti; aşağıdaki tonlar frame'lerden
     ÖLÇÜLDÜ (piksel örnekleme + SVG dolgu okuması).

     Tema yalnız ÜÇ tonu değiştirir — vurgu · açık · yüzey. Değişmeyenler
     bilinçlidir: taş renkleri (kırmızı/mavi/sarı/siyah), okey moru, coin
     paneli ve para metni, TURN pipleri, nadirlik renkleri. Gerekçe: bunlar
     dekorasyon değil BİLGİ taşır; temaya göre kayarlarsa oyuncunun okuduğu
     şey değişir.

     Uygulama `html[data-theme]` ile: CSS tarafında hem renk tokenları hem de
     oyun ekranının SVG arkaplanları (--img-*) aynı seçiciyle takas edilir.
     'yesil' varsayılandır ve ÖZNİTELİK YAZMAZ — böylece tema sistemi
     eklenmeden önceki CSS yolu birebir korunur. */
  /* PLAYTEST 32 (2026-09-13) — liste KAPALI: oyunda tam bu 4 tema var,
     yenisi eklenmez. Anahtarlar eski kayıtlar bozulmasın diye aynı kaldı;
     görünen adlar i18n'de (Çayır · Erik · Bal · Gece). Coin paneli artık
     temayla birlikte boyanıyor (Figma'nın dört frame'inde de öyle). */
  const THEMES = [
    { key: 'yesil',    sw: ['#66862C', '#AEDF7A', '#BBD09E'] },   // Figma 320:221
    { key: 'mor',      sw: ['#4E1D4C', '#EBD3A2', '#D9CAB2'] },   // Figma 245:799
    { key: 'amber',    sw: ['#BB7125', '#FFEFAE', '#FFEFAE'] },   // Figma 245:977
    { key: 'lacivert', sw: ['#12354E', '#D9CFA7', '#D9CFA7'] },   // Figma 245:1310
  ];
  const THEME_KEY = 'okeyTheme';

  function readTheme() {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (THEMES.some(x => x.key === t)) return t;
    } catch (e) { /* gizli sekme / dosya kısıtı — tema kozmetiktir */ }
    return 'yesil';
  }

  let themeKey = readTheme();

  function applyTheme(key, persist = true) {
    if (!THEMES.some(x => x.key === key)) key = 'yesil';
    themeKey = key;
    const root = document.documentElement;
    if (key === 'yesil') delete root.dataset.theme;
    else root.dataset.theme = key;
    if (persist) { try { localStorage.setItem(THEME_KEY, key); } catch (e) {} }
  }

  /* index.html <head> içindeki satır temayı ilk boyamadan önce zaten
     uyguladı; burada yalnız modül durumunu onunla hizalıyoruz. */
  applyTheme(themeKey, false);

  function showSettings() {
    const old = document.getElementById('settingsOv');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'settingsOv';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('settingsTitle')}</h3>` +
      `<div class="set-row"><span class="set-label">${t('language')}</span>` +
      `<div class="set-langs">` +
      `<button class="set-lang${T.lang === 'tr' ? ' on' : ''}" data-lang="tr">🇹🇷 Türkçe</button>` +
      `<button class="set-lang${T.lang === 'en' ? ' on' : ''}" data-lang="en">🇬🇧 English</button>` +
      `</div></div>` +
      /* Renk teması — dil satırının hemen altında, aynı kalıpta.
         Her seçenek kendi üç tonunu şerit olarak gösterir (swatch), böylece
         oyuncu adı okumadan da hangi paleti seçtiğini görür. */
      `<div class="set-row"><span class="set-label">${t('colorTheme')}</span>` +
      `<div class="set-themes">` +
      THEMES.map(th =>
        `<button class="set-theme${th.key === themeKey ? ' on' : ''}" data-theme="${th.key}">` +
        `<span class="sw">${th.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>` +
        `<span>${t('theme_' + th.key)}</span></button>`).join('') +
      `</div></div>` +
      `<button class="btn ghost" id="setClose">${t('close')}</button></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#setClose').addEventListener('click', () => ov.remove());
    ov.querySelectorAll('.set-lang').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.lang === T.lang) return;
      T.setLang(b.dataset.lang);
      applyStaticTexts();
      // görünen ekranları yeni dille tazele
      if (curScreen() === 'game') render();
      if (curScreen() === 'map') renderMap();
      if (storeOpen()) renderStore();
      ov.remove();
      showSettings();
      toast(t('langChanged'), true);
    }));
    /* Tema anında uygulanır: CSS değişkeni değiştiği için açık olan HER
       ekran (oyun, store, ödül çarkı, modallar) yeniden çizim beklemeden
       döner. Yine de sayaç/etiket metinleri seçili temaya göre "on"
       sınıfını taşısın diye pencere tazelenir. */
    ov.querySelectorAll('.set-theme').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.theme === themeKey) return;
      applyTheme(b.dataset.theme);
      ov.remove();
      showSettings();
      toast(t('themeChanged', t('theme_' + themeKey)), true);
    }));
  }

  el.btnSettings.addEventListener('click', showSettings);

  /* Menü butonu etiketlerini plakaya sığdır (Figma v2).
     Tasarımın yazı boyutu esastır; yalnız taşan etiket kademeli küçültülür —
     TR "NASIL OYNANIR" gibi uzun etiketler sağdaki yuvarlak düğmenin
     üstüne binmesin. Menü gizliyken ölçüm 0 döner, o yüzden showScreen
     menüye geçerken de çağırır. */
  function fitMenuLabels() {
    document.querySelectorAll('#menuScreen .fm-btn').forEach(b => {
      b.style.fontSize = '';
      if (!b.clientWidth) return;                 // menü gizliyse ölçülemez
      const base = parseFloat(getComputedStyle(b).fontSize);
      let size = base;
      while (b.scrollWidth > b.clientWidth && size > base * 0.62) {
        size -= 1;
        b.style.fontSize = size + 'px';
      }
    });
  }

  /* Statik HTML metinlerini seçili dile göre uygula */
  function applyStaticTexts() {
    renderLogo(); // plaka içi başlık kilidi (Figma 95:439 + 94:2397/2398)
    // Menü etiketleri pxAccents'ten geçer (ş/ğ glifi fontta yok — bkz. PX_ACC)
    setMenuLabel(el.btnPlay, t('play'));
    setMenuLabel(el.btnTutorial, t('tutorialBtn'));
    setMenuLabel(el.btnSettings, t('settingsBtn'));
    setMenuLabel(el.btnCollection, t('collectionBtn'));
    setMenuLabel(el.btnTrainer, t('trainerBtn'));
    Modes.applyLocks();   // GRUP R (P20) — kilitli mod düğmeleri
    setMenuLabel(el.btnQuit, t('quitBtn'));
    fitMenuLabels();
    const menuNote = document.querySelector('.menu-note');
    if (menuNote) menuNote.textContent = t('menuNote', TOTAL_STAGES);
    /* GRUP I — haritanın Figma metinleri (oyun ekranıyla aynı anahtarlar) */
    $('lblMapTitle1').textContent = t('mapTitleL1');
    $('lblMapTitle2').textContent = t('mapTitleL2');
    $('lblMapScoreBox').innerHTML = t('scoreBoxLbl');
    $('lblMapStageBox').textContent = t('stageBoxLbl');
    $('lblMapRoundBox').textContent = t('roundBoxLbl');
    $('lblMapOkeyBox').innerHTML = t('mapOkeyBoxLbl');
    el.btnMapGoMenu.textContent = t('pauseMainMenu');
    el.btnMapSettings.textContent = t('pauseSettings');
    el.btnMapSfx.textContent = sfxLabel();
    $('lblJokers').textContent = t('jokersTitle');
    $('lblBackup').textContent = t('backupTitle').toLowerCase();
    // Figma: ıstakanın sağ omzu "Değnek" (oyun içi tüketilebilir alanı)
    $('lblConsum').textContent = t('totemTitle');
    $('lblMeld').textContent = t('meldTitle');
    $('lblScoreBox').innerHTML = t('scoreBoxLbl');
    $('lblStageBox').textContent = t('stageBoxLbl');
    $('lblRoundBox').textContent = t('roundBoxLbl');
    $('lblOkeyBox').textContent = t('okeyBoxLbl');
    $('sortLabel').textContent = t('sortLbl');
    el.btnSortRank.textContent = t('sortRank');
    el.btnSortSuit.textContent = t('sortSuit');
    /* DESTE / ATILAN metin etiketleri KALDIRILDI — Figma tasarımında bu
       yığınların altında yazı yoktur, yalnız kart ve sayaç vardır. */
    /* Figma aksiyon barındaki butonlar 90×60 — uzun etiket sığmıyor.
       Kısa etiket görünür, tam anlam `title` ipucunda kalır. */
    el.btnAddCombo.innerHTML = t('btnAddComboS'); el.btnAddCombo.title = t('btnAddCombo');
    el.btnConfirm.textContent = t('btnConfirmS'); el.btnConfirm.title = t('btnConfirm');
    el.btnSkip.textContent = t('btnSkipS');       el.btnSkip.title = t('btnSkip');
    el.btnDiscard.textContent = t('btnDiscardS'); el.btnDiscard.title = t('btnDiscard');
    el.btnGoMenu.textContent = t('pauseMainMenu');
    el.btnPauseSettings.textContent = t('pauseSettings');
    /* PLAYTEST 18 · GRUP E — ses düğmesi dil değişiminde Türkçe kalıyordu:
       etiketi yalnız kendi tıklama işleyicisi yazıyordu, `applyStaticTexts`
       ona hiç dokunmuyordu. Etiket üreteci dosyanın çok altında tanımlı
       olduğu için (TDZ) buradan doğrudan çağrılamaz; bir kanca üzerinden
       bağlanır ve o hazır olduğunda çalışır. */
    refreshSfxLabel();
    // Grup E: dil değişince etiket uzunluğu da değişir → yeniden ölç
    fitPauseMenu();
    $('storeTitle').textContent = t('storeTitle');
    $('storeSub').textContent = t('storeImprove');
    $('ssRoundLbl').textContent = t('storeStatsRound');
    $('ssCoinLbl').textContent = t('mapCoinLbl');
    $('ssPermLbl').textContent = t('mapPermLbl');
    $('ssSlotsTitle').textContent = t('storeSlotsTitle');
    $('ssBackupTitle').textContent = t('backupTitle');
    $('ssConsumTitle').textContent = t('consumTitle');
    el.btnStoreContinue.textContent = t('storeContinue');
  }

  /* ---------- Raund sonu ---------- */

  function showRoundEnd() {
    const s = Game.state;
    const won = s.status === 'won';
    if (won) SFX.win(); else SFX.lose();

    // Öğreticide kayıp = raundu tekrar dene (run bitmez)
    if (TUT.active && !won) {
      el.modalTitle.textContent = t('tutLostTitle');
      el.modalTitle.className = 'lose';
      el.modalBody.innerHTML = t('tutLostBody');
      el.modalBtn.textContent = t('tutLostBtn');
      el.overlay.classList.remove('hidden');
      return;
    }

    el.modalTitle.textContent = won
      ? (s.lastResult && s.lastResult.tamEl ? t('tamElWin')
        : s.coinReport.boss ? t('bossWin') : t('roundWin'))
      : t('gameOver');
    el.modalTitle.className = won ? 'win' : 'lose';

    if (won) {
      const over = s.score - s.target;
      const pct = Math.round((over / s.target) * 100);
      const cr = s.coinReport;
      let coinHtml = `<hr style="border-color:#3a3a5e;margin:10px 0">`;
      if (cr.survived) {
        coinHtml += `${t('kaptanSaved')}<br>${t('coinNet')} <b style="color:#F5A623">${COIN} +${cr.net}</b>`;
      } else {
        coinHtml +=
          `${t('coinBase', s.wonOnTurn, cr.boss)} <b>+${cr.base}</b><br>` +
          `${t('coinBonus', pct)} <b>+${cr.bonus}</b>`;
        /* MADDE C2 (2026-09-09): "4+ tur → tümü" uçurumu kalktı; ceza artık
           her zaman merdivenin bir basamağıdır. */
        if (cr.penalty > 0)
          coinHtml += `<br>${t('coinPenalty', cr.penalty)}`;
        coinHtml += `<br>${t('coinNet')} <b style="color:#F5A623">${COIN} +${cr.net}</b>`;
      }
      if (cr.jokerCoins > 0)
        coinHtml += `<br>${t('coinJoker')} <b style="color:#F5A623">${COIN} +${cr.jokerCoins}</b>`;
      if (cr.permCoin > 0)
        coinHtml += `<br>${t('coinPerm')} <b style="color:#F5A623">${COIN} +${cr.permCoin}</b>`;
      // MADDE E9 — tahvil geliri
      if (cr.bondCoin > 0)
        coinHtml += `<br>${t('coinBond', s.bonds || 0)} <b style="color:#F5A623">${COIN} +${cr.bondCoin}</b>`;
      // MADDE E1 — faiz (raund gelirinden SONRA, cebindeki toplam üzerinden)
      if (cr.interest > 0)
        coinHtml += `<br>${t('coinInterest')} <b style="color:#F5A623">${COIN} +${cr.interest}</b>`;
      /* MADDE D5 — raund sonuna bağlı ipuçları. Modal kapanınca görünsünler
         diye bir sonraki tik'e ertelenir; aksi hâlde kartlar modalın
         ARKASINDA açılır ve oyuncu hiç görmez. */
      setTimeout(() => {
        if (cr.interest > 0 && Hints.show('interest')) return;
        if ((s.lastExpired || []).length && Hints.show('expired')) return;
        if (s.jokers.length && Hints.show('jokerAge')) return;
      }, 60);
      if (cr.savedBy)
        coinHtml += `<br>${t('savedBy', T.ev(cr.savedBy))}`;
      if (cr.epicReward) {
        const p = cr.epicReward.placed;
        coinHtml += `<br><b style="color:#9B59B6">${t('epicReward', T.ev(cr.epicReward.name))}</b> ` +
          (p === 'slot' ? t('placedSlot')
            : p === 'backup' ? t('placedBackup')
            : p === 'deck' ? t('placedDeck')
            : t('placedSold'));
      }
      if (cr.extraNotes && cr.extraNotes.length)
        coinHtml += `<br><span style="color:#8f8fb4">${T.evAll(cr.extraNotes).join('<br>')}</span>`;
      el.modalBody.innerHTML =
        `${t('winBody', s.score, over, pct)}<br>` +
        t('wonOnTurn', s.wonOnTurn) +
        (s.permMult > 0 ? `<br>${t('permMultLine', s.permMult.toFixed(1))}` : '') +
        coinHtml;
      el.modalBtn.textContent = t('goStore');
    } else {
      clearSave(); // run bitti — devam edilecek bir şey kalmadı
      // Grup F: hedefe ulaşsan bile kaybettiren boss şartları neden kaybettiğini söylesin
      el.modalBody.innerHTML =
        (s.bossFail ? `<div class="boss-fail"><b>${t('bossFailTitle')}</b><br>${T.ev(s.bossFail)}</div>` : '') +
        t('loseBody', s.score, s.target,
          s.stage, t('resumeRoundName', s.roundInStage)) +
        runSummaryHtml(s);
      el.modalBtn.textContent = t('mainMenu');
    }
    el.overlay.classList.remove('hidden');
  }

  el.modalBtn.addEventListener('click', () => {
    const s = Game.state;
    el.overlay.classList.add('hidden');
    if (TUT.active && s.status === 'lost') { TUT.retryRound(); return; }
    if (s.status === 'won') {
      // Öğreticide ilk store: ucuz bir Bereket Taşı garanti (joker alma anı)
      if (TUT.active && s.roundInStage === 1 && s.store && !s.store.tutAdjusted) {
        s.store.tutAdjusted = true;
        const def = JOKER_DEFS.bereket;
        s.store.items[0] = { key: 'bereket', name: def.name, desc: def.desc,
          rarity: 'common', price: 3, discounted: true, sold: false };
        if (s.coins < 3) s.coins = 4;
      }
      /* Grup M — son stage'in boss'u geçildiyse run BURADA biter:
         güçlendirme ekranı da store da açılmaz, doğrudan zafer ekranı. */
      if (s.runFinished) { showRunComplete(); return; }
      // Grup H: boss geçildiyse zafer ekranından SONRA ayrı güçlendirme adımı
      if (s.upgradeOffer) { showUpgradeScene(); return; }
      openStore();
    } else if (s.status === 'runComplete') {
      clearSave();
      showScreen('menu');
    } else {
      showScreen('menu');
    }
  });

  /* ---------- Store (Grup G: rafta yalnız satılık ürünler) ---------- */

  function pickBuyDest(index, item) {
    const s = Game.state;
    // Deste jokeri (Grup G): hedef sorulmaz — doğrudan desteye karışır
    if (JOKER_DEFS[item.key]?.mech === 'deck') {
      const res = Game.buyJoker(index);
      if (!res.ok) { toast(res.error); return; }
      toast(t('boughtDeck', T.name(item)), true);
      SFX.coin();
      renderStore();
      render();
      return;
    }
    const old = document.getElementById('buyDest');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'buyDest';
    /* PLAYTEST 26 · MADDE C — üçüncü seçenek: TAKAS YAP.
       Ekranda artık "nereye koyayım" değil "nasıl alayım" sorulur:
       boş raf varsa doğrudan yerleştirilir, yoksa (ya da oyuncu isterse)
       mevcut bir kartla değiştirilir. Takas düğmesi raf DOLU OLMASA DA
       durur — kullanıcı kararı: "oyuncu isterse slot dolu olmasa bile". */
    const swaps = Game.swapBuyOptions ? Game.swapBuyOptions(index) : [];
    const canSwap = swaps.some(o => o.ok);
    const cheapest = swaps.filter(o => o.ok).reduce((a, o) => Math.min(a, o.net), Infinity);
    ov.innerHTML =
      `<div class="tp-box"><h3>${T.name(item)}</h3>` +
      `<p>${t('buyWhere')}</p>` +
      `<div class="tr-row">` +
      `<button class="btn primary" id="bdMain" ${s.jokers.length >= Game.slotCap() ? 'disabled' : ''}>${t('buyWhereMain', s.jokers.length, Game.slotCap())}</button>` +
      `<button class="btn primary" id="bdBackup" ${s.backup.length >= MAX_BACKUP ? 'disabled' : ''}>${t('buyWhereBackup', s.backup.length)}</button>` +
      (swaps.length
        ? `<button class="btn primary" id="bdSwap" ${canSwap ? '' : 'disabled'}>` +
          `${t('buySwapBtn', canSwap ? cheapest : item.price, COIN)}</button>` : '') +
      `<button class="btn ghost" id="bdCancel">${t('cancel')}</button>` +
      `</div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#bdCancel').addEventListener('click', () => ov.remove());
    const buy = (dest) => {
      ov.remove();
      const res = Game.buyJoker(index, dest);
      if (!res.ok) { toast(res.error); return; }
      toast(t('boughtTo', T.name(item), res.placed === 'backup' ? 'backup' : 'slot'), true);
      SFX.coin();
      renderStore();
      render();
      onJokerGained(res.key, res.jokerId);
    };
    ov.querySelector('#bdMain').addEventListener('click', () => buy('main'));
    ov.querySelector('#bdBackup').addEventListener('click', () => buy('backup'));
    ov.querySelector('#bdSwap')?.addEventListener('click', () => {
      ov.remove();
      pickSwapTarget(index, item);
    });
  }

  /* ============================================================
     PLAYTEST 26 · MADDE C — TAKAS HEDEFİ SEÇİMİ
     Oyuncu hangi kartından vazgeçeceğini SEÇER; hiçbir satır zorunlu
     değildir. İki çıkış kapısı vardır ve ikisi de bilerek ayrı:
       "← Geri"   → satın alma ekranına döner (fikir değiştirdi, ama
                    kartı hâlâ almak istiyor)
       "Vazgeç"   → hiçbir şey almadan store'a döner
     Kilitli satırlar (Lanetli Kaptan kilidi, yetersiz coin) gizlenmez,
     NEDENİYLE gösterilir — projenin her yerindeki desen.
     ============================================================ */
  function pickSwapTarget(index, item) {
    const rows = Game.swapBuyOptions(index);
    document.getElementById('buySwap')?.remove();
    const ov = document.createElement('div');
    ov.id = 'buySwap';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('swapPickTitle', T.name(item))}</h3>` +
      `<p>${t('swapPickBody', item.price, COIN)}</p>` +
      `<div class="sw-list">` +
      rows.map(o =>
        `<button class="sw-row r-${o.rarity}${o.ok ? '' : ' locked'}" data-jid="${o.jokerId}" ${o.ok ? '' : 'disabled'}>` +
        `<span class="sw-ico">${jokerIcon(o.key)}</span>` +
        `<span class="sw-name">${T.name(o)}` +
        `<small>${T.rarity(o.rarity)} · ${t(o.where === 'backup' ? 'destBackup' : 'destMain')}</small></span>` +
        `<span class="sw-cost">${o.ok ? t('swapNet', o.net, COIN, o.refund)
          : `<em>${T.ev(o.error)}</em>`}</span></button>`).join('') +
      `</div>` +
      `<div class="tr-row" style="margin-top:12px">` +
      `<button class="btn ghost" id="swBack">${t('swapBackBtn')}</button>` +
      `<button class="btn ghost" id="swCancel">${t('cancel')}</button>` +
      `</div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#swCancel').addEventListener('click', () => ov.remove());
    ov.querySelector('#swBack').addEventListener('click', () => {
      ov.remove();
      pickBuyDest(index, item);
    });
    ov.querySelectorAll('.sw-row').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      const res = Game.swapBuyJoker(index, parseInt(b.dataset.jid, 10));
      if (!res.ok) { toast(res.error); return; }
      ov.remove();
      toast(t('swapToast', T.ev(res.gave), T.name(item), res.net), true);
      SFX.coin();
      renderStore();
      render();
      onJokerGained(res.key, res.jokerId);
    }));
  }

  /* Paketten çıkan içeriğin kart içi / bildirim gösterimi (üç tür ortak) */
  /* PLAYTEST 20 · GRUP N — envanterde yer yoksa ödül coin'e çevrilir;
     oyuncu paketten "hiçbir şey çıkmadı" sanmasın diye açıkça yazılır. */
  function packOutHtml(x) {
    if (x.converted) return `💰 +${x.coins} <small>${t('packConverted')}</small>`;
    if (x.type === 'consum')
      return `${x.icon} ${T.consumName(x.key, x.name)}<br><small>${T.rarity(x.rarity)}</small>`;
    if (x.type === 'joker')
      return `${jokerIcon(x.key)} ${T.name(x)}<br><small>${T.rarity(x.rarity)}</small>`;
    return `${x.icon} ${T.specialName(x.kind, x.name)}<br><small>${T.color(x.color)} ${x.number}</small>`;
  }
  function packOutLine(x) {
    if (x.converted) return t('packConvertedLine', x.coins);
    if (x.type === 'consum')
      return t('packOutConsum', x.icon, T.consumName(x.key, x.name));
    if (x.type === 'joker')
      return t('packOutJoker', jokerIcon(x.key), T.name(x), t(x.dest === 'backup' ? 'destBackup' : 'destMain'));
    return t('packOut', x.icon, T.specialName(x.kind, x.name), T.color(x.color), x.number);
  }

  /* ============================================================
     GRUP F (Playtest 8) — PAKET AÇILIŞ SAHNELERİ
     İki mod: SEÇİMLİ (3 karttan 1'ini al) ve SLOT MAKİNESİ (1-2 çark).
     Motor sonucu zaten kesinleştirdi; buradaki iş yalnız o sonucu
     seyredilir hâle getirmek. Sahne kapanmadan store'a dönülemez.
     ============================================================ */

  /* Paket içeriğinin tek bir kart yüzü — hem seçim kartlarında hem
     çark sembollerinde aynı görsel dil kullanılır. */
  function packFaceHtml(x) {
    /* GRUP N (P20): coin'e çevrilen ödül kendi kart yüzünü taşır. */
    if (x.converted)
      return `<div class="pk-ico">💰</div>` +
        `<div class="pk-name">+${x.coins}</div>` +
        `<div class="pk-sub">${t('packConverted')}</div>`;
    if (x.type === 'consum') {
      /* Değnek çizimi (2026-09-09) — özel taşın küçük yüz kalıbıyla aynı
         (.cs-art-sm 33 × 45); çizimi olmayan değnek emoji ikonuyla kalır. */
      const art = CONSUM_ART.has(x.key);
      return `<div class="pk-ico${art ? ' cs-art-sm cs-' + x.key : ''}">${art ? '' : x.icon}</div>` +
        `<div class="pk-name">${T.consumName(x.key, x.name)}</div>` +
        `<div class="pk-sub">${T.rarity(x.rarity)}</div>`;
    }
    if (x.type === 'joker')
      return `<div class="pk-ico">${jokerIcon(x.key)}</div>` +
        `<div class="pk-name">${T.name(x)}</div>` +
        `<div class="pk-sub">${T.rarity(x.rarity)}</div>`;
    /* Özel taş — paket çarkında ve sonuç kartında da gerçek görseliyle.
       GRUP F+G (kullanıcı kararı 2026-09-07): özel taşın adı BURADA DA
       yazılmaz — koleksiyondaki `.col-sp-card` ile aynı kural (taş kendi
       görseliyle tanınır, ad metni tekrar sayılır). Açıklama zaten her
       çağrı yerinde `packFaceDesc()` ile ayrıca gösteriliyor. */
    return `<div class="pk-ico sp-art-sm sp-${x.kind}"></div>` +
      `<div class="pk-sub">${T.color(x.color)} ${x.number}</div>`;
  }

  function packFaceDesc(x) {
    if (x.converted) return t('packConvertedLine', x.coins);
    if (x.type === 'consum') return T.consumDesc(x.key, x.desc || '');
    if (x.type === 'joker') return T.desc({ key: x.key, desc: x.desc || '' });
    return T.specialDesc(x.kind, SPECIAL_TILES[x.kind]?.desc || '');
  }

  function packOverlay(kind, titleKey) {
    const ov = document.createElement('div');
    ov.id = 'packOv';
    ov.className = `pk-ov tone-${(PACK_DEFS[kind] || PACK_DEFS.special).tone}`;
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">${(PACK_DEFS[kind] || PACK_DEFS.special).icon} ${t(titleKey)}</div>` +
      `<div class="pk-sub-title">${t('packName_' + kind)}</div>` +
      `<div class="pk-body"></div>` +
      `<div class="pk-foot"></div></div>`;
    document.body.appendChild(ov);
    return ov;
  }

  /* SEÇİMLİ PAKET — 3 kart açılır, biri alınır, diğerleri kaybolur. */
  function showPackChoice(res) {
    const ov = packOverlay(res.kind, 'packChoiceTitle');
    const body = ov.querySelector('.pk-body');
    body.className = 'pk-body pk-choice';
    ov.querySelector('.pk-foot').innerHTML = `<span class="pk-hint">${t('packChoiceHint')}</span>`;
    res.options.forEach((opt, oi) => {
      const c = document.createElement('button');
      c.className = `pk-card r-${opt.rarity || 'special'}`;
      c.style.animationDelay = `${oi * 0.11}s`;
      c.innerHTML = packFaceHtml(opt) + `<div class="pk-desc">${packFaceDesc(opt)}</div>`;
      c.addEventListener('click', () => {
        if (ov.dataset.done) return;
        ov.dataset.done = '1';
        const r = Game.choosePackOption(res.index, oi);
        if (!r.ok) { toast(r.error); delete ov.dataset.done; return; }
        SFX.coin();
        // seçilmeyenler soluklaşıp düşer, seçilen büyür
        [...body.children].forEach((el2, i) => el2.classList.add(i === oi ? 'pk-won' : 'pk-lost'));
        notify([packOutLine(r.got)], true, { quiet: true });   // çark zaten gösterdi
        setTimeout(() => {
          ov.remove();
          renderStore(); render();
          onJokerGained(r.got.key, r.got.jokerId);
        }, 780);
      });
      body.appendChild(c);
    });
  }

  /* SLOT PAKET — ödül başına bir çark; hızlı başlayıp yavaşlayarak durur.
     Şerit dikey kaydırılır (translateY), son sembol kazanandır.
     PLAYTEST 9 · GRUP B: artık ÜÇ paket türü de bu sahneden geçiyor.
     Tüketilebilir/joker paketleri eskiden seçimliydi ve kartlarda açıklama
     görünüyordu; slot'ta sembol hücresi o kadar metni taşıyamıyor, bu yüzden
     çarklar durunca altına AÇIKLAMALI sonuç kartları çiziliyor (oyuncu ne
     kazandığını okumadan sahneyi kapatmasın). */
  function showPackSlot(res) {
    const ov = packOverlay(res.kind, 'packSlotTitle');
    const body = ov.querySelector('.pk-body');
    body.className = 'pk-body pk-slot';
    const foot = ov.querySelector('.pk-foot');
    foot.innerHTML = `<span class="pk-hint">${t('packSlotSpin')}</span>`;
    const strips = [];
    res.reels.forEach((reel) => {
      const wrap = document.createElement('div');
      wrap.className = 'pk-reel';
      const strip = document.createElement('div');
      strip.className = 'pk-strip';
      reel.forEach(sym => {
        const cell = document.createElement('div');
        cell.className = `pk-sym r-${sym.rarity || 'special'}`;
        cell.innerHTML = packFaceHtml(sym);
        strip.appendChild(cell);
      });
      wrap.appendChild(strip);
      wrap.innerHTML += '<div class="pk-reel-line"></div>' +
        `<div class="pk-stop">${t('packSlotStop')}</div>`;
      body.appendChild(wrap);
      strips.push(wrap.querySelector('.pk-strip'));
    });
    // dönüş: her çark biraz daha geç durur (2 çarkta sıralı "tak…tak" hissi)
    requestAnimationFrame(() => {
      strips.forEach((strip, i) => {
        // offsetHeight: transform'lu ata (fitScale) altında da doğru ölçer
        const cellH = strip.firstElementChild.offsetHeight || 106;
        const dist = cellH * (strip.children.length - 1);
        const dur = 2.1 + i * 0.75;
        strip.style.transition = `transform ${dur}s cubic-bezier(.10,.62,.16,1)`;
        strip.style.transform = `translateY(${-dist}px)`;
        let ticks = 0;
        const tick = setInterval(() => { SFX.tick(); if (++ticks > 22) clearInterval(tick); }, dur * 1000 / 26);
        setTimeout(() => {
          clearInterval(tick);
          strip.parentElement.classList.add('landed');
          SFX.coin();
          if (i === strips.length - 1) finish();
        }, dur * 1000 + 60);
      });
    });
    function finish() {
      foot.innerHTML = '';
      notify(res.contents.map(packOutLine), true, { quiet: true });   // çark zaten gösterdi
      // açıklamalı sonuç kartları (çarkların altına)
      const rw = document.createElement('div');
      rw.className = 'pk-result';
      res.contents.forEach((x, i) => {
        const c = document.createElement('div');
        c.className = `pk-rcard r-${x.rarity || 'special'}`;
        c.style.animationDelay = `${i * 0.09}s`;
        c.innerHTML = packFaceHtml(x) + `<div class="pk-desc">${packFaceDesc(x)}</div>`;
        rw.appendChild(c);
      });
      ov.querySelector('.pk-box').insertBefore(rw, foot);
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = t('packTake');
      b.addEventListener('click', () => {
        ov.remove();
        renderStore(); render();
        for (const c2 of res.contents || []) onJokerGained(c2.key, c2.jokerId);
      });
      foot.appendChild(b);
      b.focus();
    }
  }

  function openPackResult(res) {
    if (res.mode === 'choice') showPackChoice(res);
    else showPackSlot(res);
  }

  /* Grup I — "Okey'i Al" düğmesi: bu kombinasyondaki bir okeyin yerine
     geçtiği gerçek taş elindeyse, takas edilebilir. Birden fazla seçenek
     varsa küçük bir seçim pop-up'ı açılır. */
  function addOkeySwapBtn(box, where, comboIndex) {
    if (comboIndex == null || comboIndex < 0) return;
    const opts = Game.okeySwapOptions()
      .filter(o => o.where === where && o.comboIndex === comboIndex);
    if (!opts.length) return;
    const btn = document.createElement('button');
    btn.className = 'okey-swap-btn';
    btn.innerHTML = t('okeySwapBtn');
    btn.title = t('okeySwapTitle');
    btn.addEventListener('click', () => {
      const doSwap = (o) => {
        const r = Game.swapOkey(o.where, o.comboIndex, o.okeyId, o.tileId);
        if (!r.ok) { toast(r.error); return; }
        toast(T.ev(r.note), true);
        SFX.coin();
        render();
      };
      if (opts.length === 1) { doSwap(opts[0]); return; }
      const ov = document.createElement('div');
      ov.id = 'terziPick';
      ov.innerHTML = `<div class="tp-box"><h3>${t('okeySwapTitle')}</h3>` +
        `<p>${t('okeySwapPick')}</p><div class="tp-row"></div></div>`;
      const row = ov.querySelector('.tp-row');
      opts.forEach(o => {
        const b = document.createElement('button');
        b.className = 'btn primary';
        b.textContent = o.label;
        b.addEventListener('click', () => { ov.remove(); doSwap(o); });
        row.appendChild(b);
      });
      ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    });
    box.appendChild(btn);
  }

  /* Grup K — trainer kurulumundaki Okey Taşı seçimi ({color,number} | null) */
  function okeyCfg(panel) {
    const c = panel.querySelector('#trOkeyColor')?.value;
    if (!c) return null; // "Rastgele" — mevcut belirleme mantığı sürer
    return { color: c, number: parseInt(panel.querySelector('#trOkeyNum').value, 10) };
  }

  /* Trainer joker süresi seçicisinin değeri → motorun beklediği biçim.
     'def' = her jokerin kendi süresi · 'inf' = süresiz · sayı = raund */
  function usesCfg(v) {
    if (v === 'def' || v == null) return null;
    if (v === 'inf') return Infinity;
    return parseInt(v, 10) || null;
  }

  function renderStore() {
    const s = Game.state;
    if (!s.store) return;
    hideTip();
    // Sol kenar: run istatistikleri (Grup B — Balatro SHOP kenar paneli)
    el.storeCoins.innerHTML = `${COIN} ${s.coins}`;
    el.ssRound.textContent = t('stageChip', s.stage, chCount(), s.roundInStage);
    el.ssPerm.textContent = `+${s.permMult.toFixed(1)}x`;
    /* PLAYTEST 9 · GRUP M — kapasite bilgisi açıklama metninde değil
       BAŞLIĞIN YANINDA. Oyun içi sol panelde zaten böyleydi; store
       sahnesindeki üç şeritte eksikti. */
    el.ssSlotsCount.textContent = `${s.jokers.length}/${Game.slotCap()}`;
    el.ssBackupCount.textContent = `${s.backup.length}/2`;
    el.ssConsumCount.textContent = `${s.consumables.length}/${Game.consumCap()}`;
    // Slot şeritleri: hover → tooltip'ten Sat / →Ana / Birleştir
    el.storeSlotsRow.innerHTML = '';
    if (!s.jokers.length)
      el.storeSlotsRow.innerHTML = `<span class="ss-empty">${t('noJokers')}</span>`;
    s.jokers.forEach(j => el.storeSlotsRow.appendChild(jokerCard(j)));
    el.storeBackupRow.innerHTML = '';
    if (!s.backup.length)
      el.storeBackupRow.innerHTML = `<span class="ss-empty">${t('backupEmpty')}</span>`;
    s.backup.forEach(j => el.storeBackupRow.appendChild(jokerCard(j, { backup: true })));
    el.storeConsumRow.innerHTML = '';
    if (!s.consumables.length)
      el.storeConsumRow.innerHTML = `<span class="ss-empty">${t('inventoryEmpty')}</span>`;
    s.consumables.forEach((key, i) => el.storeConsumRow.appendChild(consumCard(key, i, { sell: true })));

    /* Grup D: iki satır — ÜST jokerler, ALT tüketilebilir + gizli paketler.
       Kartlar artık el.storeItems'a değil ilgili satırın grid'ine gider. */
    el.storeRowJokers.innerHTML = '';
    el.storeRowExtras.innerHTML = '';
    el.srJokersLbl.textContent = t('srJokers');
    el.srExtrasLbl.textContent = t('srExtras');
    // Anarşist "Kara Pazar": eski fiyat üstü çizili gösterilir
    const anarOld = (o) => (o.basePrice && o.basePrice > o.price)
      ? `<s class="anar-old">${o.basePrice}</s> ` : '';
    s.store.items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = `store-item viz r-${item.rarity}` + (item.sold ? ' sold-out' : '') + (item.locked ? ' locked' : '');
      // Truva kılık değiştirmişse gerçek ikonu sızdırma
      const disguised = JOKER_DEFS[item.key] && item.name !== JOKER_DEFS[item.key].name;
      card.innerHTML =
        // MADDE E2 — catch-up kalemi ayrıca "ACİL RAF" diye işaretlenir
        `<div class="s-rarity">${T.rarity(item.rarity)}${item.discounted ? ' · ' + t('discounted') : ''}${item.catchUp ? ' · ' + t('catchUpTag') : ''}${item.leaked ? ' · 🗣' : ''}${item.locked ? ' · 🔒' : ''}${s.store.anarchist ? ' · ⚡' : ''}</div>` +
        `<div class="s-ico ico-${item.rarity}">${disguised ? '🀫' : jokerIcon(item.key)}</div>` +
        `<div class="s-name">${T.name(item)}</div>` +
        chipsHtml(T.desc(item)) +
        (!item.sold && !ownedEver.has(item.key) ? `<span class="badge-new">${t('newBadge')}</span>` : '');
      attachTip(card, { name: T.name(item), desc: T.desc(item), rarity: item.rarity,
        usesLeft: JOKER_DEFS[item.key]?.uses ?? RARITY[item.rarity].uses, key: item.key }, {});
      if (item.sold) {
        card.innerHTML += `<div class="s-sold">${item.fled ? t('fled') : t('sold')}</div>`;
      } else {
        card.appendChild(lockBtn(item.locked, () => { Game.toggleLock(i); renderStore(); }));
        const btn = document.createElement('button');
        btn.className = 'btn primary s-buy';
        btn.innerHTML = `${anarOld(item)}${t('buyBtn', item.price, COIN)}${item.haggled ? ' 🤝' : ''}`;
        const isDeckJ = JOKER_DEFS[item.key]?.mech === 'deck';
        /* PLAYTEST 26 · MADDE C (bug) — DOLU RAF ARTIK DÜĞMEYİ ÖLDÜRMÜYOR.
           Eski satır iki ayrı hata taşıyordu:
             1) Raf doluyken düğme KAPANIYORDU; takas akışının açılacağı tek
                kapı buydu, yani "takas çalışmıyor"un kök nedeni buydu —
                oyuncu teklifi görüyor ama tıklayamıyordu bile.
             2) Kapasiteler `5` ve `2` diye ELLE yazılmıştı. Ana slot Tacir
                Mektubu ile 7'ye çıkabiliyor (Game.slotCap()); o durumda
                düğme 5. jokerde erkenden kapanıyordu.
           Yeni kural: düğme yalnız ÖDENEMEYECEK durumda kapanır. Ödeme
           gücü takası da sayar (eski kartın iadesi peşin fiyattan düşer);
           bu yüzden `swapBuyOptions` ile en ucuz net fiyata bakılır. */
        const swapNet = (Game.swapBuyOptions ? Game.swapBuyOptions(i) : [])
          .filter(o => o.ok).reduce((a, o) => Math.min(a, o.net), Infinity);
        btn.disabled = s.coins < item.price && !(swapNet <= s.coins);
        // Satın alma anında hedef seçimi: Ana Slot / Backup (Grup G1)
        btn.addEventListener('click', () => pickBuyDest(i, item));
        card.appendChild(btn);
        /* ATEŞ TÜCCARI (P30 · Grup K) — iki adımlı pazarlık.
           1) "Pazarlık" düğmesi store başına bir kez görünür.
           2) Pazarlığı TUTMUŞ üründe "Ateşi Çal" düğmesi çıkar (isteğe
              bağlı, ürün başına bir kez). Oyuncu indirimde durabilir. */
        if (Game.hasActive('atesTuccari') && !s.store.haggleUsed) {
          const hb = document.createElement('button');
          hb.className = 'o-sell s-extra';
          hb.textContent = t('haggleBtn');
          hb.addEventListener('click', () => {
            const r = Game.haggleItem(i);
            if (!r.ok) { toast(T.ev(r.error)); return; }
            toast(r.success ? t('haggleWin', T.ev(r.name), r.price) : t('haggleLose', T.ev(r.name)), r.success);
            renderStore();
          });
          card.appendChild(hb);
        }
        if (Game.hasActive('atesTuccari') && item.haggled && !item.fireTried) {
          const fb = document.createElement('button');
          fb.className = 'o-sell s-extra';
          fb.textContent = t('stealBtn');
          fb.addEventListener('click', () => {
            const r = Game.stealFire(i);
            if (!r.ok) { toast(T.ev(r.error)); return; }
            toast(r.success ? t('stealWin', T.ev(r.name)) : t('stealLose', T.ev(r.name)), r.success);
            renderStore();
            if (r.success) onJokerGained(r.key, r.jokerId);
          });
          card.appendChild(fb);
        }
      }
      el.storeRowJokers.appendChild(card);
    });

    // Tüketilebilir slotu (GDD 6.5b)
    const c = s.store.consumable;
    if (c) {
      const card = document.createElement('div');
      card.className = `store-item viz r-consum r-${c.rarity || 'common'}` + (c.sold ? ' sold-out' : '');
      card.innerHTML =
        `<div class="s-rarity">${T.rarity(c.rarity || 'common')} · ${t('consumRarity')}${s.store.anarchist ? ' · ⚡' : ''}</div>` +
        /* Değnek çizimi (2026-09-09): özel taş kartıyla aynı kural — yuvarlak
           emoji rozeti yerine çizimin kendisi (42.7 × 58, .s-ico.cs-art). */
        (CONSUM_ART.has(c.key)
          ? `<div class="s-ico ico-consum cs-art cs-${c.key}"></div>`
          : `<div class="s-ico ico-consum">${c.icon}</div>`) +
        `<div class="s-name">${T.consumName(c.key, c.name)}</div>` +
        chipsHtml(T.consumDesc(c.key, c.desc));
      /* PLAYTEST 9 · GRUP M: "envanterde en fazla 3 taşınır" cümlesi
         KALDIRILDI — aynı bilgi zaten TÜKETİLEBİLİR başlığının yanındaki
         sayaçta (0/3) duruyor, açıklamada tekrar etmesi gürültüydü. */
      attachTip(card, { name: T.consumName(c.key, c.name), rarityText: `${T.rarity(c.rarity || 'common')} · ${t('consumTag')}`,
        accent: c.rarity || 'common',
        desc: T.consumDesc(c.key, c.desc) }, {});
      if (c.sold) {
        card.innerHTML += `<div class="s-sold">${t('sold')}</div>`;
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn primary s-buy';
        btn.innerHTML = anarOld(c) + t('buyBtn', c.price, COIN);
        btn.disabled = s.coins < c.price || s.consumables.length >= Game.consumCap();
        btn.addEventListener('click', () => {
          const res = Game.buyConsumable();
          if (!res.ok) { toast(res.error); return; }
          toast(t('consumBought', T.consumName(c.key, c.name)), true);
          SFX.coin();
          renderStore();
        });
        card.appendChild(btn);
      }
      el.storeRowExtras.appendChild(card);
    }

    /* ============================================================
       MADDE E9 (2026-09-09) — TAHVİL: store'un SABİT kalemi.
       Rastgele çekilişin dışındadır; run başına tavan dolunca motor onu
       hiç üretmez (bkz. engine _generateStore), yani "hiçbir şey yapmayan"
       bir kart rafta durmaz.
       ============================================================ */
    const bond = s.store.bond;
    if (bond) {
      const card = document.createElement('div');
      card.className = 'store-item viz r-consum r-legendary' + (bond.sold ? ' sold-out' : '');
      card.innerHTML =
        `<div class="s-rarity">${t('bondTag')}${s.store.anarchist ? ' · ⚡' : ''}</div>` +
        `<div class="s-ico ico-consum">📈</div>` +
        `<div class="s-name">${t('bondName')}</div>` +
        chipsHtml(t('bondDesc', BOND_YIELD, BOND_MAX)) +
        `<div class="s-desc">${t('bondOwned', s.bonds || 0, BOND_MAX)}</div>`;
      attachTip(card, { name: t('bondName'), rarityText: t('bondTag'),
        desc: t('bondDesc', BOND_YIELD, BOND_MAX) }, {});
      if (bond.sold) {
        card.innerHTML += `<div class="s-sold">${t('sold')}</div>`;
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn primary s-buy';
        btn.innerHTML = anarOld(bond) + t('buyBtn', bond.price, COIN);
        btn.disabled = s.coins < bond.price;
        btn.addEventListener('click', () => {
          const res = Game.buyBond();
          if (!res.ok) { toast(res.error); return; }
          toast(t('bondBought', res.yield), true);
          SFX.coin();
          renderStore(); render();
        });
        card.appendChild(btn);
      }
      el.storeRowExtras.appendChild(card);
    }

    /* GRUP G (kullanıcı kararı 2026-09-07) — ÖZEL TAŞ KARTI RAFTAN KALKTI.
       Özel taşlar artık store rafında tek tek satılmıyor; tek kaynakları
       2'li Özel Taş Paketi. Motor tarafında `store.specialTile` artık
       hiç üretilmiyor (bkz. engine.js `_generateStore`), bu yüzden kart
       da çizilmiyor. Grup F'te bu kartın altındaki ad yazısı
       kaldırılmıştı; kart tümden gidince o düzeltme de konusuz kaldı. */

    /* Gizli Paketler (Grup D) — üç tür, her biri farklı ikon + renk kodlu
       kartla çıkar; oyuncu paketi AÇMADAN ÖNCE içinde ne olduğunu bilir. */
    (s.store.packs || []).forEach((pk, pi) => {
      const def = PACK_DEFS[pk.kind] || PACK_DEFS.special;
      const card = document.createElement('div');
      card.className = `store-item r-pack pack-${pk.kind} tone-${def.tone}`
        + (pk.sold ? ' sold-out' : '');
      if (pk.sold) {
        /* Grup F: seçimli paket alındıysa ama seçim henüz yapılmadıysa kart
           "seçim bekleniyor" der — satın alma butonu bir daha çıkmaz. */
        card.innerHTML =
          `<div class="s-rarity">${t('packRarity_' + pk.kind)}</div>` +
          `<div class="s-name">${pk.pending ? t('packPending') : t('opened')}</div>` +
          (pk.contents ? `<div class="s-pack-out">${pk.contents.map(packOutHtml).join('<hr>')}</div>` : '');
      } else {
        card.innerHTML =
          `<div class="s-rarity">${t('packRarity_' + pk.kind)}${s.store.anarchist ? ' · ⚡' : ''}</div>` +
          `<div class="s-ico ico-pack">${def.icon}</div>` +
          /* GRUP G (2026-09-07): `.pack-q` gizem tipografisidir (19px,
             harf arası 2px, sallanma) ve yalnız "???" adlı paketlere
             yakışır. 2'li Özel Taş Paketi'nin ADI VAR — normal kart adı
             tipografisiyle çizilir, yoksa kartın dışına taşar. */
          `<div class="s-name${pk.kind === 'special' ? '' : ' pack-q'}">${t('packName_' + pk.kind)}</div>` +
          `<div class="s-chips"><span class="s-chip">${t('packChip_' + pk.kind)}</span></div>`;
        attachTip(card, { name: t('packTipName_' + pk.kind), rarityText: t('packTipTag'),
          desc: t('packTipDesc_' + pk.kind) }, {});
        const btn = document.createElement('button');
        btn.className = 'btn primary s-buy';
        btn.innerHTML = anarOld(pk) + t('packOpenBtn', pk.price, COIN);
        btn.disabled = s.coins < pk.price;
        btn.addEventListener('click', () => {
          const res = Game.buyPack(pi);
          if (!res.ok) { toast(res.error); return; }
          SFX.coin();
          /* Grup F: içerik artık doğrudan cebe düşmez — paket türüne göre
             seçim ekranı ya da slot makinesi açılır, notify/render orada. */
          renderStore();
          openPackResult(res);
        });
        card.appendChild(btn);
      }
      el.storeRowExtras.appendChild(card);
    });

    // Deste jokerleri slotta görünmez — satış erişimi için mini şerit
    el.storeDeckRow.innerHTML = '';
    if (s.deckJokers.length) {
      const title = document.createElement('div');
      title.className = 'panel-title';
      title.textContent = t('deckJokersTitle');
      el.storeDeckRow.appendChild(title);
      const row = document.createElement('div');
      row.className = 'sd-row';
      s.deckJokers.forEach(j => row.appendChild(jokerCard(j)));
      el.storeDeckRow.appendChild(row);
    }

    /* Grup C: her satır kendi kart sayısı kadar sütun kullansın — sabit 4
       sütunda az kartlı satırın sonunda boşluk "eksik kart" gibi duruyordu. */
    for (const row of [el.storeRowJokers, el.storeRowExtras]) {
      const n = Math.max(1, Math.min(5, row.children.length));
      row.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    }

    /* Grup E: Trainer'da reroll bedava ve sınırsız — buton hiç kilitlenmez
       ve fiyat yazmaz (bkz. Game.rerollFree()). */
    if (Game.rerollFree()) {
      el.btnReroll.disabled = false;
      el.btnReroll.innerHTML = t('rerollFree');
    } else {
      /* MADDE E6 — hak sınırı kalktı, fiyat merdiveni motordan okunur.
         MADDE E2 — catch-up açıldıysa o store'un ilk yenilemesi bedava. */
      const rc = Game.rerollCost();
      el.btnReroll.disabled = !s.store.freeReroll && s.coins < rc;
      el.btnReroll.innerHTML = s.store.freeReroll
        ? t('rerollFreeCatch') : t('rerollBtn', rc, COIN);
    }

    /* MADDE D5 — store'a bağlı ipuçları. Sıra ÖNEMLİ: en genel olan
       (store'un nasıl çalıştığı) önce, duruma özel olanlar sonra gelir ki
       ilk store'da dört kart üst üste binmesin. `show` bir kez true döner,
       yani aynı ekranda yalnız biri açılır. */
    if (!Game.trainerMode) {
      const shown = Hints.show('store');
      if (!shown && s.store.items.some(i => i.catchUp)) Hints.show('catchUp');
      else if (!shown && s.store.bond && !s.store.bond.sold) Hints.show('bond');
      else if (!shown && [...s.jokers, ...s.backup].some(j => Game.tradeUpInfo(j.id).ok))
        Hints.show('tradeUp');
    }
    clampBadges(); // şeritlerdeki süre rozetleri kenardan taşmasın (Grup F)
    if (!TUT.active && storeOpen()) saveGame('inStore'); // Grup C
    if (TUT.active) TUT.update();
  }

  el.btnReroll.addEventListener('click', () => {
    const res = Game.rerollStore();
    if (!res.ok) { toast(res.error); return; }
    renderStore();
  });

  /* ---------- Stage sonu güçlendirme sahnesi (Grup H) ---------- */

  /* ---------- GRUP M (Playtest 7): ZAFER / RUN TAMAMLANDI EKRANI ----------
     Son stage'in boss'u geçildiğinde store'a HİÇ geçilmez; run burada
     gerçekten biter. Tam ekran bir kutlama + istatistik özeti + bitiş
     kadrosu + ana menüye dönüş. */
  function showRunComplete() {
    const res = Game.completeRun();
    const st = res.stats || Game.runStats();
    clearSave();
    SFX.win();
    /* GRUP R (P20) — İLK TEMEL RUN TAMAMLANDI: kilitler açılır.
       Trainer run'ı kayıt yazmaz, bu yüzden kilidi de açmaz (sandbox'ta
       "run bitirmek" bir başarı değildir). */
    let openedModes = [];
    if (!Game.trainerMode) openedModes = Modes.complete('base');

    let ov = document.getElementById('runCompleteOv');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'runCompleteOv';

    const stat = (label, value) =>
      `<div class="rc-stat"><span class="rc-val">${value}</span><span class="rc-lbl">${label}</span></div>`;

    const build = st.jokers.length
      ? st.jokers.map(j => `<span class="rc-joker r-${j.rarity}">` +
          `${JOKER_ICONS[j.key] || '🃏'} ${T.name(j)}</span>`).join('')
      : `<span class="rc-none">${t('rcNoJokers')}</span>`;

    ov.innerHTML =
      `<div class="rc-box">` +
        `<div class="rc-trophy">🏆</div>` +
        `<h2 class="rc-title">${t('runCompleteTitle').replace(/^🏆\s*/, '')}</h2>` +
        `<p class="rc-headline">${t('rcHeadline')}</p>` +
        `<p class="rc-sub">${t('rcSub', chCount())}</p>` +
        `<div class="rc-stats">` +
          stat(t('rcStatRounds'), st.rounds) +
          stat(t('rcStatBosses'), st.bosses) +
          stat(t('rcStatScore'), st.totalScore.toLocaleString('tr-TR')) +
          stat(t('rcStatCoins'), `${COIN} ${st.coins}`) +
          stat(t('rcStatMult'), `+${st.permMult.toFixed(1)}x`) +
        `</div>` +
        `<div class="rc-build-title">${t('rcFinalBuild')}</div>` +
        `<div class="rc-build">${build}</div>` +
        (openedModes.length
          ? `<div class="rc-unlock">${t('modeUnlocked',
              openedModes.map(m => t('modeName_' + m.key)).join(', '))}</div>` : '') +
        `<button class="btn primary rc-btn" id="rcMenu">${t('rcMenu')}</button>` +
      `</div>`;
    document.body.appendChild(ov);
    ov.querySelector('#rcMenu').addEventListener('click', () => {
      ov.remove();
      el.overlay.classList.add('hidden');
      el.storeOverlay.classList.add('hidden');
      el.upgradeOverlay.classList.add('hidden');
      Game.trainerMode = false;
      showScreen('menu');
    });
  }

  /* ============================================================
     PLAYTEST 9 · GRUP J — STAGE SONU ÖDÜLÜ DE SLOT DİLİNDE
     Paket açılışıyla (Grup B) tutarlı olsun istendi. Ama burada 5 seçenekten
     2'si seçiliyor: kararı çarka bırakmak oyunun tek gerçek build kararını
     yok ederdi. Bu yüzden çark KARAR VERMEZ, SEÇENEKLERİ DAĞITIR:
     her kart kendi mini çarkıdır, sırayla döner ve "STOP!!" damgasıyla
     kendi güçlendirmesine oturur; ancak durduktan sonra seçilebilir hâle
     gelir. Yenileme (reroll) çarkları yeniden döndürür.
     Böylece ritüel (dönüş · tık sesi · STOP · altın çerçeve) aynı, karar
     oyuncuda kalır. Sahneye tıklamak dönüşü anında bitirir (sabırsızlar için).
     ============================================================ */
  /* ⚠ ROZET DEĞERLERİ BURADA TUTULMAZ.
     Eskiden `UP_STATS` adlı elle yazılmış bir tablo vardı ve motordaki
     sayılar buff'lanınca güncellenmeyi unuttu: kart "+0.5x" rozetiyle
     "kalıcı +0.8x" açıklamasını yan yana gösteriyordu (Coin Kasası
     25/40, Zanaatkâr 2/3, Nazar Boncuğu %5/%8 aynı durumdaydı).
     Rozetler artık motordaki tanımın `stats` alanından gelir; o alan da
     açıklama metniyle BİRLİKTE tek bir sabitten (UP_VAL) üretilir, yani
     ikisinin ayrışması artık mümkün değil. */
  const UP_REEL_LEN = 9;

  function upFaceHtml(key) {
    const def = UPGRADE_DEFS[key];
    return `<div class="up-icon">${def.icon}</div>` +
      `<div class="up-name">${T.upName(key, def.name)}</div>`;
  }

  function showUpgradeScene(spin = true) {
    const s = Game.state;
    if (!s.upgradeOffer) { openStore(); return; }
    /* PLAYTEST 10 — SEÇİM YOK, İKİ ÇARK ÖDÜLÜ VERİR.
       Kartlar artık "seçenek" değil SONUÇ: iki çark döner, durdukları
       güçlendirmeler doğrudan uygulanır. Bu yüzden SEÇ düğmesi ve
       yenileme (reroll) kaldırıldı; yerine tek bir DEVAM düğmesi var. */
    const already = !!s.upgradeOffer.applied;
    $('upTitle').textContent = t('upTitle');
    $('upSub').textContent = already ? t('upSubDone') : t('upSubAuto', s.upgradeOffer.rolled.length);
    el.upCoins.innerHTML = `${COIN} ${s.coins}`;
    el.upOptions.innerHTML = '';
    const allKeys = Object.keys(UPGRADE_DEFS);
    const reels = [];
    for (const key of s.upgradeOffer.rolled) {
      const def = UPGRADE_DEFS[key];
      const willSpin = spin && !already;
      const card = document.createElement('div');
      card.className = 'up-card' + (willSpin ? ' spinning' : ' landed');
      /* PLAYTEST 26 (bug) — GÜÇLENDİRME ROZETLERİ ÇEVRİLMİYORDU.
         `def.stats` motorda TAM TÜRKÇE yazılır ("🎴 1 değnek") ve burası
         onu ham basıyordu. Kusur "Totem" adı yüzünden görünmüyordu: o kelime
         İngilizcede de aynı yazılıyor, dolayısıyla EN testinin Türkçe
         dedektörüne takılmıyordu. Ad Değnek olunca sızıntı ortaya çıktı.
         Rozetler artık diğer motor metinleriyle aynı yoldan (T.ev) geçer. */
      const chips = (def.stats || statChips(def.desc))
        .map(c => `<span class="s-chip">${T.ev(c)}</span>`).join('');
      /* Çark penceresi: sahte semboller + SON eleman gerçek güçlendirme.
         Dönmeyecekse (kayıttan geri dönüş — ödül zaten verilmiş) sahte
         sembol KOYULMAZ; yoksa şerit kaydırılmadığı için pencerede rastgele
         bir sembol donup kalırdı. */
      const strip = [];
      if (willSpin)
        for (let i = 0; i < UP_REEL_LEN - 1; i++)
          strip.push(allKeys[Math.floor(Math.random() * allKeys.length)]);
      strip.push(key);
      card.innerHTML =
        `<div class="up-reel"><div class="up-strip">` +
        strip.map(k => `<div class="up-sym">${upFaceHtml(k)}</div>`).join('') +
        `</div><div class="pk-stop">${t('packSlotStop')}</div></div>` +
        /* PLAYTEST 26 · GRUP F — AÇIKLAMA GERİ GELDİ (kullanıcı kararı
           2026-09-09, 2026-09-04 kararını değiştirir).
           Gerekçe: rozet tek başına ne yaptığını anlatmıyor — "🔮
           yaşlanmaz" ya da "🀄 ×2 basamak" rozetine bakan oyuncu hangi
           kalıcı gücü kazandığını çıkaramıyordu. Kart yine SADE kalır:
           tek cümle, rozetin altında, küçük punto.
           TUTARLILIK: cümle de rozet de UPGRADE_DEFS içindeki AYNI UP_VAL
           sabitinden üretilir (engine.js), yani rozetteki sayı ile
           cümledeki sayı ayrışamaz — eski tutarsızlık bug'ının kökü buydu
           ve orada kapatıldı. */
        `<div class="up-info">` +
        `<div class="up-won">${t('upWon')}</div>` +
        (chips ? `<div class="s-chips up-chips">${chips}</div>` : '') +
        `<div class="up-desc">${emphNums(T.upDesc(key, def.desc))}</div>` +
        `</div>`;
      el.upOptions.appendChild(card);
      reels.push(card);
    }
    el.btnUpContinue.textContent = t('upContinue');
    el.btnUpContinue.disabled = spin && !already;
    openScene(el.upgradeOverlay);
    if (spin && !already) spinUpgradeReels(reels);
    else if (!already) grantUpgrades();
    updateTrainerBadge(); // trainer çipi upgrade sahnesinde de görünsün
    saveGame('inStore'); // ödül ekranında çıkılırsa buraya dönülür
    if (TUT.active) TUT.update();
  }

  /* Çarklar durunca ödülleri UYGULA (motor çift uygulamaya karşı korumalı) */
  function grantUpgrades() {
    const r = Game.rollStageUpgrades();
    if (!r.ok || r.already) return;
    SFX.win();
    notify(r.notes);
    el.btnUpContinue.disabled = false;
    el.upCoins.innerHTML = `${COIN} ${Game.state.coins}`;   // Coin Kasası anında yansısın
    $('upSub').textContent = t('upSubDone');
    saveGame('inStore');
  }

  /* Kartların çarklarını sırayla durdur. Paket çarkıyla aynı eğri ve aynı
     ses dili. Playtest 10: iki çark var, ikincisi biraz gecikmeli durur
     (0.45s) — "ikinci ödül" anı ayrı bir vuruş olarak duyulsun.
     SON ÇARK DURUNCA ödüller uygulanır (grantUpgrades). */
  function spinUpgradeReels(cards) {
    let done = 0;
    const timers = [];
    const land = (card) => {
      if (!card.classList.contains('spinning')) return;
      card.classList.remove('spinning');
      card.classList.add('landed');
      const strip = card.querySelector('.up-strip');
      strip.style.transition = 'none';
      strip.style.transform = `translateY(${-cellH(card) * (strip.children.length - 1)}px)`;
      SFX.coin();
      if (++done === cards.length) {
        el.upgradeOverlay.classList.remove('spin-lock');
        grantUpgrades();
      }
    };
    /* offsetHeight (getBoundingClientRect DEĞİL): upgrade sahnesi #app
       içinde ve #app fitScale()'in transform:scale'ini taşıyor. Rect
       ÖLÇEKLENMİŞ piksel döndürür, translateY ise elemanin KENDİ
       koordinatında çalışır — ikisini karıştırınca çark yanlış yerde
       duruyor ve sembol yarım görünüyordu. */
    const cellH = (card) => card.querySelector('.up-sym').offsetHeight || 118;
    el.upgradeOverlay.classList.add('spin-lock');
    requestAnimationFrame(() => {
      cards.forEach((card, i) => {
        const strip = card.querySelector('.up-strip');
        const dist = cellH(card) * (strip.children.length - 1);
        const dur = 1.25 + i * 0.45;   // iki çark: ikincisi belirgin gecikmeli
        strip.style.transition = `transform ${dur}s cubic-bezier(.10,.62,.16,1)`;
        strip.style.transform = `translateY(${-dist}px)`;
        let ticks = 0;
        const tick = setInterval(() => { SFX.tick(); if (++ticks > 14) clearInterval(tick); }, dur * 1000 / 16);
        timers.push(tick);
        setTimeout(() => { clearInterval(tick); land(card); }, dur * 1000 + 40);
      });
    });
    // sabırsız oyuncu: sahneye tıkla → hepsi anında otursun
    const skip = () => {
      timers.forEach(clearInterval);
      cards.forEach(land);
      el.upgradeOverlay.removeEventListener('click', skip, true);
    };
    el.upgradeOverlay.addEventListener('click', skip, true);
  }

  /* Playtest 10: yenileme (reroll) kaldırıldı — seçim yokken "yeniden
     dağıt" hakkı anlamsız. Yerine tek DEVAM düğmesi: ödülleri kapatıp
     store sahnesine geçer (çark yarıda kesilse bile ödül kaybolmaz). */
  el.btnUpContinue.addEventListener('click', () => {
    if (el.btnUpContinue.disabled) return;
    Game.closeUpgradeOffer();
    el.upgradeOverlay.classList.add('hidden');
    openStore();
  });

  /* ---------- Koleksiyon (Grup K) ----------
     Tüm jokerler rarity gruplu ızgara; prototipte gizleme yok. */

  /* Figma varlığı OLAN özel taşlar (frame ÖZEL_TAŞLAR 259:91 → sayısız temiz
     vektör satırı ÖZEL_TAŞLAR_ASSET 267:2946). Dosya YOLU burada değil
     style.css'teki `.sp-<tip> { --sp-art: url(...) }` satırlarındadır —
     standalone derleyicisi yalnız sabit url(...) yazılarını base64'e
     çevirebiliyor. Bu liste "bu tipin varlığı var mı?" sorusunu yanıtlar;
     2026-09-06'da Su Taşı da eklenince ONUN DA varlığı geldi, yani şu an
     havuzun TAMAMI listede. Yeni bir özel taş eklenirse buraya da yazılmalı,
     yoksa koleksiyonda görselsiz kalır. */
  /* GRUP D (2026-09-07) — GÖRSELİ HAZIR BOSS (EPIC) JOKERLERİ.
     Kaynak: Figma OKEY-101 node 279:9897 "BOSS-EPIC_JOKERLER" (10 kart).
     `SPECIAL_ART` ile birebir aynı desen: bu küme "bu jokerin varlığı var
     mı?" sorusunu yanıtlar, YOL BURADA DURMAZ — sınıf adı `jk-<key>`
     verilir, dosya yolu style.css'teki `--jk-art` satırlarından gelir
     (standalone derleyicisi yalnız sabit url(...) yazılarını base64'e
     çevirebiliyor). 20 boss jokerinin kalan 10'u için tasarım henüz yok;
     onlar GRUP E gereği "blank" kart arkasıyla çizilir. Yeni bir tasarım
     geldiğinde buraya anahtarı, style.css'e de bir `--jk-art` satırı
     eklenir — başka hiçbir yere dokunmak gerekmez. */
  const JOKER_ART = new Set(['aynaKral', 'ahtapot', 'cellat', 'fatality',
    'freedom', 'dervish', 'karaKedi', 'ritim', 'terziIgne', 'zombie']);

  const SPECIAL_ART = new Set(['altin', 'gumus', 'bakir', 'zumrut',
    'karaDelikTasi', 'aynaTasi', 'yildizTasi', 'zamanTasi', 'ates',
    'yankiTasi']);

  /* DEĞNEK GÖRSELLERİ (2026-09-09) — Figma OKEY-101 node 295:176 "TOTEMLER"
     (9 çizim, 81 × 110). `SPECIAL_ART` / `JOKER_ART` ile birebir aynı desen:
     küme "bu değneğin çizimi var mı?" sorusunu yanıtlar, YOL BURADA DURMAZ —
     sınıf adı `cs-<key>` verilir, dosya yolu style.css'teki `--cs-art`
     satırlarından gelir (standalone derleyicisi yalnız sabit url(...)
     yazılarını base64'e çevirebiliyor). Eşleşme Figma katman adından:
     USTURA → zimpara (kartın adı Ustura, anahtar kayıt uyumu için zimpara),
     KUM_SAATİ → zamanKumu, CORONATION → tac; kalanı adıyla aynı.
     19 değneğin kalan 10'unun çizimi henüz yok: koleksiyonda BLANK kart
     arkası (boss joker emsali), store/envanter/pakette emoji ikon. Yeni
     çizim gelince buraya anahtar, style.css'e bir `--cs-art` satırı. */
  const CONSUM_ART = new Set(['zimpara', 'cekic', 'boya', 'muska', 'kumbara',
    'yildizTozu', 'gumusVernik', 'zamanKumu', 'tac']);

  function showCollection() {
    const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const all = Object.values(JOKER_DEFS);
    $('colTitle').textContent = t('colTitle');
    $('colSub').textContent = t('colSub', all.length);
    el.btnColBack.textContent = t('colBack');
    el.colBody.innerHTML = '';
    /* PLAYTEST 20 · GRUP R — MODLAR durum listesi.
       Kilit sistemi ana menü tasarımına düğme EKLEMEDEN kuruldu (Figma
       birebir kuralı); durumu oyuncunun görebileceği yer burasıdır. */
    {
      const head = document.createElement('div');
      head.className = 'col-rar-head';
      head.innerHTML = `${t('colModesHead')}`;
      el.colBody.appendChild(head);
      const wrap = document.createElement('div');
      wrap.className = 'col-modes';
      for (const m of Modes.statusRows()) {
        const row = document.createElement('div');
        row.className = 'cm-row' + (m.open ? '' : ' locked');
        row.innerHTML =
          `<span class="cm-ico">${m.open ? '🔓' : '🔒'}</span>` +
          `<span class="cm-name">${t('modeName_' + m.key)}</span>` +
          `<span class="cm-note">${m.never ? t('modeAlwaysOpen')
            : m.open ? (m.done ? t('modeDone') : t('modeOpen')) : t('modeLockedTip')}</span>`;
        wrap.appendChild(row);
      }
      el.colBody.appendChild(wrap);
    }
    for (const rar of order) {
      const defs = all.filter(d => d.rarity === rar);
      if (!defs.length) continue;
      const head = document.createElement('div');
      head.className = `col-rar-head tr-${rar}`;
      head.innerHTML = `${T.rarity(rar)} <span>${t('colCount', defs.length)}</span>`;
      el.colBody.appendChild(head);
      const grid = document.createElement('div');
      /* GRUP D + E (kullanıcı kararı 2026-09-07) — BOSS (EPIC) RAFI ARTIK
         KART DEĞİL GÖRSEL DİZİSİ. Özel taş rafıyla aynı dil: kart kabuğu
         (krem zemin, çerçeve, gölge) yok, yalnız jokerin kendi çizimi;
         ad ve açıklama hover tooltip'inde. Görseli hazırlanmamış 10 boss
         jokeri BLANK durur (kart arkası) — bilgi yine hover'da tam. */
      const artRow = rar === 'epic';
      grid.className = artRow ? 'col-grid col-jk-row' : 'col-grid';
      for (const def of defs) {
        const tile2 = document.createElement('div');
        if (artRow) {
          const has = JOKER_ART.has(def.key);
          tile2.className = 'col-jk-card' + (has ? '' : ' blank');
          tile2.innerHTML = `<div class="col-jk-art${has ? ' jk-' + def.key : ''}"></div>`;
        } else {
          tile2.className = `joker-tile r-${def.rarity} col-tile`;
          tile2.innerHTML =
            (def.mech === 'deck' ? `<div class="col-deck-tag">${t('colDeckTag')}</div>` : '') +
            (def.icon ? `<div class="col-icon">${def.icon}</div>` : '') +
            `<div class="jt-name">${T.name({ key: def.key, name: def.name })}</div>`;
        }
        attachTip(tile2, { key: def.key, name: def.name, desc: def.desc,
          rarity: def.rarity, usesLeft: def.uses ?? RARITY[def.rarity].uses,
          /* P30 · Grup I — Pandora'nın kutusundan çıkabilecek üç kart */
          variants: def.key === 'truva' && Game.PANDORA_INFO
            ? Object.values(Game.PANDORA_INFO)
            /* P35 · Grup L — The Corporates'in dört şirket görevi, aynı biçim */
            : def.key === 'corporates' && Game.corpsInfo ? Game.corpsInfo() : undefined }, {});
        grid.appendChild(tile2);
      }
      el.colBody.appendChild(grid);
    }
    // Grup M — Tüketilebilirler (prototip: hepsi baştan görünür)
    {
      /* PLAYTEST 29 · GRUP N (bug) — DEĞNEK RAFI RARITY'E GÖRE SIRALANIR.
         KÖK NEDEN: bu raf `Object.values(CONSUMABLES)`i OLDUĞU GİBİ
         çiziyordu, yani sıra engine.js'teki TANIM SIRASIYDI. Tanım sırası
         zamanla bozuldu (Bal Küpü legendary'dir ama iki Mythic'in arasına
         yazılmıştı), oyuncu da koleksiyonda karışık bir kademe gördü.
         Tanım sırasını düzeltmek belirtiyi siler ama nedeni bırakırdı:
         bir sonraki kart yine yanlış yere yazılabilir. Bu yüzden sıra
         ÇİZİM ANINDA garanti edilir — joker rafının kullandığı `order`
         dizisinin aynısı. Sıralama KARARLIDIR: aynı rarity içinde tanım
         sırası korunur (indeks kırıcı). */
      const cons = Object.values(CONSUMABLES)
        .map((d, i) => ({ d, i }))
        .sort((a, b) => {
          const ra = order.indexOf(a.d.rarity || 'common');
          const rb = order.indexOf(b.d.rarity || 'common');
          return ra !== rb ? ra - rb : a.i - b.i;
        })
        .map(x => x.d);
      const head = document.createElement('div');
      head.className = 'col-rar-head tr-consum';
      head.innerHTML = `${t('colConsumHead')} <span>${cons.length}</span>`;
      el.colBody.appendChild(head);
      const grid = document.createElement('div');
      /* Değnek rafı (2026-09-09) — boss joker ve özel taş rafıyla AYNI dil:
         kart kabuğu yok, yalnız Figma çizimi (110 × 150); ad ve açıklama
         hover tooltip'inde. Çizimi henüz gelmemiş değnek boss joker
         emsaliyle BLANK (kart arkası) durur, bilgisi yine tooltip'te. */
      grid.className = 'col-grid col-cs-row';
      for (const def of cons) {
        const tile2 = document.createElement('div');
        const has = CONSUM_ART.has(def.key);
        tile2.className = 'col-cs-card' + (has ? '' : ' blank');
        tile2.innerHTML = `<div class="col-cs-art${has ? ' cs-' + def.key : ''}"></div>`;
        attachTip(tile2, { name: T.consumName(def.key, def.name),
          rarityText: `${T.rarity(def.rarity || 'common')} · ${t('consumTag')}`,
          accent: def.rarity || 'common',
          desc: T.consumDesc(def.key, def.desc) }, {});
        grid.appendChild(tile2);
      }
      el.colBody.appendChild(grid);
    }
    // Grup M — Özel Normal Taşlar (GDD 6.5c)
    {
      const sp = Object.values(SPECIAL_TILES);
      const head = document.createElement('div');
      head.className = 'col-rar-head tr-special';
      head.innerHTML = `${t('colSpecialHead')} <span>${sp.length}</span>`;
      el.colBody.appendChild(head);
      const grid = document.createElement('div');
      /* Özel taş rafı kart ızgarası DEĞİL, taş dizisidir (bkz. .col-sp-row) */
      grid.className = 'col-grid col-sp-row';
      for (const def of sp) {
        const tile2 = document.createElement('div');
        /* Kart kabuğu (joker-tile: krem zemin, çerçeve, gölge) BİLEREK yok —
           kullanıcı isteği: koleksiyonda çerçevesiz, yalnız taşın kendisi. */
        tile2.className = 'col-sp-card';
        /* Kullanıcı kararı 2026-09-06: koleksiyonda özel taş artık emoji
           yer tutucuyla değil, Figma'daki GERÇEK varlığıyla görünür
           (SPECIAL_ART → assets/game/special/<tip>.svg, node 259:91).
           Kart YALNIZ TAŞI gösterir — ad yazılmaz, çünkü üstüne gelince
           ad ve açıklama tooltip'te zaten çıkıyor (kullanıcı isteği).
           Varlığı olmayan bir taş kalırsa (bugün yok) kart bomboş kalmasın
           diye adını yazar; bu dal yeni bir taş eklenene kadar çalışmaz. */
        const art = SPECIAL_ART.has(def.key);
        tile2.innerHTML = art
          ? `<div class="col-sp-art sp-${def.key}"></div>`
          : `<div class="jt-name">${T.specialName(def.key, def.name)}</div>`;
        attachTip(tile2, { name: T.specialName(def.key, def.name),
          rarityText: t('specialTag'),
          desc: T.specialDesc(def.key, def.desc) }, {});
        grid.appendChild(tile2);
      }
      el.colBody.appendChild(grid);
    }
    /* PLAYTEST 9 · GRUP F — STAGE SONU GÜÇLENDİRMELERİ.
       Bunlar store'da satılmadığı ve yalnız boss sonrası ekranda 5'i birden
       sunulduğu için oyuncu havuzun tamamını hiç göremiyordu. Prototip
       incelemesinde "neyin neye dönüşebileceği" görünsün diye tümü burada. */
    {
      const ups = Object.values(UPGRADE_DEFS);
      const head = document.createElement('div');
      head.className = 'col-rar-head tr-upgrade';
      head.innerHTML = `${t('colUpgradeHead')} <span>${ups.length}</span>`;
      el.colBody.appendChild(head);
      const grid = document.createElement('div');
      grid.className = 'col-grid';
      for (const def of ups) {
        const tile2 = document.createElement('div');
        tile2.className = 'joker-tile r-legendary col-tile';
        tile2.innerHTML =
          `<div class="col-icon">${def.icon}</div>` +
          `<div class="jt-name">${T.upName(def.key, def.name)}</div>`;
        attachTip(tile2, { name: T.upName(def.key, def.name),
          rarityText: t('upgradeTag'),
          desc: T.upDesc(def.key, def.desc) }, {});
        grid.appendChild(tile2);
      }
      el.colBody.appendChild(grid);
    }
    openScene(el.collectionOverlay);
  }

  el.btnCollection.addEventListener('click', showCollection);
  el.btnColBack.addEventListener('click', () => {
    hideTip();
    el.collectionOverlay.classList.add('hidden');
  });

  /* Çıkış (Grup E) — tarayıcı prototipinde sekmeyi kapatmayı dener */
  el.btnQuit.addEventListener('click', () => {
    window.close();
    setTimeout(() => toast(t('quitToast')), 300);
  });

  el.btnStoreContinue.addEventListener('click', () => {
    // Öğretici: boss geçildiyse stage tamamlandı → bitir
    if (TUT.active) {
      const s = Game.state;
      if (s.roundInStage === 3 && s.status === 'won') {
        el.storeOverlay.classList.add('hidden');
        TUT.finish();
        return;
      }
    }
    el.storeOverlay.classList.add('hidden');
    Game.nextRound();
    selection.clear();
    newTileIds.clear();
    /* Emniyet ağı: normalde buraya HİÇ gelinmez — son boss geçildiğinde
       store zaten açılmıyor (Grup M, Game._sealRunIfFinished). Eski
       kayıtlardan devam eden bir run bu yoldan biterse zafer ekranına
       düşsün diye duruyor. */
    if (Game.state.status === 'runComplete' || Game.state.runFinished) {
      showRunComplete();
      return;
    }
    showScreen('map');
    if (Game.state.roundInStage === 1) showOkeyBanner(); // yeni stage — okey ilanı
  });

  /* pencere boyutu değişince oyun ekranını yeniden ölçekle */
  window.addEventListener('resize', () => {
    if (!el.gameScreen.classList.contains('hidden')) render();
  });

  /* toast gizli başlasın */
  el.toast.classList.add('hidden');

  /* Ses ac/kapa (GDD 14.5) - 2026-08-23: Figma oyun ekraninda ses butonu
     YOKTUR ("i" butonu RUN BILGISI butonudur), bu yuzden ses kontrolu
     duraklat menusune tasindi. */
  const sfxLabel = () => `${sfxOn ? '🔊' : '🔇'} ${t('sfxLbl')}`;
  refreshSfxLabel = () => {                                        // Grup E
    el.btnSfx.textContent = sfxLabel();
    el.btnMapSfx.textContent = sfxLabel();                         // GRUP I
  };
  el.btnSfx.textContent = sfxLabel();
  el.btnMapSfx.textContent = sfxLabel();
  el.btnSfx.addEventListener('click', () => {
    sfxOn = !sfxOn;
    localStorage.setItem('okeySfx', sfxOn ? '1' : '0');
    el.btnSfx.textContent = sfxLabel();
    if (sfxOn) SFX.tick();
  });

  /* RUN BILGISI ("i" butonu, Figma 210:3805) - o anki run'in ozeti.
     Deste/atilan yigini pop-up'iyla ayni gorsel dili kullanir. */
  function showRunInfo() {
    const s = Game.state;
    if (!s) return;
    let p = document.getElementById('runInfoPop');
    if (!p) {
      p = document.createElement('div');
      p.id = 'runInfoPop';
      p.className = 'hidden';
      p.addEventListener('click', (e) => {
        if (e.target === p || e.target.classList.contains('ri-close')) p.classList.add('hidden');
      });
      document.body.appendChild(p);
    }
    const rows = [
      [t('riStage'), `${s.stage}/${chCount()}`],
      [t('riRound'), `${s.roundInStage}/3`],
      [t('riTurn'), `${s.turn}/${s.maxTurns}`],
      [t('riScore'), `${s.score} / ${s.target}`],
      [t('riCoins'), `$${s.coins}`],
      [t('riPerm'), `+${(s.permMult || 0).toFixed(1)}x`],
      [t('riOkey'), okeyLabel()],
      [t('riJokers'), `${s.jokers.length}/${Game.slotCap()} - backup ${s.backup.length}/2`],
      [t('riTotem'), `${s.consumables.length}/${Game.consumCap()}`],
      [t('riDeck'), `${s.deck.length}/${Game.totalTilesInPlay()}`],
    ];
    if (Game.isBossRound())
      rows.splice(2, 0, [t('riBoss'), T.bossName(s.boss.key, s.boss.name)]);
    if (s.kaptanCursed) rows.push([t('riCurse'), t('kaptanCurse', 20)]);
    /* GRUP E (P22) — İKİNCİ ŞANS RUN INFO'DA GÖRÜNMÜYORDU.
       Run'ın gidişini değiştiren kalıcı bir güvenlik ağıydı ama oyuncunun
       onu görebileceği hiçbir yer yoktu. Hak duruyorsa "Hazır", harcandıysa
       "Kullanıldı" yazar; hiç alınmadıysa satır çizilmez. */
    if ((s.secondChance || 0) > 0) rows.push([t('riSecondChance'), t('riSecondReady')]);
    else if (s.secondChanceTaken) rows.push([t('riSecondChance'), t('riSecondUsed')]);
    /* PLAYTEST 28 · GRUP F — FERMAN DURUMU RUN INFO'DA.
       İkinci Şans satırıyla aynı gerekçe: yazılan ferman raundlar sonra
       işleyen kalıcı bir güvenlik ağı, oyuncunun onu görebileceği başka
       hiçbir yer yok. Hiç kullanılmadıysa satır çizilmez. */
    if (s.fermanPending) rows.push([t('riFerman'), t('riFermanReady')]);
    else if ((s.fermanUsed || 0) > 0)
      rows.push([t('riFerman'), t('riFermanUsed', s.fermanUsed, FERMAN_MAX)]);
    p.innerHTML = `<div class="ri-card"><h3>${t('riTitle')}</h3>` +
      rows.map(([k, v]) => `<div class="ri-row"><span>${k}</span><b>${v}</b></div>`).join('') +
      `<button class="btn ghost ri-close">${t('close')}</button></div>`;
    p.classList.remove('hidden');
  }
  el.btnRunInfo.addEventListener('click', showRunInfo);

  /* ==========================================================================
     PLAYTEST 14 · GRUPLAR J & K — METİN SIĞDIRMA (auto-shrink-to-fit)
     Kutu ölçüleri Figma'dan gelir ve DEĞİŞMEZ; sığmayan metinlerde yalnız
     yazı boyu kademeli küçülür. İki ayrı bug'ı birden kapatır:
       J) buton/etiket metinleri kutunun dışına taşıp kesiliyordu
          ("Discard 2 Til…", TR "Onayla"/"Sırala")
       K) uzun raund/boss adları ("Gösterge Eli", "Indicator Hand") alt
          satıra kayıyordu — artık `white-space:nowrap` + küçülme.

     ⚠ ÖLÇÜM TUZAĞI: butonlar `display:flex; justify-content:center`
     olduğu için taşan metin İKİ YANA birden taşar; `scrollWidth` bunu
     görmez (eski sürüm bu yüzden hiç küçültmüyordu). Bunun yerine metnin
     gerçek kutusu `Range.getClientRects()` ile ölçülür. Bu ölçüm EKRAN
     px'i döndürür (sahne `transform: scale()` altında), o yüzden hedef
     genişlik de aynı ölçekle çarpılarak karşılaştırılır. */

  /* İçeriğin gerçekte kapladığı en geniş yatay şerit (ekran px).
     Satır kutularının BİRLEŞİMİ alınır: tek metinde metnin kendisi, çok
     satırlıda en uzun satır, flex kapsayıcıda (omuz sekmesi: etiket +
     sayaç + ok) en soldan en sağa tüm şerit ölçülür. */
  function textSpan(node) {
    const r = document.createRange();
    r.selectNodeContents(node);
    let lo = Infinity, hi = -Infinity, top = Infinity, bot = -Infinity;
    for (const rect of r.getClientRects()) {
      if (!rect.width) continue;
      if (rect.left < lo) lo = rect.left;
      if (rect.right > hi) hi = rect.right;
      if (rect.top < top) top = rect.top;
      if (rect.bottom > bot) bot = rect.bottom;
    }
    r.detach && r.detach();
    return { w: hi > lo ? hi - lo : 0, h: bot > top ? bot - top : 0 };
  }

  /* İçeriğin DOĞAL genişliği (ekran px). İki durum ayrılır:
       · doğrudan metin taşıyan eleman (buton, çip)  → Range ölçümü
       · yalnız çocuk elemanlardan oluşan flex satırı (omuz sekmesi:
         etiket + sayaç + ok) → çocukların TOPLAMI. Bu ayrım şart:
         sekmedeki `margin-left:auto` çocukları iki uca yaslıyor, Range
         birleşimi her zaman kutunun tamamını ölçüp yanlışlıkla
         küçültmeye yol açıyordu. */
  function contentBox(node) {
    const hasText = [...node.childNodes]
      .some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText && node.children.length) {
      const cs = getComputedStyle(node);
      const gap = parseFloat(cs.columnGap) || 0;
      let sum = 0, h = 0;
      for (const k of node.children) {
        const r = k.getBoundingClientRect();
        sum += r.width;
        if (r.height > h) h = r.height;
      }
      return { w: sum + gap * (node.children.length - 1), h };
    }
    return textSpan(node);
  }

  /* Yazı boyunu base'ten min'e doğru 1px azaltarak metni kutuya sığdırır.
     `checkH` verilirse yükseklik de denetlenir: sarmalanan (çok satırlı)
     butonlarda metin yalnız yana değil AŞAĞI da taşabiliyor. */
  function fitText(node, base, min, checkH) {
    if (!node || node.classList.contains('hidden') || !node.offsetWidth) return;
    node.style.fontSize = base + 'px';
    const cs = getComputedStyle(node);
    const innerW = node.clientWidth
      - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    const innerH = node.clientHeight
      - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0);
    if (innerW <= 0) return;
    const scale = node.getBoundingClientRect().width / node.offsetWidth || 1;
    const availW = innerW * scale, availH = innerH * scale;
    let size = base;
    for (;;) {
      const box = contentBox(node);
      if (box.w <= availW && (!checkH || box.h <= availH)) break;
      if (size <= min) break;
      size -= 1;
      node.style.fontSize = size + 'px';
    }
  }

  /* PLAYTEST 17 · GRUP A/4 — puan önizleme kutusu asla taşmaz.
     Kutu CSS'te içerikle büyür (min 260px, maks 520px). 520px'e dayanan
     çok uzun hesaplarda (ör. "1284x12.5=16050") yazı 24px'ten 13px'e
     kadar kademeli küçültülür. Rakamlar kutunun kendi ölçüsüne göre
     ölçeklendiği için Figma hizası korunur. */
  const PV_BASE = 24, PV_MIN = 13;
  function fitPreview() {
    const bar = el.previewBar;
    if (!bar || bar.classList.contains('hidden')) return;
    bar.style.fontSize = '';
    const spans = [...bar.querySelectorAll('span')];
    spans.forEach(x => { x.style.fontSize = ''; });
    /* GRUP A (P20) — feda önizlemesi bir CÜMLEDİR: kutuya sığdırma işini
       CSS yapar (geniş kutu + sarma), yazı boyu burada zorlanmaz. */
    if (bar.classList.contains('pv-terazi')) return;
    let size = PV_BASE;
    const fits = () => bar.scrollWidth <= bar.clientWidth + 1;
    while (!fits() && size > PV_MIN) {
      size -= 1;
      bar.style.fontSize = size + 'px';
      spans.forEach(x => { x.style.fontSize = size + 'px'; });
    }
  }

  /* PLAYTEST 17 · GRUP A/8 — omuz gövdesine slot sayısını bildir.
     CSS `[data-slots]` üzerinden kart genişliğini/aralığını seçer; 310px'lik
     omuz görseli hiç deforme edilmeden 2-5 slot sığar. */
  function shoulderSlots(row, count) {
    const body = row?.parentElement;
    if (!body) return;
    body.dataset.slots = String(Math.max(1, Math.min(5, count || row.children.length)));
  }

  /* Aksiyon barındaki butonlar Figma'da SABİT 90×60'tır. */
  const ACT_BASE = 20;
  const ACT_BIG = 26;   // taş atma aşamasının büyük ortalanmış butonu
  function fitActionLabels() {
    document.querySelectorAll('#gameScreen .gm-actions .gm-btn').forEach(b => {
      if (b.classList.contains('hidden')) return;
      /* Buton metni gerekirse SARMALANIR (tasarımdaki "Open Hand" da iki
         satır) — 90×60 kutuya tek satır sığdırmaya çalışmak uzun TR/EN
         etiketlerinde yazıyı 9px'e düşürüp yine taşırıyordu.
         Taş atma aşamasının büyük ortalanmış butonu (210×70) daha büyük bir
         tabandan başlar; yoksa 20px yazı o kutuda kaybolurdu. */
      const big = b.id === 'btnDiscard'
        && b.parentElement.classList.contains('discard-only');
      fitText(b, big ? ACT_BIG : ACT_BASE, 11, true);
    });
    // "Sort Hand" / "Sırala" etiketi (Figma 16px)
    const sl = document.getElementById('sortLabel');
    if (sl && sl.offsetParent !== null) fitText(sl, 16, 9);
    // Omuz sekmeleri: "backup 0/2" / "Değnek 0/3" (Figma 16px, 208px slot)
    document.querySelectorAll('#gameScreen .gm-sh-tab').forEach(b => fitText(b, 16, 9));
    // Raund adı / BOSS adı çipi — asla alt satıra kaymaz (Grup K)
    fitText(el.roundChip, 30, 13);
    // Kutucuk başlıkları (STAGE / RAUND / OKEY / Meld) ve Raund Score etiketi
    document.querySelectorAll('#gameScreen .gm-stat-h').forEach(b => fitText(b, 16, 9));
    fitText(document.getElementById('lblOkeyBox'), 20, 10);
    fitText(document.getElementById('lblMeld'), 16, 9);
    /* Grup B (Playtest 16): çarpan değeri ("+12.5x") 32px'te 155px kutuya
       sığmıyor — STAGE/RAUND değerleri 3 karakterken bu 6 olabiliyor. */
    document.querySelectorAll('#gameScreen #permMult .gm-stat-v')
      .forEach(b => fitText(b, 32, 14));
  }

  /* ⚠ Piksel yazı tipleri `font-display: block` ile yükleniyor: ilk render
     YEDEK yazı tipiyle ölçülürse metin dar görünür ve küçültme atlanır
     (ölçüm: "Indicator Hand" 30px'te kalıp çipten 21px taşıyordu). Yazı
     tipleri hazır olunca ölçüm bir kez tazelenir; sonraki render'lar zaten
     doğru yazı tipiyle ölçer. */
  if (document.fonts) {
    const refit = () => { try { fitActionLabels(); } catch (e) { /* ekran kapalı */ } };
    document.fonts.ready && document.fonts.ready.then(refit);
    /* `ready` yalnız BİR kez çözülür; piksel yazı tipi ise ilk kez oyun
       ekranı açıldığında (o ana kadar hiçbir görünür eleman kullanmıyor)
       indirilmeye başlar → her yükleme bitişinde de tazele. */
    document.fonts.addEventListener &&
      document.fonts.addEventListener('loadingdone', refit);
  }

  /* ---------- TRAINER MODU (Grup H, 2026-08) ----------
     DMC "Void" tarzı sandbox. Girişte joker/tüketilebilir/coin/el seçimi;
     haritada boss seçici + opsiyonel store filtresi. Kayıt alınmaz. */

  const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

  // Rarity gruplu, tıkla-seç joker ızgarası (kurulum + store filtresi ortak)
  function jokerPickGrid(selected, onToggle) {
    const wrap = document.createElement('div');
    wrap.className = 'tr-grid-wrap';
    for (const r of RARITY_ORDER) {
      const defs = Object.values(JOKER_DEFS).filter(d => d.rarity === r);
      if (!defs.length) continue;
      const h = document.createElement('div');
      h.className = `tr-rar tr-${r}`;
      h.textContent = T.rarity(r);
      wrap.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'tr-grid';
      for (const d of defs) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tr-pick' + (selected.has(d.key) ? ' on' : '');
        b.innerHTML = `<span class="tp-ico">${jokerIcon(d.key)}</span>` +
          `<span class="tp-name">${T.name({ key: d.key, name: d.name })}</span>`;
        attachTip(b, { key: d.key, name: d.name, desc: d.desc, rarity: d.rarity,
          usesLeft: d.uses ?? RARITY[d.rarity].uses }, {});
        b.addEventListener('click', () => {
          onToggle(d.key);
          b.classList.toggle('on', selected.has(d.key));
        });
        grid.appendChild(b);
      }
      wrap.appendChild(grid);
    }
    return wrap;
  }

  function showTrainerSetup() {
    document.getElementById('trainerSetup')?.remove();
    const selJ = new Set(), selC = new Set();
    const ov = document.createElement('div');
    ov.id = 'trainerSetup';
    /* PLAYTEST 20 · GRUP K — POP-UP İSKELETİ (kullanıcı raporu: "çok aşağı
       kaydırma gerektiriyor").
       ÖLÇÜM (1920×1080): panel 880×950, içerik 1100px → 152px taşma; üstelik
       panel ekran yüksekliğinin %88'ini kaplıyordu, yani bir pop-up gibi
       değil bir SAYFA gibi duruyordu.
       YENİ YAPI üç parçalıdır ve yalnız ORTA parça kayar:
         · .tr-head  — başlık + alt açıklama (SABİT)
         · .tr-body  — joker/değnek seçim ızgaraları (gerekirse kayar)
         · .tr-foot  — seçenek satırı + düğmeler (SABİT, hep görünür)
       Böylece "Testi Başlat" düğmesi hiçbir zaman kaydırma arkasında
       kalmaz; kaydırma varsa da yalnız seçim ızgarasındadır. */
    const panel = document.createElement('div');
    panel.className = 'tr-panel';
    const head = document.createElement('div');
    head.className = 'tr-head';
    head.innerHTML = `<h2>${t('trTitle')}</h2><p class="tr-sub">${t('trSubtitle')}</p>`;
    panel.appendChild(head);
    const body = document.createElement('div');
    body.className = 'tr-body';
    panel.appendChild(body);

    const jh = document.createElement('h3');
    const updJh = () => { jh.textContent = `${t('trJokers')} — ${t('trPicked', selJ.size)}`; };
    updJh();
    body.appendChild(jh);
    const warn = document.createElement('p');
    warn.className = 'tr-hint';
    warn.textContent = t('trSlotWarn');
    body.appendChild(warn);
    body.appendChild(jokerPickGrid(selJ, (k) => {
      selJ.has(k) ? selJ.delete(k) : selJ.add(k);
      updJh();
    }));

    const ch = document.createElement('h3');
    /* P22 · Grup D: taban kapasite 3 → 2. Sınır artık motordan okunur; elle
       yazılsaydı Trainer 3 değnek seçtirir, motor ikisini alıp üçüncüyü
       sessizce düşürürdü (newRunTrainer consumCap() ile sınırlıdır). */
    const cMax = MAX_CONSUMABLES;
    const updCh = () => { ch.textContent = `${t('trConsums', cMax)} — ${t('trPicked', selC.size)}`; };
    updCh();
    body.appendChild(ch);
    const cg = document.createElement('div');
    cg.className = 'tr-grid';
    for (const d of Object.values(CONSUMABLES)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tr-pick';
      b.innerHTML = `<span class="tp-ico">${d.icon}</span>` +
        `<span class="tp-name">${T.consumName(d.key, d.name)}</span>`;
      attachTip(b, { name: T.consumName(d.key, d.name), rarityText: T.rarity(d.rarity),
        desc: T.consumDesc(d.key, d.desc) }, {});
      b.addEventListener('click', () => {
        if (selC.has(d.key)) selC.delete(d.key);
        else if (selC.size < cMax) selC.add(d.key);
        b.classList.toggle('on', selC.has(d.key));
        updCh();
      });
      cg.appendChild(b);
    }
    body.appendChild(cg);

    // GRUP K (P20): seçenekler ve düğmeler sabit alt barda
    const foot = document.createElement('div');
    foot.className = 'tr-foot';
    panel.appendChild(foot);

    const row = document.createElement('div');
    row.className = 'tr-opts';
    row.innerHTML =
      `<label>${t('trStages')} <select id="trStages">` +
      `<option value="1">1</option><option value="3">3</option>` +
      `<option value="6">6</option><option value="8" selected>8</option>` +
      `<option value="12">12</option>` +
      `<option value="inf">${t('trInfinite')}</option>` +
      `</select></label>` +
      `<label>${t('trCoins')} <input id="trCoins" type="number" min="0" max="999" value="20"></label>` +
      `<label>${t('trHand')} <select id="trHand">` +
      `<option selected>15</option><option>17</option><option>19</option><option>21</option>` +
      `</select></label>` +
      /* PLAYTEST 20 · GRUP J — EL DÜZENİ (deneysel, yalnız Trainer).
         Ana oyun moduna DOKUNULMAZ: serbest düzen yalnız buradan
         seçilebilir ve yalnız trainer run'ında çizilir. */
      `<label>${t('trRack')} <select id="trRack">` +
      `<option value="classic" selected>${t('trRackClassic')}</option>` +
      `<option value="free">${t('trRackFree')}</option>` +
      `</select></label>` +
      /* Joker süresi (2026-08-26): farklı testler için jokerin kaç raund
         elde kalacağı elle seçilir; "Varsayılan" her jokerin kendi süresi. */
      `<label>${t('trUses')} <select id="trUses">` +
      `<option value="def" selected>${t('trUsesDefault')}</option>` +
      [1, 2, 3, 4, 5, 8, 10, 20].map(n => `<option value="${n}">${n}</option>`).join('') +
      `<option value="inf">${t('trUsesInf')}</option>` +
      `</select></label>` +
      /* Grup K — Okey Taşını elle seç; "Rastgele" seçilirse mevcut mantık sürer */
      `<label>${t('trOkey')} <select id="trOkeyColor">` +
      `<option value="">${t('trOkeyRandom')}</option>` +
      COLORS.map(c => `<option value="${c}">${T.color(c)}</option>`).join('') +
      `</select>` +
      `<select id="trOkeyNum">` +
      Array.from({ length: 13 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('') +
      `</select></label>`;
    foot.appendChild(row);

    const acts = document.createElement('div');
    acts.className = 'tr-acts';
    const bStart = document.createElement('button');
    bStart.className = 'btn primary';
    bStart.textContent = t('trStart');
    bStart.addEventListener('click', () => {
      hideTip();
      const chSel = panel.querySelector('#trStages').value;
      Game.newTrainerRun({
        stages: chSel === 'inf' ? Infinity : parseInt(chSel, 10),
        jokers: [...selJ],
        consumables: [...selC],
        coins: parseInt(panel.querySelector('#trCoins').value, 10) || 0,
        handSize: parseInt(panel.querySelector('#trHand').value, 10) || undefined,
        jokerUses: usesCfg(panel.querySelector('#trUses').value),
        okey: okeyCfg(panel),
        rack: panel.querySelector('#trRack').value,   // GRUP J (P20)
      });
      ov.remove();
      updateTrainerBadge();
      showScreen('map');
      showOkeyBanner();
    });
    const bCancel = document.createElement('button');
    bCancel.className = 'btn ghost';
    bCancel.textContent = t('trCancel');
    bCancel.addEventListener('click', () => { hideTip(); ov.remove(); });
    acts.append(bStart, bCancel);
    foot.appendChild(acts);

    ov.appendChild(panel);
    document.body.appendChild(ov);
  }
  el.btnTrainer.addEventListener('click', showTrainerSetup);

  // Raund girişinde opsiyonel store filtresi (yalnız trainer'da görünür)
  function showTrainerFilter() {
    document.getElementById('trainerFilter')?.remove();
    const cur = new Set(Game.state.trainerStoreFilter || []);
    const ov = document.createElement('div');
    ov.id = 'trainerFilter';
    const panel = document.createElement('div');
    panel.className = 'tr-panel';
    panel.innerHTML = `<h2>${t('trFilterTitle')}</h2><p class="tr-sub">${t('trFilterHint')}</p>`;
    panel.appendChild(jokerPickGrid(cur, (k) => { cur.has(k) ? cur.delete(k) : cur.add(k); }));
    const acts = document.createElement('div');
    acts.className = 'tr-acts';
    const bOk = document.createElement('button');
    bOk.className = 'btn primary';
    bOk.textContent = 'OK';
    bOk.addEventListener('click', () => {
      hideTip();
      Game.setStoreFilter([...cur]);
      if (cur.size) toast(t('trFilterSet', cur.size), true);
      ov.remove();
      renderMap();
    });
    const bClear = document.createElement('button');
    bClear.className = 'btn ghost';
    bClear.textContent = t('trFilterClear');
    bClear.addEventListener('click', () => {
      hideTip();
      Game.setStoreFilter(null);
      ov.remove();
      renderMap();
    });
    acts.append(bOk, bClear);
    panel.appendChild(acts);
    ov.appendChild(panel);
    document.body.appendChild(ov);
  }
  /* ---------- Başlat: ana menü (dev: #map / #game ile ekran atla) ---------- */
  /* ============================================================
     PLAYTEST 25 · GRUP B — TANI PANELİ (Ctrl+Shift+D)
     Kullanıcı oyunu OKEY.exe ile oynuyor: "taşım kayboldu" dediğinde
     tarayıcı konsolu açtırmak gerçekçi değil. Bu kısayol, motorun tuttuğu
     ham kanıtı (şu anki el + bütünlük durumu + nöbetçi alarmları + son 40
     turun taş giriş/çıkış dökümü) tek tuşla ekrana getirir; metin
     seçilebilir kutuda durur, "Kopyala" ve "Dosyaya Kaydet" düğmeleri
     vardır. Normal oyunda görünmez, hiçbir akışa karışmaz.
     ============================================================ */
  function showDiagnostics() {
    document.getElementById('diagOverlay')?.remove();
    const text = Game.diagnosticReport();
    const ov = document.createElement('div');
    ov.id = 'diagOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,20,16,.86);'
      + 'display:flex;align-items:center;justify-content:center;padding:24px;font-family:monospace';
    const box = document.createElement('div');
    box.style.cssText = 'background:#F7F4E9;color:#22384A;border:3px solid #4a6b57;border-radius:8px;'
      + 'max-width:900px;width:100%;max-height:86vh;display:flex;flex-direction:column;gap:10px;padding:16px';
    const h = document.createElement('div');
    h.textContent = 'TANI RAPORU — "taşım kayboldu" olduysa bu metni geliştiriciye gönder';
    h.style.cssText = 'font-weight:bold;font-size:13px';
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.readOnly = true;
    ta.style.cssText = 'flex:1;min-height:380px;font-family:monospace;font-size:11px;line-height:1.45;'
      + 'padding:10px;border:1px solid #b9c7bd;border-radius:6px;background:#fff;resize:none;white-space:pre';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end';
    const mkBtn = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'padding:8px 16px;font:inherit;font-size:12px;cursor:pointer;'
        + 'border:2px solid #4a6b57;border-radius:6px;background:#E7EFE6';
      b.addEventListener('click', fn);
      return b;
    };
    row.appendChild(mkBtn('Kopyala', () => {
      ta.select();
      let done = false;
      try { done = document.execCommand('copy'); } catch (e) { /* file:// kısıtı */ }
      if (!done && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      toast('Rapor panoya kopyalandı', true);
    }));
    row.appendChild(mkBtn('Dosyaya Kaydet', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      a.download = `okey-tani-${Date.now()}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }));
    row.appendChild(mkBtn('Kapat', () => ov.remove()));
    box.append(h, ta, row);
    ov.appendChild(box);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    ta.focus();
  }
  /* İKİ kısayol birden: OKEY.exe Chromium'u açtığı için Ctrl+Shift+D
     tarayıcının kendi "tüm sekmeleri yer imine ekle" kısayoluna
     yakalanabilir; F9 hiçbir yere bağlı değildir ve exe'de de çalışır. */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F9' || (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd'))) {
      e.preventDefault();
      showDiagnostics();
    } else if (e.key === 'Escape') {
      document.getElementById('diagOverlay')?.remove();
    }
  });

  applyStaticTexts();
  Game.newRun(); // arka planda hazır dursun (harita için)
  if (location.hash === '#map') showScreen('map');
  else if (location.hash === '#game') showScreen('game');
  else showScreen('menu');

  /* test kancaları (Playwright otomasyonu) — prototip aşamasında açık */
  window.__test = { render, renderStore, openStore, showUpgradeScene, showScreen,
    showRoundEnd, showRunComplete, showPilePopup, fitLabels: fitActionLabels,
    // Playtest 17 — Grup A/F doğrulaması için
    notify, showCoinFlip, pickFuzyon, flushRoundStart,
    // Playtest 19 — Grup E: Füzyon kullanım menüsü
    fuzyonMenu,
    // Playtest 19 — Grup G: The Cheating bildirimi
    cheatFlash,
    // Playtest 18 — Grup E: dil değişimini test tarafında da gerçek akışla uygula
    applyStaticTexts, fitPauseMenu,
    // Playtest 20 — Grup R: mod kilit sistemi
    Modes };
})();
