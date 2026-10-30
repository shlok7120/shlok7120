// Draws the contribution calendar as a race: car 75 drives along the year and lights each week.
import { writeFileSync } from "node:fs";

const login = "shlok7120";
const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
  totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}}}}`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}`, "content-type": "application/json" },
  body: JSON.stringify({ query, variables: { login } }),
});
const { data, errors } = await response.json();
if (errors) throw new Error(JSON.stringify(errors));
const { totalContributions, weeks } = data.user.contributionsCollection.contributionCalendar;

const days = weeks.flatMap((week) => week.contributionDays);
const activeDays = days.filter((day) => day.contributionCount > 0).length;
const bestDay = Math.max(...days.map((day) => day.contributionCount));
let stint = 0;
let longestStint = 0;
for (const day of days) {
  stint = day.contributionCount > 0 ? stint + 1 : 0;
  longestStint = Math.max(longestStint, stint);
}

const shades = {
  NONE: "#1b1d24",
  FIRST_QUARTILE: "#5c1a1a",
  SECOND_QUARTILE: "#a51c14",
  THIRD_QUARTILE: "#e10600",
  FOURTH_QUARTILE: "#ffb347",
};
const cell = 13;
const gap = 3;
const left = 24;
const top = 92;
const cycle = 16;
const drive = 0.78;
const step = cell + gap;

const columns = weeks
  .map((week, index) => {
    const squares = week.contributionDays
      .map((day) => `<rect x="${left + index * step}" y="${top + day.weekday * step}" width="${cell}" height="${cell}" rx="2" fill="${shades[day.contributionLevel]}"/>`)
      .join("");
    return `<g class="week" style="animation-delay:${((index / weeks.length) * cycle * drive).toFixed(2)}s">${squares}</g>`;
  })
  .join("");

const stat = (x, value, label) =>
  `<text x="${x}" y="46" class="m big">${value}</text><text x="${x}" y="64" class="m small">${label}</text>`;
const start = left - 44;
const finish = left + weeks.length * step - 44;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 222" width="900" height="222" role="img" aria-label="${totalContributions} contributions in the last 12 months, shown as a race along the contribution calendar">
<style>
.m{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.big{font-size:26px;font-weight:700;fill:#f1efe9}.small{font-size:11px;letter-spacing:.08em;fill:#8b8d98}
.week{animation:lit ${cycle}s linear infinite backwards}
@keyframes lit{0%{opacity:.14}1%{opacity:1}${drive * 100}%{opacity:1}${drive * 100 + 4}%,100%{opacity:.14}}
@media (prefers-reduced-motion:reduce){.week{animation:none}}
</style>
<rect width="900" height="222" rx="10" fill="#0d0e12"/>
<rect x=".5" y=".5" width="899" height="221" rx="10" fill="none" stroke="#2a2c34"/>
${stat(24, totalContributions, "CONTRIBUTIONS")}
${stat(244, activeDays, "DAYS ON TRACK")}
${stat(464, longestStint, "LONGEST STINT, DAYS")}
${stat(704, bestDay, "BEST DAY")}
${columns}
<g>
<animateTransform attributeName="transform" type="translate" values="${start} 76;${finish} 76;${finish} 76" keyTimes="0;${drive};1" dur="${cycle}s" repeatCount="indefinite"/>
<path d="M2 9l9-1 8-3h7l4-3h6l1 3 5 1v4l-6 1H4z" fill="#e10600"/>
<path d="M22 5h7l2 4H18z" fill="#fff"/>
<circle cx="10" cy="11" r="3.4" fill="#111" stroke="#ffb347"/><circle cx="35" cy="11" r="3.4" fill="#111" stroke="#ffb347"/>
</g>
</svg>`;

writeFileSync("assets/season.svg", svg);
console.log(`${totalContributions} contributions, ${activeDays} active days`);
