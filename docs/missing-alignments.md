# Missing alignments

CMUdict has 135,166 pronunciation entries. After running
`npm run align-cmudict` (Phonetisaurus EM, default settings), 134,678
of those entries get a grapheme→phoneme alignment. **488 do not.**

This file lists those 488 entries so we can return to them with a
deliberate strategy. None of them are required for phase 2 — the
acid-test words (`cat`, `city`, `cycle`, `account`, `cello`, `celtic`,
`ocean`, `facade`, `philosophy`, `shepherd`, `uphill`) all align cleanly.

## Why these get dropped

`phonetisaurus-align` defaults to `--restrict=true --grow=false`. That
limits initialization to small letter↔phoneme link sizes (1-N or M-1
within tight bounds) and does not relax the limits for difficult
entries — those are silently dropped. Two patterns trip the limits:

| pattern               | count | ratio (phon/letters) | examples                              |
|-----------------------|-------|----------------------|---------------------------------------|
| silent / foreign      | 155   | ≤ 1.0                | `aalen`, `acomb`, `aigner`, `anfal`   |
| modest excess         | 106   | 1.0 – 1.5            | `am`, `f.`, `l.`                      |
| acronym territory     | 173   | 1.5 – 2.0            | `acm`, `adsl`, `aol`                  |
| spelled-out letters   | 35    | 2.0 – 3.0            | `aaa` (=triple-A), `ama` (=A.M.A.)    |
| extreme / "double-u"  | 19    | > 3.0                | `aol` (=America Online), `bmw`, `dwi` |

## Strategy options to choose from later

1. **Re-run with `--grow=true`.** Phonetisaurus relaxes its restrictions
   for entries it can't otherwise align. Trade-off: alignments for
   *other* words may shift slightly, breaking bit-identical
   reproducibility from prior runs. Cheap to try; we can diff before/
   after on the acid-test set to confirm no regressions.

2. **Treat acronyms specially.** Most of the high-ratio entries are
   spelled-out abbreviations whose pronunciation isn't a phonetic
   reading of the letters at all (`bmw` → `B IY EH M D AH B AH L Y UW`).
   Reform rules don't have a sensible application here — the right
   behavior is probably "leave the spelling alone." We could detect
   these (the `tag` heuristic: word is all-uppercase abbreviation, or
   pronunciation length > 2× letters) and skip rewriting entirely.

3. **Hand-curate alignments for the few that matter.** If a missing
   word turns out to be common AND a phase rule should fire on it
   (unlikely for acronyms, possible for foreign names), we can append
   manual alignments to a `data/alignments-extra.corpus` consumed
   alongside the auto-generated one.

Recommended sequence: try (1) first since it's free and may resolve
half the gaps. Then (2) for the residual high-ratio acronyms. Reserve
(3) for the residual handful that genuinely need fixing.

## The list

Format: `word<TAB>arpabet pronunciation`. One pronunciation per line —
some words appear multiple times because they have multiple CMUdict
pronunciations of which only some are missing.

