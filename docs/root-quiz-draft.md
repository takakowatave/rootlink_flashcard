# 語根クイズ 対象100語根 (下書き)

W2「語根クイズの設計確定」の
- 対象の語根を約100個に絞る
- 表記ゆれの対応表（voc/vok、duc/duct、scrib/script、mit/miss など）

を1枚にまとめた下書き。`etymology_part_words` の単語カバー数 (2026-11-11 時点) をベースに、
古典語 (Latin / Greek) 由来で生産的な語根のみを拾っている。

## 使い方
- kiko が **採用 / 削除 / 追加** をマークして確定版にする
- 確定後、クイズ実装の seed データ (part_key → canonical form → variants[] → meaning_en / meaning_ja) に落とす
- 単語数は今の DB (= これまでユーザーが検索した単語) の数。参考値で、増え続ける

## 表記ゆれの考え方
- **代表形** を1つ決めて、**表記ゆれ** に変異形を列挙する
- クイズでは、どの form (vers でも vert でも) が使われていても同じ根として扱う
- 答え合わせでは出題単語に実際に出ている form を表示する

---

## 対象語根 100 (word count 降順)

| # | 代表形 | 表記ゆれ | 意味 (EN) | 意味 (JA) | DB 単語数 (参考) |
|---|---|---|---|---|---|
| 1 | log | logy, olog | word, study | 言葉・学問 | ~155 |
| 2 | graph | gram | write, draw | 書く・描く | ~84 |
| 3 | vers | vert | turn | 向ける・回す | ~101 |
| 4 | tract | trah | pull, drag | 引く | 58 |
| 5 | vis | vid, view | see | 見る | 58 |
| 6 | gen | gener, gn | birth, kind | 生まれる・種 | ~82 |
| 7 | spect | spec, spic | look | 見る | ~93 |
| 8 | fer | lat | carry, bear | 運ぶ | ~82 |
| 9 | port | — | carry | 運ぶ | 51 |
| 10 | ject | jac | throw | 投げる | 50 |
| 11 | pos | posit, pon | place, put | 置く | ~89 |
| 12 | metr | meter | measure | 測る | 47 |
| 13 | cept | cap, capit, cip | take, head | 取る・頭 | ~86 |
| 14 | duct | duc | lead | 導く | ~72 |
| 15 | form | — | shape | 形 | 45 |
| 16 | path | pathy | feeling, suffering | 感情・苦しみ | 45 |
| 17 | script | scrib, scribe | write | 書く | ~68 |
| 18 | sens | sent | feel | 感じる | 58 |
| 19 | vent | ven | come | 来る | 59 |
| 20 | miss | mit | send | 送る | 75 |
| 21 | phon | phono | sound | 音 | 39 |
| 22 | voc | vok, voke | call, voice | 呼ぶ・声 | 38 |
| 23 | dict | dic | say | 言う | 38 |
| 24 | bio | — | life | 生命 | 37 |
| 25 | fact | fac, fect, fic | make, do | 作る・する | ~106 |
| 26 | serv | — | keep, serve | 保つ・仕える | 37 |
| 27 | act | ag | do, drive | する・動かす | 35 |
| 28 | crimin | crit | judge, crime | 判定・罪 | 30 |
| 29 | ten | tain, tin | hold | 保つ | ~41 |
| 30 | leg | lect, lig | read, choose | 読む・選ぶ | ~66 |
| 31 | nom | nym | name, law | 名前・法 | 30 |
| 32 | fin | — | end, limit | 終わり・限界 | 29 |
| 33 | plic | plex, pli, ply | fold | 折る | 29 |
| 34 | struct | stru | build | 建てる | 28 |
| 35 | medi | mid | middle | 中間 | 28 |
| 36 | clud | clus, clos | close, shut | 閉じる | 27 |
| 37 | grad | gress, gred | step, walk | 歩く・段階 | ~45 |
| 38 | chron | — | time | 時間 | 27 |
| 39 | liber | liver | free | 自由 | 27 |
| 40 | geo | — | earth | 地球・大地 | 26 |
| 41 | liter | — | letter | 文字 | 26 |
| 42 | cur | cour, curs | run, care | 走る・気にかける | 26 |
| 43 | rupt | — | break | 壊す | 26 |
| 44 | puls | pel, pul | push, drive | 押す・駆る | ~31 |
| 45 | spir | spire | breathe | 息 | 25 |
| 46 | tend | tens, tent | stretch | 伸ばす | ~67 |
| 47 | ced | cess, cede | go, yield | 進む・譲る | 24 |
| 48 | neg | — | deny | 否定 | 24 |
| 49 | psych | — | mind, soul | 心・魂 | 23 |
| 50 | press | — | press | 押す | 23 |
| 51 | scop | scope | look, examine | 見る | 37 |
| 52 | arch | archy | rule, ancient | 支配・古い | 23 |
| 53 | solv | solu, solut | loosen | 解く | 23 |
| 54 | mut | — | change | 変える | 22 |
| 55 | son | — | sound | 音 | 22 |
| 56 | therm | thermo | heat | 熱 | 22 |
| 57 | cred | — | believe, trust | 信じる | 21 |
| 58 | astro | aster | star | 星 | 21 |
| 59 | sign | — | mark, sign | しるし | 20 |
| 60 | jur | jus, just | law, swear | 法・誓う | 20 |
| 61 | prob | prov | test, prove | 試す・証明 | 20 |
| 62 | cycl | cyclo | circle, wheel | 輪 | 20 |
| 63 | cit | — | rouse, call | 呼び起こす | 20 |
| 64 | mon | moni | warn, show | 警告・示す | 19 |
| 65 | pass | path | pass, suffer | 通る・苦しむ | 19 |
| 66 | tribut | — | give, assign | 与える・割り振る | 19 |
| 67 | electr | electro | electric | 電気 | 18 |
| 68 | ped | pod | foot | 足 | 18 |
| 69 | creat | cre, crea | make, grow | 作る・育つ | 18 |
| 70 | habit | hibit | have, hold | 保つ・住む | 18 |
| 71 | potent | pot, poss | power, able | 力・できる | 18 |
| 72 | tox | toxic | poison | 毒 | 18 |
| 73 | organ | organo | organ, tool | 器官・道具 | 18 |
| 74 | mort | mori | death | 死 | 17 |
| 75 | soci | socio | companion | 仲間 | 17 |
| 76 | sist | sta, stat | stand | 立つ | 17 |
| 77 | manu | man | hand | 手 | 17 |
| 78 | dem | demo | people | 人々 | 17 |
| 79 | popul | — | people | 人々 | 17 |
| 80 | cid | cide | cut, kill | 切る・殺す | 17 |
| 81 | nucle | nucleo | core, nucleus | 核 | 17 |
| 82 | equ | equa, equi | equal | 等しい | 16 |
| 83 | sol | — | alone, sun | 単独・太陽 | 16 |
| 84 | migr | — | move, migrate | 移る | 15 |
| 85 | magn | magni | great, large | 大きい | 14 |
| 86 | ord | ordin | order | 順序 | 14 |
| 87 | anim | — | life, mind, breath | 魂・息 | 13 |
| 88 | loc | — | place | 場所 | 13 |
| 89 | mod | — | measure, manner | 程度・やり方 | 12 |
| 90 | mot | mov | move | 動く | ~20 |
| 91 | sci | — | know | 知る | 11 |
| 92 | val | — | strength, worth | 価値・強さ | 11 |
| 93 | stat | sta | stand | 立つ | 10 |
| 94 | cord | cardi | heart | 心臓 | 10 |
| 95 | flu | flux | flow | 流れる | 9 |
| 96 | greg | — | group, flock | 群れ | 9 |
| 97 | morph | — | form, shape | 形 | 9 |
| 98 | corpor | corp | body | 身体 | 7 |
| 99 | pater | patri | father | 父 | 6 |
| 100 | phil | philo | love, friend | 愛・好む | 6 |

