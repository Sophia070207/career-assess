<template>
  <div class="gap-page">
    <!-- 无目标职业 -->
    <el-empty v-if="!targetOccupation" description="请先选择目标职业">
      <el-button type="primary" @click="$router.push('/profile')">
        去画像页选择
      </el-button>
    </el-empty>

    <div v-else>
      <!-- 1. 顶部 -->
      <div class="header-section">
        <div class="target-box">
          <div class="sub-label">当前目标职业</div>
          <el-tag size="large" effect="dark" class="tag-large">
            {{ targetOccupation }}
          </el-tag>
        </div>
        <div class="match-box">
          <el-progress
            type="dashboard"
            :percentage="matchPercent"
            :width="140"
            :stroke-width="10"
            :color="matchColor"
          />
          <div class="match-label">当前匹配度</div>
        </div>
      </div>

      <!-- 2. 中部：表格 + 图表 -->
      <div class="main-section">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <span>差距矩阵</span>
          </template>
          <el-table :data="gapTableData" style="width: 100%" border>
            <el-table-column prop="dimName" label="维度名" min-width="100" />
            <el-table-column prop="currentLevel" label="当前等级" align="center" />
            <el-table-column prop="targetLevel" label="目标等级" align="center" />
            <el-table-column label="差距" align="center" width="80">
              <template #default="{ row }">
                <span
                  class="gap-icon"
                  :class="row.gap"
                >
                  {{ gapIcon(row.gap) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="类型" align="center" width="110">
              <template #default="{ row }">
                <el-tag
                  v-if="row.gapType"
                  :type="row.gapType === 'hard' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ row.gapTypeName }}
                </el-tag>
                <span v-else class="text-gray">—</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span>差距可视化</span>
          </template>
          <v-chart
            ref="barChartRef"
            class="bar-chart"
            :option="barOption"
            autoresize
          />
        </el-card>
      </div>

      <!-- 3. 底部按钮 -->
      <div class="action-bar">
        <el-button type="primary" size="large" @click="generatePath">
          生成提升路径
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getGap } from '@/api'
import { ElMessage } from 'element-plus'

import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const router = useRouter()

/* ---------- ECharts 实例 ---------- */
const barChartRef = ref(null)
onUnmounted(() => {
  barChartRef.value?.dispose?.()
})

const dimNameMap = {
  communication: '沟通能力',
  professional: '专业能力',
  teamwork: '团队协作',
  innovation: '创新能力',
  learning: '学习能力',
  leadership: '领导力'
}

/* ---------- 等级工具 ---------- */
function levelScore(level) {
  const map = { S: 5, A: 4, B: 3, C: 2, D: 1 }
  return map[level] || 0
}

/* ---------- 数据 ---------- */
const targetOccupation = ref('')
const rawGaps = ref([])
const rawTasks = ref([])
const requirements = ref({})

/* ---------- 差距表格 ---------- */
const gapTableData = computed(() => {
  return rawGaps.value.map((g) => {
    const diff = levelScore(g.target) - levelScore(g.current)

    let gapType = null
    let gapTypeName = ''
    if (diff >= 2) {
      gapType = 'hard'
      gapTypeName = '硬性门槛'
    } else if (diff === 1) {
      gapType = 'soft'
      gapTypeName = '软性提升'
    }

    return {
      key: g.dim,
      dimName: dimNameMap[g.dim],
      currentLevel: g.current,
      targetLevel: g.target,
      gap: g.gap,
      gapType,
      gapTypeName,
      diff
    }
  })
})

function gapIcon(gap) {
  if (gap === 'up') return '↑'
  if (gap === 'down') return '↓'
  return '→'
}

/* ---------- 匹配度 ---------- */
const matchPercent = computed(() => {
  const total = rawGaps.value.length
  if (!total) return 0
  const pass = rawGaps.value.filter((g) => g.gap !== 'down').length
  return Math.round((pass / total) * 100)
})

const matchColor = computed(() => {
  const p = matchPercent.value
  if (p >= 80) return '#67c23a'
  if (p >= 50) return '#e6a23c'
  return '#f56c6c'
})

/* ---------- 柱状图配置 ---------- */
const barOption = computed(() => {
  const categories = rawGaps.value.map((g) => dimNameMap[g.dim])
  const currentData = rawGaps.value.map((g) => levelScore(g.current))
  const targetData = rawGaps.value.map((g) => levelScore(g.target))

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['当前等级', '目标等级'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { interval: 0, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 5,
      axisLabel: {
        formatter: (val) => {
          const map = { 1: 'D', 2: 'C', 3: 'B', 4: 'A', 5: 'S' }
          return map[val] || ''
        }
      }
    },
    series: [
      {
        name: '当前等级',
        type: 'bar',
        data: currentData,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '目标等级',
        type: 'bar',
        data: targetData,
        itemStyle: { color: '#67c23a' }
      }
    ]
  }
})

/* ---------- 生成提升路径 ---------- */
function generatePath() {
  if (rawTasks.value.length === 0) {
    ElMessage.info('已达标，无需生成提升路径')
    return
  }

  localStorage.setItem('improvementPath', JSON.stringify(rawTasks.value))
  ElMessage.success('提升路径已生成')
  router.push('/board')
}

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  // 读取目标职业
  const savedTarget = localStorage.getItem('career_target')
  if (savedTarget) {
    try {
      const parsed = JSON.parse(savedTarget)
      targetOccupation.value = parsed.occupation || ''
    } catch {
      targetOccupation.value = ''
    }
  }

  if (!targetOccupation.value) return

  // 调用差距分析接口
  const userId = localStorage.getItem('userId') || 'mock_user'
  try {
    const res = await getGap(userId, targetOccupation.value)
    if (res.code === 200 && res.data) {
      requirements.value = res.data.requirements || {}
      rawGaps.value = res.data.gaps || []
      rawTasks.value = res.data.tasks || []
    }
  } catch (err) {
    console.error(err)
  }
})
</script>

<style scoped>
.gap-page {
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

.target-box {
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

.match-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.match-label {
  margin-top: 4px;
  font-size: 14px;
  color: #606266;
}

.main-section {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.table-card {
  flex: 1.2;
}

.chart-card {
  flex: 1;
}

.bar-chart {
  width: 100%;
  height: 320px;
}

.gap-icon {
  font-size: 18px;
  font-weight: bold;
}

.gap-icon.up {
  color: #67c23a;
}

.gap-icon.down {
  color: #f56c6c;
}

.gap-icon.equal {
  color: #909399;
}

.text-gray {
  color: #c0c4cc;
}

.action-bar {
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 16px;
  }

  .main-section {
    flex-direction: column;
  }
}
</style>
