<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="searchName" placeholder="搜索线路名称" clearable style="width: 200px" @clear="load" @keyup.enter="load" />
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <el-button type="success" v-if="isAdmin" @click="openDialog()">新增线路</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="routeName" label="线路名称" />
      <el-table-column prop="routeCode" label="线路编号" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column v-if="isAdmin" label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewStations(row)">查看站点</el-button>
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑线路' : '新增线路'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="线路名称" prop="routeName">
          <el-input v-model="form.routeName" />
        </el-form-item>
        <el-form-item label="线路编号" prop="routeCode">
          <el-input v-model="form.routeCode" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model.number="form.status">
            <el-option label="运营中" :value="1" />
            <el-option label="停运" :value="2" />
            <el-option label="维护中" :value="3" />
            <el-option label="规划中" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="途经站点">
          <div class="station-selector">
            <el-select v-model="selectedStation" placeholder="选择站点添加" filterable style="width: 200px" @change="addStation">
              <el-option v-for="s in allStations" :key="s.id" :label="s.stationName" :value="s.id" />
            </el-select>
            <el-tag v-for="(sid, idx) in stationIds" :key="sid" closable style="margin: 4px" @close="removeStation(idx)">
              {{ idx + 1 }}. {{ stationName(sid) }}
            </el-tag>
            <span v-if="stationIds.length === 0" style="color: #999; font-size: 12px">暂未选择站点</span>
          </div>
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

    <el-dialog v-model="stationDialogVisible" title="线路站点" width="500px">
      <el-table :data="routeStations" border>
        <el-table-column label="序号" width="70" type="index" />
        <el-table-column prop="stationName" label="站点名称" />
        <el-table-column prop="area" label="区域" />
      </el-table>
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
const stationDialogVisible = ref(false)
const formRef = ref<FormInstance>()
const allStations = ref<any[]>([])
const stationIds = ref<number[]>([])
const selectedStation = ref<number | undefined>(undefined)
const routeStations = ref<any[]>([])

const form = reactive<any>({
  id: undefined,
  routeName: '',
  routeCode: '',
  status: 1,
  remark: '',
})

const rules: FormRules = {
  routeName: [{ required: true, message: '请输入线路名称', trigger: 'blur' }],
  routeCode: [{ required: true, message: '请输入线路编号', trigger: 'blur' }],
}

function statusText(s: number) {
  return { 1: '运营中', 2: '停运', 3: '维护中', 4: '规划中' }[s] || '未知'
}
function statusTag(s: number) {
  return { 1: 'success', 2: 'info', 3: 'warning', 4: '' }[s] || ''
}
function stationName(id: number) {
  return allStations.value.find((s) => s.id === id)?.stationName || '未知'
}

async function load() {
  const res: any = await request.get('/route/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, routeName: searchName.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

async function loadStations() {
  const res: any = await request.get('/station/list')
  allStations.value = res.data
}

function addStation(id: number) {
  if (!stationIds.value.includes(id)) {
    stationIds.value.push(id)
  }
  selectedStation.value = undefined
}

function removeStation(idx: number) {
  stationIds.value.splice(idx, 1)
}

function openDialog(row?: any) {
  if (row) {
    Object.assign(form, row)
    request.get(`/route/${row.id}/stations`).then((res: any) => {
      stationIds.value = res.data.map((s: any) => s.id)
    })
  } else {
    Object.assign(form, { id: undefined, routeName: '', routeCode: '', status: 1, remark: '' })
    stationIds.value = []
  }
  dialogVisible.value = true
}

async function viewStations(row: any) {
  const res: any = await request.get(`/route/${row.id}/stations`)
  routeStations.value = res.data
  stationDialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    await request.post(form.id ? '/route' : '/route', { route: form, stationIds: stationIds.value })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  })
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除线路「${row.routeName}」？`, '提示', { type: 'warning' })
  await request.delete(`/route/${row.id}`)
  ElMessage.success('删除成功')
  load()
}

onMounted(() => {
  load()
  loadStations()
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
.station-selector {
  width: 100%;
  min-height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 5px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
</style>
