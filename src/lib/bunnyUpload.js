import { apiRequest } from './apiClient'

export async function uploadVideoToBunny(file) {
  const formData = new FormData()
  formData.append('video', file)

  const { mediaUrl } = await apiRequest('/bunny/upload', {
    method: 'POST',
    body: formData,
    isFormData: true,
  })

  return mediaUrl
}
