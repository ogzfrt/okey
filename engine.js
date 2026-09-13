/* ============================================================
   OKEY ROGUELIKE — Oyun Motoru (UI'dan bağımsız saf mantık)
   Kaynak: OKEY_Roguelike_GDD_v3.docx
   Kapsam: Bölüm 2 (2.7 işlek, 2.9 okey dahil), 3 (3.7 işleme dahil),
           4, 5 (stage yapısı, boss), 6 (normal+boss coin, store,
           6.5b tüketilebilirler, 6.5c özel normal taşlar),
           7 (backup slot + deste jokerleri dahil),
           8–12'den 75 joker, 13 (4 boss tipi)
   Kalanlar için bkz. proje özeti.
   ============================================================ */

const COLORS = ['red', 'blue', 'yellow', 'black'];
const COLOR_TR = { red: 'Kırmızı', blue: 'Mavi', yellow: 'Sarı', black: 'Siyah' };
/* Kombinasyon türlerinin TR adı — motorun ürettiği bildirimlerde kullanılır
   (i18n katmanı bunları EV kalıplarıyla İngilizceye çevirir). */
const TYPE_TR = { per: 'Per', sirali: 'Sıralı', cift: 'Çift' };

/* GDD 4.2 v3 (2026-07-09 sıfırdan denge):
   Tablo artık açık bir formülden türetilir ve tek ödül ekseni budur —
   "çok kombinasyon açma" davranışını YALNIZ bu tablo ödüllendirir
   (sabit puan bonusu yok; MULTI_RAW_BONUS kalıcı olarak kaldırıldı).
   Formül: per[n]  = 2.0 × 1.15^(n-1)  (her basamak +%15)
           cift[n] = 2.2 × 1.115^(n-1) (taban önde, büyüme yavaş —
           çift ham puanı küçüktür, 7 Çift ayrıca rekor bonusu taşır)
   1→7 arası toplam büyüme ~2.2x': per 2.0→4.6, çift 2.2→4.2. */
const CARPAN_TABLE = {
  cift: [2.2, 2.5, 2.8, 3.1, 3.4, 3.8, 4.2],
  per:  [2.0, 2.3, 2.7, 3.1, 3.5, 4.0, 4.6],
};

/* Toplam stage sayısı — run bu kadar stage sonunda tamamlanır.
   Geçmiş: 8 → 6 (2026-07-09) → 8 (Playtest 7, Grup I). Kullanıcı gerekçesi:
   oyun özellikle güçlü joker kombinasyonlarıyla çok kolay bitiyordu; run
   uzadı ve son stage'ler (6-8) gerçek meydan okuma bandına çekildi. */
const TOTAL_STAGES = 8;

/* ==========================================================================
   MADDE D4 (kullanıcı kararı 2026-09-09) — RUN MODLARI
   Oyunun ikinci bir oynanış uzunluğu var: "Hızlı Run". `ui.js`teki MODES
   kaydı yalnız bir KİLİT defteridir (hangi mod açık); oynanışı belirleyen
   sayılar burada, motorda durur — iki yer birbirine karışmasın.

   ⚠ HIZLI RUN KİLİTLİ DEĞİLDİR (kullanıcı kararı): ilk run'dan itibaren
   seçilebilir. `ui.js` MODES kaydında `requires: null` ile yazılıdır.

   Her alanın gerekçesi:
   · stages 4        — run 24 raund yerine 12 raund.

   ┌── PLAYTEST 26 · MADDE D — DENGE REVİZYONU (kullanıcı kararları 2026-09-09)
   │ ÖLÇÜM (tests/sim_p7.js botu, 120 run/hücre, R1/R2/BOSS geçiş oranı):
   │     temel:  99/95/69 → 100/93/60 → 100/89/36 → 98/83/17
   │     hızlı:  87/33/ 2 →  73/11/ 0 →  52/ 0/ 1 → 11/ 0/ 0
   │ Yani mod "2 raunddan ileri gidilmiyor" durumundaydı.
   │
   │ KÖK NEDEN — hedefler ikiye katlandı ama OYUNCU GÜCÜ AYNI KALDI.
   │ Aynı bot iki modda da aynı puanı üretiyordu (S1 boss medyanı: temel
   │ 479, hızlı 457), çünkü el büyüklüğü, stage başına yükseltme sayısı ve
   │ store temposu birebir aynıydı. Somut hâli: hızlı S1 boss hedefi (800)
   │ ≈ temel S3 boss hedefi (810) — ama oyuncuda S1 gücü vardı (15 taş,
   │ 0 yükseltme). Verilen telafi (2 joker + ×1.5 coin) TUR İÇİ puana
   │ değil run boyu birikime dokunuyordu, run ise zaten yarı uzunlukta.
   │ Ölçüldü: hedef tablosu sabitken el+2 · çarpan+0.5 · joker 3 birlikte
   │ uygulansa bile S1 boss ancak %9-16'ya çıkıyordu.
   │ Bu yüzden düzeltme İKİ TARAFLI: hedef eğimi indi VE güç yükseldi.
   └──────────────────────────────────────────────────────────────────────

   · targets         — S1 340/500/680, sonrası ×1.30/stage (eski: S1
                       400/600/800 ve ×1.5). İki değişiklik de kullanıcı
                       kararı. S1 satırı indi çünkü sabit kaldığında modun
                       EN SERT kapısı ilk stage'in boss'u oluyordu — zorluk
                       eğrisi baştan tepe yapıyordu. Eğim 1.5'ten 1.30'a
                       indi çünkü bileşik büyüme S4'ü (2700) botun tavanının
                       (~1000 medyan) neredeyse üç katına çıkarıyordu.
                       Temel run'ın ilk 4 stage'ine göre boss oranları:
                       ×1.70 · ×1.55 · ×1.42 · ×1.29 — yani her yerde
                       belirgin daha zor, ama fark run ilerledikçe kapanır
                       (oyuncu güç paketiyle hedefi yakalar).
                       "Nefes kuralı" (yeni stage R1 < önceki stage boss'u)
                       her adımda sağlanır: 440<680 · 575<885 · 750<1150.
   · handBonus 2     — el 15/17/19/21 yerine 17/19/21/21 (MAX_HAND tavanı
                       aynen işler). En doğrudan kaldıraç: hedefin ikiye
                       katlandığı eksen taş sayısıdır — daha çok taş, hem
                       ham puanı hem çarpan basamağını büyütür.
   · startPermMult   — run kalıcı çarpanı 0 yerine +0.5 başlar. Kullanıcının
       0.5             istediği "çarpan tablosuna taban bonusu" budur:
                       tabloya dokunmadan her açılıma sabit bir taban ekler.
   · coinMult 1.5    — taban + aşım bonusuna uygulanır (stage ölçeği ayrıca
                       işler, joker coinleri hariçtir — tıpkı stageCoinScale
                       gibi). Gerekçe: run yarı uzunlukta, yani toplam kazanç
                       yarıya iniyor; ×1.5 bunu KISMEN telafi eder.
   · priceMult 1.0   — %10 zam KALDIRILDI (kullanıcı: "şimdilik %10, sonra
                       test üzerinden değiştireceğim" demişti; test geldi).
                       Havuz Legendary/Mythic'e açılınca zam, kullanıcının
                       açık isteğiyle ("oyuncu onları alabilsin, parasızlıktan
                       alamama sorunu olmasın") doğrudan çelişiyordu.
   · curveStretch    — STORE NADİRLİK EĞRİSİ DE STAGE'E GÖRE GERİLİR.
                       RARITY_CURVE 8 stage için yazılmıştır; 4 stage'lik run
                       onu düz okursa yalnız ilk 4 satır kullanılır ve oyuncu
                       Legendary/Mythic'i HİÇ görmez (C1-C4'te legendary payı
                       %1.2-15). Stage, boss eşlemesindeki AYNI kuralla
                       8'lik eğrideki karşılığına taşınır: 4 stage → 2,4,6,8.
                       Böylece kısa run kendi uzunluğuna göre olgunlaşır.
   · openJokers 3    — run başında çark ÜÇ kez döner (eski: 2).
   · openRarity      — %20 Common · %45 Rare · %35 Legendary (eski: düz
                       %33/%33/%33). Kötü açılış ihtimalini düşürür, tavanı
                       çok değiştirmez. Mythic ve Epic (boss ödülü) HARİÇ.
   ========================================================================== */
const RUN_MODES = {
  base: {
    key: 'base',
    stages: TOTAL_STAGES,
    targets: null,          // null → STAGE_TARGETS (temel tablo)
    coinMult: 1,
    priceMult: 1,
    handBonus: 0,
    startPermMult: 0,
    curveStretch: false,
    openJokers: 0,
    openRarity: null,
  },
  hizli: {
    key: 'hizli',
    stages: 4,
    targets: [
      [340, 500, 680],       // S1
      [440, 650, 885],       // S2  (×1.30)
      [575, 845, 1150],      // S3  (×1.30)
      [750, 1100, 1495],     // S4 — FINAL BOSS  (×1.30)
    ],
    coinMult: 1.5,
    priceMult: 1.0,
    handBonus: 2,
    startPermMult: 0.5,
    curveStretch: true,
    openJokers: 3,
    openRarity: { common: 0.20, rare: 0.45, legendary: 0.35 },
  },
};
function runModeOf(s) {
  return RUN_MODES[s?.runMode] || RUN_MODES.base;
}

/* PLAYTEST 26 · MADDE D — STAGE'İ 8'LİK EĞRİYE TAŞI.
   Oyunun iki tablosu 8 stage için yazılmıştır: BOSS_STAGE_WEIGHTS ve
   RARITY_CURVE. 4 stage'lik run bunları DÜZ okursa iki tabloda da yalnız
   ilk yarı kullanılır — final boss orta kademe bir boss olur, store ise
   run boyunca C1-C4 bandında (Legendary %1.2-15) kalır. Eşleme her ikisi
   için de aynı olmalıdır, bu yüzden formül tek yere alındı:
       4 stage → 2, 4, 6, 8
   Temel run'da (stages == TOTAL_STAGES) sonuç stage'in kendisidir. */
function curveStage(s, stage) {
  const m = runModeOf(s);
  const n = m.stages || TOTAL_STAGES;
  if (!m.curveStretch || n === TOTAL_STAGES) return stage;
  return Math.round(stage * TOTAL_STAGES / n);
}

/* ==========================================================================
   MADDE D3 (kullanıcı kararı 2026-09-09) — RUN SONU ÖZETİ SAYAÇLARI
   Coin akışı motorda 38 ayrı noktada değişiyordu ve hiçbiri sayılmıyordu;
   yani "run boyunca ne kazandım, ne harcadım" sorusunun cevabı yoktu.
   Bu iki fonksiyon o 38 noktanın TEK GEÇİDİ hâline getirildi.

   Neden Game metodu DEĞİL de modül fonksiyonu: coin değişimlerinin bir
   kısmı Tüccar tekliflerinin `apply(s, G)` kapanışlarında yaşıyor ve
   orada `this` Game değildir. Modül fonksiyonu her kapsamda çalışır.

   ⚠ `s.coins = ...` biçimindeki ATAMALAR bilerek dışarıda bırakıldı:
   Şeytan'ın Teklifi (cüzdanı sıfırlar) bir harcama değil bir dönüşümdür,
   Trainer'ın başlangıç coini ise hiç kazanılmamıştır.
   ========================================================================== */
function gainCoins(s, n) {
  if (n > 0) s.statCoinIn = (s.statCoinIn || 0) + n;
  s.coins += n;
}
function spendCoins(s, n) {
  if (n > 0) s.statCoinOut = (s.statCoinOut || 0) + n;
  s.coins -= n;
}

/* Kademeli başlangıç el büyüklüğü (kullanıcı kararı, 2026-07):
   C1: 15, C2: 17, C3: 19, C4+: 21 (Final Boss dahil sabit). */
function handSizeFor(stage) {
  return stage >= 4 ? 21 : 15 + 2 * (stage - 1);
}

/* Grup A (2026-07-09, kullanıcı kararı): ıstakada AYNI ANDA en fazla 21 taş
   bulunabilir. Hiçbir mekanizma (ekstra çekiş, Uzaylı kopyaları, Tekrar Çek,
   kalıcı çekiş yükseltmeleri…) bu sınırı aşamaz — çekişler sınıra kırpılır. */
const MAX_HAND = 21;

/* GDD 5.2 — boss hedefleri playtest geri bildirimiyle düşürüldü
   (Normal 2 → Boss sıçraması ~1.3x; GDD'deki 1.67x çok sertti).
   Stage geçişinde Normal 1 < önceki Boss kuralı korunur.
   Playtest 3 ölçek geçmişi:
   1) MULTI_RAW_BONUS kalkınca denge için ×0.55 gerekiyordu (sim_scale:
      jokersiz bot C1 boss ~%44) ama sayılar kullanıcıya küçük geldi.
   2) KULLANICI KARARI: ara nokta ×0.8 (orijinal tabloya göre) — sayılar
      büyük kalsın, zorluk artışı kabul (jokersiz bot C1 boss ~%10-15
      bandı; jokerli gerçek oyuncu için üst zorluk).
   3) Stage yükseltmeleri artık otomatik verildiği için (4 bonus birden)
      orta oyun telafisi korunur: C2 ×1.10, C3 ×1.15 (sim_tune). */
/* v3 (2026-07-09): run 6 stage'e indi (5 + Final Boss); hedefler
   sim_balance.js ile SIFIRDAN kalibre edildi. Yöntem: gerçek motor
   üzerinde oynayan bot (jokersiz / sadece-common / gerçekçi karışık
   build senaryoları) ile her stage'in puan dağılımı ölçüldü, hedefler
   istenen geçiş bandına oturtuldu: C1 kolay (1-2 deneme), C2-3 orta,
   C4 zorlayıcı, C5 sert, C6 Final Boss = gerçek meydan okuma.
   Kural korunur: yeni stage'in 1. raundu < önceki Boss (nefes alma). */
/* v4 (2026-07-09, Gruplar E+J): C2 hedefleri yükseltildi (C1→C2 zorluk
   sıçraması hissedilir olmalı — kullanıcı isteği; "yeni stage R1 <
   önceki boss" nefes kuralı bilinçli olarak hafif esnetildi: 250 ≈ 240).
   Joker buff turu (v4) sonrası tüm eğri sim_balance.js ile yeniden
   kalibre edildi. */
/* v5 (Playtest 7, Grup I) — 8 STAGE'a yeniden ölçeklendi.
   Tasarım kuralı: BOSS hedefleri C2'den sonra stage başına ~1.28-1.36x
   büyür (belirgin ve ORANTILI bir eğri; eskiden 1.18-1.41 arası dalgalıydı
   ve C5'te düzleşiyordu — güçlü build'ler oradan sonra hiç zorlanmıyordu).
   Boss ekseni: 240 → 520 → 700 → 950 → 1300 → 1700 → 2300 → 3100
   (C2 sonrası her adım ~1.35x — eski tabloda C6 boss 1280'di ve kullanıcı
   güçlü build'lerle "hiç zorlanmadığını" bildirdi; C6 artık +%33 daha
   yüksek ve üstüne iki stage daha var).
   ⚠ KALİBRASYON NOTU: tests/sim_p7.js botu C5'ten sonra bu hedeflere
   ULAŞAMIYOR (bot okey takası, tüketilebilir, taş istifleme ve store
   kullanmıyor; tavanı ~1200-1800 puan). Yani üst bandı sim DOĞRULAYAMAZ,
   yalnız alt bandı doğrular. Gerçek oyuncu geri bildirimi hâlâ "kolay"
   derse bir sonraki adım C6-C8'i ×1.15 daha yukarı çekmek; "imkânsız"
   derse C7-C8 için hazır yumuşak alternatif: C7 [1350,1700,2050],
   C8 [1750,2150,2600].
   "Yeni stage'in 1. raundu < önceki stage'in boss'u" nefes kuralı
   C1→C2 dışında her yerde korunur (o sıçrama bilinçli, bkz. v4). */
/* v6 (Playtest 8, Grup G) — TÜM TABLO YUKARI, ARTAN ORANLA.
   Gerekçe: oyuncu geri bildirimi hâlâ "genel olarak kolay geçiliyor".
   v5'in şekli (stage içi ritim + nefes kuralı) doğruydu, yalnız seviyesi
   düşüktü; bu yüzden tablo yeniden tasarlanmadı, stage başına ARTAN bir
   katsayıyla ölçeklendi:
       C1 ×1.10 · C2 ×1.13 · C3 ×1.17 · C4 ×1.22
       C5 ×1.28 · C6 ×1.34 · C7 ×1.41 · C8 ×1.50
   Böylece erken oyun "biraz daha sıkı", geç oyun "belirgin şekilde sert"
   olur — build gücü stage'le üstel büyüdüğü için sabit bir yüzde son
   stage'lerde hiç hissedilmiyordu.
   Boss ekseni: 265 → 590 → 820 → 1160 → 1665 → 2280 → 3245 → 4650
   (C2 sonrası adımlar ~1.40x; v5'te ~1.35x idi).
   Nefes kuralı ("yeni stage R1 < önceki boss") C1→C2 dışında korunur.
   ⚠ KALİBRASYON SINIRI DEĞİŞMEDİ: tests/sim_p7.js botu ~1200-1800 puanda
   tavan yapar (okey takası/tüketilebilir/istifleme/store kullanmaz), yani
   C5+ bandını sim DOĞRULAYAMAZ, yalnız C1-C4'ü doğrular.
   ÖLÇÜM (sim_p7.js, N=300, BOSS geçiş oranı — eski → yeni):
     S1_orta  C1 %76→%74 · C2 %47→%37 · C3 %54→%32 · C4 %49→%24
     S2_güçlü C1 %79→%65 · C2 %60→%43 · C3 %60→%38 · C4 %53→%26
   R1'ler nefes payını koruyor (S1/S2'de C1-C4 arası %93-100).
   Çok sert gelirse hazır geri adım: C5-C8'i ×0.90. Oyuncunun elindeki
   yeni denge valfi: Derin Nefes değneği (eski Nefes İksiri) (hedefler kalıcı -%10). */
/* v7 (Playtest 9, Grup A) — TABAN 300'E YÜKSELDİ, TAVAN NEREDEYSE AYNI.
   Kullanıcı kararı: "Stage 1'in ilk raund hedefi 300'den başlasın."
   145 → 300 (×2.07) bir zemin değişikliği; eğer tüm tablo aynı oranla
   ötelenseydi C8 boss 9600'e çıkardı ve üst bant zaten sim'le
   doğrulanamayan bir yerden çok daha uzağa giderdi. Bu yüzden ARTIŞ ORANI
   YENİDEN ÖLÇEKLENDİ: v6'nın stage başına ~1.40x boss adımı 1.36x'e
   indirildi ve C1→C2'deki bilinçli 2.23x sıçrama KALDIRILDI (o sıçrama
   yalnızca C1'in "öğretici kolaylığı" telafisiydi; C1 artık kolay değil).
   Boss ekseni: 550 → 750 → 1020 → 1390 → 1890 → 2570 → 3500 → 4750 */
/* v8 (Playtest 10, kullanıcı kararı) — TABAN 300 → 250, ARTIŞ ORANI GERİ
   YÜKSELDİ (boss adımı 1.36x → ~1.395x, tavan 4750 sabit).
   Boss ekseni v8: 460 → 640 → 890 → 1240 → 1730 → 2410 → 3390 → 4750 */
/* v9 (Playtest 10, kullanıcı kararı) — TABAN 250 → 200.
   Kural v8'deki ile AYNI tutuldu: "zemin düşer, TAVAN SABİT KALIR" — yalnız
   ilk hedefi indirip tabloyu olduğu gibi bırakmak C1→C2 arasında yapay bir
   duvar üretirdi (370 → 640 = ×1.73). Zemin ×0.80 düştüğü için stage
   başına boss adımı yeniden ölçeklendi: (4750/370)^(1/7) ≈ 1.44.
   Boss ekseni: 370 → 530 → 770 → 1100 → 1590 → 2290 → 3300 → 4750
   Net etki (v8 → v9): C1 ×0.80 · C2 ×0.83 · C3 ×0.87 · C4 ×0.89
                       C5 ×0.92 · C6 ×0.95 · C7 ×0.97 · C8 ×1.00
   Yani indirim C1'de en sert, stage ilerledikçe sönüyor ve final boss
   hiç değişmiyor — run'ın zirvesi ve uzunluğu korunuyor.
   ⚠ DENGE NOTU: 1.44x, projenin tarihsel bandının (1.36–1.40) ÜSTÜNDE.
   Sabit tavanla düşen zeminin kaçınılmaz sonucu bu; oyuncu gücü stage
   başına bu kadar hızlı büyümezse C5+ dikleşmiş hissettirir. Hazır geri
   adım (C5 sonrası çok sert derse): tavanı 4750 → 3900'e çekip oranı
   1.40'a döndürmek — tablo o durumda 370·520·730·1020·1430·2000·2800·3900.
   Stage içi ritim korundu: R1 ≈ boss×0.54→0.63 (stage'le artar),
   R2 ≈ boss×0.78→0.81.
   NEFES KURALI ("yeni stage R1 < önceki stage boss'u") istisnasız
   sağlanıyor: 310<370 · 460<530 · 680<770 · 990<1100 · 1440<1590 ·
   2080<2290 · 3000<3300.
   ⚠ KALİBRASYON SINIRI DEĞİŞMEDİ: tests/sim_p7.js botu ~1200-1800 puanda
   tavan yapar, yani C5+ bandını sim doğrulayamaz; C1-C4 doğrulanır. */
/* v10 (2026-08-23, Grup B — kullanıcı kararı) — STAGE 1 = 200 / 300 / 400.
   Kullanıcı yalnız S1'i sabitledi ("Normal 1 = 200, Normal 2 = 300, Boss =
   400"), gerisini "orantılı artırarak" istedi. Uygulanan kural v8/v9 ile
   AYNI: ZEMİN VERİLİR, TAVAN SABİT KALIR (S8 boss 4750, v7'den beri
   değişmedi) — aradaki adım yeniden ölçeklenir:
       boss adımı = (4750 / 400)^(1/7) ≈ 1.4241
   Boss ekseni: 400 → 570 → 810 → 1160 → 1650 → 2340 → 3340 → 4750
   Stage içi ritim de S1'in yeni oranlarından türetilir (v9'da R1 boss×0.54,
   R2 boss×0.78 idi; S1 artık R1 = boss×0.50, R2 = boss×0.75). Bu iki oran
   S8'deki tarihsel değerlere (0.632 / 0.811) doğrusal olarak açılır — yani
   ilk stage'ler nefes alır, son stage'ler eski ritmini korur.
   Net etki (v9 → v10): R1 ekseni S2-S7'de %1-4 DÜŞTÜ, boss ekseni S1'de
   %8, S2'de %7.5, S7'de %1.2 YÜKSELDİ, S8 hiç değişmedi. Yani "raunda
   giriş" biraz yumuşadı, "boss duvarı" biraz sertleşti; run'ın toplam
   yükü ve zirvesi neredeyse aynı kaldı.
   NEFES KURALI ("yeni stage R1 < önceki stage boss'u") istisnasız
   sağlanıyor: 300<400 · 440<570 · 650<810 · 950<1160 · 1390<1650 ·
   2050<2340 · 3000<3340.
   ⚠ KALİBRASYON SINIRI DEĞİŞMEDİ: tests/sim_p7.js botu ~1200-1800 puanda
   tavan yapar, yani S5+ bandını sim doğrulayamaz; S1-S4 doğrulanır. */
const STAGE_TARGETS = [
  [200, 300, 400],      // S1 — el 15 (kullanıcı tarafından sabitlendi)
  [300, 430, 570],      // S2 (el 17)
  [440, 620, 810],      // S3 (el 19)
  [650, 900, 1160],     // S4 (el 21)
  [950, 1300, 1650],    // S5
  [1390, 1860, 2340],   // S6 — güçlü build'in de zorlanmaya başladığı yer
  [2050, 2680, 3340],   // S7
  [3000, 3850, 4750],   // S8 — FINAL BOSS (tavan v7'den beri DEĞİŞMEDİ)
];
/* Tablo dışına taşan stage'ler için (Trainer Sonsuz Mod) büyüme çarpanı.
   v10: tablo içi ~1.424x adımla tutarlı olsun diye 1.44 → 1.42. */
const TARGET_GROWTH = 1.42;

/* Çoklu kombinasyon ham puan bonusu (MULTI_RAW_BONUS) playtest 3'te
   KALDIRILDI (kullanıcı kararı): GDD 4.2 çarpan tablosu çok kombinasyonu
   zaten ödüllendiriyordu, sabit bonus aynı davranışı ikinci kez besliyordu. */

/* v3 double-dip denetimi: 7 Çift zaten çift tablosunun tepe basamağını,
   Tam El zaten anında raund kazanmayı veriyor — eski +10x/+20x kalıcı
   çarpan run'ın kalanını önemsizleştiriyordu. Yeni değerler hâlâ oyunun
   en büyük tekil ödülleri (4-6 stage yükseltmesine denk) ama run'ı
   tek başına bitirmiyor. */
const BONUS_7_CIFT = 2.0;
const BONUS_TAM_EL = 3.0;

/* ==========================================================================
   GDD 6.1 — TEMEL COIN VE BONUSLAR
   PLAYTEST 17 · GRUP I — EKONOMİ YENİDEN DENGELENDİ (kullanıcı kararı
   2026-08-28). Denetim aracı: `tools/econ_audit.js` — her stage için o
   stage'in nadirlik eğrisinden 5 joker verip 200 raund oynatır.

   ÖLÇÜM (değişiklikten ÖNCE):
     stage:      1     2     3     4     5     6     7     8
     hedef:    300   427   613   857  1248  1763  2455  3511   (×11.7)
     ort.tur: 3.06  3.22  3.17  3.32  3.43  3.52  3.85  4.00
     NET coin: 10.8   9.8   9.1   8.3   8.4   7.8   5.2   3.6   (÷3.0)
     Legendary alım gücü: 0.49 → 0.16

   YANİ GELİR EĞRİSİ ZORLUK EĞRİSİNİN TERSİNE GİDİYORDU. Üç yapısal sebep:

   1) `COIN_BASE` HIZI ödüllendiriyor ([20,12,6,3]) ama hız hedefle
      birlikte imkânsızlaşıyor: hedef stage başına ~1.42x büyürken el 21'de,
      tur başına çekiş 5'te sabit. Ortalama bitiş turu 3.06'dan 4.00'a
      kayıyor, yani tablo oyuncuya EN ÇOK İHTİYAÇ DUYDUĞU anda EN AZ ödüyor.
   2) `overshootBonus` YÜZDE eşiklidir; 300'ü %25 aşmak +75 puandır (kolay),
      3511'i %25 aşmak +878 puandır (neredeyse imkânsız). Bonus 3.9 → 0.4.
   3) Fiyatlar DÜZ ama store nadirlik eğrisi pahalıya kayıyor: Stage 1'de
      havuz %74 Common (5 coin), Stage 8'de %28 Legendary + %18 Mythic
      (22/35 coin). GDD 6.7'deki "bir stage'in geliri ≈ 1 Legendary"
      prensibi Stage 3'ten sonra kırılıyordu.

   DÜZELTME (dört kaldıraç, hepsi aşağıda):
     ① COIN_BASE düzleştirildi — hız hâlâ en iyisi ama geç bitiş iflas değil
     ② overshoot eşiklerine ULAŞILABİLİR bir %10 kademesi eklendi
        (üst kademeler bilerek DEĞİŞMEDİ: güçlü build'in ödülü şişmesin)
     ③ Legendary 22→18, Mythic 35→30 (geç oyunun ASIL havuzu bunlar)
     ④ gelir stage ile hafifçe ölçekleniyor (STAGE_COIN_SCALE)

   ÖLÇÜM (değişiklikten SONRA, aynı araç, yalnız PUANLA kazanılan raundlar):
     stage:      1     2     3     4     5     6     7     8
     NET coin: 12.5  13.1  13.7  14.6  14.6  12.7  12.8  11.6   (÷1.1)
     Legendary(18) alım gücü: 0.71 → 0.83   (eskiden 0.49 → 0.16)
   Gelir eğimi 3.0x'ten 1.1x'e indi. Yani GDD 6.7'deki "bir stage'in geliri
   ≈ 1 Legendary VEYA 2-3 Rare" prensibi ilk kez run BOYUNCA geçerli.
   NOT: kurtarıcı jokerle "sıyrılarak" geçilen raundlar (Lanetli Kaptan vb.)
   tabana bakmaksızın sabit 1 coin öder — bu bilinçlidir ve ölçümde ayrı
   sayılır, yoksa geç stage'lerin tabanı yapay olarak düşük görünür.
   ========================================================================== */

/* ① Bitiş turuna göre taban coin. Eski: [20,12,6,3] / [35,20,10,5].
   TASARIM KARARI: 1. ve 2. tur değerlerine DOKUNULMADI. "Hızlı bitir"
   ödülü tam ağırlığıyla duruyor (20 vs 6, boss 35 vs 11). Yalnız 3. ve
   4. tur kaldırıldı (6→7 ve 3→6), çünkü geç stage'lerde oyuncu bu turlara
   BECERİSİZLİKTEN değil hedef eğrisinden dolayı MECBUR kalıyor: hedef
   stage başına ~1.42x büyürken el 21'de, tur başına çekiş 5'te sabit.
   4. turda bitirmenin bedeli 3 coin'di — yapısal bir zorunluluğun cezası.
   Eğim 6.7x'ten 3.3x'e indi; hız hâlâ en kârlı, ama geç bitiş iflas değil. */
const COIN_BASE_NORMAL = [20, 12, 7, 6];
const COIN_BASE_BOSS = [35, 20, 13, 11];

/* PLAYTEST 25 · MADDE C + C2 (kullanıcı kararı 2026-09-09) — CEZA YARIYA
   İNDİ VE "4 TUR" UÇURUMU KALKTI. Eski: [0,1,3,6] / [0,2,5,9] + 4 tur
   açılımsız geçilirse net gelir SIFIRLANIP 1 coine iniyordu.

   ÖLÇÜM (scratch pen_audit, 3200 raund, econ_audit harness'ı):
     raundların %84-100'ünde hiç açılımsız tur yok
     ortalama ceza 0.03-0.65 coin = brüt gelirin %0.2-3.3'ü
     "4+ tur → net 1" kuralı 3200 raundun HİÇBİRİNDE tetiklenmedi
   Yani sistem fiilen ölüydü ve parasızlığın sebebi DEĞİLDİ.

   Buna rağmen iki sebeple düzeltildi:
   1) Ölçüm botu her fırsatta açılım yapar. Oysa oyunda pas geçmeyi
      ÖDÜLLENDİREN bir kart ailesi var — Bitki ("açılımsız geçtiğin her
      tur sonraki açılıma +80"), Godzilla (açılımsız turlarda şarj),
      Ayna Kral (açılımsız turda birikeni alırsın), Katalizör (turda elde
      kalan taş +0.08x). Bu build'i oynayan oyuncu kartını DOĞRU oynadığı
      için coin cezası ödüyordu.
   2) "4 tur → net 1" bir eğim değil DUVAR'dı: 3 tur 6 coine mal olurken
      4 tur ~13 coinin hepsine mal oluyordu. Merdiven artık bir basamak
      uzayıp düzgün devam ediyor (aşağıdaki Math.min(...,4)).
   Ceza korundu, çünkü "pas geçmek acıtmalı" niyeti hâlâ geçerli. */
const NOMELD_PEN_NORMAL = [0, 1, 2, 3, 4];
const NOMELD_PEN_BOSS = [0, 1, 3, 5, 7];

/* MADDE E4-a (2026-09-09) — run açılış yastığı. Gerekçe `coins:` alanında. */
const START_COINS = 10;

/* ==========================================================================
   MADDE E1 (kullanıcı kararı 2026-09-09) — FAİZ / BİRİKİM
   Store açılışında elde TUTULAN coin ödüllendirilir: her `INTEREST_PER`
   coin için +1, en çok `INTEREST_CAP`.  25 coin tutan tam faizi alır.

   NEDEN: ölçüm iki kıtlığın birbirini kaçırdığını gösterdi — erken oyunda
   (S1-S2) coin VAR ama alacak şey yok (raf %75 Common, karşılama oranı
   1.72), geç oyunda (S4+) alacak şey var ama coin yok. Arada hiçbir köprü
   yoktu: biriktirmenin getirisi sıfır olduğu için oyuncu parayı zaten
   harcamak zorundaydı. Faiz, S1-S2'nin fazlasını S4+'a taşıyan ilk
   mekanizmadır ve ekonomiye ilk kez gerçek bir KARAR ekler.

   ⚠ ŞEYTAN'IN TEKLİFİ İLE ÇAKIŞIR: o kart cüzdanı sıfırlayıp puana
   çevirir, yani faiz biriktiren oyuncuyu cezalandırır. Bu bilinçli bir
   gerilim olarak bırakıldı (kart zaten "hepsini alır" diyor), ama denge
   turunda ilk bakılacak yer burasıdır.
   ========================================================================== */
const INTEREST_PER = 5;
const INTEREST_CAP = 5;
function interestFor(coins) {
  return Math.max(0, Math.min(INTEREST_CAP, Math.floor((coins || 0) / INTEREST_PER)));
}

/* ==========================================================================
   MADDE E9 (kullanıcı kararı 2026-09-09) — TAHVİL (SABİT KALEM)
   Store'un rastgele çekilişinin DIŞINDA, her store'da duran bir kalem:
   `BOND_PRICE` coin öde, run'ın sonuna kadar her raund sonunda
   `BOND_YIELD` coin al. 4 raundta kendini amorti eder.

   NEDEN SABİT: oyunda ekonomi kartları vardı (Bal Küpü, Coin Kasası,
   Midas) ama hepsi RASTGELE geliyordu — Bal Küpü değnek havuzunda ~30
   kalemden biri, yani bir run boyunca hiç görülmeyebiliyordu. Yani
   "ekonomiye yatırım yapayım" bir STRATEJİ değil ŞANS'tı. Sabit kalem
   onu seçilebilir bir karara çevirir.

   RUN BAŞINA `BOND_MAX` SINIRI ŞART: sınırsız bırakılsaydı "her store'da
   önce Tahvil al" tek doğru cevap olur, ekonomi tek yola inerdi. İki
   tahvil (30 coin) raund başına 8 coin döndürür — taban gelirin yarısı
   kadar, yani belirgin ama tek başına run taşımayan bir eksen.
   ========================================================================== */
const BOND_PRICE = 15;
const BOND_YIELD = 4;
const BOND_MAX = 2;

/* ④ Stage ölçeği: store'daki mal pahalılaştıkça (nadirlik eğrisi
   Legendary/Mythic'e kayar) gelir de hafifçe büyür. %8/stage seçildi:
   S1 ×1.00 … S8 ×1.56 — hedef eğrisinin (×11.7) çok altında, yani
   "zorluk artıyor" hissi korunur, yalnız ekonomik boğulma kalkar.
   Yalnız TABAN + AŞIM bonusuna uygulanır; joker coinleri (Midas, Kristal,
   Gümüş, Bal Küpü) zaten build'le birlikte ölçeklendiği için hariçtir. */
const STAGE_COIN_SCALE = 0.08;
function stageCoinScale(stage) {
  return 1 + STAGE_COIN_SCALE * (Math.max(1, stage || 1) - 1);
}

/* ② Hedef aşım bonusu. Eski eşikler: 100/50/25/1 → 12/7/4/2 (boss 18/11/6/3).
   Sorun: geç stage'de %25 bile ulaşılamıyordu, çünkü raund hedefe
   ULAŞILDIĞI ANDA biter — aşım fiilen "son açılım ne kadar taşırdı"
   demektir ve büyük hedeflerde bu oran küçülür. Ulaşılabilir bir %10
   kademesi eklendi ve orta kademeler yükseltildi; tavan (12/18) aynı
   kaldı ki güçlü build'in ödülü şişmesin. */
function overshootBonus(score, target, boss) {
  const pct = ((score - target) / target) * 100;
  if (pct >= 100) return boss ? 18 : 12;
  if (pct >= 50) return boss ? 11 : 7;
  if (pct >= 25) return boss ? 6 : 4;
  if (pct >= 10) return boss ? 4 : 3;     // ← Grup I: yeni, ULAŞILABİLİR kademe
  if (pct >= 1) return boss ? 3 : 2;
  return 0;
}

/* GDD 13.2 — boss zorluk tipleri (hafif set; koşul + hedef üst üste
   binmesin diye tek eksenli kısıtlamalar seçildi) */
/* GDD 13 — boss'lar Bölüm 10'daki Epic jokerlerdir; boss kazanılınca
   O boss'a özel Epic taş ödül verilir (GDD 13.3). Koşullar GDD 10'daki
   'Boss Koşulu' tanımlarından uyarlanmıştır. GDD dışı boss yok. */
const BOSSES = [
  /* Grup J (2026-07-09): 3 tur = %25 daha az açılım fırsatı; telafi olarak
     Godzilla boss'unda hedef %10 düşürülür (playtest: C4 Godzilla duvara
     dönüşüyordu). */
  { key: 'godzilla', name: 'Godzilla', desc: 'Raund 3 tur sürer, 4. tur yok. Karşılığında hedef %10 düşük.' },
  { key: 'karaKedi', name: 'Kara Kedi', desc: 'Desteden gelen her 13 sana 1 olarak gelir. Başlangıç eli dahil.' },
  { key: 'kirby', name: 'Sir.by', desc: 'Her tur başında 3 taşının değeri 1 azalır.' },
  /* Grup C (Playtest 18): DETERMİNİSTİK "en düşük 2" → TAMAMEN RASTGELE 2.
     Gerekçe: eski hâli Sir.by'ın aşınma mantığının ikizi gibi okunuyordu. */
  { key: 'cellat', name: 'Cellat', desc: 'Her tur başında rastgele 2 taşın idam edilir.' },
  { key: 'misunderstood', name: 'The Misunderstood', desc: 'Hedef puan %25 daha yüksek.' },
  { key: 'kelebek', name: 'Kelebek Etkisi', desc: 'Her tur bir açılım türü yasak. Yasağı çiğnersen o açılımın puanı %30 kesilir.' },
  { key: 'ahtapot', name: 'Ahtapot', desc: 'Kazandığın her puanın %15’i emilir.' },
  /* Grup I (2026-07-09): banner jokerin NORMAL açıklamasını gösteriyordu —
     GDD 13.4 Boss Koşulu ayrı ve daha serttir: sınır her tur ARTAR,
     aşılırsa hedef %15 oynar (jokerde %10). */
  { key: 'fatality', name: 'Fatality', desc: 'Her tur skor sınırı yükselir. Aşarsan hedef %15 değişir.' },

  /* ===== Playtest 6 / Grup F: GDD Bölüm 10'daki 20 Epic'in kalan 12'si.
     Metinler GDD'nin "⚔ Boss Koşulu" bölümlerinden alındı; uyarlama
     gerekçeleri her efektin yanında koddaki yorumlarda. ===== */
  { key: 'zombie', name: 'Zombie', desc: 'Her tur çektiğin 1 taş enfekte gelir (0 puan). Elindeki 1 taş daha etkisizleşir.' },
  { key: 'freedom', name: 'Freedom Fighters', desc: '5 taş işaretlenir. İşaretli taş eline gelirse açılımda kullan, yoksa Game Over.' },
  { key: 'uzayli', name: 'Alien', desc: 'Her tur 3 taşın gizlice uzaylıya dönüşür, hangileri belli olmaz. Uzaylı içeren kombinasyon çöker: 0 puan, taşlar geri gelir.' },
  { key: 'cheating', name: 'The Cheating', desc: 'Her tur ne çalacağını önceden söyler. Tur sonunda %50 ihtimalle en yüksek taşını çalar.' },
  { key: 'dervish', name: 'GLITCH', desc: 'Her tur çektiğin 3 taş glitch’li gelir, ikisi bozuktur. Bozuk taşı açarsan o açılımın puanı %25 düşer.' },
  { key: 'terziIgne', name: 'Terzi\'nin İğnesi', desc: 'Her tur başında 2 taş dikilir: ne atılır ne açılımda kullanılır. Tur bitince serbest kalır.' },
  { key: 'avukat', name: 'Avukat', desc: 'Her tur bir jokerin susturulur, o tur çalışmaz. Joker yok olmaz.' },
  { key: 'ritim', name: 'Ritim', desc: 'Her açılımdan önce ritim sekansı çıkar. Tutturamazsan o açılım puan vermez.' },
  { key: 'kahin', name: 'Kahin', desc: 'Her tur zorunlu bir kehanet gelir. Uymazsan o turun puanı sıfırlanır. Hepsine uyarsan +500 puan.' },
  { key: 'tuccar', name: 'Tüccar', desc: 'Teklifler çok daha ağır ve reddedemezsin: ya bedeli ödersin ya cezayı.' },
  { key: 'corporates', name: 'The Corporates', desc: 'Raund boyu tek bir ağır şirket görevi. Tamamlayamazsan Game Over.' },
  { key: 'aynaKral', name: 'Ayna Kral', desc: 'Her açılımın puanı birikir ve bir sonraki açılımdan düşülür.' },
];

/* ==========================================================================
   PLAYTEST 17 · GRUP C — BOSS ZORLUK DAĞILIMI (kullanıcı kararı 2026-08-28)
   Sorun: boss sırası run başında 20 boss'un DÜZ KARIŞTIRILMASIYLA
   üretiliyordu. Yani Stage 1'de, oyuncunun henüz hiç jokeri yokken,
   "The Corporates" (görevi tamamlayamazsan doğrudan Game Over) ya da
   "Freedom Fighters" (işaretli taşı kullanmazsan Game Over) çıkabiliyordu.
   Bu, run'ı beceriyle değil kurayla bitiriyordu.

   Çözüm: her boss bir ZORLUK KADEMESİNE yazılır ve stage'e göre AĞIRLIKLI
   havuzdan çekilir. Rastgelelik korunur (aynı kademede 5-8 aday var,
   tekrar yok), ama zorluk stage ilerledikçe kademeli artar.

   Kademeler ve gerekçeleri (GDD 13.4 Boss Koşullarına göre):

   1 = ERKEN (Stage 1-3) — etkisi KADEMELİ ve TELAFİ EDİLEBİLİR; hiçbiri
       anında kaybettirmez, hiçbiri bilgi saklamaz:
         ahtapot     puanın %15'i emilir (düz, okunur bir vergi)
         kirby       her tur 3 taşın değeri -1 (yavaş aşınma)
         avukat      her tur 1 joker susturulur (erken oyunda joker az,
                     etkisi doğal olarak küçük — en yumuşak boss)
         karaKedi    desteden gelen 13'ler 1 olur (değer kaybı, kayıp yok)
         kelebek     her tur bir açılım türü yasak (-%30, ceza kısmi)
         cellat      her tur RASTGELE 2 taş silinir (Grup C, Playtest 18)
         terziIgne   her tur 2 taş dikilir (tur bitince serbest)

   2 = ORTA (Stage 4-6) — gerçek bir plan gerektirir, ama kaybettirmez:
         misunderstood hedef %25 yüksek (saf duvar; joker gerektirir)
         godzilla      4 yerine 3 tur (hedef %10 telafili)
         zombie        her tur bir taş 0 puana düşer
         cheating      tur başı duyurulur, tur sonunda %50 ihtimalle tutar
         fatality      yükselen skor sınırı, aşarsan hedef %15 oynar
         dervish       çekilen 5 taşın 2'si bozuk (-%25 açılım)
         kahin         her tur zorunlu kehanet, ihlalde tur puanı 0
         tuccar        her tur bedel; reddetme hakkı yok

   3 = GEÇ (Stage 6-8) — ANINDA KAYBETTİREBİLİR ya da bilgi saklar;
       ancak dolu bir joker kadrosuyla göğüslenebilir:
         corporates  görev tamamlanmazsa doğrudan Game Over
         freedom     işaretli taşı kullanmazsan Game Over, boss puan vermez
         uzayli      GİZLİ taşlar kombinasyonu çökertir (bilgi saklar)
         aynaKral    her açılımın puanı bir sonrakinden düşülür
         ritim       her açılım bir refleks testine bağlı
   ========================================================================== */
const BOSS_TIER = {
  ahtapot: 1, kirby: 1, avukat: 1, karaKedi: 1, kelebek: 1, cellat: 1, terziIgne: 1,
  misunderstood: 2, godzilla: 2, zombie: 2, cheating: 2, fatality: 2,
  dervish: 2, kahin: 2, tuccar: 2,
  corporates: 3, freedom: 3, uzayli: 3, aynaKral: 3, ritim: 3,
};

/* Stage → kademe ağırlıkları. Sıfır olmayan her kademe o stage'de
   çıkabilir; sayı, o kademeden çekilme ağırlığıdır. Stage 6 geçiş
   stage'idir: hem orta hem geç bossları görebilir. */
const BOSS_STAGE_WEIGHTS = [
  /* Stage 1 */ { 1: 1 },
  /* Stage 2 */ { 1: 1 },
  /* Stage 3 */ { 1: 1 },
  /* Stage 4 */ { 2: 1 },
  /* Stage 5 */ { 2: 1 },
  /* Stage 6 */ { 2: 2, 3: 3 },
  /* Stage 7 */ { 3: 3, 2: 1 },
  /* Stage 8 */ { 3: 1 },
];

/* ---------- Nadirlik (GDD 7.1 / 6.6) ---------- */

/* chance alanı artık kullanılmıyor — Grup B (2026-07-09): rarity ağırlıkları
   stage'e bağlı RARITY_CURVE tablosundan gelir (aşağıda). */
const RARITY = {
  common:    { tr: 'Common',      price: 5,  sell: 2,  discount: 0.25, discPrice: 3,  uses: 5 },
  rare:      { tr: 'Rare',        price: 10, sell: 5,  discount: 0.15, discPrice: 7,  uses: 4 },
  /* ③ PLAYTEST 17 · GRUP I — Legendary 22→18, Mythic 35→30.
     Gerekçe: bu iki nadirlik geç oyunda "seçenek" değil HAVUZUN KENDİSİDİR
     (Stage 8'de Common çıkma ihtimali yalnız %26). Erken oyunu bozmaz,
     çünkü orada zaten neredeyse hiç çıkmıyorlar (Stage 1'de Legendary %1.8).
     Satış fiyatı da yarı oranında güncellendi.

     PLAYTEST 25 · MADDE E10 (kullanıcı kararı 2026-09-09) — Legendary
     18→14, Mythic 30→20. ÖLÇÜMÜN GEREKÇESİ: fiyat tek başına anlamsızdır,
     çünkü joker HER RAUND YAŞLANIR ve süresi dolunca yok olur. Doğru birim
     "kart fiyatı" değil COIN / RAUND / SLOT'tur:
         Common     5 / 5.00 raund =  1.00
         Rare      10 / 3.45 raund =  2.90
         Legendary 18 / 2.71 raund =  6.63
         Mythic    30 / 1.10 raund = 27.27   ← havuzun en pahalı kalemi
     Bunu stage nadirlik eğrisiyle çarpınca 5 slotu dolu tutmanın raundluk
     kirası çıkar; raund gelirine bölününce "karşılama oranı":
         S1 1.72 · S3 1.01 · S4 0.70 · S6 0.51 · S8 0.30
     Yani Stage 3'te başabaş geçiliyor, S8'de gelir ihtiyacın %30'u.
     Playtest 17'de GELİR eğimi 3.0x'ten 1.1x'e indirilmişti ama GİDER
     eğimi hiç ölçülmemişti — o hâlâ 5.1x büyüyordu (7.7 → 39.2 coin).
     Yeni fiyatlarla karşılama oranı: S3 1.30 · S4 1.01 · S6 0.83 · S8 0.54.
     Satış fiyatları yarı fiyat kuralına göre birlikte güncellendi. */
  legendary: { tr: 'Legendary',   price: 14, sell: 7,  discount: 0.08, discPrice: 10, uses: 3 },
  mythic:    { tr: 'Mythic',      price: 20, sell: 10, discount: 0.04, discPrice: 15, uses: 1 },
  epic:      { tr: 'Boss (Epic)', price: 0,  sell: 8,  discount: 0,    discPrice: 0,  uses: 3 },  // store'da satılmaz
};

/* ==========================================================================
   PLAYTEST 25 · KART BAZLI FİYAT İSTİSNASI (kullanıcı kararı 2026-09-09)

   E10 Mythic fiyatını 30→20'ye indirdi. O indirimin GEREKÇESİ "30 coinlik
   kart ortalama 1.10 raund yaşıyor" idi. Ama aynı turda kabul edilen E3-c
   tam olarak bu iki kartı ÖLÜMSÜZ yapıyor (aşağıda `isRunLong`): The World
   ve Pinky Finger artık tetiklenene kadar hiç yaşlanmıyor. Yani indirimin
   gerekçesi bu iki kart için ortadan kalktı — ucuzlatmak, oyunun en güçlü
   iki kurtarıcısını hem ucuzlatıp hem kalıcılaştırmak olurdu.
   Bu yüzden E10 diğer 8 Mythic'e uygulanır, bu ikisi 30 coinde kalır.
   Tek bir tabloda durur ki geri alması bir satır olsun.
   ========================================================================== */
const JOKER_PRICE_OVERRIDE = { theWorld: 30 };   // P31 · Grup C: Pinky artık kurtarıcı değil, istisna kalktı
function jokerPrice(key, rarity) {
  return JOKER_PRICE_OVERRIDE[key] ?? RARITY[rarity].price;
}
function jokerSell(key, rarity) {
  const o = JOKER_PRICE_OVERRIDE[key];
  return o != null ? Math.round(o / 2) : RARITY[rarity].sell;
}
function jokerDiscPrice(key, rarity) {
  const o = JOKER_PRICE_OVERRIDE[key];
  return o != null ? Math.round(o * 0.73) : RARITY[rarity].discPrice;
}

/* Grup B (2026-07-09): rarity ağırlıkları stage'e göre kademeli eğri.
   Erken stage'lerde Legendary/Mythic ÇOK nadir, C3'ten itibaren belirgin
   şekilde açılır. Satır = stage (tablo dışı stage'ler son satırı kullanır). */
const RARITY_CURVE = [
  /* PLAYTEST 22 · GRUP A (kullanıcı kararı 2026-09-06) — ERKEN BANT KISILDI.
     Ölçüm: eskiden stage 1-2 boyunca (6 raund × 4 slot) rafta en az bir
     Legendary/Mythic görme ihtimali %62.7 idi; slot başına oran doğru
     görünse de MARUZİYET BİRİKİYORDU. C1-C2 satırları kısılınca bu ~%45.6'ya
     iner. C3+ satırları DEĞİŞMEDİ — kıtlık yalnız açılış bandı içindir. */
  { common: 0.755, rare: 0.232, legendary: 0.012, mythic: 0.001 }, // C1
  { common: 0.655, rare: 0.308, legendary: 0.032, mythic: 0.005 }, // C2
  { common: 0.55, rare: 0.32, legendary: 0.100, mythic: 0.030 }, // C3
  { common: 0.47, rare: 0.32, legendary: 0.150, mythic: 0.060 }, // C4
  { common: 0.41, rare: 0.31, legendary: 0.190, mythic: 0.090 }, // C5
  { common: 0.36, rare: 0.30, legendary: 0.220, mythic: 0.120 }, // C6
  /* Grup I — run 8 stage'e çıktı; eğri C6'da donup kalmasın diye
     C7-C8 satırları eklendi (geç oyunda güçlü kart bulmak kolaylaşır,
     ama hedefler ondan daha hızlı büyür — bkz. STAGE_TARGETS v5). */
  { common: 0.31, rare: 0.29, legendary: 0.250, mythic: 0.150 }, // C7
  { common: 0.26, rare: 0.28, legendary: 0.280, mythic: 0.180 }, // C8+
];

/* Boss (Epic) jokerler STORE'DA ÇIKMAZ (GDD Bölüm 10: "Kazanım: Store'da
   çıkmaz — yalnızca Boss Raund ödülü olarak gelir"). 2026-07-09'da kısa
   süreliğine store'a eklenmişti, aynı gün kullanıcı kararıyla GERİ ALINDI. */

/* GDD 7.4 — Ana Slot TABAN kapasitesi. PLAYTEST 9 · GRUP L'den beri bu
   sabit değil bir TABAN: Tacir Mektubu tüketilebiliri `s.slotBonus` ile
   kapasiteyi kalıcı büyütür. Kapasiteyi soran her yer `Game.slotCap()`
   kullanır — MAX_SLOTS'a doğrudan bakan kod kalmamalı. */
const MAX_SLOTS = 5;
const SLOT_BONUS_MAX = 1;   // 5 → 6 (tavan)

/* PLAYTEST 9 · GRUP N — GLITCH (eski Dervish) ayarları.
   BOSS: her tur çekilen 5 taşın 3'ü glitch, bunların 2'si BOZUK; bozuk taş
   açılımda kullanılırsa o açılımın puanı taş başına %25 düşer.
   JOKER: 2 taş glitch'lenir, birinde gizli +6 puan (ödül tarafı). */
const GLITCH_BOSS_TILES = 3;
const GLITCH_BOSS_CURSED = 2;
const GLITCH_MELD_CUT = 0.25;
const GLITCH_MELD_MAX_CUT = 0.50;   // tek açılımda toplam kesinti tavanı
const GLITCH_JOKER_TILES = 2;
const GLITCH_JOKER_BONUS = 60;   // P35 · Grup C: gizli bonus 6 → 60

/* Grup Q — Bungie Gum: açılım başına sakızın kopma ihtimali (GDD 9'daki %25).
   ⚠ PLAYTEST 29 · GRUP M — GEÇİCİ DENEME (kullanıcı kararı 2026-09-12):
   risk %25 → %50'ye çıkarıldı. Bu bir DENEMEDİR, kalıcı denge kararı
   değil; oynanış ölçüldükten sonra yeniden değerlendirilecek. Geri almak
   için bu satırı 0.25'e döndürmek yeterli — başka hiçbir yerde sabit
   yazılı değil (açıklama metinleri de yüzdeyi buradan türetmiyor, elle
   yazıyor: BUNGIE_SNAP değişirse JOKER_DEFS.bungieGum.desc ve i18n'deki
   İngilizce karşılığı da güncellenmelidir). */
const BUNGIE_SNAP = 0.50;

/* PLAYTEST 10 · GRUP A — Zombie jokeri (deste jokeri, boss varyantı ayrı).
   Enfekte taş açılımda kullanılırsa taş başına bu çarpan + bu sabit puan. */
const ZOMBIE_MULT = 2.5;   // P35 · Grup E: 2.0 → 2.5
const ZOMBIE_FLAT = 50;    // P35 · Grup E: 5 → 50

/* PLAYTEST 18 · GRUP A — Terazi "Adil Takas" SADELEŞTİRİLDİ (kullanıcı
   kararı, Öneri 1). Eski hâli feda edilen taşın DEĞERİNİ 5'e bölüyordu
   (13 → +2.6x); oyuncu her feda öncesi kafadan bölme yapmak zorundaydı ve
   kural tek cümlede anlaşılmıyordu. Yeni hâli SABİT kazanç verir: hangi
   taşı verirsen ver +1.5x. Karar korunur ama hesap kalkar. Denge: eski
   ortalama feda ~+1.4x idi, güç seviyesi neredeyse birebir aynı kaldı. */
const TERAZI_GAIN = 1.5;   // (eski sabit kazanç — kayıt uyumu için duruyor)

/* PLAYTEST 20 · GRUP A — TERAZİ "TAŞ FEDA ET" BAŞTAN TASARLANDI.
   Eski hâli AÇILIM aşamasında çalışıyordu ve hangi taşı verirsen ver sabit
   +1.5x veriyordu: "hangi taşı gözden çıkarabilirim" kararı vardı ama
   taşın DEĞERİ hiç önemli değildi, yani feda bir seçim değil bir ritüeldi.
   Üstelik buton aksiyon barına sonradan enjekte edildiği için ızgaraya
   ait değildi ve uzun etiketlerde kutudan taşıyordu.

   YENİ HÂLİ — BİLİNÇLİ, DEĞER BAZLI, İKİ KOLLU:
     · Feda artık TAŞ ATMA (discard) aşamasında yapılır: normal atıştan
       ayrı, ek bir karar. Tur başına bir kez.
     · AĞIR TAŞ (8-13) → HEDEFİN %(taş değeri) kadarı puan, ANINDA.
       Bedel: SONRAKİ turda işlek riski +%10 (yalnız o tur).
     · HAFİF TAŞ (1-7) → +0.3x, raundun KALAN TÜM turlarına (birikir).
       Bedel yok. Erken feda daha çok tura işler; bu da ayrı bir karar.
   Puanın "hedefin yüzdesi" olması bilinçli: sabit puan bu kod tabanında
   defalarca ölçeksiz kaldı (Stage 1'de run kırıyor, Stage 8'de görünmüyor).
   Yüzde formülü kullanıcının istediği "taşın değerinin katı" okumasını
   birebir korur (11 → %11) ama her stage'de aynı ağırlıkta kalır.
   Oyuncu hesap yapmaz: UI önizlemesi gerçek sayıyı yazar.               */
/* ============================================================
   PLAYTEST 20 · GRUP D — TRADE JOKERİ "BORSA"YA ÇEVRİLDİ.
   Eski hâli ("bu raund Sıralı +1.5x, sonraki raund -0.5x") borsa temasını
   hiç taşımıyordu: tek bir kombinasyon türüne kilitliydi, oyuncu hiçbir
   şey OKUMUYOR ve hiçbir şeye göre plan YAPMIYORDU — iki raundda bir
   dönüşen sabit bir sayıydı.
   Yeni hâli gerçek bir PİYASA: her raund üç kombinasyon türünden biri
   YÜKSELİŞE, biri DÜŞÜŞE geçer, biri yatay kalır. Oyuncu elini piyasaya
   göre kurar (yükselen türü kovala, düşen türden kaçın) ve raund sonunda
   yükselen türden açtığı her kombinasyon TEMETTÜ öder.
   Sayılar eski jokerin güç bandını korur: yükseliş +1.5x (eskiyle aynı),
   düşüş -0.5x (eskiyle aynı) — değişen tek şey neyin yükselip düştüğünün
   her raund yeniden çekilmesi ve ekranda YAZMASI.
   ============================================================ */
/* ============================================================
   PLAYTEST 29 · GRUP H — BORSA "HİSSE PORTFÖYÜ"NE GEÇTİ
   (kullanıcı kararı 2026-09-12). Ad TR "Borsa" / EN "Stock" olarak
   sabitlendi (eski görünen ad "Trade Jokeri"ydi); ANAHTAR `tradeJokeri`
   OLARAK KALIR — kayıtlar jokeri anahtarla saklar (Ustura/`zimpara`,
   Damga/`ayna` emsali).
   ESKİ HÂLİ Common'lardan zayıftı: yükselen türden açılım başına +1.5x,
   düşenden -0.5x, açılım başına 2 coin. Raund başına kabaca +3.0x
   (~150 puan) üretiyordu — bu turda güçlendirilen Zincir (+8.0x),
   Yankee (+8.0x) ve Katalizör (+10x) yanında yarı yarıya geride.
   Ayrıca kartın HİÇBİR KARARI yoktu: piyasa çekiliyor, oyuncu uyuyordu.
   YENİ HÂLİ gerçek bir portföydür. Açılan her kombinasyon türüne göre
   bir HİSSE olur ve jokerin üstünde birikir; bir açılımda o türden kaç
   hissen varsa hisse başına BORSA_SHARE_MULT çarpan alırsın. Piyasa ise
   artık açılımı değil PORTFÖYÜ vurur: raund sonunda yükselen türdeki
   hisseler temettü öder, düşen türdeki hisselerin yarısı yanar.
   Doğan karar: TEK türe yüklenmek (büyük çarpan, düşerse ağır kayıp) mi,
   üç türe dağılmak (güvenli, yavaş) mı.
   ÇARPAN AÇILIMDA BULUNAN HER TÜR İÇİN BİR KEZ işler (kombinasyon sayısı
   ile çarpılmaz): 10 hisseyle 3 Sıralı açmak +12x üretirdi, bu bandı
   kırardı. Eski BORSA_UP/BORSA_DOWN açılım çarpanları KALDIRILDI —
   piyasanın tek işi artık portföyü ödüllendirmek ve budamaktır. */
const BORSA_SHARE_MULT = 0.4;   // hisse başına açılım çarpanı
const BORSA_SHARE_CAP = 10;     // tür başına en fazla hisse (= +4.0x)
const BORSA_DIVIDEND = 3;       // yükselen türdeki hisse başına raund sonu coin
const BORSA_BURN = 0.5;         // düşen türdeki hisselerden kalan oran
const BORSA_TYPES = ['per', 'sirali', 'cift'];
const BORSA_EMPTY = () => ({ per: 0, sirali: 0, cift: 0 });

const KAGIT_TILES = 2;   // P31 · Grup J: Kağıt her raund en düşük 2 taşı KALICI okeye çevirir

/* TERAZİ (Rare) — PLAYTEST 29 · GRUP J (kullanıcı kararı 2026-09-12).
   Üç değişiklik + bir sadeleştirme:
     · HAFİF feda 0.3x → 0.8x
     · AĞIR feda artık PUAN vermiyor, HEDEFİ İNDİRİYOR: taşın değerinin
       15 katı kadar. Eski "hedefin %(değer) kadarı puan" formülü hedefle
       birlikte ölçekleniyordu ama oyuncunun okuduğu şey bir yüzdeydi;
       yeni formül doğrudan terazinin öbür kefesine dokunur — ne kadar
       ağır taş verirsen hedef o kadar aşağı iner.
     · ESKİ BEDEL (sonraki turun işlek riski +%10) TÜMDEN KALDIRILDI.
       Yerine geçen kural daha okunur ve aynı turda çözülür: O TURDA
       İŞLEK CEZASI YERSEN O TURUN FEDA BONUSU İPTAL OLUR. Böylece feda
       ile işlek birbirini engelleyen iki kefe olur; gecikmeli borç
       defteri (teraziIslekNext/Turn) tutmaya gerek kalmaz.
   İptal, cezanın GERÇEKTEN yendiği durumda işler: Paratoner yıldırımı
   puana çevirdiyse ya da Ayna Kırığı işleği tersine döndürdüyse ceza
   yenmemiştir, bonus durur. */
const TERAZI_HEAVY_MIN = 8;      // bu değer ve üstü "ağır taş" sayılır
const TERAZI_LIGHT_MULT = 0.8;   // hafif taş: raundun kalanına eklenen çarpan
const TERAZI_HEAVY_TARGET = 15;  // ağır taş: değerinin bu katı kadar hedef düşer

/* PLAYTEST 18 · GRUP B — Altın Oran: gerçek tam sayı eklemesi.
   PLAYTEST 20 · GRUP M + P (kullanıcı kararı 2026-08-30) — RUN TAVANI
   KALDIRILDI. "Run boyunca 2 kullanım" sınırı değneği işlevsiz kılıyordu:
   değnek store'da tekrar tekrar çıkıyor, oyuncu coin ödeyip satın alıyor ve
   kullanamıyordu. Sınır artık COIN'dir — satın alabildiğin kadar kullan.
   `ALTIN_ORAN_MAX` sabiti yalnız eski kayıt alanlarının okunması için
   duruyor; hiçbir yerde sınır olarak kullanılmıyor. */
const ALTIN_ORAN_GAIN = 1.0;
const ALTIN_ORAN_MAX = 2;   // (kullanılmıyor — bkz. yukarıdaki not)

/* ============================================================
   PLAYTEST 19 · GRUP G — THE CHEATING (joker + boss) SAYILARI.
   Tek yerde tutulur ki motor, bildirim metni ve UI rozeti hep aynı
   sayıyı göstersin (Terzi'nin İğnesi'nde tam bu ayrışma bug olmuştu:
   bildirim +0.4x yazarken puanlama +0.6x veriyordu).
   ------------------------------------------------------------
   JOKER: eski hâli her tur rastgele +50 puan / +0.5x / +2 coin
   veriyordu. Sabit puan hedefle ölçeklenmediği için Stage 4'te (hedef
   1160) %4, Stage 8'de (4750) %1 ediyordu — yani görünmezdi. Yeni hâli
   TEK EKSENDE birikir: her tutan hile o raunda +0.4x ekler. Çarpan
   hedefle birlikte ölçeklendiği için son stage'lerde de anlamlıdır ve
   oyuncu biriken sayıyı gözüyle takip edebilir (3 tur = +1.2x).       */
const CHEAT_MULT = 0.4;        // (eski çarpan ekseni — kayıt uyumu)
const CHEAT_RISK_STEP = 0.12;  // (eski lineer risk adımı — kayıt uyumu)

/* ============================================================
   PLAYTEST 20 · GRUP G — THE CHEATING SOMUT "TAŞ ÇALMA"YA ÇEVRİLDİ.
   P19'daki hâli soyut kalıyordu: "hile tuttu, +0.4x biriktin". Oyuncu
   ekranda hiçbir şeyin DEĞİŞTİĞİNİ görmüyordu — yalnız bir sayı büyüyordu.
   Yeni hâli jokerin adını hak eder: her tur DESTEDEN gizlice bir taş
   çalınır ve doğrudan ELE konur. Çalınan taş rastgele değil, destenin en
   yüksek değerli 3 adayından biridir ("hırsız iyi malı seçer") — Epic'i
   hak ettiren şey budur; Crimson King'in salt "+1 taş"ından ayrışır.
   Yakalanma riski kullanıcının verdiği üç kademede artar ve yakalanınca
   ÇALINAN BÜTÜN TAŞLAR desteye geri döner: bedel de somut olur.
   ============================================================ */
/* PLAYTEST 21 · AÇIKLAMA SADELEŞTİRME (kullanıcı kararı 2026-09-03).
   Üç kademeli risk merdiveni (%10 → %20 → %35) + "açılımsız tur riski
   sıfırlar" kolu, jokerin açıklamasını dört cümleye çıkarıyordu; kullanıcı
   referans uzunluk olarak Zombie boss'unu (2 kısa cümle) verdi ve bu dört
   joker için mekanikte küçük sadeleştirmeye izin verdi.
   Merdiven ve sıfırlama kolu TEK SABİT RİSKE indirildi. GÜÇ KORUNDU:
   bir raundda beklenen çalınan taş sayısı merdivende
     0.90 + 0.72 + 0.47 + 0.30 + 0.20 ≈ 2.6
   sabit %20'de
     0.80 + 0.64 + 0.51 + 0.41 + 0.33 ≈ 2.7
   yani neredeyse birebir aynı. Kaybedilen tek şey "bir turu pas geçip
   jokeri kurtar" kararıydı; kazanılan şey tek bakışta okunan bir kural. */
const CHEAT_RISK = 0.20;      // her tur sabit yakalanma riski
const CHEAT_RISK_STEPS = [0.10, 0.20, 0.35];  // (eski merdiven — kayıt uyumu)
const CHEAT_DECK_PICK = 3;    // (eski taş çalma — kayıt uyumu)
/* P35 · GRUP H (kullanıcı kararı 2026-09-13) — JOKER "HİLELİ AÇILIM".
   Taş çalma kaldırıldı (hissedilmiyordu). Oyuncu açılımı onaylamadan önce
   "hile" der: o açılım +3.0x. Her hile raund boyu yakalanma riskine +%20
   ekler; zar TUR SONUNDA atılır. Yakalanınca joker gider ve o raund hileyle
   kazanılan EK puan skordan silinir. Boss Koşulu dokunulmadı. */
const CHEAT_HILE_MULT = 3.0;
const CHEAT_HILE_RISK = 0.20;
/* GDD "discard ile risk sıfırlanır" diyordu ama Okey'de discard her turun
   ZORUNLU son adımıdır — o hâliyle risk hiç artmaz, kural anlamsızlaşırdı
   (ve kodda zaten hiç uygulanmamıştı). Kullanıcı kararı (P19): risk
   AÇILIMSIZ geçilen turda sıfırlanır. Böylece gerçek bir bedel-karar
   doğar: bir turun puanından vazgeçip jokeri kurtarır mısın?           */

/* BOSS: cezalar artık sabit değil, ORANSAL — hep hissedilir kalsın. */
const BOSS_CHEAT_CHANCE = 0.50;     // duyurulan hilenin tutma ihtimali
const BOSS_CHEAT_STEAL = 0.15;      // o raundda kazanılan puanın %15'i
const BOSS_CHEAT_MULT = 1.0;        // raund çarpanından düşülen miktar
const BOSS_CHEAT_CAUGHT_COIN = 1;   // hile açığa çıkarsa oyuncunun ödülü
/* GRUP G (P20) — boss da artık TAŞ ÇALAR (jokerin aynası).
   Plan türleri "puan/çarpan/taş bozma" idi; hepsi soyut ceza sayılarıydı.
   Yeni plan iki koldur ve ikisi de ekranda görünür bir şey yapar. */
const BOSS_CHEAT_TR = {
  hand: 'ELİNDEN BİR TAŞ ÇALMAYA çalışacak',
  deck: 'DESTENDEN 2 TAŞ ÇALMAYA çalışacak',
};
const BOSS_CHEAT_DECK_N = 2;   // desteden çalınan taş sayısı
/* PLAYTEST 30 · GRUP F — Robin Hood KALDIRILDI, yerine VASİYET geldi.
   Vasiyet süresi dolan jokerlerin efektini `j.legacy` deposunda taşır;
   depo FIFO'dur, kapasite aşılınca en eski miras düşer. */
const VASIYET_CAP = 2;
/* PLAYTEST 30 · GRUP G — Newton KALDIRILDI, yerine İPOTEK geldi.
   Oyuncu raund içinde ELLE tetikler: o raund +N tur, borç sonraki
   raundun başında -N tur olarak tahsil edilir (en az 1 tur kalır).
   Borç kartın değil DURUMUN üstünde durur (s.ipotekDebt): kullanıp
   store'da satmak ya da kartın kırılması borcu silmez. */
const IPOTEK_TURNS = 2;

/* Grup E/21 — Ahtapot: kol başına çarpan ve feda edilen kolun anlık çarpanı.
   Eski sabit puan değerlerinin (20 / 60) birbirine oranı korundu: feda,
   üç kola denktir. 8 kol = +4.0x, çarpan tablosunun iki basamağına denk. */
const AHTAPOT_ARM_MULT = 1.0;     // P35 · Grup G: kol başına 0.5 → 1.0
const AHTAPOT_BURST_MULT = 2.5;   // P35 · Grup G: feda edilen kol 1.5 → 2.5

/* PLAYTEST 11 · GRUP D — Sisyphus "Kaya": üst üste açılım yapılan turlara
   göre çarpan. Bir tur açılım yapılmazsa kaya dibe düşer (sıfırlanır). */
const SISYPHUS_STEPS = [3.0, 7.0, 15.0];  // P30: 1.0/2.5/4.5 → 2/4/8 · P33 · Grup B: → 3/7/15

/* PLAYTEST 11 · GRUP F — Pandora'nın üç gizli varyantı. Kutu ele ilk
   geldiğinde EŞİT OLASILIKLA birine dönüşür. */
const PANDORA_VARIANTS = ['umut', 'salgin', 'armagan'];
const PANDORA_UMUT_FLAT = 50;       // açılımdaki taş başına puan (P30 · Grup H: 8 → 50)
const PANDORA_SALGIN_TILES = 2;     // her tur dertlenen taş sayısı
const PANDORA_SALGIN_MULT = 2.5;    // dertli taş açılımda (P30 · Grup H: 1.2 → 2.5)
const PANDORA_SALGIN_BURN = 30;     // dertli taş elde beklerse tur başına (P30 · Grup H: 20 → 30)
const PANDORA_ARMAGAN_TILES = 3;    // raund başında 13'e çıkan taş sayısı
const PANDORA_ARMAGAN_BONUS = 0.30; // armağan taşlı kombinasyonun puan artışı (P30 · Grup H: %25 → %30)

/* DR. FRANKENSTEIN — TEK MASA, İKİ AMELİYAT (kullanıcı kararı 2026-09-03).
   Playtest 10 · Grup B'de üç varyasyon trainer-only olarak denendi; kullanıcı
   II (Diriliş) ile III (Ekleme Ameliyatı) İKİSİNİ BİRLİKTE takıp oynadı ve
   bu ikilinin keyifli olduğunu bildirdi. Sebebi mekanik: III eli her tur
   1 taş KÜÇÜLTÜR (2 taş → 1), II ise her tur 1 taş BÜYÜTÜR (mezardan gelen);
   yan yana el boyu sabit kalır ve "attığını geri al, çöpünü birleştir"
   döngüsü kurulur. Bu yüzden ikisi tek jokerde birleştirildi: mekanikler ve
   ödüller BİREBİR korundu, yalnız tek kart altında toplandı.
   I (Ceset Torbası) seçilmediği için tamamen kaldırıldı.
     Diriliş  : mezarlıktan kalkan taşa +ADD değer, açılımda +FLAT puan
     Ameliyat : en düşük 2 taş toplanır (tavan 13), açılımda +MULT çarpan */
const FRANK_REVIVE_ADD = 3;
const FRANK_REVIVE_FLAT = 80;   // P30 · Grup L: 40 → 80
const FRANK_STITCH_MULT = 2.0;  // P30 · Grup L: 0.8 → 2.0
/* PLAYTEST 30 · LEGENDARY DENGE TURU (kullanıcı kararı 2026-09-13).
   Sayılar tanımların ve puanlamanın TEK kaynağıdır; açıklama metinleri
   ve olay notları da bunlardan okunur. */
const MIDAS_COIN = 3;        // Grup B — açılımdaki taş başına coin (+1 → +3)
const TEKER_MULT = 3.0;      // Grup C — karışık açılımda iki tabloya da (+1.0 → +3.0)
/* P33 · Grup B (kullanıcı onayı 2026-09-13): Kaioken raundda en çok TEK
   açılım yapabildiği için (4 tur, 3'ünü bekliyor) açılım başı çarpanı
   Sisyphus'un tüm serisinden büyük olmalı: en iyi raund ≈ 750 puan. */
const KAIOKEN_MULT_2 = 6.0;  // 2 tur açmazsan (P30 +2.5 → P33 +6.0)
const KAIOKEN_MULT_3 = 15.0; // 3+ tur açmazsan (P30 +7.0 → P33 +15.0)
/* P33 · Grup A — ANKA KUŞU "YÜKSELEN ALEV": ölüm dönüşümüne DOKUNULMADI;
   yaşarken ömrü azaldıkça açılımlarına çarpan verir. */
const ANKA_MULT_EARLY = 2.0; // son raundu değilken
const ANKA_MULT_LAST = 5.0;  // son raundunda (usesLeft ≤ 1)
/* P34 (kullanıcı onayı 2026-09-13) — iki yeni Legendary.
   RÜŞVET: taş başına coin; tur başına tek kullanım, raund sınırı YOK.
   HİDRA: atılan her okey sonraki tur 2 geçici okey doğurur (geçiciler de
   çoğalır), raund başına en çok 4. */
const RUSVET_COST = 2;
const HIDRA_SPAWN = 2;
const HIDRA_ROUND_CAP = 4;
/* P35 · BOSS (EPIC) JOKER GÜÇ TURU (kullanıcı kararı 2026-09-13) — yalnız
   JOKER EFEKTİ tarafı; Boss Koşulları dokunulmadı. */
const CELLAT_EXEC = 80;        // Grup B — idam başına anlık puan (20 → 80)
const CELLAT_MOTIVE = 50;      // Grup B — idam başına sonraki açılımlara birikim (3 → 50)
const MISU_MULT = 2.5;         // Grup D — eldeyken açılım çarpanı (0.8 → 2.5)
const MISU_PERM = 2.0;         // Grup D — kazanınca bıraktığı kalıcı çarpan (0.3 → 2.0)
const ALIEN_COPY_FLAT = 80;    // Grup F — açılımda kullanılan kopya taş başına puan (yeni)
const KARAKEDI_FLAT = 80;      // Grup P — 12'ye dönüşmüş taş açılımda (yeni)
const RITIM_BONUS = [1.5, 3.0, 6.0];   // Grup K — 0.8/1.2/1.8 → 1.5/3.0/6.0
const KELEBEK_PCT = 0.50;      // Grup N — puan +%25 → +%50
const KELEBEK_FLAT = 300;      // Grup N — 120 → 300
const KELEBEK_COIN = 15;       // Grup N — 4 → 15
/* P37 (kullanıcı kararı 2026-09-13) — AYNA KRAL "BİRİKİM + ÇARPAN".
   Eski hâli yalnız SON açılımı saklıyordu (üstüne yazıyordu, net kazanç ≈ 0).
   Artık her açılım yansımaya EKLENİR; açılımsız turda ödenirken biriktirilen
   açılımlı TUR sayısı çarpanı belirler: 1 → ×1, 2 → ×1.5, 3+ → ×2. */
const AYNA_MULT_2 = 1.5;
const AYNA_MULT_3 = 2.0;
const MEDUSA_MULT = 3.0;     // Grup E — taşlaşmış taş açılımda (+1.2 → +3.0)
const MEDUSA_FLAT = 80;      // Grup E — yanına sabit puan (yeni)
const NOSTRA_MULT = 2.5;     // Grup J — kehanet tutunca kalıcı çarpan (+1.5 → +2.5)
const TEKER_FLAT = 200;      // Grup C — karışık açılıma bir kez +200 puan (kullanıcı onayı)
/* Grup K — ATEŞ TÜCCARI (Kasım Ağa + Prometheus birleşimi) */
const ATES_HAGGLE_WIN = 0.6;   // 1. adım: pazarlık tutma şansı
const ATES_DISCOUNT = 0.4;     // pazarlık tutunca indirim
const ATES_STEAL_WIN = 0.5;    // 2. adım: ateşi çalma (bedava) şansı
const ATES_STEAL_ISLEK = 0.10; // bedava alımın sonraki raunda işlek borcu
const MAX_BACKUP = 2;   // GDD 7.4 — Backup Slot

/* ---------- Tüketilebilirler v2 (Grup K, 2026-07-09) ----------
   ESKİ sistem (Tılsım/Çarpan Tozu/Ekstra Çekiş/Coin Kapsülü — tek turluk
   geçici etkiler) tamamen KALDIRILDI: boş/anlamsız hissettiriyordu.
   Yeni felsefe Balatro'nun Tarot kartları: TEK SEFERLİK ama KALICI,
   run'ı gerçekten şekillendiren "upgrade" anları.
   - target: null (anında) · 'tile' (elinden taş seç) ·
     'tileColor' (taş + renk seç) · 'joker' (jokerini seç)
   - Kalıcı deste değişiklikleri s.tileMods'a yazılır ve her raund başında
     taze desteye sırayla uygulanır (remove/add/okeyClone).
   - Store'daki tüketilebilir slotu rarity'yi stage eğrisinden
     (RARITY_CURVE) çeker — Mythic tüketilebilir erken stage'de neredeyse
     hiç çıkmaz. Envanter maks 3 (GDD 6.5b korunur). */
/* PLAYTEST 22 · GRUP D (kullanıcı kararı 2026-09-06) — DEĞNEK ENVANTERİ
   2 BAŞLAR, TAVAN 4. Eskiden 3 başlıyor ve 5'e kadar büyüyordu; envanter
   run'ın başında bile geniş olduğu için "hangi değneği taşıyayım" kararı
   geç doğuyordu. Yeni değerlerle iki büyütme basamağı kalır (2 → 3 → 4),
   yani slot artışı gerçek bir yükseltme kararıdır.
   Tavan doluyken slot büyüten HİÇBİR şey oyuncunun karşısına çıkmaz:
   · Heybe değneği   → `_consumOfferable` (store + paket havuzu)
   · Geniş Kemer    → `_genUpgradeOffer` elemesi
   İkisi de `consumCap() >= CONSUM_SLOT_MAX` diye bakar, yani tavanı
   burada değiştirmek her iki kapıyı birden ayarlar. */
const MAX_CONSUMABLES = 2;
const CONSUM_SLOT_MAX = 4;     // Heybe / Geniş Kemer ile çıkılabilecek tavan
/* PLAYTEST 22 · GRUP C — DEĞNEK SATIŞ ORANI.
   Neden yarısı değil de %40: Anarşist "Kara Pazar"ı store fiyatlarını
   ×0.4'e kadar indirir. Satış oranı bunun üstünde olsaydı "ucuza al,
   hemen sat" garanti kâr eden bir döngü olurdu; %40 tavanında o döngü
   en iyi ihtimalle başabaştır. Joker tarafındaki Common oranı (2/5) ile
   de aynıdır, yani ekonomi tek bir dille konuşur. */
const CONSUM_SELL_RATE = 0.4;
/* FERMAN (P28 · Grup F) — run başına kaç boss koşulu iptal edilebilir.
   2'de duruyor: 8 stage = 8 boss, yani en fazla dördünün dörtte biri.
   Tavan hem `_consumOfferable` elemesini hem kullanım kapısını besler,
   yani burayı değiştirmek iki yeri birden ayarlar. */
const FERMAN_MAX = 2;
/* MIKNATIS (P28 · Grup H) — aynı anda en fazla kaç taş mıknatıslı olabilir.
   3'te duruyor: açılış eli ~15 taş, üçü sabitlemek eli "kurulmuş" yapmaya
   yetmez ama bir build'in belkemiğini (ör. iki Altın Taş + okey) garantiler.
   Tavan hem `_consumOfferable` elemesini hem kullanım kapısını besler. */
const MAGNET_MAX = 3;
const CONSUMABLES = {
  /* COMMON — deste marangozluğu */
  boya: { key: 'boya', name: 'Boya Kabı', icon: '🎨', price: 5, rarity: 'common', target: 'tileColor',
    desc: 'Bir taş seç: rengi kalıcı değişir.' },
  /* PLAYTEST 26 · GRUP G — "Zımpara" adı USTURA oldu (kullanıcı kararı
     2026-09-09). İsim çakışması YOKTUR: eski Ustura kartı 2026-09-08'de
     oyundan tamamen çıkarılmıştı (aşağıdaki nota bak), ad boşta duruyordu.
     Efekt DEĞİŞMEDİ — tek bir taşı desteden siler, eski Ustura'nın "tüm
     kopyaları siler" davranışı geri gelmedi.
     ANAHTAR `zimpara` OLARAK KALIR: kayıtlar (save) tüketilebilirleri
     anahtarla saklar, anahtarı değiştirmek eldeki kartı kayıp gösterirdi.
     Kullanıcıya görünen her yerde ad kullanılır, anahtar hiç görünmez. */
  zimpara: { key: 'zimpara', name: 'Ustura', icon: '🪒', price: 4, rarity: 'common', target: 'tile',
    desc: 'Bir taş seç: desteden kalıcı silinir.' },
  cekic: { key: 'cekic', name: 'Değer Çekici', icon: '🔨', price: 6, rarity: 'common', target: 'tile',
    desc: 'Bir taş seç: değeri kalıcı +3 artar (en çok 13).' },
  /* PLAYTEST 8 / Grup D: Kumbara 10 → 12 coin. 3 coine alınıp 10 veren bir
     kart net +7 ediyordu; bir store kalemini bile tam karşılamıyordu. */
  kumbara: { key: 'kumbara', name: 'Kumbara', icon: '🐖', price: 3, rarity: 'common', target: null,
    desc: 'Anında +12 coin.' },
  /* USTURA KALDIRILDI (kullanıcı kararı 2026-09-08). Kart bir taşın
     destedeki HER kopyasını siliyordu; hedef ELDEYSE oradaki kopyaları da
     götürüyor ama açıklaması yalnız "destedeki" diyordu. Oyuncu elindeki
     iki Siyah 13'ten birine ustura vurup ikisini birden kaybediyor ve bunu
     "taşım sebepsiz kayboldu" diye okuyordu (Playtest 25). Mesaj/defter
     tarafı düzeltilmişti; kullanıcı yine de kartın tümden çıkarılmasını
     seçti. Deste inceltme rolü tek kopya silen karta kaldı — o kart
     Playtest 26'da (2026-09-09) "Ustura" ADINI devraldı, ama efekti
     kendi efektidir: TEK taş siler, tüm kopyaları DEĞİL.
     Eski kayıtlarda kalan 'ustura' anahtarını restore() zaten düşürür. */
  /* YENİ (Grup D) — "enhancement" ailesinin ucuz basamağı: normal bir taşı
     kalıcı olarak Gümüş Taş'a çevirir (özel taş havuzuyla köprü). */
  gumusVernik: { key: 'gumusVernik', name: 'Gümüş Vernik', icon: '🥈', price: 7, rarity: 'common', target: 'tile',
    desc: 'Bir taş seç: kalıcı Gümüş Taş olur (açılımda +5 coin).' },   // P42: GUMUS_TASI_COIN (sabit burada henüz tanımlı değil)
  /* RARE — kalıcı küçük güçler */
  kopyaci: { key: 'kopyaci', name: 'Kopya Mürekkebi', icon: '🖋', price: 8, rarity: 'rare', target: 'tile',
    desc: 'Bir taş seç: kopyası desteye kalıcı eklenir.' },
  /* Grup D: +2 → +3 raund. 9 coin, bir Rare jokerin fiyatına yakın; iki
     raund uzatma o jokeri satın almanın yarısı kadar bile değer taşımıyordu. */
  zamanKumu: { key: 'zamanKumu', name: 'Zaman Kumu', icon: '⏳', price: 9, rarity: 'rare', target: 'joker',
    desc: 'Bir jokerini seç: +3 raund daha yaşar.' },
  /* Grup D: 0.2x → 0.3x. 1.0x ≈ 50 puan bütçesiyle 10 coinlik kalıcı bir
     karta 0.2x (≈10 puan/açılım) fazlasıyla sönüktü. */
  yildizTozu: { key: 'yildizTozu', name: 'Yıldız Tozu', icon: '✨', price: 10, rarity: 'rare', target: null,
    desc: 'Tüm açılımlara kalıcı +0.3x.' },
  /* Grup D: %3 → %6. Eski hâli oyun boyunca fark edilmiyordu (işlek zaten
     %20-35 bandında); artık bir Nazar Boncuğu yükseltmesine yaklaşıyor. */
  muska: { key: 'muska', name: 'Muska', icon: '🧿', price: 8, rarity: 'rare', target: null,
    desc: 'İşlek riski kalıcı %6 düşer.' },
  /* YENİ (Grup D) — enhancement ailesinin orta basamağı: taş → Altın Taş.
     PLAYTEST 28 · GRUP C — adı "Simya Şişesi" iken "ALTIN VERNİK" oldu
     (kullanıcı kararı 2026-09-10). EFEKT DEĞİŞMEDİ. Gerekçe: kart
     Gümüş Vernik'in bir üst basamağıdır, ikisi aynı aileden okunmalı;
     "simya" adı ise oyunun hiçbir yerinde karşılığı olmayan ayrı bir
     tema açıyordu. ANAHTAR `simyaSisesi` OLARAK KALIR — kayıtlar
     değnekleri anahtarla saklar (Ustura/`zimpara` ile aynı gerekçe). */
  simyaSisesi: { key: 'simyaSisesi', name: 'Altın Vernik', icon: '⚗', price: 10, rarity: 'rare', target: 'tile',
    desc: 'Bir taş seç: kalıcı Altın Taş olur (açılımda +60 puan).' },
  /* YENİ (Grup D) — envanterin kendisini büyüten meta kart.
     PLAYTEST 28 · GRUP D — adı "Heybe" iken "AMBAR" oldu (kullanıcı kararı
     2026-09-10). EFEKT DEĞİŞMEDİ. Gerekçe: kart taşımayı değil KAPASİTEYİ
     büyütür, "ambar" bunu doğrudan söyler. "Kemer/kuşak" ailesine
     gidilemezdi — `genisKemer` YÜKSELTMESİ zaten aynı işi yapıyor ve iki
     kart aynı adı çağrıştırırsa hangisinin ne olduğu okunmaz.
     ANAHTAR `heybe` OLARAK KALIR (kayıt uyumu). */
  /* P33 · Grup C (kullanıcı kararı 2026-09-13) — "Ambar" → "KESE" (EN "Pouch"):
     ad iki dilde de aynı nesneyi söylemeli. EFEKT ve ANAHTAR değişmedi. */
  heybe: { key: 'heybe', name: 'Kese', icon: '🎒', price: 11, rarity: 'rare', target: null,
    desc: 'Değnek envanterin kalıcı +1 slot büyür.' },   /* Grup M: tavan metni kaldırıldı — sayaç UI'da */
  /* PLAYTEST 28 · GRUP H — 20. DEĞNEK (kullanıcı kararı 2026-09-10).
     Kadro 2026-09-08'de eski Ustura kaldırılınca 20 → 19'a inmişti ve yeri
     boş kalmıştı; Mıknatıs o yeri dolduruyor.
     YENİ EKSEN — DESTE TUTARLILIĞI. Bütün değnekler desteye bir şey EKLİYOR
     ya da bir taşı GÜÇLENDİRİYOR, ama o taşı bir daha görüp görmeyeceğin
     kuraya kalmıştı: 94 taşlık destede belirli bir taşın açılış eline gelme
     ihtimali ~%16. Mıknatıs onu %100 yapar.
     Kartın asıl tasarım fikri TEK BAŞINA HİÇBİR ŞEY YAPMAMASIDIR: sıradan
     bir Sarı 7'yi mıknatıslamak hiçbir şey kazandırmaz. Değeri, o taşa daha
     önce ne yatırdığına bağlıdır — yani Altın Vernik'i, Taç Giydirme'yi,
     Okey Mührü'nü ve özel taşları HEPSİNİ BİRDEN daha iyi yapar. Kadroda
     "kendi başına güçlü" kart çoktu, "senin kurduğunu garantileyen" kart
     yoktu.
     Rare: garantili tekrar common bandının üstünde bir güç. */
  miknatis: { key: 'miknatis', name: 'Mıknatıs', icon: '🧲', price: 10, rarity: 'rare', target: 'tile',
    desc: 'Bir taş seç: her raundun başlangıç elinde garanti gelir.' },
  /* LEGENDARY — run bükücüler */
  okeyMuhru: { key: 'okeyMuhru', name: 'Okey Mührü', icon: '🃏', price: 14, rarity: 'legendary', target: null,
    desc: 'Desteye kalıcı bir okey eklenir. Her stage o stage’in okeyine dönüşür.' },
  tac: { key: 'tac', name: 'Taç Giydirme', icon: '👑', price: 13, rarity: 'legendary', target: 'tile',
    desc: 'Bir taş seç: değeri kalıcı 13 olur.' },
  /* PLAYTEST 18 · GRUP B — ALTIN ORAN BUG'I DÜZELTİLDİ.
     KÖK NEDEN: "kalıcı +1 basamak" `s.carpanStep` ile ÇARPAN TABLOSUNUN
     İNDEKSİNİ kaydırıyordu (getCarpan → CARPAN_TABLE[idx+1]). Tablo adımları
     yalnız 0.3–0.6 aralığında olduğu için 16 coinlik bir LEGENDARY gerçekte
     ~+0.3x veriyordu; üstelik indeks 7'de tavana vurduğu için çok
     kombinasyonlu turlarda etkisi TAM SIFIRDI. Oyuncunun ekranda gördüğü
     "Kalıcı Çarpan" ise hiç değişmiyordu (o `permMult`).
     DÜZELTME (kullanıcı kararı): artık gerçek bir TAM SAYI eklemesi yapılır —
     kalıcı çarpana +1.0x (7.3 → 8.3). Ondalık kısma dokunulmaz.
     `carpanStep` state'te KALDI: eski kayıtlarda Usta Eli'nden birikmiş
     basamaklar orada duruyor (bkz. loadState göçü), onlar geri alınmaz.
     Tavan (run başına 2 kullanım) artık `altinOranCount` ile sayılır. */
  /* PLAYTEST 28 · GRUP E — adı "Altın Oran" iken "KALDIRAÇ" oldu
     (kullanıcı kararı 2026-09-10). EFEKT DEĞİŞMEDİ. Üç gerekçe:
       · "altın oran" bir ORANTIDIR (1.618…); kart ise düz bir toplama
         yapar (kalıcı çarpan +1.0x). Adın vaat ettiği matematik yok.
       · Aynı efektin yükseltme sürümünün adı zaten "Kalıcı Çarpan" —
         oyun bu efekti başka her yerde düpedüz adıyla anıyordu.
       · "Altın" öneki doldu: Altın Taş · Altın Damar · Altın Vernik
         (Grup C). Dördüncüsü ayırt ediciliği bitiriyordu.
     `ALTIN_ORAN_GAIN` sabitinin ADI DEĞİŞMEDİ: motor sabitleri kayıt ya da
     test dosyalarında geçmez ama gereksiz gürültü de yapmaz — sabit tek
     yerde tanımlı ve yorumu buraya bağlı.
     ANAHTAR `altinOran` OLARAK KALIR (kayıt uyumu). */
  /* P33 · Grup C (kullanıcı kararı 2026-09-13) — "Kaldıraç" → "KIVILCIM"
     (EN "Spark"): ad iki dilde de anlamlı olmalı. EFEKT ve ANAHTAR değişmedi. */
  altinOran: { key: 'altinOran', name: 'Kıvılcım', icon: '📐', price: 16, rarity: 'legendary', target: null,
    desc: 'Kalıcı çarpanın +1.0x artar. Kullanım sınırı yok.' },
  /* Grup D'de eklendi, PLAYTEST 9 · GRUP L'de yeniden tasarlandı:
     artık store rafı değil ANA SLOT kapasitesi veriyor, bu yüzden
     Legendary → MYTHIC (listede yeri değişmedi, kayıt uyumu için). */
  tacirMektubu: { key: 'tacirMektubu', name: 'Tacir Mektubu', icon: '📜', price: 26, rarity: 'mythic', target: null,
    desc: 'Ana joker slotun kalıcı olarak 6 olur. Run başına bir kez.' },
  /* GRUP N (Playtest 7) — Bal Küpü buff'landı. Eski hâli (+1 coin/raund)
     12 coinlik bir LEGENDARY için fazlasıyla zayıftı: kendi maliyetini
     ancak ~12 raundda çıkarıyordu ve Okey Mührü gibi run-bükücü kardeşinin
     yanında görünmez kalıyordu. Yeni hâli hem anında geri ödeme yapar
     (peteği kır: +10 coin) hem de kalıcı gelirini üçe katlar. */
  balKupu: { key: 'balKupu', name: 'Bal Küpü', icon: '🍯', price: 12, rarity: 'legendary', target: null,
    desc: 'Anında +10 coin. Sonra her raund sonunda +3 coin.' },
  /* MYTHIC — tek büyük vuruş */
  /* PLAYTEST 28 · GRUP F — ESKİ "NEFES İKSİRİ" TAMAMEN KALDIRILDI, YERİNE
     "FERMAN" GELDİ (kullanıcı kararı 2026-09-10).
     KÖK NEDEN (ölçüm değil, kart okuması): eski kart "her raunda kalıcı
     +1 tur ve her tur +1 fazla taş" veriyordu — bu, İKİ MEVCUT
     YÜKSELTMENİN toplamıdır: `uzunSoluk` ("Her raunda kalıcı +1 tur") +
     `derinNefes` ("Her tur kalıcı +1 fazla taş"). 20 coinlik bir MYTHIC
     hiçbir yeni eksen açmadan iki yükseltmeyi tekrar ediyordu; oyuncunun
     "hiç ihtiyaç duymadım" demesinin sebebi buydu.
     YENİ EKSEN — BOSS. Oyunda 20 boss var ve oyuncunun onlara karşı TEK
     bir kartı yoktu; yalnız dayanıyordu. Ferman bu boşluğu doldurur.
     ANAHTAR YENİ (`ferman`), eski `nefesIksiri` anahtarı SİLİNDİ: kart
     yeniden adlandırılmadı, DEĞİŞTİRİLDİ (P27'deki "Temiz Açılım →
     İki Yüzlü" ile aynı durum). Eski kayıtlarda kalan `nefesIksiri`
     anahtarını restore() zaten düşürür. Ayrıca ad artık `altinCanak`'ın
     (Grup G) üstünde; iki kartın aynı anahtarla anılması okunmazdı. */
  ferman: { key: 'ferman', name: 'Ferman', icon: '🪶', price: 20, rarity: 'mythic', target: null,
    desc: 'Sıradaki boss raundunun koşulu tamamen iptal olur. Run başına 2 kez.' },
  /* YENİ (Grup D) — bir slot jokerini kalan süresiyle birlikte KOPYALAR.
     Füzyon'un aynası: Füzyon iki jokeri bir slota sıkıştırır, Klon Şişesi
     bir jokeri iki slota yayar. */
  klonSisesi: { key: 'klonSisesi', name: 'Klon Şişesi', icon: '🧬', price: 22, rarity: 'mythic', target: 'joker',
    desc: 'Bir slot jokerini seç: kalan süresiyle birlikte kopyası eklenir.' },
  /* YENİ (Grup D) — tek kalıcı "hedef" eksenli kart. Puanı büyütmek yerine
     çıtayı indirir; geç stage'lerde puan eksenindeki tavana çarpan
     build'lerin tek çıkış kapısıdır. */
  /* PLAYTEST 28 · GRUP G — adı "Altın Çanak" iken "NEFES İKSİRİ" oldu
     (kullanıcı kararı 2026-09-10). EFEKT DEĞİŞMEDİ. Gerekçe: kart
     zorluğu hafifletir (hedefler düşer), yani "rahat nefes aldırır";
     "altın çanak" adı ödül/ganimet çağrıştırıyordu.
     ANAHTAR `altinCanak` OLARAK KALIR (kayıt uyumu).
     ⚠ ADIN ESKİ SAHİBİ: bu ad Playtest 28'e kadar `nefesIksiri`
     anahtarlı MYTHIC kartın adıydı; o kart Grup F'te yeniden
     tasarlanıp YENİ BİR AD alacak. İki kart aynı adı taşıdığı
     ara durum GRUP F TAMAMLANINCA kapanır. */
  /* P38 (kullanıcı kararı 2026-09-14) — ad "Nefes İksiri" → "DERİN NEFES"
     (EN "Deep Breath"). Ad çakışmasın diye +1 çekiş YÜKSELTMESİ "Derin
     Nefes" → "Bol Çekiş" oldu. ANAHTARLAR (altinCanak / cekis) DEĞİŞMEDİ. */
  altinCanak: { key: 'altinCanak', name: 'Derin Nefes', icon: '🏆', price: 22, rarity: 'mythic', target: null,
    desc: 'Run’ın kalanında tüm hedefler kalıcı %10 düşer.' },
};

/* ---------- Özel Normal Taşlar (GDD 6.5c) ----------
   Store'dan alınır, desteye KALICI eklenir (her raund yeniden karışır).
   Satın alınırken rastgele sayı+renk atanır. Aynı taştan en fazla 2. */
/* PLAYTEST 17 · GRUP G/25 — ÖZEL TAŞ BULUNMA SINIRI 2 → 4
   (kullanıcı 4 önerdi, denge incelemesi 4'ü doğruladı — gerekçe:)
     · Özel taş bir JOKER DEĞİL, sıradan bir deste taşıdır: rengi ve sayısı
       normal taş gibi çalışır, yani kopya sayısını artırmak açılım
       olasılıklarını BOZMAZ, yalnız bonusun görülme sıklığını artırır.
     · Asıl fren fiyattır: her kopya tam fiyatına yeniden alınır (6-15 coin).
       4 Ateş Taşı 44 coin eder — iki Legendary jokerden pahalı. Yani sınır,
       gerçekten yatırım yapan oyuncunun tavanını belirler.
     · 15 taşlık elde bir raundda EN AZ bir kopya görme ihtimali:
       2 kopya ≈ %26 · 3 ≈ %36 · 4 ≈ %45 · 5 ≈ %52.
       2'de taş satın alınıp raundlarca hiç görülmüyordu ("aldım ama yok"
       hissi); 4'te yatırım çoğu raundda karşılık buluyor, 5'te ise deste
       gereğinden fazla şişip (10 tür × 5 = 50 ek taş) tur döngüsü yavaşlıyor.
     · `IS_BASE_TILE` özel taşları kapsam dışı bıraktığı için "2 kopya"
       bütünlük kuralıyla çakışma yok. */
/* PLAYTEST 20 · GRUP P (kullanıcı kararı 2026-08-30) — 4 → 5.
   Aynı özel taştan desteye kaç kopya girebileceğinin tavanı. */
const SPECIAL_MAX_COPIES = 5;

/* PLAYTEST 22 · GRUP F — KARA DELİK TAŞI (eski Çelik Taş) YOĞUNLAŞMASI.
   Taban düşük, tavan yüksek: taş satın alındığı anda havuzun en zayıf
   puan kartıdır (+25, Altın'ın +60'ına karşı), ama her kullanımda kalıcı
   +20 kazanır. Tavana (+185) ulaşmak 8 kullanım ister; taş desteye
   karıştığı için raund başına ~%15-25 ihtimalle ele gelir, yani tavan
   ancak ERKEN alınmış ve run boyunca beslenmiş bir taşta görülür.
   Böylece kart, geç oyunda alındığında bilinçli olarak zayıf kalır —
   fiyatının (9 coin) düşük tutulmasının sebebi de budur. */
/* GRUP H — Kuzey Yıldızı: açılımda kaç taş gösterilir (biri seçilir). */
const YILDIZ_SHOW = 3;

/* P42 (kullanıcı kararı 2026-09-14) — özel taş güç turu: Kara Delik 25/20/185
   → 80/25/300, Gümüş +1 → +5 coin, Bakır +0.3x → +0.5x, Zümrüt +0.8x → +1.5x,
   Ayna en yüksek taşı 2 kez → 3 kez sayar. */
const KD_TASI_BASE = 80;    // açılımda taban puan
const KD_TASI_STEP = 25;    // her kullanımda kalıcı artış
const KD_TASI_MAX  = 300;   // tek taşın ulaşabileceği tavan (9. kullanımda kırpılır)
const GUMUS_TASI_COIN = 5;     // kullanılan her Gümüş Taş → raund sonu coin
const BAKIR_TASI_MULT = 0.5;
const ZUMRUT_TASI_MULT = 1.5;
const AYNA_TASI_TIMES = 3;     // kombinasyonun en yüksek taşı toplam kaç kez sayılır

/* GRUP G (kullanıcı kararı 2026-09-07) — ÖZEL TAŞ NADİRLİĞİ.
   Özel taşlar bugüne kadar store rafından TEK TEK satılıyordu; artık
   yalnız "2'li Özel Taş Paketi"nden çıkıyorlar, yani paketin içinden ne
   çıkacağını belirleyen bir NADİRLİK eksenine ihtiyaç var.
   Kademeler, havuzun zaten var olan güç/fiyat ekseninden türetildi
   (fiyat = tasarımın kendi güç ölçüsü):
     common    (6-8)   bakır, gümüş
     rare      (9-10)  kara delik, su, zaman
     epic      (11-12) ateş, altın, yıldız
     legendary (13-15) ayna, zümrüt
   ⚠ JOKER NADİRLİĞİNDEN FARKLI ÇALIŞIR (kullanıcı vurgusu): joker
   eğrisi stage'e bağlıdır ve erken stage'de Legendary/Mythic'i fiilen
   kapatır. Burada STAGE KAPISI YOKTUR — Stage 1'de bile her kademe
   çıkabilir, yalnız yukarı çıktıkça seyrekleşir. */
const SPECIAL_RARITY_W = { common: 38, rare: 30, epic: 21, legendary: 11 };

const SPECIAL_TILES = {
  /* ikon 🥇 (🪙 değil): coin para birimi ikonuyla karışmasın diye */
  altin: { key: 'altin', name: 'Altın Taş', icon: '🥇', price: 12, rarity: 'epic', maxCopies: SPECIAL_MAX_COPIES,
    desc: 'Destene kalıcı girer. Açılımda +60 puan.' },
  gumus: { key: 'gumus', name: 'Gümüş Taş', icon: '🥈', price: 8, rarity: 'common', maxCopies: SPECIAL_MAX_COPIES,
    desc: `Destene kalıcı girer. Açılımda kullanınca raund sonunda +${GUMUS_TASI_COIN} coin.` },
  yankiTasi: { key: 'yankiTasi', name: 'Su Taşı', icon: '💧', price: 10, rarity: 'rare', maxCopies: SPECIAL_MAX_COPIES,
    desc: 'Destene kalıcı girer. Girdiği kombinasyonda rengi umursanmaz; sayısı aynen geçerlidir.' },

  /* ===== PLAYTEST 8 — GRUP E: havuz 3 → 10 =====
     Tasarım kuralı: özel taş bir JOKER DEĞİLDİR (Kıyamet/jokersDisabled
     onu susturmaz) ve desteye karıştığı için raund başına ~%15-25
     ihtimalle eline gelir. Bu yüzden etkileri "geldiğinde hissedilen" tek
     seferlik vuruşlardır; kalıcı pasif güç joker tarafının işidir.
     Üç eksen: PUAN (altın/çelik), ÇARPAN (bakır/zümrüt/ayna), KAYNAK
     (gümüş/yıldız/zaman) — ateş ise risk/ödül. */
  bakir: { key: 'bakir', name: 'Bakır Taş', icon: '🟤', price: 6, rarity: 'common', maxCopies: SPECIAL_MAX_COPIES,
    desc: `Destene kalıcı girer. Açılımda +${BAKIR_TASI_MULT.toFixed(1)}x.` },
  zumrut: { key: 'zumrut', name: 'Zümrüt Taş', icon: '💚', price: 15, rarity: 'legendary', maxCopies: SPECIAL_MAX_COPIES,
    desc: `Destene kalıcı girer. Açılımda +${ZUMRUT_TASI_MULT.toFixed(1)}x.` },
  /* PLAYTEST 22 · GRUP F (kullanıcı kararı 2026-09-06) — "Çelik Taş"
     KARA DELİK TAŞI oldu. Eski hâli düz +25 puandı: havuzun en ucuz ve en
     olaysız kartı, alındığı andan run sonuna kadar aynı sayıyı veriyordu.
     Yeni tema YOĞUNLAŞMA: taş her açılımda kullanıldıkça içine düşenle
     ağırlaşır, kalıcı olarak büyür. Bu, özel taş havuzunda başka hiçbir
     kartta olmayan bir eksen — "erken al, run boyunca besle" kararı.
     ⚠ Mythic VOID JOKERİYLE KARIŞTIRILMAMALI: o joker raund başında
     ELİN YARISINI yutup taş başına kalıcı ÇARPAN verir, tek kullanımlıktır
     ve bir slot işgal eder. Bu ise bir DESTE TAŞIDIR, joker değildir
     (Kıyamet onu susturmaz), yuttuğu şey elin değil kendi geçmişidir ve
     PUAN ekseninde çalışır. Ortak olan yalnız temadır. */
  karaDelikTasi: { key: 'karaDelikTasi', name: 'Kara Delik Taşı', icon: '🕳', price: 9, rarity: 'rare', maxCopies: SPECIAL_MAX_COPIES,
    desc: `Destene kalıcı girer. Açılımda +${KD_TASI_BASE} puan — her kullanımda kalıcı +${KD_TASI_STEP} yoğunlaşır (en çok +${KD_TASI_MAX}). Atarsan işlek işlemez.` },
  aynaTasi: { key: 'aynaTasi', name: 'Ayna Taşı', icon: '🪞', price: 13, rarity: 'legendary', maxCopies: SPECIAL_MAX_COPIES,
    desc: `Destene kalıcı girer. Girdiği kombinasyonun en yüksek taşı ${AYNA_TASI_TIMES} kat puan sayılır.` },
  /* PLAYTEST 24 · GRUP H (kullanıcı seçimi 2026-09-06) — "KUZEY YILDIZI".
     Eski hâli açılımda +2 RASTGELE taş çektiriyordu; el zaten MAX_HAND'de
     tavanlı olduğu için çoğu raundda hiç hissedilmiyor ve kart bir KARAR
     üretmiyordu. Yeni hâli aynı eksende (kaynak) kalır ama iki rastgele
     taş yerine BİR SEÇİLMİŞ taş verir: yıldız yol gösterir. */
  yildizTasi: { key: 'yildizTasi', name: 'Yıldız Taşı', icon: '⭐', price: 12, rarity: 'epic', maxCopies: SPECIAL_MAX_COPIES,
    desc: `Destene kalıcı girer. Açılımda kullanınca desteden ${YILDIZ_SHOW} taş açılır, birini seçip elini alırsın.` },
  zamanTasi: { key: 'zamanTasi', name: 'Zaman Taşı', icon: '⏳', price: 10, rarity: 'rare', maxCopies: SPECIAL_MAX_COPIES,
    desc: 'Destene kalıcı girer. Açılımda kullanırsan bu raund jokerlerin yaşlanmaz.' },
  ates: { key: 'ates', name: 'Ateş Taşı', icon: '🔥', price: 11, rarity: 'epic', maxCopies: SPECIAL_MAX_COPIES,
    desc: 'Destene kalıcı girer. Açılımda +120 puan. Elinde beklerse her tur -15 puan yakar.' },
};

/* ---------- Gizli Paketler (booster pack) ----------
   Store'da beliren EKSTRA slot(lar); içerik satın alınana kadar gizlidir ve
   tek tek almaktan ucuzdur — karşılığında ne çıkacağı kumar.
   Grup D (Playtest 6): tek tür paket yerine ÜÇ tür var ve her biri store'da
   ayrı bir kartla, farklı ikon+renkle çıkar ki oyuncu paketi açmadan önce
   içinde ne olduğunu bilsin:
     special → Özel Normal Taş (Altın/Gümüş/Su)      🎁 altın
     consum  → Tüketilebilir (Tarot)                 🧪 mor
     joker   → Joker (epic hariç)                    🃏 mavi
   Aynı store'da en fazla PACK_MAX_SLOTS paket çıkar. Bir türün verecek
   içeriği kalmadıysa (örn. tüm özel taşlar 2/2) o tür hiç belirmez. */
/* ============================================================
   STORE RAF YAPISI (kullanıcı kararı 2026-09-04)
   Store iki raftan oluşur ve İKİSİNİN DE KESİN bir tavanı vardır:
     · JOKER RAFI      : 3 başlar, en çok 4 kart gösterir
     · DEĞNEK/PAKET RAFI: 3 başlar (1 değnek + 2 gizli paket),
                         en çok 5 kart gösterir (paket sayısı büyür)
       (GRUP G 2026-09-07: özel taş slotu kalktı, yeri pakete geçti)
   Tavan AŞILAMAZ: `shopJokerSlots()` / `shopExtraSlots()` her okumada
   kırpar, yani eski kayıtlardan gelen şişkin `extraShopSlots` değerleri
   bile 4'ün üstünde raf açamaz.
   Rafı büyüten TEK ödül Eskici Rafı'dır; önce joker rafını 4'e çıkarır,
   sonra değnek/paket rafını 5'e taşır, ikisi de dolunca ödül çarkının
   havuzundan tamamen düşer (bkz. _genUpgradeOffer). Böylece oyuncunun
   karşısına hiçbir zaman "hiçbir şey yapmayan" bir raf ödülü çıkmaz.
   ============================================================ */
const SHOP_JOKER_BASE  = 3;
const SHOP_JOKER_MAX   = 4;
const SHOP_EXTRA_BASE  = 3;
const SHOP_EXTRA_MAX   = 5;
/* GRUP G (2026-09-07): ikinci rafın SABİT kalemi artık yalnız DEĞNEK.
   Özel taş slotu kaldırıldı (taşlar yalnız 2'li paketten çıkıyor), boşalan
   yer paket slotuna geçti: taban 2 paket, tavan 4 — pratikte paket türü 3
   olduğu için üst sınır yine 3'tür. */
const SHOP_EXTRA_FIXED = 1;   // ikinci rafın sabit kalemi: değnek
/* PLAYTEST 25 · MADDE E9 (2026-09-09) — TAHVİL BU SAYIYA DAHİL DEĞİLDİR.
   Tahvil kartı `SHOP_EXTRA_FIXED`e eklenmek İSTENDİ, ama o sabit paket
   slotu hesabına da giriyor (`packSlots = shopExtraSlots - FIXED`) ve
   tabanı 2 paketten 1'e düşürüyordu — yani Tahvil, ödediği bedeli paket
   çeşitliliğinden çalıyordu. Bu istenmedi: Tahvil bir MENÜ KALEMİDİR,
   rastgele rafın parçası değil. Bu yüzden raf muhasebesinin dışında
   tutulur ve satırda fazladan bir kart olarak çizilir.
   Sonuç (tests/browser_p21.js ile ölçüldü): satır tabanda 4, tavanda 5
   kart gösterir, taşma/kaydırma YOK. `SHOP_EXTRA_MAX = 5` tavanı Eskici
   Rafı'nın büyütebileceği RASTGELE kısım için geçerliliğini korur. */
/* Gizli paket slotu ikinci rafın ARTAN kısmıdır: taban 1, tavan 3.
   (Üç paket türü vardır, yani 3 aynı zamanda doğal üst sınır.) */
const PACK_MAX_SLOTS = SHOP_EXTRA_MAX - SHOP_EXTRA_FIXED;
const PACK_SECOND_CHANCE = 0.55;   // pakette 2. içerik çıkma ihtimali (Grup K: 0.40 → 0.55)

/* GRUP K (Playtest 7) — GİZLİ PAKET RARITY EĞRİSİ
   Sorun: paketler normal store ile AYNI RARITY_CURVE'ü kullanıyordu, yani
   C1'de %74 Common. Paket açmak, store'dan kart çekmekle birebir aynı
   sonucu veriyor ve "gizli paket" vaadi boşa düşüyordu.
   Çözüm: paketlere kendi, belirgin biçimde daha CÖMERT eğrisi. Kabaca bir
   basamak yukarı kaydırılmış dağılım — Common azınlığa düşer, Rare omurga
   olur, Legendary erken stage'lerde bile gerçek bir ihtimaldir.
   Karşılığı fiyattır: paket, aynı parayla store'dan alınabilecek tek bir
   Common/Rare karta karşılık 1-2 kalem verir ve içeriği rastgeledir. */
const PACK_RARITY_CURVE = [
  /* PLAYTEST 22 · GRUP A — PAKETİN ERKEN LEGENDARY MUSLUĞU KAPATILDI.
     Sorun: C1'de paket Legendary+Mythic %15 veriyordu, store ise %2 —
     yani paket, stage eğrisinin bütün kıtlığını tek başına delen 7.5 katlık
     bir kaçamaktı. Paket store'dan CÖMERT kalmaya devam eder (C1'de %5'e
     karşı %1.3), ama artık açılışta Legendary dağıtmaz. C4+ DEĞİŞMEDİ: geç
     oyunda paketin cömertliği tasarımın kendisidir.
     (Not: C3 %19 → C4 %38 arasında bilinçli bir sıçrama var; kıtlık yalnız
     açılış bandını kapsasın diye C4 satırına dokunulmadı.) */
  { common: 0.52, rare: 0.430, legendary: 0.045, mythic: 0.005 }, // C1
  { common: 0.44, rare: 0.470, legendary: 0.080, mythic: 0.010 }, // C2
  { common: 0.34, rare: 0.470, legendary: 0.160, mythic: 0.030 }, // C3
  { common: 0.22, rare: 0.40, legendary: 0.28, mythic: 0.10 }, // C4
  { common: 0.18, rare: 0.37, legendary: 0.31, mythic: 0.14 }, // C5
  { common: 0.14, rare: 0.34, legendary: 0.34, mythic: 0.18 }, // C6
  { common: 0.11, rare: 0.31, legendary: 0.36, mythic: 0.22 }, // C7
  { common: 0.08, rare: 0.28, legendary: 0.38, mythic: 0.26 }, // C8+
];
/* PLAYTEST 8 — GRUP F: PAKET AÇILIŞ MEKANİĞİ
   Eskiden her paket içeriğini doğrudan cebe atıyordu; "aç ve gör" anı bir
   toast'tan ibaretti. Artık her paketin bir AÇILIŞ SAHNESİ var ve türü
   belirleyen tek kural şu:

     İçerik KALICI BİR BUILD KARARIYSA → SEÇİMLİ (3 seçenek, 1'ini al)
     İçerik ANLIK BİR ŞANS ÖDÜLÜYSE   → SLOT MAKİNESİ (çark döner)

   ⚠ PLAYTEST 9 · GRUP B — BU AYRIM KALDIRILDI (kullanıcı kararı):
   "Slot dönüp rastgele çıkartma" hissi paketin kimliği hâline geldi;
   iki farklı açılış ritüeli olması tutarsız duruyordu. ARTIK ÜÇ PAKET DE
   `mode: 'slot'`. Seçim (choice) yolu motorda ve UI'da DURUYOR ama hiçbir
   tanım onu göstermiyor — eski kayıtlarda bekleyen bir seçim kalmış
   olabilir (`pack.pending`), o yüzden silinmedi.
   Ödül sayısı türe göre ayrıldı (`second`): özel taş ve tüketilebilir
   paketleri PACK_SECOND_CHANCE ile 2 ödül verebilir, JOKER paketi ASLA —
   12 coine iki joker, 22-35 coinlik store fiyatlarının yanında kırıcıydı;
   joker paketinin cömertliği zaten PACK_RARITY_CURVE'den geliyor.        */
const PACK_CHOICES = 3;        // (eski seçimli akış — artık kullanılmıyor)
const PACK_REEL_LEN = 14;      // slot çarkındaki sembol sayısı (son sembol = kazanan)
const PACK_DEFS = {
  /* GRUP G (2026-09-07): 1'li sürümü YOKTUR — bu paket her zaman TAM 2
     farklı özel taş verir (`count: 2`). Fiyat 8 -> 14: eskiden %55
     ihtimalle 2, %45 ihtimalle 1 taş veriyordu (beklenen 1.55 taş);
     artık garanti 2. Havuzun ortalama taş fiyatı 10.6, yani iki taşın
     raf değeri ~21 — paket hâlâ belirgin biçimde ucuz, ama 8 coine
     garanti iki kalıcı deste taşı basan bir çeşme değil. */
  special: { kind: 'special', chance: 0.30, price: 14, icon: '🎁', tone: 'gold',   mode: 'slot', count: 2 },
  consum:  { kind: 'consum',  chance: 0.26, price: 9,  icon: '🧪', tone: 'violet', mode: 'slot', second: true },
  joker:   { kind: 'joker',   chance: 0.22, price: 12, icon: '🃏', tone: 'azure',  mode: 'slot', second: false },
};
/* PLAYTEST 20 · GRUP N (kullanıcı raporu: "Stage 6+ store'da değnek ve paket
   ya hiç yok ya çok nadir") — KÖK NEDEN İKİ KATMANLIYDI:

   1) ASIL NEDEN — `_packHasRoom` DOLU ENVANTERDE PAKETİ HİÇ ÜRETMİYORDU.
      Ölçüm (300 store, gerçekçi geç oyun durumu: değnek envanteri 3/3, ana
      slot 5/5, backup 2/2):
          Tüketilebilir paketi:   0/300
          Joker paketi:           0/300
          Toplam paket:        0.29/store
      Geç oyunda envanter ZATEN hep doludur, yani bu iki paket türü Stage
      4'ten sonra oyundan fiilen siliniyordu. Rarity ağırlıklarıyla hiç
      ilgisi yoktu — eğri doğru ölçekleniyor, paket üretilmeden eleniyordu.
      ÇÖZÜM: doluluk artık paketi ENGELLEMEZ. Yer yoksa ödül COIN'e çevrilir
      (aşağıda `_packFallbackCoins`) — ödül hiçbir koşulda kaybolmaz, ama
      dönüşüm SATIŞ değeriyle (yaklaşık yarı fiyat) yapılır ki paket bir
      coin basma makinesine dönüşmesin.

   2) İKİNCİL — çıkış oranları sabitti. Store geç oyunda run'ın tek güç
      kaynağıdır; oranlar stage ile birlikte hafifçe yükselir.            */
const PACK_STAGE_BONUS = 0.04;   // stage başına ek çıkış ihtimali
const PACK_STAGE_CAP = 0.20;     // en çok bu kadar eklenir
/* eski tek-paket kodu için geriye dönük sabitler (kayıt uyumu) */
const PACK_CHANCE = PACK_DEFS.special.chance;
const PACK_PRICE = PACK_DEFS.special.price;

/* ---------- Joker tanımları ----------
   effect(ctx) → {mult, flat} | null (genel açılım efekti)
   Özel anahtarlar motorda ayrıca işlenir. */

const JOKER_DEFS = {
  /* ===== COMMON (20) =====
     Güç bütçesi v5 (kullanıcı kararları 2026-09-10). Havuz hem BUDANDI
     hem YUKARI çekildi: 30 karttan 10'u kaldırıldı ve kalanların tamamı
     yeni banda oturtuldu. Kaldırılanların ortak kusuru ya bir kopyanın
     zayıf hâli olmalarıydı (İkiz Altın/Grup Zaferi/Sıra Akışı, aynı
     koşula çarpan veren İkizler/Takım/Koşucu'nun flat ikizleri) ya da
     oyuncuya karar verdirmemeleriydi (13/1 Fetişi, Renkli Dünya, Taş
     Biriktirici, Sıra Koşucusu, Sade Ustası, Atık Avcısı).
       koşulsuz 1.5x · kolay koşul 2.0x · orta 2.5x · zor 3.0x ·
       çok zor (aynı turda 3 aynı tür) 3.5x
     Flat aile: her Çift +80 · zor koşul +150 (1.0x ≈ 50 puan).
     ⚠ Silinen anahtarlar eski kayıtlarda kalabilir; restore() onları
     düşürür (bkz. "Silinen joker göçü"). */
  bereket: { key: 'bereket', name: 'Bereket Taşı', rarity: 'common',
    desc: 'Her açılıma +1.5x.', effect: () => ({ mult: 1.5, flat: 0 }) },
  kosucu: { key: 'kosucu', name: 'Koşucu', rarity: 'common',
    desc: 'Sıralı açarsan +2.0x.',
    effect: (c) => c.hasSirali ? { mult: 2.0, flat: 0 } : null },
  ikizler: { key: 'ikizler', name: 'İkizler', rarity: 'common',
    desc: 'Çift açarsan +2.0x.',
    effect: (c) => c.hasCift ? { mult: 2.0, flat: 0 } : null },
  takim: { key: 'takim', name: 'Takım Oyunu', rarity: 'common',
    desc: 'Per açarsan +2.0x.',
    effect: (c) => c.hasPer ? { mult: 2.0, flat: 0 } : null },
  uzunKosu: { key: 'uzunKosu', name: 'Uzun Koşu', rarity: 'common',
    desc: 'Bir turda 3 Sıralı açarsan +3.5x.',
    effect: (c) => c.siraliCount >= 3 ? { mult: 3.5, flat: 0 } : null },
  ciftFirtina: { key: 'ciftFirtina', name: 'Çift Fırtına', rarity: 'common',
    desc: 'Bir turda 3 Çift açarsan +3.5x.',
    effect: (c) => c.ciftCount >= 3 ? { mult: 3.5, flat: 0 } : null },
  /* Grup D/15 (2026-08-28): ad "Kalabalık Per" → "Aile" (EN: Family). Efekt aynı. */
  kalabalikPer: { key: 'kalabalikPer', name: 'Aile', rarity: 'common',
    desc: 'Bir turda 3 Per açarsan +3.5x.',
    effect: (c) => c.perCount >= 3 ? { mult: 3.5, flat: 0 } : null },
  /* PLAYTEST 17 · GRUP E/18 — YENİDEN TASARLANDI (kullanıcı onayı 2026-08-28).
     ESKİ HÂLİ ANLAMSIZDI VE BİR KOPYAYDI: `isSirali` zaten "renkli taşların
     hepsi aynı renk olmalı" diyor, yani HER Sıralı tanımı gereği tek
     renklidir; `isPer` ise farklı renk zorunlu kıldığı için bir Per ASLA
     tek renkli olamaz. Dolayısıyla "tek renkli Per/Sıralı açarsan +1.2x"
     pratikte "Sıralı açarsan +1.2x" demekti — aynı nadirlikteki KOŞUCU
     kartının birebir aynısı.
     YENİ HÂLİ dört renk eksenini kullanır: tek renk ekseninin (Tek Renk
     Ruhu) tam karşısında durur ve gerçek bir dizilim kararı üretir.
     (2026-09-10: aradaki üçüncü basamak Renkli Dünya havuzdan çıkarıldı;
     eksen artık iki uçlu — hepsi tek renk ya da dört rengin hepsi.) */
  renkUstasi: { key: 'renkUstasi', name: 'Renk Ustası', rarity: 'common',
    desc: 'Açılımında dört rengin hepsi varsa +2.0x.',
    effect: (c) => {
      const seen = new Set(c.tiles.filter(t => !t.jokerTile && t.color).map(t => t.color));
      return seen.size >= COLORS.length ? { mult: 2.0, flat: 0 } : null;
    } },
  sayiTapinagi: { key: 'sayiTapinagi', name: 'Sayı Tapınağı', rarity: 'common',
    desc: 'Aynı turda hem Per hem Sıralı açarsan +2.0x.',
    effect: (c) => (c.hasPer && c.hasSirali) ? { mult: 2.0, flat: 0 } : null },
  doluEl: { key: 'doluEl', name: 'Dolu El', rarity: 'common',
    desc: 'Açılımdan sonra elinde 10+ taş kalırsa +2.5x.',
    effect: (c) => c.handAfter >= 10 ? { mult: 2.5, flat: 0 } : null },
  bosCep: { key: 'bosCep', name: 'Boş Cep', rarity: 'common',
    desc: 'Açılımdan sonra elinde en fazla 7 taş kalırsa +150 puan.',
    effect: (c) => c.handAfter <= 7 ? { mult: 0, flat: 150 } : null },
  /* 2026-09-10: eşikler 5→7 ve 9→8 çekildi, böylece ikisi 1–13 bandını
     tam ortadan ikiye böler — bir açılım ikisinden BİRİNİ mutlaka
     karşılar, ama asla ikisini birden. Karar "hangi yarıya oynuyorum"a
     indi; bant genişlediği için ödül de 2.2x → 3.0x. */
  kucukTas: { key: 'kucukTas', name: 'Küçük Taş Sevgisi', rarity: 'common',
    desc: 'Açılımdaki tüm taşlar 7 ve altıysa +3.0x.',
    effect: (c) => c.vals.length && c.vals.every(v => v <= 7) ? { mult: 3.0, flat: 0 } : null },
  buyukTas: { key: 'buyukTas', name: 'Büyük Taş Gücü', rarity: 'common',
    desc: 'Açılımdaki tüm taşlar 8 ve üstüyse +3.0x.',
    effect: (c) => c.vals.length && c.vals.every(v => v >= 8) ? { mult: 3.0, flat: 0 } : null },
  /* 2026-09-10 — "Temiz Açılım" (okey KULLANMADAN açarsan) yerini İKİ
     YÜZLÜ aldı (kullanıcı kararı). Eskisi ödülü yokluğa bağlıyordu:
     oyuncu zaten okeyi elinde tutmayı seçtiği için karar üretmiyordu.
     Yenisi iki fiziksel taşı BİR ARADA oynamayı ister — asıl okey ve
     onun sahtesi aynı yüzü taşır (bkz. _setupRound), yani ikisi tek bir
     Çift/Per içinde buluşabilir; oyuncu okeyi wild olarak harcamak yerine
     yüzüyle oynamayı seçer. Ölçü TAŞIN VARLIĞIDIR, wild ikamesi değil:
     okey GDD 2.9 gereği kendisi olarak da oynanabilir ve o da "okeyi
     kullanmak"tır (`ctx.usedOkey` yalnız ikameyi görür, yetmezdi).
     Anahtar YENİ (`ikiYuzlu`): ad da efekt de tümden değişti, İşlemeci
     emsali — eski `temizAcilim` kaydı restore()'da düşer. */
  /* PLAYTEST 29 · GRUP G — ANARŞİST ile TAKAS (kullanıcı kararı
     2026-09-12): İki Yüzlü Common'dan RARE'e çıktı, bonus 3.0x → 3.5x.
     Koşul DEĞİŞMEDİ. Rare'e taşınmasının gerekçesi zaten yukarıda yazılı:
     iki fiziksel taşın (asıl okey + sahtesi) AYNI açılımda buluşmasını
     ister ve bu Common bandının en zor koşulu — üstelik oyuncuyu okeyi
     wild olarak harcamaktan vazgeçirdiği için gerçek bir bedeli var.
     Kart artık RARE bloğunda duruyor. */
  tekRenkRuhu: { key: 'tekRenkRuhu', name: 'Tek Renk Ruhu', rarity: 'common',
    desc: 'Açılımdaki tüm taşlar aynı renkse +2.5x.',
    effect: (c) => new Set(c.tiles.map(t => t.color)).size === 1 ? { mult: 2.5, flat: 0 } : null },
  /* v3: 170 flat, zincirle (Rare) aynı davranışı ikinci kez ve rare
     üstü güçte ödüllendiriyordu — common flat ailesine çekildi.
     2026-09-10: açıklama "üst üste ikinci turda" yerine oyuncunun
     okuduğu koşulu söylüyor (üst üste İKİ TUR açılım), ödül 80 → 150. */
  seriAcici: { key: 'seriAcici', name: 'Seri Açıcı', rarity: 'common',
    desc: 'Üst üste iki tur açılım yaparsan +150 puan.',
    effect: (c) => c.consecMelds >= 2 ? { mult: 0, flat: 150 } : null },
  hizliTuketici: { key: 'hizliTuketici', name: 'Hızlı Tüketici', rarity: 'common',
    desc: 'Bir açılımda 5+ taş kullanırsan +2.0x.',
    effect: (c) => c.tiles.length >= 5 ? { mult: 2.0, flat: 0 } : null },
  /* Eşik 2 DAHİLDİR ve tetiklendiğinde AÇILAN TÜM Çiftler sayılır (ilk
     ikisi de): 2 Çift = 160, 3 Çift = 240 (2026-09-10: 40 → 80/Çift). */
  ciftVurus: { key: 'ciftVurus', name: 'Çift Vuruş', rarity: 'common',
    desc: 'Bir turda 2+ Çift açarsan her Çift +80 puan.',
    effect: (c) => c.ciftCount >= 2 ? { mult: 0, flat: 80 * c.ciftCount } : null },
  /* PLAYTEST 29 · GRUP A — ÇÖPÇÜ ile TAKAS EDİLDİ (kullanıcı kararı
     2026-09-12): Çöpçü Rare'den Common'a indi, Şanslı Yedili Common'dan
     Rare'e çıktı. Çöpçü artık aşağıdaki COMMON bloğunda. */
  copcu: { key: 'copcu', name: 'Çöpçü', rarity: 'common',
    desc: 'Attığın her 3 taş: +15 coin.' },
  /* GRUP E (Playtest 7) — "Tekrar Çek" (raundda 1 kez atılan son taşı geri
     al) yerini İşlemeci aldı. Eskisi işlevsizdi: bilerek attığın taşı geri
     almak nadiren işe yarıyordu. Yeni tasarım, oyunun en az kullanılan
     mekaniğini (işleme, GDD 3.7) destekleyen TEK joker — Common havuzunda
     bu eksene dokunan başka kart yok. Orta zorlukta koşul → 1.8x bandı. */
  islemeci: { key: 'islemeci', name: 'İşlemeci', rarity: 'common',
    desc: 'O turda işleme yaptıysan +2.0x.',
    effect: (c) => c.islemeTiles > 0 ? { mult: 2.0, flat: 0 } : null },

  anarsist: { key: 'anarsist', name: 'Anarşist', rarity: 'common',
    desc: 'Store fiyatları her açılışta %10-60 ucuzlar.' },

  /* ===== RARE (20) ===== */
  /* PLAYTEST 28 · GRUP B — "AYNA" YERİNİ "DAMGA"YA BIRAKTI (kullanıcı
     kararı 2026-09-10). Eski kart raundun İLK açılımına otomatik +%50
     bindiriyordu: oyuncunun verecek hiçbir kararı yoktu, kart kendi
     kendine harcanıyordu. Yeni kart aynı "raundda tek büyük vuruş"
     temasını korur ama ZAMANLAMAYI oyuncuya verir — açılımdan ÖNCE
     damgalarsan o açılımın puanı 2 katına çıkar, damgalamazsan hak
     raundun sonuna kadar cepte durur.
     ANAHTAR `ayna` OLARAK KALIR: kayıtlar jokeri anahtarla saklar,
     anahtarı değiştirmek eldeki kartı kayıp gösterirdi (Ustura/`zimpara`
     ile aynı gerekçe). İsim çakışması yok — "Ayna Kral" (boss), "Ayna
     Taşı" (özel taş) ve "Ayna Kırığı" (mythic joker) ayrı kartlardır ve
     bu ad artık yalnız onlara ait. */
  ayna: { key: 'ayna', name: 'Damga', rarity: 'rare', uses: 4,
    desc: 'Raundda 1 kez: açılımdan önce damgala — o açılımın puanı 2 katına çıkar.' },
  kumarbaz: { key: 'kumarbaz', name: 'Kumarbaz', rarity: 'rare', uses: 3,
    desc: 'Her tur yazı tura: çarpanın ya 2 katına çıkar ya yarıya iner. Para çok nadiren DİK DURUR — o tur çarpan ×35.' },
  /* PLAYTEST 29 · GRUP A — Çöpçü ile takas: Common → RARE (kullanıcı
     kararı 2026-09-12). Efekt sayısı DEĞİŞMEDİ; yalnız nadirlik (ve ona
     bağlı fiyat/süre/renk) güncellendi. v3 double-dip denetimi: aynı
     koşula hem çarpan hem flat veriyordu — tek eksene (çarpan) indirildi. */
  sansliYedili: { key: 'sansliYedili', name: 'Şanslı Yedili', rarity: 'rare', uses: 4,
    desc: 'Açılımında 7 varsa +2.5x.',
    effect: (c) => c.vals.some(v => v === 7) ? { mult: 2.5, flat: 0 } : null },
  /* PLAYTEST 29 · GRUP B — YANKI YENİDEN TASARLANDI VE "HAYALET" OLDU
     (kullanıcı kararı
     2026-09-12, "Öneri 3"; ad değişikliği aynı gün ikinci turda).
     ESKİ HÂLİ: "önceki turla aynı türü açarsan puan +%50". İki ayrı
     kartla aynı satırı paylaşıyordu — ZİNCİR zaten üst üste açılımı
     ödüllendiriyor, KELEBEK ETKİSİ de aynı koşulun tam negatifini
     ("önceki turdan FARKLI tür") kullanıyor. Kart bu ikisinin arasında
     kendi alanı olmayan pasif bir yüzde bonusuydu.
     YENİ HÂLİ puan ekseninden tümden çıkıp TAŞ EKONOMİSİNE geçer
     (Bungie Gum / Dedikodu Masası ailesi): açılımın en düşük taşının bir
     HAYALETİ üretilir ve sonraki turun başında ıstakaya gelir. Hayalet
     bir tur yaşar, atılamaz ve el sınırına sayılmaz — yani "hangi
     kombinasyonu hayaleti besleyecek şekilde kurayım" kararı doğar.
     Hayalet KOPYADIR (`copied`), asıl taş masada kalır; bu yüzden deste
     bütünlük denetimi onu çoğalma saymaz (bkz. IS_BASE_TILE). */
  ikiYuzlu: { key: 'ikiYuzlu', name: 'İki Yüzlü', rarity: 'rare', uses: 4,
    desc: 'Açılımında hem sahte okey hem okey kullanırsan +3.5x.',
    effect: (c) => (c.usedFakeOkeyTile && c.usedOkeyTile) ? { mult: 3.5, flat: 0 } : null },
  /* P29 (2. tur) — GÖRÜNEN AD "Yankı" → "HAYALET" (EN "Ghost"),
     kullanıcı kararı 2026-09-12. Kartın tek işi hayalet taş üretmek
     olduğu için eski ad (yankı) artık hiçbir şeye karşılık gelmiyordu.
     ANAHTAR `yanki` OLARAK KALIR: kayıtlar jokeri anahtarla saklar,
     anahtarı değiştirmek eldeki kartı kayıp gösterirdi (Damga/`ayna`,
     Zımpara/`zimpara` emsali). "Su Taşı"nın anahtarı da `yankiTasi`
     olarak kalır — o ayrı bir karttır ve adı zaten Yankı değildir. */
  yanki: { key: 'yanki', name: 'Hayalet', rarity: 'rare', uses: 3,
    desc: 'Açtığın kombinasyonun en düşük taşının hayaleti sonraki tur ıstakana gelir. '
      + 'Bir tur yaşar, atılamaz, el sayısına girmez.' },
  /* PLAYTEST 29 · GRUP C — ZİNCİR KIRILMIYOR, GERİ SARIYOR (kullanıcı
     kararı 2026-09-12). Kademeler yükseldi (+1.5/+0.75, tavan 4.0 →
     +2.0/+1.0, tavan 8.0) ve "zincir kırılınca sıfırlanır" kuralının
     yerini turluk -1.0x geri sarma aldı. Birikim artık açılım formülünden
     TÜRETİLMEZ, jokerin üstünde tutulur — bkz. ZINCIR_* sabitleri. */
  zincir: { key: 'zincir', name: 'Zincir', rarity: 'rare', uses: 4,
    desc: 'Üst üste açtıkça çarpan büyür: 2. turda +2.0x, sonra her turda +1.0x. '
      + 'Tavan: +8.0x. Açılım yapmazsan birikimden -1.0x düşer.' },
  vampir: { key: 'vampir', name: 'Vampir', rarity: 'rare', uses: 4,
    desc: 'Açtığın her kombinasyonun en yüksek taşını emer. '
      + 'Raundun SON turundaki açılımına emdiklerinin 4 katı puan eklenir.' },
  bitki: { key: 'bitki', name: 'Bitki', rarity: 'rare', uses: 3,
    /* P29 · Grup E: 80 → 150 (kullanıcı kararı 2026-09-12). Koşul ve
       kademe aynı kaldı, yalnız tur başına ödül büyüdü. */
    desc: 'Açılımsız geçtiğin her tur, sonraki açılıma +150 puan ekler.',
    effect: (c) => c.skipStreak >= 1 ? { mult: 0, flat: 150 * c.skipStreak } : null },
  tercuman: { key: 'tercuman', name: 'Tercüman', rarity: 'rare', uses: 4,
    desc: 'Aynı renkten Per açabilirsin.' },
  paratoner: { key: 'paratoner', name: 'Paratoner', rarity: 'rare', uses: 3,
    desc: 'Her tur elinden bir taşı yem seç. O tur işlek tutarsa ceza yerine '
      + 'yemin değerinin 10 katı puan alırsın — ama yem taşı yanar.' },
  /* PLAYTEST 29 · GRUP G — İki Yüzlü ile takas: Rare → COMMON (kullanıcı
     kararı 2026-09-12). Efekt DEĞİŞMEDİ; yalnız nadirlik ve ona bağlı
     fiyat/süre/renk güncellendi. Kart artık COMMON bloğunda. */
  /* P29 · Grup H — ad "Trade Jokeri" → "Borsa" (EN "Stock"), mekanik
     hisse portföyüne geçti. Anahtar `tradeJokeri` olarak KALDI. */
  tradeJokeri: { key: 'tradeJokeri', name: 'Borsa', rarity: 'rare', uses: 3,
    desc: 'Açtığın her kombinasyon o türden bir hisse olur (en fazla 10). '
      + 'Bir açılımda o türden her hisse +0.4x verir. Raund sonunda yükselen türdeki '
      + 'her hisse +3 coin öder, düşen türdeki hisselerinin yarısı yanar.' },
  hipnotizor: { key: 'hipnotizor', name: 'Hipnotizör', rarity: 'rare', uses: 4,
    desc: 'Her raund bir sayı seçilir: o sayıdaki taşlar açılımda çift değer sayılır.' },
  /* Grup J v4: 0.05 → 0.08 (buff turu). P29 · Grup I: 0.08 → 0.2, raund
     sonu sıfırlama kalktı, tavan +10x (bkz. KATALIZOR_* sabitleri). */
  katalizor: { key: 'katalizor', name: 'Katalizör', rarity: 'rare', uses: 4,
    desc: 'Tur sonunda elinde kalan her taş +0.2x biriktirir. '
      + 'Birikim raundlar boyunca kalıcıdır, tavan +10x.' },
  /* PLAYTEST 11 · GRUP C (kullanıcı kararı) — TERAZİ YENİDEN TASARLANDI.
     Eski hâli ("küçük/büyük taş sayısı dengeliyse +1.8x") pasif bir
     kontrol listesiydi: oyuncu bir şey SEÇMİYOR, yalnız elinin şansına
     bakıyordu. Yeni hâli terazinin asıl fikrini kullanır — BEDEL ÖDE, GÜÇ
     AL: her turda bir kez elinden bir taşı feda edip SABİT +1.5x alırsın
     (PLAYTEST 18 · GRUP A: eskiden değerin 1/5'iydi, hesap kaldırıldı).
     Feda edilen taş yok olur; yani her tur "hangi taşı gözden
     çıkarabilirim" kararı doğar. */
  terazi: { key: 'terazi', name: 'Terazi', rarity: 'rare', uses: 3,
    desc: 'Taş atarken tur başına 1 taş feda edebilirsin. '
      + '8-13 feda et: hedef, taşın değerinin 15 katı kadar düşer. '
      + '1-7 feda et: raundun kalanına +0.8x. '
      + 'O turda işlek cezası yersen feda bonusun iptal olur.' },
  sarmasik: { key: 'sarmasik', name: 'Sarmaşık', rarity: 'rare', uses: 3,
    desc: 'Her raund sonunda en nadir jokerinin süresi azalmaz — deste jokerleri dahil.' },
  /* PLAYTEST 26 · GRUP I — Çift açmak birikimi SILMEZ, yarıya indirir.
     Bkz. YANKEE_RESET_KEEP. */
  yankee: { key: 'yankee', name: 'Yankee', rarity: 'rare', uses: 4,
    desc: 'Tur sonunda elinde en az 1 çift beklersen +1.0x biriktirir (tavan +8.0x). '
      + 'Çift açınca birikim yarıya iner.' },
  /* GRUP F (Playtest 7) — Dedikodu yeniden tasarlandı (kullanıcı kararı).
     Eski hâli ("sonraki store'dan 1 ürün sızdırılır") pasifti: hangi ürünün
     sızdığını seçemediğin için çoğu raund hiçbir şey hissettirmiyordu.
     Yeni tasarım Bungie Gum gibi KENDİ ALANI olan bir alt-sistem: ıstakanın
     yanında 3 açık taşlık bir masa durur, her tur 1 kez elindeki bir taşı
     masadakiyle takas edebilirsin. Verdiğin taş masada kalır — yani takas
     geri alınabilir, masa bir "yan ıstaka" gibi çalışır. */
  dedikodu: { key: 'dedikodu', name: 'Dedikodu Masası', rarity: 'rare', uses: 3,
    desc: 'Yanında 3 açık taş durur. Tur başına bir kez elindeki bir taşla takas et.' },
  /* GRUP G (Playtest 7) — görünen ad "Terzi" → "Bukalemun" (kullanıcı kararı):
     efekt renk değiştirmekle ilgili, dikişle değil; ayrıca ayrı bir
     "Terzi'nin İğnesi" jokeri ve bir "Boya" tüketilebiliri var, isim
     karışıyordu. KEY DEĞİŞMEDİ (terzi) — eski kayıtlar bozulmasın. */
  terzi: { key: 'terzi', name: 'Bukalemun', rarity: 'rare', uses: 3,
    /* P29 · Grup L (2. tur): açıklamadaki örnek cümle ("— farklı renkten
       bir Sıralı'nın arasına girebilir…") kaldırıldı; kural zaten ilk
       cümlede tam olarak duruyor ve tooltip kutusu taşıyordu. */
    desc: 'Seçtiği renkteki taşlar renksiz sayılır: her kombinasyonda, '
      + 'her konumda kullanılabilir.' },
  /* PLAYTEST 9 · GRUP Q — DAVRANIŞ KESİNLEŞTİ (kullanıcının 3. talebi).
     GDD 9'daki yorum "açılan taşlar SABİTLENİR, ayrı bir alanda durur ve
     her tur pasif puan üretir" idi; iki kez bu şekilde uygulandı ve iki kez
     reddedildi. Kullanıcının istediği davranış farklı ve daha basit:
     taşlar SAKIZA YAPIŞIP ISTAKAYA GERİ DÖNER, oyuncu onları bir sonraki
     tur yeniden seçip yeniden açabilir. Ayrı "sabitlenen taşlar" barı YOK.
     GDD'den BİLİNÇLİ SAPMA — GDD metni bu davranışa göre güncellendi.
     Risk tarafı (GDD'deki %25 kopma) korundu ama aynı eyleme bağlandı:
     her açılımda %25 ihtimalle sakız kopar ve taşlar geri dönmez. */
  bungieGum: { key: 'bungieGum', name: 'Bungie Gum', rarity: 'rare', uses: 4,
    desc: 'Açtığın taşlar sakıza yapışır: açılım bu tur masada durur, sonraki tur başında ıstakana döner. Her açılımda %50 kopma riski.' },
  fuzyon: { key: 'fuzyon', name: 'Füzyon', rarity: 'rare', uses: 3,
    desc: 'İki jokerini birleştirir: biri erir, efekti ve süresi diğerine geçer.' },

  /* ===== LEGENDARY (8) ===== */
  /* PLAYTEST 11 · GRUP D (kullanıcı kararı) — SISYPHUS'UN KOŞULU DEĞİŞTİ.
     Eski koşul "kazanma serisi"ydi; ama raundu kaybedince run bittiği için
     seri hiç bozulamıyordu — koşul bir koşul değil, yalnız "kaçıncı
     rauntasın" sayacıydı ve hiçbir karar üretmiyordu.
     Yeni koşul TUR İÇİ davranışa bağlı ve mitin kendisidir: kayayı ittikçe
     yukarı çıkar, bir tur duraksarsan en dibe düşer. Kaioken'in tam
     tersidir (o beklemeyi, bu durmamayı ödüllendirir). */
  sisyphus: { key: 'sisyphus', name: 'Sisyphus', rarity: 'legendary', uses: 3,
    desc: 'Üst üste açtıkça kaya yükselir: 2. tur +3.0x, 3. tur +7.0x, 4. tur +15.0x. Bir tur açmazsan kaya en dibe düşer.',
    effect: (c) => {
      const i = Math.min(c.consecMelds, SISYPHUS_STEPS.length) - 1;
      return i >= 0 ? { mult: SISYPHUS_STEPS[i], flat: 0 } : null;
    } },
  /* v3: +2 coin/taş raund başına ~30 coin üretiyordu (temel raund
     gelirinin üstü) — ekonomiyi kırdığı için +1'e indirildi */
  midas: { key: 'midas', name: 'Midas', rarity: 'legendary', uses: 3,
    /* P30 · Grup B (kullanıcı kararı): +1 → +3 coin (MIDAS_COIN). */
    desc: 'Açılımda kullandığın her taş +3 coin. Raund sonunda ödenir.' },
  kaptan: { key: 'kaptan', name: 'Lanetli Kaptan', rarity: 'legendary', uses: 3,
    desc: 'Game Over’ı 1 kez önler. Bedeli: satılamaz olur, hedefler %20 yükselir.' },
  /* v3 double-dip denetimi: kural açma + çarpan + flat üçlü ödüldü;
     flat kaldırıldı (kuralın kendisi + 0.5x yeterince güçlü) */
  ucuncuTeker: { key: 'ucuncuTeker', name: 'Üçüncü Teker', rarity: 'legendary', uses: 3,
    /* P30 · Grup C: çarpan +1.0x → +3.0x (TEKER_MULT). */
    desc: 'Çift ile Per/Sıralı aynı turda açılabilir. İkisine de +3.0x, ayrıca +200 puan.' },
  /* v3 double-dip denetimi: aynı koşula çarpan+flat ikilisi tek eksene
     (çarpan) indirildi; kademeler netleşti */
  kaioken: { key: 'kaioken', name: 'Kaioken', rarity: 'legendary', uses: 3,
    /* P30 · Grup D: kademeler +1.5x/+4.5x → +2.5x/+7.0x, yalnız çarpan. */
    desc: '2 tur açmazsan sonraki açılım +6.0x. 3 tur açmazsan +15.0x.',
    effect: (c) => c.skipStreak >= 3 ? { mult: KAIOKEN_MULT_3, flat: 0 }
      : c.skipStreak === 2 ? { mult: KAIOKEN_MULT_2, flat: 0 } : null },
  /* P33 · Grup A (kullanıcı kararı 2026-09-13) — YÜKSELEN ALEV eklendi.
     Mythic dönüşümü AYNEN kaldı; bonus _calcOpening içinde (ANKA_MULT_*). */
  ankaKusu: { key: 'ankaKusu', name: 'Anka Kuşu', rarity: 'legendary', uses: 2,
    desc: 'Açılımların +2.0x, son raundunda +5.0x. Süresi dolunca 1 raundluk rastgele bir Mythic olur.' },
  medusa: { key: 'medusa', name: 'Medusa', rarity: 'legendary', uses: 2,
    /* P30 · Grup E: +1.2x → +3.0x ve +80 puan (MEDUSA_MULT / MEDUSA_FLAT). */
    desc: 'Her tur bir taşın taşlaşır: rengi serbest olur, işlek ona işlemez, açılımda +3.0x ve +80 puan verir.' },
  /* PLAYTEST 30 · GRUP F (kullanıcı kararı 2026-09-13) — ROBIN HOOD → VASİYET.
     Robin Hood tamamen kaldırıldı. Vasiyet süresi dolup KIRILAN her
     jokerin efektini devralır: kırılan kaydın bir kopyası `j.legacy`
     deposuna girer ve slotRecs() onu Füzyon alt kaydı gibi okur — yani
     efekt, durum alanlarıyla (Bukalemun rengi, Pandora varyantı…) birlikte
     çalışmaya devam eder. Depo en fazla VASIYET_CAP efekt taşır; yenisi
     gelince en eskisi düşer. Vasiyet kırılınca mirası da onunla gider.
     Ayrıntılı kurallar: bkz. _ageJokers içindeki VASİYET bloğu. */
  vasiyet: { key: 'vasiyet', name: 'Vasiyet', rarity: 'legendary', uses: 3,
    desc: 'Süresi dolup kırılan her jokerin efekti bu karta miras kalır (en fazla 2, yenisi en eskisini düşürür). Vasiyet kırılınca taşıdığı her şey birlikte gider.' },
  /* PLAYTEST 30 · GRUP G (kullanıcı kararı 2026-09-13) — NEWTON → İPOTEK.
     Newton tamamen kaldırıldı. İpotek oyuncunun ELLE tetiklediği bir
     karttır (kartın üstündeki düğme, bkz. useIpotek): o raund +2 tur,
     bedeli sonraki raundun başında -2 tur. Borç ödenmeden (yani kullanıldığı
     raund ve ceza raundu boyunca) yeniden kullanılamaz. */
  ipotek: { key: 'ipotek', name: 'İpotek', rarity: 'legendary', uses: 3,
    desc: 'Raundda 1 kez elle kullan: o raund +2 tur. Bedeli sonraki raund -2 tur; borç ödenmeden tekrar kullanılamaz.' },
  /* PLAYTEST 11 · GRUP F (kullanıcı kararı) — TRUVA ATI → PANDORA.
     Eski "Pandora" (her raund iyi/kötü kutu) TAMAMEN KALDIRILDI; ismi ve
     teması bu karta geçti. Store'da gizemli bir KUTU olarak satılır ve
     ELE İLK GELDİĞİNDE eşit olasılıkla üç gizli varyanttan birine dönüşür:
       🕊 Umut     — kutunun dibinde kalan: her taş +8 puan + bir kez kurtarma
       🦠 Salgın   — kutudan çıkan dertler: dertli taşlar güçlü ama yakıcı
       🎁 Armağan  — kutu boşalır: her raund 3 taş 13'e çıkar
     `key` bilinçli olarak 'truva' KALDI: kayıt uyumu ve boss/ödül
     eşleşmeleri anahtar üzerinden çalışır. Görünen ad ve açıklama
     açılışta değişir. */
  truva: { key: 'truva', name: 'Pandora', rarity: 'legendary', uses: 2,
    desc: 'Kapalı bir kutu. Eline ilk geldiğinde açılır ve üç jokerden birine dönüşür.' },
  /* PLAYTEST 30 · GRUP K (kullanıcı onayı 2026-09-13) — KASIM AĞA +
     PROMETHEUS → ATEŞ TÜCCARI. İki kart da "store'da ürünü ucuza kapmak"
     kartıydı; tek kartta iki ADIM olarak birleşti: Kasım Ağa'nın pazarlığı
     aynen durur, Prometheus'un bedava alımı pazarlığı tutmuş üründe
     isteğe bağlı ikinci bir risk olur ("indirimde dur mu, zorla mı").
     Eski anahtarlar silindi; restore() onları kayıtlardan düşürür. */
  atesTuccari: { key: 'atesTuccari', name: 'Ateş Tüccarı', rarity: 'legendary', uses: 3,
    desc: 'Her store’da 1 ürüne pazarlık: %60 ihtimalle %40 indirim, tutmazsa ürün kaçar. Tutarsa ateşi çal: %50 bedava (sonraki raund işlek +%10), tutmazsa ürün kaçar.' },
  /* PLAYTEST 34 (kullanıcı onayı 2026-09-13) — LEGENDARY 13 → 15, iki YENİ kart.
     RÜŞVET — coini RAUND İÇİNDE harcamanın yolu. Taş atma aşamasında seçili
     taşlar desteye (rastgele yere) döner, desteden aynı sayıda taş gelir.
     Taşlar nesnenin kendisiyle taşınır ve `_takeTile` ile deftere yazılır
     (bkz. useRusvet). */
  rusvet: { key: 'rusvet', name: 'Rüşvet', rarity: 'legendary', uses: 3,
    desc: 'Taş atarken tur başına 1 kez: seçtiğin taşları desteye yolla, yenilerini çek. Taş başına 2 coin.' },
  /* HİDRA — okeyi ATMAK artık ceza değil yatırım: "bir kafa kesilir, iki kafa
     çıkar". Ceza muafiyeti discard içinde, doğum yeni turun başında (çekişten
     sonra). Geçici okeyler `copied` taşır (asıl deste 2 kopya kuralına girmez)
     ve deste her raund yeniden kurulduğu için raund sonunda kendiliğinden gider. */
  hidra: { key: 'hidra', name: 'Hidra', rarity: 'legendary', uses: 3,
    desc: 'Okeyi cezasız atarsın: sonraki tur 2 geçici okey gelir (raundda en çok 4).' },
  /* PLAYTEST 10 · GRUP E (kullanıcı kararı) — NOSTRADAMUS MYTHIC'TEN
     LEGENDARY'E İNDİ. Gerekçe: The World Legendary'den Mythic'e taşınırken
     (Grup C) iki bandın dolgusu bozulmuştu; bu, dengeleyici ters yönlü
     taşımadır. Kart zaten Mythic kimliğine ("o raundu bambaşka bir oyuna
     çevir") uymuyordu: raundu değiştirmez, yalnız KOŞULLU bir kalıcı ödül
     verir — bu tam olarak Legendary'nin "run'ın gidişatını değiştirir"
     bandıdır. Fiyat/satış/çıkış oranı artık RARITY.legendary'den gelir
     (22 / 11 coin) ve kart altın-turuncu Legendary görünümüyle çizilir.
     Süre mythic tabanı 1'den Legendary tabanı 3'e çıktı: kehanet tek
     raundda tutmazsa kart hiç iz bırakmadan ölüyordu. EFEKT DEĞİŞMEDİ. */
  nostradamus: { key: 'nostradamus', name: 'Nostradamus', rarity: 'legendary', uses: 3,
    /* P30 · Grup J: kalıcı ödül +1.5x → +2.5x (NOSTRA_MULT). */
    desc: 'Bu raundu 2 turda bitirirsen +2.5x kalıcı. Bitiremezsen ödül yok.' },

  /* ============================================================
     DOKTOR FRANKENSTEIN (PLAYTEST 10 · GRUP B → 2026-09-03 BİRLEŞİM)
     Eski hâli ("raund sonunda 3 taşı +3 değerle DESTEYE döndürür") kullanıcı
     tarafından işlevsiz bulundu: ödül hem gecikmeli, hem görünmez, hem de
     106 taşlık destede kaybolduğu için oyuncunun eline gelmesi şansa
     kalıyordu. Tema (ölüden hayat yaratma) korunarak üç ayrı tasarım
     kuruldu ve üçü trainer-only olarak denendi. Kullanıcı II + III ikilisini
     seçti; ikisi TEK KARTTA birleştirildi (gerekçe FRANK_* sabitlerinin
     üstünde), I kaldırıldı. Artık trainer-only DEĞİL: normal Legendary
     havuzunda, store'da ve paketlerde çıkar.
     ============================================================ */
  frankenstein: { key: 'frankenstein', name: 'Dr. Frankenstein',
    rarity: 'legendary', uses: 2,
    desc: 'Her tur başında attığın en yüksek taş +3 değerle dirilir: açılımda +80 puan. En düşük 2 taşın tek taşta birleşir (en çok 13): açılımda +2.0x.' },

  /* ===== MYTHIC (10) ===== */
  /* PLAYTEST 10 · GRUP C (kullanıcı kararı) — THE WORLD LEGENDARY'DEN
     MYTHIC'E TAŞINDI. Gerekçe: etkisi bir açılımı değil RUN'IN KENDİSİNİ
     kurtarır (kaybedilen boss raundunu başa sarar) — bu, Legendary'nin
     "gidişatı değiştirir" bandının üstünde, Mythic'in "run'ı yeniden yazar"
     bandındadır. Fiyat/satış/çıkış oranı artık RARITY.mythic'ten gelir
     (35 / 17 coin, mythic eğrisi) ve kart mythic gradyanıyla çizilir.
     EFEKT DEĞİŞMEDİ. Süre bilinçli olarak 2 raunda çekildi: mythic tabanı
     1 raundtur ama tek raundluk bir SİGORTA hiç tetiklenmeden ölür
     (oyuncunun boss raunduna denk getirmesi gerekirdi) — 35 coin'lik bir
     kartın öyle bir kumar olması istenmedi. */
  /* PLAYTEST 25 · MADDE E3-c (kullanıcı kararı 2026-09-09) — `runLong`.
     Süre 2 raunda çekilmişti ama sorun sürmüştü: KOŞULLU bir sigorta,
     koşul gerçekleşmeden sayaç yüzünden ölüyordu. Kart zaten "run boyunca
     1 kez" diyor; artık gerçekten öyle — tetiklenene kadar yaşlanmaz,
     tetiklendiğinde `s.jokers`tan çıkarılır (bkz. discardAndDraw kurtarıcı
     zinciri). Karşılığında E10 fiyat indiriminden MUAF tutuldu, 30 coinde
     kaldı (bkz. JOKER_PRICE_OVERRIDE). */
  theWorld: { key: 'theWorld', name: 'The World', rarity: 'mythic', uses: 2, runLong: true,
    /* P31 · Grup A: başa sarmaya ek +3.0x KALICI; bedeli run boyu hedef +%10 (permTargetUp). */
    desc: 'Boss raundunda ölürsen raund baştan başlar ve +3.0x kalıcı çarpan kazanırsın. Bedeli: run boyunca hedefler %10 artar. Run boyunca 1 kez.' },
  seytan: { key: 'seytan', name: 'Şeytan\'ın Teklifi', rarity: 'mythic', uses: 1,
    desc: 'Raundun ilk turunda tüm coinlerine el koyar. Coin başına +100 puan ve +4x çarpan verir.' },
  /* PLAYTEST 31 · GRUP C (kullanıcı onayı 2026-09-13) — PINKY FINGER OF THE
     WARRIOR → PINKY WARRIOR "KÜÇÜKLER ORDUSU". Eski kurtarma kartı
     ("eksik puanı tamamlar, run boyunca 1 kez") tamamen kaldırıldı; yeni
     anahtar açıldı. O raund 1-3 değerli bütün taşlar okey olur — en küçük
     taşlar (serçe parmaklar) raundun en güçlü taşlarına döner. Okey
     kuralları aynen geçerli: atılırsa okey atma cezası. */
  pinkyWarrior: { key: 'pinkyWarrior', name: 'Pinky Warrior', rarity: 'mythic', uses: 1,
    desc: 'O raund 1, 2 ve 3 değerli bütün taşlar okey olur. Okey kuralları geçerlidir: atarsan okey cezası yersin.' },
  kiyamet: { key: 'kiyamet', name: 'Kıyamet Trompeti', rarity: 'mythic', uses: 1,
    desc: 'O raund tüm jokerler susar, hedef %90 düşer.' },
  /* PLAYTEST 31 · GRUP E (kullanıcı kararı 2026-09-13) — AYNA KIRIĞI →
     TANRININ ELİ. Beş öneri turundan sonra kullanıcının kendi tarifi:
     bu kart slottayken tur sonundaki OTOMATİK çekiş kalkar, oyuncu
     çekiş hakkı kadar taşı DESTESİNDEN KENDİSİ seçer (çekiş sayısı ve
     ıstaka sınırı aynı kalır). Bkz. `s.godPick` / godPickTake(). */
  tanrininEli: { key: 'tanrininEli', name: 'Tanrının Eli', rarity: 'mythic', uses: 1,
    desc: 'Tur sonunda taş otomatik çekilmez: çekiş hakkın kadar taşı destenden kendin seçersin.' },
  ejderha: { key: 'ejderha', name: 'Gökyüzü Ejderhası', rarity: 'mythic', uses: 1,
    /* P31 · Grup F: yalnız en yüksek taş ×3 → açılımdaki HER taş ×5 (ham puanda,
       çarpandan önce). Yanan taş artık desteden de KALICI silinir. */
    desc: 'Açılımdaki her taşın değeri 5 katı sayılır. Her açılımda ıstakandan rastgele 1 taş kalıcı olarak silinir.' },
  /* v3: 0.1x/taş tek kartta ~+2.0x kalıcıydı → 0.05; v4 buff: 0.08.
     PLAYTEST 20 · GRUP L (kullanıcı raporu: "oyunu kırıyor") — KARA DELİK
     ARTIK ELİN YARISINI YUTAR. Eski hâli elin TAMAMINI (15-21 taş) alıp
     oyuncuyu taşsız bırakıyordu: ödül devasaydı (+300 puan, +1.7x kalıcı)
     ama raundun geri kalanı oynanamaz hâle geliyordu — "kazandım ama
     oynayamıyorum" durumu. Yeni hâli riski de ödülü de yarıya indirir ve
     yuttuktan HEMEN SONRA yerine yarısı kadar yeni taş çeker, yani el
     hiçbir zaman işlevsiz kalmaz. Taş başına ödül korunur (+15 / +0.08x),
     değişen tek şey KAÇ taşın yutulduğudur. */
  /* Kullanıcı düzeltmesi 2026-09-06: İngilizcede "Void", Türkçede
     "Boşluk" — Sir.by gibi sabit bir ad DEĞİL, çevrilir. */
  karaDelik: { key: 'karaDelik', name: 'Boşluk', rarity: 'mythic', uses: 1,
    /* P31 · Grup G: taş başına +15 → +150 puan, +0.08x → +1.0x kalıcı. */
    desc: 'Raund başında elinin yarısını yutar: yutulan taş başına +150 puan ve +1.0x kalıcı. Sonra yutulanın yarısı kadar yeni taş çekersin.' },
  /* PLAYTEST 31 · GRUP H (kullanıcı kararı 2026-09-13) — CRIMSON KING
     "KANLI TAÇ". Eski hâli (5 çekişi görme, +1 çekiş) kaldırıldı. Her tur
     başında taç, AÇILIMDA BONUS VEREN jokerlerinden rastgele birine geçer;
     o tur o jokerin açılım katkısı iki kez işler. Kullanıcı düzeltmeleri:
     (1) sıra/sol mantığı yok — rastgele, (2) Sarmaşık gibi açılıma bonus
     vermeyen jokerler taç alamaz (bkz. _meldBonusKeys). */
  crimsonTac: { key: 'crimsonTac', name: 'Crimson King', rarity: 'mythic', uses: 1,
    desc: 'Her tur başında taç, açılımda bonus veren jokerlerinden rastgele birine geçer: o tur o jokerin etkisi iki kez işler.' },
  /* PLAYTEST 31 · GRUP I (kullanıcı onayı 2026-09-13) — ADEM İLE HAVVA
     "YASAK ELMA". Eski hâli (tüm taşlar +2) kaldırıldı, yeni anahtar. Raund
     başında ele bir Elma taşı gelir: okey gibi her taşın yerine geçer ve
     kullanıldığı açılım ×3 puan verir. Elmayı AÇTIĞIN an cennetten
     kovulursun: raundun kalanında tur başı 2 taş eksik çekiş, işlek +%20. */
  yasakElma: { key: 'yasakElma', name: 'Adem ile Havva', rarity: 'mythic', uses: 1,
    desc: 'Raund başında eline bir Elma gelir: okey gibi her taşın yerine geçer, kullanıldığı açılım ×3 puan verir. Elmayı açınca kovulursun: kalan turlarda 2 taş eksik çekersin, işlek +%20.' },
  /* PLAYTEST 31 · GRUP J (kullanıcı onayı 2026-09-13) — KAĞIT JOKERİ → KAĞIT
     (EN "Paper"). Eski efekt (en düşük 3 taş 13 olur) kaldırıldı, yeni
     anahtar. Her raund başında elindeki en düşük 2 asıl deste taşı KALICI
     okeye çevrilir — Okey Mührü ile AYNI defter: `tileMods` remove +
     okeyClone. Kopya her stage o stage'in okeyine dönüşür. */
  kagit: { key: 'kagit', name: 'Kağıt', rarity: 'mythic', uses: 1,
    desc: 'Her raund başında elindeki en düşük 2 taş KALICI olarak okeye dönüşür (Okey Mührü gibi: her stage o stage’in okeyi olur).' },

  /* ===== BOSS (EPIC) — Slot Jokerleri (4) + Deste Jokerleri (4, GDD 10):
     deste jokerleri desteye karışır, eline gelince aktifleşir,
     kombinasyona giremez, discard edilirse -100 puan (GDD 7.6) ===== */
  /* Playtest 6 (2026-08-07): GDD "her yenilen taş başına +0.3x" diyor;
     kodda 0.5 vardı → 2 taş/tur 1.0x üretiyordu (birikim raundlar arası
     taşındığı için 3. turda +3x'e ulaşıyordu). GDD formülüne dönüldü. */
  kirby: { key: 'kirby', name: 'Sir.by', rarity: 'epic', uses: 3, mech: 'deck', icon: '😗',
    desc: 'Eldeyken her tur 2 taşının değeri 1 düşer (1’ler silinir). Yediği taş başına +0.8x biriktirir.' },
  cellat: { key: 'cellat', name: 'Cellat', rarity: 'epic', uses: 2, mech: 'deck', icon: '🪓',
    desc: 'Eldeyken her açılımdan sonra en düşük taşını idam eder: +80 puan. Sonraki açılımlara +50 puan birikir.' },
  /* PLAYTEST 9 · GRUP N — Dervish → GLITCH (key `dervish` DEĞİŞMEDİ,
     kayıt uyumu; Sir.by ile aynı desen). Joker tarafı GDD'deki "gizli
     değer işleme" fikrine sadık kalır ama artık boss'la aynı dili konuşur:
     boss BOZUK glitch üretir (ceza), joker İYİ glitch üretir (ödül) —
     ikisi de "hangi taş?" belirsizliği üzerine kurulu ve ikisi de ancak
     AÇILIMDA ortaya çıkar. Taşlar artık görünür şekilde işaretlenir
     (t.glitch) ki oyuncu "bunlardan biri" bilgisini alsın. */
  dervish: { key: 'dervish', name: 'GLITCH', rarity: 'epic', uses: 3, mech: 'deck', icon: '🌀',
    desc: 'Eldeyken her tur 2 taşını glitchler. Birinde gizli +60 puan vardır, açılımda ortaya çıkar.' },
  misunderstood: { key: 'misunderstood', name: 'The Misunderstood', rarity: 'epic', uses: 3, mech: 'deck', icon: '🎭',
    desc: 'Eline gelince hedef %15 artar, açılımların +2.5x olur. Kaybedecekken kendini feda edip puanı tamamlar. Kazanırsan +2.0x kalıcı bırakır.' },
  zombie: { key: 'zombie', name: 'Zombie', rarity: 'epic', uses: 3, mech: 'deck', icon: '🧟',
    desc: 'Eldeyken enfeksiyon her tur yan taşa atlar. Enfekte taşı açarsan: +2.5x, +50 puan. Taş gider, zincir kırılır.' },
  uzayli: { key: 'uzayli', name: 'Alien', rarity: 'epic', uses: 3, mech: 'deck', icon: '👽',
    desc: 'Eldeyken her tur 3 taşını kopyalar. Kopya açılımda +80 puan, raund sonunda kaybolur.' },
  /* PLAYTEST 17 · GRUP E/21 — KOLLAR ARTIK ÇARPAN VERİR (kullanıcı onayı
     2026-08-28, +0.5x/kol). KÖK NEDEN: kol başına +20 SABİT PUAN, hedef
     tablosuyla birlikte büyümüyordu — 8 kol = 160 puan, Stage 1 boss
     hedefinin (400) %40'ı ama Stage 8'in (3340) yalnızca %5'i. Joker
     ilerleyen stage'lerde matematiksel olarak görünmez hâle geliyordu.
     Kol sayısını artırmak sorunu yalnız ERTELERDİ (12 kol × 20 = 240,
     Stage 8'de hâlâ %7); tek gerçek çözüm ekseni ÇARPANA taşımaktı,
     çünkü çarpan hedefle birlikte ölçeklenir. Feda edilen kolun anlık
     ödülü de aynı oranda çevrildi (60 puan = 3 kol → +1.5x). */
  ahtapot: { key: 'ahtapot', name: 'Ahtapot', rarity: 'epic', uses: 3, mech: 'deck', icon: '🐙',
    desc: '8 kolu var: her açılıma kol başına +1.0x. Her tur bir kol feda olur ve o tur +2.5x ekstra verir.' },
  cheating: { key: 'cheating', name: 'The Cheating', rarity: 'epic', uses: 3, mech: 'deck', icon: '🕶',
    desc: 'Açılıma hile yap: +3.0x. Her hile tur sonu yakalanma riskine +%20 ekler; yakalanırsan joker ve hile puanın gider.' },
  terziIgne: { key: 'terziIgne', name: 'Terzi\'nin İğnesi', rarity: 'epic', uses: 4, mech: 'deck', icon: '🪡',
    desc: 'Eldeyken her tur 2 taşını diker. Dikili taş atılamaz; açılımda kullanırsan +2.5x.' },
  /* PLAYTEST 8 — GRUP B2: SÜRE BUG'I.
     Kök neden: GDD 10'da Freedom Fighters'ın süre hücresi bir SAYI değil
     "Run boyunca"dır. Kodda bu, `uses: 99` yer tutucusuyla taklit edilmişti;
     99 gerçek bir sayaç olduğu için her raund 1 azalıyor ve UI'da "99/98
     raund" (oyuncunun gözünde "100 raund") olarak görünüyordu — hem yanlış
     bilgi hem de rozette taşan bir sayı. Artık süre AÇIKÇA run boyudur:
     `runLong: true` olan joker hiç yaşlanmaz ve her yerde ∞ / "Run boyunca"
     yazar. Sayaç tamamen ortadan kalktığı için "99" bir daha sızamaz. */
  freedom: { key: 'freedom', name: 'Freedom Fighters', rarity: 'epic', uses: 99, runLong: true, mech: 'deck', icon: '⚔',
    desc: 'Alınca 5 taş işaretlenir. İşaretli taş eline gelince değerinin 10 katı puan verir.' },
  avukat: { key: 'avukat', name: 'Avukat', rarity: 'epic', uses: 3,
    desc: 'Her raund sonunda en nadir jokerini savunur: %75 kurtarır, %25 ikisi de yok olur.' },
  kahin: { key: 'kahin', name: 'Kahin', rarity: 'epic', uses: 3,
    desc: 'Her raund bir kehanet hedefi verir. Tutturursan raund sonunda ödül alırsın.' },
  tuccar: { key: 'tuccar', name: 'Tüccar', rarity: 'epic', uses: 4,
    desc: 'Her raund iki takas teklifi getirir: birini seç ya da reddet. Üst üste 2 ret ve gider.' },
  fatality: { key: 'fatality', name: 'Fatality', rarity: 'epic', uses: 3,
    desc: 'Her tur bir skor sınırı koyar. Sınırı aşarsan hedef %10 düşer.' },
  /* P35 · Grup K — ad "Ritim Jokeri" → "Ritim" (EN "Rhythm"), kademeler RITIM_BONUS. */
  ritim: { key: 'ritim', name: 'Ritim', rarity: 'epic', uses: 3,
    desc: 'Onaydan önce ritim çubuğu çıkar: doğru anda durdur → +1.5x / +3.0x / +6.0x. Kaçırırsan joker yok olur.' },
  corporates: { key: 'corporates', name: 'The Corporates', rarity: 'epic', uses: 4,
    desc: 'Her raund bir şirket görevi verir: başarırsan ödül, başaramazsan ceza.' },
  godzilla: { key: 'godzilla', name: 'Godzilla', rarity: 'epic', uses: 3,
    desc: 'Açılımsız geçtiğin turlarda şarj olur. Sonraki açılıma S1 +150/+2.5x, S2 +300/+5.0x, S3 +600/+10.0x.' },
  kelebek: { key: 'kelebek', name: 'Kelebek Etkisi', rarity: 'epic', uses: 3,
    desc: 'Önceki turdan farklı tür açarsan sürpriz ödül: +%50 puan, +300 puan ya da +15 coin.' },
  aynaKral: { key: 'aynaKral', name: 'Ayna Kral', rarity: 'epic', uses: 2,
    desc: 'Açılımların puanı yansımada birikir. Açılımsız turda alırsın: 2 açılım ×1.5, 3+ açılım ×2.' },
  karaKedi: { key: 'karaKedi', name: 'Kara Kedi', rarity: 'epic', uses: 2,
    desc: 'En düşük taşı çekersen kalıcı 12 olur; açılımda +80 puan.' },
};

/* Tüccar (GDD 10) — her raund başında sunulan takas havuzu.
   Playtest 6: eskiden tek bir "kabul et" butonu vardı; tek seçenek "doğrudan
   verme"den farksız olduğu için gerçek bir KARAR hissi yoktu. Artık her raund
   havuzdan 2 farklı teklif çekilir, oyuncu birini seçer ya da reddeder. */
const TUCCAR_OFFERS = [
  { key: 'multi',  cost: 3, text: '3 coin ver → bu raund +1.5x çarpan',
    can: (s) => s.coins >= 3,
    apply(s, G) { spendCoins(s, 3); s.roundMult = round2(s.roundMult + 1.5);
      return 'Takas: -3 coin → bu raund +1.5x çarpan'; } },
  { key: 'score',  cost: 5, text: '5 coin ver → anında +250 puan',
    can: (s) => s.coins >= 5,
    apply(s) { spendCoins(s, 5); s.score += 250; return 'Takas: -5 coin → +250 puan'; } },
  { key: 'draw',   cost: 4, text: '4 coin ver → bu raund her tur +1 taş çek',
    can: (s) => s.coins >= 4,
    apply(s) { spendCoins(s, 4); s.tuccarDraw = (s.tuccarDraw || 0) + 1;
      return 'Takas: -4 coin → bu raund her tur +1 taş'; } },
  { key: 'sell',   cost: 0, text: 'Elindeki en düşük 2 taşı sat → +6 coin',
    can: (s) => s.hand.filter(t => !t.jokerTile).length >= 2,
    apply(s, G) {
      const low = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !G.isOkeyTile(t))
        .sort((a, b) => a.number - b.number).slice(0, 2);
      for (const t of low) G._takeTile(t, 'tüccar-satış');
      gainCoins(s, 6);
      return `Takas: ${G._tileNames(low)} satıldı → +6 coin`;
    } },
  { key: 'upgrade', cost: 2, text: '2 coin ver → elindeki en düşük taş 13 olur',
    can: (s) => s.coins >= 2 && s.hand.some(t => !t.jokerTile && !t.fakeOkey),
    apply(s, G) {
      spendCoins(s, 2);
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !G.isOkeyTile(t));
      const t = cand.sort((a, b) => a.number - b.number)[0];
      if (t) { t.number = 13; retune(t, 'upgrade'); }
      return 'Takas: -2 coin → en düşük taşın 13 oldu';
    } },
  { key: 'perm',   cost: 8, text: '8 coin ver → +0.3x KALICI çarpan',
    can: (s) => s.coins >= 8,
    apply(s, G) { spendCoins(s, 8); s.permMult = round2(s.permMult + 0.3);
      return 'Takas: -8 coin → +0.3x KALICI çarpan'; } },
  /* ==========================================================================
     MADDE D6 (kullanıcı kararı 2026-09-09) — COIN KUMARI
     Tüccar'ın diğer teklifleri coin'i BAŞKA BİR ŞEYE çevirir (çarpan, puan,
     taş). Bu teklif coin'in KENDİSİ üzerine oynanan tek kumardır ve oyunun
     kumarhane temasının ekonomiye değen ayağıdır.

     Beklenen değer: 0.55×(+yatırım) + 0.45×(−yatırım) = +%10.
     Yani uzun vadede kârlı ama tek seferde %45 ihtimalle acıtır — "hafif
     pozitif, gerçek riskli" bandı bilerek seçildi: her zaman alınacak
     bedava bir ödül değil, ama hiç alınmayacak bir tuzak da değil.

     Yatırım cüzdanın YARISIDIR (tamamı değil): tam cüzdan kumarı, kaybeden
     oyuncuyu doğrudan E2 catch-up eşiğinin altına atardı ve iki sistem
     birbirini beslerdi ("iflas et, indirim al").

     ⚠ E1 FAİZİYLE ETKİLEŞİR: kumar cüzdanı yarıya indirdiği için o store'un
     faizini de düşürür, kazanınca yükseltir. Bu bilinçlidir — faiz zaten
     "elde tutmanın ödülü"dür, kumar da onun karşıt kutbudur.
     `can` eşiği 4 coin: altında yatırım 1 coine düşer ve teklif anlamsızlaşır.
     ========================================================================== */
  { key: 'kumar', cost: 0, text: 'Coinlerinin YARISINI yatır: %55 iki katı, %45 hepsi gider',
    can: (s) => s.coins >= 4,
    apply(s, G) {
      const stake = Math.floor(s.coins / 2);
      if (G.rng() < 0.55) {
        gainCoins(s, stake);
        return `🎲 Kumar TUTTU: ${stake} coin yatırdın, ${stake * 2} coin aldın (+${stake})`;
      }
      spendCoins(s, stake);
      return `🎲 Kumar KAYBEDİLDİ: ${stake} coin gitti`;
    } },
];
/* PLAYTEST 17 · GRUP B/11 — teklif artık RAUND başına değil TUR başına
   geldiği için sabır eşiği de tur ölçeğine çekildi: 2 tur üst üste
   reddetmek (yani neredeyse hiçbir turu es geçmemek) Tüccar'ı anında
   gönderiyordu. 4, tipik 5 turluk bir raundta "bu kervandan hiçbir şey
   almıyorum" kararının gerçekten verilmiş olmasını gerektirir. */
const TUCCAR_MAX_REFUSE = 4;

/* Tüccar BOSS Koşulu (GDD 13.4): "Teklifler çok daha agresif: '5 coin ver ya
   da elinden rastgele 2 taş gider'. Reddetme hakkı yoktur."
   Bu yüzden boss teklifinde "Reddet" yok — her seçenek bir bedel/ceza ikilisi;
   reddedince ceza uygulanır. */
const TUCCAR_BOSS_OFFERS = [
  { key: 'bCoin', text: '5 coin ver — yoksa elinden rastgele 2 taş gider',
    cost: 5,
    pay: (s) => { spendCoins(s, 5); return '5 coin ödendi — taşların güvende'; },
    canPay: (s) => s.coins >= 5,
    penalty(s, G) {
      const cand = s.hand.filter(t => !t.jokerTile);
      const gone = [];
      for (let i = 0; i < 2 && cand.length; i++) {
        const t = cand.splice(Math.floor(G.rng() * cand.length), 1)[0];
        G._takeTile(t, 'tüccar-bedel');
        gone.push(t);
      }
      /* Grup A: hangi taşın gittiği YAZILIR — eskiden yalnız sayı vardı ve
         oyuncu taşın sebepsiz kaybolduğunu sanıyordu. */
      return gone.length ? `Bedel ödenmedi — ${G._tileNames(gone)} kervanla gitti`
        : 'Bedel ödenmedi — verilecek taş yoktu';
    } },
  /* PLAYTEST 16 · GRUP D — "PUAN ÖDE" TEKLİFİ ARTIK GERÇEK BİR BEDEL.
     KÖK NEDEN: bu teklif RAUND BAŞINDA sunuluyor ve raund başında puan
     HER ZAMAN 0. Ödeme `Math.max(0, s.score - 250)` idi, yani 0 − 250 = 0:
     oyuncu hiçbir şey kaybetmeden cezadan kurtuluyordu. Teklif istisnai
     bir durumda değil, HER seferinde bedelsizdi.
     ÇÖZÜM: BORÇ. Elde puan varsa oradan tahsil edilir; yetmeyen kısım
     `s.scoreDebt` olarak yazılır ve bu raundta kazanılan ilk puanlardan
     düşülür (bkz. _settleScoreDebt). Böylece bedel ne zaman sunulursa
     sunulsun aynı ağırlıkta olur ve 250 puan gerçekten ödenir. */
  { key: 'bScore', text: '250 puan ver (puanın yetmezse borçlanırsın) — yoksa bu raund çarpanın -1.0x düşer',
    cost: 0,
    pay: (s) => {
      const now = Math.min(250, s.score);
      s.score -= now;
      const rest = 250 - now;
      if (rest > 0) s.scoreDebt = (s.scoreDebt || 0) + rest;
      return rest > 0
        ? `${now} puan ödendi, kalan ${rest} puan BORÇ — bu raundta kazandığın puandan düşülecek`
        : '250 puan ödendi';
    },
    canPay: () => true,
    penalty: (s) => { s.roundMult = round2(s.roundMult - 1.0); return 'Bedel ödenmedi — bu raund çarpan -1.0x'; } },
  { key: 'bTile', text: 'En yüksek taşını ver — yoksa hedef puan %10 artar',
    cost: 0,
    canPay: (s) => s.hand.some(t => !t.jokerTile),
    pay(s, G) {
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !G.isOkeyTile(t));
      const hi = cand.sort((a, b) => b.number - a.number)[0];
      if (hi) G._takeTile(hi, 'tüccar-takas');
      return hi ? `${COLOR_TR[hi.color]} ${hi.number} kervana verildi` : 'Verilecek taş yoktu';
    },
    penalty: (s) => { s.target = Math.ceil(s.target * 1.1); return `Bedel ödenmedi — hedef %10 arttı (${s.target})`; } },
];

/* The Corporates BOSS Koşulu (GDD 13.4): tek şirket, RAUND BOYU geçerli ve
   çok daha ağır görev; başarısızlık doğrudan Game Over. */
const CORPS_BOSS = {
  kizil: { text: 'Bu raundun HER turunda yalnızca Çift aç' },
  derin: { text: 'Bu raundun HER turunda en az 3 kombinasyon aç' },
  altin: { text: 'Raundu en geç 2. turda geç' },
  yesil: { text: 'Bu raundun HER turunda açılım yap — hiç pas geçme' },
};

/* GDD 10/18 — The Corporates şirketleri (raund bazlı görev uyarlaması) */
const CORPS = [
  { key: 'kizil', name: '🔴 Kızıl Kule A.Ş.', text: 'Bir turda YALNIZCA Çift aç', rewardText: '+0.2x kalıcı', penaltyText: '-100 puan' },
  { key: 'derin', name: '🔵 Derin Su Ltd.', text: 'Bir turda en az 3 kombinasyon aç', rewardText: '+5 coin', penaltyText: '-50 puan' },
  { key: 'altin', name: '🟡 Altın Hilal Holding', text: 'Raundu 1. veya 2. turda geç', rewardText: '+300 puan +3 coin', penaltyText: 'raund coini yarıya' },
  { key: 'yesil', name: '🟢 Yeşil Vadi Teknoloji', text: 'Her turda el aç, hiç geçme', rewardText: '+0.3x kalıcı', penaltyText: '-50 puan' },
];

/* Grup J: eski değerler (100/3x → 800/8x) boss ödülünü tek başına
   run-kazandıran güce çıkarıyordu — kısıldı. v4 buff turu (2026-07-09):
   şarj artık işlek pas cezasını (Grup F) da göze aldırıyor → hafif artış.
   2026-08: 4. seviye KALDIRILDI — raund maks 4 tur olduğundan S4'e
   (4 açılımsız tur + açılım) ulaşmak imkânsızdı. S4'ün gücü S3'e
   katıldı: maks-risk hattı (3 tur bekle, 4. turda patlat) artık S3. */
/* Sir.by (GDD 10 deste jokeri) — tur başına yenen taş sayısı ve taş başına çarpan.
   Tek noktadan yönetilir ki formül ("yenen taş × 0.3x") bir daha kaymasın. */
/* Deste bütünlüğü: normal Okey destesinde her renk+sayı yüzünden en fazla
   2 adet bulunur (bkz. _auditDeck) */
const DECK_MAX_COPIES = 2;

/* PLAYTEST 29 · GRUP O — STORE'DA "BİR TAŞ SEÇ" (kullanıcı kararı
   2026-09-12). Taş hedefli değnekler (Boya Kabı, Altın Vernik, Çekiç,
   Ustura, Taç, Mıknatıs, Kopya Mürekkebi, Gümüş Vernik) bugüne kadar
   store'da HİÇ kullanılamıyordu: `findTile` raund dışında doğrudan
   "sadece raund içinde kullanılabilir" hatası veriyordu, çünkü seçilecek
   bir EL yoktu. Artık store'da oyuncuya DESTE BİLEŞİMİNDEN rastgele
   STORE_TILE_PICKS taş sunulur ve etki onlardan birine uygulanır.
   Sunulan taşlar elin ya da o anki `s.deck` dizisinin kopyaları DEĞİL,
   bir sonraki raundun deste bileşiminden türetilmiş YÜZLERDİR (bkz.
   `_deckFaces`): store'da canlı bir deste yoktur, kalıcı etki zaten
   `tileMods` / `specialTiles` üzerinden yazılır. */
const STORE_TILE_PICKS = 10;

const KIRBY_BITE = 2;
const KIRBY_MULT = 0.8;   // P35 · Grup A: yenen taş başına 0.3 → 0.8

/* PLAYTEST 18 · GRUP A — TERZİ'NİN İĞNESİ (deste jokeri).
   `IGNE_SEW` : tur başında dikilen taş sayısı (GDD 10)
   `IGNE_MULT`: dikili taş açılımda kullanılırsa gelen çarpan.
   Değer TEK YERDE tutulur: eski sürümde puanlama +0.6x veriyor ama tur
   başı bildirimi "+0.4x" yazıyordu — oyuncu jokerin ne yaptığını yanlış
   öğreniyordu. Joker kartı, GDD ve puanlama +0.6x'te birleşti.
   `IGNE_FREE_MIN`: elde her zaman bu kadar DİKİLMEMİŞ taş kalır. Dikişler
   tur boyunca birikir (tasarım: "kullanmazsan boğulursun" baskısı), ama
   elin tamamı dikilirse atılacak taş kalmaz ve tur kapanamazdı — gerçek
   bir softlock'tu. */
const IGNE_SEW = 2;
const IGNE_MULT = 2.5;   // P35 · Grup I: 0.6 → 2.5
const IGNE_FREE_MIN = 2;

/* Lanetli Kaptan (Grup B) — Game Over'dan kurtardıktan sonra joker yaşadığı
   sürece hedeflere uygulanan lanet çarpanı */
const KAPTAN_CURSE = 1.2;

/* GRUP N (Playtest 7) — Bal Küpü (Legendary tüketilebilir) güç değerleri */
const BAL_KUPU_INSTANT = 10;   // kırılınca anında gelen coin
const BAL_KUPU_PERM = 3;       // her raund sonuna eklenen kalıcı coin

/* GRUP H (Playtest 7) — Uzaylı BOSS "Sinsi Bulaşma": her tur başında elde
   kaç taş gizlice uzaylıya dönüşür. Gizli uzaylı içeren kombinasyon onay
   anında çöker (0 puan, taşlar ele döner). */
const ALIEN_HIDDEN_PER_TURN = 3;

/* Şeytan'ın Teklifi (GDD 12) — feda edilen coin başına ödül */
/* P31 · Grup B (kullanıcı kararı 2026-09-13): 50 → 100 puan, 0.2 → 4.0x (coin başına) */
const SEYTAN_SCORE = 100;
const SEYTAN_MULT = 4.0;
/* P31 · MYTHIC DENGE TURU (kullanıcı kararı 2026-09-13) */
const WORLD_PERM_MULT = 3.0;     // Grup A — The World tetiklenince kalıcı çarpan
const WORLD_TARGET_UP = 0.10;    // Grup A — bedeli: run boyunca hedefler +%10
const KIYAMET_KEEP = 0.10;       // Grup D — hedefin kalan payı (%80 → %90 düşüş)
const EJDERHA_TILE_MULT = 5;     // Grup F — açılımdaki her taşın değeri ×5
const VOID_SCORE = 150;          // Grup G — Boşluk: yutulan taş başına puan (15 → 150)
const VOID_MULT = 1.0;           // Grup G — Boşluk: yutulan taş başına kalıcı çarpan (0.08 → 1.0)
const PINKY_MAX = 3;             // Grup C — Pinky Warrior: bu değere kadar (1-3) taşlar okey
const APPLE_MULT = 3;            // Grup I — Yasak Elma: elmalı açılımın puan katı
const APPLE_DRAW_CUT = 2;        // Grup I — kovulunca tur başı eksik çekiş
const APPLE_ISLEK = 0.20;        // Grup I — kovulunca raundun kalanına işlek riski

/* P35 · Grup M: S1 +100/2.5x → +150/2.5x · S2 +250/3.5x → +300/5.0x ·
   S3 +550/5.5x → +600/10.0x */
const GODZILLA_LEVELS = [
  { flat: 150, mult: 2.5 }, { flat: 300, mult: 5.0 },
  { flat: 600, mult: 10.0 },
];

/* ---------- Stage sonu güçlendirmeleri (Grup H, 2026-07-08) ----------
   Boss yenilince zafer ekranından SONRA ayrı bir ekranda 4 seçenek
   sunulur, oyuncu 1'ini seçer (5 coin'e bir kez yenilenebilir).
   Eski otomatik 4'lü paket kaldırıldı — seçimler daha az ama daha GÜÇLÜ. */
/* ============================================================
   PLAYTEST 20 · GRUP I — STAGE SONU GÜÇLENDİRMELERİ 7 → 16.
   Kullanıcı raporu: seçenekler az ve bir kısmı Stage 6+'da hissedilmiyor.
   İki değişiklik yapıldı:
     1) MEVCUT DÖRT SEÇENEK BUFF'LANDI. Ölçek sorunu hep aynıydı: sabit
        büyüklükler hedef eğrisiyle birlikte büyümüyor. Kalıcı Çarpan
        0.5 → 0.8, Coin Kasası 25 → 40, Nazar Boncuğu %5 → %8, Zanaatkâr
        +2 → +3 raund.
     2) DOKUZ YENİ SEÇENEK eklendi ve havuz beş kategoriye yayıldı:
        kalıcı çarpan/puan · el-slot kapasitesi · ekonomi · risk azaltıcı ·
        nadir tek seferlik. Çark iki ödül verdiği için havuzun geniş olması
        doğrudan "her stage aynı şeyler çıkıyor" hissini kırar.
   `cat` alanı yalnız koleksiyon/GDD gruplaması içindir, mekaniği etkilemez.
   ============================================================ */
/* ============================================================
   GÜÇLENDİRME SAYILARI — TEK KAYNAK (2026-09-04)
   BUG: stage sonu ödül kartında rozet "+0.5x" derken açıklama
   "kalıcı +0.8x" diyordu; Coin Kasası'nda "+25" / "+40", Zanaatkâr'da
   "+2" / "+3", Nazar Boncuğu'nda "%5" / "%8" aynı çelişkiyi taşıyordu.
   KÖK NEDEN: rozet değerleri ui.js içinde `UP_STATS` adlı ELLE YAZILMIŞ
   ikinci bir tabloda duruyordu. P20 · Grup I'de motordaki değerler
   buff'lanınca (0.5→0.8, 25→40, 2→3, %5→%8) açıklamalar güncellendi ama
   arayüzdeki kopya unutuldu — iki kaynak sessizce ayrıştı.
   ÇÖZÜM: sayılar burada bir kez tanımlanır; hem `_applyUpgrade` hem
   açıklama metni hem de rozet (`stats`) buradan okur. Arayüzde artık
   hiçbir güçlendirme sayısı yazılı DEĞİLDİR.
   ============================================================ */

/* YANKEE (Rare) — BİRİKİM SABİTLERİ
   PLAYTEST 26 · GRUP I: Çift açmak birikimi SİLMEZ, YARIYA indirir
   (kullanıcı kararı 2026-09-09).
   PLAYTEST 29 · GRUP K (kullanıcı kararı 2026-09-12): eşik 2 çiftten
   1 ÇİFTE indi, oran +0.5x → +1.0x, tavan +8.0x eklendi. "Çift açınca
   birikim" kolu ise DEĞİŞMEDİ — kullanıcı "aynı kalsın" dedi ve koddaki
   hâli P26'da bilerek yarıya indirmeye çevrilmişti. */
const YANKEE_STEP = 1.0;
const YANKEE_CAP = 8.0;
const YANKEE_RESET_KEEP = 0.5;                   // Çift açınca kalan oran

/* ZİNCİR (Rare) — BİRİKİM SABİTLERİ · PLAYTEST 29 · GRUP C
   (kullanıcı kararı 2026-09-12). Eski kart `consecMelds`ten TÜRETİLİYORDU:
   zincir bir kez kırılınca değer anında sıfıra düşüyordu ve kart, seriyi
   tutamayan oyuncu için hiç var olmamış gibi oluyordu. Artık birikim
   jokerin ÜSTÜNDE (`j.zincirMult`) durur, Yankee ile aynı kalıp:
     · açılım yapılan ilk tur      → birikim 0'dan ZINCIR_START'a çıkar
     · sonraki her açılım turu     → +ZINCIR_STEP
     · açılımsız geçilen her tur   → -ZINCIR_DECAY (0'ın altına inmez)
   Yani zincir kırılmak yerine GERİ SARAR; tavan ZINCIR_CAP.
   İlk açılımın KENDİSİ bonus almaz (birikim tur SONUNDA işlenir), bu
   yüzden açıklamadaki kademe "2. turda +2.0x" diye okunur. */
const ZINCIR_START = 2.0;
const ZINCIR_STEP = 1.0;
const ZINCIR_DECAY = 1.0;
const ZINCIR_CAP = 8.0;

/* VAMPİR (Rare) — PLAYTEST 29 · GRUP D (kullanıcı kararı 2026-09-12).
   Bonus 2 → 4 KAT ve ÖDEME YERİ DEĞİŞTİ: birikim artık raund sonu genel
   toplamına sessizce eklenmez, RAUNDUN SON TURUNDAKİ AÇILIMIN puanına
   girer. Yani vampir kanı ancak son turda da açılım yaparsan boşalır —
   kartın tek kararı ("son tura açacak taş sakla") tam burada doğar.
   `flat` ekseninde durur: çarpanla büyümez ama Damga onu da ikiye katlar,
   çünkü Damga açılımın TAM puanını katlar. */
const VAMPIR_MULT = 4;

/* PARATONER (Rare) — PLAYTEST 29 · GRUP F (kullanıcı kararı 2026-09-12).
   "Kum Saati" TÜMDEN KALDIRILDI; yerine gelen kart yepyeni, anahtarı da
   yeni (`paratoner`) — eski `kumSaati` kaydı restore()'da düşer, İki
   Yüzlü / İşlemeci emsali.
   Eski kart bir gelir musluğuydu: kristal kendi kendine sayılıyor, oyuncu
   hiçbir şey seçmiyordu. Yeni kart oyunun TEK TARAFLI VERGİSİNİ (işlek)
   oyuncunun yönettiği bir bahse çeviriyor: her tur ELİNDEKİ bir taşı yem
   olarak işaretlersin; o tur işlek tutarsa ceza uygulanmaz, yemin
   değerinin 10 katı PUAN yazılır — ama yem taşı yanar.
   Yemin ELDE olması (atılanlar arasında değil) bilinçlidir: atılan taşlar
   arasından seçilseydi en yükseği seçmek her zaman doğru olur, karar diye
   bir şey kalmazdı. Elde duran taş ise bir sonraki turun kombinasyonuna
   aday olduğu için "13'ü yeme koyayım mı" gerçek bir bedel taşır.
   AYNA KIRIĞI (Mythic) ile çakışmaz: o raund boyunca işleği tersine
   çevirir ve ATILAN taşın 20 katını verir; ikisi birdeyse Mythic öne
   geçer ve yem yanmaz (bkz. işlek bloğu). */
const PARATONER_MULT = 10;

/* KATALİZÖR (Rare) — PLAYTEST 29 · GRUP I (kullanıcı kararı 2026-09-12).
   Üç değişiklik: oran 0.08 → 0.2, raund sonu SIFIRLAMA KALKTI, tavan +10x.
   Birikim bu yüzden STATE'ten JOKERİN ÜSTÜNE taşındı (`j.katalizorMult`):
   artık raundu aşıyor, dolayısıyla state'te kalsaydı joker öldükten sonra
   da yaşardı. Yankee/Zincir ile aynı kalıp — birikim kartla birlikte gider.
   ⚠ Eski kayıtlardaki `s.katalizorMult` okunmaz; kayıttan dönen oyunda
   birikim 0'dan başlar (alan kayıt uyumu için yerinde bırakıldı). */
const KATALIZOR_STEP = 0.2;
const KATALIZOR_CAP = 10;

/* P42 (kullanıcı kararı 2026-09-14): Kalıcı Çarpan 0.8 → 1.5x, Zanaatkâr
   +3 → +2 raund, Nazar Boncuğu %8 → %10, Bileme Taşı 1.0 → 2.0x.
   GENİŞ KEMER ve TACİR KARTI SİLİNDİ: aynı işi değnekler yapıyor (Kese /
   `heybe` değnek slotu, Tacir Mektubu ana joker slotu). */
const UP_VAL = {
  carpan: 1.5,          // kalıcı çarpan
  cekis: 1,             // tur başına ekstra taş
  zanaat: 2,            // jokerlere eklenen raund
  raf: 1,               // store'da ekstra joker rafı
  kasaNow: 40,          // anında coin
  kasaPer: 2,           // raund sonu kalıcı coin
  tilsim: 0.10,         // işlek riski düşüşü
  altinDamar: 0.15,     // ham puan artışı
  bileme: 2.0,          // çok kombinasyonlu turda çarpan
  uzunSoluk: 1,         // raund başına ekstra tur
  kayipSandik: 15,      // sandıkla gelen coin
};
const UP_PCT = (v) => Math.round(v * 100);

const UPGRADE_DEFS = {
  carpan:  { key: 'carpan',  icon: '✖️', name: 'Kalıcı Çarpan', cat: 'mult',
    stats: [`+${UP_VAL.carpan}x`],
    desc: `Tüm açılımlara kalıcı +${UP_VAL.carpan}x.` },
  cekis:   { key: 'cekis',   icon: '🎴', name: 'Bol Çekiş',   /* P38: eski ad Derin Nefes (değneğe geçti) */ cat: 'cap',
    stats: [`+${UP_VAL.cekis} 🎴/tur`],
    desc: `Her tur kalıcı +${UP_VAL.cekis} fazla taş çekersin.` },
  /* 'el' (Geniş Istaka) KALDIRILDI — Grup H (2026-07-09): başlangıç el
     büyüklüğü artışı (15→17→19→21) seçilebilir bir yükseltme DEĞİL,
     her stage geçişinde OTOMATİK ve koşulsuz işleyen ayrı bir sistemdir
     (handSizeFor). Oyuncu el büyümesi ile başka bonus arasında seçim
     yapmaya zorlanmaz. */
  zanaat:  { key: 'zanaat',  icon: '🔧', name: 'Zanaatkâr', cat: 'risk',
    stats: [`⏳ +${UP_VAL.zanaat} raund`],
    desc: `Tüm jokerlerinin kalan süresi +${UP_VAL.zanaat} raund uzar.` },
  raf:     { key: 'raf',     icon: '🏪', name: 'Eskici Rafı', cat: 'econ',
    stats: [`🏪 +${UP_VAL.raf} raf`],
    desc: `Store’da kalıcı +${UP_VAL.raf} joker rafı açılır. Bu store dahil.` },
  kasa:    { key: 'kasa',    icon: '💰', name: 'Coin Kasası', cat: 'econ',
    stats: [`+${UP_VAL.kasaNow} 💰`, `+${UP_VAL.kasaPer}/raund`],
    desc: `Anında +${UP_VAL.kasaNow} coin. Sonra her raund sonunda +${UP_VAL.kasaPer} coin.` },
  tilsimU: { key: 'tilsimU', icon: '🧿', name: 'Nazar Boncuğu', cat: 'risk',
    stats: [`⚠ -%${UP_PCT(UP_VAL.tilsim)}`],
    desc: `İşlek riski kalıcı %${UP_PCT(UP_VAL.tilsim)} düşer.` },

  /* --- YENİ (P20 · GRUP I) — kalıcı çarpan / puan --- */
  altinDamar: { key: 'altinDamar', icon: '💎', name: 'Altın Damar', cat: 'mult',
    stats: [`+%${UP_PCT(UP_VAL.altinDamar)} ham`],
    desc: `Her açılımın ham puanı kalıcı %${UP_PCT(UP_VAL.altinDamar)} artar.` },
  bileme: { key: 'bileme', icon: '🔩', name: 'Bileme Taşı', cat: 'mult',
    stats: [`+${UP_VAL.bileme.toFixed(1)}x`],
    desc: `Bir turda 2+ kombinasyon açtığın her turda +${UP_VAL.bileme.toFixed(1)}x.` },
  /* --- YENİ — el / slot kapasitesi --- */
  uzunSoluk: { key: 'uzunSoluk', icon: '⏱', name: 'Uzun Soluk', cat: 'cap',
    stats: [`⏱ +${UP_VAL.uzunSoluk} tur`],
    desc: `Her raunda kalıcı +${UP_VAL.uzunSoluk} tur.` },
  /* --- YENİ — ekonomi --- */
  sigorta: { key: 'sigorta', icon: '🛡', name: 'Sigorta Poliçesi', cat: 'econ',
    stats: ['🛡 tam iade'],
    desc: 'Sattığın jokerler tam alış fiyatına gider.' },
  /* --- YENİ — nadir güçlü tek seferlik --- */
  ikinciSans: { key: 'ikinciSans', icon: '❤️‍🩹', name: 'İkinci Şans', cat: 'rare',
    stats: ['❤️‍🩹 1 kez'],
    desc: 'Run boyunca bir kez: kaybettiğin raund baştan başlar.' },
  kayipSandik: { key: 'kayipSandik', icon: '🎁', name: 'Kayıp Sandık', cat: 'rare',
    stats: ['🎴 1 değnek', `+${UP_VAL.kayipSandik} 💰`],
    desc: `Anında güçlü bir değnek ve +${UP_VAL.kayipSandik} coin.` },
  ustaninMuhru: { key: 'ustaninMuhru', icon: '🔮', name: 'Ustanın Mührü', cat: 'rare',
    stats: ['🔮 yaşlanmaz'],
    desc: 'En nadir jokerinin süresi hiç azalmaz.' },
  /* PLAYTEST 9 · GRUP E — YENİDEN TASARLANDI (kullanıcı seçimi "Çift Basamak").
     Eski hâli `carpanStep +1` idi: tek kombinasyonda +0.3x demekti, yani aynı
     ekranda duran Kalıcı Çarpan'dan (+0.5x) HER KOŞULDA zayıftı → hiç rasyonel
     seçim olmuyordu. Yeni hâli aynı ekseni korur ama OYNAYIŞLA ÖLÇEKLENİR:
     kombinasyon sayısı tabloda iki katı sayılır (1→2.3x, 2→3.1x, 3→4.0x,
     4→4.6x). Tek kombinasyonda hâlâ mütevazı (+0.3x), çok kombinasyonlu
     turlarda +1.5x'e kadar çıkar. Bir kez alınabilir (kümülatif değil). */
  usta:    { key: 'usta',    icon: '🀄', name: 'Usta Eli', cat: 'mult',
    stats: ['🀄 ×2 basamak'],
    desc: 'Kombinasyon sayın çarpan tablosunda iki katı sayılır.' },
};

/* "ASIL DESTE" TAŞI MI?  (her yüzden en çok 2 kopya kuralı yalnız bunlara
   uygulanır.) Liste TEK YERDE tutulur; eskiden iki ayrı kopyası vardı ve
   ikisi de eksikti. 2026-08-26'da 30 run'lık bir oynanış taramasıyla
   tamamlandı — iki ayrı kaynak eksikti:

   1) JOKER KAYNAKLI YENİ TAŞLAR: `revived` (Dr. Frankenstein'ın mezarlıktan
      kaldırdığı taş) ve `stitched` (aynı jokerin birleştirdiği taş) desteye
      hiç ait değildir, ama işaretsiz sayıldıkları için "çoğalma" görünüyordu.

   2) DEĞERİ SONRADAN DEĞİŞEN TAŞLAR (`retuned`): Kara Kedi, Robin Hood,
      Adem ile Havva, Kağıt Jokeri, Pandora-Armağan, The Cheating ve Tüccar
      takası taşın SAYISINI değiştirir. Böyle bir taş artık dağıtıldığı
      kimliği temsil etmez; 2 kopya kuralı ona uygulanamaz (üç "Sarı 12"
      gerçek bir bozulma değil, Kara Kedi'nin işidir).

   Denetimin ASIL yakaladığı bozulmalar (çift referans + kayıp taş) bu
   işaretlerden bağımsızdır ve etkilenmez. */
function IS_BASE_TILE(t) {
  return !t.jokerTile && !t.fakeOkey && !t.copied && !t.modded
    && !t.revived && !t.alien && !t.special && !t.monster && !t.stitched
    && !t.retuned;
}

/* PLAYTEST 18 · GRUP B — TAŞIN KÖKENİ ARTIK TAŞIN ÜSTÜNDE YAZAR.
   Denetim "3 tane Mavi 13 var" diyebiliyordu ama HANGİ mekaniğin yaptığını
   söyleyemiyordu; kullanıcı da ıstakada bunu göremediği için sıradan bir
   deste bozulması sanıyordu. Değeri/kimliği değişen ya da yoktan üretilen
   her taş bundan böyle `origin` (mekanik anahtarı) taşır:
     · retune(t, 'kagitJokeri')  → değeri değişti, artık asıl deste taşı değil
     · origin alanı UI'da rozetin tooltip'ine, denetimde de alarm satırına
       yazılır ("çoğalma: blue-13×3 [kagitJokeri×2 + asıl×1]").
   `retuned` bayrağını ELLE yazmak yasaktır — hep bu fonksiyondan geçilir,
   yoksa Sir.by'da olduğu gibi işaretsiz bir dönüşüm sızar. */
const TILE_ORIGIN_TR = {
  kirby: 'Sir.by', kirbyBoss: 'Sir.by (boss)', karaKedi: 'Kara Kedi',
  karaKediBoss: 'Kara Kedi (boss)',
  yasakElma: 'Adem ile Havva (Elma)', kagit: 'Kağıt',
  pandoraArmagan: 'Pandora — Armağan', cheating: 'The Cheating',
  tuccar: 'Tüccar takası', upgrade: 'Takas (13 yükseltmesi)',
  cekic: 'Değer Çekici', tac: 'Taç', boya: 'Boya Kabı', kopyaci: 'Kopyacı',
  okeyMuhru: 'Okey Mührü', uzayli: 'Alien', frank: 'Dr. Frankenstein',
  vernik: 'Vernik', okeyBoss: 'Uzaylı (boss)',
  yanki: 'Hayalet', hidra: 'Hidra',
};
function retune(t, origin) {
  if (!t) return t;
  t.retuned = true;
  t.origin = origin;
  return t;
}
function tagOrigin(t, origin) {
  if (t) t.origin = origin;
  return t;
}

/* Kalıcı deste dönüşümlerinde remove+add satırlarını birbirine bağlayan
   sayaç (bkz. _startRound içindeki tileMods uygulaması). */
function nextModPair(state) {
  const s = state || {};
  s.modPairSeq = (s.modPairSeq || 0) + 1;
  return s.modPairSeq;
}

let _tileId = 0;
let _jokerId = 0;

/* PLAYTEST 16 · GRUP E/F — TAŞ KİMLİĞİ TEK NOKTADAN ÜRETİLİR.
   Her taşın benzersiz bir id'si OLMAK ZORUNDA: motorun her yeri taşı
   `hand.find(t => t.id === ...)` ile bulur, iki taş aynı id'yi taşırsa
   biri erişilemez olur (kaybolmuş görünür) ve diğeri iki kez seçilebilir
   (çoğalmış görünür). Sayaç geri yüklemede eksik kalırsa (eski kayıt,
   taranmayan bölge) çakışma doğardı; bu yüzden üretimde CANLI DURUM da
   denetlenir ve sayaç gerekirse ileri sarılır. */
function nextTileId(state) {
  _tileId++;
  if (state && typeof Game !== 'undefined' && Game.tileRefs) {
    let max = 0;
    try {
      /* PLAYTEST 25 · GRUP A — tarama artık `tileRefs()` üzerinden: boss
         kesesi ve Kuzey Yıldızı seçenekleri de dahil (eskiden görünmez
         oldukları için sayaç onların ALTINDA kalıp id çakıştırıyordu). */
      for (const arr of Game.tileRefs())
        for (const t of arr) if (typeof t.id === 'number' && t.id > max) max = t.id;
    } catch (e) { /* durum henüz kurulmadı */ }
    if (max >= _tileId) _tileId = max + 1;
  }
  return _tileId;
}

function createDeck(state) {
  /* 106 taş tek seferde üretilir; her taş için canlı durumu taramak
     gereksiz (O(n²)) — sayaç bir kez ileri sarılır, gerisi ardışıktır. */
  if (state) nextTileId(state);
  const deck = [];
  for (const color of COLORS)
    for (let n = 1; n <= 13; n++)
      for (let copy = 0; copy < 2; copy++)
        deck.push({ id: ++_tileId, color, number: n });
  // Sahte okey (klasik 101): okey hangi taşsa (örn. Kırmızı 5), sahte okeyler
  // yalnızca NORMAL bir Kırmızı 5 gibi oynanır — joker DEĞİLDİR. Gerçek
  // Kırmızı 5'ler ise okeydir (her taşın yerine geçer). Kimlikleri raund
  // başında o stage'in okeyine göre atanır (_startRound).
  for (let copy = 0; copy < 2; copy++)
    deck.push({ id: ++_tileId, color: 'red', number: 1, fakeOkey: true });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const colorIdx = (c) => COLORS.indexOf(c);

/* ---------- Kombinasyon kuralları (GDD 3.2–3.4, 2.9) ---------- */

/* PLAYTEST 9 · GRUP O — MEDUSA'NIN TAŞLAŞTIRDIĞI TAŞLAR RENK OLARAK WILD.
   GDD 11: Medusa bir taşı "taşa çevirir" — taşın SAYISI kalır ama artık
   bir rengi yoktur (gri taş). Kodda `stoned` yalnız işlek muafiyeti +
   çarpan olarak işleniyordu, kombinasyon kuralları taşın ESKİ rengini
   okumaya devam ediyordu — yani taşlaşan taş hâlâ renk kısıtlıydı (bug).
   Artık üç kuralın da renk denetiminde taşlaşmış taşlar ATLANIR; sayı
   denetimi (per'de aynı sayı, sıralıda ardışıklık, çiftte eşitlik) aynen
   uygulanır. Terzi/Tercüman muafiyetinden farkı: bu muafiyet TAŞA ait,
   jokere değil, o yüzden freeColors parametresinden bağımsızdır. */
/* RENK YERİNİ SERBESTÇE DOLDURAN TAŞLAR.
   İki kaynağı var ve ikisi de aynı kapıdan geçer:
     · taşlaşmış taş (Grup O) — renksizleşir;
     · SU TAŞI (kullanıcı kararı 2026-09-06) — "su şeklini alır": girdiği
       kombinasyonda rengi umursanmaz, SAYISI aynen geçerlidir.
   Kural yalnız RENK DENETİMİNİ kaldırır; taş hâlâ gerçek bir renge sahiptir
   ve renk sayan jokerler (Renk Ustası, Renkli Dünya, Tek Renk Ruhu) onu
   kendi renginde görür — taşlaşmış taşta da bugün böyledir. */
/* PLAYTEST 29 · GRUP L — BUKALEMUN ÜÇÜNCÜ KAYNAK OLDU (kullanıcı kararı
   2026-09-12). Eski hâli ("seçtiği renkteki taşlar Per'de renk kuralına
   takılmaz") Tercüman'ın ("Per açılımında renk kuralı geçersiz") dar bir
   kopyasıydı; iki Rare aynı satırı paylaşıyordu.
   Yeni hâli renk muafiyetini PER'DEN ÇIKARIP HER KOMBİNASYONA yayar:
   seçilen renkteki taş artık renksiz sayılır, yani farklı renkten bir
   Sıralı'nın arasına girebilir ya da farklı renkten aynı sayıyla Çift
   kurabilir. Tercüman'la kalan tek ortak nokta Per'dir ve orada bile
   kapsam farklıdır (Tercüman tüm renkleri serbest bırakır, Bukalemun
   yalnız kendi rengini).
   Uygulama tek kapıdan geçer: taş `isColorWild` sayılır. Böylece Per,
   Çift, Sıralı ve öneri/çözümleme yolları AYNI kuralı okur — üç ayrı
   yerde üç ayrı muafiyet yazmaya gerek kalmaz. */
function bukalemunColor() {
  const s = (typeof Game !== 'undefined' && Game.state) || null;
  if (!s || s.jokersDisabled || !Array.isArray(s.jokers)) return null;
  for (const j of s.jokers) {
    if (j.key === 'terzi' && j.color) return j.color;
    if (j.fused) for (const f of j.fused) if (f.key === 'terzi' && f.color) return f.color;
  }
  return null;
}
const isColorWild = (t) => {
  if (!t) return false;
  if (t.stoned || t.special === 'yankiTasi') return true;
  return !!t.color && t.color === bukalemunColor();
};

function isCift(tiles) {
  if (tiles.length !== 2) return false;
  if (tiles[0].number !== tiles[1].number) return false;
  // Grup O: taraflardan biri taşlaşmışsa renk eşleşmesi aranmaz
  if (isColorWild(tiles[0]) || isColorWild(tiles[1])) return true;
  return tiles[0].color === tiles[1].color;
}

/* freeColors: true → renk kuralı tamamen kalkar (Tercüman);
   renk adı (string) → yalnız o renkteki taşlar kuraldan muaf (Terzi) */
function perColorsOk(tiles, freeColors) {
  if (freeColors === true) return true;
  // Grup O: taşlaşmış taşlar renk yerini serbestçe doldurur → denetim dışı
  const base = tiles.filter(t => !isColorWild(t));
  const rest = typeof freeColors === 'string' ? base.filter(t => t.color !== freeColors) : base;
  return new Set(rest.map(t => t.color)).size === rest.length;
}

function isPer(tiles, freeColors) {
  if (tiles.length < 3 || tiles.length > 4) return false;
  const n = tiles[0].number;
  if (!tiles.every(t => t.number === n)) return false;
  return perColorsOk(tiles, freeColors);
}

/* Madde 23 (tasarım kararı, 2026-07): Sıralı için GDD'deki 5 taş üst
   sınırı kaldırıldı — wrap-around olmadan (13'ten 1'e dönmeden) elde
   olan kadar uzun ardışık dizi açılabilir (doğal maks 13). */
function isSirali(tiles) {
  if (tiles.length < 3 || tiles.length > 13) return false;
  // Grup O: taşlaşmış taşlar dizinin rengine uyum sağlar (renksizdirler)
  const colored = tiles.filter(t => !isColorWild(t));
  if (colored.length) {
    const c = colored[0].color;
    if (!colored.every(t => t.color === c)) return false;
  }
  const nums = tiles.map(t => t.number).sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++)
    if (nums[i] !== nums[i - 1] + 1) return false;
  return true;
}

function detectCombo(tiles) {
  if (isCift(tiles)) return 'cift';
  if (isPer(tiles)) return 'per';
  if (isSirali(tiles)) return 'sirali';
  return null;
}

/* GRUP A (Playtest 7) — SIRALI'DA OKEY'İN DEĞERİNİ KONUM BELİRLER
   Sorun: 11-12'nin yanına okey konduğunda resolveCombo geçerli pencerelerin
   EN KÜÇÜĞÜNÜ seçiyordu → okey hep "10" oluyordu, oyuncu sağa koyup "13"
   istese bile. Artık taşlar fiziksel konumlarına (ıstaka slot'u) göre dizilir
   ve her GERÇEK taş için  start = sayı − indeks  hesaplanır. Tüm gerçek
   taşlar aynı start'ta anlaşıyorsa dizinin başlangıcı odur; okey de bulunduğu
   hücrenin gerektirdiği boşluğa oturur:
     [11][12][okey] → start 11 → okey 13
     [okey][11][12] → start 10 → okey 10
   Anlaşmazlık varsa (ıstaka dağınık, konum bilgisi yok) null döner ve eski
   davranışa — en küçük geçerli pencere — düşülür. */
function siraliStartByPosition(tiles, isOkeyFn, posOf) {
  if (typeof posOf !== 'function') return null;
  const seen = new Set();
  for (const t of tiles) {
    const p = posOf(t);
    if (typeof p !== 'number' || !isFinite(p) || seen.has(p)) return null;
    seen.add(p);
  }
  const ordered = [...tiles].sort((a, b) => posOf(a) - posOf(b));
  let start = null;
  for (let i = 0; i < ordered.length; i++) {
    const t = ordered[i];
    if (isOkeyFn(t)) continue;
    const st = t.number - i;
    if (start == null) start = st;
    else if (start !== st) return null; // konum dizilişi ardışık değil
  }
  return start;
}

/* Okey (wild) destekli çözümleme — {type, values: Map(id→değer), usedOkey} | null
   Önce taşlar oldukları gibi denenir (okey kendisi olarak da oynanabilir, GDD 2.9).
   opts: { posOf(tile)→sayı  · konum bilgisi (Grup A)
           forceStart        · sıralı dizinin başlangıcını zorla (UI seçimi) } */
function resolveCombo(tiles, isOkeyFn, freePerColors, opts) {
  const asIs = isCift(tiles) ? 'cift' : isPer(tiles, freePerColors) ? 'per' : isSirali(tiles) ? 'sirali' : null;
  if (asIs) {
    const values = new Map(tiles.map(t => [t.id, t.number]));
    return { type: asIs, values, usedOkey: false };
  }
  const okeys = tiles.filter(isOkeyFn);
  const others = tiles.filter(t => !isOkeyFn(t));
  const k = okeys.length;
  if (k === 0) return null;

  /* P36 · Grup B — YALNIZ OKEYDEN OLUŞAN AÇILIM. Kağıt her raund 2, Okey
     Mührü kalıcı okey ekler; elde 3+ okey birikebiliyor ve [okey][okey][okey]
     "kurallara uymuyor" diye reddediliyordu (her dal en az bir gerçek taş
     arıyordu). Okey her taşın yerine geçebildiği için en değerli yorum
     seçilir: 3-4 okey → 13'lük Per, 5+ okey → 13'te biten Sıralı. */
  if (others.length === 0 && k >= 3 && k <= 13) {
    if (k <= 4)
      return { type: 'per', values: new Map(tiles.map(t => [t.id, 13])), usedOkey: true };
    const start = 13 - k + 1;
    const ordered = typeof opts?.posOf === 'function'
      ? [...tiles].sort((a, b) => opts.posOf(a) - opts.posOf(b)) : tiles;
    return { type: 'sirali', values: new Map(ordered.map((t, i) => [t.id, start + i])),
      usedOkey: true, altStarts: [start], start };
  }

  // Çift: 1 okey + 1 taş → okey o taşı aynalar
  if (tiles.length === 2 && k >= 1 && others.length >= 1) {
    const v = others[0].number;
    return { type: 'cift', values: new Map(tiles.map(t => [t.id, v])), usedOkey: true };
  }
  // Per: kalanlar aynı sayı (+renk kuralı), okeyler eksik renkleri doldurur
  if (tiles.length >= 3 && tiles.length <= 4 && others.length >= 1) {
    const n = others[0].number;
    const sameNum = others.every(t => t.number === n);
    const colorOk = perColorsOk(others, freePerColors);
    if (sameNum && colorOk)
      return { type: 'per', values: new Map(tiles.map(t => [t.id, n])), usedOkey: true };
  }
  // Sıralı: kalanlar aynı renk; okeyler ardışık penceredeki boşlukları doldurur
  if (tiles.length >= 3 && tiles.length <= 13 && others.length >= 1) {
    // Grup O: renk denetimi taşlaşmış taşları atlar
    const coloredOthers = others.filter(t => !isColorWild(t));
    const c = (coloredOthers[0] || others[0]).color;
    if (coloredOthers.every(t => t.color === c)) {
      const nums = others.map(t => t.number);
      if (new Set(nums).size === nums.length) {
        const L = tiles.length, mn = Math.min(...nums), mx = Math.max(...nums);
        const starts = [];
        for (let start = Math.max(1, mx - L + 1); start <= Math.min(mn, 13 - L + 1); start++) {
          const win = [];
          for (let i = 0; i < L; i++) win.push(start + i);
          if (nums.every(n => win.includes(n))) starts.push(start);
        }
        if (starts.length) {
          /* Grup A: hangi pencerenin seçileceğini oyuncunun yerleşimi belirler.
             Öncelik: açık istek (forceStart) → fiziksel konum → en küçük. */
          const posStart = siraliStartByPosition(tiles, isOkeyFn, opts?.posOf);
          const start =
            (opts?.forceStart != null && starts.includes(opts.forceStart)) ? opts.forceStart
            : (posStart != null && starts.includes(posStart)) ? posStart
            : starts[0];
          const win = [];
          for (let i = 0; i < L; i++) win.push(start + i);
          const missing = win.filter(n => !nums.includes(n));
          const values = new Map();
          /* Birden fazla okey varsa eksik değerler de KONUM sırasına göre
             dağıtılır ([okey][11][12][okey] → 10 ve 13, karışmaz). */
          const order = posStart != null
            ? [...tiles].sort((a, b) => opts.posOf(a) - opts.posOf(b))
            : tiles;
          let mi = 0;
          for (const t of order) values.set(t.id, isOkeyFn(t) ? missing[mi++] : t.number);
          return { type: 'sirali', values, usedOkey: true, altStarts: starts, start };
        }
      }
    }
  }
  return null;
}

/* Kombinasyon içi GÖRSEL sıralama (Grup E, Playtest 6)
   Sorun: kombinasyonun taşları oyuncunun SEÇİM SIRASINDA duruyordu; okey
   (ya da herhangi bir wild) rastgele bir yerde görünüyor, "hangi taşın
   yerine geçti" anlaşılmıyordu (örn. 5-6-7'de 6 yerine okey kullanıldığında
   okey en sonda duruyordu).
   Çözüm: taşlar, resolveCombo'nun ATADIĞI DEĞERE göre dizilir — okey de
   yerine geçtiği taşın olması gereken sırada durur.
     · sirali → atanan sayıya göre artan
     · per    → renk sırasına göre; okey doldurduğu eksik rengin yerinde
     · cift   → gerçek taş önce, aynalayan okey sonra
   values Map'i bozulmaz, yalnız dizi sırası değişir. */
function orderComboTiles(type, tiles, values, isOkeyFn) {
  const val = (t) => values?.get(t.id) ?? t.number;
  if (type === 'sirali')
    return [...tiles].sort((a, b) => val(a) - val(b));
  if (type === 'cift')
    return [...tiles].sort((a, b) => (isOkeyFn(a) ? 1 : 0) - (isOkeyFn(b) ? 1 : 0));
  if (type === 'per') {
    // Gerçek taşlar renk sırasına girer; okeyler kullanılmayan renklerin
    // yerine oturtulur ki Per de renk sırasında okunsun.
    const reals = tiles.filter(t => !isOkeyFn(t));
    const okeys = tiles.filter(isOkeyFn);
    const used = new Set(reals.map(t => t.color));
    const free = COLORS.filter(c => !used.has(c));
    const slots = reals.map(t => ({ t, ci: colorIdx(t.color) }));
    okeys.forEach((t, i) => {
      // eksik renk kalmadıysa (Terzi/Tercüman muafiyeti) sona ekle
      const c = free[i];
      slots.push({ t, ci: c != null ? colorIdx(c) : COLORS.length + i });
    });
    return slots.sort((a, b) => a.ci - b.ci).map(x => x.t);
  }
  return tiles;
}

/* ---------- Akıllı sıralama (GDD 2.4) ---------- */

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function sortPer(hand) {
  const byNum = groupBy(hand, t => t.number);
  const front = [], rest = [];
  for (const num of [...byNum.keys()].sort((a, b) => a - b)) {
    let tiles = [...byNum.get(num)];
    while (true) {
      const seen = new Set(), pick = [];
      for (const t of tiles) if (!seen.has(t.color)) { seen.add(t.color); pick.push(t); }
      if (pick.length < 3) break;
      pick.sort((a, b) => colorIdx(a.color) - colorIdx(b.color));
      front.push(...pick);
      tiles = tiles.filter(t => !pick.includes(t));
    }
    rest.push(...tiles);
  }
  rest.sort((a, b) => a.number - b.number || colorIdx(a.color) - colorIdx(b.color));
  return [...front, ...rest];
}

function sortCift(hand) {
  const byKey = groupBy(hand, t => t.color + ':' + t.number);
  const entries = [...byKey.values()]
    .sort((a, b) => a[0].number - b[0].number || colorIdx(a[0].color) - colorIdx(b[0].color));
  const front = [], rest = [];
  for (const tiles of entries) {
    const arr = [...tiles];
    while (arr.length >= 2) front.push(arr.pop(), arr.pop());
    rest.push(...arr);
  }
  rest.sort((a, b) => a.number - b.number || colorIdx(a.color) - colorIdx(b.color));
  return [...front, ...rest];
}

function sortSirali(hand) {
  const front = [], rest = [];
  for (const color of COLORS) {
    const byNum = groupBy(hand.filter(t => t.color === color), t => t.number);
    const nums = [...byNum.keys()].sort((a, b) => a - b);
    let run = [];
    const flush = () => {
      if (run.length >= 3)
        for (const n of run) front.push(byNum.get(n).shift());
      run = [];
    };
    for (const n of nums) {
      if (run.length && n !== run[run.length - 1] + 1) flush();
      run.push(n);
    }
    flush();
    for (const arr of byNum.values()) rest.push(...arr);
  }
  rest.sort((a, b) => colorIdx(a.color) - colorIdx(b.color) || a.number - b.number);
  return [...front, ...rest];
}

/* ---------- Puanlama (GDD 4.1–4.3) ---------- */

const round2 = (x) => Math.round(x * 100) / 100;

function getCarpan(mode, comboCount, permMult) {
  const idx = Math.min(Math.max(comboCount, 1), 7) - 1;
  /* PLAYTEST 17 — SAVUNMA: bilinmeyen/boş mod tüm ekranı çökertmesin.
     `turnMode` normal akışta stageCombo'da mutlaka yazılır; ama bir
     kayıttan dönüşte ya da bir yan yoldan boş kalırsa `CARPAN_TABLE[mode]`
     undefined olur ve `previewScore` → `render()` zinciri TypeError ile
     kırılırdı: oyun ekranı tamamen çizilmez hâle geliyordu. Bilinmeyen mod
     artık "per" tablosuna düşer (çift dışı varsayılan), oyun akmaya devam
     eder. */
  const table = CARPAN_TABLE[mode] || CARPAN_TABLE.per;
  return round2(table[idx] + (permMult || 0));
}

function ceilMul(raw, carpan) {
  return Math.ceil(Math.round(raw * carpan * 1000) / 1000);
}

function computeScore(tiles, carpan) {
  const raw = tiles.reduce((s, t) => s + t.number, 0);
  return { raw, final: ceilMul(raw, carpan) };
}

/* ---------- Oyun durumu ---------- */

const Game = {
  state: null,
  rng: Math.random,        // genel rastgelelik (test için değiştirilebilir)
  rngIslek: Math.random,   // işlek zarı (test için değiştirilebilir)
  tutorialMode: false,     // öğretici: hedefler ×0.5, UI akışı TUT yönetir
  trainerMode: false,      // Grup H (2026-08): sandbox test modu — kayıt yok

  /* MADDE D4: `mode` verilmezse temel run. Bilinmeyen bir anahtar gelirse
     sessizce temel run'a düşülür — eski kayıtlar ve eski çağrılar için. */
  newRun(mode) {
    this.trainerMode = false;
    const rm = RUN_MODES[mode] ? mode : 'base';
    /* MADDE D — modun AÇILIŞ GÜCÜ. İki alan da run'ın BAŞLANGIÇ
       değerini kurar; yükseltmeler (Geniş Istaka, Altın Oran…) bunların
       ÜSTÜNE eklenir, yani mod bonusu bir tavan değil bir tabandır. */
    const rmDef = RUN_MODES[rm];
    this.state = {
      runMode: rm,          // MADDE D4 — run modu anahtarı
      stage: 1,
      roundInStage: 1,
      permMult: rmDef.startPermMult || 0,
      permDraw: 0,          // GDD 5.3 yükseltmesi — kalıcı +1 taş çekme hakkı (madde 24)
      permTurns: 0,         // Uzun Soluk yükseltmesi: raund başına kalıcı +1 tur
      /* GRUP I (P20) — yeni stage sonu güçlendirmelerinin kalıcı alanları */
      permRawBonus: 0,      // Altın Damar: ham puana kalıcı yüzde
      permComboBonus: 0,    // Bileme Taşı: 2+ kombinasyonlu turlarda çarpan
      sellFull: false,      // Sigorta Poliçesi: satış = alış fiyatı
      secondChance: 0,      // İkinci Şans: kalan kullanım (0 veya 1)
      /* GRUP E (P22) — İkinci Şans RUN BOYUNCA BİR KEZ TEKLİF EDİLİR.
         Eskiden tek bekçi `secondChance >= 1` idi; hak KULLANILINCA o
         sayaç 0'a düştüğü için güçlendirme çarka geri giriyor ve aynı run
         içinde ikinci, üçüncü kez kazanılabiliyordu. Bu bayrak bir kez
         `true` olur ve bir daha sıfırlanmaz. */
      secondChanceTaken: false,
      permHandBonus: rmDef.handBonus || 0,  // Grup H (Geniş Istaka) + MADDE D (mod tabanı)
      permCoin: 0,          // Grup H — Coin Kasası (+2 coin/raund)
      permIslekReduce: 0,   // Grup H — Nazar Boncuğu (işlek -%5)
      cheatBank: 0,         // (eski çarpan birikimi — kayıt uyumu)
      /* GRUP G (P20) — çalınan taşlar. Joker yakalanınca hepsi desteye
         geri döner, bu yüzden id'leriyle takip edilir (bkz. taş kimliği
         kuralı: değere göre takip çoğalma/kaybolma üretir). */
      cheatStolen: [],      // joker: eline çalınan taşların id'leri
      bossCheatTook: 0,     // boss: bu raundda kaç taş çaldı
      cheatFlash: [],       // Grup G (P19) — UI'ın büyük bildirimini çizeceği hile olayı KUYRUĞU
                            //   (kuyruk, çünkü tek bir discard() hem boss'un tur sonu
                            //    çözümünü hem jokerin yeni tur atışını içerebilir)
      bossCheatPlan: null,  // Grup G (P19) — boss'un bu tur DUYURDUĞU hile
      bossCheatStats: null, // Grup G (P19) — { tries, hits } — banner sayacı
      carpanStep: 0,        // (eski) Altın Oran/Usta Eli basamağı — yalnız eski kayıtlar için
      altinOranCount: 0,    // Grup B (P18) — Altın Oran kaç kez kullanıldı (tavan ALTIN_ORAN_MAX)
      carpanScale: 0,       // Grup E — Usta Eli (kombinasyon sayısı 2 kat sayılır)
      consumSlotBonus: 0,   // Grup D (P8) — Heybe: tüketilebilir envanteri büyütür
      permTargetCut: 0,     // Grup D (P8) — Derin Nefes (altinCanak): hedef puanlar kalıcı düşer
      /* FERMAN (P28 · Grup F) — `fermanUsed` RUN boyunca sayar (tavan
         FERMAN_MAX), `fermanPending` yazılmış ama henüz işlememiş fermanı
         taşır, `bossVoided` ise YALNIZ o raundluktur (raund başında
         sıfırlanır, boss kurulumu atlanınca kurulur). */
      fermanUsed: 0,
      fermanPending: false,
      bossVoided: false,
      extraShopSlots: 0,    // Grup H — Eskici Rafı (+1 joker rafı, tavan 4)
      extraRowSlots: 0,     // Eskici Rafı — değnek/paket rafı büyümesi (tavan 5)
      slotBonus: 0,         // Grup L — Tacir Mektubu (+1 ana joker slotu)
      upgradeOffer: null,   // Grup H — boss sonrası seçim ekranı
      /* MADDE E4-a (kullanıcı kararı 2026-09-09): başlangıç coini 0 → 10.
         Run eskiden sıfır coinle başlıyordu; ilk store'a ancak R1'i
         kazanarak (~13 coin) girilebiliyordu. 10 coin ilk store'da 2
         Common ya da 1 Rare demek. Ölçüm Stage 1-2'de ekonomik sıkışma
         OLMADIĞINI gösteriyor (karşılama oranı 1.72/1.40), yani bu bir
         denge düzeltmesi değil AÇILIŞ YASTIĞIDIR. */
      coins: START_COINS,
      catchUpStage: 0,      // MADDE E2 — catch-up rafının tetiklendiği stage
      catchUpAt: -1,        // MADDE E2 — tetiklendiği store (stage*10+raund)
      bonds: 0,             // MADDE E9 — satın alınan tahvil sayısı (tavan BOND_MAX)
      jokers: [],
      backup: [],           // GDD 7.4 — Backup Slot (maks 2, dondurulmuş)
      consumables: [],      // GDD 6.5b — envanter (maks 3, run boyunca taşınır)
      storeTilePick: null,  // P29 · Grup O — store'da sunulan 10 taş
      tileMods: [],         // Grup K — tüketilebilirlerin kalıcı deste değişiklikleri
      specialTiles: [],     // GDD 6.5c — desteye kalıcı eklenen özel normal taşlar
      magnets: [],          // Grup H (P28) — Mıknatıs: her raund ele çekilen taşlar
      deckJokers: [],       // GDD 10 — deste jokerleri (eline gelince aktifleşir)
      reviveTiles: [],      // (eski Frankenstein alanı — kayıt uyumu için duruyor)
      paratonerBait: null,  // P29 · Grup F — Paratoner: bu turun yem taşı (id)
      teraziUsed: false,    // Grup C — Terazi: bu turda feda hakkı kullanıldı mı
      teraziMult: 0,        // (eski alan — kayıt uyumu; artık kullanılmıyor)
      /* GRUP A (P20) — hafif taş fedası RAUND boyu birikir, ağır taş fedası
         SONRAKİ TURUN işlek riskini artırır. */
      teraziRoundMult: 0,   // hafif fedalardan biriken çarpan (raund boyu)
      teraziTurnGain: null, // P29 · Grup J — bu turda kazanılan feda bonusu
      teraziIslekNext: 0,   // (eski alan — P29 · Grup J'den beri kullanılmıyor)
      teraziIslekTurn: 0,   // (eski alan — P29 · Grup J'den beri kullanılmıyor)
      /* GRUP D (P20) — Trade Jokeri "Borsa" */
      borsa: null,          // { up: 'per'|'sirali'|'cift', down: ..., flat: ... }
      borsaMelds: 0,        // (eski alan — P29 · Grup H'den beri kullanılmıyor, kayıt uyumu)
      umutRunUsed: false,   // P30 · Grup H — Pandora·Umut kurtarması RUN boyunca 1 kez
      ipotekDebt: false,    // P30 · Grup G — İpotek: sonraki raundun başında -2 tur borcu
      ipotekPayRound: null, // P30 · Grup G — borcun ödendiği raund (o raund kullanılamaz)
      graveTiles: [],       // Frankenstein — bu raund atılan taşlar (mezarlık)
      promDebt: 0,          // Ateş Tüccarı (eski Prometheus alanı) — sonraki raundun işlek borcu
      store: null,
      pendingLocks: null,   // kilitli store ürünleri sonraki store'a taşınır
      lastExpired: [],
      winStreak: 0,
      nextTargetMult: 1,
      permTargetUp: 0,      // P31 · Grup A — The World bedeli: hedefler run boyunca kalıcı artar
      islekPermBonus: 0,    // Ayna Kırığı kalıntısı
      worldUsed: false,
      gossipTable: [],      // Grup F — Dedikodu Masası: 3 açık taş
      gossipSwapUsed: false,
      fuzyonPending: null,  // Grup F/23 — alınmış ama henüz kullanılmamış Füzyon
      runFinished: false,   // Grup M — son boss geçildi, store açılmayacak
      roundsWon: 0, bossesBeaten: 0, totalScore: 0,
      /* MADDE D3 — run sonu özeti sayaçları. Bunlar YALNIZ raporlama
         içindir, hiçbir kural okumaz; oyuncunun "nerede kaybettim"
         sorusuna cevap verirler ve denge ölçümünün gerçek oyuncudan
         gelen tek kaynağıdır (şu ana kadar yalnız bot simülasyonu vardı). */
      statCoinIn: 0,        // run boyunca kazanılan toplam coin
      statCoinOut: 0,       // run boyunca harcanan toplam coin
      statExpired: 0,       // süresi dolarak kaybedilen joker sayısı
      statBestMeld: 0,      // en yüksek tekli açılım puanı
      status: 'playing',
    };
    this.state.okey = this._rollOkey();
    this.state.bossOrder = this._rollBossOrder();
    /* MADDE D4 — açılış çarkı: modun `openJokers` kadar joker verir.
       Sonuçlar BURADA belirlenir (kayıt/geri yükleme güvenli); UI onları
       `s.openingJokers` üzerinden çark animasyonuyla gösterir. */
    this._grantOpeningJokers();
    this._startRound();
  },

  /* MADDE D4 — run açılış jokerleri (yalnız `openJokers > 0` olan modlarda).
     Mythic ve Epic HARİÇTİR: Epic yalnız boss ödülüdür (GDD 13.3), Mythic
     ise tek raundluk patlama kartlarıdır — run'ın ilk raundunda verilmesi
     hem israf hem de açılış varyansını uçurur. */
  _grantOpeningJokers() {
    const s = this.state;
    const m = runModeOf(s);
    s.openingJokers = null;
    s.openingReels = null;
    if (!m.openJokers) return;
    const got = [];
    const taken = new Set();
    for (let i = 0; i < m.openJokers; i++) {
      const rarity = this._weightedRarity(m.openRarity);
      let cand = this.jokerPool(d => d.rarity === rarity && !taken.has(d.key));
      if (!cand.length) cand = this.jokerPool(d => d.rarity !== 'epic'
        && d.rarity !== 'mythic' && !taken.has(d.key));
      if (!cand.length) break;
      const def = cand[Math.floor(this.rng() * cand.length)];
      taken.add(def.key);
      const j = this._initJoker({ id: ++_jokerId, key: def.key, name: def.name,
        desc: def.desc, rarity, usesLeft: this._usesFor(def, rarity), fresh: true });
      if (def.mech === 'deck') s.deckJokers.push(j);
      else s.jokers.push(j);
      got.push({ type: 'joker', key: def.key, name: def.name, desc: def.desc, rarity,
        jokerId: j.id, placed: def.mech === 'deck' ? 'deck' : 'slot' });
    }
    s.openingJokers = got;
    /* PLAYTEST 26 · MADDE D (kullanıcı kararı 2026-09-09) — AÇILIŞ ARTIK
       GERÇEK BİR SLOT ÇARKI. Sonuç yine BURADA kesinleşir (kayıt/geri
       yükleme güvenliği bozulmasın diye), UI yalnız çeviriyor: her ödül
       için `_packReel` ile aynı biçimde bir sahte sembol şeridi üretilir,
       ŞERİDİN SON ELEMANI kazanandır. Böylece açılış ritüeli store'daki
       paket çarkıyla BİREBİR aynı dili konuşur — oyuncu daha önce
       öğrendiği okumayı burada da kullanır. */
    s.openingReels = got.map(w => this._openingReel(m, w));
  },

  /* Açılış çarkının sahte sembolleri: modun kendi nadirlik dağılımından
     çekilir (yani şeritte gördüğün her yüz, gerçekten çıkabilecek bir
     karttır — çark yalan söylemez). */
  _openingReel(mode, winner) {
    const strip = [];
    for (let i = 0; i < PACK_REEL_LEN - 1; i++) {
      const rarity = this._weightedRarity(mode.openRarity);
      const cand = this.jokerPool(d => d.rarity === rarity);
      const def = cand.length ? cand[Math.floor(this.rng() * cand.length)] : null;
      strip.push(def ? { type: 'joker', key: def.key, name: def.name, desc: def.desc, rarity }
        : winner);
    }
    strip.push(winner);
    return strip;
  },

  /* Ağırlık sözlüğünden ({common: 0.33, ...}) rarity çeker. */
  _weightedRarity(w) {
    const keys = Object.keys(w || {});
    if (!keys.length) return 'common';
    const total = keys.reduce((a, k) => a + w[k], 0);
    let roll = this.rng() * total;
    for (const k of keys) { roll -= w[k]; if (roll <= 0) return k; }
    return keys[keys.length - 1];
  },

  /* PLAYTEST 17 · GRUP C — STAGE'E GÖRE AĞIRLIKLI BOSS SIRASI.
     Run başında her stage için BİR boss seçilir (tekrar yok). Seçim,
     o stage'in kademe ağırlıklarından (BOSS_STAGE_WEIGHTS) bir kademe
     çekip o kademenin kalan adaylarından rastgele bir boss almaktır.
     Kademe tükendiyse önce KOMŞU kademelere, en son tüm kalanlara
     düşülür — böylece sıra her koşulda 8 farklı bossla dolar. */
  _rollBossOrder() {
    const remaining = [...BOSSES];
    const order = [];
    const takeFrom = (tier) => {
      const cand = remaining.filter(b => (BOSS_TIER[b.key] || 2) === tier);
      if (!cand.length) return null;
      const pick = cand[Math.floor(this.rng() * cand.length)];
      remaining.splice(remaining.indexOf(pick), 1);
      return pick;
    };
    /* MADDE D4 — ZORLUK KONUMU MODA GÖRE ÖLÇEKLENİR.
       BOSS_STAGE_WEIGHTS 8 stage'e göre yazılmıştır. Hızlı Run 4 stage
       olduğu için tabloyu düz okusaydık yalnız ilk 4 satır kullanılır,
       yani oyuncu FİNAL BOSS olarak orta kademe bir boss görürdü.
       Bunun yerine stage, 8'lik eğrideki karşılığına eşlenir:
       4 stage → 2, 4, 6, 8. Böylece kısa run da kademeli olarak
       sertleşir ve finalinde gerçek bir geç-oyun boss'u çıkar. */
    const nStages = runModeOf(this.state).stages || TOTAL_STAGES;
    for (let stage = 1; stage <= nStages; stage++) {
      /* MADDE D — eşleme formülü artık `curveStage`de tek yerde durur;
         store nadirlik eğrisi de aynı kuralı okur (iki tablo ayrışmasın). */
      const pos = Math.round(stage * TOTAL_STAGES / nStages);
      const w = BOSS_STAGE_WEIGHTS[Math.min(pos, BOSS_STAGE_WEIGHTS.length) - 1];
      // ağırlıklı kademe kurası
      const bag = [];
      for (const tier in w) for (let i = 0; i < w[tier]; i++) bag.push(Number(tier));
      let boss = null;
      const tried = new Set();
      while (bag.length && !boss) {
        const tier = bag.splice(Math.floor(this.rng() * bag.length), 1)[0];
        if (tried.has(tier)) continue;
        tried.add(tier);
        boss = takeFrom(tier);
      }
      // kademe tükendi: önce yakın kademeler, sonra ne kalırsa
      if (!boss) {
        const base = Number(Object.keys(w)[0]);
        for (const t of [base, base - 1, base + 1, 1, 2, 3]) {
          boss = takeFrom(t);
          if (boss) break;
        }
      }
      if (!boss) boss = remaining.shift();
      if (boss) order.push(boss);
    }
    return order;
  },

  _rollOkey() {
    /* GDD 2.9 — her stage başında rastgele sayı+renk ilan edilir.
       Grup K (Playtest 6): Trainer modunda okey elle sabitlenebilir
       (trainerOkey); seçim yoksa davranış aynen rastgele kalır. */
    const fixed = this.trainerMode ? this.state?.trainerOkey : null;
    if (fixed && COLORS.includes(fixed.color) && fixed.number >= 1 && fixed.number <= 13)
      return { color: fixed.color, number: fixed.number };
    return {
      color: COLORS[Math.floor(this.rng() * 4)],
      number: 1 + Math.floor(this.rng() * 13),
    };
  },

  /* Trainer: stage okeyini elle sabitle / serbest bırak (Grup K).
     color+number verilirse o kombinasyon her stage'de geçerli olur;
     null gönderilirse rastgele belirlemeye geri dönülür. */
  setTrainerOkey(color, number) {
    if (!this.trainerMode) return { ok: false, error: 'Yalnız Trainer modunda.' };
    const s = this.state;
    if (color == null) {
      s.trainerOkey = null;
      s.okey = this._rollOkey();
      this._startRound(['🧪 Trainer: Okey Taşı yeniden rastgele belirleniyor']);
      return { ok: true, okey: s.okey, fixed: false };
    }
    const n = Math.floor(number);
    if (!COLORS.includes(color) || !(n >= 1 && n <= 13))
      return { ok: false, error: 'Geçersiz okey taşı.' };
    s.trainerOkey = { color, number: n };
    s.okey = { color, number: n };
    // raundu yeniden kur ki sahte okeyler ve isOkeyReal işaretleri uysun
    this._startRound([`🧪 Trainer: Okey Taşı ${COLOR_TR[color]} ${n} olarak sabitlendi`]);
    return { ok: true, okey: s.okey, fixed: true };
  },

  /* Okey = FİZİKSEL taş işareti (2026-08, Kara Kedi düzeltmesi).
     Eskiden renk+sayı kimliği anlık karşılaştırılıyordu; Kara Kedi boss'u
     13'leri 1'e çevirince (okey Siyah 1 iken) dönüşen taşlar yanlışlıkla
     okey sayılıyordu. Artık asıl okey taşları raund başında isOkeyReal ile
     işaretlenir: değer dönüşümleri (Kara Kedi, Sir.by...) okey YARATAMAZ,
     var olan okeyi de BOZAMAZ. */
  isOkeyTile(t) {
    if (t.fakeOkey) return false;                                        // Sahte okey joker DEĞİL — normal okey kopyası
    return !!t.isOkeyReal;
  },

  isBossRound() {
    return this.state.roundInStage === 3;
  },

  /* PLAYTEST 28 · GRUP F — BOSS KOŞULU AÇIK MI (Ferman kapısı).
     `isBossRound()` YAPISAL bir sorudur: "bu, stage'in 3. raundu mu?"
     Ödül dağıtımı, `bossesBeaten` sayacı, coin raporu ve haritanın/üst
     şeridin "BOSS" yazması ona bağlıdır ve Ferman bunların HİÇBİRİNİ
     değiştirmez — boss yenilmiş sayılır, Epic kartını verir.
     Değişen tek şey KOŞULUN İŞLEYİP İŞLEMEDİĞİDİR; bütün koşul
     kontrolleri bu kapıdan geçer. İkisini ayırmasaydık ferman yazan
     oyuncu boss ödülünü de kaybederdi.
     TEK İSTİSNA — The World jokeri (`worldUsed`): o da boss raunduna
     bağlıdır ama bir OYUNCU KAZANIMIDIR, boss koşulu değil; bilerek
     `isBossRound()` üzerinde bırakıldı. */
  bossOn() {
    return this.isBossRound() && !this.state.bossVoided;
  },

  /* Per renk kuralı esnekliği: yalnız Tercüman → tamamen serbest (true).
     P29 · Grup L: Bukalemun'un kolu BURADAN KALKTI. Seçilen renk artık
     taş düzeyinde renksiz sayılıyor (`isColorWild`), yani Per denetimi
     onu zaten kapsam dışı bırakıyor — burada ikinci bir yol tutmak aynı
     muafiyeti iki yerde tarif etmek olurdu. */
  _freePerColors() {
    return this.hasActive('tercuman') ? true : false;
  },

  /* Füzyon (GDD 9): slot jokerleri + içlerine erimiş alt kayıtlar (j.fused).
     Efekt aramaları bu listeyi kullanır — birleşik joker her iki kaynağın
     efektini de (durum alanları dahil: terzi.color, truva.revealed vb.) taşır. */
  slotRecs() {
    const out = [];
    const mute = this.state.crownMuteId;   // P31 · Grup H — taç farkı hesabı için geçici susturma
    for (const j of this.state.jokers) if (mute == null || j.id !== mute) out.push(...this._recsOf(j));
    return out;
  },

  /* CRIMSON KING (P31 · Grup H) — "açılımda bonus veren" joker anahtarları.
     Elle liste TUTULMAZ: `effect` tanımı olan kartlar + açılım puanlamasının
     (_calcOpening) okuduğu anahtarlar. Yeni bir açılım jokeri eklendiğinde
     kendiliğinden taç adayı olur. Sonuç bir kez hesaplanıp önbelleğe alınır. */
  _meldBonusKeys() {
    if (this._meldKeysCache) return this._meldKeysCache;
    const keys = new Set(Object.values(JOKER_DEFS).filter(d => d.effect).map(d => d.key));
    const src = String(this._calcOpening);
    for (const m of src.matchAll(/(?:j\.key === |hasActive\()'([A-Za-z]+)'/g))
      if (JOKER_DEFS[m[1]] && JOKER_DEFS[m[1]].mech !== 'deck') keys.add(m[1]);
    keys.delete('crimsonTac');
    this._meldKeysCache = keys;
    return keys;
  },

  /* Bir slot kaydının taşıdığı TÜM efekt kayıtları: kendisi + Vasiyet
     mirası (j.legacy, P30 · Grup F) + Füzyon alt kayıtları (j.fused) ve
     onların mirası (Vasiyet başka bir jokere eritildiyse miras alt kayıtta
     durur). */
  _recsOf(j) {
    const out = [j];
    if (j.legacy) out.push(...j.legacy);
    for (const f of (j.fused || [])) {
      out.push(f);
      if (f.legacy) out.push(...f.legacy);
    }
    return out;
  },

  hasActive(key) {
    return !this.state.jokersDisabled && this.slotRecs().some(j => j.key === key);
  },

  targetFor(stage, ric) {
    /* MADDE D4 — mod kendi hedef tablosunu getirebilir (Hızlı Run).
       Tablo dışına taşma kuralı (Trainer Sonsuz Mod) aynen korunur. */
    const tbl = runModeOf(this.state).targets || STAGE_TARGETS;
    const last = tbl.length;
    let base;
    if (stage <= last) base = tbl[stage - 1][ric - 1];
    else {
      const scale = Math.pow(TARGET_GROWTH, stage - last);
      base = Math.round(tbl[last - 1][ric - 1] * scale / 10) * 10;
    }
    // Derin Nefes (değnek, altinCanak) — run'ın kalanında tüm hedefler kalıcı düşer
    const cut = this.state?.permTargetCut || 0;
    if (cut) base = Math.max(10, Math.round(base * (1 - cut) / 5) * 5);
    /* The World (P31 · Grup A) — tetiklendiği andan run sonuna kadar tüm
       hedefler kalıcı +%10. Bir kerelik değil, çarpan gibi her hedefe. */
    const up = this.state?.permTargetUp || 0;
    return up ? Math.round(base * (1 + up) / 5) * 5 : base;
  },

  /* Tüketilebilir envanter kapasitesi — taban GDD 6.5b'deki 3, Heybe ile
     kalıcı olarak büyür (maks CONSUM_SLOT_MAX). */
  consumCap() {
    return Math.min(CONSUM_SLOT_MAX, MAX_CONSUMABLES + (this.state?.consumSlotBonus || 0));
  },

  /* PLAYTEST 9 · GRUP L — ANA SLOT KAPASİTESİ ARTIK DİNAMİK.
     Taban MAX_SLOTS (5); Tacir Mektubu tüketilebiliri `slotBonus` ile
     tavana (SLOT_BONUS_MAX) kadar büyütür. Kapasiteyi soran TÜM kod bunu
     kullanır — MAX_SLOTS'a doğrudan bakan yer kalmamalı. */
  slotCap() {
    return MAX_SLOTS + Math.min(SLOT_BONUS_MAX, this.state?.slotBonus || 0);
  },

  /* GRUP E (P22) — "elimde zaten Game Over'ı önleyen bir kart var mı?"
     Kurtarıcı zincirinin (bkz. discardAndDraw → Game Over dalı) joker
     ayağıyla BİREBİR aynı listedir; oradaki bir kart değişirse burası da
     değişmelidir. Ana Slot dışında Backup ve Deste de sayılır: ikisi de
     oyuncunun sahip olduğu kartlardır, biri sıra bekler diğeri desteye
     karışmıştır.
     ⚠ Pandora (truva) YALNIZ Umut'a dönüşmüşse sayılır: varyant kart ele
     gelene kadar belli olmaz, üçte bir ihtimalli bir olasılığa bakıp
     gerçek bir güvenlik ağını oyuncudan saklamak yanlış olurdu. */
  /* GRUP F (P22) — ÖZEL TAŞ KAYDI EKLEMENİN TEK KAPISI.
     Kara Delik Taşı KOPYA BAZINDA yoğunlaştığı için her kaydın kalıcı bir
     kimliği (`sid`) olmalı: desteye her raund YENİ bir taş nesnesi
     basılır (bkz. _startRound), o nesne `sid` ile kendi kaydına bağlanır.
     Kimliksiz takip değer bazlı olurdu ve iki aynı yüzlü kopya birbirinin
     yoğunluğunu okurdu. */
  /* Grup I: bir özel taş desteden kalkarken KAYDI da düşmeli, yoksa
     "destede kaç kopya var" sayacı şişer ve store o türü hiç göstermez. */
  _dropSpecialRecord(tile) {
    const s = this.state;
    if (!tile || !tile.special || !Array.isArray(s.specialTiles)) return false;
    const i = tile.sid != null
      ? s.specialTiles.findIndex(x => x.sid === tile.sid)
      : s.specialTiles.findIndex(x => x.kind === tile.special);
    if (i < 0) return false;
    s.specialTiles.splice(i, 1);
    return true;
  },

  _addSpecialTile(kind, color, number) {
    const s = this.state;
    s.spSeq = (s.spSeq || 0) + 1;
    const rec = { kind, color, number, sid: s.spSeq };
    s.specialTiles.push(rec);
    return rec;
  },

  /* ============================================================
     MIKNATIS (PLAYTEST 28 · GRUP H)
     Kayıt kimliği iki türlüdür ve bu bilinçlidir:
       · ÖZEL taş  → `sid` (kalıcı ve benzersiz, specialTiles ile aynı dil)
       · NORMAL taş → renk + sayı
     Normal taşın kalıcı bir kimliği YOKTUR — deste her raund sıfırdan
     kurulur (bkz. _startRound), tıpkı `tileMods`'un remove/add kayıtları
     gibi. Değer bazlı takibin tehlikesi (taş çoğalması/kaybolması) burada
     DOĞMAZ, çünkü mıknatıs taş ÜRETMEZ ya da SİLMEZ: yalnız var olan bir
     taşı desteden ele TAŞIR, sayılar sabit kalır.
     Belirsizliği tümden kapatmak için aynı renk+sayıdan İKİNCİ bir taşın
     mıknatıslanması engellenir (bkz. useConsumable) — böylece bir kaydın
     hangi taşa ait olduğu her zaman tektir ve Çekiç/Taç/Boya bir taşı
     dönüştürdüğünde kaydı doğru şekilde güncelleyebiliriz.
     ============================================================ */
  _magnetOf(tile) {
    const list = this.state?.magnets || [];
    if (tile.sid != null) return list.find(m => m.sid === tile.sid) || null;
    return list.find(m => m.sid == null
      && m.color === tile.color && m.number === tile.number) || null;
  },

  _dropMagnet(tile) {
    const s = this.state;
    const rec = this._magnetOf(tile);
    if (!rec) return false;
    s.magnets.splice(s.magnets.indexOf(rec), 1);
    return true;
  },

  /* Çekiç / Taç / Boya bir taşı kalıcı olarak dönüştürdüğünde kaydı da
     taşı: yoksa kayıt eski renk+sayıya bakmaya devam eder, o taş bir daha
     hiç bulunamaz ve 10 coinlik kart sessizce ölürdü. */
  _retuneMagnet(tile, oldColor, oldNumber) {
    const list = this.state?.magnets || [];
    const rec = tile.sid != null
      ? list.find(m => m.sid === tile.sid)
      : list.find(m => m.sid == null && m.color === oldColor && m.number === oldNumber);
    if (!rec) return false;
    rec.color = tile.color;
    rec.number = tile.number;
    return true;
  },

  /* Raund başında çalışır: mıknatıslı taşlar ele çekilir.
     TAKAS eder, kopyalamaz — elden rastgele bir taş desteye geri gider, yani
     el büyüklüğü de deste sayısı da değişmez (el bütünlüğü nöbetçisi bunu
     denetler). Taş ne elde ne destede bulunamıyorsa kayıt ÖLMÜŞTÜR (taş
     Ustura ile silinmiş ya da dönüşüp kaydı kaçırmış olabilir) ve düşürülür;
     ölü kayıt her raund boşuna aranmaz. */
  _applyMagnets(notes) {
    const s = this.state;
    if (!Array.isArray(s.magnets) || !s.magnets.length) return;
    const pulled = [];
    for (const rec of [...s.magnets]) {
      const match = (t) => (rec.sid != null
        ? t.sid === rec.sid
        : t.sid == null && t.color === rec.color && t.number === rec.number);
      const inHand = s.hand.find(match);
      if (inHand) { inHand.magnet = true; continue; }
      const di = s.deck.findIndex(match);
      if (di === -1) { s.magnets.splice(s.magnets.indexOf(rec), 1); continue; }
      const tile = s.deck.splice(di, 1)[0];
      tile.magnet = true;
      /* Yerine gidecek taş: elden MIKNATISLI OLMAYAN rastgele biri. Hepsi
         mıknatıslıysa (tavan 3 < el 15 olduğu için pratikte imkânsız) takas
         yapılmaz, taş desteye geri konur — el şişirilmez. */
      const cands = s.hand.map((t, i) => ({ t, i })).filter(x => !x.t.magnet);
      if (!cands.length) { s.deck.splice(di, 0, tile); continue; }
      const pick = cands[Math.floor(this.rng() * cands.length)];
      const out = s.hand.splice(pick.i, 1)[0];
      s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, out);
      s.hand.push(tile);
      pulled.push(`${COLOR_TR[tile.color]} ${tile.number}`);
    }
    if (pulled.length && notes)
      notes.push(`🧲 Mıknatıs: ${pulled.join(', ')} eline çekildi`);
  },

  /* Bir Kara Delik Taşı nesnesinin ŞU ANKİ puan değeri (taban + yoğunluk) */
  kdTasiValue(tile) {
    const rec = (this.state?.specialTiles || []).find(x => x.sid === tile.sid);
    return Math.min(KD_TASI_MAX, KD_TASI_BASE + ((rec && rec.kdGrow) || 0));
  },

  hasRescueJoker() {
    const s = this.state;
    if (!s) return false;
    return [...(s.jokers || []), ...(s.backup || []), ...(s.deckJokers || [])].some(j =>
         j.key === 'theWorld'
      || j.key === 'misunderstood'
      || (j.key === 'kaptan' && !j.saveUsed)
      || (j.key === 'truva' && j.pandora === 'umut' && !j.umutUsed && !s.umutRunUsed));
  },

  /* Bu raundun destesindeki TOPLAM taş sayısı — UI'daki "kalan/toplam"
     sayacı için (Figma oyun ekranı 210:3627). Deste dışına çıkmış taşlar da
     o destenin parçasıdır, bu yüzden taşın bulunabileceği tüm yerler
     taranır. Bungie kopyaları gibi türetilmiş taşlar da sayılır: oyuncu
     ekranda kaç taşla oynadığını görmelidir. */
  /* PLAYTEST 25 · GRUP A — sayaç artık TEK KAYNAKTAN (tileZones) okuyor.
     Eskiden kendi elle yazılmış listesi vardı ve boss'un çaldığı taşı
     saymıyordu: boss taşı çalar çalmaz ekrandaki toplam düşüyordu
     (104 → 103), yani sayacın kendisi "bir taş yok oldu" diyordu. */
  totalTilesInPlay() {
    if (!this.state) return 0;
    let n = 0;
    for (const arr of Object.values(this.tileZones())) n += arr.length;
    return n;
  },

  /* Açık store'a anında bir joker rafı ekle (Eskici Rafı yükseltmesi +
     Tacir Mektubu tüketilebiliri ortak kullanır). */
  /* Store raflarının GÜNCEL genişliği. Tavan burada uygulanır: bu
     fonksiyonlardan geçmeyen hiçbir yer raf sayısı okumaz. */
  /* "Slot/raf büyüten" bir değnek tavana vurduysa artık SATIŞA da,
     PAKETE de girmez (kullanıcı kuralı 2026-09-04: oyuncunun karşısına
     hiçbir şey yapmayan bir seçenek çıkmasın). Heybe envanteri büyütür;
     envanter zaten en büyük hâldeyse kart satın alınabilir ama
     kullanılamaz durumdaydı — artık havuza hiç girmiyor. */
  _consumOfferable(key) {
    if (key === 'heybe') return this.consumCap() < CONSUM_SLOT_MAX;
    /* Ferman hakkı dolduysa kart artık satılmaz/paketten çıkmaz —
       Ambar'ın tavan elemesiyle aynı kural (ölü kart teklif edilmez). */
    if (key === 'ferman') return (this.state?.fermanUsed || 0) < FERMAN_MAX;
    /* Mıknatıs tavanı doluysa kart ölü teklif olurdu — Ambar/Ferman kuralı. */
    if (key === 'miknatis') return (this.state?.magnets || []).length < MAGNET_MAX;
    return true;
  },

  shopJokerSlots() {
    return Math.min(SHOP_JOKER_MAX,
      SHOP_JOKER_BASE + (this.state?.extraShopSlots || 0));
  },
  shopExtraSlots() {
    return Math.min(SHOP_EXTRA_MAX,
      SHOP_EXTRA_BASE + (this.state?.extraRowSlots || 0));
  },
  /* İkinci rafta yalnız değnek sabittir; büyüme paket slotuna gider. */
  shopPackSlots() {
    return Math.max(0, this.shopExtraSlots() - SHOP_EXTRA_FIXED);
  },
  /* İki raf da tavanda mı? (raf ödülü havuzdan bu bilgiyle düşer) */
  shopShelvesFull() {
    return this.shopJokerSlots() >= SHOP_JOKER_MAX
      && this.shopExtraSlots() >= SHOP_EXTRA_MAX;
  },

  /* Mevcut store'a HEMEN bir gizli paket ekler (Eskici Rafı ikinci rafı
     büyüttüğünde "anında etki" hissi joker rafındakiyle aynı olsun). */
  _addExtraSlotNow() {
    const s = this.state;
    if (!s.store) return false;
    const packs = s.store.packs || (s.store.packs = []);
    if (packs.length >= this.shopPackSlots()) return false;
    const taken = new Set(packs.map(p => p.kind));
    const pool = Object.values(PACK_DEFS)
      .filter(d => !taken.has(d.kind) && this._packUseful(d.kind));
    if (!pool.length) return false;
    const def = pool[Math.floor(this.rng() * pool.length)];
    packs.push({ kind: def.kind, price: def.price, sold: false });
    return true;
  },

  _addShopSlotNow() {
    const s = this.state;
    if (!s.store) return false;
    const owned = new Set([...this.slotRecs(), ...s.backup, ...s.deckJokers].map(j => j.key));
    const taken = new Set(s.store.items.map(i => i.key));
    const pool = this.jokerPool(d =>
      d.rarity !== 'epic' && !owned.has(d.key) && !taken.has(d.key));
    if (!pool.length) return false;
    const rarity = this._rollRarity();
    const inR = pool.filter(d => d.rarity === rarity);
    const def = (inR.length ? inR : pool)[Math.floor(this.rng() * (inR.length ? inR.length : pool.length))];
    s.store.items.push({ key: def.key, name: def.name, desc: def.desc,
      rarity: def.rarity, price: RARITY[def.rarity].price, discounted: false, sold: false });
    return true;
  },

  nextRound() {
    const s = this.state;
    // NOT: Joker süre azalması (GDD 7.2) artık burada DEĞİL — raund
    // kazanıldığı anda, store üretilmeden ÖNCE _ageJokers() ile yapılır.
    // Böylece süresi dolan joker store'a hiç girmez.
    s.roundStartNotes = [];
    this._resolvePendingPacks(s.roundStartNotes); // Grup F güvenlik ağı

    // Backup slot bekleme (GDD 7.4) — süre dolunca zorla Ana Slot'a
    for (const b of [...s.backup]) {
      b.waitLeft--;
      if (b.waitLeft <= 0) {
        s.backup = s.backup.filter(x => x !== b);
        if (s.jokers.length < this.slotCap()) {
          b.fresh = true;
          s.jokers.push(b);
          s.roundStartNotes.push(`${b.name} backup süresi doldu → Ana Slot'a geçti`);
        } else {
          // ana slot dolu → en düşük nadirlik otomatik satılır (GDD 7.4)
          const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
          const lowest = [...s.jokers].sort((a, c) => order.indexOf(a.rarity) - order.indexOf(c.rarity))[0];
          s.jokers = s.jokers.filter(x => x !== lowest);
          gainCoins(s, jokerSell(lowest.key, lowest.rarity));
          b.fresh = true;
          s.jokers.push(b);
          s.roundStartNotes.push(
            `${b.name} zorla Ana Slot'a geçti; ${lowest.name} otomatik satıldı (+${jokerSell(lowest.key, lowest.rarity)} coin)`);
        }
      }
    }

    // raund/stage ilerlemesi. Trainer: stage sayısı oyuncu seçimi
    // (Sonsuz Mod = Infinity → hiç bitmez, stage'ler TARGET_GROWTH ile sertleşir).
    if (s.roundInStage >= 3 && s.stage >= this.totalStages()) {
      // Son stage'in boss'u da geçildi — RUN TAMAMLANDI
      s.status = 'runComplete';
      return;
    }
    if (s.roundInStage >= 3) {
      s.stage++;
      s.roundInStage = 1;
      s.okey = this._rollOkey();
      s.roundStartNotes.push(
        `Stage ${s.stage} — yeni okey ilan edildi: ${COLOR_TR[s.okey.color]} ${s.okey.number}`);
      // Grup H — el büyümesi otomatik ve koşulsuz bir sistemdir; oyuncuya duyurulur
      if (handSizeFor(s.stage) > handSizeFor(s.stage - 1))
        s.roundStartNotes.push(
          `🖐️ Istakan büyüdü: raundlara artık ${handSizeFor(s.stage)} taşla başlıyorsun`);
    } else {
      s.roundInStage++;
    }
    s.pendingLocks = this._locksFrom(s.store); // kilitli ürünler sonraki store'a
    s.store = null;
    this._startRound(s.roundStartNotes);
  },

  restartRun() {
    this.newRun();
  },

  /* Bu run'ın toplam stage sayısı — normalde sabit TOTAL_STAGES, trainer
     modunda oyuncunun seçtiği değer (Infinity = Sonsuz Mod). */
  totalStages() {
    if (this.trainerMode && this.state.trainerStages) return this.state.trainerStages;
    return runModeOf(this.state).stages;   // MADDE D4 — Hızlı Run'da 4
  },

  /* MADDE D4 — aktif run modunun tanımı (UI ve testler için tek kaynak). */
  runMode() { return runModeOf(this.state); },

  /* ---------- TRAINER MODU (Grup H, 2026-08; genişletildi 2026-08-07) ----------
     DMC "Void" tarzı sandbox: normal stage yapısı (2 normal + boss).
     İlerleme/kayıt yok, istatistik/koleksiyon sayaçlarına bulaşmaz.
     Oyuncu stage sayısını (1/3/6/12/Sonsuz), başlangıç jokerlerini/
     tüketilebilirlerini/coinini/el büyüklüğünü seçer; haritada boss seçer,
     store havuzunu filtreler ve dilediği stage'e atlar.
     cfg: { stages, jokers:[key], consumables:[key], coins, handSize } */
  newTrainerRun(cfg = {}) {
    this.newRun();
    this.trainerMode = true;
    const s = this.state;
    // stages: pozitif tam sayı ya da Infinity (Sonsuz Mod)
    const ch = cfg.stages;
    s.trainerStages = (ch === Infinity || ch === 'inf') ? Infinity
      : (Number.isFinite(ch) && ch > 0 ? Math.floor(ch) : TOTAL_STAGES);
    s.coins = Math.max(0, cfg.coins ?? 20);
    if (cfg.handSize) s.trainerHandSize = Math.max(5, Math.min(MAX_HAND, cfg.handSize));
    /* Grup K — kurulumda Okey Taşı elle seçilebilir; seçilmezse mevcut
       rastgele belirleme mantığı aynen devam eder. */
    s.trainerOkey = null;
    if (cfg.okey && COLORS.includes(cfg.okey.color)
        && cfg.okey.number >= 1 && cfg.okey.number <= 13) {
      s.trainerOkey = { color: cfg.okey.color, number: Math.floor(cfg.okey.number) };
      s.okey = { ...s.trainerOkey };
    }
    /* Joker süresi ayarı, jokerler kurulmadan ÖNCE yazılır ki hem başlangıç
       jokerleri hem de sonraki store/ödül alımları aynı süreyi alsın. */
    s.trainerJokerUses = null;
    if (cfg.jokerUses != null && cfg.jokerUses !== 'def')
      this.setTrainerJokerUses(cfg.jokerUses);
    for (const key of cfg.jokers || []) {
      const def = JOKER_DEFS[key];
      if (!def) continue;
      const j = this._initJoker({ id: ++_jokerId, key: def.key, name: def.name,
        desc: def.desc, rarity: def.rarity, usesLeft: this._usesFor(def), fresh: true });
      if (def.mech === 'deck') s.deckJokers.push(j);
      else if (s.jokers.length < this.slotCap()) s.jokers.push(j);
      else if (s.backup.length < MAX_BACKUP) { j.waitLeft = 3; s.backup.push(j); }
      // sığmayanlar sessizce atlanır (UI seçim sınırını zaten bildirir)
    }
    for (const key of cfg.consumables || [])
      if (CONSUMABLES[key] && s.consumables.length < this.consumCap()) s.consumables.push(key);
    /* P42 (kullanıcı isteği 2026-09-14) — DESTE İÇERİĞİ (yalnız Trainer).
       Seçilen özel taş türleri destenin TAMAMINA sırayla dağıtılır: her
       (renk, sayı, kopya) yüzü gerçek bir özel taş KAYDI olur (sid'li — Kara
       Delik yoğunlaşması gibi kopyaya özel durum da çalışsın). Okey yüzleri
       normal kalır (bkz. _deckFaces), yoksa stage'in okeyi desteden kaybolurdu.
       Joker taşları kapsam dışı: onlar joker seçimiyle zaten alınıyor. */
    s.trainerDeckSpecials = null;
    const spKinds = (cfg.deckSpecials || []).filter(k => SPECIAL_TILES[k]);
    if (spKinds.length) {
      s.trainerDeckSpecials = spKinds;
      let i = 0;
      for (const color of COLORS)
        for (let n = 1; n <= 13; n++)
          for (let copy = 0; copy < DECK_MAX_COPIES; copy++)
            this._addSpecialTile(spKinds[i++ % spKinds.length], color, n);
    }
    s.trainerStoreFilter = null;
    /* PLAYTEST 20 · GRUP J — EL DÜZENİ (yalnız Trainer, deneysel).
       'classic' → 2×15 sabit hücreli ızgara (ana oyunun düzeni, varsayılan)
       'free'    → taşlar yan yana sıkışık; sürükleyip araya bırakırsın.
       Ana oyun modunda bu alan HİÇ okunmaz (ui.js yalnız trainerMode'da
       serbest düzeni çizer), yani klasik düzen hiç etkilenmez. */
    s.trainerRack = cfg.rack === 'free' ? 'free' : 'classic';
    this._startRound(); // el/deste, seçilen konfigürasyona göre yeniden kurulur
    return { ok: true };
  },

  /* TRAINER: JOKER SÜRESİ (2026-08-26, kullanıcı isteği).
     Farklı testler için jokerin kaç raund elde kalacağı elle belirlenebilir.
     Ayar hem KURULUMDA seçilen jokerlere hem de RUN İÇİNDE store'dan
     alınanlara uygulanır; `null` ise her jokerin kendi tanımlı süresi
     (JOKER_DEFS[..].uses / nadirlik varsayılanı) kullanılır.
     `Infinity` = süresiz (yaşlanmada azalmaz, bkz. _ageJokers). */
  TRAINER_USES_MAX: 99,
  setTrainerJokerUses(n) {
    if (!this.trainerMode) return { ok: false, error: 'Yalnız Trainer modunda.' };
    const s = this.state;
    if (n == null || n === '' || n === 'def') s.trainerJokerUses = null;
    else if (n === Infinity || n === 'inf') s.trainerJokerUses = Infinity;
    else {
      const v = Math.floor(Number(n));
      if (!Number.isFinite(v) || v < 1) return { ok: false, error: 'Geçersiz süre.' };
      s.trainerJokerUses = Math.min(this.TRAINER_USES_MAX, v);
    }
    return { ok: true, uses: s.trainerJokerUses };
  },
  /* Bir jokerin başlangıç süresi — trainer ayarı varsa onu, yoksa tanımı verir */
  _usesFor(def, rarity) {
    const s = this.state;
    if (this.trainerMode && s && s.trainerJokerUses != null) return s.trainerJokerUses;
    return def?.uses ?? RARITY[rarity ?? def?.rarity].uses;
  },

  /* Trainer: boss'u elle seç — boss raundundaysa raund yeni boss'la kurulur */
  setBoss(key) {
    const s = this.state;
    const b = BOSSES.find(x => x.key === key);
    if (!b) return { ok: false, error: 'Boss bulunamadı.' };
    s.bossOrder[(s.stage - 1) % s.bossOrder.length] = b;
    s.boss = b;
    if (this.isBossRound()) this._startRound();
    return { ok: true };
  },

  /* Trainer: bu raundun store'unda çıkabilecek jokerleri sınırla (ops.) */
  setStoreFilter(keys) {
    this.state.trainerStoreFilter = (keys && keys.length) ? [...keys] : null;
    return { ok: true };
  },

  /* TRAINER: RAUNDU ATLA (2026-08-26, kullanıcı isteği).
     Trainer sandbox'ında amaç ileri bir oyun durumuna hızlıca ulaşmaktır;
     her raundu elle oynamak test döngüsünü çok yavaşlatıyordu. Bu yüzden
     raund KAZANILMIŞ sayılarak normal zafer akışı çalıştırılır (joker
     yaşlanması, store üretimi, stage sonu yükseltmesi hepsi normal işler)
     — böylece atlanan raundlar oyunun kendi ilerlemesini bozmaz.
       · Boss koşulu denetlenmez (bkz. bossFailReason / trainerSkipped).
       · `toStore` false ise store da atlanır, doğrudan sonraki raund açılır.
     Bu yol NORMAL RUN'DA KAPALIDIR — oyuncular trainer moduna erişemez. */
  skipRound(opts) {
    if (!this.trainerMode) return { ok: false, error: 'Yalnız Trainer modunda.' };
    const s = this.state;
    if (!s || s.status !== 'playing')
      return { ok: false, error: 'Şu an oynanan bir raund yok.' };
    const from = { stage: s.stage, round: s.roundInStage };
    s.trainerSkipped = true;
    s.scoreDebt = 0;                       // atlanan raundun Tüccar borcu silinir
    s.score = Math.max(s.score, s.target); // hedefe ulaşmış say
    if (s.wonOnTurn == null) s.wonOnTurn = s.turn;
    this._finishWin();
    if (s.status !== 'won')
      return { ok: false, error: 'Raund kapatılamadı (durum: ' + s.status + ').' };
    const skippedStore = opts && opts.toStore === false;
    if (skippedStore) this.nextRound();
    return { ok: true, from, skippedStore,
      stage: s.stage, round: s.roundInStage, status: s.status };
  },

  /* Trainer: doğrudan başka bir stage'e atla (harita kolaylığı).
     Hedef stage'in 1. raundundan başlar; okey ve boss yeniden belirlenir. */
  jumpToStage(ch) {
    if (!this.trainerMode) return { ok: false, error: 'Yalnız Trainer modunda.' };
    const max = Number.isFinite(this.totalStages()) ? this.totalStages() : 99;
    ch = Math.max(1, Math.min(max, Math.floor(ch)));
    const s = this.state;
    s.stage = ch;
    s.roundInStage = 1;
    s.store = null;
    s.pendingLocks = null;
    s.upgradeOffer = null;
    s.status = 'playing';
    s.okey = this._rollOkey();
    s.boss = null; // _startRound bossOrder'dan bu stage'in boss'unu seçer
    this._startRound();
    return { ok: true, stage: ch };
  },

  /* DESTE BÜTÜNLÜK DENETİMİ (Playtest 6, Grup A7)
     Normal Okey destesinde her (renk+sayı) kombinasyonundan EN FAZLA 2 adet
     bulunur. Playtest'te aynı elde 3 adet Mavi 13 görüldü. Kök neden:
     kalıcı deste değişiklikleri (Kopyacı tüketilebiliri → tileMods 'add',
     Okey Mührü → 'okeyClone', Frankenstein → reviveTiles) desteye ETİKETSİZ
     düz taş ekliyordu; asıl kopyalarla toplanınca 3'e çıkıyordu ve oyuncu
     hangisinin joker kaynaklı olduğunu göremiyordu.
     Çözüm iki katmanlı:
       1) joker/tüketilebilir kaynaklı her taş artık ayrı bir TÜR olarak
          işaretlenir (copied / revived / alien / special) ve UI'da ayrı
          görünür — bunlar 2'lik sınırın dışındadır;
       2) bu denetim her raund başında ASIL desteyi sayar; işaretsiz bir
          yüzden 2'den fazlası varsa fazlalık silinir ve olay kaydedilir
          (regresyon sessizce geçmesin). */
  _auditDeck(notes) {
    const s = this.state;
    const isBase = (t) => IS_BASE_TILE(t);
    const seen = new Map();
    const extra = [];
    for (const t of s.deck) {
      if (!isBase(t)) continue;
      const k = `${t.color}-${t.number}`;
      const n = (seen.get(k) || 0) + 1;
      seen.set(k, n);
      if (n > DECK_MAX_COPIES) extra.push(t);
    }
    if (!extra.length) return { ok: true, removed: 0 };
    s.deck = s.deck.filter(t => !extra.includes(t));
    const list = extra.map(t => `${COLOR_TR[t.color]} ${t.number}`).join(', ');
    notes.push(`🛠 Deste denetimi: fazla kopya temizlendi (${list})`);
    return { ok: false, removed: extra.length, tiles: extra };
  },

  /* PLAYTEST 16 · GRUP E — DESTE/EL BÜTÜNLÜK DENETİMİ.
     Eski sürüm YALNIZ deste + el + atılanları sayıyordu; masadaki açık
     kombinasyonlar (opened / prevOpen / staged / islemeler) kapsam
     dışıydı. Bungie Gum'ın ürettiği fazla taşlar tam orada saklanıyordu,
     bu yüzden denetim "ok" diyordu. Artık taşın bulunabileceği HER yer
     taranır ve üç ayrı bozulma türü yakalanır:
       1) dupFaces  — işaretsiz bir yüzden 2'den fazla kopya (çoğalma)
       2) dupIds    — aynı taş nesnesi/id'si iki ayrı yerde (referans
                      kopyalanmış; kaybolmanın da tipik habercisi)
       3) lost      — beklenen toplamdan sapma (taş kayboldu/bitti)
     Hiçbir şeyi SİLMEZ; yalnız rapor eder (çağıran karar verir). */
  /* PLAYTEST 25 · GRUP A — "ARAF" KAPLARI DA BİRER BÖLGEDİR.
     KÖK NEDEN (kullanıcı raporu 2026-09-07, "taş hâlâ kayboluyor"):
     taş nesnesi tutan iki kap bu listenin dışındaydı —
       · `bossCheatBag`      : boss'un elden ÇALDIĞI taşlar
       · `yildizPick.options`: Kuzey Yıldızı'nda önüne açılan taşlar
     Liste eksik olduğu için üç şey birden bozuluyordu:
       1) `nextTileId` sayacı bu taşları göremiyor → exe kapanıp
          açıldıktan (restore) sonra üretilen ilk taş ARAFTAKİ TAŞLA AYNI
          id'yi alıyordu. Çalınan taş ele döndüğünde elde aynı id'den iki
          taş oluyor; `hand.find(t => t.id === x)` hep birincisini
          döndürdüğü için ikincisi seçilemez/atılamaz hâle geliyor —
          oyuncunun gördüğü: TAŞ KAYBOLDU.
       2) Nöbetçi (`verifyDeckIntegrity`) çakışmayı göremiyordu.
       3) Ekrandaki toplam taş sayısı çalınan taşı düşüyordu (104 → 103),
          yani sayaç da "bir taş yok oldu" diyordu.
     İkisi de diğer bölgelerle KARŞILIKLI DIŞLAYICIDIR (çalınan taş elden
     `_takeTile` ile çıkar, yıldız seçenekleri desteden çıkarılır), o
     yüzden "çift referans" denetimini yanıltmazlar.
     ⚠ `bungiePending` BİLEREK burada DEĞİL: sakızdaki taş aynı anda
     masadaki açılımda (`opened`) da durur, buraya konsa her Bungie Gum
     kullanımı sahte "çift referans" alarmı üretirdi. O kap, çift
     referansa bakmayan yerlerde (id sayacı, el denetimi) ayrıca taranır
     — bkz. `tileRefs()`. */
  /* PLAYTEST 29 · GRUP B — ISTAKA SINIRINA SAYILAN TAŞ SAYISI.
     Hayalet'in taşı bir turluk türetilmiş kopyadır ve tasarım
     gereği "el sayısına girmez": ne çekişi kısar ne de MAX_HAND tavanını
     doldurur. Tavanla ilgili her karşılaştırma bu sayacı kullanır;
     `s.hand.length` yalnız "elde kaç nesne var" sorusunda kalır. */
  realHandCount() {
    return ((this.state && this.state.hand) || []).filter(t => !t.ghost).length;
  },

  tileZones() {
    const s = this.state || {};
    const z = {
      deck: s.deck || [], hand: s.hand || [], discard: s.discardPile || [],
      gossip: s.gossipTable || [],
      cheatBag: s.bossCheatBag || [],          // boss'un çaldığı taşlar
      yildiz: (s.yildizPick && s.yildizPick.options) || [], // açılmış yıldız seçenekleri
    };
    const spread = (name, list) => {
      (list || []).forEach((c, i) => { z[`${name}${i}`] = c.tiles || []; });
    };
    spread('opened', s.opened); spread('prevOpen', s.prevOpen);
    spread('staged', s.staged); spread('isleme', s.islemeler);
    return z;
  },

  /* Taş nesnesinin BULUNABİLECEĞİ her yer — `tileZones` + çift referansı
     meşru olan kaplar. Yalnız "bu id kullanımda mı / bu taş hâlâ oyunda
     mı" sorularında kullanılır (id sayacı, el denetimi); kopya sayımı ve
     çift referans denetimi tileZones üzerinden yürür. */
  tileRefs() {
    const s = this.state || {};
    const lists = Object.values(this.tileZones());
    lists.push(s.bungiePending || []);   // sakızda bekleyen taşlar
    return lists;
  },

  /* PLAYTEST 18 · GRUP B — DENETİM ARTIK "KİM YAPTI"YI DA SÖYLÜYOR.
     Eski rapor yalnız "blue-13×3" diyordu; hangi mekaniğin taşı ürettiğini
     ya da değerini değiştirdiğini söyleyemediği için her ihlar elle
     kovalanmak zorundaydı. Artık her taş `origin` taşır (bkz. retune /
     tagOrigin) ve rapor iki ayrı liste döndürür:
       · offenders — GERÇEK bozulma: işaretsiz asıl deste taşından 2'den
         fazla kopya. Bu bir hatadır, kovalanmalıdır.
       · lookalikes — MEŞRU ama oyuncunun ayırt edemediği yığılma: aynı
         yüzü taşıyan 3+ taş, içlerinde joker kaynaklı dönüşmüşler var.
         Bug değildir; kullanıcının "3 tane Mavi 13 geldi" raporunun asıl
         kaynağı budur ve UI'da rozetle görünür kılınır. */
  verifyDeckIntegrity(expectTotal) {
    const s = this.state;
    if (!s) return { ok: true, offenders: [], lookalikes: [], dupIds: [], total: 0 };
    const isBase = (t) => IS_BASE_TILE(t);
    const zones = this.tileZones();
    const count = new Map();
    const faceAll = new Map();   // yüz → o yüzü taşıyan TÜM taşlar (köken dahil)
    const where = new Map();     // id → ilk görüldüğü bölge
    const dupIds = [];
    let total = 0;
    for (const [zone, arr] of Object.entries(zones))
      for (const t of arr) {
        total++;
        if (t.id != null) {
          if (where.has(t.id))
            dupIds.push({ id: t.id, zones: [where.get(t.id), zone] });
          else where.set(t.id, zone);
        }
        if (t.jokerTile) continue;
        const k = `${t.color}-${t.number}`;
        if (!faceAll.has(k)) faceAll.set(k, []);
        faceAll.get(k).push(t);
        if (isBase(t)) count.set(k, (count.get(k) || 0) + 1);
      }
    const bad = [...count.entries()].filter(([, n]) => n > DECK_MAX_COPIES);
    /* Bir yüzün kökenlerini "kirby×2 + asıl×1" gibi okunur hâle getirir. */
    const originBreakdown = (tiles) => {
      const m = new Map();
      for (const t of tiles) {
        const o = t.origin ? (TILE_ORIGIN_TR[t.origin] || t.origin)
          : t.fakeOkey ? 'sahte okey' : 'asıl deste';
        m.set(o, (m.get(o) || 0) + 1);
      }
      return [...m.entries()].map(([o, n]) => `${o}×${n}`).join(' + ');
    };
    const lookalikes = [...faceAll.entries()]
      .filter(([, arr]) => arr.length > DECK_MAX_COPIES)
      .map(([face, arr]) => ({ face, count: arr.length, by: originBreakdown(arr) }));
    const lost = (typeof expectTotal === 'number' && expectTotal !== total)
      ? { expected: expectTotal, actual: total } : null;
    return {
      ok: !bad.length && !dupIds.length && !lost,
      offenders: bad.map(([k, n]) => ({
        face: k, count: n, by: originBreakdown(faceAll.get(k) || []),
      })),
      lookalikes, dupIds, lost, total,
    };
  },

  /* GRUP D — TÜCCAR PUAN BORCU TAHSİLATI.
     Raund başında puan 0 olduğu için "250 puan ver" teklifi bedelsiz
     kalıyordu; ödenemeyen kısım artık borç yazılır ve kazanılan İLK
     puanlardan tahsil edilir. Borç raundu aşmaz (_startRound sıfırlar).
     Puan hiçbir zaman eksiye düşmez — borç kapanana kadar bekler. */
  _settleScoreDebt(events) {
    const s = this.state;
    if (!s || !(s.scoreDebt > 0) || !(s.score > 0)) return 0;
    const pay = Math.min(s.scoreDebt, s.score);
    s.score -= pay;
    s.scoreDebt -= pay;
    if (events)
      events.push(`🐪 Tüccar borcu: -${pay} puan`
        + (s.scoreDebt > 0 ? ` (kalan borç ${s.scoreDebt})` : ' — borç kapandı'));
    return pay;
  },

  /* ===================== GRUP A — EL DEFTERİ =====================
     Sorun (kullanıcı raporu 2026-09-06): "Elimde 2 Kırmızı 6 vardı, 5 ve
     10'u atıp pas geçtim, sonraki turda 1 Kırmızı 6 kalmıştı."
     1457 turluk ID taraması discard→çekme akışının SAĞLAM olduğunu
     gösterdi — elden çıkan her taşın bir sahibi vardı. Asıl kusur
     mekanizmaların HANGİ taşa dokunduğunu söylememesiydi; taş ya değer
     değiştirmiş (Sir.by: 6→5) ya da yutulmuştu, oyuncu ikisini de
     "kayboldu" diye okuyordu.

     Çözüm iki katmanlı:
       (a) Eli terk eden her taş SAHİPLENİLİR — `_takeTile(t, by)`.
       (b) Tur sonunda `_handAudit()` sahipsiz kaybı arar. Bir daha
           sessizce kaybolamaz: sahibi olmayan her taş ekrana yazılır.
     Not: taşı bir bölgeye TAŞIYAN işlemler (açılım, işleme, discard)
     deftere yazılmaz — denetim onları zaten bölgelerde bulur. */
  _takeTile(t, by) {
    const s = this.state;
    if (!t) return null;
    s.hand = s.hand.filter(x => x !== t);
    (s.handLedger = s.handLedger || []).push({
      id: t.id, by, face: t.jokerTile ? `◈${t.jname || t.jokerTile}`
        : `${COLOR_TR[t.color] || t.color} ${t.number}`,
    });
    return t;
  },

  /* Elden çıkan taşların adıyla yazılmış listesi — olay metinlerinde
     kullanılır ki oyuncu HANGİ taşın gittiğini görsün. */
  _tileNames(list) {
    return (list || []).map(t => `${COLOR_TR[t.color] || t.color} ${t.number}`).join(', ');
  },

  /* Tur sonu el denetimi. Önceki turun sonunda kaydedilen el fotoğrafıyla
     şimdiki durumu karşılaştırır; elden çıkmış ama (1) hiçbir bölgede
     olmayan ve (2) deftere yazılmamış taş varsa alarm verir.
     PLAYTEST 24 · GRUP L (2026-09-07) — alarm ARTIK OYUNCUYA GÖRÜNMEZ.
     Eskiden bu satır `events`e de yazılıyordu, yani nöbetçi hiç
     tetiklenmemesi gereken bir durumda (ör. bir "lookalikes" kenar
     durumu) ateşlerse oyuncu ekranında ham, teknik bir hata metni
     ("⚠ EL DENETİMİ: 3 taş sahipsiz kayboldu — Kırmızı 6 (#357)…")
     beliriyordu — bu metin oyuncuya HİÇBİR ŞEY ifade etmez, sadece
     "taşım gerçekten kayboldu" korkusunu doğrular. Nöbetçi artık
     yalnız `state.integrityLog` (dev inceleme) ve konsola yazar;
     oyunun normal bildirim akışına (`events` → `notify()`) hiç
     girmez. Bkz. [[el-butunlugu-nobetcisi]]. */
  _handAudit(events) {
    const s = this.state;
    const prev = s.handSnapshot;
    const face = (t) => (t.jokerTile ? `◈${t.jname || t.jokerTile}`
      : `${COLOR_TR[t.color] || t.color} ${t.number}`);
    if (Array.isArray(prev)) {
      const seen = new Set();
      // Grup A (P25): tarama tileRefs üzerinden — boss kesesi, yıldız
      // seçenekleri ve sakız kuyruğu dahil HER kap.
      for (const arr of this.tileRefs())
        for (const t of arr) if (t && t.id != null) seen.add(t.id);
      const owned = new Set((s.handLedger || []).map(e => e.id));
      const orphan = prev.filter(e => !seen.has(e.id) && !owned.has(e.id));
      if (orphan.length) {
        const msg = `⚠ EL DENETİMİ: ${orphan.length} taş sahipsiz kayboldu — `
          + orphan.map(e => `${e.face} (#${e.id})`).join(', ');
        (s.integrityLog = s.integrityLog || []).push(msg);
        if (typeof console !== 'undefined') console.warn(msg);
      }
      /* ===== PLAYTEST 25 · GRUP B — TUR TUR OLAY KAYDI =====
         Kullanıcı oyunu OKEY.exe ile oynuyor; "taşım kayboldu" dediğinde
         tarayıcı konsolunu açtırmak gerçekçi değil. Bu yüzden her turun
         el değişimi kaydın İÇİNE yazılır (exe kapansa bile durur) ve
         oyun içinde Ctrl+Shift+D ile metin olarak dökülür.
         Kayıt tur BAŞINA tek satırdır ve son 40 turu tutar: hangi taş
         eli terk etti (ve HANGİ mekanik aldı), hangi taş geldi. */
      const now = new Map(s.hand.map(t => [t.id, t]));
      const ledger = new Map((s.handLedger || []).map(e => [e.id, e.by]));
      const zoneOf = (id) => {
        for (const [zone, arr] of Object.entries(this.tileZones()))
          if (arr.some(t => t && t.id === id)) return zone;
        return (s.bungiePending || []).some(t => t && t.id === id) ? 'sakız' : '?';
      };
      const giden = prev.filter(e => !now.has(e.id)).map(e =>
        `${e.face}#${e.id}→${ledger.get(e.id) || zoneOf(e.id)}`);
      const gelen = s.hand.filter(t => !prev.some(e => e.id === t.id))
        .map(t => `${face(t)}#${t.id}`);
      (s.turnTrace = s.turnTrace || []).push(
        `S${s.stage}R${s.roundInStage}T${s.turn} el:${s.hand.length}`
        + (giden.length ? ` | giden: ${giden.join(', ')}` : '')
        + (gelen.length ? ` | gelen: ${gelen.join(', ')}` : ''));
      if (s.turnTrace.length > 40) s.turnTrace.shift();
    }
    s.handSnapshot = s.hand.map(t => ({ id: t.id, face: face(t) }));
    s.handLedger = [];
  },

  /* Ctrl+Shift+D raporunun metni (ui.js buradan okur). Oyuncuya
     gösterilmez; "taşım kayboldu" denildiğinde tek tuşla kopyalanıp
     geliştiriciye gönderilecek ham kanıttır. */
  diagnosticReport() {
    const s = this.state || {};
    const dup = this.verifyDeckIntegrity();
    const L = [];
    L.push(`OKEY Roguelike — tanı raporu (${new Date().toISOString()})`);
    L.push(`stage ${s.stage}/${this.totalStages ? this.totalStages() : '?'} · raund ${s.roundInStage} · tur ${s.turn} · durum ${s.status}`);
    L.push(`el ${(s.hand || []).length} · deste ${(s.deck || []).length} · oyundaki toplam ${this.totalTilesInPlay()}`);
    L.push(`boss: ${s.boss ? s.boss.key : '-'} · jokerler: ${(s.jokers || []).map(j => j.key).join(', ') || '-'}`);
    L.push(`deste jokerleri: ${(s.deckJokers || []).map(j => j.key).join(', ') || '-'}`);
    L.push('');
    L.push('— ŞU ANKİ EL —');
    L.push((s.hand || []).map(t => `${t.jokerTile ? '◈' + (t.jname || t.jokerTile)
      : `${COLOR_TR[t.color] || t.color} ${t.number}`}#${t.id}`).join(', ') || '(boş)');
    L.push('');
    L.push('— BÜTÜNLÜK —');
    L.push(dup.ok ? 'temiz (çoğalma/çift referans yok)'
      : `SORUN: ${JSON.stringify({ offenders: dup.offenders, dupIds: dup.dupIds })}`);
    L.push(`araftakiler → boss kesesi ${(s.bossCheatBag || []).length} · `
      + `yıldız ${((s.yildizPick || {}).options || []).length} · sakız ${(s.bungiePending || []).length}`);
    L.push('');
    L.push('— NÖBETÇİ ALARMLARI —');
    L.push((s.integrityLog || []).length ? (s.integrityLog || []).join('\n') : '(hiç alarm yok)');
    L.push('');
    L.push('— SON TURLAR (en yeni en altta) —');
    L.push((s.turnTrace || []).join('\n') || '(kayıt yok)');
    return L.join('\n');
  },

  /* Tur/raund sonunda çağrılan sessiz nöbetçi. Bozulma bulursa
     `state.integrityLog`'a ve konsola tek satırlık bir uyarı düşer —
     böylece bu sınıf hatalar bir daha sessizce birikmez. Oyunu
     durdurmaz, veriyi değiştirmez, oyuncuya HİÇ görünmez (bkz.
     _handAudit üstündeki not — aynı gerekçe). */
  _integrityWatch(events, tag) {
    const s = this.state;
    if (!s) return null;
    /* Toplam taş sayısı MEŞRU olarak da değişir (Cellat/Ejderha yakar,
       Dikiş/Diriliş/Uzaylı ekler) — bu yüzden nöbetçi yalnız kesin
       bozulmalara bakar: fazla kopya ve çift referans. Toplam kıyası
       `verifyDeckIntegrity(expectTotal)` ile testlere bırakıldı. */
    const v = this.verifyDeckIntegrity();
    if (v.ok) return v;
    const parts = [];
    // Grup B: alarma KÖKEN dökümü eklenir → hangi mekanik yaptığı log'da yazar
    if (v.offenders.length)
      parts.push('çoğalma: ' + v.offenders
        .map(o => `${o.face}×${o.count} [${o.by}]`).join(', '));
    if (v.dupIds.length)
      parts.push('çift referans: ' + v.dupIds.slice(0, 4)
        .map(d => `#${d.id} (${d.zones.join(' + ')})`).join(', '));
    if (v.lost)
      parts.push(`taş sayısı ${v.lost.expected} → ${v.lost.actual}`);
    const msg = `⚠ Bütünlük denetimi (${tag}): ` + parts.join(' · ');
    (s.integrityLog = s.integrityLog || []).push(msg);
    if (typeof console !== 'undefined') console.warn(msg);
    return v;
  },

  _startRound(keepNotes) {
    const s = this.state;
    // Not listesi en başta kurulur — deste denetimi (_auditDeck) gibi erken
    // çalışan adımlar da buraya yazabilsin diye (eskiden aşağıda kuruluyordu).
    s.roundStartNotes = keepNotes || [];
    // fresh bayrağı: raund başlarken temizlenir — bu raund boyunca aktif
    // olan her joker, raund sonundaki yaşlanmada (GDD 7.2) süre kaybeder
    for (const j of [...s.jokers, ...s.deckJokers]) j.fresh = false;
    s.target = Math.ceil(this.targetFor(s.stage, s.roundInStage) * (s.nextTargetMult || 1));
    /* Lanetli Kaptan laneti (Grup B): bir kez kurtardıysa, joker yaşadığı
       sürece HER raundun hedefi +%20 — kurtuluşun bedeli. */
    if (this.slotRecs().some(j => j.key === 'kaptan' && j.saveUsed)) {
      s.target = Math.ceil(s.target * KAPTAN_CURSE);
      s.kaptanCursed = true;
    } else {
      s.kaptanCursed = false;
    }
    // Öğretici modu: hedefler yarıya iner — amaç öğretmek, zorlamak değil
    if (this.tutorialMode) s.target = Math.ceil(s.target * 0.5);
    s.nextTargetMult = 1;
    /* PLAYTEST 17 · GRUP B/12 — ÖNCEKİ RAUNDUN MASASI YENİ DESTE
       KURULMADAN ÖNCE TOPLANIR.
       KÖK NEDEN (kullanıcının ekran görüntüsündeki "çoğalma: blue-7×3,
       red-7×3, … (12 değer)" alarmı): `createDeck` her raund başında
       106 taşlık YEPYENİ bir deste üretiyordu, ama önceki raundun
       ATILAN yığını ve açık kombinasyonları (discardPile / opened /
       prevOpen / staged / islemeler) bu satırların ÇOK ALTINDA, yani
       bütünlük nöbetçisi çalıştıktan SONRA temizleniyordu.
       Nöbetçi TÜM bölgeleri taradığı için her eski taş yeni destedeki
       2 kopyanın üstüne 3. kopya gibi görünüyordu → her raund başında
       oyuncuya sahte bir "taş çoğalması" uyarısı basılıyordu.
       Taşlar aslında sağlamdı (ekrandaki 91/106 = 106 − 15 el, tam
       tutuyor). Masa artık yeni deste kurulmadan ÖNCE toplanır: hem
       alarm gerçeği söyler hem de yeni raund gerçekten temiz başlar. */
    s.discardPile = [];
    s.staged = [];
    s.opened = [];
    s.prevOpen = [];
    s.islemeler = [];
    s.gossipTable = [];
    s.storeTilePick = null;   // P29 · Grup O — store seçimi raunda taşmaz
    s.deck = createDeck(s);
    // Sahte okeyler bu stage'in okeyinin normal kopyaları olur:
    // okey Kırmızı 5 ise sahte okey = sıradan bir Kırmızı 5 (joker değil)
    for (const t of s.deck)
      if (t.fakeOkey) { t.color = s.okey.color; t.number = s.okey.number; }
    /* P42 — TRAINER DESTE İÇERİĞİ: normal taşlar çıkar, yerlerini aşağıda
       eklenen özel taş kayıtları alır. O stage'in okey yüzü ve sahte okeyler
       kalır — okeysiz deste okey mekaniğini test edilemez hâle getirirdi. */
    const trSpDeck = !!(this.trainerMode && s.trainerDeckSpecials && s.trainerDeckSpecials.length);
    if (trSpDeck) {
      s.deck = s.deck.filter(t => t.fakeOkey || (t.color === s.okey.color && t.number === s.okey.number));
      /* Özel taşlar normalde el dağıtıldıktan SONRA desteye karışır (aşağıda,
         "Özel Normal Taşlar desteye karışır"); burada dağıtımdan ÖNCE girer ki
         ilk el de seçilen taşlardan oluşsun. Okey yüzündeki kayıt atlanır. */
      for (const sp of s.specialTiles) {
        if (sp.color === s.okey.color && sp.number === s.okey.number) continue;
        s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0,
          { id: nextTileId(s), color: sp.color, number: sp.number, special: sp.kind, sid: sp.sid, origin: 'vernik' });
      }
    }
    // Grup K — tüketilebilirlerin kalıcı deste değişiklikleri, el dağıtılmadan
    // ÖNCE sırayla uygulanır (remove bir kopya siler; add/okeyClone ekler)
    /* PLAYTEST 18 · GRUP B — DÖNÜŞÜM MODLARI ARTIK ATOMİK.
       Çekiç / Taç / Boya desteyi "bir taşı çıkar + dönüşmüşünü ekle" ikilisi
       olarak kaydeder, ama iki satır BAĞIMSIZ uygulanıyordu: `remove`
       eşleşmezse `add` YİNE ÇALIŞIYOR ve desteye bedava bir taş ekliyordu.
       Eşleşme DEĞERE bakar (renk+sayı), o yüzden kaçırmak kolaydı: Sir.by /
       Kağıt Jokeri / Adem ile Havva gibi bir mekanik taşın değerini
       değiştirdikten sonra Çekiç o taşa vurulduğunda kaydedilen "Mavi 7'yi
       çıkar" satırının destede karşılığı olmuyordu → her kullanımda +1 taş.
       (Doğrulandı: 106 yerine 105 taş, blue-10×3.)
       Çözüm: dönüşüm çiftleri `pair` kimliğiyle bağlanır; remove eşleşmezse
       o çiftin add'i de düşer. `pair`siz eski kayıtlar (Kopyacı 'copy',
       Okey Mührü) eskisi gibi bağımsız çalışmaya devam eder. */
    const failedPairs = new Set();
    for (const m of (s.tileMods || [])) {
      if (m.op === 'remove') {
        const i = s.deck.findIndex(t => !t.fakeOkey && t.color === m.color && t.number === m.number);
        if (i !== -1) s.deck.splice(i, 1);
        else if (m.pair != null) failedPairs.add(m.pair);
      } else if (m.op === 'add' && m.pair != null && failedPairs.has(m.pair)) {
        continue;   // eşi bulunamayan dönüşüm — taş üretme
      } else if (m.op === 'add') {
        /* Tüketilebilir kaynaklı taş. İki farklı köken var ve ayırt edilmeleri
           şart (bkz. _auditDeck): 'copy' desteye YENİ bir kopya ekler
           (Kopyacı), 'mod' ise bir remove ile eşleşip mevcut taşı dönüştürür
           (Çekiç/Taç/Boya). İkisi de asıl destenin 2'lik sınırının dışındadır
           ve UI'da ayrı işaretlenir — eski sürüm ikisini de etiketsiz düz taş
           olarak ekliyordu, bu yüzden 3. bir "Mavi 13" asıl deste sanılıyordu. */
        s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0,
          { id: nextTileId(s), color: m.color, number: m.number,
            copied: m.src !== 'mod', modded: m.src === 'mod',
            origin: m.src === 'mod' ? 'cekic' : 'kopyaci' });
      } else if (m.op === 'okeyClone') {
        s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0,
          { id: nextTileId(s), color: s.okey.color, number: s.okey.number,
            copied: true, origin: 'okeyMuhru' });
      }
    }
    this._auditDeck(s.roundStartNotes);
    // Asıl okey taşları FİZİKSEL olarak işaretlenir (bkz. isOkeyTile):
    // raund başında kimliği okeye eşit olan gerçek taşlar okeydir; sonradan
    // değeri değişen taşlar okey olmaz, okeyin değeri değişse de okey kalır.
    for (const t of s.deck)
      t.isOkeyReal = !t.fakeOkey && !t.jokerTile
        && t.color === s.okey.color && t.number === s.okey.number;
    s.hand = s.deck.splice(0, Math.min(MAX_HAND,
      (s.trainerHandSize || handSizeFor(s.stage)) + (s.permHandBonus || 0)));
    /* Grup E nöbetçisi — raund yeni dağıtıldı: burada deste bozulmuş
       olamaz, bozulmuşsa hata dağıtımdan ÖNCEki adımlardadır. */
    /* Grup A: yeni raund yeni deste demek — el fotoğrafı ve defter
       sıfırlanır, yoksa eski ID'ler sahipsiz kayıp gibi görünür. */
    s.handLedger = [];
    s.handSnapshot = s.hand.map(t => ({
      id: t.id, face: t.jokerTile ? `◈${t.jname || t.jokerTile}`
        : `${COLOR_TR[t.color] || t.color} ${t.number}`,
    }));
    this._integrityWatch(s.roundStartNotes, 'raund başı');
    s.karaKediMax = null; // Kara Kedi boss eşiği her raund yeniden ölçülür
    s.turn = 1;
    // Uzun Soluk yükseltmesi her raunda kalıcı +1 tur ekler
    s.maxTurns = 4 + (s.permTurns || 0);
    s.score = 0;
    s.scoreDebt = 0;     // Grup D: Tüccar puan borcu raundu aşmaz
    s.trainerSkipped = false;   // trainer raund atlama bayrağı raundu aşmaz
    s.phase = 'meld';
    s.staged = [];
    s.opened = [];       // bu tur onaylananlar
    s.prevOpen = [];     // önceki turdan işlenebilir kombinasyonlar (GDD 3.7)
    s.islemeler = [];    // bu tur bekleyen işlemeler [{comboIndex, tiles, addSum}]
    s.turnMode = null;
    s.status = 'playing';
    s.lastResult = null;
    s.openedThisTurn = false;
    s.noMeldTurns = 0;
    s.consecMeldTurns = 0;
    s.skipStreak = 0;
    s.coinReport = null;
    s.roundMult = 0;
    /* Grup G (P19) — The Cheating: biriken hile çarpanı ve boss durumu
       raund başına özeldir; yeni rauntta sıfırdan başlar. Jokerin `risk`i
       ise BİLEREK taşınır: joker run boyunca aynı jokerdir, riski de
       onunla birlikte yaşar (yalnız açılımsız tur sıfırlar). */
    s.cheatBank = 0;
    /* GRUP G (P20) — çalınan taş kayıtları raund bazlıdır: deste her raund
       yeniden kurulduğu için eski id'ler artık bir şeye karşılık gelmez.
       (Taş kimliği kuralı: değer bazlı takip yasak, id bazlı takip de
       destenin ömrüyle sınırlı.) */
    s.cheatStolen = [];
    s.cheatArmed = false;     // P35 · Grup H — sıradaki açılıma hile kurulu mu
    s.cheatRisk = 0;          // P35 · Grup H — raund boyu biriken yakalanma riski
    s.cheatGain = 0;          // P35 · Grup H — hileyle kazanılan EK puan (yakalanınca silinir)
    s.bossCheatBag = [];
    s.bossCheatTook = 0;
    s.cheatFlash = [];
    s.bossCheatPlan = null;
    s.bossCheatStats = null;
    /* DAMGA (P28 · Grup B) — iki ayrı bayrak:
         damgaUsed  → raundluk hak harcandı mı (açılım puanlandığında set)
         damgaArmed → oyuncu ŞU ANKİ açılım için damgayı bastı mı
       `damgaArmed` her açılımdan sonra da sıfırlanır (bkz. commitMeld),
       yoksa tek basış raundun geri kalanına yayılırdı. */
    s.damgaUsed = false;
    s.damgaArmed = false;
    s.bossVoided = false;   // Ferman (P28 · Grup F) — aşağıda yeniden kurulur
    s.prevMeld = null;
    s.copcuCount = 0;
    s.midasCoins = 0;
    s.kristal = 0;
    s.vampirBank = 0;
    s.aynaKralBank = 0;
    s.aynaKralMelds = 0;      // P37 — yansımaya açılım yapılmış tur sayısı
    s.aynaKralTurnKey = null;
    s.godzillaLevel = 0;
    s.jokersDisabled = false;
    s.islekRateBonus = 0;
    s.islekReversed = false;
    s.hipnoNumber = null;     // Hipnotizör — bu raund transtaki sayı (Toplu Hipnoz)
    s.misuActive = false;     // The Misunderstood — bu raund aktif mi
    s.cellatMotive = 0;       // Cellat — idam başına +2 birikimi
    s.katalizorMult = 0;      // (eski alan — P29 · Grup I'den beri kullanılmıyor, kayıt uyumu)
    s.gumusPending = 0;       // Gümüş Taş — raund sonu coin
    s.bonusDraw = 0;          // (eski Yıldız Taşı alanı — kayıt uyumu)
    /* Grup H: Kuzey Yıldızı seçim kuyruğu raundu aşmaz. */
    s.yildizQueue = 0;
    s.yildizPick = null;
    s.ageSkip = false;        // Grup E — Zaman Taşı: bu raund joker yaşlanması yok
    s.graveTiles = [];        // Frankenstein — bu raund atılan taşlar (mezarlık)
    s.appleEaten = false;     // P31 · Grup I — Yasak Elma: bu raund kovuldun mu
    s.crownId = null;         // P31 · Grup H — Crimson King: bu turun taçlı jokeri
    s.godPick = null;         // P31 · Grup E — Tanrının Eli: bekleyen seçimli çekiş
    s.teraziUsed = false;     // Grup C — Terazi feda hakkı
    s.paratonerBait = null;   // P29 · Grup F — yem her raundun başında boş
    s.hidraPending = 0;       // P34 — Hidra: sonraki tur doğacak okey sayısı
    s.hidraSpawned = 0;       // P34 — Hidra: bu raund doğan okey (tavan HIDRA_ROUND_CAP)
    s.rusvetTurn = null;      // P34 — Rüşvet: hakkın kullanıldığı tur anahtarı
    s.teraziMult = 0;
    /* GRUP A (P20) — birikimli feda çarpanı ve işlek borcu raundu aşmaz */
    s.teraziRoundMult = 0;
    s.teraziTurnGain = null;  // P29 · Grup J
    s.teraziIslekNext = 0;
    s.teraziIslekTurn = 0;
    s.wonOnTurn = null;
    // Grup F — yeni boss koşullarının raund bazlı durumu
    s.bossFreedomMarks = [];  // Freedom boss: zorunlu kullanılacak işaretliler
    s.bossMutedJoker = null;  // Avukat boss: bu tur susturulan joker
    s.bossOracle = null;      // Kahin boss: bu turun zorunlu kehaneti
    s.bossOracleMissed = false;
    s.bossMirrorDebt = 0;     // Ayna Kral boss: ters yansıma borcu
    s.bossFail = null;        // boss şartı ihlali (hedefe ulaşsan da kaybettirir)
    s.ritimFailed = false;

    // Boss raundu (GDD 13) — kısıtlama stage başında bilinir, 3. raundda
    // uygulanır. Boss, run başında karılan tekrarsız sıradan gelir (madde 21).
    if (!s.boss || s.roundInStage === 1) {
      const ord = s.bossOrder || BOSSES;
      s.boss = ord[(s.stage - 1) % ord.length];
    }
    /* FERMAN (P28 · Grup F) — yazılı ferman varsa boss KURULUMU HİÇ
       ÇALIŞMAZ. İptal etmek yerine hiç kurmamak bilinçli: godzilla tur
       sayısını, misunderstood hedefi, karaKedi de doğrudan eldeki taşları
       değiştiriyor — kurulduktan sonra geri almak kısmî ve hatalı olurdu.
       Bayrak burada harcanır, yani ferman sıradaki boss raundunu tutar. */
    if (this.isBossRound() && s.fermanPending) {
      s.bossVoided = true;
      s.fermanPending = false;
      s.roundStartNotes.push('🪶 FERMAN: boss koşulu iptal edildi — raund sıradan bir raund gibi oynanır (hedef aynı, ödül aynı).');
    }
    if (this.bossOn()) {
      if (s.boss.key === 'godzilla') {                                     // GDD 10/15 Boss Koşulu
        s.maxTurns = 3;
        s.target = Math.ceil(s.target * 0.9); // Grup J telafisi: 3 tur = %25 az fırsat
      }
      if (s.boss.key === 'misunderstood') s.target = Math.ceil(s.target * 1.25);
      // Kara Kedi: başlangıç eli de dönüşümden geçer (çekilişle aynı kural)
      if (s.boss.key === 'karaKedi') this._karaKediBite(s.hand, s.roundStartNotes);
      /* Freedom Fighters BOSS Koşulu (Grup F): boss, oyuncunun jokeri
         olmasa da 5 taş işaretler; bonus 2 KATI (değerin 20 katı) ve
         eline gelen her işaretli taşı açılımda KULLANMAK ZORUNLU. */
      if (s.boss.key === 'freedom') {
        s.bossFreedomMarks = [];
        for (let i = 0; i < 5; i++)
          s.bossFreedomMarks.push({
            color: COLORS[Math.floor(this.rng() * 4)],
            number: 1 + Math.floor(this.rng() * 13),
          });
        s.roundStartNotes.push('👹 Freedom Fighters işaretledi: '
          + s.bossFreedomMarks.map(m => `${COLOR_TR[m.color]} ${m.number}`).join(', ')
          + ' — eline gelen her işaretliyi AÇILIMDA KULLANMAK ZORUNDASIN');
      }
    }

    // Kıyamet Trompeti — jokerler kapanır, hedef %90 düşer (GDD 12 · P31 · Grup D: %80 → %90)
    if (this.slotRecs().some(j => j.key === 'kiyamet')) {
      s.jokersDisabled = true;
      s.target = Math.max(50, Math.ceil(s.target * KIYAMET_KEEP));
      s.roundStartNotes.push(`Kıyamet Trompeti: tüm joker efektleri kapalı, hedef %${Math.round((1 - KIYAMET_KEEP) * 100)} düştü`);
    }
    /* PINKY WARRIOR (P31 · Grup C) — küçükler ordusu. Okey işareti fiziksel
       taşa yazılır (isOkeyReal); deste her raund yeniden kurulduğu için
       etki raundla sınırlıdır. Özel taş, sahte okey ve deste jokeri hariç. */
    if (this.hasActive('pinkyWarrior')) {
      let n = 0;
      for (const t of [...s.deck, ...s.hand]) {
        if (t.jokerTile || t.fakeOkey || t.special || t.number > PINKY_MAX) continue;
        t.isOkeyReal = true; t.pinkyOkey = true; n++;
      }
      s.roundStartNotes.push(`🩷 Pinky Warrior: küçükler ordusu — 1, 2 ve 3'ler bu raund OKEY (${n} taş)`);
    }
    /* ADEM İLE HAVVA · YASAK ELMA (P31 · Grup I) — ele bir Elma taşı. Kimliği
       okeyin kimliğidir ama `copied` olduğu için asıl destenin 2 kopya
       sınırına girmez; raund bitince destede yeniden kurulmaz. */
    if (this.hasActive('yasakElma')) {
      if (this.realHandCount() < MAX_HAND) {
        s.hand.push({ id: nextTileId(s), color: s.okey.color, number: s.okey.number,
          isOkeyReal: true, copied: true, apple: true, origin: 'yasakElma' });
        s.roundStartNotes.push('🍎 Adem ile Havva: eline Yasak Elma geldi — her taşın yerine geçer, açılımı ×3. Açtığın an kovulursun.');
      } else {
        s.roundStartNotes.push('🍎 Adem ile Havva: ıstaka dolu — elma bu raund düşmedi');
      }
    }
    if (s.islekPermBonus > 0)
      s.islekRateBonus += s.islekPermBonus;

    // Sisyphus (Grup D): artık raund başı puanı YOK — kaya tur içinde yükselir
    if (this.hasActive('sisyphus'))
      s.roundStartNotes.push('🪨 Sisyphus: kaya en dipte — üst üste açılım yaptıkça yükselecek');
    /* Şeytan'ın Teklifi (GDD 12) — Playtest 6 KÖK NEDEN: joker Mythic
       fiyatına satın alınıyor, dolayısıyla alındıktan SONRAKİ raund başında
       cüzdan çoğu zaman 0 oluyordu; `applied` yine de işaretlendiği için
       joker tek kullanımını boşa harcayıp "hiç çalışmamış" gibi görünüyordu.
       Artık: coin yoksa TETİKLENMEZ (applied işaretlenmez, süre de azalmaz,
       bkz. _ageJokers) ve tetiklendiğinde `seytanPending` ile UI'da net bir
       pop-up gösterilir. Ayrıca roundMult ATANMIYOR, EKLENİYOR (eski `=`
       aynı raundda çalışan diğer çarpanları siliyordu) ve katsayı GDD'deki
       coin başına +50 puan / +0.2x değerine çekildi (eski 0.25x). */
    s.seytanPending = null;
    const seytanJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'seytan' && !j.applied);
    if (seytanJ && s.coins > 0) {
      seytanJ.applied = true;
      const sac = s.coins;
      const gainScore = sac * SEYTAN_SCORE;
      const gainMult = round2(sac * SEYTAN_MULT);
      s.score += gainScore;
      s.roundMult = round2(s.roundMult + gainMult);
      s.coins = 0;
      s.seytanPending = { coins: sac, score: gainScore, mult: gainMult };
      s.roundStartNotes.push(`😈 Şeytan'ın Teklifi: ${sac} coin feda → +${gainScore} puan, +${gainMult.toFixed(1)}x`);
    } else if (seytanJ) {
      s.roundStartNotes.push('😈 Şeytan\'ın Teklifi bekliyor: coinin olduğu ilk raund başında feda edilecek');
    }

    // Özel Normal Taşlar desteye karışır (GDD 6.5c)
    // P42: trainer deste içeriği açıksa bunlar dağıtımdan önce zaten eklendi (bkz. trSpDeck)
    if (!trSpDeck) for (const sp of s.specialTiles) {
      // Grup F (P22): `sid` taşı kendi kalıcı kaydına bağlar (yoğunluk okuması)
      const t = { id: nextTileId(s), color: sp.color, number: sp.number,
        special: sp.kind, sid: sp.sid, origin: 'vernik' };
      s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, t);
    }
    /* MIKNATIS (Grup H) — özel taşlar desteye karıştıktan SONRA çalışır:
       mıknatıslı taş bir Altın Taş da olabilir ve o taşlar bu satırın
       üstünde desteye giriyor. Deste jokerlerinden ÖNCE çalışır ki takasa
       konu olan el yalnız gerçek taşlardan oluşsun (deste jokeri bir taş
       değil, ele doğrudan eklenen bir karttır). */
    this._applyMagnets(s.roundStartNotes);
    // Deste jokerleri (Grup I, 2026-08): artık desteye KARIŞMAZ — sahip
    // olunan her deste jokeri raund başında doğrudan ELE gelir (GDD 10'dan
    // bilinçli sapma: doğal çekilişte raund boyunca hiç gelmeme sorunu).
    // Aktivasyon yine _onTurnStart'ta "eldeyken" kuralıyla yapılır.
    for (const j of s.deckJokers) {
      j.activeRound = false;
      s.hand.push({ id: nextTileId(s), jokerTile: j.key, jname: j.name });
    }
    // Hipnotizör — Toplu Hipnoz (yeniden tasarım 2026-08): rastgele bir
    // SAYI transa girer; o raund o sayıdaki taşlar açılımda çift değer.
    if (this.hasActive('hipnotizor')) {
      s.hipnoNumber = 1 + Math.floor(this.rng() * 13);
      s.roundStartNotes.push(`🌀 Toplu Hipnoz: ${s.hipnoNumber}'ler transta — açılımda çift değer!`);
    }
    // Pandora (Grup F) — kutu raund başında elde açılır
    const pandoraJ = this.slotRecs().find(j => j.key === 'truva' && !j.revealed);
    if (pandoraJ) this._revealPandora(pandoraJ, s.roundStartNotes);
    /* Pandora · ARMAĞAN — her raund başında 3 taş 13'e çıkar ve altın
       işaretlenir; açılımda o kombinasyonun puanını %25 artırır. */
    const armJ = this.slotRecs().find(j => j.key === 'truva' && j.pandora === 'armagan');
    if (armJ) {
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t)
        && !t.special && t.number < 13);   /* Grup D: joker dönüşümü özel taşa dokunmaz */
      let n = 0;
      for (let k = 0; k < PANDORA_ARMAGAN_TILES && cand.length; k++) {
        const t = cand.splice(Math.floor(this.rng() * cand.length), 1)[0];
        t.number = 13;
        t.gift = true;
        retune(t, 'pandoraArmagan');
        n++;
      }
      if (n) s.roundStartNotes.push(`🎁 Pandora (Armağan): ${n} taşın değeri 13 oldu `
        + `— açılımda kullandığın kombinasyonun puanı %${Math.round(PANDORA_ARMAGAN_BONUS * 100)} artar`);
    }
    /* Trade Jokeri — GRUP D (P20): PİYASA AÇILIŞI.
       Her raund yeniden çekilir: bir tür yükselişte, bir tür düşüşte,
       biri yatay. Sonuç `s.borsa`da durur ve UI'da canlı bir çip olarak
       yazar; oyuncu turunu ona göre planlar. */
    s.borsa = null;
    s.borsaMelds = 0;
    const tradeJ = this.slotRecs().find(j => j.key === 'tradeJokeri');
    if (tradeJ) {
      const pool = [...BORSA_TYPES];
      const up = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      const down = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      s.borsa = { up, down, flat: pool[0] };
      tradeJ.phase = 'market';   // eski 'boost'/'debt' alanı artık kullanılmıyor
      s.roundStartNotes.push(
        `📈 Piyasa açıldı: ${TYPE_TR[up]} YÜKSELİŞTE (hisseleri temettü öder) · `
        + `📉 ${TYPE_TR[down]} DÜŞÜŞTE (hisselerinin yarısı yanar)`);
    }
    // Ateş Tüccarı (P30 · Grup K) — çalınan ateşin borcu işlek riskine yansır
    if (s.promDebt > 0) {
      s.islekRateBonus += s.promDebt;
      s.roundStartNotes.push(`Ateş Tüccarı borcu: bu raund işlek riski +%${Math.round(s.promDebt * 100)}`);
      s.promDebt = 0;
    }
    /* Void (GDD 12) — GRUP L (P20): ELİN YARISI + TELAFİ ÇEKİŞİ.
       Yutulacak taşlar rastgele seçilir (en iyileri kendin saklayamazsın —
       kumar tarafı korunur), ama okey / deste jokeri / dikili taşlar
       dokunulmazdır: onların kaybı ödülle telafi edilemeyecek kadar
       yıkıcı olurdu. */
    /* GRUP F (kullanıcı raporu 2026-09-06) — RAUND BAZLI TETİKLENME.
       Eski koşul `!j.applied` idi: joker run boyunca YALNIZ BİR KEZ
       çalışıyordu. `uses: 1` olduğu için normalde görünmüyordu, ama süresi
       uzatılan/korunan bir Boşluk (Sarmaşık, Ustanın Mührü, Zaman Kumu,
       Trainer'ın ∞ süresi) 2. raundtan itibaren hiç tetiklenmiyordu.
       Kağıt Jokeri'nde Playtest 20'de düzeltilen kalıbın aynısı. */
    const kdRoundKey = `${s.stage}-${s.roundInStage}`;
    s.voidPending = null;
    const kdJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'karaDelik'
      && j.appliedRound !== kdRoundKey);
    if (kdJ) {
      kdJ.appliedRound = kdRoundKey;
      kdJ.applied = true;   // eski alan (kayıt uyumu)
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey
        && !this.isOkeyTile(t) && !t.sewn && !t.bossSewn);
      const n = Math.floor(cand.length / 2);
      const eaten = [];
      for (let k = 0; k < n && cand.length; k++)
        eaten.push(cand.splice(Math.floor(this.rng() * cand.length), 1)[0]);
      for (const t of eaten) this._takeTile(t, 'void');
      s.score += n * VOID_SCORE;
      s.permMult = round2(s.permMult + VOID_MULT * n);
      // telafi: yutulanın yarısı kadar yeni taş — el işlevsiz kalmasın
      const refill = Math.ceil(n / 2);
      let drew = 0;
      for (let k = 0; k < refill && s.deck.length; k++) { s.hand.push(s.deck.shift()); drew++; }
      s.roundStartNotes.push(`🕳 Boşluk elinin yarısını (${n} taş) yuttu: `
        + `+${n * VOID_SCORE} puan, +${(VOID_MULT * n).toFixed(2)}x KALICI çarpan`
        + (drew ? ` · yerine ${drew} yeni taş çektin` : ''));
      /* Grup F: artık sessiz değil — Şeytan'ın Teklifi deseninde pop-up. */
      s.voidPending = { tiles: n, score: n * VOID_SCORE, mult: round2(VOID_MULT * n), drew };
    }
    /* İPOTEK (P30 · Grup G) — BORÇ TAHSİLATI. Boss kurulumundan (Godzilla
       tur sayısını 3'e çeker) SONRA çalışır ki kesinti gerçek tur sayısından
       düşülsün; en az 1 tur kalır. Kart satılmış ya da kırılmış olsa da
       borç ödenir — yoksa "kullan, sonra sat" bedelsiz olurdu. */
    s.ipotekPayRound = null;
    if (s.ipotekDebt) {
      const before = s.maxTurns;
      s.maxTurns = Math.max(1, s.maxTurns - IPOTEK_TURNS);
      s.ipotekDebt = false;
      s.ipotekPayRound = `${s.stage}-${s.roundInStage}`;
      s.roundStartNotes.push(`🏦 İpotek borcu tahsil edildi: bu raund ${before - s.maxTurns} tur eksik (${s.maxTurns} tur) — bu raund İpotek kullanılamaz`);
    }
    /* Nostradamus — kehanet ilan edilir (GDD 12).
       GRUP F/3 (2026-09-06): ilan bayrağı da RUN bazlıydı (`!j.prophecy`),
       yani 2. raundtan itibaren kehanet SESSİZCE yürürlükteydi — ödül
       raund sonunda veriliyordu ama oyuncu hedefi hiç görmüyordu. Bayrak
       raund anahtarına bağlandı; `prophecy` alanı raund sonu denetimi ve
       kayıt uyumu için aynen duruyor. */
    const nosRoundKey = `${s.stage}-${s.roundInStage}`;
    const nosJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'nostradamus'
      && j.prophecyRound !== nosRoundKey);
    if (nosJ) {
      nosJ.prophecyRound = nosRoundKey;
      nosJ.prophecy = true;
      s.roundStartNotes.push(`Nostradamus kehaneti: bu raundu ilk 2 turda geç → +${NOSTRA_MULT.toFixed(1)}x KALICI çarpan`);
    }
    /* KAĞIT (P31 · Grup J) — en düşük 2 asıl deste taşı KALICI okeye döner.
       Okey Mührü ile aynı defter: `tileMods` remove (taşın eski kimliği
       desteden gider) + okeyClone (her raund okey kopyası kurulur). Eldeki
       taş anında okey olur. Raund bazlı bayrak (bkz. raund-bazlı tetiklenme
       dersi): süresi uzatılan Kağıt her raund yeniden çalışır. */
    const roundKey = `${s.stage}-${s.roundInStage}`;
    const kgJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'kagit'
      && j.appliedRound !== roundKey);
    if (kgJ) {
      kgJ.appliedRound = roundKey;
      const low = [...s.hand]
        .filter(t => IS_BASE_TILE(t) && !this.isOkeyTile(t) && !t.sewn && !t.bossSewn)
        .sort((a, b) => a.number - b.number).slice(0, KAGIT_TILES);
      const faces = [];
      for (const t of low) {
        faces.push(`${COLOR_TR[t.color]} ${t.number}`);
        s.tileMods.push({ op: 'remove', color: t.color, number: t.number });
        s.tileMods.push({ op: 'okeyClone' });
        this._dropMagnet(t);
        t.color = s.okey.color; t.number = s.okey.number;
        t.isOkeyReal = true; t.copied = true; t.origin = 'kagit';
      }
      s.roundStartNotes.push(low.length
        ? `📃 Kağıt: ${faces.join(', ')} KALICI olarak okeye dönüştü`
        : '📃 Kağıt: okeye çevrilecek uygun taş yok');
    }
    // Kahin — kehanet hedefi (GDD 10, tek hedefli uyarlama)
    s.kahinGoal = null;
    if (this.hasActive('kahin')) {
      const goals = [
        { key: 'perAc', text: 'Bu raund en az 1 Per aç', reward: 'score', amount: 200 },
        { key: 'cift2', text: 'Aynı turda 2+ Çift aç', reward: 'score', amount: 150 },
        { key: 'turn2', text: 'Raundu ilk 2 turda geç', reward: 'coin', amount: 3 },
      ];
      s.kahinGoal = { ...goals[Math.floor(this.rng() * goals.length)], done: false };
      s.roundStartNotes.push(`🔮 Kahin hedefi: "${s.kahinGoal.text}" → +${s.kahinGoal.amount} ${s.kahinGoal.reward === 'coin' ? 'coin' : 'puan'}`);
    }
    /* Tüccar (GDD 10) — takas teklifi.
       PLAYTEST 17 · GRUP B/11 (kullanıcı kararı 2026-08-28): teklif artık
       HER RAUND değil HER TUR gelir. Kervan bir raund boyunca tek bir kez
       uğrayan pasif bir olay değil, her turda karar verdiren canlı bir
       pazarlıktır — hem boss varyantında (reddetme hakkı yok, her tur bir
       bedel) hem normal Slot Jokeri hâlinde. Üretim `_tuccarTurnOffer`e
       taşındı; burada yalnız RAUND bazlı sayaçlar sıfırlanır. */
    s.tuccarOffer = null;
    s.tuccarDraw = 0;
    s.tuccarTaken = [];   // bu raundta kabul edilen teklif anahtarları
    // Bungie Gum — sabitlenen taşlar ve birikim raund başında sıfırlanır
    s.bungieSum = 0;      // Grup Q: artık kullanılmıyor (eski kayıt uyumu)
    s.bungieTiles = [];   // Grup Q: sabit alan kaldırıldı, hep boş kalır
    /* Playtest 10: sakızda bekleyen taşlar raundu AŞMAZ — son turda açılan
       taşlar yeni raunda taşınmasın (yeni raund yeni el demek). */
    s.bungiePending = [];
    s.yankiPending = null;   // P29 · Grup B — Hayalet'in bekleyen taşı
    // The Corporates — raund görevi (GDD 10, raund bazlı uyarlama)
    s.corpTask = null;
    if (this.bossOn() && s.boss.key === 'corporates') {
      // Boss Koşulu: tek şirket, RAUND BOYU geçerli ağır görev; başarısızlık
      // doğrudan Game Over (bkz. _finishWin/discard raund sonu kontrolü)
      const keys = Object.keys(CORPS_BOSS);
      const k = keys[Math.floor(this.rng() * keys.length)];
      const base = CORPS.find(c => c.key === k);
      s.corpTask = { ...base, text: CORPS_BOSS[k].text, boss: true, done: false, failed: false };
      s.roundStartNotes.push(`👹 ${base.name} (BOSS): "${CORPS_BOSS[k].text}" — başaramazsan GAME OVER`);
    }
    const corpJ = !s.corpTask && this.hasActive('corporates') && this.slotRecs().find(j => j.key === 'corporates');
    if (corpJ) {
      const pool = CORPS.filter(c => c.key !== corpJ.lastCorp);
      const c = pool[Math.floor(this.rng() * pool.length)];
      corpJ.lastCorp = c.key;
      s.corpTask = { ...c, done: false, failed: false };
      s.roundStartNotes.push(`🏢 ${c.name}: "${c.text}" → ödül: ${c.rewardText} / ceza: ${c.penaltyText}`);
    }
    // Dedikodu Masası (Grup F) — 3 açık taşlık yan masa kurulur
    this._setupGossipTable(s.roundStartNotes);
    this._onTurnStart(s.roundStartNotes);
    this._rollKumarbaz();
  },

  /* ============================================================
     GRUP F (Playtest 6) — GDD Bölüm 10'daki 20 Epic'in kalan 12'sinin
     BOSS KOŞULLARI. Burası yalnız boss raundunda çalışır; joker değildir,
     Kıyamet Trompeti'nden (jokersDisabled) etkilenmez.
     Uyarlama notları efektlerin yanında.
     ============================================================ */
  /* PLAYTEST 17 · GRUP B/11 — TÜCCAR HER TUR TEKLİF SUNAR.
     Eskiden teklif `_startRound` içinde bir kez üretiliyordu; boss
     varyantında bu, "reddetme hakkın yok" diye tanıtılan koşulu raund
     başına TEK bir bedele indiriyordu ve Tüccar boss'u 20 boss'un en
     hafifi hâline getiriyordu. Normal (Slot Jokeri) hâlinde de kervan
     raund boyunca bir kez uğrayıp kayboluyordu.
     Kurallar:
       · BOSS: her tur yeni agresif teklif. Önceki turun teklifi
         çözülmeden kaldıysa ATLANAMAZ — cezası kendiliğinden uygulanır
         (reddetme hakkı yok kuralının doğal sonucu), sonra yenisi gelir.
       · JOKER: her tur yeni teklif; çözülmeden kalan teklif sessizce
         geçer (reddediş sayılmaz, ceza yok). Bir teklif TÜRÜ raund başına
         yalnız bir kez kabul edilebilir (`tuccarTaken`) — böylece her tur
         GERÇEKTEN yeni bir teklif gelir ve "+1.5x çarpanı her tur al"
         gibi katlanan sömürüler doğmaz. */
  _tuccarTurnOffer(events) {
    const s = this.state;
    const tucBoss = this.bossOn() && s.boss.key === 'tuccar';
    const tucJ = !tucBoss && this.hasActive('tuccar') && this.slotRecs().find(j => j.key === 'tuccar');
    if (!tucBoss && !tucJ) { s.tuccarOffer = null; return; }

    // Önceki turdan kalan teklifi kapat
    if (s.tuccarOffer) {
      if (s.tuccarOffer.boss) {
        const prev = s.tuccarOffer.options[0];
        const pdef = TUCCAR_BOSS_OFFERS.find(o => o.key === prev.key);
        if (pdef) events.push('👹 Tüccar: geçen turun bedeli ödenmedi — ' + pdef.penalty(s, this));
      }
      s.tuccarOffer = null;
    }

    if (tucBoss) {
      const pool = TUCCAR_BOSS_OFFERS.filter(o => o.canPay(s));
      const picks = [];
      while (picks.length < 2 && pool.length)
        picks.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
      const chosen = picks.length ? picks : [TUCCAR_BOSS_OFFERS[1]];
      s.tuccarOffer = { boss: true,
        options: chosen.map(o => ({ key: o.key, text: o.text, cost: o.cost })) };
      events.push('👹 Tüccar (BOSS): bedeli öde ya da cezayı ye — reddetme hakkın yok');
      return;
    }

    const taken = s.tuccarTaken || (s.tuccarTaken = []);
    const pool = TUCCAR_OFFERS.filter(o => o.can(s) && !taken.includes(o.key));
    const picks = [];
    while (picks.length < 2 && pool.length)
      picks.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
    if (picks.length) {
      s.tuccarOffer = { options: picks.map(o => ({ key: o.key, text: o.text, cost: o.cost })) };
      events.push(`🐪 Tüccar kervanı: ${picks.length} takas teklifi var — birini seç ya da reddet`);
    }
  },

  _bossTurnStart(events) {
    const s = this.state;
    const key = s.boss.key;
    const plain = () => s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t));
    const pick = (arr) => arr.splice(Math.floor(this.rng() * arr.length), 1)[0];

    /* FREEDOM FIGHTERS — PLAYTEST 9 · GRUP P (kullanıcı kararı).
       Eski hâli GDD'deki "işaretli 5 taşın bonusu 2 katına çıkar (değerin
       20 katı)" cümlesini BOSS'UN KENDİSİNİN ödediği bir bonus olarak
       uyguluyordu: oyuncu Freedom jokerine sahip olmasa bile işaretli taş
       eline gelir gelmez taş değeri × 20 puan yazılıyordu. Ölçüm (N=300):
       jokersiz oyuncu raund başına ORTALAMA +245 bedava puan alıyordu —
       C1 boss hedefinin %45'i. Yani boss'un kendisi oyuncuya çalışıyordu.
       KULLANICI KARARI: "boss raundunda bana bir artı özellik veremez,
       o boss'a karşı oynuyoruz." Artık boss YALNIZCA İŞARETLER — tek bir
       puan bile ödemez; koşul saf bir kısıttır: işaretli taşları açılımda
       kullanmak zorundasın. (Oyuncu Freedom jokerine SAHİPSE joker kendi
       bonusunu +10×değer olarak vermeye devam eder — o jokerin işi,
       boss'un değil; bkz. _onTurnStart'taki ffJ dalı.)
       GDD 10'un "20 katı" cümlesinden BİLİNÇLİ SAPMA. */
    if (key === 'freedom' && (s.bossFreedomMarks || []).length) {
      const fresh = [];
      for (const t of s.hand) {
        if (t.jokerTile || t.ffMarkedTile) continue;
        if (!s.bossFreedomMarks.some(m => m.color === t.color && m.number === t.number)) continue;
        t.ffMarkedTile = true;
        t.ffMarkedTurn = s.turn;   // Grup P: son turda gelene zorunluluk işlemez
        fresh.push(t);
      }
      if (fresh.length)
        events.push(`👹 Freedom Fighters işaretledi: ${fresh.map(t => COLOR_TR[t.color] + ' ' + t.number).join(', ')} — bu taşları AÇILIMDA KULLANMALISIN`);
    }

    /* ZOMBIE — "Her tur çekilen 3 taştan 1'i enfekte (boş) gelir; her tur
       yanındaki kullanılmayan taşı da etkisiz kılar."
       Uyarlama: çekiliş anındaki enfekte etiketi _bossOnDraw'da veriliyor;
       burada tur başında elde kalan bir taş daha etkisizleşiyor. Etkisiz taş
       açılıma GİREBİLİR ama ham değeri 0 sayılır (bkz. comboSum). */
    if (key === 'zombie') {
      const cand = plain().filter(t => !t.bossInfected);
      if (cand.length) {
        const t = pick(cand);
        t.bossInfected = true;
        events.push(`👹 Zombie: ${COLOR_TR[t.color]} ${t.number} enfekte oldu — açılımda 0 puan`);
      }
    }

    /* UZAYLI — "SİNSİ BULAŞMA" (Grup H, Playtest 7, kullanıcı kararı)
       Eski uyarlama hiçbir taşı yok etmiyordu: gizli uzaylı komşusunun
       kimliğini kendine EŞİTLİYORDU, yani el hiç küçülmüyor, üstelik iki
       özdeş taş = bedava Çift açılımı çıkıyordu — koşul oyuncunun LEHİNE
       çalışıyordu. Yeni kural taşları değil AÇILIMI hedefler: her tur
       başında elindeki 3 taş gizlice uzaylıya dönüşür (görünmezler) ve
       gizli uzaylı içeren HER kombinasyon onay anında ÇÖKER — 0 puan verir,
       taşları ele geri döner. Hangi taşın uzaylı olduğunu bilmediğin için
       büyük kombinasyonlar gerçek bir kumar hâline gelir.
       (Çöküş mantığı confirmMelds içindeki _bossAlienCollapse'ta.) */
    if (key === 'uzayli') {
      for (const t of s.hand) delete t.hiddenAlien;
      const cand = plain();
      let n = 0;
      for (let k = 0; k < ALIEN_HIDDEN_PER_TURN && cand.length; k++) { pick(cand).hiddenAlien = true; n++; }
      s.bossAlienCount = n;
      if (n) events.push(`👹 Uzaylı: elindeki ${n} taş gizlice uzaylıya dönüştü — hangileri olduğunu göremezsin`);
    }

    /* ============================================================
       THE CHEATING (BOSS) — PLAYTEST 19 · GRUP G'DE YENİDEN TASARLANDI
       (kullanıcı onayı: "önce böbürlenir, sonra dener").

       ESKİ HÂLİ NEDEN HİSSEDİLMİYORDU:
         (a) SESSİZ ZAR: etki tur başında anında çözülüyordu; oyuncu ne
             olacağını önceden bilmediği için tepki veremiyor, olan biteni
             de tur başındaki 5-6 satırlık not yığını içinde kaçırıyordu.
         (b) ÖLÇEKSİZ CEZALAR: çalınan puan `max(40, hedefin %5'i)`, taş
             hasarı yalnız -3, çarpan düşüşü -0.5x idi. Stage 4'te hedef
             1160; 40-58 puanlık bir hırsızlık fark edilmiyordu bile.

       YENİ AKIŞ — TELEGRAFLI TEHDİT:
         1) TUR BAŞI: boss ne DENEYECEĞİNİ açıkça söyler ve bunu
            `s.bossCheatPlan`e yazar → boss banner'ında canlı durur, yani
            oyuncu turu ona göre oynayabilir ("puan çalacak, o hâlde bu tur
            küçük açılım yapmayayım").
         2) TUR SONU (discard içinde, _bossCheatResolve): %50 zar atılır ve
            sonuç NET bir bildirimle çözülür — tuttu ya da açığa çıktı.
         3) `s.bossCheatStats` kaç denemenin kaçının tuttuğunu sayar; boss
            banner'ında "Hile: 2/4 tuttu" olarak görünür.

       CEZALAR ARTIK ÖLÇEKLENİYOR (bkz. BOSS_CHEAT_* sabitleri):
         · puan çalma  : o raundda kazandığın puanın %15'i (biriktikçe acıtır)
         · çarpan      : -1.0x (raund boyu)
         · taş bozma   : rastgele bir taşın değeri 1'e düşer (net ve okunur)
       ============================================================ */
    if (key === 'cheating') {
      /* PLAYTEST 21 — plan TEK KOLA indirildi: her zaman ELİNDEN çalar.
         Eski iki kollu hâli (elden / desteden) açıklamayı üç cümleye
         çıkarıyordu ve "destenden 2 taş" kolu zaten görünmez bir cezaydı —
         oyuncu destesinin küçüldüğünü o tur hissetmiyordu. Elden çalma kolu
         telegraflı akışın (tur başı ilan → tur sonu zar) tamamını korur ve
         gerçek bir karar üretir: yüksek taşını tur bitmeden aç mı, tut mu?
         'deck' kolu kod tarafında duruyor (eski kayıtlar restore edilince
         plan.kind 'deck' olabilir), ama artık yeni plan olarak seçilmez. */
      const kinds = [];
      if (plain().length) kinds.push('hand');
      if (kinds.length) {
        const kind = kinds[Math.floor(this.rng() * kinds.length)];
        s.bossCheatPlan = { kind, chance: BOSS_CHEAT_CHANCE };
        events.push(`👹 The Cheating hazırlanıyor: bu tur ${BOSS_CHEAT_TR[kind]} `
          + `(%${Math.round(BOSS_CHEAT_CHANCE * 100)} ihtimalle tutar)`);
      }
    }

    /* TERZİ'NİN İĞNESİ — "Her tur 2 taş dikilir: atılamaz VE açılımda
       kullanılamaz, puan değerleri 0'a düşer. Tur bitince serbest kalır."
       Uyarlama: "kullanılamaz" kuralını uyguluyoruz (0 puan yerine tam yasak
       — daha okunur ve GDD'nin ilk cümlesiyle uyumlu). */
    if (key === 'terziIgne') {
      for (const t of s.hand) delete t.bossSewn; // önceki tur serbest kaldı
      const cand = plain();
      const sewn = [];
      for (let k = 0; k < 2 && cand.length; k++) {
        const t = pick(cand);
        t.bossSewn = true;
        sewn.push(t);
      }
      if (sewn.length)
        events.push(`👹 İğne ${sewn.map(t => COLOR_TR[t.color] + ' ' + t.number).join(', ')} taşlarını dikti — bu tur ne atılır ne açılır`);
    }

    /* AVUKAT — "Her tur rastgele 1 jokerin o turki efekti iptal edilir;
       joker yok olmaz. Her tur FARKLI bir joker deaktif olur." */
    if (key === 'avukat') {
      const recs = this.slotRecs();
      if (recs.length) {
        let pool = recs.filter(j => j.key !== s.bossMutedJoker);
        if (!pool.length) pool = recs;
        const j = pool[Math.floor(this.rng() * pool.length)];
        s.bossMutedJoker = j.key;
        events.push(`👹 Avukat ${j.name} jokerini bu tur susturdu — efekti çalışmayacak`);
      } else {
        s.bossMutedJoker = null;
      }
    }

    /* KAHİN — "Her tur 1 ZORUNLU kehanet; uymazsan o turun tüm puanı
       sıfırlanır. Tüm turlarda uyarsan raund sonunda +500 puan." */
    if (key === 'kahin') {
      /* PLAYTEST 17 · GRUP B/10 — KEHANETLER GERÇEKTEN TALEP ETSİN.
         Ceza mekanizmasının kendisi çalışıyor (tests/test_kahin17.js, 17
         doğrulama), ama eski havuzun 5 kehanetinden 3'ü ("1 Per aç",
         "1 Sıralı aç", "5 taş kullan") normal bir turda zaten kendiliğinden
         tutuyordu. Ceza hiç tetiklenmediği için boss oyuncuya NET ARTI
         veriyordu. Havuz artık gerçek bir kısıt koyar: her kehanet, o turun
         açılımını bilerek şekillendirmeyi gerektirir. */
      const goals = [
        { key: 'cift2',  text: 'Bu tur en az 2 Çift aç' },
        { key: 'combo2', text: 'Bu tur en az 2 kombinasyon aç' },
        { key: 'perFull', text: 'Bu tur 4 taşlı bir Per aç' },
        { key: 'siraliLong', text: 'Bu tur en az 4 taşlı bir Sıralı aç' },
        { key: 'tiles7', text: 'Bu tur en az 7 taş kullan' },
        { key: 'noOkey', text: 'Bu tur okey KULLANMADAN aç' },
      ];
      s.bossOracle = { ...goals[Math.floor(this.rng() * goals.length)], met: false };
      events.push(`👹 Kahin ZORUNLU kehanet: "${s.bossOracle.text}" — uymazsan bu turun puanı SIFIR`);
    }

    /* AYNA KRAL — "Yansıma tersine çalışır: biriken puan kazanımdan düşülür."
       Birikim confirmOpen'da işlenir; burada yalnız bilgi satırı. */
    if (key === 'aynaKral' && (s.bossMirrorDebt || 0) > 0)
      events.push(`👹 Ayna Kral: ${s.bossMirrorDebt} puanlık yansıma borcu sıradaki açılımdan düşülecek`);

    /* RİTİM — "Her açılımdan önce ritim sekansı; tutturamazsan o açılım hiç
       puan vermez." needsRitim/setRitimResult altyapısı kullanılır. */
    if (key === 'ritim') {
      s.ritimDone = false;
      s.ritimBonus = 0;
    }
  },

  /* Çekiliş anındaki boss etkileri (Grup F) — desteden gelen taşlara uygulanır */
  _bossOnDraw(drawn, events) {
    const s = this.state;
    const key = s.boss.key;
    const plain = drawn.filter(t => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t));

    /* ZOMBIE — çekilen taşların yaklaşık 1/3'ü enfekte (0 puanlık) gelir */
    if (key === 'zombie' && plain.length) {
      const n = Math.max(1, Math.round(plain.length / 3));
      const pool = [...plain];
      for (let i = 0; i < n && pool.length; i++)
        pool.splice(Math.floor(this.rng() * pool.length), 1)[0].bossInfected = true;
      events.push(`👹 Zombie: çekilen ${n} taş enfekte geldi (açılımda 0 puan)`);
    }

    /* GLITCH (eski ad: Dervish) — PLAYTEST 9 · GRUP N.
       Eski koşul: "çekilen 3 taştan 2'si glitch, birinde gizli -4 puan".
       İki sorun vardı: (1) tur başına 3 taş çekildiği varsayımı bayattı
       — oyun uzun süredir 5 taş çektiriyor, yani glitch oranı sessizce
       %67'den %40'a düşmüştü; (2) -4 puanlık sabit ceza C1'de bile
       görünmezdi, C8'de (hedef 4750) tamamen anlamsızdı.
       Yeni koşul: çekilen 5 taşın 3'ü glitch gelir ve BUNLARIN İKİSİ
       BOZUKTUR. Bozuk taşı açılımda kullanırsan ceza SABİT DEĞİL ORANSAL:
       o açılımın puanı taş başına %25 düşer (iki bozuk taş → %56 kalır).
       Böylece ceza stage'le birlikte büyür ve gerçekten boss ağırlığında
       hissedilir. Belirsizlik de arttı: 3 glitch taşın 2'si kötü (%67).
       Discard hâlâ güvenli — "kullan mı at mı" kararı koşulun kalbi. */
    if (key === 'dervish' && plain.length) {
      const pool = [...plain];
      const marked = [];
      for (let i = 0; i < GLITCH_BOSS_TILES && pool.length; i++) {
        const t = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
        t.glitch = true;
        marked.push(t);
      }
      if (marked.length) {
        const bad = [...marked];
        for (let i = 0; i < GLITCH_BOSS_CURSED && bad.length; i++)
          bad.splice(Math.floor(this.rng() * bad.length), 1)[0].glitchCurse = true;
        const nBad = marked.filter(t => t.glitchCurse).length;
        events.push(`👹 GLITCH: ${marked.length} taş glitch'li geldi — ${nBad} tanesi BOZUK, açılımda kullanırsan puanı düşürür`);
      }
    }

    /* UZAYLI — gizli uzaylılar artık yalnız TUR BAŞINDA seçilir
       (_bossTurnStart); çekilişte ayrıca işaretleme yapılmaz, yoksa aynı
       turda 4 uzaylı olurdu. */
  },

  /* Tur başı efektleri — raund başında ve her çekişten sonra çalışır */
  /* ============================================================
     THE CHEATING (BOSS) — TUR SONU ÇÖZÜMÜ (Grup G, P19).
     Tur başında duyurulan plan burada zar atılarak çözülür. discard()
     içinden, `openedThisTurn` hâlâ geçerliyken çağrılır.
     ============================================================ */
  /* Grup G (P19) — UI'ın büyük "hile" bildirimini çizmesi için olay bırakır.
     Tek alan yerine KUYRUK: bir discard() çağrısı hem bossun tur sonu
     çözümünü hem de hemen ardından başlayan turun joker atışını
     üretebilir; tek alan olsaydı ikincisi birincisini ezerdi. */
  _cheatFlash(ev) {
    const s = this.state;
    if (!Array.isArray(s.cheatFlash)) s.cheatFlash = [];
    s.cheatFlash.push(ev);
  },

  _bossCheatResolve(events) {
    const s = this.state;
    const plan = s.bossCheatPlan;
    if (!plan) return;
    s.bossCheatPlan = null;
    if (!s.bossCheatStats) s.bossCheatStats = { tries: 0, hits: 0 };
    s.bossCheatStats.tries++;

    if (this.rng() >= (plan.chance || BOSS_CHEAT_CHANCE)) {
      /* Açığa çıktı — oyuncu için somut bir ödül: coin ve (varsa) daha
         önce çalınan taşlardan BİRİ geri gelir. "Hiçbir şey olmadı"
         satırı yerine kazanılmış bir tur hissi. */
      gainCoins(s, BOSS_CHEAT_CAUGHT_COIN);
      let back = null;
      if ((s.bossCheatBag || []).length) {
        back = s.bossCheatBag.pop();
        s.hand.push(back);
        s.bossCheatTook = Math.max(0, (s.bossCheatTook || 0) - 1);
      }
      this._cheatFlash({ side: 'boss', kind: 'exposed', coin: BOSS_CHEAT_CAUGHT_COIN,
        back: back ? { color: back.color, number: back.number } : null });
      events.push(`👹 Hile AÇIĞA ÇIKTI — bu tur temiz, +${BOSS_CHEAT_CAUGHT_COIN} coin`
        + (back ? ` ve ${COLOR_TR[back.color]} ${back.number} geri geldi` : ''));
      return;
    }

    s.bossCheatStats.hits++;
    if (!Array.isArray(s.bossCheatBag)) s.bossCheatBag = [];
    if (plan.kind === 'hand') {
      /* Elden çalar ve EN YÜKSEK taşı seçer — "boss da iyi malı alır".
         Okey, deste jokeri ve dikili taşlar dokunulmaz. */
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey
        && !this.isOkeyTile(t) && !t.sewn && !t.bossSewn);
      if (cand.length) {
        const t = cand.reduce((a, b) => (b.number > a.number ? b : a));
        this._takeTile(t, 'boss-hile');
        s.bossCheatBag.push(t);
        s.bossCheatTook = (s.bossCheatTook || 0) + 1;
        this._cheatFlash({ side: 'boss', kind: 'stealHand', color: t.color, number: t.number });
        events.push(`👹 Hile TUTTU: elinden ${COLOR_TR[t.color]} ${t.number} çalındı`);
      } else {
        s.bossCheatStats.hits--;
        events.push('👹 Hile tuttu ama elinde çalınacak taş yok — bu tur temiz');
      }
    } else {
      const n = Math.min(BOSS_CHEAT_DECK_N, (s.deck || []).length);
      if (n > 0) {
        const taken = s.deck.splice(0, n);
        s.bossCheatBag.push(...taken);
        s.bossCheatTook = (s.bossCheatTook || 0) + n;
        this._cheatFlash({ side: 'boss', kind: 'stealDeck', n });
        events.push(`👹 Hile TUTTU: destenden ${n} taş çalındı`);
      } else {
        s.bossCheatStats.hits--;
        events.push('👹 Hile tuttu ama deste boş — bu tur temiz');
      }
    }
  },

  _onTurnStart(events) {
    const s = this.state;
    /* CRIMSON KING · KANLI TAÇ (P31 · Grup H) — taç her tur açılımda bonus
       veren jokerlerden RASTGELE birine geçer (sıra yok, kendisi hariç). */
    s.crownId = null;
    if (this.hasActive('crimsonTac')) {
      const keys = this._meldBonusKeys();
      const cand = s.jokers.filter(j => j.key !== 'crimsonTac'
        && this._recsOf(j).some(r => keys.has(r.key)));
      if (cand.length) {
        const c = cand[Math.floor(this.rng() * cand.length)];
        s.crownId = c.id;
        events.push(`👑 Crimson King: taç bu tur ${c.name} jokerinde — açılım etkisi iki kez işler`);
      } else {
        events.push('👑 Crimson King: açılımda bonus veren jokerin yok — taç boşta kaldı');
      }
    }
    // deste jokeri aktivasyonu (GDD 10 — eline gelince)
    for (const j of s.deckJokers) {
      if (!s.hand.some(t => t.jokerTile === j.key)) continue;
      j.drawnThisRound = true;
      if (!j.activeRound) {
        j.activeRound = true;
        /* PLAYTEST 9 · GRUP K — Ahtapot bu TURDA aktifleşti işareti.
           Kol fedası bir sonraki turda başlar (aşağıya bak). */
        if (j.key === 'ahtapot') j.justActivated = true;
        events.push(`◈ ${j.name} eline geldi — aktif!`);
        if (j.key === 'misunderstood' && !s.misuActive && !s.jokersDisabled) {
          s.misuActive = true;
          s.target = Math.ceil(s.target * 1.15);
          events.push('The Misunderstood: hedef puan +%15 arttı');
        }
      }
    }
    /* Grup E — Ateş Taşı: elde beklerken yanar. Açılımda kullanılınca büyük
       puan verir (+120), ama elde tutulduğu her tur -15 puan. "Hemen kullan"
       baskısı yaratan tek özel taş. */
    const atesHand = s.hand.filter(t => t.special === 'ates').length;
    if (atesHand) {
      const burn = 15 * atesHand;
      s.score = Math.max(0, s.score - burn);
      events.push(`🔥 Ateş Taşı elinde yanıyor: -${burn} puan`);
    }
    s.turnScore = 0;
    s.fatalityHit = false;
    // Grup F — tur bazlı boss sayaçları
    s.turnComboCount = 0;
    s.turnAllCift = true;
    s.bossOracle = null;
    // Grup B/11 — Tüccar HER TUR yeni teklif sunar
    this._tuccarTurnOffer(events);
    // Boss koşulları (GDD 10) — joker değildir, Kıyamet'ten etkilenmez
    if (this.bossOn()) {
      if (s.boss.key === 'kirby') {
        // okey taşları değer aşınmasından muaf (fiziksel okey işareti korunur)
        const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey
          && !this.isOkeyTile(t) && !t.special);   /* Grup D: joker dönüşümü özel taşa dokunmaz */
        /* Grup A: HANGİ taşın kemirildiği yazılır. Eskiden yalnız sayı
           vardı; değeri düşen taş oyuncuya "kayboldu" gibi görünüyordu. */
        const bitten = [];
        for (let k = 0; k < 3 && cand.length; k++) {
          const t = cand.splice(Math.floor(this.rng() * cand.length), 1)[0];
          // Grup B: boss varyantı da değeri değiştirir → retuned İŞARETİ ŞART
          if (t.number > 1) {
            bitten.push(`${COLOR_TR[t.color]} ${t.number}→${t.number - 1}`);
            t.number--; retune(t, 'kirbyBoss');
          }
        }
        if (bitten.length)
          events.push(`👹 Sir.by kemirdi: ${bitten.join(', ')}`);
      }
      /* CELLAT (Playtest 18 · GRUP C — kullanıcı kararı 2026-08-28).
         ESKİ HÂLİ: "her tur EN DÜŞÜK 2 taş silinir" — DETERMİNİSTİKti ve
         Sir.by'ın ("her tur 3 taşın değeri -1", yani yine en ucuz taşları
         aşındıran) mantığıyla neredeyse aynı hissettiriyordu: iki boss da
         elinin dip ucunu kemiriyor, oyuncu ikisine de aynı şekilde (çöp
         taşları önce harca) tepki veriyordu.
         YENİ HÂLİ: idam edilecek 2 taş TAMAMEN RASTGELE seçilir. Fark
         mekanik değil PSİKOLOJİK: Sir.by öngörülebilir bir aşınmadır
         (hangi taşların gideceğini bilir, planına katarsın), Cellat ise
         kurduğun açılımı da götürebilen bir RİSKtir — bu yüzden "elini
         uzun tutup büyük vur" yerine "eldekini bir an önce bas" oynatır.
         Okey ve deste jokeri taşları darağacından muaftır (ikisinin de
         kaybı -100'lük ayrı bir karar; boss'un rastgelesine bırakılamaz). */
      if (s.boss.key === 'cellat') {
        const pool = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t));
        const doomed = [];
        for (let k = 0; k < 2 && pool.length; k++)
          doomed.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
        if (doomed.length) {
          for (const t of doomed) this._takeTile(t, 'boss-cellat');
          events.push(`👹 Cellat ${doomed.map(t => COLOR_TR[t.color] + ' ' + t.number).join(', ')} `
            + 'taşlarını idam etti (rastgele seçim)');
        }
      }
      if (s.boss.key === 'kelebek') {
        const types = ['per', 'sirali', 'cift'];
        s.bossBan = types[Math.floor(this.rng() * 3)];
        events.push(`👹 Kelebek yasağı: bu tur ${{ per: 'Per', sirali: 'Sıralı', cift: 'Çift' }[s.bossBan]} açarsan puan %30 kesilir`);
      }
      this._bossTurnStart(events); // Grup F: yeni 12 boss'un tur başı etkileri
    }
    // Fatality sınırı — joker VEYA boss koşulu olarak (GDD 10).
    // Playtest 2: eski formül (el toplamının %60'ı) çok kolay aşılıyordu;
    // sınır artık hem el toplamına hem hedefin %35'ine bağlı — aşmak
    // gerçek bir "büyük tur" gerektirir.
    s.fatalityLimit = null;
    const bossFatality = this.bossOn() && s.boss.key === 'fatality';
    if (this.hasActive('fatality') || bossFatality) {
      const sum = s.hand.filter(t => !t.jokerTile).reduce((a, t) => a + t.number, 0);
      let lim = Math.max(Math.round(s.target * 0.35), Math.round(sum * 1.2));
      // Boss Koşulu (GDD 13.4): sınır her tur %20 daha yukarı taşınır
      if (bossFatality) lim = Math.round(lim * (1 + 0.20 * (s.turn - 1)));
      s.fatalityLimit = lim;
    }
    s.ritimDone = false;
    s.ritimBonus = 0;
    s.gossipSwapUsed = false;   // Grup F — masa takası her tur yenilenir
    this._refreshGossipTable(events); // Playtest 9 · Grup G — TEKLİFLER de yenilenir
    if (s.jokersDisabled) return;
    /* Grup Q: eski "sabitlenen taşlardan tur başı pasif puan" bloku KALDIRILDI.
       Bungie Gum artık pasif puan üretmez; taşları ele geri döndürür
       (bkz. confirmMelds). Kopma riski de oraya taşındı. */
    // Sir.by — her tur 2 taş yer
    const kirbyJ = s.deckJokers.find(j => j.key === 'kirby' && j.activeRound
      && s.hand.some(t => t.jokerTile === 'kirby'));
    if (kirbyJ) {
      /* GDD: tur başına TAM 2 taş, yenen taş başına +0.3x (KIRBY_BITE/KIRBY_MULT)

         PLAYTEST 18 · GRUP B — "FAZLADAN TAŞ" BUG'ININ 1 NUMARALI KÖK NEDENİ.
         `t.number--` taşın DEĞERİNİ değiştiriyor ama taşı `retuned` olarak
         İŞARETLEMİYORDU. Motorun mimari kuralı (bkz. IS_BASE_TILE): değeri
         sonradan değişen taş artık dağıtıldığı kimliği temsil etmez ve "her
         yüzden en fazla 2 kopya" sınırının dışındadır. İşaretsiz kaldığı
         için Sir.by'nin ürettiği her Mavi 4 → Mavi 3 dönüşümü desteye
         SAHTE bir 3. kopya yazıyordu; bütünlük nöbetçisi de bunu gerçek
         bozulma sanıp her turda alarm veriyordu (jokersiz tarama: 60 run,
         ihlallerin %100'ü Sir.by). Artık retune()'dan geçiyor.
         İki küçük düzeltme daha: (a) okey taşları boss varyantında muaftı
         ama jokerde değildi — okeyin değeri kemirilince okeyliği kayboluyordu;
         (b) aday listesi her ısırıkta yeniden kuruluyordu, aynı taş iki kez
         yenebiliyordu — artık ısırılan taş listeden düşer. */
      /* GRUP A (kullanıcı raporu 2026-09-06) — SIR.BY ARTIK HANGİ TAŞA
         DOKUNDUĞUNU SÖYLÜYOR. Eskiden yalnız "2 taş yedi" yazıyordu; oysa
         bu joker iki farklı şey yapar: değeri 1 düşürür (Kırmızı 6 → 5)
         ve değeri 1'e inen taşı TAMAMEN SİLER. İkisi de isimsiz olduğu
         için oyuncu "elimdeki iki Kırmızı 6'dan biri sebepsiz kayboldu"
         diye okuyordu — taş aslında ya 5 olmuştu ya da yenmişti. */
      let eaten = 0;
      const bites = [];
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey
        && !this.isOkeyTile(t) && !t.special);   /* Grup D: joker dönüşümü özel taşa dokunmaz */
      for (let k = 0; k < KIRBY_BITE && cand.length; k++) {
        const t = cand.splice(Math.floor(this.rng() * cand.length), 1)[0];
        if (t.number <= 1) {
          bites.push(`${COLOR_TR[t.color]} ${t.number} YUTULDU`);
          this._takeTile(t, 'sirby');
        } else {
          bites.push(`${COLOR_TR[t.color]} ${t.number}→${t.number - 1}`);
          t.number--; retune(t, 'kirby');
        }
        eaten++;
      }
      if (eaten) {
        kirbyJ.kirbyMult = round2((kirbyJ.kirbyMult || 0) + KIRBY_MULT * eaten);
        events.push(`Sir.by yedi: ${bites.join(', ')} `
          + `(+${round2(KIRBY_MULT * eaten).toFixed(1)}x) → birikim ${kirbyJ.kirbyMult.toFixed(1)}x`);
      }
    }
    /* GLITCH jokeri (Grup N) — boss'un aynası: 2 taşı görünür şekilde
       glitch'ler, ama BURADA glitch İYİDİR: ikisinden birinde gizli +6
       puan vardır. Hangisi olduğu açılımda ortaya çıkar. Eski hâli tek
       taşa görünmez +3/+6 işliyordu; oyuncu ne olduğunu hiç göremiyordu. */
    const dervJ = s.deckJokers.find(j => j.key === 'dervish' && j.activeRound
      && s.hand.some(t => t.jokerTile === 'dervish'));
    if (dervJ) {
      for (const t of s.hand) if (t.glitchGift) { delete t.glitchGift; delete t.glitch; } // önceki turun işaretleri
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !t.glitchCurse);
      const marked = [];
      for (let i = 0; i < GLITCH_JOKER_TILES && cand.length; i++)
        marked.push(cand.splice(Math.floor(this.rng() * cand.length), 1)[0]);
      for (const t of marked) { t.glitch = true; t.glitchGift = true; }
      if (marked.length) {
        const lucky = marked[Math.floor(this.rng() * marked.length)];
        lucky.bonus = (lucky.bonus || 0) + GLITCH_JOKER_BONUS;
        events.push(`🌀 GLITCH: ${marked.length} taşın glitch'lendi — birinde gizli +${GLITCH_JOKER_BONUS} puan var`);
      }
    }
    /* Dr. Frankenstein — 1. AMELİYAT: DİRİLİŞ.
       O raund ATILAN taşların en yükseği, +3 değerle elde dirilir (tur
       başına 1 taş). Mezarlık `s.graveTiles` içinde tutulur; dirilen taş
       mezarlıktan düşer ki aynı ceset iki kez kalkmasın. Açılımda +40 puan.
       Sıra önemli: önce diriliş (el +1), hemen altında ameliyat (el -1) —
       ikisi birlikte eli aynı boyutta bırakır, kartın döngüsü budur. */
    if (this.hasActive('frankenstein') && (s.graveTiles || []).length
        && this.realHandCount() < MAX_HAND) {
      let bi = 0;
      for (let i = 1; i < s.graveTiles.length; i++)
        if (s.graveTiles[i].number > s.graveTiles[bi].number) bi = i;
      const g = s.graveTiles.splice(bi, 1)[0];
      const val = Math.min(13, g.number + FRANK_REVIVE_ADD);
      s.hand.push({ id: nextTileId(s), color: g.color, number: val,
        revived: true, origin: 'frank' });
      events.push(`⚡ Diriliş: ${COLOR_TR[g.color]} ${g.number} → ${COLOR_TR[g.color]} ${val} `
        + `olarak elinde dirildi (açılımda +${FRANK_REVIVE_FLAT} puan)`);
    }
    /* Dr. Frankenstein — 2. AMELİYAT: EKLEME.
       Elin EN DÜŞÜK 2 taşı birleştirilir: ikisi yok olur, değerleri toplamı
       (en çok 13) olan tek bir DİKİLMİŞ taş doğar. Rengi iki taştan biri.
       El bir taş küçülür; üstteki diriliş bunu geri doldurur. Açılımda +0.8x.
       Okey, sahte okey, deste jokeri ve zaten dikilmiş taşlar ameliyata
       girmez (okeyin değeri açılımda belirlenir, birleştirmek anlamsız).
       DİRİLEN TAŞ DA GİRMEZ: birleşimden önce ikisi ayrı jokerdi, şimdi
       aynı kartın iki koludur — üstteki diriliş bir cesedi +40 puanlık
       taşa çevirdiği anda alttaki ameliyat onu yutarsa kart kendi kendini
       yiyor demektir. İkisi birbirinin ürününe dokunmaz. */
    if (this.hasActive('frankenstein')) {
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey
        && !t.stitched && !t.revived && !this.isOkeyTile(t) && !t.special);   /* Grup D: joker dönüşümü özel taşa dokunmaz */
      if (cand.length >= 2) {
        cand.sort((a, b) => a.number - b.number);
        const [a, b] = [cand[0], cand[1]];
        const val = Math.min(13, a.number + b.number);
        if (val > a.number && val > b.number) {   // gerçekten kazanç varsa
          this._takeTile(a, 'frankenstein'); this._takeTile(b, 'frankenstein');
          const color = this.rng() < 0.5 ? a.color : b.color;
          s.hand.push({ id: nextTileId(s), color, number: val,
            stitched: true, origin: 'frank' });
          events.push(`🧬 Ekleme Ameliyatı: ${COLOR_TR[a.color]} ${a.number} + `
            + `${COLOR_TR[b.color]} ${b.number} → ${COLOR_TR[color]} ${val} dikildi `
            + `(açılımda +${FRANK_STITCH_MULT.toFixed(1)}x)`);
        }
      }
    }
    /* Terazi — feda hakkı her tur yenilenir.
       GRUP A (P20): biriken çarpan RAUND boyu durur (teraziRoundMult),
       tur başında SIFIRLANMAZ.
       P29 · Grup J: gecikmeli işlek borcu (teraziIslekNext/Turn) KALKTI;
       bedel artık aynı turda ve tersinden işliyor — işlek tutarsa o turun
       feda bonusu geri alınır (bkz. `s.teraziTurnGain`). */
    s.teraziUsed = false;
    s.teraziMult = 0;
    s.teraziTurnGain = null;  // P29 · Grup J — bu turda kazanılan feda bonusu
    s.paratonerBait = null;   // P29 · Grup F — yem her tur yeniden seçilir
    /* Pandora · SALGIN (Grup F) — her tur 2 taş dertlenir; elde bekleyen her
       dertli taş tur başına puan yakar. "Kullan yoksa acıtır" baskısı. */
    const salJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'truva'
      && j.pandora === 'salgin');
    if (salJ) {
      const held = s.hand.filter(t => t.plague).length;
      if (held) {
        const burn = PANDORA_SALGIN_BURN * held;
        s.score = Math.max(0, s.score - burn);
        events.push(`🦠 Pandora (Salgın): elde bekleyen ${held} dertli taş ${burn} puan yaktı`);
      }
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !t.plague
        && !this.isOkeyTile(t));
      let n = 0;
      for (let k = 0; k < PANDORA_SALGIN_TILES && cand.length; k++) {
        cand.splice(Math.floor(this.rng() * cand.length), 1)[0].plague = true;
        n++;
      }
      if (n) events.push(`🦠 Pandora (Salgın): ${n} taşın dertlendi `
        + `(açılımda +${PANDORA_SALGIN_MULT.toFixed(1)}x, elde beklerse tur başına -${PANDORA_SALGIN_BURN} puan)`);
    }
    // Medusa — 1 taş taşlaşır (GDD 11)
    if (this.hasActive('medusa')) {
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !t.stoned
        && !t.special);   /* Grup D: joker dönüşümü özel taşa dokunmaz */
      if (cand.length) {
        const t = cand[Math.floor(this.rng() * cand.length)];
        t.stoned = true;
        events.push(`Medusa: ${COLOR_TR[t.color]} ${t.number} taşlaştı (işlekten korunur, açılımda +${MEDUSA_MULT.toFixed(1)}x ve +${MEDUSA_FLAT} puan)`);
      }
    }
    /* ZOMBIE — PLAYTEST 10 · GRUP A (bug + yeniden tasarım).
       Eski hâli her tur ELDEN RASTGELE bir taşı enfekte ediyordu. İki sorun:
       (1) enfekte taş ıstakada HİÇBİR ŞEKİLDE görünmüyordu (UI'da yalnız
           boss varyantının işareti vardı) → joker tamamen işlevsiz
           görünüyordu, oyuncu neyi kullanacağını bilemiyordu;
       (2) rastgele sıçrama tematik değildi ve karar üretmiyordu.
       Yeni davranış — BULAŞMA: enfeksiyon ıstakada YAN HÜCREYE atlar.
       Kaynak, elde duran son enfekte taştır; hiç yoksa Zombie'nin kendi
       taşıdır. Enfekte taşı açılımda kullanırsan zincir kırılır ve bulaşma
       yeniden jokerin yanından başlar — yani "kullan da yayılmasın" baskısı
       jokerin kalbi olur. Enfekte taş açılımda +2.0x VE +5 puan verir. */
    if (s.deckJokers.some(j => j.key === 'zombie' && j.activeRound)
        && s.hand.some(t => t.jokerTile === 'zombie')) {
      const victim = this._zombieNextVictim();
      if (victim) {
        victim.infected = true;
        events.push(`🧟 Zombie ${COLOR_TR[victim.color]} ${victim.number} taşına bulaştı `
          + `(açılımda +${ZOMBIE_MULT.toFixed(1)}x ve +${ZOMBIE_FLAT} puan)`);
      }
    }
    // Uzaylı — 3 taşın kopyası eline eklenir (GDD 10)
    if (s.deckJokers.some(j => j.key === 'uzayli' && j.activeRound)
        && s.hand.some(t => t.jokerTile === 'uzayli')) {
      /* P36 · Grup B — okey KOPYALANMAZ: kopya `isOkeyReal` taşımadığı için
         ıstakada okeyin yüzüyle ("13") düz taş olarak duruyor ve açılımda
         reddediliyordu. Hayalet ve Frankenstein de okeyi kopyalamaz. */
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !t.alien && !this.isOkeyTile(t));
      let n = 0;
      // Grup A: kopyalar el üst sınırını (21) aşamaz
      for (let k = 0; k < 3 && cand.length && this.realHandCount() < MAX_HAND; k++) {
        const t = cand.splice(Math.floor(this.rng() * cand.length), 1)[0];
        s.hand.push({ id: nextTileId(s), color: t.color, number: t.number,
          alien: true, origin: 'uzayli' });
        n++;
      }
      if (n) events.push(`👽 Uzaylılar ${n} taşını kopyaladı`);
    }
    /* Ahtapot — her tur bir kol kurban (GDD 10).
       PLAYTEST 9 · GRUP K (bug, off-by-one): kol fedası, jokerin ELİNE
       GELDİĞİ turda da çalışıyordu. Deste jokerleri _startRound içinde ele
       konur ve _onTurnStart hemen ardından koşar, yani oyuncu Ahtapot'u ilk
       gördüğü an 8 değil 7 kol görüyordu (ve ilk açılımı 8×20 yerine
       7×20 puan alıyordu). Artık aktifleştiği tur feda YOK — 8 kolla
       başlar, kaybetme bir sonraki turda işler. */
    s.ahtapotBurst = 0;
    const ahtJ = s.deckJokers.find(j => j.key === 'ahtapot' && j.activeRound
      && s.hand.some(t => t.jokerTile === 'ahtapot'));
    if (ahtJ && ahtJ.justActivated) {
      ahtJ.justActivated = false;
      events.push(`🐙 Ahtapot ${ahtJ.arms || 0} kolla aktifleşti — kol fedası gelecek turda başlar`);
    } else if (ahtJ && (ahtJ.arms || 0) > 0) {
      ahtJ.arms--;
      s.ahtapotBurst = AHTAPOT_BURST_MULT;
      events.push(`🐙 Ahtapot bir kolunu kurban etti: bu tur +${AHTAPOT_BURST_MULT.toFixed(1)}x; `
        + `kalan ${ahtJ.arms} kol`);
    }
    /* THE CHEATING (JOKER) — P35 · GRUP H: tur başında artık hiçbir şey
       yapmaz. Taş çalma kaldırıldı; hile açılım anında (confirmMelds) kurulur,
       zarı tur sonunda (_cheatJokerResolve) atılır. */
    /* TERZİ'NİN İĞNESİ — 2 taş dikilir (GDD 10).
       PLAYTEST 18 · GRUP A — jokerin "hiç çalışmıyor" görünmesinin üç ayrı
       nedeni vardı, üçü de burada / ui.js'te düzeltildi:
       (1) DİKİLİ TAŞIN HİÇBİR GÖRSEL İŞARETİ YOKTU. Motor taşı dikiyor,
           discard'ı da engelliyordu; ama oyuncu ıstakada hangi taşın dikili
           olduğunu göremediği için efekt yokmuş gibi duruyordu (Zombie
           jokerinin Playtest 10'daki hikâyesinin aynısı). Artık `sewn`
           taşlar ui.js'te 🪡 rozeti + mor kesikli konturla çizilir.
       (2) TUR BAŞI BİLDİRİMİ YANLIŞ ÇARPAN YAZIYORDU (+0.4x), puanlama ise
           +0.6x veriyordu → IGNE_MULT ile tek kaynağa bağlandı.
       (3) JOKER ELDEN ÇIKINCA DİKİŞLER ÇÖZÜLMÜYORDU: `sewn` bayrağı hiçbir
           yerde silinmiyordu, yani iğne atıldıktan/süresi dolduktan sonra da
           taşlar sonsuza dek atılamaz kalıyordu. Ayrıca dikiş tur tur
           biriktiği için elin TAMAMI dikilebiliyordu — o noktada atılacak
           taş kalmadığından tur hiç kapanamıyordu (softlock).
       Dikişler tur boyunca birikmeye devam eder (jokerin baskısı budur),
       ama elde her zaman en az IGNE_FREE_MIN serbest taş bırakılır. */
    const igneActive = !s.jokersDisabled
      && s.deckJokers.some(j => j.key === 'terziIgne' && j.activeRound)
      && s.hand.some(t => t.jokerTile === 'terziIgne');
    if (!igneActive) {
      // iğne elde değil (atıldı / süresi doldu / Kıyamet) → dikişler çözülür
      let freed = 0;
      for (const t of s.hand) if (t.sewn) { delete t.sewn; freed++; }
      if (freed) events.push(`🪡 İğne elinden çıktı — ${freed} taşın dikişi çözüldü`);
    } else {
      const free = s.hand.filter(t => !t.jokerTile && !t.fakeOkey && !t.sewn);
      // softlock koruması: en az IGNE_FREE_MIN taş dikilmeden kalmalı
      const room = Math.max(0, free.length - IGNE_FREE_MIN);
      const sewn = [];
      for (let k = 0; k < Math.min(IGNE_SEW, room); k++) {
        const t = free.splice(Math.floor(this.rng() * free.length), 1)[0];
        t.sewn = true;
        sewn.push(t);
      }
      if (sewn.length)
        events.push(`🪡 İğne ${sewn.map(t => COLOR_TR[t.color] + ' ' + t.number).join(', ')} `
          + `taşlarını dikti — atılamaz, açılımda +${IGNE_MULT.toFixed(1)}x`);
      else
        events.push('🪡 İğne bu tur dikiş atmadı — elinde yeterli serbest taş yok');
    }
    // Freedom Fighters — işaretli taş ele geldiyse (GDD 10)
    const ffJ = s.deckJokers.find(j => j.key === 'freedom' && j.marked);
    if (ffJ) {
      for (const t of s.hand) {
        if (t.jokerTile || t.ffPaid) continue;
        if (ffJ.marked.some(m => m.color === t.color && m.number === t.number)) {
          t.ffPaid = true;
          s.score += t.number * 10;
          events.push(`⚔ Freedom Fighters: işaretli ${COLOR_TR[t.color]} ${t.number} → +${t.number * 10} puan`);
        }
      }
    }
  },

  /* Kara Kedi BOSS koşulu (GDD 10/13) — Playtest 6 KÖK NEDEN: dönüşüm
     yalnızca `drawn.find(...)` ile TEK taşa uygulanıyordu ve sadece
     drawTiles içinde çağrılıyordu; aynı çekilişte gelen ikinci/üçüncü 13
     ile raund başında dağıtılan başlangıç eli dokunulmadan geçiyordu →
     "elimize düz 13 geliyor". Artık desteden gelen HER en-büyük-değerli
     taş 1'e döner ve başlangıç eli de bu süzgeçten geçer. */
  _karaKediBite(tiles, events) {
    const s = this.state;
    const eligible = (t) => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t);
    // Eşik, raundun BAŞINDAKİ en büyük değer (13) üzerinden sabitlenir;
    // dönüşenler havuzu düşürüp eşiği kaydırmasın diye state'te tutulur.
    if (s.karaKediMax == null) {
      const pool = [...s.deck, ...s.hand, ...tiles].filter(eligible);
      s.karaKediMax = pool.length ? Math.max(...pool.map(t => t.number)) : 13;
    }
    for (const t of tiles) {
      if (!eligible(t) || t.number !== s.karaKediMax) continue;
      events.push(`👹 Kara Kedi: ${COLOR_TR[t.color]} ${t.number} → 1'e dönüştü`);
      t.number = 1;
      retune(t, 'karaKediBoss');
    }
  },

  /* PLAYTEST 17 · GRUP F/22 — YAZI-TURA SEKANSI.
     Kumarbaz her turun başında sessizce zar atıyordu: sonuç yalnız açılım
     anında, çarpan satırında bir yan not olarak görünüyordu. Oyuncu turun
     ×2 mi ×0.5 mi olduğunu PLAN YAPARKEN bilmiyordu, dolayısıyla jokerin
     asıl duygusu (kumar) hiç yaşanmıyordu.
     Motor tarafı: atış sonucu `kumarbazFlip` ile bir kez UI'a teslim
     edilir (bkz. takeKumarbazFlip); UI parayı havaya atar ve sonucu
     gösterir.

     PLAYTEST 26 · MADDE B (kullanıcı kararı 2026-09-09) — ÜÇÜNCÜ YÜZ:
     PARA DİK DURUYOR. Yazı ve tura, oyuncunun 3 raundluk Kumarbaz ömrü
     boyunca ~10 kez gördüğü iki sonuçtur; ikisi de tanıdıktır. Ruletin
     "0"ı gibi çok nadir ama efsanevi bir üçüncü sonuç eklendi: para
     yere dik düşer ve o turun çarpanı ×35 olur.

     OLASILIK = 1/37 (≈ %2.70) — ruletin tek sıfırının payı. Kullanıcının
     verdiği %2-3 bandının içinde ve temasıyla birebir aynı sayı, yani
     "neden bu değer" sorusunun cevabı keyfî değil.
     Kalan 36/37 İKİYE EŞİT bölünür → %48.65 yazı · %48.65 tura. Yani
     normal iki sonucun BİRBİRİNE oranı bozulmadı (hâlâ tam 50/50),
     yalnız ikisinden de eşit miktarda dilim alındı — kullanıcının
     "normal iki sonucun oranını neredeyse eşit tut" şartı budur.

     DENGE NOTU: çarpanın beklenen değeri 1.25'ten 2.20'ye çıkar. Bu
     bilinçlidir — Kumarbaz artık "yarı yarıya bir bahis" değil, ödülü
     kuyrukta duran bir bahistir; kartın ömrü boyunca dik durmayı görme
     ihtimali ≈ %24 (10 atış). Görülmediği runlarda kart eskisiyle
     BİREBİR aynı davranır, yani taban güç seviyesi kaymaz. */
  KUMARBAZ_EDGE_P: 1 / 37,     // ruletin "0"ı — dik durma ihtimali
  KUMARBAZ_EDGE_MULT: 35,      // ruletin düz bahis ödemesi
  _rollKumarbaz() {
    const s = this.state;
    const prev = s.kumarbazRoll;
    if (!this.hasActive('kumarbaz')) {
      s.kumarbazRoll = null;
      if (prev) s.kumarbazFlip = null;
      return;
    }
    const r = this.rng();
    const edge = r < this.KUMARBAZ_EDGE_P;
    s.kumarbazRoll = edge ? this.KUMARBAZ_EDGE_MULT
      : (r < this.KUMARBAZ_EDGE_P + (1 - this.KUMARBAZ_EDGE_P) / 2 ? 2 : 0.5);
    s.kumarbazFlip = { roll: s.kumarbazRoll, turn: s.turn, edge };
  },

  /* UI: bekleyen yazı-tura sonucunu BİR KEZ al (alınınca temizlenir). */
  takeKumarbazFlip() {
    const f = this.state.kumarbazFlip;
    this.state.kumarbazFlip = null;
    return f || null;
  },

  /* ---------- Açılım hesaplama ---------- */

  /* ============================================================
     TAŞIN AÇILIMDAKİ ETKİN DEĞERİ — TEK KAYNAK
     Okey, kombinasyonda YERİNE GEÇTİĞİ taşın değerini taşır; fiziksel
     sayısını DEĞİL. Bu çözüm `resolveCombo`nun ürettiği `values` Map'inde
     durur ve ham puan (comboSum) uzun zamandır oradan okuyordu.
     PLAYTEST 10 · GRUP D (bug): joker efektleri ise `t.number`'ı doğrudan
     okuyordu → Büyük Taş Gücü, iki 10'un yanına 10 YERİNE konan bir okeyi
     "5" sayıp bonusu kesiyordu. Değeri soran her yer artık BU fonksiyondan
     okur; kimse `t.number`'a doğrudan bakmaz.
     ============================================================ */
  /* Rastgele joker havuzu — TEK KAYNAK.
     `trainerOnly` işaretli tanımlar (şu an hiçbiri — mekanizma tasarımı
     kesinleşmemiş kartları denemek için duruyor; Frankenstein varyasyonları
     böyle test edilip 2026-09-03'te tek karta indirildi)
     normal oyunda hiçbir rastgele havuzda ÇIKMAZ: store, store rafı ekleme,
     gizli paket ve Anka Kuşu dönüşümü hepsi buradan okur. Trainer modunda
     oyuncu kurulumdan elle seçebilir — orası bu filtreye tabi değildir. */
  jokerPool(filterFn) {
    return Object.values(JOKER_DEFS)
      .filter(d => !d.trainerOnly && (!filterFn || filterFn(d)));
  },

  tileValue(tile, combo) {
    if (!tile) return 0;
    const v = combo?.values?.get?.(tile.id);
    return v == null ? tile.number : v;
  },

  /* Zombie bulaşması (Grup A) — ıstakadaki YAN HÜCREYE atlar.
     Kaynak: elde duran son enfekte taş; hiç yoksa Zombie'nin kendi taşı.
     Komşuluk `slot` üzerinden okunur (oyuncunun gördüğü fiziksel dizilim);
     slot henüz atanmamışsa el sırası kullanılır. Önce sağ, sonra sol komşu
     denenir; ikisi de uygun değilse en yakın uygun taşa atlar. */
  _zombieNextVictim() {
    const s = this.state;
    const pos = new Map();
    s.hand.forEach((t, i) => pos.set(t, Number.isInteger(t.slot) ? t.slot : 1000 + i));
    const order = [...s.hand].sort((a, b) => pos.get(a) - pos.get(b));
    const ok = (t) => t && !t.jokerTile && !t.fakeOkey && !t.infected && !this.isOkeyTile(t);
    const infected = order.filter(t => t.infected);
    const src = infected.length ? infected[infected.length - 1]
      : order.find(t => t.jokerTile === 'zombie');
    if (!src) return null;
    const i = order.indexOf(src);
    for (let d = 1; d < order.length; d++) {
      if (ok(order[i + d])) return order[i + d];   // önce sağ komşu
      if (ok(order[i - d])) return order[i - d];   // sonra sol komşu
    }
    return null;
  },

  _buildCtx() {
    const s = this.state;
    const combos = s.staged;
    const tiles = combos.flatMap(c => c.tiles);
    /* id → etkin değer. Joker efektleri sayıya `ctx.vals` / `ctx.valOf`
       üzerinden bakar (bkz. tileValue notu). */
    const valMap = new Map();
    for (const c of combos)
      for (const t of c.tiles) valMap.set(t.id, this.tileValue(t, c));
    const valOf = (t) => (t && valMap.has(t.id) ? valMap.get(t.id) : (t ? t.number : 0));
    // Açılım + işleme taşlarının tamamı (bkz. usedOkeyTile)
    const allTiles = tiles.concat(s.islemeler.flatMap(e => e.tiles));
    return {
      combos, tiles, count: combos.length,
      vals: tiles.map(valOf),
      valOf,
      hasCift: combos.some(c => c.type === 'cift'),
      hasPer: combos.some(c => c.type === 'per'),
      hasSirali: combos.some(c => c.type === 'sirali'),
      ciftCount: combos.filter(c => c.type === 'cift').length,
      perCount: combos.filter(c => c.type === 'per').length,
      siraliCount: combos.filter(c => c.type === 'sirali').length,
      usedOkey: combos.some(c => c.usedOkey) || s.islemeler.some(e => e.usedOkey),
      /* İki Yüzlü (2026-09-10) — `usedOkey` yalnız WILD İKAMESİNİ görür;
         okey kendisi olarak oynandığında false kalır (GDD 2.9). Bu joker
         "iki taşı da masaya koydun mu" diye sorduğu için TAŞIN VARLIĞI
         ölçülür. İşleme ile eklenen taşlar da sayılır — `usedOkey` de
         işlemeleri kapsıyor, iki ölçü aynı kapsamda kalsın. */
      usedOkeyTile: allTiles.some(t => this.isOkeyTile(t)),
      usedFakeOkeyTile: allTiles.some(t => !!t.fakeOkey),
      handAfter: s.hand.length,
      handAtStart: s.hand.length + tiles.length + s.islemeler.reduce((a, e) => a + e.tiles.length, 0),
      consecMelds: s.consecMeldTurns,
      skipStreak: s.skipStreak,
      // Grup E (Playtest 7) — İşlemeci jokeri için: bu turda işleme yapıldı mı
      islemeTiles: s.islemeler.reduce((a, e) => a + e.tiles.length, 0),
    };
  },

  /* Freedom Fighters (GDD 10) — bu taş jokerin işaretlediklerinden biri mi?
     UI taşın üstünde işaret göstermek için kullanır (Playtest 6: işaretleme
     çalışıyordu ama ıstakada hiçbir şekilde görünmüyordu). */
  freedomMark(tile) {
    if (!tile || tile.jokerTile) return null;
    const j = this.state.deckJokers.find(x => x.key === 'freedom' && x.marked);
    if (!j) return null;
    const hit = j.marked.some(m => m.color === tile.color && m.number === tile.number);
    return hit ? { paid: !!tile.ffPaid, value: tile.number * 10 } : null;
  },

  /* GRUP B2 — süresi "run boyunca" olan jokerler (GDD 10 süre hücresi bir
     sayı değil "Run boyunca" diyorsa). Bu jokerler hiç yaşlanmaz ve UI'da
     raund sayacı yerine ∞ gösterilir. Tanımdan okunur ki eski kayıtlardaki
     jokerler de (usesLeft 97, 96...) aynı kurala tabi olsun. */
  isRunLong(j) {
    return !!(j && JOKER_DEFS[j.key] && JOKER_DEFS[j.key].runLong);
  },

  /* Freedom Fighters işaret listesi (UI rozet/tooltip için) */
  freedomMarks() {
    const j = this.state.deckJokers.find(x => x.key === 'freedom' && x.marked);
    return j ? j.marked : [];
  },

  /* Toplu Hipnoz: transtaki sayının gerçek taşları (okey/sahte okey/deste
     jokeri hariç) açılım değerinde çift sayılır */
  _hipnoBonus(t, v) {
    const s = this.state;
    return (!s.jokersDisabled && s.hipnoNumber && t.number === s.hipnoNumber
      && !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t)) ? v : 0;
  },

  comboSum(combo) {
    // t.bonus: Dervish'in gizli puanı — açılımda ortaya çıkar (boss
    // varyantında NEGATİF olabilir, GDD 13.4 "glitch taş")
    return combo.tiles.reduce((a, t) => {
      // Zombie BOSS koşulu: enfekte taş kombinasyona girer ama ham değeri 0
      if (t.bossInfected) return a;
      const v = combo.values?.get(t.id) ?? t.number;
      return a + v + (t.bonus || 0) + this._hipnoBonus(t, v);
    }, 0);
  },

  /* Vampir'in bir açılımdan emdiği puan: her kombinasyonun EN YÜKSEK
     taşının etkin değeri (Hipnotizör/okey ikamesi gibi değer değiştiren
     etkiler `c.values` üzerinden okunur). Hem birikim hem son turun
     ödemesi buradan geçer ki iki yer ayrışmasın. */
  _vampirDrain(combos) {
    return (combos || []).reduce((a, c) =>
      a + Math.max(...c.tiles.map(t => c.values?.get(t.id) ?? t.number)), 0);
  },

  _calcOpening() {
    const s = this.state;
    /* CRIMSON KING (P31 · Grup H) — taçlı jokerin katkısı = (onunla puan) −
       (onsuz puan). Aynı hesap bir kez de jokersiz yapılır ve fark sonuca
       bir kez daha eklenir. _calcOpening yan etkisizdir (önizleme de onu
       çağırır), yani iki kez çağırmak durumu bozmaz. */
    let crownBase = null, crownRec = null;
    if (s.crownId != null && !this._crownPass && this.hasActive('crimsonTac')) {
      crownRec = s.jokers.find(j => j.id === s.crownId) || null;
      if (crownRec) {
        this._crownPass = true;
        s.crownMuteId = s.crownId;
        try { crownBase = this._calcOpening().final; }
        finally { s.crownMuteId = null; this._crownPass = false; }
      }
    }
    const ctx = this._buildCtx();
    const triggered = [];
    let mult = 0, flat = 0;

    const islemeCount = s.islemeler.reduce((a, e) => a + e.tiles.length, 0);
    const islemeSum = s.islemeler.reduce((a, e) => a + e.addSum, 0);

    if (!s.jokersDisabled) {
      for (const j of this.slotRecs()) {
        // Avukat BOSS Koşulu (Grup F): bu tur susturulan jokerin efekti yok
        if (this.bossOn() && s.boss.key === 'avukat' && j.key === s.bossMutedJoker) continue;
        const def = JOKER_DEFS[j.key];
        if (!def || !def.effect) continue;
        const eff = def.effect(ctx);
        if (!eff) continue;
        mult += eff.mult;
        flat += eff.flat;
        const parts = [];
        if (eff.mult) parts.push(`+${eff.mult.toFixed(1)}x`);
        if (eff.flat) parts.push(`+${eff.flat} puan`);
        triggered.push({ id: j.id, name: j.name, text: parts.join(' ') });
      }
      // Toplu Hipnoz bilgilendirme satırı (ham puana zaten işlendi)
      if (s.hipnoNumber) {
        const hn = ctx.tiles.filter(t => this._hipnoBonus(t, 1) > 0).length;
        if (hn) triggered.push({ id: 'hipno', name: 'Hipnotizör', text: `🌀 ${hn} taş çift değer` });
      }
      // Godzilla şarjı
      const gz = this.slotRecs().find(j => j.key === 'godzilla');
      if (gz && s.godzillaLevel > 0) {
        const lv = GODZILLA_LEVELS[Math.min(s.godzillaLevel, 3) - 1];
        mult += lv.mult;
        flat += lv.flat;
        triggered.push({ id: gz.id, name: `Godzilla S${s.godzillaLevel}`, text: `+${lv.mult.toFixed(1)}x +${lv.flat} puan` });
      }
      // Medusa — taşlaşmış taş açılımda
      const mdj = this.slotRecs().find(j => j.key === 'medusa');
      if (mdj && ctx.tiles.some(t => t.stoned)) {
        mult += MEDUSA_MULT;
        flat += MEDUSA_FLAT;
        triggered.push({ id: mdj.id, name: mdj.name,
          text: `+${MEDUSA_MULT.toFixed(1)}x +${MEDUSA_FLAT} puan (taşlaşmış taş)` });
      }
      // Anka Kuşu — Yükselen Alev (P33 · Grup A): son raundunda alev büyür
      const ankj = this.slotRecs().find(j => j.key === 'ankaKusu');
      if (ankj) {
        const last = ankj.usesLeft != null && ankj.usesLeft <= 1;
        const am = last ? ANKA_MULT_LAST : ANKA_MULT_EARLY;
        mult += am;
        triggered.push({ id: ankj.id, name: ankj.name,
          text: `+${am.toFixed(1)}x (${last ? 'son raund alevi' : 'alev'})` });
      }
      /* Pandora (Grup F) — açılan varyanta göre açılım etkisi.
         Umut  : açılımdaki her taş sabit puan
         Salgın: açılımda kullanılan her DERTLİ taş çarpan verir
         Armağan: armağan taşı içeren kombinasyonun puanı artar (aşağıda,
                  kombinasyon döngüsünde) */
      const pdj = this.slotRecs().find(j => j.key === 'truva' && j.revealed);
      if (pdj && pdj.pandora === 'umut' && ctx.tiles.length) {
        flat += PANDORA_UMUT_FLAT * ctx.tiles.length;
        triggered.push({ id: pdj.id, name: pdj.name,
          text: `+${PANDORA_UMUT_FLAT * ctx.tiles.length} puan (taş başına +${PANDORA_UMUT_FLAT})` });
      }
      if (pdj && pdj.pandora === 'salgin') {
        const pn = ctx.tiles.filter(t => t.plague).length;
        if (pn) {
          mult += PANDORA_SALGIN_MULT * pn;
          triggered.push({ id: pdj.id, name: pdj.name,
            text: `+${(PANDORA_SALGIN_MULT * pn).toFixed(1)}x (${pn} dertli taş)` });
        }
      }
      /* BORSA — PORTFÖY ÇARPANI (P29 · Grup H).
         Açılımda BULUNAN her tür için bir kez, o türdeki hisse sayısı
         kadar. Kombinasyon sayısıyla çarpılmaz (bkz. BORSA_* notu). */
      const tdj = this.slotRecs().find(j => j.key === 'tradeJokeri');
      if (tdj) {
        const sh = tdj.borsaShares || BORSA_EMPTY();
        const cnt = { per: ctx.perCount || 0, sirali: ctx.siraliCount || 0,
          cift: ctx.ciftCount || 0 };
        for (const ty of BORSA_TYPES) {
          if (!cnt[ty] || !sh[ty]) continue;
          const m = round2(BORSA_SHARE_MULT * sh[ty]);
          mult += m;
          triggered.push({ id: tdj.id, name: tdj.name,
            text: `+${m.toFixed(1)}x (📊 ${TYPE_TR[ty]} ×${sh[ty]} hisse)` });
        }
      }
      // Katalizör birikimi (P29 · Grup I — birikim jokerin üstünde)
      const ktj = this.slotRecs().find(j => j.key === 'katalizor');
      if (ktj && (ktj.katalizorMult || 0) > 0) {
        mult += ktj.katalizorMult;
        triggered.push({ id: ktj.id, name: ktj.name, text: `+${ktj.katalizorMult.toFixed(2)}x` });
      }
      // Sir.by birikimi (deste jokeri — joker yaşadıkça geçerli)
      const kbj = s.deckJokers.find(j => j.key === 'kirby' && (j.kirbyMult || 0) > 0);
      if (kbj) {
        mult += kbj.kirbyMult;
        triggered.push({ id: 'kirby', name: kbj.name, text: `+${kbj.kirbyMult.toFixed(1)}x` });
      }
      // The Misunderstood — bu raund aktifse
      if (s.misuActive) {
        mult += MISU_MULT;
        triggered.push({ id: 'misu', name: 'The Misunderstood', text: `+${MISU_MULT.toFixed(1)}x` });
      }
      // Cellat motivasyonu
      if (s.cellatMotive > 0) {
        flat += s.cellatMotive;
        triggered.push({ id: 'cellatM', name: 'Cellat (motive)', text: `+${s.cellatMotive} puan` });
      }
      /* Zombie — enfekte taşlar açılımda. PLAYTEST 10 · GRUP A: çarpanın
         yanına taş başına sabit puan da eklendi; enfekte taş artık kendi
         başına bir ÖDÜL (kullan) ve kullanılmazsa bir TEHDİT (yayılır). */
      const infN = ctx.tiles.filter(t => t.infected).length;
      if (infN) {
        mult += ZOMBIE_MULT * infN;
        flat += ZOMBIE_FLAT * infN;
        triggered.push({ id: 'zombie', name: 'Zombie',
          text: `+${(ZOMBIE_MULT * infN).toFixed(1)}x ve +${ZOMBIE_FLAT * infN} puan (${infN} enfekte)` });
      }
      /* P35 · Grup F — Alien JOKERİNİN kopya taşları (alien + origin 'uzayli';
         boss'un gizli uzaylısı `hiddenAlien` bayrağıdır, buraya girmez).
         Grup P — Kara Kedi JOKERİNİN 12'ye çevirdiği taşlar (origin
         'karaKedi'; boss dönüşümü 'karaKediBoss', buraya girmez). İkisi de
         Terzi'nin İğnesi gibi işleme taşlarını da sayar. */
      const p35Used = [...ctx.tiles, ...s.islemeler.flatMap(e => e.tiles)];
      const alienN = p35Used.filter(t => t.alien && t.origin === 'uzayli').length;
      if (alienN) {
        flat += ALIEN_COPY_FLAT * alienN;
        triggered.push({ id: 'uzayli', name: 'Alien',
          text: `+${ALIEN_COPY_FLAT * alienN} puan (${alienN} kopya taş)` });
      }
      const kediN = p35Used.filter(t => t.origin === 'karaKedi').length;
      if (kediN) {
        flat += KARAKEDI_FLAT * kediN;
        triggered.push({ id: 'karaKedi', name: 'Kara Kedi',
          text: `+${KARAKEDI_FLAT * kediN} puan (${kediN} dönüşmüş taş)` });
      }
      /* Dr. Frankenstein'ın açılım bonusları. İki ameliyatın ödülü de
         korundu: dirilen taş düz puan, dikilmiş taş çarpan verir. Puan
         dökümünde ayrı satır olarak kalırlar (oyuncu hangi taşın ne
         getirdiğini görsün), ikisi de aynı kartın adıyla yazılır. */
      const revN = ctx.tiles.filter(t => t.revived).length;
      if (revN) {
        flat += FRANK_REVIVE_FLAT * revN;
        triggered.push({ id: 'frankRevive', name: 'Dr. Frankenstein',
          text: `+${FRANK_REVIVE_FLAT * revN} puan (${revN} dirilen taş)` });
      }
      const stN = ctx.tiles.filter(t => t.stitched).length;
      if (stN) {
        mult += FRANK_STITCH_MULT * stN;
        triggered.push({ id: 'frankStitch', name: 'Dr. Frankenstein',
          text: `+${(FRANK_STITCH_MULT * stN).toFixed(1)}x (${stN} dikilmiş taş)` });
      }
      /* Terazi — GRUP A (P20): hafif taş fedalarından RAUND boyu biriken
         çarpan. Eski `teraziMult` (tur bazlı) alanı eski kayıtlar için
         hâlâ toplanır; ikisi birden asla dolu olmaz. */
      const teraziBank = round2((s.teraziRoundMult || 0) + (s.teraziMult || 0));
      if (teraziBank > 0) {
        const tzj = this.slotRecs().find(j => j.key === 'terazi');
        mult += teraziBank;
        triggered.push({ id: tzj ? tzj.id : 'terazi', name: 'Terazi',
          text: `+${teraziBank.toFixed(1)}x (feda edilen taşlar)` });
      }
      /* Terzi'nin İğnesi — dikili taş açılımda (IGNE_MULT, tek kaynak)
         PLAYTEST 19 · GRUP D — İKİ EKSİK KAPATILDI:
         (1) İŞLEMEDE HİÇ ÇALIŞMIYORDU. Burada yalnız `ctx.tiles` (yani bu
             turda YENİ açılan kombinasyonlar) taranıyordu; oyuncu dikili
             taşı AÇIK bir kombinasyona iliştirdiğinde (işleme, GDD 3.7)
             taş `s.islemeler`e gidiyor ve ctx.tiles'a hiç girmiyordu →
             +0.6x sessizce düşüyordu. Artık her iki yol da sayılır.
         (2) JOKER KARTI ATEŞLENMİYORDU. `triggered`e sabit 'igne' dizgisi
             yazılıyordu; ui.js kartı `[data-jid="<gerçek id>"]` ile aradığı
             için eşleşme olmuyor, joker parlaması hiç görülmüyordu — etki
             uygulansa bile oyuncuya "çalıştı" sinyali gitmiyordu. */
      const sewnUsed = ctx.tiles.some(t => t.sewn)
        || s.islemeler.some(e => e.tiles.some(t => t.sewn));
      if (sewnUsed) {
        mult += IGNE_MULT;
        const igneJ = s.deckJokers.find(j => j.key === 'terziIgne');
        triggered.push({ id: igneJ ? igneJ.id : 'igne', name: 'Terzi\'nin İğnesi',
          text: `+${IGNE_MULT.toFixed(1)}x (dikili taş)` });
      }
      // Ahtapot kolları — GDD 10: deste jokeri yalnız ELDEYKEN etki eder
      // Grup E/21: eksen SABİT PUAN'dan ÇARPAN'a taşındı (bkz. JOKER_DEFS)
      const ahJ2 = s.deckJokers.find(j => j.key === 'ahtapot' && j.activeRound);
      if (ahJ2 && ((ahJ2.arms || 0) > 0 || s.ahtapotBurst > 0)) {
        const m = round2((ahJ2.arms || 0) * AHTAPOT_ARM_MULT + (s.ahtapotBurst || 0));
        mult += m;
        triggered.push({ id: 'ahtapot', name: 'Ahtapot',
          text: `+${m.toFixed(1)}x (${ahJ2.arms || 0} kol)` });
      }
      /* Vampir bankası (P29 · Grup D) — YALNIZ SON TURDA ve YALNIZ
         açılım yapılırsa ödenir. `s.maxTurns` bir değnek raundu uzatırsa
         kendiliğinden kayar, bu yüzden karşılaştırma dinamiktir.
         Banka confirmMelds'te sıfırlanır (burası önizlemeden de çağrılır,
         durum değiştiremez). */
      const vmJ = this.slotRecs().find(j => j.key === 'vampir');
      if (vmJ && s.turn >= s.maxTurns) {
        /* BU TURUN EMİŞİ DE ÖDEMEYE GİRER: raundun son açılımı hem
           biriktirip hem ödemeseydi son turda emilen taşlar sessizce
           yanardı. Böylece kural tek cümlede kalır — "raund boyunca
           emdiğinin 4 katı, son turun açılımında". */
        const bank = (s.vampirBank || 0) + this._vampirDrain(ctx.combos);
        if (bank > 0) {
          const pay = bank * VAMPIR_MULT;
          flat += pay;
          triggered.push({ id: vmJ.id, name: vmJ.name,
            text: `+${pay} puan (${bank} × ${VAMPIR_MULT})` });
        }
      }
      // Zincir birikimi (P29 · Grup C)
      const zcJ2 = this.slotRecs().find(j => j.key === 'zincir');
      if (zcJ2 && (zcJ2.zincirMult || 0) > 0) {
        mult += zcJ2.zincirMult;
        triggered.push({ id: zcJ2.id, name: zcJ2.name, text: `+${zcJ2.zincirMult.toFixed(1)}x` });
      }
      // Yankee birikimi
      const ykJ2 = this.slotRecs().find(j => j.key === 'yankee');
      if (ykJ2 && (ykJ2.yankeeMult || 0) > 0) {
        mult += ykJ2.yankeeMult;
        triggered.push({ id: ykJ2.id, name: ykJ2.name, text: `+${ykJ2.yankeeMult.toFixed(1)}x` });
      }
      // Ritim Jokeri — mini oyun kazanıldıysa
      if ((s.ritimBonus || 0) > 0) {
        mult += s.ritimBonus;
        triggered.push({ id: 'ritim', name: 'Ritim', text: `+${s.ritimBonus.toFixed(1)}x (ritim tuttu)` });
      }
    }
    /* The Cheating — GRUP G (P20): ÇARPAN EKSENİ KALDIRILDI.
       Jokerin ödülü artık soyut bir birikim değil, elindeki GERÇEK taş.
       `cheatBank` alanı yalnız eski kayıtlar için okunmaya devam eder;
       yeni run'larda hep 0'dır. */
    if (!s.jokersDisabled && (s.cheatBank || 0) > 0) {
      mult += s.cheatBank;
      triggered.push({ id: 'cheating', name: 'The Cheating',
        text: `+${s.cheatBank.toFixed(1)}x (eski kayıt: biriken hile)` });
    }
    /* P35 · Grup H — HİLELİ AÇILIM: hile kuruluysa bu açılım +3.0x.
       Önizleme de buradan beslenir, yani oyuncu hesap kutusunda görür. */
    if (s.cheatArmed && this.canCheat()) {
      mult += CHEAT_HILE_MULT;
      triggered.push({ id: 'cheating', name: 'The Cheating',
        text: `+${CHEAT_HILE_MULT.toFixed(1)}x (hile)` });
    }
    if (s.roundMult > 0) mult += s.roundMult;

    // Özel Normal Taşlar (GDD 6.5c) — joker değildir, Kıyamet'ten etkilenmez
    const spN = (k) => ctx.tiles.filter(t => t.special === k).length;
    const altinN = spN('altin');
    if (altinN) {
      flat += 60 * altinN;
      triggered.push({ id: 'altin', name: 'Altın Taş', text: `+${60 * altinN} puan` });
    }
    /* Grup E — puan/çarpan ekseninde çalışan yeni özel taşlar */
    /* GRUP F (P22) — Kara Delik Taşı: puanı KOPYAYA ÖZELDİR.
       Her kopyanın yoğunluğu `s.specialTiles` kaydında (`sid` ile eşlenir)
       durur; aynı türden iki taşın aynı puanı vermesi gerekmez. */
    const kdTiles = ctx.tiles.filter(t => t.special === 'karaDelikTasi');
    if (kdTiles.length) {
      const add = kdTiles.reduce((a, t) => a + this.kdTasiValue(t), 0);
      flat += add;
      triggered.push({ id: 'karaDelikTasi', name: 'Kara Delik Taşı', text: `+${add} puan` });
    }
    const atesN = spN('ates');
    if (atesN) {
      flat += 120 * atesN;
      triggered.push({ id: 'ates', name: 'Ateş Taşı', text: `+${120 * atesN} puan` });
    }
    const bakirN = spN('bakir');
    if (bakirN) {
      mult += round2(BAKIR_TASI_MULT * bakirN);
      triggered.push({ id: 'bakir', name: 'Bakır Taş', text: `+${round2(BAKIR_TASI_MULT * bakirN).toFixed(1)}x` });
    }
    const zumrutN = spN('zumrut');
    if (zumrutN) {
      mult += round2(ZUMRUT_TASI_MULT * zumrutN);
      triggered.push({ id: 'zumrut', name: 'Zümrüt Taş', text: `+${round2(ZUMRUT_TASI_MULT * zumrutN).toFixed(1)}x` });
    }
    for (const c of ctx.combos) {
      /* Su Taşı'nın ESKİ efekti (kombinasyon puanı +%20) 2026-09-06'da
         kaldırıldı; taş artık puan değil RENK SERBESTLİĞİ verir ve etkisi
         skorlamada değil kombinasyon denetiminde durur (bkz. isColorWild). */
      /* Pandora · ARMAĞAN (Grup F) — armağan taşı içeren kombinasyonun puanı
         kombinasyon başına artar. */
      if (c.tiles.some(t => t.gift)
          && this.slotRecs().some(j => j.key === 'truva' && j.pandora === 'armagan')) {
        const b = Math.ceil(this.comboSum(c) * PANDORA_ARMAGAN_BONUS);
        flat += b;
        triggered.push({ id: 'pandoraGift', name: 'Pandora (Armağan)',
          text: `kombinasyon +%${Math.round(PANDORA_ARMAGAN_BONUS * 100)} (+${b})` });
      }
      /* Ayna Taşı — kombinasyonun en yüksek taşı toplam AYNA_TASI_TIMES kez
         sayılır (P42: 2 → 3): taş zaten bir kez sayıldığı için ek puan
         (kat − 1) × değer. */
      if (c.tiles.some(t => t.special === 'aynaTasi')) {
        const top = Math.max(...c.tiles.map(t => this.tileValue(t, c) || 0));
        if (top > 0) {
          const add = top * (AYNA_TASI_TIMES - 1);
          flat += add;
          triggered.push({ id: 'aynaT', name: 'Ayna Taşı', text: `en yüksek taş ${AYNA_TASI_TIMES} kat (+${add})` });
        }
      }
    }

    // GDD 3.7.5 — işlenen her taş +0.2x
    if (islemeCount > 0) {
      mult += round2(0.2 * islemeCount);
      triggered.push({ id: 'isleme', name: 'İşleme', text: `${islemeCount} taş → +${(0.2 * islemeCount).toFixed(1)}x` });
    }

    /* GRUP I (P20) — BİLEME TAŞI: bir turda 2+ kombinasyon açtıysan +1.0x.
       Stage sonu güçlendirmesidir, joker değildir; Kıyamet (jokersDisabled)
       onu susturmaz. */
    if ((s.permComboBonus || 0) > 0 && ctx.count >= 2) {
      mult += s.permComboBonus;
      triggered.push({ id: 'up-bileme', name: 'Bileme Taşı',
        text: `+${s.permComboBonus.toFixed(1)}x (${ctx.count} kombinasyon)` });
    }

    /* GÖKYÜZÜ EJDERHASI (P31 · Grup F) — açılımdaki HER taşın değeri ×5.
       Ham puana (çarpandan ÖNCE) uygulanır; işleme taşları da açılımın
       parçası olduğu için onlar da sayılır. */
    const ejMul = (this.hasActive('ejderha') && (ctx.tiles.length || islemeCount)) ? EJDERHA_TILE_MULT : 1;
    const mixed = ctx.hasCift && (ctx.hasPer || ctx.hasSirali);
    const teker = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'ucuncuTeker');
    let baseScore, raw, carpan, carpanText;
    /* PLAYTEST 18 · GRUP C — ÜÇÜNCÜ TEKER hesap dökümü.
       Karışık açılımda TEK bir `carpan` yoktur (iki ayrı tablo işler), bu
       yüzden `carpan` null döner. UI'ın bunu güvenle çizebilmesi için her
       ailenin kendi ham puanı ve kendi çarpanı `parts` ile dışarı açılır
       (önceden yalnız serbest metin `carpanText` vardı; ui.js `carpan`ı
       koşulsuz `toFixed(1)` çağırıp null'da patlıyordu — bkz. Grup C notu). */
    let parts = null;

    /* Çarpan tablosu indeksi: önce Usta Eli (Grup E — kombinasyon sayısını
       İKİYE KATLAR), sonra Altın Oran (sabit +1 basamak) uygulanır. */
    const cStep = s.carpanStep || 0;      // Altın Oran — tabloda +1 basamak
    const cMul = 1 + (s.carpanScale || 0); // Usta Eli — sayıyı katlar
    const step = (n) => n * cMul + cStep;
    if (mixed && teker) {
      const ciftCombos = ctx.combos.filter(c => c.type === 'cift');
      const perCombos = ctx.combos.filter(c => c.type !== 'cift');
      let cCar = round2(getCarpan('cift', step(ciftCombos.length), s.permMult) + mult + TEKER_MULT);
      let pCar = round2(getCarpan('per', step(perCombos.length), s.permMult) + mult + TEKER_MULT);
      if (s.kumarbazRoll) { cCar = round2(cCar * s.kumarbazRoll); pCar = round2(pCar * s.kumarbazRoll); }
      const cRaw = ciftCombos.reduce((a, c) => a + this.comboSum(c), 0) * ejMul;
      const pRaw = (perCombos.reduce((a, c) => a + this.comboSum(c), 0) + islemeSum) * ejMul;
      raw = cRaw + pRaw;
      baseScore = ceilMul(cRaw, cCar) + ceilMul(pRaw, pCar);
      carpan = null;
      carpanText = `Çift ${cCar.toFixed(1)}x + Per/Sıralı ${pCar.toFixed(1)}x`;
      parts = [
        { key: 'cift', label: 'Çift', raw: cRaw, carpan: cCar, score: ceilMul(cRaw, cCar) },
        { key: 'per', label: 'Per/Sıralı', raw: pRaw, carpan: pCar, score: ceilMul(pRaw, pCar) },
      ].filter(x => x.raw > 0);
      flat += TEKER_FLAT;   // P30 · Grup C — karışık açılım başına bir kez
      triggered.push({ id: teker.id, name: teker.name,
        text: `+${TEKER_MULT.toFixed(1)}x +${TEKER_FLAT} puan (iki tablo)` });
    } else {
      // yalnız işleme varsa per tablosu tek-açılım çarpanı esas alınır (tasarım kararı)
      const mode = ctx.count === 0 ? 'per' : s.turnMode;
      carpan = round2(getCarpan(mode, step(Math.max(ctx.count, 1)), s.permMult) + mult);
      if (s.kumarbazRoll) {
        carpan = round2(carpan * s.kumarbazRoll);
        const kj = this.slotRecs().find(j => j.key === 'kumarbaz');
        if (kj) triggered.push({ id: kj.id, name: kj.name, text: `çarpan ×${s.kumarbazRoll}` });
      }
      raw = (ctx.combos.reduce((a, c) => a + this.comboSum(c), 0) + islemeSum) * ejMul;
      baseScore = ceilMul(raw, carpan);
      carpanText = `${carpan.toFixed(1)}x`;
    }

    /* GRUP I (P20) — ALTIN DAMAR: ham puana kalıcı yüzde.
       Çarpandan AYRI bir eksendir: çarpan tablosu kombinasyon sayısına
       bağlıdır, bu ise taşların toplam değerine. Böylece "az ama büyük
       kombinasyon" oynayan build'ler de ölçeklenebilir bir ödül bulur. */
    if ((s.permRawBonus || 0) > 0) {
      const before = baseScore;
      baseScore = Math.ceil(baseScore * (1 + s.permRawBonus));
      triggered.push({ id: 'up-altinDamar', name: 'Altın Damar',
        text: `ham puan +%${Math.round(s.permRawBonus * 100)} (+${baseScore - before})` });
    }

    // Gökyüzü Ejderhası — taş değerleri ×5 yukarıda ham puana işlendi; burada yalnız döküm satırı
    if (ejMul > 1) {
      const ej = this.slotRecs().find(j => j.key === 'ejderha');
      triggered.push({ id: ej.id, name: ej.name, text: `her taş ×${EJDERHA_TILE_MULT} (ham ${raw / ejMul} → ${raw})` });
    }

    /* PLAYTEST 29 · GRUP B — Hayalet'in (eski Yankı) "+%50 puan" kolu BURADAN
       KALDIRILDI; kart artık puana değil taşa dokunuyor (hayalet taş,
       bkz. confirmMelds içindeki Hayalet bloğu). `curMode` Kelebek Etkisi
       için gerekli olduğu için yerinde kaldı. */
    const curMode = mixed ? 'mixed' : (ctx.count === 0 ? 'per' : s.turnMode);
    // Kelebek Etkisi — önceki turdan FARKLI tür
    let kelebekCoin = 0;
    const klb = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'kelebek');
    if (klb && s.prevMeld && s.prevMeld.turn === s.turn - 1 && s.prevMeld.mode !== curMode) {
      const pick = Math.floor(this.rng() * 3);
      /* P35 · Grup N — KELEBEK_PCT / KELEBEK_FLAT / KELEBEK_COIN */
      if (pick === 0) {
        baseScore = Math.ceil(baseScore * (1 + KELEBEK_PCT));
        triggered.push({ id: klb.id, name: klb.name, text: `puan +%${Math.round(KELEBEK_PCT * 100)}` });
      } else if (pick === 1) {
        flat += KELEBEK_FLAT;
        triggered.push({ id: klb.id, name: klb.name, text: `+${KELEBEK_FLAT} puan` });
      } else {
        kelebekCoin = KELEBEK_COIN;
        triggered.push({ id: klb.id, name: klb.name, text: `+${KELEBEK_COIN} coin` });
      }
    }

    /* DAMGA (P28 · Grup B) — ÖNCEKİ "Ayna"nın otomatik %50'si gitti.
       Damga, açılımın TAM puanını (ham × çarpan + joker flat'leri) ikiye
       katlar; yani oyuncunun hesap kutusunda gördüğü sayı ne ise o.
       Bu yüzden `flat` EKLENDİKTEN SONRA hesaplanır — eski Ayna flat'ten
       önce giriyordu ve "puanım 2 katına çıkmadı" diye okunurdu.
       Boss kesintileri damgadan SONRA ve yüzde olarak işler, dolayısıyla
       damga onların da etkisini büyütmez/küçültmez. */
    let final = baseScore + flat;
    /* YASAK ELMA (P31 · Grup I) — elmalı açılım ×3 (işleme taşları dahil). */
    if (!s.jokersDisabled && final > 0 && this.hasActive('yasakElma')
        && [...ctx.tiles, ...s.islemeler.flatMap(e => e.tiles)].some(t => t.apple)) {
      const b = final * (APPLE_MULT - 1);
      final += b;
      const aj = this.slotRecs().find(j => j.key === 'yasakElma');
      triggered.push({ id: aj ? aj.id : 'apple', name: 'Adem ile Havva', text: `🍎 elma: ×${APPLE_MULT} (+${b})` });
    }
    let damgaBonus = 0;
    const damgaJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'ayna');
    if (damgaJ && !s.damgaUsed && s.damgaArmed && final > 0) {
      damgaBonus = final;
      final += damgaBonus;
      triggered.push({ id: damgaJ.id, name: damgaJ.name, text: `+${damgaBonus} puan (damga: 2 kat)` });
    }
    // Boss koşulları — açılım puanına etki edenler (GDD 10)
    if (this.bossOn()) {
      if (s.boss.key === 'kelebek' && s.bossBan && ctx.combos.some(c => c.type === s.bossBan)) {
        final = Math.ceil(final * 0.7);
        triggered.push({ id: 'boss', name: 'Kelebek Etkisi (BOSS)', text: 'yasak tür açıldı: -%30' });
      }
      if (s.boss.key === 'ahtapot' && final > 0) {
        final = Math.ceil(final * 0.85);
        triggered.push({ id: 'boss', name: 'Ahtapot (BOSS)', text: 'puanın %15\'i emildi' });
      }
      /* GLITCH (Grup N) — açılımda kullanılan her BOZUK glitch taşı bu
         açılımın puanını %25 düşürür. Ceza oransal olduğu için stage'le
         birlikte büyür (eski sabit -4 puan geç oyunda görünmezdi). */
      if (s.boss.key === 'dervish' && final > 0) {
        const bad = ctx.tiles.filter(t => t.glitchCurse).length;
        if (bad) {
          /* Bozuk taşlar elde birikebilir (temizlenmiyorlar); üst üste binen
             kesintiler raundu kazanılamaz yapmasın diye toplam kesinti
             GLITCH_MELD_MAX_CUT ile sınırlı. */
          const keep = Math.max(1 - GLITCH_MELD_MAX_CUT, Math.pow(1 - GLITCH_MELD_CUT, bad));
          final = Math.ceil(final * keep);
          triggered.push({ id: 'boss', name: 'GLITCH (BOSS)',
            text: `${bad} bozuk taş: -%${Math.round((1 - keep) * 100)}` });
        }
      }
    }
    // Crimson King — taçlı jokerin açılım katkısı ikinci kez
    if (crownBase != null) {
      const delta = final - crownBase;
      if (delta) {
        final = Math.max(0, final + delta);
        const cj = this.slotRecs().find(j => j.key === 'crimsonTac');
        triggered.push({ id: cj ? cj.id : 'crown', name: 'Crimson King',
          text: `👑 ${crownRec.name} iki kez (${delta > 0 ? '+' : ''}${delta})` });
      }
    }
    return { ctx, raw, carpan, carpanText, parts, final, flat, triggered, mixed, curMode, damgaBonus, kelebekCoin, islemeCount };
  },

  /* ---------- Tur akışı ---------- */

  /* Grup A — ıstaka konumu (t.slot) resolveCombo'ya bu paketle geçer.
     Slot'u olmayan taş varsa posOf undefined döner ve konum kuralı devre
     dışı kalır (motor testleri, sunucu tarafı çağrılar). */
  _posOpts() {
    return { posOf: (t) => (typeof t.slot === 'number' ? t.slot : undefined) };
  },

  /* PLAYTEST 16 · GRUP F — SEÇİMİ TAŞA ÇEVİRMENİN TEK GÜVENLİ YOLU.
     `ids.map(id => hand.find(t => t.id === id))` iki farklı seçim için
     AYNI nesneyi döndürebiliyordu (elde çakışan id varsa). Sonuç, örneğin
     [Kırmızı 10, Kırmızı 11, Kırmızı 11] gibi imkânsız bir kombinasyondu
     ve motor bunu "Per, Sıralı veya Çift kurallarına uymuyor" diye
     reddediyordu — oyuncu ise ekranda 10-11-12 görüyordu.
     Artık her id AYRI bir nesneye bağlanır: aynı id'den iki taş varsa
     ikisi de doğru şekilde eşleşir, gerçekten eşleşmeyen seçim ise
     yanıltıcı kombinasyon hatası yerine kendi hatasını verir. */
  _tilesByIds(ids) {
    const s = this.state;
    const taken = new Set();
    const tiles = [];
    for (const id of ids) {
      const t = s.hand.find(x => x.id === id && !taken.has(x));
      if (!t) return { tiles: null, error: 'Seçilen taşlardan biri elinde değil.' };
      taken.add(t); tiles.push(t);
    }
    return { tiles };
  },

  stageCombo(ids) {
    const s = this.state;
    if (s.godPick) return { ok: false, error: 'Önce Tanrının Eli ile destenden taşlarını seç.' };
    if (s.phase !== 'meld') return { ok: false, error: 'Şu an açılım aşamasında değilsin.' };
    const sel = this._tilesByIds(ids);
    if (!sel.tiles) return { ok: false, error: sel.error };
    const tiles = sel.tiles;
    if (tiles.length !== ids.length) return { ok: false, error: 'Seçim geçersiz.' };
    if (tiles.length === 0) return { ok: false, error: 'Önce elinden taş seç.' };
    if (tiles.some(t => t.jokerTile))
      return { ok: false, error: 'Deste jokeri kombinasyona giremez — elde etkisini gösterir, istersen discard edilir (-100).' };
    // Terzi'nin İğnesi BOSS Koşulu (Grup F): dikili taş bu tur açılıma giremez
    if (tiles.some(t => t.bossSewn))
      return { ok: false, error: '👹 İğne bu taşı dikti — bu tur açılımda kullanılamaz (tur bitince serbest kalır).' };

    const freeColors = this._freePerColors();
    // Grup A: okey, ıstakada bırakıldığı hücreye göre değer alır
    const res = resolveCombo(tiles, (t) => this.isOkeyTile(t), freeColors, this._posOpts());
    if (!res) return { ok: false, error: 'Geçersiz kombinasyon — Per, Sıralı veya Çift kurallarına uymuyor.' };
    const type = res.type;

    const mode = type === 'cift' ? 'cift' : 'per';
    if (s.turnMode && s.turnMode !== mode && !this.hasActive('ucuncuTeker'))
      return {
        ok: false,
        error: s.turnMode === 'cift'
          ? 'Bu turda Çift açılımı başlattın — Per/Sıralı ile karıştırılamaz (GDD 3.1).'
          : 'Bu turda Per/Sıralı açılımı başlattın — Çift ile karıştırılamaz (GDD 3.1).',
      };
    if (mode === 'cift' && s.staged.filter(c => c.type === 'cift').length >= 7)
      return { ok: false, error: 'Aynı turda en fazla 7 Çift açılabilir.' };

    if (!s.turnMode) s.turnMode = mode;

    s.hand = s.hand.filter(t => !tiles.includes(t));
    // Grup E: okey, yerine geçtiği taşın sırasında görünsün
    const ordered = orderComboTiles(type, tiles, res.values, (t) => this.isOkeyTile(t));
    s.staged.push({ type, tiles: ordered, values: res.values, usedOkey: res.usedOkey });
    return { ok: true, type };
  },

  /* Çoklu seçim açma: seçim tek kombinasyon değilse otomatik parçalara
     ayırıp hepsini sahneler (tek tıkla çoklu açılım — kullanıcı isteği) */
  stageSelection(ids) {
    const s = this.state;
    const asOne = this.stageCombo(ids); // önce bütün olarak dene (okey çözümü dahil)
    if (asOne.ok) return { ok: true, count: 1 };
    if (!asOne.error || !asOne.error.startsWith('Geçersiz kombinasyon')) return asOne;

    const tiles = this._tilesByIds(ids).tiles || [];   // Grup F: cakisan id guvenli
    if (tiles.length !== ids.length) return { ok: false, error: 'Seçim geçersiz.' };
    const groups = this._partitionCombos(tiles);
    if (!groups) {
      // Seçim ancak Çift + Per/Sıralı KARIŞIK bölünebiliyorsa daha net hata ver
      if (!this.hasActive('ucuncuTeker') && this._partitionCombos(tiles, true))
        return { ok: false, error: 'Çift ile Per/Sıralı aynı turda açılamaz (GDD 3.1) — seçimi ikiye böl.' };
      return asOne; // parçalanamadı — orijinal hata gösterilsin
    }
    const before = s.staged.length;
    for (const g of groups) {
      const r = this.stageCombo(g.map(t => t.id));
      if (!r.ok) {
        while (s.staged.length > before) this.unstage(s.staged.length - 1);
        return r;
      }
    }
    return { ok: true, count: groups.length };
  },

  /* Seçimi geçerli kombinasyon gruplarına ayır — BACKTRACKING (Grup C, 2026-07-09).
     Eski greedy sürüm çakışan taşları yanlış gruba kaptırıyordu (örn. 6-6-6 Per
     + 7-8-9 Sıralı seçiminde per'in aynı renkteki 6'sı sıralıya çalınıp açılım
     bozuluyordu) ve artan tek taşları okeyle Çift'e bağlayıp "tür karışması"
     hatası üretiyordu. Yeni sürüm seçimi TAM kapsayan bir bölümleme arar:
     önce tur türüne uygun tek-tür çözüm (Per/Sıralı serbestçe karışır — GDD'de
     yalnız Çift ile Per/Sıralı karışımı yasak), Üçüncü Teker varsa (veya
     allowMixed bayrağıyla) karışık bölümleme de denenir. */
  _partitionCombos(tiles, allowMixed) {
    const okeyFn = (t) => this.isOkeyTile(t);
    const free = this._freePerColors();
    const normals = tiles.filter(t => !okeyFn(t));
    const okeyTiles = tiles.filter(okeyFn);
    let nodes = 0; // güvenlik: patolojik seçimde aramayı kes

    // first'ü içeren tüm geçerli grup adayları (kind, use, okeyUse)
    const candidatesFor = (first, others, okeyN, modes) => {
      const out = [];
      if (modes.cift) {
        /* GRUP J (2026-09-06): renk-serbest taş (taşlaşmış / Su Taşı) her
           renkle eşleşir. Ayrıca TÜM eşler ayrı aday olarak üretilir —
           eskiden yalnız ilk eş deneniyordu ve yanlış eş seçilince arama
           çözümü bulamadan tıkanıyordu. */
        const twins = others.filter(t => t.number === first.number
          && (isColorWild(first) || isColorWild(t) || t.color === first.color));
        for (const twin of twins) out.push({ kind: 'cift', use: [first, twin], okeyUse: 0 });
        if (okeyN >= 1) out.push({ kind: 'cift', use: [first], okeyUse: 1 });
      }
      if (modes.per) {
        const sameNum = others.filter(t => t.number === first.number);
        const subs = [];
        const build = (idx, cur) => {
          subs.push([...cur]);
          if (cur.length >= 3) return; // per en fazla 4 taş (first + 3)
          for (let i = idx; i < sameNum.length; i++) {
            const t = sameNum[i];
            /* GRUP J: renk çakışması denetimi renk-serbest taşları ATLAR
               (perColorsOk ile aynı kural). */
            if (!isColorWild(t) && free !== true && t.color !== free &&
                [first, ...cur].some(p => !isColorWild(p) && p.color === t.color
                  && p.color !== free)) continue;
            cur.push(t); build(i + 1, cur); cur.pop();
          }
        };
        build(0, []);
        for (const sub of subs)
          for (let k = 0; k <= okeyN; k++) {
            const size = 1 + sub.length + k;
            if (size >= 3 && size <= 4) out.push({ kind: 'per', use: [first, ...sub], okeyUse: k });
          }
      }
      if (modes.sirali) {
        /* GRUP J: renk-serbest taş diziye HER renkte girer. `first` de
           serbestse dizinin rengi belirsizdir — bu yüzden seçimdeki her
           gerçek renk ayrı bir referans olarak denenir. */
        const refColors = isColorWild(first)
          ? [...new Set(others.filter(t => !isColorWild(t)).map(t => t.color))]
          : [first.color];
        if (!refColors.length) refColors.push(first.color);
        for (const rc of refColors) {
          const byNum = new Map(); // sayı → ilk uygun kopya (kopyalar simetrik)
          for (const t of others)
            if ((isColorWild(t) || t.color === rc) && t.number !== first.number
                && !byNum.has(t.number))
              byNum.set(t.number, t);
          for (let start = Math.max(1, first.number - 12); start <= first.number; start++) {
            for (let end = Math.max(first.number, start + 2); end <= Math.min(13, start + 12); end++) {
              const use = [first];
              let need = 0;
              for (let n = start; n <= end; n++) {
                if (n === first.number) continue;
                const t2 = byNum.get(n);
                if (t2) use.push(t2); else need++;
              }
              if (need <= okeyN) out.push({ kind: 'sirali', use, okeyUse: need });
            }
          }
        }
      }
      return out;
    };

    const solve = (modes) => {
      let found = null;
      const search = (rest, okeyN, acc) => {
        if (found || ++nodes > 150000) return;
        if (!rest.length) {
          if (okeyN === 0) found = acc.map(g => ({ use: [...g.use], okeyUse: g.okeyUse }));
          return;
        }
        const first = rest[0];
        const others = rest.slice(1);
        for (const cand of candidatesFor(first, others, okeyN, modes)) {
          const used = new Set(cand.use);
          acc.push(cand);
          search(rest.filter(t => !used.has(t)), okeyN - cand.okeyUse, acc);
          acc.pop();
          if (found) return;
        }
      };
      search(normals, okeyTiles.length, []);
      return found;
    };

    // Tercih sırası: mevcut tur türüyle uyumlu tek-tür çözüm önce
    const perSirali = { per: true, sirali: true, cift: false };
    const ciftOnly = { per: false, sirali: false, cift: true };
    const tryOrder = this.state.turnMode === 'cift' ? [ciftOnly, perSirali] : [perSirali, ciftOnly];
    let sol = null;
    for (const m of tryOrder) { sol = solve(m); if (sol) break; }
    if (!sol && (allowMixed || this.hasActive('ucuncuTeker')))
      sol = solve({ per: true, sirali: true, cift: true });
    if (!sol) return null;
    // okey taşlarını gruplara sırayla dağıt
    const pool = [...okeyTiles];
    return sol.map(g => [...g.use, ...pool.splice(0, g.okeyUse)]);
  },

  unstage(index) {
    const s = this.state;
    if (s.phase !== 'meld') return;
    const combo = s.staged.splice(index, 1)[0];
    if (combo) s.hand.push(...combo.tiles);
    if (s.staged.length === 0) s.turnMode = null;
    else if (!s.staged.some(c => c.type === 'cift')) s.turnMode = 'per';
    else if (s.staged.every(c => c.type === 'cift')) s.turnMode = 'cift';
  },

  /* İşleme (GDD 3.7): önceki turun açık kombinasyonuna elden taş ekle */
  addIsleme(comboIndex, ids, opts) {
    const s = this.state;
    if (s.phase !== 'meld') return { ok: false, error: 'Şu an açılım aşamasında değilsin.' };
    const combo = s.prevOpen[comboIndex];
    if (!combo) return { ok: false, error: 'İşlenecek kombinasyon bulunamadı.' };
    if (combo.type === 'cift') return { ok: false, error: 'Çift genişletilemez — işleme Per/Sıralı içindir.' };
    /* Bungie Gum (Playtest 10): taşları sakızla ele geri çekilen açılım
       KAPANMIŞ sayılır — masada açık durmadığı için işlenemez. */
    if (combo.gumClosed)
      return { ok: false, error: '🍬 Bu açılımın taşları sakızla elinize döndü — kombinasyon kapandı, işleme yapılamaz.' };
    const tiles = this._tilesByIds(ids).tiles || [];   // Grup F: cakisan id guvenli
    if (!tiles.length || tiles.length !== ids.length) return { ok: false, error: 'Önce elinden taş seç.' };
    if (tiles.some(t => t.jokerTile))
      return { ok: false, error: 'Deste jokeri işlemeye eklenemez.' };
    // Not: işleme, o turun açılım türünden bağımsızdır — önceki turun açık
    // kombinasyonuna ekleme her zaman denenebilir (kullanıcı kararı, 2026-07).

    // mevcut + önceki işlemeler + yeni taşlar birlikte geçerli kalmalı
    const already = s.islemeler.filter(e => e.comboIndex === comboIndex).flatMap(e => e.tiles);
    const merged = [...combo.tiles, ...already, ...tiles];
    const limit = combo.type === 'per' ? 4 : 13; // Sıralı sınırsız (madde 23, doğal maks 13)
    if (merged.length > limit)
      return { ok: false, error: `Bu kombinasyon en fazla ${limit} taşa çıkabilir.` };
    const res = resolveCombo(merged, (t) => this.isOkeyTile(t), this._freePerColors(),
      { forceStart: opts?.forceStart });
    if (!res || res.type !== combo.type)
      return { ok: false, error: 'Eklenen taşlar kombinasyonu geçerli tutmuyor (GDD 3.7.6).' };

    /* Grup A — işlemede de okeyin değerini oyuncu belirler. Istaka konumu
       burada anlam taşımadığından (kombinasyon tepside duruyor) birden fazla
       geçerli diziliş varsa UI'a seçenek döndürülür. */
    if (opts?.forceStart == null && res.usedOkey && (res.altStarts?.length || 0) > 1
        && tiles.some(t => this.isOkeyTile(t))) {
      const color = merged.find(t => !this.isOkeyTile(t))?.color;
      const L = merged.length;
      const fixed = merged.filter(t => !this.isOkeyTile(t)).map(t => t.number);
      const choices = res.altStarts.map(st => {
        const win = []; for (let i = 0; i < L; i++) win.push(st + i);
        const miss = win.filter(n => !fixed.includes(n));
        return { start: st, label: miss.map(n => `${COLOR_TR[color]} ${n}`).join(' + ') };
      });
      return { ok: false, needChoice: true, comboIndex, ids: [...ids], choices,
        error: 'Okey hangi taşın yerine geçsin?' };
    }

    const addSum = tiles.reduce((a, t) => {
      const v = res.values.get(t.id) ?? t.number;
      return a + v + (t.bonus || 0) + this._hipnoBonus(t, v);
    }, 0);
    s.hand = s.hand.filter(t => !tiles.includes(t));
    // Grup E: işlenen taşlar da atanan değerlerine göre dizilir (okey doğru yerde)
    const orderedAdd = orderComboTiles(res.type, tiles, res.values, (t) => this.isOkeyTile(t));
    s.islemeler.push({ comboIndex, tiles: orderedAdd, addSum, usedOkey: res.usedOkey, values: res.values });
    return { ok: true };
  },

  /* PLAYTEST 17 · GRUP A/1 — SEÇİLİ TAŞLAR BU KOMBİNASYONA GİRER Mİ?
     `canIsleme` yalnız "elde bir fırsat VAR MI" sorusunu yanıtlar; UI ise
     kullanıcı kararı gereği (2026-08-28) "+ İşle" düğmesini ancak ELDEKİ
     SEÇİM gerçekten işlenebiliyorken çizer — böylece bar hiçbir zaman
     sürekli pasif (gri) bir düğme taşımaz. Bu yardımcı, addIsleme'nin
     doğrulama adımlarını YAN ETKİSİZ tekrar eder. */
  canIslemeWith(comboIndex, ids) {
    const s = this.state;
    if (s.phase !== 'meld') return false;
    if (!Array.isArray(ids) || !ids.length) return false;
    const combo = s.prevOpen[comboIndex];
    if (!combo || combo.type === 'cift' || combo.gumClosed) return false;
    const tiles = this._tilesByIds(ids).tiles || [];
    if (tiles.length !== ids.length) return false;
    if (tiles.some(t => t.jokerTile)) return false;
    const already = s.islemeler.filter(e => e.comboIndex === comboIndex).flatMap(e => e.tiles);
    const merged = [...combo.tiles, ...already, ...tiles];
    const limit = combo.type === 'per' ? 4 : 13;
    if (merged.length > limit) return false;
    const res = resolveCombo(merged, (t) => this.isOkeyTile(t), this._freePerColors());
    return !!res && res.type === combo.type;
  },

  /* Elde bu kombinasyona gerçekten işlenebilecek taş var mı?
     (UI, İşle butonunu yalnız o zaman gösterir — madde 22) */
  canIsleme(comboIndex) {
    const s = this.state;
    const combo = s.prevOpen[comboIndex];
    if (!combo || combo.type === 'cift' || combo.gumClosed) return false;
    const already = s.islemeler.filter(e => e.comboIndex === comboIndex).flatMap(e => e.tiles);
    const limit = combo.type === 'per' ? 4 : 13;
    if (combo.tiles.length + already.length >= limit) return false;
    const free = this._freePerColors();
    return s.hand.some(t => !t.jokerTile &&
      resolveCombo([...combo.tiles, ...already, t], (x) => this.isOkeyTile(x), free)?.type === combo.type);
  },

  /* ============================================================
     GRUP J (Playtest 6) — SON TURDA GEREKSİZ DISCARD'I ATLA
     Son turda (artık taş çekilmeyecek turda) atılan taş yalnızca üç şeye
     yarar: işlek RİSKİ (hep aleyhte), taşa BAĞLI joker bonusları ve turun
     kapanması. Kazanç zaten kesinleşmişse ya da taşa bağlı hiçbir bonus
     sonucu değiştiremiyorsa, oyuncuyu anlamsız bir tıklamaya zorlamıyoruz.
     "Akıllı ayırım" (kullanıcı kararı): taştan BAĞIMSIZ etkiler (Ayna Kral
     birikimi, Vampir birikimi, kurtarıcı jokerler) her hâlükârda raund sonu
     değerlendirmesinde çalışır — discard(null) bunları atlamaz. Ama At1k
     Avcısı / Ayna Kırığı gibi ATILAN TAŞA bağlı bonuslar seni hedefe
     ulaştırabiliyorsa discard yine istenir, çünkü orada gerçek bir karar var.
     ============================================================ */

  /* Son turda taşa bağlı bir joker en iyi ihtimalle ne kadar puan üretebilir? */
  _maxDiscardGain() {
    const s = this.state;
    if (s.jokersDisabled) return 0;
    let best = 0;
    const cand = s.hand.filter(t => !t.jokerTile && !t.sewn && !t.bossSewn);
    if (!cand.length) return 0;
    // Ayna Kırığı: işlek TERSİNE döner → atılan taş × 20 (tetiklenirse)
    if (s.islekReversed) best += Math.max(...cand.map(t => t.number)) * 20;
    return best;
  },

  /* Son turda discard'ı atlamak güvenli mi?
     Dönüş: { skippable, reason } */
  canSkipFinalDiscard() {
    const s = this.state;
    if (s.status !== 'playing' || s.phase !== 'discard')
      return { skippable: false };
    if (s.turn < s.maxTurns) return { skippable: false }; // yalnız SON tur
    // Kazanç kesin: atmanın tek etkisi işlek riski — gereksiz
    if (s.score >= s.target)
      return { skippable: true, reason: 'won' };
    // Kayıp kesin mi? Taşa bağlı en iyi ihtimal bile yetmiyorsa evet.
    /* P29 · Grup D: Vampir bankası artık discard fazında değil, son turun
       AÇILIMINDA ödeniyor — bu noktada açılım kararı çoktan verilmiştir,
       bu yüzden tavana bir vampir terimi eklenmez. */
    const ceiling = s.score + this._maxDiscardGain();
    if (ceiling < s.target)
      return { skippable: true, reason: 'lost' };
    // Taşa bağlı bir bonus hâlâ çevirebilir → gerçek karar, discard sunulsun
    return { skippable: false, reason: 'contested' };
  },

  /* Elde açılabilecek HERHANGİ bir kombinasyon var mı?
     Geçerli bir Sıralı (L≥3) her zaman geçerli bir 3'lü Sıralı içerir; 4'lü
     Per de geçerli bir 3'lü Per içerir; Çift zaten 2 taştır — bu yüzden tüm
     ikili ve üçlüleri taramak TAM bir kontroldür. */
  anyMeldPossible() {
    const s = this.state;
    const h = s.hand.filter(t => !t.jokerTile && !t.bossSewn);
    const free = this._freePerColors();
    const okFn = (t) => this.isOkeyTile(t);
    for (let i = 0; i < h.length; i++)
      for (let j = i + 1; j < h.length; j++) {
        if (resolveCombo([h[i], h[j]], okFn, free)) return true;
        for (let k = j + 1; k < h.length; k++)
          if (resolveCombo([h[i], h[j], h[k]], okFn, free)) return true;
      }
    return false;
  },

  /* ============================================================
     GRUP C (Playtest 7) — KAYIP KESİNSE DOĞRUDAN GAME OVER
     Son turda hedefe ulaşmanın matematiksel olarak hiçbir yolu kalmadıysa
     oyuncudan "Raundu Bitir" tıklaması istemeye gerek yok. Karar ancak şu
     koşulların HEPSİ sağlanınca kesin sayılır:
       · son turdayız ve puan hedefin altında
       · elde açılabilir hiçbir şey yok (açılım / işleme / okey takası)
       · envanterde tüketilebilir yok (biri sonucu çevirebilirdi)
       · bekleyen bir karar (Tüccar teklifi, Şeytan feda) yok
       · atılacak taşa bağlı en iyi ihtimal (Atık Avcısı, Ayna Kırığı,
         Vampir bankası) bile hedefi tutturmuyor
     Kurtarıcı jokerler (Pinky, Lanetli Kaptan, The World, Misunderstood)
     BU YOLDA DA çalışır: UI yalnız discard(null) çağrısını kendisi yapar,
     raundun gerçekten kaybedilip kaybedilmediğine normal akış karar verir.
     ============================================================ */
  /* ============================================================
     PLAYTEST 9 · GRUP I — RAUND KAYBI AKIŞI
     Kural: raund sonunda hedefe ulaşılamadıysa
       · sonucu çevirebilecek HİÇBİR şey yoksa → doğrudan Game Over
       · varsa → o etki OTOMATİK devreye girer; yetiyorsa raund kazanılır,
         yetmiyorsa yine Game Over
     Ekstra tıklama/onay yok.

     `_roundRescueConsumables()` envanterde sonucu GERÇEKTEN çevirebilecek
     kalemleri süzer. Eskiden `hopelessRound` envanterde HERHANGİ bir
     tüketilebilir varsa pes ediyordu; Kumbara ya da Heybe gibi raundla
     hiç ilgisi olmayan bir kart bile oyuncuya kaybedilmiş raundu elle
     kapattırıyordu. Üç sınıf var:
       'win'  → kendi başına raundu kazandırabilir (Derin Nefes: hedefi
                kalıcı %10 indirir; anında yeniden hesaplanır)
       'turn' → raundu uzatır, yeni bir şans verir (şu an ÜYESİ YOK —
                eski Nefes İksiri P28'de kaldırıldı; sınıf duruyor ki
                ileride bir kart eklenince tablo yeniden yazılmasın)
       'tile' → taşa dokunur, yeni bir açılım DOĞURABİLİR — otomatik
                oynanamaz (hangi taş, hangi renk oyuncunun kararı), bu
                yüzden yalnız "otomatik Game Over"u engeller
     ============================================================ */
  /* P28 · Grup F: `nefesIksiri: 'turn'` satırı SİLİNDİ — o kart artık
     yok. Yerine gelen Ferman raundu uzatmaz ve hedefi indirmez, yani
     kaybedilmiş bir raundu çeviremez; kurtarıcı listesine GİRMEZ. */
  RESCUE_CONSUM: {
    altinCanak: 'win',
    boya: 'tile', cekic: 'tile', tac: 'tile', zimpara: 'tile',
    kopyaci: 'tile', gumusVernik: 'tile', simyaSisesi: 'tile',
  },

  _roundRescueConsumables(kinds) {
    const s = this.state;
    const want = kinds || ['win', 'turn', 'tile'];
    return (s.consumables || [])
      .map((key, index) => ({ key, index, kind: this.RESCUE_CONSUM[key] }))
      .filter(c => c.kind && want.includes(c.kind));
  },

  hopelessRound() {
    const s = this.state;
    if (s.status !== 'playing') return false;
    if (s.turn < s.maxTurns) return false;
    if (s.score >= s.target) return false;
    // Grup I: yalnız sonucu çevirebilecek tüketilebilirler otomatik bitişi durdurur
    if (this._roundRescueConsumables().length) return false;
    if (s.tuccarOffer || s.seytanPending) return false;
    if (s.phase === 'meld') {
      if (s.staged.length || s.islemeler.length) return false;
      if (this.anyMeldPossible()) return false;
      if (s.prevOpen.some((c, i) => this.canIsleme(i))) return false;
      if (this.okeySwapOptions().length) return false;
    } else if (s.phase !== 'discard') {
      return false;
    }
    /* P29 · Grup D: Vampir bankası artık discard fazında değil, son turun
       AÇILIMINDA ödeniyor — bu noktada açılım kararı çoktan verilmiştir,
       bu yüzden tavana bir vampir terimi eklenmez. */
    const ceiling = s.score + this._maxDiscardGain();
    return ceiling < s.target;
  },

  /* Grup I — hedefi indirerek raundu kazandırabilecek tüketilebilirleri
     otomatik kullan. Şu an tek üye: Derin Nefes (hedefler kalıcı -%10,
     tavan %40). Birden fazla kopya varsa hedefe yetene kadar kullanılır;
     hedefe yine ulaşılamıyorsa HİÇBİRİ harcanmaz (boşa gitmesin). */
  _autoRescueTarget(events) {
    const s = this.state;
    const cands = this._roundRescueConsumables(['win']);
    if (!cands.length) return false;
    // Önce kuru hesap: elimizdeki kopyalar hedefi puanın altına indirebiliyor mu?
    let cut = s.permTargetCut || 0;
    let need = 0;
    const base = () => Math.ceil(this.targetFor(s.stage, s.roundInStage)
      * (1 - cut) * (s.nextTargetMult || 1));
    for (const _ of cands) {
      if (base() <= s.score) break;
      if (cut >= 0.4) break;         // tavan
      cut = round2(Math.min(0.4, cut + 0.10));
      need++;
    }
    if (!need || base() > s.score) return false;   // yetmiyor → harcama
    let used = 0;
    for (let i = 0; i < need; i++) {
      const idx = (s.consumables || []).indexOf('altinCanak');
      if (idx === -1) break;
      const r = this.useConsumable(idx);
      if (!r.ok) break;
      used++;
      if (r.note) events.push(r.note);
    }
    if (used) events.push(`🏆 Otomatik kurtarma: hedef ${s.target} puana indi`);
    return s.score >= s.target;
  },

  /* Grup I — son çare: raunda TUR EKLEYEBİLEN bir değnek varsa iç.
     ⚠ P28 · GRUP F: bu sınıfın şu an ÜYESİ YOK — tek üyesi olan eski
     Nefes İksiri kartı kaldırıldı (yerine Ferman geldi, o raundu
     uzatmaz). Fonksiyon `_roundRescueConsumables(['turn'])` boş dönünce
     hemen false verir, yani kurtarıcı zincir sessizce bir adım kısalır.
     BİLEREK SİLİNMEDİ: 'turn' sınıfı ileride bir kart eklenince zincirin
     yeniden yazılmasını gerektirmesin.
     Yalnız oynanacak bir şey kaldıysa anlamlı: deste boşsa yeni tur da
     kurtarmaz, kart boşa gitmesin. */
  _autoRescueTurn(events) {
    const s = this.state;
    const cands = this._roundRescueConsumables(['turn']);
    if (!cands.length) return false;
    if (!s.deck.length && !s.hand.length) return false;
    const before = s.maxTurns;
    const r = this.useConsumable(cands[0].index);
    if (!r.ok) return false;
    if (r.note) events.push(r.note);
    if (s.maxTurns <= before) return false;   // beklenmedik: tur eklenmedi
    events.push(`🧪 Otomatik kurtarma: bu raunda 1 tur daha (${s.maxTurns})`);
    return true;
  },

  /* Kesin kayıp turunu oyuncu tıklamadan kapat (bkz. hopelessRound).
     Açılım aşamasındaysak önce discard'a geçilir. */
  autoFinishHopeless() {
    if (!this.hopelessRound()) return { ok: false };
    if (this.state.phase === 'meld') this.skipToDiscard();
    return this.discard(null);
  },

  /* ============================================================
     GRUP I (Playtest 6) — OKEY'İ İŞLEMEDE GERİ ALMA
     Açık duran bir kombinasyondaki okey, yerine geçtiği GERÇEK taş eline
     geldiğinde o taşla değiştirilebilir: gerçek taş kombinasyondaki yerini
     alır, okey serbest kalıp ele döner ve yeniden kullanılabilir.
     (Klasik 101'deki "okeyi alma" hamlesi.)
     ============================================================ */

  /* Kombinasyondaki bir okeyin temsil ettiği taşın kimliğini çöz.
     Dönüş: { color, number } | null */
  _okeyStandsFor(combo, okey) {
    const v = combo.values?.get(okey.id);
    if (v == null) return null;
    const others = combo.tiles.filter(t => t !== okey && !this.isOkeyTile(t));
    if (!others.length) return null;
    if (combo.type === 'sirali' || combo.type === 'cift') {
      // Grup O: rengi RENK-SERBEST olmayan bir taştan oku (taşlaşmış taş ve
      // Su Taşı renksizdir; dizinin gerçek rengini onlar belirlemez)
      const ref = others.find(t => !isColorWild(t)) || others[0];
      return { color: ref.color, number: combo.type === 'cift' ? ref.number : v };
    }
    if (combo.type === 'per') {
      // Per'de renk serbest: eksik renklerden HERHANGİ biri olabilir
      const used = new Set(others.map(t => t.color));
      // okeyin dışındaki diğer okeyler de renk yeri işgal eder
      const otherOkeys = combo.tiles.filter(t => t !== okey && this.isOkeyTile(t)).length;
      const free = COLORS.filter(c => !used.has(c));
      return { number: v, colors: free.slice(0, Math.max(1, free.length - otherOkeys)) };
    }
    return null;
  },

  /* PLAYTEST 9 · GRUP C — okeyin GÖRÜNEN yüzü.
     UI, kombinasyondaki okeyi yerine geçtiği taşın sayı+rengiyle çizer.
     Dönüş: { number, color|null }. color null ise renk belirsizdir
     (per: okey "eksik 4. renk" gibi davranır, tek bir rengi temsil etmez —
     bu yüzden per'de okey geri alma da yoktur, bkz. Grup D). */
  okeyFace(combo, tile) {
    if (!combo || !tile || tile.jokerTile || !this.isOkeyTile(tile)) return null;
    const need = this._okeyStandsFor(combo, tile);
    if (!need) return null;
    return { number: need.number, color: need.color || null };
  },

  /* Açık kombinasyonlardaki okeyler için elde eşleşen gerçek taş var mı?
     UI, "Okey'i Al" düğmesini yalnız bunlar için gösterir.
     Dönüş: [{ comboIndex, where, okeyId, tileId, label }] */
  okeySwapOptions() {
    const s = this.state;
    if (s.phase !== 'meld' || s.status !== 'playing') return [];
    const out = [];
    const scan = (combos, where) => {
      combos.forEach((combo, comboIndex) => {
        /* PLAYTEST 9 · GRUP D — PER'DE OKEY GERİ ALINAMAZ.
           Sıralı'da okey bir KONUMU (belirli renk + belirli sayı) doldurur,
           Çift'te eşin kimliğini birebir taşır — ikisinde de "hangi taşın
           yerine geçtiği" tektir. Per'de ise okey belirli bir rengi TEMSİL
           ETMEZ, yalnız "eksik bir renk" gibi davranır; 3'lü bir per'de iki
           farklı renk de onun yerini doldurabilir. Hangi taşla takas
           edileceği belirsiz olduğu için per bu özelliğin dışında bırakıldı
           (eski davranış: eksik renklerden herhangi biri kabul ediliyordu —
           oyuncu için keyfi ve kafa karıştırıcıydı). */
        if (combo.type === 'per') return;
        for (const okey of combo.tiles) {
          if (!this.isOkeyTile(okey)) continue;
          const need = this._okeyStandsFor(combo, okey);
          if (!need) continue;
          const match = s.hand.find(t => !t.jokerTile && !this.isOkeyTile(t)
            && t.number === need.number
            && (need.colors ? need.colors.includes(t.color) : t.color === need.color));
          if (!match) continue;
          out.push({ comboIndex, where, okeyId: okey.id, tileId: match.id,
            label: `${COLOR_TR[match.color]} ${match.number}` });
        }
      });
    };
    scan(s.prevOpen, 'prevOpen');
    scan(s.opened, 'opened');
    return out;
  },

  /* Okeyi kombinasyondan çıkar, yerine eldeki gerçek taşı koy.
     Okey ele döner ve o tur yeniden kullanılabilir. */
  swapOkey(where, comboIndex, okeyId, tileId) {
    const s = this.state;
    if (s.phase !== 'meld' || s.status !== 'playing')
      return { ok: false, error: 'Okey değişimi yalnız açılım aşamasında yapılabilir.' };
    const list = where === 'opened' ? s.opened : s.prevOpen;
    const combo = list?.[comboIndex];
    if (!combo) return { ok: false, error: 'Kombinasyon bulunamadı.' };
    // Grup D: per'de okeyin temsil ettiği renk belirsiz — geri alma yok
    if (combo.type === 'per')
      return { ok: false, error: 'Per\'de okey geri alınamaz — belirli bir rengin değil, eksik bir rengin yerine geçiyor.' };
    const oi = combo.tiles.findIndex(t => t.id === okeyId && this.isOkeyTile(t));
    if (oi === -1) return { ok: false, error: 'Bu kombinasyonda alınabilir bir okey yok.' };
    const okey = combo.tiles[oi];
    const need = this._okeyStandsFor(combo, okey);
    if (!need) return { ok: false, error: 'Okeyin yerine geçtiği taş çözülemedi.' };
    const hi = s.hand.findIndex(t => t.id === tileId);
    const real = s.hand[hi];
    if (!real || real.jokerTile || this.isOkeyTile(real))
      return { ok: false, error: 'Geçerli bir gerçek taş seç.' };
    if (real.number !== need.number
        || (need.colors ? !need.colors.includes(real.color) : real.color !== need.color))
      return { ok: false, error: `Bu okey ${need.colors ? need.number : COLOR_TR[need.color] + ' ' + need.number} yerine geçiyor — eşleşen taşı seçmelisin.` };
    if (real.bossSewn)
      return { ok: false, error: '👹 İğne bu taşı dikti — bu tur kullanılamaz.' };

    // takas: gerçek taş kombinasyondaki YERİNE oturur, okey ele döner
    combo.tiles[oi] = real;
    s.hand.splice(hi, 1);
    s.hand.push(okey);
    if (combo.values) {
      combo.values.delete(okey.id);
      combo.values.set(real.id, need.number);
    }
    // kombinasyon hâlâ geçerli mi? (emniyet — bozulursa geri al)
    const chk = resolveCombo(combo.tiles, (t) => this.isOkeyTile(t), this._freePerColors());
    if (!chk || chk.type !== combo.type) {
      combo.tiles[oi] = okey;
      s.hand = s.hand.filter(t => t !== okey);
      s.hand.push(real);
      if (combo.values) { combo.values.delete(real.id); combo.values.set(okey.id, need.number); }
      return { ok: false, error: 'Bu değişim kombinasyonu bozuyor.' };
    }
    combo.values = chk.values;
    combo.usedOkey = chk.usedOkey;
    combo.tiles = orderComboTiles(combo.type, combo.tiles, chk.values, (t) => this.isOkeyTile(t));
    return { ok: true,
      note: `🃏 Okey alındı: ${COLOR_TR[real.color]} ${real.number} kombinasyona girdi, okey eline döndü` };
  },

  undoIsleme(index) {
    const s = this.state;
    if (s.phase !== 'meld') return;
    const e = s.islemeler.splice(index, 1)[0];
    if (e) s.hand.push(...e.tiles);
    if (!s.staged.length && !s.islemeler.length) s.turnMode = null;
  },

  previewScore() {
    const s = this.state;
    if (!s.staged.length && !s.islemeler.length) return null;
    const r = this._calcOpening();
    return {
      count: s.staged.length, raw: r.raw,
      carpan: r.carpan, carpanText: r.carpanText, parts: r.parts,
      final: r.final, jokerFlat: r.flat,
      triggered: r.triggered, mode: s.turnMode, mixed: r.mixed,
      islemeCount: r.islemeCount,
      /* Damga (P28 · Grup B) — hesap kutusu zaten `final`i katlanmış
         gösterir; bu alan "katlanan pay ne kadardı" sorusunun tek
         doğru kaynağıdır (testler ve ileride bir döküm satırı için). */
      damgaBonus: r.damgaBonus,
    };
  },

  /* GRUP H — Uzaylı BOSS "Sinsi Bulaşma": gizli uzaylı içeren kombinasyonlar
     onay anında ÇÖKER. Puan hesabı YAPILMADAN önce çalışır ki çöken
     kombinasyon hiçbir jokeri, sayacı ya da çarpanı tetiklemesin; taşlar
     ele geri döner (uzaylı işareti düşer, tur sonunda yenileri seçilir). */
  _bossAlienCollapse(events) {
    const s = this.state;
    if (!this.bossOn() || s.boss?.key !== 'uzayli') return 0;
    let collapsed = 0, tiles = 0;
    const isInfected = (list) => list.some(t => t.hiddenAlien);
    // önce işlemeler (açık kombinasyona eklenenler), sonra sahnelenenler
    for (let i = s.islemeler.length - 1; i >= 0; i--) {
      if (!isInfected(s.islemeler[i].tiles)) continue;
      const e = s.islemeler.splice(i, 1)[0];
      for (const t of e.tiles) { delete t.hiddenAlien; s.hand.push(t); }
      collapsed++; tiles += e.tiles.length;
    }
    for (let i = s.staged.length - 1; i >= 0; i--) {
      if (!isInfected(s.staged[i].tiles)) continue;
      const c = s.staged.splice(i, 1)[0];
      for (const t of c.tiles) { delete t.hiddenAlien; s.hand.push(t); }
      collapsed++; tiles += c.tiles.length;
    }
    if (collapsed) {
      events.push(`👽 Sinsi Bulaşma: ${collapsed} kombinasyon çöktü — gizli uzaylı vardı, ${tiles} taş eline döndü (0 puan)`);
      // tür kilidi çöken kombinasyonlara göre yeniden hesaplanır
      if (!s.staged.length && !s.islemeler.length) s.turnMode = null;
      else if (s.staged.every(c => c.type === 'cift')) s.turnMode = 'cift';
      else if (!s.staged.some(c => c.type === 'cift')) s.turnMode = 'per';
    }
    return collapsed;
  },

  confirmMelds() {
    const s = this.state;
    if (s.godPick) return { ok: false, error: 'Önce Tanrının Eli ile destenden taşlarını seç.' };
    if (s.phase !== 'meld' || (!s.staged.length && !s.islemeler.length)) return { ok: false };

    // Grup H: gizli uzaylı taşıyan kombinasyonlar puanlanmadan önce çöker
    const alienEv = [];
    this._bossAlienCollapse(alienEv);
    if (alienEv.length && !s.staged.length && !s.islemeler.length) {
      // her şey çöktü: tur boşa gitti, açılım aşamasında kalınır
      return { ok: true, collapsed: true, raw: 0, final: 0, count: 0,
        carpanText: '', triggered: [], bonuses: [], events: alienEv };
    }

    const r = this._calcOpening();
    /* P35 · Grup H — hilenin EK puanı: aynı açılım hilesiz bir kez daha
       hesaplanır (_calcOpening yan etkisizdir), fark yakalanınca silinecek
       miktardır. */
    const cheatOn = !!s.cheatArmed && this.canCheat();
    let cheatGain = 0;
    if (cheatOn) {
      s.cheatArmed = false;
      try { cheatGain = Math.max(0, r.final - this._calcOpening().final); }
      finally { s.cheatArmed = true; }
    }
    /* GRUP F — boss koşullarının açılım anındaki etkileri. Puan EKLENMEDEN
       önce uygulanır ki "puan sıfırlanır" / "yansıma düşülür" kuralları
       kazanma kontrolünü doğru tetiklesin. */
    const bossEv = [];
    if (this.bossOn()) {
      const bk = s.boss.key;
      // KAHİN — zorunlu kehanete uymadıysan bu turun puanı SIFIR
      if (bk === 'kahin' && s.bossOracle) {
        const g = s.bossOracle;
        const c = r.ctx;
        const met = g.key === 'per' ? c.perCount > 0                    // eski havuz (kayıt uyumu)
          : g.key === 'cift2' ? c.ciftCount >= 2
          : g.key === 'combo2' ? c.count >= 2
          : g.key === 'sirali' ? c.siraliCount > 0                       // eski havuz
          : g.key === 'tiles5' ? c.tiles.length >= 5                     // eski havuz
          : g.key === 'perFull' ? c.combos.some(x => x.type === 'per' && x.tiles.length >= 4)
          : g.key === 'siraliLong' ? c.combos.some(x => x.type === 'sirali' && x.tiles.length >= 4)
          : g.key === 'tiles7' ? c.tiles.length >= 7
          : g.key === 'noOkey' ? !c.usedOkey : true;
        g.met = met;
        if (!met) {
          bossEv.push(`👹 Kahin: "${g.text}" tutmadı — bu açılımın puanı SIFIRLANDI`);
          r.final = 0;
          s.bossOracleMissed = true; // raund sonu +500 bonusu artık imkânsız
        } else {
          bossEv.push('👹 Kahin: kehanet tuttu');
        }
      }
      // RİTİM — sekans tutturulamadıysa bu açılım hiç puan vermez
      if (bk === 'ritim' && s.ritimFailed) {
        bossEv.push('👹 Ritim: sekans kaçtı — bu açılım puan vermiyor');
        r.final = 0;
        s.ritimFailed = false;
      }
      // AYNA KRAL — yansıma TERSİNE: önceki açılımın borcu bu açılımdan düşer
      if (bk === 'aynaKral') {
        const debt = s.bossMirrorDebt || 0;
        if (debt > 0) {
          const cut = Math.min(r.final, debt);
          r.final -= cut;
          bossEv.push(`👹 Ayna Kral: yansıma borcu -${cut} puan`);
        }
        /* Borç, açılımın YARISI kadar (GDD "biriken puan kazanımdan düşülür"
           birebir uygulanınca net kazanç sıfırlanıp raund matematiksel olarak
           kazanılamaz hâle geliyordu — %50 hem tehdidi hem oynanabilirliği
           koruyor). */
        s.bossMirrorDebt = Math.round(r.final * 0.5);
      }
    }
    s.score += r.final;
    /* P35 · Grup H — hile kaydı. Boss kesintisi açılımı sıfırladıysa ek
       puan da o kadar küçülür (silinecek miktar alınandan büyük olamaz). */
    if (cheatOn) {
      s.cheatGain = (s.cheatGain || 0) + Math.min(cheatGain, Math.max(0, r.final));
      s.cheatRisk = Math.min(1, round2((s.cheatRisk || 0) + CHEAT_HILE_RISK));
    }
    s.cheatArmed = false;
    /* MADDE D3 — run sonu özeti: en yüksek TEKLİ açılım. Boss kesintileri
       (Kahin sıfırlama, Ritim, Ayna Kral borcu) uygulandıktan SONRAKİ
       değer sayılır; oyuncunun gerçekten aldığı puan budur. */
    if (r.final > (s.statBestMeld || 0)) s.statBestMeld = r.final;
    s.openedThisTurn = true;

    /* DAMGA — hak yalnız GERÇEKTEN 2 kat verdiğinde harcanır; basış
       ise her açılımdan sonra düşer, böylece puanlamayan bir açılım
       (0 puan, boss sıfırlaması) damgayı yakmaz, oyuncu tekrar basar. */
    if (r.damgaBonus > 0) s.damgaUsed = true;
    s.damgaArmed = false;
    if (r.kelebekCoin) gainCoins(s, r.kelebekCoin);
    s.prevMeld = { turn: s.turn, mode: r.curMode };
    if (this.hasActive('midas'))
      s.midasCoins += MIDAS_COIN * (r.ctx.tiles.length + r.islemeCount);
    /* Vampir — P29 · Grup D. Son turda banka (bu turun emişi dahil)
       açılım puanına ödendi, bu yüzden sıfırlanır ve yeniden yazılmaz.
       Diğer turlarda emiş normal şekilde birikir. */
    if (this.hasActive('vampir')) {
      if (s.turn >= s.maxTurns) s.vampirBank = 0;
      else if (r.ctx.combos.length) s.vampirBank += this._vampirDrain(r.ctx.combos);
    }
    if (!s.jokersDisabled && s.godzillaLevel > 0 && this.slotRecs().some(j => j.key === 'godzilla'))
      s.godzillaLevel = 0;
    // Ayna Kral — yansıma biriktir
    /* P37 — yansıma BİRİKİR; aynı turdaki ikinci onay tur sayısını artırmaz */
    if (this.hasActive('aynaKral')) {
      s.aynaKralBank = (s.aynaKralBank || 0) + r.final;
      const aynaTurn = `${s.stage}-${s.roundInStage}-${s.turn}`;
      if (s.aynaKralTurnKey !== aynaTurn) {
        s.aynaKralTurnKey = aynaTurn;
        s.aynaKralMelds = (s.aynaKralMelds || 0) + 1;
      }
    }
    // Gümüş Taş — kullanılan her gümüş raund sonunda +GUMUS_TASI_COIN coin (GDD 6.5c, P42: 1 → 5)
    const usedTiles = [...r.ctx.tiles, ...s.islemeler.flatMap(e => e.tiles)];
    s.gumusPending += GUMUS_TASI_COIN * usedTiles.filter(t => t.special === 'gumus').length;
    /* Grup E — kaynak ekseninde çalışan özel taşlar açılım ONAYINDA ödenir
       (puan/çarpan ekseni _calcOpening'de, bkz. spN). */
    /* GRUP H — KUZEY YILDIZI. Kullanılan her Yıldız Taşı bir SEÇİM turu
       açar; UI pencereyi gösterir, oyuncu `yildizTake` ile birini alır. */
    const yildizN = usedTiles.filter(t => t.special === 'yildizTasi').length;
    if (yildizN) {
      s.yildizQueue = (s.yildizQueue || 0) + yildizN;
      this._yildizDeal(bossEv);
    }
    if (usedTiles.some(t => t.special === 'zamanTasi') && !s.ageSkip) {
      s.ageSkip = true;
      bossEv.push('⏳ Zaman Taşı: bu raund jokerlerinin süresi azalmayacak');
    }
    /* GRUP F (P22) — KARA DELİK TAŞI YOĞUNLAŞIR.
       Artış açılım ONAYINDA yazılır, puan hesabında değil: `_calcOpening`
       canlı önizleme için de çağrılıyor, oraya konsaydı taş fareyi
       gezdirdikçe büyürdü. `usedTiles` bu turun açılımı + bu turun
       işlemelerini kapsar ve her onayda sıfırlandığı için aynı taş iki kez
       sayılmaz. */
    for (const t of usedTiles) {
      if (t.special !== 'karaDelikTasi') continue;
      const rec = s.specialTiles.find(x => x.sid === t.sid);
      if (!rec) continue;
      const cap = KD_TASI_MAX - KD_TASI_BASE;
      if ((rec.kdGrow || 0) >= cap) continue;
      rec.kdGrow = Math.min(cap, (rec.kdGrow || 0) + KD_TASI_STEP);
      bossEv.push(`🕳 Kara Delik Taşı yoğunlaştı — bundan sonra +${KD_TASI_BASE + rec.kdGrow} puan`);
    }
    const events = [...alienEv, ...bossEv];
    /* Grup D: Tüccar puan borcu varsa kazanılan puandan HEMEN tahsil edilir
       (`events` bu satırda kuruluyor — tahsilat mesajı tur sonucunda görünsün
       diye çağrı buraya, puan eklendikten sonraya konuldu). */
    this._settleScoreDebt(events);
    // Grup F: boss şirket görevi tur bazlı denetlenir
    s.turnComboCount = (s.turnComboCount || 0) + r.ctx.count;
    s.turnAllCift = (s.turnAllCift !== false) && r.ctx.count > 0 && r.ctx.count === r.ctx.ciftCount;
    if (this.bossOn() && s.corpTask?.boss) this._bossCorpTurn(events);
    // Freedom Fighters BOSS Koşulu (Grup F): eline gelen işaretli taşlar
    // açılımda KULLANILMAK ZORUNDA — kullanılanları burada işaretliyoruz
    if (this.bossOn() && s.boss.key === 'freedom')
      for (const t of usedTiles) if (t.ffMarkedTile) t.ffUsedInMeld = true;
    // Fatality — tur skoru sınırı aşarsa hedef düşer (joker VEYA boss koşulu)
    s.turnScore = (s.turnScore || 0) + r.final;
    const bossFat = this.bossOn() && s.boss.key === 'fatality';
    const fatalityOn = (!s.jokersDisabled && this.hasActive('fatality')) || bossFat;
    if (fatalityOn && s.fatalityLimit && s.turnScore > s.fatalityLimit && !s.fatalityHit) {
      s.fatalityHit = true;
      // Boss Koşulu (GDD 13.4): %15; joker olarak %10
      const cut = bossFat ? 0.85 : 0.9;
      s.target = Math.max(50, Math.ceil(s.target * cut));
      events.push(`⚔ Fatality: sınır aşıldı — hedef %${bossFat ? 15 : 10} düştü (${s.target})`);
    }
    // Kahin hedef takibi
    if (s.kahinGoal && !s.kahinGoal.done) {
      if (s.kahinGoal.key === 'perAc' && r.ctx.perCount > 0) s.kahinGoal.done = true;
      else if (s.kahinGoal.key === 'cift2' && r.ctx.ciftCount >= 2) s.kahinGoal.done = true;
      if (s.kahinGoal.done) events.push('🔮 Kahin hedefi tamamlandı — ödül raund sonunda');
    }
    // The Corporates görev takibi
    if (s.corpTask && !s.corpTask.done) {
      if (s.corpTask.key === 'kizil' && r.ctx.count > 0 && r.ctx.count === r.ctx.ciftCount) s.corpTask.done = true;
      else if (s.corpTask.key === 'derin' && r.ctx.count >= 3) s.corpTask.done = true;
      if (s.corpTask.done) events.push(`🏢 ${s.corpTask.name} görevi tamamlandı`);
    }
    /* Bungie Gum — PLAYTEST 9 · GRUP Q + PLAYTEST 10 (ZAMANLAMA DÜZELTMESİ).
       Açılan taşlar ISTAKAYA GERİ DÖNER, ama ÖNAY ANINDA DEĞİL: bu turda
       açılım tıpkı normal bir açılım gibi masada AÇIK DURUR (puanlanır,
       tepside kalır); taşlar ancak BİR SONRAKİ TUR BAŞLADIĞINDA ele döner
       (bkz. discard() içindeki geri-dönüş bloğu). Eski sürüm kopyaları
       hemen ele koyuyordu — o yüzden taşlar discard fazında elde belirip
       "seçilemiyor" gibi görünüyordu (kullanıcı raporu).
       Sakızın kopma zarı BURADA atılır ki oyuncu turun sonucunu anında
       öğrensin; kopmadıysa taşlar `bungiePending` kuyruğunda bekler.
       Kopya sade tutulur (yalnız renk + sayı): özel taş / glitch / Freedom
       işareti / gizli bonus gibi durum bayrakları TAŞINMAZ — yoksa her
       turda kendini çoğaltan bonuslar oluşurdu. Gerçek okey de geri
       dönmez (joker çoğaltılmaz).
       KAPANMA KURALI: taşları geri çekilen açılım artık masada AÇIK
       DURMUYOR sayılır → gelecek tur o kombinasyona İŞLEME yapılamaz
       (`gumClosed`). Oyuncu taşları yeni bir açılımda sıfırdan kullanır. */
    if (!s.jokersDisabled && this.hasActive('bungieGum') && r.raw > 0) {
      /* P29 · Grup B: hayalet taş sakıza yapışmaz — yoksa bir
         turluk kopya, Bungie kuyruğuna girip kalıcı hâle gelirdi. */
      const used = [...r.ctx.tiles, ...s.islemeler.flatMap(e => e.tiles)]
        .filter(t => !t.jokerTile && !this.isOkeyTile(t) && !t.ghost);
      if (this.rng() < BUNGIE_SNAP) {
        events.push(`🍬 Bungie Gum koptu — bu turun ${used.length} taşı geri dönmeyecek`);
      } else if (used.length) {
        /* PLAYTEST 16 · GRUP E — KUYRUKTA ARTIK TAŞIN KENDİSİ DURUR.
           Eskiden yalnız {color, number} DEĞERİ saklanıyordu ve dönüşte
           `++_tileId` ile YENİ taş üretiliyordu; masadaki asıl taş ise
           yerinde kalıyordu. Yani sakız her kullanımda desteye taş
           EKLİYORDU (2 Sarı 7 → 3 Sarı 7). Artık nesnenin kendisi
           kuyruğa girer, dönüşte masadan SİLİNİP ele geri konur. */
        s.bungiePending = (s.bungiePending || []).concat(used);
        // kaynak açılımlar kapanır: bu turun kombinasyonları + işleme yapılan
        // önceki tur kombinasyonları (bayrak combo nesnesiyle prevOpen'a taşınır)
        for (const c of s.staged) c.gumClosed = true;
        for (const e of s.islemeler) {
          const c = s.prevOpen[e.comboIndex];
          if (c) c.gumClosed = true;
        }
        events.push(`🍬 Bungie Gum: ${used.length} taş sakıza yapıştı — SONRAKİ TUR başında ıstakana dönecek`);
      }
    }
    /* HAYALET (eski Yankı) — HAYALET TAŞ (PLAYTEST 29 · GRUP B).
       Açılımın EN DÜŞÜK taşının bir hayaleti üretilir. Asıl taş masada
       kalır; hayalet ayrı bir nesnedir ve SONRAKİ TUR BAŞINDA ıstakaya
       gelir (Bungie Gum'la aynı zamanlama — onay anında ele koymak taşın
       discard fazında belirip "seçilemiyor" görünmesine yol açıyordu).
       Kuyrukta taşın KENDİSİ değil yalnız YÜZÜ (renk+sayı) durur: hayalet
       türetilmiş bir taştır, özel taş / Freedom işareti / gizli bonus gibi
       durum bayrakları TAŞINMAZ (Bungie kopyalarıyla aynı gerekçe).
       Seçimde okey, sahte okey ve joker taşları kapsam dışıdır — joker
       çoğaltılmaz. Kuyrukta tek yer vardır: aynı turda ikinci bir açılım
       hayaleti tazeler, biriktirmez. */
    if (!s.jokersDisabled && this.hasActive('yanki') && r.raw > 0) {
      const src = [...r.ctx.tiles, ...s.islemeler.flatMap(e => e.tiles)]
        .filter(t => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t) && !t.ghost);
      if (src.length) {
        const low = src.reduce((a, b) => (b.number < a.number ? b : a));
        s.yankiPending = { color: low.color, number: low.number };
        events.push(`📣 Hayalet: ${COLOR_TR[low.color]} ${low.number} sonraki tur ıstakana gelecek`);
      }
    }
    // Ritim bonusu tek açılımlık — kullanıldı
    if (s.ritimBonus > 0) s.ritimBonus = 0;
    // Cellat — açılım sonrası en düşük taşı idam eder (GDD 10)
    const celJ = !s.jokersDisabled && s.deckJokers.find(j => j.key === 'cellat'
      && j.activeRound && s.hand.some(t => t.jokerTile === 'cellat'));
    if (celJ) {
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey);
      if (cand.length) {
        const low = cand.reduce((a, b) => (b.number < a.number ? b : a));
        this._takeTile(low, 'cellat');
        s.score += CELLAT_EXEC;
        s.cellatMotive += CELLAT_MOTIVE;
        events.push(`Cellat ${COLOR_TR[low.color]} ${low.number} taşını idam etti (+${CELLAT_EXEC} puan, açılımlara +${CELLAT_MOTIVE})`);
      }
    }
    /* YASAK ELMA (P31 · Grup I) — elma açıldıysa cennetten kovulma. */
    if (!s.appleEaten && [...r.ctx.tiles, ...s.islemeler.flatMap(e => e.tiles)].some(t => t.apple)) {
      s.appleEaten = true;
      s.islekRateBonus = round2((s.islekRateBonus || 0) + APPLE_ISLEK);
      events.push(`🍎 Elmayı ısırdın — cennetten kovuldun: kalan turlarda ${APPLE_DRAW_CUT} taş eksik çekiş, işlek +%${Math.round(APPLE_ISLEK * 100)}`);
    }
    /* Gökyüzü Ejderhası (P31 · Grup F) — ıstakadan rastgele 1 taş KALICI
       silinir: Ustura ile aynı defter (tileMods remove + özel/mıknatıs
       kaydı). Deste jokeri ve sahte okey kalıcı silinemez, aday değildir. */
    if (this.hasActive('ejderha') && s.hand.length) {
      const cand = s.hand.filter(t => !t.jokerTile && !t.fakeOkey);
      if (cand.length) {
        const t = cand[Math.floor(this.rng() * cand.length)];
        s.tileMods.push({ op: 'remove', color: t.color, number: t.number });
        this._dropSpecialRecord(t);
        this._dropMagnet(t);
        const burned = this._takeTile(t, 'ejderha');
        events.push(`Ejderha ${COLOR_TR[burned.color]} ${burned.number} taşını ıstakandan KALICI olarak sildi`);
      }
    }

    const result = {
      raw: r.raw, carpan: r.carpan, carpanText: r.carpanText, parts: r.parts,
      final: r.final, count: r.ctx.count, mode: s.turnMode,
      bonuses: [], triggered: r.triggered, events,
    };

    if (r.ctx.ciftCount === 7) {
      s.permMult += BONUS_7_CIFT;
      result.bonuses.push(`7 ÇİFT REKORU! +${BONUS_7_CIFT.toFixed(1)}x kalıcı çarpan`);
    }
    if ((r.ctx.perCount + r.ctx.siraliCount) >= 7 && s.hand.length === 0) {
      s.permMult += BONUS_TAM_EL;
      result.bonuses.push(`TAM EL! +${BONUS_TAM_EL.toFixed(1)}x kalıcı çarpan`);
      result.tamEl = true;
    }

    // işlenen taşları önceki açık kombinasyonlara görsel olarak ekle
    for (const e of s.islemeler) {
      const c = s.prevOpen[e.comboIndex];
      if (c) c.tiles.push(...e.tiles);
    }
    s.islemeler = [];
    /* BORSA — HİSSE BİRİKİMİ (P29 · Grup H). Onaylanan her kombinasyon
       türünden bir hisse yazar. ÖNİZLEMEDE değil yalnız ONAY anında
       artar (previewScore aynı yolu defalarca çağırır). Hisseler jokerin
       üstünde durur: joker ölünce portföy de gider. */
    {
      const tdj = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'tradeJokeri');
      if (tdj) {
        tdj.borsaShares = tdj.borsaShares || BORSA_EMPTY();
        const got = [];
        for (const c of s.staged) {
          if (!BORSA_TYPES.includes(c.type)) continue;
          if (tdj.borsaShares[c.type] >= BORSA_SHARE_CAP) continue;
          tdj.borsaShares[c.type]++;
          got.push(TYPE_TR[c.type]);
        }
        if (got.length)
          events.push(`📊 Borsa: ${got.length} hisse alındı (${got.join(', ')})`);
      }
    }
    s.opened = s.staged;
    s.staged = [];
    s.lastResult = result;

    if (result.tamEl || s.score >= s.target) {
      this._finishWin();
      result.won = true;
    } else {
      s.phase = 'discard';
    }
    return { ok: true, ...result };
  },

  skipToDiscard() {
    const s = this.state;
    if (s.godPick) return { ok: false, error: 'Önce Tanrının Eli ile destenden taşlarını seç.' };
    if (s.phase !== 'meld') return { ok: false };
    if (s.staged.length || s.islemeler.length)
      return { ok: false, error: 'Önce bekleyen açılımı/işlemeyi onayla veya geri al.' };
    s.phase = 'discard';
    return { ok: true };
  },

  /* PLAYTEST 10 · GRUP B (kullanıcı kararı) — TURDA 1-3 TAŞ ATILABİLİR.
     Eskiden tur sonunda YALNIZ 1 taş atılabiliyordu; bazı ellerde tek taş
     atmak eli açmaya yetmiyor ve el fiilen kilitleniyordu. Artık oyuncu
     1, 2 ya da 3 taş seçip birlikte atabilir.
     İŞLEK CEZASI YENİ FORMÜL: zar TURDA TEK KEZ atılır ve tutarsa ceza
     YALNIZ EN BÜYÜK DEĞERLİ taşın 10 katıdır — atılan diğer taşlar cezaya
     dahil edilmez. (Örn. 4 · 9 · 12 atıldıysa ceza 120'dir, 250 değil.)
     Böylece çoklu atış bir "risk çarpanı" olmaz; risk tek ve okunabilir
     kalır, karar "en yükseği atmayı göze alıyor muyum" sorusuna iner.
     Çekiş sayısı mantığına DOKUNULMADI (bkz. wantN / drawN hesabı). */
  MAX_DISCARD: 3,

  discard(id) {
    const s = this.state;
    if (s.phase !== 'discard') return { ok: false };
    // tek id (eski imza, tüm çağrı yerleri çalışmaya devam eder) ya da dizi
    const ids = Array.isArray(id) ? [...new Set(id)] : (id == null ? [] : [id]);
    if (ids.length > this.MAX_DISCARD)
      return { ok: false, error: `Bir turda en fazla ${this.MAX_DISCARD} taş atabilirsin.` };
    const picks = ids.map(x => s.hand.find(t => t.id === x)).filter(Boolean);
    /* El boşsa discard atlanabilir (elin tamamı açıldıysa) — softlock önlemi.
       Grup J: SON turda sonuç zaten kesinleşmişse de taşsız bitirilebilir
       (bkz. canSkipFinalDiscard); taşa bağlı bir joker sonucu çevirebiliyorsa
       bu kapı açılmaz ve normal discard istenir. */
    if (!picks.length && this.realHandCount() > 0 && !this.canSkipFinalDiscard().skippable)
      return { ok: false, error: 'Atılacak taşı elinden seç.' };
    if (picks.length !== ids.length)
      return { ok: false, error: 'Seçilen taşlardan biri elinde değil.' };
    // P29 · Grup B — hayalet taş atılamaz, yalnız açılımda kullanılır
    if (picks.some(t => t.ghost))
      return { ok: false, error: 'Hayalet taş atılamaz — yalnız açılımda kullanılır.' };
    if (picks.some(t => t.sewn))
      return { ok: false, error: 'Bu taş dikili — discard edilemez (Terzi\'nin İğnesi).' };
    // Terzi'nin İğnesi BOSS Koşulu (Grup F): dikili taş bu tur atılamaz da
    if (picks.some(t => t.bossSewn))
      return { ok: false, error: '👹 İğne bu taşı dikti — bu tur atılamaz (tur bitince serbest kalır).' };

    for (const t of picks) {
      s.hand = s.hand.filter(x => x !== t);
      s.discardPile.push(t);
    }
    const tile = picks[0] || null;   // tekli yollar için geriye dönük kısayol
    const events = [];
    if (picks.length > 1)
      events.push(`🗑 ${picks.length} taş atıldı: `
        + picks.map(t => `${COLOR_TR[t.color]} ${t.number}`).join(', '));

    // graveyard: önceki turun açıkları gider, bu turunkiler işlenebilir olur (GDD 3.7)
    s.prevOpen = s.opened;
    s.opened = [];

    if (!s.openedThisTurn) s.noMeldTurns++;
    /* PLAYTEST 9 · GRUP H (bug) — KAHİN'İN CEZA TARAFI.
       Kök neden: kehanet YALNIZ confirmMelds içinde denetleniyordu, yani
       "hiç açılım yapmamak" kehaneti hiç ihlal etmiyordu. Ceza (o turun
       puanı sıfır) zaten açılım yapmayan için bedelsizdi, `bossOracleMissed`
       de false kalıyordu → oyuncu kehaneti tutamayacağı turları PAS GEÇEREK
       raund sonundaki +500'ü bedavaya alıyordu. Boss "sadece bonus veren"
       bir mekaniğe dönüşmüştü.
       Artık kehanet tur SONUNDA denetlenir: açılım yapılmadıysa da ihlal
       sayılır (pas geçmek kaçış yolu değil). */
    if (this.bossOn() && s.boss.key === 'kahin' && s.bossOracle && !s.bossOracle.met) {
      if (!s.openedThisTurn) {
        events.push(`👹 Kahin: bu tur hiç açılım yapmadın — "${s.bossOracle.text}" kehaneti TUTMADI`);
        s.bossOracleMissed = true;
      }
      /* Ceza pekiştirmesi: ihlal edilen turun BÜTÜN kazancı gider — açılım
         puanı confirmMelds'te sıfırlandı, tur içinde başka yollardan
         (tur başı bonusları, işleme, joker tetiklemeleri) biriken puan da
         burada geri alınır. GDD 10: "o turun TÜM puanı sıfırlanır". */
      if (s.turnScore > 0) {
        s.score = Math.max(0, s.score - s.turnScore);
        events.push(`👹 Kahin cezası: bu turda kazanılan ${s.turnScore} puan silindi`);
        s.turnScore = 0;
      }
    }
    if (s.corpTask?.key === 'yesil' && !s.openedThisTurn) s.corpTask.failed = true;
    // Grup F: boss şirket görevi — açılımsız geçilen tur da denetlenir
    if (this.bossOn() && s.corpTask?.boss && !s.openedThisTurn)
      this._bossCorpTurn(events);
    s.consecMeldTurns = s.openedThisTurn ? s.consecMeldTurns + 1 : 0;
    s.skipStreak = s.openedThisTurn ? 0 : s.skipStreak + 1;

    /* ---- THE CHEATING (Grup G, P19) — tur sonu ---- */
    /* (1) BOSS: tur başında duyurulan hile şimdi zar atılarak çözülür. */
    if (this.bossOn() && s.boss?.key === 'cheating') this._bossCheatResolve(events);
    /* (1b) P35 · GRUP H — JOKER: bu raund hile yapıldıysa zar TUR SONUNDA. */
    this._cheatJokerResolve(events);
    /* (2) PLAYTEST 21 — "açılımsız geçilen tur riski sıfırlar" kolu
       KALDIRILDI. Risk artık sabit %20 olduğu için sıfırlanacak bir kademe
       yok; kural tek cümleye indi (bkz. CHEAT_RISK notu). */

    // Godzilla şarj / Ayna Kral tahsilat
    if (!s.jokersDisabled) {
      if (!s.openedThisTurn && this.slotRecs().some(j => j.key === 'godzilla')) {
        s.godzillaLevel = Math.min(3, s.godzillaLevel + 1);
        events.push(`Godzilla şarj oldu (S${s.godzillaLevel})`);
      }
      if (!s.openedThisTurn && s.aynaKralBank > 0 && this.slotRecs().some(j => j.key === 'aynaKral')) {
        const n = s.aynaKralMelds || 1;
        const am = n >= 3 ? AYNA_MULT_3 : n === 2 ? AYNA_MULT_2 : 1;
        const gain = Math.round(s.aynaKralBank * am);
        s.score += gain;
        events.push(`Ayna Kral yansıması: +${gain} puan (${n} açılım ×${am})`);
        s.aynaKralBank = 0;
        s.aynaKralMelds = 0;
        s.aynaKralTurnKey = null;
      }
    }

    /* Okey / Deste Jokeri discard cezası (GDD 2.9/7.6) — işlek yerine sabit
       -100. Bu ceza TAŞ BAŞINADIR ve işlek formülünden bağımsızdır. */
    if (!picks.length) {
      events.push('El boş — taş atmadan tur sonlandı');
    }
    for (const t of picks) {
      if (t.jokerTile) {
        s.score = Math.max(0, s.score - 100);
        const dj = s.deckJokers.find(j => j.key === t.jokerTile);
        if (dj) dj.activeRound = false; // elden çıktı — etkisi durur
        events.push(`◈ ${t.jname} discard edildi: -100 puan (GDD 7.6)`);
      } else if (this.isOkeyTile(t)) {
        /* HİDRA (P34) — ceza yok; doğum yeni turun başında (aşağıdaki
           HİDRA bloğu). Kıyamet Trompeti jokerleri susturduysa ceza işler. */
        if (!s.jokersDisabled && this.hasActive('hidra')) {
          s.hidraPending = (s.hidraPending || 0) + HIDRA_SPAWN;
          events.push('🐉 Hidra: okey cezasız atıldı — sonraki tur iki kafa çıkacak');
        } else {
          s.score = Math.max(0, s.score - 100);
          events.push('OKEY taşı atıldı: -100 puan (GDD 7.6)');
        }
      } else if (t.stoned) {
        // Medusa — taşlaşmış taş işlekten etkilenmez (GDD 11)
        events.push(`Taşlaşmış ${COLOR_TR[t.color]} ${t.number} atıldı — işlek işlemez`);
      } else if (t.special === 'karaDelikTasi') {
        /* Grup E / Grup F (P22) — atılması güvenlidir (işlek zarı hiç
           atılmaz). Muafiyet yeni temayla da örtüşür: kara deliğe düşen
           taş iz bırakmaz, kimse onun atıldığını göremez. */
        events.push(`🕳 Kara Delik Taşı atıldı — işlek işlemez`);
      }
    }
    /* İŞLEK (GDD 2.7 + Playtest 10 · Grup B).
       Zar TURDA TEK KEZ atılır; ceza YALNIZ en büyük değerli aday taşın 10
       katıdır. Muaf taşlar (okey, deste jokeri, taşlaşmış, Kara Delik) aday
       listesine hiç girmez. */
    const islekCands = picks.filter(t => !t.jokerTile && !this.isOkeyTile(t)
      && !t.stoned && t.special !== 'karaDelikTasi');
    if (islekCands.length) {
      const top = islekCands.reduce((a, b) => (b.number > a.number ? b : a));
      let rate = this.bossOn() ? (s.openedThisTurn ? 0.20 : 0.30) : 0.20;
      rate += s.islekRateBonus;
      /* P29 · Grup J — Terazi'nin işlek riski borcu KALDIRILDI; bedel
         artık cezanın KENDİSİNE bağlı (aşağıdaki iptal bloğu). */
      /* Grup F (2026-07-09): açılmadan geçme cezası — üst üste açılımsız
         geçilen her tur işlek riskini +%10 artırır (en fazla +%30).
         Turları boş geçip istiflemek artık bedava değil; Bitki/Kaioken/
         Godzilla gibi "bekle-patlat" jokerleri bu riski bilinçli üstlenir. */
      if (!s.openedThisTurn && s.skipStreak >= 1) {
        const skipPen = Math.min(0.30, 0.10 * s.skipStreak);
        rate += skipPen;
        events.push(`Açılımsız geçiş: işlek riski +%${Math.round(skipPen * 100)}`);
      }
      rate = Math.max(0, rate - (s.permIslekReduce || 0)); // Nazar Boncuğu + Muska
      if (this.rngIslek() < rate) {
        const extra = islekCands.length > 1
          ? ` (yalnız en yüksek taş sayılır — ${islekCands.length} taş atıldı)` : '';
        /* PARATONER (P29 · Grup F) — yem varsa yıldırım ona iner.
           Sıra: Ayna Kırığı (Mythic) > Paratoner (Rare) > normal ceza.
           Mythic zaten daha büyük ödemeyi yaptığı için yem yanmaz —
           iki kart birlikteyken oyuncu hem 20 katı alıp hem taş
           kaybetmez. Yem elden çıkarken `_takeTile` ZORUNLU, yoksa el
           defteri nöbetçisi onu sahipsiz kayıp sayar. */
        const ptBait = (!s.islekReversed && !s.jokersDisabled && this.hasActive('paratoner'))
          ? s.hand.find(t => t.id === s.paratonerBait) : null;
        if (s.islekReversed) {
          const gain = top.number * 20;
          s.score += gain;
          events.push(`İŞLEK (Ayna Kırığı): +${gain} puan!${extra}`);
        } else if (ptBait) {
          const gain = ptBait.number * PARATONER_MULT;
          s.score += gain;
          this._takeTile(ptBait, 'paratoner-yem');
          events.push(`⚡ Paratoner: yıldırım ${COLOR_TR[ptBait.color]} ${ptBait.number} `
            + `yemine indi → +${gain} puan (yem yandı)`);
        } else {
          const pen = top.number * 10;
          s.score = Math.max(0, s.score - pen);
          events.push(`İŞLEK! ${COLOR_TR[top.color]} ${top.number} → -${pen} puan${extra}`);
          /* TERAZİ (P29 · Grup J) — ceza YENDİ: bu turun feda bonusu geri
             alınır. Feda discard'tan ÖNCE yapıldığı için bonus çoktan
             yazılmıştır; burada aynı miktar geri sarılır. Bu blok yalnız
             GERÇEK ceza dalındadır — Paratoner ve Ayna Kırığı dallarında
             ceza yenmemiştir, bonus durur. */
          const tg = s.teraziTurnGain;
          if (tg) {
            if (tg.heavy) {
              s.target += tg.amount;
              events.push(`⚖ İşlek yedin — feda iptal: hedef ${tg.amount} puan geri yükseldi`);
            } else {
              s.teraziRoundMult = Math.max(0, round2((s.teraziRoundMult || 0) - tg.amount));
              events.push(`⚖ İşlek yedin — feda iptal: +${tg.amount.toFixed(1)}x geri alındı`);
            }
            s.teraziTurnGain = null;
          }
        }
      }
    }

    /* Dr. Frankenstein — MEZARLIK KAYDI.
       Atılan her normal taş mezarlığa düşer; bir sonraki tur başında en
       yükseği +3 değerle dirilir. Okey ve deste jokeri taşları mezarlığa
       girmez (onların atılması zaten -100'lük ayrı bir karar). Kayıt yalnız
       joker aktifken tutulur — boşuna state şişmesin. */
    if (this.hasActive('frankenstein'))
      for (const t of picks)
        /* Grup D: özel taş mezarlığa girmez — diriltilen taş SIRADAN
           doğduğu için özel taşın kimliği kopyalanamaz, kaybolurdu. */
        if (!t.jokerTile && !this.isOkeyTile(t) && !t.special)
          s.graveTiles.push({ color: t.color, number: t.number });

    // Çöpçü (yalnız gerçek discard sayılır) — atılan her taş sayaca girer
    if (this.hasActive('copcu')) {
      for (const _t of picks) {
        s.copcuCount++;
        if (s.copcuCount % 3 === 0) { gainCoins(s, 15); events.push('Çöpçü: +15 coin'); }
      }
    }
    /* P29 · Grup F — Kum Saati kaldırıldı, kristal birikimi de onunla
       gitti. `s.kristal` alanı eski kayıtlar için 0'da duruyor. */
    /* Katalizör — tur sonunda elde kalan her taş birikim ekler (P29 · Grup I).
       Sayım `realHandCount`tan gelir: Hayalet'in taşı bir turluk
       türetilmiş bir kopyadır ve tasarım gereği el sayısına girmez, yani
       bedava birikim üretmemeli. */
    {
      const ktj = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'katalizor');
      const n = this.realHandCount();
      if (ktj && n) {
        const before = ktj.katalizorMult || 0;
        ktj.katalizorMult = Math.min(KATALIZOR_CAP, round2(before + KATALIZOR_STEP * n));
        if (ktj.katalizorMult !== before)
          events.push(`Katalizör: ${n} taş bekledi → +${ktj.katalizorMult.toFixed(2)}x birikti`);
      }
    }
    /* Zincir — tur sonu birikimi (P29 · Grup C).
       Açılım yapıldıysa birikim bir kademe çıkar (ilk kademe doğrudan
       ZINCIR_START'tır), yapılmadıysa bir kademe geri sarar. Sıfırın
       altına inmez ve ZINCIR_CAP'i aşmaz. */
    const zcJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'zincir');
    if (zcJ) {
      const before = zcJ.zincirMult || 0;
      if (s.openedThisTurn) {
        zcJ.zincirMult = Math.min(ZINCIR_CAP,
          before === 0 ? ZINCIR_START : round2(before + ZINCIR_STEP));
        if (zcJ.zincirMult !== before)
          events.push(`Zincir uzadı: +${zcJ.zincirMult.toFixed(1)}x`);
      } else if (before > 0) {
        zcJ.zincirMult = Math.max(0, round2(before - ZINCIR_DECAY));
        events.push(`Zincir geri sardı (açılım yok): `
          + `+${before.toFixed(1)}x → +${zcJ.zincirMult.toFixed(1)}x`);
      }
    }
    /* Yankee — elde 2+ çift bekletme birikimi (GDD 9).
       PLAYTEST 26 · GRUP I (kullanıcı kararı 2026-09-09) — ÇİFT AÇMAK
       BİRİKİMİ SİLMEZ, YARIYA İNDİRİR.
       Ölçüm (2026-09-09) birikimin raundlar boyunca TAŞINDIĞINI gösterdi:
       jokerin 4 raundluk ömrü boyunca +6.0x'e kadar çıkabiliyor. Eski
       kural bu birikimin tamamını TEK bir Çift açılımıyla siliyordu —
       oyuncu dört raundluk kazanımını bir tıkla kaybediyordu. Yarıya
       inmek gerilimi (Çift açmak yine pahalı) korur, cezayı bir GERİ
       ADIMA çevirir. */
    const ykJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'yankee');
    if (ykJ) {
      if (s.openedThisTurn && s.turnMode === 'cift') {
        if (ykJ.yankeeMult) {
          const before = ykJ.yankeeMult;
          ykJ.yankeeMult = round2(before * YANKEE_RESET_KEEP);
          events.push(`Yankee birikimi yarıya indi (Çift açtın): `
            + `+${before.toFixed(1)}x → +${ykJ.yankeeMult.toFixed(1)}x`);
        } else {
          ykJ.yankeeMult = 0;
        }
      } else {
        /* P29 · Grup K — eşik 2 çiftten 1 ÇİFTE indi.
           Hayalet taşı sayıma girmez: bir turluk türetilmiş bir
           kopyadır ve bedava birikim üretmemeli (Katalizör'le aynı kural). */
        const cnt = {};
        let pairs = 0;
        for (const t of s.hand) {
          if (t.jokerTile || t.fakeOkey || t.ghost) continue;
          const k = t.color + ':' + t.number;
          cnt[k] = (cnt[k] || 0) + 1;
        }
        for (const k in cnt) pairs += Math.floor(cnt[k] / 2);
        if (pairs >= 1) {
          const before = ykJ.yankeeMult || 0;
          ykJ.yankeeMult = Math.min(YANKEE_CAP, round2(before + YANKEE_STEP));
          if (ykJ.yankeeMult !== before)
            events.push(`Yankee: çiftler bekliyor → +${ykJ.yankeeMult.toFixed(1)}x birikti`);
        }
      }
    }

    // puan hedefi discard bonuslarıyla aşılmış olabilir
    if (s.score >= s.target) {
      s.wonOnTurn = s.turn;
      this._finishWin();
      return { ok: true, roundOver: true, events };
    }

    let extendedTurn = false;   // Grup I — bir değnek raundu uzattı mı?
    if (s.turn >= s.maxTurns) {
      /* P29 · Grup D — ESKİ RAUND SONU ÖDEMESİ KALDIRILDI. Birikim artık
         son turun AÇILIM puanına giriyor (bkz. _calcOpening'deki Vampir
         bloğu); burada ikinci kez ödenirse çifte sayım olurdu. Son turda
         açılım yapılmadıysa banka ödenmeden söner — kartın riski budur. */
      s.vampirBank = 0;
      /* Grup I — otomatik kurtarma: hedefin altında kaldıysak, hedefi
         indirebilecek tüketilebilirler ("win" sınıfı) burada KENDİLİĞİNDEN
         kullanılır. Alternatifi Game Over olduğu için oyuncuya sormaya
         gerek yok; ayrıca etkisi (hedef kalıcı -%10) zaten her koşulda
         oyuncunun lehine. */
      if (s.score < s.target) this._autoRescueTarget(events);
      if (s.score >= s.target) {
        s.wonOnTurn = s.turn;
        this._finishWin();
      } else {
        const kaptanJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'kaptan' && !j.saveUsed);
        const worldJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'theWorld');
        /* Pandora · UMUT (Grup F) — kutunun dibinde kalan: eksik puanın
           YARISINI bir kez tamamlar. Yarım kurtarma olduğu için Pinky'den
           (tam kurtarma) SONRA denenir ve tek başına yetmeyebilir; yetmezse
           zincir normal şekilde devam eder. */
        const umutJ = !s.jokersDisabled && this.slotRecs().find(j => j.key === 'truva'
          && j.pandora === 'umut' && !j.umutUsed && !s.umutRunUsed && s.score >= s.target / 2);
        if (umutJ) {
          /* PLAYTEST 17 · GRUP E/20 (kullanıcı kararı 2026-08-28) —
             UMUT ARTIK EKSİĞİN TAMAMINI KAPATIR.
             Eski hâli eksik puanın YARISINI veriyordu: 400 hedefte 250
             puandaysan +75 gelip 325'te kalıyordun — raundu yine
             kaybediyor ama tek kullanımlık hakkını da yakmış oluyordun.
             Yani mekanik hiçbir işe yaramıyordu.
             Dengeyi bozmaz: (a) oyunda zaten tam kurtarma yapan üç kart
             var (Pinky Finger, The Misunderstood, Lanetli Kaptan), yani
             bu mevcut bir güç seviyesidir; (b) Pandora'nın üç varyantından
             hangisinin çıkacağı seçilemez — Umut yalnız %33 ihtimalle
             gelir; (c) hak yine RAUND BAŞINA DEĞİL, joker başına BİR
             kezdir ve yarı yolu geçmiş olmak (score >= target/2) şartı
             korunur. Jokerin diğer özellikleri (taş başına +8 puan)
             aynen durur. */
          umutJ.umutUsed = true;
          /* P30 · Grup H — hak artık RUN boyunca TEK: yeni bir Pandora'nın
             Umut'a dönüşmesi kurtarmayı yenilemez. Taş başına puan pasif
             kalır ve bu sınırdan etkilenmez. */
          s.umutRunUsed = true;
          const need = s.target - s.score;
          s.score += need;
          events.push(`🕊 Pandora (Umut): eksik puanın TAMAMI (+${need}) tamamlandı`);
          if (s.score >= s.target) {
            s.wonOnTurn = s.turn;
            this._finishWin();
            /* PLAYTEST 26 (bug, ölçüm sırasında bulundu) — KURTARIŞ, BOSS
               ŞARTI İHLAL EDİLMİŞSE OYUNU ÇÖKERTİYORDU. `_finishWin`
               `bossFailReason()` doluysa ERKEN DÖNER (GDD 13.4: hedefe
               ulaşmak yetmez) ve `s.coinReport`u HİÇ yazmaz; bu üç satır
               ise ona koşulsuz yazıyordu → TypeError, raund ortasında motor
               duruyordu. Kurtarış zaten geçersiz olduğu için (raund
               kaybedildi) not düşülecek bir rapor da yoktur. */
            if (s.coinReport) s.coinReport.savedBy = 'Pandora — Umut';
            return { ok: true, roundOver: true, events };
          }
        }
        if (kaptanJ) {   // P31 · Grup C: Pinky kurtarması kaldırıldı
          /* Lanetli Kaptan (Grup B) — kurtarışın BEDELİ:
             - joker artık SATILAMAZ (noSell): güçlü kurtuluşu alıp hemen
               nakde çevirmek mümkün olmasın;
             - kalan raundlarda (joker ölene kadar) hedefler +%20 —
               eskiden yalnız BİR sonraki raunda uygulanıyordu. */
          kaptanJ.saveUsed = true;
          kaptanJ.noSell = true;
          s.wonOnTurn = s.turn;
          events.push(`Lanetli Kaptan: Game Over önlendi! Bedeli: joker satılamaz ve süresi bitene kadar (${kaptanJ.usesLeft} raund) hedefler +%${Math.round((KAPTAN_CURSE - 1) * 100)}.`);
          this._finishWinSurvived();
        } else if (worldJ && this.isBossRound() && !s.worldUsed) {
          // The World — boss raundu başa sarar (GDD 11)
          s.worldUsed = true;
          s.jokers = s.jokers.filter(j => j !== worldJ);
          /* P31 · Grup A — ödül ve bedel başa sarmadan ÖNCE yazılır: yeniden
             kurulan boss raundunun hedefi de +%10'dan hesaplanır. */
          s.permMult = round2(s.permMult + WORLD_PERM_MULT);
          s.permTargetUp = round2((s.permTargetUp || 0) + WORLD_TARGET_UP);
          this._startRound(['The World: zaman geri sarıldı — boss raundu yeniden başlıyor!',
            `🕰️ The World: +${WORLD_PERM_MULT.toFixed(1)}x KALICI çarpan · bedeli: run boyunca hedefler +%${Math.round(WORLD_TARGET_UP * 100)}`]);
          return { ok: true, worldRestart: true, events: ['The World: boss raundu yeniden başladı'] };
        } else if (!s.jokersDisabled && s.misuActive
            && s.deckJokers.some(j => j.key === 'misunderstood')) {
          // The Misunderstood — kendini feda eder, eksik puanı tamamlar (GDD 10)
          s.deckJokers = s.deckJokers.filter(j => j.key !== 'misunderstood');
          s.score = s.target;
          s.wonOnTurn = s.turn;
          events.push('🎭 The Misunderstood kendini feda etti — eksik puan tamamlandı!');
          this._finishWin();
          if (s.coinReport) s.coinReport.savedBy = 'The Misunderstood';
        } else if (this._autoRescueTurn(events)) {
          /* Grup I — son çare: raunda +1 tur ekleyen bir değnek. Kurtarıcı
             jokerlerin hepsi tükendiyse ve envanterde öyle bir kart varsa,
             Game Over yerine bir tur daha oynanır: raund BİTMEZ, aşağıdaki
             normal çekiş/tur akışına düşülür.
             ⚠ P28: 'turn' sınıfının şu an üyesi yok (bkz. _autoRescueTurn). */
          extendedTurn = true;
        } else if ((s.secondChance || 0) > 0) {
          /* GRUP I (P20) — İKİNCİ ŞANS. Kurtarıcı zincirin EN SONUNDA
             durur: joker tabanlı bütün kurtarışlar tükendikten sonra
             devreye girer, yani onların yerini almaz. The World ile aynı
             kalıbı kullanır (raund baştan kurulur), ama boss raunduyla
             sınırlı değildir ve run boyunca yalnız bir kez çalışır. */
          s.secondChance = 0;
          this._startRound(['❤️‍🩹 İkinci Şans: raund baştan başlıyor!']);
          return { ok: true, worldRestart: true,
            events: ['❤️‍🩹 İkinci Şans kullanıldı — raund yeniden başladı'] };
        } else {
          s.status = 'lost';
        }
      }
      if (!extendedTurn) return { ok: true, roundOver: true, events };
    }

    /* HAYALET — TAŞIN ÖMRÜ (PLAYTEST 29 · GRUP B).
       Burası yeni turun başıdır. Sıra ÖNEMLİ: önce GEÇEN TURUN hayaleti
       söner, sonra bu turunki gelir — yoksa yeni hayalet aynı satırda
       silinirdi. Sönen hayalet hiçbir yere gitmez (mezarlığa da,
       atılanlara da): türetilmiş bir kopyadır, oyundan tümden çıkar. */
    {
      /* SAHİPLENME ZORUNLU: sönen hayalet eli terk eder; `_takeTile`
         kullanılmazsa el defteri nöbetçisi onu "sahipsiz kayıp" sayar
         (bkz. _handAudit) ve soak taraması alarm verir. */
      const gone = s.hand.filter(t => t.ghost);
      for (const gt of gone) this._takeTile(gt, 'Hayalet söndü');
      if (gone.length)
        events.push(`📣 Hayalet: kullanılmayan ${gone.length} taş söndü`);
    }
    if (s.yankiPending) {
      const g = s.yankiPending;
      s.yankiPending = null;
      /* `copied` ZORUNLU: hayalet asıl deste taşı değildir, işaretsiz
         bırakılırsa bütünlük denetimi onu "çoğalma" sayar (IS_BASE_TILE). */
      /* P36 · Grup A — kimlik `nextTileId(s)` ile: çıplak `++_tileId` canlı
         durumu taramadığı için yeniden yükleme sonrası çakışma riski taşıyordu
         (bkz. taş kimliği kuralı). */
      s.hand.push({ id: nextTileId(s), color: g.color, number: g.number,
        ghost: true, copied: true, origin: 'yanki' });
      events.push(`📣 Hayalet: ${COLOR_TR[g.color]} ${g.number} ıstakana geldi — bu tur kullanılmazsa söner`);
    }

    /* Bungie Gum (PLAYTEST 10) — SAKIZIN TAŞLARI TAM BURADA DÖNER.
       Bu satır artık yeni turun başıdır: önceki tur onaylanan açılım masada
       açık durdu, tur bitti, şimdi sakızdaki taşlar ıstakaya geri yapışıyor.
       Çekişten ÖNCE dönerler ki drawN el sınırını onları da sayarak hesaplasın
       (yoksa taşlar sessizce MAX_HAND'e takılıp kaybolurdu). */
    /* PLAYTEST 16 · GRUP E — TAŞ KİMLİĞİ KORUNARAK DÖNÜŞ.
       Kuyruktaki nesnenin KENDİSİ ele döner: önce masadaki kombinasyondan
       kimlik (===) ile çıkarılır, sonra ele konur. Böylece hiçbir taş
       çoğalmaz (eskisi masada kalıp ele kopyası gidiyordu) ve hiçbir taş
       kaybolmaz (ele sığmayan taş masada bırakılır, silinmez).
       Istakaya sığmayanlar kuyrukta DEĞİL masada kalır — bir sonraki tura
       taşınmaz, çünkü açılım kapanmış sayılıyor. */
    if ((s.bungiePending || []).length) {
      const room = Math.max(0, MAX_HAND - this.realHandCount());
      const back = s.bungiePending.slice(0, room);
      const stuck = s.bungiePending.slice(room);
      /* Taşı bulunduğu her masa kutusundan kimlikle sil; boşalan
         kombinasyon tamamen kalkar (zaten `gumClosed`, işlenemez). */
      const pull = new Set(back);
      const strip = (list) => {
        if (!list) return;
        for (const c of list) c.tiles = (c.tiles || []).filter(t => !pull.has(t));
        for (let i = list.length - 1; i >= 0; i--)
          if (!list[i].tiles.length) list.splice(i, 1);
      };
      strip(s.prevOpen); strip(s.opened); strip(s.staged);
      for (const bt of back) { bt.bungie = true; s.hand.push(bt); }
      s.bungiePending = [];
      if (back.length)
        events.push(`🍬 Bungie Gum: ${back.length} taş ıstakana geri yapıştı — bu tur yeniden açabilirsin`);
      if (stuck.length) events.push(`🍬 Istaka dolu: ${stuck.length} taş masada kaldı`);
    }

    // çekiş — Grup A: el üst sınırına (MAX_HAND=21) kırpılır; Kara Kedi dönüşümü
    const wantN = 5 + (s.permDraw || 0) // kalıcı çekiş yükseltmesi (madde 24 · Bol Çekiş, eski adı Derin Nefes)
      + (s.tuccarDraw || 0)  // Tüccar takası: bu raund +1 taş
      + (s.bonusDraw || 0)   // Grup E — Yıldız Taşı: açılımda kazanılan ekstra çekiş
      - (s.appleEaten ? APPLE_DRAW_CUT : 0);   // P31 · Grup I — cennetten kovulma
    if (s.bonusDraw) { events.push(`⭐ Yıldız Taşı: +${s.bonusDraw} ekstra taş`); s.bonusDraw = 0; }
    const drawN = Math.max(0, Math.min(wantN, MAX_HAND - this.realHandCount()));
    /* TANRININ ELİ (P31 · Grup E) — otomatik çekiş YOK: hak `s.godPick`
       olarak bekler, oyuncu destesinden seçer (godPickTake). Tur yine
       ilerler; seçim bitene kadar açılım/atış kilitlidir. */
    const godHand = this.hasActive('tanrininEli') && drawN > 0
      && s.deck.some(t => !t.jokerTile);
    if (drawN < wantN) events.push(`Istaka sınırı: ${wantN} yerine ${drawN} taş çekildi (el en fazla ${MAX_HAND})`);
    let drawn;
    if (this.hasActive('karaKedi') && s.deck.length && !godHand) {
      // okey taşları dönüşümden muaf (fiziksel okey işareti korunur)
      const minPool = s.deck.filter(t => !t.jokerTile && !t.fakeOkey
        && !this.isOkeyTile(t) && !t.special);   /* Grup D: joker dönüşümü özel taşa dokunmaz */
      const minVal = minPool.length ? Math.min(...minPool.map(t => t.number)) : Infinity;
      drawn = s.deck.splice(0, drawN);
      for (const t of drawn) {
        if (t.jokerTile || t.fakeOkey || this.isOkeyTile(t) || t.special) continue;
        if (t.number === minVal && minVal < 12) {
          events.push(`Kara Kedi: ${COLOR_TR[t.color]} ${t.number} → 12'ye dönüştü`);
          t.number = 12;
          retune(t, 'karaKedi');
        }
      }
    } else if (godHand) {
      drawn = [];
      s.godPick = { n: drawN };
      events.push(`🤲 Tanrının Eli: destenden ${drawN} taş seç`);
    } else {
      drawn = s.deck.splice(0, drawN);
    }
    // Boss: Kara Kedi — en büyük değerli taşı çekersen 1'e döner (GDD 10).
    // Kural netleştirmesi (2026-08): dönüşüm okey eşleşmesinden BAĞIMSIZDIR —
    // okey üyeliği raund başında fiziksel taşa yazılır (isOkeyReal), Kara Kedi
    // dönüşümü okey yaratamaz; okey taşları da dönüşümden muaftır.
    if (this.bossOn() && s.boss.key === 'karaKedi' && drawn.length)
      this._karaKediBite(drawn, events);
    if (this.bossOn() && drawn.length) this._bossOnDraw(drawn, events); // Grup F
    s.hand.push(...drawn);
    /* HİDRA (P34) — bekleyen kafalar çekişten SONRA doğar ki çekiş hakkını
       yemesinler; ıstaka sınırı ve raund tavanı aşılmaz, sığmayan kafa yanar. */
    if (s.hidraPending) {
      const room = Math.max(0, MAX_HAND - this.realHandCount());
      const left = Math.max(0, HIDRA_ROUND_CAP - (s.hidraSpawned || 0));
      const k = Math.min(s.hidraPending, left, room);
      s.hidraPending = 0;
      for (let i = 0; i < k; i++)
        s.hand.push({ id: nextTileId(s), color: s.okey.color, number: s.okey.number,
          isOkeyReal: true, copied: true, hidra: true, origin: 'hidra' });
      s.hidraSpawned = (s.hidraSpawned || 0) + k;
      events.push(k ? `🐉 Hidra: ${k} geçici okey ıstakana geldi (raund sonunda kaybolur)`
        : '🐉 Hidra: bu raundun okey sınırı doldu — yeni kafa çıkmadı');
    }
    s.turn++;
    s.phase = 'meld';
    s.turnMode = null;
    s.openedThisTurn = false;
    this._onTurnStart(events); // deste jokeri aktivasyonu + tur başı efektleri
    s.lastResult = null;
    this._rollKumarbaz();
    // Grup D (2026-07-09): tur başı efektleri (Bungie Gum ödemesi, The
    // Cheating, Freedom Fighters…) skoru hedefin üzerine taşıyabilir —
    // hedef kontrolü bir sonraki açılıma ERTELENMEZ, hemen burada yapılır.
    if (s.score >= s.target) {
      s.wonOnTurn = s.turn;
      this._finishWin();
      this._handAudit(events);                    // Grup A el defteri
      this._integrityWatch(events, 'tur sonu');   // Grup E nöbetçisi
      return { ok: true, roundOver: true, drawn: drawn.map(t => t.id), events };
    }
    this._handAudit(events);                      // Grup A el defteri
    this._integrityWatch(events, 'tur sonu');     // Grup E nöbetçisi
    return { ok: true, drawn: drawn.map(t => t.id), events };
  },

  /* ---------- Raund kazanma (GDD 6.1–6.2, boss dahil) ---------- */

  /* GDD 7.2 — joker süre azalması. Raund biter bitmez, store üretilmeden
     ÖNCE çalışır: süresi dolan joker store'a hiç girmeden yok olur.
     - Slot jokerleri: tetiklenip tetiklenmediğine bakılmaksızın -1.
     - Deste jokerleri: yalnız o raund ELİNE GELDİYSE -1.
     - fresh (bu raund alınanlar) ilk yaşlanmadan muaf; bayrak raund
       başında (_startRound) temizlenir. */
  _ageJokers(notes) {
    const s = this.state;
    // Sarmaşık + Avukat — en nadir jokeri koruma (GDD 9/10)
    const rarOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    /* PLAYTEST 22 · GRUP B — SARMAŞIK ARTIK DESTE JOKERLERİNİ DE SARAR.
       Eskiden aday havuzu yalnız `s.jokers`ti (Ana Slot). Oysa Zombie,
       Freedom Fighters, Ahtapot gibi DESTE jokerleri de aynı süre
       sisteminde yaşlanıyor ve "1 jokerini korur" vaadi onları kapsamıyordu.
       İki incelik:
       · Deste jokeri yalnız O RAUND ELİNE GELDİYSE (`drawnThisRound`)
         yaşlanır — gelmemiş olanı korumak Sarmaşık'ı boşa harcardı, bu
         yüzden aday listesine yalnız gerçekten yaşlanacaklar girer.
       · AVUKAT KAPSAMI DEĞİŞMEDİ (yalnız slot). Avukat davayı kaybedince
         hedefi yok ediyor ve o silme `s.jokers` üzerinde çalışıyor; deste
         jokerini hedef alsaydı "yok olmadan kaybedilen dava" doğardı. */
    const pickTarget = (exceptKey, withDeck) => [
      ...s.jokers,
      ...(withDeck ? s.deckJokers.filter(j => j.drawnThisRound && !this.isRunLong(j)) : []),
    ]
      .filter(j => j.key !== exceptKey && j.key !== 'sarmasik' && j.key !== 'avukat' && !j.protected && !j.fresh)
      .sort((a, b) => rarOrder.indexOf(b.rarity) - rarOrder.indexOf(a.rarity))[0];
    if (this.slotRecs().some(j => j.key === 'sarmasik')) {
      const t = pickTarget('sarmasik', true);
      if (t) {
        t.protected = true;
        notes.push(`🌿 Sarmaşık ${t.name} jokerini sardı — süresi azalmadı`);
      }
    }
    const avJ = this.slotRecs().find(j => j.key === 'avukat');
    if (avJ) {
      const t = pickTarget('avukat', false);
      if (t) {
        if (this.rng() < 0.75) {
          t.protected = true;
          notes.push(`⚖ Avukat ${t.name} jokerini savundu — süresi azalmadı`);
        } else {
          s.jokers = s.jokers.filter(j => j !== avJ && j !== t);
          notes.push(`⚖ Avukat davayı kaybetti — Avukat ve ${t.name} yok oldu`);
        }
      }
    }
    for (const j of s.jokers) {
      // Şeytan'ın Teklifi henüz tetiklenmediyse (cüzdan boştu) yaşlanmaz —
      // yoksa tek kullanımını hiç çalışmadan yitiriyordu.
      if (j.key === 'seytan' && !j.applied) continue;
      if (this.isRunLong(j)) continue;   // Grup B2 — süresi "run boyunca"
      /* Trainer'da süre ∞ seçilebilir (test kolaylığı) — sonsuz süreli
         joker yaşlanmaz. Normal oyunda böyle bir joker hiç oluşmaz. */
      if (!j.fresh && !j.protected && !s.ageSkip && Number.isFinite(j.usesLeft)) j.usesLeft--;
      delete j.protected;
    }
    if (s.ageSkip) notes.push('⏳ Zaman Taşı: hiçbir jokerin süresi azalmadı');
    const expired = s.jokers.filter(j => j.usesLeft <= 0);
    s.lastExpired = expired.map(j => j.name);
    s.jokers = s.jokers.filter(j => j.usesLeft > 0);

    for (const j of s.deckJokers) {
      if (this.isRunLong(j)) { j.drawnThisRound = false; delete j.protected; continue; } // Grup B2
      // Grup B (P22): Sarmaşık deste jokerini de sarabilir → `protected` burada da okunur
      if (!j.fresh && j.drawnThisRound && !j.protected && !s.ageSkip && Number.isFinite(j.usesLeft)) j.usesLeft--;
      j.drawnThisRound = false;
      delete j.protected;
    }
    const deadDeck = s.deckJokers.filter(j => j.usesLeft <= 0);
    if (deadDeck.length) s.lastExpired.push(...deadDeck.map(j => j.name));
    s.deckJokers = s.deckJokers.filter(j => j.usesLeft > 0);

    // Anka Kuşu — küllerinden Mythic doğar (GDD 11)
    // Füzyonla birleşmiş alt kayıtların ölüm efektleri de tetiklenir
    for (const j of expired.flatMap(x => this._recsOf(x))) {
      if (j.key === 'ankaKusu' && s.jokers.length < this.slotCap()) {
        const mythics = this.jokerPool(d => d.rarity === 'mythic');
        const def = mythics[Math.floor(this.rng() * mythics.length)];
        s.jokers.push({ id: ++_jokerId, key: def.key, name: def.name, desc: def.desc,
          rarity: 'mythic', usesLeft: 1, fresh: true });
        notes.push(`Anka Kuşu küllerinden doğdu → ${def.name} (1 raund)`);
      }
    }
    /* VASİYET (P30 · Grup F) — süresi dolup kırılan jokerlerin efekti
       hayatta kalan Vasiyet'e miras kalır. Kurallar:
         · yalnız ANA SLOTTAN süresi dolanlar (backup yaşlanmaz; deste
           jokerleri efektini desteden okuduğu için slota taşınamaz)
         · Füzyonlu bir kartın her alt efekti ayrı bir miras sayılır
         · kırılan bir Vasiyet'in kendi mirası devredilmez: "birlikte gider"
         · Anka Kuşu devredilmez: efekti ölümün kendisidir, az önce çalıştı
         · depo FIFO — VASIYET_CAP dolunca en eski miras düşer
       Kayıt kopyalanır (durum alanlarıyla), `inherited` işaretlenir. */
    const heir = this.slotRecs().find(j => j.key === 'vasiyet' && !j.inherited);
    if (heir && expired.length) {
      const dying = expired.flatMap(x => [x, ...(x.fused || [])])
        .filter(r => r.key !== 'vasiyet' && r.key !== 'ankaKusu' && r.key !== 'fuzyon'
          && JOKER_DEFS[r.key] && JOKER_DEFS[r.key].mech !== 'deck');
      for (const d of dying) {
        const rec = JSON.parse(JSON.stringify(d));
        delete rec.fused; delete rec.legacy; delete rec.protected; delete rec.fresh;
        rec.inherited = true;
        heir.legacy = [...(heir.legacy || []), rec];
        notes.push(`📜 Vasiyet: ${d.name} kırıldı — efekti mirasa geçti (${Math.min(heir.legacy.length, VASIYET_CAP)}/${VASIYET_CAP})`);
        while (heir.legacy.length > VASIYET_CAP) {
          const old = heir.legacy.shift();
          notes.push(`📜 Vasiyet: en eski miras ${old.name} düştü`);
        }
      }
    }
    // MADDE D3 — run sonu özeti: süresi dolarak kaybedilen joker sayısı
    s.statExpired = (s.statExpired || 0) + s.lastExpired.length;
    if (s.lastExpired.length)
      notes.push(`💥 Süresi dolan joker: ${s.lastExpired.join(', ')} — kırılıp yok oldu`);
  },

  /* GRUP F — "hedefe ulaşsan bile kaybettiren" boss koşulları (GDD 13.4).
     Freedom Fighters ve The Corporates boss'ları hedeften BAĞIMSIZ bir
     şart koyar; şart tutmazsa raund Game Over'dır. Tek noktadan kontrol
     edilir ki hangi yoldan kazanılırsa kazanılsın atlanmasın. */
  bossFailReason() {
    const s = this.state;
    /* Trainer raund atlama (2026-08-26): atlanan raundun boss koşulu
       denetlenmez — amaç ileri bir duruma HIZLA gitmek, koşulu sınamak
       değil. Bayrak yalnız trainer modunda kurulur ve raund başında silinir. */
    if (s.trainerSkipped) return null;
    if (!this.bossOn() || !s.boss) return null;
    if (s.boss.key === 'freedom') {
      /* PLAYTEST 9 · GRUP P — İKİ KAÇAK KAPATILDI.
         (1) Eskiden yalnız `hand` + `discardPile` taranıyordu; işaretli taş
             ONAYLANMAMIŞ bir açılımda (staged) bekletilerek ya da Dedikodu
             Masası'na verilerek cezadan tamamen kaçırılabiliyordu (ikisi de
             testle doğrulandı). Artık taş NEREDE olursa olsun sayılır;
             tek geçerli mazeret ONAYLANMIŞ bir açılımda kullanılmış olmaktır
             (ffUsedInMeld yalnız confirmMelds'te set edilir).
         (2) Ters yönde adaletsizlik: işaretli taş SON turda eline geldiğinde
             (ölçüm: raundların %8.7'si) onu bir kombinasyona sokmak çoğu zaman
             imkânsızdı ve oyuncu hatasız Game Over yiyordu. Son turda
             işaretlenen taşlar zorunluluk dışında. */
      const everywhere = [
        ...s.hand, ...s.discardPile, ...(s.gossipTable || []),
        ...(s.staged || []).flatMap(c => c.tiles || []),
        ...(s.islemeler || []).flatMap(e => e.tiles || []),
      ];
      const unused = everywhere.filter(t => t.ffMarkedTile && !t.ffUsedInMeld
        && (t.ffMarkedTurn || 1) < s.maxTurns);
      if (unused.length)
        return `👹 Freedom Fighters: eline gelen ${unused.length} işaretli taşı açılımda kullanmadın — GAME OVER`;
    }
    if (s.boss.key === 'corporates' && s.corpTask?.boss) {
      const c = s.corpTask;
      // altin raund bazlı: kazanılan tura bakılır (turn bazlı takip yok)
      if (c.key === 'altin') c.done = (s.wonOnTurn ?? s.turn) <= 2;
      else c.done = !c.failed; // diğerleri her tur denetlenir (bkz. _bossCorpTurn)
      if (!c.done)
        return `👹 ${c.name}: "${c.text}" görevi tamamlanmadı — GAME OVER`;
    }
    return null;
  },

  /* Boss şirket görevinin O TURU denetlenir (GDD 13.4: görev RAUND BOYU, yani
     her turda geçerli). Açılım onaylanınca ve pas geçilince çağrılır. */
  _bossCorpTurn(events) {
    const s = this.state;
    const c = s.corpTask;
    if (!c || !c.boss || c.failed) return;
    if (c.key === 'kizil' && !(s.openedThisTurn && s.turnComboCount > 0 && s.turnAllCift)) {
      c.failed = true;
      events.push('👹 Kızıl Kule görevi bu turda ihlal edildi (yalnızca Çift açmalıydın)');
    }
    if (c.key === 'derin' && s.turnComboCount < 3) {
      c.failed = true;
      events.push('👹 Derin Su görevi bu turda ihlal edildi (en az 3 kombinasyon gerekiyordu)');
    }
    if (c.key === 'yesil' && !s.openedThisTurn) {
      c.failed = true;
      events.push('👹 Yeşil Vadi görevi bu turda ihlal edildi (pas geçtin)');
    }
  },

  _finishWin() {
    const s = this.state;
    // Boss şartı ihlal edildiyse hedefe ulaşmak yetmez (GDD 13.4)
    const fail = this.bossFailReason();
    if (fail) {
      s.status = 'lost';
      s.bossFail = fail;
      s.winStreak = 0;
      return;
    }
    s.status = 'won';
    s.winStreak++;
    if (s.wonOnTurn == null) s.wonOnTurn = s.turn;
    const boss = this.isBossRound();
    // Grup M — zafer ekranının istatistik özeti için kümülatif sayaçlar
    s.roundsWon = (s.roundsWon || 0) + 1;
    s.totalScore = (s.totalScore || 0) + s.score;
    if (boss) s.bossesBeaten = (s.bossesBeaten || 0) + 1;

    // P29 · Grup D — erken kazanımda da ayrı ödeme YOK (bkz. yukarısı)
    s.vampirBank = 0;

    const extraNotes = [];
    /* Kahin BOSS Koşulu (Grup F): tüm turlarda kehanete uyulduysa +500 puan.
       PLAYTEST 17 · GRUP B/10 — bu bonus COIN HESABININ DIŞINDA tutulur.
       Kök neden: `overshootBonus` raund sonu coinini "hedefin ne kadar
       üstüne çıktın" oranından hesaplar ve +500, Stage 1 boss hedefinin
       (400) tek başına %125'i ediyordu → kehanetlere uyan oyuncu HER
       SEFERİNDE en üst coin kademesine (18 coin) sıçrıyordu. Bonus artık
       puan olarak verilir ama coin kademesi bonussuz skordan ölçülür;
       böylece ödül tatmin edici kalır, boss coin musluğuna dönüşmez. */
    let kahinBonus = 0;
    if (boss && s.boss.key === 'kahin' && !s.bossOracleMissed) {
      kahinBonus = 500;
      s.score += kahinBonus;
      extraNotes.push('👹 Kahin: her turda kehanete uydun → +500 puan');
    }
    // Kahin ödülü (GDD 10)
    if (s.kahinGoal) {
      if (s.kahinGoal.key === 'turn2' && s.wonOnTurn <= 2) s.kahinGoal.done = true;
      if (s.kahinGoal.done) {
        if (s.kahinGoal.reward === 'coin') gainCoins(s, s.kahinGoal.amount);
        else s.score += s.kahinGoal.amount;
        extraNotes.push(`🔮 Kahin ödülü: +${s.kahinGoal.amount} ${s.kahinGoal.reward === 'coin' ? 'coin' : 'puan'}`);
      }
    }
    // The Corporates görev değerlendirmesi (GDD 10)
    let corpCoinHalf = false;
    if (s.corpTask) {
      const c = s.corpTask;
      if (c.key === 'altin') c.done = s.wonOnTurn <= 2;
      if (c.key === 'yesil') c.done = !c.failed;
      if (c.done) {
        if (c.key === 'kizil') { s.permMult = round2(s.permMult + 0.2); extraNotes.push('🏢 Kızıl Kule ödülü: +0.2x kalıcı çarpan'); }
        else if (c.key === 'derin') { gainCoins(s, 5); extraNotes.push('🏢 Derin Su ödülü: +5 coin'); }
        else if (c.key === 'altin') { s.score += 300; gainCoins(s, 3); extraNotes.push('🏢 Altın Hilal ödülü: +300 puan, +3 coin'); }
        else if (c.key === 'yesil') { s.permMult = round2(s.permMult + 0.3); extraNotes.push('🏢 Yeşil Vadi ödülü: +0.3x kalıcı çarpan'); }
      } else {
        if (c.key === 'altin') { corpCoinHalf = true; extraNotes.push('🏢 Altın Hilal cezası: raund coini yarıya indi'); }
        else {
          const pen = c.key === 'kizil' ? 100 : 50;
          s.score = Math.max(0, s.score - pen);
          extraNotes.push(`🏢 ${c.name} cezası: -${pen} puan`);
        }
      }
      s.corpTask = null;
    }
    // Nostradamus kehaneti (GDD 12)
    if (!s.jokersDisabled && this.slotRecs().some(j => j.key === 'nostradamus' && j.prophecy)
        && s.wonOnTurn <= 2) {
      s.permMult = round2(s.permMult + NOSTRA_MULT);
      extraNotes.push(`🔮 Nostradamus kehaneti GERÇEKLEŞTİ: +${NOSTRA_MULT.toFixed(1)}x KALICI çarpan!`);
    }
    // The Misunderstood — kazanınca kalıcı çarpan bırakıp gider (GDD 10 · P35: MISU_PERM)
    if (s.misuActive && s.deckJokers.some(j => j.key === 'misunderstood')) {
      s.deckJokers = s.deckJokers.filter(j => j.key !== 'misunderstood');
      s.permMult = round2(s.permMult + MISU_PERM);
      extraNotes.push(`The Misunderstood hedefe ulaştığını gördü: +${MISU_PERM.toFixed(1)}x kalıcı bırakıp gitti`);
    }
    // GDD 7.2 — süre azalması ve süresi dolanların temizliği, store
    // üretilmeden ÖNCE (süresi biten joker store'da görünmez/satılamaz)
    this._ageJokers(extraNotes);

    /* ① + ④ (Grup I): taban tabloya göre, sonra stage ölçeğiyle çarpılır.
       `wonOnTurn` tablo dışına taşabilir (Uzun Soluk tur ekler) — son
       basamak taban kabul edilir, yoksa `undefined` gelirdi. */
    const baseTable = boss ? COIN_BASE_BOSS : COIN_BASE_NORMAL;
    const rawBase = baseTable[Math.min(s.wonOnTurn, baseTable.length) - 1];
    const rawBonus = overshootBonus(s.score - kahinBonus, s.target, boss);
    /* MADDE D4 — mod coin çarpanı stage ölçeğiyle BİRLİKTE uygulanır ve
       tıpkı stage ölçeği gibi YALNIZ taban + aşıma işler; joker coinleri
       (Midas, Kristal, Gümüş, Bal Küpü, Tahvil, faiz) hariçtir. */
    const scale = stageCoinScale(s.stage) * runModeOf(s).coinMult;
    const base = Math.round(rawBase * scale);
    const bonus = Math.round(rawBonus * scale);
    /* MADDE C2: tavan 3 → 4. Dizi bir basamak uzadı, aşağıdaki "net = 1"
       uçurumu kalktı; 4+ tur artık merdivenin son basamağını öder. */
    const penalty = (boss ? NOMELD_PEN_BOSS : NOMELD_PEN_NORMAL)[Math.min(s.noMeldTurns, 4)];
    /* GRUP D (P20) — Trade Jokeri TEMETTÜSÜ: yükselen türden açılan her
       kombinasyon için coin. Joker coinleriyle aynı torbaya girer. */
    /* BORSA — RAUND SONU (P29 · Grup H). Piyasa artık açılımı değil
       PORTFÖYÜ vurur: yükselen türdeki hisseler temettü öder, düşen
       türdeki hisselerin yarısı yanar (yukarı yuvarlama YOK — kayıp
       gerçekten hissedilsin). Sıra önemli: önce ödeme, sonra budama. */
    let borsaCoins = 0;
    {
      const tdj = s.borsa && this.slotRecs().find(j => j.key === 'tradeJokeri');
      const sh = tdj && (tdj.borsaShares = tdj.borsaShares || BORSA_EMPTY());
      if (sh) {
        const up = sh[s.borsa.up] || 0;
        if (up > 0) {
          borsaCoins = up * BORSA_DIVIDEND;
          extraNotes.push(`📈 Borsa temettüsü: ${up} × ${TYPE_TR[s.borsa.up]} hissesi `
            + `→ +${borsaCoins} coin`);
        }
        const down = sh[s.borsa.down] || 0;
        if (down > 0) {
          const kalan = Math.floor(down * BORSA_BURN);
          sh[s.borsa.down] = kalan;
          extraNotes.push(`📉 Borsa çöküşü: ${TYPE_TR[s.borsa.down]} hisselerinin yarısı yandı `
            + `(${down} → ${kalan})`);
        }
      }
    }
    // P29 · Grup F: Kum Saati kalktı, `s.kristal` artık hep 0 (kayıt uyumu)
    const jokerCoins = s.midasCoins + s.gumusPending + borsaCoins;
    const permCoin = s.permCoin || 0; // Coin Kasası (Grup H)
    /* MADDE C2 (2026-09-09): "4+ tur açılımsız → net = 1" UÇURUMU KALKTI.
       Artık her durumda aynı merdiven işler; ceza yalnız tabandan düşer. */
    let net = Math.max(1, base + bonus - penalty);
    if (corpCoinHalf) net = Math.max(1, Math.floor(net / 2));

    const bondCoin = (s.bonds || 0) * BOND_YIELD;   // MADDE E9
    s.coinReport = { base, bonus, penalty, net, jokerCoins, permCoin, bondCoin, noMeldTurns: s.noMeldTurns, boss, extraNotes };
    gainCoins(s, net + jokerCoins + permCoin + bondCoin);
    /* MADDE E1 — faiz raund gelirinden SONRA, store üretilmeden ÖNCE
       ödenir: "store açılışında cebinde ne varsa" onun üzerinden. */
    s.coinReport.interest = interestFor(s.coins);
    gainCoins(s, s.coinReport.interest);
    s.store = this._generateStore(s.pendingLocks);
    s.pendingLocks = null;

    // Boss ödülü: Epic joker + stage geçiş yükseltmesi (GDD 5.3, 13.3)
    if (boss) {
      this._grantBossEpic();
      s.upgradeOffer = this._genUpgradeOffer();
    }
    this._sealRunIfFinished();   // Grup M: son boss geçildiyse run burada biter
  },

  /* GDD 13.3 — yenilen boss'a ÖZEL Epic taş ödülü.
     PLAYTEST 26 · GRUP D (kullanıcı kararı 2026-09-09): bu blok eskiden
     `_finishWin` içine gömülüydü ve SIYRILARAK geçilen boss raundu
     (_finishWinSurvived — Lanetli Kaptan, Pandora/Umut vb.) ödülü hiç
     almıyordu. GDD 5.4 böyle bir istisna tanımlamıyor: "boss raundu
     kazanıldığında o boss'a özel Epic taş kazanılır". Sıyrılmanın bedeli
     zaten coin tarafında ödeniyor (sabit 1 coin, GDD 6.2) — ödülün
     tamamını da götürmesi belgeyle çelişiyordu. Ortak yol buraya alındı,
     iki bitiş de aynı ödülü verir. */
  _grantBossEpic() {
    const s = this.state;
    const def = JOKER_DEFS[s.boss.key];
    if (!def) return;
    const j = this._initJoker({ id: ++_jokerId, key: def.key, name: def.name, desc: def.desc,
      rarity: 'epic', usesLeft: this._usesFor(def, 'epic'), fresh: true });
    if (def.mech === 'deck') {
      // Deste jokeri slot işgal etmez — desteye karışır (GDD 10)
      s.deckJokers.push(j);
      s.coinReport.epicReward = { name: def.name, placed: 'deck' };
    } else if (s.jokers.length < this.slotCap()) {
      s.jokers.push(j);
      s.coinReport.epicReward = { name: def.name, placed: 'slot' };
    } else if (s.backup.length < MAX_BACKUP) {
      j.waitLeft = 3;
      s.backup.push(j);
      s.coinReport.epicReward = { name: def.name, placed: 'backup' };
    } else {
      gainCoins(s, RARITY.epic.sell);
      s.coinReport.epicReward = { name: def.name, placed: 'sold' };
    }
  },

  /* ============================================================
     GRUP M (Playtest 7) — RUN GERÇEKTEN BURADA BİTER
     Sorun: 'runComplete' yalnız Game.nextRound() içinde tespit ediliyordu;
     nextRound ise STORE'un "Devam" düğmesinden çağrılıyor. Yani son boss
     geçildikten sonra oyuncuya önce güçlendirme ekranı, sonra store
     açılıyor, run devam ediyormuş gibi hissettiriyordu.
     Çözüm: zafer anında (raund kazanma değerlendirmesinin sonunda) kontrol
     edilir; son stage'in 3. raundu geçildiyse store ve güçlendirme
     teklifi HİÇ üretilmez, durum doğrudan 'runComplete' olur.
     ============================================================ */
  isRunFinished() {
    const s = this.state;
    return s.roundInStage >= 3 && s.stage >= this.totalStages();
  },

  _sealRunIfFinished() {
    const s = this.state;
    if (!this.isRunFinished()) return false;
    /* status 'won' KALIR — raund sonu zafer modalı normal şekilde çizilsin.
       Bayrak, modal kapanınca UI'ın store yerine zafer ekranına gitmesini
       sağlar (bkz. completeRun). */
    s.runFinished = true;
    s.upgradeOffer = null;   // artık harcanacak bir stage kalmadı
    s.store = null;          // store'a hiç geçilmez
    return true;
  },

  /* Zafer ekranına geçiş — UI, raund sonu modalı kapanınca çağırır. */
  completeRun() {
    const s = this.state;
    if (!s.runFinished) return { ok: false };
    s.status = 'runComplete';
    return { ok: true, stats: this.runStats() };
  },

  /* Zafer ekranının istatistik özeti (Grup M) */
  runStats() {
    const s = this.state;
    return {
      stages: this.totalStages(),
      rounds: s.roundsWon || 0,
      bosses: s.bossesBeaten || 0,
      totalScore: s.totalScore || 0,
      coins: s.coins,
      permMult: s.permMult,
      jokers: [...s.jokers, ...s.backup, ...s.deckJokers]
        .map(j => ({ name: j.name, key: j.key, rarity: j.rarity })),
      consumables: [...(s.consumables || [])],
    };
  },

  _finishWinSurvived() {
    const s = this.state;
    // Grup F: boss şartı ihlaliyse sıyrılma da geçerli değil (GDD 13.4)
    const fail = this.bossFailReason();
    if (fail) { s.status = 'lost'; s.bossFail = fail; s.winStreak = 0; return; }
    s.status = 'won';
    s.winStreak = 0;
    s.roundsWon = (s.roundsWon || 0) + 1;         // Grup M
    s.totalScore = (s.totalScore || 0) + s.score;
    if (this.isBossRound()) s.bossesBeaten = (s.bossesBeaten || 0) + 1;
    const extraNotes = [];
    this._ageJokers(extraNotes); // GDD 7.2 — store'dan önce süre düşümü
    const jokerCoins = s.midasCoins;   // P29 · Grup F: kristal kalktı
    const permCoin = s.permCoin || 0;
    const bondCoin = (s.bonds || 0) * BOND_YIELD;   // MADDE E9
    s.coinReport = { base: 0, bonus: 0, penalty: 0, net: 1, jokerCoins, permCoin, bondCoin, noMeldTurns: s.noMeldTurns, survived: true, boss: this.isBossRound(), extraNotes };
    gainCoins(s, 1 + jokerCoins + permCoin + bondCoin);
    /* MADDE E1 — faiz sıyrılarak geçilen raundda da ödenir: taban geliri
       cezalandırılan bir raund, birikimi de cezalandırmamalı. */
    s.coinReport.interest = interestFor(s.coins);
    gainCoins(s, s.coinReport.interest);
    s.store = this._generateStore(s.pendingLocks);
    s.pendingLocks = null;
    if (this.isBossRound()) {
      /* PLAYTEST 26 · GRUP D — sıyrılarak geçilen boss da Epic ödülünü ALIR.
         (Eskiden yalnız yükseltme çarkı açılıyordu; GDD 5.4 böyle bir
         istisna tanımlamıyor, bkz. _grantBossEpic notu.) Sıyrılmanın
         bedeli coin tarafında kalır: taban ödeme sabit 1'dir. */
      this._grantBossEpic();
      s.upgradeOffer = this._genUpgradeOffer();
    }
    this._sealRunIfFinished();   // Grup M: sıyrılarak geçilse de run biter
  },

  /* ---------- Stage sonu güçlendirme ÖDÜLÜ (Grup H) ----------
     PLAYTEST 10 · KULLANICI KARARI — SEÇİM KALDIRILDI, ÇARK KARAR VERİYOR.
     Eski akış: 5 seçenek sunuluyor, oyuncu 2'sini seçiyordu (çark yalnız
     seçenekleri dağıtan bir süstü). Yeni akış: İKİ çark döner ve iki
     RASTGELE güçlendirmeyi doğrudan verir — seçim ekranı yok.
     Sayı neden yine 2: hedef eğrisi "stage başına ~2 kalıcı güç"e göre
     kalibre edildi (v4'ten beri), bunu bozmamak için ödül adedi korundu;
     değişen tek şey kararın kimde olduğu.
     İki çark AYNI güçlendirmeyi veremez (havuzdan çekilirler): aynı kalıcı
     gücü iki kez almak "tek ödül" hissi yaratırdı.
     Sonuçlar teklif ÜRETİLİRKEN belirlenir (kayıt/geri yükleme güvenli),
     etkiler `rollStageUpgrades()` çağrılınca UYGULANIR ve `applied`
     bayrağıyla ikinci kez uygulanamaz. */
  UPGRADE_PICKS: 2,
  _genUpgradeOffer() {
    const s = this.state;
    const avail = Object.values(UPGRADE_DEFS).filter(u => {
      /* RAF TAVANI: joker rafı 4'e VE değnek/paket rafı 5'e ulaştıysa
         Eskici Rafı artık hiçbir şey yapamaz → çarka hiç girmez. */
      if (u.key === 'raf' && this.shopShelvesFull()) return false;
      if (u.key === 'usta' && (s.carpanScale || 0) >= 1) return false;  // Grup E: tek sefer
      if (u.key === 'tilsimU' && (s.permIslekReduce || 0) >= 0.20) return false;
      if (u.key === 'zanaat' && !s.jokers.length && !s.backup.length && !s.deckJokers.length) return false;
      /* GRUP I (P20) — tavana vurmuş ya da anlamsız kalan seçenek çarka
         hiç girmez; oyuncuya "hiçbir şey yapmayan" bir ödül düşemez. */
      if (u.key === 'bileme' && (s.permComboBonus || 0) >= 1) return false;
      if (u.key === 'uzunSoluk' && (s.permTurns || 0) >= 2) return false;
      if (u.key === 'sigorta' && s.sellFull) return false;
      /* GRUP E (P22) — İkinci Şans iki ek kapıdan geçer:
         · run boyunca bir kez teklif edilir (`secondChanceTaken`);
         · elde zaten Game Over'ı önleyen bir joker varsa hiç çıkmaz —
           aynı işi yapan ikinci bir ağ, ödül çarkının bir dişini boşa
           harcamaktan ibaret olurdu. */
      if (u.key === 'ikinciSans'
        && ((s.secondChance || 0) >= 1 || s.secondChanceTaken || this.hasRescueJoker())) return false;
      if (u.key === 'ustaninMuhru'
        && ![...s.jokers, ...s.backup, ...s.deckJokers].some(j => !j.runLong)) return false;
      return true;
    });
    const rolled = [];
    const pool = [...avail];
    while (rolled.length < this.UPGRADE_PICKS && pool.length)
      rolled.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0].key);
    // `options` eski alan adı — kayıt uyumu ve dış okuyucular için korunur
    return { rolled, options: rolled, applied: false };
  },

  /* İki çarkın sonucunu UYGULA. UI çarklar durunca çağırır; ikinci çağrı
     bir şey yapmaz (çift uygulama koruması). */
  rollStageUpgrades() {
    const s = this.state;
    if (!s.upgradeOffer) return { ok: false, error: 'Ödül çarkı yok.' };
    if (s.upgradeOffer.applied)
      return { ok: true, keys: [...s.upgradeOffer.rolled], notes: [], already: true };
    const notes = [];
    for (const key of s.upgradeOffer.rolled) notes.push(...this._applyUpgrade(key));
    s.upgradeOffer.applied = true;
    return { ok: true, keys: [...s.upgradeOffer.rolled], notes };
  },

  /* Ödül ekranını kapat (store'a geçilirken). */
  closeUpgradeOffer() {
    if (this.state.upgradeOffer && !this.state.upgradeOffer.applied)
      this.rollStageUpgrades();   // ekran atlansa bile ödül kaybolmaz
    this.state.upgradeOffer = null;
    return { ok: true };
  },

  _applyUpgrade(key) {
    const s = this.state;
    const notes = [];
    if (key === 'carpan') {
      s.permMult = round2(s.permMult + UP_VAL.carpan);   // GRUP I (P20): 0.5 → 0.8 · P42: 0.8 → 1.5
      notes.push(`✖️ Kalıcı Çarpan: tüm açılımlara kalıcı +${UP_VAL.carpan}x`);
    } else if (key === 'altinDamar') {
      s.permRawBonus = round2((s.permRawBonus || 0) + UP_VAL.altinDamar);
      notes.push(`💎 Altın Damar: her açılımın ham puanı kalıcı +%${Math.round(s.permRawBonus * 100)}`);
    } else if (key === 'bileme') {
      s.permComboBonus = UP_VAL.bileme;
      notes.push(`🔩 Bileme Taşı: bir turda 2+ kombinasyon açtığında +${UP_VAL.bileme.toFixed(1)}x`);
    } else if (key === 'uzunSoluk') {
      s.permTurns = (s.permTurns || 0) + UP_VAL.uzunSoluk;
      if (s.status === 'playing') s.maxTurns = 4 + s.permTurns;
      notes.push(`⏱ Uzun Soluk: her raund artık ${4 + s.permTurns} tur`);
    } else if (key === 'sigorta') {
      s.sellFull = true;
      notes.push('🛡 Sigorta Poliçesi: bundan sonra jokerler TAM alış fiyatına satılır');
    } else if (key === 'ikinciSans') {
      s.secondChance = 1;
      s.secondChanceTaken = true;   // Grup E (P22): bir daha teklif edilmez
      notes.push('❤️‍🩹 İkinci Şans: kaybedeceğin ilk raund baştan başlayacak');
    } else if (key === 'kayipSandik') {
      /* Havuz: Legendary + Mythic değnekler. Envanter doluysa coin'e çevrilir
         ki ödül hiçbir koşulda boşa gitmesin. */
      const pool = Object.values(CONSUMABLES).filter(d =>
        d.rarity === 'legendary' || d.rarity === 'mythic');
      const def = pool[Math.floor(this.rng() * pool.length)];
      gainCoins(s, UP_VAL.kayipSandik);
      if (s.consumables.length < this.consumCap()) {
        s.consumables.push(def.key);
        notes.push(`🎁 Kayıp Sandık: ${def.icon} ${def.name} ve +${UP_VAL.kayipSandik} coin`);
      } else {
        gainCoins(s, def.price);
        notes.push(`🎁 Kayıp Sandık: envanter dolu — ${def.name} yerine +${def.price} coin (toplam +${UP_VAL.kayipSandik + def.price})`);
      }
    } else if (key === 'ustaninMuhru') {
      const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      const cand = [...s.jokers, ...s.backup, ...s.deckJokers].filter(j => !j.runLong);
      const best = cand.sort((a, b) => order.indexOf(b.rarity) - order.indexOf(a.rarity))[0];
      if (best) {
        best.runLong = true;
        notes.push(`🔮 Ustanın Mührü: ${best.name} artık yaşlanmıyor — run boyu senin`);
      } else {
        gainCoins(s, 20);
        notes.push('🔮 Ustanın Mührü: mühürlenecek joker yok — +20 coin');
      }
    } else if (key === 'cekis') {
      s.permDraw = (s.permDraw || 0) + UP_VAL.cekis;
      notes.push(`🎴 Bol Çekiş: tur başına artık ${5 + s.permDraw} taş çekiyorsun`);
    } else if (key === 'zanaat') {
      let n = 0;   // GRUP I (P20): +2 → +3 · P42: +3 → +2
      for (const j of [...s.jokers, ...s.backup, ...s.deckJokers]) { j.usesLeft += UP_VAL.zanaat; n++; }
      notes.push(`🔧 Zanaatkâr: ${n} jokerin süresi +${UP_VAL.zanaat} raund uzadı`);
    } else if (key === 'raf') {
      /* Önce joker rafı 4'e, sonra değnek/paket rafı 5'e büyür. İkisi de
         tavandayken bu ödül zaten havuza girmez; yine de sessizce yutulmasın
         diye coin'e çevrilir (kayıttan gelen uç durumlar için emniyet). */
      if (this.shopJokerSlots() < SHOP_JOKER_MAX) {
        s.extraShopSlots = (s.extraShopSlots || 0) + UP_VAL.raf;
        this._addShopSlotNow();   // mevcut store'a da hemen 1 raf (his: anında etki)
        notes.push(`🏪 Eskici Rafı: joker rafı artık ${this.shopJokerSlots()} kart (tavan ${SHOP_JOKER_MAX})`);
      } else if (this.shopExtraSlots() < SHOP_EXTRA_MAX) {
        s.extraRowSlots = (s.extraRowSlots || 0) + UP_VAL.raf;
        this._addExtraSlotNow();
        notes.push(`🏪 Eskici Rafı: değnek/paket rafı artık ${this.shopExtraSlots()} kart (tavan ${SHOP_EXTRA_MAX})`);
      } else {
        gainCoins(s, 10);
        notes.push('🏪 Eskici Rafı: iki raf da tavanda — +10 coin');
      }
    } else if (key === 'kasa') {
      gainCoins(s, UP_VAL.kasaNow);   // GRUP I (P20): 25 → 40
      s.permCoin = (s.permCoin || 0) + UP_VAL.kasaPer;
      notes.push(`💰 Coin Kasası: +${UP_VAL.kasaNow} coin ve her raund sonunda kalıcı +${UP_VAL.kasaPer} coin`);
    } else if (key === 'tilsimU') {
      s.permIslekReduce = round2((s.permIslekReduce || 0) + UP_VAL.tilsim);   // GRUP I: %5 → %8 · P42: %8 → %10
      notes.push(`🧿 Nazar Boncuğu: işlek riski kalıcı -%${Math.round(s.permIslekReduce * 100)}`);
    } else if (key === 'usta') {
      s.carpanScale = 1;
      notes.push('🀄 Usta Eli: kombinasyon sayın artık çarpan tablosunda İKİ KATI sayılıyor');
    }
    return notes;
  },

  /* ---------- Store (GDD 6.4–6.8) ---------- */

  /* Grup B: stage'e bağlı rarity eğrisi (RARITY_CURVE) */
  /* curve verilmezse normal store eğrisi; paketler PACK_RARITY_CURVE geçer */
  _rollRarity(curve) {
    /* GRUP L (kullanıcı kararı 2026-09-06) — TRAINER'DA STAGE KISITI YOK.
       "Legendary/Mythic erken stage'de nadir çıksın" eğrisi bir DENGE
       kuralıdır ve yalnız normal oyuna aittir. Trainer bir test tezgâhı
       olduğu için orada eğrinin EN CÖMERT satırı (son stage) kullanılır:
       her rarity, ilk raundtan itibaren serbestçe çıkabilir. Eğrinin
       kendisine dokunulmaz — yalnız hangi satırın okunduğu değişir. */
    const table = curve || RARITY_CURVE;
    /* MADDE D — Hızlı Run eğriyi GERER: 4 stage → 2,4,6,8 (bkz. curveStage).
       Kullanıcı kararı 2026-09-09: "bu run 4 turluk olduğu için Legendary
       ve Mythic'ler de çıkabilsin". Düz okumada mod, Legendary'yi fiilen
       hiç göstermiyordu (C1-C4 payı %1.2-15). */
    const ch = this.trainerMode
      ? table.length
      : Math.min(curveStage(this.state, this.state?.stage || 1), table.length);
    const w = table[ch - 1];
    const r = this.rng();
    let acc = 0;
    for (const key of ['common', 'rare', 'legendary', 'mythic']) {
      acc += w[key];
      if (r < acc) return key;
    }
    return 'common';
  },

  /* Kilitli (locked) ve satılmamış ürünleri bir sonraki store'a taşımak için topla.

     KİLİT ARTIK YALNIZ JOKER SLOTLARINDA (kullanıcı kararı 2026-09-03).
     Değnek, Özel Taş ve Gizli Paket slotlarındaki kilit tamamen kaldırıldı.
     Gerekçe: kilit bir PLANLAMA aracıdır — "coinim yetmedi, şu jokeri
     sonraki store'a saklayayım" kararı anlamlıdır, çünkü joker kalıcı bir
     yatırımdır ve havuzdan bir daha çıkması şansa kalır. Tek seferlik
     değnekte, rastgele değer üreten özel taş slotunda ve zaten kumar olan
     pakette aynı karar yoktu: kilit orada yalnızca store yenilenmesini
     anlamsızlaştıran bir düğmeydi. */
  _locksFrom(store) {
    if (!store) return null;
    const items = store.items.filter(i => i.locked && !i.sold);
    return items.length ? { items } : null;
  },

  _generateStore(locks) {
    const s = this.state;
    const items = [];
    const slotCount = this.shopJokerSlots();   // 3 taban, tavan 4 (Eskici Rafı)
    let pool = this.jokerPool(d => d.rarity !== 'epic');
    // Trainer: opsiyonel store filtresi — yalnız seçilen jokerler çıkabilir
    if (this.trainerMode && s.trainerStoreFilter?.length) {
      const f = pool.filter(d => s.trainerStoreFilter.includes(d.key));
      if (f.length) pool = f;
    }
    const anarchist = this.slotRecs().some(j => j.key === 'anarsist');
    // Anarşist "Kara Pazar" (yeniden tasarım): fiyatlar HER ZAMAN oyuncu
    // lehine sapar (×0.4–×0.9). basePrice UI'da üstü çizili gösterilir.
    const anar = (base) => Math.max(1, Math.round(base * (0.4 + this.rng() * 0.5)));
    // kilitli ürünler döngüden düşmez; Anarşist varsa fiyatları yine sapar (GDD 9/15)
    for (const it of (locks?.items ?? []).slice(0, slotCount)) {
      if (anarchist) { it.basePrice = jokerPrice(it.key, it.rarity); it.price = anar(it.basePrice); }
      items.push(it);
    }
    // Çeşitlilik (madde 19): sahip olunan jokerler, bu store'da zaten
    // seçilenler ve bir önceki store'da çıkanlar havuzdan düşülür —
    // "hep aynı jokerler çıkıyor" hissini kıran katmanlı filtre.
    // Aday kalmazsa filtreler sırayla gevşetilir.
    const ownedKeys = new Set([...this.slotRecs(), ...s.backup, ...s.deckJokers].map(j => j.key));
    const recentKeys = new Set(s.lastStoreKeys || []);
    const takenKeys = new Set(items.map(i => i.key));
    for (let i = items.length; i < slotCount; i++) {
      let rarity = this._rollRarity();
      const inRarity = pool.filter(d => d.rarity === rarity);
      let candidates = inRarity.filter(d => !ownedKeys.has(d.key) && !takenKeys.has(d.key) && !recentKeys.has(d.key));
      if (!candidates.length) candidates = inRarity.filter(d => !ownedKeys.has(d.key) && !takenKeys.has(d.key));
      if (!candidates.length) candidates = inRarity.filter(d => !takenKeys.has(d.key));
      if (!candidates.length) { rarity = 'common'; candidates = pool.filter(d => d.rarity === 'common' && !takenKeys.has(d.key)); }
      if (!candidates.length) candidates = pool.filter(d => d.rarity === 'common');
      if (!candidates.length) candidates = pool; // trainer filtresi daraltmışsa emniyet
      const def = candidates[Math.floor(this.rng() * candidates.length)];
      takenKeys.add(def.key);
      const rInfo = RARITY[rarity];
      const listPrice = this.modePrice(jokerPrice(def.key, rarity));   // MADDE D4
      const discounted = this.rng() < rInfo.discount;
      /* MADDE B1 (kullanıcı kararı 2026-09-09) — İNDİRİM ARTIK GÖRÜNÜR.
         `basePrice` eskiden YALNIZ Anarşist jokeri varken atanıyordu; bu
         yüzden normal indirimde UI'daki üstü çizili eski fiyat (ui.js
         `anarOld`) hiç çizilmiyordu ve buton sadece "3 💰" yazıyordu —
         oyuncunun karşılaştıracak bir referansı yoktu. Kullanıcı raporu
         "hiç indirimle karşılaşmadım" idi; ölçüm ise indirimin store
         başına %36-53, run başına ~12.8 kez çıktığını gösterdi. Yani
         mekanik çalışıyordu, yalnız GÖRÜLMÜYORDU. */
      let price = discounted ? this.modePrice(jokerDiscPrice(def.key, rarity)) : listPrice, basePrice;
      if (discounted) basePrice = listPrice;
      if (anarchist) { basePrice = basePrice ?? price; price = anar(price); }
      /* GRUP D/17 (kullanıcı kararı 2026-08-28) — PANDORA STORE'DA KENDİ
         ADIYLA DURUR. Kart eskiden "Gizemli Kutu" takma adıyla satılıyordu;
         oysa temanın kendisi zaten "Pandora'nın kutusu" — ismi saklamak
         bilgi vermiyor, yalnız oyuncunun kartı tanımasını engelliyordu.
         Gizli kalan tek şey İÇİNDEKİDİR: hangi varyanta (Umut · Salgın ·
         Armağan) dönüşeceği ele geldiğinde belli olur, açıklama da bunu
         söyler. */
      const disguise = def.key === 'truva';
      items.push({
        key: def.key,
        name: def.name,
        desc: disguise ? 'Kapalı, ağır bir kutu. Eline geldiğinde açılacak — içinden üç jokerden biri çıkacak.' : def.desc,
        rarity, price, basePrice, discounted, sold: false,
      });
    }
    // GDD 6.5b — 1 tüketilebilir slot; çıkış oranları dağılım olarak kullanılır
    let consumable;
    {
      // Grup K — tüketilebilir rarity'si de stage eğrisinden gelir:
      // erken stage'de Legendary/Mythic tüketilebilir neredeyse çıkmaz
      const cRar = this._rollRarity();
      const offerable = Object.values(CONSUMABLES).filter(d => this._consumOfferable(d.key));
      let cPool = offerable.filter(d => d.rarity === cRar);
      if (!cPool.length) cPool = offerable.filter(d => d.rarity === 'common');
      if (!cPool.length) cPool = offerable;
      const cDef = cPool[Math.floor(this.rng() * cPool.length)];
      let cPrice = this.modePrice(cDef.price), cBase;   // MADDE D4
      if (anarchist) { cBase = cPrice; cPrice = anar(cPrice); }
      consumable = { key: cDef.key, name: cDef.name, icon: cDef.icon, desc: cDef.desc,
        rarity: cDef.rarity, price: cPrice, basePrice: cBase, sold: false };
    }
    /* GRUP G (kullanıcı kararı 2026-09-07) — ÖZEL TAŞ RAFTAN KALKTI.
       GDD 6.5c'nin "1 Özel Normal Taş slotu" kuralı yürürlükten kalktı:
       özel taşlar artık YALNIZ 2'li Özel Taş Paketi'nden çıkar. `specialTile`
       alanı ESKİ KAYITLAR için null olarak korunur (kayıttan yüklenen bir
       store nesnesinde alan aranıyor olabilir); üretilmez, UI'da çizilmez. */
    const specialTile = null;
    /* Gizli Paketler (Grup D) — üç tür, her biri kendi ihtimali ve fiyatıyla;
       aynı store'da en fazla PACK_MAX_SLOTS tanesi çıkar. Paketler
       KİLİTLENEMEZ (bkz. _locksFrom): her store'da baştan çekilirler. */
    const packs = [];
    const packSlots = this.shopPackSlots();   // ikinci rafın büyüyen kısmı
    const takenKinds = new Set();
    /* GRUP N (P20) — stage'e bağlı ek çıkış ihtimali ve doluluk elemesinin
       kaldırılması. `_packHasRoom` yerine `_packUseful` bakılır: paket
       ancak verecek HİÇBİR ŞEYİ kalmadıysa (ör. tüm özel taş türleri
       tavanda) elenir; envanterin dolu olması artık paketi engellemez. */
    const stageBonus = Math.min(PACK_STAGE_CAP,
      PACK_STAGE_BONUS * Math.max(0, (s.stage || 1) - 1));
    for (const def of Object.values(PACK_DEFS)) {
      if (packs.length >= packSlots) break;
      if (takenKinds.has(def.kind)) continue;
      if (!this._packUseful(def.kind)) continue;
      if (this.rng() >= def.chance + stageBonus) continue;
      let pp = this.modePrice(def.price), ppBase;       // MADDE D4
      if (anarchist) { ppBase = pp; pp = anar(pp); }
      packs.push({ kind: def.kind, price: pp, basePrice: ppBase, sold: false });
    }
    // sonraki üretimde "az önce bunlar çıktı" filtresi için kaydet (madde 19)
    s.lastStoreKeys = items.map(i => i.key);
    const store = { items, consumable, specialTile, packs, rerollUsed: false,
      rerollCount: 0, freeReroll: false, anarchist };
    /* MADDE E9 — Tahvil sabit kalemi. Rastgele çekilişin dışındadır; yalnız
       run başına tavan dolmadıysa görünür (dolduysa raf yerini boşuna
       işgal etmesin, bkz. Eskici Rafı'nın tavan dolunca çarktan düşmesi). */
    if ((s.bonds || 0) < BOND_MAX) {
      let bp = this.modePrice(BOND_PRICE), bpBase;      // MADDE D4
      if (anarchist) { bpBase = bp; bp = anar(bp); }
      store.bond = { price: bp, basePrice: bpBase, sold: false };
    }
    this._applyCatchUp(store);
    return store;
  },

  /* ==========================================================================
     MADDE E2 (kullanıcı kararı 2026-09-09) — CATCH-UP RAFI
     Cüzdan `CATCHUP_COIN_LIMIT`in altına düşerse store'daki EN UCUZ joker
     %60 indirime girer ve o store'un ilk reroll'ü bedava olur.

     NEDEN: ölüm sarmalı ekonomiktir — parasız kalırsan kart alamazsın,
     kart alamayınca hedefe yetişemezsin, yetişemeyince run biter. Ölçüm
     karşılama oranının S4'ten sonra 1'in altına düştüğünü gösteriyor
     (S8'de 0.30), yani bu sarmal YAPISALDIR, oyuncu hatası değildir.

     İki bilinçli sınır var, ikisi de sömürüyü kapatmak için:
     · Yalnız EN UCUZ kalem indirime girer — yani catch-up kurtarır ama
       KAZANDIRMAZ; Common'a düşmüş bir rafta Legendary hediye etmez.
     · Stage başına bir kez. Aynı store içinde (bedava reroll sonrası)
       indirim korunur, ama aynı stage'in sonraki raundlarında tekrar
       tetiklenmez. Yoksa "bilerek fakir kal" kârlı bir strateji olurdu.
     ========================================================================== */
  CATCHUP_COIN_LIMIT: 8,
  CATCHUP_RATE: 0.4,          // %60 indirim → fiyatın %40'ı
  _applyCatchUp(store) {
    const s = this.state;
    if (!s || s.coins >= this.CATCHUP_COIN_LIMIT) return;
    const at = (s.stage || 1) * 10 + (s.roundInStage || 0);
    const firstTime = s.catchUpStage !== s.stage;
    const sameStore = s.catchUpAt === at;
    if (!firstTime && !sameStore) return;
    const avail = store.items.filter(it => !it.sold);
    if (!avail.length) return;
    const cheapest = avail.reduce((a, b) => (b.price < a.price ? b : a));
    if (cheapest.basePrice == null) cheapest.basePrice = cheapest.price;
    cheapest.price = Math.max(1, Math.round(cheapest.price * this.CATCHUP_RATE));
    cheapest.catchUp = true;
    cheapest.discounted = true;     // üstü çizili eski fiyat B1 ile çizilir
    if (firstTime) store.freeReroll = true;
    s.catchUpStage = s.stage;
    s.catchUpAt = at;
  },

  /* Bu paket türünün verebileceği içerik kaldı mı? (kapasitesi dolan tür
     store'da hiç belirmez — oyuncuya boş paket satılmasın) */
  _packHasRoom(kind) {
    const s = this.state;
    if (kind === 'special')
      return Object.values(SPECIAL_TILES).some(k =>
        s.specialTiles.filter(x => x.kind === k.key).length < k.maxCopies);
    if (kind === 'consum') return s.consumables.length < this.consumCap();
    if (kind === 'joker') return s.jokers.length < this.slotCap() || s.backup.length < MAX_BACKUP;
    return false;
  },

  /* GRUP N (P20) — "bu paketin verecek bir şeyi var mı?"
     `_packHasRoom`ten farkı: ENVANTER DOLULUĞUNA bakmaz. Yer yoksa ödül
     coin'e çevrilir; paket yalnız üretecek İÇERİK kalmadığında elenir.
     · special : tüm taş türleri kopya tavanında mı?
     · consum  : değnek havuzu boş olamaz → her zaman geçerli
     · joker   : sahip olunmayan joker kaldı mı? */
  _packUseful(kind) {
    const s = this.state;
    if (kind === 'special')
      return Object.values(SPECIAL_TILES).some(k =>
        s.specialTiles.filter(x => x.kind === k.key).length < k.maxCopies);
    if (kind === 'consum') return true;
    if (kind === 'joker') {
      const owned = new Set([...this.slotRecs(), ...s.backup, ...s.deckJokers].map(j => j.key));
      return this.jokerPool(d => d.rarity !== 'epic' && !owned.has(d.key)).length > 0;
    }
    return false;
  },

  /* Yer yoksa ödülün coin karşılığı — TESELLİ, ödül değil.
     Satış değeri alınır ama PAKET FİYATININ YARISIYLA sınırlanır. Sınır
     şart: Mythic bir değneğin satış değeri 15, tüketilebilir paketi ise 9
     coin — sınırsız bırakılsaydı envanteri bilerek dolu tutup paket
     açmak GARANTİ KÂR eden bir döngü olurdu (ölçüm: 100 coin → 106).
     Tavanla birlikte dönüşüm her zaman zarardadır, yani paket yalnız
     "ödül boşa gitmesin" diye satın alınır. */
  _packFallbackCoins(opt, cap) {
    if (!opt) return 0;
    let v = 0;
    if (opt.type === 'consum') v = Math.round((CONSUMABLES[opt.key]?.price || 8) / 2);
    else if (opt.type === 'special') v = Math.round((SPECIAL_TILES[opt.kind]?.price || 8) / 2);
    else if (opt.type === 'joker') v = jokerSell(opt.key, JOKER_DEFS[opt.key]?.rarity || 'common');
    if (cap != null) v = Math.min(v, cap);
    return Math.max(1, v);
  },

  /* GRUP G (2026-09-07): `buySpecialTile()` KALDIRILDI. Özel taşlar
     store rafında tek tek satılmıyor; tek kaynakları 2'li Özel Taş
     Paketi (bkz. PACK_DEFS.special ve `buyPack`). */

  /* Gizli Paket satın al/aç (Grup D — üç tür).
     index: s.store.packs içindeki sıra. Paketten PACK_SECOND_CHANCE ile 2,
     yoksa 1 içerik çıkar; içerikler türüne göre doğrudan sahiplenilir. */
  buyPack(index = 0) {
    const s = this.state;
    const pack = s.store?.packs?.[index];
    if (!pack || pack.sold) return { ok: false, error: 'Ürün mevcut değil.' };
    /* GRUP N (P20): doluluk artık satın almayı ENGELLEMEZ — yer yoksa
       ödül coin'e çevrilir (bkz. _grantPackOption). Yalnız paketin
       üretecek içeriği hiç kalmadıysa satış reddedilir. */
    if (!this._packUseful(pack.kind))
      return { ok: false, error: this._packFullError(pack.kind) };
    if (s.coins < pack.price) return { ok: false, error: 'Yetersiz coin.' };
    const mode = (PACK_DEFS[pack.kind] || PACK_DEFS.special).mode || 'slot';

    /* SEÇİMLİ PAKET (Grup F) — PACK_CHOICES seçenek üretilir, HİÇBİRİ
       sahiplendirilmez. Oyuncu choosePackOption ile birini alır, diğerleri
       kaybolur. Paket parası burada ödenir ki "aç, bak, vazgeç" olmasın. */
    if (mode === 'choice') {
      const avoid = new Set();
      const options = [];
      for (let i = 0; i < PACK_CHOICES; i++) {
        const o = this._rollPackOption(pack.kind, avoid);
        if (!o) break;
        avoid.add(o.key);
        options.push(o);
      }
      if (!options.length) return { ok: false, error: this._packFullError(pack.kind) };
      spendCoins(s, pack.price);
      pack.sold = true;
      pack.pending = { mode: 'choice', options };
      return { ok: true, mode: 'choice', kind: pack.kind, index, options };
    }

    /* SLOT PAKET (Grup F) — 1 ya da 2 ödül; her ödül için bir çark döner.
       Sonuç burada kesinleşir (motor rastgeleliği tek yerde kalsın), UI
       yalnız o sonucu göstermek üzere çarkı çevirir. */
    const def = PACK_DEFS[pack.kind] || PACK_DEFS.special;
    /* GRUP G: `count` verilmişse ödül sayısı SABİTTİR (özel taş paketi
       her zaman 2 verir), yoksa eski PACK_SECOND_CHANCE kurası işler. */
    const count = def.count != null ? def.count
      : ((def.second !== false && this.rng() < PACK_SECOND_CHANCE) ? 2 : 1);
    const contents = [];
    /* Aynı pakette aynı kalem iki kez çıkmasın (seçimli paketteki `avoid`
       ile aynı kural; slot paketinde eksikti — 2'li özel taş paketi
       zorunlu olunca görünür hâle geldi). */
    const avoid = new Set();
    for (let i = 0; i < count; i++) {
      if (!this._packUseful(pack.kind)) break;
      const got = this._openPackOne(pack.kind, Math.floor(pack.price / 2), avoid);
      if (!got) break;
      if (got.key != null) avoid.add(got.key);
      contents.push(got);
    }
    if (!contents.length) return { ok: false, error: this._packFullError(pack.kind) };
    spendCoins(s, pack.price);
    pack.sold = true;
    pack.contents = contents; // store kartında "açıldı" görünümü için
    const reels = contents.map(c => this._packReel(pack.kind, c));
    return { ok: true, mode: 'slot', kind: pack.kind, index, contents, reels };
  },

  /* Seçimli paketten bir seçeneği al; kalanlar kaybolur (Grup F). */
  choosePackOption(packIndex = 0, optIndex = 0) {
    const s = this.state;
    const pack = s.store?.packs?.[packIndex];
    if (!pack || !pack.pending) return { ok: false, error: 'Açık bir seçim yok.' };
    const opt = pack.pending.options[optIndex];
    if (!opt) return { ok: false, error: 'Geçersiz seçim.' };
    const got = this._grantPackOption(opt, Math.floor((pack.price || 8) / 2));
    if (!got) return { ok: false, error: this._packFullError(pack.kind) };
    pack.pending = null;
    pack.contents = [got];
    return { ok: true, kind: pack.kind, got };
  },

  /* Güvenlik ağı: oyuncu seçim ekranını atlatabilecek bir yoldan store'dan
     çıkarsa (kayıt/geri yükleme, tutorial, test) bekleyen seçim boşa gitmesin
     — ilk seçenek otomatik verilir. */
  _resolvePendingPacks(notes) {
    const s = this.state;
    let n = 0;
    for (const p of (s.store?.packs || [])) {
      if (!p.pending) continue;
      const got = this._grantPackOption(p.pending.options[0]);
      p.pending = null;
      if (got) { p.contents = [got]; n++; if (notes) notes.push(`🎁 Seçilmeyen paket otomatik açıldı: ${got.name}`); }
    }
    return n;
  },

  _packFullError(kind) {
    if (kind === 'consum') return `Değnek envanterin dolu (maks ${this.consumCap()}).`;
    if (kind === 'joker') return 'Ana Slot ve Backup dolu — jokere yer yok.';
    return 'Tüm özel taşlar kopya sınırında (2/2).';
  },

  /* GRUP F — paket içeriği artık İKİ AŞAMALI:
       _rollPackOption : içeriği ÜRETİR ama sahiplendirmez (durum değişmez;
                         yalnız rng ilerler). Seçim ekranındaki 3 seçenek ve
                         slot çarkındaki sahte semboller bundan çıkar.
       _grantPackOption: üretilmiş bir tanımı gerçekten sahiplendirir.
     `_openPackOne` ikisinin kısayolu olarak kalır (slot paketleri kullanır).
     avoid: aynı ekranda aynı kalemin iki kez çıkmasını engelleyen key kümesi. */
  /* Ağırlıklı kura (GRUP G). Motorun rastgeleliği tek yerden aksın diye
     `this.rng()` kullanır; toplam ağırlık 0 ise düz kuraya düşer. */
  _weightedPick(list, weightOf) {
    if (!list.length) return null;
    let total = 0;
    for (const it of list) total += Math.max(0, weightOf(it));
    if (!(total > 0)) return list[Math.floor(this.rng() * list.length)];
    let r = this.rng() * total;
    for (const it of list) {
      r -= Math.max(0, weightOf(it));
      if (r < 0) return it;
    }
    return list[list.length - 1];
  },

  _rollPackOption(kind, avoid) {
    const s = this.state;
    const skip = avoid || new Set();
    if (kind === 'special') {
      let kinds = Object.values(SPECIAL_TILES).filter(k =>
        s.specialTiles.filter(x => x.kind === k.key).length < k.maxCopies);
      if (!kinds.length) return null;
      const fresh = kinds.filter(k => !skip.has(k.key));
      if (fresh.length) kinds = fresh;
      /* GRUP G: eskiden düz kura vardı (her tür eşit). Artık ÖNCE NADİRLİK
         çekilir (SPECIAL_RARITY_W ağırlıkları), SONRA o kademeden düz kura
         ile taş seçilir. Sıra önemli: doğrudan taş başına tartsaydık
         kademedeki TAŞ SAYISI da çarpan olur, tablo tutmazdı.
         ⚠ STAGE KAPISI YOK — Stage 1'de bile legendary çıkabilir, yalnız
         seyrektir. Kopya tavanına ulaşan bir kademe kurada hiç yer almaz,
         payı kalan kademelere dağılır. */
      const rars = [...new Set(kinds.map(d => d.rarity))];
      const rar = this._weightedPick(rars, (r) => SPECIAL_RARITY_W[r] || 1);
      const tier = kinds.filter(d => d.rarity === rar);
      const k = tier[Math.floor(this.rng() * tier.length)];
      const color = COLORS[Math.floor(this.rng() * 4)];
      const number = 1 + Math.floor(this.rng() * 13);
      return { type: 'special', kind: k.key, key: k.key, name: k.name, icon: k.icon, color, number };
    }
    if (kind === 'consum') {
      // Grup K: paketler kendi cömert eğrisini kullanır (store'unkini değil)
      const rar = this._rollRarity(PACK_RARITY_CURVE);
      const offerable = Object.values(CONSUMABLES).filter(d => this._consumOfferable(d.key));
      let pool = offerable.filter(d => d.rarity === rar);
      if (!pool.length) pool = offerable.filter(d => d.rarity === 'common');
      if (!pool.length) pool = offerable;
      const fresh = pool.filter(d => !skip.has(d.key));
      if (fresh.length) pool = fresh;
      const def = pool[Math.floor(this.rng() * pool.length)];
      return { type: 'consum', key: def.key, name: def.name, icon: def.icon, rarity: def.rarity, desc: def.desc };
    }
    if (kind === 'joker') {
      const rar = this._rollRarity(PACK_RARITY_CURVE);   // Grup K
      const owned = new Set([...this.slotRecs(), ...s.backup, ...s.deckJokers].map(j => j.key));
      let pool = this.jokerPool(d => d.rarity === rar && d.rarity !== 'epic' && !owned.has(d.key));
      if (!pool.length) pool = this.jokerPool(d => d.rarity === rar && d.rarity !== 'epic');
      if (!pool.length) pool = this.jokerPool(d => d.rarity === 'common');
      const fresh = pool.filter(d => !skip.has(d.key));
      if (fresh.length) pool = fresh;
      const def = pool[Math.floor(this.rng() * pool.length)];
      return { type: 'joker', key: def.key, name: def.name, rarity: def.rarity, desc: def.desc };
    }
    return null;
  },

  _grantPackOption(opt, cap) {
    const s = this.state;
    if (!opt) return null;
    /* GRUP N (P20) — YER YOKSA ÖDÜL KAYBOLMAZ, COİN'E ÇEVRİLİR.
       Eskiden burada `null` dönülüyordu; `buyPack` da bunu "paket boş"
       sayıp satışı iptal ediyordu. Bu, envanteri dolu oyuncunun paketi
       hiç görememesinin ikinci yarısıydı. */
    const toCoins = (why) => {
      const c = this._packFallbackCoins(opt, cap);
      gainCoins(s, c);
      return { ...opt, converted: true, coins: c, why };
    };
    if (opt.type === 'special') {
      const def = SPECIAL_TILES[opt.kind];
      if (!def) return null;
      if (s.specialTiles.filter(x => x.kind === opt.kind).length >= def.maxCopies)
        return toCoins('specialFull');
      this._addSpecialTile(opt.kind, opt.color, opt.number);
      return { ...opt };
    }
    if (opt.type === 'consum') {
      if (s.consumables.length >= this.consumCap()) return toCoins('consumFull');
      s.consumables.push(opt.key);
      return { ...opt };
    }
    if (opt.type === 'joker') {
      // Grup F/23 — Füzyon rafa girmez, bu yüzden raf doluluğu onu engellemez
      if (opt.key !== 'fuzyon'
          && s.jokers.length >= this.slotCap() && s.backup.length >= MAX_BACKUP)
        return toCoins('jokerFull');
      const def = JOKER_DEFS[opt.key];
      const j = this._initJoker({ id: ++_jokerId, key: def.key, name: def.name, desc: def.desc,
        rarity: def.rarity, usesLeft: this._usesFor(def), fresh: true });
      if (opt.key === 'fuzyon') {
        s.fuzyonPending = j;
        return { ...opt, jokerId: j.id, dest: 'pending' };
      }
      let dest;
      if (s.jokers.length < this.slotCap()) { s.jokers.push(j); dest = 'main'; }
      else { j.waitLeft = 3; s.backup.push(j); dest = 'backup'; }
      return { ...opt, jokerId: j.id, dest };
    }
    return null;
  },

  /* Pakete göre TEK bir içerik üret + sahiplen (slot paketlerinin yolu).
     `cap` yer yoksa uygulanacak coin tavanıdır (bkz. _packFallbackCoins). */
  _openPackOne(kind, cap, avoid) {
    return this._grantPackOption(this._rollPackOption(kind, avoid), cap);
  },

  /* Slot çarkı için sahte sembol şeridi — SON eleman kazanandır.
     Sahteler sahiplendirilmez, yalnız dönüş sırasında görünürler. */
  _packReel(kind, winner) {
    const strip = [];
    for (let i = 0; i < PACK_REEL_LEN - 1; i++) {
      const o = this._rollPackOption(kind);
      strip.push(o || winner);
    }
    strip.push(winner);
    return strip;
  },

  /* İPOTEK (P30 · Grup G) — kartın düğmesi bu iki fonksiyonu kullanır.
     Durum üç hâllidir: HAZIR · BORÇLU (bu raund kullanıldı, sonraki raund
     -2) · ÖDENİYOR (bu raund -2 tahsil edildi). Son ikisinde kullanılamaz. */
  ipotekState() {
    const s = this.state;
    if (!s) return null;
    const j = this.slotRecs().find(x => x.key === 'ipotek');
    const owed = !!s.ipotekDebt;
    const paying = s.ipotekPayRound === `${s.stage}-${s.roundInStage}` && s.status === 'playing';
    let reason = null;
    if (!j) reason = 'İpotek slotta değil.';
    else if (s.jokersDisabled) reason = 'Jokerler bu raund susturuldu.';
    else if (owed) reason = 'Borcun var: sonraki raund -2 tur ödenmeden tekrar kullanılamaz.';
    else if (paying) reason = 'Bu raund borç ödeniyor — İpotek kullanılamaz.';
    else if (s.status !== 'playing') reason = 'İpotek yalnız raund içinde kullanılır.';
    return { id: j ? j.id : null, owed, paying, canUse: !reason, reason };
  },

  useIpotek() {
    const s = this.state;
    const st = this.ipotekState();
    if (!st || !st.canUse) return { ok: false, error: st ? st.reason : 'İpotek slotta değil.' };
    s.maxTurns += IPOTEK_TURNS;
    s.ipotekDebt = true;
    return { ok: true, maxTurns: s.maxTurns,
      note: `🏦 İpotek: bu raunda +${IPOTEK_TURNS} tur (${s.maxTurns} tur). Borç: sonraki raund -${IPOTEK_TURNS} tur` };
  },

  /* ATEŞ TÜCCARI (P30 · Grup K) — iki adımlı pazarlık, store başına tek hak.
       1) haggleItem — %60: ürün %40 indirimli · %40: ürün kaçar
       2) stealFire  — YALNIZ pazarlığı tutmuş üründe, isteğe bağlı ve ürün
                       başına bir kez: %50 bedava (sonraki raund işlek
                       +%10) · %50 ürün kaçar (indirim de gider)
     Ateş denemesi zar atmadan ÖNCE yer kontrolü yapar: raf doluysa hak
     yanmaz. Borç alanı eski Prometheus'unkiyle aynıdır (s.promDebt). */
  haggleItem(index) {
    const s = this.state;
    if (!this.hasActive('atesTuccari')) return { ok: false, error: 'Ateş Tüccarı slotta değil.' };
    if (s.store.haggleUsed) return { ok: false, error: "Bu store'da pazarlık hakkını kullandın." };
    const it = s.store.items[index];
    if (!it || it.sold) return { ok: false, error: 'Ürün mevcut değil.' };
    s.store.haggleUsed = true;
    if (this.rng() < ATES_HAGGLE_WIN) {
      it.price = Math.max(1, Math.round(it.price * (1 - ATES_DISCOUNT)));
      it.haggled = true;
      return { ok: true, success: true, price: it.price, name: it.name };
    }
    it.sold = true;
    it.fled = true;
    return { ok: true, success: false, name: it.name };
  },

  stealFire(index) {
    const s = this.state;
    if (!this.hasActive('atesTuccari')) return { ok: false, error: 'Ateş Tüccarı slotta değil.' };
    const item = s.store.items[index];
    if (!item || item.sold) return { ok: false, error: 'Ürün mevcut değil.' };
    if (!item.haggled) return { ok: false, error: 'Ateşi çalmak için önce bu üründe pazarlık tutmalı.' };
    if (item.fireTried) return { ok: false, error: 'Bu üründe ateşi zaten denedin.' };
    const def = JOKER_DEFS[item.key];
    if (!def) return { ok: false, error: 'Ürün mevcut değil.' };
    const needsSlot = def.mech !== 'deck' && item.key !== 'fuzyon';
    if (needsSlot && s.jokers.length >= this.slotCap() && s.backup.length >= MAX_BACKUP)
      return { ok: false, error: 'Ana Slot ve Backup dolu — önce bir joker sat.' };
    item.fireTried = true;
    if (this.rng() >= ATES_STEAL_WIN) {
      item.sold = true;
      item.fled = true;
      return { ok: true, success: false, name: item.name };
    }
    const j = this._initJoker({
      id: ++_jokerId, key: item.key, name: item.name, desc: item.desc,
      rarity: item.rarity, usesLeft: this._usesFor(def, item.rarity), fresh: true,
    });
    let placed;
    if (def.mech === 'deck') { s.deckJokers.push(j); placed = 'deck'; }   // Grup G — slot işgal etmez
    else if (item.key === 'fuzyon') { s.fuzyonPending = j; placed = 'pending'; }   // Grup F/23
    else if (s.jokers.length < this.slotCap()) { s.jokers.push(j); placed = 'slot'; }
    else { j.waitLeft = j.usesLeft === 1 ? 1 : 3; s.backup.push(j); placed = 'backup'; }
    s.promDebt = round2(s.promDebt + ATES_STEAL_ISLEK);
    item.sold = true;
    return { ok: true, success: true, name: item.name, placed, jokerId: j.id, key: item.key };
  },

  /* Store kilitleme — ücretsiz planlama aracı; kilitli ürün reroll'da
     ve raund geçişinde store'dan düşmez. YALNIZ JOKER SLOTLARI kilitlenir;
     Değnek / Özel Taş / Gizli Paket için kilit yoktur (bkz. _locksFrom). */
  toggleLock(index) {
    const it = this.state.store?.items[index];
    if (!it || it.sold) return { ok: false };
    it.locked = !it.locked;
    return { ok: true, locked: it.locked };
  },

  /* GDD 6.5b — tüketilebilir satın al (envanter maks 3) */
  buyConsumable() {
    const s = this.state;
    const item = s.store?.consumable;
    if (!item || item.sold) return { ok: false, error: 'Ürün mevcut değil.' };
    if (s.consumables.length >= this.consumCap())
      return { ok: false, error: `Envanter dolu — en fazla ${this.consumCap()} değnek taşınabilir.` };
    if (s.coins < item.price) return { ok: false, error: 'Yetersiz coin.' };
    spendCoins(s, item.price);
    item.sold = true;
    s.consumables.push(item.key);
    return { ok: true, name: item.name };
  },

  /* MADDE E9 — Tahvil satın al. Slot/envanter işgal etmez: bir sayaçtır,
     getirisi raund sonunda `bondCoin` olarak ödenir (bkz. _finishWin). */
  buyBond() {
    const s = this.state;
    const b = s.store?.bond;
    if (!b || b.sold) return { ok: false, error: 'Tahvil mevcut değil.' };
    if ((s.bonds || 0) >= BOND_MAX)
      return { ok: false, error: `Run başına en fazla ${BOND_MAX} tahvil alınabilir.` };
    if (s.coins < b.price) return { ok: false, error: 'Yetersiz coin.' };
    spendCoins(s, b.price);
    b.sold = true;
    s.bonds = (s.bonds || 0) + 1;
    return { ok: true, bonds: s.bonds, yield: BOND_YIELD };
  },

  /* PLAYTEST 29 · GRUP O — BİR SONRAKİ RAUNDUN DESTE BİLEŞİMİ (yüzler).
     `_startRound`'un deste kurma adımlarının aynısını, taş ÜRETMEDEN ve
     durumu değiştirmeden tekrarlar: taban deste + sahte okeylerin yüzü +
     `tileMods` (remove/add/okeyClone) + `specialTiles`. Dönen nesneler
     gerçek taş DEĞİLDİR (id'leri yoktur); yalnız "destede hangi yüzler
     var" sorusunu yanıtlar. İki yerin ayrışmaması için sıra ve kurallar
     _startRound ile birebir aynıdır (eşleşmeyen remove'un `pair`ini
     düşürme kuralı dahil). */
  _deckFaces() {
    const s = this.state;
    if (!s) return [];
    const faces = [];
    /* P42 — Trainer "deste içeriği": normal yüzlerin yerini özel taş kayıtları
       alır; yalnız o stage'in OKEY yüzü normal kalır (kayıtlardaki okey yüzü
       atlanır, okey değişince bu kural kendiliğinden yeni okeye geçer). */
    const spDeck = !!(this.trainerMode && s.trainerDeckSpecials && s.trainerDeckSpecials.length);
    const okeyFace = (f) => !!s.okey && f.color === s.okey.color && f.number === s.okey.number;
    for (const color of COLORS)
      for (let n = 1; n <= 13; n++)
        for (let copy = 0; copy < DECK_MAX_COPIES; copy++)
          if (!spDeck || okeyFace({ color, number: n })) faces.push({ color, number: n });
    // sahte okeyler: o stage'in okeyinin SIRADAN kopyaları
    if (s.okey)
      for (let copy = 0; copy < 2; copy++)
        faces.push({ color: s.okey.color, number: s.okey.number });
    const failedPairs = new Set();
    for (const m of (s.tileMods || [])) {
      if (m.op === 'remove') {
        const i = faces.findIndex(f => !f.special && f.color === m.color && f.number === m.number);
        if (i !== -1) faces.splice(i, 1);
        else if (m.pair != null) failedPairs.add(m.pair);
      } else if (m.op === 'add' && m.pair != null && failedPairs.has(m.pair)) {
        continue;
      } else if (m.op === 'add') {
        faces.push({ color: m.color, number: m.number,
          copied: m.src !== 'mod', modded: m.src === 'mod' });
      } else if (m.op === 'okeyClone' && s.okey) {
        // P36 · Grup B — kalıcı okey yüzü okey olarak işaretlenir (görünüm)
        faces.push({ color: s.okey.color, number: s.okey.number, copied: true, isOkeyReal: true });
      }
    }
    for (const sp of (s.specialTiles || [])) {
      if (spDeck && okeyFace(sp)) continue;
      faces.push({ color: sp.color, number: sp.number, special: sp.kind, sid: sp.sid });
    }
    return faces;
  },

  /* Store'da taş hedefli bir değnek kullanılmak istendiğinde sunulan
     rastgele taşlar. Her açılışta YENİDEN çekilir (aynı 10 taş ikinci bir
     değnek için tekrar sunulmaz). Kimlikler NEGATİFTİR: bunlar gerçek
     taş değildir, gerçek taş id'leriyle (pozitif) asla çakışmasınlar. */
  rollStoreTiles() {
    const s = this.state;
    if (!s) return [];
    /* P36 · Grup B — okey yüzleri (asıl okeyler + kalıcı okey kopyaları +
       sahte okeyler) SUNULMAZ: store'da düz taş gibi görünüp değneğin hedefi
       olabiliyorlardı; sahte okey de her stage okeyin yüzüne döndüğü için
       kalıcı dönüşüm ona da tutunmaz. */
    const ok = s.okey;
    const pool = this._deckFaces().filter(f => !ok || f.special
      || f.color !== ok.color || f.number !== ok.number);
    const opts = [];
    const used = new Set();
    while (opts.length < STORE_TILE_PICKS && used.size < pool.length) {
      const i = Math.floor(this.rng() * pool.length);
      if (used.has(i)) continue;
      used.add(i);
      opts.push({ ...pool[i], id: -(opts.length + 1), storeFace: true });
    }
    s.storeTilePick = { options: opts };
    return opts;
  },

  /* UI bu listeyi çizer; picker açık değilse boş döner. */
  storeTileOptions() {
    return (this.state && this.state.storeTilePick && this.state.storeTilePick.options) || [];
  },

  /* Grup K — tüketilebilir kullan (tek seferlik, KALICI etki).
     target: { tileId }, { tileId, color } veya { jokerId } — def.target'a göre.
     Hedefsizler her yerde (store dahil), taş hedefliler yalnız raund içinde
     kullanılabilir. Dönüşte needsTarget varsa UI seçim moduna girer. */
  useConsumable(index, target) {
    const s = this.state;
    const key = s.consumables[index];
    if (!key) return { ok: false };
    const def = CONSUMABLES[key];
    if (!def) { s.consumables.splice(index, 1); return { ok: false, error: 'Bilinmeyen değnek (eski kayıt).' }; }
    const consume = () => s.consumables.splice(index, 1);
    // taş hedefli kullanımlar için ortak doğrulama
    const findTile = () => {
      /* STORE MODU (P29 · Grup O) — raund dışında el yoktur; oyuncuya
         deste bileşiminden rastgele 10 taş sunulur ve etki ona uygulanır.
         Hedefsiz ilk çağrı listeyi YENİDEN çeker ve UI'ı seçim moduna
         sokar; ikinci çağrı seçilen yüzü döndürür. */
      if (s.status !== 'playing') {
        if (target?.tileId == null) {
          this.rollStoreTiles();
          return { error: `${def.name} için sunulan taşlardan birini seç.`,
            needsTarget: def.target, storePick: true };
        }
        const opts = this.storeTileOptions();
        const t = opts.find(x => x.id === target.tileId);
        if (!t) {
          this.rollStoreTiles();
          return { error: 'Sunulan taşlardan birini seç.',
            needsTarget: def.target, storePick: true };
        }
        return { tile: t, store: true };
      }
      const t = s.hand.find(x => x.id === target?.tileId);
      if (!t) return { error: 'Önce elinden bir taş seç.', needsTarget: def.target };
      /* GRUP I (kullanıcı kararı 2026-09-06): ÖZEL TAŞ ARTIK HEDEF
         OLABİLİR. Değnek oyuncunun kendi kararıdır; Grup D'deki kısıt
         yalnız JOKER kaynaklı otomatik dönüşümler içindir. */
      if (t.jokerTile || t.fakeOkey || t.alien)
        return { error: 'Bu taş dönüştürülemez (deste jokeri / uzaylı taşı).' };
      /* P36 · Grup B (KÖK NEDEN) — OKEY HEDEF OLAMAZ. Değnek taşın yüzünü
         `tileMods` remove+add ile KALICI yazar; okeye (asıl, Kağıt ya da Okey
         Mührü kopyası) uygulanınca sonraki raundlarda okey değil SABİT değerli
         bir taş doğuyordu (Taç → "13") ve açılımda reddediliyordu. Okey her
         stage o stage'in okeyine döner — yüzü değneğe açık değildir. */
      if (this.isOkeyTile(t))
        return { error: 'Okey taşı dönüştürülemez — her stage o stage’in okeyine döner.' };
      return { tile: t };
    };
    const rndIns = (tile) => {
      if (s.deck) s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, tile);
    };
    switch (key) {
      case 'kumbara':
        gainCoins(s, 12); consume();
        return { ok: true, note: '🐖 Kumbara kırıldı: +12 coin' };
      case 'yildizTozu':
        s.permMult = round2(s.permMult + 0.3); consume();
        return { ok: true, note: '✨ Yıldız Tozu: tüm açılımlara KALICI +0.3x çarpan' };
      case 'muska':
        s.permIslekReduce = round2((s.permIslekReduce || 0) + 0.06); consume();
        return { ok: true, note: `🧿 Muska: işlek riski kalıcı -%${Math.round((s.permIslekReduce) * 100)}'e indi` };
      /* --- Grup D yeni tüketilebilirleri --- */
      case 'heybe':
        if (this.consumCap() >= CONSUM_SLOT_MAX)
          return { ok: false, error: `Envanter zaten en büyük hâlinde (${CONSUM_SLOT_MAX}).` };
        s.consumSlotBonus = (s.consumSlotBonus || 0) + 1;
        consume();
        return { ok: true, note: `🎒 Kese: değnek envanteri artık ${this.consumCap()} slot` };
      case 'altinOran':
        /* GRUP B (P18): tablo indeksi değil, kalıcı çarpanın kendisi artar.
           GRUP M (P20): run başına 2 kullanım sınırı KALDIRILDI. Sayaç
           yalnız istatistik olarak tutulmaya devam ediyor. */
        s.altinOranCount = (s.altinOranCount || 0) + 1;
        s.permMult = round2(s.permMult + ALTIN_ORAN_GAIN);
        consume();
        return { ok: true, note: `📐 Kıvılcım: kalıcı çarpan +${ALTIN_ORAN_GAIN.toFixed(1)}x → +${s.permMult.toFixed(1)}x` };
      /* PLAYTEST 9 · GRUP L — TACİR MEKTUBU YENİDEN TASARLANDI.
         Eski hâli "store'da +1 raf"tı: aynı işi stage sonu 'raf'
         yükseltmesi zaten BEDAVA yapıyordu ve raf sayısı hiçbir zaman
         darboğaz değildi (coin darboğazdı) — 14 coinlik bir LEGENDARY
         için görünmez bir etkiydi. Yeni hâli run'ın en sert tavanına
         dokunuyor: ANA SLOT 5 → 6. Bir joker slotu daha demek, yani
         build'in tamamını büyütüyor; bu yüzden Mythic'e ve 26 coine
         çıkarıldı, run başına yalnız 1 kez alınabilir (tavan 6). */
      case 'tacirMektubu':
        if ((s.slotBonus || 0) >= SLOT_BONUS_MAX)
          return { ok: false, error: `Ana Slot zaten en büyük hâlinde (${this.slotCap()}).` };
        s.slotBonus = (s.slotBonus || 0) + 1;
        consume();
        return { ok: true, note: `📜 Tacir Mektubu: Ana Slot kalıcı büyüdü — artık ${this.slotCap()} joker taşıyabilirsin` };
      /* FERMAN — raunda GİRMEDEN önce yazılır. Boss raundunun içinde
         kullanılamaz: koşul raund başında kurulur (hedef katsayısı, tur
         sayısı, ele atılan lanetler…), yarısı uygulanmış bir raundu
         "sıradan"a çevirmek yarım bir söz olurdu. Store raundlar arasında
         açıldığı için kartın kullanılacağı yer her zaman vardır. */
      case 'ferman':
        if ((s.fermanUsed || 0) >= FERMAN_MAX)
          return { ok: false, error: `Bu run'da ferman hakkın doldu (${FERMAN_MAX}/${FERMAN_MAX}).` };
        if (s.fermanPending)
          return { ok: false, error: 'Zaten yazılı bir ferman var — sıradaki boss raundunda işleyecek.' };
        if (s.status === 'playing' && this.isBossRound())
          return { ok: false, error: 'Ferman boss raundundan ÖNCE yazılır; bu raund çoktan başladı.' };
        s.fermanPending = true;
        s.fermanUsed = (s.fermanUsed || 0) + 1;
        consume();
        return { ok: true, note: `🪶 Ferman yazıldı: sıradaki boss raundunun koşulu işlemeyecek (${s.fermanUsed}/${FERMAN_MAX})` };
      case 'altinCanak':
        s.permTargetCut = round2(Math.min(0.4, (s.permTargetCut || 0) + 0.10));
        if (s.status === 'playing')
          s.target = Math.ceil(this.targetFor(s.stage, s.roundInStage) * (s.nextTargetMult || 1));
        consume();
        return { ok: true, note: `🏆 Derin Nefes: tüm hedef puanlar kalıcı -%${Math.round(s.permTargetCut * 100)}` };
      case 'klonSisesi': {
        const src = s.jokers.find(x => x.id === target?.jokerId);
        if (!src) return { ok: false, error: 'Kopyalanacak bir ANA SLOT jokeri seç.', needsTarget: 'joker' };
        if (s.jokers.length >= this.slotCap() && s.backup.length >= MAX_BACKUP)
          return { ok: false, error: 'Ana Slot ve Backup dolu — kopyaya yer yok.' };
        const clone = JSON.parse(JSON.stringify(src));
        clone.id = ++_jokerId;
        clone.fresh = true;
        delete clone.protected;
        let dest;
        if (s.jokers.length < this.slotCap()) { s.jokers.push(clone); dest = 'main'; }
        else { clone.waitLeft = 3; s.backup.push(clone); dest = 'backup'; }
        consume();
        return { ok: true, note: `🧬 Klon Şişesi: ${src.name} kopyalandı (${dest === 'main' ? 'Ana Slot' : 'Backup'}, ${clone.usesLeft} raund)` };
      }
      case 'gumusVernik':
      case 'simyaSisesi': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        const spKind = key === 'gumusVernik' ? 'gumus' : 'altin';
        const spDef = SPECIAL_TILES[spKind];
        /* GRUP I: hedef ZATEN özel bir taş olabilir. Aynı türse boşuna
           harcanmasın; farklı türse eski kaydı düşürüp yenisini yazarız
           (yoksa iki kayıt birden sayılır ve kopya sayacı şişer). */
        if (r.tile.special === spKind)
          return { ok: false, error: `Bu taş zaten ${spDef.name} — vernik tutmaz.` };
        if (s.specialTiles.filter(x => x.kind === spKind).length >= spDef.maxCopies)
          return { ok: false, error: `${spDef.name} destede zaten ${spDef.maxCopies}/${spDef.maxCopies} — vernik tutmaz.` };
        const oldSp = r.tile.special ? SPECIAL_TILES[r.tile.special] : null;
        const mgRec = this._magnetOf(r.tile);   // Grup H: dönüşümden ÖNCE yakala
        this._dropSpecialRecord(r.tile);
        // normal taş desteden kalkar, yerine aynı kimlikte ÖZEL taş girer
        if (!oldSp) s.tileMods.push({ op: 'remove', color: r.tile.color, number: r.tile.number });
        const newRec = this._addSpecialTile(spKind, r.tile.color, r.tile.number);
        r.tile.special = spKind;
        r.tile.sid = newRec.sid;
        /* Grup H — mıknatıs kimliği renk+sayıdan `sid`e terfi eder. Taş artık
           her raund `specialTiles`ten yeniden kuruluyor ve renk+sayı eşleşmesi
           onu bulamaz (deste taşlarında `sid` yoktur, o filtreye takılır). */
        if (mgRec) { mgRec.sid = newRec.sid; mgRec.color = r.tile.color; mgRec.number = r.tile.number; }
        consume();
        return { ok: true, note: `${spDef.icon} ${def.name}: ${COLOR_TR[r.tile.color]} ${r.tile.number} kalıcı olarak ${spDef.name} oldu` };
      }
      case 'balKupu':
        s.permCoin = (s.permCoin || 0) + BAL_KUPU_PERM;
        gainCoins(s, BAL_KUPU_INSTANT);
        consume();
        return { ok: true, note: `🍯 Bal Küpü: anında +${BAL_KUPU_INSTANT} coin, her raund sonunda kalıcı +${BAL_KUPU_PERM} coin` };
      case 'okeyMuhru':
        s.tileMods.push({ op: 'okeyClone' });
        rndIns({ id: nextTileId(s), color: s.okey.color, number: s.okey.number,
          isOkeyReal: true, copied: true, origin: 'okeyMuhru' });
        consume();
        return { ok: true, note: '🃏 Okey Mührü: desteye kalıcı bir okey kopyası eklendi' };
      case 'zamanKumu': {
        const j = [...s.jokers, ...s.backup, ...s.deckJokers].find(x => x.id === target?.jokerId);
        if (!j) return { ok: false, error: 'Önce süresini uzatacağın jokeri seç.', needsTarget: 'joker' };
        // Grup B2 — süresi zaten run boyunca olan jokere kum dökmek israf olur
        if (this.isRunLong(j))
          return { ok: false, error: `${j.name} zaten run boyunca yaşıyor — başka bir joker seç.`, needsTarget: 'joker' };
        j.usesLeft += 3; consume();
        return { ok: true, note: `⏳ Zaman Kumu: ${j.name} +3 raund (kalan ${j.usesLeft})` };
      }
      case 'zimpara': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        s.tileMods.push({ op: 'remove', color: r.tile.color, number: r.tile.number });
        const wasSp = r.tile.special ? SPECIAL_TILES[r.tile.special] : null;
        this._dropSpecialRecord(r.tile);       // Grup I: özel kaydı da düşer
        this._dropMagnet(r.tile);              // Grup H: mıknatıs kaydı da düşer
        /* P29 · Grup O: store modunda ortada gerçek bir el taşı yok —
           defter kaydı da olmamalı (nöbetçi var olmayan bir id görürdü). */
        if (!r.store) this._takeTile(r.tile, 'zimpara');   // Grup A: elden çıkış sahiplenilir
        consume();
        return { ok: true, note: `🪒 Ustura: ${COLOR_TR[r.tile.color]} ${r.tile.number}`
          + (wasSp ? ` (${wasSp.name})` : '') + ' desteden kalıcı silindi' };
      }
      case 'cekic': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        const old = r.tile.number;
        if (old >= 13) return { ok: false, error: 'Bu taş zaten 13 — çekiç işlemez.' };
        const nv = Math.min(13, old + 3);
        // Grup B: dönüşüm çifti atomik — remove eşleşmezse add da düşer
        const pc = nextModPair(s);
        s.tileMods.push({ op: 'remove', color: r.tile.color, number: old, pair: pc },
          { op: 'add', color: r.tile.color, number: nv, src: 'mod', pair: pc });
        r.tile.number = nv;
        r.tile.modded = true;
        this._retuneMagnet(r.tile, r.tile.color, old);   // Grup H
        tagOrigin(r.tile, 'cekic');
        consume();
        return { ok: true, note: `🔨 Değer Çekici: ${COLOR_TR[r.tile.color]} ${old} → ${nv} (kalıcı)` };
      }
      case 'tac': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        const old = r.tile.number;
        if (old >= 13) return { ok: false, error: 'Bu taş zaten 13.' };
        const pt = nextModPair(s);
        s.tileMods.push({ op: 'remove', color: r.tile.color, number: old, pair: pt },
          { op: 'add', color: r.tile.color, number: 13, src: 'mod', pair: pt });
        r.tile.number = 13;
        r.tile.modded = true;
        this._retuneMagnet(r.tile, r.tile.color, old);   // Grup H
        tagOrigin(r.tile, 'tac');
        consume();
        return { ok: true, note: `👑 Taç Giydirme: ${COLOR_TR[r.tile.color]} ${old} → 13 (kalıcı)` };
      }
      case 'miknatis': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        if (!Array.isArray(s.magnets)) s.magnets = [];
        if (s.magnets.length >= MAGNET_MAX)
          return { ok: false, error: `En fazla ${MAGNET_MAX} taş mıknatıslanabilir.` };
        if (this._magnetOf(r.tile))
          return { ok: false, error: 'Bu taş zaten mıknatıslı — mıknatıs boşa gitmesin.' };
        s.magnets.push(r.tile.sid != null
          ? { sid: r.tile.sid, color: r.tile.color, number: r.tile.number }
          : { color: r.tile.color, number: r.tile.number });
        r.tile.magnet = true;
        consume();
        return { ok: true, note: `🧲 Mıknatıs: ${COLOR_TR[r.tile.color]} ${r.tile.number} artık her raundun başlangıç elinde gelecek` };
      }
      case 'kopyaci': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        /* GRUP I: özel taşın kopyası da ÖZELDİR — yoksa 8 coinlik mürekkep
           pahalı bir taşı sıradanlaştırıyordu. Kopya sınırı korunur:
           tür zaten tavandaysa mürekkep tutmaz. */
        const spK = r.tile.special || null;
        if (spK) {
          const spD = SPECIAL_TILES[spK];
          if (s.specialTiles.filter(x => x.kind === spK).length >= spD.maxCopies)
            return { ok: false,
              error: `${spD.name} destede zaten ${spD.maxCopies}/${spD.maxCopies} — kopya sığmaz.` };
        }
        s.tileMods.push({ op: 'add', color: r.tile.color, number: r.tile.number, src: 'copy' });
        const copy = { id: nextTileId(s), color: r.tile.color, number: r.tile.number,
          copied: true, origin: 'kopyaci' };
        if (spK) {
          const rec = this._addSpecialTile(spK, copy.color, copy.number);
          copy.special = spK;
          copy.sid = rec.sid;
        }
        rndIns(copy);
        consume();
        return { ok: true, note: `🖋 Kopya Mürekkebi: ${COLOR_TR[r.tile.color]} ${r.tile.number}`
          + (spK ? ` (${SPECIAL_TILES[spK].name})` : '') + ' kopyası desteye kalıcı eklendi' };
      }
      case 'boya': {
        const r = findTile();
        if (!r.tile) return { ok: false, error: r.error, needsTarget: r.needsTarget, storePick: r.storePick };
        const color = target?.color;
        if (!COLORS.includes(color)) return { ok: false, error: 'Yeni rengi seç.', needsTarget: 'tileColor' };
        if (color === r.tile.color) return { ok: false, error: 'Taş zaten bu renkte — farklı bir renk seç.', needsTarget: 'tileColor' };
        const pb = nextModPair(s);
        s.tileMods.push({ op: 'remove', color: r.tile.color, number: r.tile.number, pair: pb },
          { op: 'add', color, number: r.tile.number, src: 'mod', pair: pb });
        const oldC = r.tile.color;
        r.tile.color = color;
        r.tile.modded = true;
        this._retuneMagnet(r.tile, oldC, r.tile.number);   // Grup H
        tagOrigin(r.tile, 'boya');
        consume();
        return { ok: true, note: `🎨 Boya Kabı: ${COLOR_TR[oldC]} ${r.tile.number} → ${COLOR_TR[color]} ${r.tile.number} (kalıcı)` };
      }
    }
    return { ok: false };
  },

  /* ============================================================
     GRUP F (Playtest 7) — DEDİKODU MASASI
     Bungie Gum'ın "sabitlenen taşlar" alanı gibi kendi görsel alanı ve
     kendi kuralları olan bir alt-sistem: ıstakanın yanında 3 AÇIK taş durur
     (desteden gelir, elinde değildir). Her tur 1 kez elindeki bir taşı
     masadakiyle takas edebilirsin; verdiğin taş masada kalır, yani takas
     geri alınabilir — masa bir "yan ıstaka" gibi çalışır.
     Masa raund başında kurulur, raund sonunda taşlar desteye döner.
     ============================================================ */
  GOSSIP_SLOTS: 3,

  _setupGossipTable(notes) {
    const s = this.state;
    /* Deste bu noktada YENİ kurulmuştur (_startRound) — eski masanın taşlarını
       geri koymak desteyi bozardı (çift kayıt), o yüzden yalnız sıfırlanır. */
    s.gossipTable = [];
    s.gossipSwapUsed = false;
    if (!this.hasActive('dedikodu')) return;
    const pool = s.deck.filter(t => !t.jokerTile);
    for (let i = 0; i < this.GOSSIP_SLOTS && pool.length; i++) {
      const t = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      s.deck = s.deck.filter(x => x !== t);
      s.gossipTable.push(t);
    }
    s.gossipSwapUsed = false;
    if (s.gossipTable.length && notes)
      notes.push(`🗨 Dedikodu Masası kuruldu: ${s.gossipTable
        .map(t => `${COLOR_TR[t.color]} ${t.number}`).join(', ')}`);
  },

  /* PLAYTEST 9 · GRUP G (bug) — MASA HER TUR YENİLENİR.
     Eskiden masa YALNIZ raund başında kuruluyordu; `gossipSwapUsed` her tur
     sıfırlansa da AYNI 3 taş raund boyunca duruyordu, yani 1. turda işine
     yaramayan bir masa 4 tur boyunca ölü kalıyordu — "teklif hiç değişmiyor"
     şikâyetinin kök nedeni buydu.
     Artık her tur başında masadaki taşlar desteye geri karışır ve yerlerine
     yenileri gelir. TEK İSTİSNA: oyuncunun kendi koyduğu taş (`fromPlayer`)
     yerinde kalır — "verdiğin taş masada kalır, takas geri alınabilir"
     sözü bozulmasın diye. */
  _refreshGossipTable(events) {
    const s = this.state;
    if (s.jokersDisabled || !this.hasActive('dedikodu')) return;
    if (!(s.gossipTable || []).length) return;
    const fresh = [];
    for (let i = 0; i < s.gossipTable.length; i++) {
      const cur = s.gossipTable[i];
      if (cur.fromPlayer) continue;              // oyuncunun bıraktığı taş kalır
      const pool = s.deck.filter(t => !t.jokerTile);
      if (!pool.length) continue;
      const pick = pool[Math.floor(this.rng() * pool.length)];
      s.deck = s.deck.filter(x => x !== pick);
      delete cur.slot;
      // eski taş desteye rastgele bir yerden geri karışsın (deste bütünlüğü)
      s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, cur);
      s.gossipTable[i] = pick;
      fresh.push(pick);
    }
    if (fresh.length && events)
      events.push(`🗨 Dedikodu Masası tazelendi: ${fresh
        .map(t => `${COLOR_TR[t.color]} ${t.number}`).join(', ')}`);
  },

  /* Takas mümkün mü? UI masayı yalnız o zaman etkileşimli çizer. */
  canGossipSwap() {
    const s = this.state;
    return s.status === 'playing' && s.phase === 'meld'
      && !s.gossipSwapUsed && (s.gossipTable || []).length > 0
      && this.hasActive('dedikodu');
  },

  /* Elindeki taşı masadakiyle değiştir. Gelen taş, giden taşın ıstaka
     hücresine (slot) oturur ki dizilişin bozulmasın. */
  gossipSwap(handTileId, tableTileId) {
    const s = this.state;
    if (!this.hasActive('dedikodu'))
      return { ok: false, error: 'Dedikodu Masası jokerin yok.' };
    if (s.status !== 'playing' || s.phase !== 'meld')
      return { ok: false, error: 'Takas yalnız açılım aşamasında yapılabilir.' };
    if (s.gossipSwapUsed)
      return { ok: false, error: 'Bu turda masayı zaten kullandın (tur başına 1 takas).' };
    const hi = s.hand.findIndex(t => t.id === handTileId);
    const ti = (s.gossipTable || []).findIndex(t => t.id === tableTileId);
    if (hi === -1 || ti === -1) return { ok: false, error: 'Takas için bir el taşı ve bir masa taşı seç.' };
    const mine = s.hand[hi];
    if (mine.jokerTile) return { ok: false, error: 'Deste jokeri masaya konamaz.' };
    if (mine.bossSewn) return { ok: false, error: '👹 İğne bu taşı dikti — bu tur kullanılamaz.' };
    if (mine.sewn) return { ok: false, error: 'Bu taş dikili — takas edilemez.' };
    const theirs = s.gossipTable[ti];
    theirs.slot = mine.slot;         // gelen taş, gidenin hücresine otursun
    delete mine.slot;
    delete theirs.fromPlayer;        // masadan çıktı — artık serbest taş
    mine.fromPlayer = true;          // Grup G: tur yenilemesinde masada kalır
    s.hand[hi] = theirs;
    s.gossipTable[ti] = mine;
    s.gossipSwapUsed = true;
    return { ok: true, got: theirs, gave: mine,
      note: `🗨 Masa takası: ${COLOR_TR[mine.color]} ${mine.number} ⇄ ${COLOR_TR[theirs.color]} ${theirs.number}` };
  },

  /* ============================================================
     PANDORA (PLAYTEST 11 · GRUP F) — KUTUNUN AÇILIŞI
     Kutu ELE İLK GELDİĞİNDE (raund başında ya da raund içinde ana slota
     girdiğinde) açılır ve üç varyanttan birine EŞİT OLASILIKLA dönüşür.
     Seçim bir kez yapılır ve jokerin üstünde (j.pandora) kalıcı durur;
     görünen ad + açıklama da o anda değişir, böylece tooltip ve kart
     gerçek efekti gösterir. UI açılış anını ayrı bir "kutu açılıyor"
     sahnesiyle gösterir (bkz. showPandoraReveal).
     ============================================================ */
  /* P35 · Grup L — The Corporates'in şirket görevleri, koleksiyon ipucunda
     Pandora varyantlarıyla aynı biçimde listelenir (ad + etki). */
  corpsInfo() {
    return CORPS.map(c => ({ icon: '', name: c.name,
      desc: `Görev: ${c.text}. Başarırsan ${c.rewardText}, başaramazsan ${c.penaltyText}.` }));
  },

  PANDORA_INFO: {
    umut: { name: 'Pandora — Umut', icon: '🕊',
      desc: 'Kutunun dibinde kalan: açılımdaki her taş +50 puan. Ayrıca raundu kaybedecek olursan eksik puanının TAMAMINI tamamlar — run boyunca yalnız 1 kez.' },
    salgin: { name: 'Pandora — Salgın', icon: '🦠',
      desc: 'Kutudan çıkan dertler: her tur 2 taşın dertlenir. Dertli taş açılımda +2.5x verir ama elde beklerse tur başına -30 puan yakar.' },
    armagan: { name: 'Pandora — Armağan', icon: '🎁',
      desc: 'Kutu boşalır: her raund başında 3 taşının değeri 13 olur ve altın işaretlenir. İşaretli taşı kullandığın kombinasyonun puanı %30 artar.' },
  },

  _revealPandora(j, notes) {
    if (!j || j.revealed) return null;
    const key = PANDORA_VARIANTS[Math.floor(this.rng() * PANDORA_VARIANTS.length)];
    const info = this.PANDORA_INFO[key];
    j.revealed = true;
    j.pandora = key;
    j.name = info.name;
    j.desc = info.desc;
    if (notes) notes.push(`${info.icon} PANDORA'NIN KUTUSU AÇILDI → ${info.name}! ${info.desc}`);
    return key;
  },

  /* UI, açılış animasyonunu göstermek için "bu raund hangi kutu açıldı"
     bilgisini buradan okur (bir kez tüketilir). */
  takePandoraReveal() {
    const j = this.slotRecs().find(x => x.key === 'truva' && x.revealed && !x.revealShown);
    if (!j) return null;
    j.revealShown = true;
    return { id: j.id, variant: j.pandora, ...this.PANDORA_INFO[j.pandora] };
  },

  /* ============================================================
     DAMGA — AÇILIMDAN ÖNCE 2 KAT (PLAYTEST 28 · GRUP B)
     Kartın tek kararı zamanlamadır, o yüzden motorun UI'a söylemesi
     gereken tek şey "damga şu an basılabilir mi ve basılı mı".
     Önizleme ayrı bir yol DEĞİL: `damgaArmed` bayrağı puanlamanın
     içinde durduğu için hesap kutusu (Game.previewScore) damgayı
     zaten katlanmış gösterir — bildirim ile puanlama ayrışamaz.
     ============================================================ */
  damgaState() {
    const s = this.state;
    if (!s || s.status !== 'playing') return null;
    if (s.jokersDisabled) return null;
    /* FÜZYON — burada `slotRecs()` KULLANILMAZ. O liste erimiş alt
       kayıtları da düzleştirir ve alt kaydın KENDİ id'sini verir; UI ise
       düğmeyi bir KARTA çizer ve kartın id'siyle eşleştirir. Damga başka
       bir jokere erimişse iki id tutmaz ve düğme hiç çizilmezdi — yani
       füzyona giren Damga sessizce kullanılamaz hâle gelirdi. Bu yüzden
       ana slot KARTLARI taranır ve kartın id'si döner (Godzilla /
       Hipnotizör / Newton rozetlerindeki `j.key === … || j.fused.some(…)`
       kalıbının aynısı). */
    const card = (s.jokers || []).find(x =>
      x.key === 'ayna' || (x.fused || []).some(f => f.key === 'ayna'));
    if (!card) return null;
    return { id: card.id, used: !!s.damgaUsed, armed: !!s.damgaArmed };
  },

  /* Basılı damgayı kaldırmak da serbesttir: hak yalnız puanlanan bir
     açılımda harcanır (bkz. commitMeld), yanlış tura basmak oyuncuya
     hiçbir şeye mal olmaz. */
  toggleDamga() {
    const st = this.damgaState();
    if (!st) return { ok: false, error: 'Damga jokerin ana slotta değil.' };
    if (st.used) return { ok: false, error: 'Damga bu raundda kullanıldı.' };
    const s = this.state;
    if (s.phase !== 'meld') return { ok: false, error: 'Damga yalnız açılım aşamasında basılır.' };
    s.damgaArmed = !s.damgaArmed;
    return { ok: true, armed: s.damgaArmed };
  },

  /* ============================================================
     TERAZİ — TAŞ FEDA ET (PLAYTEST 20 · GRUP A)
     Taş atma aşamasında, tur başına bir kez, elden bir taş feda edilir.
     Feda edilen taş oyundan TAMAMEN çıkar: atılan yığınına girmez, yani
     o taş için işlek zarı da atılmaz. Normal atış yine yapılır — feda
     ek bir maliyettir.
       AĞIR (>= TERAZI_HEAVY_MIN) → HEDEF, taşın değerinin 15 katı kadar
                                    düşer (anında).
       HAFİF (<  TERAZI_HEAVY_MIN) → +0.8x, raundun kalan turlarına.
     İKİSİNİN DE ORTAK BEDELİ (P29 · Grup J): o turda işlek cezası yersen
     bonus geri alınır (bkz. discard içindeki işlek ceza dalı).
     ============================================================ */
  canTeraziSacrifice() {
    const s = this.state;
    return !!(this.hasActive('terazi') && s.phase === 'discard' && !s.teraziUsed
      && s.status === 'playing');
  },

  /* Bir taş feda edilirse ne olacağını UI'ın ÖNCEDEN yazabilmesi için.
     Motor ile önizleme aynı fonksiyondan beslenir; Terzi'nin İğnesi'nde
     olduğu gibi "bildirim başka, puanlama başka" ayrışması olamaz. */
  teraziPreview(tileId) {
    const s = this.state;
    if (!s) return null;
    const t = (s.hand || []).find(x => x.id === tileId);
    if (!t) return null;
    const heavy = t.number >= TERAZI_HEAVY_MIN;
    /* Hedef 1'in altına inmez; indirim o yüzden kırpılır ve ÖNİZLEME de
       kırpılmış sayıyı yazar (motorla aynı sayı kuralı). */
    return heavy
      ? { heavy: true, tile: t,
          cut: Math.min(Math.max(0, s.target - 1), t.number * TERAZI_HEAVY_TARGET) }
      : { heavy: false, tile: t, mult: TERAZI_LIGHT_MULT };
  },

  /* ===== PARATONER (P29 · Grup F) — YEM SEÇİMİ =====
     Terazi'nin feda arayüzüyle aynı kalıp: taş atma aşamasında ıstakadan
     TEK bir taş işaretlenir. Fark, yemin elden ÇIKMAMASIDIR — işlek o tur
     tutmazsa taş yerinde kalır ve sonraki tur yeniden seçilir. */
  /* THE CHEATING · HİLELİ AÇILIM (P35 · Grup H) — deste jokeri ELDEYKEN,
     açılım aşamasında hile kurulabilir. Kurulu hile yalnız SIRADAKİ onaya
     işler ve onaydan sonra kendiliğinden kapanır. */
  canCheat() {
    const s = this.state;
    if (!s || s.jokersDisabled || s.status !== 'playing' || s.phase !== 'meld') return false;
    return s.deckJokers.some(j => j.key === 'cheating' && j.activeRound)
      && s.hand.some(t => t.jokerTile === 'cheating');
  },

  toggleCheat() {
    const s = this.state;
    if (!this.canCheat()) return { ok: false, error: 'The Cheating elinde değil.' };
    s.cheatArmed = !s.cheatArmed;
    return { ok: true, armed: s.cheatArmed };
  },

  /* Tur sonu zarı. Risk yalnız hile yapılan raundda birikir; zar tutarsa
     joker gider ve hileyle kazanılan EK puan silinir (skor 0'ın altına
     inmez). Tutmazsa risk durur — sonraki hile üstüne ekler. */
  _cheatJokerResolve(events) {
    const s = this.state;
    if (!((s.cheatRisk || 0) > 0)) return;
    const chJ = s.deckJokers.find(j => j.key === 'cheating');
    if (!chJ) { s.cheatRisk = 0; s.cheatGain = 0; return; }
    const pct = Math.round(s.cheatRisk * 100);
    if (this.rng() < s.cheatRisk) {
      const lost = Math.min(s.score, s.cheatGain || 0);
      s.score -= lost;
      s.deckJokers = s.deckJokers.filter(j => j !== chJ);
      for (const t of s.hand.filter(t => t.jokerTile === 'cheating'))
        this._takeTile(t, 'cheating-yakalandı');
      s.cheatRisk = 0; s.cheatGain = 0; s.cheatArmed = false;
      this._cheatFlash({ side: 'joker', kind: 'caught', lost, back: 0 });
      events.push(`🕶 YAKALANDIN! The Cheating yok oldu — hileyle kazandığın ${lost} puan silindi`);
    } else {
      events.push(`🕶 Hile bu tur fark edilmedi · risk %${pct}`);
    }
  },

  /* RÜŞVET (P34) — taş atma aşamasında, tur başına bir kez. Önce desteden
     yeni taşlar ayrılır, SONRA eski taşlar desteye döner: aynı taşın hemen
     geri çekilmesi mümkün olmasın. Deste jokeri çekilmez (etkinleşmesi
     normal çekiş akışına bağlı). */
  rusvetCost() { return RUSVET_COST; },

  _rusvetKey() {
    const s = this.state;
    return `${s.stage}-${s.roundInStage}-${s.turn}`;
  },

  _rusvetEligible(t) {
    return !!t && !t.jokerTile && !t.sewn && !t.bossSewn && !t.ghost;
  },

  canRusvet() {
    const s = this.state;
    if (!s) return false;
    return !!(!s.jokersDisabled && this.hasActive('rusvet') && s.phase === 'discard'
      && s.status === 'playing' && !s.godPick && s.rusvetTurn !== this._rusvetKey());
  },

  useRusvet(ids) {
    const s = this.state;
    if (!s || s.jokersDisabled || !this.hasActive('rusvet'))
      return { ok: false, error: 'Rüşvet slotta değil.' };
    if (s.status !== 'playing' || s.phase !== 'discard')
      return { ok: false, error: 'Rüşvet yalnız taş atma aşamasında verilir.' };
    if (s.rusvetTurn === this._rusvetKey())
      return { ok: false, error: 'Bu tur rüşvet hakkını kullandın.' };
    const tiles = [...new Set(ids || [])].map(id => s.hand.find(t => t.id === id));
    if (!tiles.length) return { ok: false, error: 'Rüşvet için ıstakadan taş seç.' };
    if (tiles.some(t => !t)) return { ok: false, error: 'Seçilen taşlardan biri elinde değil.' };
    if (tiles.some(t => !this._rusvetEligible(t)))
      return { ok: false, error: 'Deste jokeri, dikili ya da hayalet taş geri yollanamaz.' };
    const cost = tiles.length * RUSVET_COST;
    if (s.coins < cost) return { ok: false, error: `Yetersiz coin: ${cost} coin gerekiyor.` };
    const drawn = s.deck.filter(t => !t.jokerTile).slice(0, tiles.length);
    if (drawn.length < tiles.length) return { ok: false, error: 'Destede yeterli taş yok.' };
    for (const d of drawn) s.deck.splice(s.deck.indexOf(d), 1);
    for (const t of tiles) {
      this._takeTile(t, 'rüşvet');
      if (s.paratonerBait === t.id) s.paratonerBait = null;
      s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, t);
    }
    s.hand.push(...drawn);
    spendCoins(s, cost);
    s.rusvetTurn = this._rusvetKey();
    return { ok: true, cost, gone: tiles.map(t => t.id), drawn: drawn.map(t => t.id),
      note: `💰 Rüşvet: ${this._tileNames(tiles)} desteye döndü, ${this._tileNames(drawn)} çektin (-${cost} coin)` };
  },

  canParatonerBait() {
    const s = this.state;
    if (!s) return false;
    return !!(this.hasActive('paratoner') && s.phase === 'discard' && s.status === 'playing');
  },

  /* "Bu taşı yem koyarsan ne olur" — UI ile motor aynı sayıdan beslensin
     diye tek fonksiyon (Terazi'deki teraziPreview emsali). */
  paratonerPreview(tileId) {
    const s = this.state;
    if (!s) return null;
    const t = (s.hand || []).find(x => x.id === tileId);
    if (!t || !this._paratonerEligible(t)) return null;
    return { tile: t, gain: t.number * PARATONER_MULT };
  },

  /* Yem olabilecek taş: okey, deste jokeri ve dikili taşlar kapsam dışı —
     bunlar zaten işlek adayı da değildir ya da elden çıkarılamaz. */
  _paratonerEligible(t) {
    return !!t && !t.jokerTile && !t.sewn && !t.bossSewn && !this.isOkeyTile(t);
  },

  /* Yemi kur / kaldır. Aynı taş ikinci kez verilirse işaret kalkar. */
  setParatonerBait(tileId) {
    const s = this.state;
    if (!this.canParatonerBait()) return { ok: false, error: 'Paratoner yem seçemez.' };
    if (tileId == null || s.paratonerBait === tileId) {
      s.paratonerBait = null;
      return { ok: true, cleared: true, note: '⚡ Paratoner: yem kaldırıldı.' };
    }
    const t = s.hand.find(x => x.id === tileId);
    if (!t) return { ok: false, error: 'Taş elinde değil.' };
    if (!this._paratonerEligible(t)) return { ok: false, error: 'Bu taş yem olamaz.' };
    s.paratonerBait = tileId;
    return { ok: true, tile: t, gain: t.number * PARATONER_MULT,
      note: `⚡ Paratoner: ${COLOR_TR[t.color]} ${t.number} yem — işlek tutarsa `
        + `+${t.number * PARATONER_MULT} puan, taş yanar.` };
  },

  teraziSacrifice(tileId) {
    const s = this.state;
    if (!this.hasActive('terazi')) return { ok: false, error: 'Terazi slotta değil.' };
    if (s.phase !== 'discard') return { ok: false, error: 'Feda yalnız taş atma aşamasında yapılır.' };
    if (s.teraziUsed) return { ok: false, error: 'Bu turda feda hakkını kullandın.' };
    const t = s.hand.find(x => x.id === tileId);
    if (!t) return { ok: false, error: 'Taş elinde değil.' };
    if (t.jokerTile) return { ok: false, error: 'Deste jokeri feda edilemez.' };
    if (t.sewn || t.bossSewn) return { ok: false, error: 'Dikili taş feda edilemez.' };
    if (this.isOkeyTile(t)) return { ok: false, error: 'Okey taşı feda edilemez.' };
    const pv = this.teraziPreview(tileId);
    // Grup C (P25): feda da bir elden çıkıştır — deftere yazılmazsa
    // nöbetçi bunu "sahipsiz kayıp" sanıp alarm veriyordu.
    this._takeTile(t, 'terazi-feda');
    s.teraziUsed = true;
    /* P29 · Grup J — kazanılan bonus bu turluk kaydedilir; o turda işlek
       cezası yenirse discard içindeki iptal bloğu buradan geri sarar. */
    if (pv.heavy) {
      s.target = Math.max(1, s.target - pv.cut);
      s.teraziTurnGain = { heavy: true, amount: pv.cut };
      return { ok: true, heavy: true, cut: pv.cut,
        note: `⚖ Terazi: ${COLOR_TR[t.color]} ${t.number} feda edildi → `
          + `hedef ${pv.cut} puan düştü (yeni hedef ${s.target})` };
    }
    s.teraziRoundMult = round2((s.teraziRoundMult || 0) + TERAZI_LIGHT_MULT);
    s.teraziTurnGain = { heavy: false, amount: TERAZI_LIGHT_MULT };
    return { ok: true, heavy: false, gain: TERAZI_LIGHT_MULT,
      note: `⚖ Terazi: ${COLOR_TR[t.color]} ${t.number} feda edildi → `
        + `+${TERAZI_LIGHT_MULT.toFixed(1)}x (raundun kalanına, toplam +${s.teraziRoundMult.toFixed(1)}x)` };
  },

  /* ============================================================
     PLAYTEST 20 · GRUP J — SERBEST ISTAKA (YALNIZ TRAINER)
     Klasik ıstaka 2×15 sabit hücreli bir ızgaradır: taşın `slot` alanı
     hücre numarasıdır ve boş hücreler ekranda görünür. Serbest düzende
     taşlar yan yana sıkışık durur; oyuncu bir taşı sürükleyip iki taşın
     ARASINA bırakır ve sıra kayar (ray üzerinde kaydırma hissi).
     Motor tarafı tek bir işten ibarettir: iki satırın id listesini alıp
     `slot` numaralarını yeniden yazmak. Sıra numaraları klasik düzenle
     AYNI uzayda kalır (üst satır 0-14, alt satır 15-29), böylece iki
     düzen arasında geçiş yapılsa bile ıstaka bozulmaz.
     DENEYSELDİR: ana oyun modunda hiç çağrılmaz (ui.js yalnız trainer'da
     serbest düzeni çizer), bu yüzden klasik düzenin davranışı birebir
     korunur.
     ============================================================ */
  setRackOrder(row1Ids, row2Ids) {
    const s = this.state;
    if (!s || !Array.isArray(s.hand)) return { ok: false };
    const byId = new Map(s.hand.map(t => [t.id, t]));
    const seen = new Set();
    const take = (ids, base) => {
      let n = 0;
      for (const id of (ids || [])) {
        const t = byId.get(id);
        if (!t || seen.has(id)) continue;
        seen.add(id);
        t.slot = base + n;
        n++;
      }
      return n;
    };
    const n1 = take(row1Ids, 0);
    take(row2Ids, 15);
    /* Listelerde geçmeyen taş kalırsa (beklenmedik durum) sıraları
       bozulmasın diye üst satırın sonuna eklenir — taş kaybolmaz. */
    let tail = n1;
    for (const t of s.hand) if (!seen.has(t.id)) t.slot = tail++;
    return { ok: true };
  },

  /* Anahtar bazlı joker kurulumu — satın alma / ödül anında */
  _initJoker(j) {
    if (j.key === 'terzi' && !j.color) this.setTerziColor(j, COLORS[Math.floor(this.rng() * 4)]);
    if (j.key === 'ahtapot') j.arms = 8;
    if (j.key === 'freedom') {
      j.marked = [];
      for (let i = 0; i < 5; i++)
        j.marked.push({ color: COLORS[Math.floor(this.rng() * 4)], number: 1 + Math.floor(this.rng() * 13) });
      j.desc += ' İşaretliler: ' + j.marked.map(m => `${COLOR_TR[m.color]} ${m.number}`).join(', ') + '.';
    }
    return j;
  },

  /* Terzi (GDD 9) — renk seçimi; UI satın alma anında pop-up ile çağırır */
  setTerziColor(jokerOrId, color) {
    const s = this.state;
    const j = typeof jokerOrId === 'object' ? jokerOrId
      : [...s.jokers, ...s.backup].find(x => x.id === jokerOrId);
    if (!j || j.key !== 'terzi' || !COLORS.includes(color)) return { ok: false };
    j.color = color;
    j.desc = `Seçilen renk: ${COLOR_TR[color]}. Bu renkteki taşlar Per açılımlarında renk kuralından muaftır.`;
    return { ok: true, color };
  },

  /* dest: 'main' | 'backup' | undefined (otomatik: önce Ana, sonra Backup).
     Kullanıcı isteği (2026-07): Ana Slot boş olsa bile joker doğrudan
     Backup'a atanabilir — satın alma anında hedef seçtirilir. */
  buyJoker(index, dest) {
    const s = this.state;
    const item = s.store?.items[index];
    if (!item || item.sold) return { ok: false, error: 'Ürün mevcut değil.' };
    if (s.coins < item.price) return { ok: false, error: 'Yetersiz coin.' };
    const def = JOKER_DEFS[item.key];
    const j = this._initJoker({
      id: ++_jokerId, key: item.key, name: item.name, desc: item.desc,
      rarity: item.rarity, usesLeft: this._usesFor(def, item.rarity), fresh: true,
    });
    // Grup G: store'dan alınan deste jokeri slot işgal etmez — desteye karışır
    if (def.mech === 'deck') {
      spendCoins(s, item.price);
      item.sold = true;
      s.deckJokers.push(j);
      return { ok: true, placed: 'deck', jokerId: j.id, key: item.key };
    }
    /* PLAYTEST 17 · GRUP F/23 — FÜZYON SLOT İSTEMEZ (kullanıcı kararı
       2026-08-28). Füzyon bir "pasif slot jokeri" değil, TEK SEFERLİK BİR
       EYLEMDİR: alındığı anda iki jokeri birleştirir ve tükenir. Onu bir
       rafa koymak iki soruna yol açıyordu:
         (a) ana slot doluyken Backup'a düşüyor, oradaki tek bekleme
             yerini işgal ediyordu;
         (b) ana slot VE backup doluyken — yani birleştirmeye en çok
             ihtiyaç duyulan anda — satın alınamıyordu bile
             ("Ana Slot ve Backup dolu").
       Artık Füzyon hiçbir rafa girmez; `fuzyonPending` olarak bekler ve
       birleştirme ekranı doğrudan açılır. Kullanılınca yok olur. */
    if (item.key === 'fuzyon') {
      spendCoins(s, item.price);
      item.sold = true;
      s.fuzyonPending = j;
      return { ok: true, placed: 'pending', jokerId: j.id, key: item.key };
    }
    const toBackup = () => {
      // GDD 7.4 — backup'ta süre donar; bekleme sınırı: 1 raundluklar 1, diğerleri 3
      j.waitLeft = j.usesLeft === 1 ? 1 : 3;
      s.backup.push(j);
    };
    if (dest === 'main') {
      if (s.jokers.length >= this.slotCap()) return { ok: false, error: 'Ana Slot dolu.' };
      s.jokers.push(j);
    } else if (dest === 'backup') {
      if (s.backup.length >= MAX_BACKUP) return { ok: false, error: 'Backup dolu.' };
      toBackup();
    } else if (s.jokers.length < this.slotCap()) {
      s.jokers.push(j);
    } else if (s.backup.length < MAX_BACKUP) {
      toBackup();
    } else {
      return { ok: false, error: 'Ana Slot ve Backup dolu — önce bir joker sat.' };
    }
    spendCoins(s, item.price);
    item.sold = true;
    return { ok: true, placed: s.jokers.includes(j) ? 'slot' : 'backup', jokerId: j.id, key: item.key };
  },

  /* ==========================================================================
     PLAYTEST 26 · MADDE C (kullanıcı kararı 2026-09-09) — RAFTAN TAKASLA AL
     "Ana slotum doluyken store'daki kartı kendi kartımla değiştirmek"
     akışı hiç yoktu. Doluluk satın almayı yalnızca ENGELLİYORDU: ui.js
     satın alma düğmesini `s.jokers.length >= 5 && s.backup.length >= 2`
     ile kapatıyordu, yani oyuncu teklifi görüyor ama tıklayamıyordu bile.
     (Adı "Takas" olan MEVCUT mekanik bambaşkadır — bkz. MADDE E7
     `tradeUpJoker`: kendi kartını verip BİR ÜST NADİRLİKTEN RASTGELE
     kart alırsın. O çalışıyor; eksik olan buydu.)

     FİYAT KARARI — eski kart SATILMIŞ GİBİ işlem görür:
       net = ürünün fiyatı − eski kartın satış değeri
     Gerekçe: rafta yer varken oyuncu bunu zaten iki adımda yapabiliyor
     (tooltip'ten "Sat" → sonra "Satın Al"). Takas yeni bir ekonomi değil,
     o iki adımın tek düğmeye inmiş hâlidir; başka bir fiyat koymak aynı
     sonucu iki farklı fiyattan satmak olurdu. Bu yüzden satış yolu tek
     kalır: `sellJoker` çağrılır — Sigorta Poliçesi (`sellFull`), satış
     kilidi (`noSell`) ve coin sayaçları kendiliğinden doğru işler.
     MADDE E7'nin takası ise bilerek DAHA PAHALIDIR (sat+al yolundan
     yukarıda); orada satın alınan şey karttır değil, ERİŞİMDİR.

     Yeni kart, verilen kartın TAM YERİNE oturur (ana slotta o indekse,
     backup'ta o indekse) — sıralama oyuncunun kurduğu düzendir, takas
     onu karıştırmaz.
     ========================================================================== */

  /* Bu ürün takasla alınabilir mi? Deste jokeri ve Füzyon slot işgal
     etmez, dolayısıyla takas edecekleri bir yer de yoktur. */
  _swapBuyable(item) {
    if (!item || item.sold) return false;
    if (item.key === 'fuzyon') return false;
    return JOKER_DEFS[item.key]?.mech !== 'deck';
  },

  /* UI: "Takas Yap" ekranının listesi. Her satır kendi net fiyatını ve
     yapılamıyorsa NEDENİNİ taşır — düğmeyi gizlemek yerine kilitli
     göstermek projenin her yerindeki desendir. */
  swapBuyOptions(index) {
    const s = this.state;
    const item = s.store?.items[index];
    if (!this._swapBuyable(item)) return [];
    const price = item.price;
    const rows = [];
    const add = (j, where, slotIdx) => {
      const refund = s.sellFull ? jokerPrice(j.key, j.rarity) : jokerSell(j.key, j.rarity);
      const net = Math.max(0, price - refund);
      let error = null;
      if (j.noSell) error = `${j.name} takas edilemez — kilitli.`;
      else if (s.coins + refund < price) error = `Yetersiz coin (${net} gerekli).`;
      rows.push({ jokerId: j.id, key: j.key, name: j.name, rarity: j.rarity,
        where, slotIdx, refund, net, ok: !error, error });
    };
    s.jokers.forEach((j, i) => add(j, 'main', i));
    s.backup.forEach((j, i) => add(j, 'backup', i));
    return rows;
  },

  /* Takasla satın al: `jokerId` verilir, `index`teki ürün onun yerine geçer. */
  swapBuyJoker(index, jokerId) {
    const s = this.state;
    const item = s.store?.items[index];
    if (!item || item.sold) return { ok: false, error: 'Ürün mevcut değil.' };
    if (!this._swapBuyable(item))
      return { ok: false, error: 'Bu kart slot işgal etmez — takasa gerek yok.' };
    let where = 'main', idx = s.jokers.findIndex(x => x.id === jokerId);
    if (idx === -1) { where = 'backup'; idx = s.backup.findIndex(x => x.id === jokerId); }
    if (idx === -1) return { ok: false, error: 'Takas edilecek joker bulunamadı.' };
    const list = where === 'main' ? s.jokers : s.backup;
    const old = list[idx];
    const lock = this.canSellJoker(old.id);
    if (!lock.ok && lock.error) return lock;
    const refund = s.sellFull ? jokerPrice(old.key, old.rarity) : jokerSell(old.key, old.rarity);
    if (s.coins + refund < item.price)
      return { ok: false, error: `Yetersiz coin (${Math.max(0, item.price - refund)} gerekli).` };

    /* Sıra önemli: önce iade, sonra ödeme. Aksi hâlde "eski kartı satınca
       yetecek" durumdaki oyuncu yetersiz coin hatası alırdı. */
    gainCoins(s, refund);
    spendCoins(s, item.price);
    const def = JOKER_DEFS[item.key];
    const j = this._initJoker({
      id: ++_jokerId, key: item.key, name: item.name, desc: item.desc,
      rarity: item.rarity, usesLeft: this._usesFor(def, item.rarity), fresh: true,
    });
    // GDD 7.4 — backup'a giren kart donar; bekleme sınırı satın almadakiyle aynı
    if (where === 'backup') j.waitLeft = j.usesLeft === 1 ? 1 : 3;
    list[idx] = j;
    item.sold = true;
    return { ok: true, placed: where === 'main' ? 'slot' : 'backup',
      gave: old.name, gaveKey: old.key, refund, paid: item.price,
      net: item.price - refund, jokerId: j.id, key: item.key };
  },

  /* Füzyon (GDD 9) — iki jokeri birleştir: 'melt' erir, kalan süresi ve
     TÜM EFEKTLERİ 'keep'e eklenir (keep.fused alt kayıtları, slotRecs()
     üzerinden aranır); Füzyon da tükenir. */
  /* Birleştirmeye aday jokerler: ana slot + BACKUP.
     PLAYTEST 10 · GRUP A (bug) — Füzyon backup slotuna düştüğünde
     kullanılamıyordu: hem `fuseJokers` Füzyon'u YALNIZ `s.jokers` içinde
     arıyordu, hem de UI "Birleştir" eylemini yalnız ana slot kartlarına
     koyuyordu. Backup bir bekleme rafıdır, jokeri işlevsiz kılmaz —
     Füzyon oradan da çalışmalı ve backup'taki jokerler de erime/kalma
     adayı olabilmelidir. */
  fusableJokers() {
    const s = this.state;
    return [...s.jokers, ...s.backup];
  },

  /* Grup F/23 — Füzyon önce BEKLEYEN eylem olarak aranır; eski kayıtlarda
     hâlâ raflarda duruyor olabilir, o yüzden raflar da taranır. */
  findFuzyon() {
    const s = this.state;
    return s.fuzyonPending || this.fusableJokers().find(j => j.key === 'fuzyon') || null;
  },

  /* UI: bekleyen bir Füzyon var mı (birleştirme ekranı yeniden açılabilsin) */
  hasPendingFuzyon() {
    return !!this.state.fuzyonPending;
  },

  /* ============================================================
     PLAYTEST 19 · GRUP E — FÜZYON ARTIK RAFA DA KONABİLİR.
     P17/F23'te Füzyon "tek seferlik eylem" yapılmıştı: ele geçtiği anda
     birleştirme ekranı açılıyor, oyuncu "Şimdi değil" derse `fuzyonPending`
     olarak bekliyordu — ama HER İKİ rafa da hiç giremiyordu. Kullanıcı
     kararı (P19): Füzyon ele girdiğinde üç seçenek sunulur — "Ana Slota
     Ekle", "Backup Slota Ekle", "Kullan (Birleştir)". Bu fonksiyon ilk iki
     seçeneği karşılar; üçüncüsü doğrudan fuseJokers'a gider.
     Raflardaki Füzyon zaten `fusableJokers()` üzerinden bulunur
     (findFuzyon), yani rafa konan Füzyon sonradan da kullanılabilir. */
  placeFuzyon(dest) {
    const s = this.state;
    const j = s.fuzyonPending;
    if (!j) return { ok: false, error: 'Bekleyen bir Füzyon yok.' };
    if (dest === 'main') {
      if (s.jokers.length >= this.slotCap()) return { ok: false, error: 'Ana Slot dolu.' };
      s.jokers.push(j);
    } else if (dest === 'backup') {
      if (s.backup.length >= MAX_BACKUP) return { ok: false, error: 'Backup dolu.' };
      // GDD 7.4 — backup'ta süre donar; bekleme sınırı diğer jokerlerle aynı
      j.waitLeft = j.usesLeft === 1 ? 1 : 3;
      s.backup.push(j);
    } else {
      return { ok: false, error: 'Geçersiz hedef.' };
    }
    s.fuzyonPending = null;
    return { ok: true, placed: dest, jokerId: j.id };
  },

  /* UI: bekleyen Füzyon için hangi raflık hedefler açık? */
  fuzyonDests() {
    const s = this.state;
    return {
      main: s.jokers.length < this.slotCap(),
      backup: s.backup.length < MAX_BACKUP,
      /* "Kullan" ancak Füzyon dışında en az 2 birleştirilebilir joker varsa
         anlamlıdır (biri kalır, biri erir) — backup'takiler de sayılır. */
      fuse: this.fusableJokers().filter(j => j.key !== 'fuzyon').length >= 2,
    };
  },

  fuseJokers(fuzyonId, keepId, meltId) {
    const s = this.state;
    const pool = this.fusableJokers();
    // Grup F/23 — Füzyon raflarda DEĞİL, bekleyen eylem olarak da gelebilir
    const pend = s.fuzyonPending;
    const fz = (pend && pend.id === fuzyonId) ? pend
      : pool.find(j => j.id === fuzyonId && j.key === 'fuzyon');
    const keep = pool.find(j => j.id === keepId);
    const melt = pool.find(j => j.id === meltId);
    if (!fz || !keep || !melt || keep === melt || keep === fz || melt === fz)
      return { ok: false, error: 'Birleştirme için Füzyon dışında iki farklı joker seç.' };
    /* PLAYTEST 8 — GRUP C: süre artık TOPLANMIYOR, MAKSİMUMU alınıyor.
       Eski `+=` iki jokerin ömrünü üst üste bindiriyordu: iki taze Rare'i
       (5+5) birleştirmek 10 raundluk, run'ın yarısını kapsayan bir joker
       üretiyordu — Füzyon'un vaadi "iki efekti tek slotta topla"yken
       fiilen bir de sınırsız ömür makinesiydi. Artık birleşmiş joker,
       kaynaklarından hangisi daha uzun yaşayacaksa o kadar yaşar; efekt
       birleşimi (keep.fused) aynen korunur. */
    const before = keep.usesLeft;
    keep.usesLeft = Math.max(keep.usesLeft, melt.usesLeft);
    const subs = melt.fused || [];
    delete melt.fused;
    keep.fused = [...(keep.fused || []), melt, ...subs];
    // eriyen joker ve Füzyon HER İKİ raftan da düşer (backup dahil)
    s.jokers = s.jokers.filter(j => j !== melt && j !== fz);
    s.backup = s.backup.filter(j => j !== melt && j !== fz);
    if (s.fuzyonPending === fz) s.fuzyonPending = null;   // Grup F/23
    /* Birleşmiş joker backup'ta kaldıysa efekti yine çalışmaz (backup bir
       bekleme rafıdır). Yer varsa ana slota alınır ki birleştirmenin
       sonucu anında hissedilsin; yoksa backup'ta bekler. */
    if (s.backup.includes(keep) && s.jokers.length < this.slotCap()) {
      s.backup = s.backup.filter(j => j !== keep);
      delete keep.waitLeft;
      s.jokers.push(keep);
      this.activateJokerNow(keep, []);
    }
    return { ok: true, note: `⚗ Füzyon: ${melt.name} eridi → ${keep.name} artık onun efektlerini de taşıyor (süre: max(${before}, ${melt.usesLeft}) = ${keep.usesLeft} raund)` };
  },

  /* Ritim Jokeri (GDD 10) — açılım onayı öncesi mini oyun */
  needsRitim() {
    const s = this.state;
    if (!s.staged.length || s.ritimDone) return false;
    // Ritim BOSS Koşulu (Grup F): joker olmasa da her açılımdan önce sekans
    if (this.bossOn() && s.boss?.key === 'ritim') return true;
    return !s.jokersDisabled && this.hasActive('ritim');
  },

  /* Boss varyantında ritim ZORLUĞU tura göre artar (joker varyantı usesLeft'e
     bakar); GDD: "her raund zorluk seviyesi otomatik artar" */
  ritimIsBoss() {
    return this.bossOn() && this.state.boss?.key === 'ritim';
  },

  ritimLevel() {
    if (this.ritimIsBoss()) return Math.max(1, Math.min(3, this.state.turn));
    const j = this.slotRecs().find(x => x.key === 'ritim');
    return j ? Math.max(1, Math.min(3, 4 - j.usesLeft)) : 1;
  },

  setRitimResult(success) {
    const s = this.state;
    s.ritimDone = true;
    /* Boss varyantı (GDD 13.4): tutturursan NORMAL puan alırsın (ekstra bonus
       YOK); kaçırırsan o açılım HİÇ puan vermez ve joker de silinmez. */
    if (this.ritimIsBoss()) {
      s.ritimBonus = 0;
      s.ritimFailed = !success;
      return { ok: true, success, boss: true };
    }
    if (success) {
      const bonus = RITIM_BONUS[this.ritimLevel() - 1];
      s.ritimBonus = bonus;
      return { ok: true, success: true, bonus };
    }
    s.jokers = s.jokers.filter(j => j.key !== 'ritim'); // kombo kaçtı — joker gider (GDD)
    s.ritimBonus = 0;
    return { ok: true, success: false };
  },

  /* Tüccar teklifi kabulü (GDD 10) — offerKey havuzdaki teklifin anahtarı */
  acceptTuccar(offerKey) {
    const s = this.state;
    if (!s.tuccarOffer) return { ok: false, error: 'Aktif bir Tüccar teklifi yok.' };
    // Boss varyantı (Grup F): bedeli öde — reddedersen ceza uygulanır
    if (s.tuccarOffer.boss) {
      const shownB = s.tuccarOffer.options.find(o => o.key === offerKey) || s.tuccarOffer.options[0];
      const defB = TUCCAR_BOSS_OFFERS.find(o => o.key === shownB.key);
      if (!defB) return { ok: false, error: 'Böyle bir teklif yok.' };
      if (!defB.canPay(s)) return { ok: false, error: 'Bu bedeli ödeyemezsin — cezayı seçmen gerek.' };
      const noteB = defB.pay(s, this);
      s.tuccarOffer = null;
      return { ok: true, note: '👹 ' + noteB };
    }
    const shown = s.tuccarOffer.options.find(o => o.key === offerKey)
      || (offerKey == null ? s.tuccarOffer.options[0] : null);
    if (!shown) return { ok: false, error: 'Böyle bir teklif yok.' };
    const def = TUCCAR_OFFERS.find(o => o.key === shown.key);
    if (!def || !def.can(s)) return { ok: false, error: 'Bu teklifi artık karşılayamıyorsun.' };
    const note = def.apply(s, this);
    s.tuccarOffer = null;
    // Grup B/11 — aynı teklif TÜRÜ bu raundta bir daha çıkmaz
    (s.tuccarTaken = s.tuccarTaken || []).push(def.key);
    const tucJ = this.slotRecs().find(j => j.key === 'tuccar');
    if (tucJ) tucJ.refuseStreak = 0; // kabul → sayaç sıfırlanır
    return { ok: true, note: '🐪 ' + note };
  },

  /* Tüccar teklifini reddet — üst üste 2 reddediş Tüccar'ı gönderir (GDD 10) */
  refuseTuccar(offerKey) {
    const s = this.state;
    if (!s.tuccarOffer) return { ok: false, error: 'Aktif bir Tüccar teklifi yok.' };
    /* Boss varyantı (GDD 13.4): "Reddetme hakkı yoktur" — reddetmek Tüccar'ı
       göndermez, teklifin CEZASINI yersin. */
    if (s.tuccarOffer.boss) {
      const shown = s.tuccarOffer.options.find(o => o.key === offerKey) || s.tuccarOffer.options[0];
      const def = TUCCAR_BOSS_OFFERS.find(o => o.key === shown.key);
      s.tuccarOffer = null;
      const note = def ? def.penalty(s, this) : 'Bedel ödenmedi';
      return { ok: true, penalty: true, note: '👹 ' + note };
    }
    s.tuccarOffer = null;
    const tucJ = this.slotRecs().find(j => j.key === 'tuccar');
    if (!tucJ) return { ok: true, note: '🐪 Teklif reddedildi.' };
    tucJ.refuseStreak = (tucJ.refuseStreak || 0) + 1;
    if (tucJ.refuseStreak >= TUCCAR_MAX_REFUSE) {
      // fused alt kayıt da olabilir — hem ana listeden hem füzyondan temizle
      s.jokers = s.jokers.filter(j => j !== tucJ);
      s.backup = s.backup.filter(j => j !== tucJ);
      for (const j of [...s.jokers, ...s.backup])
        if (j.fused) j.fused = j.fused.filter(f => f !== tucJ);
      return { ok: true, gone: true,
        note: `🐪 Tüccar ${TUCCAR_MAX_REFUSE} kez üst üste reddedildi — kervanını topladı ve gitti.` };
    }
    return { ok: true, left: TUCCAR_MAX_REFUSE - tucJ.refuseStreak,
      note: `🐪 Teklif reddedildi. Bir kez daha reddedersen Tüccar gidecek.` };
  },

  moveToMain(jokerId) {
    const s = this.state;
    const idx = s.backup.findIndex(j => j.id === jokerId);
    if (idx === -1) return { ok: false };
    if (s.jokers.length >= this.slotCap()) return { ok: false, error: 'Ana Slot dolu.' };
    const j = s.backup.splice(idx, 1)[0];
    delete j.waitLeft;
    j.fresh = true;
    s.jokers.push(j);
    const notes = [];
    this.activateJokerNow(j, notes);   // Grup G (bug) — bkz. aşağıdaki not
    return { ok: true, name: j.name, notes };
  },

  /* ============================================================
     PLAYTEST 10 · GRUP G (bug) — BACKUP'TAN ANA SLOTA GEÇEN JOKER
     RAUND İÇİNDE AKTİFLEŞMİYORDU
     Kök neden: bazı jokerlerin efekti tek başına `slotRecs()` taramasıyla
     çalışmaz; RAUND BAŞINDA bir KURULUM adımı ister (Dedikodu Masası'nın
     3 taşlık masası, Hipnotizör'ün trans sayısı, Bukalemun'un rengi,
     Trade Jokeri'nin fazı, Pandora'nın açılışı). `moveToMain` jokeri
     listeye ekliyordu ama bu kurulum yalnız `_startRound` içinde
     yapıldığından, raund ortasında gelen joker "sessiz" kalıyordu —
     Dedikodu Masası'nda masa hiç kurulmadığı için özellik hiç
     görünmüyordu (kullanıcı raporu). Sorun jokere özel DEĞİL, geçiş
     mekanizmasının geneliydi.
     Çözüm: kurulum adımları tek bir yerde toplandı; hem raund başı hem de
     raund içi aktivasyon buradan geçer.
     ============================================================ */
  activateJokerNow(j, notes) {
    if (!j || this.state.status !== 'playing') return;
    const s = this.state;
    if (j.key === 'dedikodu' && !(s.gossipTable || []).length)
      this._setupGossipTable(notes);
    if (j.key === 'hipnotizor' && !s.hipnoNumber) {
      s.hipnoNumber = 1 + Math.floor(this.rng() * 13);
      notes.push(`🌀 Toplu Hipnoz: ${s.hipnoNumber}'ler transta — açılımda çift değer!`);
    }
    if (j.key === 'terzi' && !j.color)
      this.setTerziColor(j, COLORS[Math.floor(this.rng() * 4)]);
    /* GRUP D (P20) — joker raund ortasında Ana Slot'a girdiyse piyasa
       hemen açılır; yoksa oyuncu o raundu etkisiz geçirirdi. */
    if (j.key === 'tradeJokeri' && !this.state.borsa) {
      const s = this.state;
      const pool = [...BORSA_TYPES];
      const up = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      const down = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      s.borsa = { up, down, flat: pool[0] };
      s.borsaMelds = 0;
      j.phase = 'market';
      notes.push(`📈 Piyasa açıldı: ${TYPE_TR[up]} YÜKSELİŞTE (hisseleri temettü öder) · `
        + `📉 ${TYPE_TR[down]} DÜŞÜŞTE (hisselerinin yarısı yanar)`);
    }
    if (j.key === 'truva' && !j.revealed) this._revealPandora(j, notes);
  },

  /* Satış kilidi (Grup B) — Lanetli Kaptan bir kez kurtardıysa artık
     satılamaz; yalnız süresi dolunca ya da run bitince gider. */
  canSellJoker(jokerId) {
    const s = this.state;
    const j = [...s.jokers, ...s.backup, ...s.deckJokers].find(x => x.id === jokerId);
    if (!j) return { ok: false };
    if (j.noSell)
      return { ok: false, error: `${j.name} satılamaz — Game Over'dan kurtardıktan sonra kilitlendi.` };
    return { ok: true };
  },

  sellJoker(jokerId) {
    const s = this.state;
    const lock = this.canSellJoker(jokerId);
    if (!lock.ok && lock.error) return lock;
    let idx = s.jokers.findIndex(j => j.id === jokerId);
    let j;
    if (idx !== -1) j = s.jokers.splice(idx, 1)[0];
    else if ((idx = s.backup.findIndex(x => x.id === jokerId)) !== -1) {
      j = s.backup.splice(idx, 1)[0];
    } else if ((idx = s.deckJokers.findIndex(x => x.id === jokerId)) !== -1) {
      j = s.deckJokers.splice(idx, 1)[0]; // deste jokeri de satılabilir (GDD 6.8)
    } else {
      return { ok: false };
    }
    /* GRUP I (P20) — SİGORTA POLİÇESİ: satış değeri alış fiyatına eşitlenir. */
    const gain = s.sellFull ? jokerPrice(j.key, j.rarity) : jokerSell(j.key, j.rarity);
    gainCoins(s, gain);
    return { ok: true, gain, name: j.name, full: !!s.sellFull };
  },

  /* ==========================================================================
     MADDE E7 (kullanıcı kararı 2026-09-09) — TAKAS (bir üst nadirliğe yükselt)
     Elindeki jokeri ver + farkı öde → bir üst nadirlikten RASTGELE bir kart
     al. Yeni kart TAM SÜREYLE gelir ve verilen kartın yerine geçer.

     NEDEN: joker her raund yaşlandığı için "süresi bitmek üzere olan kart"
     ölü sermayedir; satış yalnız %50 iade verdiğinden oyuncunun elinde
     kalan tek seçenek zarardı. Takas onu köprüye çevirir.

     FİYAT = hedef nadirliğin liste fiyatı − verilen kartın SATIŞ değeri.
       Common→Rare       10 − 2 =  8
       Rare→Legendary    14 − 5 =  9
       Legendary→Mythic  20 − 7 = 13
     Yani takas, "sat + yenisini al" yolundan hep biraz pahalıdır (o yol
     rastgele değil SEÇEREK alır); takasın sattığı şey nakit değil ERİŞİM.

     İki kapı bilinçli:
     · Epic (boss ödülü) takas edilemez — store ekonomisinin parçası değil.
     · JOKER_PRICE_OVERRIDE kartları (The World, Pinky) HEDEF havuzunda
       yoktur: liste fiyatı 20 üzerinden hesaplanan bir takasla 30 coinlik
       kart çıkarmak fiyat istisnasını delerdi.
     ========================================================================== */
  TRADE_UP_NEXT: { common: 'rare', rare: 'legendary', legendary: 'mythic' },
  tradeUpInfo(jokerId) {
    const s = this.state;
    const j = [...s.jokers, ...s.backup].find(x => x.id === jokerId);
    if (!j) return { ok: false };
    if (j.noSell) return { ok: false, error: `${j.name} takas edilemez — kilitli.` };
    const to = this.TRADE_UP_NEXT[j.rarity];
    if (!to) return { ok: false, error: 'Bu nadirlik takas edilemez.' };
    // MADDE D4: takas farkı da mod fiyat çarpanını okur (satış değeri çarpılmaz).
    const cost = Math.max(1, this.modePrice(RARITY[to].price) - jokerSell(j.key, j.rarity));
    return { ok: true, cost, from: j.rarity, to, name: j.name };
  },
  tradeUpJoker(jokerId) {
    const s = this.state;
    const info = this.tradeUpInfo(jokerId);
    if (!info.ok) return info;
    if (s.coins < info.cost) return { ok: false, error: `Yetersiz coin (${info.cost} gerekli).` };
    let list = s.jokers, idx = s.jokers.findIndex(x => x.id === jokerId);
    if (idx === -1) { list = s.backup; idx = s.backup.findIndex(x => x.id === jokerId); }
    if (idx === -1) return { ok: false };
    const old = list[idx];
    const ownedKeys = new Set([...s.jokers, ...s.backup, ...s.deckJokers]
      .filter(x => x.id !== jokerId).map(x => x.key));
    let cand = this.jokerPool(d => d.rarity === info.to
      && !ownedKeys.has(d.key) && JOKER_PRICE_OVERRIDE[d.key] == null);
    if (!cand.length) cand = this.jokerPool(d => d.rarity === info.to
      && JOKER_PRICE_OVERRIDE[d.key] == null);
    if (!cand.length) return { ok: false, error: 'Takas edilecek kart kalmadı.' };
    const def = cand[Math.floor(this.rng() * cand.length)];
    spendCoins(s, info.cost);
    list[idx] = this._initJoker({ id: ++_jokerId, key: def.key, name: def.name, desc: def.desc,
      rarity: info.to, usesLeft: this._usesFor(def, info.to), fresh: true });
    return { ok: true, cost: info.cost, gave: old.name, got: def.name, rarity: info.to };
  },

  /* GRUP C (P22) — DEĞNEK SATIŞI.
     Değnek envanteri eskiden tek yönlüydü: alınır, kullanılır, başka çıkışı
     yoktu. Envanter 2-4 slotluk dar bir yer olduğu için "işime yaramayan
     değnek" bir slotu run boyunca ölü tutuyordu. Artık satılabilir.
     ⚠ Sigorta Poliçesi (`sellFull`) DEĞNEKLERE İŞLEMEZ — joker satışını
     alış fiyatına eşitleyen o yükseltme, Anarşist indirimiyle birleşince
     değnekte koşulsuz kâr eden bir al-sat döngüsü doğururdu. */
  consumSellPrice(key) {
    const def = CONSUMABLES[key];
    if (!def) return 0;
    return Math.max(1, Math.floor((def.price || 5) * CONSUM_SELL_RATE));
  },

  sellConsumable(index) {
    const s = this.state;
    const key = (s.consumables || [])[index];
    if (key == null) return { ok: false, error: 'Değnek bulunamadı.' };
    const def = CONSUMABLES[key];
    if (!def) { s.consumables.splice(index, 1); return { ok: false, error: 'Bilinmeyen değnek (eski kayıt).' }; }
    const gain = this.consumSellPrice(key);
    s.consumables.splice(index, 1);
    gainCoins(s, gain);
    return { ok: true, gain, key, name: def.name };
  },

  /* GRUP E (kullanıcı kararı 2026-09-06) — TRAINER'DA REROLL SINIRSIZDIR.
     Trainer bir test tezgâhıdır: hak da coin de tüketilmez, store
     istendiği kadar çevrilir. Normal oyunda kural aynen durur
     (3 coin · raund başına 1 hak). Tek kapı burasıdır; UI de aynı
     bayrağı (`Game.rerollFree()`) okur, iki yerde ayrı kural yazılmaz. */
  rerollFree() { return !!this.trainerMode; },

  rerollStore() {
    const s = this.state;
    if (!s.store) return { ok: false, error: 'Store yok.' };
    if (this.rerollFree()) {
      s.store = this._generateStore(this._locksFrom(s.store));
      s.store.rerollUsed = false;      // hak tükenmez
      return { ok: true, free: true };
    }
    /* MADDE E2 — catch-up rafı açıldıysa o store'un İLK reroll'ü bedava. */
    if (s.store.freeReroll) {
      s.store.freeReroll = false;
      const keep = this._locksFrom(s.store);
      const cnt = s.store.rerollCount || 0;
      s.store = this._generateStore(keep);
      s.store.rerollCount = cnt;      // bedava reroll merdiveni ilerletmez
      return { ok: true, free: true };
    }
    const cost = this.rerollCost();
    if (s.coins < cost) return { ok: false, error: `Yetersiz coin (${cost} gerekli).` };
    spendCoins(s, cost);
    const keep = this._locksFrom(s.store);
    const cnt = (s.store.rerollCount || 0) + 1;
    s.store = this._generateStore(keep);
    s.store.rerollCount = cnt;
    s.store.rerollUsed = true;        // eski kayıt/UI uyumu için korunuyor
    return { ok: true, cost };
  },

  /* ==========================================================================
     MADDE E6 (kullanıcı kararı 2026-09-09) — ARTAN MALİYETLİ REROLL
     Eski kural: raund başına TEK reroll, sabit 3 coin. Playtest 17'de fiyat
     bilerek sabit bırakılmıştı ("sorun reroll değil gelirdi"); o teşhis
     doğruydu ama HAK SINIRI ayrı bir sorundu — kötü bir raf gelince
     oyuncunun yapabileceği hiçbir şey kalmıyordu.
     Yeni kural: hak sınırı yok, fiyat aynı store içinde tırmanır. Her yeni
     store 3 coinden başlar. Fakire zarar vermez (ilk reroll hâlâ 3), parası
     olana derinlemesine arama kaldıracı verir — onaylanan E1 (faiz) ile
     birlikte biriktirmenin ikinci kullanım yoludur.
     ========================================================================== */
  /* UI'ın kart fiyatını motorla AYNI yerden okuması için (MADDE E10 fiyat
     istisnası yüzünden fiyat artık yalnız rarity'den türetilemiyor). */
  jokerPriceOf(key, rarity) { return this.modePrice(jokerPrice(key, rarity)); },
  jokerSellOf(key, rarity) { return jokerSell(key, rarity); },

  /* ==========================================================================
     MADDE D4 — MOD FİYAT ÇARPANI (Hızlı Run'da %10 zam, kullanıcı kararı:
     "şimdilik %10, sonra test üzerinden değiştireceğim").
     YUKARI yuvarlanır: %10 zam 5 coinlik Common'ı 5.5 yapar ve aşağı
     yuvarlansa hiç zam olmazdı — en ucuz kalemde zammın kaybolması,
     zammın asıl hissedilmesi gereken erken oyunu ıskalardı.
     SATIŞ FİYATI ÇARPILMAZ: satış zaten alışın yarısıdır ve onu da
     büyütmek "pahalı al, pahalı sat" ile zammı kendiliğinden iptal ederdi.
     REROLL ÇARPILMAZ: o bir hizmet değil mal değildir ve merdiveni
     (3-5-8-12) ayrıca kalibre edilmiştir.
     ========================================================================== */
  modePrice(n) {
    const m = runModeOf(this.state).priceMult;
    return m === 1 ? n : Math.max(1, Math.ceil(n * m));
  },

  REROLL_LADDER: [3, 5, 8, 12],
  rerollCost() {
    const s = this.state;
    if (this.rerollFree()) return 0;
    if (s?.store?.freeReroll) return 0;
    const n = s?.store?.rerollCount || 0;
    return this.REROLL_LADDER[Math.min(n, this.REROLL_LADDER.length - 1)];
  },

  /* GRUP G (kullanıcı isteği 2026-09-06) — JOKER SIRALAMA.
     Oyuncu raund içindeyken ana slottaki / backup'taki jokerleri
     sürükleyip yeniden dizebilir. Bu bir DÜZEN aracıdır: hiçbir kartın
     gücünü, süresini veya tetiklenmesini değiştirmez.
     Tek yan etkisi şudur ve bilinçlidir: aynı anahtardan İKİ joker varsa
     "ilk bulunan" artık oyuncunun kendi dizdiği sıradadır. */
  reorderJoker(where, fromIdx, toIdx) {
    const s = this.state;
    const list = where === 'backup' ? s.backup : s.jokers;
    if (!Array.isArray(list) || !list.length) return { ok: false };
    if (!Number.isInteger(fromIdx) || fromIdx < 0 || fromIdx >= list.length)
      return { ok: false, error: 'Geçersiz joker.' };
    const to = Math.max(0, Math.min(list.length - 1, toIdx));
    if (to === fromIdx) return { ok: false, same: true };
    const [j] = list.splice(fromIdx, 1);
    list.splice(to, 0, j);
    return { ok: true, key: j.key, from: fromIdx, to };
  },

  /* TANRININ ELİ (P31 · Grup E) — bekleyen seçimli çekişi tamamlar.
     `ids` destedeki taşların kimlikleridir; en fazla `godPick.n` taş.
     Deste jokerleri seçilemez (eline gelişleri tur başı etkinleşmesine
     bağlı). Oyuncu hakkından az seçerse kalan hak yanar. Kara Kedi (joker
     ve boss) ve boss'un çekiş etkileri seçilen taşlara da uygulanır. */
  godPickTake(ids) {
    const s = this.state;
    if (!s.godPick) return { ok: false, error: 'Bekleyen bir Tanrının Eli seçimi yok.' };
    const want = [...new Set(ids || [])];
    if (want.length > s.godPick.n)
      return { ok: false, error: `En fazla ${s.godPick.n} taş seçebilirsin.` };
    const room = Math.max(0, MAX_HAND - this.realHandCount());
    const picked = [];
    for (const id of want.slice(0, room)) {
      const i = s.deck.findIndex(t => t.id === id && !t.jokerTile);
      if (i < 0) return { ok: false, error: 'Seçilen taş destede yok.' };
      picked.push(s.deck.splice(i, 1)[0]);
    }
    const events = [];
    if (this.hasActive('karaKedi')) {
      const minPool = s.deck.filter(t => !t.jokerTile && !t.fakeOkey && !this.isOkeyTile(t) && !t.special);
      const minVal = minPool.length ? Math.min(...minPool.map(t => t.number)) : Infinity;
      for (const t of picked) {
        if (t.jokerTile || t.fakeOkey || this.isOkeyTile(t) || t.special) continue;
        if (t.number === minVal && minVal < 12) {
          events.push(`Kara Kedi: ${COLOR_TR[t.color]} ${t.number} → 12'ye dönüştü`);
          t.number = 12; retune(t, 'karaKedi');
        }
      }
    }
    if (this.bossOn() && s.boss.key === 'karaKedi' && picked.length) this._karaKediBite(picked, events);
    if (this.bossOn() && picked.length) this._bossOnDraw(picked, events);
    s.hand.push(...picked);
    const n = s.godPick.n;
    s.godPick = null;
    events.push(`🤲 Tanrının Eli: ${picked.length}/${n} taş seçip çektin`);
    this._handAudit(events);
    return { ok: true, drawn: picked.map(t => t.id), events };
  },

  /* GRUP H — KUZEY YILDIZI: sıradaki seçim turunu kurar.
     Deste tükendiyse ya da el tavandaysa tur harcanmaz gibi görünmesin
     diye sebep AÇIKÇA yazılır (taş sessizce kaybolmaz). */
  _yildizDeal(events) {
    const s = this.state;
    s.yildizPick = null;
    if (!(s.yildizQueue > 0)) return null;
    if (this.realHandCount() >= MAX_HAND) {
      s.yildizQueue = 0;
      if (events) events.push(`⭐ Yıldız Taşı: ıstaka dolu (${MAX_HAND}) — bu tur taş alınamadı`);
      return null;
    }
    const pool = (s.deck || []).filter(t => !t.jokerTile);
    if (!pool.length) {
      s.yildizQueue = 0;
      if (events) events.push('⭐ Yıldız Taşı: destede taş kalmadı');
      return null;
    }
    const opts = [];
    for (let i = 0; i < YILDIZ_SHOW && pool.length; i++) {
      const t = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      s.deck = s.deck.filter(x => x !== t);
      opts.push(t);
    }
    s.yildizQueue--;
    s.yildizPick = { options: opts };
    if (events) events.push(`⭐ Kuzey Yıldızı: ${opts.length} taş açıldı — birini seç`);
    return s.yildizPick;
  },

  /* Seçilen taşı ELE alır, kalanları desteye rastgele karıştırır. */
  yildizTake(tileId) {
    const s = this.state;
    if (!s.yildizPick) return { ok: false, error: 'Açık bir Kuzey Yıldızı seçimi yok.' };
    const opts = s.yildizPick.options;
    const pick = opts.find(t => t.id === tileId);
    if (!pick) return { ok: false, error: 'Bu taş seçeneklerde yok.' };
    const rest = opts.filter(t => t !== pick);
    const events = [];
    if (this.realHandCount() >= MAX_HAND) {
      for (const t of opts) s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, t);
      s.yildizPick = null;
      s.yildizQueue = 0;
      return { ok: false, error: `Istaka dolu (${MAX_HAND}) — taş alınamadı.` };
    }
    pick.star = true;                 // ıstakada rozetle işaretlenir
    s.hand.push(pick);
    for (const t of rest) s.deck.splice(Math.floor(this.rng() * (s.deck.length + 1)), 0, t);
    s.yildizPick = null;
    events.push(`⭐ Kuzey Yıldızı: ${COLOR_TR[pick.color]} ${pick.number} elini aldı`);
    const next = this._yildizDeal(events);
    return { ok: true, took: pick.id, events, more: !!next };
  },

  /* Elden geçerli kombinasyon grupları çıkar (greedy, kalan serbest).
     priority: tür sırası — basılan sıralama butonunun türü önce gelir.
     Okeyler gruplamaya SOKULMAZ (her yere uyarlar); ayrıca döner. */
  _extractGroups(tiles, priority) {
    let rest = tiles.filter(t => !this.isOkeyTile(t));
    const okeys = tiles.filter(t => this.isOkeyTile(t));
    const groups = [];
    const takers = {
      sirali: () => {
        for (const color of COLORS) {
          const seen = new Set();
          const same = rest
            .filter(t => t.color === color && !seen.has(t.number) && seen.add(t.number))
            .sort((a, b) => a.number - b.number);
          let run = [];
          const flush = () => {
            if (run.length >= 3) {
              groups.push([...run]);
              for (const t of run) rest = rest.filter(x => x !== t);
            }
            run = [];
          };
          for (const t of same) {
            if (run.length && t.number !== run[run.length - 1].number + 1) flush();
            run.push(t);
          }
          flush();
        }
      },
      per: () => {
        const free = this._freePerColors();
        const byNum = groupBy(rest, t => t.number);
        // Gruplar SAYI SIRASIYLA çıkmalı (regresyon düzeltmesi 2026-07-08:
        // Map ekleme sırası = el sırasıydı, per grupları karışık diziliyordu)
        const nums = [...byNum.keys()].sort((a, b) => a - b);
        for (const num of nums) {
          const arr = byNum.get(num);
          while (true) {
            const pick = [];
            for (const t of arr) {
              if (!rest.includes(t) || pick.includes(t)) continue;
              if (free !== true && pick.some(p => p.color === t.color && t.color !== free)) continue;
              pick.push(t);
              if (pick.length === 4) break;
            }
            if (pick.length < 3) break;
            pick.sort((a, b) => colorIdx(a.color) - colorIdx(b.color));
            groups.push(pick);
            for (const t of pick) rest = rest.filter(x => x !== t);
          }
        }
      },
      cift: () => {
        const byKey = groupBy(rest, t => t.color + ':' + t.number);
        const entries = [...byKey.values()]
          .sort((a, b) => a[0].number - b[0].number || colorIdx(a[0].color) - colorIdx(b[0].color));
        for (const arr of entries) {
          const avail = [...arr];
          while (avail.length >= 2) {
            const pair = avail.splice(0, 2);
            groups.push(pair);
            for (const t of pair) rest = rest.filter(x => x !== t);
          }
        }
      },
    };
    for (const kind of priority) takers[kind]();
    return { groups, okeys, rest };
  },

  /* Sıralama v3 (2026-07-09, kullanıcı kararı): kombinasyon gruplaması
     TAMAMEN KALDIRILDI — butonlar artık fiziksel Okey ıstakası gibi HAM
     diziliş araçlarıdır:
       'rank' → sayıya göre (1,1,1,2,2,3…; aynı sayılar yan yana)
       'suit' → renge göre grupla, renk içinde sayıya göre
     Deste jokeri taşları (sayısı/rengi yok) en sona dizilir. Sıralama
     ıstakayı soldan itibaren KOMPAKT doldurur (t.slot 0..n-1). */
  applySort(kind) {
    const s = this.state;
    const specials = s.hand.filter(t => t.jokerTile);
    const normal = s.hand.filter(t => !t.jokerTile);
    if (kind === 'suit')
      normal.sort((a, b) => colorIdx(a.color) - colorIdx(b.color) || a.number - b.number);
    else // 'rank'
      normal.sort((a, b) => a.number - b.number || colorIdx(a.color) - colorIdx(b.color));
    s.hand = [...normal, ...specials];
    s.hand.forEach((t, i) => { t.slot = i; }); // serbest yerleşim sıfırlanır
  },

  /* Istaka içinde elle taşıma (drag & drop) — SERBEST YERLEŞİM (2026-07-09):
     taş, ıstakanın istenen HÜCRESİNE bırakılır ve orada kalır (t.slot).
     Hücre doluysa iki taş yer değiştirir. Boşluklar korunur — taşlar
     artık sola sabitlenmez. */
  moveTile(tileId, toSlot) {
    const s = this.state;
    const t = s.hand.find(x => x.id === tileId);
    if (!t || !Number.isInteger(toSlot) || toSlot < 0) return;
    const other = s.hand.find(x => x !== t && x.slot === toSlot);
    if (other) other.slot = t.slot; // takas
    t.slot = toSlot;
  },

  /* ---------- Kayıt / devam (pause → ana menü akışı) ----------
     Map içeren alanlar (staged/opened/prevOpen combos.values) özel
     işaretle serileştirilir. */
  serialize() {
    return JSON.stringify(this.state, (k, v) => (v instanceof Map ? { __map: [...v] } : v));
  },

  restore(json) {
    const st = JSON.parse(json, (k, v) => (v && v.__map ? new Map(v.__map) : v));
    /* Grup A göçü (2026-08-23): "Chapter" terimi "Stage" oldu. Eski
       kayıtlarda alan adları hâlâ chapter*; tek noktada göç ettirilir. */
    if (st.stage == null && st.chapter != null) st.stage = st.chapter;
    if (st.roundInStage == null && st.roundInChapter != null) st.roundInStage = st.roundInChapter;
    if (st.trainerStages == null && st.trainerChapters != null) st.trainerStages = st.trainerChapters;
    delete st.chapter; delete st.roundInChapter; delete st.trainerChapters;
    /* GRUP F göçü (P22): "Çelik Taş" → "Kara Delik Taşı". Hem kalıcı
       kayıtlar hem de raund ortasında kaydedilmiş taş nesneleri çevrilir;
       ayrıca `sid`i olmayan eski kayıtlara kimlik verilir (yoksa yoğunluk
       hiçbir taşa bağlanamaz). Sıra ÖNEMLİ: sid'ler yazıldıktan sonra
       destedeki/eldeki taşlara aynı sid'ler geri dağıtılamaz — eski
       kayıtta yoğunluk zaten yoktur, taban puanla devam ederler. */
    st.specialTiles = (st.specialTiles || []).map((x) => (x.kind === 'celik'
      ? { ...x, kind: 'karaDelikTasi' } : x));
    let _sq = st.spSeq || 0;
    for (const x of st.specialTiles) if (x.sid == null) x.sid = ++_sq;
    st.spSeq = _sq;
    /* P42 göçü: Geniş Kemer ve Tacir Kartı yükseltmeleri silindi. Kayıtta
       bekleyen ödül çarkı onlardan birini taşıyorsa anahtar düşülür — yoksa
       ödül ekranı olmayan bir tanımı çizmeye çalışırdı. Daha önce alınmış
       olanların kalıcı etkisi (consumSlotBonus / slotBonus) aynen kalır. */
    if (st.upgradeOffer) {
      for (const f of ['rolled', 'options'])
        if (Array.isArray(st.upgradeOffer[f])) st.upgradeOffer[f] = st.upgradeOffer[f].filter(k => UPGRADE_DEFS[k]);
    }
    {
      const zones = [st.deck, st.hand, st.discardPile, st.gossipTable, st.bungiePending];
      for (const list of [st.opened, st.prevOpen, st.staged, st.islemeler])
        for (const c of (list || [])) zones.push(c && c.tiles);
      for (const arr of zones)
        for (const t of (arr || [])) if (t && t.special === 'celik') t.special = 'karaDelikTasi';
    }
    // Grup K göçü: eski kayıtların tanımsız tüketilebilirleri düşür
    /* Bu süzgeç P28'de bir kartı daha düşürür: `nefesIksiri`. O anahtarlı
       kart yeniden ADLANDIRILMADI, oyundan ÇIKARILDI (yerine `ferman`
       geldi, bkz. CONSUMABLES notu). Eski kayıtta duruyorsa envanterden
       sessizce düşer — ölü kart slot işgal etmez. */
    st.consumables = (st.consumables || []).filter(k => CONSUMABLES[k]);
    /* FERMAN (P28 · Grup F) — eski kayıtlarda bu üç alan hiç yok, yalnız
       yokluğunda varsayılan yazılır. P28 SONRASI bir kayıtta `bossVoided`
       true ise OLDUĞU GİBİ KORUNUR: ferman zaten işlemiş, boss kurulumu
       hiç yapılmamıştır; false'a çekmek raundun ortasında koşulu geri
       açardı. Aynı şekilde harcanmamış `fermanPending` de taşınır. */
    /* Grup H (P28) — eski kayıtlarda mıknatıs alanı yok; ayrıca tavan
       ileride düşerse fazlası kırpılır (consumSlotBonus kalıbı). */
    if (!Array.isArray(st.magnets)) st.magnets = [];
    if (st.magnets.length > MAGNET_MAX) st.magnets = st.magnets.slice(0, MAGNET_MAX);
    if (st.fermanUsed == null) st.fermanUsed = 0;
    if (st.fermanPending == null) st.fermanPending = false;
    if (st.bossVoided == null) st.bossVoided = false;
    /* Silinen joker göçü (2026-09-10): common havuzundan 10 kart çıkarıldı
       ve Temiz Açılım'ın yerini İki Yüzlü aldı. Eski bir kayıtta bu
       anahtarlar duruyor olabilir; efekt döngüsü tanımsız kartı zaten
       atlıyor (bkz. _applyJokers `if (!def…) continue`) ama kart slotta
       ÖLÜ bir yer kaplar ve satılamaz/görüntülenemez hâlde kalırdı.
       Tüketilebilirlerdeki kalıbın aynısıyla düşürülürler. */
    for (const f of ['jokers', 'backup', 'deckJokers'])
      st[f] = (st[f] || []).filter(j => j && JOKER_DEFS[j.key]);
    if (st.fuzyonPending && !JOKER_DEFS[st.fuzyonPending.key]) st.fuzyonPending = null;
    /* P30 göçü — Robin Hood ve Newton silindi. Füzyon alt kayıtlarında ve
       Vasiyet mirasında da kalmış olabilirler; aynı süzgeçten geçerler. */
    for (const f of ['jokers', 'backup'])
      for (const j of st[f]) {
        if (j.fused) j.fused = j.fused.filter(r => r && JOKER_DEFS[r.key]);
        for (const r of [j, ...(j.fused || [])])
          if (r.legacy) r.legacy = r.legacy.filter(x => x && JOKER_DEFS[x.key]);
      }
    if (st.umutRunUsed == null) st.umutRunUsed = false;
    if (st.ipotekDebt == null) st.ipotekDebt = false;
    if (st.ipotekPayRound === undefined) st.ipotekPayRound = null;
    /* GRUP D göçü (P22): taban 3→2, tavan 5→4. Eski kayıtlarda hem
       `consumSlotBonus` hem de envanterin kendisi yeni tavanı aşabilir;
       ikisi de burada kırpılır, yoksa UI kapasiteden fazla kart çizer. */
    st.consumSlotBonus = Math.min(CONSUM_SLOT_MAX - MAX_CONSUMABLES,
      Math.max(0, st.consumSlotBonus || 0));
    if (st.consumables.length > CONSUM_SLOT_MAX)
      st.consumables = st.consumables.slice(0, CONSUM_SLOT_MAX);
    if (!st.tileMods) st.tileMods = [];
    if (st.storeTilePick === undefined) st.storeTilePick = null;   // P29 · Grup O
    if (st.permTurns == null) st.permTurns = 0; // Grup H — eski kayıt uyumu
    /* GRUP I (P20) — yeni stage sonu güçlendirmeleri */
    if (st.permRawBonus == null) st.permRawBonus = 0;
    if (st.permComboBonus == null) st.permComboBonus = 0;
    if (st.sellFull == null) st.sellFull = false;
    if (st.secondChance == null) st.secondChance = 0;
    /* PLAYTEST 25 göçü — E2 catch-up ve E6 reroll merdiveni alanları.
       Eski kayıtta yoklar; sıfırdan başlarlar (oyuncu lehine). */
    if (st.catchUpStage == null) st.catchUpStage = 0;
    if (st.catchUpAt == null) st.catchUpAt = -1;
    if (st.bonds == null) st.bonds = 0;   // MADDE E9
    if (st.store) {
      if (st.store.rerollCount == null) st.store.rerollCount = st.store.rerollUsed ? 1 : 0;
      if (st.store.freeReroll == null) st.store.freeReroll = false;
    }
    /* GRUP E göçü (P22): eski kayıtta bayrak yok. Hakkı DURAN oyuncunun
       zaten bir kez almış olduğu kesindir; hakkı bitmiş olanı ayırt
       edemeyiz, o yüzden en fazla bir kez daha teklif edilebilir. */
    if (st.secondChanceTaken == null) st.secondChanceTaken = (st.secondChance || 0) > 0;
    if (st.consumSlotBonus == null) st.consumSlotBonus = 0; // Grup D (P8)
    if (st.permTargetCut == null) st.permTargetCut = 0;     // Grup D (P8)
    if (st.permTargetUp == null) st.permTargetUp = 0;       // P31 · Grup A — The World
    if (st.godPick === undefined) st.godPick = null;        // P31 · Grup E
    if (st.crownId === undefined) st.crownId = null;        // P31 · Grup H
    if (st.appleEaten == null) st.appleEaten = false;       // P31 · Grup I
    /* Grup E (P9): Usta Eli artık carpanStep değil carpanScale. Eski
       kayıtlarda usta ile birikmiş basamaklar carpanStep'te duruyor; onlar
       Altın Oran basamağı gibi çalışmaya devam eder (oyuncudan bir şey
       geri alınmaz), yeni alımlar carpanScale'e yazılır. */
    if (st.carpanScale == null) st.carpanScale = 0;
    /* Grup B (P18): eski kayıtlarda Altın Oran kullanımları carpanStep'e
       yazılmıştı; sayacı sıfırdan başlatıyoruz ki oyuncu yeni (doğru) etkiyi
       kullanabilsin — eski basamakları da geri almıyoruz. */
    if (st.altinOranCount == null) st.altinOranCount = 0;
    /* GRUP A (P20) — Terazi yeniden tasarlandı; eski kayıtlarda bu alanlar yok */
    if (st.teraziRoundMult == null) st.teraziRoundMult = 0;
    if (st.teraziIslekNext == null) st.teraziIslekNext = 0;
    if (st.teraziIslekTurn == null) st.teraziIslekTurn = 0;
    if (st.teraziTurnGain === undefined) st.teraziTurnGain = null;   // P29 · Grup J
    /* GRUP D (P20) — Trade Jokeri borsaya çevrildi; eski kayıtta piyasa yok */
    if (st.borsa === undefined) st.borsa = null;
    if (st.borsaMelds == null) st.borsaMelds = 0;
    /* Grup G (P19) — The Cheating yeniden tasarlandı; eski kayıtlarda bu
       alanlar hiç yoktu. Sıfırdan başlatılır, kimseden bir şey geri
       alınmaz (eski jokerin `risk` değeri varsa olduğu gibi kalır). */
    if (st.cheatBank == null) st.cheatBank = 0;
    /* GRUP G (P20) — The Cheating taş çalmaya çevrildi */
    if (!Array.isArray(st.cheatStolen)) st.cheatStolen = [];
    if (st.cheatRisk == null) st.cheatRisk = 0;      // P35 · Grup H
    if (st.cheatGain == null) st.cheatGain = 0;
    st.cheatArmed = !!st.cheatArmed;
    if (!Array.isArray(st.bossCheatBag)) st.bossCheatBag = [];
    if (st.bossCheatTook == null) st.bossCheatTook = 0;
    if (!Array.isArray(st.cheatFlash)) st.cheatFlash = [];
    // Grup B (P25) — tanı kayıtları eski kayıtlarda yok
    if (!Array.isArray(st.turnTrace)) st.turnTrace = [];
    if (!Array.isArray(st.integrityLog)) st.integrityLog = [];
    if (st.bossCheatPlan === undefined) st.bossCheatPlan = null;
    if (st.bossCheatStats === undefined) st.bossCheatStats = null;
    if (st.slotBonus == null) st.slotBonus = 0;   // Grup L (P9)
    if (!st.gossipTable) st.gossipTable = [];   // Grup F — eski kayıt uyumu
    delete st.leakItem;                        // eski Dedikodu mekaniği kaldırıldı
    // Grup D: eski kayıtlardaki tek `store.pack` → `store.packs` dizisi
    if (st.store && !st.store.packs) {
      st.store.packs = st.store.pack ? [{ kind: 'special', ...st.store.pack }] : [];
      delete st.store.pack;
    }
    if (st.store?.packs) for (const p of st.store.packs) if (!p.kind) p.kind = 'special';
    this.state = st;
    /* id sayaçlarını mevcut kayıttaki en büyük id'nin üstüne taşı.
       PLAYTEST 16 · GRUP E/F — KÖK NEDEN DÜZELTMESİ: bu tarama eskiden
       yalnız hand/deck/discard/opened/prevOpen/staged'e bakıyordu;
       `islemeler` (o tur işlemeye konmuş taşlar), `gossipTable` (Dedikodu
       Masası) ve `bungiePending` KAPSAM DIŞIYDI. En büyük id oralardan
       birindeyse `_tileId` OLDUĞUNDAN KÜÇÜK geri yükleniyor ve sonradan
       üretilen ilk taşlar MEVCUT bir taşla AYNI id'yi alıyordu.
       Sonucu doğrudan Grup F'in belirtisi: `s.hand.find(t => t.id === id)`
       iki farklı seçim için AYNI nesneyi döndürüyor, açılım [10,11,11]
       gibi görünüp "Per, Sıralı veya Çift kurallarına uymuyor" hatası
       veriyor — boyanan taş hiç suçlu değilken reddedilmiş oluyordu.
       Artık taşın bulunabileceği HER bölge (tileZones) taranır. */
    let maxT = 0, maxJ = 0;
    const scanT = (t) => { if (t && typeof t.id === 'number' && t.id > maxT) maxT = t.id; };
    /* PLAYTEST 25 · GRUP A — BU TARAMANIN EKSİKLİĞİ "KAYBOLAN TAŞ"IN
       ASIL KÖKENİYDİ. `bossCheatBag` (boss'un çaldığı taşlar) ve
       `yildizPick.options` (önüne açılmış Kuzey Yıldızı seçenekleri)
       burada YOKTU: en büyük id onlardan birindeyse sayaç ALTINDA
       kalıyor, kayıttan dönen oyunda üretilen ilk taş mevcut bir taşla
       aynı id'yi alıyordu (kullanıcı OKEY.exe ile oynadığı için her
       açılış bir restore demek — bu yüzden bug bir türlü bitmiyordu). */
    const zones = {
      deck: st.deck, hand: st.hand, discard: st.discardPile,
      gossip: st.gossipTable, pending: st.bungiePending,
      cheatBag: st.bossCheatBag,
      yildiz: st.yildizPick && st.yildizPick.options,
    };
    for (const arr of Object.values(zones)) (arr || []).forEach(scanT);
    for (const c of [...(st.opened || []), ...(st.prevOpen || []), ...(st.staged || [])])
      (c.tiles || []).forEach(scanT);
    for (const e of (st.islemeler || [])) (e.tiles || []).forEach(scanT);
    for (const j of [...(st.jokers || []), ...(st.backup || []), ...(st.deckJokers || []),
      ...(st.fuzyonPending ? [st.fuzyonPending] : [])])   // Grup F/23
      if (typeof j.id === 'number' && j.id > maxJ) maxJ = j.id;
    if (maxT > _tileId) _tileId = maxT;
    if (maxJ > _jokerId) _jokerId = maxJ;
    this._healDuplicateIds();
    return true;
  },

  /* PLAYTEST 25 · GRUP D — ESKİ KAYITLARI ONARMA.
     Yukarıdaki düzeltme YENİ çakışmayı engeller, ama düzeltmeden ÖNCE
     kaydedilmiş bir run'da çakışma ZATEN oluşmuş olabilir: kullanıcı
     OKEY.exe'yi kapatıp açtığında o bozuk kayıt geri gelir ve taş yine
     "kayboldu" görünür. Bu yüzden her geri yüklemede çakışan id'ler
     onarılır: ilk taş kimliğini korur, sonrakilere TAZE id verilir.
     Veri kaybı yoktur — taşlar zaten oradaydı, yalnız ikisi aynı adı
     taşıdığı için biri erişilemiyordu; artık ikisi de erişilebilir.
     Seçim/işaret alanları id'ye bakan yerlerde (staged, islemeler,
     combo.values) taş NESNESİ tutulduğu için yeni id kendiliğinden
     geçerlidir; yalnız `values` Map'i id anahtarlıdır, o da taşınır. */
  _healDuplicateIds() {
    const s = this.state;
    if (!s) return 0;
    const seen = new Set();
    const remap = [];
    for (const arr of this.tileRefs())
      for (const t of (arr || [])) {
        if (!t || t.id == null) continue;
        if (!seen.has(t.id)) { seen.add(t.id); continue; }
        const old = t.id;
        t.id = nextTileId(s);
        seen.add(t.id);
        remap.push([old, t.id, t]);
      }
    if (!remap.length) return 0;
    // combo.values id anahtarlı → yeni id'ye taşı
    for (const list of [s.opened, s.prevOpen, s.staged])
      for (const c of (list || [])) {
        if (!(c && c.values && c.values.get)) continue;
        for (const [oldId, newId, t] of remap)
          if (c.tiles && c.tiles.includes(t) && c.values.has(oldId)) {
            c.values.set(newId, c.values.get(oldId));
            c.values.delete(oldId);
          }
      }
    const msg = `🩹 Kayıt onarıldı: ${remap.length} taşın çakışan kimliği yenilendi (`
      + remap.map(([o, n]) => `#${o}→#${n}`).join(', ') + ')';
    (s.integrityLog = s.integrityLog || []).push(msg);
    if (typeof console !== 'undefined') console.warn(msg);
    return remap.length;
  },
};

/* Tarayıcı: i18n katmanı tanım tablolarını global.* üzerinden okur.
   Top-level const'lar window'a otomatik YAZILMAZ (script-scope binding) —
   bu yüzden JOKER_DEFS vb. burada açıkça window'a verilir. Bu eksikti ve
   EN modda joker/tüketilebilir/boss isim-açıklamalarının Türkçe kalma
   bug'ının kök nedeniydi (Grup J, 2026-08). */
if (typeof window !== 'undefined') {
  Object.assign(window, {
    Game, JOKER_DEFS, CONSUMABLES, SPECIAL_TILES, BOSSES, RARITY,
    UPGRADE_DEFS, MAX_CONSUMABLES, TOTAL_STAGES, PACK_DEFS,
    PACK_CHOICES, CONSUM_SLOT_MAX, TUCCAR_MAX_REFUSE, SPECIAL_RARITY_W, FERMAN_MAX,
    MAGNET_MAX,
    /* PLAYTEST 26/30 — kart rozetleri motorun sabitlerinden okunur */
    VASIYET_CAP, IPOTEK_TURNS, YANKEE_STEP, YANKEE_RESET_KEEP, YANKEE_CAP,
    /* P29 sabitleri — testler ve denge araçları buradan okur */
    ZINCIR_START, ZINCIR_STEP, ZINCIR_DECAY, ZINCIR_CAP, VAMPIR_MULT,
    PARATONER_MULT, KATALIZOR_STEP, KATALIZOR_CAP, BUNGIE_SNAP, STORE_TILE_PICKS,
    TERAZI_HEAVY_MIN, TERAZI_LIGHT_MULT, TERAZI_HEAVY_TARGET,
  });
}

/* Node smoke-test desteği */
if (typeof module !== 'undefined') {
  module.exports = {
    Game, detectCombo, isCift, isPer, isSirali, getCarpan, computeScore,
    sortPer, sortCift, sortSirali, createDeck, resolveCombo,
    COLORS, COLOR_TR, JOKER_DEFS, RARITY, BOSSES, overshootBonus, stageCoinScale,
    COIN_BASE_NORMAL, COIN_BASE_BOSS, NOMELD_PEN_NORMAL, NOMELD_PEN_BOSS,
    CONSUMABLES, MAX_CONSUMABLES, SPECIAL_TILES, SPECIAL_MAX_COPIES, TOTAL_STAGES, handSizeFor, MAX_HAND,
    CARPAN_TABLE, STAGE_TARGETS, UPGRADE_DEFS, PACK_DEFS, PACK_MAX_SLOTS, TUCCAR_MAX_REFUSE,
    BORSA_SHARE_MULT, BORSA_SHARE_CAP, BORSA_DIVIDEND, BORSA_BURN,
    CHEAT_RISK_STEPS, CHEAT_DECK_PICK,
    RARITY_CURVE, PACK_RARITY_CURVE, ALIEN_HIDDEN_PER_TURN, PACK_SECOND_CHANCE,
    IS_BASE_TILE, TILE_ORIGIN_TR, DECK_MAX_COPIES, IGNE_MULT, IGNE_SEW,
    /* P29 · Grup L — Bukalemun'un seçtiği renk ve "renk serbest" kapısı
       dışa verilir: muafiyet artık `_freePerColors` yerine taş düzeyinde
       okunuyor, testler de aynı kapıdan bakmalı. */
    bukalemunColor, isColorWild,
    BAL_KUPU_INSTANT, BAL_KUPU_PERM, PACK_CHOICES, PACK_REEL_LEN, CONSUM_SLOT_MAX,
    SHOP_JOKER_BASE, SHOP_JOKER_MAX, SHOP_EXTRA_BASE, SHOP_EXTRA_MAX, UP_VAL,
    CONSUM_SELL_RATE, CONSUM_SLOT_MAX, KD_TASI_BASE, KD_TASI_STEP, KD_TASI_MAX,
    YILDIZ_SHOW, SPECIAL_RARITY_W, SHOP_EXTRA_FIXED, FERMAN_MAX, MAGNET_MAX,
    /* PLAYTEST 26 — Yankee birikimi · PLAYTEST 30 — Legendary denge sabitleri */
    VASIYET_CAP, IPOTEK_TURNS, MIDAS_COIN, TEKER_MULT, KAIOKEN_MULT_2, KAIOKEN_MULT_3,
    WORLD_PERM_MULT, WORLD_TARGET_UP, KIYAMET_KEEP, EJDERHA_TILE_MULT, VOID_SCORE, VOID_MULT,
    SEYTAN_SCORE, SEYTAN_MULT, PINKY_MAX, APPLE_MULT, APPLE_DRAW_CUT, APPLE_ISLEK, KAGIT_TILES,
    MEDUSA_MULT, MEDUSA_FLAT, NOSTRA_MULT, TEKER_FLAT, ATES_HAGGLE_WIN, ATES_DISCOUNT,
    ATES_STEAL_WIN, ATES_STEAL_ISLEK, SISYPHUS_STEPS, FRANK_REVIVE_FLAT, FRANK_STITCH_MULT,
    PANDORA_UMUT_FLAT, PANDORA_SALGIN_MULT, PANDORA_SALGIN_BURN, PANDORA_ARMAGAN_BONUS,
    YANKEE_STEP, YANKEE_RESET_KEEP, YANKEE_CAP,
    /* P29 sabitleri — testler ve denge araçları buradan okur */
    ZINCIR_START, ZINCIR_STEP, ZINCIR_DECAY, ZINCIR_CAP, VAMPIR_MULT,
    PARATONER_MULT, KATALIZOR_STEP, KATALIZOR_CAP, BUNGIE_SNAP, STORE_TILE_PICKS,
    TERAZI_HEAVY_MIN, TERAZI_LIGHT_MULT, TERAZI_HEAVY_TARGET,
    /* PLAYTEST 25 — ekonomi revizyonu (E1/E2/E4-a/E6/E9) */
    START_COINS, INTEREST_PER, INTEREST_CAP, BOND_PRICE, BOND_YIELD, BOND_MAX,
    /* PLAYTEST 26 — MADDE C: takas ekranı backup tavanını okur */
    MAX_BACKUP, MAX_SLOTS,
  };
}
