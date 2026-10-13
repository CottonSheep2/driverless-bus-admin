<template>
  <div class="page-card">
    <div class="toolbar">
      <el-select v-model="searchRouteId" placeholder="线路" clearable style="width: 160px" @change="load">
        <el-option v-for="r in allRoutes" :key="r.id" :label="r.routeName" :value="r.id" />
      </el-select>
      <el-select v-model="searchDirection" placeholder="方向" clearable style="width: 100px; margin-left: 10px" @change="load">
        <el-option label="去程" :value="1" />
        <el-option label="返程" :value="2" />
      </el-select>
      <el-select v-model="searchStatus" placeholder="排班状态" clearable style="width: 130px; margin-left: 10px" @change="load">
        <el-option label="待发车" :value="0" />
        <el-option label="待派车" :value="1" />
        <el-option label="运行中" :value="2" />
        <el-option label="已完成" :value="3" />
        <el-option label="已停运" :value="4" />
        <el-option label="已取消" :value="5" />
      </el-select>
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <div style="flex: 1"></div>
      <el-button type="success" @click="openBatch">批量生成</el-button>
      <el-button type="primary" @click="openSingle">新增单条排班</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column label="线路" width="140">
        <template #default="{ row }">{{ routeName(row.routeId) }}</template>
      </el-table-column>
      <el-table-column label="方向" width="80">
        <template #default="{ row }">{{ row.direction === 1 ? '去程' : '返程' }}</template>
      </el-table-column>
      <el-table-column prop="scheduleDate" label="排班日期" width="110">
        <template #default="{ row }">{{ row.scheduleDate || '每日' }}</template>
      </el-table-column>
      <el-table-column prop="departureTime" label="发车时间" width="110" />
      <el-table-column label="生成方式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.generateMode === 0 ? 'info' : 'warning'" size="small">
            {{ row.generateMode === 0 ? '手动' : '批量' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="车辆" width="130">
        <template #default="{ row }">
          {{ row.vehicleId ? busPlate(row.vehicleId) : '未派车' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.scheduleStatus)">{{ statusText(row.scheduleStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <!-- 新增单条排班 -->
    <el-dialog v-model="singleVisible" title="新增单条排班" width="480px">
      <el-form :model="singleForm" label-width="90px">
        <el-form-item label="线路" required>
          <el-select v-model="singleForm.routeId" style="width: 100%">
            <el-option v-for="r in allRoutes" :key="r.id" :label="r.routeName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向" required>
          <el-radio-group v-model="singleForm.direction">
            <el-radio :value="1">去程</el-radio>
            <el-radio :value="2">返程</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排班日期">
          <el-date-picker v-model="singleForm.scheduleDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="留空表示每日通用" />
        </el-form-item>
        <el-form-item label="发车时间" required>
          <el-time-picker v-model="singleForm.departureTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="singleForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="singleVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSingle">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成排班 -->
    <el-dialog v-model="batchVisible" title="批量生成排班" width="480px">
      <el-form :model="batchForm" label-width="110px">
        <el-form-item label="线路" required>
          <el-select v-model="batchForm.routeId" style="width: 100%">
            <el-option v-for="r in allRoutes" :key="r.id" :label="r.routeName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向" required>
          <el-radio-group v-model="batchForm.direction">
            <el-radio :value="1">去程</el-radio>
            <el-radio :value="2">返程</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排班日期">
          <el-date-picker v-model="batchForm.scheduleDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="留空表示每日通用" />
        </el-form-item>
        <el-form-item label="首班时间" required>
          <el-time-picker v-model="batchForm.firstTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="末班时间" required>
          <el-time-picker v-model="batchForm.lastTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发车间隔(分)" required>
          <el-input-number v-model="batchForm.intervalMin" :min="1" :max="120" />
        </el-form-item>
        <el-form-item>
          <span style="color: #909399; font-size: 12px">系统将按首班→末班、以固定间隔自动生成多条排班</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const tableData = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchRouteId = ref<number | undefined>(undefined)
const searchDirection = ref<number | undefined>(undefined)
const searchStatus = ref<number | undefined>(undefined)
const allRoutes = ref<any[]>([])
const allBuses = ref<any[]>([])

const singleVisible = ref(false)
const batchVisible = ref(false)
const singleForm = ref<any>({ routeId: undefined, direction: 1, scheduleDate: '', departureTime: '', remark: '' })
const batchForm = ref<any>({ routeId: undefined, direction: 1, scheduleDate: '', firstTime: '', lastTime: '', intervalMin: 30 })

function statusText(s: number) {
  return { 0: '待发车', 1: '待派车', 2: '运行中', 3: '已完成', 4: '已停运', 5: '已取消' }[s] || '未知'
}
function statusTag(s: number) {
  return { 0: 'primary', 1: 'warning', 2: 'success', 3: 'info', 4: 'danger', 5: 'info' }[s] || ''
}
function routeName(id: number) {
  return allRoutes.value.find((r) => r.id === id)?.routeName || '未知线路'
}
function busPlate(id: number) {
  return allBuses.value.find((b) => b.id === id)?.plateNumber || ''
}

async function load() {
  const res: any = await request.get('/schedule/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, routeId: searchRouteId.value, direction: searchDirection.value, scheduleStatus: searchStatus.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

async function loadRoutes() {
  const res: any = await request.get('/route/list')
  allRoutes.value = res.data
}
async function loadBuses() {
  const res: any = await request.get('/bus/page', { params: { pageNum: 1, pageSize: 100 } })
  allBuses.value = res.data.records
}

function openSingle() {
  singleForm.value = { routeId: undefined, direction: 1, scheduleDate: '', departureTime: '', remark: '' }
  singleVisible.value = true
}
function openBatch() {
  batchForm.value = { routeId: undefined, direction: 1, scheduleDate: '', firstTime: '', lastTime: '', intervalMin: 30 }
  batchVisible.value = true
}

async function submitSingle() {
  if (!singleForm.value.routeId) return ElMessage.warning('请选择线路')
  if (!singleForm.value.departureTime) return ElMessage.warning('请设置发车时间')
  await request.post('/schedule/single', singleForm.value)
  ElMessage.success('排班新增成功')
  singleVisible.value = false
  load()
}

async function submitBatch() {
  if (!batchForm.value.routeId) return ElMessage.warning('请选择线路')
  if (!batchForm.value.firstTime || !batchForm.value.lastTime) return ElMessage.warning('请设置首末班时间')
  const res: any = await request.post('/schedule/batch', batchForm.value)
  ElMessage.success(`已生成 ${res.data.count} 条排班`)
  batchVisible.value = false
  load()
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除该排班（${row.departureTime}）？`, '提示', { type: 'warning' })
  await request.delete(`/schedule/${row.id}`)
  ElMessage.success('删除成功')
  load()
}

onMounted(() => {
  load()
  loadRoutes()
  loadBuses()
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
