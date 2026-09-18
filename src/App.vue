<template>
  <div class="career-assess-container">
    <!-- 页面标题 -->
    <el-header class="page-header">
      <h1>大学生职业评估系统</h1>
      <p>科学评估职业能力，精准规划未来发展</p>
    </el-header>

    <el-main>
      <!-- 学生信息录入表单区域 -->
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>学生信息与能力评估</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          class="assess-form"
        >
          <!-- 基本信息行 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="formData.name" placeholder="请输入姓名" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学号" prop="studentId">
                <el-input v-model="formData.studentId" placeholder="请输入学号" clearable />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="专业" prop="major">
                <el-input v-model="formData.major" placeholder="请输入专业" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年级" prop="grade">
                <el-select v-model="formData.grade" placeholder="请选择年级" style="width: 100%">
                  <el-option label="大一" value="大一" />
                  <el-option label="大二" value="大二" />
                  <el-option label="大三" value="大三" />
                  <el-option label="大四" value="大四" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 能力评分区域 -->
          <el-divider content-position="left">能力自评（0-100分）</el-divider>

          <el-row :gutter="20">
            <el-col :span="12" v-for="item in abilityItems" :key="item.key">
              <el-form-item :label="item.label" :prop="item.key">
                <el-slider
                  v-model="formData[item.key]"
                  :max="100"
                  :step="1"
                  show-input
                  :marks="{ 0: '0', 50: '50', 100: '100' }"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button type="primary" size="large" @click="handleSubmit">
              提交评估
            </el-button>
            <el-button size="large" @click="handleReset">重置表单</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 评估结果展示区域（提交后显示） -->
      <el-card v-if="showResult" class="result-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>评估结果</span>
            <el-tag :type="resultGradeTagType" size="large">{{ result.grade }}</el-tag>
          </div>
        </template>

        <el-row :gutter="20">
          <!-- 左侧：雷达图 -->
          <el-col :span="12">
            <div ref="radarChartRef" class="radar-chart"></div>
          </el-col>

          <!-- 右侧：详细结果 -->
          <el-col :span="12">
            <div class="result-detail">
              <!-- 综合等级 -->
              <div class="result-section">
                <h3>综合等级</h3>
                <div class="score-display">
                  <el-progress
                    type="dashboard"
                    :percentage="result.totalScore"
                    :color="scoreColors"
                  />
                  <div class="grade-text">{{ result.grade }}</div>
                </div>
              </div>

              <!-- 推荐职业 -->
              <div class="result-section">
                <h3>推荐职业方向</h3>
                <div class="career-tags">
                  <el-tag
                    v-for="career in result.recommendedCareers"
                    :key="career"
                    type="success"
                    effect="dark"
                    size="large"
                    class="career-tag"
                  >
                    {{ career }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="result-bottom">
          <!-- 待提升能力 -->
          <el-col :span="12">
            <div class="result-section">
              <h3>待提升能力</h3>
              <el-alert
                v-for="item in result.improvements"
                :key="item.ability"
                :title="item.ability"
                :description="item.suggestion"
                type="warning"
                :closable="false"
                show-icon
                class="improvement-alert"
              />
            </div>
          </el-col>

          <!-- 成长路径 -->
          <el-col :span="12">
            <div class="result-section">
              <h3>成长路径建议</h3>
              <el-timeline>
                <el-timeline-item
                  v-for="(step, index) in result.growthPath"
                  :key="index"
                  :type="step.type"
                  :icon="step.icon"
                  :timestamp="step.period"
                >
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.content }}</p>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 历史评估记录表格 -->
      <el-card class="history-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>历史评估记录</span>
            <el-button type="danger" size="small" @click="clearHistory">
              清空记录
            </el-button>
          </div>
        </template>

        <el-table
          :data="historyList"
          stripe
          border
          style="width: 100%"
          empty-text="暂无评估记录"
        >
          <el-table-column prop="name" label="姓名" width="100" align="center" />
          <el-table-column prop="studentId" label="学号" width="120" align="center" />
          <el-table-column prop="major" label="专业" width="120" align="center" />
          <el-table-column prop="grade" label="年级" width="80" align="center" />
          <el-table-column prop="totalScore" label="综合得分" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getScoreTagType(row.totalScore)">{{ row.totalScore }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="grade" label="等级" width="80" align="center" />
          <el-table-column label="推荐职业" min-width="180" align="center">
            <template #default="{ row }">
              <el-tag
                v-for="career in row.recommendedCareers"
                :key="career"
                type="success"
                size="small"
                class="table-tag"
              >
                {{ career }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assessTime" label="评估时间" width="160" align="center" />
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button type="primary" size="small" @click="viewHistoryDetail($index)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  StarFilled,
  Collection,
  UserFilled,
  Trophy
} from '@element-plus/icons-vue'

