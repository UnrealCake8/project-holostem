const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function ensureCloudinaryConfig() {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloud upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }
}

async function uploadToCloudinary({ file, resourceType }) {
  ensureCloudinaryConfig()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed')
  }

  return payload
}

export async function uploadVideoFile(file) {
  const payload = await uploadToCloudinary({ file, resourceType: 'video' })

  return {
    videoUrl: payload.secure_url,
    thumbnailUrl: payload.secure_url,
  }
}

export async function uploadImageFile(file) {
  const payload = await uploadToCloudinary({ file, resourceType: 'image' })
  return payload.secure_url
}
