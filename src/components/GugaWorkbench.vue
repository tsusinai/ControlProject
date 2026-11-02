<script setup>
import { computed, nextTick, ref } from 'vue'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Flag,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next'
import {
  PRIORITIES,
  STATUSES,
  formatAffairTime,
  priorityLabel,
  sortAffairs,
  statusLabel,
  useGugaStore,
} from '../composables/useGugaStore'

const emit = defineEmits(['back', 'toast'])

const { affairs, counts, focusAffair, addAffair, updateAffair, removeAffair, setStatus } = useGugaStore()

const query = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const editorOpen = ref(false)
const editingId = ref(null)
const confirmDeleteId = ref('')
const modalConfirmDelete = ref(false)
const formError = ref('')
const draft = ref(emptyDraft())

const statusTabs = computed(() => [
  { id: 'all', label: '全部', count: counts.value.all },
  ...STATUSES.map((status) => ({ ...status, count: counts.value[status.id] })),
])

const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return sortAffairs(
    affairs.value.filter((item) => {
      const priorityOk = priorityFilter.value === 'all' || item.priority === priorityFilter.value
      const statusOk = statusFilter.value === 'all' || item.status === statusFilter.value
      const haystack = [item.title, item.note, item.nextAction].join(' ').toLowerCase()
      const queryOk = !keyword || haystack.includes(keyword)
      return priorityOk && statusOk && queryOk
    }),
  )
})

const groups = computed(() => {
  const source = statusFilter.value === 'all' ? STATUSES : STATUSES.filter((status) => status.id === statusFilter.value)
  return source
    .map((status) => ({
      ...status,
      items: filtered.value.filter((item) => item.status === status.id),
    }))
    .filter((group) => group.items.length)
})

function emptyDraft() {
  return { title: '', note: '', status: 'todo', priority: 'med', nextAction: '' }
}

function openCreate() {
  draft.value = emptyDraft()
  editingId.value = null
  formError.value = ''
  modalConfirmDelete.value = false
  editorOpen.value = true
}

function openEdit(affair) {
  draft.value = {
    title: affair.title,
    note: affair.note,
    status: affair.status,
    priority: affair.priority,
    nextAction: affair.nextAction,
  }
  editingId.value = affair.id
  formError.value = ''
  modalConfirmDelete.value = false
  confirmDeleteId.value = ''
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  formError.value = ''
  modalConfirmDelete.value = false
}

async function saveDraft() {
  const title = draft.value.title.trim()
  if (!title) {
    formError.value = '请填写事务标题'
    return
  }
  const payload = { ...draft.value, title }
  if (editingId.value) {
    const saved = updateAffair(editingId.value, payload)
    if (!saved) {
      formError.value = '这条事务已经不在了'
      return
    }
    closeEditor()
    emit('toast', '事务已更新')
    return
  }
  const saved = addAffair(payload)
  if (!saved) {
    formError.value = '请填写事务标题'
    return
  }
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  query.value = ''
  closeEditor()
  emit('toast', '事务已添加')
  await nextTick()
  document.querySelector(`[data-affair-id="${saved.id}"]`)?.scrollIntoView({ block: 'nearest' })
}

function completeAffair(affair) {
  confirmDeleteId.value = ''
  if (affair.status === 'done') {
    setStatus(affair.id, 'todo')
    emit('toast', '事务已恢复为待办')
    return
  }
  setStatus(affair.id, 'done')
  emit('toast', '事务已完成')
}

function askDelete(id) {
  confirmDeleteId.value = confirmDeleteId.value === id ? '' : id
}

function deleteAffair(id) {
  if (!removeAffair(id)) return
  if (editingId.value === id) closeEditor()
  confirmDeleteId.value = ''
  emit('toast', '事务已删除')
}

function clearFilters() {
  query.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
}

function priorityClass(priority) {
  return `prio-${priority}`
}
</script>

