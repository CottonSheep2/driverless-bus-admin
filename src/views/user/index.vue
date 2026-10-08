<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="searchName" placeholder="搜索用户名" clearable style="width: 200px" @clear="load" @keyup.enter="load" />
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <el-button type="success" @click="openDialog()">新增用户</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">{{ roleName(row.roleId) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" :prop="form.id ? '' : 'password'">
          <el-input v-model="form.password" type="password" :placeholder="form.id ? '不修改请留空' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model.number="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request'

const tableData = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchName = ref('')
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const roles = ref<any[]>([])

const form = reactive<any>({
  id: undefined,
  username: '',
  password: '',
  phone: '',
  roleId: undefined,
  status: 1,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function roleName(id: number) {
  return roles.value.find((r) => r.id === id)?.roleName || '未知'
}

async function load() {
  const res: any = await request.get('/user/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, username: searchName.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

async function loadRoles() {
  const res: any = await request.get('/user/roles')
  roles.value = res.data
}

function openDialog(row?: any) {
  if (row) {
    Object.assign(form, { ...row, password: '' })
  } else {
    Object.assign(form, { id: undefined, username: '', password: '', phone: '', roleId: undefined, status: 1 })
  }
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (form.id) {
      await request.put('/user', form)
    } else {
      await request.post('/user', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  })
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除用户「${row.username}」？`, '提示', { type: 'warning' })
  await request.delete(`/user/${row.id}`)
  ElMessage.success('删除成功')
  load()
}

onMounted(() => {
  load()
  loadRoles()
})

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
