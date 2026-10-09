<template>
  <div id="app">
    <nav class="top-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['nav-link', { active: $route.path === item.path }]"
      >
        {{ item.label }}
      </router-link>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
const navItems = [
  { path: '/assess', label: '职业测评' },
  { path: '/profile', label: '能力画像' },
  { path: '/gap', label: '差距分析' },
  { path: '/board', label: '成长看板' }
]
</script>

<style scoped>
.top-nav {
  display: flex;
  gap: 0;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  height: 56px;
  align-items: center;
}

.nav-link {
  padding: 0 20px;
  height: 56px;
  line-height: 56px;
  text-decoration: none;
  color: #606266;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #409eff;
}

.nav-link.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.main-content {
  padding: 20px;
  max-width: 960px;
  margin: 0 auto;
}
</style>
