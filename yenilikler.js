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
  /* her madde: [etiket, TR başlık, TR açıklama, EN başlık, EN açıklama, ('proto' → betada gizli)] */
  const TUM_NOTLAR = [
    {
      id: '2026-10-30', date: { tr: '30 Ekim', en: 'October 30' },
      items: [
        ['yeni', 'Taşlar desteden gelir', 'Raunda girince elin desteden tek tek dağıtılıyor; çektiğin taş desteden dönerek ıstakana uçuyor, seçtiğin taş yaylanıyor, attığın taş havada yay çizip yuvasına düşüyor.',
          'Tiles come from the deck', 'Entering a round now deals your hand from the deck one tile at a time; drawn tiles flip over as they fly to your rack, selected tiles spring up and discarded tiles arc into the slot.'],
        ['yeni', 'Giriş ekranı', 'Yeni run’a ya da kayda girerken ekran kararıyor, taş belirip yanarak kayboluyor ve masa açılıyor.',
          'Intro screen', 'Starting a run or loading a save now fades to dark, shows a tile that burns away and sweeps the table in.'],
        ['yeni', 'Mühür uyanıyor', 'Oyunu açınca Mühür seni karşılıyor: uyuyan bir taş olarak düşüyor, gözünü açıyor, kollarını ve bacaklarını çıkarıp menüdeki yerine yürüyor. Tıklayınca geçebilirsin.',
          'The Seal wakes up', 'When you open the game the Seal greets you: it drops in as a sleeping tile, opens its eye, sprouts arms and legs and walks to its spot on the menu. Click to skip.'],
        ['degisti', 'Geri düğmesi', 'Run seçimi, Koleksiyon ve Ayarlar pencerelerinde Geri düğmesi artık aynı yerde ve aynı görünüşte.',
          'Back button', 'Run select, Collection and Settings now share the same Back button, in the same place.'],
        ['degisti', 'Common joker çizimleri tamam', 'Timsah, Kart Sayıcı, Dolu Bardak, Boş Bardak ve Domino da çizimine kavuştu; artık bütün Common jokerlerin kendi çizimi var.',
          'All Common jokers drawn', 'Crocodile, Card Counter, Full Glass, Empty Glass and Domino got their artwork; every Common joker now has its own drawing.'],
        ['degisti', 'Run seçimi', 'Sekmeler, Oyna ve Geri artık kendi renkleriyle ayrılıyor; Oyna en belirgin düğme.',
          'Run select', 'Tabs, Play and Back now each have their own colour; Play stands out the most.'],
        ['yeni', 'Aldığın kart yerine uçar', 'Store’dan aldığın joker ve değnek raftan kalkıp slotuna uçuyor, paranın düştüğünü sayaçta görüyorsun.',
          'Purchases fly to their slot', 'Jokers and wands you buy now fly from the shelf to their slot, and you watch your money count down.'],
        ['yeni', 'Dönüşen taşlar', 'Bir joker taşını dönüştürünce (heykel, okey, Ay Taşı, 13…) taş dönerek yeni yüzüne geçiyor ve dönüştüren joker sıçrıyor.',
          'Transforming tiles', 'When a joker transforms a tile (stone, joker, Moon Tile, 13…) the tile flips to its new face and the joker that did it hops.'],
        ['degisti', 'Mühür canlandı', 'Öğreticide Mühür yukarıdan düşüp gözünü açıyor, konuşurken yazı harf harf akıyor, yer değiştirirken hopluyor ve yapman gereken şeyi koluyla gösteriyor.',
          'The Seal comes alive', 'In the tutorial the Seal drops in and opens its eye, its words type out, it hops between spots and points at what you should do.'],
      ],
    },
    {
      id: '2026-10-29', date: { tr: '29 Ekim', en: 'October 29' },
      items: [
        ['degisti', 'Common joker çizimleri', 'Yin Yang, Büyüteç, Kuzgun, Çift Kiraz, Bilye, Ok ve diğer Common jokerler artık kendi çizimleriyle.',
          'Common joker art', 'Yin Yang, Magnifying Glass, Raven, Twin Cherries, Marbles, Arrow and other Common jokers now have their own artwork.'],
        ['degisti', 'Ay Taşı', 'Kalıcı Ay Taşı gri ayla, Öteki Dünya kuyusundan gelen taş dolunayla görünür.',
          'Moon Tile', 'Permanent Moon Tiles show a grey moon; tiles from the Otherworld well show a full moon.'],
        ['yeni', 'Final: Lanetli Çocuk', 'Lanetli Boyut artık bir finalle bitiyor. Lanetli Çocuk sayıları gizliyor, taşlarını dokunaçla kilitliyor ve son açılımında senden bir bedel alıyor. Yenersen Oyuncak Kutusu jokeri açılıyor.',
          'Finale: The Cursed Child', 'The Cursed Dimension now ends with a finale. The Cursed Child hides your numbers, locks your tiles with tentacles and takes one last price at your winning meld. Beat it to unlock the Toy Box joker.', 'proto'],
        ['yeni', 'Mini oyunlar', 'Lanetli Boyut’ta haritadaki olay rozetleri artık bir şey yapıyor: Karanlık Takas’ta fısıldayan üç kutudan birini seç, Kemik Falı’nda taşları ezberle ve boss’a hazır bir grupla gir, Ekstra Sunak’ta üç teklif arasından seç.',
          'Mini games', 'Event badges on the Cursed Dimension map now do something: pick one of three whispering boxes in the Dark Trade, memorise tiles in the Bone Reading to start the boss with a ready set, and choose from three offers at the Extra Altar.', 'proto'],
        ['yeni', 'Adak Sunağı ve lanetli eşyalar', 'Lanetli Boyut’ta boss’u yenince Adak Sunağı açılır: bir bedel öde, bir lanetli eşya al. 11 lanetli joker, 8 lanetli değnek ve slot kaplamayan 6 totem geldi.',
          'Offering Altar and cursed items', 'In the Cursed Dimension the Offering Altar opens after you beat the boss: pay a price, take a cursed item. 11 cursed jokers, 8 cursed wands and 6 slot-free totems arrived.', 'proto'],
        ['degisti', 'Slot makinesi', 'Kartlar çizimleriyle döner, makara daha geniş; çıkan kartın açıklaması üstüne gelince görünür. Çıkanı istemezsen Pas diyebilirsin.',
          'Slot machine', 'Cards spin with their artwork on a wider reel; hover the result to read it. Don’t want it? Pass.'],
        ['degisti', 'Eşin Orion', 'Orion’un açılımları artık jokerlerinden ve çarpanlarından yarı güçle yararlanır.',
          'Partner Orion', 'Orion’s melds now benefit from your jokers and multipliers at half strength.'],
        ['degisti', 'Okey yerleşimi', 'Okeyin oturabileceği yerler artık taşların yanında boşluk olarak görünür; tıkla, oraya otursun.',
          'Joker placement', 'Where the joker can go now shows as empty spots next to the tiles; click one to place it.'],
        ['duzeldi', 'Lady Luck', 'Boss taşlarını aldıktan sonra da elin 21’e tamamlanıyor.',
          'Lady Luck', 'Your hand is topped back up to 21 even after a boss takes tiles.'],
      ],
    },
    {
      id: '2026-10-28d', date: { tr: '28 Ekim', en: 'October 28' },
      items: [
        ['yeni', 'Çürük Taş', 'Lanetli Boyut’ta her raund 4 çürük taş gelir. Elinde bekledikçe olgunlaşır ve açılımda daha çok çarpan verir; ama çürüdüğünde sağındaki taşa bulaşır, sonra Çöp olur.',
          'Rotten Tiles', 'In the Cursed Dimension 4 rotten tiles arrive each round. They ripen in your hand and give more mult when opened, but once rotten they infect the tile to their right and then turn to Waste.', 'proto'],
        ['yeni', 'Sessiz Raund', 'Lanetin yüksekken bazı raundlar Sessiz olur: hedef yarı. İlk turda bitirirsen lanetin azalır.',
          'Silent Round', 'When your curse is high some rounds go Silent: half target. Finish on the first turn and your curse drops.', 'proto'],
      ],
    },
    {
      id: '2026-10-28c', date: { tr: '28 Ekim', en: 'October 28' },
      items: [
        ['yeni', 'Lanetli Boyut’un kendi dünyası', 'Mor-siyah paneller ve zehir yeşili ışık; arka planda boşlukta süzülen kırık bir çocuk odası. Stage ilerledikçe oda çürür, panellerin köşeleri kopar, kenarlardan yeşil sızar.',
          'The Cursed Dimension’s own world', 'Purple-black panels and toxic green light; a broken child’s room floats in the void. As stages pass the room decays, panel corners break off and green seeps from the edges.', 'proto'],
        ['yeni', 'Lanetli Boyut müzikleri', 'Kırık bir müzik kutusu ninnisi, store’da lanetli bir şapel orgu. Boss’lar kendi müziklerini çalar. Hepsi Koleksiyon › Müzikler’de.',
          'Cursed Dimension music', 'A broken music-box lullaby, and a cursed chapel organ in the store. Bosses play their own themes. All in Collection › Music.', 'proto'],
      ],
    },
    {
      id: '2026-10-28b', date: { tr: '28 Ekim', en: 'October 28' },
      items: [
        ['yeni', 'Lanetli Boyut Run', 'Üçüncü run modu: 6 stage, her raund store, Lanet Seviyesi. Harita ekranı bir Yol Haritası: her stage sonunda Güvenli ya da Lanetli yolu haritada seçersin.',
          'Cursed Dimension Run', 'A third run mode: 6 stages, a store every round, Curse Level. The map screen is a Path Map: at each stage end you pick a Safe or Cursed path on the map.', 'proto'],
        ['yeni', 'Raund atlama', 'Lanetli Boyut’ta Raund 1 ve 2’yi atlayıp ödülünü alabilirsin (coin, arınma, değnek ya da bedava joker). Atlarsan o raundun coin’i ve store’u gelmez.',
          'Skipping rounds', 'In the Cursed Dimension you can skip Round 1 and 2 for a reward (coins, cleansing, a wand or a free joker). Skipping costs that round’s coins and store.', 'proto'],
      ],
    },
    {
      id: '2026-10-28', date: { tr: '28 Ekim', en: 'October 28' },
      items: [
        ['yeni', 'Blackjack', 'Kumarhane’de raund sonu kumarı artık Blackjack: raundun coiniyle Kasa’ya karşı oyna. Taş Çek, Dur ya da Katla. Yüksek mi Alçak mı kalktı.',
          'Blackjack', 'The Casino end-of-round gamble is now Blackjack: play this round’s coins against the House. Hit, Stand or Double. Higher or Lower is gone.'],
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
  /* betada henüz açılmamış modların notları ('proto') gösterilmez; boş kalan kayıt düşer */
  const NOTLAR = TUM_NOTLAR.map((n) => ({ ...n, items: n.items.filter((it) => !(it[5] === 'proto' && window.LUSORIA_BETA)) }))
    .filter((n) => n.items.length);
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
