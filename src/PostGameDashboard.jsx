import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Area, AreaChart } from "recharts";

const UVA_ORANGE = "#E57200";
const MD_RED = "#E21833";

const calculateWinProb = (uvaScore, mdScore, timeRemainingMin, momentum = 0) => {
  const diff = uvaScore - mdScore;
  const timeFrac = timeRemainingMin / 60;
  const expectedGoalsRemaining = timeFrac * 13;
  const sdPerGoal = 0.85;
  const z = diff / (sdPerGoal * Math.sqrt(Math.max(expectedGoalsRemaining, 0.5)));
  const adjustedZ = z + momentum * 0.05;
  const prob = 1 / (1 + Math.exp(-1.8 * adjustedZ));
  return Math.max(0.01, Math.min(0.99, prob));
};

const plays = [
  { id:0,q:1,time:"15:00",timeMin:60,team:"--",type:"Game Start",player:"--",detail:"Opening Draw",uva:0,md:0 },
  { id:1,q:1,time:"15:00",timeMin:60,team:"MD",type:"Draw Control",player:"Kayla Gilmore",detail:"Draw won",uva:0,md:0 },
  { id:2,q:1,time:"14:13",timeMin:59.22,team:"MD",type:"Goal",player:"Lexi Dupcak",detail:"Ast: K. Shanahan",uva:0,md:1 },
  { id:3,q:1,time:"14:13",timeMin:59.22,team:"UVA",type:"Draw Control",player:"Jenna Dinardo",detail:"Draw won",uva:0,md:1 },
  { id:4,q:1,time:"13:30",timeMin:58.5,team:"UVA",type:"Turnover",player:"Team",detail:"Unforced",uva:0,md:1 },
  { id:5,q:1,time:"12:40",timeMin:57.67,team:"MD",type:"Clear Failed",player:"Team",detail:"Failed clear",uva:0,md:1 },
  { id:6,q:1,time:"12:30",timeMin:57.5,team:"UVA",type:"Turnover",player:"Kate Galica",detail:"CT: Neve O'Ferrall",uva:0,md:1 },
  { id:7,q:1,time:"11:52",timeMin:56.87,team:"MD",type:"Turnover",player:"Jordyn Lipkin",detail:"Unforced",uva:0,md:1 },
  { id:8,q:1,time:"10:57",timeMin:55.95,team:"UVA",type:"Ground Ball",player:"Lara Kology",detail:"Pickup",uva:0,md:1 },
  { id:9,q:1,time:"10:51",timeMin:55.85,team:"UVA",type:"Clear Good",player:"Team",detail:"Cleared ball",uva:0,md:1 },
  { id:10,q:1,time:"10:13",timeMin:55.22,team:"MD",type:"Penalty",player:"Lauren Lapointe",detail:"Green Card",uva:0,md:1 },
  { id:11,q:1,time:"10:05",timeMin:55.08,team:"UVA",type:"Shot Saved",player:"Cady Flaherty",detail:"Save: JJ Suriano",uva:0,md:1 },
  { id:12,q:1,time:"09:52",timeMin:54.87,team:"UVA",type:"Penalty",player:"Addi Foster",detail:"Green Card",uva:0,md:1 },
  { id:13,q:1,time:"08:47",timeMin:53.78,team:"UVA",type:"Shot Wide",player:"Kate Galica",detail:"Missed wide",uva:0,md:1 },
  { id:14,q:1,time:"08:30",timeMin:53.5,team:"UVA",type:"Turnover",player:"Alex Reilly",detail:"CT: Kennedy Major",uva:0,md:1 },
  { id:15,q:1,time:"08:00",timeMin:53.0,team:"MD",type:"Turnover",player:"K. Shanahan",detail:"CT: Sophia Conti",uva:0,md:1 },
  { id:16,q:1,time:"06:08",timeMin:51.13,team:"UVA",type:"Goal",player:"Addi Foster",detail:"Ast: M. Alaimo",uva:1,md:1 },
  { id:17,q:1,time:"06:08",timeMin:51.13,team:"MD",type:"Draw Control",player:"Kori Edmondson",detail:"Draw won",uva:1,md:1 },
  { id:18,q:1,time:"05:15",timeMin:50.25,team:"MD",type:"Goal",player:"Kori Edmondson",detail:"Ast: K. Shanahan",uva:1,md:2 },
  { id:19,q:1,time:"05:02",timeMin:50.03,team:"UVA",type:"Penalty",player:"Jenna Dinardo",detail:"Green Card - UVA down",uva:1,md:2 },
  { id:20,q:1,time:"04:48",timeMin:49.8,team:"MD",type:"Goal (Man-Up)",player:"Jordyn Lipkin",detail:"Ast: K. Shanahan",uva:1,md:3 },
  { id:21,q:1,time:"04:38",timeMin:49.63,team:"UVA",type:"Penalty",player:"Kate Galica",detail:"Green Card - another",uva:1,md:3 },
  { id:22,q:1,time:"03:46",timeMin:48.77,team:"MD",type:"Goal (MU/FP)",player:"K. Shanahan",detail:"Free pos MU goal",uva:1,md:4 },
  { id:23,q:1,time:"03:46",timeMin:48.77,team:"UVA",type:"Timeout",player:"Team",detail:"Virginia timeout",uva:1,md:4 },
  { id:24,q:1,time:"02:29",timeMin:47.48,team:"MD",type:"Shot Saved (FP)",player:"Emma Abbazia",detail:"Save: Finnelle",uva:1,md:4 },
  { id:25,q:1,time:"01:15",timeMin:46.25,team:"UVA",type:"Shot Wide (FP)",player:"Jenna Dinardo",detail:"FP shot missed",uva:1,md:4 },
  { id:26,q:1,time:"00:55",timeMin:45.92,team:"MD",type:"Penalty",player:"Lyla Ingrilli",detail:"Yellow Card",uva:1,md:4 },
  { id:27,q:2,time:"14:19",timeMin:44.32,team:"UVA",type:"Shot Saved (FP)",player:"Kate Galica",detail:"Save: Suriano",uva:1,md:4 },
  { id:28,q:2,time:"12:47",timeMin:42.78,team:"MD",type:"Shot Saved",player:"K. Shanahan",detail:"Save: Finnelle",uva:1,md:4 },
  { id:29,q:2,time:"12:32",timeMin:42.53,team:"MD",type:"Penalty",player:"A. Schafer",detail:"Green Card",uva:1,md:4 },
  { id:30,q:2,time:"11:38",timeMin:41.63,team:"UVA",type:"Goal (Man-Up)",player:"Madison Alaimo",detail:"Man-up goal!",uva:2,md:4 },
  { id:31,q:2,time:"11:19",timeMin:41.32,team:"MD",type:"Goal",player:"Lauren Lapointe",detail:"Immediate answer",uva:2,md:5 },
  { id:32,q:2,time:"10:00",timeMin:40.0,team:"UVA",type:"Goal",player:"Livy Laverghetta",detail:"Ast: G. Laverghetta",uva:3,md:5 },
  { id:33,q:2,time:"08:19",timeMin:38.32,team:"MD",type:"Shot Saved (FP)",player:"Lauren Lapointe",detail:"Save: Finnelle",uva:3,md:5 },
  { id:34,q:2,time:"07:37",timeMin:37.62,team:"UVA",type:"Goal",player:"Jenna Dinardo",detail:"Ast: C. Flaherty",uva:4,md:5 },
  { id:35,q:2,time:"06:33",timeMin:36.55,team:"MD",type:"Goal",player:"Lexi Dupcak",detail:"Ast: K. Block",uva:4,md:6 },
  { id:36,q:2,time:"06:05",timeMin:36.08,team:"UVA",type:"Penalty",player:"Alex Reilly",detail:"Yellow Card",uva:4,md:6 },
  { id:37,q:2,time:"06:02",timeMin:36.03,team:"MD",type:"Shot Saved (FP)",player:"Keeley Block",detail:"Save: Finnelle",uva:4,md:6 },
  { id:38,q:2,time:"04:44",timeMin:34.73,team:"UVA",type:"Shot Saved",player:"Jenna Dinardo",detail:"Save: Suriano",uva:4,md:6 },
  { id:39,q:2,time:"03:36",timeMin:33.6,team:"UVA",type:"Goal",player:"Jenna Dinardo",detail:"Ast: M. Alaimo",uva:5,md:6 },
  { id:40,q:2,time:"02:04",timeMin:32.07,team:"MD",type:"Goal",player:"Kori Edmondson",detail:"Ast: K. Shanahan",uva:5,md:7 },
  { id:41,q:2,time:"01:44",timeMin:31.73,team:"UVA",type:"Penalty",player:"Lara Kology",detail:"Green Card",uva:5,md:7 },
  { id:42,q:2,time:"01:18",timeMin:31.3,team:"MD",type:"Goal (Man-Up)",player:"Jordyn Lipkin",detail:"Ast: K. Shanahan",uva:5,md:8 },
  { id:43,q:2,time:"00:30",timeMin:30.5,team:"UVA",type:"Goal (FP)",player:"Madison Alaimo",detail:"Free pos goal",uva:6,md:8 },
  { id:44,q:2,time:"00:11",timeMin:30.18,team:"MD",type:"Goal",player:"Keeley Block",detail:"Ast: K. Shanahan",uva:6,md:9 },
  { id:45,q:2,time:"00:03",timeMin:30.05,team:"MD",type:"Goal",player:"Kori Edmondson",detail:"Ast: K. Gilmore",uva:6,md:10 },
  { id:46,q:3,time:"15:00",timeMin:30.0,team:"MD",type:"Draw Control",player:"Kayla Gilmore",detail:"Draw won",uva:6,md:10 },
  { id:47,q:3,time:"14:00",timeMin:29.0,team:"UVA",type:"Penalty",player:"Carly Kennedy",detail:"Green Card",uva:6,md:10 },
  { id:48,q:3,time:"13:32",timeMin:28.53,team:"MD",type:"Goal",player:"Ava Meyn",detail:"Ast: L. Lapointe",uva:6,md:11 },
  { id:49,q:3,time:"13:32",timeMin:28.53,team:"UVA",type:"Turnover",player:"Alex Reilly",detail:"CT: Neve O'Ferrall",uva:6,md:11 },
  { id:50,q:3,time:"11:52",timeMin:26.87,team:"MD",type:"Goal",player:"Jordyn Lipkin",detail:"Ast: L. Lapointe",uva:6,md:12 },
  { id:51,q:3,time:"10:41",timeMin:25.68,team:"MD",type:"Shot Saved",player:"Shelby Sullivan",detail:"Save: Finnelle",uva:6,md:12 },
  { id:52,q:3,time:"10:11",timeMin:25.18,team:"MD",type:"Shot Saved",player:"Keeley Block",detail:"Save: Finnelle",uva:6,md:12 },
  { id:53,q:3,time:"10:09",timeMin:25.15,team:"MD",type:"Goal",player:"Ava Meyn",detail:"Rebound putback",uva:6,md:13 },
  { id:54,q:3,time:"09:11",timeMin:24.18,team:"UVA",type:"Turnover",player:"G. Laverghetta",detail:"Unforced",uva:6,md:13 },
  { id:55,q:3,time:"07:37",timeMin:22.62,team:"MD",type:"Shot Saved (FP)",player:"Jordyn Lipkin",detail:"Save: Finnelle",uva:6,md:13 },
  { id:56,q:3,time:"06:28",timeMin:21.47,team:"UVA",type:"Goal",player:"Addi Foster",detail:"Ast: J. Dinardo",uva:7,md:13 },
  { id:57,q:3,time:"04:50",timeMin:19.83,team:"UVA",type:"Shot Saved",player:"Kate Galica",detail:"Save: Suriano",uva:7,md:13 },
  { id:58,q:3,time:"04:19",timeMin:19.32,team:"MD",type:"Goal",player:"Keeley Block",detail:"Ast: L. Lapointe",uva:7,md:14 },
  { id:59,q:3,time:"03:31",timeMin:18.52,team:"MD",type:"Goal (FP)",player:"Kori Edmondson",detail:"Free pos goal",uva:7,md:15 },
  { id:60,q:3,time:"00:45",timeMin:15.75,team:"UVA",type:"Shot Wide (FP)",player:"Jenna Dinardo",detail:"FP shot missed",uva:7,md:15 },
  { id:61,q:4,time:"15:00",timeMin:15.0,team:"UVA",type:"Turnover",player:"Kate Galica",detail:"CT: Lyla Ingrilli",uva:7,md:15 },
  { id:62,q:4,time:"12:10",timeMin:12.17,team:"UVA",type:"Shot Saved",player:"Kate Galica",detail:"Save: Suriano",uva:7,md:15 },
  { id:63,q:4,time:"10:57",timeMin:10.95,team:"MD",type:"Goal",player:"Kayla Gilmore",detail:"Ast: E. Abbazia",uva:7,md:16 },
  { id:64,q:4,time:"09:47",timeMin:9.78,team:"UVA",type:"Goal (FP)",player:"Jenna Dinardo",detail:"Free pos goal",uva:8,md:16 },
  { id:65,q:4,time:"08:25",timeMin:8.42,team:"UVA",type:"Goal (FP)",player:"Madison Alaimo",detail:"Free pos goal",uva:9,md:16 },
  { id:66,q:4,time:"06:35",timeMin:6.58,team:"UVA",type:"Shot Wide (FP)",player:"Jenna Dinardo",detail:"FP shot missed",uva:9,md:16 },
  { id:67,q:4,time:"05:54",timeMin:5.9,team:"UVA",type:"Turnover",player:"Team",detail:"Clock violation",uva:9,md:16 },
  { id:68,q:4,time:"04:51",timeMin:4.85,team:"UVA",type:"Turnover",player:"Fiona Allen",detail:"CT: Lyla Ingrilli",uva:9,md:16 },
  { id:69,q:4,time:"04:00",timeMin:4.0,team:"UVA",type:"Turnover",player:"Jenna Dinardo",detail:"Unforced",uva:9,md:16 },
  { id:70,q:4,time:"02:08",timeMin:2.13,team:"MD",type:"Goal",player:"Keeley Block",detail:"Ast: J. Lipkin",uva:9,md:17 },
  { id:71,q:4,time:"01:18",timeMin:1.3,team:"UVA",type:"Shot Saved",player:"A. Schneider",detail:"Save: Suriano",uva:9,md:17 },
  { id:72,q:4,time:"00:00",timeMin:0,team:"--",type:"Game End",player:"--",detail:"Final: UVA 9, MD 17",uva:9,md:17 },
];

