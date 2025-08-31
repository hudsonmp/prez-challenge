'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

// Define the calendar value type manually
type CalendarValue = Date | Date[] | null

// Types for our lesson plan data
interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface LessonPlan {
  title: string
  date: string
  duration: string
  notes: string[]
  reviewQuestions: string[]
  miniQuiz: QuizQuestion[]
  standards: string[]
  chapter: string
}

interface GeneratedLessonPlan {
  [date: string]: LessonPlan
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<string>('7')
  const [teacherPrompt, setTeacherPrompt] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lessonPlans, setLessonPlans] = useState<GeneratedLessonPlan>({})
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showResults, setShowResults] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loadingStep, setLoadingStep] = useState<string>('')

  // Handle file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  // Submit form to generate lesson plans
  const handleSubmit = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first.')
      return
    }

    setIsLoading(true)
    setError('')
    setLoadingStep('Uploading PDF and starting analysis...')
    
    try {
      const formData = new FormData()
      formData.append('pdf', uploadedFile)
      formData.append('duration', duration)
      formData.append('teacherPrompt', teacherPrompt)

      console.log('📤 Sending request to generate lesson plan...')
      setLoadingStep('Extracting key pages from PDF...')

      const response = await fetch('/api/generate-lesson-plan', {
        method: 'POST',
        body: formData,
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      setLoadingStep('Processing AI response...')
      const data = await response.json()
      
      console.log('✅ Received lesson plan data:', data)

      if (!data.lessonPlans || Object.keys(data.lessonPlans).length === 0) {
        throw new Error('No lesson plans were generated. Please try again.')
      }

      setLessonPlans(data.lessonPlans)
      setShowResults(true)
      setLoadingStep('')
      
    } catch (error) {
      console.error('❌ Error generating lesson plan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to generate lesson plan: ${errorMessage}`)
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }

  // Get lesson plan for selected date
  const getSelectedLessonPlan = (): LessonPlan | null => {
    if (!selectedDate) return null
    const dateStr = selectedDate.toISOString().split('T')[0]
    return lessonPlans[dateStr] || null
  }

  // Check if a date has a lesson plan
  const hasLessonPlan = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return !!lessonPlans[dateStr]
  }

  // Custom tile content for calendar
  const tileClassName = ({ date }: { date: Date }) => {
    return hasLessonPlan(date) ? 'has-lesson-plan' : ''
  }

  return (
    <div className="space-y-8">
      {!showResults ? (
        // Upload and configuration form
        <div className="max-w-2xl mx-auto space-y-6">
          {/* PDF Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Textbook PDF</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : uploadedFile 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div>
                  <div className="text-green-600 text-lg font-medium">
                    ✓ {uploadedFile.name}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    File uploaded successfully. Click to change.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF here, or click to select'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload your textbook PDF to generate lesson plans
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Lesson Plan Duration</h2>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

          {/* Teacher Prompt */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Additional Instructions</h2>
            <textarea
              value={teacherPrompt}
              onChange={(e) => setTeacherPrompt(e.target.value)}
              placeholder="Add any specific requirements, learning objectives, or customizations for your lesson plans..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!uploadedFile || isLoading}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                !uploadedFile || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Lesson Plans...
                </div>
              ) : (
                'Generate Lesson Plans'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-red-600 text-xl mr-3">⚠️</div>
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="text-sm text-red-600 underline mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Display */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <p className="font-medium text-blue-800">Processing your textbook...</p>
                  <p className="text-sm text-blue-600">
                    {loadingStep || 'This may take a few minutes while AI analyzes the content.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Results view with calendar and lesson plans
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Lesson Plan Calendar</h2>
              <button
                onClick={() => setShowResults(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Upload
              </button>
            </div>
            <Calendar
              onChange={(value: any) => {
                if (value instanceof Date) {
                  setSelectedDate(value)
                } else if (Array.isArray(value) && value[0] instanceof Date) {
                  setSelectedDate(value[0])
                } else {
                  setSelectedDate(null)
                }
              }}
              value={selectedDate}
              tileClassName={tileClassName}
              className="w-full"
            />
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                Days with lesson plans
              </div>
            </div>
          </div>

          {/* Lesson Plan Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedDate && getSelectedLessonPlan() ? (
              <LessonPlanDisplay lessonPlan={getSelectedLessonPlan()!} />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-lg font-medium">Select a date with a lesson plan</p>
                <p className="text-sm mt-2">Click on a green date in the calendar to view the lesson plan</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Component to display individual lesson plans
function LessonPlanDisplay({ lessonPlan }: { lessonPlan: LessonPlan }) {
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({})
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false)

  const handleQuizSubmit = () => {
    setShowQuizResults(true)
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    setShowQuizResults(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{lessonPlan.title}</h2>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
          <span>📅 {lessonPlan.date}</span>
          <span>⏱️ {lessonPlan.duration}</span>
          <span>📖 {lessonPlan.chapter}</span>
        </div>
      </div>

      {/* Student Notes */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">📝 Student Notes</h3>
        <ul className="space-y-2">
          {lessonPlan.notes.map((note, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* Review Questions */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">❓ Review Questions</h3>
        <div className="space-y-3">
          {lessonPlan.reviewQuestions.map((question, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-700">{index + 1}. {question}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Quiz */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">🎯 Mini Quiz</h3>
        {!showQuizResults ? (
          <div className="space-y-4">
            {lessonPlan.miniQuiz.map((question, questionIndex) => (
              <div key={questionIndex} className="bg-blue-50 p-4 rounded">
                <p className="font-medium text-gray-900 mb-3">
                  {questionIndex + 1}. {question.question}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={optionIndex}
                        onChange={() => setQuizAnswers(prev => ({
                          ...prev,
                          [questionIndex]: optionIndex
                        }))}
                        className="mr-3"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleQuizSubmit}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Submit Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {lessonPlan.miniQuiz.map((question, questionIndex) => {
              const userAnswer = quizAnswers[questionIndex]
              const isCorrect = userAnswer === question.correctAnswer
              return (
                <div key={questionIndex} className={`p-4 rounded ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="font-medium text-gray-900 mb-2">
                    {questionIndex + 1}. {question.question}
                  </p>
                  <p className={`text-sm font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Correct answer: {question.options[question.correctAnswer]}
                  </p>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {question.explanation}
                    </p>
                  )}
                </div>
              )
            })}
            <button
              onClick={resetQuiz}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Retake Quiz
            </button>
          </div>
        )}
      </div>

      {/* Standards */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">📋 Standards</h3>
        <div className="flex flex-wrap gap-2">
          {lessonPlan.standards.map((standard, index) => (
            <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
              {standard}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
