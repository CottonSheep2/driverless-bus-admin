<template>
  <div class="page-card">
    <!-- 派车调度功能区（仅管理员） -->
    <div class="dispatch-bar" v-if="userStore.userInfo.roleCode === 'ADMIN'">
      <span class="bar-title">派车调度</span>
      <el-button type="primary" @click="openManual">手动派车</el-button>
      <el-button type="success" @click="openTemp">临时加派</el-button>
      <el-button type="warning" @click="openOffline">车辆下线</el-button>
      <el-button type="danger" @click="openSuspend">线路临时停运</el-button>
      <el-button type="danger" plain @click="openReplace">车辆接替</el-button>
    </div>

    <!-- 车次查询区 -->
    <div class="toolbar">
      <el-select v-model="searchRouteId" placeholder="线路" clearable style="width: 150px" @change="load">
        <el-option v-for="r in allRoutes" :key="r.id" :label="r.routeName" :value="r.id" />
      </el-select>
      <el-select v-model="searchStatus" placeholder="车次状态" clearable style="width: 130px; margin-left: 10px" @change="load">
        <el-option label="运行中" :value="1" />
        <el-option label="已完成" :value="2" />
        <el-option label="已中断" :value="3" />
      </el-select>
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column label="线路" width="140">
        <template #default="{ row }">{{ routeName(row.routeId) }}</template>
      </el-table-column>
      <el-table-column label="车辆" width="130">
        <template #default="{ row }">{{ busPlate(row.vehicleId) }}</template>
      </el-table-column>
      <el-table-column label="方向" width="80">
        <template #default="{ row }">{{ row.direction === 1 ? '去程' : '返程' }}</template>
      </el-table-column>
      <el-table-column prop="departTime" label="发车时间" width="160" />
      <el-table-column prop="estArriveTime" label="预计到达" width="160" />
      <el-table-column prop="actualArriveTime" label="实际到达" width="160">
        <template #default="{ row }">{{ row.actualArriveTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.isTemp === 1" type="warning" size="small">临时</el-tag>
          <el-tag v-else type="info" size="small">排班</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.tripStatus)">{{ statusText(row.tripStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          <el-button v-if="row.tripStatus === 1" link type="success" @click="completeTrip(row)">完成</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <!-- 手动派车 -->
    <el-dialog v-model="manualVisible" title="手动派车" width="480px">
      <el-form :model="manualForm" label-width="100px">
        <el-form-item label="待发车排班" required>
          <el-select v-model="manualForm.scheduleId" style="width: 100%" filterable placeholder="选择待发车排班" @change="onManualScheduleChange">
            <el-option v-for="s in pendingSchedules" :key="s.id" :label="`${routeName(s.routeId)} ${s.direction===1?'去程':'返程'} ${s.departureTime}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择车辆" required>
          <el-select v-model="manualForm.vehicleId" style="width: 100%" filterable placeholder="请先选择待发车排班">
            <el-option v-for="b in manualBuses" :key="b.id" :label="`${b.plateNumber}（${routeName(b.routeId)||'未分配'}）电量${b.battery||100}%`" :value="b.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualVisible = false">取消</el-button>
        <el-button type="primary" @click="submitManual">派车</el-button>
      </template>
    </el-dialog>

    <!-- 临时加派 -->
    <el-dialog v-model="tempVisible" title="临时加派班次" width="480px">
      <el-form :model="tempForm" label-width="100px">
        <el-form-item label="线路" required>
          <el-select v-model="tempForm.routeId" style="width: 100%" @change="onTempRouteChange">
            <el-option v-for="r in allRoutes" :key="r.id" :label="r.routeName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-radio-group v-model="tempForm.direction">
            <el-radio :value="1">去程</el-radio>
            <el-radio :value="2">返程</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="车辆" required>
          <el-select v-model="tempForm.vehicleId" style="width: 100%" filterable placeholder="请先选择线路">
            <el-option v-for="b in tempBuses" :key="b.id" :label="`${b.plateNumber}（${routeName(b.routeId)||'未分配'}）`" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="tempForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tempVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTemp">立即派车</el-button>
      </template>
    </el-dialog>

    <!-- 车辆下线 -->
    <el-dialog v-model="offlineVisible" title="车辆下线" width="480px">
      <el-form :model="offlineForm" label-width="100px">
        <el-form-item label="运行中车辆" required>
          <el-select v-model="offlineForm.vehicleId" style="width: 100%" filterable>
            <el-option v-for="t in runningTrips" :key="t.id" :label="`${busPlate(t.vehicleId)} - ${routeName(t.routeId)}`" :value="t.vehicleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="下线原因">
          <el-input v-model="offlineForm.reason" type="textarea" :rows="2" placeholder="如：车辆故障、临时检修" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="offlineVisible = false">取消</el-button>
        <el-button type="danger" @click="submitOffline">强制下线</el-button>
      </template>
    </el-dialog>

    <!-- 线路临时停运 -->
    <el-dialog v-model="suspendVisible" title="线路临时停运" width="440px">
      <el-form label-width="100px">
        <el-form-item label="线路" required>
          <el-select v-model="suspendForm.routeId" style="width: 100%">
            <el-option v-for="r in allRoutes" :key="r.id" :label="r.routeName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <span style="color: #e6a23c; font-size: 12px">停运后，该线路所有待发车排班将置为已停运状态</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="suspendVisible = false">取消</el-button>
        <el-button type="danger" @click="submitSuspend">确认停运</el-button>
      </template>
    </el-dialog>

    <!-- 车辆接替 -->
    <el-dialog v-model="replaceVisible" title="车辆接替（应急调度）" width="480px">
      <el-form :model="replaceForm" label-width="100px">
        <el-form-item label="故障车辆" required>
          <el-select v-model="replaceForm.vehicleId" style="width: 100%" filterable @change="onReplaceVehicleChange">
            <el-option v-for="t in runningTrips" :key="t.id" :label="`${busPlate(t.vehicleId)} - ${routeName(t.routeId)}`" :value="t.vehicleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="备用车辆" required>
          <el-select v-model="replaceForm.backupVehicleId" style="width: 100%" filterable placeholder="请先选择故障车辆">
            <el-option v-for="b in replaceBackupBuses" :key="b.id" :label="`${b.plateNumber}（${routeName(b.routeId)||'未分配'}）`" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="接替原因">
          <el-input v-model="replaceForm.reason" type="textarea" :rows="2" placeholder="如：车辆故障" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReplace">接替</el-button>
      </template>
    </el-dialog>

    <!-- 车次详情 -->
    <el-dialog v-model="detailVisible" title="车次详情" width="480px">
      <template v-if="detailData">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="线路">{{ detailData.routeName }}</el-descriptions-item>
          <el-descriptions-item label="车辆">{{ busPlate(detailData.trip.vehicleId) }}</el-descriptions-item>
          <el-descriptions-item label="方向">{{ detailData.trip.direction === 1 ? '去程' : '返程' }}</el-descriptions-item>
          <el-descriptions-item label="发车时间">{{ detailData.trip.departTime }}</el-descriptions-item>
          <el-descriptions-item label="预计到达">{{ detailData.trip.estArriveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际到达">{{ detailData.trip.actualArriveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detailData.trip.tripStatus) }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 15px 0 10px">途经站点</h4>
        <el-steps direction="vertical" :active="detailData.stations.length" style="max-height: 300px; overflow-y: auto">
          <el-step v-for="s in detailData.stations" :key="s.seq" :title="s.stationName" :description="`第 ${s.seq} 站`" />
        </el-steps>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const tableData = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchRouteId = ref<number | undefined>(undefined)
const searchStatus = ref<number | undefined>(undefined)
const allRoutes = ref<any[]>([])
const allBuses = ref<any[]>([])

// 派车调度数据
const pendingSchedules = ref<any[]>([])
const readyBuses = ref<any[]>([])
const runningTrips = ref<any[]>([])

const detailVisible = ref(false)
const detailData = ref<any>(null)

const manualVisible = ref(false)
const manualForm = ref<any>({ scheduleId: undefined, vehicleId: undefined })
const tempVisible = ref(false)
const tempForm = ref<any>({ routeId: undefined, direction: 1, vehicleId: undefined, remark: '' })
const offlineVisible = ref(false)
const offlineForm = ref<any>({ vehicleId: undefined, reason: '' })
const suspendVisible = ref(false)
const suspendForm = ref<any>({ routeId: undefined })
const replaceVisible = ref(false)
const replaceForm = ref<any>({ vehicleId: undefined, backupVehicleId: undefined, reason: '' })

function statusText(s: number) {
  return { 0: '待发车', 1: '运行中', 2: '已完成', 3: '已中断' }[s] || '未知'
}
function statusTag(s: number) {
  return { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger' }[s] || ''
}
function routeName(id: number) {
  return allRoutes.value.find((r) => r.id === id)?.routeName || '未知线路'
}
function busPlate(id: number) {
  const b = allBuses.value.find((x) => x.id === id)
  if (b) return b.plateNumber
  const r = readyBuses.value.find((x) => x.id === id)
  return r ? r.plateNumber : ''
}

// 手动派车：按所选排班线路过滤车辆
const manualBuses = computed(() => {
  if (!manualForm.value.scheduleId) return []
  const sched = pendingSchedules.value.find((s) => s.id === manualForm.value.scheduleId)
  if (!sched) return []
  return readyBuses.value.filter((b) => b.routeId === sched.routeId)
})
function onManualScheduleChange() {
  manualForm.value.vehicleId = undefined
}

// 临时加派：按所选线路过滤车辆
const tempBuses = computed(() => {
  if (!tempForm.value.routeId) return []
  return readyBuses.value.filter((b) => b.routeId === tempForm.value.routeId)
})
function onTempRouteChange() {
  tempForm.value.vehicleId = undefined
}

// 车辆接替：备用车辆按故障车辆线路过滤
const replaceBackupBuses = computed(() => {
  if (!replaceForm.value.vehicleId) return []
  const trip = runningTrips.value.find((t) => t.vehicleId === replaceForm.value.vehicleId)
  if (!trip) return []
  return readyBuses.value.filter((b) => b.id !== replaceForm.value.vehicleId && b.routeId === trip.routeId)
})
function onReplaceVehicleChange() {
  replaceForm.value.backupVehicleId = undefined
}

async function load() {
  const res: any = await request.get('/trip/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, routeId: searchRouteId.value, tripStatus: searchStatus.value },
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
async function loadPending() {
  const res: any = await request.get('/schedule/page', { params: { pageNum: 1, pageSize: 200, scheduleStatus: 0 } })
  pendingSchedules.value = res.data.records
}
async function loadReadyBuses() {
  const res: any = await request.get('/dispatch/ready-buses')
  readyBuses.value = res.data
}
async function loadRunningTrips() {
  const res: any = await request.get('/trip/running')
  runningTrips.value = res.data
}

async function refresh() {
  await Promise.all([loadRoutes(), loadBuses(), loadPending(), loadReadyBuses(), loadRunningTrips()])
}

async function showDetail(row: any) {
  const res: any = await request.get(`/trip/${row.id}`)
  detailData.value = res.data
  detailVisible.value = true
}

async function completeTrip(row: any) {
  await request.post(`/trip/complete/${row.id}`)
  ElMessage.success('车次已完成')
  load()
}

function openManual() { manualForm.value = { scheduleId: undefined, vehicleId: undefined }; manualVisible.value = true }
function openTemp() { tempForm.value = { routeId: undefined, direction: 1, vehicleId: undefined, remark: '' }; tempVisible.value = true }
function openOffline() { offlineForm.value = { vehicleId: undefined, reason: '' }; offlineVisible.value = true }
function openSuspend() { suspendForm.value = { routeId: undefined }; suspendVisible.value = true }
function openReplace() { replaceForm.value = { vehicleId: undefined, backupVehicleId: undefined, reason: '' }; replaceVisible.value = true }

async function submitManual() {
  if (!manualForm.value.scheduleId || !manualForm.value.vehicleId) return ElMessage.warning('请选择排班和车辆')
  await request.post('/dispatch/manual', manualForm.value)
  ElMessage.success('派车成功')
  manualVisible.value = false
  refresh()
  load()
}

async function submitTemp() {
  if (!tempForm.value.routeId || !tempForm.value.vehicleId) return ElMessage.warning('请选择线路和车辆')
  await request.post('/dispatch/temp', tempForm.value)
  ElMessage.success('临时加派成功')
  tempVisible.value = false
  refresh()
  load()
}

async function submitOffline() {
  if (!offlineForm.value.vehicleId) return ElMessage.warning('请选择车辆')
  await request.post('/dispatch/offline', offlineForm.value)
  ElMessage.success('车辆已下线')
  offlineVisible.value = false
  refresh()
  load()
}

async function submitSuspend() {
  if (!suspendForm.value.routeId) return ElMessage.warning('请选择线路')
  await request.post('/dispatch/suspend', suspendForm.value)
  ElMessage.success('线路已临时停运')
  suspendVisible.value = false
  refresh()
  load()
}

async function submitReplace() {
  if (!replaceForm.value.vehicleId || !replaceForm.value.backupVehicleId) return ElMessage.warning('请选择故障车辆和备用车辆')
  await request.post('/dispatch/replace', replaceForm.value)
  ElMessage.success('车辆接替成功')
  replaceVisible.value = false
  refresh()
  load()
}

onMounted(() => {
  load()
  refresh()
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
.dispatch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 15px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}
.dispatch-bar .bar-title {
  font-weight: 600;
  color: #303133;
  margin-right: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
}
</style>
