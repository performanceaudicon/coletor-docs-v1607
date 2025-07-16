// Mock file upload - in real implementation this would upload to cloud storage
export const uploadFile = async (file: File, path: string) => {
  // Simulate file upload delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Create a mock URL for the file
  const mockUrl = `https://mock-storage.com/${path}/${file.name}`
  
  return {
    path: `${path}/${file.name}`,
    url: mockUrl
  }
}

export const deleteFile = async (path: string) => {
  // Mock file deletion
  console.log('Mock: Deleting file at path:', path)
}

export const getFileUrl = (path: string) => {
  return `https://mock-storage.com/${path}`
}