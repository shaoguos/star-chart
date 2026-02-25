/**
 * 璇玑星图 — Übersicht Widget 主入口
 *
 * 展示北斗七星斗柄指向 + 二十八宿值日星宿 + 节气/地支环
 * 数据源：本地 latest.json（由 generate_daily_data.py 生成）
 *
 * Übersicht Widget API:
 *  - command: shell 命令，输出作为 render 的 output 参数
 *  - refreshFrequency: 刷新间隔（ms）
 *  - render: 返回 JSX
 *  - className: CSS 类名或 emotion CSS 字符串
 */

// ── Widget 配置 ──
// 读取 latest.json 路径（Mac 部署时调整路径）
export const command = `cat /Users/chaishaoguo/.tcm-bar-cache.json 2>/dev/null || echo '{}'`;

// 每 5 分钟刷新
export const refreshFrequency = 300000;

// ── 内联所有依赖（Übersicht 不支持 ES module import）──

// ═══ star-data.js 内容 ═══

const GROUP_COLORS = {
  '东宫苍龙': '#7CB98F',
  '南宫朱雀': '#E07050',
  '西宫白虎': '#C4944A',
  '北宫玄武': '#5A7FA0',
};
const GROUP_ORDER = ['东宫苍龙', '南宫朱雀', '西宫白虎', '北宫玄武'];
const GROUP_SHORT = {
  '东宫苍龙': '苍龙',
  '南宫朱雀': '朱雀',
  '西宫白虎': '白虎',
  '北宫玄武': '玄武',
};
const SEASON_GLOW_COLORS = { '春': '#7CB98F', '夏': '#E07050', '秋': '#C4944A', '冬': '#5A7FA0' };

const MANSIONS = [
  { name: '角木蛟', short: '角', group: '东宫苍龙' },
  { name: '亢金龙', short: '亢', group: '东宫苍龙' },
  { name: '氐土貉', short: '氐', group: '东宫苍龙' },
  { name: '房日兔', short: '房', group: '东宫苍龙' },
  { name: '心月狐', short: '心', group: '东宫苍龙' },
  { name: '尾火虎', short: '尾', group: '东宫苍龙' },
  { name: '箕水豹', short: '箕', group: '东宫苍龙' },
  { name: '斗木獬', short: '斗', group: '北宫玄武' },
  { name: '牛金牛', short: '牛', group: '北宫玄武' },
  { name: '女土蝠', short: '女', group: '北宫玄武' },
  { name: '虚日鼠', short: '虚', group: '北宫玄武' },
  { name: '危月燕', short: '危', group: '北宫玄武' },
  { name: '室火猪', short: '室', group: '北宫玄武' },
  { name: '壁水貐', short: '壁', group: '北宫玄武' },
  { name: '奎木狼', short: '奎', group: '西宫白虎' },
  { name: '娄金狗', short: '娄', group: '西宫白虎' },
  { name: '胃土雉', short: '胃', group: '西宫白虎' },
  { name: '昴日鸡', short: '昴', group: '西宫白虎' },
  { name: '毕月乌', short: '毕', group: '西宫白虎' },
  { name: '觜火猴', short: '觜', group: '西宫白虎' },
  { name: '参水猿', short: '参', group: '西宫白虎' },
  { name: '井木犴', short: '井', group: '南宫朱雀' },
  { name: '鬼金羊', short: '鬼', group: '南宫朱雀' },
  { name: '柳土獐', short: '柳', group: '南宫朱雀' },
  { name: '星日马', short: '星', group: '南宫朱雀' },
  { name: '张月鹿', short: '张', group: '南宫朱雀' },
  { name: '翼火蛇', short: '翼', group: '南宫朱雀' },
  { name: '轸水蚓', short: '轸', group: '南宫朱雀' },
];

