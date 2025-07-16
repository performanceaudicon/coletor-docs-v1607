import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, Upload, AlertCircle } from 'lucide-react'
import { DocumentCategory as DocCategory, DocumentItem } from '../../lib/documents'
import FileUpload from '../ui/FileUpload'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface DocumentCategoryProps {
  category: DocCategory
  uploadedDocuments: any[]
  onFileUpload: (categoryId: string, documentId: string, file: File) => void
  onFileRemove: (categoryId: string, documentId: string) => void
  loading?: boolean
}

const DocumentCategory: React.FC<DocumentCategoryProps> = ({
  category,
  uploadedDocuments,
  onFileUpload,
  onFileRemove,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const getDocumentStatus = (documentId: string) => {
    return uploadedDocuments.find(doc => 
      doc.category === category.id && doc.name === documentId
    )
  }

  const getDocumentProgress = () => {
    const requiredDocs = category.documents.filter(doc => doc.required)
    const uploadedCount = requiredDocs.filter(doc => getDocumentStatus(doc.id)).length
    return { uploaded: uploadedCount, total: requiredDocs.length }
  }

  const progress = getDocumentProgress()
  const progressPercentage = progress.total > 0 ? (progress.uploaded / progress.total) * 100 : 0

  return (
    <Card className="mb-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {progress.uploaded}/{progress.total} documentos
            </span>
            {progressPercentage === 100 && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100 ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {category.documents.map((document) => {
            const uploadedDoc = getDocumentStatus(document.id)
            const isUploaded = Boolean(uploadedDoc)

            return (
              <div key={document.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{document.name}</h4>
                      {document.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Obrigatório
                        </span>
                      )}
                      {document.is_extra && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          Extra
                        </span>
                      )}
                    </div>
                    {document.description && (
                      <p className="text-sm text-gray-600 mb-3">{document.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : document.required ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <FileUpload
                  onFileSelect={(file) => onFileUpload(category.id, document.id, file)}
                  onFileRemove={isUploaded ? () => onFileRemove(category.id, document.id) : undefined}
                  currentFile={isUploaded ? uploadedDoc.file_url?.split('/').pop() : undefined}
                  label=""
                  required={document.required}
                />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default DocumentCategory