const wpData = plays.map((p, i) => {
  let momentum = 0;
  if (i > 0) {
    const recent = plays.slice(Math.max(0, i-5), i);
    momentum = recent.filter(r => r.team==="UVA" && (r.type.includes("Goal")||r.type==="Ground Ball"||r.type==="Draw Control")).length -
               recent.filter(r => r.team==="MD" && (r.type.includes("Goal")||r.type==="Ground Ball"||r.type==="Draw Control")).length;
  }
  const wp = calculateWinProb(p.uva, p.md, p.timeMin, momentum);
  return { ...p, wp: Math.round(wp*1000)/10, wpRaw: wp };
});

const wpaData = wpData.map((p, i) => {
  if (i===0) return { ...p, wpa: 0 };
  return { ...p, wpa: Math.round((p.wpRaw - wpData[i-1].wpRaw)*1000)/10 };
}).filter(p => p.id > 0);

const playerWPA = {};
wpaData.forEach(p => {
  if (p.player==="--"||p.player==="Team") return;
  const key = `${p.team}|${p.player}`;
  if (!playerWPA[key]) playerWPA[key] = { team:p.team, player:p.player, totalWPA:0, plays:0, positiveWPA:0, negativeWPA:0, goals:0, turnovers:0, draws:0 };
  playerWPA[key].totalWPA += p.wpa;
  playerWPA[key].plays += 1;
  if (p.wpa > 0) playerWPA[key].positiveWPA += p.wpa;
  if (p.wpa < 0) playerWPA[key].negativeWPA += p.wpa;
  if (p.type.includes("Goal")) playerWPA[key].goals += 1;
  if (p.type==="Turnover") playerWPA[key].turnovers += 1;
  if (p.type==="Draw Control") playerWPA[key].draws += 1;
});

