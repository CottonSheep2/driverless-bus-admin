<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="searchTitle" placeholder="搜索告警标题" clearable style="width: 200px" @clear="load" @keyup.enter="load" />
      <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px; margin-left: 10px" @change="load">
        <el-option label="已上报" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <el-button type="warning" @click="openReportDialog()">上报告警</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="title" label="告警标题" />
      <el-table-column label="告警类型" width="120">
        <template #default="{ row }">{{ typeName(row.alarmTypeId) }}</template>
      </el-table-column>
      <el-table-column prop="content" label="告警内容" show-overflow-tooltip />
      <el-table-column prop="reportTime" label="上报时间" width="170" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '已处理' : '已上报' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 0" link type="primary" @click="openHandleDialog(row)">处理</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <el-dialog v-model="reportDialogVisible" title="上报告警" width="500px">
      <el-form :model="reportForm" :rules="reportRules" ref="reportFormRef" label-width="90px">
        <el-form-item label="告警类型" prop="alarmTypeId">
          <el-select v-model="reportForm.alarmTypeId" placeholder="请选择" style="width: 100%">
            <el-option v-for="t in alarmTypes" :key="t.id" :label="t.typeName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警标题" prop="title">
          <el-input v-model="reportForm.title" />
        </el-form-item>
        <el-form-item label="告警内容" prop="content">
          <el-input v-model="reportForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleDialogVisible" title="处理告警" width="500px">
      <el-descriptions :column="1" border size="small" style="margin-bottom: 15px">
        <el-descriptions-item label="告警标题">{{ currentAlarm?.title }}</el-descriptions-item>
        <el-descriptions-item label="告警内容">{{ currentAlarm?.content }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="handleForm" :rules="handleRules" ref="handleFormRef" label-width="90px">
        <el-form-item label="处理内容" prop="handleContent">
          <el-input v-model="handleForm.handleContent" type="textarea" :rows="4" placeholder="请输入处理措施和结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
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
const searchTitle = ref('')
const searchStatus = ref<number | undefined>(undefined)
const alarmTypes = ref<any[]>([])
const currentAlarm = ref<any>(null)

const reportDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const reportFormRef = ref<FormInstance>()
const handleFormRef = ref<FormInstance>()

const reportForm = reactive<any>({
  alarmTypeId: undefined,
  title: '',
  content: '',
})

const handleForm = reactive<any>({
  reportId: undefined,
  handleContent: '',
})

const reportRules: FormRules = {
  alarmTypeId: [{ required: true, message: '请选择告警类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入告警标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入告警内容', trigger: 'blur' }],
}

const handleRules: FormRules = {
  handleContent: [{ required: true, message: '请输入处理内容', trigger: 'blur' }],
}

function typeName(id: number) {
  return alarmTypes.value.find((t) => t.id === id)?.typeName || '未知'
}

async function load() {
  const res: any = await request.get('/alarm/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, title: searchTitle.value, status: searchStatus.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

async function loadTypes() {
  const res: any = await request.get('/alarm/types')
  alarmTypes.value = res.data
}

function openReportDialog() {
  Object.assign(reportForm, { alarmTypeId: undefined, title: '', content: '' })
  reportDialogVisible.value = true
}

async function submitReport() {
  if (!reportFormRef.value) return
  await reportFormRef.value.validate(async (valid) => {
    if (!valid) return
    await request.post('/alarm/report', reportForm)
    ElMessage.success('告警上报成功')
    reportDialogVisible.value = false
    load()
  })
}

function openHandleDialog(row: any) {
  currentAlarm.value = row
  handleForm.reportId = row.id
  handleForm.handleContent = ''
  handleDialogVisible.value = true
}

async function submitHandle() {
  if (!handleFormRef.value) return
  await handleFormRef.value.validate(async (valid) => {
    if (!valid) return
    await request.post('/alarm/handle', handleForm)
    ElMessage.success('告警处理成功')
    handleDialogVisible.value = false
    load()
  })
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除告警「${row.title}」？仅已处理的告警可删除。`, '提示', { type: 'warning' })
  await request.delete(`/alarm/${row.id}`)
  ElMessage.success('删除成功')
  load()
}

onMounted(() => {
  load()
  loadTypes()
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