---

## 100 に入らなかったが候補になりうる古典語根

- **ambul** (walk) · **aqua/aqu** (water) · **aud** (hear) · **cent** (hundred) · **fract** (break) · **fund** (bottom) · **grat** (pleasing) · **hum** (ground, human) · **junct** (join) · **lax** (loose) · **mar** (sea) · **mem/memor** (remember) · **min** (small) · **mir** (wonder) · **nav** (ship) · **nounce/nunc** (announce) · **plen** (full) · **prim** (first) · **rect** (straight) · **tact** (touch) · **temp** (time) · **terr/terra** (earth) · **test** (witness) · **top** (place) · **tort** (twist) · **urb** (city) · **vac** (empty) · **viv/vit** (life) · **vol** (will, wish) · **volv/volut** (roll)

需要 (DB の単語数) が増えてきたら差し替え候補。

---

## 表記ゆれ対応表 (抜粋・よく聞かれる型)

| 代表形 | 表記ゆれ | 変化の背景 |
|---|---|---|
| vers | vert | ラテン語動詞 vertere の過去分詞幹 versus |
| duct | duc | duc- は不定詞幹、duct- は過去分詞幹 (ducere / ductus) |
| script | scrib | scrib- は不定詞幹、script- は過去分詞幹 (scribere / scriptus) |
| miss | mit | mitt- は現在幹、miss- は過去分詞幹 (mittere / missus) |
| ject | jac | 古い iacere の i → j, 過去分詞 iactus |
| cept | cap, cip | capere (take)。cap- が基本幹、cept- が過去分詞、cip- は接頭辞後の弱化 (recipient) |
| cess | ced | cedere / cessus |
| tract | trah | trahere / tractus |
| vis | vid | videre / visus |
| vent | ven | venire / ventus |
| sens | sent | sentire / sensus |
| spect | spec, spic | specere / spectus。spic- は接頭辞後の弱化 (suspicious) |
| fact | fac, fect, fic | facere。接頭辞後は e → fect-, 名詞派生は fic- (benefic) |
| voc | vok, voke | vocare。vok- は英語綴り |
| dict | dic | dicere / dictus |
| pos | posit, pon | ponere / positus。pon- は現在幹 (component) |
| press | prem, print | premere / pressus。print は古フランス経由 |
| scop | scope | 英語化綴り |
| phon | phono | ギリシャ語 φωνή |
| graph | gram | γράφειν (書く) / γράμμα (書かれたもの) |
| path | pathy | πάθος (感情) / -πάθεια (〜の感情) |

### 完全網羅はこの PR の範囲外
上は代表例のみ。完全版は kiko が「この根は変異形も載せたい」と判断したものだけ seed に入れる方針で十分。
全ラテン語動詞変化を網羅すると100語を超え、クイズの覚えやすさを損なう。

---

## 未確定の設計論点

以下は kiko の判断待ち。これが決まらないと seed 入れられない。

1. **英日どちらで出題するか**
   - 表示言語 (profiles.display_locale) に合わせて切り替えでよい？
   - EN モードで JA の gloss (祝福) を見せるのは NG？
2. **変異形 (vert ↔ vers) を同じ問題内で見せるか**
   - 「`control + VERS + ial` の意味は？」で代表形は vert とヒント出すか、vers のまま出すか
3. **難度**
   - 100 語根すべて必修？それとも初級50 / 中級30 / 上級20 の層分け？
4. **出題単語の範囲** (W2 の3項目)
   - `dictionary_cache` に AI rewrite 済みの単語のみ？ (安定供給)
   - `saved_words` に 1 件以上ある単語のみ？ (ユーザー検索実績あり)
   - デッキ `deck_words` に入っている単語のみ？ (テスト対策カバー重視)
