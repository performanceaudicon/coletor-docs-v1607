import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebaseConfig'

export const uploadFile = async (file: File, path: string): Promise<{ path: string; url: string }> => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    
    return {
      path: snapshot.ref.fullPath,
      url
    }
  } catch (error: any) {
    console.error('Error uploading file:', error)
    throw new Error('Erro ao fazer upload do arquivo: ' + error.message)
  }
}

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error: any) {
    console.error('Error deleting file:', error)
    throw new Error('Erro ao deletar arquivo: ' + error.message)
  }
}

export const getFileUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path)
    return await getDownloadURL(storageRef)
  } catch (error: any) {
    console.error('Error getting file URL:', error)
    throw new Error('Erro ao obter URL do arquivo: ' + error.message)
  }
}

export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(link.href)
  } catch (error: any) {
    console.error('Error downloading file:', error)
    throw new Error('Erro ao fazer download do arquivo: ' + error.message)
  }
}