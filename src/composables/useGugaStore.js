import { computed, ref, watch } from 'vue'

export const GUGA_STORAGE_KEY = 'guga.affairs.v1'

export const STATUSES = [
  { id: 'todo', label: '待办' },
  { id: 'doing', label: '进行中' },
  { id: 'done', label: '已完成' },
]

export const PRIORITIES = [
  { id: 'high', label: '高' },
  { id: 'med', label: '中' },
  { id: 'low', label: '低' },
]

const PRIORITY_RANK = { high: 0, med: 1, low: 2 }

const affairs = ref([])
let started = false

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `affair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function seedAffairs() {
  const now = Date.now()
  return [
    {
      id: 'seed-lease',
      title: '续签租房合同',
      note: '房东希望本月内确认是否续住一年。押金条款上次有争议。',
      status: 'doing',
      priority: 'high',
      nextAction: '核对押金条款，周五前回复中介',
      updatedAt: now - 1000 * 60 * 40,
    },
    {
      id: 'seed-ticket',
      title: '给父母买返程车票',
      note: '他们周日下午离开，偏好当天下午的高铁。',
      status: 'todo',
      priority: 'high',
      nextAction: '确认出发时间后下单',
      updatedAt: now - 1000 * 60 * 60 * 5,
    },
    {
      id: 'seed-checkup',
      title: '预约年度体检',
      note: '单位体检窗口到本月底。',
      status: 'todo',
      priority: 'med',
      nextAction: '在医院小程序选周六上午',
      updatedAt: now - 1000 * 60 * 60 * 26,
    },
    {
      id: 'seed-bills',
      title: '整理本月账单',
      note: '信用卡、房租和订阅放在同一张表里。',
      status: 'doing',
      priority: 'med',
      nextAction: '导出信用卡流水并标出固定支出',
      updatedAt: now - 1000 * 60 * 90,
    },
    {
      id: 'seed-filter',
      title: '更换净水器滤芯',
      note: '上次更换是四月。',
      status: 'done',
      priority: 'low',
      nextAction: '',
      updatedAt: now - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: 'seed-community',
      title: '社区垃圾分类登记',
      note: '',
      status: 'todo',
      priority: 'low',
      nextAction: '把户号和手机号填进社区表格',
      updatedAt: now - 1000 * 60 * 60 * 50,
    },
  ]
}

function normalizeAffair(item) {
  if (!item || typeof item !== 'object') return null
  const title = String(item.title ?? '').trim()
  if (!title) return null
  const status = STATUSES.some((entry) => entry.id === item.status) ? item.status : 'todo'
  const priority = PRIORITIES.some((entry) => entry.id === item.priority) ? item.priority : 'med'
  const updatedAt = Number(item.updatedAt)
  return {
    id: String(item.id || createId()),
    title: title.slice(0, 80),
    note: String(item.note ?? '').slice(0, 500),
    status,
    priority,
    nextAction: String(item.nextAction ?? '').trim().slice(0, 160),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
  }
}

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GUGA_STORAGE_KEY, JSON.stringify(affairs.value))
}

function load() {
  if (typeof localStorage === 'undefined') {
    affairs.value = seedAffairs()
    return
  }
  try {
    const raw = localStorage.getItem(GUGA_STORAGE_KEY)
    if (raw == null) {
      affairs.value = seedAffairs()
      persist()
      return
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      affairs.value = seedAffairs()
      persist()
      return
    }
    affairs.value = parsed.map(normalizeAffair).filter(Boolean)
  } catch {
    affairs.value = seedAffairs()
    persist()
  }
}

function ensureStore() {
  if (started) return
  load()
  started = true
  watch(affairs, persist, { deep: true })
}

export function statusLabel(status) {
  return STATUSES.find((entry) => entry.id === status)?.label || '待办'
}

export function priorityLabel(priority) {
  return PRIORITIES.find((entry) => entry.id === priority)?.label || '中'
}

export function formatAffairTime(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (date.toDateString() === now.toDateString()) return `今天 ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `昨天 ${time}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function sortAffairs(list) {
  return list.slice().sort((a, b) => {
    const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (priorityDelta) return priorityDelta
    return b.updatedAt - a.updatedAt
  })
}

export function useGugaStore() {
  ensureStore()

  const openCount = computed(() => affairs.value.filter((item) => item.status !== 'done').length)
  const counts = computed(() => ({
    all: affairs.value.length,
    todo: affairs.value.filter((item) => item.status === 'todo').length,
    doing: affairs.value.filter((item) => item.status === 'doing').length,
    done: affairs.value.filter((item) => item.status === 'done').length,
    high: affairs.value.filter((item) => item.priority === 'high' && item.status !== 'done').length,
  }))
  const focusAffair = computed(() => {
    const open = affairs.value.filter((item) => item.status !== 'done')
    return open.slice().sort((a, b) => {
      const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      if (priorityDelta) return priorityDelta
      const statusDelta = (a.status === 'doing' ? 0 : 1) - (b.status === 'doing' ? 0 : 1)
      if (statusDelta) return statusDelta
      return b.updatedAt - a.updatedAt
    })[0] || null
  })

  function addAffair(input) {
    const affair = normalizeAffair({ ...input, id: createId(), updatedAt: Date.now() })
    if (!affair) return null
    affairs.value = [affair, ...affairs.value]
    return affair
  }

  function updateAffair(id, patch) {
    const index = affairs.value.findIndex((item) => item.id === id)
    if (index < 0) return null
    const next = normalizeAffair({ ...affairs.value[index], ...patch, id, updatedAt: Date.now() })
    if (!next) return null
    const copy = affairs.value.slice()
    copy[index] = next
    affairs.value = copy
    return next
  }

  function removeAffair(id) {
    const next = affairs.value.filter((item) => item.id !== id)
    if (next.length === affairs.value.length) return false
    affairs.value = next
    return true
  }

  function setStatus(id, status) {
    return updateAffair(id, { status })
  }

  return {
    affairs,
    counts,
    openCount,
    focusAffair,
    addAffair,
    updateAffair,
    removeAffair,
    setStatus,
  }
}
