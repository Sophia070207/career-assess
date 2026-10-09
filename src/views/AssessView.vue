<template>
  <div class="assess-page">
    <h2 class="page-title">大学生职业评估系统</h2>

    <!-- 1. 基础信息 -->
    <el-card class="section-card">
      <template #header>
        <span>学生基础信息</span>
      </template>
      <el-form :model="form" label-width="80px" class="base-form">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="form.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="form.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="form.grade" placeholder="请选择年级">
            <el-option label="大一" value="大一" />
            <el-option label="大二" value="大二" />
            <el-option label="大三" value="大三" />
            <el-option label="大四" value="大四" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 六大维度 -->
    <el-collapse v-model="activeCollapse" class="dimension-collapse">
      <!-- 2.1 认知能力 -->
      <el-collapse-item title="认知能力" name="cognition">
        <div class="collapse-inner">
          <p class="tip">共 3 道单选题，每题限时 60 秒</p>
          <div
            v-for="(q, idx) in cognitiveQuestions"
            :key="idx"
            class="question-block"
          >
            <div class="question-header">
              <span class="q-title">{{ idx + 1 }}. {{ q.title }}</span>
              <el-tag :type="timerStatus[idx] === '超时' ? 'danger' : 'info'">
                {{ timerStatus[idx] || '未开始' }}
              </el-tag>
            </div>
            <el-radio-group v-model="cognitiveAnswers[idx]">
              <el-radio
                v-for="opt in q.options"
                :key="opt.value"
                :label="opt.value"
                @change="startCognitiveTimer(idx)"
              >
                {{ opt.label }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="result-line">
            正确率：{{ cognitiveCorrectRate }}% | 总用时：{{ cognitiveTotalTime }} 秒
          </div>
        </div>
      </el-collapse-item>

      <!-- 2.2 专业能力 -->
      <el-collapse-item title="专业能力" name="professional">
        <div class="collapse-inner">
          <el-form label-width="140px">
            <el-form-item label="专业课 GPA">
              <el-input-number
                v-model="professional.gpa"
                :min="0"
                :max="4"
                :precision="2"
                :step="0.1"
                @change="updatePotential"
              />
              <span class="unit">0 - 4.0</span>
            </el-form-item>
            <el-form-item label="证书名称">
              <el-input
                v-model="professional.certificates"
                placeholder="如：CET-6、软考中级、PMP 等，多个用逗号分隔"
              />
            </el-form-item>
            <el-form-item label="GitHub / 项目链接">
              <el-input
                v-model="professional.projectLink"
                placeholder="https://github.com/xxx"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-item>

      <!-- 2.3 实践能力 -->
      <el-collapse-item title="实践能力" name="practice">
        <div class="collapse-inner">
          <el-form label-width="100px">
            <el-form-item label="实习经历">
              <div
                v-for="(item, idx) in practice.internships"
                :key="idx"
                class="repeat-row"
              >
                <el-input v-model="item.company" placeholder="公司" style="width: 180px" />
                <el-input v-model="item.position" placeholder="岗位" style="width: 140px" />
                <el-input-number v-model="item.months" :min="0" placeholder="月数" />
                <el-button
                  v-if="practice.internships.length > 1"
                  type="danger"
                  size="small"
                  @click="removeInternship(idx)"
                >
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addInternship">
                + 添加经历
              </el-button>
            </el-form-item>
            <el-form-item label="项目交付物链接">
              <el-input
                v-model="practice.deliverableLink"
                placeholder="可访问的项目文档/演示链接"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-item>

      <!-- 2.4 软技能 -->
      <el-collapse-item title="软技能" name="softSkill">
        <div class="collapse-inner">
          <div
            v-for="(q, idx) in softSkillQuestions"
            :key="idx"
            class="question-block"
          >
            <p class="q-title">{{ idx + 1 }}. {{ q }}</p>
            <el-input
              v-model="softSkillAnswers[idx]"
              type="textarea"
              :rows="4"
              placeholder="请描述你的处理思路与具体做法..."
            />
          </div>
        </div>
      </el-collapse-item>

      <!-- 2.5 职业价值观 -->
      <el-collapse-item title="职业价值观" name="values">
        <div class="collapse-inner">
          <div
            v-for="(q, idx) in valueQuestions"
            :key="idx"
            class="question-block"
          >
            <p class="q-title">{{ idx + 1 }}. {{ q.title }}</p>
            <el-radio-group v-model="valueAnswers[idx]">
              <el-radio :label="q.optionA.value">
                {{ q.optionA.label }}
              </el-radio>
              <el-radio :label="q.optionB.value">
                {{ q.optionB.label }}
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </el-collapse-item>

      <!-- 2.6 发展潜力 -->
      <el-collapse-item title="发展潜力" name="potential">
        <div class="collapse-inner">
          <el-result
            icon="info"
            title="自动计算中"
            :sub-title="potentialText"
          />
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 3. 提交 -->
    <div class="submit-bar">
      <el-button type="primary" size="large" @click="handleSubmit">
        提交测评
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { submitAssessment } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

/* ---------- 基础信息 ---------- */
const form = reactive({
  name: '',
  studentId: '',
  major: '',
  grade: ''
})

/* ---------- 折叠面板 ---------- */
const activeCollapse = ref(['cognition'])

/* ---------- 认知能力 ---------- */
const cognitiveQuestions = [
  {
    title: '图形推理：下一个图形应该是？（A：圆形  B：三角形  C：正方形）',
    options: [
      { label: '圆形', value: 'A' },
      { label: '三角形', value: 'B' },
      { label: '正方形', value: 'C' }
    ],
    correct: 'B'
  },
  {
    title: '数列：2, 6, 12, 20, ?（A：28  B：30  C：32）',
    options: [
      { label: '28', value: 'A' },
      { label: '30', value: 'B' },
      { label: '32', value: 'C' }
    ],
    correct: 'B'
  },
  {
    title: '条件判断：若 A>B 且 B>C，则？（A：A<C  B：A>C  C：不确定）',
    options: [
      { label: 'A < C', value: 'A' },
      { label: 'A > C', value: 'B' },
      { label: '不确定', value: 'C' }
    ],
    correct: 'B'
  }
]

const cognitiveAnswers = ref([null, null, null])
const cognitiveTimers = ref([null, null, null])
const cognitiveTimes = ref([0, 0, 0]) // 每题用时（秒）
const timerStatus = ref(['未开始', '未开始', '未开始'])

function startCognitiveTimer(idx) {
  if (cognitiveTimers.value[idx]) return // 已启动则忽略
  timerStatus.value[idx] = '计时中'
  cognitiveTimers.value[idx] = setInterval(() => {
    cognitiveTimes.value[idx]++
    if (cognitiveTimes.value[idx] >= 60) {
      clearInterval(cognitiveTimers.value[idx])
      timerStatus.value[idx] = '超时'
      ElMessage.warning(`第 ${idx + 1} 题已超时`)
    }
  }, 1000)
}

const cognitiveCorrectRate = computed(() => {
  let correct = 0
  cognitiveAnswers.value.forEach((ans, idx) => {
    if (ans === cognitiveQuestions[idx].correct) correct++
  })
  return Math.round((correct / cognitiveQuestions.length) * 100)
})

const cognitiveTotalTime = computed(() =>
  cognitiveTimes.value.reduce((a, b) => a + b, 0)
)

/* ---------- 专业能力 ---------- */
const professional = reactive({
  gpa: 0,
  certificates: '',
  projectLink: ''
})

/* ---------- 实践能力 ---------- */
const practice = reactive({
  internships: [{ company: '', position: '', months: 0 }],
  deliverableLink: ''
})

function addInternship() {
  practice.internships.push({ company: '', position: '', months: 0 })
}
function removeInternship(idx) {
  practice.internships.splice(idx, 1)
}

/* ---------- 软技能 ---------- */
const softSkillQuestions = [
  '场景一：团队项目中两名成员因技术方案产生激烈冲突，你作为负责人如何处理？',
  '场景二：项目即将上线，测试发现严重 Bug，而 deadline 不可延后，你会怎么做？'
]
const softSkillAnswers = ref(['', ''])

/* ---------- 职业价值观 ---------- */
const valueQuestions = [
  {
    title: '你更倾向哪种工作环境？',
    optionA: { label: '稳定、规则明确、压力小', value: 'stable' },
    optionB: { label: '变化快、挑战大、成长快', value: 'challenge' }
  },
  {
    title: '面对两份 offer，你更看重？',
    optionA: { label: '高薪但加班多', value: 'salary' },
    optionB: { label: '薪资一般但工作生活平衡', value: 'balance' }
  },
  {
    title: '职业发展路径，你更想？',
    optionA: { label: '深耕技术，成为专家', value: 'expert' },
    optionB: { label: '转向管理，带领团队', value: 'manager' }
  },
  {
    title: '工作中遇到瓶颈时，你倾向于？',
    optionA: { label: '坚持到底，攻克难题', value: 'persist' },
    optionB: { label: '及时调整，寻找新方向', value: 'pivot' }
  },
  {
    title: '对公司的选择，你更看重？',
    optionA: { label: '大公司，平台好，流程规范', value: 'big' },
    optionB: { label: '创业公司，机会多，能独当一面', value: 'startup' }
  }
]
const valueAnswers = ref([null, null, null, null, null])

/* ---------- 发展潜力 ---------- */
const potentialText = ref('根据 GPA 计算中...')
function updatePotential() {
  const gpa = professional.gpa || 0
  const score = Math.round((gpa / 4) * 100)
  potentialText.value = `当前 GPA：${gpa}，潜力指数：${score}（自动计算，仅供参考）`
}

/* ---------- 提交 ---------- */
async function handleSubmit() {
  // 简单校验
  if (!form.name || !form.studentId || !form.major || !form.grade) {
    ElMessage.warning('请填写完整的基础信息')
    return
  }
  if (valueAnswers.value.includes(null)) {
    ElMessage.warning('请完成所有职业价值观迫选题')
    return
  }

  const payload = {
    baseInfo: { ...form },
    cognition: {
      answers: cognitiveAnswers.value,
      times: cognitiveTimes.value,
      correctRate: cognitiveCorrectRate.value,
      totalTime: cognitiveTotalTime.value
    },
    professional: { ...professional },
    practice: { ...practice },
    softSkill: softSkillAnswers.value,
    values: valueAnswers.value
  }

  try {
    const res = await submitAssessment(payload)
    if (res.code === 200) {
      ElMessage.success('提交成功')
      localStorage.setItem('userId', res.data.assessmentId || 'mock_user')
      router.push('/profile')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('提交失败，请稍后重试')
  }
}
</script>

<style scoped>
.page-title {
  text-align: center;
  margin-bottom: 24px;
  color: #303133;
}

.section-card {
  margin-bottom: 20px;
}

.base-form {
  max-width: 500px;
}

.dimension-collapse {
  margin-bottom: 24px;
}

.collapse-inner {
  padding: 12px 16px;
}

.tip {
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}

.question-block {
  margin-bottom: 20px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.q-title {
  font-weight: 500;
  color: #303133;
}

.result-line {
  margin-top: 12px;
  color: #409eff;
  font-size: 14px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.repeat-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.submit-bar {
  text-align: center;
  padding: 20px 0 40px;
}
</style>
