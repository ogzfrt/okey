/* LUSORIA — "Yenilikler" (güncelleme notları). Prototip ve beta AYNI listeyi gösterir (kullanıcı
   2026-10-23: ana menüde Yenilikler düğmesi, ikisinde de). Kural: oyuna bir güncelleme yayınlanınca
   NOTLAR'ın EN ÜSTÜNE yeni kayıt eklenir (id = tarih, aynı gün ikinci yayında '…b').
   Betanın "görülmemiş notları açılışta göster" mantığı beta/yenilikler.js'te. */
(function () {
  const TAGS = {
    yeni: { tr: 'YENİ', en: 'NEW' },
    degisti: { tr: 'DEĞİŞTİ', en: 'CHANGED' },
    duzeldi: { tr: 'DÜZELTİLDİ', en: 'FIXED' },
  };
  const UI = {
    tr: { title: 'YENİLİKLER', sub: (d) => `${d} güncellemesi`, subAll: 'Tüm güncellemeler', ok: 'Tamam, oynayalım!', close: 'Kapat', btn: 'Yenilikler' },
    en: { title: "WHAT'S NEW", sub: (d) => `${d} update`, subAll: 'All updates', ok: "OK, let's play!", close: 'Close', btn: "What's New" },
  };
  /* her madde: [etiket, TR başlık, TR açıklama, EN başlık, EN açıklama] */
  const NOTLAR = [
    {
      id: '2026-10-28', date: { tr: '28 Ekim', en: 'October 28' },
      items: [
        ['degisti', 'Koleksiyon', 'Bulmadığın kartlar artık soru işaretli kart olarak görünür; kilit yalnız henüz açılmamış bir modun kartlarında. Üstüne gelince hangi modda bulunduğunu söyler.',
          'Collection', 'Cards you have not found now show as question-mark cards; the lock is only on cards of a mode you have not unlocked. Hover to see where they are found.'],
        ['degisti', 'Yeni joker adları', 'Merdiven artık Ok, Yürüyen Merdiven artık Sadak. Etkileri aynı.',
          'New joker names', 'Staircase is now Arrow and Escalator is now Quiver. Same effects.'],
      ],
    },
    {
      id: '2026-10-25', date: { tr: '25 Ekim', en: 'October 25' },
      items: [
        ['degisti', 'Üstteki bildiriler', 'Boss çizimini kaplayan yazı kutusu kalktı. Yan bahis, kehanet, görev, zar gibi bilgiler TUR kutularının altında küçük simgeler; üstüne gelince ya da dokununca açıklaması açılır.',
          'Top notices', 'The text box covering the boss art is gone. Side bets, prophecies, tasks, the die and so on are small icons under the TURN boxes; hover or tap for details.'],
        ['yeni', 'Lady Luck taşını gözünün önünde çalar', 'Çaldığı taş ıstakandan dudaklarına uçar; büyülediği jokerin kartında öpücük izi kalır.',
          'Lady Luck steals in plain sight', 'The tile she steals flies from your rack to her lips; the joker she charms carries a kiss mark.'],
      ],
    },
    {
      id: '2026-10-23c', date: { tr: '23 Ekim', en: 'October 23' },
      items: [
        ['yeni', 'Yenilikler düğmesi', 'Ana menünün sağ altındaki Yenilikler düğmesiyle bütün güncelleme notlarını istediğin zaman okuyabilirsin.',
          "What's New button", "Use the What's New button at the bottom right of the main menu to read every update note any time."],
        ['degisti', 'Joker etiketleri', 'Boss jokerlerinde etiket artık yalnız "Epic", deste jokerlerinde "Epic · Deste"; uzun adlar kırılmıyor.',
          'Joker labels', 'Boss jokers now just say "Epic", deck jokers "Epic · Deck"; long names no longer break.'],
        ['degisti', 'Sihirbaz Şapkası çizimi', 'Sihirbaz Şapkası jokerinin çizimi yenilendi.',
          'Magic Hat art', 'The Magic Hat joker has new art.'],
        ['duzeldi', 'Dar ekranda maskot', 'Tablet gibi dar ekranlarda ana menüdeki maskot artık kesilmiyor.',
          'Mascot on narrow screens', 'On narrow screens like tablets the main menu mascot is no longer cut off.'],
      ],
    },
    {
      id: '2026-10-23b', date: { tr: '23 Ekim', en: 'October 23' },
      items: [
        ['yeni', 'Ana menüden geri bildirim', 'Ana menünün sağ altındaki Geri Bildirim düğmesiyle oyuna girmeden de yorum yazabilirsin.',
          'Feedback from the main menu', 'Use the Feedback button at the bottom right of the main menu to send a comment without starting a game.'],
      ],
    },
    {
      id: '2026-10-23', date: { tr: '23 Ekim', en: 'October 23' },
      items: [
        ['degisti', 'Hileli Zar', 'Her tur zar atılır: açtığın o sayıdaki her taş +0.4x. Raundda bir kez HİLE ile zarı istediğin sayıya çevir; her hile zarı kalıcı güçlendirir.',
          'Loaded Dice', 'A die is rolled each turn: each tile of that number you meld gives +0.4x. Once a round, CHEAT to set the die to any number; every cheat makes it stronger for good.'],
        ['degisti', 'Kart Sayıcı', 'Destenin üstünde çekeceğin sıradaki 2 taşı görürsün.',
          'Card Counter', 'You can see the next 2 tiles you will draw, right above the deck.'],
        ['degisti', 'Terazi', 'Sadeleşti: her tur bir taş feda et, hedef o taşın 10 katı düşer.',
          'Scales', 'Simpler: sacrifice one tile a turn and the target drops by 10 times its value.'],
        ['degisti', 'Kumarhane hedefleri', 'İlk boss biraz kolaylaştı, sonraki stage’ler belirgin zorlaştı: oyun ilerledikçe kolaylaşmıyor.',
          'Casino targets', 'The first boss got a bit easier and later stages clearly harder: the game no longer gets easier as you go.'],
        ['yeni', 'Rare çizimleri', 'Rare jokerlerin çizimleri geldi. Bukalemun seçtiğin rengin çizimine döner, Damga her kullanımda daha çok damgalanır.',
          'Rare art', 'Rare jokers have their art. Chameleon shows the colour you pick, Stamp looks more stamped with each use.'],
        ['yeni', 'Bahis ödülünde değiş', 'Slotların doluyken bahis ödülü joker seçersen hangi jokerin yerine geçeceğini seçersin.',
          'Swap on bet reward', 'If your slots are full when you pick a joker as a bet reward, you choose which joker it replaces.'],
        ['degisti', 'Öğretici ve uyarılar', 'Öğreticideki Mühür artık anlattığı yerleri örtmüyor; kurala uymayan hamlede kısa bir uyarı çıkar.',
          'Tutorial and warnings', 'The Seal in the tutorial no longer covers what it explains; a short warning shows when a move breaks a rule.'],
        ['duzeldi', 'Hatalar', 'Boss jokeri satışı 0 coin vermiyor (artık 12), Üç Kağıtçı okeyi raund sonuna kadar kalıyor, Orion’un açılımı Zincir ve yan bahse sayılıyor, Hi-Lo’da eşitlik yok.',
          'Bugs', "Boss jokers no longer sell for 0 coins (now 12), Three-Card Monte's okey stays until round end, Orion's melds count for Chain and side bets, no ties in Higher or Lower."],
      ],
    },
    {
      id: '2026-10-22', date: { tr: '22 Ekim', en: 'October 22' },
      items: [
        ['yeni', 'Kaldığın yerden devam', 'Raund ortasında oyunu kapatıp açarsan aynı turdan devam edersin: elin, masan, puanın ve bahsin korunur.',
          'Continue mid-round', 'Close the game mid-round and you pick up on the same turn: your hand, table, score and bet are kept.'],
        ['degisti', 'Puanlama sahnesi', 'Onaydan önce yalnız grubun değeri yazar; jokerler, özel taşlar ve boss kesintisi (kırmızı) onaydan sonra tek tek eklenir.',
          'Scoring scene', 'Before you confirm you only see the group value; jokers, special tiles and boss cuts (red) are added one by one after.'],
        ['degisti', 'Avukat boss', 'Susturduğu joker artık gerçekten çalışmıyor; kartı griye döner ve "SUSTURULDU" yazar.',
          'Lawyer boss', 'The silenced joker really does nothing now; its card turns grey and says "SILENCED".'],
        ['degisti', 'Kumarhane hedefleri', "Stage 2–4'ün ilk raund hedefleri biraz yükseldi: yeni stage artık bir öncekinden kolay başlamıyor.",
          'Casino targets', 'First-round targets of stages 2–4 went up a bit: a new stage no longer starts easier than the last one.'],
        ['degisti', 'Sesler', 'Duraklatınca müzik kısılır, oyun sonunda raund müziği susar, Onayla tek ses çıkarır.',
          'Sounds', 'Music ducks when paused, round music fades at game end, Confirm plays a single sound.'],
        ['duzeldi', 'Joker hataları', "40'tan fazla joker hatası düzeldi: Füzyon ve Vasiyet içinde çalışmayanlar, backup'a gidip gelince yaşlanmayan jokerler, Derin Nefes, Ustanın Mührü, Gökyüzü Ejderhası ve daha fazlası.",
          'Joker bugs', 'Over 40 joker bugs fixed: jokers that stopped working inside Fusion or Legacy, jokers that never aged when moved to backup and back, Deep Breath, Master\'s Seal, Sky Dragon and more.'],
        ['duzeldi', 'Ekran ve metinler', 'Üç Kağıtçı artık haritada açılmıyor, Game Over iki kez gelmiyor, küçük ekranda taşan pencereler ve İngilizcede Türkçe kalan yazılar düzeldi.',
          'Screens and texts', 'Three-Card Monte no longer opens on the map, Game Over no longer shows twice, overflowing windows on small screens and leftover Turkish in English are fixed.'],
      ],
    },
    {
      id: '2026-10-16', date: { tr: '16 Ekim', en: 'October 16' },
      items: [
        ['yeni', 'Seed', "Her run'ın bir kodu var. Game Over ekranında kopyala, Yeni Run'da yaz: aynı run'ı yeniden oynarsın. (Seed girilen run istatistiğe sayılmaz.)",
          'Seeds', 'Every run has a code. Copy it on the Game Over screen and type it in New Run to replay the same run. (Seeded runs don\'t count toward stats.)'],
        ['yeni', 'Puanlama sahnesi', 'Açılımı onaylayınca jokerlerin tek tek devreye girdiğini, çarpanın adım adım büyüdüğünü görürsün. Hızı Ayarlar › Oyun\'da; tıklayınca atlanır.',
          'Scoring scene', 'After you confirm, watch your jokers kick in one by one and the multiplier grow. Speed is in Settings › Game; click to skip.'],
        ['yeni', 'Jokerleri sürükle', 'Jokeri sürükleyip ana raftan backup\'a (ya da tersine) bırakabilirsin. Backup doluysa ikisi yer değiştirir.',
          'Drag jokers', 'Drag a joker between your main slots and backup. If backup is full, the two swap places.'],
        ['yeni', 'Sesler ve müzik', 'Düğmelere, satışa, yenilemeye ve değneklere ses geldi. Kozmik Run artık kendi müziğini çalıyor.',
          'Sounds and music', 'Buttons, selling, rerolls and wands now have sounds. Cosmic Run has its own music.'],
        ['yeni', 'Yeni öğretici', 'Aynı turda birden fazla grup açmayı, taş atmayı, işlemeyi ve Çift\'i adım adım gösteriyor.',
          'New tutorial', 'It now walks you through opening several groups in one turn, discarding, adding to the table and Pairs.'],
        ['degisti', 'Hedef puanlar', 'Raund hedefleri yeniden dengelendi: ilk raundlar artık kolay geçit değil, zorluk düzenli artıyor.',
          'Target scores', 'Round targets were rebalanced: early rounds are no longer a free pass, difficulty rises steadily.'],
        ['degisti', 'Satranç Saati', 'Saat ekranın üst ortasında. Onayladığında kalan her saniye +0.15x verir; raundda bir kez DURDUR\'a basıp o turun bonusunu sabitleyebilirsin.',
          'Chess Clock', 'The clock sits at the top center. Each second left when you confirm gives +0.15x; once a round, press STOP to lock that turn\'s bonus.'],
        ['degisti', 'Hayalet', 'Raundu kaybedersen ekstra tur kendiliğinden başlar, sormaz.',
          'Ghost', 'If you lose the round, the extra turn starts on its own.'],
        ['degisti', 'Ay Taşı ve boss kuralı', 'Ay Taşı Öteki Dünya olmadan da +3x verir. Boss kuralı artık boss adının hemen altında yazıyor.',
          'Moon Tile and boss rule', 'Moon Tiles give +3x even without Other World. The boss rule is now shown right under the boss name.'],
        ['duzeldi', 'Joker hataları', 'Kağıt değeri değişmiş taşlarda da çalışıyor; Avukat yanlış jokeri savunmuyor; paketler raftaki jokeri tekrar vermiyor.',
          'Joker bugs', 'Paper works on tiles with changed values; Lawyer no longer defends the wrong joker; packs no longer repeat a joker already on the shelf.'],
        ['duzeldi', 'Ekran düzeni', 'Değnek, backup, Ay Kuyusu ve Orion panelleri artık üst üste binmiyor; indirim etiketi okunuyor.',
          'Layout', 'Wand, backup, Moon Well and Orion panels no longer overlap; discount tags are readable.'],
      ],
    },
  ];
  const lang = () => ((window.T && window.T.lang) === 'en' ? 'en' : 'tr');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* list: gösterilecek kayıtlar (en yeniden eskiye). opts.all → alt başlık "Tüm güncellemeler",
     opts.okText → düğme metni, opts.onOk → kapanınca */
  function show(list, opts = {}) {
    const L = lang(), u = UI[L];
    document.getElementById('betaNewsOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'betaNewsOv';
    ov.className = 'pk-ov bn-ov';
    let body = '';
    let lastDate = '';
    for (const n of list) {
      /* aynı günün ikinci yayını ('…b') ayrı başlık açmaz */
      if (list.length > 1 && n.date[L] !== lastDate) body += `<div class="bn-date">${n.date[L]}</div>`;
      lastDate = n.date[L];
      for (const tag of ['yeni', 'degisti', 'duzeldi']) {
        const rows = n.items.filter((it) => it[0] === tag);
        if (!rows.length) continue;
        body += `<div class="bn-sec bn-${tag}"><div class="bn-tag">${TAGS[tag][L]}</div>`;
        for (const it of rows) {
          const [h, d] = L === 'en' ? [it[3], it[4]] : [it[1], it[2]];
          body += `<div class="bn-item"><b class="bn-h">${esc(h)}</b><span class="bn-d">${esc(d)}</span></div>`;
        }
        body += '</div>';
      }
    }
    ov.innerHTML = `<div class="pk-box bn-box"><div class="pk-title">${u.title}</div>` +
      `<div class="pk-sub-title">${opts.all ? u.subAll : u.sub(list[0].date[L])}</div>` +
      `<div class="bn-body">${body}</div>` +
      `<div class="pk-foot"><button id="betaNewsOk" class="ep-btn ep-blue"></button></div></div>`;
    const ok = ov.querySelector('#betaNewsOk');
    ok.textContent = opts.okText || u.ok;
    ok.addEventListener('click', () => { ov.remove(); if (opts.onOk) opts.onOk(); });
    ov.addEventListener('click', (e) => { if (e.target === ov && opts.all) ok.click(); });
    document.body.appendChild(ov);
    return ov;
  }
  window.LUSORIA_NEWS = { NOTLAR, latest: NOTLAR[0].id, show, showAll: () => show(NOTLAR, { all: true, okText: UI[lang()].close }), btnText: () => UI[lang()].btn };

  /* ana menü SAĞ ALT köşe kutusu (beta Geri Bildirim'i de buraya koyar). Tuvalin (.fm-stage) içinde
     DEĞİL: tuval ekranı kaplayacak şekilde ölçeklenip dar ekranda sağdan, geniş ekranda alttan
     kırpılıyor → köşe kutusu ekranın kendi köşesine bağlı, menüyle aynı ölçekte büyür. */
  const menu = document.getElementById('menuScreen');
  let corner = document.getElementById('fmCorner');
  if (menu && !corner) { corner = document.createElement('div'); corner.id = 'fmCorner'; menu.appendChild(corner); }
  if (corner) {
    const b = document.createElement('button');
    b.id = 'btnNews';
    b.className = 'fm-cbtn';
    b.textContent = UI[lang()].btn;
    b.addEventListener('click', (e) => { e.stopPropagation(); window.LUSORIA_NEWS.showAll(); });
    corner.appendChild(b);
    new MutationObserver(() => { const t = UI[lang()].btn; if (b.textContent !== t) b.textContent = t; })
      .observe(document.getElementById('menuScreen'), { attributes: true, attributeFilter: ['class'] });
  }
})();
