<template>
  <el-container class="layout-container" style="width: 100%; height: 100vh; display: flex;">
    <el-aside width="220px" class="layout-aside" style="flex-shrink: 0;">
      <div class="logo">
        <el-icon><Bus /></el-icon>
        <span>公交管理系统</span>
      </div>
      <el-menu :default-active="activeMenu" router background-color="#1e3c72" text-color="#bfcbd9" active-text-color="#409EFF">
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>系统首页</span>
        </el-menu-item>
        <el-menu-item index="/station">
          <el-icon><Location /></el-icon>
          <span>站点管理</span>
        </el-menu-item>
        <el-menu-item index="/route">
          <el-icon><Guide /></el-icon>
          <span>线路管理</span>
        </el-menu-item>
        <el-menu-item index="/bus">
          <el-icon><Van /></el-icon>
          <span>公交车管理</span>
        </el-menu-item>
        <el-menu-item index="/alarm">
          <el-icon><Warning /></el-icon>
          <span>告警管理</span>
        </el-menu-item>
        <el-menu-item index="/alarmType" v-if="userStore.userInfo.roleCode === 'ADMIN'">
          <el-icon><Collection /></el-icon>
          <span>告警类型管理</span>
        </el-menu-item>
        <el-menu-item index="/log" v-if="userStore.userInfo.roleCode === 'ADMIN'">
          <el-icon><Document /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
        <el-menu-item index="/user" v-if="userStore.userInfo.roleCode === 'ADMIN'">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="layout-right" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
      <el-header class="layout-header">
        <div class="header-left">{{ currentPageTitle }}</div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.userInfo.username }}（{{ userStore.userInfo.roleName }}）
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main" style="width: 100%; box-sizing: border-box; flex: 1;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => (route.name as string) || '')

async function handleCommand(command: string) {
  if (command === 'logout') {
    try {
      await request.post('/user/logout')
    } catch (e) {
      // ignore
    }
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
  display: flex;
}
.layout-container :deep(.layout-right) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.layout-container :deep(.layout-aside) {
  background-color: #1e3c72;
  overflow: hidden;
  flex-shrink: 0;
  width: 220px;
}
.layout-container :deep(.layout-header) {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}
.layout-container :deep(.layout-main) {
  background: #f0f2f5;
  padding: 20px;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  gap: 8px;
  border-bottom: 1px solid #2a5298;
}
.logo .el-icon {
  font-size: 22px;
}
.el-menu {
  border-right: none;
}
.header-left {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}
</style>
