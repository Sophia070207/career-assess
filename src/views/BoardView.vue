<template>
  <div class="board-page">
    <!-- 无提升路径 -->
    <el-empty v-if="!hasPath" description="请先生成提升路径">
      <el-button type="primary" @click="$router.push('/gap')">
        去差距分析页生成
      </el-button>
    </el-empty>

    <div v-else>
      <!-- 1. 顶部 -->
      <div class="header-section">
        <div class="target-info">
          <div class="sub-label">目标职业</div>
          <el-tag size="large" effect="dark" class="tag-large">
            {{ targetOccupation }}
          </el-tag>
        </div>
        <div class="progress-box">
          <el-progress
            :percentage="progressPercent"
            :stroke-width="18"
            :color="progressColors"
            style="width: 300px"
          />
          <div class="progress-label">
            总体进度 {{ doneCount }} / {{ tasks.length }}
          </div>
        </div>
      </div>

      <!-- 完成提示 -->
      <el-alert
        v-if="isAllDone"
        title="恭喜！所有提升任务已完成"
        type="success"
        description="建议重新测评以更新等级"
        show-icon
        :closable="false"
        class="done-alert"
      >
        <template #default>
          <el-button type="success" size="small" @click="$router.push('/assess')">
            去测评
          </el-button>
        </template>
      </el-alert>

      <!-- 2. 中部：任务列表 + AI 建议 -->
      <div class="main-section">
        <!-- 左侧任务 -->
        <div class="tasks-column">
          <h3 class="section-title">
            提升任务
            <el-tag size="small" type="info">{{ tasks.length }} 项</el-tag>
          </h3>
          <div class="task-list">
            <el-card
              v-for="task in tasks"
              :key="task.id"
              :class="['task-card', { done: task.status === '已完成' }]"
              shadow="hover"
            >
              <div class="task-header">
                <div class="task-title-row">
                  <span class="task-name">{{ task.title }}</span>
                  <el-tag size="small" :type="typeTagType(task.type)">
                    {{ typeLabel(task.type) }}
                  </el-tag>
                </div>
                <span v-if="task.status === '已完成'" class="done-check">✓</span>
              </div>

              <div class="task-meta">
                <span class="meta-item">
                  维度：{{ dimNameMap[task.dim] }}
                </span>
                <span class="meta-item">
                  目标：{{ task.from }} → {{ task.to }}
                </span>
              </div>

              <div class="task-footer">
                <el-date-picker
                  v-model="task.deadline"
                  type="date"
                  size="small"
                  placeholder="截止日期"
                  style="width: 140px"
                  value-format="YYYY-MM-DD"
                />
                <el-radio-group
                  v-model="task.status"
                  size="small"
                  @change="(val) => onStatusChange(task.id, val)"
                >
                  <el-radio-button label="待开始" />
                  <el-radio-button label="进行中" />
                  <el-radio-button label="已完成" />
                </el-radio-group>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 右侧 AI 建议 -->
        <div class="ai-column">
          <el-card class="ai-card" shadow="hover">
            <template #header>
              <div class="ai-header">
                <span>AI 智能建议</span>
                <el-tag size="small" type="warning">RAG</el-tag>
              </div>
            </template>

            <div class="ai-content">
              <div v-if="aiLoading" class="ai-loading">加载中...</div>
              <div v-else-if="aiAdvice" class="ai-text">{{ aiAdvice }}</div>
              <div v-else class="ai-placeholder">
                输入你的问题，获取 AI 智能建议...
              </div>
            </div>

            <div class="ask-ai">
              <el-input
                v-model="aiQuestion"
                placeholder="输入你的问题，如：如何提升专业技能？"
                @keyup.enter="askAI"
              >
                <template #append>
                  <el-button @click="askAI">问 AI</el-button>
                </template>
              </el-input>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 3. 底部：资源直达 -->
      <div class="resource-section">
        <h3 class="section-title">资源直达</h3>
        <div class="resource-buttons">
          <el-button
            v-for="res in resources"
            :key="res.label"
            :type="res.type"
            size="large"
            @click="openResource(res.url)"
          >
            {{ res.label }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBoardSummary, getAiAdvice, updateTaskStatus } from '@/api'
import { ElMessage } from 'element-plus'

const dimNameMap = {
  communication: '沟通能力',
  professional: '专业能力',
  teamwork: '团队协作',
  innovation: '创新能力',
  learning: '学习能力',
  leadership: '领导力'
}

/* ---------- 数据 ---------- */
const hasPath = ref(false)
const targetOccupation = ref('')
const tasks = ref([])
const aiQuestion = ref('')
const aiAdvice = ref('')
const aiLoading = ref(false)
const boardLoading = ref(false)

