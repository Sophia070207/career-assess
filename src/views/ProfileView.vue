<template>
  <div class="profile-page">
    <!-- 未测评提示 -->
    <el-empty v-if="!hasData" description="请先完成测评">
      <el-button type="primary" @click="$router.push('/assess')">
        去测评
      </el-button>
    </el-empty>

    <div v-else>
      <!-- 1. 顶部 -->
      <div class="header-section">
        <el-tag size="large" effect="dark" class="tag-large">
          {{ profile.tag }}
        </el-tag>
        <span class="update-date">更新日期：{{ updateDate }}</span>
      </div>

      <!-- 2. 图表区域 -->
      <div class="charts-row">
        <!-- 左侧雷达图 -->
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span>六维能力雷达</span>
          </template>
          <v-chart
            ref="radarChartRef"
            class="radar-chart"
            :option="radarOption"
            autoresize
          />
        </el-card>

        <!-- 右侧圆环图 -->
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span>综合等级</span>
          </template>
          <v-chart
            ref="gaugeChartRef"
            class="gauge-chart"
            :option="gaugeOption"
            autoresize
          />
        </el-card>
      </div>

      <!-- 3. 维度卡片 -->
      <div class="dimension-cards">
        <el-card
          v-for="(item, key) in profile.dimensions"
          :key="key"
          class="dim-card"
          shadow="hover"
        >
          <div class="dim-header">
            <span class="dim-name">{{ dimNameMap[key] }}</span>
            <el-tag
              :type="levelTagType(item.level)"
              size="small"
              effect="dark"
            >
              {{ item.level }}
            </el-tag>
          </div>
          <div class="dim-percentile">
            同届前 {{ item.percentile }}%
          </div>
          <div class="dim-desc">
            {{ levelDesc(item.level) }}
          </div>
        </el-card>
      </div>

      <!-- 4. 推荐职业 -->
      <div class="career-section">
        <h3 class="section-title">推荐职业 Top 3</h3>
        <div class="career-cards">
          <el-card
            v-for="career in careers"
            :key="career.name"
            class="career-card"
            shadow="hover"
          >
            <div class="career-header">
              <span class="career-name">{{ career.name }}</span>
              <span class="career-match">
                匹配度 {{ career.matchPercent }}%
              </span>
            </div>

            <el-progress
              :percentage="career.matchPercent"
              :color="career.matchPercent >= 80 ? '#67c23a' : career.matchPercent >= 50 ? '#e6a23c' : '#f56c6c'"
              :stroke-width="16"
              :show-text="false"
              class="career-progress"
            />

            <div class="career-reqs">
              <span
                v-for="(req, idx) in career.requirements"
                :key="idx"
                class="req-tag"
                :class="{ met: req.met }"
              >
                {{ dimNameMap[req.dim] }}≥{{ req.level }}
              </span>
            </div>

            <el-button
              type="primary"
              size="small"
              @click="setTarget(career.name)"
            >
              设为我的目标
            </el-button>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile } from '@/api'
import { ElMessage } from 'element-plus'

import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart, GaugeChart } from 'echarts/charts'
import {
  PolarComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  RadarChart,
  GaugeChart,
  PolarComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const router = useRouter()

/* ---------- ECharts 实例 ---------- */
const radarChartRef = ref(null)
const gaugeChartRef = ref(null)

onUnmounted(() => {
  radarChartRef.value?.dispose?.()
  gaugeChartRef.value?.dispose?.()
})

/* ---------- 数据 ---------- */
const profile = ref({
  name: '',
  major: '',
  dimensions: {},
  tag: '',
  growthSlope: ''
})
const hasData = ref(false)
const updateDate = ref('')

const dimNameMap = {
  communication: '沟通能力',
  professional: '专业能力',
  teamwork: '团队协作',
  innovation: '创新能力',
  learning: '学习能力',
  leadership: '领导力'
}

/* ---------- 等级工具 ---------- */
function levelTagType(level) {
  if (['S', 'A'].includes(level)) return 'primary'
  if (level === 'B') return 'warning'
  return 'danger'
}

function levelDesc(level) {
  const map = { S: '优势突出', A: '优势突出', B: '中等水平', C: '有待提升', D: '急需加强' }
  return map[level] || ''
}

/* ---------- 雷达图配置 ---------- */
const radarOption = computed(() => {
  const dims = profile.value.dimensions || {}
  const indicator = Object.keys(dims).map((key) => ({
    name: `${dimNameMap[key]}\n(${dims[key].level})`,
    max: 100
  }))
  const data = Object.values(dims).map((d) => d.score)

  return {
    color: ['#409eff'],
    tooltip: {},
    radar: {
      indicator,
      radius: '65%',
      axisName: {
        color: '#606266',
        fontSize: 12
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data,
            name: '能力值',
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2 }
          }
        ]
      }
    ]
  }
})

