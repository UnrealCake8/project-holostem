const CLOUDINARY_API_BASE = 'https://api.cloudinary.com/v1_1'

function cloudinaryUrl(resourceType) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    throw new Error('Missing CLOUDINARY_CLOUD_NAME')
  }

  return `${CLOUDINARY_API_BASE}/${cloudName}/${resourceType}/upload`
}

export async function uploadMediaToCloudinary({ file, resourceType }) {
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
  if (!uploadPreset) {
    throw new Error('Missing CLOUDINARY_UPLOAD_PRESET')
  }

  const formData = new FormData()
  const blob = new Blob([file.buffer], { type: file.mimetype })
  formData.append('file', blob, file.originalname)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(cloudinaryUrl(resourceType), {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json()
  if (!response.ok) {
    const message = payload?.error?.message || 'Cloudinary upload failed'
    throw new Error(message)
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    thumbnailUrl: payload.eager?.[0]?.secure_url || payload.secure_url,
    duration: payload.duration,
  }
}
