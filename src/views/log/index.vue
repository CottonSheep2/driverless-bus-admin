<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="searchUsername" placeholder="操作人" clearable style="width: 160px" @clear="load" @keyup.enter="load" />
      <el-select v-model="searchModule" placeholder="模块" clearable style="width: 140px; margin-left: 10px" @change="load">
        <el-option label="系统管理" value="系统管理" />
        <el-option label="站点管理" value="站点管理" />
        <el-option label="线路管理" value="线路管理" />
        <el-option label="公交车管理" value="公交车管理" />
        <el-option label="告警管理" value="告警管理" />
        <el-option label="用户管理" value="用户管理" />
        <el-option label="告警类型管理" value="告警类型管理" />
      </el-select>
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <el-button type="danger" v-if="isAdmin" @click="handleClean">清空日志</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="username" label="操作人" width="110" />
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="operation" label="操作" width="110" />
      <el-table-column prop="method" label="请求方法" width="180" show-overflow-tooltip />
      <el-table-column prop="params" label="参数" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip :content="row.params" placement="top" :show-after="300">
            <span style="cursor: pointer">{{ row.params ? (row.params.length > 60 ? row.params.substring(0, 60) + '...' : row.params) : '-' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '成功' : '失败' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="costTime" label="耗时(ms)" width="90" />
      <el-table-column prop="createTime" label="操作时间" width="170" />
      <el-table-column v-if="isAdmin" label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo.roleCode === 'ADMIN')

const tableData = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchUsername = ref('')
const searchModule = ref('')

async function load() {
  const res: any = await request.get('/operation-log/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, username: searchUsername.value, module: searchModule.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确认删除该日志？', '提示', { type: 'warning' })
  await request.delete(`/operation-log/${row.id}`)
  ElMessage.success('删除成功')
  load()
}

async function handleClean() {
  await ElMessageBox.confirm('确认清空所有操作日志？此操作不可恢复！', '警告', { type: 'error' })
  await request.delete('/operation-log/clean')
  ElMessage.success('清空成功')
  load()
}

onMounted(load)

function indexMethod(index: number) {
  return (pageNum.value - 1) * pageSize.value + index + 1
}
</script>

<style scoped>
.page-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
}
</style>