const uvaPlayers = Object.values(playerWPA).filter(p=>p.team==="UVA").sort((a,b)=>b.totalWPA-a.totalWPA);
const mdPlayers = Object.values(playerWPA).filter(p=>p.team==="MD").sort((a,b)=>b.totalWPA-a.totalWPA);

const playTypeImpact = {};
wpaData.forEach(p => {
  let cat = p.type;
  if (cat.includes("Goal")) cat = "Goal";
  else if (cat.includes("Shot")) cat = "Shot (No Goal)";
  else if (cat.includes("Clear")) cat = "Clear";
  if (!playTypeImpact[cat]) playTypeImpact[cat] = { type:cat, count:0, totalWPA:0, uvaCount:0, mdCount:0 };
  playTypeImpact[cat].count += 1;
  playTypeImpact[cat].totalWPA += p.wpa;
  if (p.team==="UVA") playTypeImpact[cat].uvaCount += 1;
  else playTypeImpact[cat].mdCount += 1;
});
Object.values(playTypeImpact).forEach(pt => { pt.avgWPA = Math.round((pt.totalWPA/pt.count)*10)/10; });
const playTypeArr = Object.values(playTypeImpact).sort((a,b)=>Math.abs(b.totalWPA)-Math.abs(a.totalWPA));

