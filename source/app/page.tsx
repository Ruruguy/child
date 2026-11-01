"use client";

import { useMemo, useState } from "react";

type InputMode = "length" | "weight" | "bestGuess";
type BestGuessBand = "infant" | "young" | "older";
type VitalKey = "newborn" | "infant" | "toddler" | "preschool" | "school" | "teen";
type ApgarKey = "appearance" | "pulse" | "grimace" | "activity" | "respiration";
type ApgarTime = 1 | 5 | 10 | 15 | 20;
type ApgarScores = Record<ApgarKey, number | null>;

const zones = [
  { key: "gray", label: "灰", minCm: 46.8, maxCm: 59.2, minKg: 3, maxKg: 5, estimate: 4, color: "#8f989b", ink: "#071c22", wash: "#e4e8e7", cuffed: "3.0", uncuffed: "2.5", depth: "9–10.5" },
  { key: "pink", label: "粉紅", minCm: 59.2, maxCm: 66.9, minKg: 6, maxKg: 7, estimate: 6.5, color: "#ef8cab", ink: "#071c22", wash: "#f8e5eb", cuffed: "3.0", uncuffed: "3.5", depth: "10–10.5" },
  { key: "red", label: "紅", minCm: 66.9, maxCm: 74.2, minKg: 8, maxKg: 9, estimate: 8.5, color: "#df514d", ink: "#fff", wash: "#f6dfdc", cuffed: "3.0", uncuffed: "3.5", depth: "10.5–11" },
  { key: "purple", label: "紫", minCm: 74.2, maxCm: 83.8, minKg: 10, maxKg: 11, estimate: 10.5, color: "#76599e", ink: "#fff", wash: "#e8e2ef", cuffed: "3.5", uncuffed: "4.0", depth: "11–12" },
  { key: "yellow", label: "黃", minCm: 83.8, maxCm: 95.4, minKg: 12, maxKg: 14, estimate: 13, color: "#f1d15d", ink: "#071c22", wash: "#f7f1d8", cuffed: "4.0", uncuffed: "4.5", depth: "12.5–13.5" },
  { key: "white", label: "白", minCm: 95.4, maxCm: 108.3, minKg: 15, maxKg: 18, estimate: 16.5, color: "#f5f1e6", ink: "#071c22", wash: "#f2f0e9", cuffed: "4.5", uncuffed: "5.0", depth: "14–15" },
  { key: "blue", label: "藍", minCm: 108.3, maxCm: 121.5, minKg: 19, maxKg: 23, estimate: 21, color: "#3891c6", ink: "#fff", wash: "#dcecf4", cuffed: "5.0", uncuffed: "5.5", depth: "15.5–16.5" },
  { key: "orange", label: "橘", minCm: 121.5, maxCm: 130.7, minKg: 24, maxKg: 29, estimate: 26.5, color: "#e88b42", ink: "#071c22", wash: "#f5e6d9", cuffed: "5.5–6.0", uncuffed: "—", depth: "17–19.5" },
  { key: "green", label: "綠", minCm: 130.7, maxCm: 143.3, minKg: 30, maxKg: 36, estimate: 33, color: "#559b72", ink: "#fff", wash: "#deebe2", cuffed: "6.0–6.5", uncuffed: "—", depth: "18.5–20.5" },
] as const;

const vitals: Record<VitalKey, { label: string; age: string; heart: string; breathing: string; pressure: string; lowPressure: string; tidalMin: number; tidalMax: number; tidalNote: string }> = {
  newborn: { label: "新生兒", age: "出生後 1 個月內", heart: "120–160", breathing: "40–60", pressure: "約 80/40", lowPressure: "SBP＜60", tidalMin: 4, tidalMax: 6, tidalNote: "生理潮氣量參考；出生復甦以有效通氣反應為主" },
  infant: { label: "嬰兒", age: "出生滿 1 個月後–未滿 1 歲", heart: "80–140", breathing: "30–40", pressure: "約 82/44", lowPressure: "SBP＜70", tidalMin: 6, tidalMax: 8, tidalNote: "保護性通氣參考" },
  toddler: { label: "幼兒", age: "約 1–3 歲", heart: "80–120", breathing: "25–30", pressure: "約 86/50", lowPressure: "SBP＜70＋(年齡×2)", tidalMin: 6, tidalMax: 8, tidalNote: "保護性通氣參考" },
  preschool: { label: "學齡前", age: "約 4–5 歲", heart: "70–115", breathing: "20–25", pressure: "約 90/52", lowPressure: "SBP＜70＋(年齡×2)", tidalMin: 6, tidalMax: 8, tidalNote: "保護性通氣參考" },
  school: { label: "學齡", age: "約 6–10 歲", heart: "70–115", breathing: "15–25", pressure: "約 94/54–100/60", lowPressure: "SBP＜70＋(年齡×2)", tidalMin: 6, tidalMax: 8, tidalNote: "保護性通氣參考" },
  teen: { label: "青少年", age: "大於 10 歲", heart: "70–90", breathing: "15–20", pressure: "約 110/64", lowPressure: "SBP＜90", tidalMin: 6, tidalMax: 8, tidalNote: "保護性通氣參考" },
};