const SOLAR_TERMS = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const BIG_DIPPER_STARS = [
  { name: '天枢', ra: 11.062, dec: 61.75, mag: 2.00, role: 'bowl' },
  { name: '天璇', ra: 11.031, dec: 56.38, mag: 2.40, role: 'bowl' },
  { name: '天玑', ra: 11.897, dec: 53.69, mag: 2.50, role: 'bowl' },
  { name: '天权', ra: 12.257, dec: 57.03, mag: 3.40, role: 'pivot' },
  { name: '玉衡', ra: 12.901, dec: 55.96, mag: 1.77, role: 'handle' },
  { name: '开阳', ra: 13.399, dec: 54.93, mag: 2.23, role: 'handle' },
  { name: '摇光', ra: 13.792, dec: 49.31, mag: 1.86, role: 'tip' },
];

function projectDipperStars(radius) {
  const center = BIG_DIPPER_STARS[3];
  const cosCenter = Math.cos(center.dec * Math.PI / 180);
  const projected = BIG_DIPPER_STARS.map(star => ({
    ...star,
    rawX: (star.ra - center.ra) * cosCenter * 15,
    rawY: -(star.dec - center.dec),
  }));
  const maxExtent = Math.max(
    ...projected.map(s => Math.abs(s.rawX)),
    ...projected.map(s => Math.abs(s.rawY)),
  );
  const scale = radius / (maxExtent * 1.3);
  return projected.map(s => ({
    ...s,
    x: s.rawX * scale,
    y: s.rawY * scale,
    size: Math.max(2, 5 - s.mag),
  }));
}

const BOWL_LINES = [[0, 1], [1, 2], [2, 3], [3, 0]];
const HANDLE_LINES = [[3, 4], [4, 5], [5, 6]];

// ═══ handle-calc.js 内容 ═══

const TERM_ANGLES = {
  '冬至': 0, '小寒': 15, '大寒': 30, '立春': 45,
  '雨水': 60, '惊蛰': 75, '春分': 90, '清明': 105,
  '谷雨': 120, '立夏': 135, '小满': 150, '芒种': 165,
  '夏至': 180, '小暑': 195, '大暑': 210, '立秋': 225,
  '处暑': 240, '白露': 255, '秋分': 270, '寒露': 285,
  '霜降': 300, '立冬': 315, '小雪': 330, '大雪': 345,
};

function getDipperData(latestData) {
  if (latestData && latestData.bigDipper) return latestData.bigDipper;
  const termName = latestData?.solarTerm?.name || '冬至';
  const angle = TERM_ANGLES[termName] || 0;
  const dirMap = { 0: '北', 45: '东北', 90: '东', 135: '东南', 180: '南', 225: '西南', 270: '西', 315: '西北' };
  const dir = Object.entries(dirMap).reduce((closest, [a, d]) =>
    Math.abs(angle - Number(a)) < Math.abs(angle - Number(closest[0])) ? [a, d] : closest
  )[1];
  const texts = { '东': '斗柄指东，天下皆春', '南': '斗柄指南，天下皆夏', '西': '斗柄指西，天下皆秋', '北': '斗柄指北，天下皆冬' };
  const mainDir = dir.length === 2 ? dir[1] : dir;
  return { handleAngle: angle, monthDizhi: '子', direction: dir, directionText: texts[mainDir] || `斗柄指${dir}` };
}

// ═══ 渲染函数 ═══

function arcAngle(i, total) { return (i * Math.PI * 2) / total; }
function posAngle(i, total) { return (i * Math.PI * 2) / total - Math.PI / 2; }

