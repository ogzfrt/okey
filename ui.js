/* ============================================================
   OKEY ROGUELIKE — UI katmanı v4
   Ekranlar: menü → harita → oyun (+ modal / store / settings)
   Oyun mantığı engine.js'te, metinler i18n.js'te (T.*).
   Öğretici: gerçek, oynanabilir Stage 1 + bağlamsal ipuçları.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);

  /* LUSORIA BETA (test sürümü) — TEST_SÜRÜM derlemesinde window.LUSORIA_BETA
     tanımlıdır; prototipte null → aşağıdaki tüm `BETA` dalları inert. */
  const BETA = window.LUSORIA_BETA || null;
  const betaHook = (name, data) => { if (BETA && BETA.hook) BETA.hook(name, data); };

  const el = {};
  ['menuScreen','mapScreen','gameScreen','btnPlay','btnSettings',
   'btnCollection','btnQuit','menuLogo','btnTrainer',
   /* GRUP I (2026-09-07): harita Figma tuvaline taşındı — eski kenar
      çubuğunun kimlikleri (mapCoins/mapPermMult/mapJokers/btnMapMenu)
      tasarımda karşılığı olmadığı için KALDIRILDI. */
   'mapStage','mapRound','mapScoreVal','mapCoinVal','mapOkey','mapCards',
   'mapJokerSlots','mapDeckCount','mapDiscardSlot',
   'mapConsumRow','mapBackupRow','mapConsumCount','mapBackupCount',   // P80 — haritada envanter
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
    ? Math.max(Game.jokerSellOf(key, rarity), Math.round(Game.jokerPriceOf(key, rarity) * SIGORTA_RATE)) : Game.jokerSellOf(key, rarity));   // P51: %75 · denetim3 #20: boss jokeri 0 göstermesin

  /* ---------- Oyun kimliği (Grup D) ----------
     İsim henüz kesinleşmedi (Kısmet / Taşlık / Okeylike / Rakkam ...).
     Başlık tek yerden değişir; mascotLetter, logoda maskot görselinin
     OTURDUĞU harfin indeksidir (-1 = maskot slotu yok). */
  /* Oyun adı — Figma v3'te (node 74:3) başlık RASTER DEĞİL gerçek metin
     katmanı (94:2397 / 94:2398), o yüzden isim yine buradan sürülüyor:
     tek satır değiştirmek yeterli, Figma'dan yeniden export gerekmez. */
  const GAME_CONFIG = {
    /* P99 (kullanıcı 2026-10-14): "OKEY Roguelike" taslak addı → LUSORIA
       (şimdilik; ileride değişebilir). Alt başlık yok (boş = çizilmez). */
    title: 'LUSORIA',
    subtitle: '',
  };

  /* Logo — Figma "OKEY-101 / yeni test" (node 74:3, 2026-08-10 sürümü):
     plaka (node 95:439 konumu; P99'dan beri tema plakası, style.css
     .fm-banner — krem banner.svg kalktı) + içinde başlık.
     Kilit CSS flex ile plakaya YATAY ve DİKEY tam ortalanır (mutlak ofset
     yok) → plaka yeniden export edilse veya isim değişse bile ortalama
     bozulmaz.
     Maskot bu panonun parçası DEĞİL: tasarımda ayrı katman (94:2364),
     sahnede sağda duruyor ve index.html'den doğrudan yükleniyor.
     Kod tarafında maskot placeholder'ı YOK. */
  function renderLogo() {
    el.menuLogo.innerHTML =
      `<div class="fm-title">${pxAccents(GAME_CONFIG.title)}</div>` +
      (GAME_CONFIG.subtitle ? `<div class="fm-subtitle">${pxAccents(GAME_CONFIG.subtitle)}</div>` : '');
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
    /* kullanıcı 2026-10-23 ("maskot mantıksız kesiliyor") — 16:9'dan dar ekranda tuval sağdan kırpılır;
       maskot (ve eşyaları) görünen alana sığacak kadar SOLA kayar. En fazla plakanın sağına kadar
       (1131 → 820): ~5:4'e kadar tam görünür, daha darında kalan kısım yine sağdan kırpılır. */
    const visW = window.innerWidth / k;
    const hearts = document.querySelector('.fm-item-hearts.on');
    const right = hearts ? 1738 : 1611;   // maskot 1131+480 · Lady Luck kalpleri 1529+209
    const shift = Math.max(0, Math.min(1131 - 820, right + 40 - visW));
    document.documentElement.style.setProperty('--fm-mx', `${-Math.round(shift)}px`);
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
      betaHook('saved', { where });
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
  /* denetim RK (kullanıcı kararı 2026-10-22) — RAUND ORTASI KAYIT.
     Eskiden raund içinde çıkıp dönen oyuncu raundu BAŞTAN, aynı deste sırasıyla oynuyordu
     (geleceği bilerek; Kumarhane'de kör bahis eli görerek verilebiliyor, tutmayacak Katla'dan
     çıkıp dönülerek Game Over'dan kaçılabiliyordu). Artık raund oynanırken her çizimden sonra
     (setTimeout 0 ile birleştirilir) motorun TAM durumu yazılır: el, ıstaka, masa, tur, puan,
     bahis/Katla, deste sırası, rng durumu (serialize → rngState). `mid: true` bu kaydı eski
     "raund başı" kaydından ayırır. Raund kaybedildiği AN kayıt silinir (Game Over geri alınamaz).
     Bahis henüz verilmediyse (Kumarhane, eli görmeden) raund içi kayıt yazılmaz. */
  let roundSaveTimer = null;
  function saveRoundNow() {
    if (roundSaveTimer) { clearTimeout(roundSaveTimer); roundSaveTimer = null; }
    if (TUT.active || Game.tutorialMode || Game.trainerMode) return;
    const s = Game.state;
    if (!s) return;
    if (s.status === 'lost') { if (loadSave()) clearSave(); return; }
    /* kazanılan raund (zafer penceresi, store'a geçmeden) da yazılır: yenilenince son tur
       yeniden oynanmaz; resumeSave store / güçlendirme / sonraki raunda geçer. Run bittiyse
       zafer ekranı kaydı kendisi siler. */
    const won = s.status === 'won' && !s.runFinished;
    if ((s.status !== 'playing' && !won) || curScreen() !== 'game') return;
    if (Game.needsBet && Game.needsBet()) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ where: 'inRound', mid: true, data: Game.serialize() }));
    } catch (e) { /* depolama dolu vb. — kayıt sessizce atlanır */ }
  }
  function scheduleRoundSave() {
    if (!roundSaveTimer) roundSaveTimer = setTimeout(saveRoundNow, 0);
  }
  window.addEventListener('pagehide', saveRoundNow);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveRoundNow(); });
  function loadSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function clearSave() { localStorage.removeItem(SAVE_KEY); }

  /* ---------- Ekran yönetimi ---------- */

  // Bu run'ın toplam stage sayısı gösterimi (Sonsuz Mod → ∞)
  const chCount = () => Game.totalStages() === Infinity ? '∞' : Game.totalStages();
  /* P71 — Kumarhane finalinde "5/5" yerine FİNAL yazılır (stage ve raund göstergeleri) */
  const stageText = (s) => Game.isFinalStage() ? t('stageFinal') : `${s.stage}/${chCount()}`;
  const roundText = (s) => Game.isFinalStage() ? t('mapFinal') : `${s.roundInStage}/3`;

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
      c.textContent = Game.state && Game.state.bossTest ? t('trBadgeBoss') : t('trBadge');
      return c;
    };
    /* Oyun ekranı: Figma düzeninde sol istatistik sütununun akışına girer
       (eski `.brand` üst barı kalktı; orada konumsuz kalıp ıstakaya
       biniyordu). */
    /* Raund atlama düğmesi oyun ekranında DEĞİL, HARİTADA durur
       (kullanıcı kararı 2026-08-26): raundun içindeyken atlamak istenmiyor,
       atlama kararı raunda girmeden önce veriliyor. Bkz. renderMap(). */
    /* P90g — sol sütun final raundunda (boss kutusu + Orion paneli) ıstaka
       sekmesine kadar doluyor; çip sütun akışında en alta düşüp ıstakanın
       arkasında kalıyordu → oyun tuvalinde "i" düğmesinin sağına sabit. */
    (document.querySelector('#gameScreen .gm-stage') || document.querySelector('#gameScreen .gm-left'))?.appendChild(mk());
    // Store sahnesi: sol sütunun akışına (haritadaki gibi başlığın altına)
    document.getElementById('storeSide')?.appendChild(mk());
    // Upgrade sahnesi başlığın üstüne
    const up = document.getElementById('upgradeScene');
    if (up) up.insertBefore(mk(), up.firstChild);
    // Harita: #trainerMapBar zaten "🧪 TRAINER" etiketi taşıyor (renderMap)
  }

  /* P69c — raund adları: Temel Run'da Açılış Masası / Usta Masası, Kumarhane
     run'ında kumarhane dili (Fiş Masası / VIP Masa; kullanıcı seçimi 2026-10-05). */
  function roundName(n) {
    const casino = !!(Game.state && Game.kumarhaneOn && Game.kumarhaneOn());
    return t((casino ? 'casino' : 'normal') + n);
  }

  /* P85 — FİNAL BOSS EŞYASI ana menü maskotunda: yenilen her finalin eşyası
     (FINAL_BOSSES[..].mascotItem; index.html .fm-mascot-item[data-final]) görünür.
     Kayıt doğrudan okunur: showScreen açılışta Finals tanımlanmadan çağrılır. */
  function updateMascotItems() {
    let won = {};
    try { won = JSON.parse(localStorage.getItem('okeyFinals')) || {}; } catch (e) { /* bozuk kayıt: eşya yok */ }
    document.querySelectorAll('.fm-mascot-item').forEach((im) => im.classList.toggle('on', !!won[im.dataset.final]));
    fitMenuScale();   // kalpler maskotun sağına taşar → kaydırma payı eşyaya göre
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
    if (name === 'menu') { fitMenuLabels(); updateMascotItems(); } // görünür olunca ölçülebilir
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
    /* LANETLİ BOYUT — Karanlık Takas (zorunlu) sunaktan ve store'dan önce */
    if (Game.takasState && Game.takasState()) { showTakas(() => openStore()); return; }
    /* kullanıcı 2026-10-29: Adak Sunağı boss raundunu yendikten hemen sonra KENDİLİĞİNDEN açılır, ardından store */
    const alt = Game.altarState && Game.altarState();
    if (alt && alt.offers.length && !alt.done && !Game.state.altar.seen) {
      Game.state.altar.seen = true;
      showAltar(() => openStore());
      return;
    }
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
    /* Hedef: küçülmüş taş atılanlar yuvasının TAM ORTASINA otursun.
       Ötelemeler ekran pikselindedir (kopyanın ebeveyni body, ölçeksiz). */
    const dx = dst.left + (dst.width - r.width * .88) / 2 - r.left;
    const dy = dst.top + (dst.height - r.height * .88) / 2 - r.top;
    /* P118 — taş düz çizgide kaymaz, havaya kalkıp yay çizerek yuvaya düşer */
    if (!fxOff()) {
      clone.style.transition = 'none';
      const ms = 540 * fxK();
      clone.animate([
        { transform: `scale(${k})` },
        { transform: `translate(${dx * .42}px, ${dy * .42 - 90 * k}px) scale(${k * 1.06}) rotate(-12deg)`, offset: .42 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k * .88}) rotate(6deg)` },
      ], { duration: ms, easing: 'cubic-bezier(.3,.1,.45,1)', fill: 'forwards' });
      setTimeout(() => clone.remove(), ms + 30);
      return;
    }
    void clone.offsetWidth;          // başlangıç hâli uygulansın, geçiş oradan başlasın
    requestAnimationFrame(() => {
      clone.style.transform =
        `translate(${dx}px, ${dy}px) scale(${k * .88}) rotate(6deg)`;
      clone.style.opacity = '.9';
    });
    setTimeout(() => clone.remove(), 480);
  }

  /* ============================================================
     P118 (kullanıcı isteği 2026-10-30, Balatro videoları) — TAŞ HAREKETİ
     Taşlar artık ıstakada "belirmez": desteden kalkar, havada arka
     yüzünden ön yüzüne döner ve hücresine oturur.
     • Raund başı (dealHand): tüm el soldan sağa, üst sıra sonra alt sıra,
       tek tek dağıtılır.
     • Çekiş (newTileIds): atıştan/jokerden gelen taş aynı yoldan uçar.
     • Seçme: taş yaylanarak kalkar / iner.
     Istaka her render'da YENİDEN KURULUR; bu yüzden uçuş taşın kendisine
     değil kimliğine bağlıdır (dealFx: id → başlangıç anı). Uçuş sürerken
     render gelirse yeni taş, animasyona kaldığı ANDAN devam eder.
     Otomasyon tarayıcısında (playwright) ve "hareketi azalt" tercihinde
     kapalıdır — yerleşim ölçen testler taşı yerinde bulmalı.
     ============================================================ */
  const fxOff = () => {
    if (typeof navigator !== 'undefined' && navigator.webdriver && !window.__fxTest) return true;
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };
  /* Ayarlar › Animasyon hızı "Hızlı" → süreler yarıya (animSpeed aşağıda tanımlı: TDZ'ye düşmemek için doğrudan okunur) */
  /* window.__fxSlow: inceleme kancası — hareketi kare kare görmek için yavaşlatır */
  const fxK = () => { let k = 1; try { k = localStorage.getItem('okeyAnimSpeed') === 'fast' ? .5 : 1; } catch (e) { /* varsayılan */ } return k * (window.__fxSlow || 1); };
  const dealFx = new Map();   // taş id → { t0, delay, dur }
  const TILE_FLY = 600;       // bir taşın desteden hücresine uçuşu (ms)
  let dealAllPending = false;
  let selFx = null;           // { id, on, at } — son tıklanan taş
  function dealHand() { if (!fxOff()) dealAllPending = true; }

  /* ============================================================
     P120 (kullanıcı onayı 2026-10-30) — TAŞ DÖNÜŞÜMÜ. Istakadaki bir taşın
     KİMLİĞİ (renk, sayı, okey, heykel, Ay Taşı, Freedom işareti, boss/joker
     rozetleri, ters yüz…) iki çizim arasında değiştiyse: taş hafif kalkar,
     ESKİ yüzüyle döner, ortada YENİ yüzüne geçer (tarot gibi), piksel
     kıvılcımlar saçılır ve dönüştüren joker kartı panelde bir kez sıçrar.
     Tek genel mekanizma: hangi joker/değnek/boss dönüştürürse dönüştürsün
     çalışır; Figma'dan yeni dönüşüm çizimi gelince ayrıca kod gerekmez.
     ============================================================ */
  const TILE_ID_CLS = /^(red|blue|yellow|black|okey|fake-okey|face-down|deck-joker|apple-tile|pinky-okey|sp-.+|moon-tile|moon-full|stoned|ghost-tile|ff-mark|bm-(?!done$).+|src-.+|fossil-tile|kabus-tile|anom-tile|sentinel-tile|rot-\d|cocuk-lock)$/;
  const tileSig = (d) => [...d.classList].filter((c) => TILE_ID_CLS.test(c)).sort().join(' ')
    + '|' + ((d.querySelector('.num') || {}).textContent || '');
  // dönüşümün kaynağı: önce taşın kendi kökeni, yoksa yeni sınıftan tahmin
  const XF_ORIGIN = { pinky: 'pinkyWarrior' };
  const XF_SRC = [[/stoned/, 'medusa'], [/pinky-okey/, 'pinkyWarrior'], [/sp-ayTasi|moon-/, 'otekiDunya'], [/ff-mark|bm-bff/, 'freedom'],
    [/bm-(zinf|binf)/, 'zombie'], [/sewn/, 'terziIgne'], [/glitch|bm-gl/, 'dervish'], [/anom-tile/, 'anomali'], [/fossil-tile/, 'fosil'],
    [/src-alien/, 'uzayli'], [/apple-tile/, 'yasakElma'], [/face-down/, 'ucKagitci']];
  function xfSource(d, oldSig, newSig) {
    if (d.dataset.origin) return XF_ORIGIN[d.dataset.origin] || d.dataset.origin;
    const was = oldSig.split('|')[0].split(' ');
    const added = newSig.split('|')[0].split(' ').filter((c) => !was.includes(c)).join(' ')
      || oldSig.split('|')[0];   // yalnız sınıf kalktıysa (ör. ters yüz açıldı) eskisine bak
    const hit = XF_SRC.find(([re]) => re.test(added));
    return hit ? hit[1] : null;
  }
  function xfTile(d, old, i, src) {
    const row = d.parentNode, rw = row.getBoundingClientRect(), tr = d.getBoundingClientRect();
    if (!tr.width) return;
    const k = tr.width / d.offsetWidth, K = fxK();
    const delay = i * 80 * K, dur = 600 * K;
    // eski yüz: aynı hücrenin üstünde, satırın içinde (sahne ölçeğinde)
    old.getAnimations().forEach((a) => a.cancel());
    old.classList.remove('selected', 'new', 'drag-src');
    old.classList.add('xf-old');
    old.removeAttribute('style');
    Object.assign(old.style, { left: (tr.left - rw.left) / k + 'px', top: (tr.top - rw.top) / k + 'px' });
    row.appendChild(old);
    old.animate([
      { transform: 'translateY(0) scaleX(1)' },
      { transform: 'translateY(-16px) scaleX(1.05)', offset: .25 },
      { transform: 'translateY(-16px) scaleX(0)', offset: .5 },
      { transform: 'translateY(-16px) scaleX(0)' },
    ], { duration: dur, delay, fill: 'both', easing: 'ease-in' }).onfinish = () => old.remove();
    d.animate([
      { transform: 'translateY(-16px) scaleX(0)' },
      { transform: 'translateY(-16px) scaleX(0)', offset: .5 },
      { transform: 'translateY(-22px) scaleX(1.12)', offset: .74 },
      { transform: 'translateY(0) scaleX(1)' },
    ], { duration: dur, delay, fill: 'backwards', easing: 'ease-out' });
    setTimeout(() => {
      if (!row.isConnected) return;
      // piksel kıvılcımlar: taşın ortasından dışa
      const cx = (tr.left - rw.left + tr.width / 2) / k, cy = (tr.top - rw.top + tr.height / 2) / k - 16;
      for (let n = 0; n < 12; n++) {
        const p = document.createElement('i');
        p.className = 'xf-spark';
        const ang = (n / 12) * Math.PI * 2 + Math.random() * .4, dist = 46 + Math.random() * 38;
        p.style.left = cx + 'px'; p.style.top = cy + 'px';
        p.style.background = ['#FFE58A', '#FFFFFF', 'var(--gm-turn-on)'][n % 3];
        row.appendChild(p);
        p.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(.4)`, opacity: 0 }],
          { duration: 460 * K, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
      }
      if (i < 4) { beep(1320, .05, 'triangle', .04); beep(1760, .07, 'triangle', .035, .05); }
      // dönüştüren joker kartı panelde bir kez sıçrar
      const card = src && document.querySelector(`#jokerSlots .joker-tile.jk-${src}`);
      if (card && !card.dataset.xfBump) {
        card.dataset.xfBump = '1';
        card.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-14px) rotate(-6deg) scale(1.08)', offset: .4 },
          { transform: 'translateY(0) rotate(3deg)', offset: .75 }, { transform: 'translateY(0) rotate(0)' }],
          { duration: 420 * K, easing: 'ease-out' }).onfinish = () => { delete card.dataset.xfBump; };
      }
    }, delay + dur * .5);
  }
  function runXf(prevTiles, tiles) {
    if (!prevTiles || !prevTiles.size) return;
    let n = 0;
    for (const d of tiles) {
      const id = d.dataset.id;
      const old = prevTiles.get(id);
      if (!old || dealFx.has(id) || newTileIds.has(+id) || newTileIds.has(id)) continue;
      const a = tileSig(old), b = tileSig(d);
      if (a === b) continue;
      xfTile(d, old, Math.min(n++, 12), xfSource(d, a, b));
    }
  }

  function runTileFx(prevTiles) {
    if (fxOff()) { dealAllPending = false; dealFx.clear(); return; }
    const now = performance.now();
    const tiles = [...el.rack.querySelectorAll('.tile[data-id]')];
    const deck = document.querySelector('#pileCol .deck-pile');
    if (dealAllPending) {
      dealAllPending = false;
      const k = fxK();
      /* P118b (kullanıcı: "taşların gelişi çok hızlı") — 21 taşlık el ~1.7 sn'de dağıtılır, her uçuş 0.6 sn */
      const step = Math.min(85, 1650 / Math.max(1, tiles.length)) * k;
      tiles.forEach((d, i) => dealFx.set(d.dataset.id, { t0: now, delay: i * step, dur: TILE_FLY * k }));
      /* her taş oturduğunda kısa bir "tık" — beep'in `when` parametresiyle tek seferde planlanır */
      tiles.forEach((_, i) => beep(1500 + (i % 5) * 90, .018, 'square', .022, (i * step + TILE_FLY * k * .85) / 1000));
    }
    // çekilen taşlar (atış, joker, değnek …) — newTileIds render'dan ~600 ms sonra temizlenir
    let n = 0;
    for (const id of newTileIds) {
      const key = String(id);
      if (!dealFx.has(key)) dealFx.set(key, { t0: now, delay: (n++) * 120 * fxK(), dur: TILE_FLY * fxK() });
    }
    for (const [key, f] of dealFx) {   // biten ve artık "yeni" olmayan kayıtlar silinir
      if (now - f.t0 > f.delay + f.dur + 50 && !newTileIds.has(+key) && !newTileIds.has(key)) dealFx.delete(key);
    }
    el.rack.querySelectorAll('.deal-ph').forEach((x) => x.remove());   // önceki render'ın yer tutucuları
    runXf(prevTiles, tiles);   // P120 — kimliği değişen taşlar döner
    if (!dealFx.size && !selFx) return;
    const dr = deck && deck.getBoundingClientRect();
    for (const d of tiles) {
      const f = dealFx.get(d.dataset.id);
      if (f && dr && dr.width) {
        const elapsed = now - f.t0;
        if (elapsed >= f.delay + f.dur) continue;
        const tr = d.getBoundingClientRect();
        if (!tr.width) continue;
        const k = tr.width / d.offsetWidth;   // gm-stage ölçeği: ekran pikseli → tasarım pikseli
        const dx = (dr.left + dr.width / 2 - (tr.left + tr.width / 2)) / k;
        const dy = (dr.top + dr.height / 2 - (tr.top + tr.height / 2)) / k;
        const s0 = dr.width / tr.width;       // destedeki taş ıstakadakinden büyük olabilir
        d.style.animation = 'none';           // eski CSS tileDraw kayması devre dışı
        const back = document.createElement('i');
        back.className = 'tile-back-fx';
        d.appendChild(back);
        /* iki animasyon AYNI eğriyi paylaşır: ofsetler eğri uygulanmış ilerlemededir,
           yoksa arka yüz, taş dönüşü bitirdikten sonra da görünür kalır */
        const opt = { duration: f.dur, delay: f.delay, fill: 'backwards', easing: 'cubic-bezier(.25,.6,.35,1)' };
        const FLIP = .3;   // dönüş yolun başında biter; taş yolun çoğunu yüzü açık uçar
        const a = d.animate([
          { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${s0}, ${s0})` },
          { transform: `translate(${dx * (1 - FLIP)}px, ${dy * (1 - FLIP) - 56}px) rotate(-10deg) scale(.04, ${(s0 + 1.1) / 2})`, offset: FLIP },
          { transform: `translate(0px, -12px) rotate(3deg) scale(1.06, 1.06)`, offset: .78 },
          { transform: `translate(0px, 0px) rotate(0deg) scale(1, 1)` },
        ], opt);
        // arka yüz dönüşün ilk yarısında görünür, taş "yan" durduğu anda kaybolur
        const b = back.animate([{ opacity: 1 }, { opacity: 1, offset: FLIP }, { opacity: 0, offset: FLIP }, { opacity: 0 }], opt);
        a.currentTime = b.currentTime = elapsed;
        a.onfinish = () => back.remove();
        d.style.zIndex = '6';
        setTimeout(() => { d.style.zIndex = ''; }, Math.max(0, f.delay + f.dur - elapsed));
        /* P118c (kullanıcı) — taş gelene kadar hücresi BOŞ YUVA gibi görünsün; yoksa dağıtım
           sürerken taşların ineceği yer düz açık zemin kalıyordu. Yer tutucu satırın İLK
           çocuğu (taşların altında kalsın: satır translate yüzünden kendi katmanıdır); hücre
           sırası sayan sürükle-bırak kodu .deal-ph'yi atlar. */
        const row = d.parentNode, rw = row.getBoundingClientRect();
        const ph = document.createElement('div');
        ph.className = 'rack-empty deal-ph';
        Object.assign(ph.style, { left: (tr.left - rw.left) / k + 'px', top: (tr.top - rw.top) / k + 'px' });
        row.insertBefore(ph, row.firstChild);
        a.addEventListener('finish', () => ph.remove());
        a.addEventListener('cancel', () => ph.remove());
        continue;
      }
      if (selFx && d.dataset.id === String(selFx.id) && now - selFx.at < 120) {
        d.animate(selFx.on
          ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-15px) rotate(-3deg) scale(1.06)', offset: .55 }, { transform: 'translateY(-10px)' }]
          : [{ transform: 'translateY(-10px)' }, { transform: 'translateY(3px) scale(.97)', offset: .6 }, { transform: 'translateY(0)' }],
        { duration: 210 * fxK(), easing: 'ease-out' });
      }
    }
    selFx = null;
  }

  /* ============================================================
     P118 — OYUNA GİRİŞ SPLASH'İ (yeni run · devam · öğretici)
     Menüden haritaya sert kesme yerine: ekran temanın koyu tonuyla
     kararır, ortada maskotlu taş arkası belirir; perde arkasında ekran
     değişir, çapraz bir silme perdeyi sağa süpürür ve taş piksel piksel
     yanarak kaybolur. Görsel, destenin CSS'teki arka yüzünden okunur
     (tek dosyalık sürüm CSS yollarını gömer, JS yollarını gömmez).
     ============================================================ */
  const Splash = {
    busy: false,
    queue: [],
    then(fn) { if (this.busy) this.queue.push(fn); else fn(); },
    play(mid) {
      const k = fxK();
      this.busy = true;
      const ov = document.createElement('div');
      ov.id = 'splashOv';
      ov.setAttribute('aria-hidden', 'true');
      ov.innerHTML = '<div class="sp-band"></div><div class="sp-cover"></div><div class="sp-tilewrap"><canvas class="sp-tile"></canvas></div>';
      document.body.appendChild(ov);
      const [band, cover, wrap] = ov.children;
      const cv = wrap.firstChild;
      const S = 3, PAD = 40, AW = 81, AH = 110;          // taş 81×110 piksel sanatı, 3 kat
      const W = AW * S + PAD * 2, H = AH * S + PAD * 2;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
      const img = new Image();
      const deck = document.querySelector('.gm-stage .deck-pile');
      const m = deck && /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(deck).backgroundImage);
      if (m) img.src = m[1];
      // yanma eşiği: alttan yukarı yükselen alev + piksel başına rastlantı
      const C = 2, cols = Math.ceil(AW / C), rows = Math.ceil(AH / C);
      const thr = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        thr.push((1 - y / rows) * .62 + Math.abs(x / cols - .5) * .18 + Math.random() * .28);
      }
      const sparks = [];
      let burn = -1;   // <0: yanma başlamadı
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        if (img.complete && img.naturalWidth) ctx.drawImage(img, PAD, PAD, AW * S, AH * S);
        if (burn >= 0) {
          ctx.globalCompositeOperation = 'destination-out';
          thr.forEach((v, i) => { if (v < burn - .07) ctx.fillRect(PAD + (i % cols) * C * S, PAD + Math.floor(i / cols) * C * S, C * S, C * S); });
          ctx.globalCompositeOperation = 'source-atop';   // kor yalnız taşın kalan piksellerine düşer
          thr.forEach((v, i) => {
            if (v >= burn - .07 && v < burn) {
              const q = (burn - v) / .07;
              ctx.fillStyle = q < .35 ? '#FFE58A' : q < .7 ? '#F28A2E' : '#6E2418';
              const x = PAD + (i % cols) * C * S, y = PAD + Math.floor(i / cols) * C * S;
              ctx.fillRect(x, y, C * S, C * S);
              if (q < .2 && Math.random() < .05) sparks.push({ x, y, vx: (Math.random() - .5) * .8, vy: -1 - Math.random() * 1.6, life: 1 });
            }
          });
          ctx.globalCompositeOperation = 'source-over';
        }
        for (const p of sparks) {
          p.x += p.vx; p.y += p.vy; p.life -= .035;
          if (p.life <= 0) continue;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.life > .5 ? '#FFE58A' : '#F28A2E';
          ctx.fillRect(Math.round(p.x), Math.round(p.y), S, S);
        }
        ctx.globalAlpha = 1;
      };
      let raf = 0;
      const loop = () => { draw(); raf = requestAnimationFrame(loop); };
      loop();
      /* Kullanıcı (P118b): "bi anda yok oluyor, kendini hissettirmiyor" — taş artık ağırlıkla
         iner (yaylanıp hafif ezilir, alçak bir vuruş sesi), karanlıkta ~1 sn süzülerek durur,
         silme ve yanma daha uzun sürer; toplam ~2.4 sn (Hızlı'da yarısı). */
      [band, cover].forEach((x) => x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 * k, fill: 'forwards' }));
      cv.animate([
        { transform: 'translateY(-60px) scale(.35) rotate(-16deg)', opacity: 0 },
        { transform: 'translateY(0) scale(1.12, 1.12) rotate(5deg)', opacity: 1, offset: .52 },
        { transform: 'translateY(0) scale(1.04, .94) rotate(-2deg)', opacity: 1, offset: .72 },
        { transform: 'translateY(0) scale(1, 1) rotate(0deg)', opacity: 1 },
      ], { duration: 620 * k, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
      // karanlıkta beklerken hafifçe süzülür (sarmalayıcıda: iniş animasyonuyla çakışmasın)
      const float = wrap.animate([
        { transform: 'translateY(0) rotate(-1.2deg)' },
        { transform: 'translateY(-8px) rotate(1.2deg)' },
        { transform: 'translateY(0) rotate(-1.2deg)' },
      ], { duration: 1700 * k, delay: 520 * k, iterations: Infinity, easing: 'ease-in-out' });
      SFX.draw();
      beep(110, .18, 'triangle', .09, .32 * k); beep(220, .08, 'square', .03, .32 * k);   // iniş vuruşu
      setTimeout(() => {
        try { mid(); } catch (e) { console.error('splash: ekran geçişi', e); }
        setTimeout(() => {
          // çapraz silme: kenarında temanın açık tonunda ince bir şerit
          const poly = (l) => `polygon(${l}% 0, 200% 0, 200% 100%, ${l - 28}% 100%)`;
          const wipe = { duration: 720 * k, easing: 'cubic-bezier(.6,0,.35,1)', fill: 'forwards' };
          cover.animate([{ clipPath: poly(0) }, { clipPath: poly(130) }], wipe);
          band.animate([{ clipPath: poly(-4) }, { clipPath: poly(126) }], wipe);
          beep(330, .2, 'triangle', .05); beep(495, .18, 'triangle', .04, .09);
          setTimeout(() => {   // yanma, silme kenarı taşın üstünden geçerken başlar
            const t0 = performance.now(), dur = 860 * k;
            beep(180, .3, 'sawtooth', .025);
            const tick = () => {
              burn = Math.min(1.1, ((performance.now() - t0) / dur) * 1.1);
              if (burn < 1.1) requestAnimationFrame(tick);
              else setTimeout(() => {
                cancelAnimationFrame(raf);
                float.cancel();
                ov.remove();
                this.busy = false;
                const q = this.queue.splice(0);
                q.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
              }, 240 * k);   // son kıvılcımlar sönsün
            };
            tick();
          }, 330 * k);
        }, 790 * k);
      }, 260 * k);
    },
  };
  function withSplash(fn) {
    if (Splash.busy || fxOff()) return fn();
    Splash.play(fn);
  }

  /* ============================================================
     P119 (kullanıcı seçimi 2026-10-30: "B) Mühür uyanıyor") — OYUN AÇILIŞ SPLASH'İ
     Karanlıkta gözü kapalı bir taş düşer, titrer, iki kez zıplar, döner;
     gözü açılır, kolları ve bacakları çıkar, göz kırpar ve hoplayarak
     menüdeki yerine yürür. O sırada perde açılır, logo iner, düğmeler
     sırayla kayarak gelir; sonunda gerçek menü maskotu devralır.
     Maskot katmanları assets/menu3/boot/ (mascot.svg'nin yolları, aynı
     480×674 tuval) — yollar CSS sınıflarında (tek dosyalık sürüm kuralı).
     Sayfa başına bir kez; tıklama / tuş anında geçer; testte ve "hareketi
     azalt"ta yok. ~3.3 sn (Hızlı animasyonda yarısı).
     ============================================================ */
  function bootSplash() {
    if (fxOff()) return;
    const mascot = document.querySelector('.fm-mascot');
    if (!mascot) return;
    const k = fxK();
    const items = [...document.querySelectorAll('.fm-mascot-item')];
    const menuEls = [document.getElementById('menuLogo'), ...document.querySelectorAll('.fm-buttons .fm-btn'), document.getElementById('btnNews')].filter(Boolean);
    // gerçek maskot salınımsız ölçülür (devir anında aynı yerde dursun)
    mascot.style.animation = 'none';
    mascot.style.visibility = 'hidden';
    items.forEach((x) => { x.style.opacity = '0'; });
    menuEls.forEach((x) => { x.style.opacity = '0'; });
    const R = mascot.getBoundingClientRect();
    const ov = document.createElement('div');
    ov.id = 'bootOv';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="bt-sky"></div><div class="bt-actor"><div class="bt-hop">'
      + '<i class="bt-legs"></i><i class="bt-arm-l"></i><i class="bt-arm-r"></i><i class="bt-body"></i><i class="bt-pupil"></i><i class="bt-lid"></i></div></div>';
    document.body.appendChild(ov);
    const sky = ov.querySelector('.bt-sky'), actor = ov.querySelector('.bt-actor'), hop = ov.querySelector('.bt-hop');
    const [legs, armL, armR, , pupil, lid] = hop.children;   // lid: kapalı göz (bebeğin deliğini iris rengiyle örter)
    Object.assign(actor.style, { left: R.left + 'px', top: R.top + 'px', width: R.width + 'px', height: R.height + 'px' });
    // başlangıç: ekranın ortası, %58 boy (gövdenin ortası ekranın ortasına)
    const S0 = .7;
    const sx = innerWidth / 2 - (R.left + R.width / 2), sy = innerHeight / 2 - (R.top + R.height * .385);
    const at = (s) => `translate(${sx}px, ${sy}px) scale(${s})`;
    const u = R.height / 674;   // maskot tuvalinin bir pikseli (ekranda)
    let done = false;
    const anims = [];
    const A = (elm, kf, o) => { const a = elm.animate(kf, { fill: 'forwards', ...o, duration: o.duration * k, delay: (o.delay || 0) * k }); anims.push(a); return a; };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms * k));
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('pointerdown', finish, true);
      window.removeEventListener('keydown', finish, true);
      anims.forEach((a) => a.cancel());
      ov.remove();
      menuEls.forEach((x) => { x.style.opacity = ''; });
      items.forEach((x) => { x.style.opacity = ''; });
      mascot.style.visibility = '';
      mascot.style.animation = '';   // salınım 0'dan başlar → devirde zıplama yok
    };
    window.addEventListener('pointerdown', finish, true);
    window.addEventListener('keydown', finish, true);
    // kapalı göz + gizli uzuvlar
    A(pupil, [{ transform: 'scaleY(.07)' }], { duration: 1 });
    A(legs, [{ transform: 'scaleY(0)' }], { duration: 1 });
    A(armL, [{ transform: 'scale(0)' }], { duration: 1 });
    A(armR, [{ transform: 'scale(0)' }], { duration: 1 });
    (async () => {
      // 1 · taş yukarıdan düşer, hafif ezilerek oturur
      A(actor, [{ transform: at(S0) }], { duration: 1 });
      A(hop, [
        { transform: `translateY(${-260 * u}px)`, opacity: 0 },
        { transform: 'translateY(0) scale(1.06, .9)', opacity: 1, offset: .7 },
        { transform: 'translateY(0) scale(1, 1)', opacity: 1 },
      ], { duration: 380, easing: 'cubic-bezier(.5,0,.75,1)' });
      beep(110, .16, 'triangle', .08, .26 * k);
      await wait(520);
      if (done) return;
      // 2 · uykusunda titrer
      A(hop, [0, -7, 6, -5, 4, -2, 0].map((r) => ({ transform: `rotate(${r}deg)` })), { duration: 480, easing: 'linear' });
      [0, .12, .24].forEach((w) => beep(900 + w * 400, .03, 'square', .03, w * k));
      await wait(560);
      if (done) return;
      // 3 · iki kez zıplar
      for (let i = 0; i < 2; i++) {
        A(hop, [
          { transform: 'translateY(0) scale(1.05, .92)' },
          { transform: `translateY(${-70 * u}px) scale(.96, 1.06)`, offset: .45 },
          { transform: 'translateY(0) scale(1.07, .9)', offset: .85 },
          { transform: 'translateY(0) scale(1, 1)' },
        ], { duration: 300, easing: 'ease-out' });
        beep(140 + i * 30, .12, 'triangle', .07, .26 * k);
        await wait(320);
        if (done) return;
      }
      // 4 · döner; tam ortada gözünü açar
      A(hop, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.04)', offset: .5 }, { transform: 'scaleX(1)' }], { duration: 300, easing: 'ease-in-out' });
      await wait(150);
      if (done) return;
      A(pupil, [{ transform: 'scaleY(.07)' }, { transform: 'scaleY(1.18)', offset: .7 }, { transform: 'scaleY(1)' }], { duration: 220, easing: 'ease-out' });
      A(lid, [{ opacity: 1, transform: 'scaleY(1)' }, { opacity: 0, transform: 'scaleY(.2)' }], { duration: 120 });
      [660, 880, 1320].forEach((f, i) => beep(f, .08, 'triangle', .06, i * .06 * k));
      await wait(220);
      if (done) return;
      // 5 · bacaklar ve kollar çıkar
      A(legs, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1.14)', offset: .7 }, { transform: 'scaleY(1)' }], { duration: 230, easing: 'ease-out' });
      A(armL, [{ transform: 'scale(0) rotate(40deg)' }, { transform: 'scale(1.15) rotate(-8deg)', offset: .7 }, { transform: 'scale(1) rotate(0deg)' }], { duration: 260, delay: 60, easing: 'ease-out' });
      A(armR, [{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1.15) rotate(8deg)', offset: .7 }, { transform: 'scale(1) rotate(0deg)' }], { duration: 260, delay: 60, easing: 'ease-out' });
      beep(220, .05, 'square', .05); beep(440, .09, 'triangle', .05, .05 * k); beep(330, .07, 'triangle', .04, .1 * k);
      await wait(380);
      if (done) return;
      // 6 · göz kırpar
      A(pupil, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)', offset: .45 }, { transform: 'scaleY(1)' }], { duration: 200 });
      A(lid, [{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 1, offset: .55 }, { opacity: 0 }], { duration: 200 });
      await wait(260);
      if (done) return;
      // 7 · hoplayarak menüdeki yerine yürür; perde açılır, menü gelir
      A(actor, [{ transform: at(S0) }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: 900, easing: 'cubic-bezier(.45,.05,.4,1)' });
      A(hop, [
        { transform: 'translateY(0) rotate(0deg)' },
        { transform: `translateY(${-38 * u}px) rotate(-4deg)`, offset: .17 },
        { transform: 'translateY(0) rotate(0deg)', offset: .33 },
        { transform: `translateY(${-38 * u}px) rotate(4deg)`, offset: .5 },
        { transform: 'translateY(0) rotate(0deg)', offset: .67 },
        { transform: `translateY(${-24 * u}px) rotate(-3deg)`, offset: .83 },
        { transform: 'translateY(0) rotate(0deg)' },
      ], { duration: 900, easing: 'linear' });
      [0, .3, .6].forEach((w, i) => beep(180 + i * 40, .07, 'triangle', .05, (w + .15) * k));
      A(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' });
      menuEls.forEach((x, i) => {
        const fromLogo = x.id === 'menuLogo';
        A(x, [
          { opacity: 0, transform: fromLogo ? 'translateY(-160px)' : 'translateX(-260px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: 420, delay: 150 + i * 70, easing: 'cubic-bezier(.2,.8,.3,1.15)' });
      });
      await wait(Math.max(920, 150 + menuEls.length * 70 + 420));
      finish();
    })();
  }

  /* ============================================================
     P120 (kullanıcı onayı 2026-10-30, Balatro store videosundan YAPI ilhamı) —
     STORE → SLOT UÇUŞU. Satın alınan kartın çizimi raftan kalkar, hafif dönerek
     yay çizip gideceği slota (joker paneli / backup / değnek / deste) uçar; hedef
     slot uçuş boyunca gizli kalır, kopya varınca "pop" ile belirir. $ kutusundan
     "−N" süzülür, sayı geri sayar. Oyunu bekletmez; testte / hareketi azalt'ta yok.
     Kullanım: satın almadan ÖNCE grabFly(kaynak) → işlem + render → flyGrabTo(g, hedef).
     ============================================================ */
  /* Store rafındaki çizim stilleri `#storeStage .store-item …` seçicilerine bağlı: kopya body'ye
     taşınırsa boş görünür. Raftan uçan kopya bu yüzden SAHNENİN İÇİNDE, aynı sınıflı boş bir kart
     kabında uçar (koordinatlar sahne ölçeğinde). Sahne dışındaki kartlar (paket pencereleri) body'de. */
  function grabFly(src) {
    if (fxOff() || !src || !src.getBoundingClientRect().width) return null;
    const host = src.closest('.store-item'), stage = src.closest('.gm-stage');
    if (host && stage) {
      const r = src.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const ks = sr.width / stage.offsetWidth || 1;   // sahne ölçeği
      const wrap = host.cloneNode(false);
      wrap.removeAttribute('data-sidx');
      wrap.classList.add('fly-host');
      wrap.appendChild(src.cloneNode(true));
      const hs = getComputedStyle(host);   // çizim boyu satır kapsayıcısından gelir (--aw/--ah) → kopyaya taşı
      for (const v of ['--w', '--aw', '--ah', '--rar']) { const x = hs.getPropertyValue(v); if (x) wrap.style.setProperty(v, x.trim()); }
      Object.assign(wrap.style, { left: (r.left - sr.left) / ks + 'px', top: (r.top - sr.top) / ks + 'px',
        width: src.offsetWidth + 'px', height: src.offsetHeight + 'px' });
      return { stage, ks, wrap, r, w: src.offsetWidth };
    }
    return stageClone(src, 'fly-clone');
  }
  function flyGrabTo(g, target, delay = 0) {
    if (!g) return;
    if (!target || !target.getBoundingClientRect().width) return;
    if (delay > 0) {   // sıradaki kart: hedef şimdiden gizlenir, uçuş biraz sonra başlar
      target.style.visibility = 'hidden';
      setTimeout(() => flyGrabTo(g, target), delay);
      return;
    }
    const tr = target.getBoundingClientRect();
    let node, kf, k0, kt, dx, dy, lift;
    if (g.wrap) {   // sahne içi: öteleme sahne pikselinde
      node = g.wrap;
      g.stage.appendChild(node);
      k0 = 1; kt = tr.width / (g.w * g.ks);
      dx = (tr.left - g.r.left) / g.ks; dy = (tr.top - g.r.top) / g.ks; lift = 70;
    } else {         // body: kopya ölçeksiz, ölçek transform'a geri verilir
      node = g.clone;
      k0 = g.k; kt = tr.width / (parseFloat(node.style.width) || tr.width);
      dx = tr.left - g.r.left; dy = tr.top - g.r.top; lift = 70 * g.k;
      Object.assign(node.style, { left: g.r.left + 'px', top: g.r.top + 'px', transition: 'none', zIndex: 9400 });
      document.body.appendChild(node);
    }
    target.style.visibility = 'hidden';
    target.classList.remove('cs-enter');
    const ms = 560 * fxK();
    kf = [
      { transform: `translate(0px, 0px) scale(${k0}) rotate(0deg)` },
      { transform: `translate(${dx * .08}px, ${dy * .08 - lift}px) scale(${k0 * 1.12}) rotate(-9deg)`, offset: .28 },
      { transform: `translate(${dx}px, ${dy}px) scale(${kt}) rotate(4deg)`, offset: .9 },
      { transform: `translate(${dx}px, ${dy}px) scale(${kt}) rotate(0deg)` },
    ];
    const a = node.animate(kf, { duration: ms, easing: 'cubic-bezier(.35,.05,.3,1)', fill: 'forwards' });
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      node.remove();
      target.style.visibility = '';
      target.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(.95)', offset: .6 }, { transform: 'scale(1)' }],
        { duration: 240 * fxK(), easing: 'ease-out' });
      beep(990, .04, 'square', .05); beep(1320, .05, 'triangle', .04, .04);
    };
    a.onfinish = land;
    setTimeout(land, ms + 400);   // sekme arka plandayken bile kopya takılı kalmasın
  }
  /* satın alınan şeyin YENİ yeri (render'dan sonra) */
  function buyTarget(got) {
    if (!got) return null;
    const root = storeOpen() ? el.storeOverlay : document;
    if (got.jokerId != null) return root.querySelector(`.joker-tile[data-jid="${got.jokerId}"]`);
    if (got.type === 'consum') { const cs = root.querySelectorAll(storeOpen() ? '#storeConsumRow .consum-card' : '#consumRow .consum-card'); return cs[cs.length - 1] || null; }
    return root.querySelector('#storePileCol .deck-pile, #pileCol .deck-pile');   // deste jokeri / özel taş → deste
  }
  /* $ kutusu: "−N" süzülür, sayı eski değerden yenisine sayar */
  function coinDrop(from) {
    const v = storeOpen() ? document.getElementById('storeCoinVal') : curScreen() === 'map' ? document.getElementById('mapCoinVal') : el.coinVal;
    const to = Game.state.coins;
    if (fxOff() || !v || from == null || from === to) return;
    const box = v.closest('.gm-coin') || v;
    const f = document.createElement('div');
    f.className = 'coin-float';
    f.textContent = (to < from ? '−' : '+') + Math.abs(from - to);
    box.appendChild(f);
    f.animate([{ transform: 'translate(-50%, 0)', opacity: 1 }, { transform: 'translate(-50%, -46px)', opacity: 0 }],
      { duration: 700 * fxK(), easing: 'ease-out', fill: 'forwards' }).onfinish = () => f.remove();
    const t0 = performance.now(), dur = 420 * fxK();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      v.textContent = String(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(tick); else v.textContent = String(Game.state.coins);
    };
    tick();
  }

  /* ============================================================
     P122 (kullanıcı 2026-10-30: "donukluk hissiyatını yok etmek istiyorum") — OYUN HİSSİ ARAÇLARI.
     Önem kademeli geri bildirim (gamedev game-feel): sarsıntı sahnenin `translate`'ini oynatır
     (sahne `transform: scale` taşıdığı için transform'a dokunulmaz), sönümlenerek dinlenmeye döner.
     Ayarlar › Oyun › Ekran sarsıntısı ile kapanır; testte / hareketi azalt'ta yok.
     ============================================================ */
  const SHAKE_KEY = 'okeyShake';
  const shakeOn = () => { try { return localStorage.getItem(SHAKE_KEY) !== 'off'; } catch (e) { return true; } };
  const liveStage = () => document.querySelector(storeOpen() ? '#storeStage' : '.screen:not(.hidden) .gm-stage');
  /* güç 0..1 → genlik² (küçük vuruş zar zor kıpırdar, büyük vuruş çarpar), sönümlü sinüs */
  function screenShake(power, stage = liveStage()) {
    if (fxOff() || !shakeOn() || !stage || power <= 0) return;
    const amp = 2 + 16 * power * power, n = 9, kf = [];
    for (let i = 0; i <= n; i++) {
      const d = 1 - i / n;
      kf.push({ translate: `${(Math.sin(i * 2.1) * amp * d).toFixed(1)}px ${(Math.cos(i * 2.9) * amp * .6 * d).toFixed(1)}px` });
    }
    kf[n] = { translate: '0px 0px' };
    stage.animate(kf, { duration: (260 + 260 * power) * fxK(), easing: 'linear' });
  }
  /* kısa beyaz parlama (dev çarpan / hedef) — sahnenin içinde */
  function stageFlash(strength = .45, stage = liveStage()) {
    if (fxOff() || !stage) return;
    const f = document.createElement('div');
    f.className = 'stage-flash';
    stage.appendChild(f);
    f.animate([{ opacity: strength }, { opacity: 0 }], { duration: 220 * fxK(), easing: 'ease-out' }).onfinish = () => f.remove();
  }
  /* sahnede bir öğenin üstünden yükselen kısa yazı (ör. "+12") */
  function popText(target, text, cls = '') {
    const stage = target && target.closest('.gm-stage');
    if (!stage || fxOff()) return;
    const sr = stage.getBoundingClientRect(), sc = (sr.width / (stage.offsetWidth || sr.width)) || 1, r = target.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'pop-text ' + cls;
    p.textContent = text;
    p.style.left = ((r.left + r.width / 2 - sr.left) / sc) + 'px';
    p.style.top = ((r.top - sr.top) / sc - 6) + 'px';
    stage.appendChild(p);
    p.animate([{ transform: 'translate(-50%, 0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, -18px) scale(1.15)', opacity: 1, offset: .3 },
      { transform: 'translate(-50%, -34px) scale(1)', opacity: 0 }], { duration: 720 * fxK(), easing: 'ease-out' }).onfinish = () => p.remove();
  }
  /* piksel kıvılcım patlaması (sahne koordinatında bir öğenin çevresinde) */
  function sparkBurst(target, n = 14, colors = ['#FFE58A', '#FFFFFF', 'var(--gm-turn-on)']) {
    const stage = target && target.closest('.gm-stage');
    if (!stage || fxOff()) return;
    const sr = stage.getBoundingClientRect(), sc = (sr.width / (stage.offsetWidth || sr.width)) || 1, r = target.getBoundingClientRect();
    const cx = (r.left + r.width / 2 - sr.left) / sc, cy = (r.top + r.height / 2 - sr.top) / sc;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'burst-spark';
      const ang = (i / n) * Math.PI * 2 + Math.random() * .3, dist = 60 + Math.random() * 70;
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      stage.appendChild(p);
      p.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(.3)`, opacity: 0 }],
        { duration: 560 * fxK(), easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
    }
  }

  /* P122 · B — PARA AKIŞI: piksel coin'ler bir yerden $ kutusuna (ya da verilen hedefe) yay çizerek akar */
  function coinFly(fromRect, toEl, n = 6) {
    if (fxOff() || !fromRect || !toEl) return;
    const tr = toEl.getBoundingClientRect();
    if (!tr.width) return;
    const K = fxK();
    n = Math.max(1, Math.min(10, n));
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'coin-fly';
      const sx = fromRect.left + fromRect.width * (.3 + Math.random() * .4), sy = fromRect.top + fromRect.height * (.3 + Math.random() * .4);
      const dx = tr.left + tr.width / 2 - sx, dy = tr.top + tr.height / 2 - sy;
      Object.assign(c.style, { left: sx + 'px', top: sy + 'px' });
      document.body.appendChild(c);
      const a = c.animate([
        { transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${(Math.random() - .5) * 50}px), calc(-50% - ${30 + Math.random() * 30}px)) scale(1.2)`, opacity: 1, offset: .25 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8)`, opacity: 1 },
      ], { duration: 620 * K, delay: i * 70 * K, easing: 'cubic-bezier(.45,.05,.55,1)', fill: 'backwards' });
      a.onfinish = () => {
        c.remove();
        beep(1245 + (i % 4) * 80, .035, 'square', .04);
        toEl.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 140 * K });
      };
    }
  }
  const coinBoxEl = () => (storeOpen() ? document.getElementById('storeCoins')
    : curScreen() === 'map' ? document.getElementById('mapCoin') : document.getElementById('coinChip'));
  /* satılan kart dönerek küçülür; coin'ler $ kutusuna akar */
  function sellPoof(cardEl, gain, c0) {
    if (fxOff() || !cardEl || !cardEl.getBoundingClientRect().width) return;
    const r = cardEl.getBoundingClientRect();
    const g = stageClone(cardEl, 'fly-clone');
    Object.assign(g.clone.style, { left: r.left + 'px', top: r.top + 'px', transition: 'none', zIndex: 9400 });
    document.body.appendChild(g.clone);
    g.clone.animate([{ transform: `scale(${g.k})`, opacity: 1 }, { transform: `scale(${g.k * 1.12}) rotate(-6deg)`, opacity: 1, offset: .3 },
      { transform: `translate(${r.width * .3}px, ${r.height * .3}px) scale(0) rotate(40deg)`, opacity: 0 }],
      { duration: 420 * fxK(), easing: 'ease-in', fill: 'forwards' }).onfinish = () => g.clone.remove();
    setTimeout(() => {   // render'dan sonra: coin'ler varana dek kutu eski değeri gösterir
      const v = storeOpen() ? document.getElementById('storeCoinVal') : curScreen() === 'map' ? document.getElementById('mapCoinVal') : el.coinVal;
      if (v && c0 != null) v.textContent = String(c0);
    }, 0);
    setTimeout(() => { coinFly(r, coinBoxEl(), Math.ceil((gain || 3) / 2)); }, 160 * fxK());
    setTimeout(() => coinDrop(c0), 560 * fxK());
  }

  /* P122 · B — RAUND SONU FİŞİ (Balatro "cash out" yapısı, bizim fişimizle): satırlar sırayla kayar,
     her tutar sayar, toplamdan cüzdana coin'ler akar, cüzdan sayacı eski değerden tırmanır.
     Düğme beklemez — oyuncu istediği an geçer. */
  function cashOutFx(root, total) {
    if (fxOff() || !root) return;
    const K = fxK();
    const rows = [...root.querySelectorAll('.rw-receipt .rw-row, .rw-receipt .rw-total')];
    const wallet = root.querySelector('.rw-wallet');
    const tot = root.querySelector('.rw-total b');
    let at = 220 * K;
    rows.forEach((r, i) => {
      r.animate([{ transform: 'translateX(-26px)', opacity: 0 }, { transform: 'translateX(4px)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }],
        { duration: 260 * K, delay: at, easing: 'ease-out', fill: 'backwards' });
      const b = r.querySelector('b'), txt = b ? b.textContent : '';
      const m = /^([+−-]?\$?)(\d+)$/.exec(txt.trim());
      if (b && m) {
        const n = +m[2], pre = m[1];
        setTimeout(() => {
          const t0 = performance.now(), dur = 240 * K;
          const step = (now) => { const p = Math.min(1, (now - t0) / dur); b.textContent = pre + Math.round(n * p); if (p < 1) requestAnimationFrame(step); };
          requestAnimationFrame(step);
          beep(880 + i * 90, .05, 'square', .05);
        }, at);
      }
      at += 170 * K;
    });
    if (wallet && total > 0) wallet.textContent = t('rwWallet', Game.state.coins - total);   // sayım başlamadan eski cüzdan
    if (wallet && tot && total > 0) setTimeout(() => {
      coinFly(tot.getBoundingClientRect(), wallet, Math.min(10, Math.ceil(total / 2)));
      const s = Game.state, to = s.coins, from = to - total, t0 = performance.now() + 380 * K, dur = 600 * K;
      const step = (now) => { const p = Math.max(0, Math.min(1, (now - t0) / dur)); wallet.textContent = t('rwWallet', Math.round(from + (to - from) * p)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, at + 120 * K);
  }

  /* P122 · C — ELLE TUTULUR KARTLAR. Taş ve joker kartı imlece doğru hafifçe eğilir (3B); joker çizimi
     boştayken nefes alır gibi salınır (CSS); sürüklenen taş hıza göre yatar, bırakılınca yaylanarak oturur.
     Eğilme CSS değişkeniyle (--rx/--ry) — dönüşüm kuralları stil dosyasında; tek bir belge dinleyicisi. */
  function landBounce(id) {
    if (fxOff()) return;
    const d = el.rack.querySelector(`.tile[data-id="${id}"]:not(.xf-old)`);
    if (d) d.animate([{ transform: 'translateY(-10px) scale(1.08, .92)' }, { transform: 'translateY(0) scale(.95, 1.06)', offset: .45 },
      { transform: 'none' }], { duration: 260 * fxK(), easing: 'ease-out' });
  }
  document.documentElement.classList.toggle('fx-on', !fxOff());   // sürekli CSS hareketleri (boşta salınım) yalnız bununla
  {
    let tiltEl = null;
    const TILT_SEL = '#rack .tile[data-id]:not(.xf-old), .gm-stage .joker-tile, #storeStage .store-item:not(.fly-host)';
    const clear = () => { if (tiltEl) { tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry'); tiltEl = null; } };
    document.addEventListener('pointermove', (e) => {
      if (fxOff() || e.pointerType === 'touch' || dragging) { clear(); return; }
      const t2 = e.target.closest && e.target.closest(TILT_SEL);
      if (t2 !== tiltEl) clear();
      if (!t2) return;
      tiltEl = t2;
      const r = t2.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      t2.style.setProperty('--ry', (nx * 16).toFixed(1) + 'deg');
      t2.style.setProperty('--rx', (-ny * 16).toFixed(1) + 'deg');
    }, { passive: true });
    document.addEventListener('pointerleave', clear);
  }

  /* P122 · D — BÜYÜK ANLAR. Kayıp: ıstakadaki taşlar yerçekimiyle düşer. Zafer: taşlar dalga hâlinde sıçrar.
     (Boss girişi animasyonu kullanıcı kararıyla YOK: boss raundlarına karakter çizimleri gelecek, joker
     kartıyla sahneleme onlarla çakışır.) */
  /* kayıp: ıstakadaki taşlar yerçekimiyle düşer · zafer: taşlar dalga hâlinde sıçrar */
  function rackFall() {
    if (fxOff()) return;
    const ts = [...el.rack.querySelectorAll('.tile[data-id]:not(.xf-old)')];
    ts.forEach((d) => {
      const rot = (Math.random() - .5) * 80, dx = (Math.random() - .5) * 60;
      d.animate([{ transform: 'none' }, { transform: `translate(${dx * .2}px, -18px) rotate(${rot * .1}deg)`, offset: .18 },
        { transform: `translate(${dx}px, 760px) rotate(${rot}deg)` }],
        { duration: (900 + Math.random() * 300) * fxK(), delay: Math.random() * 260 * fxK(), easing: 'cubic-bezier(.45,0,.9,.6)', fill: 'forwards' });
    });
    screenShake(.5, document.querySelector('#gameScreen .gm-stage'));
  }
  function rackHop() {
    if (fxOff()) return;
    [...el.rack.querySelectorAll('.tile[data-id]:not(.xf-old)')].forEach((d, i) => {
      d.animate([{ transform: 'none' }, { transform: 'translateY(-26px) rotate(-4deg)', offset: .4 }, { transform: 'translateY(2px)', offset: .75 }, { transform: 'none' }],
        { duration: 420 * fxK(), delay: (i % 17) * 32 * fxK() + Math.floor(i / 17) * 90 * fxK(), easing: 'ease-out' });
    });
  }

  /* P118 — harita → raund: harita kartları aşağı kayarak çekilir, sonra raund açılır */
  function slideMapOut(cb) {
    const cards = fxOff() ? [] : [...el.mapCards.querySelectorAll('.map-card')];
    if (!cards.length) { cb(); return; }
    const k = fxK();
    const anims = cards.map((c, i) => c.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-14px)', opacity: 1, offset: .25 }, { transform: 'translateY(520px)', opacity: 0 }],
      { duration: 330 * k, delay: i * 45 * k, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' }));
    setTimeout(() => { cb(); anims.forEach((a) => a.cancel()); }, (330 + (cards.length - 1) * 45) * k);
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
    const tiles = [...row.children].filter(c => c.dataset.id !== String(dragId) && !c.classList.contains('deal-ph') && !c.classList.contains('xf-old'));
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
    const cells = [...row.children].filter(c => !c.classList.contains('deal-ph') && !c.classList.contains('xf-old'));   // P118c — dağıtım yer tutucusu hücre değil
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
      let lastX = null, sway = 0;   // P122 · C — sürüklenen taş hızına göre yatar
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
        if (lastX != null && !fxOff()) sway = Math.max(-18, Math.min(18, sway * .75 + (ev.clientX - lastX) * .9));
        lastX = ev.clientX;
        ghost.style.transform = `scale(${ghostK * 1.06}) rotate(${(2 + sway).toFixed(1)}deg)`;
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
          /* denetim SA-11 — taşın yeri değişince joker sürüklemesindeki gibi kısa "tık" sesi */
          if (freeRack()) {
            if (targetIdx && typeof targetIdx === 'object') {
              applyFreeDrop(tile.id, targetIdx);   // GRUP J (P20)
              SFX.tap();
              render();
              landBounce(tile.id);   // P122 · C
            }
          } else if (targetIdx >= 0) {
            const slotOf = () => (Game.state.hand.find((x) => x.id === tile.id) || {}).slot;
            const was = slotOf();
            Game.moveTile(tile.id, targetIdx); // hedef hücreye koy / takas et
            if (slotOf() !== was) SFX.tap();
            render();
            landBounce(tile.id);   // P122 · C
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
    /* 2026-10-29 (kullanıcı) — Ay Taşı iki görünüm: KALICI Ay Taşı (special 'ayTasi') Figma V1 "AY_TAŞLAR",
       Öteki Dünya kuyusundan gelen raund içi taş (moonTemp) Figma V2 "AY_V2_TAŞLAR" (dolunay). Mekanik aynı. */
    else if (tile.moonTemp) d.classList.add('sp-ayTasiTam');
    /* P59/P77 — Ay Taşı (kalıcı ya da raund içi) ay simgesini taşır; Dolunay turunda OKEY parlar */
    if (Game.isMoonTile && Game.isMoonTile(tile)) {
      d.classList.add('moon-tile');
      d.dataset.moon = Game.moonIconNow ? Game.moonIconNow() : '🌙';
      if (Game.moonFullNow && Game.moonFullNow()) d.classList.add('moon-full');
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
      : (tile.gift && !tile.special) ? { c: 'gift', i: '🎁', k: 'giftTile' }   // P121: Armağan taşı artık Altın Taş çizimiyle
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
    if (tile.origin) d.dataset.origin = tile.origin;   // P120 — dönüşüm animasyonu kaynağı (sıçrayacak joker)
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
    /* LANETLİ BOYUT — Parti 2 taş işaretleri */
    const cMark = (cls, ico, name, desc) => {
      d.classList.add(cls);
      const m = document.createElement('span');
      m.className = 'tile-mark cmark';
      m.textContent = ico;
      d.appendChild(m);
      attachTip(d, { name, rarityText: t('cursedTag'), desc }, {});
    };
    if (tile.cocukLock) {   // LANETLİ ÇOCUK — Faz 2: dokunaç sarar (açılmaz, atılmaz)
      d.classList.add('cocuk-lock');
      const v = document.createElement('span');
      v.className = 'cl-vine';
      d.appendChild(v);
      attachTip(d, { name: t('cocukLockName'), rarityText: t('bossMarkTag'), desc: t('cocukLockDesc', Math.max(1, tile.cocukLock - Game.state.turn + 1)) }, {});
    }
    if (tile.fossil) cMark('fossil-tile', '🦴', t('fossilName'), t('fossilDesc', Game.state.fossil ? Game.state.fossil.age : 1));
    else if (tile.kabus) cMark('kabus-tile', '👁', t('kabusName'), t('kabusDesc'));
    else if (tile.anomAlt != null) cMark('anom-tile', '👾', t('anomName'), t('anomDesc', tile.number, tile.anomAlt));
    else if (Game.isSentinel && Game.isSentinel(tile)) cMark('sentinel-tile', '🗿', t('sentName'), t('sentDesc'));
    /* LANETLİ BOYUT — Çürük Taş: aşamaya göre aura + köşede küf işareti; ipucu ne olacağını söyler (sayı yok) */
    const rotSt = Game.rotStage ? Game.rotStage(tile) : 0;
    if (rotSt) {
      d.classList.add('rot', 'rot-' + rotSt);
      const m = document.createElement('span');
      m.className = 'tile-mark rotm';
      m.innerHTML = pixIcon('rot' + rotSt, 3);
      d.appendChild(m);
      attachTip(d, { name: t('rotName' + rotSt), rarityText: t('rotTag'), desc: t('rotDesc' + rotSt) }, {});
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
    /* P105 (kullanıcı raporu): Kozmik run'ın stage rengi haritada geç değişiyordu — stage atlama / harita
       tazelemesi showScreen'den geçmeden olunca tema tonu eski stage'de kalıyordu. Her harita çiziminde eşitlenir. */
    applyRunTheme();
    const s = Game.state;
    if (mapOpenDoneRound !== s.roundInStage) { mapOpenDone.clear(); mapOpenDoneRound = s.roundInStage; }
    const finalOnly = Game.isFinalStage();   // P71 — final stage'inde tek kart (Lady Luck)
    el.mapStage.textContent = stageText(s);
    el.mapRound.textContent = roundText(s);
    fitStageVal(el.mapStage); fitStageVal(el.mapRound);
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

    /* P80 — değnek + backup envanteri (store'daki panellerle aynı): kartlar
       oyundaki gibi — üstüne gelince açıklama, değnek sol tıkla kullanılır. */
    const mapEmpty = () => { const d = document.createElement('div'); d.className = 'joker-slot-empty'; return d; };
    el.mapBackupCount.textContent = `${s.backup.length}/2`;
    el.mapBackupRow.innerHTML = '';
    s.backup.forEach(j => el.mapBackupRow.appendChild(jokerCard(j, { backup: true })));
    for (let k = s.backup.length; k < 2; k++) el.mapBackupRow.appendChild(mapEmpty());
    el.mapConsumCount.textContent = `${s.consumables.length}/${Game.consumCap()}`;
    el.mapConsumRow.innerHTML = '';
    s.consumables.forEach((key, i) => el.mapConsumRow.appendChild(consumCard(key, i)));
    for (let k = s.consumables.length; k < Game.consumCap(); k++) el.mapConsumRow.appendChild(mapEmpty());
    /* denetim3 #45 (kullanıcı: "deste jokerlerini de satabilelim") — store'daki "DESTE JOKERLERİ" şeridi haritada da */
    const mdr = document.getElementById('mapDeckRow');
    if (mdr) {
      mdr.innerHTML = '';
      if ((s.deckJokers || []).length) {
        const title = document.createElement('div');
        title.className = 'panel-title';
        title.textContent = t('stDeckJokers');
        mdr.appendChild(title);
        const row = document.createElement('div');
        row.className = 'sd-row';
        s.deckJokers.forEach((j) => row.appendChild(jokerCard(j)));
        mdr.appendChild(row);
      }
    }

    /* Deste / atılan — Figma'da METİN ETİKETİ YOK: kart, altında
       kalan/toplam sayacı ve boş atılan slotu. */
    /* Figma 237:616 — sayaç "87/108" biçiminde: KALAN / TOPLAM
       (oyun ekranındakiyle aynı kaynak). */
    el.mapDeckCount.textContent = `${(s.deck || []).length}/${Game.totalTilesInPlay()}`;

    el.mapCards.innerHTML = '';
    const names = [roundName(1), roundName(2), null];
    const arts = ['art-indicator', 'art-pot', null];
    for (let ric = 1; ric <= 3; ric++) {
      if (finalOnly && ric < 3) continue;
      const done = ric < s.roundInStage;
      const active = ric === s.roundInStage;
      const boss = ric === 3;
      const card = document.createElement('div');
      /* GEÇİLMİŞ raund kartı KATLI başlar (Figma V2). Oyuncu şevrona basıp
         açabilir; `mapOpenDone` o tercihi raund boyunca hatırlar. */
      const folded = done && !mapOpenDone.has(ric);
      card.className = 'map-card mc-' + ric
        + (active ? ' active' : done ? ' done' : ' locked') + (boss ? ' boss' : '')
        + (folded ? ' collapsed' : '') + (finalOnly ? ' mc-final' : '');
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
        else SFX.mapPlay();                // P113
        const go = () => slideMapOut(() => {   // P118 — kartlar çekilir, el desteden dağıtılır
          markInRound();                   // raund içine girildi
          dealHand();
          showScreen('game');
          flushRoundStart();               // raund başı olayları + pop-up'lar
          setTimeout(kumarStartPanels, 1500);  // P61 — Rulet rengi + yan bahis (eli görerek; bahis bandı geçtikten sonra)
        });
        /* P58 · Kumarhane — KÖR BAHİS: el görülmeden, oyun ekranına geçmeden önce */
        if (Game.needsBet && Game.needsBet()) showBetPicker(go);
        else if (Game.falPending && Game.falPending()) showFal(go);   // LANETLİ BOYUT — Kemik Falı (isteğe bağlı)
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

      if (Game.isSilent && Game.isSilent(s.stage, ric)) {
        card.classList.add('silent');
        const sr = document.createElement('div');
        sr.className = 'mc-silent';
        sr.textContent = t('silentName');
        attachTip(sr, { name: t('silentName'), desc: t('silentDesc') }, {});
        card.appendChild(sr);
      }
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
      /* denetim UI-01 — uzun boss kuralı (EN Tailor's Needle / Lady Luck) hedef kutusunun altına kaçıyordu:
         metin hedefe 6px'ten çok yaklaşırsa satır aralığı sıkışır (.mc-cond.fit) */
      const condEl = card.querySelector('.mc-cond');
      if (condEl && condEl.offsetParent) {
        const rg = document.createRange(); rg.selectNodeContents(condEl);
        if (rg.getBoundingClientRect().bottom > tgt.getBoundingClientRect().top - 6) condEl.classList.add('fit');
      }

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
    renderPathMap();
    renderTotems();
    setTimeout(lbRot, 30);
  }

  /* LANETLİ BOYUT — YOL HARİTASI (kullanıcı 2026-10-28: "direkt harita olsun, Slay the Spire gibi").
     Lanetli Boyut'ta harita ekranının kendisi yol haritasıdır: aşağıdan yukarı S1 … S6 → FİNAL.
     İçinde bulunulan stage haritada üç raund düğümüne açılır (Raund 1 → Raund 2 → Boss); sağdaki tek kart
     odaktaki raundu gösterir (aktif raund; düğümün üstüne gelince o raund). Stage bitince ulaşılabilen
     yol düğümleri parlar: üstüne gelince sağdaki kart o yolu anlatır, tıklayınca (ya da kartın SEÇ'i) seçilir. */
  let pmFocus = null;   // { kind: 'round', ric } | { kind: 'path', i } — sağdaki kartta gösterilen
  function renderPathMap() {
    const host = el.mapCards.parentElement;
    let box = $('pathMap'), side = $('pathSide');
    const pm = Game.pathMapState && Game.pathMapState();
    el.mapCards.classList.toggle('lanetli-map', !!pm);
    $('lblMapTitle2').textContent = t(pm && pm.pending ? 'mapTitlePath' : 'mapTitleL2');
    if (!pm) { box?.remove(); side?.remove(); return; }
    const s = Game.state;
    if (!box) { box = document.createElement('div'); box.id = 'pathMap'; box.className = 'path-map'; host.appendChild(box); }
    if (!side) { side = document.createElement('div'); side.id = 'pathSide'; side.className = 'path-side'; host.appendChild(side); }

    /* ── yerleşim: satır = stage; içinde bulunulan stage (er) üç seviye kaplar ── */
    const rows = pm.rows, last = rows.length - 1, er = pm.row, idx = pm.idx;
    const lvOf = [];
    let n = 0;
    const fin = er === last;   // Aşama 6 — final tek raund: yalnız boss düğümü
    rows.forEach((_, r) => { lvOf[r] = r === er && !fin ? [n, n + 1, n + 2] : [n]; n += lvOf[r].length; });
    const W = 600, H = 1005, PT = 92, PB = 62;
    const ly = (l) => H - PB - l * (H - PB - PT) / (n - 1);
    const LANES = { 1: [0.5], 2: [0.25, 0.75], 3: [0, 0.5, 1] };
    const lx = (r, i) => 160 + LANES[rows[r].length][i] * 330;
    const pos = (r, i) => (r === er && i !== idx ? [lx(r, i), ly(lvOf[r][1])] : [lx(r, i), ly(lvOf[r][0])]);
    const rpos = (ric) => [lx(er, idx), ly(lvOf[er][fin ? 0 : ric - 1])];   // raund düğümleri
    const key = (r, i) => r + ':' + i;
    const walked = new Set(pm.walked.map(([r, i]) => key(r, i)));
    const reach = new Set(pm.reach.map((j) => key(er + 1, j)));
    const open = new Set([key(er, idx)]);
    for (let r = er; r < last; r++)
      for (const [e, a, b] of pm.edges) if (e === r && open.has(key(r, a))) open.add(key(r + 1, b));
    /* raund durumu: stage bittiyse (seçim bekliyor) üçü de geçilmiş */
    const rState = (ric) => (pm.pending || ric < s.roundInStage ? 'done' : ric === s.roundInStage ? 'here' : 'open');
    const stageBoss = (() => { const o = s.bossOrder || []; return o.length ? o[er % o.length] : s.boss; })();

    /* ── çizgiler ── */
    const ln = (a, b, cls) => `<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    let svg = '';
    for (const [r, a, b] of pm.edges) {
      if ((r === er && a !== idx) || (r + 1 === er && b !== idx)) continue;   // seçilmemiş kardeşler gizli
      const ka = key(r, a), kb = key(r + 1, b);
      const from = r === er && a === idx ? rpos(3) : pos(r, a);
      const to = r + 1 === er && b === idx ? rpos(1) : pos(r + 1, b);
      const cls = walked.has(ka) && walked.has(kb) ? 'walked' : (pm.pending && r === er && a === idx && reach.has(kb)) ? 'live'
        : (open.has(ka) && open.has(kb)) ? 'open' : 'dead';
      svg += ln(from, to, cls);
    }
    if (!fin) svg += ln(rpos(1), rpos(2), rState(2) === 'open' ? 'open' : 'walked') + ln(rpos(2), rpos(3), rState(3) === 'open' ? 'open' : 'walked');

    let html = `<div class="pm-plate">${t('pmTitle')}</div>`
      + `<svg class="pm-lines" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg>`;
    rows.forEach((row, r) => {
      const ys = lvOf[r].map(ly);
      html += `<div class="pm-row-lbl${r === er ? ' cur' : ''}" style="top:${(ys[0] + ys[ys.length - 1]) / 2}px">${r === last ? t('pmFinal') : 'S' + (r + 1)}</div>`;
      row.forEach((nd, i) => {
        if (r === er) return;   // seçilen düğümün yerini raund düğümleri alır; seçilmeyen kardeşler gizli
        const k = key(r, i);
        const st = walked.has(k) ? 'done' : reach.has(k) ? 'next' : open.has(k) ? 'open' : 'closed';
        const [x, y] = pos(r, i);
        const ico = pixIcon(nd.type === 'final' ? 'eye' : nd.type === 'cursed' ? 'skull' : 'shield', nd.type === 'final' ? 4 : 3);
        const ev = nd.ev ? `<span class="pm-ev">${pixIcon(nd.ev, 2)}</span>` : '';
        html += `<button type="button" class="pm-node t-${nd.type} s-${st}" data-r="${r}" data-i="${i}" style="left:${x}px;top:${y}px">`
          + `<span class="pm-ico">${ico}</span>${ev}</button>`;
      });
    });
    const cur = rows[er][idx];
    for (let ric = fin ? 3 : 1; ric <= 3; ric++) {
      const [x, y] = rpos(ric), st = rState(ric), boss = ric === 3;
      const inner = boss
        ? (stageBoss && JOKER_ART.has(stageBoss.key) ? `<span class="pm-boss-art jk-${stageBoss.key}"></span>` : `<span class="pm-ico">${pixIcon(fin ? 'eye' : 'skull', 4)}</span>`)
        : `<span class="pm-ico">${pixIcon('masa', 3)}</span>`;
      const ev = boss && cur.ev ? `<span class="pm-ev">${pixIcon(cur.ev, 2)}</span>` : '';
      const sk = !boss && st !== 'done' && Game.skipRewardFor(ric);
      const skb = (sk ? `<span class="pm-skip" title="${t('skipRw_' + sk)}">${pixIcon(sk, 2)}</span>` : '')
        + (!boss && Game.isSilent(s.stage, ric) && !pm.pending ? `<span class="pm-silent">${pixIcon('sessiz', 2)}</span>` : '');
      html += `<button type="button" class="pm-node pm-round t-${cur.type}${boss ? ' r-boss' : ''} s-${st}" data-ric="${ric}" style="left:${x}px;top:${y}px">${inner}${ev}${skb}</button>`
        + `<div class="pm-round-lbl s-${st}" style="left:${x + (boss ? 48 : 38)}px;top:${y}px">${boss ? t('pmBoss') : t('pmRound', ric)}</div>`;
    }
    box.innerHTML = html;

    /* ── sağ üst: lanet + açıklama ── */
    const lv = Game.curseLevel();
    let pips = '';
    for (let i = 0; i < CURSE.max; i++) pips += `<i class="${i < lv ? 'on' : ''}"></i>`;
    side.innerHTML = `<div class="ps-curse"><span>${t('curseLbl')}</span><b>${lv}/${CURSE.max}</b><div class="cm-pips">${pips}</div></div>`
      + `<div class="ps-leg"><span>${pixIcon('shield', 3)}</span>${t('pathSafe')}</div>`
      + `<div class="ps-leg"><span>${pixIcon('skull', 3)}</span>${t('pathCursed')}</div>`
      + `<div class="ps-leg ev"><span>${pixIcon('takas', 2)}</span><span>${pixIcon('fal', 2)}</span><span>${pixIcon('sunak', 2)}</span><em>${t('pmEvLeg')}</em></div>`;
    attachTip(side.querySelector('.ps-curse'), { name: t('curseLbl') + ' ' + lv,
      desc: t('curseTip', Math.round(lv * CURSE.targetPer * 100), s.curseStored || 0, Game.curseCarried()) }, {});

    /* ── sağdaki kart: odaktaki raund ya da (seçim beklerken) odaktaki yol ── */
    el.mapCards.querySelectorAll('.map-card').forEach((c) => c.classList.remove('collapsed'));
    $('pmInfo')?.remove();
    if (!pm.pending && pmFocus?.kind === 'path') pmFocus = null;
    if (pm.pending && pmFocus?.kind !== 'path') pmFocus = { kind: 'path', i: pm.reach[0] };
    const pathCard = (i) => {
      const nd = rows[er + 1][i], cursed = nd.type === 'cursed';
      const tgt = Game.pathPreview(nd.type);
      const c = document.createElement('div');
      c.id = 'pmInfo';
      c.className = 'map-card mc-3 active pm-focus pm-info' + (cursed ? ' pi-cursed' : '');
      c.innerHTML = `<button class="mc-select">${t('mcSelect')}</button>`
        + `<div class="mc-pill">${cursed ? t('pathCursed') : t('pathSafe')} · S${er + 2}</div>`
        + `<div class="mc-art pi-art">${pixIcon(cursed ? 'skull' : 'shield', 9)}</div>`
        + `<div class="mc-cond">${cursed ? t('pathCursedDesc') : t('pathSafeDesc', CURSE.safeCoin)}`
        + (nd.ev ? `<span class="pi-ev" title="${t('pmEvDesc_' + nd.ev)}">${pixIcon(nd.ev, 3)} ${t('pmEv_' + nd.ev)}</span>` : '') + `</div>`
        + `<div class="mc-target"><div class="mc-t-lbl">${t('pmFirstTarget')}</div><div class="mc-t-val">${tgt} <span class="mc-unit">${t('mcPts')}</span></div></div>`;
      c.querySelector('.mc-select').addEventListener('click', () => pickPath(i));
      el.mapCards.appendChild(c);
      fitText(c.querySelector('.mc-pill'), 24, 13);
    };
    const showFocus = () => {
      el.mapCards.querySelectorAll('.map-card').forEach((c) => c.classList.remove('pm-focus'));
      box.querySelectorAll('.pm-node').forEach((b) => b.classList.remove('focus'));
      $('pmInfo')?.remove();
      if (pmFocus?.kind === 'path') {
        pathCard(pmFocus.i);
        box.querySelector(`.pm-node[data-r="${er + 1}"][data-i="${pmFocus.i}"]`)?.classList.add('focus');
      } else {
        const ric = pmFocus?.ric || s.roundInStage;
        el.mapCards.querySelector('.mc-' + ric)?.classList.add('pm-focus');
        box.querySelector(`.pm-round[data-ric="${ric}"]`)?.classList.add('focus');
      }
    };
    const pickPath = (i) => {
      const res = Game.choosePath(i);
      if (!res.ok) return;
      (res.kind === 'cursed' ? SFX.crack : SFX.chips)();
      hideTip();
      pmFocus = null;
      render(); renderMap();
    };
    /* RAUND ATLAMA — aktif (atlanabilir) raundun kartında: ödül + ATLA (coin ve store gelmez) */
    const act = el.mapCards.querySelector('.map-card.active:not(.pm-info)');
    if (act && !pm.pending && Game.canSkipRound && Game.canSkipRound()) {
      const sk = Game.skipRewardFor(s.roundInStage);
      const blk = document.createElement('div');
      blk.className = 'mc-skip';
      blk.innerHTML = `<div class="mcs-rw">${pixIcon(sk, 3)}<span>${t('skipRw_' + sk)}</span></div>`
        + `<button type="button" class="mcs-btn">${t('skipBtn')}</button><div class="mcs-note">${t('skipNote')}</div>`;
      blk.querySelector('.mcs-btn').addEventListener('click', () => {
        const r = Game.skipLanetRound();
        if (!r.ok) { toast(r.error, false); return; }
        SFX.chips();
        pmFocus = null;
        render(); renderMap();
      });
      act.appendChild(blk);
      act.classList.add('has-skip');
    }
    showFocus();

    /* ── düğüm etkileşimi ── */
    box.querySelectorAll('.pm-round').forEach((b) => {
      const ric = +b.dataset.ric;
      if (pm.pending) return;
      b.addEventListener('mouseenter', () => { pmFocus = { kind: 'round', ric }; showFocus(); });
      b.addEventListener('mouseleave', () => { pmFocus = null; showFocus(); });
      if (ric === s.roundInStage) b.addEventListener('click', () => el.mapCards.querySelector('.map-card.active .mc-play')?.click());
    });
    box.querySelectorAll('.pm-node:not(.pm-round)').forEach((b) => {
      const r = +b.dataset.r, i = +b.dataset.i, nd = rows[r][i];
      if (b.classList.contains('s-next')) {
        b.addEventListener('mouseenter', () => { pmFocus = { kind: 'path', i }; showFocus(); });
        b.addEventListener('click', () => pickPath(i));
        return;
      }
      let name, desc;
      if (nd.type === 'final') { name = t('pmFinal'); desc = t('pmFinalDesc'); }
      else {
        name = (nd.type === 'cursed' ? t('pathCursed') : t('pathSafe')) + ' · S' + (r + 1);
        desc = nd.type === 'cursed' ? t('pathCursedDesc') : t('pathSafeDesc', CURSE.safeCoin);
      }
      if (nd.ev) desc += '<br>' + t('pmEv_' + nd.ev) + ': ' + t('pmEvDesc_' + nd.ev);
      const st = [...b.classList].find((c) => c.startsWith('s-')).slice(2);
      desc += ' ' + t(st === 'done' ? 'pmDone' : st === 'closed' ? 'pmClosed' : 'pmOpen');
      attachTip(b, { name, desc }, {});
    });
  }
  /* Yol Haritası piksel simgeleri (oyunun piksel dili; emoji her sistemde aynı çizilmiyor).
     Harita satırı: 0 boş, 1-4 paletteki renk. */
  const PIX = {
    shield: [['#2D7A4F', '#7FE0A4', '#E4F7E6'], ['111111111', '122222221', '122332221', '122332221', '122222221', '012222210', '012222210', '001222100', '000121000', '000010000']],
    skull: [['#E9D5FF', '#1E0F2E', '#B46CFF'], ['001111100', '011111110', '111111111', '122111221', '122111221', '111131111', '011111110', '001010100', '003030300']],
    eye: [['#FF4FA3', '#FFD0E6', '#5CFF9D', '#12081D'], ['00011111000', '01122222110', '12223332221', '12233433221', '12223332221', '01122222110', '00011111000']],
    takas: [['#FFD666', '#8A5A12', '#1E0F2E'], ['011111110', '122222221', '111131111', '122232221', '122222221', '111111111']],
    fal: [['#F3EBD8', '#8F8574'], ['110000011', '121000121', '012101210', '001212100', '000121000', '001212100', '012101210', '121000121', '110000011']],
    sunak: [['#FFD666', '#E4F7E6', '#FF8A3D'], ['0003000', '0033300', '0003000', '0022200', '0022200', '0022200', '0022200', '1111111']],
    kese: [['#8A5A12', '#FFD666', '#FFF3B0'], ['000111000', '000010000', '001111100', '011222110', '112232211', '112333211', '112232211', '011222110', '001111100']],
    arinma: [['#9FE8FF', '#E4F7E6', '#FFFFFF'], ['000010000', '000010000', '000121000', '001222100', '112232211', '001222100', '000121000', '000010000', '000010000']],
    degnek: [['#C9A46A', '#FFD666'], ['000000202', '000000020', '000000202', '000001000', '000010000', '000100000', '001000000', '010000000', '100000000']],
    fis: [['#FF8BD0', '#FFE3F2', '#B03A7A'], ['111111111', '122222221', '123232321', '022222220', '123232321', '122222221', '111111111']],
    /* çürüme aşamaları: filiz → küf lekesi → damlayan küf → çatlak (taşın sağ üst köşesinde) */
    rot1: [['#185C3A', '#5CFF9D'], ['00200', '02120', '00100', '00100', '01110']],
    rot2: [['#185C3A', '#5CFF9D', '#0F3A25'], ['0011100', '0122210', '1222221', '1223221', '0122210', '0011100']],
    rot3: [['#0F3A25', '#5CFF9D', '#185C3A'], ['0111110', '1222221', '1223321', '1222221', '0131310', '0010100', '0010000']],
    rot4: [['#24102F', '#6B6070'], ['1000001', '0100010', '0011100', '0110110', '1100011']],
    sessiz: [['#C9A6FF', '#24102F'], ['0011100', '0111110', '0112110', '0111110', '1111111', '0001000', '1000001']],
    masa: [['#8F8574', '#FFF7E8', '#C9A46A', '#6B4FA0'], ['1111111', '1222221', '1233321', '1234321', '1233321', '1222221', '1222221', '1111111']],
  };
  function pixIcon(name, px) {
    const [pal, rows] = PIX[name];
    let r = '';
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '0') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c - 1]}"/>`; }));
    const w = rows[0].length, h = rows.length;
    return `<svg class="pix" width="${w * px}" height="${h * px}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${r}</svg>`;
  }

  /* Trainer barı (yalnız trainer modunda; geliştirme aracıdır ve normal
     oyunda hiç çizilmez). P83: oyunun panel dilinde, sol sütunun altında. */
  function trainerMapBar() {
    const s = Game.state;
    const bar = document.createElement('div');
    bar.id = 'trainerMapBar';
    const mkSel = (id, opts, cur) => {
      const sel = document.createElement('select');
      sel.id = id;   // testler konuma değil id'ye baksın
      for (const [v, label] of opts) {
        const o = document.createElement('option');
        o.value = v; o.textContent = label;
        if (v === cur) o.selected = true;
        sel.appendChild(o);
      }
      return sel;
    };
    const mkLbl = (txt, ...ctl) => {
      const l = document.createElement('label');
      l.className = 'tmb-f';
      const sp = document.createElement('span');
      sp.textContent = txt;
      l.append(sp, ...ctl);
      return l;
    };
    const line = (cls, ...kids) => { const d = document.createElement('div'); d.className = 'tmb-line ' + cls; d.append(...kids); return d; };

    // başlık plakası + store filtresi
    const tag = document.createElement('span');
    const noEmoji = (x) => String(x).replace(/^[^\p{L}\p{N}]+/u, '');
    tag.className = 'tr-tag';
    tag.textContent = noEmoji(t('trTag'));
    const fb = document.createElement('button');
    fb.type = 'button';
    fb.className = 'btn ghost tmb-btn';
    fb.textContent = noEmoji(t('trFilterBtn')) + (s.trainerStoreFilter?.length ? ` (${s.trainerStoreFilter.length})` : '');
    fb.addEventListener('click', showTrainerFilter);
    /* P83 — bu stage'in boss raunduna hemen gir (aradaki raundlar atlanır) */
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'tmb-go';
    go.textContent = t('trGoBoss');
    go.title = t('trGoBossTip');
    go.disabled = s.roundInStage === 3;
    go.addEventListener('click', () => {
      const r = Game.trainerGoBoss();
      if (!r.ok) { toast(r.error, false); return; }
      enterTrainerRound();
    });
    bar.appendChild(line('tmb-head', tag, go));

    // boss seçici
    const bsel = mkSel('trBossSel', BOSSES.map(b => [b.key, T.bossName(b.key, b.name)]), s.boss?.key);
    bsel.addEventListener('change', () => { Game.setBoss(bsel.value); renderMap(); });
    bar.appendChild(line('tmb-wide', mkLbl(t('trBarBoss'), bsel)));

    // stage atlama — Sonsuz Mod'da üst sınır yok (1..12 pratik liste)
    const maxCh = Number.isFinite(Game.totalStages()) ? Game.totalStages() : 12;
    const jsel = mkSel('trJumpSel', Array.from({ length: maxCh }, (_, i) => [String(i + 1), String(i + 1)]), String(s.stage));
    jsel.addEventListener('change', () => {
      const r = Game.jumpToStage(parseInt(jsel.value, 10));
      if (r.ok) { toast(t('trJumped', r.stage), true); renderMap(); showOkeyBanner(); }
    });
    /* Grup K — Okey Taşını run içinde de elle seç. */
    const ocol = mkSel('trOkeyColorSel', [['', t('trOkeyRandom')]].concat(COLORS.map(c => [c, T.color(c)])), s.trainerOkey?.color || '');
    const onum = mkSel('trOkeyNumSel', Array.from({ length: 13 }, (_, i) => [String(i + 1), String(i + 1)]),
      String(s.trainerOkey?.number ?? s.okey.number));
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
    const stageLbl = mkLbl(t('trBarStage'), jsel);
    const okeyLine = line('tmb-wide', mkLbl(t('trBarOkey'), ocol, onum));

    /* Joker süresi — kurulumda seçilir, store'dan alım öncesi de değişir. */
    const cur = s.trainerJokerUses;
    const curV = cur == null ? 'def' : cur === Infinity ? 'inf' : String(cur);
    const usel = mkSel('trUsesSel', [['def', t('trUsesDefault')]]
      .concat([1, 2, 3, 4, 5, 8, 10, 20].map(n => [String(n), String(n)]))
      .concat([['inf', t('trUsesInf')]]), curV);
    usel.addEventListener('change', () => {
      const r = Game.setTrainerJokerUses(
        usel.value === 'def' ? null : usel.value === 'inf' ? Infinity : usel.value);
      if (r.ok) toast(t('trUsesSet', r.uses === Infinity ? t('trUsesInf')
        : r.uses == null ? t('trUsesDefault') : r.uses), true);
    });
    bar.appendChild(line('', stageLbl, mkLbl(t('trBarUses'), usel)));
    bar.appendChild(okeyLine);
    bar.appendChild(line('tmb-foot', fb));
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
    add('tradeJokeri', (r) => (num(r.bogaMult) ? x(r.bogaMult) : null));   // P100 — Boğa piyasası
    add('rusvet', (r) => (num(r.jarCoins) ? t('jarBadge', num(r.jarCoins)) : null));   // P100 — Bahşiş Kavanozu
    if (recs.some((r) => r.key === 'sisyphus')) {
      const v = num(s.sisyphusRock);   // P100 — kaya yüksekliği (çarpan)
      if (v > 0) out.push(x(v));
    }
    if (recs.some((r) => r.key === 'terazi') && num(s.teraziRoundMult)) out.push(x(s.teraziRoundMult));
    if (recs.some((r) => r.key === 'vampir') && num(s.vampirBank)) out.push(t('tipNowDrain', num(s.vampirBank)));
    if (recs.some((r) => r.key === 'godzilla') && num(s.godzillaLevel)) out.push('S' + num(s.godzillaLevel));
    // P54 · Grup B / P57 — Öteki Dünya: geride bekleyen el + ay evresi
    if (recs.some((r) => r.key === 'otekiDunya') && Game.otekiState) {
      const o = Game.otekiState();   // P77 · Ay Döngüsü
      out.push(t('tipNowWell', o.count, o.max, o.moon));
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
      : (j.beltStars === 3 ? `<div class="tip-uses">${t('tipUsesBelt')}</div>`
        : Game.isRunLong && Game.isRunLong(j) ? `<div class="tip-uses">${t('tipUsesRun')}</div>`
        : (j.usesLeft != null ? `<div class="tip-uses">${t('tipUses', j.usesLeft)}</div>` : ''));
    /* Füzyonla birleşmiş jokerler — her birinin adı+efekti listelenir.
       P91 (kullanıcı kararı 2026-10-12): kart artık FÜZYON KARTI — başlık
       "Füzyon", Füzyon'un kendi açıklaması YAZILMAZ; taşıyıcı joker dahil
       içindeki HER joker kendi satırında (ad + açıklama). */
    const fzCard = j.id != null && (j.fused || []).length > 0;
    const fzRow = (f) => {
      const c = liveCorp(f);
      return `<div class="tip-fused"><div class="tip-head">⚗ ${c ? T.ev(c.name) : T.name(f)}</div>` +
        `<div class="tip-desc">${emphNums(c ? t('corpTipDesc', T.ev(c.text), T.ev(c.rewardText), T.ev(c.penaltyText)) : T.desc(f), f.key)}</div></div>`;
    };
    const fusedLines = (fzCard ? [j, ...j.fused] : (j.fused || [])).map(fzRow).join('');
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
    /* P98 — varyantlar koleksiyonda kendi penceresinde (showVariants);
       ipucu yalnız tıklanabildiğini söyler. */
    const variantLines = j.varHint ? `<div class="tip-var-hint">${t('varTip', j.varHint)}</div>` : '';
    /* P101 — Orion kemeri: yıldız + çarpan ipucunda (kartta yalnız köşe yıldızı) */
    const beltOn = j.id != null && Game.state && Game.state.beltId === j.id;
    const beltLine = (j.id != null && (j.beltStars || beltOn))
      ? `<div class="tip-uses tip-belt">${t('tipBelt', j.beltStars ? t('belt' + j.beltStars) : '', j.beltStars ? BELT_K[j.beltStars] : 0, beltOn)}</div>` : '';
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
    tip.className = 'tr-' + (j.rarity || j.accent || 'none') + (fzCard ? ' tip-fz' : '');   // renk kartın nabzıyla aynı
    /* P57 (kullanıcı isteği) — şirkete dönüşmüş Corporates kartı YALNIZ o
       şirketi anlatır: başlık şirketin adı, açıklama görev + ödül + ceza. */
    const corpNow = liveCorp(j);
    const headTxt = corpNow ? T.ev(corpNow.name) : (j.key ? T.name(j) : j.name);
    const descTxt = corpNow ? t('corpTipDesc', T.ev(corpNow.text), T.ev(corpNow.rewardText), T.ev(corpNow.penaltyText))
      : (j.key ? T.desc(j) : T.ev(j.desc));
    const fzDef = JOKER_DEFS.fuzyon;
    tip.innerHTML =
      `<div class="tip-in">` +
      (fzCard
        ? `<div class="tip-head">⚗ ${T.name(fzDef)}</div>`
        /* denetim3 #49 (kullanıcı: "nadirlik sınıfı başlıkta, sağda belirgin yazsın") — nadirlik etiketi başlık şeridinin
           SAĞINDA koyu plaka; ayrı satır kalktı (deste jokeri notu etiketin içinde) */
        : `<div class="tip-head th-flex"><span class="th-name">${headTxt}</span>${rarityLine ? `<span class="th-rar">${rarityLine.replace(/<\/?div[^>]*>/g, '')}</span>` : ''}</div>` +
          `<div class="tip-desc">${emphNums(descTxt, j.key)}</div>`) +
      fusedLines + legacyLines + usesLine + beltLine + accumNow(j) + variantLines +
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
    /* kullanıcı 2026-10-25 — üst rozetlerin açıklaması rozet sırasının HEMEN ALTINDA, sağa yaslı */
    if (opts.belowOf) {
      const row = opts.belowOf.getBoundingClientRect();
      x = Math.max(8, Math.min(row.right - tw, window.innerWidth - tw - 8));
      y = row.bottom + 14;
    }
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
    avukat: '⚖️', ladyLuck: '💋', orion: '🎩', kahin: '👁️', tuccar: '💼', fatality: '💀', ritim: '🥁',
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
    if (!key || Game.trainerMode || (Game.state && Game.state.seeded) || ownedEver.has(key)) return;   // P114
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

  /* P101 — KOLEKSİYONDA KEŞİF (kullanıcı isteği 2026-10-14, Balatro'nun
     "Not Discovered" kartı ilham). Bir kalem ELİNE GEÇİNCE keşfedilir
     (store, paket, ödül, trainer — hepsi): render her çizimde eldeki
     jokerleri / değnekleri / özel taşları tarar, yükseltme uygulandığı an
     işaretlenir. ownedEver'dan farkı: trainer da açar (kullanıcı test
     edebilsin diye). Eski oyuncunun "sahip olduğu jokerler" geçmişi ilk
     okumada keşfedilmiş sayılır. Final boss jokerleri kendi kilidini
     (Finals) kullanır. Ayarlar › Ekstra › Koleksiyon görünümü testi:
     normal (gerçek kayıt) · hepsi keşfedilmiş · hepsi keşfedilmemiş. */
  const DISC_KEY = 'okeyDiscovered', DISC_MODE_KEY = 'okeyColReveal';
  const DISC_CATS = ['joker', 'consum', 'special', 'upgrade'];
  const DISC_MODES = ['normal', 'all', 'none'];
  const Disc = {
    _o: null, _dirty: false,
    _read() {
      if (this._o) return this._o;
      try { this._o = JSON.parse(localStorage.getItem(DISC_KEY)) || {}; } catch (e) { this._o = {}; }
      for (const c of DISC_CATS) if (!Array.isArray(this._o[c])) this._o[c] = [];
      if (!this._o.src || typeof this._o.src !== 'object') this._o.src = {};
      /* kaynak etiketi (teşhis): g = eski "sahip olunan jokerler" kaydı, r = normal run, t = trainer */
      for (const k of ownedEver) if (!this._o.joker.includes(k)) { this._o.joker.push(k); this._o.src['joker:' + k] = 'g'; this._dirty = true; }
      this.flush();
      return this._o;
    },
    mode() { try { const v = localStorage.getItem(DISC_MODE_KEY); return DISC_MODES.includes(v) ? v : 'normal'; } catch (e) { return 'normal'; } },
    setMode(v) { try { localStorage.setItem(DISC_MODE_KEY, DISC_MODES.includes(v) ? v : 'normal'); } catch (e) {} },
    has(cat, key) {
      const m = this.mode();
      if (m === 'all') return true;
      if (m === 'none') return false;
      return this._read()[cat].includes(key);
    },
    /* koleksiyon kartı için: final boss jokeri kendi kilidiyle */
    known(cat, d) {
      if (cat === 'joker' && d.rarity === 'final') {
        const m = this.mode();
        return m === 'all' ? true : m === 'none' ? false : Finals.has(d.key);
      }
      return this.has(cat, d.key);
    },
    add(cat, key) {
      if (!key || (Game.state && Game.state.seeded && !Game.trainerMode)) return;   // P114: seed'li run keşfe sayılmaz
      const o = this._read();
      if (o[cat].includes(key)) return;
      o[cat].push(key); this._dirty = true;
      o.src[cat + ':' + key] = Game.trainerMode ? 't' : 'r';
    },
    /* Ayarlar › Ekstra: keşif kaydının dökümü ve sıfırlanması */
    stats() {
      const o = this._read(); const r = { g: 0, r: 0, t: 0, n: 0 };
      for (const k of o.joker) { const sc = o.src['joker:' + k] || 'g'; r[sc] = (r[sc] || 0) + 1; r.n++; }
      return r;
    },
    reset() {
      this._o = { src: {} }; for (const c of DISC_CATS) this._o[c] = [];
      try { localStorage.setItem(DISC_KEY, JSON.stringify(this._o)); localStorage.removeItem('okeyOwnedEver'); } catch (e) {}
      ownedEver = new Set();
    },
    flush() {
      if (!this._dirty) return;
      this._dirty = false;
      try { localStorage.setItem(DISC_KEY, JSON.stringify(this._o)); } catch (e) {}
    },
    sync() {
      const s = Game.state;
      if (!s) return;
      for (const j of [...(s.jokers || []), ...(s.backup || []), ...(s.deckJokers || [])]) {
        this.add('joker', j.key);
        for (const f of (j.fused || [])) this.add('joker', f.key);
      }
      for (const k of (s.consumables || [])) this.add('consum', typeof k === 'string' ? k : k && k.key);
      for (const sp of (s.specialTiles || [])) this.add('special', sp && sp.kind);
      for (const tl of (s.hand || [])) if (tl && tl.special) this.add('special', tl.special);
      this.flush();
    },
    count(cat, defs) { return defs.filter((d) => this.known(cat, d)).length; },
  };
  /* yükseltmeler state'te liste olarak durmaz → uygulandığı an işaretlenir */
  if (Game._applyUpgrade && !Game._applyUpgrade.__disc) {
    const _apUp = Game._applyUpgrade;
    Game._applyUpgrade = function (key) { Disc.add('upgrade', key); Disc.flush(); return _apUp.apply(this, arguments); };
    Game._applyUpgrade.__disc = true;
  }

  /* ---------- Joker "taşı" — kompakt, rarity kimlikli ---------- */

  /* P41 — joker eylemleri. Sat: store açıkken, satış kilidi yoksa.
     Kullan: yalnız ELLE kullanılan jokerlerde ve kartın düğmesi/aksiyon
     barındaki düğmesiyle AYNI yoldan (aynı fonksiyon, aynı motor kapısı).
     Füzyon her raftan ve her an birleşir (P26 · E2); diğerleri ana slotta,
     raund oynanırken ve o anki aşamada kullanılabiliyorsa. */
  function sellJokerNow(j) {
    const cardEl = [...document.querySelectorAll(`.joker-tile[data-jid="${j.id}"]`)].find((x) => x.getBoundingClientRect().width);   // P122
    const c0 = Game.state.coins;
    const res = Game.sellJoker(j.id);
    if (!res.ok) { toast(res.error || t('sellFail')); return; }
    sellPoof(cardEl, res.gain, c0);
    toast(t('sellToast', T.name(res), res.gain), true); SFX.sell(); renderStore(); render();
    if (curScreen() === 'map') { hideActBadge(); renderMap(); }   // P58: haritadan satış
  }

  /* P100 — Bahşiş Kavanozu: sol tık kavanozu kırar (Damga kalıbı, geri alınabilir). */
  function useJar() {
    const res = Game.toggleJar();
    if (!res.ok) { toast(T.ev(res.error)); return; }
    const st = Game.jarState();
    toast(res.armed ? t('jarArmed', st ? st.coins : 0) : t('jarUnarmed'), res.armed);
    if (res.armed) SFX.crack();
    render();
  }

  function useDamga() {
    const res = Game.toggleDamga();
    if (!res.ok) { toast(res.error); return; }
    toast(res.armed ? t('damgaArmed') : t('damgaDisarmed'), res.armed);
    render();
  }

  /* P54 · Grup C — Satranç Saati: kartın sol tıkı saati bu tur için durdurur. */
  /* P110 — SATRANÇ SAATİ ÜST ORTADA (kullanıcı onayı): süre, eriyen çubuk, şimdi onaylarsan
     alınacak bonus, raundda bir kez DURDUR. Boss notu (#kahinChip) görünürken onun altına iner. */
  const CLOCK_PAUSERS = '.offer-pop, #settingsOv, .set-ov, #pilePopup, #kumarOv, #pandoraOv, #terziPick, #okeySlotPick, '
    + '#runInfoPop:not(.hidden), #collectionOverlay:not(.hidden), #hintOv, #godPickPop, #useChooser, #fuzyonMenu, #fuzyonPick';
  function renderChessClock() {
    const box = document.getElementById('chessClock');
    if (!box) return;
    const s = Game.state;
    const on = !!(s && s.status === 'playing' && Game.clockOn && Game.clockOn());
    box.classList.toggle('hidden', !on);
    if (!on) return;
    const left = s.clockLeft ?? CLOCK_SECONDS, st = Game.clockState();
    box.classList.toggle('low', !s.clockFrozen && left <= 5);
    box.classList.toggle('frozen', !!s.clockFrozen);
    box.querySelector('.cc-time').textContent = `0:${String(left).padStart(2, '0')}`;
    box.querySelector('.cc-bonus').textContent = `+${Game.clockMult().toFixed(1)}x`;
    /* denetim SA-10 — width yerine transform (bileşikleştiricide kalır; style.css #chessClock .cc-bar > i) */
    box.querySelector('.cc-bar > i').style.transform = `translateX(${Math.max(0, Math.min(100, left / CLOCK_SECONDS * 100)) - 100}%)`;
    box.querySelector('.cc-tag').textContent = s.clockFrozen ? t('ccFrozen') : '';
    const btn = box.querySelector('.cc-btn');
    btn.classList.toggle('hidden', !st || !st.canUse);
    btn.innerHTML = `${t('ccStop')}<small>${t('ccOnce')}</small>`;
    btn.title = t('ccStopTip');
    box.style.top = '';   // kullanıcı 2026-10-25 — bilgiler sağ üstte rozet; saat üst ortada kendi yerinde
  }
  document.querySelector('#chessClock .cc-btn')?.addEventListener('click', (e) => { e.stopPropagation(); SFX.tap?.(); useClockCard(); });

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
    /* P90 — Orion jokeri: sol tık KEMER penceresi (hangi joker kemerde) */
    if (j.key === 'orion' && !opts.backup && Game.beltOptions && Game._orionJokerOn() && Game.beltOptions().length)
      left = { lbl: t('abBelt'), fn: () => showBeltPicker() };
    else if (has('fuzyon')) left = { lbl: t('abUse'), fn: () => pickFuzyon(j.id) };
    else if (opts.backup) left = { lbl: t('abToMain'), fn: () => moveBackupToMain(j) };
    else if (!opts.backup && s && s.status === 'playing' && !storeOpen() && curScreen() === 'game') {
      /* P58 (kullanıcı raporu 2026-10-02) — FÜZYONLU KARTTA ELLE KULLANILAN
         EFEKTLER ÇAKIŞIYORDU: Damga + Öteki Dünya birleşince sol tık yalnız
         ilk eşleşeni (Damga) çalıştırıyordu, Öteki Dünya'ya ulaşılamıyordu.
         Artık kullanılabilir TÜM efektler toplanır: tek efekt doğrudan çalışır,
         birden fazlaysa sol tık bir seçim penceresi açar (showUseChooser). */
      const list = [];
      const add = (key, lbl, fn) => list.push({ key, lbl, fn: (...a) => { SFX.jokerUse(); return fn(...a); } });   // P113
      const dm = has('ayna') && Game.damgaState && Game.damgaState();
      if (dm && dm.id === j.id && !dm.used) add('ayna', t(dm.armed ? 'abUndo' : 'abUse'), useDamga);
      if (has('satrancSaati') && Game.clockState && Game.clockState().canUse) add('satrancSaati', t('abUse'), useClockCard);
      const jr = has('rusvet') && Game.jarState && Game.jarState();   // P100 — kavanozu kır / geri koy
      if (jr && jr.id === j.id && (jr.canUse || jr.armed)) add('rusvet', t(jr.armed ? 'abUndo' : 'abUse'), useJar);
      if (has('terazi') && Game.canTeraziSacrifice && Game.canTeraziSacrifice()) add('terazi', t('abUse'), doTerazi);
      if (has('paratoner') && Game.canParatonerBait && Game.canParatonerBait())
        add('paratoner', t(s.paratonerBait != null ? 'abUndo' : 'abUse'), doParatoner);
      if (has('hileliZar') && Game.canZarCheat && Game.canZarCheat()) add('hileliZar', t('zarCheatBtn'), showZarCheat);   // kullanıcı 2026-10-25 — hile karttan
      /* LANETLİ BOYUT — Parti 2: karta sol tıkla kullanılan lanetli jokerler */
      const cursedDo = (res) => { if (!res || !res.ok) { if (res && res.error) toast(res.error, false); return; } render(); };
      if (has('mezarci') && Game.mezarciCan && Game.mezarciCan()) add('mezarci', t('abBury'), () => cursedDo(Game.mezarciBury()));
      if (has('fisilti')) add('fisilti', t('abWhisper', s.whisperDir === 'l' ? '←' : '→'), () => cursedDo(Game.fisiltiToggle()));
      const mm = has('karaMum') && Game.mumState && Game.mumState();
      if (mm && (mm.canUse || mm.armed)) add('karaMum', mm.armed ? t('abUndo') : t('abLight', mm.flames), () => cursedDo(Game.mumToggle()));
      if (has('rehinci') && Game.rehinciCan && Game.rehinciCan()) add('rehinci', t('abUse'), () => cursedDo(Game.rehinciUse()));
      if (has('kuklaUstasi') && Game.kuklaCan && Game.kuklaCan()) add('kuklaUstasi', t('abUse'), () => showKuklaPick());
      if (has('zamanTefecisi') && Game.tefeciCan && Game.tefeciCan()) add('zamanTefecisi', t('abBorrow'), () => cursedDo(Game.tefeciBorrow()));
      if (list.length === 1) left = { lbl: list[0].lbl, fn: list[0].fn };
      else if (list.length > 1) left = { lbl: t('abChoose'), fn: () => showUseChooser(j, list) };
    }
    /* P46 (kullanıcı isteği 2026-09-14): jokerler RAUND İÇİNDE de sağ tıkla
       satılır (P41'de satış yalnız store'daydı). Değnek satışı store'da kalır —
       istek jokerler içindi. P58: harita panelinde de satılır (attachActs). */
    const right = !Game._noSellCard(j) && j.id != null   /* denetim JB-03 — Füzyon içindeki kilit de sayılır */
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
     P77 · ÖTEKİ DÜNYA — AY KUYUSU paneli (sol sütun). Takas KALKTI: panel
     yalnız gösterir — dolan ay, kuyudaki taşlar, Dolunay'a kaç taş kaldı.
     Kuyu dolunca SONRAKİ tur başında 🌕 DOLUNAY sahnesi oynar (dolunayFx).
     ============================================================ */
  /* ============================================================
     P90 · ORION paneli (sol sütun, Ay Kuyusu kalıbı): finalde rakip —
     puanı, hedef (max(taban, Orion)), gizli taş sayısı, attığı taş + AL;
     Orion jokeriyle eş — eldeki taş, son açılımının sana yazdığı puan.
     ============================================================ */
  function renderOrionPanel() {
    const box = document.getElementById('orionPanel');
    if (!box) return;
    const mate = document.getElementById('orionMate');
    const s = Game.state;
    const u = s && s.status === 'playing' && Game.orionState ? Game.orionState() : null;
    box.classList.toggle('hidden', !u || u.mode !== 'race');
    if (mate) mate.classList.toggle('hidden', !u || u.mode === 'race');
    if (!u) { box.innerHTML = ''; if (mate) mate.innerHTML = ''; return; }
    /* P90f (kullanıcı: "attığı taşı alma seçeneği çok belli olmuyor") — başlık
       satırı (puan / hedef + elindeki taş) + ayrı ATTIĞI TAŞ kutusu: taş ıstakadaki
       taşın aynısı (comboTileEl), yanında belirgin ⬇ ELE AL düğmesi + bedeli.
       Alınabilirken kutu parlar; atış aşamasında "tur başında alabilirsin" yazar.
       Sol sütun ıstaka sekmelerine kadar ~130px yer bırakıyor (1280'de ölçüldü). */
    box.classList.toggle('partner', u.mode !== 'race');
    if (u.mode !== 'race') {
      /* P101 (kullanıcı raporu: "ORION (EŞİN) ELİNDE 21" satırı taşıyor, 🎩
         piksel fontta bozuk kare) — eş paneli soldaki STAGE / RAUND kutularının
         kalıbında: iki küçük panel, üstte etiket, altta değer. Emoji yok. */
      /* 2. tur (kullanıcı): iki kutu sıkışıktı, "son açılımı" anlaşılmadı →
         TEK geniş kutu (Raund Puan kalıbı): solda etiket, sağda açık plakada sayı. */
      /* P106 (kullanıcı raporu: Öteki Dünya + Orion birlikteyken sol sütun ıstaka sekmesine
         taşıyordu) — kutu joker panelinin ALTINDA (#orionMate), STAGE kutusu kalıbında:
         üstte etiket, altta açık plakada sayı. */
      box.innerHTML = '';
      if (mate) mate.innerHTML = `<div class="up-mate" title="${t('orionMateTip')}"><span class="up-mate-lbl">${t('orionMateLbl')}</span>`
        + `<span class="up-mate-val">${t('orionMateVal', u.handCount)}</span></div>`;
      return;
    }
    if (mate) mate.innerHTML = '';
    const canTake = !!u.drop && s.phase === 'meld';
    /* P90g — el sayısı başlıkta küçük not (ayrı satır sol sütunu ıstaka sekmesine taşırıyordu) */
    const hand = `<small class="up-hand" title="${t('orionHidden')}">${t('orionHandN', u.handCount)}</small>`;
    box.innerHTML = `<div class="up-row up-head"><span>${t('orionRival')}</span><span class="up-score">${u.score} / ${u.target}</span></div>`
      + (u.drop
        ? `<div class="up-dropbox${canTake ? ' ready' : ''}"><div class="up-dheadrow"><b class="up-dhead">${t('orionDropHead')}</b>${hand}</div>`
          + `<div class="up-drow"><div class="up-dtile"></div><small class="up-dcost">${canTake ? t('orionTakeCost') : t('orionTakeLater')}</small>`
          + (canTake ? `<button class="up-take">⬇ ${t('orionTake')}</button>` : '') + `</div></div>`
        : `<div class="up-dropbox empty"><small>${t('orionNoDrop')}</small>${hand}</div>`);
    if (u.drop) {
      const d = u.drop;
      box.querySelector('.up-dtile').appendChild(comboTileEl(d, { type: 'per', tiles: [d], values: new Map([[d.id, d.number]]) }));
    }
    const b = box.querySelector('.up-take');
    if (b) b.addEventListener('click', () => {
      const r = Game.takeOrionDrop();
      if (!r.ok) { toast(r.error); return; }
      SFX.tap?.();
      render();
    });
  }

  /* P90 — ORION'UN KEMERİ penceresi: hangi joker kemerde (★ ×1.5 → 2 raundda
     ★★ ×2 → 4 raundda ★★★ ×4, süresiz). Değnek seçicisiyle aynı pk-ov kalıbı. */
  function showBeltPicker() {
    document.querySelectorAll('.belt-ov').forEach((e) => e.remove());
    const opts = Game.beltOptions ? Game.beltOptions() : [];
    if (!opts.length) return;
    hideTip(); hideActBadge();
    const s = Game.state;
    const locked = !!(Game.beltLocked && Game.beltLocked());   // P90e — raund başına 1 kez
    const ov = document.createElement('div');
    ov.className = 'pk-ov tone-violet belt-ov' + (locked ? ' belt-locked' : '');
    /* P103 (kullanıcı: "çok uzun") — kural paragrafı yerine yıldız merdiveni + iki kısa satır */
    const ladder = `<div class="bt-ladder"><span class="bt-st"><b>★</b> ×${BELT_K[1]}</span><i>${t('beltAfter', BELT_TWO_AT)}</i>`
      + `<span class="bt-st"><b>★★</b> ×${BELT_K[2]}</span><i>${t('beltAfter', BELT_FULL_AT)}</i>`
      + `<span class="bt-st bt-top"><b>★★★</b> ×${BELT_K[3]}</span></div>`;
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🎩 ${t('beltTitle')}</div>`
      + `<div class="pk-sub-title">${ladder}<div class="bt-rule">${t('beltRule1')}</div><div class="bt-rule">${t('beltRule2')}</div></div>`
      + (locked ? `<div class="belt-lock-note">🔒 ${t('beltLockedNote')}</div>` : '')
      + `<div class="pk-body pk-choice"></div>`
      + `<div class="pk-foot"><button class="btn ghost belt-close">${t('beltLater')}</button></div></div>`;
    const body = ov.querySelector('.pk-body');
    for (const j of opts) {
      const c = document.createElement('button');
      c.className = 'pk-card belt-pick' + (s.beltId === j.id ? ' on' : '');
      c.dataset.id = j.id;
      if (locked && s.beltId !== j.id) c.disabled = true;
      const now = j.beltStars ? `${t('belt' + j.beltStars)} ×${BELT_K[j.beltStars]}` : t('beltNone');
      /* P103 (kullanıcı): kartlar jokerin ÇİZİMİYLE (çizimi yoksa adıyla) görünür, açıklama
         üstüne gelince ipucunda — koleksiyon / store kartlarıyla aynı dil */
      /* P105 (kullanıcı raporu): füzyonlu kart ana jokerin (Godzilla) çiziminde görünüyordu — slottaki
         kart gibi FÜZYON çizimi + içindeki jokerlerin adları */
      const fz = (j.fused || []).length > 0;
      const artKey = fz ? 'fuzyon' : j.key;
      c.innerHTML = (JOKER_ART.has(artKey)
        ? `<div class="col-jk-art jk-${artKey}"></div>`
        : `<div class="bp-name">${T.name(j)}</div>`)
        + (fz ? `<div class="bp-fz">${[j, ...j.fused].map((x) => T.name(x)).join(' + ')}</div>` : '')
        + `<div class="pk-sub bp-sub">${now}${s.beltId === j.id ? ' · ' + t('beltNow') : ''}</div>`;
      attachTip(c, j, {});
      c.addEventListener('click', () => {
        const r = Game.setBelt(j.id);
        if (!r.ok) { toast(r.error); return; }
        ov.remove(); SFX.tap?.(); render();
        if (storeOpen()) renderStore();
      });
      body.appendChild(c);
    }
    ov.querySelector('.belt-close').addEventListener('click', () => { beltAsked = beltKey(); ov.remove(); });
    ov.addEventListener('click', (e) => { if (e.target === ov) { beltAsked = beltKey(); ov.remove(); } });
    document.body.appendChild(ov);
  }
  /* Kemer boşsa (Orion geldi, ilk joker geldi, kemerdeki ustalaştı/satıldı)
     bir kez sorulur; "SONRA" denirse aynı durumda tekrar sorulmaz. */
  let beltAsked = null;
  const beltKey = () => { const s = Game.state; return s ? `${s.stage}:${s.roundInStage}:${s.jokers.map((j) => j.id).join(',')}` : ''; };
  function maybeBeltPrompt() {
    if (!Game.beltNeedsPick || !Game.beltNeedsPick()) return;
    if (beltAsked === beltKey() || document.querySelector('.pk-ov')) return;
    if (!['game', 'map'].includes(curScreen()) && !storeOpen()) return;
    /* denetim JB-11 — "soruldu" işareti pencere GERÇEKTEN açılınca yazılır: 450 ms içinde başka
       bir seçim penceresi (Üç Kağıtçı, Tanrının Eli…) açıldıysa soru o raund kayboluyordu;
       artık sonraki render (pencere kapanınca) yeniden dener. */
    setTimeout(() => {
      if (beltAsked === beltKey() || !Game.beltNeedsPick() || document.querySelector('.pk-ov')) return;
      beltAsked = beltKey();
      showBeltPicker();
    }, 450);
  }

  let dolunaySeen = null;
  let bossGlowKey = null;   // P106 — boss kural kutusunun ışığı hangi tur için döndü
  /* P106 (kullanıcı: "uzun metinli bossta aşağı kayıyor") — sol sütun (boss adı, kural, puan,
     STAGE/RAUND, Ay Kuyusu, Orion yarışı) Değnek sekmesine taşarsa kademeli sıkılaşır:
     fit1 boşluklar · fit2 boss yazısı 16px · fit3 boss yazısı 14px + küçük kuyu taşı.
     Ölçüm (TR/EN × 20 boss × Ferman): en kötü durum EN Terzi İğne + Ferman. */
  function fitLeftColumn() {
    const col = document.querySelector('#gameScreen .gm-left');
    /* P106b (kullanıcı: "hala çakışma var") — ölçü sekmenin GÖRÜNEN çerçevesi (.gm-shoulder),
       içindeki yazı kutusu değil; arada en az 12px boşluk kalır (kutu gölgesi dahil). */
    /* P106c — sekmeler ortaya kaydı: sınır, sütunla YATAYDA kesişen engellerin (sekme çerçevesi,
       ıstaka) en üstü; arada en az 12px. */
    if (!col || col.offsetParent === null) return;
    col.classList.remove('fit1', 'fit2', 'fit3');
    const cb = col.getBoundingClientRect();
    const limit = Math.min(...[...document.querySelectorAll('#gameScreen .gm-shoulder'), document.getElementById('rackArea')]
      .filter(Boolean).map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.left < cb.right && r.right > cb.left).map((r) => r.top));
    if (!isFinite(limit)) return;
    const over = () => {
      const kids = [...col.children].filter((e) => !e.classList.contains('hidden') && e.offsetHeight > 0);
      if (!kids.length) return false;
      return Math.max(...kids.map((e) => e.getBoundingClientRect().bottom)) > limit - 12;
    };
    for (const c of ['fit1', 'fit2', 'fit3']) { if (!over()) break; col.classList.add(c); }
  }
  /* OYUNCAK KUTUSU (Lanetli Çocuk'un final jokeri) — atılan taşlar burada; Ay Kuyusu kalıbı */
  function renderToyWell() {
    const box = document.getElementById('toyWell');
    if (!box) return;
    const s = Game.state;
    const o = s && s.status === 'playing' && Game.toyState ? Game.toyState() : null;
    box.classList.toggle('hidden', !o);
    if (!o) return;
    box.classList.toggle('aw-full', !!o.ready);
    box.innerHTML = `<div class="aw-head"><span class="aw-title">${t('toyTitle')}</span><span class="aw-count">×${o.mult}</span></div>`
      + `<div class="aw-row"><div class="aw-slots"></div></div>`
      + `<div class="aw-status">${o.ready ? t('toyReady', T.typeName(o.ready.type)) : t('toyIdle', o.box.length, o.cap)}</div>`;
    const slots = box.querySelector('.aw-slots');
    const list = o.ready ? o.ready.tiles : o.box;
    for (let i = 0; i < o.cap; i++) {
      const tl = list[i];
      if (!tl) { const e = document.createElement('div'); e.className = 'aw-empty'; slots.appendChild(e); continue; }
      const te = tileEl(tl, false);
      te.classList.add('aw-tile');
      slots.appendChild(te);
    }
    attachTip(box, { name: t('toyTitle'), accent: 'final', desc: t('toyTip', o.mult) }, {});
  }
  /* LANETLİ ÇOCUK — Faz 1 sisi: tek turda sayılar tur başında 2 sn görünür, sonra ıstakada yalnız renk kalır */
  let cocukFogKey = null, cocukFogTimer = null;
  function renderCocukFog() {
    const st = Game.cocukState ? Game.cocukState() : null;
    const s = Game.state;
    Music.setLayer(st ? st.phase : 1);   // final müziği fazlarla katman ekler
    const on = !!(st && st.fog && s.phase === 'meld' || st && st.fog && s.phase === 'discard');
    if (!on) { document.body.classList.remove('cocuk-fog'); cocukFogKey = null; clearTimeout(cocukFogTimer); return; }
    const key = `${s.roundSerial}-${s.turn}`;
    if (cocukFogKey === key) return;
    cocukFogKey = key;
    document.body.classList.remove('cocuk-fog');
    clearTimeout(cocukFogTimer);
    cocukFogTimer = setTimeout(() => { if (cocukFogKey === key) { document.body.classList.add('cocuk-fog'); SFX.crack(); } }, st.showMs);
  }
  /* Faz geçiş yazısı (Dolunay sahnesi kalıbı) */
  function showCocukBanner(title, sub) {
    document.getElementById('cocukFx')?.remove();
    const fx = document.createElement('div');
    fx.id = 'cocukFx';
    fx.innerHTML = `<div class="ck-text"><b>${title}</b><span>${sub}</span></div>`;
    document.body.appendChild(fx);
    try { SFX.crack(); } catch (e) { /* sessiz */ }
    const close = () => { fx.classList.add('out'); setTimeout(() => fx.remove(), 450); };
    fx.addEventListener('pointerdown', close);
    setTimeout(close, 2400);
  }
  /* Faz 3 — NİHAİ FEDA: zaman durur; seçim yok, yalnız sonuç (kullanıcı kararı 2026-10-28) */
  function showFeda(f) {
    document.getElementById('fedaOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'fedaOv';
    ov.className = 'pk-ov tone-violet altar-ov mg-ov feda-ov';
    const lost = f.lost ? `<div class="fd-lost"><span class="fd-ico">${f.lost.icon || (f.lost.kind === 'joker' ? '🃏' : '🪄')}</span>`
      + `<span class="fd-name">${f.lost.kind === 'consum' ? T.consumName(f.lost.key, f.lost.name) : f.lost.kind === 'joker' ? T.name({ key: f.lost.key, name: f.lost.name }) : f.lost.name}</span>`
      + `<span class="fd-broke">${t('fedaBroke')}</span></div>` : '';
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🧸 ${t('fedaTitle')}</div>`
      + `<div class="pk-sub-title">${t('fedaSub')}</div>${lost}`
      + `<div class="fd-target"><span>${t('fedaTarget')}</span><b class="fd-old">${f.old}</b><b class="fd-arrow">→</b><b class="fd-new">${f.target}</b></div>`
      + (f.extra ? `<div class="fd-extra">${t('fedaExtra')}</div>` : '')
      + `<div class="pk-foot"><button class="ep-btn ep-blue">${t('takasGo')}</button></div></div>`;
    document.body.appendChild(ov);
    try { SFX.crack(); setTimeout(() => SFX.crack(), 260); } catch (e) { /* sessiz */ }
    Music.freeze(true);   // zaman durdu: müzik kesilir, tek müzik kutusu notası
    ov.querySelector('.ep-btn').addEventListener('click', () => { ov.remove(); Music.freeze(false); render(); });
  }
  function renderWell() {
    const box = document.getElementById('ayWell');
    if (!box) return;
    const s = Game.state;
    const o = s && s.status === 'playing' && Game.otekiState ? Game.otekiState() : null;
    const show = !!(o && o.id != null);
    box.classList.toggle('hidden', !show);
    /* P106 — finalde Orion yarış paneli sol sütundayken (Orion Öteki Dünya'yı kemerine
       takmadıysa) kuyu sağ sütuna, joker panelinin altına geçer; ikisi sol sütuna sığmıyor. */
    const side = show && !!(Game.orionState && Game.orionState()?.mode === 'race');
    const home = document.querySelector('#gameScreen .gm-left'), stage = document.querySelector('#gameScreen .gm-stage');
    if (side && box.parentElement !== stage && stage) stage.appendChild(box);
    else if (!side && home && box.parentElement !== home) home.insertBefore(box, document.getElementById('orionPanel'));
    box.classList.toggle('aw-side', side);
    if (!show) return;
    if (!Hints.seen('ayKuyusu')) setTimeout(() => Hints.show('ayKuyusu'), 200);   // P60
    box.classList.toggle('aw-full', o.full && !o.dolunay);
    box.classList.toggle('aw-dolunay', !!o.dolunay);
    const status = o.dolunay ? t('wellDolunay') : o.full ? t('wellFull') : t('wellLeft', o.left);
    box.title = side ? status : '';   // P106b — dar kalıpta durum tek satır, tamamı ipucunda
    box.innerHTML =
      `<div class="aw-head"><span class="aw-title">${t('wellTitle')}</span>`
      + `<span class="aw-count">${o.count}/${o.max}</span></div>`
      + `<div class="aw-row"><div class="aw-moon" aria-hidden="true">${o.moon}</div><div class="aw-slots"></div></div>`
      + `<div class="aw-status">${status}</div>`;
    const slots = box.querySelector('.aw-slots');
    slots.style.setProperty('--n', o.max);
    const list = s.otekiHand || [];
    for (let i = 0; i < o.max; i++) {
      const tl = list[i];
      if (!tl) { const e = document.createElement('div'); e.className = 'aw-empty'; slots.appendChild(e); continue; }
      const te = tileEl(tl, false);
      te.classList.add('aw-tile');
      slots.appendChild(te);
    }
    /* 🌕 DOLUNAY sahnesi — tur başına bir kez */
    const key = o.dolunay ? `${s.stage}-${s.roundInStage}-${s.turn}` : null;
    if (key && dolunaySeen !== key) {
      dolunaySeen = key;
      const n = s.hand.filter((x) => Game.isMoonTile(x)).length;
      setTimeout(() => showDolunay(n), 150);
    }
  }

  function showDolunay(n) {
    document.getElementById('dolunayFx')?.remove();
    const fx = document.createElement('div');
    fx.id = 'dolunayFx';
    fx.innerHTML = `<div class="dl-sky"></div><div class="dl-moon"></div>`
      + `<div class="dl-text"><b>${t('dolunayTitle')}</b><span>${t('dolunaySub', n)}</span></div>`;
    document.body.appendChild(fx);
    try { SFX.coin(); setTimeout(() => SFX.coin(), 180); setTimeout(() => SFX.coin(), 360); } catch (e) { /* sessiz */ }
    const close = () => { fx.classList.add('out'); setTimeout(() => fx.remove(), 450); };
    fx.addEventListener('pointerdown', close);
    setTimeout(close, 2200);
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
      /* P105 (kullanıcı raporu): füzyon kartında başlık ana jokerin adını (Godzilla) yazıyordu → Füzyon */
      `<div class="pk-title">⚗ ${(j.fused || []).length ? T.name({ key: 'fuzyon', name: 'Füzyon' }) : T.name(j)}</div>` +
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
    /* P105 (kullanıcı raporu): ★★★ Orion'un Kemeri'ne ulaşan joker süresizdir ama rozet hâlâ eski
       raund sayısını gösteriyordu → altın ∞ rozeti */
    const beltPerm = j.beltStars === 3;
    const runLong = !!(Game.isRunLong && Game.isRunLong(j)) || beltPerm;
    tile2.className = `joker-tile r-${j.rarity}`
      + (!opts.backup && !runLong && j.usesLeft <= 1 ? ' dying' : '')
      + (runLong ? ' run-long' : '') + (beltPerm ? ' belt-perm' : '');
    tile2.dataset.jid = j.id;
    /* P71 — Lady Luck: büyülü (💋) ve sahnedeki (⭐) joker işaretleri */
    const gs = Game.state;
    if (gs && gs.bossCharmId === j.id && Game.isBossRound() && gs.boss && gs.boss.key === 'ladyLuck') tile2.classList.add('ll-charm');
    if (gs && gs.ladyStarId === j.id) tile2.classList.add('ll-star');
    /* denetim — Avukat: bu tur susturulan joker (Game._mutedKey) sönük + kartın içinde plaka; backup'taki kart değil */
    const avMute = !opts.backup && Game._mutedKey && Game._mutedKey();
    if (avMute && (j.key === avMute || (j.fused || []).some((f) => f.key === avMute))) tile2.classList.add('av-muted');
    /* P90 — finalde Orion'un kemerine taktığı joker (bu raund ona çalışır) */
    if (gs && gs.orionBeltId === j.id && Game._raceOn && Game._raceOn()) tile2.classList.add('orion-belted');
    if (!jokerSeen.has(j.id)) { jokerSeen.add(j.id); tile2.classList.add('jt-enter'); }
    if (Game._noSellCard(j)) tile2.classList.add('locked-sell');   // denetim JB-03
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
    /* P91 (kullanıcı kararı 2026-10-12) — FÜZYON KARTI: birleşmiş kart
       taşıyıcı jokerin değil FÜZYON'un çizimiyle durur; içindekiler
       ipucunda listelenir. Pandora kutusu açılınca varyant çizimine döner. */
    const fzCard = !!(j.fused && j.fused.length);
    const artKey = fzCard ? 'fuzyon' : j.key;
    const hasArt = JOKER_ART.has(artKey);
    if (hasArt) tile2.classList.add('has-art', 'jk-' + artKey);
    if (fzCard) tile2.classList.add('fz-card');
    if (!fzCard && j.key === 'truva' && j.pandora) tile2.classList.add('pd-' + j.pandora);
    // P49 · Grup A — uyanmış The Misunderstood Figma V2 çizimine geçer
    if (j.key === 'misunderstood' && j.awakened) tile2.classList.add('misu-v2');
    /* denetim3 #33/#50 — Bukalemun seçilen rengin çizimine döner; Damga her damgada bir sonraki çizime geçer (1-9) */
    if (!fzCard && j.key === 'terzi' && j.color) tile2.classList.add('bk-' + j.color);
    if (!fzCard && j.key === 'ayna') tile2.classList.add('dm-' + Math.min(9, 1 + (j.stamps || 0)));
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
        : `<div class="jt-name">${(Game._noSellCard(j) ? '🔒 ' : '')}${fzCard ? '⚗ ' + T.name({ key: 'fuzyon', name: 'Füzyon' }) : T.name(j)}</div>`) +
      `<span class="jt-uses${opts.backup ? ' frozen' : (!runLong && j.usesLeft <= 1 ? ' danger' : '')}">` +
      (opts.backup ? '❄' : (runLong ? '∞' : j.usesLeft)) + `</span>`;
    /* P71 — 💋/⭐ rozeti gerçek öğe (::after legendary parıltısıyla çakışırdı) */
    if (tile2.classList.contains('ll-charm') || tile2.classList.contains('ll-star')) {
      const lb = document.createElement('span');
      lb.className = 'll-badge';
      lb.textContent = tile2.classList.contains('ll-charm') ? '💋' : '⭐';
      tile2.appendChild(lb);
    }
    /* kullanıcı 2026-10-29: susturulan joker yalnız SOLAR (renk gider) — üstüne plaka/emoji konmaz */
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
      const v = Game.state.sisyphusRock || 0;   // P100 — rozet kayanın yüksekliğini (çarpan) yazar
      const b = document.createElement('span');
      b.className = 'jt-charge' + (v > 0 ? ' on' : '');
      b.textContent = `🪨${v}`;
      b.title = v > 0 ? t('sisyphusBadge', v.toFixed(1)) : t('sisyphusBadgeZero');
      tile2.appendChild(b);
    }
    /* P100 — BAHŞİŞ KAVANOZU: kavanozdaki coin kartta (Sisyphus rozeti kalıbı);
       kırma basılıyken rozet yanar. */
    if (!opts.backup) {
      const jr = [j, ...(j.fused || [])].find(r => r.key === 'rusvet');
      if (jr) {
        const n = jr.jarCoins || 0;
        const b = document.createElement('span');
        b.className = 'jt-charge' + (Game.state.jarArmed ? ' on' : '');
        b.textContent = `🫙${n}`;
        b.title = t('jarBadge', n);
        tile2.appendChild(b);
      }
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
    /* P110 — kartın üstündeki ♟ rozeti KALKTI: saat ekranın üst ortasında (#chessClock, renderChessClock) */
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
      if (j.key === 'otekiDunya') tile2.classList.toggle('oteki-flip', !!(o && o.dolunay));
      b.textContent = `${o ? o.moon : '🌙'}${n}`;
      b.title = o ? t('tipNowWell', n, o.max, o.moon) : '';
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
    /* P90 — Orion'un Kemeri: ★ ×1.5 · ★★ ×2 · ★★★ ×4 (kemerdeki joker ⟳ işaretli) */
    /* P101 (kullanıcı isteği) — rozet kartın İÇİNDE altın kenarlı plaka
       (eskisi "★ ×1.5 ⟳" kartın dışına taşıyordu); kemerde ŞU AN takılı joker
       ⟳ yerine kartın altın çerçevesiyle gösterilir. */
    if (gs && gs.beltId === j.id) tile2.classList.add('belt-on');
    /* 2. tur (kullanıcı): plaka çizimi kapatıyordu → köşede yalnız yıldız;
       çarpan ipucunda (tipBelt satırı). */
    if (j.beltStars) {
      const rb = document.createElement('span');
      rb.className = 'jt-belt' + (j.beltStars === 3 ? ' full' : '');
      rb.textContent = '★'.repeat(j.beltStars);
      tile2.appendChild(rb);
    }
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
      let started = false, ghost = null, marker = null, toIdx = -1, other = null;
      /* P112 — öbür raf: ana slottan sürüklenince backup, backup'tan sürüklenince ana slot */
      const otherZoneAt = (x, y) => {
        const ids = where === 'main' ? ['backupSlots', 'storeBackupRow', 'mapBackupRow'] : ['jokerSlots', 'storeSlotsRow', 'mapJokerSlots'];
        for (const id of ids) {
          const z = document.getElementById(id);
          if (!z || !z.offsetParent) continue;
          const host = z.closest('.gm-shoulder, .st-shoulder, .gm-jokers') || z;
          const r = host.getBoundingClientRect();
          if (!r.width || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
          if (id === 'backupSlots' && el.backupShoulder.classList.contains('collapsed')) setShoulder('backup', true);
          const tgt = [...z.querySelectorAll('.joker-tile')].find((c) => { const q = c.getBoundingClientRect(); return x >= q.left && x <= q.right && y >= q.top && y <= q.bottom; });
          return { zone: host, id, tgt: tgt ? +tgt.dataset.jid : null };
        }
        return null;
      };
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
          /* P112 — kartın kendi sınıfları korunur (çizim .jk-<anahtar> sınıfından gelir; eskiden kopya boş görünüyordu) */
          ghost.className = card.className.replace(/jk-dragging|jk-seq-pop/g, '') + ' jk-ghost';
          ghost.style.opacity = '1';
          ghost.style.width = r.width + 'px';
          ghost.style.height = r.height + 'px';
          document.body.appendChild(ghost);
          marker = document.createElement('div');
          marker.className = 'jk-drop-mark';
          row.appendChild(marker);
        }
        ghost.style.left = (ev.clientX - 26) + 'px';
        ghost.style.top = (ev.clientY - 18) + 'px';
        /* P112 — öbür rafa (ana slot ↔ backup) sürükleme: imleç öbür rafın üstündeyse bırakınca
           taşınır; oyun ekranında kapalı backup sekmesinin üstüne gelince sekme kendiliğinden açılır */
        other = otherZoneAt(ev.clientX, ev.clientY);
        document.querySelectorAll('.jk-drop-zone').forEach((z) => z !== (other && other.zone) && z.classList.remove('jk-drop-zone'));
        if (other) { other.zone.classList.add('jk-drop-zone'); marker.style.display = 'none'; return; }
        marker.style.display = '';
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
        document.querySelectorAll('.jk-drop-zone').forEach((z) => z.classList.remove('jk-drop-zone'));
        if (other) {
          /* P112 — öbür rafa bırakıldı */
          const res = where === 'main' ? Game.moveToBackup(j.id, other.tgt) : Game.moveToMain(j.id);
          if (!res.ok) toast(res.error || t('moveFail'));
          else {
            SFX.tap?.();
            toast(where === 'main' ? (res.swapped ? t('movedSwap', T.name(j), res.inName) : t('movedBackup', T.name(j))) : t('movedMain', T.name(j)), true);
          }
          render();
          if (storeOpen()) renderStore();
          if (curScreen() === 'map') renderMap();
          return;
        }
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
    b.addEventListener('click', (e) => { SFX.lock(); onToggle(e); });   // P113
    return b;
  }

  /* ---------- Ses (GDD 14.5) — WebAudio mini synth ---------- */

  let sfxOn = localStorage.getItem('okeySfx') !== '0';
  /* P67 — efekt sesi ayarlarda (aç/kapa + seviye); duraklat menüsündeki
     "Ses" düğmesi kaldırıldı. Seviye %100 = eski ses düzeyi. */
  let sfxVol = parseInt(localStorage.getItem('okeySfxVol'), 10);
  if (isNaN(sfxVol)) sfxVol = 100;
  let actx = null;

  let lastSfxAt = 0;   // P113 — bu tıklamada bir eylem sesi çaldı mı (genel tık sesi ikinci kez çalmasın)
  function beep(freq, dur = 0.08, type = 'triangle', vol = 0.1, when = 0) {
    lastSfxAt = performance.now();
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
  /* denetim S-4 — bu tıklamanın genel düğme sesini sustur (eylem kendi sesini SONRA çalacaksa) */
  function muteUiClick() { lastSfxAt = performance.now(); }

  /* P113 (kullanıcı: "oyundaki tüm tıklanılabilir efekt işleyen her şeye ses efekti") — kendi sesi
     olmayan her tıklanabilir öğe kısa bir düğme sesi çalar. Tıklama yakalanır, eylem kendi sesini
     çaldıysa (lastSfxAt değişti) genel ses çalmaz → çift ses yok. */
  /* denetim SA-06 — deste kartı, atık yuvası, Yeni Run noktaları ve slayt kartı da tıklanabilir (sessiz kalıyordu) */
  const UI_CLICKABLE = 'button, [role="button"], .cyc-dot, .set-chk, .set-tab, .pk-card, .map-card, .mc-select, .joker-tile, .consum-card, .gm-sh-tab, .st-sh-tab, .col-cat, .set-go, .deck-pile, .discard-slot, .rp-dots i, .mp-card';
  /* denetim SA-07 — sesini pointerdown'da çalan öğeler (Ritim pedi) için: aynı basışın pointerdown'ı ile
     click'i arasında bir eylem sesi çaldıysa genel ses çalmaz. Klavye/programla gelen click'te
     (yakın zamanda pointerdown yok) eski kural geçerli. */
  let downSfxMark = 0, downAt = -1e9;
  document.addEventListener('pointerdown', () => { downSfxMark = lastSfxAt; downAt = performance.now(); }, true);
  document.addEventListener('click', (e) => {
    const tEl = e.target && e.target.closest && e.target.closest(UI_CLICKABLE);
    if (!tEl || tEl.disabled || tEl.closest('#rack')) return;   // ıstaka taşlarının kendi sesi var
    const before = (e.detail > 0 && performance.now() - downAt < 1500) ? downSfxMark : lastSfxAt;
    setTimeout(() => { if (lastSfxAt === before) SFX.ui(); }, 0);
  }, true);

  const SFX = {
    tick: () => beep(880, .04, 'square', .05),
    /* P113 (kullanıcı onayı: ses örnekleri videosu) — sessiz kalan eylemler */
    ui: () => { beep(520, .035, 'triangle', .07); beep(780, .03, 'triangle', .045, .022); },
    tap: () => { beep(700, .03, 'square', .05); beep(950, .025, 'square', .03, .02); },
    sell: () => { beep(1568, .05, 'square', .07); beep(1175, .07, 'square', .07, .05); beep(880, .1, 'square', .06, .11); },
    reroll: () => [660, 880, 740, 990].forEach((f, i) => beep(f, .04, 'square', .05, i * .045)),
    wand: () => [1320, 1760, 2093, 2637].forEach((f, i) => beep(f, .07, 'triangle', .06, i * .055)),
    jokerUse: () => { beep(440, .05, 'sawtooth', .05); beep(880, .06, 'square', .05, .04); beep(1320, .08, 'triangle', .05, .09); },
    mapPlay: () => [392, 523, 659, 784].forEach((f, i) => beep(f, .09, 'triangle', .08, i * .06)),
    shoulder: () => beep(980, .03, 'triangle', .05),
    lock: () => { beep(1200, .03, 'square', .06); beep(600, .05, 'square', .05, .03); },
    draw: () => { beep(660, .05); beep(880, .05, 'triangle', .08, .06); },
    meld: (n) => { for (let i = 0; i < Math.min(n || 1, 5); i++) beep(520 + i * 110, .09, 'triangle', .1, i * .07); },
    islek: () => { beep(220, .18, 'sawtooth', .12); beep(160, .22, 'sawtooth', .12, .12); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, .16, 'triangle', .12, i * .11)),
    lose: () => [330, 262, 196].forEach((f, i) => beep(f, .25, 'sawtooth', .1, i * .18)),
    boss: () => { beep(98, .4, 'sawtooth', .15); beep(65, .5, 'sawtooth', .15, .2); },
    coin: () => { beep(1245, .05, 'square', .08); beep(1568, .09, 'square', .08, .05); },
    crack: () => { beep(140, .2, 'sawtooth', .13); beep(90, .25, 'sawtooth', .1, .08); },
    nope: () => { beep(220, .06, 'square', .07); beep(165, .09, 'square', .07, .07); },   // denetim3 #8 — kural ihlali
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
    let duckK = 1;   // P71c — Ritim mini oyunu açıkken müzik kısılır (çubuk müziğe kilitli değil)
    let pauseK = 1;  // denetim S-2 — duraklat menüsü açıkken 0.5
    let freezeK = 1; // Lanetli Çocuk — Nihai Feda anında 0
    const level = () => (on ? Math.pow(Math.max(0, Math.min(100, vol)) / 100, 1.5) * 0.6 * duckK * pauseK * freezeK : 0);   // denetim S-2: pauseK

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

    /* P74 — her ölçüye AYRI kalıp: per(['P - .', ...], kökler, akorlar) */
    const per = (pats, roots, chords) => roots.map((r, i) => gen(pats[i % pats.length], [r], chords)).join(' | ');
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
      /* P71c — boss paleti: ana menünün ney / kanun / arp / darbuka ailesinden
         UZAK sesler (kullanıcı: "boss temaları ana menünün hafif değişmiş hâli
         gibi"). Yalnız boss parçaları kullanır. */
      mute:   { type: 'sawtooth', vol: .075, a: .025, dec: .25, sus: .6, rel: .12, cut: 950, vib: 5, vd: .006, uni: 5 },  // kısık trompet
      upright:{ type: 'triangle', vol: .22, a: .004, dec: .2, sus: .3, rel: .08 },                       // kontrbas (parmak)
      ep:     { type: 'sine', vol: .07, a: .004, dec: .6, sus: .25, rel: .45, uni: 4 },                  // lounge piyano
      vox:    { type: 'triangle', vol: .12, a: .09, dec: .4, sus: .85, rel: .3, vib: 5.5, vd: .012 },   // kadife şarkıcı
      glass:  { type: 'sine', vol: .07, a: .002, dec: 1.3, sus: .08, rel: 1.6 },                        // cam / celesta
      needle: { type: 'square', vol: .028, a: .001, dec: .03, sus: .05, rel: .02, cut: 7000 },          // iğne ucu
      saw:    { type: 'sawtooth', vol: .05, a: .002, dec: .08, sus: .55, rel: .03, cut: 3400 },         // ritim oyunu lead
      /* P74 — Rat Pack lounge: vibrafon (yumuşak vuruş, uzun sönüm, hafif titreşim) */
      vibes:  { type: 'sine', vol: .075, a: .003, dec: .9, sus: .12, rel: .9, vib: 5.5, vd: .004, uni: 3 },
      /* Lanetli Boyut — kırık müzik kutusu: çok kısa vuruş, uzun çınlama, yavaş bant çarpılması (0.6 Hz)
         ve akortsuz ikinci tarak (uni 16 cent) → "yay boşalırken" sarkan ses */
      mbox:   { type: 'sine', vol: .085, a: .001, dec: .8, sus: .04, rel: 1, vib: .6, vd: .014, uni: 16 },
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
    /* P71c — yeni boss parçalarının akorları (hiçbiri menünün D Hicaz'ı değil) */
    const NOIR = { C: ['C3', 'Eb3', 'G3', 'Bb3'], Ab: ['Ab2', 'C3', 'Eb3', 'Gb3'], G: ['G2', 'B2', 'D3', 'F3'],
                   F: ['F3', 'Ab3', 'C4', 'Eb4'], D: ['D3', 'F3', 'Ab3', 'C4'] };                    // C minör caz (ii-V)
    const MORPH = { Eb: ['Eb3', 'G3', 'Bb3', 'D4'], C: ['C3', 'Eb3', 'G3', 'D4'], Ab: ['Ab2', 'C3', 'Eb3', 'G3'],
                    Bb: ['Bb2', 'Eb3', 'F3', 'Ab3'], Db: ['Db3', 'F3', 'Ab3', 'C4'], G: ['G2', 'Bb2', 'D3', 'Eb3'] }; // belirsiz modal
    const ZOMB = { B: ['B2', 'F3', 'C4'], C: ['C3', 'F#3', 'C#4'], 'C#': ['C#3', 'G3', 'D4'], D: ['D3', 'G#3', 'D#4'] }; // triton + küçük ikili
    const DIM = { 'F#': ['F#3', 'A3', 'C4'], A: ['A3', 'C4', 'Eb4'], C: ['C3', 'Eb3', 'F#3'], Eb: ['Eb3', 'F#3', 'A3'] }; // eksik (dim) döngü
    const EMAJ = { E: ['E3', 'G#3', 'B3'], 'C#': ['C#3', 'E3', 'G#3'], A: ['A2', 'C#3', 'E3'], B: ['B2', 'D#3', 'F#3'] }; // E majör I-vi-IV-V
    const KURDI = { E: ['E3', 'G3', 'B3'], A: ['A2', 'C3', 'E3'], G: ['G2', 'B2', 'D3'], F: ['F2', 'A2', 'C3'], D: ['D3', 'F3', 'A3'] }; // E Kürdi
    const GMIN = { G: ['G3', 'Bb3', 'D4'], Eb: ['Eb3', 'G3', 'Bb3'], D: ['D3', 'F#3', 'A3'] };
    /* P74 — Kumarhane teması "Vegas lounge / Rat Pack" (kullanıcı seçimi): Bb majör
       swing, I-VI-ii-V; store = Db majör bossa */
    const RAT = { Bb: ['Bb2', 'D3', 'F3', 'A3'], G: ['G2', 'B2', 'D3', 'F3'], C: ['C3', 'Eb3', 'G3', 'Bb3'],
                  F: ['F2', 'A2', 'C3', 'Eb3'], D: ['D3', 'F3', 'A3', 'C4'], Eb: ['Eb3', 'G3', 'Bb3', 'D4'] };
    const RAT_R = ['Bb', 'G', 'C', 'F', 'D', 'G', 'C', 'F', 'Eb', 'Eb', 'Bb', 'G', 'C', 'F', 'Bb', 'F'];
    /* Lady Luck — G minör caz (minör ii-V: Aø7 D7 → Gm7) */
    const JAZZ = { G: ['G2', 'Bb2', 'D3', 'F3'], C: ['C3', 'Eb3', 'G3', 'Bb3'], A: ['A2', 'C3', 'Eb3', 'G3'],
                   D: ['D3', 'F#3', 'A3', 'C4'], Eb: ['Eb3', 'G3', 'Bb3', 'D4'], F: ['F2', 'A2', 'C3', 'Eb3'],
                   Bb: ['Bb2', 'D3', 'F3', 'A3'] };
    const JAZZ_R = ['G', 'G', 'C', 'C', 'A', 'D', 'G', 'G', 'Eb', 'Eb', 'C', 'F', 'Bb', 'A', 'D', 'G'];
    /* P90 — Orion: E minör, Endülüs inişi Em · C · D · B (B majör = armonik minör gerilimi) */
    const ORI = { E: ['E3', 'G3', 'B3'], C: ['C3', 'E3', 'G3'], D: ['D3', 'F#3', 'A3'], B: ['B2', 'D#3', 'F#3'] };
    const ORI_HI = { E: ['E5', 'G5', 'B5'], C: ['C5', 'E5', 'G5'], D: ['D5', 'F#5', 'A5'], B: ['B4', 'D#5', 'F#5'] };
    const ORI_R = ['E', 'E', 'C', 'D', 'E', 'E', 'C', 'B', 'E', 'E', 'C', 'D', 'E', 'E', 'C', 'B'];
    const BOSSA = { Db: ['Db3', 'F3', 'Ab3', 'C4'], Gb: ['Gb2', 'Bb2', 'Db3', 'F3'], Eb: ['Eb3', 'Gb3', 'Bb3', 'Db4'],
                    Ab: ['Ab2', 'C3', 'Eb3', 'Gb3'] };
    const AMIN_PH = { A: ['A4', 'C5', 'E5'], Bb: ['Bb4', 'D5', 'F5'], D: ['D4', 'F4', 'A4'], G: ['G4', 'Bb4', 'D5'] };  // A Frig (Kahin)
    /* Ayna Kral teması: 4 ölçü + aynı melodinin D etrafında ters çevrilmiş (ayna) hâli */
    const AYNA = 'D4 - F4 A4 D5 - - - | C#5 - E5 - A4 - - - | Bb4 - A4 G4 F4 - E4 - | D4 - - - A3 - - - | ' +
                 'D4 - Bb3 G3 D3 - - - | E3 - C3 - G3 - - - | F3 - G3 A3 Bb3 - C4 - | D4 - - - G4 - - -';

    /* P104 — KOZMİK RUN MÜZİĞİ: D Lidyen (Dmaj9 · Gmaj7#11 · Bm7 · A). Akor tabloları: COS = pad / sub için 4 sesli,
       COS_H = cam arpeji / çan için üst oktav. */
    const COS = { D: ['D3', 'F#3', 'A3', 'E4'], G: ['G2', 'B2', 'D3', 'F#3'], B: ['B2', 'D3', 'F#3', 'A3'], A: ['A2', 'C#3', 'E3', 'G#3'] };
    const COS_H = { D: ['A4', 'D5', 'F#5'], G: ['B4', 'D5', 'F#5'], B: ['F#4', 'B4', 'D5'], A: ['E4', 'A4', 'C#5'] };
    const COS_R = ['D', 'D', 'G', 'G', 'B', 'B', 'A', 'A', 'D', 'D', 'G', 'G', 'B', 'A', 'G', 'A'];
    const COS_S = ['D', 'G', 'B', 'A', 'D', 'G', 'B', 'A'];
    /* Lanetli Boyut — A minör ninni (Bb = Napoliten "yanlış" akor), D minör lanetli org, G minör kemik dansı (boss) */
    const LBN = { A: ['A3', 'C4', 'E4'], E: ['G#3', 'B3', 'E4'], D: ['D3', 'F3', 'A3'], F: ['F3', 'A3', 'C4'], Bb: ['Bb2', 'D3', 'F3'] };
    const LBN_H = { A: ['A5', 'C6', 'E6'], E: ['G#5', 'B5', 'E6'], D: ['D5', 'F5', 'A5'], F: ['F5', 'A5', 'C6'], Bb: ['Bb5', 'D6', 'F6'] };
    const LBN_R = ['A', 'E', 'A', 'E', 'A', 'D', 'Bb', 'E', 'A', 'E', 'A', 'E', 'F', 'D', 'E', 'A'];
    const LBS = { D: ['D3', 'F3', 'A3', 'D4'], Bb: ['Bb2', 'D3', 'F3', 'Bb3'], G: ['G2', 'Bb2', 'D3', 'G3'], A: ['A2', 'C#3', 'E3', 'A3'], F: ['F2', 'A2', 'C3', 'F3'] };
    const LBS_R = ['D', 'Bb', 'G', 'A', 'D', 'F', 'G', 'A'];
    const LBX = { G: ['G3', 'Bb3', 'D4'], Eb: ['Eb3', 'G3', 'Bb3'], D: ['D3', 'F#3', 'A3'], C: ['C3', 'Eb3', 'G3'] };
    const LBX_H = { G: ['G5', 'Bb5', 'D6'], Eb: ['Eb5', 'G5', 'Bb5'], D: ['D5', 'F#5', 'A5'], C: ['C5', 'Eb5', 'G5'] };
    const LBX_R = ['G', 'G', 'Eb', 'D', 'G', 'C', 'D', 'D', 'G', 'G', 'Eb', 'D', 'C', 'G', 'D', 'G'];

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
      /* P72c — KUMARHANE MODUNUN KENDİ MÜZİĞİ (kullanıcı: "kumarhane modunun direkt
         kendine has tema müziği olsun"). Kumarhane run'ında harita + normal raund
         = Vegas gecesi big band swing; store = kokteyl lounge bossa. Boss raundu
         yine boss'un kendi parçası (final: Lady Luck). Menü temalarından ayrı dünya. */
      /* P74 — kullanıcı big band'i ve "casino spy"ı beğenmedi ("kumarhane hissi
         vermiyor"), "Vegas lounge / Rat Pack" yönünü seçti: Sinatra dönemi
         kumarhane barı. Bb majör orta swing (126, üçleme ızgarası), kısık
         trompet melodisi, vibrafon cevapları, yürüyen kontrbas (çeyrek nota,
         bir sonraki köke yarım sesle yaklaşır), 2 ve 4'te piyano, ride + fırça;
         ölçü sonlarında bakır vuruşları. 16 ölçü (≈30 sn). */
      kumarhane: { bpm: 126, div: 3, dv: .45, gain: .7, parts: [
        { i: 'mute', s: 'F4 - D5 - - - C5 - Bb4 A4 - - | B4 - - D5 - F5 - - - . . . | ' +
                        'Eb5 - - D5 - C5 Bb4 - - G4 - - | A4 - - C5 - Eb5 - - - . . . | ' +
                        'F5 - - E5 - D5 C5 - - A4 - - | B4 - - D5 - G5 - - - F5 - - | ' +
                        'Eb5 - - - - - D5 - C5 Bb4 - G4 | A4 - - - - - . . . F4 - A4 | ' +
                        'Bb4 - - - - - G5 - - F5 - - | D5 - - - - - . . . Bb4 - C5 | ' +
                        'D5 - - F5 - D5 C5 - - Bb4 - - | B4 - - - - - D5 - - F5 - - | ' +
                        'G5 - - F5 - Eb5 D5 - - C5 - - | Eb5 - - D5 - C5 A4 - - F4 - - | ' +
                        'Bb4 - - - - - - - - D5 - C5 | Bb4 - - A4 - - C5 - - . . .' },
        { i: 'vibes', s: per(['. . . . . . . . . . . .', '. . . . . . . . . G5 - F5', '. . . . . . . . . . . .', '. . . . . . . . . C6 - A5',
                              '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', 'C6 - A5 F5 - - . . . . . .',
                              '. . . . . . . . . . . .', '. . . . . . F5 - G5 A5 - -', '. . . . . . . . . . . .', '. . . . . . . . . . . .',
                              '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . F5 - A5'], RAT_R, RAT) },
        { i: 'upright', s: 'Bb2 - - D3 - - F3 - - Ab2 - - | G2 - - B2 - - D3 - - Db3 - - | C3 - - Eb3 - - G3 - - Gb3 - - | ' +
                           'F3 - - Eb3 - - C3 - - Eb3 - - | D3 - - F3 - - A3 - - Ab3 - - | G3 - - F3 - - D3 - - Db3 - - | ' +
                           'C3 - - Bb2 - - G2 - - Gb2 - - | F2 - - A2 - - C3 - - E3 - - | Eb3 - - G3 - - Bb3 - - D3 - - | ' +
                           'Eb3 - - D3 - - C3 - - B2 - - | Bb2 - - D3 - - F3 - - Ab2 - - | G2 - - B2 - - D3 - - Db3 - - | ' +
                           'C3 - - Eb3 - - G3 - - Gb3 - - | F3 - - Eb3 - - C3 - - B2 - - | Bb2 - - C3 - - D3 - - E3 - - | ' +
                           'F3 - - Eb3 - - C3 - - B2 - -' },
        { i: 'ep', s: gen('. . . P - . . . . P - .', RAT_R, RAT) },
        { i: 'tbrass', s: per(['. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . P - . P - -',
                               '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . P - . P - -',
                               '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . P - . P - -',
                               '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', 'P - . P - . P - - - - -'], RAT_R, RAT) },
      ], drums: 'K..B.HH..B.H' },
      kumarhaneStore: { bpm: 100, div: 4, dv: .35, gain: .73, parts: [
        { i: 'mute', s: 'F5 - - - Eb5 - Db5 - C5 - - - Db5 - - - | Bb4 - - - Ab4 - Gb4 - F4 - - - Gb4 - Ab4 - | ' +
                        'Gb4 - - - F4 - Eb4 - Db4 - - - Eb4 - F4 - | Ab4 - - - - - Gb4 - F4 - Eb4 - C4 - - -' },
        { i: 'ep', s: gen('P . . P . . P . . P . . P . . .', ['Db', 'Gb', 'Eb', 'Ab'], BOSSA) },
        { i: 'upright', s: gen('R . . F . . . . R . . F . . . .', ['Db', 'Gb', 'Eb', 'Ab'], BOSSA) },
      ], drums: 'K..H..H.B..H..H.' },
      /* P104 — KOZMİK RUN'IN KENDİ MÜZİĞİ (kullanıcı: "kozmik run'ın tema müziği hâlâ eklenmemiş"): uzay yolculuğu —
         D Lidyen, yavaş (84 bpm) süzülen theremin melodisi, cam arpej, koro pad'i, çan pırıltıları, sub bas, çok hafif
         kalp atışı. Kozmik run'da harita + normal raund; store `kozmikStore`; boss raundu yine boss'un kendi parçası. */
      kozmik: { bpm: 84, div: 4, dv: .55, gain: .52, parts: [
        { i: 'theremin', s: x2('A4 - - - F#5 - - - | E5 - D5 - - - . . | B4 - - - D5 - C#5 - | D5 - - - - - . . | ' +
                               'D5 - - - F#5 - E5 - | D5 - B4 - - - . . | C#5 - E5 - A5 - - - | E5 - - - - - . . | ' +
                               'F#5 - - - A5 - G#5 - | F#5 - E5 - D5 - . . | B5 - A5 - G5 - F#5 - | D5 - - - - - . . | ' +
                               'F#5 - - - E5 - D5 - | C#5 - - - E5 - A5 - | B5 - - - A5 - F#5 - | E5 - - - - - . .') },
        { i: 'glass', s: gen('A . B . C . B . A . B . C . B .', COS_R, COS_H) },
        { i: 'choir', s: gen('P - - - - - - - - - - - - - - -', COS_R, COS) },
        { i: 'bell', s: gen('. . . . . . . . . . C . . . . .', COS_R, COS_H) },
        { i: 'sub', s: gen('R - - - - - - - R - - - - - - -', COS_R, COS) },
      ], drums: 'K.......x...K...' },
      kozmikStore: { bpm: 72, div: 4, dv: .45, gain: .58, parts: [
        { i: 'glass', s: 'A4 - - - - - - - F#5 - - - E5 - - - | D5 - - - - - - - . . . . B4 - C#5 - | ' +
                         'D5 - - - F#5 - - - A5 - - - G#5 - - - | F#5 - - - E5 - - - . . . . . . . . | ' +
                         'A4 - - - - - - - F#5 - - - E5 - - - | B4 - - - D5 - - - . . . . F#5 - E5 - | ' +
                         'D5 - - - E5 - - - F#5 - - - A5 - - - | E5 - - - - - - - - - - - . . . .' },
        { i: 'pad', s: gen('P - - - - - - - - - - - - - - -', COS_S, COS) },
        { i: 'theremin', s: gen('. . . . . . . . . . . . . . . .', COS_S, COS_H) },
        { i: 'sub', s: gen('R - - - - - - - - - - - - - - -', COS_S, COS) },
      ], drums: 'K...............' },
      /* LANETLİ BOYUT (rapor: "kırık müzik kutusu ninnisi") — harita + normal raund. A minör 3/4 ninni, 72 bpm;
         müzik kutusu yay boşalırken sarkıyor (mbox), 7. ve 15. ölçüde "yanlış" nota (Bb, Eb), altında karanlık
         uğultu (drone) ve sub bas, tik-tak gibi seyrek saat tıkı. Kozmik/Kumarhane gibi kendi dünyası. */
      lanetli: { bpm: 72, div: 2, dv: .4, gain: .62, parts: [
        { i: 'mbox', s: 'E6 - - D6 C6 - | B5 - - A5 - - | C6 - - B5 A5 - | G#5 - - - . . | ' +
                        'A5 - - C6 E6 - | F6 - - E6 D6 - | E6 - - Bb5 A5 - | A5 - - - . . | ' +
                        'E6 - - D6 C6 - | B5 - - A5 - B5 | C6 - - E6 A6 - | G#6 - - - . . | ' +
                        'A6 - - F6 E6 - | D6 - - C6 B5 - | C6 - - B5 Eb6 - | A5 - - - - .' },
        { i: 'mbox', s: gen('. . A . . C', LBN_R, LBN_H) },
        { i: 'drone', s: gen('P - - - - -', LBN_R, LBN) },
        { i: 'sub', s: gen('R - - - - -', LBN_R, LBN) },
      ], drums: 'K..H..' },
      /* Store + Adak Sunağı — lanetli şapel orgu: D minör, yavaş (60), org akorları, koro, tek tük müzik kutusu */
      lanetliStore: { bpm: 60, div: 2, dv: .35, gain: .58, parts: [
        { i: 'organ', s: 'A4 - - - F4 - G4 - | F4 - - - D4 - - - | G4 - - - Bb4 - A4 - | A4 - - - C#4 - - - | ' +
                         'D5 - - - C5 - A4 - | C5 - - - A4 - F4 - | G4 - Bb4 - A4 - G4 - | E4 - - - - - . .' },
        { i: 'organ', s: gen('P - - - - - - -', LBS_R, LBS) },
        { i: 'choir', s: gen('P - - - - - - -', LBS_R, LBS) },
        { i: 'mbox', s: '. . . . . . A6 - | . . . . . . F6 - | . . . . . . D6 - | . . . . . . E6 - | . . . . . . A6 - | . . . . . . C6 - | . . . . . . Bb5 - | . . . . . . C#6 -' },
        { i: 'sub', s: gen('R - - - - - - -', LBS_R, LBS) },
      ], drums: '........' },
      /* Lanetli Boyut boss parçası (yalnız kendi müziği olmayan boss'un yedeği). Kullanıcı ilk sürümü "run'ın tema
         müziğine çok benziyor" diye beğenmedi (müzik kutusu motifi + aynı karanlık uğultu) → baştan: KEMİK DANSI.
         G minör 6/8, 138 bpm; keman lanetli tritonla (A+Eb) açılır, ksilofon gibi tıkırdayan kemikler (needle),
         pizzicato bas, çello, ölçü sonu bakır vuruşları, boss davul seti. Müzik kutusu ve drone YOK. */
      lanetliBoss: { bpm: 138, div: 3, dv: .75, gain: .6, parts: [
        { i: 'violin', s: 'A4+Eb5 - - A4+Eb5 - - | G4 - Bb4 D5 - C5 | Bb4 - G4 Eb5 - D5 | F#4 - - A4 - - | ' +
                          'G4 - Bb4 D5 - G5 | F5 - Eb5 C5 - Eb5 | D5 - - F#5 - A5 | D5 - - . . . | ' +
                          'A4+Eb5 - - A4+Eb5 - - | G5 - F#5 G5 - D5 | Eb5 - D5 C5 - Bb4 | A4 - - F#4 - - | ' +
                          'C5 - Eb5 G5 - Eb5 | D5 - Bb4 G4 - Bb4 | A4 - C5 F#5 - A5 | G5 - - . . .' },
        { i: 'needle', s: gen('A . C B . A', LBX_R, LBX_H) },
        { i: 'pizz', s: gen('R . . F . .', LBX_R, LBX) },
        { i: 'cello', s: gen('O - - - - -', LBX_R, LBX) },
        { i: 'tbrass', s: per(['. . . . . .', '. . . P - .', '. . . . . .', 'P - . P - -'], LBX_R, LBX) },
        { i: 'sub', s: gen('L - - - - -', LBX_R, LBX) },
      ], drums: 'K.HS.H' },
      /* Boss · genel — müziği olmayan (yeni) bir boss için yedek. P71c: eskiden
         D Hicaz + ney'di (menünün tıpkısı) → G minör yaylı ostinato + bakır, kick/trampet */
      bossGenel: { bpm: 104, div: 4, dv: .7, gain: .55, parts: [
        { i: 'cello', s: gen('R . R . O . R . R . R . O . F .', ['G', 'G', 'Eb', 'D'], GMIN) },
        { i: 'tbrass', s: x2('D4 - - - Bb3 - C4 D4 | Eb4 - D4 - C4 - Bb3 - | C4 - - - A3 - Bb3 C4 | D4 - - - - - . .') },
        { i: 'sub', s: gen('L - - - - - - - - - - - - - - -', ['G', 'G', 'Eb', 'D'], GMIN) },
      ], drums: 'K...S...K.K.S...' },
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
      /* P71c (kullanıcı 2026-10-06: "boss temaları ana menünün hafif değişmiş hâli
         gibi") — ortak payda D merkezli tonalite, menünün darbukası (D/T/k) ve
         ney'di. Kural artık: boss parçası ney/kanun/menü arpı ve darbuka KULLANMAZ
         (davul seti K kick · S trampet · H/O hi-hat · B fırça · C/X el çırpma),
         tonalitesi D Hicaz değildir (`tp` ile yarım ses kaydırma). Sir.by, The
         Misunderstood, Zombie, Terzi, Ritim, Tüccar baştan; Lady Luck yeni. */

      /* Godzilla — kaiju: ağır bakır + triton; C# minöre indi (tp −1), kick */
      godzilla: { bpm: 76, div: 4, dv: 1, gain: .5, tp: -1, parts: [
        { i: 'tbrass', s: x2('D3 - - - - - D3 F3 | G#3 - - - A3 - - - | D3 - - - - - F3 E3 | D3 - - - C3 - Bb2 - | ' +
                             'F3 - - - - - G3 A3 | Bb3 - - - A3 - G#3 - | A3 - - - D4 - - - | C#4 - - - A3 - - -') },
        { i: 'sub', s: gen('L - - - - - - - - - - - - - - -', ['D', 'D', 'D', 'Bb', 'F', 'Bb', 'A', 'A'], NAT) },
        { i: 'choir', s: gen('P - - - - - - - - - - - - - - -', ['D', 'D', 'D', 'Bb', 'F', 'Bb', 'A', 'A'], NAT) },
      ], drums: 'K.......x.......' + 'K.....K.x...K...' },

      /* Sir.by — 1920/30'lar gangster noir (BAŞTAN). C minörde swing (üçleme
         ızgarası), kontrbasın yürüyen basında ii-V'ler, kısık trompet lead,
         lounge piyano vuruşları, fırça davul. 92 bpm, karamsar. */
      kirby: { bpm: 92, div: 3, dv: .5, gain: .95, parts: [
        { i: 'mute', s: 'G4 - - - - . Eb4 . F4 G4 - Ab4 | G4 - - - - - . . . C5 . B4 | ' +
                        'Bb4 - - Ab4 - - Gb4 - - . . . | F4 - - - - - D4 . Eb4 D4 - B3 | ' +
                        'C5 - - - - . Ab4 . Bb4 C5 - Db5 | C5 - - - - - . . . Eb5 . C5 | ' +
                        'Ab4 - - F4 - - D4 - - F4 - Ab4 | G4 - - - - - - - - . . .' },
        { i: 'upright', s: 'C2 - - Eb2 - - G2 - - B1 - - | C2 - - D2 - - Eb2 - - G2 - - | ' +
                           'Ab1 - - C2 - - Eb2 - - Gb2 - - | G1 - - B1 - - D2 - - F2 - - | ' +
                           'F1 - - Ab1 - - C2 - - Eb2 - - | Ab1 - - C2 - - Eb2 - - D2 - - | ' +
                           'D2 - - F2 - - Ab2 - - C2 - - | G1 - - B1 - - D2 - - Db2 - -' },
        { i: 'ep', s: gen('. . P . . . . . P . . .', ['C', 'C', 'Ab', 'G', 'F', 'Ab', 'D', 'G'], NOIR) },
      ], drums: 'K..B.HH..B.H' },

      /* Cellat — darağacına yürüyüş; C minöre indi (tp −2), kick */
      cellat: { bpm: 66, div: 4, dv: .9, gain: 1.3, tp: -2, parts: [
        { i: 'cello', s: x2(gen('R F R F R F R F', ['D', 'D', 'Bb', 'Bb', 'G', 'G', 'A', 'A'], NAT)) },
        { i: 'choir', s: x2('D4 - - - - - - - | F4 - - - E4 - D4 - | D4 - - - - - - - | Bb3 - - - - - - - | ' +
                            'G3 - - - Bb3 - D4 - | E4 - - - - - - - | F4 - - - E4 - D4 - | C#4 - - - - - - -') },
        { i: 'bell', s: gen('A - - - - - - - - - - - - - - -', ['D', 'D', 'Bb', 'Bb', 'G', 'G', 'A', 'A'], NAT) },
      ], drums: 'K.......x.......' + 'K.......x...xxxx' },

      /* The Misunderstood — Sandman'ın Morpheus'u (BAŞTAN): rüya kapısı. 56 bpm,
         Eb Lidya ↔ C Aiol arasında kararsız modal armoni (Db ve G minör b6
         sapmaları), geniş koro + yumuşak dokular, cam/celesta motifi ve onun üç
         adım geriden gelen yankısı; davul yok, dört ölçüde bir fırça nefesi. */
      misunderstood: { bpm: 56, div: 2, dv: .3, gain: .56, parts: [
        { i: 'glass', s: 'G5 - - - D5 - - - | Eb5 - - - - - Bb4 - | C5 - - - G4 - Ab4 - | F5 - - - - - - - | ' +
                         'G5 - - - Bb5 - - - | Ab5 - - - F5 - C5 - | Eb5 - - - D5 - - - | D5 - - - - - . .' },
        { i: 'echo', s: shift('G4 - - - D4 - - - | Eb4 - - - - - Bb3 - | C4 - - - G3 - Ab3 - | F4 - - - - - - - | ' +
                              'G4 - - - Bb4 - - - | Ab4 - - - F4 - C4 - | Eb4 - - - D4 - - - | D4 - - - - - . .', 3) },
        { i: 'choir', s: gen('P - - - - - - -', ['Eb', 'C', 'Ab', 'Bb', 'Eb', 'Db', 'Ab', 'G'], MORPH) },
        { i: 'sub', s: gen('L - - - - - - -', ['Eb', 'C', 'Ab', 'Bb', 'Eb', 'Db', 'Ab', 'G'], MORPH) },
      ], drums: 'B' + '.'.repeat(31) },

      /* Terzi'nin İğnesi — dikiş (BAŞTAN): 150 bpm 16'lık "iğne" tıkları (ince kare
         dalga, yüksek perde) dikiş makinesi gibi aynı motifi tekrar eder; altında
         kromatik tırmanan keman ipliği, eksik (dim) akor döngüsü → gerginlik. */
      terziIgne: { bpm: 150, div: 4, dv: .45, gain: 1.75, parts: [
        { i: 'needle', s: 'F#6 . F#6 . C6 . F#6 . A5 . F#6 . Eb6 . F#6 . | A6 . A6 . Eb6 . A6 . C6 . A6 . F#6 . A6 . | ' +
                          'C6 . C6 . F#5 . C6 . Eb6 . C6 . A5 . C6 . | Eb6 . Eb6 . A5 . Eb6 . F#6 . Eb6 . C6 . D6 .' },
        { i: 'violin', s: x2('F#5 - - - G5 - - - | A5 - - - Bb5 - - - | C6 - - - C#6 - - - | Eb6 - - - D6 - C6 -') },
        { i: 'pizz', s: gen('R . . . R . . . R . . . R . R .', ['F#', 'A', 'C', 'Eb'], DIM) },
      ], drums: 'K.H.H.H.S.H.H.HH' },

      /* Üç Kağıtçı — sinsi tango; G minöre çıktı (tp +5), tango davulu */
      ucKagitci: { bpm: 112, div: 4, dv: .55, tp: 5, parts: [
        { i: 'clar', s: 'A4 . . A4 Bb4 . A4 . G#4 . . A4 - - - . | D5 - - - C5 . Bb4 . A4 - - - . . . . | ' +
                        'G4 . . G4 A4 . G4 . F#4 . . G4 - - - . | C5 - - - Bb4 . A4 . G4 - - - . . . . | ' +
                        'F4 . G4 . A4 . Bb4 . C#5 - - - D5 . . . | E5 . D5 . C#5 . Bb4 . A4 - - - - - . . | ' +
                        'D5 . . D5 F5 . D5 . C#5 . . A4 Bb4 . G4 . | A4 - - - - - - - D4 . . . . . . .' },
        { i: 'bass', s: gen('R . . R O . R . R . . R O . R .', ['D', 'D', 'G', 'G', 'Bb', 'A', 'D', 'A'], NAT) },
        { i: 'accord', s: gen('. . P . . . P . . . P . . . P .', ['D', 'D', 'G', 'G', 'Bb', 'A', 'D', 'A'], NAT) },
      ], drums: 'K..SK.S.K..SK.SS' },

      /* GLITCH — bozuk sinyal (aynen); kick */
      dervish: { bpm: 140, div: 4, dv: .6, gain: .5, parts: [
        { i: 'chip', s: gen('A B C O A B C O A B C O A C B O', ['A', 'F', 'C', 'G', 'A', 'F', 'E', 'E'], AMIN) },
        { i: 'lead2', s: 'A5 . A5 A5 . . . . E5 . . . . . . . | G5 G5 G5 . F5 . . . E5 . D5 . . . . . | ' +
                         'A5 . A5 A5 . . C6 . B5 . . . . . . . | G#5 . . . . . . . E5 E5 E5 E5 . . . .' },
        { i: 'sub', s: gen('R . . R . . R . R . . R . R R .', ['A', 'F', 'C', 'G', 'A', 'F', 'E', 'E'], AMIN) },
      ], drums: 'K.sxK.sxKKs.xsxs' + 'K.s.xxs.K.ssx.xx' },

      /* Ritim — ritim oyunu (BAŞTAN): 124 bpm SABİT dörtlük kick ("four on the
         floor"), 2 ve 4'te el çırpma, 16'lık hi-hat; E majörde I-vi-IV-V, saw
         lead soru-cevap, oktav zıplayan bas. Eski aksak 7/8 Hicaz + darbuka gitti.
         Mini oyun açıkken müzik kısılır (Music.duck) — çubuk müziğe kilitli değil. */
      ritim: { bpm: 124, div: 4, dv: .7, gain: .9, parts: [
        { i: 'saw', s: 'B4 . B4 . E5 . . . G#5 . F#5 . E5 . . . | C#5 . C#5 . E5 . . . G#5 . . . F#5 . E5 . | ' +
                       'A4 . C#5 . E5 . A5 . G#5 . E5 . C#5 . . . | B4 . D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4 . | ' +
                       'E5 . . . E5 . G#5 . B5 . . . G#5 . E5 . | E5 . . . C#5 . E5 . G#5 . . . E5 . C#5 . | ' +
                       'A5 . . . G#5 . E5 . C#5 . E5 . A5 . . . | B5 . A5 . F#5 . D#5 . F#5 . B4 . . . . .' },
        { i: 'bass', s: gen('R . O . R . O . R . O . R O R O', ['E', 'C#', 'A', 'B', 'E', 'C#', 'A', 'B'], EMAJ) },
        { i: 'stab', s: gen('. . P . . . P . . . P . . . P .', ['E', 'C#', 'A', 'B', 'E', 'C#', 'A', 'B'], EMAJ) },
      ], drums: 'K.H.X.H.K.H.X.HH' },

      /* Kahin — kehanet; Hicaz'dan çıktı: A Frig (C♮) → C Frig'e (tp +3), lead
         ney yerine keman, kick + fırça */
      kahin: { bpm: 72, div: 4, dv: .55, gain: 1.05, tp: 3, parts: [
        { i: 'violin', s: x2('A4 - - - - - Bb4 A4 | C5 - - - D5 - - - | E5 - - - F5 - E5 D5 | C5 - - - - - - - | ' +
                             'D5 - C5 - Bb4 - - - | A4 - - - G4 - F4 - | E4 - F4 - G4 - Bb4 - | A4 - - - - - - -') },
        { i: 'bell', s: gen('A . B . C . B . A . B . C . B .', ['A', 'A', 'D', 'A', 'Bb', 'D', 'G', 'A'], AMIN_PH) },
        { i: 'drone', s: gen('P - - - - - - - - - - - - - - -', ['A', 'A', 'D', 'A', 'Bb', 'D', 'G', 'A'], AMIN_PH) },
      ], drums: 'K.......B...B...' },

      /* Tüccar — İpek Yolu tüccarı (BAŞTAN): 9/8 karşılama (2+2+2+3), E Kürdi
         (Frig; Hicaz'ın artık ikilisi YOK), F→E kapanışı; ut lead oyunbaz-sinsi,
         staccato pizzicato karşı ses, kontrbas; davul kick/hi-hat (darbuka değil). */
      tuccar: { bpm: 150, div: 2, dv: .55, gain: 1, parts: [
        { i: 'ud', s: 'E5 F5 G5 . F5 E5 D5 - E5 | F5 - G5 A5 G5 F5 E5 - - | A5 G5 F5 . E5 F5 G5 - A5 | G5 F5 E5 . D5 E5 F5 - - | ' +
                      'F5 E5 D5 . C5 D5 E5 F5 G5 | A5 - G5 F5 E5 - D5 - C5 | D5 E5 F5 . E5 F5 G5 F5 E5 | F5 - E5 - - - . . .' },
        { i: 'pizz', s: gen('. A . B . A . C .', ['E', 'E', 'A', 'G', 'F', 'D', 'F', 'E'], KURDI) },
        { i: 'upright', s: gen('R . . . F . R . .', ['E', 'E', 'A', 'G', 'F', 'D', 'F', 'E'], KURDI) },
      ], drums: 'K.H.K.HHH' + 'K.H.K.H.H' },

      /* Ayna Kral — aynalar sarayı (aynen); F minöre (tp +3), kick */
      aynaKral: { bpm: 92, div: 2, dv: .7, gain: 1.1, tp: 3, parts: [
        { i: 'tbrass', s: AYNA },
        { i: 'echo', s: shift(AYNA, 3) },
        { i: 'harpsi', s: gen('A B C B A B C B', ['D', 'A', 'G', 'D', 'G', 'C', 'F', 'G'], NAT) },
        { i: 'bass', s: gen('R - - - F - - -', ['D', 'A', 'G', 'D', 'G', 'C', 'F', 'G'], NAT) },
      ], drums: 'K.......' + 'K...x...' + 'K.K.....' + 'K...x.xx' },

      /* The Corporates — soğuk kurum (aynen); kick */
      corporates: { bpm: 118, div: 4, dv: .5, gain: 1.15, parts: [
        { i: 'dbass', s: gen('R R R R R R R R R R R R R R O R', ['A', 'A', 'F', 'F', 'C', 'C', 'G', 'E'], AMIN) },
        { i: 'organ', s: gen('A . C . B . C . A . C . B . C .', ['A', 'A', 'F', 'F', 'C', 'C', 'G', 'E'], AMIN) },
        { i: 'bell', s: x2('A4 - - - - - E5 - | D5 - C5 - B4 - - - | C5 - - - - - G5 - | F5 - E5 - D5 - - - | ' +
                           'A4 - - - - - E5 - | F5 - E5 - D5 - C5 - | B4 - C5 - D5 - E5 - | E5 - - - - - - -') },
      ], drums: 'K.s.x.s.K.s.x.ss' + 'K.s.x.s.K.sKx.s.' },

      /* Lady Luck — Kumarhane FİNALİ. P74 (kullanıcı: "jazz esintisi olsun; o karakter
         kumarhane lady'si ve şarkıcı gibi"): caz kulübünde sahneye çıkan şarkıcı.
         G minör, 100 bpm swing; minör ii-V (Aø7 D7 → Gm7), kadife ses melodisi
         blue note'larla (D7'de Eb), boşluklarında kısık trompet cevapları,
         yürüyen kontrbas, 2 ve 4'te parmak şıklatma, ride. 16 ölçü (≈38 sn).
         Final haritasında da çalar. */
      /* LANETLİ ÇOCUK (Lanetli Boyut finali, rapor §Müzik) — ninni TAMAMEN bozulur: modun A minör müzik kutusu ninnisi
         6/8'e, 112 bpm'e çekilmiş; melodide tritonlar ve yarım ses kümeleri (A5+Bb5), saat çarkı tıkırtısı (needle), koro.
         Fazlarla katman ekler (part.l): Faz 2 dokunaç altı bas (sub + çello ostinatosu), Faz 3 tritonla çığlık atan
         keman ve bakır vuruşları. Nihai Feda anında müzik kesilir, tek müzik kutusu notası çalar (Music.freeze).
         Boss davul seti (darbuka/ney yok — BOSS ≠ MENÜ). */
      lanetliCocuk: { bpm: 112, div: 3, dv: .5, gain: 1.05, parts: [
        { i: 'mbox', s: 'E6 - - D6 C6 - | B5 - - A5 - - | C6 - - B5 Bb5 - | G#5 - - - . . | ' +
                        'A5 - - C6 Eb6 - | F6 - - E6 D6 - | E6 - - Bb5 A5 - | A5+Bb5 - - - . . | ' +
                        'E6 - - D6 C6 - | B5 - - A5 - B5 | C6 - - Eb6 A6 - | G#6 - - - . . | ' +
                        'A6 - - F6 E6 - | D6 - - C6 B5 - | C6 - - B5 Eb6 - | A5+Eb6 - - - - .' },
        { i: 'needle', s: gen('A . . C . B', LBN_R, LBN_H) },
        { i: 'choir', s: gen('P - - - - -', LBN_R, LBN) },
        { i: 'sub', l: 2, v: .22, s: gen('R - - - - -', LBN_R, LBN) },
        { i: 'cello', l: 2, v: .35, s: gen('R . R O . R', LBN_R, LBN) },
        { i: 'violin', l: 3, v: .4, s: 'A4+Eb5 - - - - - | . . . . . . | A4+Eb5 - - G#4+D5 - - | . . . . . . | ' +
                                'C5+F#5 - - - - - | . . . . . . | Bb4+E5 - - A4+Eb5 - - | . . . . . . | ' +
                                'A4+Eb5 - - - - - | . . . . . . | C5+F#5 - - B4+F5 - - | . . . . . . | ' +
                                'D5+G#5 - - - - - | . . . . . . | Bb4+E5 - - A4+Eb5 - - | A4+Eb5 - - - - -' },
        { i: 'tbrass', l: 3, v: .4, s: per(['. . . . . .', 'P - . . . .', '. . . . . .', 'P - . P - .'], LBN_R, LBN) },
      ], drums: 'K..C.KK..C..' },
      ladyLuck: { bpm: 100, div: 3, dv: .5, gain: .8, parts: [
        { i: 'vox', s: 'D5 - - - - - Bb4 - C5 D5 - - | F5 - - D5 - Bb4 - - - . . . | ' +
                       'Eb5 - - - - - C5 - D5 Eb5 - - | G5 - - F5 - Eb5 - - - . . . | ' +
                       'Eb5 - - - - - C5 - - A4 - - | F#4 - - A4 - C5 Eb5 - - D5 - - | ' +
                       'D5 - - - - - - - - . . . | . . . Bb4 - C5 D5 - F5 G5 - - | ' +
                       'Bb5 - - - - - G5 - - D5 - - | F5 - - Eb5 - D5 - - - . . . | ' +
                       'Eb5 - - D5 - C5 Bb4 - - G4 - - | A4 - - C5 - Eb5 - - - F5 - - | ' +
                       'D5 - - - - - A4 - Bb4 C5 - - | Eb5 - - D5 - C5 - - - A4 - - | ' +
                       'Eb5 - - D5 - C5 Bb4 - A4 F#4 - - | G4 - - - - - - - - . . .' },
        { i: 'mute', s: per(['. . . . . . . . . . . .', '. . . . . . . . . A4 - Bb4', '. . . . . . . . . . . .', '. . . . . . . . . Bb4 - A4',
                             '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . F5 - D5', '. . . . . . . . . . . .',
                             '. . . . . . . . . . . .', '. . . . . . . . . C5 - Bb4', '. . . . . . . . . . . .', '. . . . . . . . . . . .',
                             '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . F#4 - A4'], JAZZ_R, JAZZ) },
        { i: 'upright', s: 'G2 - - Bb2 - - D3 - - F#2 - - | G2 - - A2 - - Bb2 - - B2 - - | C3 - - Eb3 - - G3 - - B2 - - | ' +
                           'C3 - - Eb3 - - C3 - - Bb2 - - | A2 - - C3 - - Eb3 - - Db3 - - | D3 - - F#3 - - A3 - - Ab3 - - | ' +
                           'G3 - - F3 - - D3 - - Bb2 - - | G2 - - Bb2 - - D3 - - E3 - - | Eb3 - - G3 - - Bb3 - - D3 - - | ' +
                           'Eb3 - - D3 - - C3 - - Db3 - - | C3 - - Eb3 - - G3 - - Gb3 - - | F3 - - Eb3 - - C3 - - B2 - - | ' +
                           'Bb2 - - D3 - - F3 - - Bb2 - - | A2 - - C3 - - Eb3 - - Db3 - - | D3 - - C3 - - A2 - - Ab2 - - | ' +
                           'G2 - - Bb2 - - D3 - - F#2 - -' },
        { i: 'ep', s: gen('. . . P - . . . . . P -', JAZZ_R, JAZZ) },
      ], drums: 'K..C.HH..C.H' },

      /* P90 — ORION (Kozmik Run finali): KOZMİK WESTERN DÜELLOSU. Şapkalı yalnız
         savaşçı seninle düello ediyor → spaghetti western + tokusatsu kahraman
         rock'ı uzayda. E minör 132, 16'lık: theremin = Morricone ıslığı (uzay
         sesi), tbrass = kahramanca cevap, dbass = dörtnala at (8'lik + iki 16'lık),
         koro pad = uzay boşluğu, cam = yıldız pırıltısı, stab = güç akoru vuruşu.
         Boss kuralı: ney / kanun / darbuka YOK; boss davul seti. */
      orion: { bpm: 132, div: 4, dv: .4, gain: .9, parts: [
        { i: 'theremin', s: 'E5 - - - - - - - B4 - - - E5 - G5 - | F#5 - - - - - - - . . . . . . . . | ' +
                            'E5 - - - - - - - C5 - - - E5 - G5 - | A5 - - - - - - - F#5 - - - D5 - - - | ' +
                            'E5 - - - - - - - B4 - - - E5 - G5 - | B5 - - - - - - - A5 - G5 - F#5 - - - | ' +
                            'G5 - - - E5 - - - C5 - - - A4 - - - | B4 - - - - - - - D#5 - - - F#5 - - - | ' +
                            '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | ' +
                            '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | ' +
                            '. . . . . . . . . . . . . . . . | . . . . . . . . E6 - - - - - - - | ' +
                            '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . .' },
        { i: 'tbrass', s: '. . . . . . . . . . . . . . . . | . . . . . . . . B3 - E4 - G4 - B4 - | ' +
                          '. . . . . . . . . . . . . . . . | . . . . . . . . A3 - D4 - F#4 - A4 - | ' +
                          '. . . . . . . . . . . . . . . . | . . . . . . . . B3 - E4 - G4 - B4 - | ' +
                          '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | ' +
                          'E4 - E4 G4 - - B4 - - - A4 - G4 - A4 - | B4 - - - - - - - . . . . E4 - G4 - | ' +
                          'C5 - - - B4 - A4 - G4 - - - E4 - - - | D5 - - - - - C5 - B4 - - - A4 - - - | ' +
                          'E4 - E4 G4 - - B4 - - - A4 - G4 - A4 - | B4 - - - - - D5 - E5 - - - . . . . | ' +
                          'C5 - B4 - A4 - G4 - E4 - - - G4 - - - | F#4 - - - - - - - D#4 - - - B3 - - -' },
        { i: 'dbass', s: gen('R . R R R . R R R . R R R . R R', ORI_R, ORI) },
        { i: 'choir', s: gen('P - - - - - - - - - - - - - - -', ORI_R, ORI) },
        { i: 'glass', s: gen('. . . . . . C . . . . . . . B .', ORI_R, ORI_HI) },
        { i: 'stab', s: gen('F . . . . . . . . . . . F . . .', ORI_R, ORI) },
      ], drums: 'K.HHS.HHK.HHS.OH' },

      /* ── beğenilen parçalar: karakter AYNI, yalnız menü benzerliği kalktı ── */
      /* Kara Kedi — sinsi pizzicato + yürüyen bas; fırça */
      karaKedi: { bpm: 100, div: 2, dv: .45, gain: 1.4, parts: [
        { i: 'pizz', s: 'E4 . F#4 G4 . . G#4 A4 | . . E4 F#4 G4 . E4 . | B4 . A#4 A4 . G4 E4 . | D#4 E4 - - . . . .' },
        { i: 'bass', s: 'E2 . G2 . A2 . A#2 . | B2 . A2 . G2 . E2 . | E2 . G2 . A2 . C3 . | B2 . B1 . E2 . . .' },
      ], drums: 'K.s.B.s.' },
      /* Kelebek Etkisi — kanat çırpan arpejler; lead ney yerine keman */
      kelebek: { bpm: 120, div: 4, dv: .35, gain: .62, parts: [
        { i: 'violin', s: x2('E5 - - - F#5 - - - | G5 - - - A5 - - - | F5 - - - E5 - D5 - | E5 - - - - - - -') },
        { i: 'bell', s: gen('A B C B A B C B A C B C A B C B', ['C', 'D', 'Bb', 'A'], DREAM) },
        { i: 'bass', s: gen('R - - - - - - - - - - - - - - -', ['C', 'D', 'Bb', 'A'], DREAM) },
      ], drums: 'B...s...B...s.s.' },
      /* Ahtapot — su altı; B minöre (tp −3), fırça/kick */
      ahtapot: { bpm: 84, div: 4, dv: .55, tp: -3, parts: [
        { i: 'wob', s: x2('D4 - - E4 F4 - - - | A4 - G4 - F4 - E4 - | D4 - - E4 F4 - G4 - | A4 - - - - - - -') },
        { i: 'arp', s: gen('A . B . C . B . A . B . C . B .', ['D', 'Bb', 'C', 'A'], NAT) },
        { i: 'bass', s: gen('R . . R . . R . . . R . R . . .', ['D', 'Bb', 'C', 'A'], NAT) },
        { i: 'drone', s: gen('P - - - - - - - - - - - - - - -', ['D', 'Bb', 'C', 'A'], NAT) },
      ], drums: 'K..B..K...B..B..' },
      /* Fatality — dövüş tekno (aynen); kick/hi-hat/trampet */
      fatality: { bpm: 138, div: 4, dv: .75, gain: 1.2, parts: [
        { i: 'boss', s: 'A4 . A4 . C5 . A4 . D5 . A4 . E5 . D5 . | C5 . C5 . E5 . C5 . G5 . C5 . G5 . F5 . | ' +
                        'A4 . A4 . C5 . A4 . D5 . A4 . E5 . D5 . | A4 . A4 . C5 . A4 . E5 . D5 . C5 . B4 .' },
        { i: 'dbass', s: gen('R . O . R . O . R . O . R . O .', ['A', 'C', 'A', 'E'], AMIN) },
      ], drums: 'K.H.S.H.K.H.S.HH' },
      /* Zombie — istila (BAŞTAN): 7/8 topallayan ritim (3+2+2), triton + küçük
         ikili kümeli akorlar, drone; kök her iki ölçüde yarım ses TIRMANIR
         (B→C→C#→D) → döngü boyunca artan panik, sonra B'ye çöküş. */
      zombie: { bpm: 100, div: 2, dv: .75, gain: 1.2, parts: [
        { i: 'drone', s: gen('P - - - - - -', ['B', 'B', 'C', 'C', 'C#', 'C#', 'D', 'D'], ZOMB) },
        { i: 'dbass', s: gen('R . . R . R .', ['B', 'B', 'C', 'C', 'C#', 'C#', 'D', 'D'], ZOMB) },
        { i: 'cello', s: gen('B - - - C - -', ['B', 'B', 'C', 'C', 'C#', 'C#', 'D', 'D'], ZOMB) },
        { i: 'organ', s: gen('. . . . P . .', ['B', 'B', 'C', 'C', 'C#', 'C#', 'D', 'D'], ZOMB) },
      ], drums: 'K..S.K.' + 'K..SHKH' },
      /* Freedom Fighters — trampetli marş; Bb'ye (tp −4), kick */
      freedom: { bpm: 112, div: 4, dv: .65, gain: 1.1, tp: -4, parts: [
        { i: 'brass', s: x2('D4 - D4 F4 A4 - - - | G4 - F4 E4 D4 - - - | D4 - D4 F4 A4 - D5 - | C5 - A4 - D5 - - -') },
        { i: 'bass', s: gen('R . . . F . . . R . . . F . . .', ['D', 'G', 'D', 'A'], NAT) },
      ], drums: 'K.xxK.x.K.xxKxxx' },
      /* Alien — tam ton theremin (aynen); fırça */
      uzayli: { bpm: 90, div: 4, dv: .4, gain: .65, parts: [
        { i: 'theremin', s: x2('C5 - - - D5 - E5 - | F#5 - - - E5 - - - | G#5 - F#5 - E5 - D5 - | C5 - - - - - - -') },
        { i: 'bell', s: gen('A B C B A B C B A B C B A B C B', ['C', 'D', 'C', 'D'], WT) },
        { i: 'bass', s: gen('R - - - - - - - . . . . R - - -', ['C', 'D', 'C', 'D'], WT) },
      ], drums: 'B.....s...B.s...' },
      /* Avukat — barok klavsen; G minöre (tp +5), fırça */
      avukat: { bpm: 108, div: 4, dv: .3, gain: 1.25, tp: 5, parts: [
        { i: 'harpsi', s: 'D5 A4 F4 A4 D5 A4 F4 A4 E5 A4 G4 A4 E5 A4 G4 A4 | F5 A4 D5 A4 F5 A4 D5 A4 E5 A4 C#5 A4 E5 A4 C#5 A4 | ' +
                          'D5 Bb4 G4 Bb4 D5 Bb4 G4 Bb4 C5 A4 F4 A4 C5 A4 F4 A4 | Bb4 G4 E4 G4 A4 F4 D4 F4 C#4 E4 A4 E4 D4 - - -' },
        { i: 'bass', s: gen('R - - - - - - - F - - - - - - -', ['D', 'D', 'G', 'A'], NAT) },
      ], drums: 'B...............' },
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
      /* P71c — boss davul seti (darbuka DEĞİL): K kick · X kick+el çırpma · C el çırpma */
      if (k === 'K' || k === 'X') {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(115, t);
        o.frequency.exponentialRampToValueAtTime(42, t + .09);
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.75 * v, t + .004);
        g.gain.exponentialRampToValueAtTime(.0001, t + .22);
        o.connect(g).connect(dest); o.start(t); o.stop(t + .24);
        if (k === 'K') return;
      }
      if (k === 'C' || k === 'X') {
        for (const d of [0, .011, .023]) {
          const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
          src.buffer = noise; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = .9;
          g.gain.setValueAtTime(.32 * v, t + d);
          g.gain.exponentialRampToValueAtTime(.0001, t + d + (d === .023 ? .09 : .012));
          src.connect(f).connect(g).connect(dest); src.start(t + d); src.stop(t + d + .1);
        }
        return;
      }
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
      const P = { T: [3400, 1.3, .07, .4], k: [2300, 1.3, .045, .2], s: [8500, .9, .03, .12], x: [1800, .7, .14, .32],
        /* P71c — S trampet · H kapalı hi-hat · O açık hi-hat · B fırça */
        S: [1900, .8, .13, .42], H: [9500, .8, .025, .11], O: [8200, .6, .2, .09], B: [2700, .5, .2, .08] }[k] || [2300, 1.3, .045, .2];
      f.type = 'bandpass'; f.frequency.value = P[0]; f.Q.value = P[1];
      const L = P[2], V = P[3] * v;
      g.gain.setValueAtTime(V, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + L);
      src.connect(f).connect(g).connect(dest); src.start(t); src.stop(t + L + .02);
    }

    /* bir adımın notaları + davulu; canlı çalım ve çevrimdışı ölçüm (analyze)
       AYNI kodu kullanır. `tp`: parçayı yarım ses kaydırır (P71c — notalara
       dokunmadan tonalite değiştirme). */
    function prep(T) {
      return { T, stepDur: 60 / T.bpm / T.div, k: Math.pow(2, (T.tp || 0) / 12),
        parts: T.parts.map(p => ({ o: p.v ? { ...INST[p.i], vol: INST[p.i].vol * p.v } : INST[p.i], q: seq(p.s), l: p.l || 1 })) };   // p.v: parça başı ses
    }
    let layer = 1;   // Lanetli Çocuk — faz katmanı (part.l); diğer parçalarda hep 1
    function playStep(P, out, step, at) {
      P.parts.forEach(p => {
        if (p.l > layer) return;
        const e = p.q.at[step % p.q.len];
        if (e) e[1].forEach(f => f && tone(out, at, f * P.k, e[2] * P.stepDur * .92, p.o));
      });
      const d = P.T.drums[step % P.T.drums.length];
      if (d !== '.') drum(out, at, d, P.T.dv);
    }

    function playSynth(name) {
      const T = TRACKS[name];
      const out = actx.createGain();
      out.gain.value = 0;
      out.connect(master);
      out.gain.setTargetAtTime(T.gain || 1, actx.currentTime, .3);   // parça başı seviye dengesi
      const P = prep(T), stepDur = P.stepDur;
      let step = 0, next = actx.currentTime + .06;
      const tick = () => {
        /* sekme uykudan dönünce geçmişe kalan adımları topluca çalma */
        if (next < actx.currentTime) next = actx.currentTime + .05;
        while (next < actx.currentTime + .25) {
          playStep(P, out, step, next);
          step++; next += stepDur;
        }
      };
      tick();
      const timer = setInterval(tick, 40);
      return {
        name,
        /* denetim S-1 — slow: oyun sonu ekranında ~3-4 sn'de yavaşça kapanır */
        stop(slow) {
          out.gain.setTargetAtTime(0, actx.currentTime, slow ? .8 : .25);
          setTimeout(() => { clearInterval(timer); out.disconnect(); }, slow ? 5000 : 1400);
        },
      };
    }

    function playFile(name) {
      const a = new Audio(MUSIC_FILES[name]);
      a.loop = true; a.volume = 0;
      if (!document.hidden) a.play().catch(() => {});   // denetim SA-12 — gizli sekmede başlamaz (görününce çalar)
      let k = 0, fading = null;
      const fade = (from, to, done, step = .05) => {
        clearInterval(fading); k = 0;
        fading = setInterval(() => {
          k = Math.min(1, k + step);
          a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
          if (k >= 1) { clearInterval(fading); if (done) done(); }
        }, 50);
      };
      fade(0, Math.min(1, level() * 2));
      return {
        name, el: a,
        stop(slow) { fade(a.volume, 0, () => { a.pause(); a.src = ''; }, slow ? .0125 : .05); },   // denetim S-1: slow ≈ 4 sn
      };
    }

    let force = null;               // test/kayıt kancası: belirli parçayı zorla
    /* denetim SA-12 — parça ya sentezde (TRACKS) ya da dosyada (MUSIC_FILES) olabilir */
    const hasTrack = (k) => !!(k && (TRACKS[k] || MUSIC_FILES[k]));
    function want() {
      if (force) return force;
      if (preview && document.getElementById('settingsOv')) return preview;
      preview = null;
      /* P72c — Kumarhane run'ı (menü dışı) kendi tema + store müziğini çalar */
      let kumar = false, kozmik = false, lanet = false;
      try { kumar = curScreen() !== 'menu' && !!Game.state && !!Game.kumarhaneOn && Game.kumarhaneOn(); } catch (e) { /* yok */ }
      /* Lanetli Boyut — kendi ninnisi, store/Sunak orgu ve normal boss parçası */
      try { lanet = !kumar && curScreen() !== 'menu' && !!Game.state && !!Game.lanetliOn && Game.lanetliOn(); } catch (e) { /* yok */ }
      if (lanet) {
        if (storeOpen() || upgradeOpen()) return 'lanetliStore';
        /* kullanıcı: "boss'lar kendi parçasını çalsın" — lanetliBoss yalnız parçası olmayan boss'un yedeği */
        try {
          if (curScreen() === 'game' && Game.isBossRound()) {
            const own = Game.state.boss && 'b_' + Game.state.boss.key;
            return hasTrack(own) ? own : 'lanetliBoss';
          }
        } catch (e) { /* yok */ }
        return 'lanetli';
      }
      /* P104 — Kozmik run (Temel) kendi müziğini çalar; menü her zaman seçili tema */
      try { kozmik = !kumar && baseRunActive(); } catch (e) { /* yok */ }
      const theme = kumar ? 'kumarhane' : kozmik ? 'kozmik' : 'tema' + set;
      if (storeOpen() || upgradeOpen()) return kumar ? 'kumarhaneStore' : kozmik ? 'kozmikStore' : 'store' + set;
      if (curScreen() === 'game') {
        try {
          if (!Game.state || !Game.isBossRound()) return theme;
          const own = Game.state.boss && 'b_' + Game.state.boss.key;
          return hasTrack(own) ? own : 'bossGenel';     // boss'un kendi müziği (denetim SA-12: dosyası da sayılır)
        } catch (e) { return theme; }
      }
      /* P74 — final stage'in haritası da final boss'un parçasını çalar */
      try {
        if (curScreen() === 'map' && Game.isFinalStage && Game.isFinalStage() && Game.state.boss) {
          const fin = 'b_' + Game.state.boss.key;
          if (hasTrack(fin)) return fin;   // denetim SA-12
        }
      } catch (e) { /* yok */ }
      return theme;                   // menü + harita: seçili tema
    }

    /* denetim S-2 — duraklat menüsü (oyun / harita / store) açıkken müzik yarı sese iner (pauseK, level()) */
    const pauseOpen = () => ['menuPop', 'mapMenuPop', 'storeMenuPop'].some((id) => { const p = document.getElementById(id); return !!p && !p.classList.contains('hidden'); });
    /* denetim S-1 — Game Over / Run Tamamlandı ekranında raund müziği yavaşça kapanır, yenisi başlamaz */
    const endOpen = () => !force && !!document.querySelector('#gameOverOv, #runCompleteOv');
    function sync() {
      const pk = pauseOpen() ? .5 : 1;
      if (pk !== pauseK) { pauseK = pk; applyLevel(); }
      if (!unlocked || !on) return;
      if (endOpen()) { if (cur) { cur.stop(true); cur = null; } return; }
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
      /* denetim LG-09 — resume() promise döndürür; ses cihazı açılamazsa (çıkışsız/sessiz
         cihaz) "Failed to start the audio device" yakalanmamış ret olarak düşüyordu */
      try { ensureCtx(); if (actx.state === 'suspended') Promise.resolve(actx.resume()).catch(() => {}); } catch (e) { /* sessiz */ }
      sync();
    }
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    /* arka plan sekmesinde zamanlayıcı kısılır → bağlamı uyut, dönünce uyandır */
    document.addEventListener('visibilitychange', () => {
      if (!actx || !unlocked) return;
      Promise.resolve(document.hidden ? actx.suspend() : actx.resume()).catch(() => {});   // denetim LG-09
    });
    /* denetim SA-12 — dosyadan çalan parça (<audio>) AudioContext'e bağlı değil: gizli sekmede
       ayrıca durdurulur, görününce sürer */
    document.addEventListener('visibilitychange', () => {
      if (!cur || !cur.el) return;
      if (document.hidden) cur.el.pause();
      else if (on) cur.el.play().catch(() => {});
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
      FILES: MUSIC_FILES,   // denetim SA-12 — test kancası (dosyalı parça yolunu test sırasında yazmak için)
      /* P71c — Ritim mini oyunu: müziği kıs / geri aç */
      duck(onDuck) { duckK = onDuck ? .35 : 1; applyLevel(); },
      /* Lanetli Çocuk — faz katmanı (1-3) */
      setLayer(n) { layer = Math.max(1, Math.min(3, n | 0 || 1)); },
      get layer() { return layer; },
      /* Nihai Feda — zaman durur: müzik kesilir, tek müzik kutusu notası; freeze(false) geri açar */
      freeze(onF) {
        freezeK = onF ? 0 : 1; applyLevel();
        if (!onF || !on || !actx) return;
        try {
          const g = actx.createGain();
          g.gain.value = Math.pow(Math.max(0, Math.min(100, vol)) / 100, 1.5) * 0.6;
          g.connect(actx.destination);
          tone(g, actx.currentTime + .05, hz('A5'), 2.4, INST.mbox);
          tone(g, actx.currentTime + .05, hz('Bb5'), 2.4, INST.mbox);
          setTimeout(() => g.disconnect(), 3200);
        } catch (e) { /* ses yok */ }
      },
      get frozen() { return freezeK === 0; },
      get ducked() { return duckK < 1; },
      get levelNow() { return level(); },   // denetim S-2 — test kancası (duraklatta yarıya iner)
      /* P71c — çevrimdışı ölçüm: parçayı OfflineAudioContext'e çizip RMS / tepe
         döndürür (ses seviyesi dengesi testi). Canlı çalımla aynı playStep. */
      async analyze(name, secs = 12, raw = false) {   // raw: önizleme kaydı için örnekler de döner
        const T = TRACKS[name];
        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!T || !OAC) return null;
        const sr = 22050, off = new OAC(1, Math.round(sr * secs), sr);
        const keepCtx = actx, keepNoise = noise;
        actx = off;
        noise = off.createBuffer(1, Math.round(sr * .3), sr);
        const nd = noise.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const out = off.createGain();
        out.gain.value = T.gain || 1;
        out.connect(off.destination);
        try {
          const P = prep(T);
          for (let step = 0, at = .02; at < secs; step++, at += P.stepDur) playStep(P, out, step, at);
        } finally { actx = keepCtx; noise = keepNoise; }
        const buf = await off.startRendering();
        const d = buf.getChannelData(0);
        let sum = 0, peak = 0;
        for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); }
        return { rms: Math.sqrt(sum / d.length), peak, data: raw ? Array.from(d) : undefined };
      },
      force(name) { force = hasTrack(name) ? name : null; unlock(); sync(); },   // denetim SA-12: dosyalı parça da
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

  /* kullanıcı 2026-10-25 — Lady Luck çaldığı taşı yazıyla değil, göz önünde alır: taş ıstakadaki
     yerinde pembe parlar, havalanır, Lady Luck'ın dudaklarına uçup küçülür; orada bir öpücük patlar. */
  const LADY_LIPS = { x: 987, y: 263 };   // boss arka planındaki dudaklar (1920×1080 sahne koordinatı)
  function ladyStealAnim(f) {
    const stage = document.querySelector('#gameScreen .gm-stage');
    if (!stage) return;
    const st = stage.getBoundingClientRect();
    const k = st.width / 1920 || 1;
    const cell = f.slot != null ? document.querySelector(`#gameScreen .rack [data-slot="${f.slot}"], #rackArea [data-slot="${f.slot}"]`) : null;
    const src = (cell || document.getElementById('rackArea') || stage).getBoundingClientRect();
    const sx = (src.left + src.width / 2 - st.left) / k, sy = (src.top + src.height / 2 - st.top) / k;
    const fly = tileEl({ id: -77, color: f.color, number: f.number }, false);
    fly.classList.add('ll-fly');
    fly.style.left = `${sx - 40}px`; fly.style.top = `${sy - 55}px`;
    stage.appendChild(fly);
    const dx = LADY_LIPS.x - sx, dy = LADY_LIPS.y - sy;
    const anim = fly.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
      { transform: 'translate(0, -46px) scale(1.18) rotate(-4deg)', opacity: 1, offset: 0.28 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(.8) rotate(10deg)`, opacity: 1, offset: 0.62 },
      { transform: `translate(${dx}px, ${dy}px) scale(.16) rotate(24deg)`, opacity: 0.2, offset: 1 },
    ], { duration: 1500, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' });
    SFX.tick?.();
    anim.onfinish = () => {
      fly.remove();
      const kiss = document.createElement('div');
      kiss.className = 'll-kiss';
      kiss.textContent = '💋';
      kiss.style.left = `${LADY_LIPS.x}px`; kiss.style.top = `${LADY_LIPS.y}px`;
      stage.appendChild(kiss);
      SFX.crack();
      setTimeout(() => kiss.remove(), 1100);
    };
  }

  function showCheatFlash(f) {
    if (f.kind === 'ladySteal') { ladyStealAnim(f); return; }
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
    } else if (f.kind === 'ladySteal') {
      title = t('ladyStealTitle');
      body = t('cheatBossStealHand', T.color(f.color), f.number);
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
    /* P103 (kullanıcı isteği 2026-10-15) — STAGE / OKEY İLANI: ana menüdeki Mühür
       (oyun sonu panelindeki gibi, kazanılmış final eşyalarıyla) + konuşma balonu;
       okey taşı soldaki OKEY kutusundakinin aynısı, kendiliğinden kapanana kadar
       azalan çubuk. Kimlik (#okeyBanner) aynı: testler ve kapatma kancaları değişmedi. */
    const ov = document.createElement('div');
    ov.id = 'okeyBanner';
    ov.className = 'pk-ov hint-ov mh-hint mh-okey';
    ov.innerHTML =
      `<div class="mh-wrap"><div class="ep-msc"><div class="ep-msc-in"><i class="ep-msc-body"></i></div></div>` +
      `<div class="mh-col"><div class="mh-bub">` +
      `<div class="mh-tag">${Game.isFinalStage() ? t('stageFinal') : t('obTitle', s.stage, chCount())}</div>` +
      `<div class="hint-body">${t('obSub')}</div>` +
      `<div class="ob-okey"><div class="ob-tile"></div><div class="ob-name">${okeyLabel()}</div></div>` +
      `<div class="ob-bar"><i></i></div></div>` +
      `<div class="ob-skip">${t('obSkip')}</div></div></div>`;
    ov.querySelector('.ob-tile').appendChild(tileEl({ id: -1, color: s.okey.color, number: s.okey.number, isOkeyReal: true }, false));
    /* P122 · D — gösterge taşı arka yüzünden dönerek açılır */
    if (!fxOff()) {
      const ot = ov.querySelector('.ob-tile .tile'), K = fxK();
      if (ot) {
        const bk = document.createElement('i'); bk.className = 'tile-back-fx'; ot.appendChild(bk);
        const o = { duration: 620 * K, delay: 280 * K, fill: 'backwards', easing: 'ease-in-out' };
        ot.animate([{ transform: 'scale(1)' }, { transform: 'scaleX(.04) scaleY(1.08)', offset: .5 }, { transform: 'scale(1.12)', offset: .78 }, { transform: 'none' }], o);
        bk.animate([{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: .5 }, { opacity: 0 }], o).onfinish = () => bk.remove();
        setTimeout(() => { beep(880, .06, 'triangle', .06); beep(1320, .1, 'triangle', .05, .06); }, 590 * K);
      }
    }
    updateMascotItems();
    const inner = ov.querySelector('.ep-msc-in');
    document.querySelectorAll('.fm-mascot-item.on').forEach((im) => {
      const c = im.cloneNode(true);
      c.classList.remove('fm-mascot-item', 'on');
      c.classList.add('ep-msc-item');
      inner.appendChild(c);
    });
    ov.addEventListener('click', () => ov.remove());
    setTimeout(() => ov.remove(), 2800);
    document.body.appendChild(ov);
  }

  /* ---------- Ritim Jokeri mini oyunu (GDD 10) ---------- */

  /* P72 — RİTİM: DAVUL TEKRARI (kullanıcı seçimi 2026-10-06). Eski "kayan
     işaretçiyi tek tıkla durdur" mini oyunu ritimle ilgisizdi; artık oyun bir
     davul kalıbı çalar, oyuncu aynı ritmi Boşluk / Enter / tık ile tekrarlar.
     Süre oyuncunun İLK vuruşuyla başlar (acele yok); her vuruş beklenen anına
     göre ±tolerans içinde olmalı. Ödül/ceza motorda aynen (setRitimResult). */
  const RITIM_BEAT_MS = 600;   // 100 bpm
  const RITIM_TOL = [140, 115, 95];
  /* aralıklar vuruş (beat) cinsinden; her kalıp ölçü içinde müzikal */
  const RITIM_PATTERNS = [
    [[1, 1], [0.5, 0.5], [1, 0.5], [0.5, 1]],
    [[1, 0.5, 0.5], [0.5, 0.5, 1], [0.5, 1, 0.5], [1, 1, 0.5], [0.5, 0.5, 0.5]],
    [[1, 0.5, 0.5, 1], [0.5, 1, 0.5, 0.5], [1.5, 0.5, 1, 0.5], [0.5, 0.5, 1.5, 0.5], [1, 0.5, 1.5, 0.5]],
  ];
  /* kalıp → ilk vuruşa göre beklenen anlar (ms) */
  function ritimPattern(level, rnd = Math.random) {
    const set = RITIM_PATTERNS[Math.max(1, Math.min(3, level)) - 1];
    const gaps = set[Math.floor(rnd() * set.length)];
    const at = [0];
    for (const g of gaps) at.push(at[at.length - 1] + g * RITIM_BEAT_MS);
    return at;
  }
  /* vuruşları değerlendir: taps = oyuncunun anları (ilk vuruşa göre, ms) */
  function ritimJudge(expect, taps, tol) {
    const hits = expect.map((e, i) => {
      if (taps[i] == null) return { ok: false, miss: true, err: null };
      const err = Math.round(taps[i] - e);
      return { ok: Math.abs(err) <= tol, miss: false, err };
    });
    return { hits, success: hits.every(h => h.ok) };
  }
  const ritimDrum = (accent) => { beep(accent ? 150 : 120, .16, 'sine', .3); beep(1900, .025, 'square', .05); };
  const ritimTap = () => { beep(240, .1, 'triangle', .22); beep(2600, .02, 'square', .04); };

  function showRitim(level, cb, isBoss) {
    level = Math.max(1, Math.min(3, level || 1));
    const tol = RITIM_TOL[level - 1];
    const expect = ritimPattern(level);
    const span = expect[expect.length - 1] || 1;
    const ov = document.createElement('div');
    ov.id = 'ritimOv';
    ov.className = 'pk-ov tone-violet';
    ov.innerHTML =
      `<div class="pk-box rt-box2">` +
      `<div class="pk-title">🥁 ${t(isBoss ? 'ritimTitleBoss' : 'ritimTitle', level)}</div>` +
      `<div class="pk-sub-title">${t(isBoss ? 'ritimBodyBoss' : 'ritimBody', expect.length)}</div>` +
      `<button class="rt-pad" id="rtPad" type="button" aria-label="${t('ritimPad')}">🥁</button>` +
      `<div class="rt-lane">${expect.map((e, i) =>
        `<span class="rt-dot" data-i="${i}" style="left:${(4 + 92 * e / span).toFixed(1)}%"></span>`).join('')}</div>` +
      `<div class="rt-status" id="rtStatus">${t('ritimListen')}</div>` +
      `<div class="pk-foot"><button class="ep-btn" id="rtReplay" disabled>${t('ritimReplay')}</button></div>` +
      `</div>`;
    document.body.appendChild(ov);
    Music.duck(true);   // P71c — boss/joker müziği zamanlamayı şaşırtmasın
    const pad = ov.querySelector('#rtPad'), status = ov.querySelector('#rtStatus');
    const replayBtn = ov.querySelector('#rtReplay');
    const dots = [...ov.querySelectorAll('.rt-dot')];
    let phase = 'listen', taps = [], t0 = 0, timers = [], replayUsed = false, done = false;
    const later = (fn, ms) => { const h = setTimeout(fn, ms); timers.push(h); return h; };
    const flash = () => { pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };

    function play() {
      phase = 'listen';
      replayBtn.disabled = true;
      status.textContent = t('ritimListen');
      dots.forEach(d => d.classList.remove('lit', 'ok', 'bad'));
      expect.forEach((e, i) => later(() => {
        if (done) return;
        ritimDrum(i === 0); flash(); dots[i].classList.add('lit');
      }, 450 + e));
      later(() => {
        if (done) return;
        phase = 'play';
        dots.forEach(d => d.classList.remove('lit'));
        status.textContent = t('ritimYourTurn');
        replayBtn.disabled = replayUsed;
      }, 450 + span + 350);
    }

    function finish(success, msg) {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', onKey, true);
      status.textContent = msg || (success ? t('ritimWinShort') : t('ritimLoseShort'));
      status.classList.add(success ? 'win' : 'lose');
      setTimeout(() => { ov.remove(); Music.duck(false); cb(success); }, 1100);
    }
    ov.__finish = (success) => finish(!!success);   // test kancası
    ov.__expect = expect;                              // test: beklenen vuruş anları (ms)

    function judgeAndFinish() {
      const j = ritimJudge(expect, taps, tol);
      const bad = j.hits.findIndex(h => !h.ok);
      let msg;
      if (j.success) msg = t('ritimWinShort');
      else if (j.hits[bad].miss) msg = t('ritimMissed', bad + 1);
      else msg = t(j.hits[bad].err < 0 ? 'ritimEarly' : 'ritimLate', bad + 1, (Math.abs(j.hits[bad].err) / 1000).toFixed(2));
      finish(j.success, msg);
    }

    function hit() {
      if (done || phase !== 'play') return;
      const now = performance.now();
      if (!taps.length) { t0 = now; replayBtn.disabled = true; }
      const at = now - t0;
      const i = taps.length;
      taps.push(at);
      ritimTap(); flash();
      const ok = Math.abs(at - expect[i]) <= tol;
      dots[i].classList.add(ok ? 'ok' : 'bad');
      if (taps.length >= expect.length) { phase = 'over'; later(judgeAndFinish, 250); return; }
      /* sıradaki vuruş hiç gelmezse kaçırılmış say */
      timers.forEach(clearTimeout); timers = [];
      later(() => { if (phase === 'play') { phase = 'over'; judgeAndFinish(); } }, expect[i + 1] - at + tol + 500);
    }
    function onKey(e) {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); hit(); }
    }
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(); });
    document.addEventListener('keydown', onKey, true);
    replayBtn.addEventListener('click', () => {
      if (replayUsed || taps.length || phase !== 'play') return;
      replayUsed = true; play();
    });
    play();
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
  function maybeCoinFlip(after) {
    if (!Game.takeKumarbazFlip) { if (after) after(); return false; }
    const f = Game.takeKumarbazFlip();
    if (f) { SFX.tick(); showCoinFlip(f.roll, after || null, !!f.edge); return true; }
    if (after) after();
    return false;
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
      /* P91 — ikon yerine varyant kartının Figma çizimi (468:2/58/133) */
      (info.variant ? `<div class="pd-art jk-truva pd-${info.variant}"></div>` : `<div class="pd-icon">${info.icon}</div>`) +
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
    /* P105 (kullanıcı: "pop-up sorunlu görünüyor") — eski .tp-box düğme yığını (farklı genişlik ve
       tarzlar) yerine satın alma penceresiyle aynı pk-ov kalıbı: üç eşit seçenek kartı (ad · ne olur),
       kapalı seçenek gerekçesiyle sönük, altta "Şimdi değil". Kimlikler (fzm*) aynı. */
    ov.className = 'pk-ov tone-violet';
    const opt = (id, name, desc, on, cls = '') =>
      `<button class="pk-card fzm-opt${cls}" id="${id}"${on ? '' : ' disabled'}><div class="pk-name">${name}</div><div class="pk-desc">${desc}</div></button>`;
    ov.innerHTML =
      `<div class="pk-box"><div class="pk-title">${t('fzTitle')}</div>` +
      `<div class="pk-sub-title">${t('fzMenuBody')}</div>` +
      `<div class="pk-body pk-choice">` +
        opt('fzmUse', t('fzMenuUse'), d.fuse ? t('fzUseDesc') : t('fzNeed'), d.fuse, ' fzm-use') +
        opt('fzmMain', t('fzMenuMain'), d.main ? t('fzMainDesc') : t('bdFull'), d.main) +
        opt('fzmBackup', t('fzMenuBackup'), d.backup ? t('fzBackupDesc') : t('bdFull'), d.backup) +
      `</div>` +
      `<div class="pk-foot"><button class="btn ghost" id="fzmLater">${t('fzLater')}</button></div></div>`;
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
      /* P91 — Füzyonlu kart seçicide de FÜZYON KARTI olarak görünür
         (çizim + "Füzyon"); ipucu içindeki jokerleri listeler. Seçilirse
         yeni joker aynı kartın altına eklenir. */
      const isFz = (j.fused || []).length > 0;
      const artK = isFz ? 'fuzyon' : j.key;
      const fzArt = JOKER_ART.has(artK);
      b.innerHTML = `<div class="fz-card${fzArt ? ' fz-art jk-' + artK : ''}${!isFz && j.key === 'truva' && j.pandora ? ' pd-' + j.pandora : ''}">${fzArt ? '' : jokerIcon(artK)}</div>`
        + `<b>${isFz ? '⚗ ' + T.name(JOKER_DEFS.fuzyon) : T.name(j)}</b><span>${Game.isRunLong(j) ? t('tipUsesRun') : t('fzRounds', j.usesLeft)}`
        + (inBackup ? ` · ${t('fzInBackup')}` : '') + `</span>`;
      attachTip(b, isFz ? j : { name: T.name(j), desc: T.desc(j), accent: j.rarity, rarityText: T.rarity(j.rarity), key: j.key }, {});
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
  /* kullanıcı 2026-10-29 ("direkt o taşları görelim, yanlarında konulabilecek yerde boşluk olsun, seçelim") —
     sıranın taşları gerçek görünümüyle dizilir; okeyin oturabileceği uçlarda kesikli boş yer durur, tıklanınca oraya oturur. */
  function pickOkeySlot(choices, cb, info) {
    const ov = document.createElement('div');
    ov.id = 'okeySlotPick';
    ov.innerHTML =
      `<div class="tp-box"><h3>${t('okeySlotTitle')}</h3>` +
      `<p>${t('okeySlotBody')}</p><div class="tp-row okey-seq"></div>` +
      `<button class="btn ghost" id="osCancel">${t('fzCancel')}</button></div>`;
    const row = ov.querySelector('.tp-row');
    if (info && info.fixed && info.color) {
      const lo = Math.min(...choices.map((c) => c.start)), hi = Math.max(...choices.map((c) => c.start + info.len - 1));
      for (let n = lo; n <= hi; n++) {
        if (info.fixed.includes(n)) { row.appendChild(tileEl({ id: -7000 - n, color: info.color, number: n }, false)); continue; }
        const ch = choices.find((c) => (c.miss || []).includes(n));
        const slot = document.createElement('button');
        slot.className = 'okey-gap';
        slot.title = ch ? ch.label : '';
        slot.innerHTML = `<span>+</span>`;
        if (ch) slot.addEventListener('click', () => { ov.remove(); cb(ch.start); });
        else slot.disabled = true;
        row.appendChild(slot);
      }
    } else {
      choices.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'tp-color okey-slot-opt';
        b.textContent = ch.label;
        b.addEventListener('click', () => { ov.remove(); cb(ch.start); });
        row.appendChild(b);
      });
    }
    ov.querySelector('#osCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  /* Raund başı akışı tek noktadan: bildirimler + tetiklenen pop-up'lar.
     (Grup A) Şeytan'ın feda anı ve Tüccar'ın takas teklifi artık bildirim
     satırı değil, gerçek modal olarak önüne gelir. */
  function flushRoundStart() {
    const s = Game.state;
    notify(s.roundStartNotes);
    /* P109 — Kağıt sessiz çalışıyordu: okeye dönen taş parlar + kısa yazı */
    if (s.kagitShow) {
      const k = s.kagitShow; s.kagitShow = null;
      for (const id of k.ids) newTileIds.add(id);
      if (k.faces.length) setTimeout(() => toast(t('kagitToast', k.faces.join(', ')), true), 700);
      render();
    }
    cheatFlash();   // Grup G (P19) — raundun ilk turundaki hile de duyurulsun
    s.roundStartNotes = [];
    if (s.seytanPending) { showSeytanPop(s.seytanPending); s.seytanPending = null; }
    /* Grup F: Boşluk artık sessiz çalışmıyor — ne yuttuğunu ve ne
       kazandırdığını gösteren bir pop-up açar. */
    if (s.voidPending) { showVoidPop(s.voidPending); s.voidPending = null; }
    // Grup F/22 — raundun ilk turunun yazı-turası, teklif pop-up'ından ÖNCE
    /* denetim3 #19 (kullanıcı: "Tüccar + Kumarbaz elimdeyken pop-up'lar çakışıyor, yazı-turayı göremiyorum") —
       Tüccar teklifi yazı-tura KAPANINCA açılır (eskiden 620 ms sonra yazı-turanın üstüne biniyordu) */
    maybeCoinFlip(() => { if (Game.state.tuccarOffer) setTimeout(() => { if (Game.state.tuccarOffer) showTuccarOffer(); }, 250); });
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
    SFX.wand();   // P113
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
  /* LANETLİ BOYUT — Kukla Ustası: bu raund hangi joker ×3 (o joker 2 raund yaşlanır) */
  function showKuklaPick() {
    const s = Game.state;
    const all = s.jokers.filter((j) => j.key !== 'kuklaUstasi');
    if (!all.length) { toast(t('consumNoJoker')); return; }
    const ov = document.createElement('div');
    ov.id = 'terziPick';
    ov.innerHTML = `<div class="tp-box"><h3>🎭 ${T.name({ key: 'kuklaUstasi', name: JOKER_DEFS.kuklaUstasi.name })}</h3>`
      + `<p>${t('kuklaPickSub')}</p><div class="tp-row" style="flex-wrap:wrap"></div>`
      + `<div class="tr-row"><button class="btn ghost" id="cjCancel">${t('cancel')}</button></div></div>`;
    const row = ov.querySelector('.tp-row');
    for (const j of all) {
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = `${T.name(j)} (${Game.isRunLong(j) ? '∞' : j.usesLeft})`;
      b.addEventListener('click', () => {
        ov.remove();
        const r = Game.kuklaSet(j.id);
        if (!r.ok) { toast(r.error, false); return; }
        render();
      });
      row.appendChild(b);
    }
    ov.querySelector('#cjCancel').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }
  /* Kan Sözleşmesi: iki imza */
  function showPactPick(index, def) {
    const ov = document.createElement('div');
    ov.id = 'pactOv';
    ov.className = 'pk-ov tone-violet altar-ov';
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🩸 ${T.consumName(def.key, def.name)}</div>`
      + `<div class="pk-sub-title">${t('pactSub')}</div><div class="pk-body pk-choice">`
      + `<button class="pk-card altar-card" data-c="easy"><div class="ac-tag">${t('pactEasy')}</div><div class="ac-cost">${t('pactEasyDesc')}</div></button>`
      + `<button class="pk-card altar-card ac-perm" data-c="hard"><div class="ac-tag">${t('pactHard')}</div><div class="ac-cost">${t('pactHardDesc')}</div></button>`
      + `</div><div class="pk-foot"><button class="ep-btn ep-blue altar-close">${t('cancel')}</button></div></div>`;
    ov.querySelectorAll('[data-c]').forEach((c) => c.addEventListener('click', () => {
      ov.remove();
      finishConsum(Game.useConsumable(index, { choice: c.dataset.c }));
    }));
    ov.querySelector('.altar-close').addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }
  /* Nöbetçi (totem): ilk raund nöbetçi taşı seçilir */
  function showNobetciPick() {
    if (!Game.nobetciNeeds || !Game.nobetciNeeds() || document.getElementById('nobetciOv') || document.querySelector('.pk-ov')) return;
    const ov = document.createElement('div');
    ov.id = 'nobetciOv';
    ov.className = 'pk-ov tone-violet altar-ov';
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🗿 ${TOTEM_DEFS.nobetci.name}</div>`
      + `<div class="pk-sub-title">${t('nobetciSub')}</div><div class="pk-body nobetci-row"></div></div>`;
    const row = ov.querySelector('.pk-body');
    for (const tile of Game.state.hand) {
      if (tile.jokerTile || Game.isOkeyTile(tile)) continue;
      const el2 = tileEl(tile, false);
      el2.addEventListener('click', () => {
        const r = Game.nobetciSet(tile.id);
        if (!r.ok) { toast(r.error, false); return; }
        ov.remove(); render();
      });
      row.appendChild(el2);
    }
    document.body.appendChild(ov);
  }

  function pickConsumJoker(index, def) {
    const s = Game.state;
    /* Klon Şişesi yalnız ANA SLOT jokerini kopyalayabilir; Zaman Kumu ise
       süresi olan her jokeri uzatır ("run boyunca" yaşayanlar hariç). */
    const all = def.key === 'klonSisesi' || def.key === 'ruhAynasi'
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
    /* LANETLİ BOYUT — çizimi gelmemiş lanetli değnek: yazısız, çizimli değnek kalıbında simgeyle (ad/açıklama ipucunda) */
    const glyph = !art && def.cursed;
    if (glyph) d.classList.add('art-only', 'cs-glyph');
    /* P41 (kullanıcı isteği 2026-09-14) — SOL TIK KULLAN, SAĞ TIK SAT.
       Çizimli değnek kartının içinde yazı/düğme yok; eylemler üstüne gelince
       açılan ortak rozette (#actBadge, bkz. attachActs) yazar. Satış yalnız
       store rafında (opts.sell) — kullanıcı kararı: raund içinde satış yok. */
    d.innerHTML = glyph ? `<span class="c-icon cs-art cs-emoji">${def.icon}</span>` : art
      ? `<span class="c-icon cs-art cs-${key}"></span>`
      : `<span class="c-icon">${def.icon}</span>` +
        `<div class="c-body"><b>${T.consumName(key, def.name)}</b><span>${T.consumDesc(key, def.desc)}</span></div>`;
    const useIt = () => {
      if (consumPick && consumPick.index === index) { consumPick = null; render(); return; }
      if (def.target === 'joker') { pickConsumJoker(index, def); return; }
      if (def.target === 'pact') { showPactPick(index, def); return; }
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
      const c0 = Game.state.coins;
      const res = Game.sellConsumable(index);
      if (!res.ok) { toast(res.error || t('sellConsumFail')); return; }
      sellPoof(d, res.gain, c0);   // P122
      toast(t('sellToast', T.consumName(res.key, res.name), res.gain), true);
      SFX.sell(); renderStore(); render();
    };
    /* P47 (kullanıcı isteği 2026-09-14): değnek de RAUND İÇİNDE sağ tıkla satılır
       (P41'de yalnız store rafındaydı; jokerler P46'da açılmıştı). */
    if (art || glyph) attachActs(d, () => ({
      left: { lbl: t(picking ? 'abCancel' : 'abUse'), fn: useIt },
      right: { lbl: t('abSell', Game.consumSellPrice(key)), fn: sellIt },
    }));
    const hint = art || glyph
      ? ` — ${t(picking ? 'consumLeftCancel' : 'consumLeftUse')} · ${t('consumRightSell')}`
      : '';
    attachTip(d, { name: T.consumName(key, def.name),
      rarityText: `${T.rarity(def.rarity || 'common')} · ${t('consumTag')}`,
      accent: def.rarity || 'common',
      desc: T.consumDesc(key, def.desc) + hint }, {});
    if (!art && !glyph) {
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

  /* kullanıcı 2026-10-25 — ÜST SİMGE ROZETLERİ (#kahinChip kabı; kimlik testler için aynı). Her rozet:
     simge + köşede mark + gizli yazı (ipucu). Yazı/mark değişince ya da rozet yeni gelince kısa parıltı. */
  const kbSeen = new Map();
  function renderInfoBadges(items) {
    const box = el.kahinChip;
    box.classList.toggle('hidden', !items.length);
    box.classList.remove('done');
    box.innerHTML = '';
    const keep = new Set();
    for (const it of items) {
      const k = it.k || it.ico;
      keep.add(k);
      const sig = `${it.ico}|${it.mark ?? ''}|${it.txt}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `kb kb-${k}` + (it.mark === '✓' ? ' ok' : it.mark === '✗' ? ' fail' : '') + (it.cheat ? ' kb-act' : '');
      b.dataset.k = k;
      b.innerHTML = `<span class="kb-ico">${it.ico}</span>`
        + (it.mark !== undefined && it.mark !== '' ? `<span class="kb-mark">${it.mark}</span>` : '')
        + `<span class="kb-txt">${it.txt}</span>`;
      if (kbSeen.get(k) !== sig) { b.classList.add('kb-pulse'); kbSeen.set(k, sig); }
      const tip = { name: it.title || '', desc: it.txt, accent: 'rare' };
      attachTip(b, tip, { belowOf: box });
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (k === 'zar' && Game.canZarCheat()) { hideTip(); showZarCheat(); return; }
        showTip(b, tip, { belowOf: box });   // dokunmatik ekranda üstüne gelme yok: dokununca ipucu
      });
      box.appendChild(b);
    }
    for (const k of [...kbSeen.keys()]) if (!keep.has(k)) kbSeen.delete(k);
  }

  /* kullanıcı 2026-10-25 — boss'un tur tur değişen bilgileri artık ÜST ROZETLER (renderInfoBadges).
     Her not { k, ico, txt, mark }: simge rozette, yazı ipucunda, mark (sayı / ✓ / ✗) rozetin köşesinde.
     Avukat'ın susturduğu joker kartında SUSTURULDU plakasıyla, Lady Luck'ın büyüsü kartta ve çaldığı
     taş animasyonla görünür — tekrar yazılmaz. */
  function bossTurnNotes(s) {
    if (!s || !s.boss || s.bossVoided || !(Game.bossOn && Game.bossOn())) return [];
    const n = [];
    const k = s.boss.key;
    if (k === 'kelebek' && s.bossBan) n.push({ k: 'kelebek', ico: '🦋', txt: t('bossBanExtra', T.typeName(s.bossBan)) });
    if (k === 'aynaKral' && (s.bossMirrorDebt || 0) > 0) n.push({ k: 'ayna', ico: '🪞', txt: t('bossMirrorExtra', s.bossMirrorDebt), mark: s.bossMirrorDebt });
    if (k === 'corporates' && s.corpTask)
      /* P81 — canlı ilerleme: "en iyi tur 1/3 · toplam 2/6" */
      n.push({ k: 'corpBoss', ico: '🏢', mark: s.corpTask.failed ? '✗' : (s.corpTask.done ? '✓' : ''),
        txt: `${T.ev(s.corpTask.name)}: ${T.ev(s.corpTask.text)}${s.corpTask.failed ? ' — ' + t('bossTaskFailed')
          : (s.corpTask.boss && Game.corpProgress ? ' · ' + T.ev(Game.corpProgress()) : '')}` });
    if (k === 'freedom' && (s.bossFreedomMarks || []).length) {
      const owed = [...s.hand, ...s.discardPile].filter(x => x.ffMarkedTile && !x.ffUsedInMeld).length;
      n.push({ k: 'freedom', ico: '🗽', mark: owed, txt: t('bossFreedomExtra', s.bossFreedomMarks.map(m => `${T.color(m.color)} ${m.number}`).join(', '), owed) });
    }
    /* Grup H — Sinsi Bulaşma: hangi taşların uzaylı olduğu GİZLİ, kaç tane olduğu canlı görünür */
    if (k === 'uzayli') { const c = s.hand.filter(x => x.hiddenAlien).length; n.push({ k: 'uzayli', ico: '👽', mark: c, txt: t('bossAlienExtra', c) }); }
    if (k === 'lanetliCocuk' && Game.cocukState) {
      const c = Game.cocukState();
      if (c) {
        n.push({ k: 'cocukFaz', ico: '🧸', mark: c.phase, title: t('cocukPhaseTitle', c.phase), txt: t('cocukPhase' + c.phase, c.lockAt) });
        if (c.fog) n.push({ k: 'cocukFog', ico: '👓', mark: c.triesLeft, title: t('cocukFogTitle'), txt: t('cocukFogTxt', c.triesLeft) });
      }
    }
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
    /* P110 — her karar / bakış penceresi açıkken saat DURUR (Ayarlar, deste görünümü, Kumarbaz
       yazı-turası, teklif pencereleri, ipucu, koleksiyon…) */
    if (document.querySelector(CLOCK_PAUSERS)) return;
    const before = s.clockLeft;
    Game.clockTick(1);
    if (s.clockLeft === before) return;
    renderChessClock();
    /* bonus her saniye değişir: açılım hazırlanıyorsa önizleme kutusu da güncellensin */
    if (s.staged.length || s.islemeler.length) render();
  }, 1000);

  /* LANETLİ BOYUT — Lanet Seviyesi göstergesi (sol sütun, STAGE/RAUND altında) */
  function renderCurse() {
    const on = !!(Game.lanetliOn && Game.lanetliOn() && Game.state);
    for (const sel of ['#gameScreen .gm-left', '#storeSide']) {   // kullanıcı 2026-10-29: store'da da görünsün
      const col = document.querySelector(sel);
      if (!col) continue;
      let m = col.querySelector('.curse-meter');
      if (!on) { m?.remove(); continue; }
      if (!m) { m = document.createElement('div'); m.className = 'curse-meter'; col.appendChild(m); }
      const s = Game.state, lv = Game.curseLevel(), carried = Game.curseCarried(), stored = s.curseStored || 0;
      const sig = `${lv}|${s.stagePath}`;
      if (m.dataset.sig === sig) continue;
      m.dataset.sig = sig;
      let pips = '';
      for (let i = 0; i < CURSE.max; i++) pips += `<i class="${i < lv ? 'on' : ''}"></i>`;
      m.innerHTML = `<div class="cm-head"><span>${t('curseLbl')}</span><b>${lv}/${CURSE.max}</b></div><div class="cm-pips">${pips}</div>`
        + (s.stagePath === 'cursed' ? `<div class="cm-path">${t('cursePathOn')}</div>` : '');
      attachTip(m, { name: t('curseLbl') + ' ' + lv, desc: t('curseTip', Math.round(lv * CURSE.targetPer * 100), stored, carried) }, {});
    }
  }
  /* LANETLİ BOYUT — stage başında Güvenli / Lanetli yol (S2'den itibaren) */
  function showPathPick() {
    if (!Game.needsPath || !Game.needsPath() || document.getElementById('pathOv')) return;
    const s = Game.state, lv = Game.curseLevel();
    const raw = RUN_MODES.lanetli.targets[s.stage - 1][0];   // lanet ve yol etkisi olmadan R1 hedefi
    const tSafe = Game.pathPreview('safe'), tCursed = Game.pathPreview('cursed');
    const pct = (v) => Math.round((v / raw - 1) * 100);
    const ov = document.createElement('div');
    ov.id = 'pathOv';
    ov.className = 'pk-ov tone-violet path-ov';
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🜏 ${t('pathTitle', s.stage)}</div>`
      + `<div class="pk-sub-title">${t('pathSub', lv)}</div><div class="pk-body pk-choice">`
      + `<button class="pk-card path-card path-safe" data-p="safe"><div class="pk-ico">🛡</div><div class="pk-name">${t('pathSafe')}</div>`
      + `<div class="pk-desc">${t('pathSafeDesc', CURSE.safeCoin)}</div><div class="path-t">${t('pathTarget', tSafe, pct(tSafe))}</div></button>`
      + `<button class="pk-card path-card path-cursed" data-p="cursed"><div class="pk-ico">🜏</div><div class="pk-name">${t('pathCursed')}</div>`
      + `<div class="pk-desc">${t('pathCursedDesc')}</div><div class="path-t">${t('pathTarget', tCursed, pct(tCursed))}</div></button>`
      + `</div></div>`;
    ov.querySelectorAll('.path-card').forEach((c) => c.addEventListener('click', () => {
      const r = Game.choosePath(c.dataset.p);
      if (!r.ok) return;
      (c.dataset.p === 'cursed' ? SFX.crack : SFX.chips)();
      ov.remove();
      render();
    }));
    document.body.appendChild(ov);
  }

  /* LANETLİ BOYUT — ÇÜRÜYEN ÇERÇEVELER (taslak; kullanıcı 2026-10-28: "kenarlar, çerçeveler de bozulsa").
     Yalnız KENARLAR bozulur, içerik (yazı, taş, kart, sayı) hiç örtülmez. S1-2 temiz; S3-4 her panelde bir kopmuş
     köşe; S5-6 iki köşe + kenar yırtığı ve sızıntı. Önceden çizilmiş piksel sprite'lar (build_lanetli_rot.py),
     filtre yok (P84). Kısa glitch titremesi yalnız bu katmanda (CSS lbJit; hareket azaltmada kapalı). */
  const LB_ROT_SEL = ['.gm-left > *', '#pathMap', '#pathSide', '#mapCards .map-card.pm-focus', '.gm-jokers', '.gm-coin',
    '.st-shoulder', '#storeScene', '#actionBar'];
  function lbRot() {
    const root = document.documentElement;
    const dc = root.dataset.run === 'lanetli' ? +(root.dataset.lbDecay || 1) : 0;
    if (dc < 2) { document.querySelectorAll('.lb-rot').forEach((x) => x.remove()); return; }
    const scope = curScreen() === 'game' ? '#gameScreen' : '#mapScreen';
    const els = [];
    for (const sel of LB_ROT_SEL) {
      for (const sc of [scope, '#storeOverlay:not(.hidden)']) document.querySelectorAll(sc + ' ' + sel).forEach((e) => els.push(e));
    }
    els.forEach((e, i) => {
      const old = e.querySelector(':scope > .lb-rot');
      if (old && +old.dataset.dc === dc) return;
      old?.remove();
      if (getComputedStyle(e).position === 'static') e.style.position = 'relative';
      const h = (i * 7 + (e.id || e.className).length * 13) % 4;   // yerleşim her panel için sabit (yeniden çizimde zıplamaz)
      const o = document.createElement('div');
      o.className = 'lb-rot' + (e.offsetHeight < 140 || e.offsetWidth < 300 ? ' sm' : '');
      o.dataset.dc = dc;
      o.style.animationDelay = (-(h * 1.7 + i * .9)) + 's';
      /* kullanıcı: "daha belirgin olsun" → S3-4 bir köşe + bir yırtık, S5-6 üç köşe + iki yırtık.
         Küçük kutularda (etiket solda) yalnız SAĞ köşeler ve sağ yarıda kısa yırtık → yazı örtülmez. */
      /* üst köşeler başlık/sayaç taşır (DEĞNEK 0/2, LANET 5/10…) → yalnız ALT köşeler bozulur */
      const sm = e.offsetHeight < 140 || e.offsetWidth < 300;
      const cs = [2 + (h % 2), 3 - (h % 2)];
      let html = `<i class="rc rc-${cs[0]} v${(h + i) % 3 + 1}"></i>`;
      /* yırtıklar YAN kenarlarda (üst kenarda başlık/sayaç var) */
      if (!sm) html += `<i class="rt v${i % 2 + 1} ${h % 2 ? 'r' : 'l'}" style="top:${30 + (h * 17 + i * 11) % 30}%"></i>`;
      if (dc >= 3) {
        html += `<i class="rc rc-${cs[1]} v${(h + i + 1) % 3 + 1}"></i>`;
        if (!sm) html += `<i class="rt v${(i + 1) % 2 + 1} ${h % 2 ? 'l' : 'r'}" style="top:${20 + (h * 13 + i * 7) % 40}%"></i>`;
      }
      o.innerHTML = html;
      e.appendChild(o);
    });
  }

  function render() {
    setTimeout(lbRot, 30);
    renderTotems();
    if (curScreen() === 'game' && Game.nobetciNeeds && Game.nobetciNeeds()) setTimeout(showNobetciPick, 300);
    renderCurse();
    /* Yol seçimi artık harita şeridinde (renderPathMap); bekleyen seçim varken oyun ekranı haritaya döner */
    if (Game.needsPath && Game.needsPath() && curScreen() === 'game' && !document.querySelector('.pk-ov')) setTimeout(() => showScreen('map'), 0);
    if (Game.state && Game.state.ghostOffer && !document.getElementById('ghostOv'))
      setTimeout(showGhostOffer, 0);   // P100 — kayıttan dönülünce bekleyen Hayalet tur teklifi
    applyRunTheme();   // P78 — boss raundu arayüzü (raund ekran değişmeden başlayıp bitebilir)
    renderChessClock();   // P110
    scheduleRoundSave();   // denetim RK — raund ortası kayıt (her eylem render ile biter)
    if (curScreen() === 'map') setTimeout(() => { if (curScreen() === 'map') renderMap(); }, 0);   // P80 — haritadaki envanter tazelensin
    const s = Game.state;
    hideTip(); // hover'daki eleman yeniden çizimde kaybolabilir
    /* P54 · Grup A — Üç Kağıtçı'nın bekleyen seçimi (tur başında motor kurar).
       Hangi akıştan gelinirse gelinsin (raund başı, discard, kayıttan dönüş)
       pencere render üzerinden açılır; açıksa ikinci kez kurulmaz. */
    /* denetim LG-01 — yalnız raund ekranında: el haritada (raunda girmeden) dağıtılmış olur;
       haritadaki joker taşıma render()'ı pencereyi raund dışında açıyordu. Raunda girince
       showScreen('game') → render() bekleyen seçimi açar. */
    if (s && s.ucKagit && s.status === 'playing' && curScreen() === 'game' && !document.getElementById('ucKagitPop'))
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
    Disc.sync();     // P101: koleksiyon keşfi (trainer dahil)

    /* Figma düzeni (2026-08-23): çipte artık "Stage 1/8 · Raund 1" değil
       RAUND ADI (Açılış Masası / Usta Masası) — boss raundunda BOSS ADI —
       yazar; stage ve raund sayaçları kendi kutularında. */
    el.roundChip.textContent = Game.isBossRound()
      ? T.bossName(s.boss.key, s.boss.name)
      : roundName(s.roundInStage === 1 ? 1 : 2);
    el.stageVal.textContent = stageText(s);
    el.roundVal.textContent = roundText(s);
    fitStageVal(el.stageVal); fitStageVal(el.roundVal);
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
      /* P106 (kullanıcı: "kurallara gözüm gitmiyor") — boss raundu açılınca ve her yeni turun
         başında çerçevede birkaç tur ışık döner, sonra durur (P84: sürekli animasyon kasıyor). */
      const glowKey = `${s.stage}:${s.roundInStage}:${s.turn}:${s.boss.key}`;
      if (bossGlowKey !== glowKey) {
        bossGlowKey = glowKey;
        el.bossBanner.classList.remove('bb-glow');
        void el.bossBanner.offsetWidth;
        el.bossBanner.classList.add('bb-glow');
      }
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
    if (!seqLock) el.scoreNow.textContent = s.score;   // denetim CS-13 — puanlama sahnesi sayıyor
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
    const prevTiles = new Map();   // P120 — dönüşüm animasyonu: önceki çizimdeki taşlar (kimlik karşılaştırması)
    if (!fxOff()) el.rack.querySelectorAll('.tile[data-id]:not(.xf-old)').forEach((x) => prevTiles.set(x.dataset.id, x));
    el.rackRow1.innerHTML = '';
    el.rackRow2.innerHTML = '';
    /* GRUP J (P20) — SERBEST DÜZEN (yalnız Trainer): boş hücre çizilmez,
       taşlar yan yana sıkışık durur. Klasik düzen aşağıdaki `else` dalında
       birebir korunur. */
    el.rack.classList.toggle('rack-free', freeRack());
    renderWell();   // P59 · Öteki Dünya — Ay Kuyusu
    renderToyWell();   // Oyuncak Kutusu
    renderCocukFog();   // Lanetli Çocuk — Faz 1 sisi
    renderOrionPanel();   // P90 · Orion (final rakibi / eş)
    fitLeftColumn();      // P106 · sol sütun ıstaka sekmesine taşmasın
    maybeBeltPrompt();    // P90 · kemer boşsa sor
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
    runTileFx(prevTiles);   // P118 — dağıtma / çekiş / seçme · P120 — dönüşüm

    /* Figma 210:3627 - sayaç "87/108" biçiminde: KALAN / TOPLAM. Toplam,
       taşın bulunabileceği tüm yerler taranarak bulunur (desteden çıkmış
       taşlar da o raundun destesine aittir). */
    el.deckCount.textContent = `${s.deck.length}/${Game.totalTilesInPlay()}`;
    /* denetim3 #40 — 🃏 Kart Sayıcı: destenin yanında sıradaki 2 taş açık */
    const dpk = document.getElementById('deckPeek');
    if (dpk) {
      const nx = Game.deckPeek ? Game.deckPeek() : null;
      dpk.innerHTML = '';
      dpk.classList.toggle('hidden', !(nx && nx.length));
      if (nx && nx.length) {
        dpk.innerHTML = `<span class="dp-lbl">${t('deckPeekLbl')}</span>`;
        for (const tl of nx) { const te = tileEl(tl, false); te.classList.add('dp-tile'); dpk.appendChild(te); }
      }
    }
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
      box.className = 'combo isleme-target' + (c.gumClosed ? ' gum-closed' : '') + (c.owner === 'orion' ? ' orion-combo' : '');   // P90
      const tilesDiv = document.createElement('div');
      tilesDiv.className = 'combo-tiles';
      /* P103 — işlenen taş grubun SONUNA değil dizideki yerine girer (8 9 10 + 7 → 7 8 9 10);
         okeyin yerini çözmek için BİRLEŞİK kombinasyon (değerleriyle) gerekir */
      const lay = Game.islemeLayout(i);
      const mergedC = { type: c.type, values: lay.values, tiles: lay.tiles };
      lay.tiles.forEach(t2 => {
        const td = comboTileEl(t2, lay.added.size ? mergedC : c);
        if (lay.added.has(t2.id)) td.classList.add('isleme-tile');
        tilesDiv.appendChild(td);
      });
      const tag = document.createElement('div');
      tag.className = 'combo-tag';
      tag.textContent = `${c.owner === 'orion' ? '🎩 ORION · ' : ''}${T.typeName(c.type)} · ${t(c.gumClosed ? 'gumClosedTag' : 'islenebilir')}`;   // P90
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
            if (res.needChoice) { pickOkeySlot(res.choices, (st) => doAdd(st), res); return; }
            if (!res.ok) { nope(res.error, btn); return; }   // denetim3 #8
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
    /* P100 — eski Borsa piyasa çipi kalktı (Boğa piyasası durumu kart ipucunda yazar). */
    el.borsaChip.classList.add('hidden');

    /* PLAYTEST 20 · GRUP B/1 — sınır artık ÜST ŞERİTTEKİ çipte.
       Joker ve BOSS varyantı aynı çipi kullanır (eskiden boss varyantı
       ayrıca boss banner'ında yazıyordu; iki ayrı yerde iki ayrı biçimde
       görünüyordu). Çip kompakttır, tam açıklama tooltip'te durur. */
    {
      const show = false;   // kullanıcı 2026-10-25 — Fatality sınırı artık üst rozet (renderInfoBadges)
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
      /* P61 — yan bahis ve Rulet rengi de bahis satırının altında */
      const sideLine = s.status === 'playing' && s.sideBet ? s.sideBet : null;
      const ruletLine = s.status === 'playing' && s.ruletColor && Game.hasActive('rulet') ? s.ruletColor : null;
      if (!s.sideOffer) document.getElementById('sideOv')?.remove();
      if (s.status !== 'playing' || (s.ruletColor && document.getElementById('ruletOv'))) document.getElementById('ruletOv')?.remove();
      /* kullanıcı 2026-10-25 ("tepedeki bildiriler boss tasarımını kaplıyor") — üst ortadaki yazı kutusu
         yerine TUR kutularının altında küçük SİMGE ROZETLERİ: yazı üstüne gelince / dokununca ipucunda.
         Bahis satırı kalktı (hedef Raund Puan'da yazıyor, bahsi oyuncu seçti). Durum değişince rozet parlar. */
      const items = [];
      if (g || bo) {
        const done = g ? !!g.done : !!bo.met;
        const reward = g ? ` → +${g.amount} ${g.reward === 'coin' ? t('kahinCoin') : t('kahinPts')}` : '';
        items.push({ k: 'kahin', ico: '🔮', title: t('kbKahin'), mark: done ? '✓' : '',
          txt: t('kahinChip', T.goal(g ? g.text : bo.text) + reward) });   // denetim UI-07 — EN çevirisi
      }
      /* Bungie Gum: sakızda bekleyen taş sayısı / bu tur koptu (kart temiz kalsın diye üst rozet — kullanıcı 2026-10-25) */
      if (s.status === 'playing' && Game.slotRecs().some(r => r.key === 'bungieGum')) {
        const n = (s.bungiePending || []).length;
        const snap = !n && s.bungieSnap && s.bungieSnap.turn === s.turn;
        if (n || snap) items.push({ k: 'gum', ico: '🍬', title: T.name({ key: 'bungieGum', name: JOKER_DEFS.bungieGum.name }),
          mark: n || '✗', txt: n ? t('bungieChipPending', n) : t('bungieChipSnap', s.bungieSnap.n) });
      }
      if (sideLine) items.push({ k: 'side', ico: '🎟', title: t('kbSide'), txt: t('sideChip', T.ev(SIDE_NAME(sideLine.key)), sideLine.odds) });
      if (ruletLine) items.push({ k: 'rulet', ico: ruletLine === 'red' ? '🔴' : '⚫', title: T.name({ key: 'rulet', name: JOKER_DEFS.rulet.name }),
        txt: t('ruletChip', ruletLine === 'red' ? '🔴 ' + t('cRed') : '⚫ ' + t('cBlack')) });
      /* Hileli Zar: köşede bu turun zarı; hile hakkı varken rozet parlar, tıklayınca seçici (karta sol tık da olur) */
      if (s.status === 'playing' && s.zarFace && Game.hasActive('hileliZar'))
        items.push({ k: 'zar', ico: '🎲', title: T.name({ key: 'hileliZar', name: JOKER_DEFS.hileliZar.name }), mark: s.zarFace,
          cheat: Game.canZarCheat(), txt: t('zarChip', s.zarFace, Game.hileliZarBonus().toFixed(2)) + (Game.canZarCheat() ? '<br>' + t('kbZarCheat') : '') });
      if (corpLine) items.push({ k: 'corp', ico: '🏢', title: T.name({ key: 'corporates', name: JOKER_DEFS.corporates.name }),
        mark: corpLine.done ? '✓' : corpLine.failed ? '✗' : '', txt: t('corpChip', T.ev(corpLine.name), T.ev(corpLine.text), T.ev(corpLine.rewardText)) });
      if (s.fatalityLimit && meldPhase && s.status === 'playing')
        items.push({ k: 'fatality', ico: '☠', title: T.bossName('fatality', 'Fatality'), mark: s.fatalityHit ? '✓' : '',
          txt: t('fatalityTip', s.fatalityLimit) + '<br>' + t('fatalityChip', s.fatalityLimit) });
      for (const x of notes) items.push({ title: s.boss ? T.bossName(s.boss.key, s.boss.name) : '', ...x });
      if (s.mumArmed) items.push({ k: 'mum', ico: '🕯', title: JOKER_DEFS.karaMum.name, txt: t('mumChip') });
      if (s.doom === s.roundSerial) items.push({ k: 'doom', ico: '⏳', title: CONSUMABLES.kiyametSaati.name, mark: s.turn <= 2 ? '✗' : s.turn >= s.maxTurns ? '×3' : '', txt: t('doomChip') });
      if (s.rehinRound === s.roundSerial) items.push({ k: 'rehin', ico: '💰', title: JOKER_DEFS.rehinci.name, txt: t('rehinChip') });
      if (s.puppet && s.puppet.round === s.roundSerial) { const pj = s.jokers.find((x) => x.id === s.puppet.id); if (pj) items.push({ k: 'kukla', ico: '🎭', title: JOKER_DEFS.kuklaUstasi.name, txt: t('kuklaChip', T.name(pj)) }); }
      if (s.mirror && s.mirror.round === s.roundSerial) { const mj = s.jokers.find((x) => x.id === s.mirror.id); if (mj) items.push({ k: 'mirror', ico: '🪞', title: CONSUMABLES.ruhAynasi.name, txt: t('mirrorChip', T.name(mj)) }); }
      if (s.mezarciMult) items.push({ k: 'mezarci', ico: '⚰', title: JOKER_DEFS.mezarci.name, txt: t('mezarciChip', s.mezarciMult.toFixed(1)) });
      if (Game.isSilent && Game.isSilent(s.stage, s.roundInStage))
        items.push({ k: 'silent', ico: '🔕', title: t('silentName'), mark: s.turn === 1 ? '' : '✗', txt: t('silentDesc') });
      renderInfoBadges(s.status === 'playing' ? items : []);
      renderChessClock();
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
    const pvFull = (tzPv || ptPv) ? null : Game.previewScore();
    /* P111 — Balatro gibi: çubuk jokersiz grup değerini gösterir; jokerler katkı verecekse yanında
       "+ jokerler" yazar, gerçek sonuç onaydan sonra puanlama sahnesinde ortaya çıkar */
    const pvBase = pvFull && Game.previewBase ? Game.previewBase() : null;
    /* Üçüncü Teker gibi KURAL açan joker (karışık Per + Çift) jokersiz hesapta kurulamaz: karışık
       açılımda çubuk iki tabloyu tam hesapla göstermeye devam eder */
    const mixedOnlyFull = !!(pvFull && pvFull.parts && pvFull.parts.length && !(pvBase && pvBase.parts && pvBase.parts.length));
    const pv = pvBase && !mixedOnlyFull ? { ...pvFull, ...pvBase, damgaBonus: 0 } : pvFull;
    /* kullanıcı: "+ jokerler" yazmasın — sistem öğreticide gösterilerek öğretilir (tip 'jokerPreview') */
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
      /* P103 (kullanıcı): ek "Yem Seç" düğmesi kalktı — yem jokere SOL TIKLA seçilir (jokerActs → doParatoner); düğme DOM'da gizli durur */
      el.btnParatoner.classList.add('hidden');
      el.btnParatoner.textContent = set ? t('paratonerClear') : t('paratonerBtn');
      el.btnParatoner.disabled = !set && !paratonerSel;
      el.btnParatoner.title = (set || paratonerSel) ? '' : t('paratonerNeedOne');
    }
    /* P100 — eski "Rüşvet" taş değiştirme düğmesi kalktı (Bahşiş Kavanozu artık kart tıkıyla kırılır). */
    el.btnRusvet.classList.add('hidden');
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
    setTimeout(maybeManualHint, 0);   // P93 — yeni elle kullanılan joker ipucu (çizim bitince kartı bulsun)
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
    /* denetim LG-02 — puanlama sahnesi (#scoreSeq) sürerken bekle: sahnenin sonundaki
       raund-sonu çağrısıyla yarışıp Game Over'ı iki kez kuruyor, kayıp raundu iki kez
       sayıyordu. Sahne bitince (kutu kalkınca) karar yeniden verilir. */
    const fire = () => {
      if (document.getElementById('scoreSeq')) { setTimeout(fire, 300); return; }
      autoFinishing = false;
      if (!Game.hopelessRound()) return;
      const res = Game.autoFinishHopeless();
      if (!res.ok) return;
      if (res.events && res.events.length) notify(res.events);
      render();
      if (res.roundOver) setTimeout(showRoundEnd, 400);
    };
    setTimeout(fire, 900);
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
        nope(t('discardMax', Game.MAX_DISCARD), el.btnDiscard);   // denetim3 #8
        return;
      } else selection.add(id);
      selFx = { id, on: selection.has(id), at: performance.now() };   // P118
    } else {
      if (selection.has(id)) selection.delete(id);
      else selection.add(id);
    }
    selFx = { id, on: selection.has(id), at: performance.now() };   // P118
    SFX.tick();
    render();
  }

  /* denetim3 #8 (kullanıcı: "açılım kural geri bildirimleri ekranda yazı olarak çıkmasın, hesaplama
     animasyonunda da çıkıyor; ses + taş titremesi gibi hafif bir geri bildirim olsun, ilk taslaklardan kalan
     uyarıları sil") — KURAL İHLALİ GERİ BİLDİRİMİ: uzun toast yerine "hata" sesi, seçili taşlar kısa titrer,
     düğmenin üstünde 1-2 kelimelik balon. Tanınmayan (oyuncuya gerçekten bilgi veren) hata metni eskisi gibi
     toast olarak kalır. */
  const NOPE_RULES = [
    [/Çift ile Per\/Sıralı aynı turda|Çift ile karıştırılamaz|Per\/Sıralı ile karıştırılamaz|Bu turda (Çift|Per\/Sıralı) açılımı başlattın/, 'nopeMix'],
    [/Geçersiz grup|kurallarına uymuyor/, 'nopeInvalid'],
    [/grubu geçerli tutmuyor|Bu değişim grubu bozuyor|yerine geçiyor — eşleşen taşı/, 'nopeFit'],
    [/Bu grup en fazla (\d+) taş/, 'nopeMax'],
    [/Çift genişletilemez/, 'nopePairExt'],
    [/Deste jokeri (gruba|işlemeye)/, 'nopeJokerTile'],
    [/dikti|dikili/, 'nopeSewn'],
    [/Hayalet taş atılamaz/, 'nopeNoDiscard'],
    [/Per'de okey geri alınamaz/, 'nopeNotInPer'],
    [/en fazla \d+ taş atabilirsin|at most \d+ tiles/, 'nopeMax3'],
  ];
  function nope(err, anchor) {
    const msg = String(err || '');
    const hit = NOPE_RULES.find(([re]) => re.test(msg));
    if (!hit) { if (msg) toast(msg); return; }
    const m = msg.match(hit[0]);
    const label = t(hit[1], m && m[1]);
    SFX.nope();
    document.querySelectorAll('#rack .tile.selected, #meldArea .staged .tile').forEach((tl) => {
      tl.classList.remove('nope-shake'); void tl.offsetWidth; tl.classList.add('nope-shake');
      setTimeout(() => tl.classList.remove('nope-shake'), 450);
    });
    const stage = document.querySelector('#gameScreen .gm-stage');
    if (!stage || !anchor) return;
    stage.querySelectorAll('.nope-pop').forEach((x) => x.remove());
    const sr = stage.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    const sc = (sr.width / (stage.offsetWidth || sr.width)) || 1;
    const pop = document.createElement('div');
    pop.className = 'nope-pop';
    pop.textContent = label;
    pop.style.left = `${(ar.left + ar.width / 2 - sr.left) / sc}px`;
    pop.style.top = `${(ar.top - sr.top) / sc - 8}px`;
    stage.appendChild(pop);
    setTimeout(() => pop.remove(), 1600);
  }

  el.btnAddCombo.addEventListener('click', () => {
    const res = Game.stageSelection([...selection]);
    if (!res.ok) { nope(res.error, el.btnAddCombo); return; }
    if (res.count > 1) toast(t('multiStaged', res.count), true);
    selection.clear();
    render();
  });

  const doConfirm = () => {
    const pre = Game.previewBase ? Game.previewBase() : null;   // P111 — sahne jokersiz değerden başlar
    const score0 = Game.state.score;   // denetim CS-10 — sayaç gerçek eski puandan saysın (Cellat, Orion ×2)
    const res = Game.confirmMelds();
    if (res && res.ok && pre && !res.pre) res.pre = pre;   // denetim karar 18 — motorun verdiği taban (çöken gruplar sonrası) önceliklidir
    if (!res.ok) { if (res.error) toast(res.error); return; }
    muteUiClick();   // denetim S-4 — Onayla'da tek ses: genel düğme tıkı çalmaz, yalnız açılım sesi (sahne sonunda)
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
    notify(res.triggered.map(tr => `${tr.name}: ${tr.text}`));
    notify(res.bonuses);
    notify(res.events);
    const after = (seqShown) => {
      /* denetim CS-12 — öğretici "zıpladı ve ekledi" der: sahne BİTİNCE işaretlenir (eskiden
         sahne başlarken çıkıyordu) */
      if (TUT.active && res.triggered.length && Game.state.jokers.length) TUT.flag('jokerFire');
      scoreFly(`+${res.final}`);
      SFX.meld(res.count);
      /* P111 — sahne çarpanı zaten gösterdi; eski ×N parlaması yalnız sahne atlanınca (testler) */
      if (res.carpanText && (!seqShown || res.tamEl)) flashMult(res.tamEl ? 'TAM EL!' : `×${res.carpanText}`);
      /* denetim3 #8 — sahne hesabı zaten adım adım gösterdi: özet yazısı yalnız sahne atlanınca (testler) çıkar */
      if (!seqShown) toast(t('confirmToast', res.count, res.carpanText, res.final), true);
      /* GRUP H — KUZEY YILDIZI. Açılımda Yıldız Taşı kullanıldıysa motor
         3 taş açtı; seçim penceresi burada belirir. */
      if (Game.state.yildizPick) setTimeout(showYildizPick, 520);
      if (res.katlaOffer) setTimeout(showKatlaOffer, 650);   // P58 · Kumarhane
      if (res.cocukFeda) setTimeout(() => showFeda(res.cocukFeda), 650);   // Lanetli Çocuk — Faz 3
      else if (res.cocukLock) setTimeout(() => showCocukBanner(t('cocukLockBanner'), t('cocukLockSub')), 650);   // Faz 2
      if (Game.state.status !== 'playing') setTimeout(showRoundEnd, 900);
    };
    const oldScore = score0;
    render();
    playScoreSeq(res, oldScore, after);   // P111 — jokerler sırayla tetiklenir (Balatro gibi)
  };

  /* ============================================================
     P111 (kullanıcı: "joker bonus vereceği zaman Balatro'daki gibi titresin, bonusunu eklesin;
     açılımda direkt eklenip hesabı çoktan eklenmiş görmeyelim") — PUANLAMA SAHNESİ.
     Hesap çubuğunun yerinde "puan × çarpan" plakası; tetiklenen her joker SIRAYLA zıplar,
     kartın üstünde kendi bonusu belirir, plaka adım adım büyür; sonda toplam puana eklenir.
     Hız: Ayarlar › Oyun › Animasyon hızı (Normal / Hızlı); tıklayınca atlanır. Otomasyon
     tarayıcısında (testler) anında biter. Motor sonucu DEĞİŞMEZ — yalnız gösterim sırası.
     ============================================================ */
  const ANIM_KEY = 'okeyAnimSpeed';
  const animSpeed = () => { try { return localStorage.getItem(ANIM_KEY) === 'fast' ? 'fast' : 'normal'; } catch (e) { return 'normal'; } };
  /* denetim CS-02…CS-08 / karar 18-19 — SAHNE AYRIŞTIRICISI.
     Motorun döküm metni (dil bağımsız Türkçe) bir satırda BİRDEN ÇOK etki taşıyabilir
     ("+6.0x +450 puan", "+2.0x ve +50 puan"); eski ayrıştırıcı yalnız satır başını okuyordu.
     Artık her satır işlem DİZİSİNE çevrilir:
       add  : "+N.Nx" / "−N.Nx" (satırın herhangi bir yerinde)   → her tablonun çarpanına eklenir
       mul  : "çarpan ×N" (Kumarbaz)                                → çarpan çarpılır
       chips: motorun `chips` alanı (Hipnotizör) / "ham A → B" (Ejderha) → ham değer büyür
       flat : "+N puan" / "−N puan" / sondaki "(+N)"                → düz puan
       d    : boss kesintisi / Ayna Kral borcu (motorun `d` alanı)  → toplam (kırmızı adım)
       coin : "+N coin" (Kelebek)                                   → plakaya girmez
     Taban (res.pre) artık SAF grup değeri olduğu için her adım plakaya bir kez eklenir; sonda
     plakanın kendi hesabı motorun sonucuyla birebir tutar (tests/test_denetim_carpan.js). */
  const SEQ_ADD_RE = /(^|[\s(:→+])([+\-−])(\d+(?:\.\d+)?)x(?![A-Za-z0-9])/g;
  const seqOps = (tr) => {
    const txt = String(tr.text || '');
    const ops = [];
    if (tr.d != null) { ops.push({ k: 'd', v: tr.d }); return ops; }
    if (tr.chips) ops.push({ k: 'chipsAdd', v: tr.chips });
    let m = txt.match(/ham (\d+) → (\d+)/);
    if (m && +m[1] > 0) ops.push({ k: 'chipsMul', v: +m[2] / +m[1] });
    m = txt.match(/çarpan ×(\d+(?:\.\d+)?)/);
    if (m) ops.push({ k: 'mul', v: +m[1] });
    for (const x of txt.matchAll(SEQ_ADD_RE))
      ops.push({ k: 'add', v: (x[2] === '+' ? 1 : -1) * +x[3], s: `${x[2] === '+' ? '+' : '−'}${x[3]}x` });
    for (const x of txt.matchAll(/([+\-−])(\d+) puan/g)) ops.push({ k: 'flat', v: (x[1] === '+' ? 1 : -1) * +x[2] });
    m = txt.match(/\(\+(\d+)\)\s*$/);
    if (m) ops.push({ k: 'flat', v: +m[1] });
    m = txt.match(/^\+(\d+) coin/);
    if (m) ops.push({ k: 'coin', v: +m[1] });
    return ops;
  };
  /* balon etiketi ve rengi (kind): sayılar motor yazımıyla (iki ondalık korunur — CS-07);
     sayısız satır çevrilmiş metnin kısa hâli (CS-08: eskiden "en", "ham", "yasak" gibi ilk kelime) */
  const seqLabel = (tr, ops) => {
    const sgn = (v) => (v < 0 ? '−' : '+') + Math.abs(v);
    const d = ops.find((o) => o.k === 'd');
    if (d) { const pm = String(tr.text || '').match(/-%(\d+)/); return { kind: 'boss', label: pm ? `−%${pm[1]}` : sgn(d.v) }; }
    const parts = [];
    let kind = '';
    for (const o of ops) {
      if (o.k === 'add') { parts.push(o.s); kind = kind || 'add'; }
      else if (o.k === 'mul') { parts.push(`×${o.v}`); kind = kind || 'mul'; }
      else if (o.k === 'flat') { parts.push(sgn(o.v)); kind = kind || 'flat'; }
      else if (o.k === 'chipsAdd') { parts.push(`+${o.v}`); kind = kind || 'chips'; }
      else if (o.k === 'chipsMul') { parts.push(`×${+o.v.toFixed(2)}`); kind = kind || 'chips'; }
      else if (o.k === 'coin') { parts.push(`+${o.v} 🪙`); kind = kind || 'coin'; }
    }
    if (parts.length) return { kind, label: parts.join(' ') };
    const tx = T.ev ? T.ev(String(tr.text || '')) : String(tr.text || '');
    return { kind: 'note', label: tx.length > 26 ? tx.slice(0, 25) + '…' : (tx || '✦') };
  };
  /* Kumarbaz atışı motorda TÜM çarpan eklemelerinden sonra uygulanır (karışık açılımda Tek Teker
     satırı atıştan sonra yazılsa da) → sahnede de çarpma adımı son eklemenin arkasına alınır. */
  const seqOrder = (steps) => {
    const muls = steps.filter((st) => st.ops.some((o) => o.k === 'mul'));
    if (!muls.length) return steps;
    const rest = steps.filter((st) => !muls.includes(st));
    let at = -1;
    rest.forEach((st, i) => { if (st.ops.some((o) => o.k === 'add')) at = i; });
    rest.splice(at + 1, 0, ...muls);
    return rest;
  };
  const seqCeil = (raw, car) => Math.ceil(Math.round(raw * car * 1000) / 1000);   // motorun ceilMul'u
  const seqR2 = (x) => Math.round(x * 100) / 100;
  /* plaka modeli: tablolar (karışık açılımda iki) × çarpan + düz puan; boss adımından sonra toplam */
  const seqPlate = (pre, res) => {
    const P = {
      parts: (pre && pre.parts && pre.parts.length ? pre.parts : [{ raw: (pre && pre.raw) || res.raw || 0, carpan: (pre && pre.carpan) || 1 }])
        .map((p) => ({ c: p.raw, m: p.carpan })),
      flat: 0, total: null,
    };
    P.sub = () => P.parts.reduce((a, p) => a + seqCeil(p.c, p.m), 0) + P.flat;
    P.value = () => (P.total != null ? P.total : P.sub());
    P.apply = (o) => {
      if (o.k === 'add') P.parts.forEach((p) => { p.m = seqR2(p.m + o.v); });
      else if (o.k === 'mul') P.parts.forEach((p) => { p.m = seqR2(p.m * o.v); });
      else if (o.k === 'chipsMul') P.parts.forEach((p) => { p.c = Math.round(p.c * o.v); });
      else if (o.k === 'chipsAdd') P.parts[P.parts.length - 1].c += o.v;
      else if (o.k === 'flat') { if (P.total != null) P.total += o.v; else P.flat += o.v; }
      else if (o.k === 'd') { if (P.total == null) P.total = P.sub(); P.total = Math.max(0, P.total + o.v); }
    };
    return P;
  };
  /* tetik satırının kartı: Füzyon/Vasiyet alt kaydı taşıyıcı kartta, sabit kimlikli satırlar
     anahtarıyla, Orion kemeri / Lady Luck satırı metindeki joker adıyla bulunur (CS-09) */
  const SEQ_KEY = { satrancSaati: 'satrancSaati', frankRevive: 'frankenstein', frankStitch: 'frankenstein',
    hipno: 'hipnotizor', pandoraGift: 'truva', rulet: 'rulet', terazi: 'terazi', apple: 'yasakElma', ayTasi: 'otekiDunya' };
  const seqCard = (tr) => {
    const js = (Game.state && Game.state.jokers) || [];
    const recs = (j) => (Game._recsOf ? Game._recsOf(j) : [j]);
    let j = js.find((x) => x.id === tr.id) || js.find((x) => recs(x).some((r) => r.id === tr.id));
    if (!j && SEQ_KEY[tr.id]) j = js.find((x) => recs(x).some((r) => r.key === SEQ_KEY[tr.id]));
    if (!j && (tr.id === 'orion' || tr.id === 'ladyLuck')) j = js.find((x) => x.name && String(tr.text || '').includes(x.name));
    return j ? el.jokerSlots.querySelector(`[data-jid="${j.id}"]`) : null;
  };
  var seqLock = false;   // denetim CS-13 — sahne sürerken render() puan panelini son değere atlatmasın (var: render() bu satırdan önce de çağrılır, TDZ olmasın)
  function playScoreSeq(res, oldScore, done) {
    const steps = seqOrder((res.triggered || []).map((tr) => { const ops = seqOps(tr); return { tr, ops, ...seqLabel(tr, ops) }; }));
    const auto = typeof navigator !== 'undefined' && navigator.webdriver && !window.__animTest;
    if (auto || !res.final) { done(false); return; }
    const k = animSpeed() === 'fast' ? 0.45 : 1;
    /* başlangıç = onaydan önce çubukta görülen SAF grup değeri (karışık açılımda iki tablo) */
    const P = seqPlate(res.pre, res);
    /* güvenlik: plakanın hesabı motorla tutmazsa (beklenmeyen yeni bir döküm metni) son kare
       motorun sonucunu yazar — puan asla yanlış gösterilmez; test bu durumu yakalar */
    const probe = seqPlate(res.pre, res);
    steps.forEach((st) => st.ops.forEach(probe.apply));
    const exact = probe.value() === res.final;
    if (!exact && window.console) console.warn('puanlama sahnesi motorla tutmadı', probe.value(), res.final, res.triggered);
    const stage = document.querySelector('#gameScreen .gm-stage');
    document.getElementById('scoreSeq')?.remove();
    const box = document.createElement('div');
    box.id = 'scoreSeq';
    box.innerHTML = P.parts.map((p, i) => (i ? '<span class="ss-x">+</span>' : '')
      + `<span class="ss-chips"></span><span class="ss-x">×</span><span class="ss-mult"></span>`).join('')
      + `<span class="ss-plus hidden"></span><span class="ss-eq">=</span><span class="ss-total">?</span>`;
    stage.appendChild(box);
    /* denetim3 #9 (kullanıcı: "hesaplama tablosu masaya açtığım taşların üstüne biniyor") — plaka masadaki
       taşların ALTINA (Sırala panelinin üstüne) yerleşir; arada yer yoksa masanın ÜSTÜNE çıkar. */
    {
      const sr = stage.getBoundingClientRect(), sc = (sr.width / (stage.offsetWidth || sr.width)) || 1;
      const toY = (v) => (v - sr.top) / sc;
      const tiles = [...document.querySelectorAll('#meldArea .tile, #combosRow .tile')].map((e) => e.getBoundingClientRect()).filter((r) => r.height);
      if (tiles.length) {
        const tBot = toY(Math.max(...tiles.map((r) => r.bottom))), tTop = toY(Math.min(...tiles.map((r) => r.top)));
        const sortEl = el.btnAddCombo && el.btnAddCombo.closest('.gm-sortbar, .gm-actions, .gm-sort') || el.btnAddCombo;
        const floor = sortEl ? toY(sortEl.getBoundingClientRect().top) - 8 : 600;   // Sırala panelinin üstü
        const h = box.offsetHeight || 66;
        let top = Math.max(452, tBot + 12);
        if (top + h > floor) top = Math.max(8, tTop - h - 12);
        box.style.top = `${Math.round(top)}px`;
      }
    }
    const chipEls = box.querySelectorAll('.ss-chips'), multEls = box.querySelectorAll('.ss-mult');
    const plusEl = box.querySelector('.ss-plus'), totEl = box.querySelector('.ss-total');
    const fm = (m) => (Math.abs(m * 10 - Math.round(m * 10)) > 1e-9 ? m.toFixed(2) : m.toFixed(1));
    const show = () => {
      P.parts.forEach((p, i) => { chipEls[i].textContent = p.c; multEls[i].textContent = fm(p.m); });
      plusEl.classList.toggle('hidden', !P.flat);
      plusEl.textContent = P.flat ? `${P.flat < 0 ? '−' : '+'}${Math.abs(P.flat)}` : '';
      if (P.total != null) totEl.textContent = P.total;
    };
    show();
    seqLock = true;
    el.scoreNow.textContent = oldScore;
    const timers = [];
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      seqLock = false;
      timers.forEach(clearTimeout);
      document.removeEventListener('pointerdown', skip, true);
      document.querySelectorAll('.jk-seq-pop').forEach((c) => c.classList.remove('jk-seq-pop'));
      document.querySelectorAll('.jk-bubble').forEach((b) => b.remove());
      /* atlanınca kalan adımlar plakaya işlenir (son kare tutarlı denklem) */
      steps.forEach((st) => { if (!st.done) { st.ops.forEach(P.apply); st.done = true; } });
      show();
      totEl.textContent = res.final;
      box.classList.add('ss-done');
      el.scoreNow.textContent = Game.state.score;
      timers.push(setTimeout(() => box.remove(), 650 * k));
      done(true);
    };
    /* İLERİ (öğretici) sahneyi atlatmaz — CS-12 */
    /* denetim S-3 — atlatan basış YALNIZ atlatır: pointerdown alttaki öğeye ulaşmaz (sürükleme/ped
       başlamaz), ardından gelen click ve sağ tık da window'da yutulur (düğme çalışmaz, genel tık sesi yok) */
    const skip = (e) => {
      if (e.target.closest && e.target.closest('#settingsOv, #menuPop, #tutPanel')) return;
      e.stopPropagation(); e.preventDefault();
      const swallow = (ev) => { ev.stopImmediatePropagation(); ev.preventDefault(); off(); };
      const off = () => { clearTimeout(tOff); window.removeEventListener('click', swallow, true); window.removeEventListener('contextmenu', swallow, true); };
      const tOff = setTimeout(off, 1000);
      window.addEventListener('click', swallow, true);
      window.addEventListener('contextmenu', swallow, true);
      finish();
    };
    document.addEventListener('pointerdown', skip, true);
    /* SA-08 — balon tuvalin içinde (gm-stage koordinatı): tuvalle birlikte ölçeklenir */
    const toStage = (r) => {
      const sr = stage.getBoundingClientRect(), sc = (sr.width / (stage.offsetWidth || sr.width)) || 1;
      return { x: (r.left + r.width / 2 - sr.left) / sc, y: (r.top - sr.top) / sc - 6 };
    };
    let at = 450 * k;   // kullanıcı: daha yavaş / belirgin
    /* P122 — TAŞ TAŞ SAYIM (Balatro'nun kart kart sayımı): açılımın taşları masada sırayla zıplar,
       üstlerinden kendi değerleri yükselir, her taşta tık sesi bir yarım ton tırmanır. */
    const meldEls = (res.tileIds || []).map((id) => document.querySelector(`#meldArea .tile[data-id="${id}"], #combosRow .tile[data-id="${id}"]`)).filter(Boolean);
    if (!fxOff()) meldEls.forEach((te, i) => {
      timers.push(setTimeout(() => {
        te.animate([{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.14) rotate(-4deg)', offset: .35 },
          { transform: 'translateY(2px) scale(.97)', offset: .7 }, { transform: 'none' }], { duration: 300 * k, easing: 'ease-out' });
        const num = (te.querySelector('.num') || {}).textContent;
        if (num && /^\d+$/.test(num.trim())) popText(te, '+' + num.trim(), 'pt-chip');
        beep(392 * Math.pow(2, Math.min(i, 18) / 12), .05, 'square', .05);
      }, at));
      at += 110 * k;
    });
    if (meldEls.length) at += 160 * k;
    steps.forEach((st, i) => {
      timers.push(setTimeout(() => {
        st.ops.forEach(P.apply); st.done = true;
        show();
        box.classList.remove('ss-bump'); void box.offsetWidth; box.classList.add('ss-bump');
        if (st.kind === 'boss') { box.classList.remove('ss-cut'); void box.offsetWidth; box.classList.add('ss-cut'); }
        const card = st.kind === 'boss' ? null : seqCard(st.tr);
        const b = document.createElement('div');
        b.className = 'jk-bubble' + (st.kind === 'add' ? '' : ' ' + st.kind);
        b.textContent = st.label;
        if (card) { card.classList.remove('jk-seq-pop'); void card.offsetWidth; card.classList.add('jk-seq-pop'); }
        const p = toStage((card || box).getBoundingClientRect());
        b.style.left = `${p.x}px`; b.style.top = `${p.y}px`;
        stage.appendChild(b);
        timers.push(setTimeout(() => { b.remove(); card && card.classList.remove('jk-seq-pop'); }, 1050 * k));
        if (st.kind === 'boss') beep(220, .16, 'sawtooth', .07);
        else beep(560 + Math.min(i, 10) * 70, .09, 'square', .08);
        if (st.big) { stageFlash(.42, stage); screenShake(.55, stage); beep(98, .22, 'triangle', .1); }   // P122 — dev çarpan
      }, at));
      /* P122 — ×3 ve üstü bir kat: an bir nefes uzar ("donma"), ardından sahne devam eder */
      const xm = /×\s*(\d+(?:[.,]\d+)?)/.exec(`${(st.tr && st.tr.text) || ''} ${st.label || ''}`);   // balon farkı yazar (+360), kat jokerin metninde
      st.big = !!(xm && parseFloat(xm[1].replace(',', '.')) >= 3);
      at += (st.big ? 980 : 720) * k;
    });
    /* sonda toplam: puan paneli eski değerden yeniye sayar */
    timers.push(setTimeout(() => {
      totEl.textContent = res.final;
      box.classList.add('ss-done');
      /* P122 — puan büyüdükçe sarsıntı (100 ≈ yok · 1000 ≈ orta · 10000+ ≈ güçlü) */
      screenShake(Math.max(0, Math.min(1, (Math.log10(Math.max(1, res.final)) - 2) / 2.4)), stage);
      const tgt = Game.state.target;
      if (tgt && oldScore < tgt && Game.state.score >= tgt) {   // hedef geçildi: puan kutusu patlar
        timers.push(setTimeout(() => {
          const sp = document.getElementById('scorePanel');
          if (sp) {
            sp.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12) rotate(-1deg)', offset: .35 }, { transform: 'scale(.97)', offset: .7 }, { transform: 'scale(1)' }],
              { duration: 420 * k, easing: 'ease-out' });
            sparkBurst(sp, 18);
          }
          stageFlash(.3, stage);
          [523, 659, 784, 1047].forEach((f, i) => beep(f, .12, 'triangle', .07, i * .07));
        }, 700 * k));
      }
      const from = oldScore, to = Game.state.score, t0 = performance.now(), dur = 800 * k;
      const tick2 = (now) => {
        if (finished) return;
        const p = Math.min(1, (now - t0) / dur);
        el.scoreNow.textContent = Math.round(from + (to - from) * p);
        if (p < 1) requestAnimationFrame(tick2);
      };
      requestAnimationFrame(tick2);
    }, at));
    timers.push(setTimeout(finish, at + 900 * k));
  }

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
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><span class="pk-hint">${t('betKatlaHint')}</span></div></div>`;
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
    /* denetim3 #12 — bahis kuralları artık Kumarhane run'ının ilk girişindeki genel ipucunda (kumarhaneRun);
       bahis penceresinin üstüne ikinci bir kart açılıp kartları örtmesin (eski oyuncu için bir kez kalır) */
    if (!Hints.seen('kumarhaneRun')) Hints.show('kumarhane');
  }

  /* P61 — ödül metni motorun o stage'deki değerlerinden (betReward) */
  function betRewardText(o) {
    if (!o.perm && !o.picks && o.coinMult === 1) return t('betReward_guvenli');
    const parts = [t('brCoin', o.coinMult)];
    if (o.perm) parts.push(t('brPerm', Number(o.perm).toFixed(o.perm % 0.5 ? 2 : 1)));
    if (o.picks) parts.push(t('brPick_' + (o.pick || 'any')));
    return t('brPrefix') + parts.join(' + ') + '.';
  }

  /* P100 — HAYALET TUR TEKLİFİ (kullanıcı kararı 2026-10-14). Katla penceresinin
     kalıbı: iki kart, biri oyna biri vazgeç. Karar verilmeden raund ilerlemez. */
  function showGhostOffer() {
    const s = Game.state;
    if (!s || !s.ghostOffer || document.getElementById('ghostOv')) return;
    const ov = document.createElement('div');
    ov.id = 'ghostOv';
    ov.className = 'pk-ov tone-violet';
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">👻 ${t('ghostTitle')}</div>` +
      `<div class="pk-sub-title">${t('ghostBody', s.score, s.target)}</div>` +
      `<div class="pk-body pk-choice">` +
      `<button class="pk-card bet-card" data-k="play"><div class="pk-name">${t('ghostPlay')}</div>` +
      `<div class="pk-desc">${t('ghostPlayDesc')}</div></button>` +
      `<button class="pk-card bet-card bet-olumcul" data-k="pass"><div class="pk-name">${t('ghostPass')}</div>` +
      `<div class="pk-desc">${t('ghostPassDesc')}</div></button>` +
      `</div></div>`;
    const choose = (play) => {
      ov.remove();
      const r = Game.ghostTurnChoice(play);
      if (!r.ok) { toast(T.ev(r.error)); render(); return; }
      if (r.events && r.events.length) notify(r.events);
      selection.clear();
      render();
      if (r.roundOver) setTimeout(showRoundEnd, 300);
    };
    ov.querySelector('[data-k="play"]').addEventListener('click', () => choose(true));
    ov.querySelector('[data-k="pass"]').addEventListener('click', () => choose(false));
    document.body.appendChild(ov);
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
     · showBj: raund sonu Blackjack (Yüksek mi Alçak mı'nın yerine)
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
    /* denetim3 #27 — başka bir pencere (Pandora açılışı, paket, Tüccar/Şeytan teklifi, yazı-tura, ipucu)
       açıkken üstüne binmez: kapanınca açılır */
    if (document.querySelector('#pandoraOv, #packOv, .offer-pop, #kumarOv, #hintOv, #seytanPop, #voidPop')) {
      setTimeout(kumarStartPanels, 500); return;
    }
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
  /* denetim3 #29 · 🎲 Hileli Zar — zarı istediğin sayıya çevir (raund başına 1 kez) */
  function showZarCheat() {
    if (!Game.canZarCheat()) return;
    const s = Game.state;
    const ov = dockOv('zarOv', 'gold');
    const nums = Array.from({ length: 13 }, (_, i) => i + 1);
    const inHand = (n) => s.hand.filter(x => !x.jokerTile && !Game.isOkeyTile(x) && x.number === n).length;
    ov.innerHTML = `<div class="pk-box">` +
      `<div class="pk-title">🎲 ${t('zarCheatTitle')}</div>` +
      `<div class="pk-sub-title">${t('zarCheatSub', Game.hileliZarBonus().toFixed(2), (Game.hileliZarBonus() + HILELI_ZAR_GROW).toFixed(2))}</div>` +
      `<div class="pk-body zar-grid">` +
      nums.map(n => `<button class="zar-btn${n === s.zarFace ? ' cur' : ''}" data-n="${n}"><span class="zn">${n}</span><span class="zh">${t('zarInHand', inHand(n))}</span></button>`).join('') +
      `</div><div class="pk-foot"><button class="btn ghost" data-a="x">${t('cancel')}</button></div></div>`;
    ov.querySelectorAll('.zar-btn').forEach(bt => bt.addEventListener('click', () => {
      const r = Game.zarCheat(+bt.dataset.n);
      if (!r.ok) return;
      SFX.dice();
      ov.remove();
      toast(t('zarCheatToast', r.face, r.bonus.toFixed(2)));
      render();
    }));
    ov.querySelector('[data-a="x"]').addEventListener('click', () => ov.remove());
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

  /* BLACKJACK — raund sonu (kullanıcı kararı 2026-10-28, Yüksek mi Alçak mı'nın yerine); `done` akışı sürdürür.
     Teklifte kısa "nasıl oynanır"; masada solda SEN, sağda KASA (ikinci taşı kapalı), altta Taş Çek / Dur / Katla. */
  function showBj(done) {
    const ov = document.createElement('div');
    ov.id = 'bjOv';
    ov.className = 'pk-ov tone-gold bj-ov';
    document.body.appendChild(ov);
    const bjTile = (tl, cls = '') => {
      const s = Game.state;
      const te = tl.okey
        ? tileEl({ id: 'bj-' + Math.random(), color: s.okey.color, number: s.okey.number, isOkeyReal: true }, false)
        : tileEl({ id: 'bj-' + Math.random(), color: tl.color, number: tl.number }, false);
      te.classList.add('hl-tile', 'bj-tile'); if (cls) te.classList.add(cls);
      return te.outerHTML;
    };
    const hand = (lbl, tiles, val, hidden) => `<div class="bj-hand"><div class="hl-lbl">${lbl}</div>`
      + `<div class="bj-row">${tiles.map((x) => bjTile(x)).join('')}${hidden ? '<div class="tile hl-tile hl-back bj-tile">?</div>' : ''}</div>`
      + `<div class="bj-val${val > 21 ? ' bad' : val === 21 ? ' ok' : ''}">${val}</div></div>`;
    const finish = () => { Game.bjClose(); ov.remove(); render(); done(); };
    const draw = () => {
      const h = Game.bjState();
      if (!h) { finish(); return; }
      let body = '', foot = '';
      if (h.phase === 'offer') {
        body = `<div class="hl-win">${t('bjWinLine', h.stake)}</div>`
          + `<div class="hl-how"><div class="hl-how-t">${t('bjHowTitle')}</div>`
          + `<ol><li>${t('bjHow1')}</li><li>${t('bjHow2')}</li><li>${t('bjHow3', h.stake)}</li></ol></div>`
          + `<div class="bj-rules">${t('bjRules')}</div>`;
        foot = `<button class="btn primary" data-a="accept">🃏 ${t('bjAccept')}</button>`
          + `<button class="btn ghost" data-a="skip">${t('bjSkip', h.stake)}</button>`;
      } else {
        /* kullanıcı: Kasa üstte, sen altta (yan yana karışıyordu) */
        body = `<div class="bj-table">${hand(t('bjDealer'), h.dealerShown, h.dv, h.holeHidden)}${hand(t('bjYou'), h.player, h.pv)}</div>`
          + `<div class="bj-bet">${t('bjBet', h.bet)}</div>`;
        if (h.phase === 'play') {
          foot = `<button class="btn primary" data-a="hit">${t('bjHit')}</button>`
            + `<button class="btn primary" data-a="stand">${t('bjStand')}</button>`
            + (h.canDouble ? `<button class="btn ghost" data-a="double">${t('bjDouble', h.stake * 2)}</button>` : '');
        } else {
          const good = h.net > 0, even = h.net === 0;
          body += `<div class="hl-result ${good ? 'ok' : even ? '' : 'bad'}">${t('bjRes_' + h.result, Math.abs(h.net))}</div>`;
          foot = `<button class="btn primary" data-a="close">${t('okBtn')}</button>`;
        }
      }
      ov.innerHTML = `<div class="pk-box"><div class="pk-title">🃏 ${t('bjTitle')}</div>`
        + `<div class="hl-body">${body}</div><div class="pk-foot hl-foot">${foot}</div></div>`;
      ov.querySelectorAll('[data-a]').forEach(bt => bt.addEventListener('click', () => act(bt.dataset.a)));
    };
    const after = () => {
      const h = Game.bjState();
      if (h && h.phase === 'done') { if (h.net > 0) { SFX.coin(); if (h.result === 'bj') SFX.jackpot(); } else if (h.net < 0) SFX.lose(); }
      draw();
    };
    const act = (a) => {
      if (a === 'accept') { Game.bjAccept(); SFX.chips(); after(); return; }
      if (a === 'skip') { Game.bjSkip(); finish(); return; }
      if (a === 'hit') { Game.bjHit(); SFX.tick?.(); after(); return; }
      if (a === 'stand') { Game.bjStand(); after(); return; }
      if (a === 'double') { Game.bjDouble(); SFX.chips(); after(); return; }
      if (a === 'close') { finish(); return; }
    };
    draw();
    Hints.show('bj');
  }

  function showBetPicks(done) {
    const s = Game.state;
    const p = (s.betPicks || [])[0];
    if (!p) { if (done) done(); return; }
    /* Lanetli Boyut — Adak Sunağı ödülü (tek kart) ve Lanetli yol ödülü kendi başlığıyla (Kumarhane'nin "Bahis Ödülü" değil) */
    const src = p.source === 'altar' ? 'altar' : p.source === 'cursedPath' ? 'path' : p.source === 'takas' ? 'takas' : null;
    const ov = packOverlay('joker', src ? src + 'PickTitle' : 'betPickTitle');
    ov.querySelector('.pk-sub-title').textContent = src === 'altar' ? t('altarPickSub')
      : t(p.kind === 'legendary' ? 'betPickSubLeg' : 'betPickSub');
    const body = ov.querySelector('.pk-body');
    body.className = 'pk-body pk-choice';
    ov.querySelector('.pk-foot').innerHTML = `<span class="pk-hint">${t(src === 'altar' ? 'altarPickHint' : 'packChoiceHint')}</span>`;
    p.options.forEach((opt, oi) => {
      const c = document.createElement('button');
      c.className = `pk-card r-${opt.rarity || 'special'}`;
      c.style.animationDelay = `${oi * 0.11}s`;
      /* denetim3 #46 — ödül jokeri çizimiyle (çizimi olmayan kart adıyla), takas kartlarıyla aynı kalıp */
      c.innerHTML = (opt.type === 'joker' && JOKER_ART.has(opt.key)
        ? `<div class="col-jk-art jk-${opt.key} bp-art"></div><div class="pk-name">${T.name(opt)}</div><div class="pk-sub">${T.rarity(opt.rarity)}</div>`
        : packFaceHtml(opt)) + `<div class="pk-desc">${packFaceDesc(opt)}</div>`;
      packTip(c, opt);
      c.addEventListener('click', () => {
        if (ov.dataset.done) return;
        ov.dataset.done = '1';
        let r = Game.chooseBetPick(oi);
        /* denetim3 #41 — raflar doluysa: hangi jokerin yerine geçeceğini sor (ya da coin'e çevir) */
        if (!r.ok && r.needsSwap) {
          showBetSwap(opt, (swapId) => {
            const r2 = Game.chooseBetPick(oi, swapId);
            if (!r2.ok) { toast(r2.error); delete ov.dataset.done; return; }
            if (r2.got && r2.got.gave) toast(t('betSwapToast', T.ev(r2.got.gave.name), r2.got.gave.coins, T.name(opt)), true);
            finishPick(r2);
          }, () => { delete ov.dataset.done; });
          return;
        }
        if (!r.ok) { toast(r.error); delete ov.dataset.done; return; }
        finishPick(r);
      });
      const finishPick = (r) => {
        SFX.coin();
        [...body.children].forEach((el2, i) => el2.classList.add(i === oi ? 'pk-won' : 'pk-lost'));
        notify([packOutLine(r.got)], true, { quiet: true });
        setTimeout(() => {
          ov.remove();
          render();
          if (r.got && !r.got.converted) onJokerGained(r.got.key, r.got.jokerId);
          showBetPicks(done);   // sıradaki ödül (katlama tuttuysa iki seçim)
        }, 780);
      };
      /* denetim3 #46 — jokerin özelliği her yerdeki gibi üstüne gelince okunur */
      if (opt.type === 'joker') attachTip(c, { key: opt.key, name: opt.name, desc: opt.desc || (JOKER_DEFS[opt.key] || {}).desc || '', rarity: opt.rarity }, {});
      body.appendChild(c);
    });
  }

  /* denetim3 #41 — bahis ödülünde raflar doluysa: verilecek jokeri seç (satış değeri cüzdana) ya da
     ödülü coin'e çevir. Store takas penceresiyle (#buySwap) aynı kalıp: çizimli kartlar + iki düğme. */
  function showBetSwap(opt, onPick, onCancel) {
    document.getElementById('betSwap')?.remove();
    const s = Game.state;
    const rows = [...s.jokers.map((j) => ({ j, where: 'main' })), ...s.backup.map((j) => ({ j, where: 'backup' }))];
    const ov = document.createElement('div');
    ov.id = 'betSwap';
    ov.className = 'pk-ov tone-violet';
    ov.innerHTML =
      `<div class="pk-box"><div class="pk-title">${t('betSwapTitle')}</div>` +
      `<div class="pk-sub-title"><div class="sw-want">${t('betSwapSub', T.name(opt))}</div></div>` +
      `<div class="pk-body pk-choice sw-list">` +
      rows.map(({ j, where }) => {
        const lock = Game.canSellJoker(j.id);
        return `<button class="pk-card sw-row r-${j.rarity}${lock.ok ? '' : ' locked'}" data-jid="${j.id}" ${lock.ok ? '' : 'disabled'}>` +
          (JOKER_ART.has(j.key) ? `<div class="col-jk-art jk-${j.key}"></div>` : `<div class="sw-art-name">${T.name(j)}</div>`) +
          `<div class="sw-where">${t(where === 'backup' ? 'destBackup' : 'destMain')}</div>` +
          (lock.ok ? `<div class="sw-ref">${t('swapRefund', sellPrice(j.rarity, j.key), COIN)}</div>` : `<div class="sw-why">${T.ev(lock.error || '')}</div>`) +
          `</button>`;
      }).join('') +
      `</div>` +
      `<div class="pk-foot"><button class="btn ghost" id="bsCoins">${t('betSwapCoins')}</button>` +
      `<button class="btn ghost" id="bsCancel">${t('cancel')}</button></div></div>`;
    rows.forEach(({ j }, i) => { const c = ov.querySelectorAll('.sw-row')[i]; if (c) attachTip(c, { key: j.key, name: j.name, desc: j.desc || (JOKER_DEFS[j.key] || {}).desc || '', rarity: j.rarity }, {}); });
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('#bsCancel').addEventListener('click', () => { close(); onCancel && onCancel(); });
    ov.querySelector('#bsCoins').addEventListener('click', () => { close(); onPick('coins'); });
    ov.querySelectorAll('.sw-row').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      close(); onPick(parseInt(b.dataset.jid, 10));
    }));
  }

  /* Store'suz raund geçişi (Kumarhane) — store "Devam" düğmesinin işi */
  function goNextRound() {
    Game.nextRound();
    selection.clear();
    newTileIds.clear();
    if (Game.state.status === 'runComplete' || Game.state.runFinished) { showRunComplete(); return; }
    showScreen('map');
    if (Game.state.roundInStage === 1 || Game.isFinalStage()) showOkeyBanner();   // P71 — final 3. raundda başlar
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
    if (curScreen() !== 'game') return;   // denetim LG-01 — 450 ms içinde haritaya dönüldüyse açma
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
    if (!res.ok) { if (res.error) nope(res.error, el.btnDiscard); return; }   // denetim3 #8
    selection.clear();
    newTileIds = new Set(res.drawn || []);
    if (res.worldRestart) dealHand();   // P118 — raund baştan: el yeniden dağıtılır
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
      if (res.ghostOffer) { setTimeout(showGhostOffer, 380); return; }   // P100 — Hayalet tur (eski kayıt)
      if (Game.state.ghostJustStarted) { Game.state.ghostJustStarted = false; toast(t('ghostAutoToast'), true); }   // P109
      if (res.roundOver) setTimeout(showRoundEnd, 400);
      // P31 · Grup E — Tanrının Eli: önce desteden seçim, sonra yazı-tura
      /* denetim3 #19 — Tüccar teklifi yazı-tura (ve Tanrının Eli seçimi) kapanınca açılır */
      const tuccarNext = () => { if (!res.roundOver && !res.worldRestart && Game.state.tuccarOffer)
        setTimeout(() => { if (Game.state.tuccarOffer) showTuccarOffer(); }, 250); };
      if (res.roundOver) {}
      else if (Game.state.godPick) showGodPick(() => maybeCoinFlip(tuccarNext));
      // Grup F/22 — yeni turun yazı-turası (Kumarbaz slottaysa)
      else maybeCoinFlip(tuccarNext);
      /* GRUP K (kullanıcı isteği 2026-09-06) — TÜCCAR TEKLİFİ OTOMATİK.
         Boss her TUR yeni teklif sunuyor (`_tuccarTurnOffer`) ama pop-up
         yalnız RAUND başında açılıyordu; turlar arasında oyuncunun barda
         beliren "$" düğmesine basması gerekiyordu — teklifin varlığı bile
         gözden kaçıyordu. Artık yeni tur başlar başlamaz kendiliğinden
         açılır. Düğme yerinde duruyor: pop-up kapatılırsa oyuncu teklife
         aynı turda geri dönebilsin. */
      /* (Tüccar artık yukarıda tuccarNext ile, pencereler kapandıktan sonra açılır) */
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
    SFX.shoulder();   // P113
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
      /* P109 (kullanıcı: "yalnız etkileşime gireceğim yerleri çevrele") — spot ıstakanın tamamı değil,
         dokunulacak TAŞLAR: */
      const rackTile = (t) => t && document.querySelector(`#rack .tile[data-id="${t.id}"]`);
      const handOf = (c, n, k = 1) => s().hand.filter((x) => x.color === c && x.number === n && !x.jokerTile && !x.fakeOkey
        && !s().staged.some((g) => g.tiles.some((y) => y.id === x.id))).slice(0, k);
      const tilesOf = (list) => list.map(rackTile);
      const sevens = () => s().hand.filter((x) => x.number === 7 && x.color !== 'yellow' && !x.jokerTile && !Game.isOkeyTile(x)
        && !s().staged.some((g) => g.tiles.some((y) => y.id === x.id))).slice(0, 3);
      const sirali = () => [9, 10, 11].map((n) => handOf('red', n)[0]).filter(Boolean);
      const pair = () => {
        const free = s().hand.filter((x) => !x.jokerTile && !Game.isOkeyTile(x));
        const y = free.filter((x) => x.color === 'yellow' && x.number === 12);
        if (y.length >= 2) return y.slice(0, 2);
        for (const a of free) { const b = free.find((x) => x !== a && x.color === a.color && x.number === a.number); if (b) return [a, b]; }
        return [];
      };
      const t1 = () => s().roundInStage === 1 && s().turn === 1;
      /* P92 (kullanıcı onayı 2026-10-13) — MÜHÜR ANLATIR. 23 ipucu 18'e indi,
         her balon bir-iki cümle. `gate` olan adım EYLEMDİR: İLERİ yok, oyuncu
         söyleneni yapınca kendiliğinden geçer; `gate` yoksa BİLGİ (İLERİ). */
      this._tips = [
        { id: 'welcome', screen: 'map', pos: 'left',
          when: () => s().stage === 1 && s().roundInStage === 1,
          spot: () => [document.querySelector('.mc-play')],
          gate: () => curScreen() === 'game' },
        { id: 'goal', screen: 'game',
          when: () => s().roundInStage === 1 && s().turn === 1,
          spot: () => [$('scorePanel'), el.turnIndicator] },   // P109 (kullanıcı): tur kutuları da gösterilir
        { id: 'rack', screen: 'game', when: () => s().roundInStage === 1, spot: () => [el.rack] },
        { id: 'combos', screen: 'game', when: () => s().roundInStage === 1 },
        /* P109 (kullanıcı: "çifti, peri, sıralıyı uygulatarak öğret") — 1. tur Per + Sıralı birlikte
           (çoklu grup çarpanı), 2. tur işleme, 3. tur Çift; atışta en çok 3 taş + işlek şansı. */
        { id: 'selectPer', screen: 'game',
          when: () => t1() && s().staged.length === 0 && sevens().length >= 3,
          spot: () => [...tilesOf(sevens()), el.btnAddCombo],
          gate: () => s().staged.length > 0 || s().openedThisTurn },
        { id: 'selectSirali', screen: 'game',
          when: () => t1() && s().staged.length === 1 && sirali().length === 3,
          spot: () => [...tilesOf(sirali()), el.btnAddCombo],
          gate: () => s().staged.length >= 2 || s().openedThisTurn },
        { id: 'multiGroup', screen: 'game',
          when: () => t1() && s().staged.length >= 2,
          spot: () => [el.previewBar] },
        { id: 'confirmBtn', screen: 'game',
          when: () => s().staged.length > 0 && s().turnMode !== 'cift',
          spot: () => [el.btnConfirm],
          gate: () => s().openedThisTurn || s().phase === 'discard' },
        { id: 'score', screen: 'game',
          when: () => s().score > 0 && s().roundInStage === 1,
          spot: () => [$('scorePanel')] },
        { id: 'discardInfo', screen: 'game',
          when: () => s().phase === 'discard' && t1(),
          spot: () => [el.btnDiscard] },
        { id: 'discard1', screen: 'game',
          when: () => s().phase === 'discard' && t1(),
          spot: () => [...tilesOf(handOf('blue', 2)), el.btnDiscard],
          gate: () => s().turn >= 2 },
        { id: 'isleme', screen: 'game',
          when: () => s().roundInStage === 1 && s().turn === 2 && s().prevOpen.length > 0 &&
            s().hand.some(x => x.color === 'yellow' && x.number === 7 && !x.jokerTile) &&
            Game.canIsleme(0),
          spot: () => [...tilesOf(handOf('yellow', 7)), el.meldArea],
          gate: () => s().islemeler.length >= 1 ||
            (s().prevOpen[0] && s().prevOpen[0].tiles.length >= 4) || !s().prevOpen.length },
        { id: 'islemeConfirm', screen: 'game',
          when: () => s().islemeler.length >= 1,
          spot: () => [el.btnConfirm],
          gate: () => s().islemeler.length === 0 },
        { id: 'okey', screen: 'game',
          when: () => s().turn >= 2 && s().roundInStage === 1,
          spot: () => [el.okeyChip.closest('.gm-okeyblock') || el.okeyChip] },   // denetim3 #3 — OKEY kutusunun tamamı
        { id: 'discard2', screen: 'game',
          when: () => s().phase === 'discard' && s().roundInStage === 1 && s().turn === 2 && pair().length === 2,
          spot: () => [el.rack, el.btnDiscard],   // denetim3 #4 — atılacak taşın seçileceği ıstaka da aydınlık
          gate: () => s().turn >= 3 },
        { id: 'ciftTurn', screen: 'game',
          when: () => s().roundInStage === 1 && s().turn === 3 && s().phase !== 'discard' && s().staged.length === 0 && pair().length === 2,
          spot: () => [...tilesOf(pair()), el.btnAddCombo],
          gate: () => s().staged.length > 0 || s().openedThisTurn },
        { id: 'ciftConfirm', screen: 'game',
          when: () => s().staged.length > 0 && s().turnMode === 'cift',
          spot: () => [el.btnConfirm],
          gate: () => s().openedThisTurn || s().phase === 'discard' },
        { id: 'freeplay', screen: 'game',
          when: () => s().roundInStage === 1 && s().turn >= 3 && s().status === 'playing' },
        { id: 'islekHit', screen: 'game',
          when: () => TUT.flags.islekHit },
        { id: 'store1', store: true, pos: 'storeCard3',
          when: () => s().roundInStage === 1,
          /* denetim3 #5 — kartın dışına taşan kilit simgesi de çerçevenin içinde (çakışmasın) */
          spot: () => { const it = el.storeItems.querySelector('.store-item'); return [it, it && it.querySelector('.s-lock')]; },
          gate: () => s().jokers.length > 0 },
        { id: 'store2', store: true, pos: 'storeCard3',
          when: () => s().roundInStage === 1 && s().jokers.length > 0,
          /* denetim3 #6 — süre rozeti olan yeni joker kartı da çevrelenir; Mühür ona yakın durur */
          spot: () => { const jc = document.querySelector('#storeSlotsRow .joker-tile'); return [jc, el.btnStoreContinue]; },
          gate: () => !storeOpen() },
        /* P111 (kullanıcı: "sistemin böyle çalıştığını öğreticide gösterelim") — Balatro hesabı:
           çubuk yalnız grubun değeri; jokerler onaydan sonra sırayla eklenir */
        { id: 'jokerPreview', screen: 'game',
          when: () => s().jokers.length > 0 && s().staged.length > 0 && s().roundInStage >= 2,
          spot: () => [el.previewBar, el.jokerSlots, el.btnConfirm],
          gate: () => s().openedThisTurn || s().phase === 'discard' },
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
       ['yellow', 12], ['yellow', 12],                // hazır Çift (P109: 3. turun Çift dersi — raundu bitirir)
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

    start() { withSplash(() => this._begin()); },   // P118 — giriş splash'i
    _begin() {
      this._seenEntry = false;   // P120 — Mühür'ün düşüşü her öğretici başında bir kez
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
      /* denetim3 #1 — omuz sekmelerinin açık/kapalı durumu localStorage'da kalıyordu: önceki oyunda
         backup açık bırakıldıysa öğretici açık backup'la başlıyordu */
      setShoulder('backup', false);
      setShoulder('totem', false);
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
      if (!this.active || !this.panel || this.saying) return;
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

    /* --- balon + spot DOM'u ---
       P92 — MÜHÜR PANELİ (Gambonanza düzeni, kullanıcı onayı 2026-10-13):
       üstte konuşma balonu, ortada ana menüdeki maskot (aynı mascot.svg,
       yeniden çizim yok) + arkasında parıltı, altta İLERİ. Panel 1920×1080
       tuval ölçüsünde çizilir ve `--gm-scale` ile küçülür; yeri her karede
       anlatılan yerle ÇAKIŞMAYAN tarafa (sağ / sol) konur. */
    _dom() {
      if (this.panel) return;
      /* P109 (kullanıcı: "çevreleme genel bir kutu, çizgileri diğer elementlerin üstüne geliyor —
         yalnız etkileşime gireceğim yerleri çevrele") — spot artık TEK birleşik kutu değil: tam ekran
         kap; karartmada her hedef için ayrı delik (SVG maske), her hedefe ayrı çerçeve. */
      this.spotEl = document.createElement('div');
      this.spotEl.id = 'tutSpot';
      this.spotEl.style.opacity = '0';
      this.spotEl.innerHTML = `<svg class="ts-dim" width="100%" height="100%" aria-hidden="true"><defs><mask id="tsMask" maskUnits="userSpaceOnUse">`
        + `<rect x="0" y="0" width="100%" height="100%" fill="white"/><g class="ts-holes"></g></mask></defs>`
        + `<rect x="0" y="0" width="100%" height="100%" fill="rgba(8, 6, 20, .62)" mask="url(#tsMask)"/></svg><div class="ts-rings"></div>`;
      document.body.appendChild(this.spotEl);
      this.dimEl = document.createElement('div');
      this.dimEl.id = 'tutDim';
      this.dimEl.className = 'hidden';
      document.body.appendChild(this.dimEl);
      this.panel = document.createElement('div');
      this.panel.id = 'tutPanel';
      this.panel.classList.add('mascot');
      this.panel.innerHTML =
        `<div class="tm-bub"><div class="tp-body"></div></div>` +
        `<div class="tm-msc"><i>` +   /* parıltı kapta, salınım içte (glow maskotun önüne geçmesin) */
        /* P120 — Mühür katmanlı (assets/menu3/boot): kol hedefi gösterebilsin, göz açılıp kapansın */
        `<b class="tm-l bt-legs"></b><b class="tm-l bt-arm-l"></b><b class="tm-l bt-arm-r"></b><b class="tm-l bt-body"></b>` +
        `<b class="tm-l bt-pupil"></b><b class="tm-l bt-lid"></b></i></div>` +
        `<div class="tm-btns"><button class="tm-btn tp-next"></button><span class="tm-extra"></span></div>`;
      document.body.appendChild(this.panel);
      this.panel.classList.add('hidden');
      this.panel.querySelector('.tm-bub').addEventListener('click', () => this._typeDone());   // P120 — yazıyı tamamla
      this.panel.querySelector('.tp-next').addEventListener('click', () => {
        if (this._typing) { this._typeDone(); return; }   // P120 — ilk tık yazıyı tamamlar
        if (this.cur) { this.seen.add(this.cur); this.cur = null; SFX.tick(); this.update(); }
      });
    },

    _renderBalloon(tp) {
      const wasHidden = this.panel.classList.contains('hidden');
      this.panel.classList.remove('hidden');
      const body = T.tut(tp.id);
      if (this._lastBody !== body) {
        this._lastBody = body; this._spotKey = null;
        this.panel.querySelector('.tp-body').innerHTML = body;
        this._fxNewTip(wasHidden);   // P120
      }
      this.panel.querySelector('.tp-next').classList.toggle('hidden', !!tp.gate);
      this.panel.classList.toggle('tm-action', !!tp.gate);
      /* P92 — harita / store'da orta alan kartlarla dolu: Mühür sol sütuna
         (istatistik paneli) dar panelle oturur */
      if (this._pos !== (tp.pos || '')) { this._pos = tp.pos || ''; this._spotKey = null; }
      this.panel.classList.toggle('tm-narrow', this._pos === 'left');
      this.panel.querySelector('.tp-next').textContent = t('tutOk');
      this.panel.querySelector('.tm-extra').innerHTML = '';
      this._curSpot = tp.spot;
    },

    /* P120 (kullanıcı onayı 2026-10-30, Balatro öğretici videosundan YAPI ilhamı) — MÜHÜR CANLANIR.
       Yeni ipucunda balon "pop" ile açılır, yazı harf harf gelir (balona / İLERİ'ye ilk tık tamamlar),
       Mühür bir kez zıplar. Panelin ilk görünüşünde Mühür yukarıdan düşer ve gözünü açar.
       Testte ve "hareketi azalt"ta hepsi kapalı (metin anında, panel yerinde). */
    _fxNewTip(entering) {
      if (fxOff()) return;
      const K = fxK(), p = this.panel;
      const bub = p.querySelector('.tm-bub'), m = p.querySelector('.tm-msc > i');
      const pupil = p.querySelector('.bt-pupil'), lid = p.querySelector('.bt-lid');
      entering = entering && !this._seenEntry;   // düşüş yalnız öğreticinin başında bir kez
      if (entering) {
        this._seenEntry = true;
        this._entering = true;
        setTimeout(() => { this._entering = false; }, 700 * K);
        m.animate([{ transform: 'translateY(-260px)', opacity: 0 }, { transform: 'translateY(0) scale(1.08, .88)', opacity: 1, offset: .62 },
          { transform: 'translateY(-14px) scale(.96, 1.05)', offset: .8 }, { transform: 'none', opacity: 1 }],
          { duration: 620 * K, easing: 'cubic-bezier(.5,0,.75,1)', fill: 'backwards' });
        lid.animate([{ opacity: 1 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 820 * K, fill: 'backwards' });
        pupil.animate([{ transform: 'scaleY(.07)' }, { transform: 'scaleY(.07)', offset: .75 }, { transform: 'scaleY(1.15)', offset: .9 }, { transform: 'none' }],
          { duration: 820 * K, fill: 'backwards' });
        p.querySelector('.tm-btns').animate([{ opacity: 0 }, { opacity: 0, offset: .6 }, { opacity: 1 }], { duration: 760 * K });
        beep(110, .16, 'triangle', .08, .38 * K);
      } else {
        m.animate([{ transform: 'none' }, { transform: 'translateY(-18px) scale(.96, 1.06)', offset: .4 },
          { transform: 'scale(1.05, .93)', offset: .75 }, { transform: 'none' }], { duration: 380 * K, easing: 'ease-out' });
      }
      bub.animate([{ transform: 'scale(.86)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: .65 }, { transform: 'none', opacity: 1 }],
        { duration: 260 * K, delay: entering ? 420 * K : 0, easing: 'ease-out', fill: 'backwards' });
      // harf harf: metin düğümleri boşaltılır, sırayla geri yazılır (etiketler/örnek taşlar yerinde kalır)
      const nodes = [];
      const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3) { if (c.nodeValue.trim()) nodes.push([c, c.nodeValue]); } else walk(c); } };
      walk(p.querySelector('.tp-body'));
      nodes.forEach(([n]) => { n.nodeValue = ''; });
      this._typeNodes = nodes;
      this._typing = true;
      let ni = 0, ci = 0, last = 0;
      const step = (ts) => {
        if (!this._typing || this._typeNodes !== nodes) return;
        if (!last) last = ts;
        let budget = Math.max(1, Math.round((ts - last) / (16 * K)) * 2);   // ~120 harf/sn
        last = ts;
        while (budget-- > 0 && ni < nodes.length) {
          const [n, full] = nodes[ni];
          n.nodeValue = full.slice(0, ++ci);
          if (ci >= full.length) { ni++; ci = 0; }
        }
        if (ni % 2 === 0 && Math.random() < .25) beep(1100 + Math.random() * 300, .012, 'square', .018);
        if (ni < nodes.length) requestAnimationFrame(step); else this._typing = false;
      };
      setTimeout(() => requestAnimationFrame(step), entering ? 480 * K : 60 * K);
    },
    _typeDone() {
      if (!this._typing) return;
      this._typing = false;
      (this._typeNodes || []).forEach(([n, full]) => { n.nodeValue = full; });
    },
    /* "şunu yap" adımında Mühür'ün hedefe yakın kolu hedefi gösterir (kol omuzdan döner) */
    _aim(rects) {
      const p = this.panel;
      if (!p) return;
      const armL = p.querySelector('.bt-arm-l'), armR = p.querySelector('.bt-arm-r');
      if (!armL) return;
      const tp = this.cur && this.byId(this.cur);
      const B = (rects || []).filter((r) => r && r.width).map((r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom }));
      let rl = 0, rr = 0;
      if (!fxOff() && !this.saying && tp && tp.gate && B && B.length) {
        const mr = p.querySelector('.tm-msc').getBoundingClientRect();
        const tx = B.reduce((a, b) => a + (b.l + b.r) / 2, 0) / B.length, ty = B.reduce((a, b) => a + (b.t + b.b) / 2, 0) / B.length;
        const left = tx < mr.left + mr.width / 2;
        const sx = mr.left + mr.width * (left ? .119 : .894), sy = mr.top + mr.height * .49;
        let rot = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI - 90;   // kol aşağı bakar (90°)
        rot = ((rot + 540) % 360) - 180;
        rot = Math.max(-150, Math.min(150, rot));
        if (left) rl = rot; else rr = rot;
      }
      armL.style.transform = rl ? `rotate(${rl.toFixed(1)}deg)` : '';
      armR.style.transform = rr ? `rotate(${rr.toFixed(1)}deg)` : '';
    },

    /* Bitiş / kayıp: Mühür ekranın ortasında konuşur, altında düğmeler */
    say(html, buttons) {
      this.saying = true;
      this.cur = null;
      this._curSpot = null;
      this.panel.classList.remove('hidden', 'tm-action', 'tm-narrow');
      this._pos = '';
      this.panel.querySelector('.tp-body').innerHTML = html;
      this._lastBody = null;
      this._fxNewTip(false);   // P120
      this._aim(null);
      this.panel.querySelector('.tp-next').classList.add('hidden');
      const ex = this.panel.querySelector('.tm-extra');
      ex.innerHTML = '';
      for (const b of buttons) {
        const x = document.createElement('button');
        x.className = 'tm-btn' + (b.ghost ? ' ghost' : '');
        x.textContent = b.label;
        x.addEventListener('click', () => { SFX.tick(); b.fn(); });
        ex.appendChild(x);
      }
      this.dimEl.classList.remove('hidden');
      this._spotKey = null;
    },

    unsay() {
      this.saying = false;
      if (this.dimEl) this.dimEl.classList.add('hidden');
      if (this.panel) this.panel.querySelector('.tm-extra').innerHTML = '';
      this._spotKey = null;
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
      const rects = [];
      for (const e of els) {
        if (!e) continue;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        rects.push(r);
      }
      if (!rects.length) {
        if (this._spotKey !== 'off') { this._spotKey = 'off'; sp.style.opacity = '0'; this._placePanel(null); }
        return;
      }
      const key = rects.map((r) => [r.left, r.top, r.right, r.bottom].map(Math.round).join(',')).join('|');
      if (key === this._spotKey) return;
      this._spotKey = key;
      this._spotEls = els;   // denetim3 — hedef olan öğe "örtme" listesinden düşer
      this._drawSpots(rects);
      sp.style.opacity = '1';
      this._placePanel(rects);
    },

    _track() {
      cancelAnimationFrame(this._raf);
      const loop = () => {
        if (!this.active) return;
        if (this.saying) { if (this._spotKey !== 'say') { this._spotKey = 'say'; this.spotEl.style.opacity = '0'; this._placePanel(null); } }
        else this._spot(this._curSpot ? this._curSpot().filter(Boolean) : []);
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    },

    /* P92 — panel 1920×1080 tuval birimiyle sağ (1090,70) ya da sol
       (430,70) sütuna konur; anlatılan yerle EN AZ çakışan taraf seçilir.
       "Söyleme" (bitiş / kayıp) ekranın ortasında. */
    /* P109 — her hedefe ayrı delik + çerçeve. Birbirine değen hedefler (yan yana taşlar) tek
       çerçevede birleşir; aralarında boşluk olan hedefler ayrı kalır (çizgiler başka öğeyi kesmez). */
    _drawSpots(rects) {
      const pad = 8;
      let boxes = rects.map((r) => ({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad }));
      for (let merged = true; merged;) {
        merged = false;
        outer: for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], c = boxes[j];
          if (a.l <= c.r && c.l <= a.r && a.t <= c.b && c.t <= a.b) {
            boxes[i] = { l: Math.min(a.l, c.l), t: Math.min(a.t, c.t), r: Math.max(a.r, c.r), b: Math.max(a.b, c.b) };
            boxes.splice(j, 1); merged = true; break outer;
          }
        }
      }
      const holes = this.spotEl.querySelector('.ts-holes'), rings = this.spotEl.querySelector('.ts-rings');
      /* P120 — kutu sayısı değişmediyse mevcut delik/çerçeve yeni yerine KAYAR (CSS geçişi, yalnız #tutSpot.fx) */
      if (!fxOff() && holes.children.length === boxes.length && rings.children.length === boxes.length && boxes.length) {
        this.spotEl.classList.add('fx');
        boxes.forEach((x, i) => {
          const h = holes.children[i], g = rings.children[i];
          Object.assign(h.style, { x: x.l + 'px', y: x.t + 'px', width: (x.r - x.l) + 'px', height: (x.b - x.t) + 'px' });
          Object.assign(g.style, { left: x.l + 'px', top: x.t + 'px', width: (x.r - x.l) + 'px', height: (x.b - x.t) + 'px' });
        });
        return;
      }
      holes.innerHTML = boxes.map((x) => `<rect x="${x.l}" y="${x.t}" width="${x.r - x.l}" height="${x.b - x.t}" rx="14" fill="black"/>`).join('');
      rings.innerHTML = boxes.map((x) => `<div class="ts-ring" style="left:${x.l}px;top:${x.t}px;width:${x.r - x.l}px;height:${x.b - x.t}px"></div>`).join('');
    },

    /* P108 (kullanıcı: işleme adımında Mühür masadaki gruba biniyordu) — yer seçiminde anlatılan
       alanların BİRLEŞİK kutusu değil, HER BİRİ ayrı ölçülür: masa (sağ üst) + ıstaka (alt) birleşince
       ekranın tamamı oluyor, iki aday da "çakışıyor" sayılıp yanlış taraf seçiliyordu. */
    _placePanel(rects) {
      const p = this.panel;
      if (!p || p.classList.contains('hidden')) return;
      const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gm-scale')) || 1;
      const ox = (window.innerWidth - GAME_W * k) / 2, oy = (window.innerHeight - GAME_H * k) / 2;
      p.style.transform = `scale(${k})`;
      const w = p.offsetWidth * k, h = p.offsetHeight * k;
      let x, y;
      if (this.saying) {
        x = (window.innerWidth - w) / 2;
        y = (window.innerHeight - h) / 2;
      } else if (this._pos === 'storeCard3') {
        /* kullanıcı (işaretli ekran görüntüsü): Mühür + balon joker rafının 2. ve 3. kartının bulunduğu alanda
           dursun — panel bu iki kartın ortasına, rafın dikey ortasına oturur (1. kart, satın alınacak olan, açık kalır) */
        const cards = el.storeOverlay.querySelectorAll('#storeRowA .store-item');
        const a = (cards[1] || cards[0]).getBoundingClientRect(), c = (cards[2] || cards[1] || cards[0]).getBoundingClientRect();
        x = (a.left + c.right) / 2 - w / 2;
        y = (a.top + c.bottom) / 2 - h / 2;
        x = Math.min(ox + GAME_W * k - w, Math.max(ox, x));
        y = Math.min(oy + GAME_H * k - h, Math.max(oy, y));
      } else if (this._pos === 'left') {
        x = ox + 20 * k;
        y = oy + 140 * k;   // ⏸ / i düğmelerinin altı (çıkış ⏸ menüsünde, örtülmemeli)
      } else {
        /* denetim3 #3/#6/#7 (kullanıcı: "maskot anlattığı yerin yanında olsun, dikkatim oraya gitsin") —
           eskiden yalnız iki sabit köşe ([1090,50] / [430,50]) vardı; Mühür hedefin zıt köşesinde kalıyordu.
           Artık adaylar hedeflerin HEMEN YANI (sağ/sol/üst/alt, hizalı) + eski köşeler; puan:
           hedefi örtme (çok ağır) > önemli alanları örtme (ıstaka, masa, OKEY, jokerler, puan) > uzaklık. */
        const pr = p.getBoundingClientRect();
        /* P109 — panelin BOŞ köşeleri değil, görünen parçaları (balon, maskot, düğmeler) ölçülür */
        const parts = [...p.children].map((ch) => ch.getBoundingClientRect()).filter((r) => r.width && r.height)
          .map((r) => ({ dx: r.left - pr.left, dy: r.top - pr.top, w: r.width, h: r.height }));
        if (!parts.length) parts.push({ dx: 0, dy: 0, w, h });
        const pad = 12 * k;
        const ovl = ([cx, cy], list, m) => (list || []).reduce((sum, rect) => sum + parts.reduce((acc, q) => {
          const ix = Math.max(0, Math.min(cx + q.dx + q.w, rect.right + m) - Math.max(cx + q.dx, rect.left - m));
          const iy = Math.max(0, Math.min(cy + q.dy + q.h, rect.bottom + m) - Math.max(cy + q.dy, rect.top - m));
          return acc + ix * iy;
        }, 0), 0);
        const tg = (rects || []).filter((r) => r && r.width && r.height);
        const minX = ox, maxX = ox + GAME_W * k - w, minY = oy, maxY = oy + GAME_H * k - h;
        const clamp = ([cx, cy]) => [Math.min(maxX, Math.max(minX, cx)), Math.min(maxY, Math.max(minY, cy))];
        const cands = [[1090, 50], [430, 50]].map(([cx, cy]) => [ox + cx * k, oy + cy * k]);
        let U = null;
        if (tg.length) {
          U = tg.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top),
            right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }),
          { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
          const midY = (U.top + U.bottom) / 2 - h / 2, midX = (U.left + U.right) / 2 - w / 2;
          for (const yy of [U.top, midY, U.bottom - h]) { cands.push([U.right + pad, yy]); cands.push([U.left - w - pad, yy]); }
          for (const xx of [U.left, midX, U.right - w]) { cands.push([xx, U.top - h - pad]); cands.push([xx, U.bottom + pad]); }
          // çapraz köşeler (ör. sol alttaki OKEY kutusu: hemen sağ üstü)
          for (const xx of [U.right + pad, U.left - w - pad]) for (const yy of [U.top - h - pad, U.bottom + pad, U.bottom - h]) cands.push([xx, yy]);
        }
        const tgEls = new Set((this._spotEls || []));
        /* görünür ekranın önemli parçaları: sol sütunun kutuları, ıstaka, masa, raflar, store kartları */
        const scr = storeOpen() ? el.storeOverlay : document.querySelector('.screen:not(.hidden)');
        const leftKids = scr ? [...scr.querySelectorAll('.gm-left > *')] : [];
        /* store'da boş yer yok: öğretici adımlarında gerekmeyen alt satır (değnek/paket) serbest, joker rafı + envanter + DEVAM korunur */
        const storeKids = storeOpen() ? [...el.storeOverlay.querySelectorAll('#storeRowA .store-item, #storeSlotsRow, #storeBackupRow, #btnStoreContinue, .gm-left > *')] : [];
        const tgIn = (e) => [...tgEls].some((t) => t && (t === e || e.contains(t) || t.contains(e)));
        const gameKids = storeOpen() ? [] : [el.rack, el.meldArea, el.okeyChip, el.jokerSlots, $('scorePanel'), el.turnIndicator,
          el.bossBanner, el.btnConfirm, el.btnDiscard, el.btnAddCombo];   // store açıkken arkadaki oyun ekranı sayılmaz
        const avoid = [...gameKids, el.coinChip, ...leftKids, ...storeKids]
          .filter((e) => e && !tgIn(e) && e.offsetParent !== null)
          .map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
        const cx0 = U ? (U.left + U.right) / 2 : 0, cy0 = U ? (U.top + U.bottom) / 2 : 0;
        const score = (c) => ovl(c, tg, 10) * 50 + ovl(c, avoid, 4) * 1
          + (U ? Math.hypot(c[0] + w / 2 - cx0, c[1] + h / 2 - cy0) * 2 : 0);
        [x, y] = cands.map(clamp).reduce((best, c) => (score(c) < score(best) ? c : best));
      }
      const nx = Math.round(x), ny = Math.round(y);
      /* P120 — yer değiştirirken ışınlanmaz: eski yerinden yay çizerek hoplar */
      if (!fxOff() && this._px != null && !this._entering && Math.hypot(nx - this._px, ny - this._py) > 6) {
        const dx = this._px - nx, dy = this._py - ny, K = fxK();
        p.animate([
          { transform: `translate(${dx}px, ${dy}px) scale(${k})` },
          { transform: `translate(${dx / 2}px, ${dy / 2 - 70 * k}px) scale(${k})`, offset: .5 },
          { transform: `translate(0px, 0px) scale(${k})` },
        ], { duration: 460 * K, easing: 'cubic-bezier(.4,.1,.4,1)' });
        const m = p.querySelector('.tm-msc > i');
        m && m.animate([{ transform: 'scale(1.06, .9)' }, { transform: 'scale(.95, 1.06)', offset: .3 },
          { transform: 'scale(1.06, .9)', offset: .9 }, { transform: 'none' }], { duration: 460 * K });
      }
      this._px = nx; this._py = ny;
      p.style.left = nx + 'px';
      p.style.top = ny + 'px';
      this._aim(rects);   // P120 — eylem adımında kol hedefi gösterir
    },

    /* raund kaybedilirse: baştan (öğreticide run bitmez) */
    retryRound() {
      const s = Game.state;
      s.status = 'playing';
      Game._startRound();
      if (s.roundInStage === 1 && !this.seen.has('isleme')) this.seedRound1();
      selection.clear();
      newTileIds.clear();
      dealHand();   // P118
      showScreen('game');
      flushRoundStart();
    },

    /* boss geçildi + ödül çarkları → Mühür son kez konuşur (P92) */
    finish() {
      this.say(T.tut('finish'), [
        { label: t('tutFinishPlay'), fn: () => { this.unsay(); this.end('play'); } },
        { label: t('tutFinishMenu'), ghost: true, fn: () => { this.unsay(); this.end('menu'); } },
      ]);
    },

    /* raund kaybedildi → Mühür teselli eder, raund baştan (P92) */
    lost() {
      this.say(T.tut('lost'), [
        { label: t('tutLostBtn'), fn: () => { this.unsay(); this.retryRound(); this.update(); } },
      ]);
    },

    end(mode) {
      if (!this.active) return;
      this.unsay();
      this.active = false;
      cancelAnimationFrame(this._raf);
      this._hideBalloon();
      if (this.spotEl) this.spotEl.style.opacity = '0';
      el.storeOverlay.classList.add('hidden');
      el.upgradeOverlay.classList.add('hidden');
      el.overlay.classList.add('hidden');
      Game.tutorialMode = false;
      localStorage.setItem('okeyTutDone', '1');
      betaHook('tutorialEnd', { mode, steps: [...this.seen] });
      // gerçek durumu geri yükle — öğretici oyun state'ini bozmaz
      if (this.saved) {
        Game.state = this.saved.state;
        this.saved = null;
      }
      selection.clear();
      newTileIds.clear();
      if (BETA) { showScreen('menu'); showRunPick(); return; }   // beta: öğreticiden sonra doğrudan mod seçimi
      if (mode === 'play') {
        Game.newRun(undefined, { finals: finalJokers() });
        showScreen('map');
        showOkeyBanner();
      } else {
        showScreen('menu');
      }
    },
  };

  el.btnTutorial.addEventListener('click', () => TUT.start());

  /* ---------- Menüler / pause (Grup D) ---------- */

  function startNewRun(mode, seed) { withSplash(() => startNewRunNow(mode, seed)); }   // P118 — giriş splash'i
  function startNewRunNow(mode, seed) {
    if (BETA && loadSave()) betaHook('runAbandoned', { mode: mode || 'base' });
    clearSave();
    Game.newRun(mode, { finals: finalJokers(), seed });   // P114 — seed boşsa motor yenisini üretir
    rpSeedVal = '';
    selection.clear();
    newTileIds.clear();
    showScreen('map');
    /* MADDE D4 — açılış jokerleri varsa ÖNCE çark döner, okey banner'ı
       ondan sonra gelir: iki duyuru üst üste binmesin. */
    const opening = Game.state.openingJokers;
    const proceed = () => Splash.then(() => {   // P118 — duyurular splash bitince
      if (opening && opening.length)
        showOpeningReel(opening, Game.state.openingReels, () => showOkeyBanner());
      else showOkeyBanner(); // maskot okeyi ilan eder (GDD 14.2)
    });
    /* denetim3 #12 (kullanıcı: "Kumarhane'ye girince önce bu run'ın genel ipucu, sonra başlangıç
       jokerlerinin slot makinesi, sonra bahis / mini oyun ipuçları") — ilk Kumarhane run'ında */
    if (Game.kumarhaneOn && Game.kumarhaneOn() && Hints.enabled && !Game.trainerMode && !Hints.seen('kumarhaneRun')) {
      Hints.show('kumarhaneRun', { onClose: proceed });
    } else proceed();
    /* P71 — kalıcı final jokeri run'a katıldı */
    (Game.state.finalJokersGiven || []).forEach((k, i) => {
      const fj = Game.state.jokers.find(j => j.key === k);
      if (fj) setTimeout(() => toast(t('finalStart', T.name(fj), JOKER_DEFS[k].uses, JOKER_DEFS[k].icon), true), 600 + i * 900);
    });
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
  /* P93 (Madde 6, kullanıcı isteği 2026-10-13) — İPUCU PENCERESİNDE MÜHÜR:
     ana menüdeki maskot (mascot.svg, değiştirilmeden) kutunun YANINDA durur,
     ipucunu o söyler — öğreticideki balonla aynı dil (krem balon, Okey Pixel,
     tema düğmesi). `opts.spot` verilirse (manuel joker ipucu) ekran kararır,
     o öğe öğreticideki neon piksel çerçeveyle parlar ve kutu üstünü örtmez. */
  const hintQueue = [];
  function showHintCard(key, opts = {}) {
    if (document.getElementById('hintOv')) { if (!hintQueue.some(q => q.key === key)) hintQueue.push({ key, opts }); return; }
    const ov = document.createElement('div');
    ov.id = 'hintOv';
    ov.className = 'pk-ov hint-ov mh-hint' + (opts.spot ? ' mh-spot' : '');
    ov.dataset.hint = key;
    ov.innerHTML =
      `<div class="mh-wrap"><div class="mh-msc"><i></i></div>` +
      `<div class="mh-col"><div class="mh-bub"><div class="mh-tag">💡 ${t('hintTitle')}</div>` +
      `<div class="hint-body">${opts.html || t('hint_' + key)}</div></div>` +
      `<button class="tm-btn mh-ok" id="hintOk">${t('hintOk')}</button></div></div>`;
    let spot = null;
    if (opts.spot) {
      TUT._dom();
      spot = TUT.spotEl;
      spot.classList.add('mh-spotting');
      TUT._drawSpots([opts.spot.getBoundingClientRect()]);   // P109 — öğreticiyle aynı çerçeve
      TUT._spotKey = null;
      spot.style.opacity = '1';
    }
    const close = () => {
      ov.remove();
      if (spot) { spot.style.opacity = '0'; spot.classList.remove('mh-spotting'); }
      if (opts.onClose) { try { opts.onClose(); } catch (e) {} }   // denetim3 #12 — ipucundan sonra sıradaki sahne
      const next = hintQueue.shift();
      if (next) setTimeout(() => showHintCard(next.key, next.opts), 120);
      else if (curScreen() === 'game') setTimeout(maybeManualHint, 150);
    };
    ov.querySelector('#hintOk').addEventListener('click', () => { SFX.tick(); close(); });
    document.body.appendChild(ov);
  }

  /* ============================================================
     P93 · MADDE 3 (kullanıcı kararı 2026-10-13) — ELLE KULLANILAN JOKER İPUCU.
     Bu jokerlerden biri ana slottayken (Füzyon kartının içinde de olabilir)
     raund oyun ekranında oynanırken, o joker için ipucu ilk kez çıkar:
     oyuncunun İLK manuel jokeri tam anlatımı alır (karta gel + sol tık),
     sonrakiler kısa "bu da elle kullanılır" ipucunu. Ömür boyu bir kez
     (Hints deposu, Ayarlar › Ekstra › İpuçları ile sıfırlanır); Trainer'da,
     öğreticide, harita/store'da ve başka bir pencere açıkken çıkmaz.
     Yeni bir elle kullanılan joker eklenince yalnız MANUAL_JOKERS'a yazılır.
     ============================================================ */
  const MANUAL_JOKERS = ['ayna', 'satrancSaati', 'rusvet', 'terazi', 'paratoner', 'fuzyon', 'orion', 'hileliZar'];
  const HINT_BLOCKERS = '#hintOv, .pk-ov, .ep-ov, .belt-ov, #fuzyonMenu, #fuzyonPick, #pandoraOv, #useChooser, '
    + '#ritimOv, #kumarOv, #terziPick, #okeySlotPick, #tutResume, #dolunayFx';
  function maybeManualHint() {
    const s = Game.state;
    if (!Hints.enabled || Game.trainerMode || Game.tutorialMode || TUT.active) return;
    if (!s || s.status !== 'playing' || curScreen() !== 'game' || storeOpen() || upgradeOpen()) return;
    if (!el.overlay.classList.contains('hidden') || document.querySelector(HINT_BLOCKERS)) return;
    for (const j of s.jokers) {
      for (const r of [j, ...(j.fused || [])]) {
        if (!MANUAL_JOKERS.includes(r.key) || Hints.seen('manual_' + r.key)) continue;
        const card = document.querySelector(`#gameScreen .joker-tile[data-jid="${j.id}"]`);
        if (!card) return;
        const first = !Hints.seen('manual');
        Hints.mark('manual');
        Hints.show('manual_' + r.key, {
          html: first ? t('hint_manualFirst', T.name(r)) : t('hint_manualNext', T.name(r)), spot: card });
        return;
      }
    }
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
    /* P93 — göstermeden "görüldü" işaretle (manuel joker: ilk anlatım yapıldı) */
    mark(key) {
      const set = this._read();
      set.add(key);
      try { localStorage.setItem(HINTS_KEY, JSON.stringify([...set])); } catch (e) {}
    },
    /* Bir ipucunu bir kez göster. `key` i18n'de `hint_<key>` olarak durur
       (P93: `opts.html` hazır metin, `opts.spot` parlatılacak öğe). */
    show(key, opts) {
      if (!this.enabled || Game.trainerMode || TUT.active) return false;
      if (this._read().has(key)) return false;
      this.mark(key);
      showHintCard(key, opts);
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
    /* LANETLİ BOYUT (kullanıcı onayı 2026-10-28) — yalnız prototipte; beta'da "yakında" kalır */
    BETA ? { key: 'soon3', soon: true } : { key: 'lanetli', ico: '🜏' },
    { key: 'soon4', soon: true },
    { key: 'soon5', soon: true }, { key: 'soon6', soon: true },
  ];
  let runPickIdx = 0;
  let rpSeedVal = '';   // P114 — sekme / karusel yeniden çizilince yazılan seed kaybolmasın
  function showRunPick(opts = {}) {
    document.getElementById('runPickOv')?.remove();
    document.getElementById('modePickOv')?.remove();
    const save = 'save' in opts ? opts.save : loadSave();
    const onPick = opts.onPick || ((m, seed) => startNewRun(m, seed));
    let tab = opts.tab || (save ? 'cont' : 'new');
    let sv = null;
    try { sv = save ? JSON.parse(save.data) : null; } catch (e) { sv = null; }
    if (!sv) tab = 'new';   // okunamayan kayıt: Devam Et sekmesi sv.runMode'da çöküyordu
    const ov = document.createElement('div');
    ov.id = 'runPickOv';
    ov.className = 'ep-ov rp-ov';
    document.body.appendChild(ov);
    const onKey = (e) => {
      if (!document.body.contains(ov)) { document.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.target && e.target.id === 'rpSeed' && e.key !== 'Enter') return;   // P114 — seed yazılırken oklar imleci oynatır
      else if (e.key === 'ArrowLeft' && tab === 'new') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight' && tab === 'new') { e.preventDefault(); go(1); }
      else if (e.key === 'Enter') { e.preventDefault(); ov.querySelector('#rpGo:not([disabled])')?.click(); }
    };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    const isOpen = (p) => !p.soon && Modes.unlocked(p.key);
    const go = (d) => { runPickIdx = (runPickIdx + d + RUN_PAGES.length) % RUN_PAGES.length; draw(); };
    const play = (key) => { const sd = (ov.querySelector('#rpSeed') || {}).value || ''; close(); onPick(key, sd.trim() || undefined); };
    const cont = () => {
      close();
      resumeSave(save);
      /* kullanıcı 2026-10-29: "Run kaldığı yerden devam ediyor" gibi bilgi bildirimleri kalktı */
    };
    const slide = (p, i) => {
      const open = isOpen(p);
      const name = p.soon ? t('rpSoonName') : t('rpName_' + p.key);
      const desc = p.soon ? t('rpSoonDesc') : (open ? t('rpDesc_' + p.key) : (t('modeLockedTip_' + p.key) || t('modeLockedTip')));
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
        /* P114 (kullanıcı onayı: Balatro gibi seed) — isteğe bağlı seed; girilirse istatistik / keşif / kilit sayılmaz */
        foot = `<div class="rp-seed"><span class="rp-seed-lbl">${t('seedLabel')}</span>`
          + `<input id="rpSeed" class="rp-seed-in" maxlength="16" placeholder="${t('seedPh')}" autocomplete="off" spellcheck="false" value="${rpSeedVal}"></div>`
          + `<div class="ep-note rp-seed-note${rpSeedVal ? '' : ' hidden'}">${t('seedNote')}</div>`
          + `<button class="ep-btn rp-go" id="rpGo"${isOpen(p) ? '' : ' disabled'}>${p.soon ? t('rpSoon') : t('rpPlay')}</button>`
          + (sv && isOpen(p) ? `<div class="ep-note rp-warn">${t('rpOverwrite')}</div>` : '');
      } else {
        const mode = sv.runMode || 'base';
        const pg = RUN_PAGES.find(q => q.key === mode) || RUN_PAGES[0];
        const total = (typeof RUN_MODES !== 'undefined' && RUN_MODES[mode]) ? RUN_MODES[mode].stages : 8;
        const totalShown = total + ((typeof RUN_MODES !== 'undefined' && RUN_MODES[mode] && RUN_MODES[mode].finalBoss) ? 1 : 0);   // P71
        const svFinal = sv.stage > total && !!(typeof RUN_MODES !== 'undefined' && RUN_MODES[mode] && RUN_MODES[mode].finalBoss);   // P71
        const where = save.where === 'inStore' ? 'inStore' : save.where === 'inRound' ? (save.mid ? 'inRoundMid' : 'inRound') : 'map';   // denetim RK
        body = `<div class="rp-slide on rp-cont">` + (pg.img ? `<div class="rp-art rp-art-img mode-${pg.key}"></div>` : `<div class="rp-art"><span>${pg.ico || '🀄'}</span></div>`)
          + `<div class="rp-info"><div class="rp-name">${t('rpName_' + mode)}</div>`
          + `<div class="rp-desc rp-sum">`
          + `<div><span>${t('rpStage')}</span><b>${svFinal ? t('stageFinal') : sv.stage + '/' + totalShown}</b></div>`
          + `<div><span>${t('rpRound')}</span><b>${svFinal ? t('mapFinal') : sv.roundInStage + '/3'}</b></div>`
          + `<div><span>${t('rpCoins')}</span><b class="c-orange">${sv.coins}</b></div>`
          + `<div><span>${t('rpBest')}</span><b class="c-red">${sv.statBestMeld || 0}</b></div>`
          + `<div><span>${t('rpMult')}</span><b class="c-green">+${Number(sv.permMult || 0).toFixed(1)}x</b></div>`
          + `</div></div></div>`
          + `<div class="rp-where">${t('rpWhere_' + where)}</div>`;
        foot = `<button class="ep-btn rp-go" id="rpGo">${t('rpContinueBtn')}</button>`;
      }
      ov.innerHTML = `<div class="ep-box rp-box"><div class="rp-plate">${t('modePickTitle')}</div>${tabs}<div class="rp-body">${body}</div>`
        + `<div class="rp-foot">${foot}<button class="ep-btn ep-blue rp-back" id="rpBack">${t('rpBack')}</button></div></div>`;
      ov.querySelectorAll('.rp-tab').forEach(b => b.addEventListener('click', () => { if (!b.disabled) { tab = b.dataset.tab; draw(); } }));
      ov.querySelectorAll('.rp-arrow').forEach(b => b.addEventListener('click', () => go(+b.dataset.d)));
      ov.querySelectorAll('.rp-dots i').forEach(b => b.addEventListener('click', () => { runPickIdx = +b.dataset.i; draw(); }));
      /* kullanıcı (2026-10-04): karta/açıklamaya tıklamak oyunu BAŞLATMAZ — yalnız seçer; başlatan OYNA */
      ov.querySelectorAll('.rp-slide.mp-card').forEach(b => b.addEventListener('click', () => { runPickIdx = +b.dataset.i; draw(); }));
      ov.querySelector('#rpBack').addEventListener('click', close);
      const sIn = ov.querySelector('#rpSeed');
      if (sIn) sIn.addEventListener('input', () => {
        sIn.value = sIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        rpSeedVal = sIn.value;
        ov.querySelector('.rp-seed-note')?.classList.toggle('hidden', !sIn.value);
      });
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
  /* kullanıcı 2026-10-29 — slot şeridi kartların ÇİZİMLERİYLE döner (joker, değnek, özel taş); çizimi olmayan simgeyle */
  function reelFaceHtml(x) {
    if (x.converted) return packFaceHtml(x);
    if (x.type === 'joker' && JOKER_ART.has(x.key)) return `<div class="col-jk-art jk-${x.key} reel-art"></div>`;
    if (x.type === 'consum' && CONSUM_ART.has(x.key)) return `<div class="reel-art cs-art cs-${x.key}"></div>`;
    if (x.type === 'joker' || x.type === 'consum') return `<div class="reel-ico">${x.type === 'joker' ? jokerIcon(x.key) : x.icon}</div><div class="pk-name">${x.type === 'joker' ? T.name(x) : T.consumName(x.key, x.name)}</div>`;
    return `<div class="reel-art sp-art-sm sp-${x.kind}"></div>`;
  }
  function buildReel(reel) {
    const wrap = document.createElement('div');
    wrap.className = 'pk-reel';
    const strip = document.createElement('div');
    strip.className = 'pk-strip';
    const cell = (sym) => {
      const c = document.createElement('div');
      c.className = `pk-sym r-${sym.rarity || 'special'}`;
      c.innerHTML = reelFaceHtml(sym);
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

  /* P109 (kullanıcı: "slot machine'lerin stop tuşunu kaldıralım, rastgele oyun versin") — STOP
     düğmesi KALKTI: STOP'la orta çizgide duran ödül motorda değişiyor ama arkadaki ekran eski
     ödülü gösteriyordu. Çarklar artık hep kendileri durur (motorun seçtiği ödül). */

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
    loopReels(pkItems(els, null), { onDone: finish });   // P109 — STOP yok
    function finish() {
      foot.innerHTML = '';
      // açıklamalı sonuç kartları — paket çarkındakiyle aynı
      const rw = document.createElement('div');
      rw.className = 'pk-result';
      list.forEach((x, i) => {
        const c = document.createElement('div');
        c.className = `pk-rcard r-${x.rarity || 'special'}`;
        c.style.animationDelay = `${i * 0.09}s`;
        /* P121 (kullanıcı 2026-10-30) — ad/açıklama kartta yazmaz, üstüne gelince ipucunda */
        const hasArt = (x.type === 'joker' || !x.type) && JOKER_ART.has(x.key);
        c.innerHTML = hasArt ? reelFaceHtml(x) : packFaceHtml(x);
        packTip(c, x);
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

  function resumeSave(save) { withSplash(() => resumeSaveNow(save)); }   // P118 — giriş splash'i
  function resumeSaveNow(save) {
    try {
      Game.restore(save.data);
    } catch (e) {
      betaHook('saveIncompatible', { message: String(e && e.message), stack: String(e && e.stack) });
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
    } else if (save.mid && s.status === 'playing' && !(Game.needsBet && Game.needsBet())) {
      /* denetim RK — raund ortası kayıt: kaldığı turdan devam. Bekleyen karar pencereleri
         (Şeytan/Boşluk/Tüccar duyurusu, Katla, Rulet, yan bahis) yeniden açılır; Üç Kağıtçı,
         Tanrının Eli ve Hayalet teklifi render içinde zaten açılır. */
      dealHand();   // P118
      showScreen('game');
      render();
      flushRoundStart();
      if (s.katlaOffer) setTimeout(showKatlaOffer, 400);
      else setTimeout(kumarStartPanels, 600);
    } else if (save.mid && s.status === 'won' && !s.runFinished) {
      /* denetim RK — kazanılmış raundun zafer penceresinde bırakıldı (Kumarhane: raund arası
         store yok) → "Devam" ile aynı yol: sonraki raunda geçilir. */
      goNextRound();
    } else {
      showScreen('map');
    }
  }

  /* P62 — OYNA: tek panel (Yeni Run / Devam Et). Eskiden kayıt store'da ya da
     raund içindeyse SORMADAN devam ediyor, raund arasındaysa ayrı bir beyaz
     kutu açıyordu; artık her durumda aynı ekran — kayıt varsa Devam Et
     sekmesi açık gelir. */
  el.btnPlay.addEventListener('click', () => {
    if (BETA && !localStorage.getItem('okeyTutDone')) { TUT.start(); return; }   // beta: ilk Oyna = öğretici
    showRunPick();
  });

  /* GRUP I (2026-09-07): haritadaki "Ana Menü" düğmesi kaldırıldı —
     tasarımda yok. Ana menüye artık haritanın DURAKLAT düğmesindeki
     menüden gidilir; menü oyun ekranındakinin birebir eşi. Ses ayarları
     P67'den beri yalnız Ayarlar penceresinde. */
  el.btnMapPause.addEventListener('click', (e) => {
    e.stopPropagation();
    el.btnMapGoMenu.textContent = pauseGoLabel();
    el.mapMenuPop.classList.toggle('hidden');
    fitMapPauseMenu();
  });
  document.addEventListener('click', (e) => {
    if (!el.mapMenuPop.contains(e.target)) el.mapMenuPop.classList.add('hidden');
  });
  el.btnMapGoMenu.addEventListener('click', () => {
    el.mapMenuPop.classList.add('hidden');
    if (TUT.active) { TUT.end('menu'); return; }
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
      $('btnStoreGoMenu').textContent = pauseGoLabel();
      pop.classList.toggle('hidden');
      pop.querySelectorAll('.btn').forEach(b => fitText(b, PAUSE_BASE, PAUSE_MIN, true));
    });
    document.addEventListener('click', (e) => { if (!pop.contains(e.target)) pop.classList.add('hidden'); });
    $('btnStoreGoMenu').addEventListener('click', () => {
      pop.classList.add('hidden');
      el.storeOverlay.classList.add('hidden');
      if (TUT.active) { TUT.end('menu'); return; }
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

  /* P92 (kullanıcı kararı 2026-10-13) — öğreticiden çıkış Mühür'ün yanında
     değil ⏸ menüsünde: öğretici sürerken üç menünün (oyun / harita / store)
     "Ana Menüye Dön" düğmesi "Öğreticiyi Bitir" olur. */
  const pauseGoLabel = () => t(TUT.active ? 'tutSkip' : 'pauseMainMenu');
  el.btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    el.btnGoMenu.textContent = pauseGoLabel();
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
    { key: 'hizli', requires: null, gate: 'base' },   // beta: Orion yenilince açılır
    /* LANETLİ BOYUT — kullanıcı: "Kumarhane Run'dan sonra kilidi açılacak"; prototipte her şey açık
       (oyun-modlari-yol-haritasi), beta'da mod zaten gizli */
    { key: 'lanetli', requires: null, gate: 'hizli' },
  ];
  /* `gate` — kilit zinciri: betada her zaman, prototipte yalnız Ayarlar › Ekstra › MOD KİLİDİ (TEST)
     açıkken uygulanır (kullanıcı 2026-10-29: "normal oyna menüsünde modları kilitleme, yalnız Kozmik açık;
     bir de kilidi açma seçeneği — test edeceğim"). Prototipte varsayılan kapalı: her şey açık kalır. */
  const MODE_LOCK_KEY = 'okeyModeLockTest';
  const modeLockOn = () => !!BETA || (() => { try { return localStorage.getItem(MODE_LOCK_KEY) === '1'; } catch (e) { return false; } })();

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
      const req = m.requires || (modeLockOn() ? m.gate : null);
      if (m.never || !req) return true;
      return this.done(req);
    },
    /* Ekstra › MOD KİLİDİ (TEST) adımları: off = kilit yok · kozmik = yalnız Kozmik açık ·
       kumarhane = Kozmik bitmiş say (Kumarhane açılır) · hepsi = Kumarhane de bitmiş say (Lanetli açılır) */
    testStep() {
      if (!modeLockOn()) return 'off';
      return this.done('hizli') ? 'hepsi' : this.done('base') ? 'kumarhane' : 'kozmik';
    },
    setTestStep(v) {
      try { localStorage.setItem(MODE_LOCK_KEY, v === 'off' ? '0' : '1'); } catch (e) { /* yok */ }
      if (v !== 'off') {
        const st = this._read();
        if (v === 'kozmik') { delete st.base; delete st.hizli; }
        if (v === 'kumarhane') { st.base = true; delete st.hizli; }
        if (v === 'hepsi') { st.base = true; st.hizli = true; }
        this._write(st);
      }
      this.applyLocks();
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

  /* P71 — KALICI FİNAL ÖDÜLLERİ. Mod kilit defteriyle aynı yöntem; motor
     yalnız anahtar listesini alır (Game.newRun(mode, { finals })). */
  const FINALS_KEY = 'okeyFinals';
  const Finals = {
    _read() { try { return JSON.parse(localStorage.getItem(FINALS_KEY)) || {}; } catch (e) { return {}; } },
    has(k) { return !!this._read()[k]; },
    list() { return Object.keys(this._read()); },
    unlock(k) {
      const o = this._read();
      if (o[k]) return false;
      o[k] = { at: Date.now() };
      try { localStorage.setItem(FINALS_KEY, JSON.stringify(o)); } catch (e) {}
      return true;
    },
    /* P90d — Ayarlar › Ekstra test kutusu: tek bir finali yeniden kilitle */
    lock(k) {
      const o = this._read();
      if (!o[k]) return false;
      delete o[k];
      try { localStorage.setItem(FINALS_KEY, JSON.stringify(o)); } catch (e) {}
      return true;
    },
  };

  /* P86 (kullanıcı 2026-10-08) — FİNAL BOSS JOKERİ ayarı: açık kalıcı final jokerleri
     her yeni run'a elde başlar (P71 davranışı, varsayılan AÇIK); kapalıyken verilmez.
     Kilit (okeyFinals) etkilenmez, ayar yalnız run başında okunur. */
  const FINAL_JOKER_KEY = 'okeyFinalJoker';
  let finalJokerOn = (() => { try { return localStorage.getItem(FINAL_JOKER_KEY) !== '0'; } catch (e) { return true; } })();
  function finalJokers() { return finalJokerOn ? Finals.list() : []; }

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
  /* P101 (kullanıcı isteği 2026-10-14) — Çayır (yesil) seçiciden KALKTI;
     varsayılan ve eski 'yesil' kaydı artık Gece (lacivert). CSS'teki yeşil
     temel yol (öznitelik yazmayan) kumarhane/kozmik dışı hiçbir ekranda
     kullanılmaz ama silinmedi: run temaları ve eski seçiciler ona dayanır. */
  const THEMES = [
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
    return 'lacivert';
  }

  let themeKey = readTheme();

  function applyTheme(key, persist = true) {
    if (!THEMES.some(x => x.key === key)) key = 'lacivert';
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
  /* P74 — KUMARHANE DESENİ (kullanıcı 2026-10-07): masa zemini için alternatif
     desen; Ayarlar'dan seçilir. P76: eski 'cuha' (yeşil çuha + silik kart
     simgeleri) kullanıcı isteğiyle KALDIRILDI; kayıtlı 'cuha' seçimi
     varsayılana (Kraliyet) düşer.
     'kraliyet' = ton üstüne ton iskambil desenli çuha (VARSAYILAN; temanın
     temel zemini, tools/theme/build_royal_felt.py),
     'deco' = art deco yeşil-altın (tools/theme/build_art_deco.py; Vegas halısı,
     blackjack yayı ve masa çerçevesi beğenilmedi). */
  const CASINO_PATTERN_KEY = 'okeyCasinoPattern';
  const CASINO_PATTERNS = ['kraliyet', 'deco'];
  let casinoPattern = (() => { try { const v = localStorage.getItem(CASINO_PATTERN_KEY); return CASINO_PATTERNS.includes(v) ? v : 'kraliyet'; } catch (e) { return 'kraliyet'; } })();
  function casinoRunActive() {
    try { return curScreen() !== 'menu' && !!Game.state && !!Game.kumarhaneOn && Game.kumarhaneOn(); } catch (e) { return false; }
  }
  /* P72 — KOZMİK TEMA (kullanıcı 2026-10-06): Temel Run'a özel; Kumarhane
     temasıyla aynı kalıp. Bulutsu rengi stage'e göre kayar (yolculuk). */
  const COSMIC_THEME_KEY = 'okeyCosmicTheme';
  let cosmicThemeOn = (() => { try { return localStorage.getItem(COSMIC_THEME_KEY) !== '0'; } catch (e) { return true; } })();
  /* S1 mor → S2 çivit → S3 camgöbeği → S4 deniz yeşili → S5 macenta → S6 kızıl → S7 turuncu → S8 altın */
  const KOZMIK_HUES = [0, -45, -90, -140, 45, 80, 110, 140];
  function baseRunActive() {
    try { return curScreen() !== 'menu' && !!Game.state && !(Game.kumarhaneOn && Game.kumarhaneOn()); } catch (e) { return false; }
  }
  /* P78 — BOSS RAUNDU ARAYÜZLERİ (kullanıcı 2026-10-07): boss raundunun oyun
     ekranı o boss'un temasına geçer — kendi 3 tonlu paleti + SÜRREAL arka plan
     (tools/theme/build_boss_ui.py; style.css @@BOSS-UI blokları). Run temasının
     (Kumarhane / Kozmik / renk teması) ÜSTÜNDEdir; harita ve store run temasında
     kalır. Ayarlar → BOSS ARAYÜZÜ ile kapatılabilir (varsayılan açık).
     Boss karakter çizimleri Figma'dan gelince arka planlar onlara göre yenilenecek. */
  const BOSS_UI_KEY = 'okeyBossUi';
  const BOSS_UI_KEYS = new Set(['godzilla', 'karaKedi', 'kirby', 'cellat', 'misunderstood', 'kelebek', 'ahtapot', 'fatality', 'zombie', 'freedom', 'uzayli', 'ucKagitci', 'dervish', 'terziIgne', 'avukat', 'ritim', 'kahin', 'tuccar', 'corporates', 'aynaKral', 'ladyLuck', 'orion', 'lanetliCocuk']);
  let bossUiOn = (() => { try { return localStorage.getItem(BOSS_UI_KEY) !== '0'; } catch (e) { return true; } })();
  function bossUiActive() {
    try {
      const s = Game.state;
      if (!bossUiOn || curScreen() !== 'game' || !s || !s.boss || !Game.isBossRound()) return null;
      return BOSS_UI_KEYS.has(s.boss.key) ? s.boss.key : null;
    } catch (e) { return null; }
  }
  /* P101 — LADY LUCK SAHNE DETAYLARI (kullanıcı onayı 2026-10-15; Gemini
     örneğinin abartısız hâli): karakterin ETRAFINDA ağır akan duman şeritleri
     (ağızdan değil — ilk örnek reddedildi) + yerde ince sis, ruletin çevresinde
     göz kırpan ışıltılar, zar/kart/fişlerde nefes alan altın parıltı. Yalnız CSS
     animasyonu (filtre animasyonu yok, bkz. P84). Koordinatlar 1920 tuvali. */
  const BOSS_FX = {
    ladyLuck() {
      const rb = (d, w, a, dur, delay, cls = '') =>
        `<path class="bf-rb ${cls}" d="${d}" style="stroke-width:${w};--a:${a};animation-duration:${dur}s;animation-delay:${delay}s"/>`;
      const svg = (inner) => `<svg class="bf-svg" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true"><g filter="url(#bfBlur)">${inner}</g></svg>`;
      const back = `<svg width="0" height="0" style="position:absolute"><defs><filter id="bfBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs></svg>`
        + svg(rb('M1120 600 C 1240 520, 1330 610, 1440 540 S 1600 470, 1700 520', 34, .42, 9, 0)
          + rb('M1150 470 C 1260 400, 1300 470, 1380 400 S 1500 330, 1560 380', 22, .34, 11, -3)
          + rb('M860 620 C 760 560, 690 640, 600 570 S 440 520, 330 590', 34, .40, 10, -2)
          + rb('M820 430 C 730 380, 700 440, 620 380 S 520 310, 470 350', 20, .32, 12, -6));
      const sparks = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.3, r = 255 + (i % 3) * 18;
        const x = 990 + Math.cos(a) * r, y = 205 + Math.sin(a) * r * 0.92;
        return y > 560 ? '' : `<i class="bf-spark" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--d:${((i * 0.37) % 2.4).toFixed(2)}s;--k:${(0.7 + (i % 3) * 0.2).toFixed(2)}"></i>`;
      }).join('');
      const glows = [[452, 218, 62], [1523, 155, 62], [603, 500, 62], [668, 312, 48], [1300, 368, 48], [1684, 578, 46], [1380, 260, 34], [452, 540, 34], [220, 580, 34]]
        .map(([x, y, r], i) => `<i class="bf-glow" style="left:${x}px;top:${y}px;--r:${r}px;--d:${(i * 0.45).toFixed(2)}s"></i>`).join('');
      const front = glows + sparks + svg(rb('M260 690 C 520 650, 760 720, 1000 680 S 1400 650, 1700 700', 46, .20, 14, -4, 'mist')
        + rb('M1000 760 C 1120 720, 1200 760, 1300 720', 26, .18, 8, -1));
      return { back, front };
    },
  };
  function syncBossFx(boss) {
    const stage = document.querySelector('#gameScreen .gm-stage');
    if (!stage) return;
    const cur = stage.querySelector('#bossFxBack');
    if (cur && cur.dataset.boss === boss) return;
    stage.querySelectorAll('#bossFxBack, #bossFx').forEach((e) => e.remove());
    const make = boss && BOSS_FX[boss];
    if (!make) return;
    const { back, front } = make();
    const b = document.createElement('div'); b.id = 'bossFxBack'; b.dataset.boss = boss; b.innerHTML = back;
    const f = document.createElement('div'); f.id = 'bossFx'; f.innerHTML = front;
    stage.prepend(f); stage.prepend(b);
  }
  function applyRunTheme() {
    let key, boss = null;
    try {
      boss = bossUiActive();
      key = boss ? 'boss'
        : casinoThemeOn && casinoRunActive() ? 'kumarhane'
        : cosmicThemeOn && baseRunActive() ? 'kozmik' : themeKey;
    } catch (e) { return; }   // modül kurulumu bitmeden çağrıldıysa (TDZ)
    const root = document.documentElement;
    if (root.dataset.csPattern !== casinoPattern) root.dataset.csPattern = casinoPattern;
    if (boss) { if (root.dataset.bossUi !== boss) root.dataset.bossUi = boss; }
    else if (root.dataset.bossUi) delete root.dataset.bossUi;
    syncBossFx(boss);
    if (key === 'yesil') { if (root.dataset.theme) delete root.dataset.theme; }
    else if (root.dataset.theme !== key) root.dataset.theme = key;
    const lanet = key === 'kozmik' && !!(Game.lanetliOn && Game.lanetliOn());
    if (lanet) {
      if (root.dataset.run !== 'lanetli') root.dataset.run = 'lanetli';
      /* sürreal zemin stage'le çürür: S1-2 → 1, S3-4 → 2, S5-6 → 3 */
      const dc = String(Math.min(3, Math.ceil(Math.max(1, (Game.state && Game.state.stage) || 1) / 2)));
      if (root.dataset.lbDecay !== dc) root.dataset.lbDecay = dc;
      const sc = curScreen();
      if (root.dataset.lbScreen !== sc) root.dataset.lbScreen = sc;
    } else {
      if (root.dataset.run) delete root.dataset.run;
      if (root.dataset.lbDecay) delete root.dataset.lbDecay;
      if (root.dataset.lbScreen) delete root.dataset.lbScreen;
    }
    if (key === 'kozmik' && !lanet) {
      const st = Math.max(1, (Game.state && Game.state.stage) || 1);
      /* denetim3 #25 — eskiden (st-1) % 8: Stage 9 (Orion finali) ve Sonsuz Mod S1'in moruna
         geri dönüyordu, yolculuk bozuluyordu. Son durak (S8 altın) korunur. */
      root.style.setProperty('--kz-hue', KOZMIK_HUES[Math.min(st, KOZMIK_HUES.length) - 1] + 'deg');
    }
  }

  /* index.html <head> içindeki satır temayı ilk boyamadan önce zaten
     uyguladı; burada yalnız modül durumunu onunla hizalıyoruz. */
  applyTheme(themeKey, false);

  /* P88 — KALICI İSTATİSTİKLER (kullanıcı 2026-10-08: "Balatro'daki gibi o ana kadarki
     tüm statlarımızı görelim"). Run içi sayaçlar (statBestMeld, statTypes,
     statTilesMelded …) run bitince kayboluyordu; runLog da yalnız o run'ı tutar.
     Burada her RAUND SONUNDA run sayaçlarının o ana kadarki FARKI kalıcı kayda
     (okeyStats) eklenir — run yarıda bırakılsa da sayılır, iki kez sayılmaz
     (state.lsSnap). Run sonu (kazanç/kayıp) run sayısı + seri. Trainer ve
     öğretici yazmaz (kayıt kuralı). Sayım bu güncellemeyle başladı (o.since). */
  const STATS_KEY = 'okeyStats';
  const LStats = {
    read() { try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch (e) { return {}; } },
    _w(o) { try { localStorage.setItem(STATS_KEY, JSON.stringify(o)); } catch (e) {} },
    off() { return !!(Game.trainerMode || Game.tutorialMode || TUT.active || (Game.state && Game.state.seeded)); },   // P114: seed'li run sayılmaz
    _sync(o, s) {
      const snap = s.lsSnap || (s.lsSnap = { types: {}, tiles: 0, disc: 0, bought: 0, rr: 0 });
      o.types = o.types || {};
      for (const [k, v] of Object.entries(s.statTypes || {})) {
        const d = (v || 0) - (snap.types[k] || 0);
        if (d > 0) o.types[k] = (o.types[k] || 0) + d;
        snap.types[k] = v || 0;
      }
      const add = (key, cur, sk) => { const d = (cur || 0) - (snap[sk] || 0); if (d > 0) o[key] = (o[key] || 0) + d; snap[sk] = cur || 0; };
      add('tiles', s.statTilesMelded, 'tiles');
      add('disc', s.statDiscarded, 'disc');
      add('bought', s.statBought, 'bought');
      add('rerolls', s.statRerolls, 'rr');
      o.bestMeld = Math.max(o.bestMeld || 0, s.statBestMeld || 0);
      o.maxCoins = Math.max(o.maxCoins || 0, s.coins || 0);
      o.bestScore = Math.max(o.bestScore || 0, s.totalScore || 0);
      if (!o.since) o.since = Date.now();
    },
    round(s, won) {
      if (this.off() || !s) return;
      const o = this.read();
      /* denetim SY-11 — raund sonu yazılır ama oyun kaydı ancak store/harita açılınca alınır: arada
         sayfa yenilenirse raund kayıttan baştan oynanır ve İKİNCİ kez sayılıyordu. Aynı run + aynı
         raund (seed + roundSerial) bir kez sayılır. */
      const rk = `${s.seed || ''}:${s.roundSerial || 0}`;
      if (s.seed && o.lastRound === rk) { this._sync({ types: {} }, s); return; }   // yalnız lsSnap ilerler, kalıcı kayda eklenmez
      o.lastRound = rk;
      this._sync(o, s);
      o.rounds = (o.rounds || 0) + 1;
      if (won) o.roundsWon = (o.roundsWon || 0) + 1;
      const fin = Game.isFinalStage && Game.isFinalStage();
      o.bestStage = Math.max(o.bestStage || 0, s.stage || 0);
      o.bestRound = Math.max(o.bestRound || 0, (s.stage - 1) * 3 + (fin ? 1 : s.roundInStage));
      if (won && Game.isBossRound() && s.boss) {
        o.bosses = (o.bosses || 0) + 1;
        o.bossKeys = o.bossKeys || {};
        o.bossKeys[s.boss.key] = (o.bossKeys[s.boss.key] || 0) + 1;
      }
      this._w(o);
    },
    run(s, won) {
      if (this.off() || !s || s.lsRunDone) return;     // Sonsuz Mod'da ikinci kez sayılmaz
      const o = this.read();
      this._sync(o, s);
      o.runs = (o.runs || 0) + 1;
      if (won) { o.runsWon = (o.runsWon || 0) + 1; o.streak = (o.streak || 0) + 1; } else o.streak = 0;
      o.bestStreak = Math.max(o.bestStreak || 0, o.streak || 0);
      const m = s.runMode || 'base';
      o.modes = o.modes || {};
      o.modes[m] = o.modes[m] || { runs: 0, won: 0 };
      o.modes[m].runs++;
      if (won) o.modes[m].won++;
      s.lsRunDone = true;
      this._w(o);
    },
  };

  /* İSTATİSTİK sekmesi — Balatro'nun iki sütunu (rekorlar · ilerleme), bizim
     oyun sonu paneli satırlarıyla (ep-row: açık etiket + koyu değer kutusu). */
  function statsPane() {
    const o = LStats.read();
    const fmt = (n) => Number(n || 0).toLocaleString(T.lang === 'en' ? 'en-US' : 'tr-TR');
    const most = Object.entries(o.types || {}).sort((a, b) => b[1] - a[1])[0];
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const bar = (label, a, b) => {
      const p = pct(a, b);
      return `<div class="ep-row st-prog"><span class="ep-lbl">${label}</span>` +
        `<span class="ep-val st-bar" style="--p:${p}%">${p}% <i>(${a}/${b})</i></span></div>`;
    };
    const jokTotal = Object.keys(JOKER_DEFS).length;
    const jokOwned = [...ownedEver].filter((k) => JOKER_DEFS[k]).length;
    const bossTotal = BOSSES.length;
    const bossBeat = Object.keys(o.bossKeys || {}).filter((k) => BOSSES.some((b) => b.key === k)).length;
    const modeKeys = Game.runModeKeys ? Game.runModeKeys() : ['base'];
    const modeDone = modeKeys.filter((k) => Modes.done(k) || (o.modes && o.modes[k] && o.modes[k].won)).length;
    const finTotal = Object.keys(typeof FINAL_BOSSES !== 'undefined' ? FINAL_BOSSES : {}).filter((k) => !(BETA && k === 'lanetliCocuk')).length;   // betada Lanetli Boyut yok
    const finDone = Finals.list().length;
    const prog = Math.round((pct(jokOwned, jokTotal) + pct(bossBeat, bossTotal) + pct(modeDone, modeKeys.length) + pct(finDone, finTotal)) / 4);
    const since = o.since ? new Date(o.since).toLocaleDateString(T.lang === 'en' ? 'en-GB' : 'tr-TR') : '—';
    const left =
      epRow(t('stBestMeld'), fmt(o.bestMeld), 'c-red', true) +
      epRow(t('stBestRound'), o.bestRound ? `${o.bestRound} <i>· S${o.bestStage}</i>` : '—', '', true) +
      epRow(t('stMostType'), most && most[1] > 0 ? `${T.typeName(most[0])} <i>(${fmt(most[1])})</i>` : '—', '', true) +
      epRow(t('stMaxCoins'), `$${fmt(o.maxCoins)}`, 'c-orange', true) +
      epRow(t('stBestScore'), fmt(o.bestScore), '', true) +
      epRow(t('stBestStreak'), `${o.bestStreak || 0} <i>(${o.streak || 0})</i>`, '', true);
    const right =
      `<div class="ep-row st-prog st-total"><span class="ep-lbl">${t('stProgress')}</span>` +
      `<span class="ep-val st-bar" style="--p:${prog}%">${prog}%</span></div>` +
      bar(t('stCollection'), jokOwned, jokTotal) +
      bar(t('stBosses'), bossBeat, bossTotal) +
      bar(t('stModes'), modeDone, modeKeys.length) +
      bar(t('stFinals'), finDone, finTotal) +
      epRow(t('stRuns'), `${fmt(o.runs)} <i>· ${t('stWon', fmt(o.runsWon))}</i>`) +
      epRow(t('stRounds'), `${fmt(o.rounds)} <i>· ${t('stWon', fmt(o.roundsWon))}</i>`) +
      epRow(t('stTiles'), fmt(o.tiles));
    return `<div class="st-cols"><div class="st-col">${left}</div><div class="st-col">${right}</div></div>` +
      `<p class="st-since">${t('stSince', since)}</p>`;
  }

  /* P88 — AYARLAR baştan (kullanıcı 2026-10-08: Gambonanza / Balatro ayarlarından
     ilham, "bizim ui-design'a uygun"). Referanslardan YALNIZ YAPI alındı:
       · üstte SEKMELER (Oyun · Görünüm · Ses · Ekstra) — tek uzun liste 768'e sığmıyordu
       · seçimler ‹ DEĞER › seçici; altında KONUM NOKTALARI (Balatro) — nokta = seçenek
         düğmesi, tıklanınca doğrudan seçer (eski sınıf/veri adları noktada: .set-lang
         [data-lang], .set-theme[data-theme] (mini palet), .set-cspat, .set-mset)
       · aç/kapa = TİK KUTULU KART (Gambonanza) — .set-chk.set-<ad>, açıkken .on
       · ses = 0…100 kaydırıcılı kart · ekstra = "GİT" düğmeli satır (Gambonanza Reset data)
       · sağ üstte ✕, altta geniş KAPAT
     Görsel dil bizim: tema koyu panel + açık kenar + başlık plakası, gömme koyu iç alan,
     açık kartlar + koyu yazı, vurgu --gm-turn-on, STOP gibi basılan düğmeler. */
  let setTabNow = 'game';
  const CS_PREVIEW = { kraliyet: 'pat-kraliyet', deco: 'pat-deco' };

  function showSettings(tab) {
    if (typeof tab === 'string') setTabNow = tab;   // testler / kısayol: belirli sekmeyle aç
    const old = document.getElementById('settingsOv');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'settingsOv';
    ov.className = 'set-ov';
    const sr = (x) => `<span class="sr">${x}</span>`;
    /* ‹ değer › seçici; opts: [{ v, text, cls, attr, inner }] */
    const cyc = (key, label, opts, cur, preview = '') => {
      const c = opts.find((o) => o.v === cur) || opts[0];
      return `<div class="set-card set-cyc" data-cyc="${key}">` +
        `<span class="set-label">${label}</span>${preview}` +
        `<div class="cyc-row"><button type="button" class="cyc-arr cyc-prev" aria-label="‹">‹</button>` +
        `<span class="cyc-val">${c.text}</span>` +
        `<button type="button" class="cyc-arr cyc-next" aria-label="›">›</button></div>` +
        `<div class="cyc-dots">` + opts.map((o) =>
          `<button type="button" class="cyc-dot ${o.cls}${o.v === cur ? ' on' : ''}" ${o.attr}="${o.v}" data-text="${o.text}" title="${o.text}">${o.inner || ''}${sr(o.text)}</button>`).join('') +
        `</div></div>`;
    };
    /* tik kutulu kart */
    const chk = (cls, label, on, icon = '') =>
      `<button type="button" class="set-card set-chk ${cls}${on ? ' on' : ''}" aria-pressed="${on}">` +
      `<span class="chk-ico">${icon}</span><span class="set-label">${label}</span>` +
      `<span class="chk-box">${sr(t(on ? 'musicOn' : 'musicOff'))}</span></button>`;
    const vol = (id, label, on, v) =>
      `<div class="set-card set-vol"><div class="vol-head">` +
      `<button type="button" class="chk-mini${on ? ' on' : ''}" id="${id}On">${sr(t(on ? 'musicOn' : 'musicOff'))}</button>` +
      `<span class="set-label">${label}</span><b id="${id}Pct">${v}%</b></div>` +
      `<div class="vol-row"><span>0</span><input type="range" id="${id}Vol" min="0" max="100" step="5" value="${v}" aria-label="${label}"><span>100</span></div></div>`;
    const go = (id, label, desc, dis = false) =>
      `<div class="set-card set-go-row"><span class="go-txt"><span class="set-label">${label}</span><small>${desc}</small></span>` +
      `<button type="button" class="set-go" id="${id}"${dis ? ' disabled' : ''}>${t(dis ? 'setGoNone' : 'setGo')}</button></div>`;

    const finalsOn = Finals.list().length > 0;
    const tabs = [['game', t('setTab_game')], ['look', t('setTab_look')], ['audio', t('setTab_audio')], ['stats', t('setTab_stats')], ['extra', t('setTab_extra')]];
    const panes = {
      game:
        cyc('lang', t('language'), [{ v: 'tr', text: 'Türkçe', cls: 'set-lang', attr: 'data-lang' }, { v: 'en', text: 'English', cls: 'set-lang', attr: 'data-lang' }], T.lang) +
        /* P111 — joker puanlama animasyonu hızı · P122 — ekran sarsıntısı (erişilebilirlik); yan yana:
           sekme boyu sabit kalsın (browser_denetim_ui — sekmeler arası geçişte pencere zıplamasın) */
        `<div class="set-two set-cyc-pair">` +
        cyc('anim', t('animSpeedLabel'), [{ v: 'normal', text: t('animNormal'), cls: 'set-anim', attr: 'data-anim' },
          { v: 'fast', text: t('animFast'), cls: 'set-anim', attr: 'data-anim' }], animSpeed()) +
        cyc('shake', t('shakeLabel'), [{ v: 'on', text: t('shakeOn'), cls: 'set-shake', attr: 'data-shake' },
          { v: 'off', text: t('shakeOff'), cls: 'set-shake', attr: 'data-shake' }], shakeOn() ? 'on' : 'off') +
        `</div>` +
        `<div class="set-grid">` +
        (finalsOn
          ? chk('set-finaljk', t('finalJokerLabel'), finalJokerOn, '💋')
          : `<div class="set-card set-chk set-locked"><span class="chk-ico">💋</span><span class="set-label">${t('finalJokerLabel')}</span><span class="set-note set-finaljk-lock">🔒 ${t('finalJokerLocked')}</span></div>`) +
        `</div>`,
      look:
        `<div class="set-two">` +
        cyc('theme', t('colorTheme'), THEMES.map((th) => ({ v: th.key, text: t('theme_' + th.key), cls: 'set-theme', attr: 'data-theme',
          inner: `<span class="sw">${th.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span>` })), themeKey,
          `<span class="set-prev prev-theme">${(THEMES.find((x) => x.key === themeKey) || THEMES[0]).sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`) +
        cyc('cspat', t('casinoPatternLabel'), CASINO_PATTERNS.map((k) => ({ v: k, text: t('csPat_' + k), cls: 'set-cspat', attr: 'data-cspat' })), casinoPattern,
          `<span class="set-prev prev-pat ${CS_PREVIEW[casinoPattern] || ''}"></span>`) +
        `</div><div class="set-grid">` +
        chk('set-cosmic', t('cosmicThemeLabel'), cosmicThemeOn, '🌌') +
        chk('set-casino', t('casinoThemeLabel'), casinoThemeOn, '🎰') +
        chk('set-bossui', t('bossUiLabel'), bossUiOn, '👹') +
        `</div>`,
      audio:
        vol('setMusic', t('musicLabel'), Music.on, Music.vol) +
        vol('setSfx', t('sfxSetLabel'), sfxOn, sfxVol) +
        cyc('mset', t('musicSetLabel'), [1, 2, 3].map((n) => ({ v: n, text: '♪ ' + t('musicSet' + n), cls: 'set-mset', attr: 'data-mset' })), Music.set),
      stats: statsPane(),
      extra:
        go('setHintsReset', t('hintsLabel'), t('hintsResetDesc')) +
        /* P101 — kilitli/keşfedilmemiş görünümü test (gerçek kayıt silinmez) */
        `<div class="set-two set-cyc-pair">` +
        cyc('colrev', t('colRevealLabel'), DISC_MODES.map((k) => ({ v: k, text: t('colRev_' + k), cls: 'set-colrev', attr: 'data-colrev' })), Disc.mode()) +
        (BETA ? '' : cyc('modelock', t('modeLockLabel'), ['off', 'kozmik', 'kumarhane', 'hepsi'].map((k) => ({ v: k, text: t('modeLock_' + k), cls: 'set-modelock', attr: 'data-modelock' })), Modes.testStep())) +
        `</div>` +
        go('setDiscReset', t('discResetLabel'), t('discResetDesc', Disc.stats())) +
        /* P90d (kullanıcı 2026-10-12) — yenmekle uğraşmadan test: her final için
           "yenildi" tik kutusu (kilit + maskot eşyası + run başı final jokeri) */
        `<div class="set-card set-fw-card"><span class="go-txt"><span class="set-label">${t('finalWinHead')}</span>`
        + `<small>${t('finalWinDesc')}</small></span><div class="set-fw-grid">`
        + Object.values(typeof FINAL_BOSSES !== 'undefined' ? FINAL_BOSSES : {}).filter((fb) => !(BETA && fb.key === 'lanetliCocuk')).map((fb) =>
          chk(`set-finalwin fw-${fb.key}`, t('finalWinLabel', fb.name), Finals.has(fb.key), fb.icon || '🏆')).join('')
        + `</div></div>` +
        go('setFinalsReset', t('finalsResetLabel'), t('finalsResetDesc'), !finalsOn),
    };
    ov.innerHTML =
      `<div class="tp-box set-box"><div class="set-plate">${t('settingsTitle')}</div>` +
      `<div class="set-tabs">` + tabs.map(([k, l]) => `<button type="button" class="set-tab${k === setTabNow ? ' on' : ''}" data-tab="${k}">${l}</button>`).join('') + `</div>` +
      `<div class="set-body">` + Object.entries(panes).map(([k, h]) => `<div class="set-pane${k === setTabNow ? ' on' : ''}" data-pane="${k}">${h}</div>`).join('') + `</div>` +
      `<button type="button" class="ep-btn ep-blue set-back" id="setClose">${t('rpBack')}</button></div>`;   // P119 — bütün menü pencerelerinde tek "Geri"
    document.body.appendChild(ov);

    /* sekmeler */
    ov.querySelectorAll('.set-tab').forEach((b) => b.addEventListener('click', () => {
      setTabNow = b.dataset.tab;
      ov.querySelectorAll('.set-tab').forEach((x) => x.classList.toggle('on', x === b));
      ov.querySelectorAll('.set-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === setTabNow));
    }));
    /* ‹ › oklar: bir sonraki / önceki noktaya tıklar (seçim kodu noktalarda) */
    ov.querySelectorAll('.set-cyc').forEach((card) => {
      const step = (d) => {
        const dots = [...card.querySelectorAll('.cyc-dot')];
        const i = Math.max(0, dots.findIndex((x) => x.classList.contains('on')));
        dots[(i + d + dots.length) % dots.length].click();
      };
      card.querySelector('.cyc-prev').addEventListener('click', () => step(-1));
      card.querySelector('.cyc-next').addEventListener('click', () => step(1));
    });
    /* nokta seçiminden SONRA (kabarcık) değer yazısı + önizleme güncellenir */
    ov.addEventListener('click', (e) => {
      const d = e.target.closest('.cyc-dot');
      if (!d || !ov.isConnected) return;
      const card = d.closest('.set-cyc');
      card.querySelector('.cyc-val').textContent = d.dataset.text;
      const pv = card.querySelector('.prev-pat');
      if (pv) pv.className = 'set-prev prev-pat ' + (CS_PREVIEW[d.dataset.cspat] || '');
    });
    const setChk = (b, on) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
      const s = b.querySelector('.sr'); if (s) s.textContent = t(on ? 'musicOn' : 'musicOff'); };

    ov.querySelector('#setHintsReset').addEventListener('click', () => { Hints.reset(); toast(t('hintsResetDone'), true); });
    ov.querySelectorAll('.set-finalwin').forEach((b) => b.addEventListener('click', () => {
      const k = [...b.classList].find((c) => c.startsWith('fw-')).slice(3);
      const fb = FINAL_BOSSES[k];
      const on = !Finals.has(k);
      if (on) Finals.unlock(k); else Finals.lock(k);
      updateMascotItems();
      toast(t(on ? 'finalWinOnToast' : 'finalWinOffToast', fb.name), true);
      ov.remove();
      showSettings();   // FİNAL JOKERİYLE BAŞLA kilidi, sıfırla satırı ve kutular tazelensin
    }));
    const dr = ov.querySelector('#setDiscReset');
    dr.addEventListener('click', () => {
      if (!dr.dataset.confirm) { dr.dataset.confirm = '1'; dr.classList.add('warn'); dr.textContent = '⚠ ' + t('discResetConfirm'); return; }
      Disc.reset();
      toast(t('discResetDone'), true);
      ov.remove();
      showSettings('extra');
    });
    const fr = ov.querySelector('#setFinalsReset');
    fr.addEventListener('click', () => {
      if (!fr.dataset.confirm) { fr.dataset.confirm = '1'; fr.classList.add('warn'); fr.textContent = '⚠ ' + t('finalsResetConfirm'); return; }
      try { localStorage.removeItem(FINALS_KEY); } catch (e) {}
      updateMascotItems();
      toast(t('finalsResetDone'), true);
      ov.remove();
      showSettings();   // FİNAL JOKERİYLE BAŞLA kilidi ve bu satır tazelensin
    });
    const sOn = ov.querySelector('#setSfxOn'), sVol = ov.querySelector('#setSfxVol');
    sOn.addEventListener('click', () => {
      sfxOn = !sfxOn;
      localStorage.setItem('okeySfx', sfxOn ? '1' : '0');
      setChk(sOn, sfxOn);
      if (sfxOn) SFX.tick();
    });
    sVol.addEventListener('input', () => {
      sfxVol = Math.max(0, Math.min(100, +sVol.value || 0));
      localStorage.setItem('okeySfxVol', String(sfxVol));
      ov.querySelector('#setSfxPct').textContent = sfxVol + '%';
      if (!sfxOn && sfxVol > 0) { sfxOn = true; localStorage.setItem('okeySfx', '1'); setChk(sOn, true); }
    });
    sVol.addEventListener('change', () => SFX.tick());   // bırakınca örnek ses
    const mOn = ov.querySelector('#setMusicOn'), mVol = ov.querySelector('#setMusicVol');
    mOn.addEventListener('click', () => { Music.setOn(!Music.on); setChk(mOn, Music.on); });
    ov.querySelectorAll('.set-shake').forEach((b) => b.addEventListener('click', () => {   // P122
      try { localStorage.setItem(SHAKE_KEY, b.dataset.shake); } catch (e) {}
      ov.querySelectorAll('.set-shake').forEach((x) => x.classList.toggle('on', x === b));
      if (b.dataset.shake === 'on') screenShake(.4, document.querySelector('#settingsOv .pk-box, #settingsOv'));
    }));
    ov.querySelectorAll('.set-anim').forEach((b) => b.addEventListener('click', () => {   // P111
      try { localStorage.setItem(ANIM_KEY, b.dataset.anim); } catch (e) {}
      ov.querySelectorAll('.set-anim').forEach((x) => x.classList.toggle('on', x === b));
    }));
    ov.querySelectorAll('.set-mset').forEach((b) => b.addEventListener('click', () => {
      Music.setSet(b.dataset.mset);
      ov.querySelectorAll('.set-mset').forEach((x) => x.classList.toggle('on', x === b));
      setChk(mOn, Music.on);
      toast(t('musicPreview', t('musicSet' + Music.set)), true);
    }));
    mVol.addEventListener('input', () => {
      Music.setVol(mVol.value);
      ov.querySelector('#setMusicPct').textContent = Music.vol + '%';
      if (!Music.on && Music.vol > 0) mOn.click();     // sürgüyü oynatan müziği duymak ister
    });
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    /* 2026-10-15 (kullanıcı): sağ üstteki ✕ kalktı — alttaki KAPAT zaten var, iki kapama tuşu gereksiz */
    ov.querySelector('#setClose').addEventListener('click', () => ov.remove());
    ov.querySelectorAll('.set-lang[data-lang]').forEach((b) => b.addEventListener('click', () => {
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
    const tog = (sel, get, set) => {
      const b = ov.querySelector(sel);
      if (b) b.addEventListener('click', () => { set(!get()); setChk(b, get()); });
    };
    tog('.set-finaljk', () => finalJokerOn, (v) => {
      finalJokerOn = v;
      try { localStorage.setItem(FINAL_JOKER_KEY, v ? '1' : '0'); } catch (e) {}
      toast(t(v ? 'finalJokerOnToast' : 'finalJokerOffToast'), true);
    });
    tog('.set-bossui', () => bossUiOn, (v) => {
      bossUiOn = v;
      try { localStorage.setItem(BOSS_UI_KEY, v ? '1' : '0'); } catch (e) {}
      applyRunTheme();
      toast(t(v ? 'bossUiOnToast' : 'bossUiOffToast'), true);
    });
    tog('.set-cosmic', () => cosmicThemeOn, (v) => {
      cosmicThemeOn = v;
      try { localStorage.setItem(COSMIC_THEME_KEY, v ? '1' : '0'); } catch (e) {}
      applyRunTheme();
      toast(t(v ? 'cosmicThemeOnToast' : 'cosmicThemeOffToast'), true);
    });
    tog('.set-casino', () => casinoThemeOn, (v) => {
      casinoThemeOn = v;
      try { localStorage.setItem(CASINO_THEME_KEY, v ? '1' : '0'); } catch (e) {}
      applyRunTheme();
      toast(t(v ? 'casinoThemeOnToast' : 'casinoThemeOffToast'), true);
    });
    ov.querySelectorAll('.set-cspat').forEach((b) => b.addEventListener('click', () => {
      casinoPattern = CASINO_PATTERNS.includes(b.dataset.cspat) ? b.dataset.cspat : 'kraliyet';
      try { localStorage.setItem(CASINO_PATTERN_KEY, casinoPattern); } catch (e) {}
      ov.querySelectorAll('.set-cspat').forEach((x) => x.classList.toggle('on', x === b));
      applyRunTheme();
      toast(t('csPatToast', t('csPat_' + casinoPattern)), true);
    }));
    ov.querySelectorAll('.set-modelock').forEach((b) => b.addEventListener('click', () => {
      Modes.setTestStep(b.dataset.modelock);
      ov.querySelectorAll('.set-modelock').forEach((x) => x.classList.toggle('on', x === b));
      toast(t('modeLockToast', t('modeLock_' + Modes.testStep())), true);
    }));
    ov.querySelectorAll('.set-colrev').forEach((b) => b.addEventListener('click', () => {
      Disc.setMode(b.dataset.colrev);
      ov.querySelectorAll('.set-colrev').forEach((x) => x.classList.toggle('on', x === b));
      toast(t('colRevToast', t('colRev_' + Disc.mode())), true);
    }));
    /* Tema anında uygulanır (CSS değişkeni); pencere yeni temanın renkleriyle tazelenir. */
    ov.querySelectorAll('.set-theme').forEach((b) => b.addEventListener('click', () => {
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
    $('mapBackupTitle').textContent = t('backupTitle').toLowerCase();   // P80
    $('mapConsumTitle').textContent = t('totemTitle');
    el.btnStoreContinue.innerHTML = `<b>${t('stNext')}</b>`;
  }

  /* ---------- Raund sonu ---------- */

  /* denetim LG-02 — aynı raund sonu iki akıştan (puanlama sahnesi + otomatik kayıp vb.)
     arka arkaya gelirse ikincisi yok sayılır: Game Over/ödül penceresi, ses ve
     LStats.round bir kez. Anahtar aynı state + stage/raund/sonuç/tur/puan; birkaç saniye
     içindeki tekrar sayılır (öğretici/trainer "raundu tekrarla" sonraki bitişi engellenmez). */
  let lastRoundEnd = null;
  function showRoundEnd() {
    const s = Game.state;
    const reKey = [s.stage, s.roundInStage, s.status, s.turn, s.score].join('|');
    if (lastRoundEnd && lastRoundEnd.s === s && lastRoundEnd.key === reKey && Date.now() - lastRoundEnd.at < 4000) return;
    lastRoundEnd = { s, key: reKey, at: Date.now() };
    const won = s.status === 'won';
    if (won) SFX.win(); else SFX.lose();
    /* P86 (kullanıcı 2026-10-08: "prototipi yalnız ben oynuyorum; trainer'da Lady Luck'ı
       yenersem kilidi açılsın") — Trainer'da final boss raundu kazanılınca ödül kalıcı
       açılır (normal run'da bu, run sonunda Game.finalBeaten() ile olur). */
    if (Game.trainerMode && won && Game.isBossRound() && s.boss && s.boss.final && Finals.unlock(s.boss.key))
      setTimeout(() => toast(t('finalUnlockedTrainer', T.bossName(s.boss.key, s.boss.name)), true), 300);
    LStats.round(s, won);   // P88 — kalıcı istatistik (trainer / öğretici yazmaz)
    /* P83 — boss testi: store / Game Over yok, sonuç penceresi (tekrar · başka boss · menü) */
    if (Game.trainerMode && s.bossTest) { showBossTestEnd(won); return; }

    // Öğreticide kayıp = raundu tekrar dene (run bitmez)
    if (TUT.active && !won) { TUT.lost(); return; }   // P92 — Mühür teselli eder

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
        rows += row(t('rwSaved', T.ev(cr.savedBy || 'Lanetli Kaptan')), sg(cr.net));   // denetim3 #38
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
        /* denetim3 #13 — joker süresi ipucu kalktı (öğretici store adımında anlatıyor) */
      }, 60);
      const notes = [];
      if (cr.savedBy && !cr.survived) notes.push(t('savedBy', T.ev(cr.savedBy)));   // denetim3 #38 — sıyrılışta fiş satırı zaten adı yazıyor
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
            `<div class="rw-big">${s.score}</div><div class="rw-sub">${over < 0 ? t('rwTargetSaved', s.target) : t('rwTargetLine', s.target, pct)}</div></div>` +   // denetim3 #38 — "+%-92" yok
          `<div class="rw-box rw-turn"><div class="rw-bh">${t('rwTurn')}</div>` +
            `<div class="rw-big">${s.wonOnTurn}.</div><div class="rw-sub">${t('rwTurnSub')}</div></div>` +
        `</div>`;
      el.modalBody.innerHTML = `<div class="rw">${heroHtml}${coinHtml}</div>`;
      el.overlay.classList.add('rw-open');
      cashOutFx(el.modalBody, total);   // P122 — fiş satır satır, coin'ler cüzdana
      rackHop();   // P122 · D — taşlar zaferle sıçrar
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
        if (!s.store && Game.stageStoreOn && Game.stageStoreOn()) { goNextRound(); return; }   // Kumarhane + Lanetli Boyut
        openStore();
      };
      /* P58 · Kumarhane — bahis ödülü (3 jokerden 1'i) önce alınır */
      const afterBj = () => {
        if ((s.betPicks || []).length) { showBetPicks(after); return; }
        after();
      };
      /* P61 — raund coini için Yüksek mi Alçak mı (isteğe bağlı) */
      if (s.bj && s.bj.phase === 'offer' && !TUT.active) { showBj(afterBj); return; }
      afterBj();
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
    const srcArt = () => document.querySelector(`.store-item[data-sidx="${index}"] .st-frame`);   // P120
    if (JOKER_DEFS[item.key]?.mech === 'deck') {
      const g = grabFly(srcArt()), c0 = s.coins;
      const res = Game.buyJoker(index);
      if (!res.ok) { toast(res.error); return; }
      toast(t('boughtDeck', T.name(item)), true);
      SFX.coin();
      renderStore();
      render();
      flyGrabTo(g, buyTarget({ type: 'deck' })); coinDrop(c0);
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
    /* P101 (kullanıcı raporu 2026-10-14: "düzgün durmuyor") — pencere eski
       .tp-box kalıbındaydı (stili yalnız #tutResume'da) → düğmeler farklı
       genişlikte, hizasız. Artık diğer seçim pencereleriyle aynı pk-ov kalıbı:
       yan yana üç seçenek kartı (ad · doluluk · ne olur) + altta Vazgeç.
       Düğme kimlikleri (bdMain/bdBackup/bdSwap/bdCancel) aynı kaldı. */
    const mainFull = s.jokers.length >= Game.slotCap(), backFull = s.backup.length >= MAX_BACKUP;
    const opt = (id, name, sub, desc, dis) =>
      `<button class="pk-card bd-opt" id="${id}" ${dis ? 'disabled' : ''}><div class="pk-name">${name}</div>`
      + `<div class="pk-sub">${dis ? t('bdFull') : sub}</div><div class="pk-desc">${desc}</div></button>`;
    ov.className = 'pk-ov tone-violet';
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">${T.name(item)}</div>` +
      `<div class="pk-sub-title">${t('buyWhere')}</div>` +
      `<div class="pk-body pk-choice">` +
      opt('bdMain', t('bdMainName'), `${s.jokers.length}/${Game.slotCap()}`, t('bdMainDesc'), mainFull) +
      opt('bdBackup', t('bdBackupName'), `${s.backup.length}/${MAX_BACKUP}`, t('bdBackupDesc'), backFull) +
      (swaps.length ? opt('bdSwap', t('bdSwapName'), `${canSwap ? cheapest : item.price} ${COIN}`, t('bdSwapDesc'), !canSwap) : '') +
      `</div>` +
      `<div class="pk-foot"><button class="btn ghost" id="bdCancel">${t('cancel')}</button></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#bdCancel').addEventListener('click', () => ov.remove());
    const buy = (dest) => {
      ov.remove();
      const g = grabFly(srcArt()), c0 = s.coins;   // P120
      const res = Game.buyJoker(index, dest);
      if (!res.ok) { toast(res.error); return; }
      toast(t('boughtTo', T.name(item), res.placed === 'backup' ? 'backup' : 'slot'), true);
      SFX.coin();
      renderStore();
      render();
      flyGrabTo(g, buyTarget(res)); coinDrop(c0);
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
    /* P104 (kullanıcı: "takas menüsü anlaşılmıyor") — eski liste satırları açık zeminde açık yazıydı
       (okunmuyordu). Artık diğer seçim pencereleriyle aynı pk-ov kalıbı: ÜSTTE alınacak joker + ödenecek
       tutarın kuralı, ORTADA verilebilecek jokerler çizimli kartlar (hangi slotta, ne kadar iade, ne kadar
       ÖDERSİN), kilitli kart gerekçesiyle sönük. Kimlikler (#buySwap, .sw-row, swBack, swCancel) aynı. */
    const ov = document.createElement('div');
    ov.id = 'buySwap';
    ov.className = 'pk-ov tone-violet';
    ov.innerHTML =
      `<div class="pk-box"><div class="pk-title">${t('swapAsk')}</div>` +
      `<div class="pk-sub-title"><div class="sw-want">${t('swapWant', T.name(item), item.price, COIN)}</div>` +
      `<div class="sw-rule">${t('swapRule')}</div></div>` +
      `<div class="pk-body pk-choice sw-list">` +
      rows.map(o =>
        `<button class="pk-card sw-row r-${o.rarity}${o.ok ? '' : ' locked'}" data-jid="${o.jokerId}" ${o.ok ? '' : 'disabled'}>` +
        (JOKER_ART.has(o.key) ? `<div class="col-jk-art jk-${o.key}"></div>` : `<div class="sw-art-name">${T.name(o)}</div>`) +
        `<div class="sw-where">${t(o.where === 'backup' ? 'destBackup' : 'destMain')}</div>` +
        (o.ok ? `<div class="sw-pay">${t('swapPay', o.net, COIN)}</div><div class="sw-ref">${t('swapRefund', o.refund, COIN)}</div>`
          : `<div class="sw-why">${T.ev(o.error)}</div>`) +
        `</button>`).join('') +
      `</div>` +
      `<div class="pk-foot"><button class="btn ghost" id="swBack">${t('swapBackBtn')}</button>` +
      `<button class="btn ghost" id="swCancel">${t('cancel')}</button></div></div>`;
    rows.forEach((o, i) => { const c = ov.querySelectorAll('.sw-row')[i]; if (c) attachTip(c, { key: o.key, name: o.name, desc: JOKER_DEFS[o.key] ? JOKER_DEFS[o.key].desc : '', rarity: o.rarity }, {}); });
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#swCancel').addEventListener('click', () => ov.remove());
    ov.querySelector('#swBack').addEventListener('click', () => {
      ov.remove();
      pickBuyDest(index, item);
    });
    ov.querySelectorAll('.sw-row').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      const g = grabFly(document.querySelector(`.store-item[data-sidx="${index}"] .st-frame`)), c0 = Game.state.coins;   // P120
      const res = Game.swapBuyJoker(index, parseInt(b.dataset.jid, 10));
      if (!res.ok) { toast(res.error); return; }
      ov.remove();
      toast(t('swapToast', T.ev(res.gave), T.name(item), res.net), true);
      SFX.coin();
      renderStore();
      render();
      flyGrabTo(g, buyTarget(res)); coinDrop(c0);
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
    if (x.type === 'totem')   // LANETLİ BOYUT — totem: simge + TOTEM etiketi (çizimi kullanıcıdan gelecek)
      return `<div class="pk-ico totem-ico">${x.icon || '🗿'}</div>` +
        `<div class="pk-name">${x.name}</div>` +
        `<div class="pk-sub">${t('totemTag')} · ${T.rarity(x.rarity)}</div>`;
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

  /* kullanıcı 2026-10-29 (Boyut Yırtığı'nın açıklaması üstüne gelince görünmüyordu) — ödül/paket kartlarının
     HEPSİ aynı ipucunu taşır: joker, değnek, totem, özel taş */
  function packTip(el, x) {
    if (!x || x.converted) return;
    const rar = x.type === 'totem' ? `${t('totemTag')} · ${T.rarity(x.rarity)}`
      : x.type === 'consum' ? `${T.rarity(x.rarity || 'common')} · ${t('consumTag')}` : null;
    attachTip(el, x.type === 'joker' ? { ...x, key: x.key, name: T.name(x), desc: T.desc({ key: x.key, desc: x.desc || '' }) }
      : { name: x.type === 'consum' ? T.consumName(x.key, x.name) : (x.name || ''), rarityText: rar || undefined,
        accent: x.rarity || 'common', desc: packFaceDesc(x) }, {});
  }
  function packFaceDesc(x) {
    if (x.converted) return t('packConvertedLine', x.coins);
    if (x.type === 'consum') return T.consumDesc(x.key, x.desc || '');
    if (x.type === 'joker') return T.desc({ key: x.key, desc: x.desc || '' });
    if (x.type === 'totem') return `${x.desc || ''} <b>${t('totemCost')}</b> ${x.cost || ''}`;
    return T.specialDesc(x.kind, SPECIAL_TILES[x.kind]?.desc || '');
  }

  /* LANETLİ BOYUT — TOTEMLER (Aşama 4): slot kaplamaz, kapasiteye sayılmaz; değnek panelinin altında ayrı satır.
     Harita/store: sol envanterde değnek panelinin altında TOTEMLER paneli; oyun ekranı: değnek sekmesinin içinde. */
  function totemChips(row) {
    row.innerHTML = '';
    for (const tt of (Game.state && Game.state.totems) || []) {
      const d = TOTEM_DEFS[tt.key];
      if (!d) continue;
      const c = document.createElement('div');
      c.className = `totem-chip r-${d.rarity}`;
      c.textContent = d.icon;
      attachTip(c, { name: d.name, rarityText: `${t('totemTag')} · ${T.rarity(d.rarity)}`, accent: d.rarity,
        desc: `${d.desc}<br><b>${t('totemCost')}</b> ${d.cost}` }, {});
      row.appendChild(c);
    }
  }
  function renderTotems() {
    const tot = (Game.state && Game.state.totems) || [];
    for (const [hostId, id] of [['mapLeftInv', 'mapTotemPanel'], ['storeLeftInv', 'storeTotemPanel']]) {
      const host = document.getElementById(hostId);
      let p = document.getElementById(id);
      if (!host || !tot.length) { p?.remove(); continue; }
      if (!p) {
        p = document.createElement('div');
        p.id = id;
        p.className = 'st-shoulder st-inv totem-panel';
        p.innerHTML = `<div class="st-sh-tab"><span>${t('totemsTitle')}</span><span class="gm-sh-count"></span></div><div class="st-sh-body"><div class="totem-row"></div></div>`;
        host.insertBefore(p, host.children[1] || null);
      }
      p.querySelector('.gm-sh-count').textContent = String(tot.length);
      totemChips(p.querySelector('.totem-row'));
    }
    const body = document.getElementById('consumRow')?.parentElement;
    if (body) {
      let r = body.querySelector('.totem-row');
      if (!tot.length) { r?.remove(); return; }
      if (!r) { r = document.createElement('div'); r.className = 'totem-row in-game'; body.appendChild(r); }
      totemChips(r);
    }
  }

  /* LANETLİ BOYUT — ADAK SUNAĞI (Aşama 3): stage sonu store'unda Yenile ile Devam arasında düğme; pencerede iki teklif
     (kısa bedel → Rare, kalıcı bedel → Legendary). Kabul edince bedel ödenir, lanet +1, ödül seçimi (dolu rafta takas). */
  function renderAltarBtn() {
    const acts = document.querySelector('#storeOverlay .store-actions');
    if (!acts) return;
    let btn = document.getElementById('btnAltar');
    const st = Game.altarState && Game.altarState();
    if (!st || !st.offers.length) { btn?.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btnAltar';
      btn.className = 'st-btn st-altar';
      btn.addEventListener('click', () => { SFX.click && SFX.click(); showAltar(); });
      acts.insertBefore(btn, document.getElementById('btnStoreContinue'));
    }
    const open = st.offers.filter((o) => o.ok).length;
    btn.innerHTML = `${pixIcon('sessiz', 3)}<span>${t('altarBtn')}</span><small>${t('altarBtnSub', open)}</small>`;
    btn.classList.toggle('spent', !open);
  }
  function showAltar(done) {
    const st = Game.altarState && Game.altarState();
    if (!st) { if (done) done(); return; }
    const finish = () => { ov.remove(); if (done) done(); };
    document.getElementById('altarOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'altarOv';
    ov.className = 'pk-ov tone-violet altar-ov';
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🜏 ${t('altarTitle')}</div>`
      + `<div class="pk-sub-title">${t('altarSub', Game.curseLevel())}</div><div class="pk-body pk-choice"></div>`
      + `<div class="pk-foot"><button class="ep-btn ep-blue altar-close">${t('altarLeave')}</button></div></div>`;
    const body = ov.querySelector('.pk-body');
    st.offers.forEach((o, i) => {
      const r = o.reward;
      const c = document.createElement('div');
      c.className = `pk-card altar-card ac-${o.kind} r-${r.rarity}` + (o.taken ? ' taken' : '');
      const art = r.type === 'joker' && JOKER_ART.has(r.key) ? `<div class="col-jk-art jk-${r.key} bp-art"></div>`
        : `<div class="ac-ico">${r.type === 'totem' ? r.icon : r.type === 'consum' ? r.icon : jokerIcon(r.key)}</div>`;
      c.innerHTML = `<div class="ac-tag">${t(o.kind === 'short' ? 'altarShort' : 'altarPerm')}</div>`
        + `<div class="ac-cost">${t('pact_' + o.type + '_' + o.kind)}</div><div class="ac-arrow">▼</div>`
        + art + `<div class="pk-name">${T.name(r)}</div><div class="pk-sub">${T.rarity(r.rarity)}</div>`
        + `<div class="pk-desc">${packFaceDesc(r)}</div>`
        + `<button class="ac-take" ${o.ok ? '' : 'disabled'}>${o.taken ? t('altarTaken') : o.ok ? t('altarAccept') : t('altarCant')}</button>`;
      c.querySelector('.ac-take').addEventListener('click', () => {
        const res = Game.acceptAltar(i);
        if (!res.ok) { toast(res.error, false); return; }
        SFX.crack();
        ov.remove();
        showBetPicks(() => { render(); if (done) done(); });   // tek seçim: armağandan sonra store
      });
      body.appendChild(c);
    });
    ov.querySelector('.altar-close').addEventListener('click', finish);
    document.body.appendChild(ov);
  }

  /* LANETLİ BOYUT · KARANLIK TAKAS — 3 kapalı kutu; kutular fısıldar (%70 doğru); bir kez coin'le bakılır; biri seçilir */
  function showTakas(done) {
    const st = Game.takasState && Game.takasState();
    if (!st) { if (done) done(); return; }
    document.getElementById('takasOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'takasOv';
    ov.className = 'pk-ov tone-violet altar-ov mg-ov';
    const boxFace = (c) => c.kind === 'item' ? `<div class="tk-in">${c.item && c.item.type === 'joker' && JOKER_ART.has(c.item.key) ? `<div class="col-jk-art jk-${c.item.key} tk-art"></div>` : `<div class="tk-ico">${(c.item && c.item.icon) || '🃏'}</div>`}<b>${c.item ? (c.item.type === 'consum' ? T.consumName(c.item.key, c.item.name) : c.item.type === 'joker' ? T.name(c.item) : c.item.name) : ''}</b></div>`
      : c.kind === 'coin' ? `<div class="tk-in"><div class="tk-ico">💰</div><b>+${c.coin} coin</b></div>`
      : `<div class="tk-in pen"><div class="tk-ico">☠</div><b>${t('takasPen_' + c.pen)}</b></div>`;
    const draw = () => {
      const s2 = Game.takasState();
      ov.innerHTML = `<div class="pk-box"><div class="pk-title">🎁 ${t('takasTitle')}</div>`
        + `<div class="pk-sub-title">${t('takasSub')}</div><div class="pk-body pk-choice tk-row"></div>`
        + `<div class="pk-foot"><span class="pk-hint">${s2 && s2.peeked == null ? t('takasPeekHint', s2.peekCost) : t('takasPickHint')}</span></div></div>`;
      const row = ov.querySelector('.tk-row');
      (s2 ? s2.boxes : []).forEach((bx, i) => {
        const c = document.createElement('div');
        c.className = 'tk-box' + (bx.open ? ' peeked' : '');
        c.innerHTML = `<div class="tk-lid">${bx.open ? boxFace(bx.open) : pixIcon('takas', 9)}</div>`
          + `<div class="tk-hint">“${t('takasHint_' + bx.hint)}”</div>`
          + `<button class="ac-take tk-pick">${t('takasPick')}</button>`
          + (s2.peeked == null ? `<button class="tk-peek">${t('takasPeek', s2.peekCost)}</button>` : '');
        c.querySelector('.tk-pick').addEventListener('click', () => {
          const r = Game.takasChoose(i);
          if (!r.ok) return;
          SFX.crack();
          [...row.children].forEach((el2, k) => { el2.classList.add(k === i ? 'chosen' : 'other');
            el2.querySelector('.tk-lid').innerHTML = boxFace(r.boxes[k]); el2.querySelectorAll('button').forEach((x) => x.remove()); });
          const go = document.createElement('button');
          go.className = 'ep-btn ep-blue';
          go.textContent = t('takasGo');
          go.addEventListener('click', () => { ov.remove(); render(); if ((Game.state.betPicks || []).length) showBetPicks(() => { render(); if (done) done(); }); else if (done) done(); });
          ov.querySelector('.pk-foot').innerHTML = `<span class="pk-hint">${t('takasRes_' + r.box.kind, r.box.coin, r.box.pen ? t('takasPen_' + r.box.pen) : '')}</span>`;
          ov.querySelector('.pk-foot').appendChild(go);
        });
        const pk = c.querySelector('.tk-peek');
        if (pk) pk.addEventListener('click', () => { const r = Game.takasPeek(i); if (!r.ok) { toast(r.error, false); return; } SFX.coin(); draw(); });
        row.appendChild(c);
      });
    };
    draw();
    document.body.appendChild(ov);
  }
  /* LANETLİ BOYUT · KEMİK FALI — boss'tan önce isteğe bağlı: 6 taş 2 sn görünür, kapanır; 10 sn'de grup kuran 3 taşı seç */
  function showFal(done) {
    document.getElementById('falOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'falOv';
    ov.className = 'pk-ov tone-violet altar-ov mg-ov';
    ov.innerHTML = `<div class="pk-box"><div class="pk-title">🦴 ${t('falTitle')}</div><div class="pk-sub-title">${t('falSub')}</div>`
      + `<div class="pk-body fal-body"></div><div class="fal-timer"><i></i></div>`
      + `<div class="pk-foot"><button class="ep-btn ep-blue fal-skip">${t('falSkip')}</button><button class="ep-btn fal-play">${t('falPlay')}</button></div></div>`;
    const body = ov.querySelector('.fal-body'), foot = ov.querySelector('.pk-foot'), bar = ov.querySelector('.fal-timer i');
    const finish = () => { ov.remove(); render(); if (done) done(); };
    ov.querySelector('.fal-skip').addEventListener('click', finish);
    ov.querySelector('.fal-play').addEventListener('click', () => {
      const f = Game.falStart();
      if (!f.ok) { finish(); return; }
      foot.innerHTML = `<span class="pk-hint">${t('falWatch')}</span>`;
      const picked = new Set();
      const cells = f.tiles.map((tl) => {
        const c = document.createElement('button');
        c.className = 'fal-cell';
        c.appendChild(tileEl({ ...tl }, false));
        body.appendChild(c);
        return c;
      });
      let timer = null, over = false;
      const answer = () => {
        if (over) return; over = true; clearTimeout(timer);
        const r = Game.falAnswer([...picked]);
        cells.forEach((c) => c.classList.remove('hidden-face'));
        bar.style.transition = 'none';
        foot.innerHTML = `<span class="pk-hint">${r.win ? t('falWin') : r.wrong ? t('falLose', r.wrong) : t('falNone')}</span>`;
        const go = document.createElement('button');
        go.className = 'ep-btn ep-blue'; go.textContent = t('takasGo');
        go.addEventListener('click', finish);
        foot.appendChild(go);
        (r.win ? SFX.coin : SFX.crack)();
      };
      setTimeout(() => {
        cells.forEach((c, i) => {
          c.classList.add('hidden-face');
          c.addEventListener('click', () => {
            if (over) return;
            const id = f.tiles[i].id;
            if (picked.has(id)) { picked.delete(id); c.classList.remove('picked'); }
            else if (picked.size < 3) { picked.add(id); c.classList.add('picked'); }
            if (picked.size === 3) answer();
          });
        });
        foot.innerHTML = `<span class="pk-hint">${t('falPick')}</span>`;
        bar.style.transition = `width ${f.pickMs}ms linear`;
        requestAnimationFrame(() => { bar.style.width = '0%'; });
        timer = setTimeout(answer, f.pickMs);
      }, f.showMs);
    });
    document.body.appendChild(ov);
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
      packTip(c, opt);
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
          const g = grabFly(c);   // P120 — seçilen kart slotuna uçar
          ov.remove();
          renderStore(); render();
          if (!r.got.converted) flyGrabTo(g, buyTarget(r.got));
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
    loopReels(pkItems(strips, null), { onDone: finish });   // P109 — STOP yok
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
        const hasArt = (x.type === 'joker' && JOKER_ART.has(x.key)) || (x.type === 'consum' && CONSUM_ART.has(x.key));
        c.innerHTML = hasArt ? reelFaceHtml(x) : packFaceHtml(x);   // kullanıcı 2026-10-29: çizimli, açıklamasız · P121: ad da yazmaz (üstüne gelince ipucunda)
        packTip(c, x);
        rw.appendChild(c);
      });
      ov.querySelector('.pk-box').insertBefore(rw, foot);
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = t('packTake');
      b.addEventListener('click', () => {
        const gs = [...rw.children].map((c2) => grabFly(c2));   // P120 — her ödül kartı kendi slotuna uçar
        ov.remove();
        renderStore(); render();
        (res.contents || []).forEach((c2, i) => { if (!c2.converted) flyGrabTo(gs[i], buyTarget(c2), i * 110 * fxK()); });
        for (const c2 of res.contents || []) onJokerGained(c2.key, c2.jokerId);
      });
      /* PAS — çıkanı almazsın */
      const pass = document.createElement('button');
      pass.className = 'btn ghost pk-pass';
      pass.textContent = t('packPass');
      pass.addEventListener('click', () => {
        if (res.index != null) Game.passPack(res.index);
        ov.remove();
        renderStore(); render();
      });
      foot.classList.add('pk-foot-2');
      foot.append(pass, b);
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
        if (!r.ok) { nope(r.error, btn); return; }   // denetim3 #8
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
    setTimeout(lbRot, 30);
    document.getElementById('btnAltar')?.remove();   // sunak artık store'dan önce kendiliğinden açılıyor
    renderCurse();
    renderTotems();
    hideTip();
    /* P65 — haritanın sol sütunu, $ kutusu, joker paneli ve destesiyle
       BİREBİR aynı içerik (bkz. renderMap). Kalıcı çarpan satırı haritada
       olduğu gibi burada da yok — Figma taslağında yer almıyor. */
    $('storeCoinVal').textContent = String(s.coins);
    $('storeStageVal').textContent = stageText(s);
    el.ssRound.textContent = roundText(s);
    fitStageVal($('storeStageVal')); fitStageVal(el.ssRound);
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
    /* P109 (kullanıcı onayı, B seçeneği) — indirim etiketi: üstü çizili eski fiyat + indirim oranı,
       düğmenin üstünde ortalı kırmızı etiket (eskiden düğme yazısının içindeydi, taşıyordu) */
    const anarOld = (o) => (o.basePrice && o.basePrice > o.price)
      ? `<span class="anar-old"><s>${o.basePrice}</s> ${t('discPct', Math.round((1 - o.price / o.basePrice) * 100))}</span>` : '';
    s.store.items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = `store-item viz r-${item.rarity}` + (item.sold ? ' sold-out' : '') + (item.locked ? ' locked' : '');
      card.dataset.sidx = i;   // P120 — satın alma uçuşunun kaynağı
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
        /* P107 — 🤝 düğmenin dışına taşıyordu; indirim üstü çizili eski fiyatla zaten görünüyor */
        btn.innerHTML = `${anarOld(item)}${t('stBuy', item.price)}`;
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
          /* P107 (kullanıcı: "pazarlık düğmesi düzgün değil, YENİ rozetini kapatıyor") — düğme kartın
             İÇİNDE, Satın Al'ın altında; kısa etiket, uzun açıklama ipucunda. */
          hb.textContent = t('haggleCard');
          hb.title = t('haggleBtn');
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
          fb.textContent = t('stealCard');
          fb.title = t('stealBtn');
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
          const g = grabFly(card.querySelector('.st-frame') || card), c0 = s.coins;   // P120
          const res = Game.buyConsumable();
          if (!res.ok) { toast(res.error); return; }
          toast(t('consumBought', T.consumName(c.key, c.name)), true);
          SFX.coin();
          renderStore();
          flyGrabTo(g, buyTarget({ type: 'consum' })); coinDrop(c0);
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
          const c0 = s.coins;
          const res = Game.buyPack(pi);
          if (!res.ok) { toast(res.error); return; }
          SFX.coin();
          coinDrop(c0);   // P120
          /* Grup F: içerik artık doğrudan cebe düşmez — paket türüne göre
             seçim ekranı ya da slot makinesi açılır, notify/render orada.
             P109 — slot makinesi dönerken arkadaki store YENİLENMEZ: yenilenince ödül joker
             panelinde önceden görünüyordu (sonucu ele veriyordu). "Ödülü Al" yeniler. */
          if (res.mode === 'choice') renderStore();
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
      /* denetim3 #11 (kullanıcı: "store ipucuna gerek yok, öğretici anlatıyor") — store ipucu kalktı;
         Kumarhane'de store'un yalnız stage sonunda açıldığını run'ın ilk ipucu söylüyor */
      if (s.store.items.some(i => i.catchUp)) Hints.show('catchUp');
      /* P43: "TAKAS: jokerine tıkla, farkı öde" ipucu kalktı — tooltip'teki Takas
         düğmesi kullanıcı kararıyla silindi, ipucu artık olmayan bir düğmeyi tarif ederdi. */
    }
    clampBadges(); // şeritlerdeki süre rozetleri kenardan taşmasın (Grup F)
    if (!TUT.active && storeOpen()) saveGame('inStore'); // Grup C
    if (TUT.active) TUT.update();
  }

  el.btnReroll.addEventListener('click', () => {
    const c0 = Game.state.coins;
    const res = Game.rerollStore();
    if (!res.ok) { toast(res.error); return; }
    SFX.reroll();   // P113
    renderStore();
    coinDrop(c0);   // P122
    if (!fxOff()) document.querySelectorAll('#storeRowA .store-item:not(.sold-out)').forEach((c, i) => {   // P122 — kart kart dönerek açılır
      c.animate([{ transform: 'scaleX(0) translateY(-10px)' }, { transform: 'scaleX(0) translateY(-10px)', offset: .01 },
        { transform: 'scaleX(1.08) translateY(-6px)', offset: .7 }, { transform: 'none' }],
        { duration: 340 * fxK(), delay: i * 90 * fxK(), easing: 'ease-out', fill: 'backwards' });
      setTimeout(() => beep(700 + i * 120, .04, 'triangle', .05), i * 90 * fxK());
    });
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
      /* P71 — final stage'inde "5/5" değil FİNAL (stageOf boş) */
      stage: Game.isFinalStage() ? t('stageFinal') : `${s.stage}`,
      stageOf: Game.isFinalStage() || !Number.isFinite(chCount()) ? '' : `/${chCount()}`,
      /* P71 — final stage'i tek raund: 4 stage × 3 + 1 = 13. raund (roundInStage 3 değil) */
      round: `${(s.stage - 1) * 3 + (Game.isFinalStage() ? 1 : s.roundInStage)}`,
      mult: `+${(s.permMult || 0).toFixed(1)}x`,
    };
  }
  const epRow = (label, value, cls = '', wide = false) =>
    `<div class="ep-row${wide ? ' ep-wide' : ''}"><span class="ep-lbl">${label}</span>`
    + `<span class="ep-val ${cls}">${value}</span></div>`;

  /* P94 · MADDE 4 (kullanıcı isteği 2026-10-13, Balatro örneği) — OYUN SONU
     PANELİNDE MÜHÜR: ana menüdeki maskot panelin sağında durur, altında
     sonuca göre rastgele tek cümlelik bir söz (TR/EN havuzu `epQuipLose`/
     `epQuipWin`). Maskot menüdekiyle birebir: kazanılmış final eşyaları
     (Lady Luck kalpleri, Orion şapkası) menüdeki <img>'lerin kopyasıyla
     aynı yerde. Dar ekranda (<1240 px) panelin altına iner. */
  function epMuhur(kind) {
    const pool = t(kind === 'win' ? 'epQuipWin' : 'epQuipLose') || [];
    const quip = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
    const wrap = document.createElement('div');
    wrap.className = 'ep-muhur';
    wrap.innerHTML = `<div class="ep-msc"><div class="ep-msc-in"><i class="ep-msc-body"></i></div></div>`
      + `<div class="ep-quip">${quip}</div>`;
    const inner = wrap.querySelector('.ep-msc-in');
    document.querySelectorAll('.fm-mascot-item.on').forEach((im) => {
      const c = im.cloneNode(true);
      c.classList.remove('fm-mascot-item', 'on');
      c.classList.add('ep-msc-item');
      inner.appendChild(c);
    });
    return wrap;
  }

  function endPanel(kind, title, leftHtml, rightHtml, footHtml) {
    for (const id of ['runCompleteOv', 'gameOverOv']) document.getElementById(id)?.remove();
    const ov = document.createElement('div');
    ov.id = kind === 'win' ? 'runCompleteOv' : 'gameOverOv';
    ov.className = `ep-ov ep-${kind}`;
    ov.innerHTML = `<div class="ep-box"><h2 class="ep-title">${title}</h2>`
      + `<div class="ep-body"><div class="ep-left">${leftHtml}</div><div class="ep-right">${rightHtml}</div></div>`
      + (footHtml ? `<div class="ep-foot">${footHtml}</div>` : '') + `</div>`;
    updateMascotItems();
    ov.classList.add('has-muhur');
    ov.appendChild(epMuhur(kind));   // panelle yan yana, grup olarak ortalı (dar ekranda alta iner)
    /* P94d — Gambonanza sahnesi: kayıpta yenen boss arkada, zaferde konfeti.
       (Run sonu joker şeridi denendi, kullanıcı istemedi — P64 kararıyla aynı.) */
    const s = Game.state;
    const scene = document.createElement('div');
    scene.className = 'ep-scene';
    const boss = kind === 'lose' && Game.isBossRound && Game.isBossRound() && s.boss;
    if (boss && JOKER_ART.has(s.boss.key)) scene.innerHTML = `<div class="ep-boss-bg jk-${s.boss.key}"></div>`;
    if (kind === 'win') {
      const cols = ['#FFD45A', '#FF6B6B', '#5BE38C', '#6BB8FF', '#E58CFF', '#FBECC4'];
      let h = '<div class="ep-confetti">';
      for (let i = 0; i < 46; i++)
        h += `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${cols[i % cols.length]};`
          + `animation-duration:${(3 + Math.random() * 4).toFixed(2)}s;animation-delay:-${(Math.random() * 6).toFixed(2)}s"></i>`;
      scene.innerHTML = h + '</div>';
    }
    ov.prepend(scene);
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
    if (s.seed) out.push(`${t('seedLabel')}: ${s.seed}${s.seeded ? ' (' + t('seedEntered') + ')' : ''}`);   // P114
    out.push(t('rpMeta', mode, when, mins));
    out.push(t('rpMusic', Music.on ? t('musicSet' + Music.set) : t('musicOff')));   // P66b — arkadaş testi
    const where = Game.isFinalStage() ? `S${s.stage} ${t('stageFinal')}` : `S${s.stage} R${s.roundInStage}`;
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
      if (e.bj) parts.push(t('rpBj', t('bjRes_' + e.bj.result, Math.abs(e.bj.net)), e.bj.net >= 0 ? `+${e.bj.net}` : `${e.bj.net}`));
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
    ov.querySelectorAll('.ep-seed-copy').forEach((b) => b.addEventListener('click', () => { copyText(b.dataset.seed); toast(t('seedCopied'), true); }));   // P114
    const b = ov.querySelector('#epCopy');
    if (b) b.addEventListener('click', () => {
      copyText(text);
      b.textContent = t('epCopied');
      toast(t('epCopiedToast'), true);
    });
  }

  /* GAME OVER — kullanıcı örneği 2 */
  /* P122 · D — kayıpta önce ıstakadaki taşlar düşer, panel ardından gelir (hareket kapalıysa anında) */
  function showGameOver() {
    if (fxOff()) { showGameOverNow(); return; }
    rackFall();
    setTimeout(showGameOverNow, 820 * fxK());
  }
  function showGameOverNow() {
    const s = Game.state;
    LStats.run(s, false);   // P88
    const st = endStats(s);
    clearSave();
    betaHook('runEnd', { kind: 'lost' });
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
      epRow(t('epRerolls'), st.rerolls, 'c-green')
      + (s.seed ? epRow(t('seedLabel'), `<span class="ep-seed">${s.seed}</span><button type="button" class="ep-seed-copy" data-seed="${s.seed}">${t('seedCopy')}</button>`, '', true) : '');   // P114;
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
    LStats.run(Game.state, true);   // P88
    const res = Game.completeRun();
    const st0 = res.stats || Game.runStats();
    clearSave();
    SFX.win();
    /* GRUP R (P20) — İLK TEMEL RUN TAMAMLANDI: kilitler açılır.
       Trainer run'ı kayıt yazmaz, bu yüzden kilidi de açmaz. */
    let openedModes = [];
    /* denetim SY-07 — seed'li run kilit açmaz ("istatistiklere, keşiflere ve kilitlere sayılmaz") */
    if (!Game.trainerMode && !Game.state.seeded) openedModes = Modes.complete(Game.state.runMode || 'base');   // kazanılan mod (Kumarhane → Lanetli kilidi)
    /* P71 — modun final boss'u yenildiyse ödül kalıcı açılır (Trainer hariç) */
    const finKey = Game.finalBeaten();
    const finNew = finKey && !Game.state.seeded ? Finals.unlock(finKey) : false;   // P114: seed'li run kilit açmaz
    betaHook('runEnd', { kind: 'won' });
    if (openedModes.length) betaHook('modesOpened', { keys: openedModes.map((m) => m.key) });
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
      epRow(t('epRerolls'), st.rerolls, 'c-green')
      + (s.seed ? epRow(t('seedLabel'), `<span class="ep-seed">${s.seed}</span><button type="button" class="ep-seed-copy" data-seed="${s.seed}">${t('seedCopy')}</button>`, '', true) : '');   // P114;
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
      (finNew ? `<div class="ep-note ep-final">${t('finalUnlocked', T.bossName(finKey, FINAL_BOSSES[finKey]?.name || finKey), FINAL_BOSSES[finKey]?.icon || '★')}</div>` : '') +   // denetim3 #26
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
    loopReels(items, {   // P109 — STOP yok, çarklar kendileri durur
      auto: (i) => 1.2 + i * 0.5,
      onLand: (i) => { cards[i].classList.remove('spinning'); cards[i].classList.add('landed'); },
      onDone: () => {
        el.upgradeOverlay.classList.remove('spin-lock');
        grantUpgrades();
      },
    });
  }

  /* Playtest 10: yenileme (reroll) kaldırıldı — seçim yokken "yeniden
     dağıt" hakkı anlamsız. Yerine tek DEVAM düğmesi: ödülleri kapatıp
     store sahnesine geçer (çark yarıda kesilse bile ödül kaybolmaz). */
  el.btnUpContinue.addEventListener('click', () => {
    if (el.btnUpContinue.disabled) return;
    Game.closeUpgradeOffer();
    el.upgradeOverlay.classList.add('hidden');
    /* P92 — öğreticide boss ödülünden sonra store yok: Mühür bitirir */
    if (TUT.active && Game.state.roundInStage === 3) { TUT.finish(); return; }
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
    'medusa',                                 // P67 · Figma 420:2 (Legendary 3/15)
    'nostradamus',                            // P71 · Figma 428:2 (Legendary 4/15)
    'ladyLuck',                               // P72 · Figma 444:2 (FINAL_BOSS_JOKERLER 436:2) — Kumarhane finali
    'rusvet', 'midas',                        // P73 · Figma 444:41 Bahşiş + 444:84 Midas (Legendary 6/15)
    'ucuncuTeker',                            // P75 · Figma 450:2 → P89 464:219 "Tek Teker" (eski adı Üçüncü Teker)
    /* P89 · Figma LEGENDARY_JOKERLER 383:1000 — Legendary 15/15 */
    'ankaKusu', 'atesTuccari', 'hidra', 'kaioken', 'truva', 'satrancSaati', 'sisyphus', 'vasiyet',
    /* P91 · Figma RARE-JOKERLER 468:256 — ilk Rare çizimleri */
    'fuzyon', 'sarmasik',
    'vampir', 'paratoner', 'sansliYedili',   // P100 · Figma 469:2 / 475:2 (Şimşek Avcısı) / 476:25
    'bungieGum', 'tercuman', 'ikiYuzlu',
    'krupiye',
    /* denetim3 #50 · Figma RARE-JOKERLER 468:256 — kalan Rare çizimleri (Rare 24/24) */
    'hipnotizor', 'tradeJokeri', 'terzi', 'terazi', 'katalizor', 'dedikodu', 'rulet', 'martingale',
    'hileliZar', 'sansliZar', 'yanki', 'zincir', 'kumarbaz', 'bitki', 'yankee', 'ayna',
    /* 2026-10-29 · Figma COMMON-JOKERLER 520:13 — Common çizimleri (25 kart, 2026-10-30 tamamlandı) */
    'sayiTapinagi', 'anarsist', 'bereket', 'copcu', 'ikizler', 'islemeci', 'kucukTas', 'takim', 'kalabalikPer', 'ciftFirtina', 'renkUstasi', 'uzunKosu', 'kosucu',
    'ciftVurus', 'sunger', 'fisUstasi', 'fisilti', 'buyukTas', 'mezarci', 'tekRenkRuhu', 'hizliTuketici', 'kartSayici', 'doluEl', 'bosCep', 'seriAcici']);   // Common 25 (P119b: + Timsah, Kart Sayıcı, Dolu Bardak, Boş Bardak, Domino — tüm Common'lar çizildi) · Common 20: + Boks Eldiveni, Kumarhane Fiş Kulesi, Lanetli Sünger / Fısıltı / Mezarcı, Dev Kabak (Figma 'Balkabağı'), Boya Fırçası   // P105 · Figma 488:85 Krupiye (kumarhane Legendary)   // P105 · Figma 485:2 Bungee_gum / 485:35 Renk_körü / 485:21 Two_face

  const SPECIAL_ART = new Set(['altin', 'gumus', 'bakir', 'zumrut',
    'karaDelikTasi', 'aynaTasi', 'yildizTasi', 'zamanTasi', 'ates',
    'yankiTasi', 'ayTasi']);   // ayTasi: 2026-10-29 · Figma 540:4163 (V1)

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
  function colJokerCard(def, opts = {}) {
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
    /* P98 — varyantı olan kart: sağ altta ◆ rozeti, tıklayınca varyant penceresi.
       (P30/P35'te Pandora ve Corporates varyantları ipucunda yazı satırıydı;
       artık çizimleriyle pencerede, ipucunda yalnız "Tıkla" satırı.) */
    /* trainer'da tıklama kartı SEÇER — varyant penceresi açılmaz (denetim3: Bukalemun/Damga varyantları eklenince seçimi kesiyordu) */
    const nVar = !opts.noVar && JOKER_VARIANTS[def.key] ? JOKER_VARIANTS[def.key].list().length : 0;
    if (nVar) {
      tile2.classList.add('has-var');
      tile2.insertAdjacentHTML('beforeend', `<span class="col-var-badge">◆ ${nVar}</span>`);
      tile2.addEventListener('click', () => showVariants(def));
    }
    attachTip(tile2, { key: def.key, name: def.name, desc: def.desc,
      rarity: def.rarity, usesLeft: def.uses ?? RARITY[def.rarity].uses, varHint: nVar }, {});
    return tile2;
  }

  /* P98 — KOLEKSİYONDA VARYANTLAR (kullanıcı onayı 2026-10-14). Pencere her
     varyantı büyük çizim + ad + etkiyle gösterir; kartın normal hâli YOK
     (kullanıcı kararı). Tüccar / Öteki Dünya'da yalnız çizim değişir → etki
     yerine "ne zaman görünür". Yeni varyant = buraya bir satır (+ i18n). */
  const JOKER_VARIANTS = {
    truva: { icon: '🎁', list: () => Object.entries(Game.PANDORA_INFO || {}).map(([k, v]) => ({
      art: 'jk-truva pd-' + k, name: T.ev(v.name).split(' — ').pop(), desc: T.ev(v.desc) })) },
    corporates: { icon: '🏢', list: () => (Game.corpsInfo ? Game.corpsInfo() : []).map((c) => ({
      art: 'jk-corporates corp-' + c.key, name: T.ev(c.name).replace(/^\S+\s/, ''),
      desc: t('corpTipDesc', T.ev(c.text), T.ev(c.rewardText), T.ev(c.penaltyText)) })) },
    misunderstood: { icon: '🎭', list: () => [{ art: 'jk-misunderstood misu-v2', name: t('varName_misu'), desc: t('varDesc_misu') }] },
    tuccar: { icon: '💼', list: () => [{ art: 'jk-tuccar tuccar-v2', name: t('varName_tuccar'), desc: t('varDesc_tuccar') }] },
    otekiDunya: { icon: '🌙', list: () => [{ art: 'jk-otekiDunya oteki-flip', name: t('varName_oteki'), desc: t('varDesc_oteki') }] },
    /* denetim3 #50 — Bukalemun renkleri koleksiyonda görünür (Damga'nın aşamaları görünmez — kullanıcı 2026-10-23) */
    terzi: { icon: '🦎', list: () => ['red', 'blue', 'yellow', 'black'].map((c) => ({ art: 'jk-terzi bk-' + c, name: T.color(c), desc: t('varDesc_terzi') })) },
  };
  function showVariants(def) {
    const V = JOKER_VARIANTS[def.key];
    const list = V ? V.list() : [];
    if (!list.length) return;
    hideTip();
    document.getElementById('varOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'varOv';
    ov.className = 'pk-ov tone-gold var-ov';
    ov.innerHTML =
      `<div class="pk-box">` +
      `<div class="pk-title">${V.icon} ${t(list.length > 1 ? 'varTitle' : 'varTitle1')}</div>` +
      `<div class="pk-sub-title">${t('varSub_' + def.key)}</div>` +
      `<div class="pk-body pk-choice"></div>` +
      `<div class="pk-foot"><button class="btn ghost var-close">${t('varClose')}</button></div></div>`;
    const body = ov.querySelector('.pk-body');
    list.forEach((v, i) => {
      const c = document.createElement('div');
      c.className = `pk-card r-${def.rarity} var-card`;
      c.style.animationDelay = `${i * 0.11}s`;
      /* P121 (kullanıcı 2026-10-30) — kartın altında ad/açıklama YAZMAZ; üstüne gelince ipucunda */
      c.innerHTML = `<div class="col-jk-art ${v.art}"></div>`;
      attachTip(c, { name: v.name, rarityText: T.rarity(def.rarity), accent: def.rarity, desc: v.desc }, {});
      body.appendChild(c);
    });
    // Esc yalnız bu pencereyi kapatır (arkadaki koleksiyon açık kalır)
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
    ov.querySelector('.var-close').addEventListener('click', close);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(ov);
    SFX.tick();
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
  const COL_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic', 'final'];
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
    out.push({ key: 'kumarhane', rarity: 'tema', name: t('musKumarhane'), desc: t('mus_kumarhane') });            // P72c
    out.push({ key: 'kumarhaneStore', rarity: 'store', name: 'Store · ' + t('musKumarhane'), desc: t('mus_kumarhaneStore') });
    out.push({ key: 'kozmik', rarity: 'tema', name: t('musKozmik'), desc: t('mus_kozmik') });            // P104
    out.push({ key: 'kozmikStore', rarity: 'store', name: 'Store · ' + t('musKozmik'), desc: t('mus_kozmikStore') });
    if (!BETA) {   // Lanetli Boyut yalnız prototipte
      out.push({ key: 'lanetli', rarity: 'tema', name: t('musLanetli'), desc: t('mus_lanetli') });
      out.push({ key: 'lanetliStore', rarity: 'store', name: t('musLanetliStore'), desc: t('mus_lanetliStore') });
    }
    for (const b of BOSSES) if (Music.TRACKS['b_' + b.key]) {
      out.push({ key: 'b_' + b.key, rarity: 'boss', boss: b.key, name: T.bossName(b.key, b.name), desc: t('mus_b_' + b.key) });
    }
    /* P71c — modların sabit final boss'ları (Lady Luck) da listede */
    for (const fb of Object.values(typeof FINAL_BOSSES !== 'undefined' ? FINAL_BOSSES : {})) if (Music.TRACKS['b_' + fb.key] && !(BETA && fb.key === 'lanetliCocuk')) {
      out.push({ key: 'b_' + fb.key, rarity: 'boss', boss: fb.key, name: T.bossName(fb.key, fb.name), desc: t('mus_b_' + fb.key) });
    }
    out.push({ key: 'bossGenel', rarity: 'boss', name: t('musBossGenel'), desc: t('mus_bossGenel') });
    if (!BETA) out.push({ key: 'lanetliBoss', rarity: 'boss', name: t('musLanetliBoss'), desc: t('mus_lanetliBoss') });   // Lanetli Boyut yedek boss parçası
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
  /* P101 — KEŞFEDİLMEMİŞ KART (Figma 480:3664 "KİLİTLİ_JOKERLER": zincirli
     asma kilit). Adı/nadirliği/etkisi gizli; ipucu Balatro'daki gibi yalnız
     nasıl keşfedileceğini söyler. Final boss jokeri "Kilitli" başlığı ve
     kendi açılma koşuluyla. */
  /* kullanıcı 2026-10-28 — iki ayrı durum:
     · KİLİTLİ (asma kilit): kartın ait olduğu mod henüz açılmamış — ipucu hangi modun kilidini açmak gerektiğini söyler.
     · BULUNAMADI (bulunamadi.svg): kart elde edilebilir ama henüz bulunmadı.
     Moda özel kartlar (Kumarhane …) iki durumda da o modun renginde soluk görünür (cm-mode-<mod>). */
  const cardModeOf = (d) => (d.casino ? 'hizli' : d.mode || null);
  function colLockedCard(catKey, d) {
    const c = document.createElement('div');
    const fin = d.rarity === 'final';
    const mode = cardModeOf(d);
    const modeLocked = !!mode && !Modes.unlocked(mode);
    const locked = fin || modeLocked;
    c.className = 'col-lock-card' + (mode ? ' cm-mode-' + mode : '');
    c.innerHTML = `<div class="${locked ? 'col-lock-art' : 'col-nf-art'}"></div>`;
    const desc = fin ? (t('finalLockedHint_' + d.key) || t('finalLockedHint'))
      : modeLocked ? t('colModeLocked', t('modeShort_' + mode))
      : mode ? t('colModeFind', t('modeShort_' + mode))
      : t('undiscDesc_' + (d.rarity === 'epic' ? 'boss' : catKey));
    attachTip(c, { name: t(locked ? 'lockedTitle' : 'undiscTitle'), desc }, {});
    return c;
  }
  function colFinalCard(d) {
    const c = colJokerCard(d);
    if (!Finals.has(d.key)) { c.classList.add('col-locked'); c.title = t('finalLockedHint_' + d.key) || t('finalLockedHint'); }
    return c;
  }
  const COL_CATS = [
    /* P100 (kullanıcı isteği 2026-10-14) — kumarhane jokerleri Jokerler bölümünün İÇİNDE;
       üstteki "Kumarhane" çipi yalnız onları süzer (ayrı bölüm kalktı). */
    /* kullanıcı 2026-10-28 — Kumarhane filtresi kalktı; moda özel kartlar kendi nadirliklerinde, mod renginde */
    { key: 'jokers', ico: '🃏', big: true, disc: 'joker', filters: ['all', 'common', 'rare', 'legendary', 'mythic'],
      filterLabel: (f) => (f === 'all' ? t('colAll') : T.rarity(f)),
      filterFn: (d, f) => d.rarity === f,
      items: () => byRarity(Object.values(JOKER_DEFS).filter(d => d.rarity !== 'epic' && d.rarity !== 'final' && !d.cursed)), card: (d) => colJokerCard(d) },
    /* P71b (kullanıcı: "final boss jokerleri ayrı bölüm olmasın") — Boss Jokerleri
       artık iki nadirliği birlikte taşır: Hepsi / Boss / Final Boss çipleri, diğer
       joker bölümleriyle aynı filtre mantığı (d.rarity === filtre). Final boss
       jokerleri önde; açılmamışsa gri/kilitli (colFinalCard). */
    { key: 'boss', ico: '👹', disc: 'joker', filters: ['all', 'epic', 'final'],
      filterLabel: (f) => (f === 'epic' ? t('colF_boss') : t('colF_finalBoss')),
      items: () => [...Object.values(JOKER_DEFS).filter(d => d.rarity === 'final' && !(BETA && d.mode === 'lanetli')),   // Oyuncak Kutusu betada yok
        ...Object.values(JOKER_DEFS).filter(d => d.rarity === 'epic')],
      card: (d) => (d.rarity === 'final' && !Disc.known('joker', d) ? colFinalCard(d) : colJokerCard(d)) },
    { key: 'consum', ico: '🪄', disc: 'consum', items: () => byRarity(Object.values(CONSUMABLES).filter(d => !d.cursed)), card: (d) => colConsumCard(d) },
    { key: 'special', ico: '💠', disc: 'special', items: () => Object.values(SPECIAL_TILES), card: (d) => colSpecialCard(d) },
    { key: 'upgrade', ico: '⭐', disc: 'upgrade', items: () => Object.values(UPGRADE_DEFS), card: (d) => colUpgradeTile(d) },
    /* Lanetli Boyut (2026-10-29) — lanetli joker + değnek + totem kendi kategorisinde; betada mod gizli → kategori yok */
    ...(BETA ? [] : [{ key: 'cursed', ico: '🜏', filters: ['all', 'joker', 'consum', 'totem'], filterLabel: (f) => t('colF_cursed_' + f),
      filterFn: (d, f) => d._kind === f,
      items: () => [...byRarity(Object.values(JOKER_DEFS).filter(d => d.cursed)).map(d => ({ ...d, _kind: 'joker' })),
        ...byRarity(Object.values(CONSUMABLES).filter(d => d.cursed)).map(d => ({ ...d, _kind: 'consum' })),
        ...Object.values(TOTEM_DEFS).map(d => ({ ...d, _kind: 'totem' }))],
      card: (d) => (d._kind === 'joker' ? colJokerCard(d) : colCursedTile(d)) }]),
    { key: 'modes', ico: '🎮', items: () => Modes.statusRows(), card: null },
    { key: 'music', ico: '🎵', filters: ['all', 'tema', 'store', 'boss'], filterLabel: (f) => t('musF_' + f),
      items: () => musicCatalog(), card: (d) => colMusicCard(d) },
  ];
  function colCursedTile(d) {   // lanetli değnek / totem: çizimler gelene kadar simge
    const totem = d._kind === 'totem';
    const c = document.createElement('div');
    c.className = `joker-tile r-${d.rarity || 'common'} col-tile`;
    const nm = totem ? d.name : T.consumName(d.key, d.name);
    c.innerHTML = `<div class="col-icon">${d.icon}</div><div class="jt-name">${nm}</div>`;
    attachTip(c, { name: nm, accent: d.rarity, rarityText: `${totem ? t('totemTag') : t('consumTag')} · ${T.rarity(d.rarity)}`,
      desc: totem ? `${d.desc}<br><b>${t('totemCost')}</b> ${d.cost}` : T.consumDesc(d.key, d.desc) }, {});
    return c;
  }
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
          + `<span class="cc-count">${c.disc ? `${Disc.count(c.disc, c.items())}/${c.items().length}` : c.items().length}</span>`;
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
    /* P101 — keşifli bölümde çip yalnız o filtreden EN AZ BİR keşfedilmiş kart
       varsa görünür (hiç keşif yokken kaç Mythic olduğu belli olmasın);
       tek çip bile açılınca başına "Hepsi" gelir. */
    const knownOf = (d) => !cat.disc || Disc.known(cat.disc, d);
    const fitF = (d, f) => (cat.filterFn ? cat.filterFn(d, f) : d.rarity === f);
    let filters = cat.filters;
    if (filters && cat.disc) {
      const kn = cat.items().filter(knownOf);
      filters = filters.filter((f) => f !== 'all' && kn.some((d) => fitF(d, f)));
      if (filters.length) filters = ['all', ...filters];
      if (!filters.includes(colFilter)) colFilter = 'all';
    }
    if (filters && filters.length) {
      const chips = document.createElement('div');
      chips.className = 'col-chips';
      for (const f of filters) {
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
    if (cat.filters && colFilter !== 'all') items = items.filter(d => knownOf(d) && fitF(d, colFilter));
    const pages = Math.max(1, Math.ceil(items.length / COL_PAGE));
    colPage = Math.min(Math.max(0, colPage), pages - 1);
    const grid = document.createElement('div');
    grid.className = 'col-page-grid col-well col-cat-' + cat.key;
    for (const d of items.slice(colPage * COL_PAGE, (colPage + 1) * COL_PAGE))
      grid.appendChild(knownOf(d) ? cat.card(d) : colLockedCard(cat.disc, d));
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
    const order = ['common', 'rare', 'epic', 'legendary', 'mythic', 'final'];
    /* Lanetli Boyut (2026-10-29) — lanetli eşyalar kendi rafında; betada mod gizli olduğu için hiç görünmez */
    const all = Object.values(JOKER_DEFS).filter((d) => !d.cursed);
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
        const tile2 = rar === 'final' ? colFinalCard(def) : colJokerCard(def);
        grid.appendChild(tile2);
      }
      el.colBody.appendChild(grid);
    }
    /* LANETLİ BOYUT rafı: lanetli jokerler + değnekler + totemler (çizimler gelene kadar simgeyle) — yalnız prototip */
    if (!BETA) {
      const cj = Object.values(JOKER_DEFS).filter((d) => d.cursed).sort((x, y) => order.indexOf(x.rarity) - order.indexOf(y.rarity));
      const cc = Object.values(CONSUMABLES).filter((d) => d.cursed);
      const ct = Object.values(TOTEM_DEFS);
      const head = document.createElement('div');
      head.className = 'col-rar-head tr-legendary col-casino-head col-cursed-head';
      head.innerHTML = `🜏 ${t('colCursed')} <span>${t('colCount', cj.length + cc.length + ct.length)}</span><small>${t('colCursedNote')}</small>`;
      el.colBody.appendChild(head);
      const grid = document.createElement('div');
      grid.className = 'col-grid tr-col-tiles col-casino col-cursed';
      for (const d of cj) grid.appendChild(colJokerCard(d));
      for (const d of [...cc, ...ct]) {
        const c = document.createElement('div');
        c.className = `joker-tile r-${d.rarity || 'common'} col-tile`;
        c.innerHTML = `<div class="col-icon">${d.icon}</div><div class="jt-name">${d.cost ? d.name : T.consumName(d.key, d.name)}</div>`;
        attachTip(c, { name: d.cost ? d.name : T.consumName(d.key, d.name), accent: d.rarity,
          rarityText: `${d.cost ? t('totemTag') : t('consumTag')} · ${T.rarity(d.rarity)}`,
          desc: d.cost ? `${d.desc}<br><b>${t('totemCost')}</b> ${d.cost}` : T.consumDesc(d.key, d.desc) }, {});
        grid.appendChild(c);
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
      const cons = Object.values(CONSUMABLES).filter((d) => !d.cursed)
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
      [t('riStage'), stageText(s)],
      [t('riRound'), roundText(s)],
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
    /* denetim UI-09 — pencere dilinde: pp-box (koyu panel + başlık plakası), kapatma = tema düğmesi */
    p.innerHTML = `<div class="ri-card pp-box"><h3>${t('riTitle')}</h3>` +
      rows.map(([k, v]) => `<div class="ri-row"><span>${k}</span><b>${v}</b></div>`).join('') +
      `<button class="ep-btn ri-close">${t('close')}</button></div>`;
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
  /* P72 — "FİNAL" yazısı "5/8" için ölçülmüş kutulara sığmıyordu (kenarlara
     dayanıyordu): yalnız final stage'de kutuya sığana kadar küçülür. */
  function fitStageVal(node) {
    if (!node) return;
    node.style.fontSize = '';
    if (!(Game.isFinalStage && Game.isFinalStage())) return;
    if (!node.offsetWidth) return;
    /* kenardan pay bırakarak sığdır: metin kutunun %82'sine inene kadar 1px küçült */
    const rg = document.createRange();
    let size = parseFloat(getComputedStyle(node).fontSize) || 24;
    const min = Math.max(10, Math.round(size * .45));
    const room = node.clientWidth * .82;
    for (;;) {
      rg.selectNodeContents(node);
      const w = rg.getBoundingClientRect().width / ((node.getBoundingClientRect().width / node.offsetWidth) || 1);
      if (w <= room || size <= min) break;
      size -= 1;
      node.style.fontSize = size + 'px';
    }
  }

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

  const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic', 'final'];

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
      const defs = Object.values(JOKER_DEFS).filter(d => d.rarity === r && !(BETA && (d.cursed || d.mode === 'lanetli')));   // betada Lanetli Boyut yok
      if (!defs.length) continue;
      const h = document.createElement('div');
      h.className = `tr-rar tr-${r}`;
      h.textContent = T.rarity(r);
      wrap.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'tr-grid col-grid ' + (COL_ART_RARITIES.has(r) || rarityHasArt(r) ? 'col-jk-row' : 'tr-col-tiles');
      for (const d of defs) {
        const card = trPickCard(colJokerCard(d, { noVar: true }), T.name({ key: d.key, name: d.name }),
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

  /* P83 — TRAINER KURULUMU OYUNUN UI DİLİNDE + BOSS TESTİ (kullanıcı 2026-10-08:
     "trainer mod'a boss raundlarını sadece başlatıp test edebileceğim bir arayüz"
     + "trainer modunun seçim arayüzü falan hepsini oyuna uygun yap").
     Pencere = oyunun pencere dili (P62b/P64): tema koyu panel, açık kenar, üstte
     başlık PLAKASI, gömme koyu iç alan, açık kartlar, STOP gibi basılan düğmeler.
     İki sekme:
       · SERBEST RUN — eski kurulum: kadroyla run'a başlar, haritadan ilerler.
       · BOSS TESTİ  — boss seç → doğrudan o boss'un raundu (Game.startBossTest);
                       raund bitince sonuç penceresi (tekrar / başka boss / menü).
     Kadro (joker / değnek / deste) ve seçenekler iki sekmede ORTAK ve pencere
     kapanınca da hatırlanır (trPrefs): aynı kadroyla başka boss'u denemek tek tık.
     Düzen: solda kayan seçim alanı (.tr-body), sağda sabit ayar sütunu (.tr-foot)
     — "Başlat" hiçbir zaman kaydırma arkasında kalmaz (P20 · Grup K kuralı).
     Test kancaları korunur: .tr-panel/.tr-body/.tr-foot, h3 başlıklar, .tr-pick
     kartlar, #trMode/#trStages/#trCoins/#trHand/#trRack/#trUses/#trOkey* seçiciler,
     .tr-acts .btn.primary (başlat) / .btn.ghost (vazgeç). */
  const trPrefs = { tab: 'run', boss: null, jokers: new Set(), consums: new Set(), specials: new Set(), opts: null };
  let lastBossTest = null;
  const TR_TIER_LBL = { 1: 'trTier1', 2: 'trTier2', 3: 'trTier3', 4: 'trTierF' };

  function showTrainerSetup(o = {}) {
    document.getElementById('trainerSetup')?.remove();
    if (o.tab) trPrefs.tab = o.tab;
    const selJ = trPrefs.jokers, selC = trPrefs.consums, selS = trPrefs.specials;
    const ov = document.createElement('div');
    ov.id = 'trainerSetup';
    ov.className = 'tr-ov';
    const panel = document.createElement('div');
    panel.className = 'tr-panel';
    panel.dataset.tab = trPrefs.tab;
    const head = document.createElement('div');
    head.className = 'tr-head';
    head.innerHTML = `<div class="tr-plate">${t('trTitle')}</div>` +
      `<div class="tr-tabs">` +
      `<button type="button" class="tr-tab" data-tab="run">${t('trTabRun')}</button>` +
      `<button type="button" class="tr-tab" data-tab="boss">${t('trTabBoss')}</button></div>` +
      `<p class="tr-sub">${t('trSubtitle')}</p>`;
    panel.appendChild(head);
    const main = document.createElement('div');
    main.className = 'tr-main';
    panel.appendChild(main);
    const body = document.createElement('div');
    body.className = 'tr-body';
    main.appendChild(body);
    const foot = document.createElement('div');
    foot.className = 'tr-foot';
    main.appendChild(foot);

    /* ---- BOSS SEÇİMİ (yalnız BOSS TESTİ sekmesi) — kademe kademe ---- */
    const bossSec = document.createElement('div');
    bossSec.className = 'tr-sec tr-boss-only';
    const bh = document.createElement('h3');
    bossSec.appendChild(bh);
    const allBosses = BOSSES.concat(Object.values(typeof FINAL_BOSSES !== 'undefined' ? FINAL_BOSSES : {}).filter((fb) => !(BETA && fb.key === 'lanetliCocuk')));
    if (!trPrefs.boss || !allBosses.some(b => b.key === trPrefs.boss)) trPrefs.boss = allBosses[0].key;
    const tierOf = (b) => (b.final ? 4 : (BOSS_TIER[b.key] || 2));
    const bossBtns = [];
    for (const tier of [1, 2, 3, 4]) {
      const list = allBosses.filter(b => tierOf(b) === tier);
      if (!list.length) continue;
      const lab = document.createElement('div');
      lab.className = 'tr-rar tr-tier tr-tier-' + tier;
      lab.textContent = t(TR_TIER_LBL[tier]);
      bossSec.appendChild(lab);
      const g = document.createElement('div');
      g.className = 'tr-boss-grid';
      for (const b of list) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tr-boss' + (b.final ? ' tr-boss-final' : '');
        btn.dataset.boss = b.key;
        const has = JOKER_ART.has(b.key);
        btn.innerHTML = `<span class="tr-boss-art ${has ? 'jk-' + b.key : 'blank'}"></span>` +
          `<span class="tr-boss-name">${T.bossName(b.key, b.name)}</span><span class="tr-check">✓</span>`;
        btn.addEventListener('click', () => { trPrefs.boss = b.key; updBoss(); });
        g.appendChild(btn);
        bossBtns.push(btn);
      }
      bossSec.appendChild(g);
    }
    body.appendChild(bossSec);

    /* ---- KADRO: jokerler ---- */
    const jsec = document.createElement('div');
    jsec.className = 'tr-sec';
    const jh = document.createElement('h3');
    const updJh = () => { jh.textContent = `${t('trJokers')} — ${t('trPicked', selJ.size)}`; };
    updJh();
    jsec.appendChild(jh);
    const warn = document.createElement('p');
    warn.className = 'tr-hint';
    warn.textContent = t('trSlotWarn');
    jsec.appendChild(warn);
    jsec.appendChild(jokerPickGrid(selJ, (k) => {
      selJ.has(k) ? selJ.delete(k) : selJ.add(k);
      updJh(); updSum();
    }));
    body.appendChild(jsec);

    /* ---- değnekler ---- */
    const csec = document.createElement('div');
    csec.className = 'tr-sec';
    const ch = document.createElement('h3');
    /* P22 · Grup D: sınır motordan okunur (elle yazılsaydı Trainer 3 değnek
       seçtirir, motor üçüncüyü sessizce düşürürdü). */
    const cMax = MAX_CONSUMABLES;
    while (selC.size > cMax) selC.delete([...selC].pop());
    const updCh = () => { ch.textContent = `${t('trConsums', cMax)} — ${t('trPicked', selC.size)}`; };
    updCh();
    csec.appendChild(ch);
    const cg = document.createElement('div');
    cg.className = 'tr-grid col-grid col-cs-row';
    for (const d of Object.values(CONSUMABLES).filter((x) => !(BETA && x.cursed))) {   // betada lanetli değnek yok
      const b = trPickCard(colConsumCard(d), T.consumName(d.key, d.name), selC.has(d.key), () => {
        if (selC.has(d.key)) selC.delete(d.key);
        else if (selC.size < cMax) selC.add(d.key);
        b.classList.toggle('on', selC.has(d.key));
        updCh(); updSum();
      });
      cg.appendChild(b);
    }
    csec.appendChild(cg);
    body.appendChild(csec);

    /* ---- deste içeriği (P42): seçilen özel taşlar destenin tamamına dağılır ---- */
    const ssec = document.createElement('div');
    ssec.className = 'tr-sec';
    const sh = document.createElement('h3');
    const updSh = () => { sh.textContent = `${t('trDeckSp')} — ${t('trPicked', selS.size)}`; };
    updSh();
    sh.title = t('trDeckSpHint');
    ssec.appendChild(sh);
    const sg = document.createElement('div');
    sg.className = 'tr-grid tr-deck-sp col-grid col-sp-row';
    for (const d of Object.values(SPECIAL_TILES)) {
      const b = trPickCard(colSpecialCard(d), T.specialName(d.key, d.name), selS.has(d.key), () => {
        selS.has(d.key) ? selS.delete(d.key) : selS.add(d.key);
        b.classList.toggle('on', selS.has(d.key));
        updSh(); updSum();
      });
      b.dataset.sp = d.key;
      sg.appendChild(b);
    }
    ssec.appendChild(sg);
    body.appendChild(ssec);

    /* ---- SAĞ SÜTUN: boss özeti + ayarlar + düğmeler ---- */
    const fscroll = document.createElement('div');
    fscroll.className = 'tr-foot-scroll';
    foot.appendChild(fscroll);
    const sum = document.createElement('div');
    sum.className = 'tr-boss-sum tr-boss-only';
    fscroll.appendChild(sum);

    const row = document.createElement('div');
    row.className = 'tr-opts';
    const modeKeys = Game.runModeKeys ? Game.runModeKeys() : ['base'];
    const modeName = (k) => { const v = t('modeName_' + k); return v && v !== 'modeName_' + k ? v : k; };
    const opt = (lbl, ctl, cls = '') => `<label class="tr-opt ${cls}"><span class="tr-opt-l">${lbl}</span>${ctl}</label>`;
    const strip = (s) => String(s).replace(/^[^\p{L}\p{N}]+/u, '').replace(/:\s*$/, '');
    row.innerHTML =
      opt(strip(t('trMode')), `<select id="trMode">` +
        modeKeys.map(k => `<option value="${k}"${k === 'base' ? ' selected' : ''}>${modeName(k)}</option>`).join('') + `</select>`, 'tr-wide') +
      opt(strip(t('trStages')), `<select id="trStages">` +
        `<option value="1">1</option><option value="3">3</option><option value="4">4</option>` +
        `<option value="6">6</option><option value="8" selected>8</option><option value="12">12</option>` +
        `<option value="inf">${t('trInfinite')}</option></select>`, 'tr-run-only') +
      opt(t('trBossStage'), `<select id="trBossStage"><option value="auto" selected>${t('trStageAuto')}</option>` +
        Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('') + `</select>`, 'tr-boss-only') +
      opt(strip(t('trCoins')), `<input id="trCoins" type="number" min="0" max="999" value="20">`) +
      opt(strip(t('trHand')), `<select id="trHand"><option selected>15</option><option>17</option><option>19</option><option>21</option></select>`) +
      /* Joker süresi (2026-08-26): "Varsayılan" her jokerin kendi süresi */
      opt(strip(t('trUses')), `<select id="trUses"><option value="def" selected>${t('trUsesDefault')}</option>` +
        [1, 2, 3, 4, 5, 8, 10, 20].map(n => `<option value="${n}">${n}</option>`).join('') +
        `<option value="inf">${t('trUsesInf')}</option></select>`) +
      /* PLAYTEST 20 · GRUP J — EL DÜZENİ (deneysel, yalnız Trainer) */
      opt(strip(t('trRack')), `<select id="trRack"><option value="classic" selected>${t('trRackClassic')}</option>` +
        `<option value="free">${t('trRackFree')}</option></select>`, 'tr-wide') +
      /* Grup K — Okey Taşını elle seç; "Rastgele" seçilirse mevcut mantık sürer */
      opt(strip(t('trOkey')), `<span class="tr-pair"><select id="trOkeyColor"><option value="">${t('trOkeyRandom')}</option>` +
        COLORS.map(c => `<option value="${c}">${T.color(c)}</option>`).join('') + `</select>` +
        `<select id="trOkeyNum">` + Array.from({ length: 13 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('') +
        `</select></span>`, 'tr-wide');
    fscroll.appendChild(row);
    const $o = (id) => row.querySelector('#' + id);
    // önceki kurulumun seçenekleri geri gelir
    if (trPrefs.opts) for (const [id, v] of Object.entries(trPrefs.opts)) { const e = $o(id); if (e && v != null) e.value = v; }
    $o('trMode').addEventListener('change', (e) => {
      const n = Game.runModeStages ? Game.runModeStages(e.target.value) : 8;
      const sel = $o('trStages');
      if (![...sel.options].some(x => x.value === String(n)))
        sel.insertAdjacentHTML('beforeend', `<option value="${n}">${n}</option>`);
      sel.value = String(n);
      updBoss();
    });
    $o('trBossStage').addEventListener('change', updBoss);

    const sumLine = document.createElement('div');
    sumLine.className = 'tr-sum-line';
    fscroll.appendChild(sumLine);
    function updSum() { sumLine.textContent = t('trSummary', selJ.size, selC.size, selS.size); }
    updSum();

    const acts = document.createElement('div');
    acts.className = 'tr-acts';
    const bStart = document.createElement('button');
    bStart.className = 'btn primary ep-btn ep-blue';
    const bCancel = document.createElement('button');
    bCancel.className = 'btn ghost ep-btn ep-ghost';
    bCancel.textContent = t('trCancel');
    acts.append(bStart, bCancel);
    foot.appendChild(acts);

    const saveOpts = () => {
      trPrefs.opts = {};
      for (const id of ['trMode', 'trStages', 'trBossStage', 'trCoins', 'trHand', 'trRack', 'trUses', 'trOkeyColor', 'trOkeyNum'])
        trPrefs.opts[id] = $o(id).disabled ? ($o(id).dataset.prev || $o(id).value) : $o(id).value;
    };
    const cfgNow = () => {
      const chSel = $o('trStages').value;
      return {
        mode: $o('trMode').value || 'base',   // P58 · Grup D
        stages: chSel === 'inf' ? Infinity : parseInt(chSel, 10),
        jokers: [...selJ],
        consumables: [...selC],
        deckSpecials: [...selS],   // P42: deste içeriği (özel taşlar)
        coins: parseInt($o('trCoins').value, 10) || 0,
        handSize: parseInt($o('trHand').value, 10) || undefined,
        jokerUses: usesCfg($o('trUses').value),
        okey: okeyCfg(panel),
        rack: $o('trRack').value,   // GRUP J (P20)
      };
    };

    function updBoss() {
      const key = trPrefs.boss;
      for (const b of bossBtns) b.classList.toggle('on', b.dataset.boss === key);
      const def = allBosses.find(b => b.key === key);
      bh.textContent = `${t('trBossHead')} — ${T.bossName(def.key, def.name)}`;
      const st = $o('trBossStage').value;
      const modeSel = $o('trMode');
      const info = Game.bossTestInfo(key, modeSel.disabled ? (modeSel.dataset.prev || modeSel.value) : modeSel.value, st === 'auto' ? null : st);
      /* final boss (Lady Luck) kendi modunda oynanır — seçici o modu gösterir ve kilitlenir */
      const lock = info.final && trPrefs.tab === 'boss';
      if (lock && !modeSel.disabled) { modeSel.dataset.prev = modeSel.value; modeSel.value = info.mode; modeSel.disabled = true; }
      else if (!lock && modeSel.disabled) { modeSel.disabled = false; modeSel.value = modeSel.dataset.prev || modeSel.value; }
      const has = JOKER_ART.has(key);
      sum.innerHTML =
        `<div class="tr-bs-art ${has ? 'jk-' + key : 'blank'}"></div>` +
        `<div class="tr-bs-txt"><div class="tr-bs-name">${T.bossName(def.key, def.name)}</div>` +
        `<div class="tr-bs-tier">${t('trBossWhere', modeName(info.mode), info.stage)}</div>` +
        `<div class="tr-bs-desc">${T.bossDesc ? T.bossDesc(def.key, def.desc) : def.desc}</div>` +
        `<div class="tr-bs-target">${t('trBossTarget', info.target)}</div></div>`;
    }
    function setTab(tab) {
      trPrefs.tab = tab;
      panel.dataset.tab = tab;
      head.querySelectorAll('.tr-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      bStart.textContent = tab === 'boss' ? t('trBossStart') : t('trStart');
      body.scrollTop = 0;
      updBoss();
      fitBossNames();
    }
    // uzun boss adları (THE MISUNDERSTOOD) kartın genişliğine sığana kadar küçülür
    function fitBossNames() {
      if (!ov.isConnected) return;
      fitTileNames(ov);
      const run = () => { if (trPrefs.tab === 'boss') body.querySelectorAll('.tr-boss-name').forEach(n => fitText(n, 11, 7)); };
      run();
      if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => ov.isConnected && run());
    }
    head.querySelectorAll('.tr-tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
    setTab(trPrefs.tab);

    bStart.addEventListener('click', () => {
      hideTip();
      saveOpts();
      const cfg = cfgNow();
      if (trPrefs.tab === 'boss') {
        const st = $o('trBossStage').value;
        startBossTestRun({ ...cfg, boss: trPrefs.boss, stage: st === 'auto' ? null : parseInt(st, 10) });
        ov.remove();
        return;
      }
      Game.newTrainerRun(cfg);
      ov.remove();
      updateTrainerBadge();
      showScreen('map');
      showOkeyBanner();
    });
    bCancel.addEventListener('click', () => { hideTip(); saveOpts(); ov.remove(); });

    ov.appendChild(panel);
    document.body.appendChild(ov);
    fitBossNames();
  }
  el.btnTrainer.addEventListener('click', () => showTrainerSetup());
  // çizimsiz joker kutuları: piksel yazı geniş — uzun ad (Silahşorlar) kutuya sığana kadar küçülür
  function fitTileNames(root) {
    const run = () => root.querySelectorAll('.tr-col-tiles .jt-name').forEach(n => fitText(n, 11, 7));
    run();
    /* piksel yazı tipi henüz inmediyse ölçü yedek (dar) yazı tipiyle yapılır → hazır olunca tazele */
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => root.isConnected && run());
  }

  /* P83 — BOSS TESTİ: kur, doğrudan boss raunduna gir; bitince sonuç penceresi */
  function startBossTestRun(cfg) {
    lastBossTest = cfg;
    const r = Game.startBossTest(cfg);
    if (!r.ok) { toast(r.error, false); return; }
    updateTrainerBadge();
    enterTrainerRound();
  }
  /* haritadaki SEÇ düğmesiyle aynı giriş: boss sesi, Kumarhane'de kör bahis,
     raund başı olayları + pop-up'lar, Rulet/yan bahis panelleri */
  function enterTrainerRound() {
    SFX.boss();
    const go = () => {
      dealHand();   // P118
      showScreen('game');
      flushRoundStart();
      setTimeout(kumarStartPanels, 1500);
    };
    if (Game.needsBet && Game.needsBet()) showBetPicker(go);
    else go();
  }
  function showBossTestEnd(won) {
    const s = Game.state;
    document.getElementById('bossTestEnd')?.remove();
    const b = s.boss || {};
    const name = T.bossName(b.key, b.name);
    const has = JOKER_ART.has(b.key);
    const why = won ? '' : (s.bossFail ? T.ev(s.bossFail) : t('btNoTarget'));
    const row = (l, v) => `<div class="ep-row"><span class="ep-lbl">${l}</span><span class="ep-val">${v}</span></div>`;
    const ov = document.createElement('div');
    ov.id = 'bossTestEnd';
    ov.className = 'ep-ov ' + (won ? 'ep-win' : 'ep-lose');
    ov.innerHTML =
      `<div class="ep-box bt-box"><div class="ep-title">${won ? t('btWon') : t('btLost')}</div>` +
      `<div class="ep-body bt-body">` +
        `<div class="ep-defeat"><div class="ep-def-title">${t('btBoss')}</div><div class="ep-def-name">${name}</div>` +
          (has ? `<div class="ep-def-art jk-${b.key}"></div>` : '') +
          `<div class="ep-def-why">${T.bossDesc ? T.bossDesc(b.key, b.desc) : (b.desc || '')}</div></div>` +
        `<div class="ep-left">` +
          row(t('btScore'), `${s.score} <i>/ ${s.target}</i>`) +
          row(t('btTurn'), won && s.wonOnTurn ? `${s.wonOnTurn}. <i>/ ${s.maxTurns}</i>` : `${s.turn} <i>/ ${s.maxTurns}</i>`) +
          row(t('btStage'), `${s.stage} <i>/ ${Game.totalStages()}</i>`) +
          (why ? `<div class="bt-why">${why}</div>` : '') +
        `</div></div>` +
      `<div class="ep-foot">` +
        `<button type="button" class="ep-btn ep-blue" data-a="again">${t('btAgain')}</button>` +
        `<button type="button" class="ep-btn" data-a="pick">${t('btPick')}</button>` +
        `<button type="button" class="ep-btn ep-ghost" data-a="menu">${t('btMenu')}</button>` +
      `</div></div>`;
    const leave = () => {
      ov.remove();
      el.overlay.classList.add('hidden');
      el.storeOverlay.classList.add('hidden');
      el.upgradeOverlay.classList.add('hidden');
      document.querySelectorAll('.pk-ov, #okeyBanner').forEach(e => e.remove());
    };
    ov.querySelector('[data-a="again"]').addEventListener('click', () => { leave(); startBossTestRun(lastBossTest); });
    ov.querySelector('[data-a="pick"]').addEventListener('click', () => {
      leave(); Game.trainerMode = false; updateTrainerBadge(); showScreen('menu'); showTrainerSetup({ tab: 'boss' });
    });
    ov.querySelector('[data-a="menu"]').addEventListener('click', () => {
      leave(); Game.trainerMode = false; updateTrainerBadge(); showScreen('menu');
    });
    document.body.appendChild(ov);
  }

  // Raund girişinde opsiyonel store filtresi (yalnız trainer'da görünür)
  function showTrainerFilter() {
    document.getElementById('trainerFilter')?.remove();
    const cur = new Set(Game.state.trainerStoreFilter || []);
    const ov = document.createElement('div');
    ov.id = 'trainerFilter';
    const panel = document.createElement('div');
    panel.className = 'tr-panel';
    ov.className = 'tr-ov';
    panel.innerHTML = `<div class="tr-head"><div class="tr-plate">${t('trFilterTitle')}</div><p class="tr-sub">${t('trFilterHint')}</p></div>`;
    const fb = document.createElement('div');
    fb.className = 'tr-body';
    fb.appendChild(jokerPickGrid(cur, (k) => { cur.has(k) ? cur.delete(k) : cur.add(k); }));
    panel.appendChild(fb);
    const acts = document.createElement('div');
    acts.className = 'tr-acts';
    const bOk = document.createElement('button');
    bOk.className = 'btn primary ep-btn ep-blue';
    bOk.textContent = 'OK';
    bOk.addEventListener('click', () => {
      hideTip();
      Game.setStoreFilter([...cur]);
      if (cur.size) toast(t('trFilterSet', cur.size), true);
      ov.remove();
      renderMap();
    });
    const bClear = document.createElement('button');
    bClear.className = 'btn ghost ep-btn ep-ghost';
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
    fitTileNames(ov);
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
    if (!BETA && (e.key === 'F9' || (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')))) {
      e.preventDefault();
      showDiagnostics();
    } else if (e.key === 'Escape') {
      document.getElementById('diagOverlay')?.remove();
    }
  });

  applyStaticTexts();
  Game.newRun(); // arka planda hazır dursun (harita için)

  /* P71b — JOKER ÇİZİMLERİNİ ÖNCEDEN YÜKLE (arkadaş raporu: "Medusa koleksiyonda
     bazen hiç görünmüyor"). Çizimli kartın kabuğu bilinçli olarak yok (arkası
     şeffaf), bu yüzden SVG ağdan inene kadar kart TAMAMEN görünmez kalıyordu;
     yavaş bağlantıda koleksiyonu ilk açan kartı hiç görmüyordu. Açılışta her
     `jk-<anahtar>` için ekran dışı 1 px bir öğe çizilir → tarayıcı bütün joker
     çizimlerini baştan indirir. Yol yine CSS'te (`--jk-art`), JS'te yol yok
     (tek dosyalık sürüm kuralı). */
  {
    const pre = document.createElement('div');
    pre.className = 'art-preload';
    pre.setAttribute('aria-hidden', 'true');
    for (const k of JOKER_ART) {
      const d = document.createElement('div');
      d.className = 'jk-' + k;
      pre.appendChild(d);
    }
    // P91 — Pandora varyant çizimleri (kutu açılınca anında görünsün)
    for (const v of ['umut', 'salgin', 'armagan']) {
      const d = document.createElement('div');
      d.className = 'jk-truva pd-' + v;
      pre.appendChild(d);
    }
    document.body.appendChild(pre);
  }
  if (location.hash === '#map') showScreen('map');
  else if (location.hash === '#game') showScreen('game');
  else { showScreen('menu'); bootSplash(); }

  /* test kancaları (Playwright otomasyonu) — prototip aşamasında açık */
  if (!BETA) window.__test = {
    disc: Disc, pickBuyDest, fuzyonMenu, showUseChooser, render, renderStore, openStore, showUpgradeScene, showScreen, startNewRun, LStats, showSettings, showBeltPicker, TUT,
    showRoundEnd, showRunComplete, showPilePopup, fitLabels: fitActionLabels,
    pickOkeySlot,   // okey yerleşim penceresi (görsel test)
    showFeda, showCocukBanner,   // Lanetli Çocuk (görsel test)
    // Playtest 17 — Grup A/F doğrulaması için
    notify, showCoinFlip, pickFuzyon, flushRoundStart,
    // Playtest 19 — Grup E: Füzyon kullanım menüsü
    fuzyonMenu,
    // Playtest 19 — Grup G: The Cheating bildirimi
    cheatFlash, goNextRound,
    // P37 — bildirim kartları kapalı; eski testler kendi kontrolleri için açar
    setNotes: (on) => { NOTES_ENABLED = !!on; },
    // Playtest 18 — Grup E: dil değişimini test tarafında da gerçek akışla uygula
    applyStaticTexts, fitPauseMenu,
    // Playtest 20 — Grup R: mod kilit sistemi
    Modes, Finals,
    // P60 — run raporu + ipucu penceresi
    Hints, runReport, showGameOver, showBetPicker, showKatlaOffer, renderWell,
    // P61 — Kumarhane hissi
    Music, applyRunTheme,
    showBj, showSideBet, showRuletPick, showZarCheat, showBetPicks, kumarStartPanels, showJackpot, pickRunMode, showSettings, showRunPick,
    collectionView: (v) => showCollection(v), showRitim, ritimPattern, ritimJudge };
})();
