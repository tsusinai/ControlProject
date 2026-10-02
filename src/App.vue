<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  Flag,
  FolderKanban,
  LayoutDashboard,
  ListFilter,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  UserRound,
  X,
} from 'lucide-vue-next'

const tabs = ['全部项目', '进行中', '已完成', '待启动']
const activeTab = ref('全部项目')
const query = ref('')
const viewMode = ref('grid')
const showCreate = ref(false)
const sidebarOpen = ref(true)
const pointer = ref({ x: 0, y: 0, active: false })
const toast = ref('')
const selectedId = ref('rinkl')

const projects = ref([
  {
    id: 'rinkl',
    name: 'rinklnote',
    title: 'RinklNote · 移动端笔记体验',
    description: '让灵感从捕捉到回看，都保持轻盈。',
    color: '#d9ff4f',
    status: '进行中',
    stage: '视觉与交互',
    progress: 68,
    owner: 'Yuki',
    ownerColor: '#b7a3ff',
    deadline: '10月 18日',
    daysLeft: 16,
    budget: '¥ 28,000',
    updated: '今天 10:42',
    accent: 'lime',
    tags: ['产品设计', '移动端'],
    milestones: [
      { name: '信息架构', date: '09.24', done: true },
      { name: '视觉与交互', date: '10.08', done: false, current: true },
      { name: '开发交付', date: '10.18', done: false },
    ],
    tasks: [
      { title: '完成首页空状态方案', meta: '设计 · 今天', done: true },
      { title: '整理动效标注与切图', meta: '交付 · 明天', done: false },
      { title: '和工程确认手势方案', meta: '评审 · 周四', done: false },
    ],
    trend: [28, 35, 32, 44, 48, 56, 68],
  },
  {
    id: 'guga',
    name: 'gugaproject',
    title: 'GugaProject · 现实事务工作台',
    description: '把复杂的生活事务，整理成可执行的路径。',
    color: '#ff9c72',
    status: '进行中',
    stage: '研发联调',
    progress: 42,
    owner: 'Ming',
    ownerColor: '#83c7ff',
    deadline: '11月 02日',
    daysLeft: 31,
    budget: '¥ 46,000',
    updated: '昨天 16:20',
    accent: 'coral',
    tags: ['Web 应用', '品牌系统'],
    milestones: [
      { name: '产品定义', date: '09.30', done: true },
      { name: '研发联调', date: '10.22', done: false, current: true },
      { name: 'Beta 发布', date: '11.02', done: false },
    ],
    tasks: [
      { title: '确定项目状态枚举', meta: '产品 · 今天', done: true },
      { title: '接入任务列表 API', meta: '研发 · 周五', done: false },
      { title: '走查移动端断点', meta: '设计 · 下周一', done: false },
    ],
    trend: [18, 22, 30, 26, 31, 38, 42],
  },
  {
    id: 'sea',
    name: '海之瞳',
    title: '海之瞳 · 海洋观测品牌升级',
    description: '为每一次观测，建立更清晰的视觉语言。',
    color: '#87c9ff',
    status: '待启动',
    stage: '需求梳理',
    progress: 14,
    owner: 'Lena',
    ownerColor: '#ffcf70',
    deadline: '12月 12日',
    daysLeft: 71,
    budget: '¥ 36,000',
    updated: '9月 28日',
    accent: 'blue',
    tags: ['品牌设计', '展陈'],
    milestones: [
      { name: '需求梳理', date: '10.12', done: false, current: true },
      { name: '概念提案', date: '11.04', done: false },
      { name: '应用延展', date: '12.12', done: false },
    ],
    tasks: [
      { title: '收集现有触点与素材', meta: '研究 · 周五', done: false },
      { title: '安排第一次共创工作坊', meta: '沟通 · 下周一', done: false },
    ],
    trend: [7, 10, 8, 12, 10, 14, 14],
  },
])

const filteredProjects = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return projects.value.filter((project) => {
    const statusOk = activeTab.value === '全部项目' || project.status === activeTab.value
    const queryOk = !keyword || [project.name, project.title, project.stage, ...project.tags].join(' ').toLowerCase().includes(keyword)
    return statusOk && queryOk
  })
})

const selectedProject = computed(() => projects.value.find((project) => project.id === selectedId.value) || projects.value[0])
const completedProjects = computed(() => projects.value.filter((project) => project.status === '已完成').length)
const activeProjects = computed(() => projects.value.filter((project) => project.status === '进行中').length)
const openTasks = computed(() => projects.value.reduce((total, project) => total + project.tasks.filter((task) => !task.done).length, 0))

