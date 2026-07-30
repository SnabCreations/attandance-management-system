'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { updateAvatarUrl } from './actions'
import styles from './avatar.module.css'

export default function AvatarUpload({ 
  userId, 
  initialAvatarUrl 
}: { 
  userId: string, 
  initialAvatarUrl: string | null 
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Compress the image using Canvas API
      const compressedImage = await compressImage(file, 150, 150, 0.6)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}_${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedImage)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl
      setAvatarUrl(publicUrl)
      
      // Update the user profile via Server Action
      await updateAvatarUrl(publicUrl)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading avatar!')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={styles.avatarContainer}>
      <div 
        className={styles.avatarWrapper}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        title="Click to update profile image"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        )}
        
        {isUploading && (
          <div className={styles.avatarOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
        
        {!isUploading && (
          <div className={styles.avatarHover}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  )
}

function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width))
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height))
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas to Blob failed'))
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}