// ============================================
// 表单相关数据与配置
// ============================================

// 表单DOM引用
const formRef = ref(null)

// 能力评分项配置
const abilityItems = [
  { key: 'communication', label: '沟通能力' },
  { key: 'professional', label: '专业技能' },
  { key: 'teamwork', label: '团队协作' },
  { key: 'innovation', label: '创新思维' },
  { key: 'learning', label: '学习能力' },
  { key: 'leadership', label: '领导力' }
]

// 表单数据模型
const formData = reactive({
  name: '',
  studentId: '',
  major: '',
  grade: '',
  communication: 60,
  professional: 60,
  teamwork: 60,
  innovation: 60,
  learning: 60,
  leadership: 60
})

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  major: [{ required: true, message: '请输入专业', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }]
}

// ============================================
// 评估结果相关数据
// ============================================

// 是否显示结果区域
const showResult = ref(false)

// 雷达图DOM引用
const radarChartRef = ref(null)

// 雷达图实例
let radarChart = null

// 评分颜色配置
const scoreColors = [
  { color: '#f56c6c', percentage: 60 },
  { color: '#e6a23c', percentage: 75 },
  { color: '#67c23a', percentage: 90 },
  { color: '#409eff', percentage: 100 }
]

// 评估结果对象
const result = reactive({
  totalScore: 0,
  grade: '',
  recommendedCareers: [],
  improvements: [],
  growthPath: []
})

// 等级标签类型
const resultGradeTagType = computed(() => {
  const score = result.totalScore
  if (score >= 90) return 'success'
  if (score >= 75) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
})

// ============================================
// 历史记录相关数据
// ============================================

// 历史评估记录列表
const historyList = ref([])

// 本地存储键名
const STORAGE_KEY = 'career_assess_history'

// ============================================
// 核心评估逻辑
// ============================================

/**
 * 提交评估表单
 * 1. 校验表单
 * 2. 计算综合得分与等级
 * 3. 生成推荐职业、待提升能力、成长路径
 * 4. 渲染雷达图
 * 5. 保存到历史记录
 */
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请完善表单信息后再提交')
      return
    }

    // 计算各项能力平均分
    const abilities = abilityItems.map((item) => formData[item.key])
    const avgScore = Math.round(
      abilities.reduce((sum, val) => sum + val, 0) / abilities.length
    )

    // 确定综合等级
    const grade = getGrade(avgScore)

    // 生成推荐职业
    const careers = getRecommendedCareers(formData)

    // 生成待提升能力列表
    const improvements = getImprovements(formData)

    // 生成成长路径
    const growthPath = getGrowthPath(grade)

    // 更新结果对象
    result.totalScore = avgScore
    result.grade = grade
    result.recommendedCareers = careers
    result.improvements = improvements
    result.growthPath = growthPath

    // 显示结果区域
    showResult.value = true

    // 下一帧渲染雷达图
    nextTick(() => {
      renderRadarChart(formData)
    })

    // 保存历史记录
    saveHistory({
      ...formData,
      totalScore: avgScore,
      grade,
      recommendedCareers: careers,
      assessTime: formatDateTime(new Date())
    })

    ElMessage.success('评估完成！')
  })
}

/**
 * 根据分数获取等级
 * @param {number} score - 综合得分
 * @returns {string} 等级描述
 */
function getGrade(score) {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '待提升'
}

/**
 * 根据各项能力得分推荐职业方向
 * @param {object} data - 表单数据
 * @returns {string[]} 推荐职业列表
 */