function handlePointerMove(event) {
  pointer.value = { x: event.clientX, y: event.clientY, active: event.pointerType !== 'touch' }
}
function handlePointerLeave() {
  pointer.value.active = false
}
function tiltCard(event) {
  const card = event.currentTarget
  const rect = card.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  card.style.setProperty('--rx', (y * -3.5).toFixed(2) + 'deg')
  card.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg')
  card.style.setProperty('--mx', (x * 100 + 50).toFixed(1) + '%')
  card.style.setProperty('--my', (y * 100 + 50).toFixed(1) + '%')
}
function resetCardTilt(event) {
  const card = event.currentTarget
  card.style.setProperty('--rx', '0deg')
  card.style.setProperty('--ry', '0deg')
  card.style.setProperty('--mx', '50%')
  card.style.setProperty('--my', '50%')
}
onMounted(() => {
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerleave', handlePointerLeave)
})

function selectProject(project) {
  selectedId.value = project.id
}

function toggleTask(task) {
  task.done = !task.done
  flash(task.done ? '任务已完成' : '任务已恢复')
}

function changeStatus(status) {
  selectedProject.value.status = status
  flash('项目状态已更新')
}

function flash(message) {
  toast.value = message
  window.clearTimeout(flash.timer)
  flash.timer = window.setTimeout(() => { toast.value = '' }, 2200)
}

function addProject() {
  const name = createName.value.trim()
  if (!name) return
  const id = 'project-' + Date.now()
  projects.value.push({
    id,
    name,
    title: name + ' · 新项目',
    description: '从目标、里程碑和下一步开始建立清晰节奏。',
    color: '#c3b1ff',
    status: '待启动',
    stage: '需求梳理',
    progress: 0,
    owner: '你',
    ownerColor: '#c3b1ff',
    deadline: '待设定',
    daysLeft: 0,
    budget: '待设定',
    updated: '刚刚',
    accent: 'purple',
    tags: ['新项目'],
    milestones: [
      { name: '需求梳理', date: '待定', done: false, current: true },
      { name: '方案设计', date: '待定', done: false },
      { name: '交付上线', date: '待定', done: false },
    ],
    tasks: [{ title: '补充项目目标与范围', meta: '规划 · 下一步', done: false }],
    trend: [0, 0, 0, 0, 0, 0, 0],
  })
  selectedId.value = id
  showCreate.value = false
  createName.value = ''
  flash('项目已添加')
}

const createName = ref('')

function formatProgress(value) {
  return String(Math.round(value)).padStart(2, '0') + '%'
}
</script>

