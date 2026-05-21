import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  Factory,
  FileSpreadsheet,
  Filter,
  Image,
  Layers3,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  SquareStack,
  X
} from "lucide-react";

const currentYear = new Date().getFullYear();

const projects = [
  {
    id: "p-aurora",
    name: "广州天河云境酒店大堂",
    customer: "云境酒店集团",
    region: "华南",
    owner: "陈思远",
    year: currentYear,
    status: "试运行",
    note: "首层大堂、接待区与电梯厅，客户偏好低对比灰白系。",
    images: [
      "linear-gradient(135deg, #d9d6ce 0%, #f7f3ea 44%, #9da8a6 45%, #eff2ee 72%, #c9b9a5 100%)",
      "radial-gradient(circle at 25% 30%, #f6f1e9 0 4%, transparent 5%), radial-gradient(circle at 70% 45%, #9ea8a2 0 5%, transparent 6%), linear-gradient(135deg, #d8d2c4, #f7f4ec)"
    ],
    colors: [
      {
        id: "c-082",
        name: "T-082 浅灰白",
        description: "浅灰底，细白色骨料，整体低对比，适合大堂大面积铺装。",
        setItem: "SET-EP-T082",
        aItem: "A-EP-T082",
        lab: { l: 72.4, a: -1.2, b: 4.8 },
        confirmDate: "2026-05-21",
        status: "可用",
        confusing: ["T-083 米灰白"],
        updatedBy: "刘工",
        updatedAt: "2026-05-20 16:12",
        swatch: "linear-gradient(135deg, #d8d8d2 0 35%, #f3f0e8 36% 52%, #9da19d 53% 58%, #ecebe3 59% 100%)"
      },
      {
        id: "c-083",
        name: "T-083 米灰白",
        description: "米灰底，白色与浅米色骨料，视觉上与 T-082 接近。",
        setItem: "SET-EP-T083",
        aItem: "A-EP-T083",
        lab: { l: 73.1, a: 0.4, b: 7.2 },
        confirmDate: "2026-05-21",
        status: "可用",
        confusing: ["T-082 浅灰白"],
        updatedBy: "刘工",
        updatedAt: "2026-05-20 16:20",
        swatch: "linear-gradient(135deg, #ded8cb 0 38%, #f5eee2 39% 55%, #b7aa98 56% 61%, #eee7da 62% 100%)"
      },
      {
        id: "c-097",
        name: "T-097 雾蓝灰",
        description: "冷灰底，少量蓝灰骨料，公共走廊指定颜色。",
        setItem: "SET-EP-T097",
        aItem: "A-EP-T097",
        lab: { l: 64.8, a: -2.8, b: 1.1 },
        confirmDate: "2026-05-18",
        status: "待确认",
        confusing: [],
        updatedBy: "王工",
        updatedAt: "2026-05-19 09:34",
        swatch: "linear-gradient(135deg, #aeb8ba 0 42%, #d8dddd 43% 55%, #748288 56% 62%, #cbd2d1 63% 100%)"
      },
      {
        id: "c-104",
        name: "T-104 暖白砂",
        description: "暖白底，细砂感骨料，客户样板间确认色。",
        setItem: "SET-EP-T104",
        aItem: "A-EP-T104",
        lab: { l: 78.2, a: 1.1, b: 9.4 },
        confirmDate: "2026-05-15",
        status: "可用",
        confusing: [],
        updatedBy: "刘工",
        updatedAt: "2026-05-17 13:08",
        swatch: "linear-gradient(135deg, #eee4d3 0 40%, #fff9ed 41% 55%, #c9bba2 56% 61%, #eadfce 62% 100%)"
      }
    ]
  },
  {
    id: "p-gallery",
    name: "上海洛河艺术中心",
    customer: "",
    region: "华东",
    owner: "林可",
    year: currentYear - 1,
    status: "生产中",
    note: "艺术展厅项目，颜色跨度大，需重点关注旧版色号。",
    images: [],
    colors: [
      {
        id: "c-211",
        name: "T-211 深墨绿",
        description: "深绿色底，黑白粗骨料，展厅主通道。",
        setItem: "SET-EP-T211",
        aItem: "A-EP-T211",
        lab: { l: 34.9, a: -8.8, b: 4.3 },
        confirmDate: "2026-04-28",
        status: "可用",
        confusing: [],
        updatedBy: "王工",
        updatedAt: "2026-05-10 10:42",
        swatch: "linear-gradient(135deg, #334941 0 35%, #e9e9df 36% 42%, #19241f 43% 58%, #708070 59% 100%)"
      },
      {
        id: "c-216-old",
        name: "T-216 珊瑚粉 旧版",
        description: "旧版客户已弃用，仅保留历史记录，不建议下单。",
        setItem: "SET-EP-T216-OLD",
        aItem: "A-EP-T216-OLD",
        lab: { l: 61.2, a: 16.4, b: 11.8 },
        confirmDate: "2025-11-14",
        status: "旧版",
        confusing: ["T-216B 珊瑚粉新版"],
        updatedBy: "刘工",
        updatedAt: "2026-01-08 15:46",
        swatch: "linear-gradient(135deg, #c98276 0 40%, #f4dfd7 41% 52%, #9d5b55 53% 62%, #dfaaa0 63% 100%)"
      },
      {
        id: "c-216b",
        name: "T-216B 珊瑚粉新版",
        description: "新版客户确认色，较旧版更浅，展厅儿童活动区。",
        setItem: "SET-EP-T216B",
        aItem: "A-EP-T216B",
        lab: { l: 68.8, a: 13.2, b: 10.1 },
        confirmDate: "2026-03-02",
        status: "可用",
        confusing: ["T-216 珊瑚粉 旧版"],
        updatedBy: "刘工",
        updatedAt: "2026-03-03 11:19",
        swatch: "linear-gradient(135deg, #daa095 0 40%, #fff0e7 41% 52%, #b9736d 53% 62%, #e6b5aa 63% 100%)"
      }
    ]
  },
  {
    id: "p-harbor",
    name: "厦门海屿商业裙楼",
    customer: "海屿置业",
    region: "华南",
    owner: "周倩",
    year: currentYear,
    status: "待确认",
    note: "客户仍在调整二层公共区颜色，待确认颜色不可导出正式下单。",
    images: [
      "linear-gradient(135deg, #ccd8dc 0%, #f4f6f2 38%, #68828f 39%, #d5c6ac 62%, #f8f4ec 100%)"
    ],
    colors: [
      {
        id: "c-310",
        name: "T-310 海盐灰",
        description: "浅蓝灰底，白色和贝壳色骨料。",
        setItem: "SET-EP-T310",
        aItem: "A-EP-T310",
        lab: { l: 70.6, a: -3.4, b: 2.3 },
        confirmDate: "2026-05-21",
        status: "可用",
        confusing: ["T-311 海雾灰"],
        updatedBy: "赵工",
        updatedAt: "2026-05-21 09:05",
        swatch: "linear-gradient(135deg, #c3d0d4 0 39%, #f6f6ef 40% 54%, #89a0a8 55% 62%, #d9e1df 63% 100%)"
      },
      {
        id: "c-311",
        name: "T-311 海雾灰",
        description: "灰度更高，蓝相更弱，与 T-310 视觉接近。",
        setItem: "SET-EP-T311",
        aItem: "A-EP-T311",
        lab: { l: 68.9, a: -2.1, b: 3.6 },
        confirmDate: "2026-05-21",
        status: "待确认",
        confusing: ["T-310 海盐灰"],
        updatedBy: "赵工",
        updatedAt: "2026-05-21 09:12",
        swatch: "linear-gradient(135deg, #bfc8c9 0 39%, #f3f2ea 40% 54%, #7f9295 55% 62%, #d2d7d5 63% 100%)"
      }
    ]
  }
];