function getRecommendedCareers(data) {
  const careers = []

  // 根据最高能力项推荐职业
  const abilityMap = {
    communication: ['市场营销', '人力资源', '公关传媒'],
    professional: ['技术研发', '工程师', '数据分析师'],
    teamwork: ['项目经理', '产品经理', '运营专员'],
    innovation: ['产品经理', '创业', '设计创意'],
    learning: ['科研学者', '技术专家', '咨询顾问'],
    leadership: ['管理培训生', '团队主管', '创业者']
  }

  // 找出得分最高的前两项能力
  const sortedAbilities = abilityItems
    .map((item) => ({ key: item.key, score: data[item.key] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  // 获取推荐职业并去重
  const careerSet = new Set()
  sortedAbilities.forEach((ability) => {
    abilityMap[ability.key].forEach((career) => careerSet.add(career))
  })

  return Array.from(careerSet).slice(0, 3)
}

/**
 * 获取待提升的能力及建议
 * @param {object} data - 表单数据
 * @returns {object[]} 待提升能力列表
 */
function getImprovements(data) {
  const suggestions = {
    communication: '多参加演讲比赛、社团活动，锻炼表达与倾听能力。',
    professional: '深入学习专业知识，考取相关证书，参与项目实践。',
    teamwork: '主动参与小组作业与团队项目，学习分工协作与冲突处理。',
    innovation: '培养批判性思维，关注行业前沿，尝试跨界学习。',
    learning: '制定系统学习计划，掌握高效学习方法，保持知识更新。',
    leadership: '争取担任学生干部或项目组长，学习团队管理与决策能力。'
  }

  // 筛选得分低于70分的能力项
  return abilityItems
    .filter((item) => data[item.key] < 70)
    .sort((a, b) => data[a.key] - data[b.key])
    .map((item) => ({
      ability: item.label,
      suggestion: suggestions[item.key]
    }))
}

/**
 * 根据等级生成成长路径
 * @param {string} grade - 综合等级
 * @returns {object[]} 成长路径步骤
 */
function getGrowthPath(grade) {
  const basePath = [
    {
      period: '短期（1-3个月）',
      title: '能力诊断与目标设定',
      content: '明确个人优势与短板，制定具体的能力提升计划。',
      type: 'primary',
      icon: StarFilled
    },
    {
      period: '中期（3-12个月）',
      title: '核心能力强化训练',
      content: '针对薄弱能力进行专项提升，参加实习或项目实践。',
      type: 'success',
      icon: Collection
    },
    {
      period: '长期（1-2年）',
      title: '综合素养全面提升',
      content: '形成个人核心竞争力，积累行业经验，明确职业方向。',
      type: 'warning',
      icon: UserFilled
    },
    {
      period: '远景（2年以上）',
      title: '职业发展与持续成长',
      content: '在选定领域深耕，建立个人品牌，实现职业价值最大化。',
      type: 'danger',
      icon: Trophy
    }
  ]

  // 根据等级调整内容
  if (grade === '待提升') {
    basePath[0].content = '重点夯实基础能力，寻求导师指导与同伴互助。'
    basePath[1].content = '从最薄弱的环节入手，制定可量化的提升指标。'
  } else if (grade === '优秀') {
    basePath[0].content = '保持优势，探索更高级的学习资源与挑战性项目。'
    basePath[1].content = '争取行业顶尖实习机会，拓展国际视野与高端人脉。'
  }

  return basePath
}

// ============================================
// 图表渲染
// ============================================

/**
 * 渲染能力雷达图
 * @param {object} data - 表单数据
 */
function renderRadarChart(data) {
  if (!radarChartRef.value) return

  // 销毁已有实例
  if (radarChart) {
    radarChart.dispose()
  }

  // 初始化ECharts实例
  radarChart = echarts.init(radarChartRef.value)

  // 雷达图配置项
  const option = {
    title: {
      text: '职业能力雷达图',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: abilityItems.map((item) => ({
        name: item.label,
        max: 100
      })),
      radius: '65%',
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12
      },
      splitArea: {
        areaStyle: {
          color: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd']
        }
      }
    },
    series: [
      {
        name: '能力评估',
        type: 'radar',
        data: [
          {
            value: abilityItems.map((item) => data[item.key]),
            name: '当前能力',
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.3)'
            },
            lineStyle: {
              color: '#409eff',
              width: 2
            },
            itemStyle: {
              color: '#409eff'
            }
          }
        ]
      }
    ]
  }

  radarChart.setOption(option)

  // 监听窗口大小变化，自适应调整图表尺寸
  window.addEventListener('resize', () => {
    radarChart && radarChart.resize()
  })
}