const resources = [
  { label: '去刷题', type: 'primary', url: '#' },
  { label: '去看课', type: 'success', url: '#' },
  { label: '去找项目', type: 'warning', url: '#' },
  { label: '去找实习', type: 'danger', url: '#' }
]

/* ---------- 类型标签 ---------- */
function typeLabel(type) {
  const map = { QUIZ: '题库', PROJECT: '项目', PRACTICE: '实习' }
  return map[type] || type
}

function typeTagType(type) {
  const map = { QUIZ: 'primary', PROJECT: 'success', PRACTICE: 'warning' }
  return map[type] || 'info'
}

/* ---------- 进度 ---------- */
const doneCount = computed(() =>
  tasks.value.filter((t) => t.status === '已完成').length
)

const progressPercent = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round((doneCount.value / tasks.value.length) * 100)
})

const isAllDone = computed(() => progressPercent.value === 100)

const progressColors = [
  { color: '#f56c6c', percentage: 30 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#67c23a', percentage: 100 }
]

/* ---------- AI 交互 ---------- */
async function askAI() {
  if (!aiQuestion.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }
  aiLoading.value = true
  try {
    const userId = localStorage.getItem('userId') || 'mock_user'
    const res = await getAiAdvice({ userId, question: aiQuestion.value.trim() })
    if (res.code === 200 && res.data) {
      aiAdvice.value = res.data.advice || '暂无建议'
      aiQuestion.value = ''
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('获取建议失败')
  } finally {
    aiLoading.value = false
  }
}

/* ---------- 任务状态 ---------- */
async function onStatusChange(taskId, status) {
  try {
    const res = await updateTaskStatus(taskId, status)
    if (res.code === 200) {
      ElMessage.success('状态已更新')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('状态更新失败')
  }
}

/* ---------- 资源 ---------- */
function openResource(url) {
  window.open(url, '_blank')
}

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  // 读取目标职业
  const savedTarget = localStorage.getItem('career_target')
  if (savedTarget) {
    try {
      targetOccupation.value = JSON.parse(savedTarget).occupation || ''
    } catch {
      targetOccupation.value = ''
    }
  }

  const userId = localStorage.getItem('userId') || 'mock_user'

  // 调用看板汇总接口
  boardLoading.value = true
  try {
    const res = await getBoardSummary(userId)
    if (res.code === 200 && res.data) {
      targetOccupation.value = res.data.targetOccupation || targetOccupation.value
      tasks.value = (res.data.tasks || []).map((t) => ({
        ...t,
        deadline: t.deadline || getDefaultDeadline()
      }))
      hasPath.value = tasks.value.length > 0
    }
  } catch (err) {
    console.error(err)
    // fallback：读取本地存储的提升路径
    const savedPath = localStorage.getItem('improvementPath')
    if (savedPath) {
      try {
        const path = JSON.parse(savedPath)
        if (path.length > 0) {
          tasks.value = path.map((item) => ({
            ...item,
            deadline: item.deadline || getDefaultDeadline()
          }))
          hasPath.value = true
        }
      } catch {
        hasPath.value = false
      }
    }
  } finally {
    boardLoading.value = false
  }

  // 预加载 AI 建议
  try {
    const res = await getAiAdvice({ userId, question: '请给出综合提升建议' })
    if (res.code === 200 && res.data) {
      aiAdvice.value = res.data.advice || ''
    }
  } catch (err) {
    console.error(err)
  }
})

function getDefaultDeadline() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}
</script>

<style scoped>
.board-page {
  padding-bottom: 40px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-label {
  font-size: 14px;
  color: #909399;
}

.tag-large {
  font-size: 20px;
  padding: 10px 20px;
  height: auto;
}

.progress-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.progress-label {
  font-size: 13px;
  color: #909399;
}

.done-alert {
  margin-bottom: 20px;
}

.main-section {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.tasks-column {
  flex: 1.3;
}

.section-title {
  margin-bottom: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  transition: all 0.3s;
}

.task-card.done {
  opacity: 0.7;
  background: #f5f7fa;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.done-check {
  font-size: 22px;
  color: #67c23a;
  font-weight: bold;
}

.task-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.meta-item {
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-column {
  flex: 1;
}

.ai-card {
  height: 100%;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 20px;
}

.ai-content p {
  margin-bottom: 10px;
}

.ai-content ol {
  padding-left: 20px;
  margin: 0;
}

.ai-content ol li {
  margin-bottom: 6px;
}

.ai-loading,
.ai-placeholder {
  color: #909399;
  font-size: 14px;
}

.ai-text {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.ask-ai {
  margin-top: 16px;
}

.resource-section {
  margin-top: 8px;
}

.resource-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .main-section {
    flex-direction: column;
  }

  .resource-buttons {
    flex-direction: column;
  }

  .resource-buttons .el-button {
    width: 100%;
  }
}
</style>
