<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="searchName" placeholder="搜索站点名称" clearable style="width: 200px" @clear="load" @keyup.enter="load" />
      <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px; margin-left: 10px" @change="load">
        <el-option label="运营中" :value="1" />
        <el-option label="停运" :value="2" />
        <el-option label="维护中" :value="3" />
        <el-option label="规划中" :value="4" />
      </el-select>
      <el-button type="primary" style="margin-left: 10px" @click="load">查询</el-button>
      <el-button type="success" v-if="isAdmin" @click="openDialog()">新增站点</el-button>
    </div>

    <el-table :data="tableData" border stripe style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="stationName" label="站点名称" />
      <el-table-column prop="area" label="所属区域" />
      <el-table-column prop="longitude" label="经度" width="110" />
      <el-table-column prop="latitude" label="纬度" width="110" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column v-if="isAdmin" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" style="margin-top: 15px; justify-content: flex-end" @size-change="load" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑站点' : '新增站点'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="站点名称" prop="stationName">
          <el-input v-model="form.stationName" />
        </el-form-item>
        <el-form-item label="所属区域">
          <el-input v-model="form.area" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model.number="form.longitude" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model.number="form.latitude" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model.number="form.status">
            <el-option label="运营中" :value="1" />
            <el-option label="停运" :value="2" />
            <el-option label="维护中" :value="3" />
            <el-option label="规划中" :value="4" />
          </el-select>
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
const searchStatus = ref<number | undefined>(undefined)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<any>({
  id: undefined,
  stationName: '',
  area: '',
  longitude: undefined,
  latitude: undefined,
  status: 1,
  remark: '',
})

const rules: FormRules = {
  stationName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
}

function statusText(s: number) {
  return { 1: '运营中', 2: '停运', 3: '维护中', 4: '规划中' }[s] || '未知'
}
function statusTag(s: number) {
  return { 1: 'success', 2: 'info', 3: 'warning', 4: '' }[s] || ''
}

async function load() {
  const res: any = await request.get('/station/page', {
    params: { pageNum: pageNum.value, pageSize: pageSize.value, stationName: searchName.value, status: searchStatus.value },
  })
  tableData.value = res.data.records
  total.value = res.data.total
}

function openDialog(row?: any) {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: undefined, stationName: '', area: '', longitude: undefined, latitude: undefined, status: 1, remark: '' })
  }
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (form.id) {
      await request.put('/station', form)
    } else {
      await request.post('/station', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  })
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除站点「${row.stationName}」？`, '提示', { type: 'warning' })
  await request.delete(`/station/${row.id}`)
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