// ============================================
// 历史记录管理
// ============================================

/**
 * 保存评估记录到本地存储
 * @param {object} record - 评估记录对象
 */
function saveHistory(record) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const list = stored ? JSON.parse(stored) : []

  // 新记录插入到头部
  list.unshift(record)

  // 最多保存20条记录
  if (list.length > 20) {
    list.pop()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  historyList.value = list
}

/**
 * 加载历史评估记录
 */
function loadHistory() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    historyList.value = JSON.parse(stored)
  }
}

/**
 * 查看历史记录详情
 * @param {number} index - 记录索引
 */
function viewHistoryDetail(index) {
  const record = historyList.value[index]
  if (!record) return

  // 回填数据并展示结果
  Object.assign(formData, record)
  result.totalScore = record.totalScore
  result.grade = record.grade
  result.recommendedCareers = record.recommendedCareers
  result.improvements = getImprovements(record)
  result.growthPath = getGrowthPath(record.grade)
  showResult.value = true

  nextTick(() => {
    renderRadarChart(record)
  })

  // 滚动到结果区域
  document.querySelector('.result-card')?.scrollIntoView({ behavior: 'smooth' })
}

/**
 * 清空所有历史记录
 */
function clearHistory() {
  ElMessageBox.confirm('确定要清空所有历史评估记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      localStorage.removeItem(STORAGE_KEY)
      historyList.value = []
      ElMessage.success('历史记录已清空')
    })
    .catch(() => {})
}

// ============================================
// 表单与工具函数
// ============================================

/**
 * 重置表单与结果
 */
function handleReset() {
  formRef.value.resetFields()
  abilityItems.forEach((item) => {
    formData[item.key] = 60
  })
  showResult.value = false
  if (radarChart) {
    radarChart.dispose()
    radarChart = null
  }
}

/**
 * 根据分数获取标签类型
 * @param {number} score - 分数
 * @returns {string} Element Plus标签类型
 */
function getScoreTagType(score) {
  if (score >= 90) return 'success'
  if (score >= 75) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的字符串
 */
function formatDateTime(date) {
  const pad = (n) => (n < 10 ? '0' + n : n)
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  )
}

// ============================================
// 生命周期钩子
// ============================================

onMounted(() => {
  // 页面加载时读取历史记录
  loadHistory()
})
</script>

<style scoped>
/* 页面整体布局 */
.career-assess-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题样式 */
.page-header {
  text-align: center;
  padding: 30px 0;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  /* el-header 默认高度 60px，装不下「标题 + 副标题」，不覆盖会溢出重叠 */
  height: auto;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 2px;
}

.page-header p {
  margin: 10px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 卡片通用样式 */
.form-card,
.result-card,
.history-card {
  margin-top: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

/* 表单样式 */
.assess-form {
  padding: 10px;
}

/* 雷达图容器 */
.radar-chart {
  width: 100%;
  height: 400px;
}

/* 结果详情区域 */
.result-detail {
  padding: 10px;
}

.result-section {
  margin-bottom: 20px;
}

.result-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

/* 分数展示 */
.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.grade-text {
  margin-top: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

/* 职业标签 */
.career-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.career-tag {
  font-size: 14px;
  padding: 0 16px;
  height: 32px;
  line-height: 32px;
}

/* 待提升能力提示 */
.improvement-alert {
  margin-bottom: 10px;
}

/* 结果底部间距 */
.result-bottom {
  margin-top: 20px;
}

/* 表格标签 */
.table-tag {
  margin: 2px 4px;
}

/* 历史记录卡片 */
.history-card {
  margin-top: 20px;
}
</style>