const lmaFor = (weight: number) => weight <= 5 ? "1" : weight <= 10 ? "1.5" : weight <= 20 ? "2" : weight <= 30 ? "2.5" : "3";

const rule50: Record<VitalKey, { solution: string; mlKg: number | null; threshold: string; note: string }> = {
  newborn: { solution: "D10W", mlKg: 2, threshold: "血糖＜45 mg/dL", note: "PHPLS 非創 v20260616 第48頁：＜28日，0.2 g/kg；依指定SOP" },
  infant: { solution: "D10W", mlKg: 5, threshold: "血糖＜45 mg/dL", note: "Infant＜1 歲" },
  toddler: { solution: "D25W", mlKg: 2, threshold: "血糖＜60 mg/dL", note: "Toddler 1–3 歲" },
  preschool: { solution: "依地方 SOP", mlKg: null, threshold: "血糖＜60 mg/dL", note: "PHPLS 本頁未獨立列示濃度" },
  school: { solution: "依地方 SOP", mlKg: null, threshold: "血糖＜60 mg/dL", note: "PHPLS 本頁未獨立列示濃度" },
  teen: { solution: "D50W", mlKg: 1, threshold: "血糖＜60 mg/dL", note: "青少年或已有第二性徵" },
};

const apgarItems: { key: ApgarKey; letter: string; label: string; options: [string, string, string] }[] = [
  { key: "appearance", letter: "A", label: "外觀／膚色", options: ["全身蒼白或發紺", "軀幹紅、四肢發紺", "全身紅潤"] },
  { key: "pulse", letter: "P", label: "心率", options: ["無心率", "＜100／分", "≥100／分"] },
  { key: "grimace", letter: "G", label: "刺激反應", options: ["無反應", "皺眉／反應弱", "咳、噴嚏、哭或退縮"] },
  { key: "activity", letter: "A", label: "肌張力", options: ["鬆軟", "四肢輕度屈曲", "主動活動"] },
  { key: "respiration", letter: "R", label: "呼吸", options: ["無呼吸", "慢、不規則或弱哭", "呼吸佳、強哭"] },
];
const apgarTimes: ApgarTime[] = [1, 5, 10, 15, 20];
const blankApgar = (): ApgarScores => ({ appearance: null, pulse: null, grimace: null, activity: null, respiration: null });