function renderStarMapSVG(data, size, height) {
  const h = height || size;
  const cx = size / 2;
  const cy = size / 2;
  const mansionData = data?.mansion || {};
  const currentMansionIdx = (mansionData.index || 1) - 1;
  const termName = data?.solarTerm?.name || '';
  const season = data?.solarTerm?.season || '春';
  const dipperData = getDipperData(data);
  const handleAngle = dipperData.handleAngle || 0;
  const monthDizhi = dipperData.monthDizhi || '子';
  const seasonColor = SEASON_GLOW_COLORS[season] || '#7CB98F';
  const dizhiIdx = DI_ZHI.indexOf(monthDizhi);
  const termIdx = SOLAR_TERMS.indexOf(termName);
  const FF = "font-family=\"PingFang SC, Hiragino Sans GB, sans-serif\"";

  const stars = projectDipperStars(65);

  // ── 计算斗柄旋转角度 ──
  // handleAngle 是罗盘方位角（0°=北/上，顺时针）
  // SVG rotate() 从3点钟方向（右/东）顺时针旋转
  // 地支环坐标系：子=北=上，卯=东=右（标准罗盘布局）
  // 罗盘方位 θ 对应 SVG 角度 (θ - 90°)
  // 需修正初始斗柄朝向（由 RA/Dec 投影决定）
  const tipStar = stars[6]; // 摇光（斗柄末端）
  const initialHandleSVGAngle = Math.atan2(tipStar.y, tipStar.x) * 180 / Math.PI;
  const dipperRotation = (handleAngle - 90 - initialHandleSVGAngle + 720) % 360;

  // ── 北斗连线（加粗提亮）──
  const bowlLinesStr = BOWL_LINES.map(([a, b]) =>
    `<line x1="${stars[a].x}" y1="${stars[a].y}" x2="${stars[b].x}" y2="${stars[b].y}" stroke="#6688cc" stroke-width="1.8" stroke-opacity="0.8"/>`
  ).join('');
  const handleLinesStr = HANDLE_LINES.map(([a, b]) =>
    `<line x1="${stars[a].x}" y1="${stars[a].y}" x2="${stars[b].x}" y2="${stars[b].y}" stroke="#7799dd" stroke-width="2" stroke-opacity="0.85"/>`
  ).join('');

  const starsStr = stars.map((star) => {
    const isHandle = star.role === 'handle' || star.role === 'tip';
    const fill = isHandle ? seasonColor : '#bbccff';
    const sz = star.size + (isHandle ? 1.5 : 0.5);
    return `<circle cx="${star.x}" cy="${star.y}" r="${sz}" fill="${fill}" filter="url(#glow)"/>` +
      `<text x="${star.x}" y="${star.y - sz - 5}" text-anchor="middle" fill="#99aabb" font-size="8px" ${FF}>${star.name}</text>`;
  }).join('');

  // 箭头
  const tip = stars[6], prev = stars[5];
  const dx = tip.x - prev.x, dy = tip.y - prev.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len, ny = dy / len;
  const arrowTip = { x: tip.x + nx * 18, y: tip.y + ny * 18 };
  const arrowL = { x: arrowTip.x - nx * 7 + ny * 5, y: arrowTip.y - ny * 7 - nx * 5 };
  const arrowR = { x: arrowTip.x - nx * 7 - ny * 5, y: arrowTip.y - ny * 7 + nx * 5 };
  const arrowStr = `<polygon points="${arrowTip.x},${arrowTip.y} ${arrowL.x},${arrowL.y} ${arrowR.x},${arrowR.y}" fill="${seasonColor}" filter="url(#glow)"/>`;

  // ── 散点星场背景 ──
  let bgStars = '';
  const seed = [37,73,11,89,53,97,23,67,41,83,19,71,59,31,79,47,13,61,43,29,91,7,17,3];
  for (let i = 0; i < 60; i++) {
    const sx = (seed[i % 24] * (i + 7) * 13) % size;
    const sy = (seed[(i + 5) % 24] * (i + 3) * 17) % size;
    const sr = 0.3 + (i % 3) * 0.3;
    const so = 0.15 + (i % 4) * 0.08;
    bgStars += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#aabbdd" opacity="${so}"/>`;
  }

  // ── 四象彩色弧带（最外环可见弧线）──
  const arcR = 170;
  let groupArcStr = '';
  GROUP_ORDER.forEach((group, gi) => {
    const color = GROUP_COLORS[group];
    const indices = [0,7,21,14]; // 苍龙=0, 朱雀=21(mapped to gi), 白虎=14, 玄武=7
    const startI = [0, 21, 14, 7][gi];
    for (let j = 0; j < 7; j++) {
      const i = startI + j;
      const a1 = posAngle(i, 28);
      const a2 = posAngle(i + 1, 28);
      const x1 = Math.cos(a1) * arcR, y1 = Math.sin(a1) * arcR;
      const x2 = Math.cos(a2) * arcR, y2 = Math.sin(a2) * arcR;
      groupArcStr += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" opacity="0.25"/>`;
    }
    // 弧外点标记
    for (let j = 0; j < 7; j++) {
      const i = startI + j;
      const a = posAngle(i + 0.5, 28);
      const x = Math.cos(a) * arcR, y = Math.sin(a) * arcR;
      const isCur = i === currentMansionIdx;
      if (isCur) {
        groupArcStr += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" opacity="0.8" filter="url(#strong-glow)"/>`;
      } else {
        groupArcStr += `<circle cx="${x}" cy="${y}" r="1.5" fill="${color}" opacity="0.4"/>`;
      }
    }
  });

  // ── 地支环（提亮放大）──
  const dizhiStr = DI_ZHI.map((dz, i) => {
    const isCurrent = i === dizhiIdx;
    const midA = posAngle(i + 0.5, 12);
    const r = 190;
    const x = Math.cos(midA) * r, y = Math.sin(midA) * r;
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${isCurrent ? '#bbccee' : '#556677'}" font-size="${isCurrent ? '12px' : '10px'}" font-weight="${isCurrent ? 'bold' : 'normal'}" ${isCurrent ? 'filter="url(#glow)"' : ''} ${FF}>${dz}</text>`;
  }).join('');

  // ── 星宿环（显著提亮放大）──
  const mansionStr = MANSIONS.map((m, i) => {
    const color = GROUP_COLORS[m.group] || '#888';
    const isCurrent = i === currentMansionIdx;
    const midA = posAngle(i + 0.5, 28);
    const labelR = 152;
    const x = Math.cos(midA) * labelR, y = Math.sin(midA) * labelR;
    let svg = '';
    if (isCurrent) {
      // 当前值宿：大发光圈 + 亮白文字
      const dr = 170;
      const dx = Math.cos(midA) * dr, dy = Math.sin(midA) * dr;
      svg += `<circle cx="${dx}" cy="${dy}" r="14" fill="${color}" opacity="0.12" filter="url(#strong-glow)"/>`;
    }
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${isCurrent ? '#ffffff' : color}" fill-opacity="${isCurrent ? 1 : 0.75}" font-size="${isCurrent ? '13px' : '10px'}" font-weight="${isCurrent ? 'bold' : '500'}" ${isCurrent ? 'filter="url(#glow)"' : ''} ${FF}>${m.short}</text>`;
    return svg;
  }).join('');

  // ── 节气环（提亮放大）──
  const termStr = SOLAR_TERMS.map((t, i) => {
    const isCurrent = i === termIdx;
    const midA = posAngle(i + 0.5, 24);
    const labelR = 130;
    const x = Math.cos(midA) * labelR, y = Math.sin(midA) * labelR;
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${isCurrent ? '#ddeeff' : '#556677'}" font-size="${isCurrent ? '9px' : '7.5px'}" font-weight="${isCurrent ? 'bold' : 'normal'}" ${isCurrent ? 'filter="url(#glow)"' : ''} ${FF}>${t.length <= 2 ? t : t.slice(0, 2)}</text>`;
  }).join('');

  // ── 圆环（提亮）──
  const circleRings = [
    [80, '#1a2a50', 0.6],
    [120, '#1a2a50', 0.5],
    [140, '#1a2a50', 0.5],
    [175, '#2a3a60', 0.6],
    [195, '#1a2a50', 0.4],
  ].map(([r, c, o]) =>
    `<circle r="${r}" fill="none" stroke="${c}" stroke-width="0.8" opacity="${o}"/>`
  ).join('');

  // ── 十字准星线（方位标记）──
  const crossLines = `
    <line x1="0" y1="-195" x2="0" y2="-80" stroke="#2a3a60" stroke-width="0.5" opacity="0.3"/>
    <line x1="0" y1="80" x2="0" y2="195" stroke="#2a3a60" stroke-width="0.5" opacity="0.3"/>
    <line x1="-195" y1="0" x2="-80" y2="0" stroke="#2a3a60" stroke-width="0.5" opacity="0.3"/>
    <line x1="80" y1="0" x2="195" y2="0" stroke="#2a3a60" stroke-width="0.5" opacity="0.3"/>`;

  // ── 四象名称标记（提亮放大）──
  const groupLabels = GROUP_ORDER.map((group, gi) => {
    const color = GROUP_COLORS[group];
    const startI = [0, 21, 14, 7][gi];
    const midA = posAngle(startI + 3.5, 28);
    const r = 108;
    const x = Math.cos(midA) * r, y = Math.sin(midA) * r;
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${color}" fill-opacity="0.45" font-size="10px" font-weight="600" ${FF}>${GROUP_SHORT[group]}</text>`;
  }).join('');

  // ── 信息面板 ──
  const mColor = GROUP_COLORS[MANSIONS[currentMansionIdx]?.group] || '#888';
  const dateStr = data?.date?.solar || '';
  const lunarStr = data?.date?.lunar || '';
  const mansionName = MANSIONS[currentMansionIdx]?.name || '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">
  <defs>
    <radialGradient id="bg-gradient" cx="50%" cy="${Math.round(cy/h*100)}%" r="55%">
      <stop offset="0%" stop-color="#0e1428"/>
      <stop offset="50%" stop-color="#0a1020"/>
      <stop offset="100%" stop-color="#060a16"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="strong-glow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="text-glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${size}" height="${h}" rx="12" fill="url(#bg-gradient)"/>
  <!-- 边框 -->
  <rect width="${size}" height="${h}" rx="12" fill="none" stroke="#1a2a50" stroke-width="1" opacity="0.5"/>

  <!-- 星场 -->
  ${bgStars}

  <g transform="translate(${cx},${cy})">
    ${crossLines}
    ${circleRings}
    ${groupArcStr}
    ${dizhiStr}
    ${mansionStr}
    ${groupLabels}
    ${termStr}

    <g transform="rotate(${dipperRotation})">
      ${bowlLinesStr}
      ${handleLinesStr}
      ${starsStr}
      ${arrowStr}
    </g>
  </g>

  <!-- 左下角：日期 -->
  <text x="14" y="${h - 56}" fill="#8899aa" font-size="11px" ${FF}>${dateStr}</text>
  <text x="14" y="${h - 42}" fill="#778899" font-size="10px" ${FF}>${lunarStr}</text>

  <!-- 右下角：值日星宿 -->
  <text x="${size - 14}" y="${h - 56}" fill="${mColor}" font-size="13px" font-weight="bold" text-anchor="end" filter="url(#glow)" ${FF}>${mansionName}</text>
  <text x="${size - 14}" y="${h - 42}" fill="#8899aa" font-size="10px" text-anchor="end" ${FF}>${GROUP_SHORT[MANSIONS[currentMansionIdx]?.group] || ''} · ${mansionData.star || ''}</text>

  <!-- 底部中央：斗柄诗句 -->
  <line x1="40" y1="${h - 26}" x2="${size - 40}" y2="${h - 26}" stroke="#1a2a50" stroke-width="0.5" opacity="0.5"/>
  <text x="${cx}" y="${h - 10}" fill="${seasonColor}" font-size="11px" text-anchor="middle" filter="url(#text-glow)" ${FF}>${dipperData.directionText || ''}</text>
</svg>`;
}

// ═══ Übersicht Widget API ═══

export const className = `
  top: 40px;
  left: 430px;
  width: 400px;
  height: 430px;
  z-index: 1;
  -webkit-font-smoothing: antialiased;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
`;

export const render = ({ output, error }) => {
  if (error) {
    return <div style={{ color: '#E07050', padding: '20px', fontSize: '12px' }}>
      Error: {String(error)}
    </div>;
  }

  let data = {};
  try {
    data = JSON.parse(output || '{}');
  } catch (e) {
    return <div style={{ color: '#E07050', padding: '20px', fontSize: '12px' }}>
      JSON parse error: {String(e)}
    </div>;
  }

  const svgString = renderStarMapSVG(data, 400, 430);

  return <div dangerouslySetInnerHTML={{ __html: svgString }} />;
};
