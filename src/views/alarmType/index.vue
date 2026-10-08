<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="searchName" placeholder="搜索类型名称" clearable style="width: 200px" @clear="load" @keyup.enter="load" />
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <el-button v-if="isAdmin" type="success" @click="openDialog()">新增类型</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="typeName" label="类型名称" />
      <el-table-column prop="typeCode" label="类型编码" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column v-if="isAdmin" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑告警类型' : '新增告警类型'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="类型名称" prop="typeName">
          <el-input v-model="form.typeName" />
        </el-form-item>
        <el-form-item label="类型编码" prop="typeCode">
          <el-input v-model="form.typeCode" placeholder="如：DEVICE_FAULT" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model.number="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo.roleCode === 'ADMIN')

const tableData = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchName = ref('')
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<any>({
  id: undefined,
  typeName: '',
  typeCode: '',
  status: 1,
  remark: '',
})

const rules: FormRules = {
  typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  typeCode: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
}

async function load() {
  const res: any = await request.get('/alarm-type/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, typeName: searchName.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

function openDialog(row?: any) {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: undefined, typeName: '', typeCode: '', status: 1, remark: '' })
  }
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (form.id) {
      await request.put('/alarm-type', form)
    } else {
      await request.post('/alarm-type', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  })
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除告警类型「${row.typeName}」？`, '提示', { type: 'warning' })
  await request.delete(`/alarm-type/${row.id}`)
  ElMessage.success('删除成功')
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
