<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="stat-card stat-blue">
          <div class="stat-icon"><el-icon><Location /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.stationCount }}</div>
            <div class="stat-label">站点总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-green">
          <div class="stat-icon"><el-icon><Guide /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.routeCount }}</div>
            <div class="stat-label">线路总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-orange">
          <div class="stat-icon"><el-icon><Van /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.busCount }}</div>
            <div class="stat-label">公交车总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-red">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingAlarm }}</div>
            <div class="stat-label">待处理告警</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">车辆状态分布</div>
          <div ref="busChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">告警类型统计</div>
          <div ref="alarmChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 最近告警 -->
    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <div class="chart-card">
          <div class="chart-title">最近告警记录</div>
          <el-table :data="recentAlarms" border stripe size="default">
          <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="title" label="告警标题" />
            <el-table-column label="告警类型" width="130">
              <template #default="{ row }">{{ typeName(row.alarmTypeId) }}</template>
            </el-table-column>
            <el-table-column prop="reportTime" label="上报时间" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '已处理' : '已上报' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const stats = reactive({
  stationCount: 0,
  routeCount: 0,
  busCount: 0,
  pendingAlarm: 0,
})

const recentAlarms = ref<any[]>([])
const alarmTypes = ref<any[]>([])
const busChartRef = ref<HTMLElement>()
const alarmChartRef = ref<HTMLElement>()
let busChart: echarts.ECharts | null = null
let alarmChart: echarts.ECharts | null = null

function typeName(id: number) {
  return alarmTypes.value.find((t) => t.id === id)?.typeName || '未知'
}

async function loadStats() {
  const [stationRes, routeRes, busRes, alarmRes, typeRes]: any = await Promise.all([
    request.get('/station/page', { params: { pageNum: 1, pageSize: 1 } }),
    request.get('/route/page', { params: { pageNum: 1, pageSize: 1 } }),
    request.get('/bus/page', { params: { pageNum: 1, pageSize: 1 } }),
    request.get('/alarm/page', { params: { pageNum: 1, pageSize: 1, status: 0 } }),
    request.get('/alarm/types'),
  ])
  stats.stationCount = stationRes.data.total
  stats.routeCount = routeRes.data.total
  stats.busCount = busRes.data.total
  stats.pendingAlarm = alarmRes.data.total
  alarmTypes.value = typeRes.data
}

async function loadCharts() {
  // 车辆状态分布
  const busAll: any = await request.get('/bus/page', { params: { pageNum: 1, pageSize: 100 } })
  const busStatusMap: Record<string, number> = { 在线: 0, 离线: 0, 检修: 0, 运营中: 0 }
  const busStatusText: Record<number, string> = { 1: '在线', 2: '离线', 3: '检修', 4: '运营中' }
  busAll.data.records.forEach((b: any) => {
    const label = busStatusText[b.status] || '未知'
    busStatusMap[label] = (busStatusMap[label] || 0) + 1
  })
  const busData = Object.entries(busStatusMap).map(([name, value]) => ({ name, value }))

  if (busChartRef.value) {
    busChart = echarts.init(busChartRef.value)
    busChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: busData,
        color: ['#67C23A', '#909399', '#E6A23C', '#409EFF'],
      }],
    })
  }

  // 告警类型统计
  const alarmAll: any = await request.get('/alarm/page', { params: { pageNum: 1, pageSize: 100 } })
  const alarmTypeMap: Record<string, number> = {}
  alarmAll.data.records.forEach((a: any) => {
    const name = typeName(a.alarmTypeId)
    alarmTypeMap[name] = (alarmTypeMap[name] || 0) + 1
  })
  const categories = Object.keys(alarmTypeMap)
  const values = Object.values(alarmTypeMap)

  if (alarmChartRef.value) {
    alarmChart = echarts.init(alarmChartRef.value)
    alarmChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: 0 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: values,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' },
          ]),
        },
      }],
    })
  }
}

async function loadRecentAlarms() {
  const res: any = await request.get('/alarm/page', { params: { pageNum: 1, pageSize: 5 } })
  recentAlarms.value = res.data.records
}

function handleResize() {
  busChart?.resize()
  alarmChart?.resize()
}

onMounted(async () => {
  await loadStats()
  await loadCharts()
  await loadRecentAlarms()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  busChart?.dispose()
  alarmChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}
.stat-blue .stat-icon { background: linear-gradient(135deg, #409EFF, #66b1ff); }
.stat-green .stat-icon { background: linear-gradient(135deg, #67C23A, #85ce61); }
.stat-orange .stat-icon { background: linear-gradient(135deg, #E6A23C, #ebb563); }
.stat-red .stat-icon { background: linear-gradient(135deg, #F56C6C, #f78989); }
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.chart-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 4px solid #409EFF;
}
.chart-container {
  height: 300px;
  width: 100%;
}
</style>
