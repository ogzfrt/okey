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
   'btnMapPause','btnMapInfo','mapMenuPop','btnMapGoMenu','btnMapSettings',
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
   'ssRound','storeSlotsRow','storeBackupRow','storeConsumRow',
   'ssSlotsCount','ssBackupCount','ssConsumCount',
   'btnReroll','btnStoreContinue',
   'upgradeOverlay','upOptions','upCoins','btnUpContinue',
   'collectionOverlay','colBody','btnColBack',
   'btnMenu','menuPop','btnGoMenu','btnPauseSettings','btnTutorial','btnRunInfo','coinVal',
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
    ? Math.round(Game.jokerPriceOf(key, rarity) * SIGORTA_RATE) : Game.jokerSellOf(key, rarity));   // P51: %75

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
     MAX_HAND (21) sığar, boşluk bırakma özgürlüğü kalır.
     P53 · GRUP B (2026-09-19): başlangıç eli 21'den başlayıp stage başına +2
     büyüdüğü için MAX_HAND 30'a çıktı; 30 hücre taşları alıyor ama boşluk
     payı bırakmıyordu. Izgara 2×17 = 34 hücre oldu — 30 taş sığar, 4 hücre
     boşluk bırakma özgürlüğü kalır. (Dizi bir ara 35'e kadar gidiyordu;
     hücre 57px'e inip ıstaka okunmaz olduğu için tavan 30'a çekildi.)
     Satır SAYISI değişmedi (Figma ıstakası 2 satırdır); yalnız sütun sayısı
     arttı, taş genişliği zaten sütun sayısından türetiliyor (aşağıda).
     ⚠ Sütun sayısı ARTIK BURADA TANIMLI DEĞİL: motor da alt satırın slot
     tabanı olarak aynı sayıyı kullanıyor (Game.setRackOrder), iki kopya
     sessizce ayrışabiliyordu. Tek kaynak engine.js'teki `RACK_COLS`. */
  const RACK_CAP = RACK_COLS * 2, RACK_GAP = 12;

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
    // Store sahnesi: sol sütunun akışına (haritadaki gibi başlığın altına)
    document.getElementById('storeSide')?.appendChild(mk());
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
    applyRunTheme();   // P68 — Kumarhane run'ında kumarhane teması
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
  /* P37 (kullanıcı kararı 2026-09-13) — OYUN İÇİ BİLDİRİM KARTLARI KAPALI.
     Kullanıcı hangi geri bildirimlerin döneceğini sonra tek tek seçecek.
     Motor olay satırlarını üretmeye devam eder; yalnız ekrana basılmaz.
     Kalıcı bilgiler kendi yerinde durur (Kahin kehaneti: #kahinChip).
     Geri açmak: NOTES_ENABLED = true (testler __test.setNotes ile açar). */
  let NOTES_ENABLED = false;
  function notify(lines, good = true, opts) {
    if (!NOTES_ENABLED) return;
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
      // P49 · Grup A — uyanmış The Misunderstood taşı V1 yerine Figma V2 çizimiyle gelir
      const djV2 = tile.jokerTile === 'misunderstood'
        && Game.state.deckJokers.some(x => x.key === 'misunderstood' && x.awakened);
      d.className = 'tile deck-joker' + (djArt ? ' has-art jk-' + tile.jokerTile : '') + (djV2 ? ' misu-v2' : '');
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
      if (j) attachTip(d, j, {});
      return d;
    }
    /* P54 · Grup A — ÜÇ KAĞITÇI (BOSS): ters gelen taşın yüzü gizlidir.
       Seçilip açılabilir, atılabilir; ne olduğu açılımda ya da bir sonraki
       tur başında görünür. İpucu da yüzü söylemez. */
    if (tile.faceDown) {
      d.className = 'tile face-down';
      d.dataset.id = tile.id;
      d.innerHTML = '';   // P55: kullanıcı kararı — ters taş destedeki maskotlu ARKA YÜZLE çizilir (bkz. style.css)
      /* P57 — Öteki Dünya'nın sisiyle ters dönen taş başka bir şey anlatır */
      if (tile.fog) attachTip(d, { name: t('fogName'), rarityText: t('fogTag'), desc: t('fogDesc') }, {});
      else attachTip(d, { name: t('faceDownName'), rarityText: t('bossMarkTag'), desc: t('faceDownDesc') }, {});
      if (interactive) {
        if (selection.has(tile.id)) d.classList.add('selected');
        if (newTileIds.has(tile.id)) d.classList.add('new');
        d.addEventListener('click', () => onTileClick(tile.id));
        enableDrag(d, tile);
      }
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
    /* P59 · Ay Takvimi — Ay Taşı (kalıcı ya da raund içi) evre simgesini taşır */
    if (Game.isMoonTile && Game.isMoonTile(tile)) {
      d.classList.add('moon-tile');
      d.dataset.moon = Game.moonIconNow ? Game.moonIconNow() : '🌙';
    }
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
    /* Freedom Fighters işareti — P52 · GRUP A (kullanıcı kararı 2026-09-18:
       "Figma'dakinin birebir aynısı olsun, senin yaptığın olmasın").
       ⚔ KOKARDI KALDIRILDI: tasarımda (346:2466) taşın üstünde rozet yoktur ve
       gerek de kalmadı — taş artık yüzünü tümden değiştiriyor, kokard yalnız
       çizimin köşesini kapatıyordu. Tooltip DURUYOR: o görsel bir ekleme değil,
       "bu taş ne kadar puan getirecek" bilgisinin tek kanalı. */
    const ff = Game.freedomMark ? Game.freedomMark(tile) : null;
    if (ff) {
      d.classList.add('ff-mark');
      if (ff.paid) d.classList.add('ff-paid');
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
      /* P52 · Grup A: Freedom Fighters BOSS varyantı da Figma dönüşüm assetini
         kullanıyor; onda da rozet çizilmez (bkz. yukarıdaki joker notu).
         Diğer boss işaretleri rozetlerini aynen korur. */
      if (bossMark.c !== 'bff') {
        const b = document.createElement('span');
        b.className = 'tile-mark boss';
        b.textContent = bossMark.i;
        d.appendChild(b);
      }
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
    /* P36 · Grup B — OKEY TAŞI KAYNAK ROZETİ TAŞIMAZ. Kağıt / Okey Mührü /
       Hidra okeyleri `copied` bayrağı taşıdığı için mor okey çerçevesinin
       üstüne mavi kesikli kontur + ⧉ basılıyor, taş normal okey gibi
       görünmüyordu. Okey her stage o stage'in okeyi olur; kökeni önemsizdir. */
    const srcMark = Game.isOkeyTile(tile) ? null
      : tile.stolen ? { c: 'stolen', i: '🕶', k: 'stolenTile' }
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
        const go = () => {
          markInRound();                   // raund içine girildi
          showScreen('game');
          flushRoundStart();               // raund başı olayları + pop-up'lar
          setTimeout(kumarStartPanels, 1500);  // P61 — Rulet rengi + yan bahis (eli görerek; bahis bandı geçtikten sonra)
        };
        /* P58 · Kumarhane — KÖR BAHİS: el görülmeden, oyun ekranına geçmeden önce */
        if (Game.needsBet && Game.needsBet()) showBetPicker(go);
        else go();
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
      /* P65 rötuş — uzun boss adları (TERZİ'NİN İĞNESİ) şeridin dışına
         taşıyordu: yazı şeride sığana kadar küçülür. */
      fitText(pill, 24, 13);

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
  /* Tur noktası dizisinin en geniş hâli = 5 Figma kutusu (5×40 + 4×10). */
  const TURN_DOTS_W = 240;

  function emphNums(html, key) {
    const out = String(html ?? '')
      .split(/(<[^>]*>)/)
      .map((seg, i) => (i % 2 ? seg : seg.replace(TIP_NUM_RX, '<b class="tip-num">$1</b>')))
      .join('');
    return key === 'godzilla' ? out.replace(GODZILLA_LV_RX, '$1S$2$3') : out;
  }

  /* P52 · GRUP I (kullanıcı isteği 2026-09-17) — BİRİKİM YAPAN JOKERİN ANLIK DEĞERİ.
     Katalizör/Zincir/Yankee gibi kartların açıklaması yalnız KURALI söylüyordu;
     oyuncu o an ne kadar biriktiğini hiçbir yerde göremiyordu. İpucu kutusunun
     sağ altında "Şu an: …" satırı çizilir. Değer kartın KENDİ kaydından okunur
     (füzyon/Vasiyet alt kayıtları dahil, bkz. Game._recsOf), birikimi olmayan
     kartta satır hiç çizilmez. */
  function accumNow(j) {
    const s = Game.state;
    if (!s || j.id == null) return '';
    const recs = (Game._recsOf ? Game._recsOf(j) : [j]) || [j];
    const deck = (s.deckJokers || []);
    const rec = (k) => recs.find((r) => r.key === k) || deck.find((r) => r.key === k && recs.some((x) => x.key === k));
    const x = (v) => '+' + Number(v).toFixed(2).replace(/\.?0+$/, '') + 'x';
    const out = [];
    const num = (v) => Number(v) || 0;
    const add = (k, fn) => { const r = recs.find((q) => q.key === k) || (deck.find((q) => q.key === k && recs.some((z) => z.key === k))); if (r) { const v = fn(r); if (v) out.push(v); } };
    add('katalizor', (r) => (num(r.katalizorMult) ? x(r.katalizorMult) : null));
    add('zincir', (r) => (num(r.zincirMult) ? x(r.zincirMult) : null));
    add('yankee', (r) => (num(r.yankeeMult) ? x(r.yankeeMult) : null));
    add('kirby', (r) => (num(r.kirbyMult) ? x(r.kirbyMult) : null));
    add('ahtapot', (r) => (num(r.arms) ? t('tipNowArms', r.arms) : null));
    add('misunderstood', (r) => (r.awakened && num(r.awakenMult) ? x(r.awakenMult) : null));
    add('tradeJokeri', (r) => {
      const sh = r.borsaShares || {};
      const n = num(sh.per) + num(sh.sirali) + num(sh.cift);
      return n ? t('tipNowShares', n) : null;
    });
    if (recs.some((r) => r.key === 'sisyphus')) {
      const n = num(s.sisyphusStreak);
      const steps = window.SISYPHUS_STEPS || [2, 4, 8];
      if (n > 0) out.push(x(steps[Math.min(n, steps.length) - 1]));
    }
    if (recs.some((r) => r.key === 'terazi') && num(s.teraziRoundMult)) out.push(x(s.teraziRoundMult));
    if (recs.some((r) => r.key === 'vampir') && num(s.vampirBank)) out.push(t('tipNowDrain', num(s.vampirBank)));
    if (recs.some((r) => r.key === 'godzilla') && num(s.godzillaLevel)) out.push('S' + num(s.godzillaLevel));
    // P54 · Grup B / P57 — Öteki Dünya: geride bekleyen el + ay evresi
    if (recs.some((r) => r.key === 'otekiDunya') && Game.otekiState) {
      const o = Game.otekiState();   // P59 · Ay Takvimi
      out.push(t('tipNowWell', o.count, o.max, o.moon, t('moonName' + o.phase)));
    }
    /* P54 · Bölüm 1 · Madde 1 — birikim artık kartın İÇİNDE, kendi şeridinde:
       sola etiket, sağa değer; kenar boşlukları açıklama satırlarıyla aynı.
       (P52'de metin kutunun sağ kenarına yapışık, küçük bir satırdı.) */
    return out.length
      ? `<div class="tip-now"><span class="tn-k">${t('tipNowK')}</span><span class="tn-v">${out.join(' · ')}</span></div>`
      : '';
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
    /* P57 (kullanıcı isteği) — şirkete dönüşmüş Corporates kartı YALNIZ o
       şirketi anlatır: başlık şirketin adı, açıklama görev + ödül + ceza. */
    const corpNow = liveCorp(j);
    const headTxt = corpNow ? T.ev(corpNow.name) : (j.key ? T.name(j) : j.name);
    const descTxt = corpNow ? t('corpTipDesc', T.ev(corpNow.text), T.ev(corpNow.rewardText), T.ev(corpNow.penaltyText))
      : (j.key ? T.desc(j) : T.ev(j.desc));
    tip.innerHTML =
      `<div class="tip-in">` +
      `<div class="tip-head">${headTxt}</div>` + rarityLine +
      `<div class="tip-desc">${emphNums(descTxt, j.key)}</div>` +
      fusedLines + legacyLines + variantLines + usesLine + accumNow(j) +
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
    /* P38b/P41 — kartın eylem rozeti (#actBadge) kartın yanına taşar;
       tooltip kartın değil ROZETİN kenarından açılır ki "Kullan: Sol Tık"
       yazısının üstüne binmesin. */
    const hr = actBadgeFor === target && !actBadge.classList.contains('hidden')
      ? actBadge.getBoundingClientRect() : null;
    const rightEdge = hr ? Math.max(r.right, hr.right) : r.right;
    const leftEdge = hr ? Math.min(r.left, hr.left) : r.left;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = rightEdge + 10;
    if (x + tw > window.innerWidth - 8) x = leftEdge - tw - 10;
    x = Math.max(8, x);
    let y = r.top + r.height / 2 - th / 2;
    y = Math.max(8, Math.min(y, window.innerHeight - th - 8));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  /* P41 (kullanıcı isteği 2026-09-14) — ÜSTÜNE GELİNCE EYLEM ROZETİ.
     Balatro "Sell: $1" kalıbı: kartı saran yeşil çizgili pano; her eylem
     için fare ikonu + beyaz etiket + altın tuş ("Kullan: Sol Tık",
     "Sat +2: Sağ Tık"). Sol tık = kullan (değnek, elle kullanılan joker),
     sağ tık = sat (yalnız store açıkken — kullanıcı kararı).
     KÖK NEDEN (P38b/P40 hatası): rozet kartın İÇİNDEYDİ, kartın kapları onu
     kesiyordu — omuzda ıstakanın z sırası, store'da kaydırmalı kenar çubuğu
     (overflow-y:auto yatay taşmayı da kırpar, kaydırma çubuğu çıkar). Her
     yeni kap için istisna yazmak yerine rozet <body>'de TEK sabit elemandır;
     konumu kartın ekran dikdörtgeninden hesaplanır. Yeşil zemin kart
     dikdörtgeni boş bırakılarak şeritler hâlinde boyanır, kart o delikten
     görünür; rozet pointer-events:none, tıklar gerçek karta düşer. */
  const actBadge = document.createElement('div');
  actBadge.id = 'actBadge';
  actBadge.className = 'hidden';
  actBadge.setAttribute('aria-hidden', 'true');
  document.body.appendChild(actBadge);
  let actBadgeFor = null;
  window.addEventListener('scroll', () => hideActBadge(), true);

  function hideActBadge() {
    actBadgeFor = null;
    actBadge.classList.add('hidden');
  }

  function placeActBadge(card) {
    /* P45 (kullanıcı raporu 2026-09-14: "store'da da raund içindeki gibi
       görünmeli") — KÖK NEDEN: rozet KART KUTUSUNU ölçüyordu. Omuzda kutu ile
       değnek çizimi aynı boydadır (81×110), store kenar çubuğunda ise kutu ızgara
       hücresi kadar geniştir (100×81) ve çizim içinde 60×81 durur: çerçeve
       çizimi sarmıyor, delik yanlış şekilde, yazı büyük çıkıyordu. Artık ÇİZİM
       ölçülür; çizimi olmayan kartta (joker) kartın kendisi. */
    const ref = card.querySelector('.cs-art') || card;
    const r = ref.getBoundingClientRect();
    if (!r.width) { hideActBadge(); return; }
    const W = r.width, H = r.height;
    /* P44 (kullanıcı çizimi 2026-09-14) — ROZET KARTIN ŞEKLİNİ İZLER.
       Dikdörtgen kutu yerine kartın kendi köşe pahını büyüten SEKİZGEN çerçeve;
       kart delikten görünür ve delik de kartın şeklindedir (değnek çiziminin
       sekizgeni 81×110'da 20×21 pah; joker kartı düz dikdörtgen). Şekil CSS
       kutusuyla çizilemediği için satır içi SVG: dış sekizgen = çerçeve
       (--gm-light), bir çerçeve kalınlığı içeride pano (--gm-dark) + çizgi
       deseni; iki yolda da kart deliği evenodd ile boş bırakılır. */
    /* P44b (kullanıcı çizimi, ikinci düzeltme): çerçeve kartı SIKI sarar —
       kartla çerçeve arasında yalnız ince bir pano payı kalır, çerçevenin pahı
       kartın kendi pahıyla PARALEL ilerler (ilk sürümde geniş boşluk ve daha
       büyük, kartla hizasız bir pah vardı). */
    const b = Math.max(3, Math.round(W * .035));    // çerçeve kalınlığı
    const g = Math.max(1.5, W * .02);               // çerçeve iç kenarı → kart payı
    const px = b + g, py = b + g;                   // dış kenar → kart
    const st = actBadge.style;
    st.fontSize = (W * .17) + 'px';
    /* Yazı panelinin genişliği İÇERİKTEN ölçülür: store kenar çubuğundaki
       joker kutusu neredeyse kare (65 × 64) ve sabit "kartın 2.7 katı"
       genişlikte "Sağ Tık" panodan taşıyordu. Panel en az kartın 1.6 katı. */
    const body = actBadge.querySelector('.ab-body');
    if (body) { body.style.left = '0px'; body.style.width = 'max-content'; }
    const cw = body ? body.getBoundingClientRect().width : 0;
    const sw = Math.max(W * 1.6, cw + W * .17 + 8);
    const bw = W + px + sw, bh = H + py * 2;
    // sağ kenara taşacaksa ayna: kart panonun SAĞINDA, yazı solunda
    const flip = r.left - px + bw > window.innerWidth - 4;
    const hx = flip ? bw - px - W : px;             // kart deliğinin rozet içindeki x'i
    const sx = flip ? 0 : hx + W;                   // yazı panelinin x'i
    st.left = (r.left - hx) + 'px';
    st.top = (r.top - py) + 'px';
    st.width = bw + 'px';
    st.height = bh + 'px';
    const wand = card.classList.contains('consum-card');
    const kx = wand ? W * 20 / 81 : 0, ky = wand ? H * 21 / 110 : 0;   // kartın kendi pahı
    /* Dış pah = kartın pahı, kart ile dış kenar arasındaki mesafe kadar dışa
       ötelenmiş (45°'lik bir kenarı d kadar ötelemek pahı d·tan22.5° ≈ 0.414·d
       uzatır). Dikdörtgen joker kartında köşeyi kesmeyecek küçük bir pah. */
    const cox = wand ? kx + px * .414 : px * 2, coy = wand ? ky + py * .414 : py * 2;
    const cix = Math.max(0, cox - b * .414), ciy = Math.max(0, coy - b * .414);
    const f = (n) => Math.round(n * 100) / 100;
    const oct = (x, y, w, h, cx, cy) =>
      `M${f(x + cx)} ${f(y)}H${f(x + w - cx)}L${f(x + w)} ${f(y + cy)}V${f(y + h - cy)}` +
      `L${f(x + w - cx)} ${f(y + h)}H${f(x + cx)}L${f(x)} ${f(y + h - cy)}V${f(y + cy)}Z`;
    const hole = oct(hx, py, W, H, kx, ky);
    const svg = actBadge.querySelector('.ab-bg');
    if (svg) {
      svg.setAttribute('width', f(bw));
      svg.setAttribute('height', f(bh));
      svg.setAttribute('viewBox', `0 0 ${f(bw)} ${f(bh)}`);
      const inner = oct(b, b, bw - 2 * b, bh - 2 * b, cix, ciy) + hole;
      svg.innerHTML =
        '<defs><pattern id="abStripe" width="5" height="5" patternUnits="userSpaceOnUse">' +
        '<rect class="ab-s" width="5" height="2"/></pattern></defs>' +
        `<path class="ab-o" fill-rule="evenodd" d="${oct(0, 0, bw, bh, cox, coy) + hole}"/>` +
        `<path class="ab-p" fill-rule="evenodd" d="${inner}"/>` +
        `<path fill="url(#abStripe)" fill-rule="evenodd" d="${inner}"/>`;
    }
    if (body) {
      body.style.left = (flip ? b + W * .05 : sx + W * .06) + 'px';
      body.style.width = '';
    }
  }

  function showActBadge(card, a) {
    if (!a || (!a.left && !a.right)) { hideActBadge(); return; }
    const row = (x, side) => !x ? '' :
      `<div class="ab-row"><i class="ab-ico ab-${side}"></i>` +
      `<span class="ab-txt"><b>${x.lbl}</b><em>${t(side === 'left' ? 'abLeft' : 'abRight')}</em></span></div>`;
    actBadge.innerHTML = '<svg class="ab-bg" aria-hidden="true"></svg>' +
      `<div class="ab-body">${row(a.left, 'left')}${row(a.right, 'right')}</div>`;
    actBadgeFor = card;
    actBadge.classList.remove('hidden');   // önce görünür: placeActBadge içeriği ölçer
    placeActBadge(card);
  }

  /* Karta sol/sağ tık eylemlerini bağlar. `getActs()` her olayda yeniden
     okunur (store açık mı, damga basılı mı… anlık durum). attachTip'ten
     ÖNCE çağrılmalı: tooltip rozetin kenarından açılmak için rozeti okur.
     P58 (kullanıcı isteği 2026-10-02): haritadaki joker paneli artık EYLEMLİ —
     sağ tık satış, sol tık Füzyon. Raund içi eylemler (Damga, Satranç Saati,
     Öteki Dünya…) jokerActs'te oyun ekranına kilitlidir: haritadayken
     sonraki raund kurulmuş ve status 'playing' olsa da oyuncu henüz raundda değil. */
  function attachActs(card, getActs) {
    const acts = () => getActs();
    card.addEventListener('mouseenter', () => showActBadge(card, acts()));
    card.addEventListener('mouseleave', () => { if (actBadgeFor === card) hideActBadge(); });
    card.addEventListener('transitionend', () => { if (actBadgeFor === card) placeActBadge(card); });
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;           // kartın kendi düğmeleri (Damga, →Ana)
      if (card.dataset.dragged) { delete card.dataset.dragged; return; }
      const a = acts().left;
      if (!a) return;
      hideTip();
      a.fn();
    });
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const a = acts().right;
      if (!a) return;
      hideTip();
      a.fn();
    });
  }

  function hideTip() {
    clearTimeout(tipHideTimer);
    tip.classList.add('hidden');
    hideActBadge();
  }

  function attachTip(elm, j, opts = {}) {
    elm.addEventListener('mouseenter', () => showTip(elm, j, opts));
    elm.addEventListener('mouseleave', () => {
      // eylemli tooltip'e fare geçebilsin diye kısa gecikmeyle kapat
      clearTimeout(tipHideTimer);
      tipHideTimer = setTimeout(() => tip.classList.add('hidden'), tip.classList.contains('interactive') ? 260 : 0);
    });
  }

  /* P58 · Grup B — kırılma efekti (shatterEl) kaldırıldı; bkz. style.css. */

  /* ---------- Grup G (2026-08): görsel-odaklı kart dili ----------
     Kartlar artık büyük ikon + kısa vurgu çipleri + rozetlerle okunur;
     uzun açıklama tooltip'te kalır. */

  // 95 joker için ikon haritası (kartın görsel alanı)
  const JOKER_ICONS = {
    /* P61 · Kumarhane jokerleri (Figma çizimi gelene kadar emoji) */
    krupiye: '🎩', sansliZar: '🎲', kartSayici: '🃏', fisUstasi: '🪙',
    rulet: '🎡', hileliZar: '🎰', martingale: '📈',
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
    vasiyet: '📜', satrancSaati: '♟', truva: '🐴', atesTuccari: '🔥', rusvet: '💰', hidra: '🐉',
    frankenstein: '🧟‍♂️',
    /* mythic */
    seytan: '😈', pinkyWarrior: '🩷', kiyamet: '☄️', tanrininEli: '🤲', ejderha: '🐉',
    karaDelik: '🕳️', nostradamus: '🔮', yasakElma: '🍎',
    kagit: '📃',
    /* epic */
    kirby: '🌸', cellat: '🪓', dervish: '🌀', misunderstood: '🎭', zombie: '🧟',
    uzayli: '👽', ahtapot: '🐙', ucKagitci: '🃏', otekiDunya: '🌗', terziIgne: '📍', freedom: '🗽',
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

  /* P41 — joker eylemleri. Sat: store açıkken, satış kilidi yoksa.
     Kullan: yalnız ELLE kullanılan jokerlerde ve kartın düğmesi/aksiyon
     barındaki düğmesiyle AYNI yoldan (aynı fonksiyon, aynı motor kapısı).
     Füzyon her raftan ve her an birleşir (P26 · E2); diğerleri ana slotta,
     raund oynanırken ve o anki aşamada kullanılabiliyorsa. */
  function sellJokerNow(j) {
    const res = Game.sellJoker(j.id);
    if (!res.ok) { toast(res.error || t('sellFail')); return; }
    toast(t('sellToast', T.name(res), res.gain), true); SFX.coin(); renderStore(); render();
    if (curScreen() === 'map') { hideActBadge(); renderMap(); }   // P58: haritadan satış
  }

  function useDamga() {
    const res = Game.toggleDamga();
    if (!res.ok) { toast(res.error); return; }
    toast(res.armed ? t('damgaArmed') : t('damgaDisarmed'), res.armed);
    render();
  }

  /* P54 · Grup C — Satranç Saati: kartın sol tıkı saati bu tur için durdurur. */
  function useClockCard() {
    const res = Game.clockPause();
    if (!res.ok) { toast(T.ev(res.error)); return; }
    toast(T.ev(res.note), true);
    render();
  }

  /* P45 (kullanıcı isteği 2026-09-14) — BACKUP'TAKİ JOKER SOL TIKLA ANA SLOTA.
     Kartın köşesindeki "Ana Slota Al" düğmesinin ve store tooltip'indeki
     "→ Ana" eyleminin işi; ikisi de kaldırıldı (DAMGALA / Sat / Takas ile aynı
     kural: karttaki eylem rozetten yapılır, ikinci kopya tutulmaz). */
  function moveBackupToMain(j) {
    const res = Game.moveToMain(j.id);
    if (!res.ok) { toast(res.error || t('moveFail')); return; }
    toast(t('movedMain', T.name(j)), true);
    // Grup G: raund içinde ana slota geçen joker ANINDA kurulur;
    // kurulum bildirimleri (masa kuruldu, trans sayısı…) gösterilir
    if (res.notes && res.notes.length) notify(res.notes);
    render();
    if (storeOpen()) renderStore();
  }

  function jokerActs(j, opts = {}) {
    const s = Game.state;
    const has = (k) => j.key === k || (j.fused || []).some(f => f.key === k);
    let left = null;
    if (has('fuzyon')) left = { lbl: t('abUse'), fn: () => pickFuzyon(j.id) };
    else if (opts.backup) left = { lbl: t('abToMain'), fn: () => moveBackupToMain(j) };
    else if (!opts.backup && s && s.status === 'playing' && !storeOpen() && curScreen() === 'game') {
      /* P58 (kullanıcı raporu 2026-10-02) — FÜZYONLU KARTTA ELLE KULLANILAN
         EFEKTLER ÇAKIŞIYORDU: Damga + Öteki Dünya birleşince sol tık yalnız
         ilk eşleşeni (Damga) çalıştırıyordu, Öteki Dünya'ya ulaşılamıyordu.
         Artık kullanılabilir TÜM efektler toplanır: tek efekt doğrudan çalışır,
         birden fazlaysa sol tık bir seçim penceresi açar (showUseChooser). */
      const list = [];
      const add = (key, lbl, fn) => list.push({ key, lbl, fn });
      const dm = has('ayna') && Game.damgaState && Game.damgaState();
      if (dm && dm.id === j.id && !dm.used) add('ayna', t(dm.armed ? 'abUndo' : 'abUse'), useDamga);
      if (has('satrancSaati') && Game.clockState && Game.clockState().canUse) add('satrancSaati', t('abUse'), useClockCard);
      if (has('rusvet') && Game.canRusvet && Game.canRusvet()) add('rusvet', t('abUse'), doRusvet);
      if (has('terazi') && Game.canTeraziSacrifice && Game.canTeraziSacrifice()) add('terazi', t('abUse'), doTerazi);
      if (has('paratoner') && Game.canParatonerBait && Game.canParatonerBait())
        add('paratoner', t(s.paratonerBait != null ? 'abUndo' : 'abUse'), doParatoner);
      if (list.length === 1) left = { lbl: list[0].lbl, fn: list[0].fn };
      else if (list.length > 1) left = { lbl: t('abChoose'), fn: () => showUseChooser(j, list) };
    }
    /* P46 (kullanıcı isteği 2026-09-14): jokerler RAUND İÇİNDE de sağ tıkla
       satılır (P41'de satış yalnız store'daydı). Değnek satışı store'da kalır —
       istek jokerler içindi. P58: harita panelinde de satılır (attachActs). */
    const right = !j.noSell && j.id != null
      ? { lbl: t('abSell', sellPrice(j.rarity, j.key)), fn: () => sellJokerNow(j) } : null;
    return { left, right };
  }

  /* P58 (kullanıcı isteği 2026-10-02) — tooltip eylem düğmeleri tamamen
     KALKTI. Son kalan "⚗ Birleştir" de gereksizdi: Füzyon kartı her raftan,
     haritada da, SOL TIKLA kullanılıyor (jokerActs → pickFuzyon). Sat/Takas
     P43'te, →Ana P45'te zaten kalkmıştı. İmza çağıranlar için korunur. */
  function jokerActions() {
    return () => [];
  }

  /* ============================================================
     P59 · ÖTEKİ DÜNYA — AY KUYUSU paneli (sol sütun, boss kutusunun altı).
     Takas: elinden bir taş seç, sonra kuyudan bir Ay Taşına tıkla.
     ============================================================ */
  function renderWell() {
    const box = document.getElementById('ayWell');
    if (!box) return;
    const s = Game.state;
    const o = s && s.status === 'playing' && Game.otekiState ? Game.otekiState() : null;
    const show = !!(o && o.id != null);
    box.classList.toggle('hidden', !show);
    if (!show) return;
    if (!Hints.seen('ayKuyusu')) setTimeout(() => Hints.show('ayKuyusu'), 200);   // P60
    box.innerHTML =
      `<div class="aw-head"><span class="aw-title">🌙 ${t('wellTitle')}</span>`
      + `<span class="aw-count">${o.count}/${o.max}</span></div>`
      + `<div class="aw-phase"><b>${o.moon} ${t('moonName' + o.phase)}</b> · ${t('moonEffect' + o.phase)}</div>`
      + `<div class="aw-slots"></div>`
      + `<div class="aw-hint">${o.canSwap ? t('wellHint') : T.ev(o.reason || '')}</div>`;
    const slots = box.querySelector('.aw-slots');
    const list = s.otekiHand || [];
    for (let i = 0; i < o.max; i++) {
      const tl = list[i];
      if (!tl) { const e = document.createElement('div'); e.className = 'aw-empty'; slots.appendChild(e); continue; }
      const te = tileEl(tl, false);
      te.classList.add('aw-tile');
      if (o.canSwap) te.classList.add('aw-can');
      te.addEventListener('click', () => {
        const sel = [...selection];
        if (sel.length !== 1) { toast(t('wellPickOne')); return; }
        const r = Game.ayTakas(sel[0], tl.id);
        if (!r.ok) { toast(T.ev(r.error)); return; }
        selection.clear();
        SFX.coin();
        toast(T.ev(r.note), true);
        render();
      });
      slots.appendChild(te);
    }
  }

  /* P58 — füzyonlu kartta birden fazla elle kullanılan efekt: hangisi? */
  function showUseChooser(j, list) {
    document.getElementById('useChooser')?.remove();
    hideTip(); hideActBadge();
    /* Paket/bahis seçimiyle AYNI piksel kalıbı (pk-ov · pk-box · pk-card).
       İlk sürüm .tp-box kullanıyordu; o kalıbın stilleri yalnız #tutResume'a
       bağlı olduğu için pencere stilsiz, ekranın köşelerine dağılmış çiziliyordu
       (kullanıcı ekran görüntüsü 2026-10-02). */
    const ov = document.createElement('div');
    ov.id = 'useChooser';
    ov.className = 'pk-ov tone-violet';
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">⚗ ${T.name(j)}</div>` +
      `<div class="pk-sub-title">${t('useChooseBody')}</div>` +
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><button class="btn ghost" id="ucCancel">${t('backBtn')}</button></div></div>`;
    const row = ov.querySelector('.pk-body');
    for (const x of list) {
      const b = document.createElement('button');
      b.className = 'pk-card uc-opt';
      b.dataset.key = x.key;
      const d = JOKER_DEFS[x.key];
      b.innerHTML = `<div class="pk-ico">${jokerIcon(x.key)}</div>`
        + `<div class="pk-name">${T.name({ key: x.key, name: d ? d.name : x.key })}</div>`
        + `<div class="pk-sub">${String(x.lbl).replace(/:\s*$/, '')}</div>`   // rozet etiketi "Kullan:" → "Kullan"
        + `<div class="pk-desc">${d ? T.desc({ key: x.key, desc: d.desc }) : ''}</div>`;
      b.addEventListener('click', () => { ov.remove(); x.fn(); });
      row.appendChild(b);
    }
    ov.querySelector('#ucCancel').addEventListener('click', () => ov.remove());
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
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
    // P49 · Grup A — uyanmış The Misunderstood Figma V2 çizimine geçer
    if (j.key === 'misunderstood' && j.awakened) tile2.classList.add('misu-v2');
    /* P54 · Grup F — Tüccar'ın iki çizimi (Figma 380:896 / 380:906): slotta
       beklerken V1, ekranda açık bir takas teklifi varken V2. Teklif
       kabul/ret edilince `tuccarOffer` boşalır ve kart V1'e döner. */
    if (j.key === 'tuccar' && !opts.backup && Game.state.tuccarOffer
        && !Game.state.tuccarOffer.boss) tile2.classList.add('tuccar-v2');
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
    /* P48 — SISYPHUS KAYASI KARTTA: kaya raundlar arası taşındığı için oyuncu
       yüksekliğini görmeli (Godzilla şarj rozetiyle aynı kalıp). Sayı = üst üste
       açılımlı tur; sıradaki açılım o basamağın çarpanını alır. */
    if (!opts.backup && (j.key === 'sisyphus' || (j.fused || []).some(f => f.key === 'sisyphus'))) {
      const n = Game.state.sisyphusStreak || 0;
      const steps = SISYPHUS_STEPS;   // engine.js üst düzey sabiti (klasik betikler ortak kapsamda)
      const b = document.createElement('span');
      b.className = 'jt-charge' + (n > 0 ? ' on' : '');
      b.textContent = `🪨${n}`;
      b.title = n > 0 ? t('sisyphusBadge', n, steps[Math.min(n, steps.length) - 1].toFixed(1)) : t('sisyphusBadgeZero');
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
    /* P54 · Grup C — SATRANÇ SAATİ: kalan saniye kartta canlı durur (♟N).
       Saat saniyede bir `tickClock` ile güncellenir; render beklenmez. */
    if (!opts.backup && (j.key === 'satrancSaati' || (j.fused || []).some(f => f.key === 'satrancSaati'))
        && Game.state.status === 'playing') {
      const b = document.createElement('span');
      b.className = 'jt-charge jt-clock on' + (Game.state.clockFrozen ? ' frozen' : '');
      b.textContent = `♟${Game.state.clockLeft ?? CLOCK_SECONDS}`;
      b.title = t('clockBadge', Game.clockMult ? Game.clockMult().toFixed(1) : '0');
      tile2.appendChild(b);
    }
    /* P54 · Grup B — ÖTEKİ DÜNYA'DA BEKLEYEN EL kartta canlı durur (🌗N).
       Vasiyet / Godzilla rozetiyle aynı kalıp. */
    if (!opts.backup && (j.key === 'otekiDunya' || (j.fused || []).some(f => f.key === 'otekiDunya'))
        && Game.state.status === 'playing') {
      /* P57 — rozet ay evresini ve öbür eldeki taş sayısını gösterir;
         öteki dünyadayken mor yanar, Kavuşma'dan sonra 🌕✓ */
      /* P59 · Ay Takvimi — rozet: ay evresi + kuyudaki taş sayısı. Figma
         394:507 V2 çizimi (180° dönük kart) artık DOLUNAY turunda görünür. */
      const o = Game.otekiState ? Game.otekiState() : null;
      const n = (Game.state.otekiHand || []).length;
      const b = document.createElement('span');
      b.className = 'jt-charge' + (n ? ' on' : '');
      if (j.key === 'otekiDunya') tile2.classList.toggle('oteki-flip', !!(o && o.phase === 2));
      b.textContent = `${o ? o.moon : '🌙'}${n}`;
      b.title = o ? t('tipNowWell', n, o.max, o.moon, t('moonName' + o.phase)) : '';
      tile2.appendChild(b);
    }
    /* P57 (kullanıcı isteği) — THE CORPORATES ŞİRKETİNE DÖNÜŞÜR: raundun
       şirketi belli olunca kart o şirketin Figma çizimine geçer
       (279:9897 → The_Corporates_Kurogane/Abyssal/Heliox/Verdatek). */
    if (j.key === 'corporates') {
      const c = liveCorp(j);
      for (const k of ['kizil', 'derin', 'altin', 'yesil']) tile2.classList.toggle('corp-' + k, !!c && c.key === k);
    }
    /* P43 (kullanıcı isteği 2026-09-14) — DAMGALA / İPOTEK DÜĞMELERİ KALKTI.
       Elle kullanılan jokerler P41'den beri kartın üstüne gelip SOL TIKLA
       kullanılıyor (jokerActs → useDamga / useIpotekCard); kartın köşesindeki
       hap düğme aynı işin ikinci kopyasıydı. Durum bilgisi yerinde kalır:
       Damga basılıyken rozet "Kaldır:" der ve hesap kutusu altın 2 katı
       gösterir; İpotek'in borç hâli tooltip'in ipotekLine satırında yazar. */
    // P45: backup kartındaki "Ana Slota Al" düğmesi kalktı — sol tık (jokerActs → moveBackupToMain)
    attachActs(tile2, () => jokerActs(j, opts));   // P41: sol tık kullan / sağ tık sat
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
          card.dataset.dragged = '1';   // P41: bırakınca gelen click "kullan" sayılmasın
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
    /* P65 — taslaktaki piksel asma kilit (açık/kapalı), tema vurgusuyla boyanır */
    b.innerHTML = '<span class="lk-ico" aria-hidden="true"></span>';
    b.title = locked ? t('lockOn') : t('lockOff');
    b.addEventListener('click', onToggle);
    return b;
  }

  /* ---------- Ses (GDD 14.5) — WebAudio mini synth ---------- */

  let sfxOn = localStorage.getItem('okeySfx') !== '0';
  /* P67 — efekt sesi ayarlarda (aç/kapa + seviye); duraklat menüsündeki
     "Ses" düğmesi kaldırıldı. Seviye %100 = eski ses düzeyi. */
  let sfxVol = parseInt(localStorage.getItem('okeySfxVol'), 10);
  if (isNaN(sfxVol)) sfxVol = 100;
  let actx = null;

  function beep(freq, dur = 0.08, type = 'triangle', vol = 0.1, when = 0) {
    if (!sfxOn || sfxVol <= 0) return;
    vol *= sfxVol / 100;
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
    /* P61 · Kumarhane — fiş şıkırtısı ve zar */
    chips: () => { for (let i = 0; i < 5; i++) beep(1800 + (i % 2) * 400, .03, 'square', .05, i * .045); },
    dice: () => { for (let i = 0; i < 7; i++) beep(300 + Math.random() * 500, .03, 'square', .07, i * .06); beep(180, .12, 'triangle', .1, .45); },
  };

  /* ---------- Müzik (P66) — döngülü fon müziği ----------
     Parça ekrana göre seçilir: menü, harita ve oyun → seçili TEMA (Müzik
     1/2/3, ayarlardan), boss raundu → o BOSS'un kendi müziği (b_<key>;
     yoksa temanın boss sürümü boss1/2/3), store/yükseltme → temanın store'u.
     Menü → harita → oyun arasında tema kesilmeden sürer. Değişimde ~1 sn
     çapraz geçiş.
     Gerçek kayıt gelene kadar her parça burada WebAudio ile çalınan GEÇİCİ
     bir döngüdür (Hicaz makamı, bağlama/ney/darbuka taklidi). Kayıt gelince
     MUSIC_FILES'a dosya yolunu yazmak yeter (ör. 'assets/music/tema-1.mp3'):
     dosyalı parça <audio loop> ile çalar, o parçanın sentezi devreden çıkar.
     Tarayıcılar sesi ilk tıklamaya kadar açmaz → müzik ilk dokunuşta başlar. */
  const MUSIC_FILES = { tema1: null, tema2: null, tema3: null, bossGenel: null,
    store1: null, store2: null, store3: null };   // boss'a özel parçalar: 'b_' + boss.key   // boss'a özel parçalar: 'b_' + boss.key

  const Music = (() => {
    const VOL_KEY = 'okeyMusicVol', ON_KEY = 'okeyMusicOn';
    const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* kozmetik */ } };
    let vol = parseInt(lsGet(VOL_KEY), 10);
    if (isNaN(vol)) vol = 50;
    let on = lsGet(ON_KEY) !== '0';
    /* P66b/c/P67e — tema seçimi: 1 = Hicaz ney (100 bpm, kullanıcının beğendiği),
       2 = G majör ney (96), 3 = D minör klarnet (104) — hepsi aynı sakin-hareketli
       aileden. Arkadaş testinde karşılaştırılıyor; seçim run raporuna yazılır. */
    const SET_KEY = 'okeyMusicTheme';   // P67e: temalar değişti → eski seçim (okeyMusicSet) taşınmaz
    const SETS = [1, 2, 3];
    let set = SETS.includes(+lsGet(SET_KEY)) ? +lsGet(SET_KEY) : 1;
    let preview = null;             // ayarlarda seçeneğe basınca o parça dinletilir
    let master = null, noise = null, unlocked = false, cur = null;
    const level = () => (on ? Math.pow(Math.max(0, Math.min(100, vol)) / 100, 1.5) * 0.6 : 0);

    /* ── nota yazımı: "D5 - C5 . | A4" → olaylar. "-" önceki notayı uzatır,
       "." sus, "|" yalnız okunurluk için ölçü çizgisi, "D3+F#3" akor,
       "D2^" kökün beşlisi. */
    const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    function hz(n) {
      const m = /^([A-G])(b|#)?(\d)(\^?)$/.exec(n);
      if (!m) return 0;
      const midi = 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
      return 440 * Math.pow(2, (midi - 69) / 12) * (m[4] ? 1.5 : 1);
    }
    function seq(str) {
      const tok = str.replace(/\|/g, ' ').trim().split(/\s+/);
      const at = {}; let last = null;
      tok.forEach((x, i) => {
        if (x === '-') { if (last && last[0] + last[2] === i) last[2]++; return; }
        if (x === '.') { last = null; return; }
        last = [i, x.split('+').map(hz), 1];
        at[i] = last;
      });
      return { at, len: tok.length };
    }
    /* kalıp + kök listesi → ölçü ölçü dizi. R kök (2. oktav), O oktav üstü,
       F beşli; akor tablosundan A/B/C = akorun 1./2./3. sesi. */
    function gen(pat, roots, chords) {
      return roots.map(r => pat.split(/\s+/).map(x => {
        if (x === 'R') return r + '2';
        if (x === 'L') return r + '1';
        if (x === 'O') return r + '3';
        if (x === 'F') return r + '2^';
        if (x === 'P') return chords[r].join('+');
        if ('ABC'.includes(x) && x.length === 1) return chords[r]['ABC'.indexOf(x)];
        return x;
      }).join(' ')).join(' | ');
    }

    /* kanon / yankı: diziyi k adım geriden çal */
    const shift = (str, k) => {
      const bar = str.split('|')[0].trim().split(/\s+/).length;
      const t = str.replace(/\|/g, ' ').trim().split(/\s+/);
      const r = t.slice(-k).concat(t.slice(0, -k)), out = [];
      for (let i = 0; i < r.length; i += bar) out.push(r.slice(i, i + bar).join(' '));
      return out.join(' | ');
    };
    /* 8'lik yazımı 16'lık ızgaraya aç: her nota/sus iki adım sürer */
    const x2 = (str) => str.split('|').map(bar => bar.trim().split(/\s+/)
      .map(x => (x === '.' ? '. .' : x === '-' ? '- -' : x + ' -')).join(' ')).join(' | ');
    const T3 = ['D', 'G', 'C', 'D', 'C', 'G', 'Eb', 'D', 'D', 'G', 'C', 'D', 'C', 'G', 'Eb', 'D'];
    const T_B = ['G', 'C', 'D', 'G', 'G', 'D', 'A', 'D', 'G', 'C', 'G', 'C', 'C', 'A', 'D', 'G'];   // Müzik 2
    const T_C = ['D', 'D', 'G', 'A', 'F', 'C', 'D', 'F', 'Bb', 'C', 'D', 'A', 'Bb', 'G', 'A', 'D'];  // Müzik 3
    const B3 = ['D', 'C', 'D', 'G', 'D', 'Eb', 'C', 'D'];

    /* ── sazlar ── */
    const INST = {
      saz:  { type: 'sawtooth', vol: .09, a: .004, dec: .12, sus: .25, rel: .08, cut: 2600, sweep: true },
      ney:  { type: 'triangle', vol: .13, a: .07, dec: .4, sus: .8, rel: .25, vib: 5 },
      kanun:{ type: 'square', vol: .045, a: .003, dec: .09, sus: .3, rel: .06, cut: 3000, sweep: true },
      arp:  { type: 'triangle', vol: .05, a: .004, dec: .1, sus: .2, rel: .1 },
      bass: { type: 'triangle', vol: .16, a: .006, dec: .15, sus: .55, rel: .06 },
      dbass:{ type: 'sawtooth', vol: .09, a: .004, dec: .08, sus: .4, rel: .04, cut: 700 },
      brass:{ type: 'sawtooth', vol: .08, a: .03, dec: .2, sus: .7, rel: .1, cut: 1200 },
      pizz: { type: 'triangle', vol: .13, a: .002, dec: .08, sus: .05, rel: .05 },
      bell: { type: 'sine', vol: .09, a: .002, dec: .6, sus: .05, rel: .8 },
      theremin: { type: 'sine', vol: .1, a: .12, dec: .5, sus: .9, rel: .3, vib: 6, vd: .03 },
      wob:  { type: 'sine', vol: .12, a: .02, dec: .3, sus: .8, rel: .15, vib: 4, vd: .02 },
      chip: { type: 'square', vol: .045, a: .002, dec: .05, sus: .6, rel: .02 },
      harpsi: { type: 'sawtooth', vol: .05, a: .002, dec: .15, sus: .1, rel: .1, cut: 3500, sweep: true },
      organ:{ type: 'square', vol: .04, a: .01, dec: .3, sus: .8, rel: .08, cut: 1500 },
      violin: { type: 'sawtooth', vol: .06, a: .08, dec: .3, sus: .85, rel: .2, cut: 2200, vib: 5.5 },
      clar: { type: 'square', vol: .055, a: .02, dec: .2, sus: .8, rel: .08, cut: 1400, vib: 5 },
      /* P67e — daha dolgun sesler: uni = ikinci osilatör (cent) ile koro/kalınlık */
      sub:  { type: 'sine', vol: .26, a: .01, dec: .4, sus: .8, rel: .15 },
      cello:{ type: 'sawtooth', vol: .07, a: .06, dec: .3, sus: .8, rel: .15, cut: 900, vib: 5, vd: .006 },
      choir:{ type: 'sawtooth', vol: .024, a: .45, dec: 1, sus: .9, rel: .6, cut: 1300, uni: 9 },
      tbrass:{ type: 'sawtooth', vol: .07, a: .05, dec: .3, sus: .8, rel: .15, cut: 1100, uni: 7 },
      ud:   { type: 'sawtooth', vol: .08, a: .003, dec: .1, sus: .2, rel: .08, cut: 2200, sweep: true, uni: 6 },
      box:  { type: 'triangle', vol: .1, a: .002, dec: .35, sus: .1, rel: .5 },
      lead2:{ type: 'square', vol: .04, a: .002, dec: .04, sus: .7, rel: .01, cut: 4000 },
      accord:{ type: 'square', vol: .028, a: .01, dec: .2, sus: .7, rel: .05, cut: 1800, uni: 12 },
      echo: { type: 'triangle', vol: .05, a: .003, dec: .2, sus: .3, rel: .1 },
      drone:{ type: 'sawtooth', vol: .02, a: .4, dec: 1, sus: .9, rel: .6, cut: 520 },
      stab: { type: 'square', vol: .022, a: .003, dec: .05, sus: .15, rel: .04, cut: 2200 },
      pad:  { type: 'triangle', vol: .022, a: .35, dec: .8, sus: .8, rel: .5 },
      boss: { type: 'square', vol: .05, a: .006, dec: .2, sus: .55, rel: .1, cut: 1900 },
    };
    const HICAZ = { D: ['D3', 'F#3', 'A3'], G: ['G3', 'Bb3', 'D4'], C: ['C3', 'Eb3', 'G3'], Eb: ['Eb3', 'G3', 'Bb3'] };
    const MAJ = { G: ['G3', 'B3', 'D4'], D: ['D3', 'F#3', 'A3'], C: ['C3', 'E3', 'G3'], E: ['E3', 'G3', 'B3'], A: ['A3', 'C4', 'E4'] };
    const NAT  = { D: ['D3', 'F3', 'A3'], C: ['C3', 'E3', 'G3'], Bb: ['Bb2', 'D3', 'F3'], A: ['A2', 'C#3', 'E3'], G: ['G3', 'Bb3', 'D4'], Eb: ['Eb3', 'G3', 'Bb3'], F: ['F3', 'A3', 'C4'] };
    const AMIN = { A: ['A3', 'C4', 'E4'], C: ['C4', 'E4', 'G4'], E: ['E3', 'G#3', 'B3'], F: ['F3', 'A3', 'C4'], G: ['G3', 'B3', 'D4'], D: ['D3', 'F3', 'A3'] };
    const EMIN = { E: ['E3', 'G3', 'B3'], C: ['C3', 'E3', 'G3'], A: ['A3', 'C4', 'E4'], B: ['B2', 'D#3', 'F#3'] };
    const FMAJ = { F: ['F4', 'A4', 'C5'], C: ['E4', 'G4', 'C5'], Bb: ['D4', 'F4', 'Bb4'] };
    const DREAM = { C: ['C5', 'E5', 'G5'], D: ['D5', 'F#5', 'A5'], Bb: ['Bb4', 'D5', 'F5'], A: ['A4', 'C5', 'E5'] };
    const WT   = { C: ['C4', 'E4', 'G#4'], D: ['D4', 'F#4', 'A#4'] };
    const AHIC = { A: ['A4', 'C#5', 'E5'], Bb: ['Bb4', 'D5', 'F5'], D: ['D4', 'F4', 'A4'], G: ['G4', 'Bb4', 'D5'] };
    const EHIC = { E: ['E3', 'G#3', 'B3'], D: ['D3', 'F3', 'A3'], A: ['A3', 'C4', 'E4'] };
    /* Ayna Kral teması: 4 ölçü + aynı melodinin D etrafında ters çevrilmiş (ayna) hâli */
    const AYNA = 'D4 - F4 A4 D5 - - - | C#5 - E5 - A4 - - - | Bb4 - A4 G4 F4 - E4 - | D4 - - - A3 - - - | ' +
                 'D4 - Bb3 G3 D3 - - - | E3 - C3 - G3 - - - | F3 - G3 A3 Bb3 - C4 - | D4 - - - G4 - - -';

    const TRACKS = {
      /* P67e (kullanıcı: "Müzik 3'ü beğendim, diğer ikisini kaldır, bunun gibi
         sıkmayan varyasyonlar") — üç tema da aynı aileden: orta tempo, önde
         uzun nefesli melodi, altında 3-3-2 kıvrak bas + 8'lik arpej + hafif
         darbuka, 16 ölçülük (≈40 sn) döngü. */
      /* Tema · Müzik 1 — beğenilen parça (eski Müzik 3): D Hicaz, ney, 100 bpm */
      tema1: { bpm: 100, div: 4, dv: .5, parts: [
        { i: 'ney', s: x2('A4 - - Bb4 A4 - G4 A4 | Bb4 - A4 G4 F#4 - - . | G4 - A4 Bb4 C5 - Bb4 A4 | A4 - - - - - . . | ' +
                          'D5 - C5 D5 Eb5 - D5 C5 | Bb4 - A4 Bb4 C5 - - . | Bb4 A4 G4 F#4 G4 - Eb4 F#4 | D4 - - - - - . . | ' +
                          'F#4 - G4 A4 Bb4 - A4 G4 | A4 - - Bb4 C5 - Bb4 A4 | G4 - F#4 G4 A4 - Bb4 C5 | D5 - - - - - . . | ' +
                          'Eb5 - D5 C5 D5 - C5 Bb4 | C5 - Bb4 A4 Bb4 - A4 G4 | A4 - G4 F#4 Eb4 - F#4 G4 | D4 - - - - - . .') },
        { i: 'arp', s: x2(gen('A B C B A B C B', T3, HICAZ)) },
        { i: 'bass', s: gen('R . . O . . R . R . . O . . F .', T3, HICAZ) },
        { i: 'pad', s: gen('P - - - - - - - - - - - - - - -', T3, HICAZ) },
      ], drums: 'D..kT.k.D.kkT.k.' },
      /* Tema · Müzik 2 — aynı aileden, aydınlık: G majör (Rast havası), ney +
         kanun arpeji, 96 bpm; darbuka bir tık seyrek */
      tema2: { bpm: 96, div: 4, dv: .45, parts: [
        { i: 'ney', s: x2('D5 - - - B4 - C5 D5 | E5 - D5 - B4 - - - | A4 - - B4 C5 - B4 A4 | G4 - - - - - . . | ' +
                          'B4 - - C5 D5 - E5 - | F#5 - E5 - D5 - - - | C5 - B4 - A4 - B4 - | A4 - - - - - . . | ' +
                          'G4 - - A4 B4 - D5 - | C5 - - - B4 - A4 - | B4 - - - G4 - A4 B4 | C5 - - - - - . . | ' +
                          'E5 - - - D5 - C5 B4 | A4 - B4 - C5 - D5 - | B4 - A4 - F#4 - A4 - | G4 - - - - - . .') },
        { i: 'kanun', s: x2(gen('A B C B A B C B', T_B, MAJ)) },
        { i: 'bass', s: gen('R . . O . . R . R . . O . . F .', T_B, MAJ) },
        { i: 'pad', s: gen('P - - - - - - - - - - - - - - -', T_B, MAJ) },
      ], drums: 'D..k..T.D.k...T.' },
      /* Tema · Müzik 3 — aynı aileden, sıcak: D minör (Nihavend), yumuşak
         klarnet + pizzicato arpej, 104 bpm; bas 4+2+2 */
      tema3: { bpm: 104, div: 4, dv: .45, parts: [
        { i: 'clar', s: x2('A4 - - - D5 - C5 Bb4 | A4 - G4 - F4 - - - | G4 - - A4 Bb4 - A4 G4 | A4 - - - - - . . | ' +
                           'F4 - - G4 A4 - Bb4 - | C5 - Bb4 - A4 - G4 - | F4 - E4 - D4 - E4 - | F4 - - - - - . . | ' +
                           'D5 - - - C5 - Bb4 A4 | G4 - A4 - Bb4 - C5 - | D5 - - - E5 - F5 - | E5 - - - - - . . | ' +
                           'F5 - E5 - D5 - C5 - | Bb4 - A4 - G4 - A4 - | Bb4 - A4 - G4 - E4 - | D4 - - - - - . .') },
        { i: 'pizz', s: x2(gen('A B C B A B C B', T_C, NAT)) },
        { i: 'bass', s: gen('R . . . O . R . R . . . O . F .', T_C, NAT) },
        { i: 'pad', s: gen('P - - - - - - - - - - - - - - -', T_C, NAT) },
      ], drums: 'D...T.k.D.k.T.k.' },
      /* Boss · genel — müziği olmayan (yeni) bir boss için yedek: tekinsiz ney */
      bossGenel: { bpm: 108, div: 4, dv: .85, parts: [
        { i: 'ney', s: x2('D5 - - - - - Eb5 D5 | C5 - Bb4 - A4 - - - | Bb4 - - - A4 - G4 F#4 | G4 - - - - - . . | ' +
                          'A4 - - Bb4 A4 - G4 F#4 | Eb4 - - - F#4 - - - | G4 - A4 Bb4 C5 - Bb4 A4 | D4 - - - - - . .') },
        { i: 'dbass', s: gen('R . R . R . R . R . R . R . O .', B3, HICAZ) },
        { i: 'drone', s: gen('P - - - - - - - - - - - - - - -', B3, HICAZ) },
      ], drums: 'D.......T...k...' + 'D.....D.T...k.kk' },
      /* Store · Müzik 1 — tembel ney, 3-3-2 bas (temayla aynı aile) */
      store1: { bpm: 92, div: 4, dv: .4, parts: [
        { i: 'ney', s: x2('B4 - - - A4 G4 A4 - | D5 - - - B4 - - - | C5 - B4 A4 G4 - E4 - | D4 - - - - - - - | ' +
                          'G4 - A4 B4 D5 - B4 - | C5 - - - E5 - D5 - | B4 - A4 G4 A4 - B4 - | G4 - - - - - . .') },
        { i: 'arp', s: x2(gen('A B C B A B C B', ['G', 'D', 'C', 'D', 'G', 'C', 'D', 'G'], MAJ)) },
        { i: 'bass', s: gen('R . . O . . R . R . . O . . F .', ['G', 'D', 'C', 'D', 'G', 'C', 'D', 'G'], MAJ) },
      ], drums: 'D..kT.k.D.kkT.k.' },
      /* Store · Müzik 2 — çarşı havası, majör; kanun + "um-pa" bas */
      store2: { bpm: 100, div: 2, dv: .5, parts: [
        { i: 'kanun', s: 'G4 B4 D5 B4 C5 - B4 A4 | G4 - A4 B4 A4 - . . | E4 G4 A4 B4 C5 B4 A4 G4 | A4 - - - D4 - . . | ' +
                         'G4 B4 D5 B4 E5 - D5 C5 | B4 - C5 D5 C5 B4 A4 . | C5 B4 A4 G4 F#4 G4 A4 B4 | G4 - - - . . D4 .' },
        { i: 'bass', s: gen('R . F . O . F .', ['G', 'D', 'C', 'D', 'G', 'E', 'D', 'G'], MAJ) },
        { i: 'pad', s: gen('P - - - - - - -', ['G', 'D', 'C', 'D', 'G', 'E', 'D', 'G'], MAJ) },
      ], drums: 'D.TkDT.k' },
      /* Store · Müzik 3 — 16'lık kanun koşuları */
      store3: { bpm: 116, div: 4, dv: .55, parts: [
        { i: 'kanun', s: 'G4 B4 D5 G5 F#5 D5 B4 D5 E5 C5 A4 C5 D5 B4 G4 B4 | C5 E5 G5 E5 D5 F#5 A5 F#5 G5 - D5 - B4 - G4 - | ' +
                         'E5 G5 B5 G5 D5 G5 B5 G5 C5 E5 A5 E5 D5 F#5 A5 F#5 | G5 - - - D5 - B4 - G4 - - - . . . .' },
        { i: 'bass', s: gen('R . O . R . O . R . O . R . O .', ['G', 'C', 'E', 'G'], MAJ) },
        { i: 'stab', s: gen('. . P . . . P . . . P . . . P .', ['G', 'C', 'E', 'G'], MAJ) },
      ], drums: 'D.TkD.TkD.TkDkTT' },
    };

    /* ── P66e — Her boss'un kendi müziği: boss'un tasarımına göre makam,
       tempo, saz ve ritim. Anahtar 'b_' + boss.key; listede olmayan (yeni)
       bir boss yedek parçaya (bossGenel) düşer. ── */

    const BOSS_TRACKS = {
      /* P67e — kullanıcı 12 boss parçasını beğenmedi (Godzilla, Sir.by, Cellat,
         Misunderstood, Terzi, Üç Kağıtçı, GLITCH, Ritim, Kahin, Tüccar, Ayna Kral,
         Corporates); hepsi baştan, 8 ölçü, katmanlı (melodi + karşı ses / akor +
         bas + davul) yazıldı. Kara Kedi, Kelebek, Ahtapot, Fatality, Zombie,
         Freedom, Alien, Avukat beğenildi, aynen duruyor. */

      /* Godzilla — kaiju: yer sarsan ağır adımlar (76 bpm), dev bakır nefesliler
         D minörde tritonla (G#) tehdit eder, altında derin alt bas + koro */
      godzilla: { bpm: 76, div: 4, dv: 1, gain: .5, parts: [
        { i: 'tbrass', s: x2('D3 - - - - - D3 F3 | G#3 - - - A3 - - - | D3 - - - - - F3 E3 | D3 - - - C3 - Bb2 - | ' +
                             'F3 - - - - - G3 A3 | Bb3 - - - A3 - G#3 - | A3 - - - D4 - - - | C#4 - - - A3 - - -') },
        { i: 'sub', s: gen('L - - - - - - - - - - - - - - -', ['D', 'D', 'D', 'Bb', 'F', 'Bb', 'A', 'A'], NAT) },
        { i: 'choir', s: gen('P - - - - - - - - - - - - - - -', ['D', 'D', 'D', 'Bb', 'F', 'Bb', 'A', 'A'], NAT) },
      ], drums: 'D.......x.......' + 'D.....D.x...D...' },

      /* Sir.by — pembe, yumuşak ve sevimli: F majörde sekerek ilerleyen chiptune,
         ara vuruşlarda müzik kutusu pırıltısı; ikinci yarıda melodi basamak
         basamak iner (taş değerleri gibi "söner") */
      kirby: { bpm: 150, div: 2, dv: .4, gain: 1.1, parts: [
        { i: 'chip', s: 'C5 A4 F4 A4 C5 - D5 C5 | Bb4 - G4 - E4 - C4 - | D4 F4 Bb4 D5 C5 - A4 F4 | G4 - - - . . C5 . | ' +
                        'F5 E5 D5 C5 Bb4 A4 G4 F4 | E4 - G4 - Bb4 - C5 - | A4 C5 F5 C5 D5 C5 Bb4 G4 | F4 - - - . . . .' },
        { i: 'box', s: gen('. A . B . C . B', ['F', 'C', 'Bb', 'C', 'F', 'C', 'Bb', 'F'], FMAJ) },
        { i: 'bass', s: gen('R . O . R . O .', ['F', 'C', 'Bb', 'C', 'F', 'C', 'Bb', 'F'], FMAJ) },
      ], drums: 'D.k.T.k.' },

      /* Cellat — darağacına yürüyüş: yavaş (66 bpm) çello ostinatosu, her ölçü
         başında cenaze çanı, koronun ağıt melodisi, sonda trampet tremolosu */
      cellat: { bpm: 66, div: 4, dv: .9, gain: 1.6, parts: [
        { i: 'cello', s: x2(gen('R F R F R F R F', ['D', 'D', 'Bb', 'Bb', 'G', 'G', 'A', 'A'], NAT)) },
        { i: 'choir', s: x2('D4 - - - - - - - | F4 - - - E4 - D4 - | D4 - - - - - - - | Bb3 - - - - - - - | ' +
                            'G3 - - - Bb3 - D4 - | E4 - - - - - - - | F4 - - - E4 - D4 - | C#4 - - - - - - -') },
        { i: 'bell', s: gen('A - - - - - - - - - - - - - - -', ['D', 'D', 'Bb', 'Bb', 'G', 'G', 'A', 'A'], NAT) },
      ], drums: 'D.......x.......' + 'D.......x...xxxx' },

      /* The Misunderstood — yanlış anlaşılan canavar: A minörde müzik kutusu
         valsi (3/4), altında çellonun sıcak karşı sesi; hüzünlü ama şefkatli */
      misunderstood: { bpm: 88, div: 2, dv: .3, gain: 1.75, parts: [
        { i: 'box', s: 'E5 - - - D5 C5 | B4 - A4 - G#4 - | A4 - - - B4 C5 | D5 - - - - - | ' +
                       'F5 - - - E5 D5 | C5 - B4 - A4 - | G#4 - A4 - B4 - | A4 - - - - -' },
        { i: 'cello', s: 'A2 - - - - - | E3 - - - - - | A2 - - - - - | D3 - - - F3 - | ' +
                         'D3 - - - - - | A2 - - - C3 - | E3 - - - - - | A2 - - - - -' },
        { i: 'arp', s: gen('. . P . P .', ['A', 'E', 'A', 'D', 'D', 'A', 'E', 'A'], AMIN) },
      ], drums: 'k.....' },

      /* Terzi'nin İğnesi — dikiş makinesi: 16'lık pizzicato makine ritmi, üstünde
         kıvrak kromatik klarnet; tık-tık zil */
      terziIgne: { bpm: 132, div: 4, dv: .45, parts: [
        { i: 'pizz', s: gen('A . A . B . A . C . A . B . A .', ['A', 'A', 'D', 'E', 'A', 'A', 'F', 'E'], AMIN) },
        { i: 'clar', s: x2('E5 - D#5 E5 - - C5 - | A4 - - B4 C5 - B4 - | E5 - D#5 E5 - - G5 - | F5 - E5 - D5 - - - | ' +
                           'D5 - C#5 D5 - - F5 - | E5 - - D5 C5 - B4 - | C5 - B4 A4 G#4 - B4 - | A4 - - - - - . .') },
        { i: 'bass', s: gen('R . . . F . . . R . . . F . . .', ['A', 'A', 'D', 'E', 'A', 'A', 'F', 'E'], AMIN) },
      ], drums: 'D.s.k.s.D.s.k.s.' },

      /* Üç Kağıtçı — sokak hilekârı: sinsi bir tango (habanera bası), klarnet
         kıvrak ve göz kırpar; akordeon vuruşları */
      ucKagitci: { bpm: 112, div: 4, dv: .55, parts: [
        { i: 'clar', s: 'A4 . . A4 Bb4 . A4 . G#4 . . A4 - - - . | D5 - - - C5 . Bb4 . A4 - - - . . . . | ' +
                        'G4 . . G4 A4 . G4 . F#4 . . G4 - - - . | C5 - - - Bb4 . A4 . G4 - - - . . . . | ' +
                        'F4 . G4 . A4 . Bb4 . C#5 - - - D5 . . . | E5 . D5 . C#5 . Bb4 . A4 - - - - - . . | ' +
                        'D5 . . D5 F5 . D5 . C#5 . . A4 Bb4 . G4 . | A4 - - - - - - - D4 . . . . . . .' },
        { i: 'bass', s: gen('R . . R O . R . R . . R O . R .', ['D', 'D', 'G', 'G', 'Bb', 'A', 'D', 'A'], NAT) },
        { i: 'accord', s: gen('. . P . . . P . . . P . . . P .', ['D', 'D', 'G', 'G', 'Bb', 'A', 'D', 'A'], NAT) },
      ], drums: 'D..TD.T.D..TD.TT' },

      /* GLITCH — bozuk sinyal: 16'lık arpej, kekeleyen kare dalga, ani susmalar,
         alt bas; elektronik ama müzikal */
      dervish: { bpm: 140, div: 4, dv: .6, gain: .5, parts: [
        { i: 'chip', s: gen('A B C O A B C O A B C O A C B O', ['A', 'F', 'C', 'G', 'A', 'F', 'E', 'E'], AMIN) },
        { i: 'lead2', s: 'A5 . A5 A5 . . . . E5 . . . . . . . | G5 G5 G5 . F5 . . . E5 . D5 . . . . . | ' +
                         'A5 . A5 A5 . . C6 . B5 . . . . . . . | G#5 . . . . . . . E5 E5 E5 E5 . . . .' },
        { i: 'sub', s: gen('R . . R . . R . R . . R . R R .', ['A', 'F', 'C', 'G', 'A', 'F', 'E', 'E'], AMIN) },
      ], drums: 'D.sxD.sxDDs.xsxs' + 'D.s.xxs.D.ssx.xx' },

      /* Ritim — aksak 7/8 (2+2+3): darbuka önde, kanun riffi ritme kilitli */
      ritim: { bpm: 140, div: 2, dv: 1, parts: [
        { i: 'kanun', s: 'D5 C5 Bb4 A4 Bb4 A4 G4 | F#4 G4 A4 - Bb4 A4 - | D5 Eb5 D5 C5 Bb4 A4 G4 | A4 - - - . . .' },
        { i: 'bass', s: gen('R . O . R . F', ['D', 'D', 'G', 'D'], HICAZ) },
        { i: 'stab', s: gen('P . . . P . .', ['D', 'D', 'G', 'D'], HICAZ) },
      ], drums: 'D.k.T.k' + 'D.T.TkT' },

      /* Kahin — kehanet: A Hicaz'da uzun ney nefesleri, kristal gibi 16'lık çan
         arpeji, tanbura uğultusu, seyrek bendir */
      kahin: { bpm: 72, div: 4, dv: .55, gain: .8, parts: [
        { i: 'ney', s: x2('A4 - - - - - Bb4 A4 | C#5 - - - D5 - - - | E5 - - - F5 - E5 D5 | C#5 - - - - - - - | ' +
                          'D5 - C#5 - Bb4 - - - | A4 - - - G4 - F4 - | E4 - F4 - G4 - Bb4 - | A4 - - - - - - -') },
        { i: 'bell', s: gen('A . B . C . B . A . B . C . B .', ['A', 'A', 'D', 'A', 'Bb', 'D', 'G', 'A'], AHIC) },
        { i: 'drone', s: gen('P - - - - - - - - - - - - - - -', ['A', 'A', 'D', 'A', 'Bb', 'D', 'G', 'A'], AHIC) },
      ], drums: 'D.......k...T...' },

      /* Tüccar — çarşıda pazarlık: E Hicaz'da süslemeli ut melodisi, kanun akor
         vuruşları, çiftetelli darbuka */
      tuccar: { bpm: 108, div: 4, dv: .6, parts: [
        { i: 'ud', s: 'E5 - - F5 G#5 - F5 E5 F5 - E5 D5 E5 - - - | C5 - D5 C5 B4 - A4 - G#4 - A4 B4 C5 - - - | ' +
                      'A4 - B4 C5 D5 - C5 B4 C5 - D5 E5 F5 - E5 - | E5 - - - - - D5 C5 B4 - C5 B4 A4 - - - | ' +
                      'E5 - - F5 G#5 - A5 G#5 F5 - E5 F5 G#5 - - - | A5 - G#5 F5 E5 - D5 C5 B4 - C5 D5 E5 - - - | ' +
                      'F5 E5 D5 C5 B4 A4 G#4 A4 B4 - C5 - B4 - A4 - | G#4 - - - A4 - - - E4 - - - . . . .' },
        { i: 'stab', s: gen('. . P . . . P . . . P . . . P .', ['E', 'A', 'A', 'E', 'E', 'D', 'A', 'E'], EHIC) },
        { i: 'bass', s: gen('R . . O . . R . R . O . R . . .', ['E', 'A', 'A', 'E', 'E', 'D', 'A', 'E'], EHIC) },
      ], drums: 'D..T..T.D.TkT.k.' },

      /* Ayna Kral — aynalar sarayı: görkemli bakır tema, ikinci yarıda aynı
         melodinin AYNA görüntüsü (ters çevrilmiş) gelir; klavsen her notayı
         üç vuruş geriden yankılar (kanon) */
      aynaKral: { bpm: 92, div: 2, dv: .7, parts: [
        { i: 'tbrass', s: AYNA },
        { i: 'echo', s: shift(AYNA, 3) },
        { i: 'harpsi', s: gen('A B C B A B C B', ['D', 'A', 'G', 'D', 'G', 'C', 'F', 'G'], NAT) },
        { i: 'bass', s: gen('R - - - F - - -', ['D', 'A', 'G', 'D', 'G', 'C', 'F', 'G'], NAT) },
      ], drums: 'D.......' + 'D...x...' + 'D.D.....' + 'D...x.xx' },

      /* The Corporates — soğuk distopik kurum: tek notada çakılı 16'lık bas,
         düzenli synth arpeji, buz gibi çan motifi, makine davulu */
      corporates: { bpm: 118, div: 4, dv: .5, parts: [
        { i: 'dbass', s: gen('R R R R R R R R R R R R R R O R', ['A', 'A', 'F', 'F', 'C', 'C', 'G', 'E'], AMIN) },
        { i: 'organ', s: gen('A . C . B . C . A . C . B . C .', ['A', 'A', 'F', 'F', 'C', 'C', 'G', 'E'], AMIN) },
        { i: 'bell', s: x2('A4 - - - - - E5 - | D5 - C5 - B4 - - - | C5 - - - - - G5 - | F5 - E5 - D5 - - - | ' +
                           'A4 - - - - - E5 - | F5 - E5 - D5 - C5 - | B4 - C5 - D5 - E5 - | E5 - - - - - - -') },
      ], drums: 'D.s.x.s.D.s.x.ss' + 'D.s.x.s.D.sDx.s.' },

      /* ── beğenilen 8 parça (P66e) aynen ── */
      /* Kara Kedi — sinsi, parmak uçlarında: kromatik pizzicato + yürüyen bas */
      karaKedi: { bpm: 100, div: 2, dv: .45, gain: 1.2, parts: [
        { i: 'pizz', s: 'E4 . F#4 G4 . . G#4 A4 | . . E4 F#4 G4 . E4 . | B4 . A#4 A4 . G4 E4 . | D#4 E4 - - . . . .' },
        { i: 'bass', s: 'E2 . G2 . A2 . A#2 . | B2 . A2 . G2 . E2 . | E2 . G2 . A2 . C3 . | B2 . B1 . E2 . . .' },
      ], drums: 'D.s.k.s.' },
      /* Kelebek Etkisi — kanat çırpan 16'lık arpejler, rüya gibi flüt */
      kelebek: { bpm: 120, div: 4, dv: .35, gain: .5, parts: [
        { i: 'ney', s: x2('E5 - - - F#5 - - - | G5 - - - A5 - - - | F5 - - - E5 - D5 - | E5 - - - - - - -') },
        { i: 'bell', s: gen('A B C B A B C B A C B C A B C B', ['C', 'D', 'Bb', 'A'], DREAM) },
        { i: 'bass', s: gen('R - - - - - - - - - - - - - - -', ['C', 'D', 'Bb', 'A'], DREAM) },
      ], drums: 'k...s...k...s.s.' },
      /* Ahtapot — su altı: dalgalanan melodi, kabarcık arpejleri, derin bas */
      ahtapot: { bpm: 84, div: 4, dv: .55, parts: [
        { i: 'wob', s: x2('D4 - - E4 F4 - - - | A4 - G4 - F4 - E4 - | D4 - - E4 F4 - G4 - | A4 - - - - - - -') },
        { i: 'arp', s: gen('A . B . C . B . A . B . C . B .', ['D', 'Bb', 'C', 'A'], NAT) },
        { i: 'bass', s: gen('R . . R . . R . . . R . R . . .', ['D', 'Bb', 'C', 'A'], NAT) },
        { i: 'drone', s: gen('P - - - - - - - - - - - - - - -', ['D', 'Bb', 'C', 'A'], NAT) },
      ], drums: 'D..k..D...k..k..' },
      /* Fatality — dövüş oyunu tekno: dörtlük davul, minör riff */
      fatality: { bpm: 138, div: 4, dv: .75, parts: [
        { i: 'boss', s: 'A4 . A4 . C5 . A4 . D5 . A4 . E5 . D5 . | C5 . C5 . E5 . C5 . G5 . C5 . G5 . F5 . | ' +
                        'A4 . A4 . C5 . A4 . D5 . A4 . E5 . D5 . | A4 . A4 . C5 . A4 . E5 . D5 . C5 . B4 .' },
        { i: 'dbass', s: gen('R . O . R . O . R . O . R . O .', ['A', 'C', 'A', 'E'], AMIN) },
      ], drums: 'D.s.x.s.D.s.x.ss' },
      /* Zombie — topallayan korku-funk: inen kromatik org, aksak davul */
      zombie: { bpm: 96, div: 4, dv: .6, parts: [
        { i: 'organ', s: x2('E4 - D#4 - D4 - C#4 - | C4 - - - B3 - - - | E4 - D#4 - D4 - F4 - | E4 - - - - - - -') },
        { i: 'bass', s: gen('R . . . R . O . . . R . . . F .', ['E', 'C', 'E', 'B'], EMIN) },
      ], drums: 'D...x..D..D.x...' },
      /* Freedom Fighters — trampetli marş: kahraman ama gergin */
      freedom: { bpm: 112, div: 4, dv: .65, parts: [
        { i: 'brass', s: x2('D4 - D4 F4 A4 - - - | G4 - F4 E4 D4 - - - | D4 - D4 F4 A4 - D5 - | C5 - A4 - D5 - - -') },
        { i: 'bass', s: gen('R . . . F . . . R . . . F . . .', ['D', 'G', 'D', 'A'], NAT) },
      ], drums: 'D.xxD.x.D.xxDxxx' },
      /* Alien — tam ton dizisinde theremin, uzay sinyali gibi çan blipleri */
      uzayli: { bpm: 90, div: 4, dv: .4, gain: .65, parts: [
        { i: 'theremin', s: x2('C5 - - - D5 - E5 - | F#5 - - - E5 - - - | G#5 - F#5 - E5 - D5 - | C5 - - - - - - -') },
        { i: 'bell', s: gen('A B C B A B C B A B C B A B C B', ['C', 'D', 'C', 'D'], WT) },
        { i: 'bass', s: gen('R - - - - - - - . . . . R - - -', ['C', 'D', 'C', 'D'], WT) },
      ], drums: 'k.....s...k.s...' },
      /* Avukat — mahkeme salonu: barok klavsen, resmî ve soğuk */
      avukat: { bpm: 108, div: 4, dv: .3, parts: [
        { i: 'harpsi', s: 'D5 A4 F4 A4 D5 A4 F4 A4 E5 A4 G4 A4 E5 A4 G4 A4 | F5 A4 D5 A4 F5 A4 D5 A4 E5 A4 C#5 A4 E5 A4 C#5 A4 | ' +
                          'D5 Bb4 G4 Bb4 D5 Bb4 G4 Bb4 C5 A4 F4 A4 C5 A4 F4 A4 | Bb4 G4 E4 G4 A4 F4 D4 F4 C#4 E4 A4 E4 D4 - - -' },
        { i: 'bass', s: gen('R - - - - - - - F - - - - - - -', ['D', 'D', 'G', 'A'], NAT) },
      ], drums: 'k...............' },
    };
    Object.keys(BOSS_TRACKS).forEach(k => { TRACKS['b_' + k] = BOSS_TRACKS[k]; });

    function ensureCtx() {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (!master) {
        master = actx.createGain();
        master.gain.value = level();
        master.connect(actx.destination);
        noise = actx.createBuffer(1, actx.sampleRate * 0.3, actx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return actx;
    }

    function tone(dest, t, f, dur, o) {
      const g = actx.createGain();
      /* uni: ikinci, hafif akortsuz osilatör → koro / kalın bakır */
      const oscs = [0, o.uni ? o.uni : null].filter(d => d !== null).map(det => {
        const osc = actx.createOscillator();
        osc.type = o.type;
        osc.frequency.setValueAtTime(f, t);
        if (det) osc.detune.value = det;
        return osc;
      });
      if (o.vib && dur > .3) {                    // ney: geç başlayan hafif titreşim
        const lfo = actx.createOscillator(), lg = actx.createGain();
        lfo.frequency.value = o.vib; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (o.vd || .008), t + dur);
        lfo.connect(lg); oscs.forEach(osc => lg.connect(osc.frequency)); lfo.start(t); lfo.stop(t + dur + o.rel * 6);
      }
      let into = g;
      if (o.cut) {
        const fl = actx.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.setValueAtTime(o.cut, t);
        if (o.sweep) fl.frequency.setTargetAtTime(o.cut * .3, t, .08);   // tel çekme hissi
        fl.connect(g); into = fl;
      }
      const v = o.uni ? o.vol * .7 : o.vol;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + o.a);
      g.gain.setTargetAtTime(v * o.sus, t + o.a, o.dec);
      g.gain.setTargetAtTime(0, t + dur, o.rel);
      g.connect(dest);
      oscs.forEach(osc => { osc.connect(into); osc.start(t); osc.stop(t + dur + o.rel * 6); });
    }

    /* darbuka: D düm (pes, perde düşen), T tek (tiz), k ka (yumuşak tiz);
       boss parçaları için s zil (çok tiz, kısa), x trampet (orta, uzun) */
    function drum(dest, t, k, v) {
      if (k === 'D') {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(52, t + .16);
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.6 * v, t + .005);
        g.gain.exponentialRampToValueAtTime(.0001, t + .3);
        o.connect(g).connect(dest); o.start(t); o.stop(t + .32);
        return;
      }
      const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      src.buffer = noise;
      const P = { T: [3400, 1.3, .07, .4], k: [2300, 1.3, .045, .2], s: [8500, .9, .03, .12], x: [1800, .7, .14, .32] }[k] || [2300, 1.3, .045, .2];
      f.type = 'bandpass'; f.frequency.value = P[0]; f.Q.value = P[1];
      const L = P[2], V = P[3] * v;
      g.gain.setValueAtTime(V, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + L);
      src.connect(f).connect(g).connect(dest); src.start(t); src.stop(t + L + .02);
    }

    function playSynth(name) {
      const T = TRACKS[name];
      const out = actx.createGain();
      out.gain.value = 0;
      out.connect(master);
      out.gain.setTargetAtTime(T.gain || 1, actx.currentTime, .3);   // parça başı seviye dengesi
      const stepDur = 60 / T.bpm / T.div;
      const parts = T.parts.map(p => ({ o: INST[p.i], q: seq(p.s) }));
      let step = 0, next = actx.currentTime + .06;
      const tick = () => {
        /* sekme uykudan dönünce geçmişe kalan adımları topluca çalma */
        if (next < actx.currentTime) next = actx.currentTime + .05;
        while (next < actx.currentTime + .25) {
          parts.forEach(p => {
            const e = p.q.at[step % p.q.len];
            if (e) e[1].forEach(f => f && tone(out, next, f, e[2] * stepDur * .92, p.o));
          });
          const k = T.drums[step % T.drums.length];
          if (k !== '.') drum(out, next, k, T.dv);
          step++; next += stepDur;
        }
      };
      tick();
      const timer = setInterval(tick, 40);
      return {
        name,
        stop() {
          out.gain.setTargetAtTime(0, actx.currentTime, .25);
          setTimeout(() => { clearInterval(timer); out.disconnect(); }, 1400);
        },
      };
    }

    function playFile(name) {
      const a = new Audio(MUSIC_FILES[name]);
      a.loop = true; a.volume = 0;
      a.play().catch(() => {});
      let k = 0, fading = null;
      const fade = (from, to, done) => {
        clearInterval(fading); k = 0;
        fading = setInterval(() => {
          k = Math.min(1, k + .05);
          a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
          if (k >= 1) { clearInterval(fading); if (done) done(); }
        }, 50);
      };
      fade(0, Math.min(1, level() * 2));
      return {
        name, el: a,
        stop() { fade(a.volume, 0, () => { a.pause(); a.src = ''; }); },
      };
    }

    let force = null;               // test/kayıt kancası: belirli parçayı zorla
    function want() {
      if (force) return force;
      if (preview && document.getElementById('settingsOv')) return preview;
      preview = null;
      const theme = 'tema' + set;
      if (storeOpen() || upgradeOpen()) return 'store' + set;
      if (curScreen() === 'game') {
        try {
          if (!Game.state || !Game.isBossRound()) return theme;
          const own = Game.state.boss && 'b_' + Game.state.boss.key;
          return own && TRACKS[own] ? own : 'bossGenel';     // boss'un kendi müziği
        } catch (e) { return theme; }
      }
      return theme;                   // menü + harita: seçili tema
    }

    function sync() {
      if (!unlocked || !on) return;
      const w = want();
      if (cur && cur.name === w) return;
      try {
        ensureCtx();
        if (cur) cur.stop();
        cur = MUSIC_FILES[w] ? playFile(w) : playSynth(w);
      } catch (e) { cur = null; /* ses desteklenmiyorsa sessiz devam */ }
    }

    function applyLevel() {
      if (master) master.gain.setTargetAtTime(level(), actx.currentTime, .05);
      if (cur && cur.el) cur.el.volume = Math.min(1, level() * 2);
    }

    function unlock() {
      if (unlocked) return;
      unlocked = true;
      try { ensureCtx(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* sessiz */ }
      sync();
    }
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    /* arka plan sekmesinde zamanlayıcı kısılır → bağlamı uyut, dönünce uyandır */
    document.addEventListener('visibilitychange', () => {
      if (!actx || !unlocked) return;
      if (document.hidden) actx.suspend(); else actx.resume();
    });
    setInterval(sync, 500);

    return {
      get on() { return on; },
      get vol() { return vol; },
      get track() { return cur ? cur.name : null; },
      get unlocked() { return unlocked; },
      get set() { return set; },
      setSet(n) {
        set = SETS.includes(+n) ? +n : 1;
        lsSet(SET_KEY, String(set));
        preview = 'tema' + set;
        if (!on) this.setOn(true);       // seçen kişi duymak ister
        unlock();
        sync();
      },
      want, sync, unlock, TRACKS,
      force(name) { force = name && TRACKS[name] ? name : null; unlock(); sync(); },
      get forced() { return force; },
      setOn(b) {
        on = !!b;
        lsSet(ON_KEY, on ? '1' : '0');
        if (!on && cur) { cur.stop(); cur = null; }
        applyLevel();
        sync();
      },
      setVol(v) {
        vol = Math.max(0, Math.min(100, Math.round(+v || 0)));
        lsSet(VOL_KEY, String(vol));
        applyLevel();
      },
    };
  })();

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
      /* P35 · Grup H — yakalanınca silinen hile puanı yazılır */
      body = f.lost > 0 ? t('cheatCaughtLost', f.lost)
        : (f.back > 0 ? t('cheatCaughtBack', f.back) : t('cheatCaughtBare'));
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
    /* P37 (kullanıcı kararı 2026-09-13) — "ŞİMDİ DEĞİL" FÜZYONU RAFA KOYAR.
       Eskiden Füzyon bekleyen eylem olarak kalıyor, ekranın ortasında yüzen
       bir "⚗ Füzyon" düğmesiyle geri çağrılıyordu. Artık boş olan ilk rafa
       (önce ana slot, sonra backup) oturur ve oradan kullanılır. İki raf da
       doluysa mecburen bekler. */
    ov.querySelector('#fzmLater').addEventListener('click', () => { close(); parkFuzyon(); });
    document.body.appendChild(ov);
  }

  function parkFuzyon() {
    if (!Game.hasPendingFuzyon || !Game.hasPendingFuzyon()) return;
    const d = Game.fuzyonDests();
    const dest = d.main ? 'main' : d.backup ? 'backup' : null;
    if (!dest) { render(); return; }
    const r = Game.placeFuzyon(dest);
    if (!r.ok) { toast(r.error); return; }
    if (storeOpen()) renderStore();
    render();
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
      /* P65 (kullanıcı isteği 2026-10-04: "jokerlerin kendilerini görebilelim")
         — seçenek artık jokerin KENDİSİ: çizimi varsa çizimi, yoksa slottaki
         gibi büyük ikonu taş yüzünde; adı ve kalan süresi altında. Tam
         açıklama üstüne gelince tooltip'te. */
      const fzArt = JOKER_ART.has(j.key);
      b.innerHTML = `<div class="fz-card${fzArt ? ' fz-art jk-' + j.key : ''}">${fzArt ? '' : jokerIcon(j.key)}</div>`
        + `<b>${T.name(j)}</b><span>${Game.isRunLong(j) ? t('tipUsesRun') : t('fzRounds', j.usesLeft)}`
        + (inBackup ? ` · ${t('fzInBackup')}` : '') + `</span>`;
      attachTip(b, { name: T.name(j), desc: T.desc(j), accent: j.rarity, rarityText: T.rarity(j.rarity), key: j.key }, {});
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
          if (curScreen() === 'map') renderMap();   // P58: haritadan Füzyon
        }
      });
      row.appendChild(b);
    });
    /* P37 — ele geçer geçmez açılan seçicideki "Şimdi değil" de Füzyonu rafa
       koyar (bkz. parkFuzyon); raftan açılan seçicide "Vazgeç" yalnız kapatır. */
    ov.querySelector('#fzCancel').addEventListener('click', () => { ov.remove(); if (auto) parkFuzyon(); });
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
    const picking = !!(consumPick && consumPick.index === index);
    /* P38 (kullanıcı kararı 2026-09-14) — ÇİZİMLİ DEĞNEK YALNIZ ÇİZİMİN KENDİSİ.
       Slotta ad, açıklama ve "Kullan" düğmesi YOK; kart kabuğu da yok.
       Kullanmak için çizime SAĞ TIK (raund içinde de store'da da); taş seçen
       değnekte seçim sürerken ikinci sağ tık iptal eder. Ad + açıklama +
       "Sağ tık" ipucu tooltip'te. Çizimi olmayan (ileride eklenecek) bir
       değnek eski kart düzeninde, düğmeyle kalır. */
    if (art) d.classList.add('art-only');
    /* P41 (kullanıcı isteği 2026-09-14) — SOL TIK KULLAN, SAĞ TIK SAT.
       Çizimli değnek kartının içinde yazı/düğme yok; eylemler üstüne gelince
       açılan ortak rozette (#actBadge, bkz. attachActs) yazar. Satış yalnız
       store rafında (opts.sell) — kullanıcı kararı: raund içinde satış yok. */
    d.innerHTML = art
      ? `<span class="c-icon cs-art cs-${key}"></span>`
      : `<span class="c-icon">${def.icon}</span>` +
        `<div class="c-body"><b>${T.consumName(key, def.name)}</b><span>${T.consumDesc(key, def.desc)}</span></div>`;
    const useIt = () => {
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
    };
    /* GRUP C (P22) — DEĞNEK SATIŞI.
       Yalnız STORE panelinde: satış joker tarafında da store'a bağlı bir
       işlem ve raund ortasında coin basmak dengeyi bozardı. */
    const sellIt = () => {
      const res = Game.sellConsumable(index);
      if (!res.ok) { toast(res.error || t('sellConsumFail')); return; }
      toast(t('sellToast', T.consumName(res.key, res.name), res.gain), true);
      SFX.coin(); renderStore(); render();
    };
    /* P47 (kullanıcı isteği 2026-09-14): değnek de RAUND İÇİNDE sağ tıkla satılır
       (P41'de yalnız store rafındaydı; jokerler P46'da açılmıştı). */
    if (art) attachActs(d, () => ({
      left: { lbl: t(picking ? 'abCancel' : 'abUse'), fn: useIt },
      right: { lbl: t('abSell', Game.consumSellPrice(key)), fn: sellIt },
    }));
    const hint = art
      ? ` — ${t(picking ? 'consumLeftCancel' : 'consumLeftUse')} · ${t('consumRightSell')}`
      : '';
    attachTip(d, { name: T.consumName(key, def.name),
      rarityText: `${T.rarity(def.rarity || 'common')} · ${t('consumTag')}`,
      accent: def.rarity || 'common',
      desc: T.consumDesc(key, def.desc) + hint }, {});
    if (!art) {
      // çizimi henüz gelmemiş değnek eski kart düzeninde, düğmelerle kalır
      const btn = document.createElement('button');
      btn.className = 'c-use';
      btn.textContent = picking ? t('cancel') : t('useBtn');
      btn.addEventListener('click', useIt);
      d.appendChild(btn);
      if (opts.sell) {
        const sb = document.createElement('button');
        sb.className = 'c-sell';
        sb.innerHTML = t('sellConsumBtn', Game.consumSellPrice(key), COIN);
        sb.addEventListener('click', sellIt);
        d.appendChild(sb);
      }
    }
    return d;
  }

  /* P42 (kullanıcı isteği 2026-09-14) — BOSS'UN TUR TUR DEĞİŞEN NOTLARI.
     Eskiden boss kutusunun altına `bb-extra` satırı olarak ekleniyordu; kutu
     uzadıkça okunmuyordu. Kahin kehanetiyle aynı yere, üst ortadaki kalıcı
     kutuya (#kahinChip) taşındı. Ferman iptali kutuda kalır (kuralın durumu). */
  /* P57 — slottaki Corporates'in bu raundki şirketi (boss görevi değil) */
  function liveCorp(j) {
    const s = Game.state;
    if (!j || j.key !== 'corporates' || !s || s.status !== 'playing') return null;
    /* Kullanıcı kararı (P57): haritada kart ORİJİNAL görüntüsünde durur.
       Sonraki raund harita gösterilmeden ÖNCE kurulduğu için şirket o anda
       seçilmiş olur; dönüşüm yalnız oyun ekranında (raunda girince) görünür. */
    if (curScreen() !== 'game') return null;
    const c = s.corpTask;
    if (!c || c.boss) return null;
    if (j.id != null && !Game.slotRecs().some(r => r.id === j.id)) return null;
    return c;
  }

  function bossTurnNotes(s) {
    if (!s || !s.boss || s.bossVoided || !(Game.bossOn && Game.bossOn())) return [];
    const n = [];
    const k = s.boss.key;
    if (k === 'kelebek' && s.bossBan) n.push(t('bossBanExtra', T.typeName(s.bossBan)));
    if (k === 'avukat' && s.bossMutedJoker) {
      const mj = Game.slotRecs().find(j => j.key === s.bossMutedJoker);
      n.push(t('bossMutedExtra', mj ? T.name(mj) : s.bossMutedJoker));
    }
    if (k === 'aynaKral' && (s.bossMirrorDebt || 0) > 0) n.push(t('bossMirrorExtra', s.bossMirrorDebt));
    if (k === 'corporates' && s.corpTask)
      n.push(`${T.ev(s.corpTask.name)}: ${T.ev(s.corpTask.text)}${s.corpTask.failed ? ' — ' + t('bossTaskFailed') : ''}`);
    if (k === 'freedom' && (s.bossFreedomMarks || []).length) {
      const owed = [...s.hand, ...s.discardPile].filter(x => x.ffMarkedTile && !x.ffUsedInMeld).length;
      n.push(t('bossFreedomExtra', s.bossFreedomMarks.map(m => `${T.color(m.color)} ${m.number}`).join(', '), owed));
    }
    /* Grup H — Sinsi Bulaşma: hangi taşların uzaylı olduğu GİZLİ, kaç tane
       olduğu canlı görünür (sürpriz taşın kimliğinde, sayısında değil). */
    if (k === 'uzayli') n.push(t('bossAlienExtra', s.hand.filter(x => x.hiddenAlien).length));
    return n;
  }

  /* P54 · Grup C — SATRANÇ SAATİ'NİN GERÇEK ZAMANI. Saat yalnız oyun ekranı
     görünürken, duraklatma menüsü kapalıyken, sekme öndeyken işler; motor
     açılım aşaması dışında ve durdurulmuş saatte tiki zaten yok sayar. */
  setInterval(() => {
    const s = Game.state;
    if (!s || !Game.clockOn || !Game.clockOn() || s.status !== 'playing') return;
    if (document.visibilityState !== 'visible' || el.gameScreen.classList.contains('hidden')) return;
    if (el.menuPop && !el.menuPop.classList.contains('hidden')) return;
    if (document.querySelector('.pk-ov') || (el.overlay && !el.overlay.classList.contains('hidden'))) return;
    const before = s.clockLeft;
    Game.clockTick(1);
    if (s.clockLeft === before) return;
    const b = document.querySelector('#jokerSlots .jt-clock');
    if (b) b.textContent = `♟${s.clockLeft}`;
    /* çarpan kademesi değiştiyse önizleme kutusu da güncellensin */
    if (s.clockLeft % CLOCK_STEP === CLOCK_STEP - 1 && (s.staged.length || s.islemeler.length)) render();
  }, 1000);

  function render() {
    const s = Game.state;
    hideTip(); // hover'daki eleman yeniden çizimde kaybolabilir
    /* P54 · Grup A — Üç Kağıtçı'nın bekleyen seçimi (tur başında motor kurar).
       Hangi akıştan gelinirse gelinsin (raund başı, discard, kayıttan dönüş)
       pencere render üzerinden açılır; açıksa ikinci kez kurulmaz. */
    if (s && s.ucKagit && s.status === 'playing' && !document.getElementById('ucKagitPop'))
      setTimeout(showUcKagit, 450);
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
      // P42: tur tur değişen boss notları (Kelebek yasağı dahil) üstteki #kahinChip'te — bkz. bossTurnNotes
      /* GRUP B/1 (P20): sınır artık üst şeritteki #fatalityChip'te yazar —
         burada ikinci kez yazılmaz. */
      /* P36 · Grup C / P42 — Kahin kehaneti ve boss'un TUR TUR değişen
         notları (susturulan joker, yasak, borç, görev…) boss kutusunda
         TEKRARLANMAZ: tek yerleri üst ortadaki #kahinChip (bossTurnNotes).
         Boss kutusu yalnız kuralın kendisini (bd) gösterir. */
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
    /* P54 · Bölüm 1 · Madde 3 (bug) — Uzun Soluk + İpotek ile tur sayısı
       6-7'ye çıkınca 40px'lik kutular coin paneline (x 1709) taşıyordu.
       Nokta dizisinin genişliği artık 5 kutuluk Figma genişliğiyle (240px)
       SINIRLI: 5'e kadar Figma ölçüsü (40px · 10px ara) aynen durur, fazlası
       kutuları küçülterek aynı alana sığar. Kaç tur olursa olsun taşmaz. */
    const nT = Math.max(1, s.maxTurns);
    const tGap = nT <= 5 ? 10 : 6;
    const tBox = nT <= 5 ? 40 : Math.max(12, Math.floor((TURN_DOTS_W - (nT - 1) * tGap) / nT));
    el.turnIndicator.innerHTML = `${t('turn')}<span class="gm-turn-dots" style="--td:${tBox}px;--tg:${tGap}px">` +
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
       dolgu, 15 hücre, 12px boşluk → taş 81px (tasarım ölçüsü).
       P53 · GRUP B: 20 hücrede aynı satır genişliği → taş 57px. */
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
    renderWell();   // P59 · Öteki Dünya — Ay Kuyusu
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
      /* P42 (kullanıcı isteği 2026-09-14) — boss'tan gelen tur notları da
         (ör. "Bu tur susturulan joker: İki Yüzlü") Kahin kehanetiyle AYNI
         kutuda, satır satır. */
      const notes = s.status === 'playing' ? bossTurnNotes(s) : [];
      /* P57 (kullanıcı isteği) — joker Corporates'in görevi de Kahin gibi
         üst ortadaki kutuda raund boyu durur; tutunca ✓, bozulunca ✗. */
      const cj = s.corpTask && !s.corpTask.boss && s.status === 'playing'
        ? Game.slotRecs().find(r => r.key === 'corporates') : null;
      const corpLine = cj ? s.corpTask : null;
      const bs = s.status === 'playing' && Game.betState ? Game.betState() : null;
      /* P58 — Bungie Gum'ın durumu (sakızda bekleyen taş / bu tur koptu) */
      let gumLine = null;
      if (s.status === 'playing' && Game.slotRecs().some(r => r.key === 'bungieGum')) {
        const n = (s.bungiePending || []).length;
        if (n) gumLine = t('bungieChipPending', n);
        else if (s.bungieSnap && s.bungieSnap.turn === s.turn) gumLine = t('bungieChipSnap', s.bungieSnap.n);
      }
      const betLine = bs && bs.bet ? bs : null;   // P58 · Kumarhane
      /* P61 — yan bahis ve Rulet rengi de bahis satırının altında */
      const sideLine = s.status === 'playing' && s.sideBet ? s.sideBet : null;
      const ruletLine = s.status === 'playing' && s.ruletColor && Game.hasActive('rulet') ? s.ruletColor : null;
      if (!s.sideOffer) document.getElementById('sideOv')?.remove();
      if (s.status !== 'playing' || (s.ruletColor && document.getElementById('ruletOv'))) document.getElementById('ruletOv')?.remove();
      const show = s.status === 'playing' && !!(g || bo || notes.length || corpLine || betLine || gumLine || sideLine || ruletLine);
      el.kahinChip.classList.toggle('hidden', !show);
      if (show) {
        const lines = [];
        let done = false;
        if (g || bo) {
          done = g ? !!g.done : !!bo.met;
          const reward = g ? ` → +${g.amount} ${g.reward === 'coin' ? t('kahinCoin') : t('kahinPts')}` : '';
          const txt = t('kahinChip', T.ev(g ? g.text : bo.text) + reward);
          lines.push(`<div class="kc-line"><span class="kc-ico">🔮</span><span class="kc-val">${txt}</span>`
            + (done ? '<span class="kc-ok">✓</span>' : '') + '</div>');
        }
        if (gumLine) lines.push(`<div class="kc-line kc-gum"><span class="kc-val">${gumLine}</span></div>`);
        if (betLine) {
          lines.push(`<div class="kc-line kc-bet"><span class="kc-ico">🎰</span><span class="kc-val">`
            + t('betChip', T.ev(betLine.name), betLine.target)
            + (betLine.katla ? ' · ' + t(betLine.katla.burned ? 'betChipBurned' : 'betChipKatla', betLine.katla.base) : '')
            + `</span></div>`);
        }
        if (sideLine) lines.push(`<div class="kc-line kc-side"><span class="kc-ico">🎲</span><span class="kc-val">`
          + t('sideChip', T.ev(SIDE_NAME(sideLine.key)), sideLine.odds) + `</span></div>`);
        if (ruletLine) lines.push(`<div class="kc-line kc-rulet"><span class="kc-ico">🎡</span><span class="kc-val">`
          + t('ruletChip', ruletLine === 'red' ? '🔴 ' + t('cRed') : '⚫ ' + t('cBlack')) + `</span></div>`);
        if (corpLine) {
          const mark = corpLine.done ? '<span class="kc-ok">✓</span>' : corpLine.failed ? '<span class="kc-ok kc-fail">✗</span>' : '';
          lines.push(`<div class="kc-line kc-corp"><span class="kc-ico">🏢</span><span class="kc-val">`
            + t('corpChip', T.ev(corpLine.name), T.ev(corpLine.text), T.ev(corpLine.rewardText)) + `</span>${mark}</div>`);
        }
        for (const x of notes) lines.push(`<div class="kc-line kc-boss"><span class="kc-val">${x}</span></div>`);
        el.kahinChip.classList.toggle('done', done);
        el.kahinChip.innerHTML = lines.join('');
        el.kahinChip.title = el.kahinChip.textContent;
      }
      /* P58 (kullanıcı raporu 2026-10-02) — ÜST KUTU ÇAKIŞMASI. Kutu üst
         ortada 640…1280 aralığını kaplıyor; Trade Jokeri'nin borsa çipi
         (x 470→) ve Fatality çipi (x 1040) aynı şeritte (top 41) durduğu için
         kutunun altında kalıyordu. Kutu görünürken iki çip kutunun HEMEN
         ALTINA iner; kutu yokken CSS'teki yerlerine döner. */
      const below = show ? `${el.kahinChip.offsetTop + el.kahinChip.offsetHeight + 10}px` : '';
      el.borsaChip.style.top = below;
      el.fatalityChip.style.top = below;
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
    if (res.katlaOffer) setTimeout(showKatlaOffer, 650);   // P58 · Kumarhane
    if (Game.state.status !== 'playing') setTimeout(showRoundEnd, 900);
  };

  /* ============================================================
     P58 · GRUP C — KUMARHANE RUN arayüzü
     · showBetPicker : raunda girerken kör bahis (opak katman: el görünmez)
     · showKatlaOffer: hedef açılımla tuttu → "Kasada kal / Katla"
     · showBetPicks  : bahis ödülü — 3 jokerden 1'i (sırayla)
     ============================================================ */
  function showBetPicker(done) {
    if (document.getElementById('betOv')) return;
    const ov = document.createElement('div');
    ov.id = 'betOv';
    ov.className = 'pk-ov tone-gold bet-ov';
    const opts = Game.betOptions();
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">🎰 ${t('betTitle')}</div>` +
      `<div class="pk-sub-title">${t('betSub')}</div>` +
      `<div class="bet-peek hidden"></div>` +
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><span class="pk-hint">${t('betKatlaHint')}</span></div></div>`;
    /* P61 · 🃏 Kart Sayıcı — kör bahis bu kartla yarı-kör: elinden 3 taş açık */
    const peek = Game.betPeek ? Game.betPeek() : null;
    if (peek && peek.length) {
      const pb = ov.querySelector('.bet-peek');
      pb.classList.remove('hidden');
      pb.innerHTML = `<span class="bp-lbl">🃏 ${T.name({ key: 'kartSayici', name: JOKER_DEFS.kartSayici.name })}</span>`;
      for (const tl of peek) { const te = tileEl(tl, false); te.classList.add('bp-tile'); pb.appendChild(te); }
    }
    const body = ov.querySelector('.pk-body');
    opts.forEach((o, i) => {
      const c = document.createElement('button');
      c.className = `pk-card bet-card bet-${o.key}`;
      c.dataset.bet = o.key;
      c.style.animationDelay = `${i * 0.11}s`;
      c.innerHTML = `<div class="pk-name">${T.ev(o.name)}</div>` +
        `<div class="bet-target">${t('betTarget', o.target)}</div>` +
        `<div class="pk-desc">${betRewardText(o)}</div>`;
      c.addEventListener('click', () => {
        const r = Game.placeBet(o.key);
        if (!r.ok) { toast(r.error); return; }
        SFX.chips();
        betClosedScene(o.key, c);   // P61 — fişler masaya, "BAHİSLER KAPANDI!"
        ov.remove();
        toast(T.ev(r.note), true);
        if (done) done(); else render();
      });
      body.appendChild(c);
    });
    document.body.appendChild(ov);
    Hints.show('kumarhane');   // P60 — ilk bahiste kuralların özeti
  }

  /* P61 — ödül metni motorun o stage'deki değerlerinden (betReward) */
  function betRewardText(o) {
    if (!o.perm && !o.picks && o.coinMult === 1) return t('betReward_guvenli');
    const parts = [t('brCoin', o.coinMult)];
    if (o.perm) parts.push(t('brPerm', Number(o.perm).toFixed(o.perm % 0.5 ? 2 : 1)));
    if (o.picks) parts.push(t('brPick_' + (o.pick || 'any')));
    return t('brPrefix') + parts.join(' + ') + '.';
  }

  function showKatlaOffer() {
    const s = Game.state;
    if (!s.katlaOffer || document.getElementById('katlaOv')) return;
    const ov = document.createElement('div');
    ov.id = 'katlaOv';
    ov.className = 'pk-ov tone-gold';
    const next = s.katlaOffer.base * 2;
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">🎯 ${t('katlaTitle')}</div>` +
      `<div class="pk-sub-title">${t('katlaBody', s.score, s.katlaOffer.base, next, s.maxTurns - s.turn)}</div>` +
      (Game.isBossRound() ? `<div class="pk-sub-title katla-warn">${t('katlaBossWarn')}</div>` : '') +
      `<div class="pk-body pk-choice">` +
      `<button class="pk-card bet-card" data-k="stay"><div class="pk-name">💰 ${t('katlaStay')}</div>` +
      `<div class="pk-desc">${t('katlaStayDesc')}</div></button>` +
      `<button class="pk-card bet-card bet-olumcul" data-k="double"><div class="pk-name">🎲 ${t('katlaDouble')}</div>` +
      `<div class="bet-target">${t('betTarget', next)}</div>` +
      `<div class="pk-desc">${t('katlaDoubleDesc')}</div></button>` +
      `</div></div>`;
    ov.querySelector('[data-k="stay"]').addEventListener('click', () => {
      ov.remove();
      Game.katlaStay();
      render();
      if (Game.state.status !== 'playing') setTimeout(showRoundEnd, 300);
    });
    ov.querySelector('[data-k="double"]').addEventListener('click', () => {
      ov.remove();
      const base = Game.state.target;
      const r = Game.katlaDouble();
      if (r.ok) { SFX.dice(); katlaScene(base, Game.state.target); }
      render();
    });
    document.body.appendChild(ov);
    Hints.show('katla');   // P60 — ilk Katla teklifinde ne zaman katlanır
  }

  /* ============================================================
     P61 (kullanıcı kararları 2026-10-04) — KUMARHANE HİSSİ
     · betClosedScene: bahis seçilince fişler masaya kayar + bant
     · katlaScene: Katla'da zar sesi, ekran titrer, hedef "katlanır"
     · showJackpot: Riskli/Ölümcül/Katla kazancında beyaz kutu yerine
     · kumarStartPanels: raund başı (el GÖRÜLEREK) Rulet rengi + yan bahis;
       ıstaka görünsün diye arkaplanı karartmayan "dock" pencereler
     · showHiLo: raund sonu Yüksek mi Alçak mı
     ============================================================ */
  function betClosedScene(key, fromEl) {
    const r = fromEl.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'chip-layer';
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 7; i++) {
      const c = document.createElement('div');
      c.className = `fly-chip chip-${key}`;
      c.style.left = `${cx - 14 + (i - 3) * 7}px`;
      c.style.top = `${cy - 14}px`;
      c.style.setProperty('--dx', `${innerWidth / 2 - cx + (i - 3) * 4}px`);
      c.style.setProperty('--dy', `${70 - cy - i * 3}px`);
      c.style.animationDelay = `${i * 0.05}s`;
      layer.appendChild(c);
    }
    const band = document.createElement('div');
    band.className = 'bet-band';
    band.textContent = t('betClosed');
    layer.appendChild(band);
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1700);
  }
  function katlaScene(from, to) {
    const scr = document.getElementById('gameScreen');
    if (scr) { scr.classList.remove('kz-shake'); void scr.offsetWidth; scr.classList.add('kz-shake'); setTimeout(() => scr.classList.remove('kz-shake'), 500); }
    const f = document.createElement('div');
    f.className = 'katla-fold';
    f.innerHTML = `<span class="kf-dice">🎲</span><span class="kf-old">${from}</span><span class="kf-arrow">→</span><span class="kf-new">${to}</span>`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1700);
  }

  function showJackpot(detailHtml) {
    const s = Game.state, cr = s.coinReport, b = cr.bet;
    document.getElementById('jackpotOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'jackpotOv';
    ov.className = `jp-ov jp-${b.kat > 1 ? 'katla' : b.key}`;
    const title = b.kat > 1 ? t('jpKatla') : b.key === 'olumcul' ? t('jpOlumcul') : t('jpRiskli');
    const sb = s.sideBet && s.sideBet.resolved ? s.sideBet : null;
    const total = (cr.net || 0) + (cr.jokerCoins || 0) + (cr.permCoin || 0) + (cr.interest || 0) + (sb && sb.paid ? sb.paid : 0);
    const rows = [t('jpCoin', b.coinMult)];
    if (b.perm) rows.push(t('jpPerm', b.perm.toFixed(1)));
    if (b.picks) rows.push(t('jpPicks', b.picks));
    if (sb) rows.push(sb.hit ? t('jpSideHit', T.ev(SIDE_NAME(sb.key)), sb.paid) : t('jpSideMiss', T.ev(SIDE_NAME(sb.key))));
    let rain = '';
    for (let i = 0; i < 26; i++)
      rain += `<i class="jp-coin" style="left:${Math.round(Math.random() * 100)}%;animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(1.4 + Math.random()).toFixed(2)}s"></i>`;
    ov.innerHTML =
      `<div class="jp-rain">${rain}</div>` +
      `<div class="jp-box"><div class="jp-title">${title}</div>` +
      `<div class="jp-score">${s.score} / ${s.target}</div>` +
      `<div class="jp-count"><span class="jp-coinico">🪙</span> +<b id="jpNum">0</b></div>` +
      `<div class="jp-rows">${rows.map((x, i) => `<div class="jp-row" style="animation-delay:${0.5 + i * 0.35}s">${x}</div>`).join('')}</div>` +
      `<details class="jp-more"><summary>${t('jpDetails')}</summary><div>${detailHtml}</div></details>` +
      `<button class="ep-btn" id="jpGo">${el.modalBtn.textContent}</button></div>`;
    document.body.appendChild(ov);
    SFX.jackpot();
    const num = ov.querySelector('#jpNum');
    const t0 = performance.now(), dur = 1100;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      num.textContent = Math.round(total * (1 - Math.pow(1 - k, 3)));
      if (k < 1 && document.body.contains(num)) requestAnimationFrame(tick);
      else { num.textContent = total; }
    };
    requestAnimationFrame(tick);
    ov.querySelector('#jpGo').addEventListener('click', () => { ov.remove(); el.modalBtn.click(); });
  }
  const SIDE_NAME = (key) => (typeof SIDE_BETS !== 'undefined' && SIDE_BETS[key] ? SIDE_BETS[key].name : key);

  /* raund başı: Rulet rengi → yan bahis (ikisi de eli görerek) */
  function kumarStartPanels() {
    const s = Game.state;
    if (!s || s.status !== 'playing' || curScreen() !== 'game' || TUT.active) return;
    if (Game.needsRulet && Game.needsRulet()) { showRuletPick(); return; }
    const st = Game.sideBetState && Game.sideBetState();
    if (st && st.offer && st.canAfford) showSideBet();
  }
  function dockOv(id, tone) {
    document.getElementById(id)?.remove();
    const ov = document.createElement('div');
    ov.id = id;
    ov.className = `pk-ov tone-${tone} dock-ov`;
    return ov;
  }
  function showRuletPick() {
    const ov = dockOv('ruletOv', 'gold');
    ov.innerHTML = `<div class="pk-box">` +
      `<div class="pk-title">🎡 ${t('ruletTitle')}</div>` +
      `<div class="pk-sub-title">${t('ruletSub')}</div>` +
      `<div class="pk-body pk-choice">` +
      `<button class="pk-card rl-card rl-red" data-c="red"><div class="pk-ico">🔴</div><div class="pk-name">${t('cRed')}</div></button>` +
      `<button class="pk-card rl-card rl-black" data-c="black"><div class="pk-ico">⚫</div><div class="pk-name">${t('cBlack')}</div></button>` +
      `</div></div>`;
    ov.querySelectorAll('.rl-card').forEach(b => b.addEventListener('click', () => {
      const r = Game.ruletPick(b.dataset.c);
      if (!r.ok) { toast(T.ev(r.error)); return; }
      SFX.chips();
      ov.remove();
      render();
      setTimeout(kumarStartPanels, 150);
    }));
    document.body.appendChild(ov);
  }
  function showSideBet() {
    const st = Game.sideBetState();
    const ov = dockOv('sideOv', 'azure');
    ov.innerHTML = `<div class="pk-box">` +
      `<div class="pk-title">🎲 ${t('sideTitle', st.stake)}</div>` +
      `<div class="pk-sub-title">${t('sideSub')}</div>` +
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><button class="btn ghost" id="sidePass">${t('sidePass')}</button></div></div>`;
    const body = ov.querySelector('.pk-body');
    st.offer.forEach((o, i) => {
      const c = document.createElement('button');
      c.className = 'pk-card side-card';
      c.dataset.side = o.key;
      c.style.animationDelay = `${i * 0.08}s`;
      c.innerHTML = `<div class="pk-name">${T.ev(o.name)}</div>`
        + `<div class="side-odds">${o.odds}:1</div>`
        + `<div class="pk-desc">${t('sidePays', st.stake * (o.odds + 1))}</div>`;
      c.addEventListener('click', () => {
        const r = Game.placeSideBet(o.key);
        if (!r.ok) { toast(T.ev(r.error)); return; }
        SFX.chips();
        ov.remove();
        toast(T.ev(r.note), true);
        render();
      });
      body.appendChild(c);
    });
    ov.querySelector('#sidePass').addEventListener('click', () => { Game.skipSideBet(); ov.remove(); render(); });
    document.body.appendChild(ov);
    Hints.show('yanBahis');
  }

  /* Yüksek mi Alçak mı — raund sonu; `done` akışı sürdürür.
     P64 (kullanıcı: "ilk karşıma çıktığında anlayamadım") — daha anlaşılır:
     teklifte 3 adımlık "nasıl oynanır" kartı + coin MERDİVENİ (gerçek
     miktarlar), oyunda AÇIK TAŞ yanında kapalı "SIRADAKİ" taş, düğmelerde
     tutma ihtimali yüzde olarak, "şimdi çekilirsen / bilirsen" satırı. */
  function showHiLo(done) {
    const ov = document.createElement('div');
    ov.id = 'hiloOv';
    ov.className = 'pk-ov tone-gold hilo-ov';
    document.body.appendChild(ov);
    const hiTile = (tl, cls = '') => {
      const te = tileEl({ id: 'hl-' + Math.random(), color: tl.color, number: tl.number }, false);
      te.classList.add('hl-tile'); if (cls) te.classList.add(cls);
      return te.outerHTML;
    };
    const hm = () => (typeof HILO !== 'undefined' ? HILO.mult : 1.5);
    const pots = (h) => { const out = [h.stake]; for (let k = 0; k < h.max; k++) out.push(Math.round(out[out.length - 1] * hm())); return out; };
    const ladderHtml = (h) => pots(h).map((v, k) => `<span class="hl-rung${k === h.step ? ' on' : ''}${k < h.step ? ' past' : ''}">🪙 ${v}</span>`)
      .join('<i class="hl-arr">→</i>');
    const finish = () => { Game.hiLoClose(); ov.remove(); render(); done(); };
    const draw = (flash) => {
      const h = Game.hiLoState();
      if (!h) { finish(); return; }
      let body = '', foot = '';
      if (h.phase === 'offer') {
        const p = pots(h);
        body = `<div class="hl-win">${t('hiloWinLine', h.stake)}</div>`
          + `<div class="hl-how"><div class="hl-how-t">${t('hiloHowTitle')}</div>`
          + `<ol><li>${t('hiloHow1')}</li><li>${t('hiloHow2')}</li><li>${t('hiloHow3', p[1], p[p.length - 1], h.stake)}</li></ol></div>`
          + `<div class="hl-ladder">${ladderHtml(h)}</div>`;
        foot = `<button class="btn primary" data-a="accept">🎲 ${t('hiloAccept')}</button>`
          + `<button class="btn ghost" data-a="skip">${t('hiloSkip', h.stake)}</button>`;
      } else if (h.phase === 'play' || h.phase === 'undo') {
        const n = h.cur.number, pHi = Math.round(100 * (13 - n) / 13), pLo = Math.round(100 * (n - 1) / 13);
        const next = h.step < h.max ? Math.round(h.pot * hm()) : h.pot;
        body = `<div class="hl-table">`
          + (flash && flash.prev ? `<div class="hl-slot hl-old"><div class="hl-lbl">${t('hiloPrev')}</div>${hiTile(flash.prev, 'hl-prev')}</div>` : '')
          + `<div class="hl-slot"><div class="hl-lbl">${t('hiloOpen')}</div>${hiTile(h.cur)}</div>`
          + (h.phase === 'undo' ? `<div class="hl-slot"><div class="hl-lbl">${t('hiloCame')}</div>${hiTile(h.last, 'hl-bad')}</div>`
            : `<div class="hl-slot"><div class="hl-lbl">${t('hiloNext')}</div><div class="tile hl-tile hl-back">?</div></div>`)
          + `</div>`
          + (flash ? `<div class="hl-flash ${flash.cls}">${flash.text}</div>` : '')
          + `<div class="hl-ladder">${ladderHtml(h)}</div>`
          + (h.phase === 'play' ? `<div class="hl-now">${h.step > 0 ? t('hiloNowCash', h.pot) + ' · ' : ''}${t('hiloIfRight', next)}</div>` : '');
        if (h.phase === 'undo') {
          body += `<div class="hl-text">${t('hiloUndoAsk')}</div>`;
          foot = `<button class="btn primary" data-a="undo">🎰 ${t('hiloUndo')}</button>`
            + `<button class="btn ghost" data-a="lose">${t('hiloAcceptLoss')}</button>`;
        } else {
          foot = `<button class="btn primary hl-hi" data-a="hi">⬆ ${t('hiloHi')}<small>%${pHi}</small></button>`
            + `<button class="btn primary hl-lo" data-a="lo">⬇ ${t('hiloLo')}<small>%${pLo}</small></button>`
            + (h.step > 0 ? `<button class="btn ghost" data-a="cash">💰 ${t('hiloCash', h.pot)}</button>` : '')
            + `<div class="hl-tie">${t('hiloTieNote')}</div>`;
        }
      } else {
        const won = h.phase === 'done';
        body = `<div class="hl-table"><div class="hl-slot">${h.last ? hiTile(h.last, won ? '' : 'hl-bad') : hiTile(h.cur)}</div></div>`
          + `<div class="hl-ladder">${ladderHtml(h)}</div>`
          + `<div class="hl-result ${won ? 'ok' : 'bad'}">${won ? t('hiloWon', h.pot - h.stake) : t('hiloLost', h.stake)}</div>`;
        foot = `<button class="btn primary" data-a="close">${t('okBtn')}</button>`;
      }
      ov.innerHTML = `<div class="pk-box"><div class="pk-title">🃏 ${t('hiloTitle')}</div>`
        + `<div class="hl-body">${body}</div><div class="pk-foot hl-foot">${foot}</div></div>`;
      ov.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => act(b.dataset.a)));
    };
    const act = (a) => {
      if (a === 'accept') { Game.hiLoAccept(); SFX.chips(); draw(); return; }
      if (a === 'skip') { Game.hiLoSkip(); finish(); return; }
      if (a === 'cash') { Game.hiLoCashOut(); SFX.coin(); draw(); return; }
      if (a === 'undo') { Game.hiLoUndo(); SFX.dice(); draw(); return; }
      if (a === 'lose') { Game.hiLoAcceptLoss(); SFX.lose(); draw(); return; }
      if (a === 'close') { finish(); return; }
      if (a === 'hi' || a === 'lo') {
        const prev = { ...Game.hiLoState().cur };
        const r = Game.hiLoGuess(a);
        if (!r.ok) return;
        if (r.win) { SFX.coin(); if (r.done) SFX.jackpot(); }
        else if (!r.canUndo) SFX.lose();
        draw(r.win && !r.done ? { cls: 'ok', prev, text: (r.tie ? t('hiloTieWin') : t('hiloRight')) + ' ' + t('hiloCameN', r.next.number) } : null);
      }
    };
    draw();
    Hints.show('hiLo');
  }

  function showBetPicks(done) {
    const s = Game.state;
    const p = (s.betPicks || [])[0];
    if (!p) { if (done) done(); return; }
    const ov = packOverlay('joker', 'betPickTitle');
    ov.querySelector('.pk-sub-title').textContent = t(p.kind === 'legendary' ? 'betPickSubLeg' : 'betPickSub');
    const body = ov.querySelector('.pk-body');
    body.className = 'pk-body pk-choice';
    ov.querySelector('.pk-foot').innerHTML = `<span class="pk-hint">${t('packChoiceHint')}</span>`;
    p.options.forEach((opt, oi) => {
      const c = document.createElement('button');
      c.className = `pk-card r-${opt.rarity || 'special'}`;
      c.style.animationDelay = `${oi * 0.11}s`;
      c.innerHTML = packFaceHtml(opt) + `<div class="pk-desc">${packFaceDesc(opt)}</div>`;
      c.addEventListener('click', () => {
        if (ov.dataset.done) return;
        ov.dataset.done = '1';
        const r = Game.chooseBetPick(oi);
        if (!r.ok) { toast(r.error); delete ov.dataset.done; return; }
        SFX.coin();
        [...body.children].forEach((el2, i) => el2.classList.add(i === oi ? 'pk-won' : 'pk-lost'));
        notify([packOutLine(r.got)], true, { quiet: true });
        setTimeout(() => {
          ov.remove();
          render();
          if (r.got && !r.got.converted) onJokerGained(r.got.key, r.got.jokerId);
          showBetPicks(done);   // sıradaki ödül (katlama tuttuysa iki seçim)
        }, 780);
      });
      body.appendChild(c);
    });
  }

  /* Store'suz raund geçişi (Kumarhane) — store "Devam" düğmesinin işi */
  function goNextRound() {
    Game.nextRound();
    selection.clear();
    newTileIds.clear();
    if (Game.state.status === 'runComplete' || Game.state.runFinished) { showRunComplete(); return; }
    showScreen('map');
    if (Game.state.roundInStage === 1) showOkeyBanner();
  }

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

  /* P54 · Grup A — ÜÇ KAĞITÇI seçim penceresi. Kuzey Yıldızı kabuğu (pk-*):
     üç KAPALI taş; her birinin altında "Bak" düğmesi (tur başına bir bakış,
     UC_PEEK_COST coin). Bakılan taş yüzünü gösterir. Pencere kapatılamaz —
     seçim bitmeden açılım/atış motorda da kilitlidir. */
  function showUcKagit() {
    const s = Game.state;
    if (!s || !s.ucKagit || s.status !== 'playing' || document.getElementById('ucKagitPop')) return;
    const cost = UC_PEEK_COST;   // engine.js üst düzey sabiti (i18n CHEAT_HILE_MULT ile aynı yol)
    const ov = document.createElement('div');
    ov.id = 'ucKagitPop';
    ov.className = 'pk-ov tone-gold';
    ov.innerHTML =
      `<div class="pk-box yildiz-box uc-box"><h3>${t('ucTitle')}</h3>` +
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><span class="pk-hint">${t('ucHint', cost)}</span></div></div>`;
    const body = ov.querySelector('.pk-body');
    const faces = {};
    const draw = () => {
      body.innerHTML = '';
      const u2 = Game.state.ucKagit;
      [0, 1, 2].forEach((i) => {
        const c = document.createElement('div');
        c.className = 'pk-card yildiz-opt uc-opt';
        const holder = document.createElement('button');
        holder.className = 'yildiz-tile uc-tile';
        const f = faces[i];
        const tile = f ? { id: -100 - i, color: f.color, number: f.number, isOkeyReal: !!f.okey }
          : { id: -100 - i, faceDown: true };
        holder.appendChild(tileEl(tile, false));
        holder.addEventListener('click', () => {
          if (ov.dataset.done) return;
          ov.dataset.done = '1';
          const r = Game.ucKagitTake(i);
          if (!r.ok) { toast(T.ev(r.error)); ov.remove(); render(); return; }
          SFX.draw();
          [...body.children].forEach((el2, k) => el2.classList.add(k === i ? 'pk-won' : 'pk-lost'));
          if (r.took != null) newTileIds = new Set([r.took]);
          notify(r.events, true, { quiet: true });
          setTimeout(() => { ov.remove(); render(); setTimeout(() => newTileIds.clear(), 600); }, 620);
        });
        c.appendChild(holder);
        if (u2 && u2.peek == null) {
          const pb = document.createElement('button');
          pb.className = 'gm-btn uc-peek';
          pb.textContent = t('ucPeekBtn', cost);
          pb.disabled = Game.state.coins < cost;
          pb.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = Game.ucKagitPeek(i);
            if (!r.ok) { toast(T.ev(r.error)); return; }
            faces[i] = r.face;
            render();
            draw();
          });
          c.appendChild(pb);
        } else if (f) {
          const lb = document.createElement('div');
          lb.className = 'uc-peeked';
          lb.textContent = f.okey ? t('ucPeekOkey') : t('ucPeekPlain');
          c.appendChild(lb);
        }
        body.appendChild(c);
      });
    };
    draw();
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
  /* P41 — üç düğmenin işi adlı fonksiyonda: aynı iş jokerin kartına sol
     tıkla da yapılır (jokerActs), iki ayrı kopya yazılmaz. */
  function doParatoner() {
    const set = Game.state && Game.state.paratonerBait != null;
    if (!set && paratonerSel == null) { toast(t('paratonerNeedOne')); return; }
    const r = Game.setParatonerBait(set ? null : paratonerSel);
    if (!r.ok) { toast(r.error); render(); return; }
    toast(r.note, true);
    render();
  }

  /* P34 — "Rüşvet": seçili taşları desteye yollar, yerine yenilerini çeker. */
  function doRusvet() {
    if (!selection.size) { toast(t('rusvetNeedOne')); return; }
    const r = Game.useRusvet([...selection]);
    if (!r.ok) { toast(r.error); render(); return; }
    for (const id of r.gone) selection.delete(id);
    toast(r.note, true);
    SFX.coin();
    render();
  }

  function doTerazi() {
    if (teraziSel == null) { toast(t('teraziNeedOne')); return; }
    const id = teraziSel;
    const r = Game.teraziSacrifice(id);
    if (!r.ok) { toast(r.error); render(); return; }
    selection.delete(id);
    toast(r.note, true);
    SFX.crack();
    render();
  }

  el.btnParatoner.addEventListener('click', doParatoner);
  el.btnRusvet.addEventListener('click', doRusvet);
  el.btnTerazi.addEventListener('click', doTerazi);

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
  /* P60 — İPUCU PENCERESİ. İpuçları eskiden bildirim kartıyla (notify)
     açılıyordu; P37'de bildirim kartları kapatılınca (NOTES_ENABLED=false)
     ipuçları SESSİZCE "görüldü" işaretlenip hiç gösterilmedi. Artık kendi
     penceresi var: paket/bahis seçimiyle aynı pk-ov kalıbı, "Anladım" ile
     kapanır, aynı anda gelen ipuçları sıraya girer. */
  const hintQueue = [];
  function showHintCard(key) {
    if (document.getElementById('hintOv')) { if (!hintQueue.includes(key)) hintQueue.push(key); return; }
    const ov = document.createElement('div');
    ov.id = 'hintOv';
    ov.className = 'pk-ov tone-gold hint-ov';
    ov.dataset.hint = key;
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">💡 ${t('hintTitle')}</div>` +
      `<div class="hint-body">${t('hint_' + key)}</div>` +
      `<div class="pk-foot"><button class="btn primary" id="hintOk">${t('hintOk')}</button></div></div>`;
    const close = () => {
      ov.remove();
      const next = hintQueue.shift();
      if (next) setTimeout(() => showHintCard(next), 120);
    };
    ov.querySelector('#hintOk').addEventListener('click', close);
    document.body.appendChild(ov);
  }
  const Hints = {
    /* Otomasyon tarayıcısında (playwright: navigator.webdriver) kapalı — yoksa
       ilk store/bahis ipucu eski testlerin tıklamalarını keser. İpucu testi
       (browser_p60) `__test.Hints.enabled = true` ile açar. */
    enabled: !(typeof navigator !== 'undefined' && navigator.webdriver),
    _cache: null,
    _read() {
      if (this._cache) return this._cache;
      try { this._cache = new Set(JSON.parse(localStorage.getItem(HINTS_KEY) || '[]')); }
      catch (e) { this._cache = new Set(); }
      return this._cache;
    },
    seen(key) { return this._read().has(key); },
    /* Bir ipucunu bir kez göster. `key` i18n'de `hint_<key>` olarak durur. */
    show(key) {
      if (!this.enabled || Game.trainerMode || TUT.active) return false;
      const set = this._read();
      if (set.has(key)) return false;
      set.add(key);
      try { localStorage.setItem(HINTS_KEY, JSON.stringify([...set])); } catch (e) {}
      showHintCard(key);
      return true;
    },
    /* Ayarlardan "ipuçlarını sıfırla" için (ileride bağlanabilir). */
    reset() { this._cache = null; try { localStorage.removeItem(HINTS_KEY); } catch (e) {} },
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

  /* ============================================================
     P62 (kullanıcı isteği 2026-10-04, Balatro "New Run / Continue" örnekleri)
     — RUN SEÇİM EKRANI. OYNA artık tek bir panel açar:
       · sekmeler: Yeni Run · Devam Et (kayıt yoksa kapalı)
       · Yeni Run: oklu mod karuseli + sayfa noktaları; 6 sayfa — Temel ve
         Kumarhane açık, kalan 4 mod KİLİTLİ "Çok yakında" (6 mod hedefi;
         adları/kuralları henüz tasarlanmadı, bu yüzden "???")
       · Devam Et: kayıtlı run'ın özeti (mod, stage, raund, coin, en iyi
         açılım, kalıcı çarpan, nerede bırakıldı) + DEVAM ET
     Görsel dil: oyun sonu panelleriyle aynı (ep-ov / ep-box, tema renkleri,
     piksel başlık). Açık mod kartı `.mp-card[data-mode]` sınıfını taşır;
     karta tıklamak yalnız SEÇER, oyunu OYNA başlatır.
     Klavye: ←/→ mod değiştirir, Enter oynar / devam eder, Esc kapatır.
     ============================================================ */
  const RUN_PAGES = [
    /* Figma 241:970 / 245:101 (kullanıcı 2026-10-04) — mod ikonları. Görsel yolu
       JS'e YAZILMAZ: tek dosyalık derleyici yalnız CSS'teki sabit url(...)'leri
       gömebilir → `.rp-art-img.mode-<key>` (style.css). */
    { key: 'base', ico: '🀄', img: true },
    { key: 'hizli', ico: '🎰', img: true },
    { key: 'soon3', soon: true }, { key: 'soon4', soon: true },
    { key: 'soon5', soon: true }, { key: 'soon6', soon: true },
  ];
  let runPickIdx = 0;
  function showRunPick(opts = {}) {
    document.getElementById('runPickOv')?.remove();
    document.getElementById('modePickOv')?.remove();
    const save = 'save' in opts ? opts.save : loadSave();
    const onPick = opts.onPick || ((m) => startNewRun(m));
    let tab = opts.tab || (save ? 'cont' : 'new');
    let sv = null;
    try { sv = save ? JSON.parse(save.data) : null; } catch (e) { sv = null; }
    const ov = document.createElement('div');
    ov.id = 'runPickOv';
    ov.className = 'ep-ov rp-ov';
    document.body.appendChild(ov);
    const onKey = (e) => {
      if (!document.body.contains(ov)) { document.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft' && tab === 'new') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight' && tab === 'new') { e.preventDefault(); go(1); }
      else if (e.key === 'Enter') { e.preventDefault(); ov.querySelector('#rpGo:not([disabled])')?.click(); }
    };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    const isOpen = (p) => !p.soon && Modes.unlocked(p.key);
    const go = (d) => { runPickIdx = (runPickIdx + d + RUN_PAGES.length) % RUN_PAGES.length; draw(); };
    const play = (key) => { close(); onPick(key); };
    const cont = () => {
      close();
      resumeSave(save);
      toast(t(save.where === 'inRound' ? 'roundRestartToast' : 'resumedToast'), true);
    };
    const slide = (p, i) => {
      const open = isOpen(p);
      const name = p.soon ? t('rpSoonName') : t('rpName_' + p.key);
      const desc = p.soon ? t('rpSoonDesc') : (open ? t('rpDesc_' + p.key) : t('modeLockedTip'));
      return `<div class="rp-slide${i === runPickIdx ? ' on' : ''}${open ? ' mp-card' : ' rp-locked'}"`
        + (open ? ` data-mode="${p.key}"` : '') + ` data-i="${i}">`
        + (p.img ? `<div class="rp-art rp-art-img mode-${p.key}">`
          : `<div class="rp-art${p.soon ? ' rp-art-soon' : ''}"><span>${p.soon ? '?' : p.ico}</span>`)
        + (p.soon || !open ? `<i class="rp-lock">🔒</i>` : '') + `</div>`
        + `<div class="rp-info"><div class="rp-name">${name}</div>`
        + (p.soon ? `<div class="rp-ribbon">${t('rpSoon')}</div>` : '')
        + `<div class="rp-desc">${desc}`
        + (!p.soon ? `<div class="rp-stats">${t('rpStats_' + p.key)}</div>` : '') + `</div></div>`
        + `</div>`;
    };
    const draw = () => {
      const p = RUN_PAGES[runPickIdx];
      const tabs = `<div class="rp-tabs">`
        + `<button class="rp-tab${tab === 'new' ? ' on' : ''}" data-tab="new">${t('rpNew')}</button>`
        + `<button class="rp-tab${tab === 'cont' ? ' on' : ''}" data-tab="cont"${sv ? '' : ' disabled'}>${t('rpCont')}</button>`
        + `</div>`;
      let body = '', foot = '';
      if (tab === 'new') {
        body = `<div class="rp-carousel"><button class="rp-arrow" data-d="-1" aria-label="‹">‹</button>`
          + `<div class="rp-stage">${RUN_PAGES.map(slide).join('')}</div>`
          + `<button class="rp-arrow" data-d="1" aria-label="›">›</button></div>`
          + `<div class="rp-dots">${RUN_PAGES.map((q, i) => `<i class="${i === runPickIdx ? 'on' : ''}${q.soon ? ' soon' : ''}" data-i="${i}"></i>`).join('')}</div>`;
        foot = `<button class="ep-btn rp-go" id="rpGo"${isOpen(p) ? '' : ' disabled'}>${p.soon ? t('rpSoon') : t('rpPlay')}</button>`
          + (sv && isOpen(p) ? `<div class="ep-note rp-warn">${t('rpOverwrite')}</div>` : '');
      } else {
        const mode = sv.runMode || 'base';
        const pg = RUN_PAGES.find(q => q.key === mode) || RUN_PAGES[0];
        const total = (typeof RUN_MODES !== 'undefined' && RUN_MODES[mode]) ? RUN_MODES[mode].stages : 8;
        const where = save.where === 'inStore' ? 'inStore' : save.where === 'inRound' ? 'inRound' : 'map';
        body = `<div class="rp-slide on rp-cont">` + (pg.img ? `<div class="rp-art rp-art-img mode-${pg.key}"></div>` : `<div class="rp-art"><span>${pg.ico || '🀄'}</span></div>`)
          + `<div class="rp-info"><div class="rp-name">${t('rpName_' + mode)}</div>`
          + `<div class="rp-desc rp-sum">`
          + `<div><span>${t('rpStage')}</span><b>${sv.stage}/${total}</b></div>`
          + `<div><span>${t('rpRound')}</span><b>${sv.roundInStage}/3</b></div>`
          + `<div><span>${t('rpCoins')}</span><b class="c-orange">${sv.coins}</b></div>`
          + `<div><span>${t('rpBest')}</span><b class="c-red">${sv.statBestMeld || 0}</b></div>`
          + `<div><span>${t('rpMult')}</span><b class="c-green">+${Number(sv.permMult || 0).toFixed(1)}x</b></div>`
          + `</div></div></div>`
          + `<div class="rp-where">${t('rpWhere_' + where)}</div>`;
        foot = `<button class="ep-btn rp-go" id="rpGo">${t('rpContinueBtn')}</button>`;
      }
      ov.innerHTML = `<div class="ep-box rp-box"><div class="rp-plate">${t('modePickTitle')}</div>${tabs}<div class="rp-body">${body}</div>`
        + `<div class="rp-foot">${foot}<button class="ep-btn ep-ghost rp-back" id="rpBack">${t('rpBack')}</button></div></div>`;
      ov.querySelectorAll('.rp-tab').forEach(b => b.addEventListener('click', () => { if (!b.disabled) { tab = b.dataset.tab; draw(); } }));
      ov.querySelectorAll('.rp-arrow').forEach(b => b.addEventListener('click', () => go(+b.dataset.d)));
      ov.querySelectorAll('.rp-dots i').forEach(b => b.addEventListener('click', () => { runPickIdx = +b.dataset.i; draw(); }));
      /* kullanıcı (2026-10-04): karta/açıklamaya tıklamak oyunu BAŞLATMAZ — yalnız seçer; başlatan OYNA */
      ov.querySelectorAll('.rp-slide.mp-card').forEach(b => b.addEventListener('click', () => { runPickIdx = +b.dataset.i; draw(); }));
      ov.querySelector('#rpBack').addEventListener('click', close);
      const goBtn = ov.querySelector('#rpGo');
      if (goBtn) goBtn.addEventListener('click', () => {
        if (goBtn.disabled) return;
        if (tab === 'cont') cont(); else play(RUN_PAGES[runPickIdx].key);
      });
    };
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    draw();
  }
  /* eski çağrı yeri: yalnız Yeni Run sekmesiyle açar */
  function pickRunMode(onPick) { showRunPick({ tab: 'new', onPick, save: null }); }

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
  /* ============================================================
     P59 (kullanıcı isteği 2026-10-02, "Piece Wheels" örneği) — SLOT MAKİNESİ
     Paket çarkı ve açılış çarkı aynı makarayı kullanır:
       · pencere 3 sembol gösterir — üst/alt soluk, ORTADAKİ kazanan, iki
         yanda içe bakan oklar;
       · altta işleyen "STOP !!" düğmesi: basınca makaralar hemen durur.
     Kazanan motorun verdiği şeridin SON sembolüdür; pencere ortasına
     oturması için sonuna bir dolgu sembolü eklenir ve şerit (hücre − 3)
     kaydırılır (üstte bir önceki sembol, ortada kazanan, altta dolgu).
     ============================================================ */
  function buildReel(reel) {
    const wrap = document.createElement('div');
    wrap.className = 'pk-reel';
    const strip = document.createElement('div');
    strip.className = 'pk-strip';
    const cell = (sym) => {
      const c = document.createElement('div');
      c.className = `pk-sym r-${sym.rarity || 'special'}`;
      c.innerHTML = packFaceHtml(sym);
      return c;
    };
    reel.forEach(sym => strip.appendChild(cell(sym)));
    /* P63: makara SÜREKLİ döner → şeridin ilk 3 sembolü sona tekrar eklenir,
       sarma noktasında pencere boş kalmaz */
    reel.slice(0, 3).forEach(sym => strip.appendChild(cell(sym)));
    wrap.appendChild(strip);
    wrap.insertAdjacentHTML('beforeend', '<div class="pk-reel-line"></div>'
      + '<i class="pk-arrow pk-arrow-l"></i><i class="pk-arrow pk-arrow-r"></i>'
      + `<div class="pk-stop">${t('packSlotStop')}</div>`);
    return wrap;
  }

  /* ============================================================
     P63 — ETKİLİ STOP: SÜREKLİ DÖNEN MAKARA (kullanıcı kararı 2026-10-04,
     "kaymalı zamanlama"). Makara şeridi durmadan döner; STOP'a basınca
     frene basılır ve 1-3 sembol daha kayar (rastgele) — ORTA çizgide duran
     sembol motora bildirilir (`pick`), motor onu verir. Basılmazsa her
     makara eskisi gibi kendi süresinde yavaşlar ve ÖNCEDEN seçilen ödülde
     (şeridin son elemanı) durur; o yol motora hiç uğramaz.
     items: [{ strip, n, mid, cellH(), pick(sym) → motorun kabul ettiği sıra }]
     dönüş: stop() — dönen bütün makaraları kaymalı durdurur
     ============================================================ */
  function loopReels(items, { onDone, onLand, auto = (i) => 1.5 + i * 0.6, speed = 8.5 } = {}) {
    const st = items.map((it, i) => ({ ...it, i, p: 0, v: speed + i * 0.7, mode: 'spin' }));
    let left = st.length, done = false, last = performance.now();
    const mod = (x, n) => ((x % n) + n) % n;
    const draw = (r) => { r.strip.style.transform = `translateY(${-mod(r.p, r.n) * r.cellH()}px)`; };
    const land = (r) => {
      r.mode = 'landed';
      const cells = r.strip.children;
      for (const c of cells) c.classList.remove('hit');
      const hitIdx = Math.round(mod(r.p, r.n)) + r.mid;
      if (cells[hitIdx]) cells[hitIdx].classList.add('hit');
      r.strip.parentElement.classList.add('landed');
      SFX.coin();
      if (onLand) onLand(r.i, r.landed);
      if (--left === 0 && !done) { done = true; if (onDone) onDone(); }
    };
    /* üst hücre T öyle seçilir ki (T + mid) mod n = sym ve T >= p + ileri */
    const brake = (r, sym, ahead, maxMs = 1000) => {
      let T = Math.ceil(r.p + ahead - 1e-6);
      while (mod(T + r.mid, r.n) !== sym) T++;
      r.from = r.p; r.to = T; r.t0 = performance.now();
      r.dur = Math.min(maxMs, Math.max(320, (T - r.p) / r.v * 1700));
      r.mode = 'brake';
    };
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (const r of st) {
        if (r.mode === 'spin') {
          const before = Math.floor(r.p);
          r.p += r.v * dt;
          if (Math.floor(r.p) !== before && r.i === 0) SFX.tick();
        } else if (r.mode === 'brake') {
          const k = Math.min(1, (now - r.t0) / r.dur);
          const e = 1 - Math.pow(1 - k, 3);
          const before = Math.floor(r.p);
          r.p = r.from + (r.to - r.from) * e;
          if (Math.floor(r.p) !== before) SFX.tick();
          if (k >= 1) { r.p = r.to; draw(r); land(r); continue; }
        }
        if (r.mode !== 'landed') draw(r);
      }
      if (left > 0) requestAnimationFrame(frame);
    };
    st.forEach((r) => {
      draw(r);
      r.timer = setTimeout(() => {
        if (r.mode !== 'spin') return;
        r.landed = r.n - 1;            // basılmadı → önceden seçilen ödül
        brake(r, r.n - 1, 3);
      }, auto(r.i) * 1000);
    });
    requestAnimationFrame(frame);
    return function stop() {
      for (const r of st) {
        if (r.mode !== 'spin') continue;
        clearTimeout(r.timer);
        const slip = 1 + Math.floor(Math.random() * 3);   // fren: 1-3 sembol kayar
        const cur = Math.floor(r.p);
        let sym = mod(cur + slip + r.mid, r.n);
        const res = r.pick ? r.pick(sym) : sym;
        if (Number.isInteger(res)) sym = res;               // motorun kabul ettiği
        r.landed = sym;
        brake(r, sym, cur + slip - r.p);
      }
    };
  }
  /* pk makaraları (açılış + paket): pencere 3 sembol, ORTA kazanan */
  function pkItems(stripEls, pick) {
    return stripEls.map((strip, i) => ({
      strip, n: strip.children.length - 3, mid: 1,
      cellH: () => strip.firstElementChild.offsetHeight || 84,
      pick: pick ? (sym) => pick(i, sym) : null,
    }));
  }

  /* "STOP !!" düğmesi — çarklar dururken basılır, sonra kaybolur */
  function stopButton(foot, stop) {
    foot.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'pk-stop-btn';
    b.textContent = t('slotStopBtn');
    b.addEventListener('click', () => { b.disabled = true; stop(); });
    foot.appendChild(b);
  }

  function showOpeningReel(list, reels, done) {
    const strips = (reels && reels.length === list.length) ? reels : list.map(j => [j]);
    const ov = document.createElement('div');
    ov.id = 'packOv';
    ov.className = 'pk-ov tone-azure open-reel slot-ov';
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">🎰 ${t('openReelTitle')}</div>` +
      `<div class="pk-sub-title">${t('openReelBody', list.length)}</div>` +
      `<div class="pk-body pk-slot"></div>` +
      `<div class="pk-foot"><span class="pk-hint">${t('packSlotSpin')}</span></div></div>`;
    document.body.appendChild(ov);
    const body = ov.querySelector('.pk-body');
    const foot = ov.querySelector('.pk-foot');
    const els = strips.map((reel) => {
      const wrap = buildReel(reel);
      body.appendChild(wrap);
      return wrap.querySelector('.pk-strip');
    });
    /* P63: STOP basıldığında orta çizgideki joker motorda değiştirilir */
    const canPick = !!(reels && reels.length === list.length && Game.reelStop);
    const pick = canPick ? (i, sym) => {
      const r = Game.reelStop('opening', i, sym);
      if (r && r.ok && r.got) { list[i] = r.got; return r.landed; }
      return null;
    } : null;
    stopButton(foot, loopReels(pkItems(els, pick), { onDone: finish }));
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

  /* P62 — OYNA: tek panel (Yeni Run / Devam Et). Eskiden kayıt store'da ya da
     raund içindeyse SORMADAN devam ediyor, raund arasındaysa ayrı bir beyaz
     kutu açıyordu; artık her durumda aynı ekran — kayıt varsa Devam Et
     sekmesi açık gelir. */
  el.btnPlay.addEventListener('click', () => showRunPick());

  /* GRUP I (2026-09-07): haritadaki "Ana Menü" düğmesi kaldırıldı —
     tasarımda yok. Ana menüye artık haritanın DURAKLAT düğmesindeki
     menüden gidilir; menü oyun ekranındakinin birebir eşi. Ses ayarları
     P67'den beri yalnız Ayarlar penceresinde. */
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
  el.btnMapInfo.addEventListener('click', showRunInfo);
  /* P65 — store sahnesinin duraklat/bilgi düğmeleri haritadakinin eşi */
  {
    const pop = $('storeMenuPop');
    $('btnStorePause').addEventListener('click', (e) => {
      e.stopPropagation();
      pop.classList.toggle('hidden');
      pop.querySelectorAll('.btn').forEach(b => fitText(b, PAUSE_BASE, PAUSE_MIN, true));
    });
    document.addEventListener('click', (e) => { if (!pop.contains(e.target)) pop.classList.add('hidden'); });
    $('btnStoreGoMenu').addEventListener('click', () => {
      pop.classList.add('hidden');
      el.storeOverlay.classList.add('hidden');
      Game.trainerMode = false;
      showScreen('menu');
    });
    $('btnStoreSettings').addEventListener('click', () => { pop.classList.add('hidden'); showSettings(); });
    $('btnStoreInfo').addEventListener('click', showRunInfo);
    const deck = document.querySelector('#storePileCol .deck-pile');
    deck.addEventListener('click', () => showPilePopup('deck'));
    deck.style.cursor = 'pointer';
    /* P67 — envanter panelleri her zaman açık (sol sütun altı / sağ sütun); aç/kapa sekmesi yok */
  }
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
    applyRunTheme();
  }

  /* P68 — KUMARHANE TEMASI (kullanıcı 2026-10-05): normal dört tema aynen
     kalır; Ayarlar → Kumarhane Teması açıkken (varsayılan açık) Kumarhane
     run'ının oyun/harita/store/pencereleri Klasik Vegas temasına geçer. Ana
     menü ve normal run'lar her zaman kullanıcının seçtiği temada. */
  const CASINO_THEME_KEY = 'okeyCasinoTheme';
  let casinoThemeOn = (() => { try { return localStorage.getItem(CASINO_THEME_KEY) !== '0'; } catch (e) { return true; } })();
  function casinoRunActive() {
    try { return curScreen() !== 'menu' && !!Game.state && !!Game.kumarhaneOn && Game.kumarhaneOn(); } catch (e) { return false; }
  }
  function applyRunTheme() {
    let key;
    try { key = casinoThemeOn && casinoRunActive() ? 'kumarhane' : themeKey; }
    catch (e) { return; }   // modül kurulumu bitmeden çağrıldıysa (TDZ)
    const root = document.documentElement;
    if (key === 'yesil') delete root.dataset.theme;
    else root.dataset.theme = key;
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
      /* P68 — Kumarhane run'ına özel tema */
      `<div class="set-row"><span class="set-label">${t('casinoThemeLabel')}</span>` +
      `<div class="set-langs">` +
      `<button class="set-lang set-casino${casinoThemeOn ? ' on' : ''}" data-casino="1">🎰 ${t('musicOn')}</button>` +
      `<button class="set-lang set-casino${casinoThemeOn ? '' : ' on'}" data-casino="0">${t('musicOff')}</button>` +
      `</div></div>` +
      /* P67 — ses efektleri (düğme/taş sesleri): aç/kapa + seviye */
      `<div class="set-row"><span class="set-label">${t('sfxSetLabel')}</span>` +
      `<div class="set-langs set-music"><button class="set-lang${sfxOn ? ' on' : ''}" id="setSfxOn">` +
      `${sfxOn ? '🔊 ' + t('musicOn') : '🔇 ' + t('musicOff')}</button>` +
      `<input type="range" id="setSfxVol" min="0" max="100" step="5" value="${sfxVol}" aria-label="${t('sfxSetLabel')}">` +
      `<b id="setSfxPct">${sfxVol}%</b></div></div>` +
      /* P66 — müzik: aç/kapa + ses seviyesi */
      `<div class="set-row"><span class="set-label">${t('musicLabel')}</span>` +
      `<div class="set-langs set-music"><button class="set-lang${Music.on ? ' on' : ''}" id="setMusicOn">` +
      `${Music.on ? '🔊 ' + t('musicOn') : '🔇 ' + t('musicOff')}</button>` +
      `<input type="range" id="setMusicVol" min="0" max="100" step="5" value="${Music.vol}" aria-label="${t('musicLabel')}">` +
      `<b id="setMusicPct">${Music.vol}%</b></div></div>` +
      `<div class="set-row"><span class="set-label">${t('musicSetLabel')}</span>` +
      `<div class="set-langs">` +
      [1, 2, 3].map(n => `<button class="set-lang set-mset${Music.set === n ? ' on' : ''}" data-mset="${n}">♪ ${t('musicSet' + n)}</button>`).join('') +
      `</div></div>` +
      /* P60/P61 — ilk kez ipuçlarını yeniden göster */
      `<div class="set-row"><span class="set-label">${t('hintsLabel')}</span>` +
      `<div class="set-langs"><button class="set-lang" id="setHintsReset">↺ ${t('hintsReset')}</button></div></div>` +
      `<button class="btn ghost" id="setClose">${t('close')}</button></div>`;
    document.body.appendChild(ov);
    ov.querySelector('#setHintsReset').addEventListener('click', () => { Hints.reset(); toast(t('hintsResetDone'), true); });
    const sOn = ov.querySelector('#setSfxOn'), sVol = ov.querySelector('#setSfxVol');
    const sfxBtn = () => { sOn.classList.toggle('on', sfxOn); sOn.textContent = sfxOn ? '🔊 ' + t('musicOn') : '🔇 ' + t('musicOff'); };
    sOn.addEventListener('click', () => {
      sfxOn = !sfxOn;
      localStorage.setItem('okeySfx', sfxOn ? '1' : '0');
      sfxBtn();
      if (sfxOn) SFX.tick();
    });
    sVol.addEventListener('input', () => {
      sfxVol = Math.max(0, Math.min(100, +sVol.value || 0));
      localStorage.setItem('okeySfxVol', String(sfxVol));
      ov.querySelector('#setSfxPct').textContent = sfxVol + '%';
      if (!sfxOn && sfxVol > 0) { sfxOn = true; localStorage.setItem('okeySfx', '1'); sfxBtn(); }
    });
    sVol.addEventListener('change', () => SFX.tick());   // bırakınca örnek ses
    const mOn = ov.querySelector('#setMusicOn'), mVol = ov.querySelector('#setMusicVol');
    mOn.addEventListener('click', () => {
      Music.setOn(!Music.on);
      mOn.classList.toggle('on', Music.on);
      mOn.textContent = Music.on ? '🔊 ' + t('musicOn') : '🔇 ' + t('musicOff');
    });
    ov.querySelectorAll('.set-mset').forEach(b => b.addEventListener('click', () => {
      Music.setSet(b.dataset.mset);
      ov.querySelectorAll('.set-mset').forEach(x => x.classList.toggle('on', x === b));
      mOn.classList.toggle('on', Music.on);
      mOn.textContent = Music.on ? '🔊 ' + t('musicOn') : '🔇 ' + t('musicOff');
      toast(t('musicPreview', t('musicSet' + Music.set)), true);
    }));
    mVol.addEventListener('input', () => {
      Music.setVol(mVol.value);
      ov.querySelector('#setMusicPct').textContent = Music.vol + '%';
      if (!Music.on && Music.vol > 0) mOn.click();     // sürgüyü oynatan müziği duymak ister
    });
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#setClose').addEventListener('click', () => ov.remove());
    ov.querySelectorAll('.set-lang[data-lang]').forEach(b => b.addEventListener('click', () => {
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
    ov.querySelectorAll('.set-casino').forEach(b => b.addEventListener('click', () => {
      casinoThemeOn = b.dataset.casino === '1';
      try { localStorage.setItem(CASINO_THEME_KEY, casinoThemeOn ? '1' : '0'); } catch (e) {}
      ov.querySelectorAll('.set-casino').forEach(x => x.classList.toggle('on', x === b));
      applyRunTheme();
      toast(t(casinoThemeOn ? 'casinoThemeOnToast' : 'casinoThemeOffToast'), true);
    }));
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
    // Grup E: dil değişince etiket uzunluğu da değişir → yeniden ölç
    fitPauseMenu();
    $('storeTitle').textContent = t('storeTitle');
    /* P65 — store sahnesi haritanın tuvalinde: aynı anahtarlar */
    $('storeSign1').textContent = t('storeSign1');
    $('storeSign2').textContent = t('storeSign2');
    $('lblStoreScoreBox').innerHTML = t('scoreBoxLbl');
    $('lblStoreStageBox').textContent = t('stageBoxLbl');
    $('lblStoreRoundBox').textContent = t('roundBoxLbl');
    $('lblStoreOkeyBox').innerHTML = t('mapOkeyBoxLbl');
    $('btnStoreGoMenu').textContent = t('pauseMainMenu');
    $('btnStoreSettings').textContent = t('pauseSettings');
    $('ssSlotsTitle').textContent = t('storeSlotsTitle');
    $('ssBackupTitle').textContent = t('backupTitle').toLowerCase();
    $('ssConsumTitle').textContent = t('totemTitle');
    el.btnStoreContinue.innerHTML = `<b>${t('stNext')}</b>`;
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
    el.overlay.classList.remove('rw-open');

    if (won) {
      const over = s.score - s.target;
      const pct = Math.round((over / s.target) * 100);
      const cr = s.coinReport;
      /* P65 (kullanıcı: "çok karışık, ilk görünce bu ne be diyorsun") —
         ortalanmış yazı yığını yerine üç net blok:
           1) iki kutu: SKOR (hedef + aşım yüzdesi) · TUR (kaçıncı turda bitti)
           2) COIN FİŞİ: solda kalem, sağda tutar, altta büyük TOPLAM
           3) varsa küçük notlar (Kaptan, boss ödülü, joker notları)
         Tutarlar motorun coinReport'undan aynen gelir; hesap değişmedi. */
      const row = (lbl, v, cls = '') => `<div class="rw-row ${cls}"><span>${lbl}</span><b>${v}</b></div>`;
      const sg = (n) => (n < 0 ? `−${-n}` : `+${n}`);
      let rows = '';
      let total = 0;
      if (cr.survived) {
        rows += row(t('kaptanSaved'), sg(cr.net));
        total += cr.net;
      } else {
        rows += row(t('rwBase', s.wonOnTurn, cr.boss), sg(cr.base));
        if (cr.bonus) rows += row(t('rwBonus', pct), sg(cr.bonus));
        if (cr.penalty > 0) rows += row(t('rwPenalty', cr.penalty), sg(-cr.penalty), 'rw-neg');
        total += cr.net;
      }
      if (cr.jokerCoins > 0) { rows += row(t('rwJoker'), sg(cr.jokerCoins)); total += cr.jokerCoins; }
      if (cr.permCoin > 0) { rows += row(t('rwPerm'), sg(cr.permCoin)); total += cr.permCoin; }
      // MADDE E1 — faiz (raund gelirinden SONRA, cebindeki toplam üzerinden)
      if (cr.interest > 0) { rows += row(t('rwInterest'), sg(cr.interest)); total += cr.interest; }
      /* MADDE D5 — raund sonuna bağlı ipuçları. Modal kapanınca görünsünler
         diye bir sonraki tik'e ertelenir; aksi hâlde kartlar modalın
         ARKASINDA açılır ve oyuncu hiç görmez. */
      setTimeout(() => {
        if (cr.interest > 0 && Hints.show('interest')) return;
        if ((s.lastExpired || []).length && Hints.show('expired')) return;
        if (s.jokers.length && Hints.show('jokerAge')) return;
      }, 60);
      const notes = [];
      if (cr.savedBy) notes.push(t('savedBy', T.ev(cr.savedBy)));
      if (cr.epicReward) {
        const p = cr.epicReward.placed;
        notes.push(`<b>${t('epicReward', T.ev(cr.epicReward.name))}</b> ` +
          (p === 'slot' ? t('placedSlot') : p === 'backup' ? t('placedBackup')
            : p === 'deck' ? t('placedDeck') : t('placedSold')));
      }
      if (cr.extraNotes && cr.extraNotes.length) notes.push(...T.evAll(cr.extraNotes));
      const coinHtml =
        `<div class="rw-receipt"><div class="rw-rh">${t('rwCoins')}</div>${rows}` +
        `<div class="rw-total"><span>${t('rwTotal')}</span><b>${total < 0 ? '−' : '+'}$${Math.abs(total)}</b></div></div>` +
        `<div class="rw-foot"><span class="rw-wallet">${t('rwWallet', s.coins)}</span>` +
        (s.permMult > 0 ? `<span class="rw-chip">${t('rwPermMult', s.permMult.toFixed(1))}</span>` : '') + `</div>` +
        (notes.length ? `<div class="rw-notes">${notes.map(n => `<div>${n}</div>`).join('')}</div>` : '');
      const heroHtml =
        `<div class="rw-hero">` +
          `<div class="rw-box rw-score"><div class="rw-bh">${t('rwScore')}</div>` +
            `<div class="rw-big">${s.score}</div><div class="rw-sub">${t('rwTargetLine', s.target, pct)}</div></div>` +
          `<div class="rw-box rw-turn"><div class="rw-bh">${t('rwTurn')}</div>` +
            `<div class="rw-big">${s.wonOnTurn}.</div><div class="rw-sub">${t('rwTurnSub')}</div></div>` +
        `</div>`;
      el.modalBody.innerHTML = `<div class="rw">${heroHtml}${coinHtml}</div>`;
      el.overlay.classList.add('rw-open');
      // P59 · Kumarhane: raund arası store yok → düğme "Devam" der
      el.modalBtn.textContent = (Game.kumarhaneOn && Game.kumarhaneOn() && !s.store && !s.upgradeOffer && !s.runFinished)
        ? t('okBtn') : t('goStore');
      /* P61 — Riskli / Ölümcül / Katla kazancı: beyaz kutu yerine JACKPOT
         (ayrıntılar "Ayrıntılar" altında aynen durur) */
      const jb = cr.bet;
      if (jb && !cr.survived && !TUT.active && (jb.key !== 'guvenli' || jb.kat > 1)) {
        el.modalBody.innerHTML = '';
        showJackpot(`<div class="rw">${heroHtml}${coinHtml}</div>`);
        return;
      }
    } else if (!TUT.active) {
      /* P59 — Game Over artık ayrı, Balatro tarzı panel (showGameOver) */
      showGameOver();
      return;
    } else {
      clearSave(); // run bitti — devam edilecek bir şey kalmadı
      // Grup F: hedefe ulaşsan bile kaybettiren boss şartları neden kaybettiğini söylesin
      el.modalBody.innerHTML =
        (s.bossFail ? `<div class="boss-fail"><b>${t('bossFailTitle')}</b><br>${T.ev(s.bossFail)}</div>` : '') +
        /* P59 · Kumarhane — Katla ya hep ya hiç: neden kaybettiğini söyle */
        (!s.bossFail && s.katla ? `<div class="boss-fail"><b>${t('katlaLostTitle')}</b><br>${t('katlaLostBody', s.katla.base, s.target)}</div>` : '') +
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
    el.overlay.classList.remove('rw-open');
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
      const after = () => {
        /* Grup M — son stage'in boss'u geçildiyse run BURADA biter:
           güçlendirme ekranı da store da açılmaz, doğrudan zafer ekranı. */
        if (s.runFinished) { showRunComplete(); return; }
        // Grup H: boss geçildiyse zafer ekranından SONRA ayrı güçlendirme adımı
        if (s.upgradeOffer) { showUpgradeScene(); return; }
        /* P58 · Kumarhane — raund arası store yok: doğrudan haritaya */
        if (!s.store && Game.kumarhaneOn && Game.kumarhaneOn()) { goNextRound(); return; }
        openStore();
      };
      /* P58 · Kumarhane — bahis ödülü (3 jokerden 1'i) önce alınır */
      const afterHiLo = () => {
        if ((s.betPicks || []).length) { showBetPicks(after); return; }
        after();
      };
      /* P61 — raund coini için Yüksek mi Alçak mı (isteğe bağlı) */
      if (s.hiLo && s.hiLo.phase === 'offer' && !TUT.active) { showHiLo(afterHiLo); return; }
      afterHiLo();
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
    ov.classList.add('slot-ov');
    const body = ov.querySelector('.pk-body');
    body.className = 'pk-body pk-slot';
    const foot = ov.querySelector('.pk-foot');
    // dönüş: her çark biraz daha geç durur (2 çarkta sıralı "tak…tak" hissi)
    const strips = res.reels.map((reel) => {
      const wrap = buildReel(reel);
      body.appendChild(wrap);
      return wrap.querySelector('.pk-strip');
    });
    const pick = (Game.reelStop && res.index != null) ? (i, sym) => {
      const r = Game.reelStop('pack', res.index, i, sym);
      if (r && r.ok && r.got) { res.contents[i] = r.got; return r.landed; }
      return null;
    } : null;
    stopButton(foot, loopReels(pkItems(strips, pick), { onDone: finish }));
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
    /* P65 — haritanın sol sütunu, $ kutusu, joker paneli ve destesiyle
       BİREBİR aynı içerik (bkz. renderMap). Kalıcı çarpan satırı haritada
       olduğu gibi burada da yok — Figma taslağında yer almıyor. */
    $('storeCoinVal').textContent = String(s.coins);
    $('storeStageVal').textContent = `${s.stage}/${chCount()}`;
    el.ssRound.textContent = `${s.roundInStage}/3`;
    $('storeScoreVal').textContent = String(s.score ?? 0);
    const okBox = $('storeOkey');
    okBox.innerHTML = '';
    okBox.appendChild(tileEl({ id: -901, color: s.okey.color, number: s.okey.number, isOkeyReal: true }, false));
    okBox.title = okeyLabel();
    $('storeDeckCount').textContent = `${(s.deck || []).length}/${Game.totalTilesInPlay()}`;
    /* PLAYTEST 9 · GRUP M — kapasite bilgisi BAŞLIĞIN YANINDA (omuz sekmeleri). */
    el.ssSlotsCount.textContent = `${s.jokers.length}/${Game.slotCap()}`;
    el.ssBackupCount.textContent = `${s.backup.length}/2`;
    el.ssConsumCount.textContent = `${s.consumables.length}/${Game.consumCap()}`;
    // Slotlar: hover → tooltip'ten Sat / →Ana / Birleştir; boş yuvalar taş arkası
    const emptySlot = () => { const d = document.createElement('div'); d.className = 'joker-slot-empty'; return d; };
    el.storeSlotsRow.innerHTML = '';
    s.jokers.forEach(j => el.storeSlotsRow.appendChild(jokerCard(j)));
    for (let k = s.jokers.length; k < Game.slotCap(); k++) el.storeSlotsRow.appendChild(emptySlot());
    el.storeBackupRow.innerHTML = '';
    s.backup.forEach(j => el.storeBackupRow.appendChild(jokerCard(j, { backup: true })));
    for (let k = s.backup.length; k < 2; k++) el.storeBackupRow.appendChild(emptySlot());
    el.storeConsumRow.innerHTML = '';
    s.consumables.forEach((key, i) => el.storeConsumRow.appendChild(consumCard(key, i, { sell: true })));
    for (let k = s.consumables.length; k < Game.consumCap(); k++) el.storeConsumRow.appendChild(emptySlot());
    /* Omuz yuva sayısı: 4+ değnek yuvası taslak v3'teki gibi İKİ SATIR */
    const cCap = Math.max(Game.consumCap(), s.consumables.length);
    $('storeTotemShoulder').dataset.slots = String(cCap);
    $('storeBackupShoulder').dataset.slots = String(Math.max(2, s.backup.length));

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
      /* P42 (kullanıcı isteği 2026-09-14) — STORE JOKER KARTI YALNIZ GÖRSEL.
         Değnek kartıyla (P41) aynı kural: ad, nadirlik satırı ve etki çipleri
         kartta yok; üstüne gelince tooltip'te. Çizimi olan joker çizimiyle,
         olmayan büyük ikonuyla görünür (kullanıcı seçimi). Nadirlik satırının
         etiketleri (indirim, ACİL RAF, sızdırıldı, kilit, Kara Pazar) tooltip'in
         kategori satırına geçti; YENİ rozeti ve kilit düğmesi kartta kalır. */
      const tags = `${item.discounted ? ' · ' + t('discounted') : ''}${item.catchUp ? ' · ' + t('catchUpTag') : ''}` +
        `${item.leaked ? ' · 🗣' : ''}${item.locked ? ' · 🔒' : ''}${s.store.anarchist ? ' · ⚡' : ''}`;
      const jArt = !disguised && JOKER_ART.has(item.key);
      card.classList.add('art-card');
      /* P67 — açık kart: gömme alanda büyük görsel, altında satın al düğmesi,
         sol üst köşede kilit, sağ üstte YENİ rozeti; üst şerit nadirlik rengi. */
      card.classList.add('st-jk');
      card.innerHTML =
        `<div class="st-frame">` +
        (jArt ? `<div class="s-ico s-jk-art jk-${item.key}"></div>`
          : `<div class="s-ico ico-${item.rarity}">${disguised ? '🀫' : jokerIcon(item.key)}</div>`) +
        `</div>` +
        (!item.sold && !ownedEver.has(item.key) ? `<span class="badge-new">${t('newBadge')}</span>` : '');
      attachTip(card, { name: T.name(item), desc: T.desc(item), accent: item.rarity,
        rarityText: `${T.rarity(item.rarity)}${JOKER_DEFS[item.key]?.mech === 'deck' ? ' · ' + t('deckJokerTag') : ''}${tags}`,
        usesLeft: JOKER_DEFS[item.key]?.uses ?? RARITY[item.rarity].uses, key: item.key }, {});
      if (item.sold) {
        card.innerHTML += `<div class="s-sold">${item.fled ? t('fled') : t('sold')}</div>`;
      } else {
        card.appendChild(lockBtn(item.locked, () => { Game.toggleLock(i); renderStore(); }));
        const btn = document.createElement('button');
        btn.className = 'btn primary s-buy';
        btn.innerHTML = `${anarOld(item)}${t('stBuy', item.price)}${item.haggled ? ' 🤝' : ''}`;
        btn.title = t('buyBtn', item.price, 'coin');
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
      const cArt = CONSUM_ART.has(c.key);
      card.className = `store-item viz r-consum r-${c.rarity || 'common'}` + (cArt ? ' art-card' : '') + (c.sold ? ' sold-out' : '');
      /* P41 (kullanıcı isteği 2026-09-14) — ÇİZİMİ OLAN DEĞNEK STORE'DA YALNIZ
         ÇİZİMİYLE: nadirlik satırı, ad ve etki çipi yok — üstüne gelince
         tooltip'te zaten yazıyor. Altta Satın Al kalır; Anarşist işareti
         (⚡) tooltip'in kategori satırına geçti. Çizimi olmayan değnek eski
         kart düzeninde kalır. */
      card.classList.add('st-it');
      card.innerHTML = cArt
        ? `<div class="st-frame"><div class="s-ico ico-consum cs-art cs-${c.key}"></div></div>`
        : `<div class="s-rarity">${T.rarity(c.rarity || 'common')} · ${t('consumRarity')}${s.store.anarchist ? ' · ⚡' : ''}</div>` +
          `<div class="st-frame"><div class="s-ico ico-consum">${c.icon}</div></div>` +
          `<div class="s-name">${T.consumName(c.key, c.name)}</div>` +
          chipsHtml(T.consumDesc(c.key, c.desc));
      /* PLAYTEST 9 · GRUP M: "envanterde en fazla 3 taşınır" cümlesi
         KALDIRILDI — aynı bilgi zaten TÜKETİLEBİLİR başlığının yanındaki
         sayaçta (0/3) duruyor, açıklamada tekrar etmesi gürültüydü. */
      attachTip(card, { name: T.consumName(c.key, c.name),
        rarityText: `${T.rarity(c.rarity || 'common')} · ${t('consumTag')}${s.store.anarchist ? ' · ⚡' : ''}`,
        accent: c.rarity || 'common',
        desc: T.consumDesc(c.key, c.desc) }, {});
      if (c.sold) {
        card.innerHTML += `<div class="s-sold">${t('sold')}</div>`;
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn primary s-buy';
        btn.innerHTML = anarOld(c) + t('stBuy', c.price);
        btn.title = t('buyBtn', c.price, 'coin');
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

    /* P52 · GRUP F: TAHVİL KARTI KALDIRILDI (kullanıcı kararı 2026-09-17). */

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
      card.className = `store-item st-it r-pack pack-${pk.kind} tone-${def.tone}`
        + (pk.sold ? ' sold-out' : '');
      if (pk.sold) {
        /* Grup F: seçimli paket alındıysa ama seçim henüz yapılmadıysa kart
           "seçim bekleniyor" der — satın alma butonu bir daha çıkmaz. */
        card.innerHTML =
          `<div class="s-rarity">${t('packRarity_' + pk.kind)}</div>` +
          `<div class="st-frame"><div class="s-ico ico-pack">${def.icon}</div></div>` +
          `<div class="s-name s-sold">${pk.pending ? t('packPending') : t('opened')}</div>` +
          (pk.contents ? `<div class="s-pack-out">${pk.contents.map(packOutHtml).join('<hr>')}</div>` : '');
        /* P65: çerçeve küçük — paketten çıkanlar üstüne gelince tooltip'te */
        if (pk.contents) attachTip(card, { name: t('packTipName_' + pk.kind),
          rarityText: pk.pending ? t('packPending') : t('opened'),
          desc: pk.contents.map(packOutLine).join(' · ') }, {});
      } else {
        card.innerHTML =
          `<div class="s-rarity">${t('packRarity_' + pk.kind)}${s.store.anarchist ? ' · ⚡' : ''}</div>` +
          `<div class="st-frame"><div class="s-ico ico-pack">${def.icon}</div></div>` +
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
        btn.innerHTML = anarOld(pk) + t('stOpen', pk.price);
        btn.title = t('packOpenBtn', pk.price, 'coin');
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
      title.textContent = t('stDeckJokers');
      el.storeDeckRow.appendChild(title);
      const row = document.createElement('div');
      row.className = 'sd-row';
      s.deckJokers.forEach(j => row.appendChild(jokerCard(j)));
      el.storeDeckRow.appendChild(row);
    }

    /* P65 — taslak varyantları: satır genişliği ÜRÜN SAYISINA göre (3/4 joker,
       4/5/6 ürün). Izgara değil yan yana dizi; CSS satırı panelde ortalar. */
    $('storeRowA').dataset.n = String(el.storeRowJokers.children.length);
    $('storeRowB').dataset.n = String(el.storeRowExtras.children.length);
    for (const row of [el.storeRowJokers, el.storeRowExtras]) row.style.gridTemplateColumns = '';

    /* Düğmeler taslaktaki gibi tek büyük kelime (YENİLE / DEVAM); fiyat ve
       kalan hak altında küçük satır. Grup E: Trainer'da reroll bedava ve
       sınırsız. P52 · Grup B — store başına 2 hak, düz 3 coin. MADDE E2 —
       catch-up'ın ilk yenilemesi bedava ve hakkı tüketmez. */
    const rr = (sub) => `<b>${t('stReroll')}</b><small>${sub}</small>`;
    if (Game.rerollFree()) {
      el.btnReroll.disabled = false;
      el.btnReroll.innerHTML = rr(t('stRerollTrainer'));
    } else {
      const rc = Game.rerollCost();
      const left = Game.rerollLeft();
      if (s.store.freeReroll) {
        el.btnReroll.disabled = false;
        el.btnReroll.innerHTML = rr(t('stRerollFree'));
      } else if (left <= 0) {
        el.btnReroll.disabled = true;
        el.btnReroll.innerHTML = rr(t('stRerollUsed'));
      } else {
        el.btnReroll.disabled = s.coins < rc;
        el.btnReroll.innerHTML = rr(t('stRerollSub', rc, left));
      }
    }
    el.btnStoreContinue.innerHTML = `<b>${t('stNext')}</b>`;
    el.btnStoreContinue.title = t('storeContinue');

    /* MADDE D5 — store'a bağlı ipuçları. Sıra ÖNEMLİ: en genel olan
       (store'un nasıl çalıştığı) önce, duruma özel olanlar sonra gelir ki
       ilk store'da dört kart üst üste binmesin. `show` bir kez true döner,
       yani aynı ekranda yalnız biri açılır. */
    if (!Game.trainerMode) {
      const shown = Hints.show('store');
      if (!shown && s.store.items.some(i => i.catchUp)) Hints.show('catchUp');
      /* P43: "TAKAS: jokerine tıkla, farkı öde" ipucu kalktı — tooltip'teki Takas
         düğmesi kullanıcı kararıyla silindi, ipucu artık olmayan bir düğmeyi tarif ederdi. */
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
  /* ============================================================
     P59 (kullanıcı isteği 2026-10-02) — OYUN SONU PANELLERİ
     Game Over ve Run Tamamlandı tek bir panel dilini paylaşır (kullanıcının
     verdiği Balatro örnekleri): büyük piksel başlık, solda etiket/değer
     satırları, sağda stage/raund + "kaybettiren" kutusu ya da düğmeler,
     altta eylemler. Renkler aktif TEMADAN gelir (--gm-dark / --gm-light).
     Eski sürümde "Ana Menüye Dön" düğmesi açık zeminde beyaz yazıyla
     görünmüyordu (kullanıcı ekran görüntüsü).
     ============================================================ */
  function endStats(s) {
    const ty = s.statTypes || {};
    const most = Object.entries(ty).sort((x, y) => y[1] - x[1])[0];
    const fmt = (n) => Number(n || 0).toLocaleString(T.lang === 'en' ? 'en-US' : 'tr-TR');
    return {
      best: fmt(s.statBestMeld),
      most: most && most[1] > 0 ? `${T.typeName(most[0])} <i>(${most[1]})</i>` : '—',
      tiles: fmt(s.statTilesMelded), discarded: fmt(s.statDiscarded),
      bought: fmt(s.statBought), rerolls: fmt(s.statRerolls),
      score: fmt(s.totalScore), coins: `${s.coins}`,
      stage: `${s.stage}`, stageOf: Number.isFinite(chCount()) ? `/${chCount()}` : '',
      round: `${(s.stage - 1) * 3 + s.roundInStage}`,
      mult: `+${(s.permMult || 0).toFixed(1)}x`,
    };
  }
  const epRow = (label, value, cls = '', wide = false) =>
    `<div class="ep-row${wide ? ' ep-wide' : ''}"><span class="ep-lbl">${label}</span>`
    + `<span class="ep-val ${cls}">${value}</span></div>`;

  function endPanel(kind, title, leftHtml, rightHtml, footHtml) {
    for (const id of ['runCompleteOv', 'gameOverOv']) document.getElementById(id)?.remove();
    const ov = document.createElement('div');
    ov.id = kind === 'win' ? 'runCompleteOv' : 'gameOverOv';
    ov.className = `ep-ov ep-${kind}`;
    ov.innerHTML = `<div class="ep-box"><h2 class="ep-title">${title}</h2>`
      + `<div class="ep-body"><div class="ep-left">${leftHtml}</div><div class="ep-right">${rightHtml}</div></div>`
      + (footHtml ? `<div class="ep-foot">${footHtml}</div>` : '') + `</div>`;
    document.body.appendChild(ov);
    return ov;
  }

  function endToMenu(ov) {
    ov.remove();
    el.overlay.classList.add('hidden');
    el.storeOverlay.classList.add('hidden');
    el.upgradeOverlay.classList.add('hidden');
    clearSave();
    Game.trainerMode = false;
    showScreen('menu');
  }
  function endNewRun(ov) {
    const trainer = Game.trainerMode;
    const mode = Game.state && Game.state.runMode;
    endToMenu(ov);
    if (trainer) { showTrainerSetup(); return; }
    startNewRun(mode);
  }

  /* P60 — RUN RAPORU (arkadaş testi). Motor her raundu kaydeder
     (Game.runLog); burada mesajla gönderilebilecek düz metne çevrilir.
     Biçim hem okunur hem de denge ölçümüne geri beslenebilir: her raund
     tek satır, joker girişleri "+", çıkışları "−". */
  function runReport(kind, why) {
    const s = Game.state;
    if (Game._logRoundEnd) Game._logRoundEnd();   // son raund açık kaldıysa sonucunu yaz (idempotent)
    const L = (Game.runLog && Game.runLog()) || { rounds: [], start: Date.now() };
    const st = endStats(s);
    const jn = (k) => { const d = JOKER_DEFS[k]; return d ? T.name(d) : k; };
    const two = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const when = `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
    const mins = Math.max(1, Math.round((Date.now() - (L.start || Date.now())) / 60000));
    const mode = Game.trainerMode ? t('modeName_trainer') : t('modeName_' + (s.runMode || 'base'));
    const out = [];
    out.push(t('rpTitle'));
    out.push(t('rpMeta', mode, when, mins));
    out.push(t('rpMusic', Music.on ? t('musicSet' + Music.set) : t('musicOff')));   // P66b — arkadaş testi
    const where = `S${s.stage} R${s.roundInStage}`;
    const bossTxt = s.boss && Game.isBossRound && Game.isBossRound() ? ` · ${t('rpBoss')} ${T.bossName(s.boss.key, s.boss.name)}` : '';
    out.push(kind === 'win' ? t('rpResultWin', where) : t('rpResultLose', where + bossTxt, s.score, s.target));
    if (why) out.push(t('rpWhy', String(why).replace(/<[^>]+>/g, '')));
    out.push(t('rpTotals', st.score, st.best, st.mult, s.coins));
    out.push(t('rpCounts', st.tiles, st.discarded, st.bought, st.rerolls, String(st.most).replace(/<[^>]+>/g, '')));
    out.push('— ' + t('rpRounds') + ' —');
    for (const e of L.rounds) {
      const parts = [`S${e.st}R${e.r} ${e.won == null ? '…' : e.won ? '✔' : '✘'}`];
      if (e.sc != null) parts.push(`${e.sc}/${e.tgt}`);
      if (e.turn != null) parts.push(t('rpTurn', e.turn));
      if (e.boss) parts.push(`${t('rpBoss')} ${T.bossName(e.boss, (JOKER_DEFS[e.boss] || {}).name || e.boss)}`);
      if (e.bet) parts.push(`${t('rpBet')} ${T.ev(BETS[e.bet] ? BETS[e.bet].name : e.bet)}`);
      if (e.katla) parts.push(t('rpKatla', e.katla));
      if (e.rulet) parts.push(t('rpRulet', e.rulet === 'red' ? '🔴' : '⚫'));
      if (e.side) parts.push(t('rpSide', String(T.ev(SIDE_NAME(e.side.key))), e.side.odds,
        e.side.hit == null ? '…' : e.side.hit ? `✔ +${e.side.paid}` : `✘ −${e.side.stake}`));
      if (e.hl) parts.push(t('rpHiLo', e.hl.step, e.hl.net >= 0 ? `+${e.hl.net}` : `${e.hl.net}`));
      if (e.fail) parts.push(`${t('rpFail')} ${String(T.ev(e.fail)).replace(/<[^>]+>/g, '')}`);
      if (e.add && e.add.length) parts.push('+' + e.add.map(jn).join(', +'));
      if (e.rem && e.rem.length) parts.push('−' + e.rem.map(jn).join(', −'));
      out.push(parts.join(' · '));
    }
    out.push('— ' + t('rpBuild') + ' —');
    const list = (a) => (a && a.length ? a.map(j => T.name(j)).join(', ') : '—');
    out.push(`${t('rpSlot')}: ${list(s.jokers)}`);
    if ((s.deckJokers || []).length) out.push(`${t('rpDeck')}: ${list(s.deckJokers)}`);
    if ((s.backup || []).length) out.push(`${t('rpBackup')}: ${list(s.backup)}`);
    return out.join('\n');
  }
  function copyText(text) {
    let done = false;
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      done = document.execCommand('copy');
      ta.remove();
    } catch (e) { /* file:// ya da izin yok */ }
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    return done || !!navigator.clipboard;
  }
  /* Oyun sonu panelindeki "Raporu kopyala" düğmesi. Rapor panel AÇILIRKEN
     üretilir (sonra state değişse bile oyuncunun gördüğü sonuç gider). */
  function wireReport(ov, kind, why) {
    const text = runReport(kind, why);
    ov.dataset.report = text;
    const b = ov.querySelector('#epCopy');
    if (b) b.addEventListener('click', () => {
      copyText(text);
      b.textContent = t('epCopied');
      toast(t('epCopiedToast'), true);
    });
  }

  /* GAME OVER — kullanıcı örneği 2 */
  function showGameOver() {
    const s = Game.state;
    const st = endStats(s);
    clearSave();
    SFX.lose();
    const boss = Game.isBossRound && Game.isBossRound() && s.boss;
    const art = boss && JOKER_ART.has(s.boss.key)
      ? `<div class="ep-def-art art-joker jk-${s.boss.key}"></div>` : `<div class="ep-def-ico">${boss ? '👹' : '🎯'}</div>`;
    const why = s.bossFail ? T.ev(s.bossFail)
      : s.katla ? t('katlaLostBody', s.katla.base, s.target)
      : t('epScoreOf', s.score, s.target);
    const left =
      epRow(t('epBest'), st.best, 'c-red', true) +
      epRow(t('epMost'), st.most, '', true) +
      epRow(t('epTiles'), st.tiles, 'c-blue') +
      epRow(t('epDiscarded'), st.discarded, 'c-red') +
      epRow(t('epBought'), st.bought, 'c-orange') +
      epRow(t('epRerolls'), st.rerolls, 'c-green');
    const right =
      epRow(t('epStage'), st.stage + `<small>${st.stageOf}</small>`, 'c-orange') +
      epRow(t('epRound'), st.round, 'c-orange') +
      `<div class="ep-defeat"><div class="ep-def-title">${t('epDefeatedBy')}</div>`
      + `<div class="ep-def-name">${boss ? T.bossName(s.boss.key, s.boss.name) : (s.katla ? t('katlaLostTitle') : t('epTarget'))}</div>`
      + art + `<div class="ep-def-why">${why}</div></div>`;
    const foot = `<button class="ep-btn" id="epNewRun">${t('epNewRun')}</button>`
      + `<button class="ep-btn" id="epMenu">${t('epMainMenu')}</button>`
      + `<button class="ep-btn ep-ghost" id="epCopy">${t('epCopy')}</button>`
      + `<div class="ep-note">${t('epCopyHint')}</div>`;
    const ov = endPanel('lose', t('gameOver'), left, right, foot);
    wireReport(ov, 'lose', why);
    ov.querySelector('#epMenu').addEventListener('click', () => endToMenu(ov));
    ov.querySelector('#epNewRun').addEventListener('click', () => endNewRun(ov));
  }

  /* RUN TAMAMLANDI — kullanıcı örneği 3 */
  function showRunComplete() {
    const res = Game.completeRun();
    const st0 = res.stats || Game.runStats();
    clearSave();
    SFX.win();
    /* GRUP R (P20) — İLK TEMEL RUN TAMAMLANDI: kilitler açılır.
       Trainer run'ı kayıt yazmaz, bu yüzden kilidi de açmaz. */
    let openedModes = [];
    if (!Game.trainerMode) openedModes = Modes.complete('base');
    /* P53 — "Sonsuz Mod'a devam" yalnız TEMEL run'ın sonunda (trainer'da ve
       Kumarhane Run'da yok; run zaten sonsuzsa tekrar gösterilmez). */
    const canEndless = !Game.trainerMode && !Game.state.endless && Game.state.runMode !== 'hizli';
    const s = Game.state;
    const st = endStats(s);
    /* P64 (kullanıcı 2026-10-04) — KAZANMA EKRANI DÜZENİ: düğmeler sağ
       sütunda kayboluyordu ("kafa karıştırıcı") → kaybetme ekranındaki gibi
       ALTTA, ortalı, alt alta. Joker listesi kalktı ("görmemize gerek yok").
       Sağda Game Over'daki "Kaybettiren" kutusunun eşi: yenilen son boss. */
    const left =
      epRow(t('epBest'), st.best, 'c-red', true) +
      epRow(t('epMost'), st.most, '', true) +
      epRow(t('epScore'), st.score, 'c-blue') +
      epRow(t('epTiles'), st.tiles, 'c-blue') +
      epRow(t('epDiscarded'), st.discarded, 'c-red') +
      epRow(t('epBought'), st.bought, 'c-orange') +
      epRow(t('epRerolls'), st.rerolls, 'c-green');
    const lb = s.boss;
    const lbArt = lb && JOKER_ART.has(lb.key)
      ? `<div class="ep-def-art art-joker jk-${lb.key}"></div>` : `<div class="ep-def-ico">🏆</div>`;
    const right =
      epRow(t('epStage'), st.stage + `<small>${st.stageOf}</small>`, 'c-orange') +
      epRow(t('epRound'), st.round, 'c-orange') +
      epRow(t('epMult'), st.mult, 'c-green') +
      `<div class="ep-defeat ep-trophy"><div class="ep-def-title">${t('epLastBoss')}</div>`
      + `<div class="ep-def-name">${lb ? T.bossName(lb.key, lb.name) : '—'}</div>` + lbArt + `</div>`;
    const foot =
      (openedModes.length ? `<div class="ep-note">${t('modeUnlocked', openedModes.map(m => t('modeName_' + m.key)).join(', '))}</div>` : '') +
      /* Sonsuz Mod AYRI BİR MOD DEĞİL (P53): menüde düğmesi yok, yalnız burada bir SEÇİM. */
      (canEndless ? `<button class="ep-btn ep-blue" id="rcEndless">${t('epEndless')}</button>`
        + `<div class="ep-note">${t('rcEndlessHint')}</div>` : '')
      + `<button class="ep-btn" id="epNewRun">${t('epNewRun')}</button>`
      + `<button class="ep-btn" id="rcMenu">${t('epMainMenu')}</button>`
      + `<button class="ep-btn ep-ghost" id="epCopy">${t('epCopy')}</button>`
      + `<div class="ep-note">${t('epCopyHint')}</div>`;
    const ov = endPanel('win', t('epWinTitle'), left, right, foot);
    wireReport(ov, 'win');
    ov.querySelector('#rcMenu').addEventListener('click', () => endToMenu(ov));
    ov.querySelector('#epNewRun').addEventListener('click', () => endNewRun(ov));
    /* Devam: motor mührü kaldırır ve son boss'un ÜRETİLMEYEN iki ödülünü
       (yükseltme çarkı + store) üretir — run kaldığı yerden sürer. */
    const endBtn = ov.querySelector('#rcEndless');
    if (endBtn) endBtn.addEventListener('click', () => {
      const r = Game.continueEndless();
      if (!r.ok) { toast(r.error, true); return; }
      ov.remove();
      el.overlay.classList.add('hidden');
      toast(t('endlessOn', r.stage + 1), true);
      if (Game.state.upgradeOffer) showUpgradeScene();
      else openStore();
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
      /* P63 — şerit MOTORDAN (upgradeOffer.strips): STOP'ta inen güçlendirme
         gerçekten verilir. Eski kayıtta şerit yoksa eski sahte şerit. */
      const ri = s.upgradeOffer.rolled.indexOf(key);
      const eng = willSpin && s.upgradeOffer.strips && s.upgradeOffer.strips[ri];
      const strip = [];
      if (eng) strip.push(...eng, eng[0]);          // + sarma hücresi
      else {
        if (willSpin)
          for (let i = 0; i < UP_REEL_LEN - 1; i++)
            strip.push(allKeys[Math.floor(Math.random() * allKeys.length)]);
        strip.push(key);
      }
      card.dataset.engine = eng ? '1' : '';
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
    else reels.forEach(c => c.querySelector('.up-sym:last-child')?.classList.add('hit'));
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
    /* P63 — sürekli dönen makara + STOP (kaymalı); pencere TEK sembol */
    const s = Game.state;
    el.upgradeOverlay.classList.add('spin-lock');
    const refreshInfo = (card, key) => {
      const def = UPGRADE_DEFS[key];
      if (!def) return;
      const chips = (def.stats || statChips(def.desc)).map(c => `<span class="s-chip">${T.ev(c)}</span>`).join('');
      const info = card.querySelector('.up-info');
      if (info) info.innerHTML = `<div class="up-won">${t('upWon')}</div>`
        + (chips ? `<div class="s-chips up-chips">${chips}</div>` : '')
        + `<div class="up-desc">${emphNums(T.upDesc(key, def.desc))}</div>`;
    };
    const items = cards.map((card, i) => {
      const strip = card.querySelector('.up-strip');
      const engine = card.dataset.engine === '1';
      return {
        strip, n: strip.children.length - (engine ? 1 : 0), mid: 0,
        cellH: () => card.querySelector('.up-sym').offsetHeight || 118,
        pick: engine ? (sym) => {
          const r = Game.reelStop('upgrade', i, sym);
          if (r && r.ok) { refreshInfo(card, r.key); return r.landed; }
          return null;
        } : null,
      };
    });
    const stopBtn = document.createElement('button');
    stopBtn.className = 'pk-stop-btn up-stop-btn';
    stopBtn.textContent = t('slotStopBtn');
    el.btnUpContinue.parentElement.insertBefore(stopBtn, el.btnUpContinue);
    const stop = loopReels(items, {
      auto: (i) => 1.2 + i * 0.5,
      onLand: (i) => { cards[i].classList.remove('spinning'); cards[i].classList.add('landed'); },
      onDone: () => {
        stopBtn.remove();
        el.upgradeOverlay.classList.remove('spin-lock');
        grantUpgrades();
      },
    });
    stopBtn.addEventListener('click', () => { stopBtn.disabled = true; stop(); });
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
    'freedom', 'dervish', 'karaKedi', 'ritim', 'terziIgne', 'zombie',
    'kelebek', 'uzayli', 'misunderstood',     // P49 · Grup C: 13 çizim
    'kahin', 'kirby', 'corporates',           // P51 · Grup C: 16 çizim (SIR_BY → kirby)
    'avukat', 'godzilla', 'tuccar',           // P54 · Grup F: boss frame 20/20 (Cheating hariç 19)
    /* P54 · Grup F — MYTHIC çizimleri (Figma 379:319, 9 kart; The World yok) */
    'tanrininEli', 'seytan', 'theWorld', 'karaDelik', 'yasakElma',
    'pinkyWarrior', 'kiyamet', 'kagit', 'ejderha',
    'frankenstein',                           // P54 · Figma 383:975 — ilk Legendary çizimi
    'otekiDunya',                             // P55 · Figma 387:3 — Mythic 10/10
    'kaptan', 'ucKagitci',                    // P57 · Figma 390:2 (Legendary 2/15) + 390:44 (boss 20/20)
    'medusa']);                               // P67 · Figma 420:2 (Legendary 3/15)

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
  /* P37 (2026-09-13) — Figma 295:176 güncellendi: 20 değneğin 20'si çizimli.
     P38b (2026-09-14): frame nadirlik satırlarına ayrıldı, Boya Kabı da eklendi;
     20 çizim baştan alındı. Figma'daki "DERİN_NEFES" = Derin Nefes (`altinCanak`). */
  const CONSUM_ART = new Set(['zimpara', 'cekic', 'boya', 'muska', 'kumbara',
    'yildizTozu', 'gumusVernik', 'zamanKumu', 'tac',
    'balKupu', 'kopyaci', 'miknatis', 'altinCanak', 'altinOran', 'tacirMektubu',
    'klonSisesi', 'heybe', 'ferman', 'okeyMuhru', 'simyaSisesi']);

  /* P54 (kullanıcı isteği 2026-09-29) — KOLEKSİYON KARTLARI ORTAK KURUCU.
     Trainer kurulumu da jokerleri/değnekleri/özel taşları koleksiyondaki
     gibi göstersin diye kart kurulumu tek yerde: showCollection ve
     showTrainerSetup aynı fonksiyonları çağırır. `artRow`: o nadirlik rafı
     görsel dizisi mi (Epic + Mythic). */
  const COL_ART_RARITIES = new Set(['epic', 'mythic']);
  /* P54 (kullanıcı raporu: "Dr. Frankenstein koleksiyonda ve trainer'da
     gözükmüyor") — KÖK NEDEN: çizim yalnız Epic/Mythic raflarında
     kullanılıyordu; Legendary rafı yazılı kart olarak kuruluyordu, yani
     Frankenstein'ın çizimi hiç okunmuyordu. Artık çizimi olan HER kart
     (nadirlik ne olursa olsun) çizimiyle görünür. Görsel raf olmayan bir
     rafta çizimi henüz olmayan kart kart arkasına DÖNMEZ — adıyla kalır,
     ama raf karışık ölçüde olmasın diye çizimli kartla aynı kutuya oturur
     (`.col-sized`). */
  const rarityHasArt = (rar) => Object.values(JOKER_DEFS).some(d => d.rarity === rar && JOKER_ART.has(d.key));
  function colJokerCard(def) {
    const tile2 = document.createElement('div');
    if (COL_ART_RARITIES.has(def.rarity) || JOKER_ART.has(def.key)) {
      const has = JOKER_ART.has(def.key);
      tile2.className = 'col-jk-card' + (has ? '' : ' blank');
      tile2.innerHTML = `<div class="col-jk-art${has ? ' jk-' + def.key : ''}"></div>`;
    } else {
      tile2.className = `joker-tile r-${def.rarity} col-tile`
        + (rarityHasArt(def.rarity) ? ' col-sized' : '');
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
    return tile2;
  }
  function colConsumCard(def) {
    const tile2 = document.createElement('div');
    const has = CONSUM_ART.has(def.key);
    tile2.className = 'col-cs-card' + (has ? '' : ' blank');
    tile2.innerHTML = `<div class="col-cs-art${has ? ' cs-' + def.key : ''}"></div>`;
    attachTip(tile2, { name: T.consumName(def.key, def.name),
      rarityText: `${T.rarity(def.rarity || 'common')} · ${t('consumTag')}`,
      accent: def.rarity || 'common',
      desc: T.consumDesc(def.key, def.desc) }, {});
    return tile2;
  }
  function colSpecialCard(def) {
    const tile2 = document.createElement('div');
    tile2.className = 'col-sp-card';
    const art = SPECIAL_ART.has(def.key);
    tile2.innerHTML = art
      ? `<div class="col-sp-art sp-${def.key}"></div>`
      : `<div class="jt-name">${T.specialName(def.key, def.name)}</div>`;
    attachTip(tile2, { name: T.specialName(def.key, def.name),
      rarityText: t('specialTag'),
      desc: T.specialDesc(def.key, def.desc) }, {});
    return tile2;
  }

  /* ============================================================
     P64 — KOLEKSİYON, OYUNUN UI DİLİNDE (kullanıcı 2026-10-04; Balatro
     koleksiyonu yalnız İLHAM: kategori girişi + sayfalı ızgara).
     · Giriş: kategori düğmeleri (sayılarıyla)
     · Kategori: nadirlik filtresi (jokerler), sayfa başına 12 kart,
       "Sayfa x/y" + oklar; Geri → girişe döner
     Kart bileşenleri (colJokerCard / colConsumCard / colSpecialCard) ve
     hover ipuçları aynen kullanılır. Eski "hepsi alt alta" çizimi
     renderCollectionAll olarak durur (`__test.collectionView('all')`).
     ============================================================ */
  const COL_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const COL_PAGE = 12;
  let colView = 'hub', colPage = 0, colFilter = 'all';
  const byRarity = (arr) => arr.map((d, i) => ({ d, i }))
    .sort((a, b) => (COL_ORDER.indexOf(a.d.rarity || 'common') - COL_ORDER.indexOf(b.d.rarity || 'common')) || a.i - b.i)
    .map(x => x.d);
  function colUpgradeTile(def) {
    const tile2 = document.createElement('div');
    tile2.className = 'joker-tile r-legendary col-tile';
    tile2.innerHTML = `<div class="col-icon">${def.icon}</div><div class="jt-name">${T.upName(def.key, def.name)}</div>`;
    attachTip(tile2, { name: T.upName(def.key, def.name), rarityText: t('upgradeTag'), desc: T.upDesc(def.key, def.desc) }, {});
    return tile2;
  }
  /* P67e — MÜZİKLER: bütün parçalar tek tek dinlenebilir (kullanıcı: "uğraşmadan
     tek tek dinleyip kontrol edebileyim"). ▶ parçayı zorla çalar, tekrar basınca
     durur; kategoriden/koleksiyondan çıkınca müzik ekrana göre normale döner. */
  function musicCatalog() {
    const out = [];
    for (const n of [1, 2, 3]) out.push({ key: 'tema' + n, rarity: 'tema', name: t('musicSet' + n), desc: t('mus_tema' + n) });
    for (const n of [1, 2, 3]) out.push({ key: 'store' + n, rarity: 'store', name: 'Store · ' + t('musicSet' + n), desc: t('mus_store' + n) });
    for (const b of BOSSES) if (Music.TRACKS['b_' + b.key]) {
      out.push({ key: 'b_' + b.key, rarity: 'boss', boss: b.key, name: T.bossName(b.key, b.name), desc: t('mus_b_' + b.key) });
    }
    out.push({ key: 'bossGenel', rarity: 'boss', name: t('musBossGenel'), desc: t('mus_bossGenel') });
    return out;
  }
  function colMusicSync() {
    document.querySelectorAll('.col-mus').forEach(c => {
      const on = Music.forced === c.dataset.track;
      c.classList.toggle('playing', on);
      const b = c.querySelector('.cm-play');
      b.textContent = on ? '■' : '▶';
      b.title = on ? t('musStop') : t('musPlay');
    });
  }
  function colMusicCard(d) {
    const c = document.createElement('div');
    c.className = 'col-mus mus-' + d.rarity;
    c.dataset.track = d.key;
    const art = d.boss && JOKER_ART.has(d.boss)
      ? `<div class="cm-art s-jk-art jk-${d.boss}"></div>`
      : `<div class="cm-art cm-note">${d.rarity === 'store' ? '🛒' : d.rarity === 'boss' ? '👹' : '🎵'}</div>`;
    c.innerHTML = art + `<div class="cm-txt"><b title="${d.name}">${d.name}</b><small>${d.desc}</small></div>`
      + `<button class="cm-play">▶</button>`;
    c.querySelector('.cm-play').addEventListener('click', () => {
      if (Music.forced === d.key) Music.force(null);
      else { if (!Music.on) Music.setOn(true); Music.force(d.key); }
      colMusicSync();
    });
    return c;
  }
  const COL_CATS = [
    { key: 'jokers', ico: '🃏', big: true, filters: ['all', 'common', 'rare', 'legendary', 'mythic'],
      items: () => byRarity(Object.values(JOKER_DEFS).filter(d => !d.casino && d.rarity !== 'epic')), card: (d) => colJokerCard(d) },
    { key: 'boss', ico: '👹', items: () => Object.values(JOKER_DEFS).filter(d => d.rarity === 'epic'), card: (d) => colJokerCard(d) },
    { key: 'casino', ico: '🎰', items: () => byRarity(Object.values(JOKER_DEFS).filter(d => d.casino)), card: (d) => colJokerCard(d) },
    { key: 'consum', ico: '🪄', items: () => byRarity(Object.values(CONSUMABLES)), card: (d) => colConsumCard(d) },
    { key: 'special', ico: '💠', items: () => Object.values(SPECIAL_TILES), card: (d) => colSpecialCard(d) },
    { key: 'upgrade', ico: '⭐', items: () => Object.values(UPGRADE_DEFS), card: (d) => colUpgradeTile(d) },
    { key: 'modes', ico: '🎮', items: () => Modes.statusRows(), card: null },
    { key: 'music', ico: '🎵', filters: ['all', 'tema', 'store', 'boss'], filterLabel: (f) => t('musF_' + f),
      items: () => musicCatalog(), card: (d) => colMusicCard(d) },
  ];
  /* P67 — sayfa/kategori değişimi pencereyi YENİDEN açmaz: openScene giriş
     animasyonunu sıfırdan oynatıyordu, ekran bir an kaybolup geri geliyordu. */
  function colOpen() {
    if (el.collectionOverlay.classList.contains('hidden')) openScene(el.collectionOverlay);
  }

  function showCollection(view) {
    colView = view || 'hub';
    if (colView !== 'cat:music' && Music.forced) Music.force(null);   // P67e: önizleme kategoride kalır
    hideTip();
    $('colTitle').textContent = t('colTitle');
    el.btnColBack.textContent = t('colBack');
    el.colBody.innerHTML = '';
    el.colBody.className = 'col-v-' + (colView === 'all' ? 'all' : colView === 'hub' ? 'hub' : 'cat');
    if (colView === 'all') { renderCollectionAll(); colOpen(); return; }
    if (colView === 'hub') {
      $('colSub').textContent = t('colHubSub');
      const hub = document.createElement('div');
      hub.className = 'col-hub';
      for (const c of COL_CATS) {
        const b = document.createElement('button');
        b.className = 'col-cat' + (c.big ? ' big' : '');
        b.dataset.cat = c.key;
        b.innerHTML = `<span class="cc-ico">${c.ico}</span><span class="cc-name">${t('colCat_' + c.key)}</span>`
          + `<span class="cc-count">${c.items().length}</span>`;
        b.addEventListener('click', () => { colPage = 0; colFilter = 'all'; showCollection('cat:' + c.key); });
        hub.appendChild(b);
      }
      el.colBody.appendChild(hub);
      colOpen();
      return;
    }
    const cat = COL_CATS.find(c => 'cat:' + c.key === colView) || COL_CATS[0];
    $('colSub').textContent = t('colCatSub_' + cat.key);
    const bar = document.createElement('div');
    bar.className = 'col-bar';
    bar.innerHTML = `<div class="col-plate">${cat.ico} ${t('colCat_' + cat.key)}</div>`;
    if (cat.filters) {
      const chips = document.createElement('div');
      chips.className = 'col-chips';
      for (const f of cat.filters) {
        const b = document.createElement('button');
        b.className = 'col-chip tr-' + f + (colFilter === f ? ' on' : '');
        b.textContent = f === 'all' ? t('colAll') : cat.filterLabel ? cat.filterLabel(f) : T.rarity(f);
        b.addEventListener('click', () => { colFilter = f; colPage = 0; showCollection(colView); });
        chips.appendChild(b);
      }
      bar.appendChild(chips);
    }
    el.colBody.appendChild(bar);
    if (!cat.card) {   // oyun modları: durum satırları
      const wrap = document.createElement('div');
      wrap.className = 'col-modes col-well';
      for (const m of cat.items()) {
        const row = document.createElement('div');
        row.className = 'cm-row' + (m.open ? '' : ' locked');
        row.innerHTML = `<span class="cm-ico">${m.open ? '🔓' : '🔒'}</span><span class="cm-name">${t('modeName_' + m.key)}</span>`
          + `<span class="cm-note">${m.never ? t('modeAlwaysOpen') : m.open ? (m.done ? t('modeDone') : t('modeOpen')) : t('modeLockedTip')}</span>`;
        wrap.appendChild(row);
      }
      el.colBody.appendChild(wrap);
      colOpen();
      return;
    }
    let items = cat.items();
    if (cat.filters && colFilter !== 'all') items = items.filter(d => d.rarity === colFilter);
    const pages = Math.max(1, Math.ceil(items.length / COL_PAGE));
    colPage = Math.min(Math.max(0, colPage), pages - 1);
    const grid = document.createElement('div');
    grid.className = 'col-page-grid col-well col-cat-' + cat.key;
    for (const d of items.slice(colPage * COL_PAGE, (colPage + 1) * COL_PAGE)) grid.appendChild(cat.card(d));
    el.colBody.appendChild(grid);
    if (cat.key === 'music') colMusicSync();
    const pager = document.createElement('div');
    pager.className = 'col-pager';
    pager.innerHTML = `<button class="rp-arrow col-prev" ${pages < 2 ? 'disabled' : ''}>‹</button>`
      + `<div class="col-pages">${t('colPage', colPage + 1, pages)}</div>`
      + `<button class="rp-arrow col-next" ${pages < 2 ? 'disabled' : ''}>›</button>`;
    pager.querySelector('.col-prev').addEventListener('click', () => { colPage = (colPage - 1 + pages) % pages; showCollection(colView); });
    pager.querySelector('.col-next').addEventListener('click', () => { colPage = (colPage + 1) % pages; showCollection(colView); });
    el.colBody.appendChild(pager);
    colOpen();
  }

  function renderCollectionAll() {
    const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const all = Object.values(JOKER_DEFS);
    $('colSub').textContent = t('colSub', all.length);
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
    /* P61 — Kumarhane jokerleri kendi rafında (yalnız o modda çıkarlar) */
    const casinoDefs = all.filter(d => d.casino)
      .sort((x, y) => order.indexOf(x.rarity) - order.indexOf(y.rarity));   // nadirliğe göre (kullanıcı isteği)
    for (const rar of [...order, 'casino']) {
      const defs = rar === 'casino' ? casinoDefs : all.filter(d => d.rarity === rar && !d.casino);
      if (!defs.length) continue;
      const head = document.createElement('div');
      head.className = `col-rar-head tr-${rar === 'casino' ? 'legendary col-casino-head' : rar}`;
      if (rar === 'casino') {
        head.innerHTML = `🎰 ${t('colCasino')} <span>${t('colCount', defs.length)}</span><small>${t('colCasinoNote')}</small>`;
        el.colBody.appendChild(head);
        const grid = document.createElement('div');
        grid.className = 'col-grid tr-col-tiles col-casino';
        for (const d of defs) grid.appendChild(colJokerCard(d));
        el.colBody.appendChild(grid);
        continue;
      }
      head.innerHTML = `${T.rarity(rar)} <span>${t('colCount', defs.length)}</span>`;
      el.colBody.appendChild(head);
      const grid = document.createElement('div');
      /* GRUP D + E (kullanıcı kararı 2026-09-07) — BOSS (EPIC) RAFI ARTIK
         KART DEĞİL GÖRSEL DİZİSİ. Özel taş rafıyla aynı dil: kart kabuğu
         (krem zemin, çerçeve, gölge) yok, yalnız jokerin kendi çizimi;
         ad ve açıklama hover tooltip'inde. Görseli hazırlanmamış 10 boss
         jokeri BLANK durur (kart arkası) — bilgi yine hover'da tam. */
      /* P54 · Grup F: Mythic'in de Figma çizimleri geldi → aynı görsel dizisi
         (çizimi olmayan The World blank/kart arkası durur). */
      const artRow = COL_ART_RARITIES.has(rar) || rarityHasArt(rar);
      grid.className = artRow ? 'col-grid col-jk-row' : 'col-grid';
      for (const def of defs) {
        const tile2 = colJokerCard(def);
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
        grid.appendChild(colConsumCard(def));
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
        /* Kart kabuğu BİLEREK yok; kart yalnız taşın Figma varlığını gösterir,
           ad/açıklama tooltip'te (kullanıcı kararları 2026-09-06) — bkz. colSpecialCard. */
        grid.appendChild(colSpecialCard(def));
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
  }

  el.btnCollection.addEventListener('click', () => showCollection('hub'));
  el.btnColBack.addEventListener('click', () => {
    hideTip();
    /* P64: kategoriden önce girişe döner, girişten kapanır */
    if (colView !== 'hub' && colView !== 'all') { showCollection('hub'); return; }
    el.collectionOverlay.classList.add('hidden');
    if (Music.forced) Music.force(null);
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
    /* Emniyet ağı (goNextRound içinde): normalde son boss geçildiğinde
       store zaten açılmıyor (Grup M, Game._sealRunIfFinished); eski
       kayıtlardan devam eden bir run bu yoldan biterse zafer ekranına düşer.
       Yeni stage'de okey ilanı da orada. */
    goNextRound();
  });

  /* pencere boyutu değişince oyun ekranını yeniden ölçekle */
  window.addEventListener('resize', () => {
    if (!el.gameScreen.classList.contains('hidden')) render();
  });

  /* toast gizli başlasın */
  el.toast.classList.add('hidden');

  /* Ses efektleri (GDD 14.5) — P67: aç/kapa + seviye Ayarlar penceresinde
     (duraklat menülerindeki "Ses" düğmesi kaldırıldı). */

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
  /* P54 (kullanıcı isteği 2026-09-29: "trainer'da jokerleri koleksiyondaki
     gibi görelim") — çip listesi yerine KOLEKSİYON KARTLARI. Kart
     koleksiyonla aynı kurucudan gelir (colJokerCard / colConsumCard /
     colSpecialCard); üstüne yalnız SEÇİM durumu eklenir: `.tr-pick` +
     `.on` (yeşil çerçeve + ✓). Çizimli kartta ad görünmez (koleksiyon
     kuralı), ama `.tp-name` ekran okuyucu için gizli etiket olarak durur. */
  function trPickCard(card, name, isOn, onClick) {
    card.classList.add('tr-pick', 'tr-card');
    card.classList.toggle('on', !!isOn);
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.insertAdjacentHTML('beforeend',
      `<span class="tp-name tr-sr">${name}</span><span class="tr-check">✓</span>`);
    card.addEventListener('click', onClick);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
    return card;
  }

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
      grid.className = 'tr-grid col-grid ' + (COL_ART_RARITIES.has(r) || rarityHasArt(r) ? 'col-jk-row' : 'tr-col-tiles');
      for (const d of defs) {
        const card = trPickCard(colJokerCard(d), T.name({ key: d.key, name: d.name }),
          selected.has(d.key), () => {
            onToggle(d.key);
            card.classList.toggle('on', selected.has(d.key));
          });
        grid.appendChild(card);
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
    cg.className = 'tr-grid col-grid col-cs-row';
    for (const d of Object.values(CONSUMABLES)) {
      const b = trPickCard(colConsumCard(d), T.consumName(d.key, d.name), false, () => {
        if (selC.has(d.key)) selC.delete(d.key);
        else if (selC.size < cMax) selC.add(d.key);
        b.classList.toggle('on', selC.has(d.key));
        updCh();
      });
      cg.appendChild(b);
    }
    body.appendChild(cg);

    /* P42 (kullanıcı isteği 2026-09-14) — DESTE İÇERİĞİ: seçilen özel taş
       türleri destenin TAMAMINA dağıtılır (okey yüzü hariç), test edilecek
       taş her çekişte ele gelir. Hiç seçilmezse deste normaldir. Joker
       taşları burada yok — onlar yukarıdaki joker seçimiyle alınır. */
    const selS = new Set();
    const sh = document.createElement('h3');
    const updSh = () => { sh.textContent = `${t('trDeckSp')} — ${t('trPicked', selS.size)}`; };
    updSh();
    /* açıklama başlığın ipucunda: ayrı paragraf pop-up'ı kaydırmaya zorluyordu
       (P20 · Grup K kuralı: kurulum ekranı 1920×1080'de kaydırmasız sığar) */
    sh.title = t('trDeckSpHint');
    body.appendChild(sh);
    const sg = document.createElement('div');
    sg.className = 'tr-grid tr-deck-sp col-grid col-sp-row';
    for (const d of Object.values(SPECIAL_TILES)) {
      const b = trPickCard(colSpecialCard(d), T.specialName(d.key, d.name), false, () => {
        selS.has(d.key) ? selS.delete(d.key) : selS.add(d.key);
        b.classList.toggle('on', selS.has(d.key));
        updSh();
      });
      b.dataset.sp = d.key;
      sg.appendChild(b);
    }
    body.appendChild(sg);

    // GRUP K (P20): seçenekler ve düğmeler sabit alt barda
    const foot = document.createElement('div');
    foot.className = 'tr-foot';
    panel.appendChild(foot);

    const row = document.createElement('div');
    row.className = 'tr-opts';
    /* P58 · Grup D — OYUN MODU: liste motorun RUN_MODES'undan gelir, yeni
       mod eklenince burada kendiliğinden belirir. Varsayılan Temel Run.
       Mod değişince stage seçimi o modun stage sayısına çekilir. */
    const modeKeys = Game.runModeKeys ? Game.runModeKeys() : ['base'];
    const modeName = (k) => { const v = t('modeName_' + k); return v && v !== 'modeName_' + k ? v : k; };
    row.innerHTML =
      `<label>${t('trMode')} <select id="trMode">` +
      modeKeys.map(k => `<option value="${k}"${k === 'base' ? ' selected' : ''}>${modeName(k)}</option>`).join('') +
      `</select></label>` +
      `<label>${t('trStages')} <select id="trStages">` +
      `<option value="1">1</option><option value="3">3</option><option value="4">4</option>` +
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
    row.querySelector('#trMode').addEventListener('change', (e) => {
      const n = Game.runModeStages ? Game.runModeStages(e.target.value) : 8;
      const sel = row.querySelector('#trStages');
      if (![...sel.options].some(o => o.value === String(n)))
        sel.insertAdjacentHTML('beforeend', `<option value="${n}">${n}</option>`);
      sel.value = String(n);
    });

    const acts = document.createElement('div');
    acts.className = 'tr-acts';
    const bStart = document.createElement('button');
    bStart.className = 'btn primary';
    bStart.textContent = t('trStart');
    bStart.addEventListener('click', () => {
      hideTip();
      const chSel = panel.querySelector('#trStages').value;
      Game.newTrainerRun({
        mode: panel.querySelector('#trMode').value || 'base',   // P58 · Grup D
        stages: chSel === 'inf' ? Infinity : parseInt(chSel, 10),
        jokers: [...selJ],
        consumables: [...selC],
        deckSpecials: [...selS],   // P42: deste içeriği (özel taşlar)
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
    // P37 — bildirim kartları kapalı; eski testler kendi kontrolleri için açar
    setNotes: (on) => { NOTES_ENABLED = !!on; },
    // Playtest 18 — Grup E: dil değişimini test tarafında da gerçek akışla uygula
    applyStaticTexts, fitPauseMenu,
    // Playtest 20 — Grup R: mod kilit sistemi
    Modes,
    // P60 — run raporu + ipucu penceresi
    Hints, runReport, showGameOver, showBetPicker, showKatlaOffer, renderWell,
    // P61 — Kumarhane hissi
    Music, applyRunTheme,
    showHiLo, showSideBet, showRuletPick, kumarStartPanels, showJackpot, pickRunMode, showSettings, showRunPick,
    collectionView: (v) => showCollection(v) };
})();