```tsv
aaa	T R IH2 P AH0 L EY1
aalen	AA1 L AH0 N
abs	AE1 B Z
abts	EY1 B IY1 T IY1 EH1 S
acero	AH0 TH EH1 R OW0
acm	EY2 S IY2 EH1 M
acomb	Y AE1 K AH0 M
adsl	EY2 D IY2 EH2 S EH1 L
adss	EY1 D IY1 EH1 S EH1 S
afl	EY2 EH2 F EH1 L
aigner	EY1 K N ER0
al.	AE2 L AH0 B AE1 M AH0
am	EY1 EH1 M
am's	EY1 EH1 M Z
ama	EY2 EH2 M EY1
amc	EY1 EH2 M S IY1
amd	EY1 EH2 M D IY1
anfal	AE1 N F AA0 L
ano	AE1 N Y OW0
aol	EY1 OW1 EH1 L
aol	AH0 M ER1 IH0 K AH0 AA1 N L AY2 N
aramaic	AA2 R AA0 M EH1 Y IH0 K
asap	EY1 S AE2 P
asea	EY1 EH1 S IY1 EY1
asean	AE2 Z EY1 AH0 N
asleson	AE1 S IH0 L S AH0 N
atm	EY1 T IY2 EH1 M
atx	EY1 T IY1 EH1 K S
aug	AO1 G AH0 S T
avignon	AE1 V IH0 N Y AO2 N
awb	EY1 D AH1 B AH0 L Y UW1 B IY1
awb	EY1 D AH1 B AH0 Y UW1 B IY1
ayerst	EH1 R AH0 S T
batignolles	B AE2 T IH0 N Y OW1 L AH0 S
bbq	B IY1 B IY0 K Y UW2
bbq	B AA1 R B IH0 K Y UW2
benigno	B EH1 N IH0 G N OW0
blvd	B UH1 L AH0 V AA2 R D
bmw	B IY1 EH2 M D AH1 B AH0 L Y UW0
bourguignon	B UH2 R G IY0 N Y OW1 N
bs	B IY2 EH1 S
cacld	S IY1 EY1 S IY1 EH1 L D IY1
cama	S IY1 EY1 EH1 M EY1
cbs	S IY2 B IY2 EH1 S
ccs	S IY1 S IY1 Z
cel	S IY1 IY1 EH1 L
celo	S IY1 IY1 EH1 L OW1
cfo	S IY1 EH2 F OW1
clo	S IY2 EH2 L OW1
cluj	S IY1 EH1 L Y UW1 JH EY1
cmos	S IY1 EH1 M OW1 EH1 S
cmu	S IY1 EH1 M Y UW1
cmudict	S IY2 EH2 M Y UW1 D IH2 K T
cmx	K AH0 M EH1 K S
cnbc's	S IY1 EH1 N B IY1 S IY1 Z
cnn	S IY1 EH1 N EH1 N
cnn.com	S IY1 EH1 N EH1 N D AA1 T K AA1 M
cnn's	S IY1 EH1 N EH1 N Z
cnnfn	S IY1 EH1 N EH1 N EH1 F EH1 N
co.	K AH1 P AH0 N IY0
cognac	K OW1 N Y AE2 K
cognac	K AA1 N Y AE2 K
companero	K AA2 M P AH0 N Y EH1 R OW2
compusa	K AA1 M P Y UW1 EH1 S EY1
compusa's	K AA1 M P Y UW1 EH1 S EY1 Z
conn.	K AH0 N EH1 T AH0 K AH0 T
corp	K AO1 R P ER0 EY1 SH AH0 N
corp.	K AO1 R P ER0 EY1 SH AH0 N
corp.'s	K AO1 R P ER0 EY1 SH AH0 N Z
corp's	K AO1 R P ER0 EY1 SH AH0 N Z
couldn't	K UH1 D AH0 N T
couldn't	K UH1 D AH0 N
cps	S IY1 P IY2 EH1 S
cr.	K R EH1 S AH0 N T
crm	S IY1 AA1 R EH1 M
crownx	K R AW1 N EH2 K S
csi	S IY1 EH2 S AY1
cspi	S IY1 EH1 S P IY1 AY1
csv	S IY1 EH1 S V IY1
ct	K AO1 R T
cus	S IY1 Y UW1 EH1 S
cutugno	K Y UW0 T AH1 N Y OW0
cxc	S IY1 EH1 K S S IY1
cxc	S IY1 EH1 K S IY1
d'artagnan	D AH0 R T AE1 NG Y AH0 N # foreign french
danglar	D AH0 NG L AA1 R # foreign french
dfw	D IY1 EH1 F D AH1 B AH0 L Y UW1
dfw	D IY1 EH1 F D AH1 B AH0 Y UW1
didn't	D IH1 D AH0 N
didn't	D IH1 N T
difm	D IY1 AY1 EH1 F EH1 M
dmz	D IY1 EH2 M Z IY2
dna	D IY1 EH2 N EY1
dnase	D IY1 EH2 N EY2 S
dnase	D IY1 EH2 N EY2 Z
dnc	D IY1 EH2 N S IY2
dns	D IY2 EH2 N EH1 S
dqalpha	D IY1 K Y UW1 AE1 L F AH0
dr	D R AY1 V
dr	D AA1 K T ER0
dsouza	D AH0 S UW1 Z AH0
dss	D IY1 EH1 S EH1 S
dsv	D IY1 EH1 S V IY1
duena	D W EY1 N Y AH0
duenas	D W EY1 N Y AH0 S
dwi	D IY1 D AH1 B AH0 L Y UW1 AY1
dwi	D IY1 D AH1 B AH0 Y UW1 AY1
el-nino	EH1 L N IY1 N Y OW0
emdr	IY1 EH1 M D IY1 AA1 R
ems	IY1 EH1 M EH1 S
ers	IY1 AA1 R EH1 S
espana	EH0 S P AE1 N Y AH0
espanol	EH2 S P AA0 N Y OW1 L
espn	IY1 EH1 S P IY1 EH1 N
espresso	EH2 K S P R EH1 S OW2
espressos	EH2 K S P R EH1 S OW2 Z
etc	EH2 T S EH1 T ER0 AH0
etc.	EH2 T S EH1 T ER0 AH0
f	EH1 F
f.	EH1 F
f.'s	EH1 F S
f'd	EH1 F D
f's	EH1 F S
falcigno	F EH2 L S IY1 N Y OW0
fbi	EH1 F B IY1 AY1
fbi's	EH1 F B IY1 AY1 Z
fcc	EH2 F S IY2 S IY1
fcc's	EH2 F S IY2 S IY1 Z
fda	EH2 F D IY2 EY1
feb	F EH1 B Y AH0 W EH2 R IY0
fenjves	F EH1 N V EH0 Z
fm	EH1 F EH1 M
fnma	F AE2 N IY2 M EY1
foia	EH1 F OW1 AY1 EY1
fop	EH1 F OW1 P IY1
fs	EH1 F EH1 S
ftp	EH2 F T IY2 P IY1
fyi	F AO1 R Y AO1 R IH2 N F ER0 M EY1 SH AH0 N
ga	JH AO1 R JH AH0
gagnon	G AE1 N Y AH0 N
gatx	G AE1 T EH2 K S
gdp	G IY1 D IY1 P IY1 # abbrev
genego	JH IY1 IY1 EH1 N IY1 JH IY1 OW1
gm	JH IY2 EH1 M
gmbh	JH IY1 EH1 M B IY1 EY1 CH
gnc	JH IY1 EH1 N S IY1
gnp	JH IY2 EH2 N P IY1
govpx	G AH1 V P IY2 EH1 K S
gps	G IY1 P IY0 EH1 S
hadn't	HH AE1 D AH0 N T
hadn't	HH AE1 D AH0 N
hamtramck	HH AE0 M T R AE1 M IH0 K
haydn	HH AY1 D AH0 N
haydn's	HH AY1 D AH0 N Z
hces	EY1 CH S IY1 IY1 EH1 S
hfdf	EY1 CH EH1 F D IY1 EH1 F
hiv	EY1 CH AY1 V IY1 # abbrev
hjort	HH AH0 Y AO1 R T
hrubik	HH R UW1 B IH0 K
hsbc	EY1 CH EH1 S B IY1 S IY1
html	EY2 CH T IY2 EH2 M EH1 L
ibm	AY1 B IY2 EH2 M
ieee	AY2 T R IH2 P L AH0 IY1
imo	AY1 EH1 M OW1
inc.	IH0 NG K AO1 R P AO0 R EY0 T AH0 D
ins	AY1 EH1 N EH1 S
insignificance	IH2 N S IH0 G N Y IH1 F IH0 K AH0 N S
insignificant	IH2 N S IH0 G N Y IH1 F IH0 K AH0 N T
iq	AY1 K Y UW1
iq's	AY1 K Y UW1 Z
irs	AY1 AA2 R EH1 S
isbn	AY2 EH2 S B IY2 EH1 N
isty	AY1 EH1 S T IY1 W AY1
isu	AY1 EH1 S Y UW1
jalapeno	JH AE2 L AH0 P IY1 N OW0
jalapenos	HH AE2 L AH0 P IY1 N Y OW0 Z
jan.	JH AE1 N Y UW0 EH0 R IY0
jfk	JH IY1 EH2 F K EY1
jna	JH EY1 EH1 N EY1
jolla	JH OW1 L AH0
jr	JH UW1 N Y ER0
kal	K EY1 EY1 EH1 L
kganakga	K AH0 G AH0 N AE1 G AH0
kgori	K AH0 G AO1 R IY0
klu	K EY2 EH2 L Y UW1
knbc	K EY1 EH1 N B IY1 S IY1
knesset	K AH0 N EH1 S AH0 T
knievel	N IY1 V AH0 L
knin	N IH1 N
koernke	K AO1 R N AH0 K IY0
kostrzewa	K AH0 S T R AH0 Z EH1 W AH0
kpmg	K EY1 P IY1 EH1 M JH IH1
kvamme	K V AA1 M EY0
kwh	K EY1 D AH1 B AH0 L Y UW0 EY1 CH
l	EH1 L
l.	EH1 L
l.'s	EH1 L Z
l.s	EH1 L Z
l's	EH1 L Z
la-nina	L AH0 N IY1 N Y AH0
lamagna	L AH0 M AA1 N Y AA0
lapd	EH1 L EY1 P IY1 D IY1
lapd's	EH1 L EY1 P IY1 D IY1 Z
las	EH1 L EY1 EH1 S
lasagna	L AA0 S AA1 N Y AH0
lasagna	L AH0 Z AA1 N Y AH0
lcs	EH1 L S IY1 EH1 S
llc	EH2 L EH2 L S IY2
lorgnette	L AO0 R N Y EH1 T
lorgnettes	L AO0 R N Y EH1 T S
lp	EH1 L P IY1
lpn	EH1 L P IY1 EH1 N
ls	EH1 L EH1 S
lsd	EH2 L EH2 S D IY1
ltd	L IH1 M IH0 T IH0 D
ltd	EH1 L T IY1 D IY1
ltd.	L IH1 M IH0 T IH0 D
lwin	L UW1 IH2 N
lxi	EH1 L EH1 K S AY1
m	EH1 M
m-code	EH1 M K OW1 D
m-codes	EH1 M K OW1 D Z
m.	EH1 M
m.'s	EH1 M Z
m.d.	EH2 M D IY1
m.s	EH1 M Z
m'bow	EH2 M B OW1
m's	EH1 M Z
mam	EH1 M EY1 EH1 M
mass.	M AE2 S AH0 CH UW1 S AH0 T S
mba	EH1 M B IY1 EY1
mbank	EH1 M B AE1 NG K
mc	M IH0 K
mc	EH1 M S IY1
mcgwire	M AH0 G W AY1 AH0 R
mcorp	EH1 M K AO2 R P
mcorp's	EH1 M K AO2 R P S
md	EH2 M D IY1
mg	EH2 M G IY1
mgm	EH2 M G IY2 EH1 M
mh	EH1 M EY1 CH
mightn't	M AY1 T AH0 N T
mit	M IH1 T
mj's	EH1 M JH EY1 Z
mme	EH1 M EH1 M IY1
monsignor	M AA0 N S IY1 N Y ER0
monsignors	M AA0 N S IY1 N Y ER0 Z
mpeg	EH1 M P EH2 G
mpg	EH1 M P IY1 JH IY1
mpg	M AY1 L Z P ER0 G AE1 L AH0 N
mph	EH1 M P IY1 EY1 CH
mph	M AY1 L Z P ER0 AW1 ER0
mr	M IH1 S T ER0
mri	EH2 M AA2 R AY1
msgr	M AA0 N S IY1 N Y ER0
mssrs	M EH1 S ER0 Z
mssrs.	M EH1 S ER0 Z
mt	EH1 M T IY1
mtel	EH1 M T EH2 L
mtv	EH1 M T IY1 V IY1
mumia	M AH0 M IY1 Y AH0
munoz	M UW1 N Y OW0 Z
n	EH1 N
n-tuple	EH1 N T UW1 P AH0 L
n-word	EH1 N W ER2
n-words	EH1 N W ER1 D Z
n.	EH1 N
n.'s	EH1 N Z
n.s	EH1 N Z
n's	EH1 N Z
naacp	EH2 N EY2 EY2 S IY2 P IY1
nba	EH1 N B IY2 EY1
nbc	EH1 N B IY2 S IY1
nbc's	EH1 N B IY2 S IY1 Z
nedlloyd	N EH1 D L OY2 D
needn't	N IY1 D AH0 N T
neorx	N IY1 OW0 R EH2 K S
nepl	EH1 N IY1 P IY1 EH1 L
nfc	EH1 N EH1 F S IY1
nfl	EH1 N EH2 F EH1 L
ng	IH1 NG
nino	N IY1 N Y OW0
ninos	N IY1 N Y OW0 Z
nmr	EH2 N EH2 M AA1 R
noaa	EH1 N OW1 EY1 EY1
npr	EH1 N P IY1 AA1 R
npr.org	EH1 N P IY1 AA1 R D AA1 T AO1 R G
npr's	EH1 N P IY1 AA1 R Z
nth	EH1 N TH
nvhome	EH1 N V IY1 HH OW1 M
nvhomes	EH1 N V IY1 HH OW1 M Z
nvidia	EH1 N V IH1 D IY0 AH0
nypd	EH2 N W AY1 P IY2 D IY2
oas	OW1 EY1 EH1 S
ofc	OW1 EH1 F S IY1
oughtn't	AO1 T AH0 N T
p.m.	P IY1 EH1 M
parkinsonism	P AA1 R K IH0 N S AH0 N IH2 Z IH0 M
pdf	P IY2 D IY2 EH1 F
pena	P EY1 N Y AH0
pena's	P EY1 N Y AH0 Z
penna	P EH2 N S IH0 L V EY1 N Y AH0
perignon	P EH2 R IH0 G N AA1 N
pgm	P IY1 JH IY1 EH1 M
phlcorp	P IY1 EY1 CH EH1 L K AO1 R P
pm	P IY1 EH1 M
poignancy	P OY1 N Y AH0 N S IY0
poignant	P OY1 N Y AH0 N T
poignantly	P OY1 N Y AH0 N T L IY0
pos	P IY1 OW1 EH1 S
ppm	P IY1 P IY1 EH1 M
prof.	P R AH0 F EH1 S ER0
przybocki	P R AH0 Z B AA1 K IY0
ptovsky	P AH0 T AO1 V S K IY0
ptsd	P IY2 T IY1 EH2 S D IY1
q	K Y UW1
q's	K Y UW1 Z
qasr	K Y UW1 EY1 EH1 S AA1 R
qmax	K Y UW1 M AE2 K S
realty	R IY1 L T IY0
rep	R EH0 P R IY0 Z EH1 T AH0 T IH0 V
rep.	R EH0 P R IY0 Z EH1 T AH0 T IH0 V
repercussion	R IY2 P R AH0 K AH1 SH AH0 N
repercussions	R IY2 P R AH0 K AH1 SH AH0 N Z
revaluations	R IY0 IH0 V AE2 L Y UW0 EY1 SH AH0 N Z
rijn	R IY1 AH0 N
rna	AA2 R EH2 N EY1
romagnolo	R OW2 M AA0 N Y OW1 L OW0
rpf	AA1 R P IY1 EH1 F
rpm	AA1 R P IY1 EH1 M
rsvp	AA1 R EH1 S V IY1 P IY1
rwanda	R UW2 AA1 N D AH0
rwanda's	R UW2 AA1 N D AH0 Z
rwandan	R UW2 AA1 N D AH0 N
rwandan's	R UW2 AA1 N D AH0 N Z
rwandans	R UW2 AA1 N D AH0 N Z
rwandese	R UW0 AA2 D IY1 Z
s	EH1 S
s.	EH1 S
s.'s	EH1 S IH0 Z
s's	EH1 S IH0 Z
sai	EH1 S EY1 AY1
sauvignon	S AO2 V IH1 N Y AA0 N
sba	EH2 S B IY2 EY1
sbf	EH2 S B IY2 EH1 F
schildknecht	SH AY1 L D K AH0 N EH2 K T
sci	EH1 S S IY1 AY1
scs	EH2 S S IY2 EH1 S
sdn	EH1 S D IY1 EH1 N
semiannual	S EH2 M IY0 AE1 N Y AH0 W AH0 L
semiannual	S EH2 M AY0 AE1 N Y AH0 W AH0 L
semiannual	S EH2 M AH0 AE1 N Y AH0 W AH0 L
senor	S IY2 N Y AO1 R
senora	S IY2 N Y AO1 R AH0
sep	EH1 S IY1 P IY1
sfernice	S AH0 F ER1 N IH0 S
sffed	EH1 S EH2 F EH1 D
sffed	EH1 S EH1 F EH1 F IY1 D IY1
sgt	S AA1 R JH AH0 N T
shevtl	SH EH1 V T IH0 L
shouldn't	SH UH1 D AH0 N T
signor	S IY1 N Y AO0 R
signore	S IY0 N Y AO1 R EY0
signori	S IY0 N Y AO1 R IY1
sirignano	S IH2 R IY0 N Y AA1 N OW0
sms	EH2 S EH2 M EH1 S
sorcha	S AH1 R AH0 K AH0
sos	EH2 OW2 EH1 S
sql	S IY1 K W UH0 L
sr	S IY1 N Y ER0
sr	S IH1 S T ER0
sram	EH1 S R AE1 M
sri	S R IY1
ss	EH1 S EH1 S
ssn	EH1 S EH1 S EH1 N
st	S T R IY1 T
st	S EY1 N T
st-charles	S EY1 N T CH AA1 R AH0 L Z
st-clair	S EY1 N T K L EH1 R
st-claire	S EY1 N T K L EH1 R
st-cyr	S EY1 N T K IH1 R
st-cyr	S EY1 N T S IH1 R
st-denis	S EY1 N T D EH1 N IH0 S
st-dennis	S EY1 N T D EH1 N IH0 S
st-george	S EY1 N T JH AO1 R JH
st-germain	S EY1 N T JH ER2 M EY1 N
st-germaine	S AA1 N ZH ER2 M EY1 N
st-hilaire	S EY1 N T HH IH0 L EY1 R
st-jacques	S AA1 N ZH AA1 K S
st-james	S EY1 N T JH EY1 M Z
st-jean	S EY1 N T JH IY1 N
st-john	S EY1 N T JH AA1 N
st-johns	S EY1 N T JH AA1 N Z
st-julien	S EY1 N T JH UW1 L IY0 AH0 N
st-laurent	S AA1 N L AO2 R AO1 N T
st-lawrence	S EY1 N T L AO1 R AH0 N S
st-louis	S EY1 N T L UW1 AH0 S
st-louis	S EY1 N T L UW1 IY0
st-lucia	S EY1 N T L UW1 SH AH0
st-lucia	S EY1 N T L UW2 S IY1 AH0
st-marie	S EY1 N T M ER0 IY1
st-martin	S EY1 N T M AA1 R T IH0 N
st-mary	S EY1 N T M EH1 R IY0
st-peter	S EY1 N T P IY1 T ER0
st-petersburg	S EY1 N T P IY1 T ER0 Z B ER0 G
st-pierre	S EY1 N T P Y EH1 R
sta	EH1 S T IY1 EY1
stds	EH1 S T IY1 D IY1 Z
stds	EH1 S T IY1 D IY1 EH1 S
stjohn	S EY1 N T JH AA1 N
strzelecki	S T ER2 Z IH0 L EH1 T S K IY0
superx	S UW1 P ER0 EH2 K S
suu	S UW1
suv	EH2 S Y UW2 V IY1
suv's	EH2 S Y UW2 V IY1 Z
suvs	EH2 S Y UW2 V IY1 Z
syp	EH1 S W AY1 P IY1
taoiseach	T IY1 SH AH0 K # title, irish
tbilisi	T AH0 B IH0 L IY1 S IY0
tbilisi	T AH0 B L IY1 S IY0
tcas	T IY1 S IY1 EY1 EH1 S
tew	T IY1 IY1 D AH1 B AH0 L Y UW2
tiernan	T IY1 R N AH0 N # name, irish
tlc	T IY2 EH2 L S IY1
trnopolje	T EH2 R N AH0 P AO1 L Y EH0
ts	T IY1 EH1 S
tv	T EH2 L AH0 V IH1 ZH AH0 N
tvsat	T AH0 V S AE1 T
ufo	Y UW2 EH2 F OW1
ufo's	Y UW2 EH2 F OW1 Z
ufos	Y UW2 EH2 F OW1 Z
ul	AH1 L
un	Y UW1 EH1 N
url	UH1 R L
urls	Y UW1 AA1 R EH1 L Z
us	Y UW2 EH1 S
usa	Y UW2 EH2 S EY1
usa's	Y UW1 EH1 S EY1 Z
usaid	Y UW2 EH1 S EY1 D
usair	Y UW2 EH2 S EH1 R
usair's	Y UW2 EH2 S EH1 R Z
usairways	Y UW2 EH2 S EH1 R W EY2 Z
usameribancs	Y UW2 EH2 S AH0 M EH1 R IH0 B AE2 N K S
usb	Y UW1 EH1 S B IY1
usbancorp	Y UW2 EH2 S B AE1 NG K AO2 R P
usda	Y UW2 EH2 S D IY2 EY1
usmc	Y UW1 EH1 S EH1 M S IY1
uss	Y UW2 EH2 S EH1 S
ussr	Y UW2 EH2 S EH2 S AA1 R
ustrust	Y UW1 EH1 S T R AH1 S T
uys	Y UW1 W AY1 EH1 S
vignette	V IH0 N Y EH1 T
vignette	V IY0 N Y EH1 T
vignettes	V IH0 N Y EH1 T S
visx	V IH1 S EH2 K S
vlcek	V L EH1 S IH0 K
vnesheconombank	V AH0 N EH2 SH AH0 K AA1 N AH0 M B AE2 NG K
vs	V IY1 EH1 S
w	D AH1 B AH0 L Y UW0
w.	D AH1 B AH0 L Y UW0
w.'s	D AH1 B AH0 L Y UW0 Z
w.s	D AH1 B AH0 L Y UW0 Z
w's	D AH1 B AH0 L Y UW0 Z
waga	D AH1 B AH0 L Y UW2 EY1 JH IY1 EY1
waga	D AH1 B AH0 Y UW2 EY1 JH IY1 EY1
wm	W IH1 L Y AH0 M
wm	D AH1 B AH0 Y UW0 EH1 M
wor	D AH1 B EH0 L Y UW1 OW1 AA1 R
wor	D AH1 B AH0 Y UW1 OW1 AA1 R
wouldn't	W UH1 D AH0 N T
wrzesinski	R AH0 Z IH0 S IH1 N S K IY0
ws	D AH1 B AH0 L Y UW0 EH1 S
ws	D AH1 B Y AH0 EH1 S
wy	D AH1 B AH0 L Y UW0 W AY1
x	EH1 K S
x-ray	EH1 K S R EY2
x-rays	EH1 K S R EY2 Z
x.	AE1 K S
x.'s	EH1 K S IH0 Z
x.ers	EH1 K S ER0 Z
x.s	EH1 K S IH0 Z
x's	EH1 K S IH0 Z
xbox	EH1 K S B AA2 K S
xers	EH1 K S EH0 R Z
xml	EH2 K S EH2 M EH1 L
xoma	EH0 K S OW1 M AH0
xoma's	EH0 K S OW1 M AH0 Z
xtra	EH1 K S T R AH0
```