const statusTone = {
  可用: "ok",
  待确认: "warn",
  暂停: "stop",
  旧版: "muted"
};

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("全部");
  const [region, setRegion] = useState("全部");
  const [role, setRole] = useState("销售视图");
  const [selectedColorIds, setSelectedColorIds] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [drawerColor, setDrawerColor] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportHistory, setExportHistory] = useState([
    { id: "CF-20260521-001", project: "广州天河云境酒店大堂", count: 3, user: "陈思远", time: "2026-05-21 10:30" }
  ]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  const years = useMemo(() => ["全部", ...new Set(projects.map((project) => project.year))], []);
  const regions = useMemo(() => ["全部", ...new Set(projects.map((project) => project.region))], []);

  const filteredProjects = useMemo(() => {
    const text = query.trim().toLowerCase();
    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.customer,
        project.region,
        project.owner,
        ...project.colors.flatMap((color) => [color.name, color.description, color.setItem, color.aItem])
      ]
        .join(" ")
        .toLowerCase();

      return (
        (year === "全部" || String(project.year) === String(year)) &&
        (region === "全部" || project.region === region) &&
        (!text || haystack.includes(text))
      );
    });
  }, [query, region, year]);

  const selectedColors = selectedProject.colors.filter((color) => selectedColorIds.includes(color.id));
  const blockedColors = selectedColors.filter((color) => color.status !== "可用");
  const confusingColors = selectedColors.filter((color) => color.confusing.length > 0);
  const canExport = selectedColors.length > 0 && blockedColors.length === 0 && selectedColors.every((color) => Number(quantities[color.id]) > 0);

  function toggleColor(colorId) {
    setSelectedColorIds((current) =>
      current.includes(colorId) ? current.filter((id) => id !== colorId) : [...current, colorId]
    );
  }

  function selectProject(projectId) {
    setSelectedProjectId(projectId);
    setSelectedColorIds([]);
    setConfirmOpen(false);
    setDrawerColor(null);
  }

  function exportConfirmation() {
    if (!canExport) return;

    const orderId = `CF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(exportHistory.length + 1).padStart(3, "0")}`;
    const rows = selectedColors.map((color) => ({
      确认单编号: orderId,
      项目名称: selectedProject.name,
      客户名称: selectedProject.customer || "",
      地区: selectedProject.region,
      销售负责人: selectedProject.owner,
      "颜色名称/内部色号": color.name,
      颜色描述: color.description,
      "套装 Item Code": color.setItem,
      套数: quantities[color.id],
      单位: "套",
      "A组分 Item Code": color.aItem,
      "LAB-L": color.lab.l,
      "LAB-a": color.lab.a,
      "LAB-b": color.lab.b,
      客户确认日期: color.confirmDate,
      颜色状态: color.status,
      易混淆提醒: color.confusing.join("；"),
      备注: "",
      确认人: selectedProject.owner,
      确认时间: new Date().toLocaleString("zh-CN", { hour12: false })
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${orderId}-${selectedProject.name}-下单确认单.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExportHistory((current) => [
      { id: orderId, project: selectedProject.name, count: selectedColors.length, user: selectedProject.owner, time: new Date().toLocaleString("zh-CN", { hour12: false }) },
      ...current
    ]);
    setConfirmOpen(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Layers3 size={24} />
          </div>
          <div>
            <strong>颜色管理</strong>
            <span>环氧磨石销售工作台</span>
          </div>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="项目 / 客户 / Item Code"
          />
        </label>

        <div className="filter-grid">
          <label>
            <Filter size={14} />
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              {years.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <SquareStack size={14} />
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              {regions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="project-list">
          {filteredProjects.map((project) => {
            const risky = project.colors.some((color) => color.confusing.length > 0 || color.status !== "可用");
            return (
              <button
                className={`project-button ${project.id === selectedProjectId ? "active" : ""}`}
                key={project.id}
                onClick={() => selectProject(project.id)}
              >
                <span className="project-name">{project.name}</span>
                <span className="project-meta">
                  {project.customer || "未填客户"} · {project.year} · {project.colors.length} 色
                </span>
                {risky && <span className="risk-dot">需核对</span>}
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <ShieldCheck size={16} />
          <span>销售确认套装 Item 后再导出给 SAP 录单</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Project color master data</p>
            <h1>{selectedProject.name}</h1>
          </div>
          <div className="role-switch">
            {["销售视图", "配色视图", "助理视图"].map((item) => (
              <button
                className={role === item ? "selected" : ""}
                key={item}
                onClick={() => setRole(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        <section className="summary-strip">
          <InfoItem label="客户" value={selectedProject.customer || "可选未填"} />
          <InfoItem label="地区" value={selectedProject.region} />
          <InfoItem label="销售负责人" value={selectedProject.owner} />
          <InfoItem label="年份" value={selectedProject.year} />
          <InfoItem label="状态" value={selectedProject.status} />
          <div className="summary-note">{selectedProject.note}</div>
        </section>

        <section className="media-band">
          <div className="section-title">
            <Image size={18} />
            <span>项目案例图片</span>
          </div>
          {selectedProject.images.length ? (
            <div className="case-grid">
              {selectedProject.images.map((image, index) => (
                <div className="case-image" key={index} style={{ background: image }}>
                  <span>CASE {index + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-media">
              <Image size={22} />
              <span>暂无项目案例图片，颜色资料仍可正常确认和导出。</span>
            </div>
          )}
        </section>

        <section className="table-panel">
          <div className="panel-head">
            <div>
              <div className="section-title">
                <Sparkles size={18} />
                <span>项目颜色清单</span>
              </div>
              <p>销售下单使用套装 Item Code，A 组分 Item 仅用于工厂配色核对。</p>
            </div>
            <div className="actions">
              <button className="secondary">
                <Plus size={16} />
                新增颜色
              </button>
              <button className="secondary">
                <FileSpreadsheet size={16} />
                导出项目颜色表
              </button>
              <button className="primary" onClick={() => setConfirmOpen(true)} disabled={!selectedColors.length}>
                <ClipboardCheck size={16} />
                生成确认单
              </button>
            </div>
          </div>

          <div className="color-table">
            <div className={`table-row table-header ${roleClass(role)}`}>
              <span>选择</span>
              <span>色板</span>
              <span>颜色</span>
              <span>套装 Item / 套</span>
              <span>A组分 Item</span>
              <span>LAB</span>
              <span>状态</span>
              <span>风险</span>
              <span>操作</span>
            </div>
            {selectedProject.colors.map((color) => {
              const selected = selectedColorIds.includes(color.id);
              return (
                <div className={`table-row ${roleClass(role)} ${selected ? "checked" : ""}`} key={color.id}>
                  <label className="check-cell">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleColor(color.id)}
                      disabled={color.status === "旧版" || color.status === "暂停"}
                    />
                  </label>
                  <button className="swatch" style={{ background: color.swatch }} onClick={() => setDrawerColor(color)} aria-label={`${color.name} 色板`} />
                  <div className="color-name">
                    <strong>{color.name}</strong>
                    <span>{color.description}</span>
                  </div>
                  <div className="set-item">
                    <strong>{color.setItem}</strong>
                    <span>单位：套</span>
                  </div>
                  <code>{color.aItem}</code>
                  <span className="lab">L {color.lab.l} / a {color.lab.a} / b {color.lab.b}</span>
                  <span className={`pill ${statusTone[color.status]}`}>{color.status}</span>
                  <RiskCell color={color} />
                  <div className="row-actions">
                    <button title="查看详情" onClick={() => setDrawerColor(color)}>
                      <Eye size={16} />
                    </button>
                    <button title="编辑颜色">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="history-panel">
          <div className="section-title">
            <Archive size={18} />
            <span>导出留痕</span>
          </div>
          <div className="history-list">
            {exportHistory.map((item) => (
              <div className="history-item" key={item.id}>
                <strong>{item.id}</strong>
                <span>{item.project}</span>
                <span>{item.count} 个颜色</span>
                <span>{item.user}</span>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      {drawerColor && (
        <ColorDrawer color={drawerColor} onClose={() => setDrawerColor(null)} role={role} />
      )}

      {confirmOpen && (
        <ConfirmationModal
          colors={selectedColors}
          project={selectedProject}
          quantities={quantities}
          setQuantities={setQuantities}
          confusingColors={confusingColors}
          blockedColors={blockedColors}
          canExport={canExport}
          onClose={() => setConfirmOpen(false)}
          onExport={exportConfirmation}
        />
      )}
    </main>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskCell({ color }) {
  if (color.status !== "可用") {
    return (
      <span className="risk-cell blocked">
        <AlertTriangle size={14} />
        {color.status}
      </span>
    );
  }

  if (color.confusing.length > 0) {
    return (
      <span className="risk-cell">
        <AlertTriangle size={14} />
        易混淆
      </span>
    );
  }

  return (
    <span className="risk-cell clean">
      <CheckCircle2 size={14} />
      正常
    </span>
  );
}

function ColorDrawer({ color, onClose, role }) {
  return (
    <aside className="drawer">
      <div className="drawer-card">
        <button className="close-button" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="drawer-swatch" style={{ background: color.swatch }} />
        <div className="drawer-title">
          <span className={`pill ${statusTone[color.status]}`}>{color.status}</span>
          <h2>{color.name}</h2>
          <p>{color.description}</p>
        </div>
        <div className="drawer-grid">
          <InfoItem label="套装 Item Code" value={color.setItem} />
          <InfoItem label="下单单位" value="套" />
          <InfoItem label="A组分 Item Code" value={color.aItem} />
          <InfoItem label="LAB" value={`L ${color.lab.l} / a ${color.lab.a} / b ${color.lab.b}`} />
          <InfoItem label="客户确认日期" value={color.confirmDate} />
          <InfoItem label="最近修改" value={`${color.updatedBy} · ${color.updatedAt}`} />
        </div>
        {color.confusing.length > 0 && (
          <div className="drawer-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>人工标记易混淆颜色</strong>
              <span>该颜色与 {color.confusing.join("、")} 视觉接近，请销售核对色板、描述和套装 Item。</span>
            </div>
          </div>
        )}
        <button className="primary full">
          {role === "配色视图" ? "编辑颜色主数据" : "加入下单确认"}
          <ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
}

function ConfirmationModal({
  colors,
  project,
  quantities,
  setQuantities,
  confusingColors,
  blockedColors,
  canExport,
  onClose,
  onExport
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">Order confirmation</p>
            <h2>下单确认单</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="confirmation-summary">
          <InfoItem label="项目" value={project.name} />
          <InfoItem label="销售负责人" value={project.owner} />
          <InfoItem label="确认颜色" value={`${colors.length} 个`} />
          <InfoItem label="下单单位" value="套" />
        </div>

        {confusingColors.length > 0 && (
          <div className="notice warn">
            <AlertTriangle size={18} />
            本确认单包含 {confusingColors.length} 个易混淆颜色，请逐项核对色板、颜色描述和套装 Item Code。
          </div>
        )}
        {blockedColors.length > 0 && (
          <div className="notice stop">
            <AlertTriangle size={18} />
            存在非“可用”颜色，不能生成正式下单确认单。
          </div>
        )}

        <div className="confirm-table">
          <div className="confirm-row confirm-header">
            <span>色板</span>
            <span>颜色</span>
            <span>套装 Item</span>
            <span>套数</span>
            <span>A组分 Item</span>
            <span>状态</span>
          </div>
          {colors.map((color) => (
            <div className="confirm-row" key={color.id}>
              <span className="mini-swatch" style={{ background: color.swatch }} />
              <div>
                <strong>{color.name}</strong>
                <small>{color.confusing.length ? `易混淆：${color.confusing.join("、")}` : color.description}</small>
              </div>
              <code>{color.setItem}</code>
              <label className="quantity-input">
                <input
                  min="1"
                  type="number"
                  value={quantities[color.id] ?? ""}
                  onChange={(event) =>
                    setQuantities((current) => ({ ...current, [color.id]: event.target.value }))
                  }
                  placeholder="套数"
                />
                <span>套</span>
              </label>
              <code>{color.aItem}</code>
              <span className={`pill ${statusTone[color.status]}`}>{color.status}</span>
            </div>
          ))}
        </div>

        <div className="final-check">
          <PackageCheck size={18} />
          <span>SAP 下单字段以“套装 Item Code + 套数”为准，A 组分 Item 仅供工厂配色追溯。</span>
        </div>

        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>返回修改</button>
          <button className="primary" onClick={onExport} disabled={!canExport}>
            <Download size={16} />
            确认无误，导出 Excel
          </button>
        </div>
      </section>
    </div>
  );
}

function roleClass(role) {
  if (role === "配色视图") return "factory-view";
  if (role === "助理视图") return "assistant-view";
  return "sales-view";
}

export default App;