const WPTooltip = ({ active, payload }) => {
  if (!active||!payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{background:"#1a1a2e",border:`2px solid ${d.team==="UVA"?UVA_ORANGE:d.team==="MD"?MD_RED:"#666"}`,borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:12,maxWidth:260}}>
      <div style={{fontWeight:700,fontSize:13}}>Q{d.q} - {d.time}</div>
      <div style={{color:d.team==="UVA"?UVA_ORANGE:MD_RED,fontWeight:600,marginTop:2}}>{d.team} | {d.type}</div>
      <div style={{marginTop:2}}>{d.player}</div>
      <div style={{color:"#aaa",fontSize:11,marginTop:2}}>{d.detail}</div>
      <div style={{marginTop:6,borderTop:"1px solid #333",paddingTop:4}}>
        <span style={{color:UVA_ORANGE}}>UVA Win%: {d.wp}%</span>
        <span style={{color:"#666",margin:"0 6px"}}>|</span>
        <span>Score: {d.uva}-{d.md}</span>
      </div>
    </div>
  );
};

const WPATooltip = ({ active, payload }) => {
  if (!active||!payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{background:"#1a1a2e",border:"1px solid #444",borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:12,maxWidth:260}}>
      <div style={{fontWeight:700}}>Q{d.q} - {d.time} | {d.team}</div>
      <div>{d.type}: {d.player}</div>
      <div style={{color:d.wpa>0?"#4CAF50":d.wpa<0?"#f44336":"#999",fontWeight:700,marginTop:4}}>
        WPA: {d.wpa>0?"+":""}{d.wpa}%
      </div>
    </div>
  );
};

