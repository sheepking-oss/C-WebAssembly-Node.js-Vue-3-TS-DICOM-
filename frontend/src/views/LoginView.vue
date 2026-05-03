<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">🏥</div>
        <h1 class="app-title">医疗影像远程诊断平台</h1>
        <p class="app-subtitle">Medical Imaging Remote Diagnostic Platform</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            :disabled="isLoading"
            required
          />
        </div>

        <div class="input-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            :disabled="isLoading"
            required
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="error-message" v-if="error">
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary login-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>登录</span>
        </button>
      </form>

      <div class="login-footer">
        <p class="demo-info">
          测试账号: doctor1 / doctor123
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formData = reactive({
  username: '',
  password: ''
});

const isLoading = ref(false);
const error = ref<string | null>(null);

async function handleLogin(): Promise<void> {
  if (!formData.username || !formData.password) {
    error.value = '请输入用户名和密码';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    await authStore.login(formData.username, formData.password);

    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '登录失败，请检查用户名和密码';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--background-dark) 0%, var(--background-card) 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--background-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 40px;
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.app-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 8px;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--error-color);
  border-radius: var(--radius-md);
  color: var(--error-color);
  font-size: 14px;
  margin-bottom: 16px;
}

.login-footer {
  text-align: center;
}

.demo-info {
  font-size: 13px;
  color: var(--text-muted);
  padding: 12px;
  background-color: var(--background-dark);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}
</style>