export default function Home() {
  const [confirmedNeonatalDays, setConfirmedNeonatalDays] = useState(false);
  const [confirmedPuberty, setConfirmedPuberty] = useState(false);
  const [mode, setMode] = useState<InputMode>("length");
  const [length, setLength] = useState(92);
  const [weight, setWeight] = useState(14);
  const [guessBand, setGuessBand] = useState<BestGuessBand>("young");
  const [guessAge, setGuessAge] = useState(3);
  const [vitalKey, setVitalKey] = useState<VitalKey>("infant");
  const [ageYears, setAgeYears] = useState(4);
  const [apgarTime, setApgarTime] = useState<ApgarTime>(1);
  const [apgarByTime, setApgarByTime] = useState<Record<ApgarTime, ApgarScores>>({ 1: blankApgar(), 5: blankApgar(), 10: blankApgar(), 15: blankApgar(), 20: blankApgar() });
  const lengthZone = useMemo(() => zones.find((z, i) => length >= z.minCm && (length < z.maxCm || i === zones.length - 1)) ?? zones[0], [length]);
  const guessWeight = guessBand === "infant" ? (guessAge + 9) / 2 : guessBand === "young" ? 2 * (guessAge + 5) : 4 * guessAge;
  const activeWeight = mode === "bestGuess" ? guessWeight : weight;
  const weightZone = useMemo(() => zones.find((z) => activeWeight <= z.maxKg) ?? zones[zones.length - 1], [activeWeight]);
  const zone = mode === "length" ? lengthZone : weightZone;
  const workingWeight = mode === "length" ? zone.estimate : activeWeight;
  const outsideColorRange = workingWeight < 3 || workingWeight > 36;
  const selectedVital = vitals[vitalKey];
  const glucoseAgeConfirmed = (vitalKey !== "newborn" || confirmedNeonatalDays) && (vitalKey !== "teen" || confirmedPuberty);
  const selectedRule50 = glucoseAgeConfirmed ? rule50[vitalKey] : {...rule50[vitalKey], mlKg: null, solution: "先確認年齡條件"};
  const tidalMl = `${Number((workingWeight * selectedVital.tidalMin).toFixed(1))}–${Number((workingWeight * selectedVital.tidalMax).toFixed(1))} mL`;
  const rule50Ml = selectedRule50.mlKg === null ? "勿自行外推" : `${Number((workingWeight * selectedRule50.mlKg).toFixed(1))} mL`;
  const midazolam = workingWeight > 40
    ? { dose: "10 mg", volume: "2 mL", note: ">40 kg" }
    : workingWeight >= 13
      ? { dose: "5 mg", volume: "1 mL", note: "13–40 kg" }
      : { dose: "未列示", volume: "勿自行外推", note: "<13 kg" };
  const diclofenac = vitalKey === "newborn" || vitalKey === "infant"
    ? { dose: "未滿 1 歲不依本卡給藥", note: "TFDA 仿單列一歲以上；依醫療指導" }
    : workingWeight > 12
      ? { dose: "1 顆 · 12.5 mg", note: "PHPLS：體重＞12 kg" }
      : workingWeight > 6
        ? { dose: "½ 顆 · 6.25 mg", note: "PHPLS：體重＞6 kg 至 12 kg" }
        : { dose: "教材未列示", note: "體重≤6 kg，不自行外推" };
  const croupMax = vitalKey === "newborn" || vitalKey === "infant" || vitalKey === "toddler" ? 2.5 : vitalKey === "preschool" ? null : 5;
  const croupDose = croupMax === null ? null : Math.min(workingWeight * 0.5, croupMax);
  const doseText = (value: number) => Number(value.toFixed(2));
  const arrestEpiMg = Math.min(workingWeight * 0.01, 1);
  const arrestEpiMl = arrestEpiMg / 0.1;
  const anaphylaxisEpiMg = Math.min(workingWeight * 0.01, 0.3);
  const amiodaroneFirst = Math.min(workingWeight * 5, 300);
  const amiodaroneRepeat = Math.min(workingWeight * 5, 150);
  const lidocaineMg = workingWeight;
  const selectZone = (index: number) => { setMode("length"); setLength((zones[index].minCm + zones[index].maxCm) / 2); };
  const formulaAges: Partial<Record<VitalKey, { min: number; max: number; initial: number }>> = { toddler: { min: 1, max: 3, initial: 2 }, preschool: { min: 4, max: 5, initial: 4 }, school: { min: 6, max: 10, initial: 8 } };
  const formulaAge = formulaAges[vitalKey];
  const selectVital = (key: VitalKey) => { setVitalKey(key); const range = formulaAges[key]; if (range) setAgeYears(range.initial); };
  const guessSettings = guessBand === "infant"
    ? { min: 1, max: 11, unit: "月", formula: "（月齡＋9）÷2", label: "1–11 個月" }
    : guessBand === "young"
      ? { min: 1, max: 4, unit: "歲", formula: "2×（年齡＋5）", label: "1–4 歲" }
      : { min: 5, max: 14, unit: "歲", formula: "4×年齡", label: "5–14 歲" };
  const selectGuessBand = (band: BestGuessBand) => {
    setGuessBand(band);
    setGuessAge(band === "infant" ? 6 : band === "young" ? 3 : 8);
  };
  const currentApgar = apgarByTime[apgarTime];
  const apgarAnswered = Object.values(currentApgar).filter((value) => value !== null).length;
  const apgarTotal = Object.values(currentApgar).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const apgarSummary = apgarAnswered < 5 ? `尚有 ${5 - apgarAnswered} 項未評` : apgarTotal >= 7 ? "7–10｜狀況較穩定" : apgarTotal >= 4 ? "4–6｜中度異常" : "0–3｜低分";
  const setApgarScore = (key: ApgarKey, score: number) => setApgarByTime((current) => ({ ...current, [apgarTime]: { ...current[apgarTime], [key]: score } }));
  const resetApgar = () => setApgarByTime((current) => ({ ...current, [apgarTime]: blankApgar() }));

  return (
    <main className="app-shell" style={{ "--zone": zone.color, "--zone-ink": zone.ink, "--wash": zone.wash } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand"><span>PEDS</span><i>/</i><b>TAPE</b><small>小兒尺 × 正常生命徵象</small></div>
        <div className="active-zone"><span style={{ background: zone.color }} />目前：{outsideColorRange ? "超出尺範圍" : zone.label + "色區"}</div>
        <p>手機橫放滿版｜實測體重與地方 SOP 優先</p>
      </header>
      <div className="workspace">
        <section className="tape-panel">
          <div className="measure-bar">
            <div className="section-title"><span>01</span><div><b>小兒尺色區</b><small>調整身長或體重，自動切換色區</small></div></div>
            <div className="mode-tabs"><button className={mode === "length" ? "active" : ""} onClick={() => setMode("length")}>身長</button><button className={mode === "weight" ? "active" : ""} onClick={() => setMode("weight")}>體重</button><button className={mode === "bestGuess" ? "active" : ""} onClick={() => setMode("bestGuess")}>Best Guess</button></div>
            <label className="measure-value" htmlFor="measure"><span>{mode === "length" ? "仰躺身長" : mode === "weight" ? "實測體重" : "年齡"}</span><b>{(mode === "length" ? length : mode === "weight" ? weight : guessAge).toFixed(mode === "bestGuess" ? 0 : 1)}<small>{mode === "length" ? "cm" : mode === "weight" ? "kg" : guessSettings.unit}</small></b></label>
            <input id="measure" className="measure-range" type="range" min={mode === "length" ? 46.8 : mode === "weight" ? 1 : guessSettings.min} max={mode === "length" ? 143.2 : mode === "weight" ? 50 : guessSettings.max} step={mode === "length" ? .1 : mode === "weight" ? .5 : 1} value={mode === "length" ? length : mode === "weight" ? weight : guessAge} onChange={(e) => mode === "length" ? setLength(Number(e.target.value)) : mode === "weight" ? setWeight(Number(e.target.value)) : setGuessAge(Number(e.target.value))} />
          </div>
          {mode === "bestGuess" && <div className="best-guess-bar">
            <div className="guess-bands"><button className={guessBand === "infant" ? "active" : ""} onClick={() => selectGuessBand("infant")}>1–11 月</button><button className={guessBand === "young" ? "active" : ""} onClick={() => selectGuessBand("young")}>1–4 歲</button><button className={guessBand === "older" ? "active" : ""} onClick={() => selectGuessBand("older")}>5–14 歲</button></div>
            <p><b>Best Guess｜{guessSettings.label}</b><span>體重（kg）＝{guessSettings.formula}</span></p>
            <strong>估重 {Number(guessWeight.toFixed(1))} kg</strong>
            <small>{guessWeight < 3 || guessWeight > 36 ? "估重已超出本小兒尺 3–36 kg 色區；勿以色帶器材尺寸直接外推。" : "無法取得實測體重或身長時的備援估算；實測體重與身長尺優先。"}</small>
          </div>}
          <article className="selected-zone">
            <div className="selected-zone-head">
              <strong>{outsideColorRange ? "超界" : zone.label}<small>色區</small></strong>
              <div><span>身長區間</span><b>{outsideColorRange ? "不適用" : `${zone.minCm}–${zone.maxCm} cm`}</b></div>
              <div><span>色帶體重</span><b>{outsideColorRange ? "超出 3–36 kg" : `${zone.minKg}–${zone.maxKg} kg`}</b></div>
            </div>
            <div className="selected-zone-data">
              <div><span>計算用體重</span><b>{workingWeight.toFixed(1)}</b><small>kg</small></div>
              <div><span>ETT 有囊</span><b>{outsideColorRange ? "超出尺範圍" : zone.cuffed}</b><small>內徑 mm</small></div>
              <div><span>ETT 無囊</span><b>{outsideColorRange ? "超出尺範圍" : zone.uncuffed}</b><small>內徑 mm</small></div>
              <div><span>口插深度</span><b>{outsideColorRange ? "超出尺範圍" : zone.depth}</b><small>cm 參考</small></div>
              <div><span>喉罩 LMA</span><b>{outsideColorRange ? "依器材 IFU" : lmaFor(workingWeight)}</b><small>尺寸</small></div>
            </div>
          </article>
          <div className="zone-strip" aria-label="九色小兒尺位置">
            {zones.map((item, index) => <button key={item.key} className={zone.key === item.key ? "active" : ""} style={{ "--swatch": item.color, "--swatch-ink": item.ink } as React.CSSProperties} onClick={() => selectZone(index)} aria-label={"切換至" + item.label + "色區"}><b>{item.label}</b><small>{item.minKg}–{item.maxKg}</small></button>)}
          </div>
          <div className="tape-note"><b>{mode === "bestGuess" ? "Best Guess 注意：" : "讀法："}</b>{mode === "bestGuess" ? "年齡公式僅供緊急備援估重，個體、族群與體型差異可造成誤差；新生兒、肥胖兒或體型明顯異常者尤其須謹慎。能量測時以實測體重或身長式工具優先。" : "仰躺、頭頂對齊尺端，沿身體拉到足跟讀取色區。色帶與器材尺寸只供初始估算，須依器材標示複核。"}</div>
        </section>
        <aside className="vitals-panel">
          <div className="section-title"><span>02</span><div><b>小兒尺對應速查</b><small>目前 {outsideColorRange ? "超出尺範圍" : zone.label + "色區"}｜計算用體重 {workingWeight.toFixed(1)} kg</small></div></div>
          <div className="mobile-weight-link"><b>{zone.label}色 · {workingWeight.toFixed(1)} kg</b><span>選擇實際年齡層後，下方數值會依目前體重計算</span></div>
          <div className="age-tabs">{(Object.keys(vitals) as VitalKey[]).map((key) => <button key={key} className={vitalKey === key ? "active" : ""} onClick={() => selectVital(key)}><b>{vitals[key].label}</b><small>{vitals[key].age}</small></button>)}</div>
          <div className="vital-focus"><div className="focus-age"><span>{selectedVital.label}</span><b>{selectedVital.age}</b></div><div><span>心率</span><b>{selectedVital.heart}</b><small>bpm</small></div><div><span>呼吸率</span><b>{selectedVital.breathing}</b><small>次／分</small></div><div className="pressure"><span>正常血壓平均值</span><b>{selectedVital.pressure}</b><small>低血壓警戒：{selectedVital.lowPressure} mmHg</small></div><div className="tidal"><span>潮氣量參考</span><b>{selectedVital.tidalMin}–{selectedVital.tidalMax} mL/kg</b><small>{tidalMl}｜{selectedVital.tidalNote}</small></div></div>
          <div className="formula-card">{formulaAge ? <><label htmlFor="age-years"><span>補充｜相對應年齡最低收縮壓公式</span><b>{ageYears} 歲</b></label><input id="age-years" type="range" min={formulaAge.min} max={formulaAge.max} step="1" value={ageYears} onChange={(e) => setAgeYears(Number(e.target.value))} /><p>SBP＜70＋(年齡×2)＝<b>＜{70 + ageYears * 2} mmHg</b></p></> : <><label><span>補充｜{selectedVital.label}低血壓警戒</span></label><p>最低收縮壓判定：<b>{selectedVital.lowPressure} mmHg</b></p></>}</div>
          {vitalKey === "newborn" && <section className="newborn-oxygen-card" aria-labelledby="newborn-oxygen-title">
            <div className="newborn-oxygen-title"><span>出生轉銜／復甦起始</span><b id="newborn-oxygen-title">出生週數 × 初始 FiO₂</b></div>
            <table><caption>需要呼吸支持時的初始氧氣濃度</caption><thead><tr><th>出生週數</th><th>初始 FiO₂</th><th>補充氧氣提醒</th></tr></thead><tbody><tr><th>≥35 週</th><td><b>21%</b><small>室內空氣</small></td><td>初始不加額外氧；需要 PPV／CPAP 時仍依器材建立氣體流量。</td></tr><tr><th>32–34 週</th><td><b>21–30%</b><small>依反應滴定</small></td><td>備妥混氧器，由低濃度開始並依右手 SpO₂ 與心率調整。</td></tr><tr><th>＜32 週</th><td><b>≥30%</b><small>混氧設定</small></td><td>使用混氧器設定濃度，再依右手 SpO₂ 與心率調整。</td></tr></tbody></table>
            <div className="newborn-spo2"><span>導管前 SpO₂｜右手／手腕</span><b>3 分 70–75% · 5 分 80–85% · 10 分 85–95%</b></div>
            <p><strong>FiO₂ ≠ L/min：</strong>FiO₂ 是氧氣濃度；流量是驅動 T-piece、CPAP 或 BVM 的氣體量，須依設備說明與地方 SOP 設定。即使 FiO₂ 21%，器材仍可能需要氣體流量。</p>
            <small>每 30 秒檢查氧氣設定與 SpO₂；SpO₂＞95% 應下調氧氣。胸外按壓期間使用 FiO₂ 100%，取得可靠 SpO₂ 後再滴定。本站依 PHPLS 2026 教材採三層分組；RCUK 2025 採 ≥32／＜32 週兩層分組，出勤與考試以現行地方 SOP／指定版本為準。</small>
            <a href="https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/newborn-resuscitation-and-support-transition-infants-birth" target="_blank" rel="noreferrer">比較｜RCUK 2025 Newborn Life Support ↗</a>
          </section>}
          {vitalKey === "newborn" && <section className="apgar-card" aria-labelledby="apgar-title">
            <div className="apgar-head"><div><span>出生後狀態紀錄</span><b id="apgar-title">APGAR SCORE</b><small>Appearance · Pulse · Grimace · Activity · Respiration</small></div><div className="apgar-total"><strong>{apgarAnswered === 5 ? apgarTotal : "—"}<small>/10</small></strong><b>{apgarTime} 分鐘｜{apgarSummary}</b></div></div>
            <div className="apgar-times" aria-label="選擇 APGAR 評估時間">{apgarTimes.map((time) => { const values = Object.values(apgarByTime[time]); const complete = values.every((value) => value !== null); const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0); return <button key={time} className={apgarTime === time ? "active" : ""} onClick={() => setApgarTime(time)} aria-pressed={apgarTime === time}><span>{time} 分</span><b>{complete ? total : "—"}</b></button>; })}<button className="reset" onClick={resetApgar}>清除此時間</button></div>
            <div className="apgar-list">{apgarItems.map((item) => <article key={item.key}><header><strong>{item.letter}</strong><b>{item.label}</b></header><div>{item.options.map((description, score) => <button key={score} className={currentApgar[item.key] === score ? "active" : ""} onClick={() => setApgarScore(item.key, score)} aria-pressed={currentApgar[item.key] === score}><b>{score}</b><small>{description}</small></button>)}</div></article>)}</div>
            <p><strong>先復甦、再計分：</strong>APGAR 不能用來決定是否開始復甦，也不能延誤黃金一分鐘處置。所有新生兒記錄 1、5 分鐘；若 5 分鐘＜7，之後每 5 分鐘重評至 20 分鐘。</p>
            <small>5 分鐘分類僅供足月／晚期早產兒紀錄參考；分數受早產、母體藥物與復甦措施影響，不能單獨診斷窒息或預測個別神經學結果。膚色具主觀性，氧合判斷應使用血氧監測。</small>
            <a href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/10/the-apgar-score" target="_blank" rel="noreferrer">AAP／ACOG APGAR 指引 ↗</a>
          </section>}
          <div className="rule50-card">
            <div className="rule50-title"><b>RULE 50</b><span>低血糖處置速查</span></div>{vitalKey === "newborn" && <label><input type="checkbox" checked={confirmedNeonatalDays} onChange={e => setConfirmedNeonatalDays(e.target.checked)} />已確認出生未滿28日及本場採用方案</label>}{vitalKey === "teen" && <label><input type="checkbox" checked={confirmedPuberty} onChange={e => setConfirmedPuberty(e.target.checked)} />已確認符合教材青春期條件及地方SOP（不能只依大於10歲）</label>}
            <div className="rule50-main"><span>{selectedRule50.threshold}</span><b>{selectedRule50.solution}{selectedRule50.mlKg === null ? "" : ` · ${selectedRule50.mlKg} mL/kg`}</b><strong>{rule50Ml}</strong></div>
            <p>{selectedRule50.note}｜只顯示目前年齡對應方案；4 歲至青春期前未列示時不自行外推｜依救護層級、醫療指導與地方 SOP 執行</p>
          </div>
          <div className="midazolam-card">
            <div><b>MIDAZOLAM</b><span>癲癇重積狀態｜IM 單次</span></div>
            <p><span>教材體重分段 {midazolam.note}</span><b>{midazolam.dose}</b><strong>{midazolam.volume}</strong></p>
            <small>藥物濃度 5 mg/mL｜13–40 kg：5 mg；&gt;40 kg：10 mg；教材實務抽藥最小單位 0.1 mL＝0.5 mg。教材未列 &lt;13 kg 劑量，不自行按比例外推。</small>
          </div>
          <div className="diclofenac-card">
            <div><b>DICLOFENAC</b><span>Voren 處方栓劑｜12.5 mg／顆</span></div>
            <p><span>{diclofenac.note}</span><strong>{diclofenac.dose}</strong></p>
            <small>PHPLS 速查：＞6 kg 半顆、＞12 kg 一顆。TFDA 仿單列為處方藥且兒童用法限一歲以上；先核對 NSAID 禁忌、適應症與地方 SOP。是否可分割、先進端與留置方式依實際製劑說明；退燒不能取代抗痙攣處置。</small>
            <a href="https://www.fda.gov.tw/tc/includes/GetFile.ashx?id=f636694231199735860" target="_blank" rel="noreferrer">TFDA Diclofenac 栓劑仿單 ↗</a>
          </div>
          <section className="drug-section">
            <div className="drug-title"><b>小兒急救藥物劑量</b><span>依 {workingWeight.toFixed(1)} kg 即時計算</span></div>
            <div className="drug-list">
              <article><div><b>Epinephrine</b><span>OHCA｜IV／IO</span></div><strong>{doseText(arrestEpiMg)} mg · {doseText(arrestEpiMl)} mL</strong><small>0.01 mg/kg＝0.1 mL/kg（0.1 mg/mL）；每次最多 1 mg，每 3–5 分鐘一次</small></article>
              <article><div><b>Amiodarone</b><span>VF／無脈 VT｜IV／IO</span></div><strong>首劑 {doseText(amiodaroneFirst)} mg</strong><small>5 mg/kg；最多 3 劑。首劑上限 300 mg，第 2、3 劑各上限 150 mg（本體重重複劑量 {doseText(amiodaroneRepeat)} mg）</small></article>
              <article><div><b>Lidocaine</b><span>VF／無脈 VT 替代｜IV／IO</span></div><strong>{doseText(lidocaineMg)} mg</strong><small>1 mg/kg，共 1 劑；作為 Amiodarone 替代方案</small></article>
              <article><div><b>Epinephrine</b><span>過敏不穩定｜IM</span></div><strong>{doseText(anaphylaxisEpiMg)} mg</strong><small>0.01 mg/kg；每次最多 0.3 mg，必要時每 5–10 分鐘重複</small></article>
              <article><div><b>WHEEZING</b><span>下呼吸道哮鳴｜IH</span></div><strong>核准自備 MDI 2 噴</strong><small>每噴間隔 1 分鐘；DPI 依製劑裝載後吸入，不套用噴霧操作。霧化藥須先確認成分、mg/mL、每支容量與處方；未核對規格不以「半支」給藥</small></article>
              <article><div><b>Epinephrine</b><span>CROUP 哮吼｜IH</span></div><strong>{croupDose === null ? "4–5 歲：核對實際年齡" : `${doseText(croupDose)} mg`}</strong><small>0.5 mg/kg、不稀釋；PHPLS：＜4 歲上限 2.5 mg、＞4 歲上限 5 mg，4 歲整依 SOP／醫療指導</small></article>
              <article><div><b>Epinephrine</b><span>嚴重 WHEEZING｜SC</span></div><strong>0.3–0.5 mg</strong><small>須先聯絡醫療指導；心臟病、高血壓、心律不整或 HR≥150／分禁用。不可與過敏 IM 或哮吼 IH 路徑混淆</small></article>
            </div>
            <p>所有計算均為教材速查值，須先確認適應症、濃度、途徑、上限、救護層級與地方 SOP；給藥前由第二人交叉核對。</p>
          </section>
          <footer><b>避免過度通氣</b><p>手壓 BVM 以適度胸廓起伏為準；持續重評心率、氧合與呼氣末二氧化碳。</p></footer>
        </aside>
      </div>
      <div className="portrait-note">請將手機橫放，以完整查看目前色區與生命徵象。</div>
    </main>
  );
}