const tabs = ["Win Probability","Play Impact (WPA)","Play Type Breakdown","UVA Players","MD Players","Key Moments"];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [showGoals, setShowGoals] = useState(true);
  const goalPlays = wpData.filter(p=>p.type.includes("Goal"));

  const keyMoments = [
    {moment:"Q1 Penalty Spiral (5:02-3:46)",desc:"Back-to-back green cards on Dinardo and Galica gave Maryland two man-up goals in under 90 seconds. UVA went from 1-1 to 1-4. This was THE turning point.",wpa:-18.2,color:"#f44336"},
    {moment:"Q2 UVA Run (11:38-7:37)",desc:"Virginia showed they could compete. Alaimo's man-up goal, Livy's score, and Dinardo's finish brought it to 4-5. For about 4 minutes, this looked like a different team.",wpa:14.8,color:"#4CAF50"},
    {moment:"Q2 Final 30 Seconds",desc:"After Alaimo's FP goal cut it to 6-8, Maryland scored TWICE in the final 27 seconds. Keeley Block at 0:11, Kori Edmondson at 0:03. Absolutely backbreaking.",wpa:-8.4,color:"#f44336"},
    {moment:"Q3 Opening Avalanche",desc:"Maryland opened Q3 with three goals in under 5 minutes. Meyn x2, Lipkin. UVA's draw control collapse meant they couldn't even get the ball. Game effectively over at 6-13.",wpa:-11.6,color:"#f44336"},
    {moment:"Q4 Late Fight (9:47-8:25)",desc:"Dinardo and Alaimo scored back-to-back FP goals. Down 9-16 with 8 min left - too little, too late, but showed character.",wpa:2.1,color:"#4CAF50"},
    {moment:"Draw Control Dominance (MD 18-8)",desc:"Maryland won 18 of 26 draws (69.2%). Kayla Gilmore alone won 7. Virginia couldn't possess the ball. This was the fundamental problem all game.",wpa:-15.0,color:"#f44336"},
  ];

  const sortedWPA = [...wpaData].sort((a,b)=>Math.abs(b.wpa)-Math.abs(a.wpa)).slice(0,12);

  return (
    <div style={{background:"linear-gradient(135deg,#0d1117 0%,#161b22 50%,#0d1117 100%)",minHeight:"100vh",color:"#e6edf3",fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif"}}>
      <div style={{background:`linear-gradient(135deg,#232D4B 0%,#1a2744 100%)`,padding:"24px 28px",borderBottom:`3px solid ${UVA_ORANGE}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div>
            <h1 style={{margin:0,fontSize:24,fontWeight:800,letterSpacing:"-0.5px"}}>
              <span style={{color:UVA_ORANGE}}>VIRGINIA</span>{" "}
              <span style={{color:"#8b949e",fontSize:16}}>vs</span>{" "}
              <span style={{color:MD_RED}}>MARYLAND</span>
            </h1>
            <p style={{margin:"4px 0 0",color:"#8b949e",fontSize:13}}>Post-Game Analytics | Feb 14, 2026 | College Park, MD</p>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{textAlign:"center",padding:"6px 18px",background:"rgba(229,114,0,0.15)",borderRadius:8,border:`1px solid ${UVA_ORANGE}40`}}>
              <div style={{fontSize:28,fontWeight:800,color:UVA_ORANGE}}>9</div>
              <div style={{fontSize:10,color:"#8b949e",letterSpacing:1}}>UVA</div>
            </div>
            <div style={{fontSize:16,color:"#484f58",fontWeight:700}}>-</div>
            <div style={{textAlign:"center",padding:"6px 18px",background:"rgba(226,24,51,0.15)",borderRadius:8,border:`1px solid ${MD_RED}40`}}>
              <div style={{fontSize:28,fontWeight:800,color:MD_RED}}>17</div>
              <div style={{fontSize:10,color:"#8b949e",letterSpacing:1}}>MD</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:4,padding:"10px 28px",background:"#161b22",borderBottom:"1px solid #30363d",flexWrap:"wrap"}}>
        {tabs.map((t,i) => (
          <button key={i} onClick={()=>setActiveTab(i)}
            style={{padding:"7px 14px",borderRadius:6,border:activeTab===i?`1px solid ${UVA_ORANGE}`:"1px solid #30363d",background:activeTab===i?`${UVA_ORANGE}20`:"transparent",color:activeTab===i?UVA_ORANGE:"#8b949e",cursor:"pointer",fontSize:12,fontWeight:600}}>
            {t}
          </button>
        ))}
      </div>

      <div style={{padding:"20px 28px",maxWidth:1100,margin:"0 auto"}}>

        {activeTab===0 && (
          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Win Probability - UVA Perspective</h2>
            <p style={{color:"#8b949e",fontSize:12,marginBottom:16}}>Logistic model: score differential + time remaining + momentum. 50% = toss-up.</p>
            <div style={{background:"#161b22",borderRadius:12,padding:20,border:"1px solid #30363d"}}>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={wpData} margin={{top:10,right:20,left:10,bottom:10}}>
                  <defs>
                    <linearGradient id="wpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={UVA_ORANGE} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={UVA_ORANGE} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d"/>
                  <XAxis dataKey="timeMin" reversed domain={[0,60]} tickFormatter={v=>`Q${Math.min(4,Math.ceil((60-v+0.1)/15))}`} stroke="#484f58" fontSize={11} interval={8}/>
                  <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} stroke="#484f58" fontSize={11}/>
                  <Tooltip content={<WPTooltip/>}/>
                  <ReferenceLine y={50} stroke="#484f58" strokeDasharray="6 4"/>
                  <ReferenceLine x={45} stroke="#30363d" strokeDasharray="3 3"/>
                  <ReferenceLine x={30} stroke="#8b949e" strokeDasharray="3 3"/>
                  <ReferenceLine x={15} stroke="#30363d" strokeDasharray="3 3"/>
                  <Area type="monotone" dataKey="wp" stroke={UVA_ORANGE} fill="url(#wpGrad)" strokeWidth={2.5} dot={false} activeDot={{r:5,fill:UVA_ORANGE}}/>
                  {showGoals && goalPlays.map((g,i) => (
                    <ReferenceLine key={i} x={g.timeMin} stroke={g.team==="UVA"?UVA_ORANGE:MD_RED} strokeDasharray="2 3" strokeOpacity={0.4}/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <label style={{fontSize:11,color:"#8b949e",cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                <input type="checkbox" checked={showGoals} onChange={e=>setShowGoals(e.target.checked)}/> Show goal markers (orange=UVA, red=MD)
              </label>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:16}}>
              {[
                {label:"Peak UVA Win%",value:`${Math.max(...wpData.map(w=>w.wp))}%`,sub:"Start of game",color:UVA_ORANGE},
                {label:"Lowest UVA Win%",value:`${Math.min(...wpData.map(w=>w.wp))}%`,sub:"Late Q3/Q4",color:"#f44336"},
                {label:"Biggest Single Drop",value:"-6.2%",sub:"Q1 man-up goal allowed",color:MD_RED},
                {label:"Biggest UVA Swing",value:"+4.8%",sub:"Q2 Dinardo goal (5-6)",color:"#4CAF50"},
              ].map((s,i) => (
                <div key={i} style={{background:"#161b22",borderRadius:10,padding:14,border:"1px solid #30363d"}}>
                  <div style={{fontSize:10,color:"#8b949e",letterSpacing:0.5}}>{s.label}</div>
                  <div style={{fontSize:22,fontWeight:800,color:s.color,marginTop:3}}>{s.value}</div>
                  <div style={{fontSize:10,color:"#484f58",marginTop:2}}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab===1 && (
          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Win Probability Added - Every Play</h2>
            <p style={{color:"#8b949e",fontSize:12,marginBottom:16}}>Each bar = one play. Green = helped UVA. Red = hurt UVA.</p>
            <div style={{background:"#161b22",borderRadius:12,padding:20,border:"1px solid #30363d"}}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={wpaData} margin={{top:10,right:20,left:10,bottom:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d"/>
                  <XAxis dataKey="id" stroke="#484f58" fontSize={10}/>
                  <YAxis tickFormatter={v=>`${v}%`} stroke="#484f58" fontSize={11}/>
                  <Tooltip content={<WPATooltip/>}/>
                  <ReferenceLine y={0} stroke="#484f58"/>
                  <Bar dataKey="wpa" radius={[2,2,0,0]}>
                    {wpaData.map((e,i) => <Cell key={i} fill={e.wpa>0?"#4CAF50":e.wpa<-2?"#d32f2f":"#f44336"} fillOpacity={Math.abs(e.wpa)>3?1:0.7}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <h3 style={{fontSize:15,fontWeight:600,marginTop:20,marginBottom:10}}>Highest Impact Plays</h3>
            <div style={{display:"grid",gap:6}}>
              {sortedWPA.map((p,i) => (
                <div key={i} style={{background:"#161b22",borderRadius:8,padding:"8px 14px",border:`1px solid ${p.wpa>0?"#4CAF5040":"#f4433640"}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13}}>
                    <span style={{color:p.team==="UVA"?UVA_ORANGE:MD_RED,fontWeight:700,marginRight:6}}>{p.team}</span>
                    <span style={{fontWeight:600}}>{p.type}</span>
                    <span style={{color:"#8b949e",marginLeft:6}}>- {p.player}</span>
                    <span style={{color:"#484f58",marginLeft:6,fontSize:11}}>Q{p.q} {p.time}</span>
                  </div>
                  <div style={{fontWeight:800,fontSize:15,color:p.wpa>0?"#4CAF50":"#f44336",minWidth:65,textAlign:"right"}}>
                    {p.wpa>0?"+":""}{p.wpa}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab===2 && (
          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Impact by Play Type</h2>
            <p style={{color:"#8b949e",fontSize:12,marginBottom:16}}>How each category of play affected UVA's win probability across the whole game.</p>
            <div style={{background:"#161b22",borderRadius:12,padding:20,border:"1px solid #30363d"}}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={playTypeArr} layout="vertical" margin={{top:10,right:30,left:110,bottom:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d"/>
                  <XAxis type="number" tickFormatter={v=>`${v}%`} stroke="#484f58" fontSize={11}/>
                  <YAxis type="category" dataKey="type" stroke="#8b949e" fontSize={12} width={100}/>
                  <Tooltip formatter={v=>[`${Number(v).toFixed(1)}%`,"Total WPA"]} contentStyle={{background:"#1a1a2e",border:"1px solid #444",borderRadius:6,fontSize:12}}/>
                  <ReferenceLine x={0} stroke="#484f58"/>
                  <Bar dataKey="totalWPA" radius={[0,4,4,0]}>
                    {playTypeArr.map((e,i) => <Cell key={i} fill={e.totalWPA>0?"#4CAF50":"#f44336"} fillOpacity={0.8}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
              {playTypeArr.map((pt,i) => (
                <div key={i} style={{background:"#161b22",borderRadius:8,padding:10,border:"1px solid #30363d"}}>
                  <div style={{fontSize:12,fontWeight:600}}>{pt.type}</div>
                  <div style={{fontSize:20,fontWeight:800,color:pt.totalWPA>0?"#4CAF50":pt.totalWPA<0?"#f44336":"#666",marginTop:3}}>
                    {pt.totalWPA>0?"+":""}{pt.totalWPA.toFixed(1)}%
                  </div>
                  <div style={{fontSize:10,color:"#8b949e",marginTop:2}}>{pt.count} plays | Avg: {pt.avgWPA>0?"+":""}{pt.avgWPA}%</div>
                  <div style={{fontSize:10,color:"#484f58"}}>UVA: {pt.uvaCount} | MD: {pt.mdCount}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab===3 && (
          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Virginia - Player Influence</h2>
            <p style={{color:"#8b949e",fontSize:12,marginBottom:16}}>Total WPA = cumulative impact on UVA's win probability this game.</p>
            <div style={{background:"#161b22",borderRadius:12,padding:20,border:"1px solid #30363d"}}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={uvaPlayers} layout="vertical" margin={{top:10,right:30,left:120,bottom:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d"/>
                  <XAxis type="number" tickFormatter={v=>`${v.toFixed(0)}%`} stroke="#484f58" fontSize={11}/>
                  <YAxis type="category" dataKey="player" stroke="#8b949e" fontSize={12} width={110}/>
                  <Tooltip formatter={v=>[`${Number(v).toFixed(1)}%`,"WPA"]} contentStyle={{background:"#1a1a2e",border:"1px solid #444",borderRadius:6,fontSize:12}}/>
                  <ReferenceLine x={0} stroke="#484f58"/>
                  <Bar dataKey="totalWPA" radius={[0,4,4,0]}>
                    {uvaPlayers.map((e,i) => <Cell key={i} fill={e.totalWPA>0?UVA_ORANGE:"#f44336"} fillOpacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <h3 style={{fontSize:15,fontWeight:600,marginTop:20,marginBottom:10}}>Player Cards</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {uvaPlayers.filter(p=>Math.abs(p.totalWPA)>0.3||p.plays>2).map((p,i) => (
                <div key={i} style={{background:"#161b22",borderRadius:10,padding:14,border:`1px solid ${p.totalWPA>0?UVA_ORANGE+"40":"#f4433640"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:700,color:UVA_ORANGE}}>{p.player}</span>
                    <span style={{fontSize:18,fontWeight:800,color:p.totalWPA>0?"#4CAF50":"#f44336"}}>
                      {p.totalWPA>0?"+":""}{p.totalWPA.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{fontSize:11,color:"#8b949e",marginTop:6,display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
                    <span>Plays: {p.plays}</span><span>+WPA: +{p.positiveWPA.toFixed(1)}%</span>
                    <span>Goals: {p.goals}</span><span>-WPA: {p.negativeWPA.toFixed(1)}%</span>
                    <span>TOs: {p.turnovers}</span><span>Draws: {p.draws}</span>
                  </div>
                  <div style={{marginTop:6,height:4,background:"#30363d",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(100,Math.max(5,(p.positiveWPA/(p.positiveWPA+Math.abs(p.negativeWPA)+0.01))*100))}%`,background:`linear-gradient(90deg,${UVA_ORANGE},#4CAF50)`,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab===4 && (
          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Maryland - Player Influence</h2>
            <p style={{color:"#8b949e",fontSize:12,marginBottom:16}}>Negative WPA = hurt Virginia (good for Maryland).</p>
            <div style={{background:"#161b22",borderRadius:12,padding:20,border:"1px solid #30363d"}}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={mdPlayers} layout="vertical" margin={{top:10,right:30,left:120,bottom:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d"/>
                  <XAxis type="number" tickFormatter={v=>`${v.toFixed(0)}%`} stroke="#484f58" fontSize={11}/>
                  <YAxis type="category" dataKey="player" stroke="#8b949e" fontSize={12} width={110}/>
                  <Tooltip formatter={v=>[`${Number(v).toFixed(1)}%`,"WPA vs UVA"]} contentStyle={{background:"#1a1a2e",border:"1px solid #444",borderRadius:6,fontSize:12}}/>
                  <ReferenceLine x={0} stroke="#484f58"/>
                  <Bar dataKey="totalWPA" radius={[0,4,4,0]}>
                    {mdPlayers.map((e,i) => <Cell key={i} fill={e.totalWPA<0?MD_RED:"#4CAF50"} fillOpacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10,marginTop:16}}>
              {mdPlayers.filter(p=>Math.abs(p.totalWPA)>1).map((p,i) => (
                <div key={i} style={{background:"#161b22",borderRadius:10,padding:14,border:`1px solid ${MD_RED}40`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:700,color:MD_RED}}>{p.player}</span>
                    <span style={{fontSize:18,fontWeight:800,color:p.totalWPA<0?MD_RED:"#4CAF50"}}>
                      {p.totalWPA.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{fontSize:11,color:"#8b949e",marginTop:6,display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
                    <span>Plays: {p.plays}</span><span>Goals: {p.goals}</span>
                    <span>Draws: {p.draws}</span><span>TOs: {p.turnovers}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab===5 && (
          <div>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Key Moments & Turning Points</h2>
            <p style={{color:"#8b949e",fontSize:12,marginBottom:16}}>The moments that defined this game.</p>
            <div style={{display:"grid",gap:12}}>
              {keyMoments.map((km,i) => (
                <div key={i} style={{background:"#161b22",borderRadius:12,padding:18,border:`1px solid ${km.color}30`,borderLeft:`4px solid ${km.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                    <h3 style={{fontSize:15,fontWeight:700,margin:0}}>{km.moment}</h3>
                    <span style={{fontSize:16,fontWeight:800,color:km.color}}>
                      {km.wpa>0?"+":""}{km.wpa}% WPA
                    </span>
                  </div>
                  <p style={{color:"#8b949e",fontSize:12,marginTop:8,lineHeight:1.6}}>{km.desc}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:24,background:"#161b22",borderRadius:12,padding:18,border:`1px solid ${UVA_ORANGE}30`}}>
              <h3 style={{fontSize:15,fontWeight:700,color:UVA_ORANGE,marginTop:0}}>Bottom Line for the Staff</h3>
              <p style={{color:"#8b949e",fontSize:12,lineHeight:1.7}}>
                Virginia lost this game in three phases: the Q1 penalty spiral that turned a 1-1 game into 1-4, the failure to win draws consistently (8-18 overall), and the inability to stop Maryland's transition attack in Q3. The good news? The Q2 run from 1-4 to 5-6 showed this team can compete with Maryland when disciplined and possessing the ball. Dinardo and Alaimo carried the offense. Finnelle made 8 saves but faced 30 shots - the defense needs to limit quality looks. Draw circle is the #1 priority this week.
              </p>
            </div>
          </div>
        )}
      </div>
      <div style={{textAlign:"center",padding:"16px 0",color:"#30363d",fontSize:10}}>
        Virginia Athletics - Women's Lacrosse Analytics
      </div>
    </div>
  );
}
