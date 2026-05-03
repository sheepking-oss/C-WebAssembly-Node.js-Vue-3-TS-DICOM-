<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">医疗影像平台</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info" v-if="authStore.user">
          <div class="user-avatar">{{ authStore.user.name.charAt(0) }}</div>
          <div class="user-details">
            <div class="user-name">{{ authStore.user.name }}</div>
            <div class="user-role">{{ authStore.user.department }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <span class="nav-icon">🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <header class="header">
      <div class="header-left">
        <h2 class="page-title">{{ currentPageTitle }}</h2>
      </div>
      <div class="header-right">
        <div class="notifications">
          <button class="notification-btn">
            <span>🔔</span>
          </button>
        </div>
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '工作台', icon: '🏠' },
  { path: '/images', label: '影像列表', icon: '📋' },
  { path: '/viewer', label: '影像查看', icon: '🔬' },
  { path: '/upload', label: '上传影像', icon: '📤' }
];

const currentPageTitle = computed(() => {
  const matched = menuItems.find(item => isActive(item.path));
  return matched?.label || '工作台';
});

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}

async function handleLogout(): Promise<void> {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('登出失败:', error);
  }
}
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--background-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.nav-item:hover {
  background-color: var(--background-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: var(--secondary-color);
  color: var(--primary-color);
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--text-secondary);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.logout-btn:hover {
  background-color: var(--background-hover);
  color: var(--error-color);
  border-color: var(--error-color);
}

.header {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--header-height);
  background-color: var(--background-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-size: 18px;
}

.notification-btn:hover {
  background-color: var(--secondary-color);
}

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: 24px;
  overflow: auto;
  height: calc(100% - var(--header-height));
}
</style>