/* ---------- 圆环图配置 ---------- */
const gaugeOption = computed(() => {
  const dims = profile.value.dimensions || {}
  const percentiles = Object.values(dims).map((d) => d.percentile)
  const avg = percentiles.length
    ? Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length)
    : 0

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: { color: '#409eff' }
        },
        axisLine: {
          lineStyle: { width: 20, color: [[1, '#e4e7ed']] }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        data: [
          {
            value: avg,
            name: `同届前 ${avg}%`,
            title: {
              offsetCenter: ['0%', '30%'],
              fontSize: 14,
              color: '#606266'
            },
            detail: {
              valueAnimation: true,
              offsetCenter: ['0%', '-10%'],
              fontSize: 36,
              fontWeight: 'bold',
              formatter: '{value}',
              color: '#303133'
            }
          }
        ],
        detail: { show: true }
      }
    ]
  }
})

/* ---------- 推荐职业 ---------- */
const careers = computed(() => {
  const dims = profile.value.dimensions || {}

  const careerDefs = [
    {
      name: '产品经理',
      reqs: [
        { dim: 'communication', level: 'A', min: 75 },
        { dim: 'professional', level: 'B', min: 60 }
      ]
    },
    {
      name: '项目经理',
      reqs: [
        { dim: 'teamwork', level: 'A', min: 75 },
        { dim: 'leadership', level: 'B', min: 60 }
      ]
    },
    {
      name: '运营专员',
      reqs: [
        { dim: 'communication', level: 'B', min: 60 },
        { dim: 'learning', level: 'B', min: 60 }
      ]
    }
  ]

  return careerDefs.map((c) => {
    const reqs = c.reqs.map((r) => ({
      ...r,
      met: (dims[r.dim]?.score || 0) >= r.min
    }))
    const metCount = reqs.filter((r) => r.met).length
    const matchPercent = Math.round((metCount / reqs.length) * 100)
    return { name: c.name, requirements: reqs, matchPercent }
  })
})

function setTarget(name) {
  localStorage.setItem('career_target', JSON.stringify({ occupation: name }))
  ElMessage.success(`已将「${name}」设为目标`)
  router.push('/gap')
}

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  const userId = localStorage.getItem('userId') || 'mock_user'
  try {
    const res = await getProfile(userId)
    if (res.code === 200 && res.data && Object.keys(res.data.dimensions || {}).length > 0) {
      profile.value = res.data
      hasData.value = true
      updateDate.value = res.data.updateDate || new Date().toLocaleDateString('zh-CN')
    }
  } catch (err) {
    console.error(err)
  }
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 40px;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.tag-large {
  font-size: 18px;
  padding: 8px 16px;
  height: auto;
}

.update-date {
  color: #909399;
  font-size: 14px;
}

.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
}

.radar-chart,
.gauge-chart {
  width: 100%;
  height: 320px;
}

.dimension-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.dim-card {
  text-align: center;
}

.dim-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.dim-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.dim-percentile {
  font-size: 24px;
  color: #409eff;
  font-weight: bold;
  margin-bottom: 4px;
}

.dim-desc {
  font-size: 13px;
  color: #909399;
}

.section-title {
  margin-bottom: 16px;
  color: #303133;
}

.career-cards {
  display: flex;
  gap: 16px;
}

.career-card {
  flex: 1;
}

.career-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.career-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.career-match {
  font-size: 14px;
  color: #409eff;
  font-weight: bold;
}

.career-progress {
  margin-bottom: 12px;
}

.career-reqs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.req-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f4f4f5;
  color: #909399;
}

.req-tag.met {
  background: #ecf5ff;
  color: #409eff;
}

@media (max-width: 768px) {
  .charts-row {
    flex-direction: column;
  }

  .dimension-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .career-cards {
    flex-direction: column;
  }
}
</style>