<template>
  <div class="project-os" :class="{ 'sidebar-closed': !sidebarOpen }" @pointermove="handlePointerMove" @pointerleave="handlePointerLeave" :style="{ '--pointer-x': pointer.x + 'px', '--pointer-y': pointer.y + 'px' }">\n    <div class="cursor-halo" :class="{ active: pointer.active }" :style="{ left: pointer.x + 'px', top: pointer.y + 'px' }"></div>\n    <div class="ambient-word">DESIGN<br />OPERATIONS</div>
    <aside class="project-sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">P</div>
        <div class="brand-copy"><strong>PROJECTS</strong><span>设计项目工作台</span></div>
        <button class="icon-button sidebar-close" aria-label="收起侧栏" @click="sidebarOpen = false"><PanelLeft :size="17" /></button>
      </div>

      <nav class="side-nav" aria-label="主导航">
        <button class="nav-item active"><LayoutDashboard :size="17" /><span>项目总览</span><b>3</b></button>
        <button class="nav-item"><FolderKanban :size="17" /><span>全部项目</span></button>
        <button class="nav-item"><CalendarClock :size="17" /><span>时间排期</span></button>
        <button class="nav-item"><Activity :size="17" /><span>进度报告</span></button>
      </nav>

      <div class="side-label">我的项目</div>
      <div class="side-projects">
        <button v-for="project in projects" :key="project.id" class="side-project" :class="{ selected: project.id === selectedId }" @click="selectProject(project)">
          <i :style="{ background: project.color }"></i><span>{{ project.name }}</span><small>{{ project.progress }}%</small>
        </button>
      </div>

      <button class="add-project-side" @click="showCreate = true"><Plus :size="16" /> 新建项目</button>
      <div class="sidebar-bottom">
        <button class="nav-item"><Settings2 :size="17" /><span>工作台设置</span></button>
        <div class="account-chip"><div class="avatar">Y</div><div><strong>Yuki Tan</strong><span>设计负责人</span></div><MoreHorizontal :size="16" /></div>
      </div>
    </aside>

    <main class="project-main">
      <header class="topbar">
        <div class="topbar-left">
          <button v-if="!sidebarOpen" class="icon-button" aria-label="打开侧栏" @click="sidebarOpen = true"><PanelLeft :size="18" /></button>
          <span class="breadcrumb">工作台 <ChevronRight :size="13" /> 项目总览</span>
        </div>
        <div class="topbar-actions">
          <button class="top-action"><Bell :size="17" /><span class="notification-dot"></span></button>
          <div class="top-date"><CalendarDays :size="15" /> 2026.10.02 · 周五</div>
          <div class="top-avatar">Y</div>
        </div>
      </header>

      <section class="intro-row">
        <div>
          <p class="eyebrow">Friday / 02 October 2026</p>
          <h1>把项目推进到<br /><em>下一个清晰节点。</em></h1>
          <p class="intro-copy">这里汇总了近期设计项目的状态、里程碑和下一步行动。每一次更新，都让团队更接近交付。</p>
        </div>
        <div class="intro-side">
          <div class="week-label"><span class="pulse"></span> 本周节奏</div>
          <p>还有 <strong>{{ openTasks }}</strong> 个待完成任务</p>
          <div class="week-bars"><i v-for="(bar, index) in [42, 68, 52, 76, 58, 84, 34]" :key="index" :style="{ height: bar + '%' }" :class="{ today: index === 4 }"></i></div>
          <div class="week-days"><span>一</span><span>二</span><span>三</span><span>四</span><span class="today">今</span><span>六</span><span>日</span></div>
        </div>
      </section>

      <section class="stat-grid reveal-section" aria-label="项目摘要">
        <article class="stat-card">
          <div class="stat-icon lime"><FolderKanban :size="18" /></div><div><span>全部项目</span><strong>{{ projects.length }}</strong></div><small class="stat-up">+1 <span>本月</span></small>
        </article>
        <article class="stat-card">
          <div class="stat-icon coral"><Activity :size="18" /></div><div><span>进行中</span><strong>{{ activeProjects }}</strong></div><small class="stat-neutral">保持稳定</small>
        </article>
        <article class="stat-card">
          <div class="stat-icon blue"><Flag :size="18" /></div><div><span>本月里程碑</span><strong>06</strong></div><small class="stat-up">+2 <span>较上月</span></small>
        </article>
        <article class="stat-card">
          <div class="stat-icon purple"><Check :size="18" /></div><div><span>已完成项目</span><strong>{{ completedProjects }}</strong></div><small class="stat-neutral">持续积累</small>
        </article>
      </section>

      <section class="projects-toolbar">
        <div><p class="eyebrow">Project overview / 01</p><h2>近期项目</h2></div>
        <div class="toolbar-actions">
          <label class="search-box"><Search :size="16" /><input v-model="query" type="search" placeholder="搜索项目、阶段或标签…" /></label>
          <button class="filter-button"><Filter :size="15" /> 筛选</button>
          <div class="view-toggle"><button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">▦</button><button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">☷</button></div>
          <button class="primary-button" @click="showCreate = true"><Plus :size="16" /> 新建项目</button>
        </div>
      </section>

      <div class="project-tabs">
        <button v-for="tab in tabs" :key="tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }} <span>{{ tab === '全部项目' ? projects.length : projects.filter((p) => p.status === tab).length }}</span></button>
      </div>

      <section class="project-content" :class="{ 'list-view': viewMode === 'list' }">
        <div v-if="!filteredProjects.length" class="empty-state"><ListFilter :size="24" /><h3>没有匹配的项目</h3><p>试试其他关键词，或清除当前筛选。</p><button class="text-button" @click="query = ''; activeTab = '全部项目'">清除筛选 <ArrowUpRight :size="15" /></button></div>
        <article v-for="(project, index) in filteredProjects" :key="project.id" class="project-card reveal-card" :style="{ '--delay': index * 70 + 'ms' }" :class="'accent-' + project.accent" @pointermove.stop="tiltCard($event)" @pointerleave="resetCardTilt($event)" @click="selectProject(project)">
          <div class="card-topline"><div class="project-name"><span class="project-dot" :style="{ background: project.color }"></span><strong>{{ project.name }}</strong></div><button class="more-button" aria-label="更多操作" @click.stop><MoreHorizontal :size="17" /></button></div>
          <div class="card-visual" :class="'visual-' + project.accent">
            <div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div><div class="visual-core">{{ project.name.slice(0, 1).toUpperCase() }}</div><span class="visual-caption">{{ project.stage }}</span>
          </div>
          <div class="card-heading"><div><span class="status-pill" :class="project.status === '待启动' ? 'waiting' : 'active'">{{ project.status }}</span><h3>{{ project.title }}</h3><p>{{ project.description }}</p></div><ArrowUpRight :size="19" class="open-arrow" /></div>
          <div class="card-tags"><span v-for="tag in project.tags" :key="tag">{{ tag }}</span></div>
          <div class="card-progress"><div class="progress-label"><span>项目进度</span><b>{{ formatProgress(project.progress) }}</b></div><div class="progress-track"><i :style="{ width: project.progress + '%', background: project.color }"></i></div></div>
          <div class="card-footer"><span><UserRound :size="14" /> {{ project.owner }}</span><span><CalendarClock :size="14" /> {{ project.deadline }}</span><span class="card-updated">{{ project.updated }}</span></div>
        </article>
      </section>

      <section class="detail-panel reveal-section" aria-label="项目详情">
        <div class="detail-heading"><div><p class="eyebrow">Selected project / 02</p><h2>{{ selectedProject.name }} <span>· {{ selectedProject.stage }}</span></h2></div><div class="detail-actions"><select :value="selectedProject.status" @change="changeStatus($event.target.value)"><option>进行中</option><option>已完成</option><option>待启动</option></select><button class="outline-button"><MoreHorizontal :size="16" /> 管理项目</button></div></div>
        <div class="detail-grid">
          <div class="detail-progress">
            <div class="detail-progress-head"><div><span class="eyebrow">Current progress</span><strong>{{ formatProgress(selectedProject.progress) }}</strong></div><div class="trend-caption"><Activity :size="14" /> 近 7 日进度</div></div>
            <div class="trend-chart"><span v-for="(point, index) in selectedProject.trend" :key="index" class="trend-point" :style="{ left: (index / (selectedProject.trend.length - 1) * 100) + '%', bottom: point + '%' }"></span><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline :points="selectedProject.trend.map((point, index) => (index / (selectedProject.trend.length - 1) * 100) + ',' + (100 - point)).join(' ')" /></svg></div>
            <div class="range-row"><span>调整项目进度</span><input v-model.number="selectedProject.progress" type="range" min="0" max="100" step="1" :style="{ '--range-color': selectedProject.color }" /><b>{{ selectedProject.progress }}%</b></div>
          </div>
          <div class="milestone-panel"><div class="panel-title"><span>里程碑</span><small>项目时间线</small></div><div class="milestones"><div v-for="milestone in selectedProject.milestones" :key="milestone.name" class="milestone" :class="{ done: milestone.done, current: milestone.current }"><span class="milestone-node"><Check v-if="milestone.done" :size="12" /><i v-else></i></span><div><strong>{{ milestone.name }}</strong><small>{{ milestone.date }}</small></div></div></div></div>
          <div class="tasks-panel"><div class="panel-title"><span>下一步任务</span><small>{{ selectedProject.tasks.filter((task) => !task.done).length }} 项待处理</small></div><label v-for="task in selectedProject.tasks" :key="task.title" class="task-item" :class="{ done: task.done }"><input :checked="task.done" type="checkbox" @change="toggleTask(task)" /><span class="task-check"><Check :size="12" /></span><span class="task-copy"><strong>{{ task.title }}</strong><small>{{ task.meta }}</small></span><ChevronRight :size="15" /></label><button class="add-task-button"><Plus :size="14" /> 添加任务</button></div>
          <div class="owner-panel"><div class="panel-title"><span>项目概况</span><small>最后更新 {{ selectedProject.updated }}</small></div><div class="owner-row"><div class="owner-avatar" :style="{ background: selectedProject.ownerColor }">{{ selectedProject.owner.slice(0, 1) }}</div><div><strong>{{ selectedProject.owner }}</strong><small>项目负责人</small></div><button class="mini-icon"><MoreHorizontal :size="16" /></button></div><div class="overview-list"><div><span>当前阶段</span><strong>{{ selectedProject.stage }}</strong></div><div><span>预算</span><strong>{{ selectedProject.budget }}</strong></div><div><span>截止日期</span><strong>{{ selectedProject.deadline }}</strong></div></div><button class="detail-link">查看完整项目 <ArrowUpRight :size="15" /></button></div>
        </div>
      </section>

      <footer class="project-footer"><span>PROJECTS / DESIGN OPERATIONS</span><span>进度清晰，协作自然。</span><span>最后同步 10:42</span></footer>
    </main>

    <transition name="toast"><div v-if="toast" class="toast-message"><Check :size="15" /> {{ toast }}</div></transition>

    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <section class="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <button class="modal-close" aria-label="关闭" @click="showCreate = false"><X :size="18" /></button>
        <p class="eyebrow">New project / 03</p><h2 id="create-title">开始一个新项目</h2><p class="modal-copy">先给项目一个清晰的名字，之后再补充负责人、日期和里程碑。</p>
        <label class="modal-label">项目名称<input v-model="createName" autofocus placeholder="例如：品牌官网 2.0" @keyup.enter="addProject" /></label>
        <div class="modal-tip"><CircleAlert :size="16" /><span>建议使用“项目名 · 目标”格式，方便团队快速理解。</span></div>
        <button class="primary-button modal-submit" :disabled="!createName.trim()" @click="addProject">创建项目 <ArrowUpRight :size="15" /></button>
      </section>
    </div>
  </div>
</template>
