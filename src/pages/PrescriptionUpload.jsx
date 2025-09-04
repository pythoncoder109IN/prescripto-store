import React, { useState, useRef } from 'react'
import { Upload, Camera, FileText, CheckCircle, AlertCircle, X, Eye } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { createWorker } from 'tesseract.js'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function PrescriptionUpload() {
  const { addPrescription, isAuthenticated } = useApp()
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [prescriptionData, setPrescriptionData] = useState(null)
  const [step, setStep] = useState(1) // 1: Upload, 2: Review, 3: Confirm
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const processWithOCR = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one prescription image')
      return
    }

    if (!isAuthenticated) {
      toast.error('Please login to upload prescriptions')
      return
    }

    setIsProcessing(true)
    setExtractedText('')

    try {
      const worker = await createWorker('eng')
      let allText = ''

      for (const fileData of files) {
        const { data: { text } } = await worker.recognize(fileData.file)
        allText += text + '\n\n'
      }

      await worker.terminate()
      
      setExtractedText(allText)
      
      // Parse prescription data (simplified parsing)
      const parsedData = parsePrescriptionText(allText)
      setPrescriptionData(parsedData)
      
      setStep(2)
      toast.success('Prescription processed successfully!')
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Failed to process prescription. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const parsePrescriptionText = (text) => {
    // Simple parsing logic - in a real app, this would be more sophisticated
    const lines = text.split('\n').filter(line => line.trim())
    
    return {
      doctorName: extractField(lines, ['dr', 'doctor', 'physician']),
      patientName: extractField(lines, ['patient', 'name']),
      date: extractField(lines, ['date']),
      medications: extractMedications(lines),
      diagnosis: extractField(lines, ['diagnosis', 'condition']),
      instructions: extractField(lines, ['instructions', 'directions'])
    }
  }

  const extractField = (lines, keywords) => {
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          return line.replace(/^[^:]*:?\s*/, '').trim()
        }
      }
    }
    return 'Not detected'
  }

  const extractMedications = (lines) => {
    const medications = []
    const medicationKeywords = ['tablet', 'capsule', 'syrup', 'mg', 'ml', 'dose']
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (medicationKeywords.some(keyword => lowerLine.includes(keyword))) {
        medications.push(line.trim())
      }
    }
    
    return medications.length > 0 ? medications : ['No medications detected']
  }

  const confirmPrescription = () => {
    const prescription = {
      id: Date.now(),
      files: files.map(f => ({ name: f.name, size: f.size })),
      extractedText,
      parsedData: prescriptionData,
      uploadDate: new Date().toISOString(),
      status: 'pending_verification'
    }

    addPrescription(prescription)
    toast.success('Prescription uploaded successfully!')
    
    // Reset form
    setFiles([])
    setExtractedText('')
    setPrescriptionData(null)
    setStep(1)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Prescription</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload clear images of your prescription. Our AI will extract the information 
            and our licensed pharmacists will verify it before processing your order.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
          {step === 1 && (
            <div className="space-y-8">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="w-12 h-12 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload Prescription Images
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your prescription images here, or click to browse
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Choose Files</span>
                      </button>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </button>
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                  <div className="space-y-3">
                    {files.map((fileData) => (
                      <div key={fileData.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img
                            src={fileData.preview}
                            alt={fileData.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{fileData.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(fileData.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(fileData.preview, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFile(fileData.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Button */}
              <div className="flex justify-center">
                <button
                  onClick={processWithOCR}
                  disabled={files.length === 0 || isProcessing}
                  className="btn-primary flex items-center space-x-2 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Process Prescription</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tips for better results:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure the prescription is clearly visible and well-lit</li>
                  <li>• Avoid shadows and reflections</li>
                  <li>• Include all pages of the prescription</li>
                  <li>• Make sure the text is not blurry or cut off</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && prescriptionData && (
            <div className="space-y-8">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Prescription Processed
                </h3>
                <p className="text-gray-600">
                  Please review the extracted information and make corrections if needed
                </p>
              </div>

              {/* Extracted Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={prescriptionData.doctorName}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        doctorName: e.target.value
                      }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={prescriptionData.patientName}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        patientName: e.target.value
                      }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      value={prescriptionData.date}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        date: e.target.value
                      }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnosis
                    </label>
                    <input
                      type="text"
                      value={prescriptionData.diagnosis}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        diagnosis: e.target.value
                      }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={prescriptionData.instructions}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        instructions: e.target.value
                      }))}
                      rows={3}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medications
                </label>
                <div className="space-y-2">
                  {prescriptionData.medications.map((medication, index) => (
                    <input
                      key={index}
                      type="text"
                      value={medication}
                      onChange={(e) => {
                        const newMedications = [...prescriptionData.medications]
                        newMedications[index] = e.target.value
                        setPrescriptionData(prev => ({
                          ...prev,
                          medications: newMedications
                        }))
                      }}
                      className="input-field"
                    />
                  ))}
                </div>
              </div>

              {/* Raw Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extracted Text (Raw)
                </label>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={6}
                  className="input-field font-mono text-sm"
                  placeholder="Extracted text will appear here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back to Upload
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          )}

          {step === 3 && prescriptionData && (
            <div className="space-y-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirm Prescription Upload
                </h3>
                <p className="text-gray-600">
                  Please review all information before submitting
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Prescription Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Doctor:</span>
                    <span className="ml-2 text-gray-900">{prescriptionData.doctorName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Patient:</span>
                    <span className="ml-2 text-gray-900">{prescriptionData.patientName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-900">{prescriptionData.date}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Files:</span>
                    <span className="ml-2 text-gray-900">{files.length} image(s)</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="font-medium text-gray-700">Medications:</span>
                  <ul className="mt-1 space-y-1">
                    {prescriptionData.medications.map((medication, index) => (
                      <li key={index} className="text-gray-900 ml-4">• {medication}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-blue-800">
                    I confirm that this prescription is valid and issued by a licensed healthcare provider.
                    I understand that our pharmacists will verify this prescription before processing any orders.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                >
                  Back to Review
                </button>
                <button
                  onClick={confirmPrescription}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit Prescription</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}