import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res
    }
    ElMessage.error(res.msg || '请求失败')
    return Promise.reject(new Error(res.msg || 'Error'))
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else {
      ElMessage.error(error.response?.data?.msg || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default service
