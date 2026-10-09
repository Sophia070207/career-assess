import axios from 'axios'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

/* ---------- 工具 ---------- */
const levelScore = (level) => ({ S: 5, A: 4, B: 3, C: 2, D: 1 }[level] || 0)

function getDeadline(days = 7) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const dimTaskMap = {
  communication: { title: '沟通表达训练营', type: 'QUIZ' },
  professional: { title: '考取相关证书或完成实战项目', type: 'PROJECT' },
  teamwork: { title: '团队协作工作坊', type: 'PRACTICE' },
  innovation: { title: '创新思维与设计思维训练', type: 'QUIZ' },
  learning: { title: '学习方法论与知识管理课程', type: 'QUIZ' },
  leadership: { title: '担任学生干部或项目组长', type: 'PRACTICE' }
}

const occupationRequirements = {
  产品经理: { communication: 'A', professional: 'B', teamwork: 'B', innovation: 'B', learning: 'B', leadership: 'C' },
  后端开发: { communication: 'C', professional: 'A', teamwork: 'B', innovation: 'C', learning: 'A', leadership: 'C' },
  数据分析师: { communication: 'B', professional: 'B', teamwork: 'B', innovation: 'B', learning: 'A', leadership: 'C' },
  公务员: { communication: 'B', professional: 'C', teamwork: 'B', innovation: 'D', learning: 'B', leadership: 'C' },
  教师: { communication: 'A', professional: 'B', teamwork: 'B', innovation: 'C', learning: 'B', leadership: 'C' }
}

const mockProfile = {
  name: '张苏',
  major: '通信工程',
  tag: '资源整合型',
  growthSlope: 'medium',
  updateDate: new Date().toISOString().split('T')[0],
  dimensions: {
    communication: { score: 75, level: 'A', percentile: 82 },
    professional: { score: 31, level: 'C', percentile: 35 },
    teamwork: { score: 77, level: 'A', percentile: 85 },
    innovation: { score: 62, level: 'B', percentile: 60 },
    learning: { score: 31, level: 'C', percentile: 40 },
    leadership: { score: 17, level: 'D', percentile: 15 }
  }
}

/* ---------- Mock 数据工厂 ---------- */
const mock = {
  submitAssessment: (data) => {
    console.log('Mock模式: submitAssessment', data)
    return Promise.resolve({
      code: 200,
      message: 'success',
      data: { assessmentId: 'mock_' + Date.now() }
    })
  },

  getProfile: (userId) => {
    console.log('Mock模式: getProfile', userId)
    return Promise.resolve({
      code: 200,
      message: 'success',
      data: { ...mockProfile }
    })
  },

  getGap: (userId, occupation) => {
    console.log('Mock模式: getGap', userId, occupation)
    const dims = mockProfile.dimensions
    const reqs = occupationRequirements[occupation] || occupationRequirements['产品经理']

    const gaps = Object.keys(reqs).map((key) => {
      const current = dims[key].level
      const target = reqs[key]
      const curScore = levelScore(current)
      const tgtScore = levelScore(target)
      const diff = tgtScore - curScore

      let gap = 'equal'
      if (curScore > tgtScore) gap = 'up'
      else if (curScore < tgtScore) gap = 'down'

      let type = null
      if (diff >= 2) type = 'hard'
      else if (diff === 1) type = 'soft'

      return { dim: key, current, target, gap, type }
    })

    const tasks = gaps
      .filter((g) => g.gap === 'down' && dimTaskMap[g.dim])
      .map((g, idx) => ({
        id: idx + 1,
        title: dimTaskMap[g.dim].title,
        dim: g.dim,
        from: g.current,
        to: g.target,
        type: dimTaskMap[g.dim].type,
        deadline: getDeadline(7),
        status: '待开始'
      }))

    return Promise.resolve({
      code: 200,
      message: 'success',
      data: { requirements: reqs, gaps, tasks }
    })
  },

  updateTaskStatus: (taskId, status) => {
    console.log('Mock模式: updateTaskStatus', taskId, status)
    return Promise.resolve({
      code: 200,
      message: 'success',
      data: { taskId, status }
    })
  },

  getAiAdvice: ({ userId, question }) => {
    console.log('Mock模式: getAiAdvice', userId, question)
    return Promise.resolve({
      code: 200,
      message: 'success',
      data: {
        advice:
          '根据你的测评结果，你的沟通能力（A级）和团队协作（A级）是突出优势，与目标岗位高度匹配。但专业技能（C级）距目标B级仍有差距，学习能力（C级）和领导潜力（D级）也亟待提升。建议：1. 优先补足产品方法论，学习 Axure、SQL 等工具；2. 参与一个完整的项目闭环，积累从需求分析到上线的实战经验；3. 争取担任一次项目组长，锻炼基础领导力。'
      }
    })
  },

  getBoardSummary: (userId) => {
    console.log('Mock模式: getBoardSummary', userId)
    const dims = mockProfile.dimensions
    const reqs = occupationRequirements['产品经理']

    const gaps = Object.keys(reqs).map((key) => {
      const current = dims[key].level
      const target = reqs[key]
      const curScore = levelScore(current)
      const tgtScore = levelScore(target)
      const diff = tgtScore - curScore

      let gap = 'equal'
      if (curScore > tgtScore) gap = 'up'
      else if (curScore < tgtScore) gap = 'down'

      let type = null
      if (diff >= 2) type = 'hard'
      else if (diff === 1) type = 'soft'

      return { dim: key, current, target, gap, type }
    })

    const tasks = gaps
      .filter((g) => g.gap === 'down' && dimTaskMap[g.dim])
      .map((g, idx) => ({
        id: idx + 1,
        title: dimTaskMap[g.dim].title,
        dim: g.dim,
        from: g.current,
        to: g.target,
        type: dimTaskMap[g.dim].type,
        deadline: getDeadline(7),
        status: '待开始'
      }))

    const doneCount = tasks.filter((t) => t.status === '已完成').length
    const progressPercent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

    return Promise.resolve({
      code: 200,
      message: 'success',
      data: {
        targetOccupation: '产品经理',
        progressPercent,
        doneCount,
        totalCount: tasks.length,
        tasks
      }
    })
  }
}

/* ---------- 接口导出 ---------- */
export function submitAssessment(data) {
  if (USE_MOCK) return mock.submitAssessment(data)
  return api.post('/assess/submit', data)
}

export function getProfile(userId) {
  if (USE_MOCK) return mock.getProfile(userId)
  return api.get(`/profile/${userId}`)
}

export function getGap(userId, occupation) {
  if (USE_MOCK) return mock.getGap(userId, occupation)
  return api.get(`/gap/${userId}`, { params: { occupation } })
}

export function updateTaskStatus(taskId, status) {
  if (USE_MOCK) return mock.updateTaskStatus(taskId, status)
  return api.put(`/tasks/${taskId}`, { status })
}

export function getAiAdvice({ userId, question }) {
  if (USE_MOCK) return mock.getAiAdvice({ userId, question })
  return api.post('/rag/advice', { userId, question })
}

export function getBoardSummary(userId) {
  if (USE_MOCK) return mock.getBoardSummary(userId)
  return api.get(`/board/summary/${userId}`)
}

export default api