<template>
  <div class="guga-workbench" data-testid="guga-workbench">
    <section class="intro-row guga-intro">
      <div>
        <p class="eyebrow">Guga / Real life</p>
        <h1>把生活事务整理成<br /><em>可执行的路径。</em></h1>
        <p class="intro-copy">续约、体检、账单、家里的下一件事。记在这台浏览器里，刷新也不会丢。</p>
        <div class="guga-intro-actions">
          <button class="primary-button guga-open-button" type="button" data-testid="guga-create" @click="openCreate"><Plus :size="16" /> 新建事务</button>
          <button class="outline-button" type="button" @click="emit('back')"><ArrowLeft :size="15" /> 返回总览</button>
        </div>
      </div>
      <div class="intro-side guga-focus">
        <div class="week-label guga-kicker"><span class="pulse guga-pulse"></span> 现在最要紧</div>
        <template v-if="focusAffair">
          <p class="guga-focus-title">{{ focusAffair.title }}</p>
          <p class="guga-focus-next">{{ focusAffair.nextAction || '还没有写下下一步' }}</p>
          <button class="text-button" type="button" @click="openEdit(focusAffair)">去处理 <ArrowUpRight :size="15" /></button>
        </template>
        <template v-else>
          <p class="guga-focus-title">没有未完成的事务</p>
          <p class="guga-focus-next">可以休息，或者记下一件新的事。</p>
        </template>
      </div>
    </section>

    <section class="stat-grid" aria-label="事务摘要">
      <article class="stat-card">
        <div class="stat-icon coral"><Flag :size="18" /></div>
        <div><span>未完成</span><strong>{{ counts.all - counts.done }}</strong></div>
        <small class="stat-neutral">待办 {{ counts.todo }}</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon coral"><ArrowUpRight :size="18" /></div>
        <div><span>进行中</span><strong>{{ counts.doing }}</strong></div>
        <small class="stat-neutral">正在推进</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon lime"><Check :size="18" /></div>
        <div><span>已完成</span><strong>{{ counts.done }}</strong></div>
        <small class="stat-up">留在本地</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon coral"><CircleAlert :size="18" /></div>
        <div><span>高优先级</span><strong>{{ counts.high }}</strong></div>
        <small class="stat-neutral">尚未完成</small>
      </article>
    </section>

    <section class="projects-toolbar guga-toolbar">
      <div>
        <p class="eyebrow">Affairs / 01</p>
        <h2>现实事务</h2>
      </div>
      <div class="toolbar-actions">
        <label class="search-box">
          <Search :size="16" />
          <input v-model="query" type="search" placeholder="搜索标题、下一步或备注…" data-testid="guga-search" />
        </label>
        <div class="priority-filter" role="group" aria-label="按优先级筛选">
          <button type="button" :class="{ active: priorityFilter === 'all' }" @click="priorityFilter = 'all'">全部</button>
          <button v-for="priority in PRIORITIES" :key="priority.id" type="button" :class="{ active: priorityFilter === priority.id }" @click="priorityFilter = priority.id">{{ priority.label }}优先</button>
        </div>
        <button class="primary-button guga-open-button" type="button" @click="openCreate"><Plus :size="16" /> 新建事务</button>
      </div>
    </section>

    <div class="project-tabs" role="tablist" aria-label="按状态筛选">
      <button v-for="tab in statusTabs" :key="tab.id" type="button" role="tab" :aria-selected="statusFilter === tab.id" :class="{ active: statusFilter === tab.id }" @click="statusFilter = tab.id">
        {{ tab.label }} <span>{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="!affairs.length" class="empty-state guga-empty">
      <Flag :size="24" />
      <h3>工作台还是空的</h3>
      <p>从一件具体的下一步开始。标题就够用，备注可以以后再补。</p>
      <button class="primary-button guga-open-button" type="button" @click="openCreate"><Plus :size="16" /> 新建事务</button>
    </div>
    <div v-else-if="!filtered.length" class="empty-state guga-empty">
      <Search :size="24" />
      <h3>没有匹配的事务</h3>
      <p>试试其他关键词，或清除当前筛选。</p>
      <button class="text-button" type="button" @click="clearFilters">清除筛选 <ArrowUpRight :size="15" /></button>
    </div>
    <div v-else class="guga-board">
      <section v-for="group in groups" :key="group.id" class="guga-group" :aria-label="group.label">
        <div class="guga-group-head">
          <h3>{{ group.label }}</h3>
          <span>{{ group.items.length }} 项</span>
        </div>
        <div class="affair-list">
          <article v-for="affair in group.items" :key="affair.id" class="affair-card" :class="['priority-' + affair.priority, { 'is-done': affair.status === 'done' }]" :data-affair-id="affair.id" data-testid="affair-card">
            <div class="affair-rail" aria-hidden="true"></div>
            <div class="affair-body">
              <div class="affair-meta">
                <span class="status-pill" :class="affair.status === 'done' ? 'waiting' : 'active'">{{ statusLabel(affair.status) }}</span>
                <span class="priority-pill" :class="priorityClass(affair.priority)">{{ priorityLabel(affair.priority) }}优先</span>
                <time :datetime="new Date(affair.updatedAt).toISOString()">{{ formatAffairTime(affair.updatedAt) }}</time>
              </div>
              <h3 class="affair-title">{{ affair.title }}</h3>
              <p v-if="affair.nextAction" class="affair-next"><ArrowUpRight :size="13" /> {{ affair.nextAction }}</p>
              <p v-else class="affair-next muted">还没有下一步</p>
              <p v-if="affair.note" class="affair-note">{{ affair.note }}</p>
            </div>
            <div class="affair-actions">
              <button type="button" data-testid="complete-affair" @click="completeAffair(affair)">
                <Check :size="14" /> {{ affair.status === 'done' ? '恢复' : '完成' }}
              </button>
              <button type="button" data-testid="edit-affair" @click="openEdit(affair)"><Pencil :size="14" /> 编辑</button>
              <button v-if="confirmDeleteId !== affair.id" type="button" data-testid="delete-affair" @click="askDelete(affair.id)"><Trash2 :size="14" /> 删除</button>
              <button v-else type="button" class="danger" data-testid="confirm-delete-affair" @click="deleteAffair(affair.id)">确认删除</button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div v-if="editorOpen" class="modal-backdrop" @click.self="closeEditor" @keydown.esc="closeEditor">
      <form class="create-modal guga-modal" role="dialog" aria-modal="true" aria-labelledby="guga-editor-title" @submit.prevent="saveDraft">
        <button class="modal-close" type="button" aria-label="关闭" @click="closeEditor"><X :size="18" /></button>
        <p class="eyebrow">{{ editingId ? 'Edit affair' : 'New affair' }}</p>
        <h2 id="guga-editor-title">{{ editingId ? '编辑这条事务' : '记下一件现实事务' }}</h2>
        <p class="modal-copy">标题、状态和优先级会留下来。下一步和备注可以空着。</p>
        <label class="modal-label">事务标题
          <input v-model="draft.title" data-testid="affair-title-input" autofocus maxlength="80" placeholder="例如：预约年度体检" />
        </label>
        <div class="guga-form-grid">
          <label class="modal-label">状态
            <select v-model="draft.status" data-testid="affair-status-input">
              <option v-for="status in STATUSES" :key="status.id" :value="status.id">{{ status.label }}</option>
            </select>
          </label>
          <label class="modal-label">优先级
            <select v-model="draft.priority" data-testid="affair-priority-input">
              <option v-for="priority in PRIORITIES" :key="priority.id" :value="priority.id">{{ priority.label }}</option>
            </select>
          </label>
        </div>
        <label class="modal-label">下一步
          <input v-model="draft.nextAction" data-testid="affair-next-input" maxlength="160" placeholder="例如：在医院小程序选周六上午" />
        </label>
        <label class="modal-label">备注
          <textarea v-model="draft.note" data-testid="affair-note-input" maxlength="500" rows="3" placeholder="可选。写给以后的自己。"></textarea>
        </label>
        <p v-if="formError" class="guga-form-error" role="alert">{{ formError }}</p>
        <div class="modal-tip"><CircleAlert :size="16" /><span>保存在这台浏览器的 localStorage，键名 guga.affairs.v1。不会上传。</span></div>
        <div class="guga-modal-actions">
          <button v-if="editingId && !modalConfirmDelete" class="text-button danger-text" type="button" @click="modalConfirmDelete = true">删除这条事务</button>
          <button v-else-if="editingId" class="text-button danger-text" type="button" data-testid="modal-confirm-delete" @click="deleteAffair(editingId)">确认删除</button>
          <button class="primary-button guga-open-button modal-submit" type="submit" data-testid="save-affair" :disabled="!draft.title.trim()">保存事务 <ArrowUpRight :size="15" /></button>
        </div>
      </form>
    </div>
  </div>
</template>
