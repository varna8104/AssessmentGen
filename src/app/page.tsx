"use client"

import { useState, useEffect } from "react"

// Types for structured assessment data
interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: string;
  maxWords?: number;
  media?: {
    type?: 'image' | 'audio' | 'video';
    url?: string;
  };
}

interface Assessment {
  title: string;
  description: string;
  questions: Question[];
  totalPoints: number;
  estimatedTime: number;
}

export default function Page() {
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [showAIMode, setShowAIMode] = useState(false)
  const [showManualMode, setShowManualMode] = useState(false)
  const [showViewMode, setShowViewMode] = useState(false)
  const [viewModeData, setViewModeData] = useState<any>(null)
  const [isLoadingViewMode, setIsLoadingViewMode] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [showCompletedStudents, setShowCompletedStudents] = useState<string | null>(null)
  const [showTopicSelection, setShowTopicSelection] = useState(false)
  const [showAITopicSelection, setShowAITopicSelection] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTeacherLogin, setShowTeacherLogin] = useState(false)
  const [showStudentLogin, setShowStudentLogin] = useState(false)
  const [showStudentAssessment, setShowStudentAssessment] = useState(false)
  const [teacherCode, setTeacherCode] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [studentName, setStudentName] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [difficultyValue, setDifficultyValue] = useState(0)
  const [easyToHard, setEasyToHard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzingPDF, setIsAnalyzingPDF] = useState(false)
  const [uploadedPDF, setUploadedPDF] = useState<File | null>(null)
  const [pdfAnalysisMetadata, setPdfAnalysisMetadata] = useState<any>(null)
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [customTopic, setCustomTopic] = useState('')
  const [aiExtractedTopics, setAiExtractedTopics] = useState<string[]>([])
  const [aiSelectedTopics, setAiSelectedTopics] = useState<string[]>([])
  const [aiCustomTopic, setAiCustomTopic] = useState('')
  const [assessmentPrompt, setAssessmentPrompt] = useState('')
  const [detectedMainTopic, setDetectedMainTopic] = useState('')
  const [generatedAssessment, setGeneratedAssessment] = useState<Assessment | null>(null)
  const [assessmentMetadata, setAssessmentMetadata] = useState<any>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [addQuestionMode, setAddQuestionMode] = useState<'manual' | 'ai' | null>(null)
  const [aiQuestionCount, setAiQuestionCount] = useState('')
  const [isAddingQuestions, setIsAddingQuestions] = useState(false)
  const [showSaveOptions, setShowSaveOptions] = useState(false)
  const [assessmentCode, setAssessmentCode] = useState('')
  const [assessmentLink, setAssessmentLink] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [publishedAssessmentCode, setPublishedAssessmentCode] = useState('')
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
    timeLimit: 60,
    difficulty: 'Easy'
  })
  // Form data state
  const [formData, setFormData] = useState({
    assessmentName: '',
    assessmentType: '',
    language: '',
    numberOfQuestions: ''
  })
  // Manual mode form data
  const [manualFormData, setManualFormData] = useState({
    assessmentName: '',
    assessmentType: '',
    language: '',
    numberOfQuestions: '',
    textbookName: '',
    subject: ''
  })

  // Force clear all form fields and codes on every page load
  useEffect(() => {
    setTeacherCode('');
    setStudentCode('');
    setStudentName('');
    setFormData({ assessmentName: '', assessmentType: '', language: '', numberOfQuestions: '' });
    setManualFormData({ assessmentName: '', assessmentType: '', language: '', numberOfQuestions: '', textbookName: '', subject: '' });
    setAssessmentPrompt('');
    setDetectedMainTopic('');
    setDifficultyValue(0);
    setEasyToHard(false);
    setUploadedPDF(null);
    setPdfAnalysisMetadata(null);
    setExtractedTopics([]);
    setSelectedTopics([]);
    setCustomTopic('');
    setAiExtractedTopics([]);
    setAiSelectedTopics([]);
    setAiCustomTopic('');
    setGeneratedAssessment(null);
    setAssessmentMetadata(null);
    setSelectedQuestionId(null);
    setDraggedItem(null);
    setShowAddQuestion(false);
    setAddQuestionMode(null);
    setAiQuestionCount('');
    setIsAddingQuestions(false);
    setShowSaveOptions(false);
    setAssessmentCode('');
    setAssessmentLink('');
    setIsPublished(false);
    setPublishedAssessmentCode('');
    setNewQuestion({ question: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 1, timeLimit: 60, difficulty: 'Easy' });
  }, []);

  const handleCreateAssessment = () => {
    setShowTeacherLogin(true)
  }

  // Teacher Authentication
  const handleTeacherLogin = async () => {
    if (teacherCode !== '1937') {
      alert('Invalid teacher code. Please try again.')
      return
    }
    
    setShowTeacherLogin(false)
    setShowModeSelection(true)
  }

  // Student Authentication
  const handleStudentLogin = async () => {
    if (!studentCode.trim() || !studentName.trim()) {
      alert('Please enter both assessment code and your name.')
      return
    }

    setIsAuthenticating(true)
    
    try {
      const response = await fetch('/api/student/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentCode: studentCode.trim(),
          studentName: studentName.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Redirect to the student assessment page with name parameter
        window.location.href = `/student/${studentCode.trim().toUpperCase()}?name=${encodeURIComponent(studentName.trim())}`
      } else {
        // Handle specific error cases
        if (data.alreadyCompleted) {
          alert(`You have already completed this assessment!\n\nYour previous score: ${data.studentData.score || 'N/A'}\nCompleted: ${new Date(data.studentData.completedAt).toLocaleString()}\n\nYou can only take each assessment once.`)
        } else if (data.inProgress) {
          const shouldContinue = confirm(`You have an assessment in progress.\n\nStarted: ${new Date(data.studentData.startedAt).toLocaleString()}\n\nWould you like to continue where you left off?`)
          if (shouldContinue) {
            window.location.href = `/student/${studentCode.trim().toUpperCase()}?name=${encodeURIComponent(studentName.trim())}`
          }
        } else {
          alert(`Error: ${data.message || 'Assessment not found'}`)
        }
      }
      
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to join assessment'}`)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleGoBack = () => {
    if (showPreview) {
      setShowPreview(false)
    } else if (showTopicSelection) {
      setShowTopicSelection(false)
      setShowManualMode(true)
    } else if (showAITopicSelection) {
      setShowAITopicSelection(false)
      setShowAIMode(true)
    } else if (showViewMode) {
      setShowViewMode(false)
      // Clear auto-refresh interval
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        setAutoRefreshInterval(null)
      }
      setViewModeData(null)
    } else if (showAIMode) {
      setShowAIMode(false)
    } else if (showManualMode) {
      setShowManualMode(false)
    } else {
      setShowModeSelection(false)
    }
  }

  const handleAIModeSelect = () => {
    setShowAIMode(true)
  }

  const handleManualModeSelect = () => {
    setShowManualMode(true)
  }

  const handleViewModeSelect = () => {
    setShowViewMode(true)
    fetchViewModeData()
    
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchViewModeData()
    }, 5000)
    setAutoRefreshInterval(interval)
  }
  
  // Fetch real assessment data for View Mode
  const fetchViewModeData = async () => {
    setIsLoadingViewMode(true)
    try {
      const response = await fetch('/api/assessments/monitor')
      const data = await response.json()
      
      if (data.success) {
        setViewModeData(data.data)
      } else {
        console.error('Failed to fetch view mode data:', data.error)
      }
    } catch (error) {
      console.error('Error fetching view mode data:', error)
    } finally {
      setIsLoadingViewMode(false)
    }
  }
  
  // End an assessment
  const handleEndAssessment = async (assessmentCode: string) => {
    try {
      const response = await fetch('/api/assessments/monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'endAssessment',
          assessmentCode
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Assessment ended successfully!')
        fetchViewModeData() // Refresh data
      } else {
        alert('Failed to end assessment: ' + data.error)
      }
    } catch (error) {
      console.error('Error ending assessment:', error)
      alert('Failed to end assessment')
    }
  }
  
  // End all assessments
  const handleEndAllAssessments = async () => {
    if (!confirm('Are you sure you want to end ALL active assessments? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch('/api/assessments/monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'endAllAssessments'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('All assessments ended successfully!')
        fetchViewModeData() // Refresh data
      } else {
        alert('Failed to end assessments: ' + data.error)
      }
    } catch (error) {
      console.error('Error ending all assessments:', error)
      alert('Failed to end assessments')
    }
  }

  // Clean up auto-refresh when component unmounts or leaves View Mode
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        setAutoRefreshInterval(null)
      }
    }
  }, [autoRefreshInterval])

  // Handle PDF upload and analysis
  const handlePDFUpload = (file: File) => {
    setUploadedPDF(file)
  }

  const analyzePDFAndExtractTopics = async () => {
    if (!uploadedPDF) return

    setIsAnalyzingPDF(true)
    
    try {
      // Convert PDF to text for analysis
      const formData = new FormData()
      formData.append('pdf', uploadedPDF)
      formData.append('subject', manualFormData.subject)
      formData.append('textbookName', manualFormData.textbookName)
      formData.append('assessmentType', manualFormData.assessmentType)
      formData.append('language', manualFormData.language)

      // Send PDF to backend for analysis
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setExtractedTopics(data.topics)
        setPdfAnalysisMetadata(data.metadata)
        setShowManualMode(false)
        setShowTopicSelection(true)
      } else {
        // Fallback to intelligent topic generation based on form data
        console.warn('PDF analysis failed, using fallback topic generation')
        const fallbackTopics = await generateFallbackTopics()
        setExtractedTopics(fallbackTopics)
        setPdfAnalysisMetadata({
          fileName: uploadedPDF.name,
          fileSize: uploadedPDF.size,
          subject: manualFormData.subject,
          textbookName: manualFormData.textbookName,
          method: 'Fallback Generation',
          topicCount: fallbackTopics.length
        })
        setShowManualMode(false)
        setShowTopicSelection(true)
      }
    } catch (error) {
      console.error('Error analyzing PDF:', error)
      
      // Fallback to intelligent topic generation
      try {
        const fallbackTopics = await generateFallbackTopics()
        setExtractedTopics(fallbackTopics)
        setPdfAnalysisMetadata({
          fileName: uploadedPDF.name,
          fileSize: uploadedPDF.size,
          subject: manualFormData.subject,
          textbookName: manualFormData.textbookName,
          method: 'Emergency Fallback',
          topicCount: fallbackTopics.length,
          error: 'PDF analysis failed'
        })
        setShowManualMode(false)
        setShowTopicSelection(true)
      } catch (fallbackError) {
        console.error('Fallback topic generation failed:', fallbackError)
        alert('Failed to analyze PDF and generate topics. Please try again.')
      }
    } finally {
      setIsAnalyzingPDF(false)
    }
  }

  // Generate AI Mode topics based on form data
  const generateAITopics = async () => {
    if (!assessmentPrompt.trim()) {
      alert('Please provide a description of your assessment to generate relevant topics.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentName: formData.assessmentName,
          assessmentPrompt: assessmentPrompt,
          assessmentType: formData.assessmentType,
          language: formData.language,
          isAIMode: true
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAiExtractedTopics(data.topics)
        if (data.mainTopic) {
          setDetectedMainTopic(data.mainTopic)
        }
        setShowAIMode(false)
        setShowAITopicSelection(true)
      } else {
        // Fallback topics based on assessment name and type
        const fallbackTopics = generateFallbackAITopics()
        setAiExtractedTopics(fallbackTopics)
        setDetectedMainTopic(formData.assessmentName) // Use assessment name as fallback
        setShowAIMode(false)
        setShowAITopicSelection(true)
      }
    } catch (error) {
      console.error('Error generating AI topics:', error)
      // Use fallback topics
      const fallbackTopics = generateFallbackAITopics()
      setAiExtractedTopics(fallbackTopics)
      setDetectedMainTopic(formData.assessmentName) // Use assessment name as fallback
      setShowAIMode(false)
      setShowAITopicSelection(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate fallback topics for AI Mode
  const generateFallbackAITopics = () => {
    const assessmentName = formData.assessmentName.toLowerCase()
    const assessmentType = formData.assessmentType
    
    if (assessmentName.includes('math') || assessmentName.includes('algebra') || assessmentName.includes('calculus')) {
      return [
        'Basic Mathematical Operations',
        'Algebraic Expressions',
        'Linear Equations',
        'Quadratic Functions',
        'Polynomial Operations',
        'Trigonometric Functions',
        'Logarithms and Exponentials',
        'Systems of Equations',
        'Geometry and Shapes',
        'Probability and Statistics',
        'Derivatives and Limits',
        'Integration Techniques',
        'Mathematical Proofs',
        'Set Theory',
        'Number Theory'
      ]
    } else if (assessmentName.includes('science') || assessmentName.includes('physics') || assessmentName.includes('chemistry')) {
      return [
        'Scientific Method',
        'Atomic Structure',
        'Chemical Bonds',
        'States of Matter',
        'Energy and Work',
        'Forces and Motion',
        'Waves and Vibrations',
        'Electricity and Magnetism',
        'Thermodynamics',
        'Organic Chemistry',
        'Nuclear Physics',
        'Environmental Science',
        'Laboratory Safety',
        'Data Analysis',
        'Scientific Measurement'
      ]
    } else if (assessmentName.includes('english') || assessmentName.includes('literature') || assessmentName.includes('language')) {
      return [
        'Grammar and Syntax',
        'Vocabulary Development',
        'Reading Comprehension',
        'Essay Writing',
        'Literary Analysis',
        'Poetry Interpretation',
        'Character Development',
        'Plot Structure',
        'Rhetorical Devices',
        'Research Skills',
        'Citation Methods',
        'Public Speaking',
        'Creative Writing',
        'Media Literacy',
        'Critical Thinking'
      ]
    } else if (assessmentName.includes('history') || assessmentName.includes('social')) {
      return [
        'Ancient Civilizations',
        'Medieval Period',
        'Renaissance Era',
        'Industrial Revolution',
        'World Wars',
        'Political Systems',
        'Economic Principles',
        'Cultural Movements',
        'Geographic Regions',
        'Historical Documents',
        'Cause and Effect',
        'Timeline Analysis',
        'Primary Sources',
        'Historical Interpretation',
        'Contemporary Issues'
      ]
    } else if (assessmentName.includes('computer') || assessmentName.includes('programming') || assessmentName.includes('coding')) {
      return [
        'Programming Fundamentals',
        'Data Types and Variables',
        'Control Structures',
        'Functions and Methods',
        'Object-Oriented Programming',
        'Data Structures',
        'Algorithm Design',
        'Software Testing',
        'Database Concepts',
        'Web Development',
        'Version Control',
        'Software Engineering',
        'Network Programming',
        'Security Principles',
        'Project Management'
      ]
    } else {
      return [
        `${formData.assessmentName} Fundamentals`,
        `Basic ${formData.assessmentName} Concepts`,
        `${formData.assessmentName} Theory`,
        `Applied ${formData.assessmentName}`,
        `${formData.assessmentName} Methodology`,
        `${formData.assessmentName} Analysis`,
        `Advanced ${formData.assessmentName} Topics`,
        `${formData.assessmentName} Case Studies`,
        `${formData.assessmentName} Research Methods`,
        `${formData.assessmentName} Problem Solving`,
        `${formData.assessmentName} Applications`,
        `${formData.assessmentName} Principles`,
        `Contemporary ${formData.assessmentName}`,
        `${formData.assessmentName} Best Practices`,
        `Future of ${formData.assessmentName}`
      ]
    }
  }

  // Toggle AI topic selection
  const toggleAITopicSelection = (topic: string) => {
    setAiSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }
  const generateFallbackTopics = async () => {
    const response = await fetch('/api/generate-topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: manualFormData.subject,
        textbookName: manualFormData.textbookName,
        assessmentType: manualFormData.assessmentType,
        language: manualFormData.language
      }),
    })

    const data = await response.json()
    return data.success ? data.topics : [
      `${manualFormData.subject} Fundamentals`,
      `Basic ${manualFormData.subject} Concepts`,
      `Intermediate ${manualFormData.subject} Topics`,
      `Advanced ${manualFormData.subject} Applications`,
      `${manualFormData.subject} Problem Solving`
    ]
  }

  // Handle manual form submission
  const handleManualFormSubmit = async () => {
    if (!uploadedPDF) {
      alert('Please upload a PDF document first.')
      return
    }
    
    await analyzePDFAndExtractTopics()
  }

  // Handle AI topic selection and generate assessment
  const handleAITopicSelectionSubmit = async () => {
    if (aiSelectedTopics.length === 0 && !aiCustomTopic.trim()) {
      alert('Please select at least one topic or enter a custom topic.')
      return
    }

    setIsLoading(true)
    
    try {
      const allTopics = [...aiSelectedTopics]
      if (aiCustomTopic.trim()) {
        allTopics.push(aiCustomTopic.trim())
      }

      const response = await fetch('/api/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentName: formData.assessmentName,
          assessmentType: formData.assessmentType,
          language: formData.language,
          easyToHard: easyToHard,
          difficulty: getDifficultyLevel(difficultyValue),
          numberOfQuestions: formData.numberOfQuestions,
          selectedTopics: allTopics,
          isAIMode: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedAssessment(data.assessment)
        setAssessmentMetadata({
          ...data.metadata,
          selectedTopics: allTopics,
          mode: 'AI'
        })
        setShowAITopicSelection(false)
        setShowPreview(true)
      } else {
        alert('Error generating assessment: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle topic selection and generate assessment
  const handleTopicSelectionSubmit = async () => {
    if (selectedTopics.length === 0 && !customTopic.trim()) {
      alert('Please select at least one topic or enter a custom topic.')
      return
    }

    setIsLoading(true)
    
    try {
      const allTopics = [...selectedTopics]
      if (customTopic.trim()) {
        allTopics.push(customTopic.trim())
      }

      const response = await fetch('/api/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentName: manualFormData.assessmentName,
          assessmentType: manualFormData.assessmentType,
          language: manualFormData.language,
          easyToHard: easyToHard,
          difficulty: getDifficultyLevel(difficultyValue),
          numberOfQuestions: manualFormData.numberOfQuestions,
          selectedTopics: allTopics,
          textbookName: manualFormData.textbookName,
          subject: manualFormData.subject,
          isManualMode: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedAssessment(data.assessment)
        setAssessmentMetadata({
          ...data.metadata,
          selectedTopics: allTopics,
          textbookName: manualFormData.textbookName,
          subject: manualFormData.subject,
          mode: 'Manual'
        })
        setShowTopicSelection(false)
        setShowPreview(true)
      } else {
        alert('Error generating assessment: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle topic selection
  const toggleTopicSelection = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  const handleFormSubmit = async () => {
    // First generate topics, then show topic selection
    await generateAITopics()
  }

  // Skip topic selection and generate assessment directly
  const handleSkipTopicSelection = async () => {
    if (!assessmentPrompt.trim()) {
      alert('Please provide a description of your assessment.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentName: formData.assessmentName,
          assessmentPrompt: assessmentPrompt,
          assessmentType: formData.assessmentType,
          language: formData.language,
          easyToHard: easyToHard,
          difficulty: getDifficultyLevel(difficultyValue),
          numberOfQuestions: formData.numberOfQuestions,
          isAIMode: true,
          skipTopicSelection: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedAssessment(data.assessment)
        setAssessmentMetadata({
          ...data.metadata,
          mode: 'AI',
          skippedTopicSelection: true
        })
        setShowAIMode(false)
        setShowPreview(true)
      } else {
        alert('Error generating assessment: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Question editing functions
  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!generatedAssessment) return
    
    const updatedQuestions = generatedAssessment.questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    )
    
    setGeneratedAssessment({
      ...generatedAssessment,
      questions: updatedQuestions
    })
  }

  const addMedia = (questionId: string, mediaType: 'image' | 'audio' | 'video') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = mediaType === 'image' ? 'image/*' : mediaType === 'audio' ? 'audio/*' : 'video/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Convert file to base64 data URL for persistent storage
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          updateQuestion(questionId, {
            media: { type: mediaType, url: dataUrl }
          })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    if (!generatedAssessment) return
    
    const questions = [...generatedAssessment.questions]
    const [movedQuestion] = questions.splice(fromIndex, 1)
    questions.splice(toIndex, 0, movedQuestion)
    
    setGeneratedAssessment({
      ...generatedAssessment,
      questions
    })
  }

  // Add new question manually
  const addQuestionManually = () => {
    if (!generatedAssessment) return
    
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const completeQuestion: Question = {
      id: questionId,
      question: newQuestion.question || 'New Question',
      type: newQuestion.type || 'mcq',
      options: newQuestion.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: newQuestion.correctAnswer || newQuestion.options?.[0] || 'Option A',
      explanation: newQuestion.explanation || '',
      points: newQuestion.points || 1,
      timeLimit: newQuestion.timeLimit || 60,
      difficulty: newQuestion.difficulty || 'Easy',
      media: newQuestion.media
    }
    
    const updatedQuestions = [...generatedAssessment.questions, completeQuestion]
    setGeneratedAssessment({
      ...generatedAssessment,
      questions: updatedQuestions,
      totalPoints: generatedAssessment.totalPoints + completeQuestion.points
    })
    
    // Reset form
    setNewQuestion({
      question: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
      timeLimit: 60,
      difficulty: 'Easy'
    })
    setShowAddQuestion(false)
    setAddQuestionMode(null)
  }

  // Add questions using AI
  const addQuestionsWithAI = async () => {
    if (!generatedAssessment || !assessmentMetadata || !aiQuestionCount) return
    
    setIsAddingQuestions(true)
    
    try {
      const response = await fetch('/api/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentName: assessmentMetadata.assessmentName,
          assessmentType: assessmentMetadata.assessmentType,
          language: assessmentMetadata.language,
          easyToHard: false,
          difficulty: assessmentMetadata.difficulty,
          numberOfQuestions: aiQuestionCount,
          isAdditionalQuestions: true,
          existingQuestions: generatedAssessment.questions.length
        }),
      })

      const data = await response.json()

      if (data.success && data.assessment?.questions) {
        const newQuestions = data.assessment.questions.map((q: any) => ({
          ...q,
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
        
        const updatedQuestions = [...generatedAssessment.questions, ...newQuestions]
        const additionalPoints = newQuestions.reduce((sum: number, q: Question) => sum + q.points, 0)
        
        setGeneratedAssessment({
          ...generatedAssessment,
          questions: updatedQuestions,
          totalPoints: generatedAssessment.totalPoints + additionalPoints
        })
        
        setAiQuestionCount('')
        setShowAddQuestion(false)
        setAddQuestionMode(null)
      } else {
        alert('Error generating additional questions: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate additional questions. Please try again.')
    } finally {
      setIsAddingQuestions(false)
    }
  }

  // Generate unique assessment code and link
  const generateAssessmentCode = () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase()
    const link = `https://assessmentgen.com/take/${code}`
    setAssessmentCode(code)
    setAssessmentLink(link)
    return { code, link }
  }

  // Publish Assessment (Kahoot-style)
  const publishAssessment = async () => {
    if (!generatedAssessment || !assessmentMetadata) return
    
    try {
      const publishCode = Math.random().toString(36).substr(2, 6).toUpperCase()
      
      const response = await fetch('/api/assessments/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment: generatedAssessment,
          metadata: assessmentMetadata,
          code: publishCode
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPublishedAssessmentCode(publishCode)
        setIsPublished(true)
        
        alert(`🎉 Assessment Published Successfully!\n\nShare this code with your students: ${publishCode}\n\nStudents can join using the "Take Assessment" option.`)
      } else {
        throw new Error(data.error || 'Failed to publish assessment')
      }
      
    } catch (error: any) {
      console.error('Error publishing assessment:', error)
      alert(`Failed to publish assessment: ${error.message}`)
    }
  }

  // Handle save assessment
  const handleSaveAssessment = () => {
    const { code, link } = generateAssessmentCode()
    setShowSaveOptions(true)
  }

  // Export to PDF
  const exportToPDF = () => {
    // Simulate PDF export
    alert('PDF export feature will be implemented here. Your assessment will be downloaded as a PDF file.')
  }

  // Copy link to clipboard
  const copyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied to clipboard!')
    } catch (err) {
      alert('Failed to copy link')
    }
  }

  // Generate QR Code (placeholder)
  const generateQRCode = () => {
    alert('QR Code generation feature will be implemented here. A QR code for the assessment link will be generated.')
  }

  const getDifficultyLevel = (value: number) => {
    if (value === 0) return 'Easy'
    if (value === 50) return 'Medium'
    return 'Hard'
  }

  const getDifficultyColor = (value: number) => {
    if (value === 0) return '#22c55e'
    if (value === 50) return '#f59e0b'
    return '#ef4444'
  }

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value <= 25) {
      setDifficultyValue(0)
    } else if (value <= 75) {
      setDifficultyValue(50)
    } else {
      setDifficultyValue(100)
    }
  }

  // Question Block Component
  const QuestionBlock = ({ question, index }: { question: Question; index: number }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editedQuestion, setEditedQuestion] = useState(question)

    const handleSave = () => {
      updateQuestion(question.id, editedQuestion)
      setIsEditing(false)
    }

    const handleDragStart = (e: React.DragEvent) => {
      setDraggedItem(question.id)
      e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      if (draggedItem && generatedAssessment) {
        const fromIndex = generatedAssessment.questions.findIndex(q => q.id === draggedItem)
        const toIndex = index
        reorderQuestions(fromIndex, toIndex)
        setDraggedItem(null)
      }
    }

    return (
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`bg-white border-2 rounded-xl p-6 shadow-sm transition-all duration-200 cursor-move hover:shadow-md ${
          draggedItem === question.id ? 'border-[#ee0b8c] shadow-lg transform scale-105' : 'border-gray-200 hover:border-gray-300'
        }`}
        title="Drag to reorder questions"
      >
        {/* Drag Handle Indicator */}
        <div className="absolute top-2 left-2 text-gray-400 text-xs">
          ⋮⋮
        </div>
        {/* Question Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-[#ee0b8c] text-white rounded-full text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {question.type || 'MCQ'}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                question.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty || 'Unknown'}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {question.points || 0} pts
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {question.timeLimit || 60}s
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Edit Question Button - Click to edit question text, options, points, and time limit */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:text-[#ee0b8c] hover:bg-gray-50 rounded-lg transition-all"
              title="Edit Question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Media Attachment Dropdown - Add images, audio, or video to questions */}
            <div className="relative group">
              <button 
                className="p-2 text-gray-600 hover:text-[#ee0b8c] hover:bg-gray-50 rounded-lg transition-all"
                title="Add Media (Image, Audio, Video)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                  Add Media to Question
                </div>
                <button 
                  onClick={() => addMedia(question.id, 'image')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  📷 <span>Add Image</span>
                </button>
                <button 
                  onClick={() => addMedia(question.id, 'audio')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  🎵 <span>Add Audio</span>
                </button>
                <button 
                  onClick={() => addMedia(question.id, 'video')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                >
                  🎥 <span>Add Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Media Display Section - Shows attached images, audio, or video files */}
        {question.media && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                📎 Attached Media ({question.media.type})
              </span>
              <button
                onClick={() => updateQuestion(question.id, { media: undefined })}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
                title="Remove media"
              >
                Remove
              </button>
            </div>
            {question.media.type === 'image' && (
              <img 
                src={question.media.url} 
                alt="Question media" 
                className="max-w-xs rounded-lg border border-gray-300" 
              />
            )}
            {question.media.type === 'audio' && (
              <audio controls className="w-full max-w-sm">
                <source src={question.media.url} />
                Your browser does not support the audio element.
              </audio>
            )}
            {question.media.type === 'video' && (
              <video controls className="max-w-sm rounded-lg border border-gray-300">
                <source src={question.media.url} />
                Your browser does not support the video element.
              </video>
            )}
          </div>
        )}

        {/* Question Content */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <textarea
                value={editedQuestion.question}
                onChange={(e) => setEditedQuestion({...editedQuestion, question: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
            </div>
            
            {question.options && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                {editedQuestion.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(editedQuestion.options || [])]
                        newOptions[optIndex] = e.target.value
                        setEditedQuestion({...editedQuestion, options: newOptions})
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                <input
                  type="number"
                  value={editedQuestion.points}
                  onChange={(e) => setEditedQuestion({...editedQuestion, points: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
                <input
                  type="number"
                  value={editedQuestion.timeLimit}
                  onChange={(e) => setEditedQuestion({...editedQuestion, timeLimit: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#ee0b8c] text-white rounded-lg hover:bg-[#d8096d]"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{question.question}</h3>
            
            {question.options && (
              <div className="space-y-2 mb-4">
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      option === question.correctAnswer 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className={option === question.correctAnswer ? 'text-green-800 font-medium' : 'text-gray-700'}>
                      {option}
                    </span>
                    {option === question.correctAnswer && (
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {question.explanation && (
              <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-sm text-blue-800">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Assessment Preview Page
  if (showPreview && generatedAssessment) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[1000px] flex-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-white rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to AI Mode
                </button>
                
                {/* Header action buttons removed per request */}
              </div>

              {/* Assessment Overview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{generatedAssessment.title}</h1>
                <p className="text-gray-600 mb-4">{generatedAssessment.description}</p>
                
                <div className="flex gap-6 text-sm text-gray-600">
                  <span><strong>Questions:</strong> {generatedAssessment.questions.length}</span>
                  <span><strong>Total Points:</strong> {generatedAssessment.totalPoints}</span>
                  <span><strong>Estimated Time:</strong> {generatedAssessment.estimatedTime} minutes</span>
                </div>
              </div>

              {/* Teacher-Level Features Highlight */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm border border-blue-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  🎓 Teacher-Level Features Available
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✏️</span>
                    <span><strong>Edit Questions:</strong> Click the edit icon to modify question text, options, and answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">📎</span>
                    <span><strong>Add Media:</strong> Attach images, audio, or video files to any question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">⏱️</span>
                    <span><strong>Set Time Limits:</strong> Configure individual time limits for each question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">🎯</span>
                    <span><strong>Scoring System:</strong> Adjust points for each question individually</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">↕️</span>
                    <span><strong>Drag & Drop:</strong> Reorder questions by dragging the question blocks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">📱</span>
                    <span><strong>Real-time Preview:</strong> See changes instantly as you edit</span>
                  </div>
                </div>
              </div>

              {/* Assessment Metadata */}
              {assessmentMetadata && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Assessment Settings</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div><strong>Name:</strong> {assessmentMetadata.assessmentName}</div>
                    <div><strong>Type:</strong> {assessmentMetadata.assessmentType}</div>
                    <div><strong>Language:</strong> {assessmentMetadata.language}</div>
                    <div><strong>Difficulty:</strong> {assessmentMetadata.difficulty}</div>
                    <div><strong>Generated:</strong> {new Date(assessmentMetadata.generatedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
                  <div className="text-sm text-gray-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                    💡 Tip: Click ✏️ to edit questions or 📎 to add media files
                  </div>
                </div>
                {generatedAssessment.questions.map((question, index) => (
                  <QuestionBlock 
                    key={question.id || `question-${index}`} 
                    question={question} 
                    index={index}
                  />
                ))}
              </div>

              {/* Add New Question Section */}
              <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                    ✨ Add More Questions
                  </h3>
                  {!showAddQuestion && (
                    <button
                      onClick={() => setShowAddQuestion(true)}
                      className="px-4 py-2 bg-[#ee0b8c] text-white rounded-lg hover:bg-[#d8096d] transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Question
                    </button>
                  )}
                </div>

                {showAddQuestion && !addQuestionMode && (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">Choose how you'd like to add new questions:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setAddQuestionMode('manual')}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#ee0b8c] hover:bg-pink-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">✏️</span>
                          <h4 className="font-semibold text-gray-900">Manual Entry</h4>
                        </div>
                        <p className="text-sm text-gray-600">Create a question manually with full control over content, options, and settings.</p>
                      </button>
                      
                      <button
                        onClick={() => setAddQuestionMode('ai')}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#ee0b8c] hover:bg-pink-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">🤖</span>
                          <h4 className="font-semibold text-gray-900">AI Generation</h4>
                        </div>
                        <p className="text-sm text-gray-600">Let AI generate multiple questions based on your assessment theme and settings.</p>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowAddQuestion(false)
                        setAddQuestionMode(null)
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Manual Question Form */}
                {addQuestionMode === 'manual' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Create New Question Manually</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                      <textarea
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                        placeholder="Enter your question here..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                        <select
                          value={newQuestion.type}
                          onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="open-text">Open Text</option>
                          <option value="fill-blanks">Fill in the Blanks</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                        <select
                          value={newQuestion.difficulty}
                          onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    {(newQuestion.type === 'mcq' || newQuestion.type === 'true-false') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                        {newQuestion.type === 'true-false' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="correctAnswer"
                                value="True"
                                checked={newQuestion.correctAnswer === 'True'}
                                onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value, options: ['True', 'False']})}
                              />
                              <label>True</label>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="correctAnswer"
                                value="False"
                                checked={newQuestion.correctAnswer === 'False'}
                                onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value, options: ['True', 'False']})}
                              />
                              <label>False</label>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {newQuestion.options?.map((option, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <input
                                  type="radio"
                                  name="correctAnswer"
                                  checked={newQuestion.correctAnswer === option}
                                  onChange={() => setNewQuestion({...newQuestion, correctAnswer: option})}
                                />
                                <span className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full text-xs font-medium flex items-center justify-center">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(newQuestion.options || [])]
                                    newOptions[index] = e.target.value
                                    const updatedQuestion = {...newQuestion, options: newOptions}
                                    if (newQuestion.correctAnswer === option) {
                                      updatedQuestion.correctAnswer = e.target.value
                                    }
                                    setNewQuestion(updatedQuestion)
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attach Media (Optional)</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = () => {
                                  const dataUrl = reader.result as string
                                  setNewQuestion({
                                    ...newQuestion,
                                    media: { type: 'image', url: dataUrl }
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm"
                        >
                          📷 Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'audio/*'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = () => {
                                  const dataUrl = reader.result as string
                                  setNewQuestion({
                                    ...newQuestion,
                                    media: { type: 'audio', url: dataUrl }
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm"
                        >
                          🎵 Audio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'video/*'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = () => {
                                  const dataUrl = reader.result as string
                                  setNewQuestion({
                                    ...newQuestion,
                                    media: { type: 'video', url: dataUrl }
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm"
                        >
                          🎥 Video
                        </button>
                        {newQuestion.media && (
                          <button
                            type="button"
                            onClick={() => setNewQuestion({...newQuestion, media: undefined})}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm"
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                      {newQuestion.media && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                          📎 {newQuestion.media.type} attached
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                      <textarea
                        value={newQuestion.explanation}
                        onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                        placeholder="Provide an explanation for the correct answer..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                        <input
                          type="number"
                          min="1"
                          value={newQuestion.points}
                          onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 1})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
                        <input
                          type="number"
                          min="10"
                          value={newQuestion.timeLimit}
                          onChange={(e) => setNewQuestion({...newQuestion, timeLimit: parseInt(e.target.value) || 60})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={addQuestionManually}
                        disabled={!newQuestion.question || !newQuestion.correctAnswer}
                        className="px-6 py-2 bg-[#ee0b8c] text-white rounded-lg hover:bg-[#d8096d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Question
                      </button>
                      <button
                        onClick={() => {
                          setAddQuestionMode(null)
                          setNewQuestion({
                            question: '',
                            type: 'mcq',
                            options: ['', '', '', ''],
                            correctAnswer: '',
                            explanation: '',
                            points: 1,
                            timeLimit: 60,
                            difficulty: 'Easy'
                          })
                        }}
                        className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Question Generation Form */}
                {addQuestionMode === 'ai' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Generate Questions with AI</h4>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>📝 AI will generate questions based on:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Assessment Name: {assessmentMetadata?.assessmentName}</li>
                        <li>• Type: {assessmentMetadata?.assessmentType}</li>
                        <li>• Language: {assessmentMetadata?.language}</li>
                        <li>• Difficulty: {assessmentMetadata?.difficulty}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How many additional questions would you like to generate?
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(e.target.value)}
                        placeholder="Enter number of questions (1-20)"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={addQuestionsWithAI}
                        disabled={!aiQuestionCount || isAddingQuestions || parseInt(aiQuestionCount) < 1 || parseInt(aiQuestionCount) > 20}
                        className="px-6 py-2 bg-[#ee0b8c] text-white rounded-lg hover:bg-[#d8096d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isAddingQuestions ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            Generate Questions
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAddQuestionMode(null)
                          setAiQuestionCount('')
                        }}
                        className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 justify-center mt-8 pb-8">
                <button
                  onClick={() => {
                    setShowPreview(false)
                    setShowAIMode(false)
                    setShowModeSelection(true)
                    setFormData({
                      assessmentName: '',
                      assessmentType: '',
                      language: '',
                      numberOfQuestions: ''
                    })
                    setEasyToHard(false)
                    setDifficultyValue(0)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
                >
                  Create New Assessment
                </button>
                <button
                  onClick={handleSaveAssessment}
                  className="px-6 py-3 border-2 border-[#ee0b8c] text-[#ee0b8c] rounded-lg hover:bg-[#ee0b8c] hover:text-white transition-all duration-200"
                >
                  📄 Save Assessment
                </button>
                <button
                  onClick={publishAssessment}
                  disabled={isPublished}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isPublished ? '✅ Published' : '🚀 Publish Assessment'}
                </button>
              </div>

              {/* Published Assessment Info */}
              {isPublished && publishedAssessmentCode && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mx-4 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-white">🎉</span>
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Assessment Published!</h3>
                    <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                      <p className="text-sm text-gray-600 mb-2">Share this code with your students:</p>
                      <div className="text-3xl font-mono font-bold text-green-700 tracking-wider">
                        {publishedAssessmentCode}
                      </div>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => copyLink(publishedAssessmentCode)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                      >
                        📋 Copy Code
                      </button>
                      <button
                        onClick={() => alert('QR Code feature will be implemented for easy sharing!')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200"
                      >
                        📱 QR Code
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      Students can join using "Take Assessment" option on the homepage
                    </p>
                  </div>
                </div>
              )}

              {/* Save Options Modal */}
              {showSaveOptions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Assessment Saved Successfully! 🎉</h2>
                      <button
                        onClick={() => setShowSaveOptions(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-gray-600 mb-6">Choose how you'd like to share or export your assessment:</p>

                    {/* Export Options */}
                    <div className="space-y-6">
                      {/* PDF Export */}
                      <div className="border border-gray-200 rounded-lg p-6 hover:border-[#ee0b8c] transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              📄
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Export as PDF</h3>
                              <p className="text-sm text-gray-600">Download a printable version of your assessment</p>
                            </div>
                          </div>
                          <button
                            onClick={exportToPDF}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>

                      {/* Share with Link */}
                      <div className="border border-gray-200 rounded-lg p-6 hover:border-[#ee0b8c] transition-all duration-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            🔗
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Share Assessment Link</h3>
                            <p className="text-sm text-gray-600">Share a direct link for students to take the assessment</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600 mb-2">Assessment Link:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={assessmentLink}
                              readOnly
                              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-sm"
                            />
                            <button
                              onClick={() => copyLink(assessmentLink)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quiz Code */}
                      <div className="border border-gray-200 rounded-lg p-6 hover:border-[#ee0b8c] transition-all duration-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            🔢
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Unique Quiz Code</h3>
                            <p className="text-sm text-gray-600">Students can enter this code to access the assessment</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600 mb-2">Quiz Code:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={assessmentCode}
                              readOnly
                              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-lg font-mono text-center"
                            />
                            <button
                              onClick={() => copyLink(assessmentCode)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="border border-gray-200 rounded-lg p-6 hover:border-[#ee0b8c] transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              📱
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Generate QR Code</h3>
                              <p className="text-sm text-gray-600">Create a QR code for easy mobile access</p>
                            </div>
                          </div>
                          <button
                            onClick={generateQRCode}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                          >
                            Generate QR
                          </button>
                        </div>
                      </div>

                      {/* Publish Assessment */}
                      <div className="border border-gray-200 rounded-lg p-6 hover:border-[#ee0b8c] transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#ee0b8c] bg-opacity-20 rounded-lg flex items-center justify-center">
                              🌐
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Publish Assessment</h3>
                              <p className="text-sm text-gray-600">Make your assessment publicly available and track results</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              alert('Assessment published successfully! Students can now access it using the link or code.')
                              setShowSaveOptions(false)
                            }}
                            className="px-4 py-2 bg-[#ee0b8c] text-white rounded-lg hover:bg-[#d8096d] transition-all"
                          >
                            Publish
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowSaveOptions(false)}
                        className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // View Mode Page
  if (showViewMode) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-white rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Mode Selection
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    📊 Live Monitoring Active
                  </div>
                  <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                    🔄 Auto-refresh: 5s
                  </div>
                </div>
              </div>

              {/* Page Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Monitoring Dashboard</h1>
                <p className="text-gray-600">Monitor live assessments, view real-time leaderboards, and manage active sessions</p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Assessments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoadingViewMode ? '...' : viewModeData?.stats?.activeAssessments || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">📝</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Students Online</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoadingViewMode ? '...' : viewModeData?.stats?.studentsOnline || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xl">👥</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed Today</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoadingViewMode ? '...' : viewModeData?.stats?.completedToday || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoadingViewMode ? '...' : `${viewModeData?.stats?.avgScore || 0}%`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 text-xl">⭐</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Assessments */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Active Assessments</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={fetchViewModeData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                    >
                      🔄 Refresh
                    </button>
                    <button 
                      onClick={handleEndAllAssessments}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
                    >
                      🛑 End All
                    </button>
                  </div>
                </div>

                {isLoadingViewMode ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-[#ee0b8c] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading assessment data...</p>
                  </div>
                ) : viewModeData?.activeAssessments?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📝</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Assessments</h3>
                    <p className="text-gray-600">There are currently no active assessments running.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewModeData?.activeAssessments?.map((assessment: any, index: number) => (
                      <div key={assessment.code} className="border border-gray-200 rounded-lg p-6 hover:border-[#ee0b8c] transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                              <p className="text-sm text-gray-600">
                                Started {new Date(assessment.startedAt).toLocaleString()} • Code: {assessment.code}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 transition-all">
                              📊 View Details
                            </button>
                            <button 
                              onClick={() => handleEndAssessment(assessment.code)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-all"
                            >
                              🛑 End Assessment
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-lg font-bold text-blue-900">{assessment.activeStudents}</p>
                            <p className="text-sm text-blue-700">Active Students</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-lg font-bold text-green-900">{assessment.completedStudents}</p>
                            <p className="text-sm text-green-700">Completed</p>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <p className="text-lg font-bold text-yellow-900">{assessment.avgScore}%</p>
                            <p className="text-sm text-yellow-700">Avg Score</p>
                          </div>
                        </div>

                        {/* Live Leaderboard */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="font-medium text-gray-900 mb-3">🏆 Live Leaderboard</h4>
                          
                          {/* Active Students Taking Assessment */}
                          {assessment.activeLeaderboard && assessment.activeLeaderboard.length > 0 ? (
                            <div className="mb-6">
                              <h5 className="text-sm font-medium text-blue-700 mb-2">🟢 Currently Taking Assessment</h5>
                              <div className="space-y-2">
                                {assessment.activeLeaderboard.slice(0, 5).map((student: any, studentIndex: number) => (
                                  <div key={`active-${student.studentName}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                                    studentIndex === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        {student.isLeading && (
                                          <span className="text-yellow-500 text-lg crown-animation">👑</span>
                                        )}
                                        <span className={`font-bold text-sm ${
                                          studentIndex === 0 ? 'text-blue-600' : 'text-gray-600'
                                        }`}>
                                          #{student.rank}
                                        </span>
                                      </div>
                                      <div className="w-2 h-2 bg-green-400 rounded-full active-pulse"></div>
                                      <div>
                                        <p className="font-medium text-gray-900">{student.studentName}</p>
                                        <p className="text-xs text-gray-600">
                                          Question {student.currentQuestion}/{student.totalQuestions} • {student.score} points
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-sm font-bold ${
                                        studentIndex === 0 ? 'text-blue-700' : 'text-gray-700'
                                      }`}>
                                        {student.completionPercentage}%
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {student.timeLeft}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                
                                {assessment.activeLeaderboard.length > 5 && (
                                  <div className="text-center pt-2">
                                    <button className="text-sm text-[#ee0b8c] hover:text-[#d8096d] transition-all">
                                      View all {assessment.activeLeaderboard.length} active students →
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-6">
                              <h5 className="text-sm font-medium text-gray-500 mb-2">🟢 Currently Taking Assessment</h5>
                              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No students currently active</p>
                            </div>
                          )}

                          {/* Completed Students */}
                          {assessment.completedLeaderboard && assessment.completedLeaderboard.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-green-700 mb-2">✅ Completed Assessment</h5>
                              <div className="space-y-2">
                                {assessment.completedLeaderboard.slice(0, 3).map((student: any, studentIndex: number) => (
                                  <div key={`completed-${student.studentName}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                                    studentIndex === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        {student.isLeading && (
                                          <span className="text-yellow-500 text-lg crown-animation">👑</span>
                                        )}
                                        <span className={`font-bold text-sm ${
                                          studentIndex === 0 ? 'text-yellow-600' : 
                                          studentIndex === 1 ? 'text-gray-600' : 
                                          'text-gray-600'
                                        }`}>
                                          {studentIndex === 0 ? '🥇' : studentIndex === 1 ? '🥈' : '🥉'}
                                        </span>
                                      </div>
                                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                      <div>
                                        <p className="font-medium text-gray-900">{student.studentName}</p>
                                        <p className="text-xs text-gray-600">
                                          Completed • {student.score}/{assessment.totalPossibleScore} points • {student.completionTime}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-sm font-bold ${
                                        studentIndex === 0 ? 'text-yellow-700' : 'text-green-700'
                                      }`}>
                                        {student.scorePercentage}%
                                      </p>
                                      <p className="text-xs text-green-600">Finished</p>
                                    </div>
                                  </div>
                                ))}
                                
                                {assessment.completedLeaderboard.length > 3 && (
                                  <div className="text-center pt-2">
                                    <button 
                                      onClick={() => setShowCompletedStudents(assessment.code)}
                                      className="text-sm text-[#ee0b8c] hover:text-[#d8096d] transition-all"
                                    >
                                      View all {assessment.completedLeaderboard.length} completed students →
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Assessments */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Past Assessments</h2>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm">
                    📊 View All Results
                  </button>
                </div>

                {viewModeData?.pastAssessments?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📋</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Assessments</h3>
                    <p className="text-gray-600">Completed assessments will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewModeData?.pastAssessments?.map((assessment: any) => (
                      <div key={assessment.code} className="border border-gray-200 rounded-lg p-4 hover:border-[#ee0b8c] transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-xs text-gray-500">Completed</span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{assessment.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{assessment.participantCount} students participated</p>
                          <p>Avg score: {assessment.avgScore}%</p>
                          <p>Completed {new Date(assessment.completedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Completed Students Modal */}
        {showCompletedStudents && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Completed Students</h2>
                <button 
                  onClick={() => setShowCompletedStudents(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {(() => {
                const assessment = viewModeData?.activeAssessments?.find((a: any) => a.code === showCompletedStudents);
                if (!assessment) return <p>Assessment not found</p>;
                
                return (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 mb-4">
                      Assessment: <span className="font-medium">{assessment.title}</span> • {assessment.completedLeaderboard?.length || 0} completed students
                    </div>
                    
                    {assessment.completedLeaderboard?.map((student: any, index: number) => (
                      <div key={student.studentName} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center gap-1">
                              {student.isLeading && (
                                <span className="text-yellow-500 text-lg crown-animation">👑</span>
                              )}
                              <span className={`text-lg font-bold ${
                                index === 0 ? 'text-yellow-600' : 
                                index === 1 ? 'text-gray-500' : 
                                index === 2 ? 'text-amber-600' : 'text-gray-400'
                              }`}>
                                #{index + 1}
                              </span>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="font-bold text-gray-900">{student.studentName}</p>
                              <p className="text-sm text-gray-600">
                                Completed • {student.score}/{assessment.totalPossibleScore} points • {student.completionTime}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            index === 0 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {student.scorePercentage}%
                          </p>
                          <p className="text-xs text-green-600">Finished</p>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">No completed students yet</p>}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    )
  }

  // AI Mode Page
  if (showAIMode) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
              <div className="px-4 py-2 mb-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
              
              <div className="flex flex-wrap justify-between gap-3 p-4 fade-in">
                <p className="text-[#171215] tracking-light text-[32px] font-bold leading-tight min-w-72">Create Assessment - AI Mode</p>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3 fade-in">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Assessment Name</p>
                  <input
                    placeholder="Enter assessment name"
                    value={formData.assessmentName}
                    onChange={(e) => setFormData({...formData, assessmentName: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal input-transition"
                  />
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Assessment Description</p>
                  <p className="text-[#836777] text-sm font-normal leading-normal pb-2">Describe what your assessment should cover. Be specific about topics, skills, or concepts you want to test.</p>
                  <textarea
                    placeholder="e.g., 'Create a Python programming assessment covering data structures, loops, functions, and file handling for intermediate level students'"
                    value={assessmentPrompt}
                    onChange={(e) => setAssessmentPrompt(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal min-h-[120px]"
                    rows={4}
                  />
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Assessment Type</p>
                  <select
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({...formData, assessmentType: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(131,103,119)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e')] bg-no-repeat bg-right-[15px] bg-center pr-12"
                  >
                    <option value="">Select assessment type</option>
                    <option value="mcq">MCQ</option>
                    <option value="open-text">Open Text</option>
                    <option value="true-false">True/False</option>
                    <option value="fill-blanks">Fill in the blanks</option>
                    <option value="mixed">Mixed Assessment</option>
                  </select>
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Language</p>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(131,103,119)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e')] bg-no-repeat bg-right-[15px] bg-center pr-12"
                  >
                    <option value="">Select language</option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="arabic">Arabic</option>
                    <option value="kannada">Kannada</option>
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                    <option value="malayalam">Malayalam</option>
                  </select>
                </label>
              </div>
              
              <div className="flex items-center gap-4 bg-white px-4 min-h-14 justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[#171215] text-base font-normal leading-normal flex-1 truncate">Easy to Hard</p>
                  <p className="text-[#836777] text-sm font-normal leading-normal">(Disables difficulty and question controls)</p>
                </div>
                <div className="shrink-0">
                  <label
                    className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-all duration-300 ${
                      easyToHard ? 'justify-end bg-[#ee0b8c]' : 'justify-start bg-[#f4f1f2]'
                    }`}
                  >
                    <div className="h-full w-[27px] rounded-full bg-white transition-all duration-300" style={{boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 8px, rgba(0, 0, 0, 0.06) 0px 3px 1px'}}></div>
                    <input 
                      type="checkbox" 
                      className="invisible absolute" 
                      checked={easyToHard}
                      onChange={(e) => setEasyToHard(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
              
              <div className={`transition-opacity duration-300 ${easyToHard ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="@container">
                  <div className="relative flex w-full flex-col items-start justify-between gap-3 p-4 @[480px]:flex-row @[480px]:items-center">
                    <div className="flex w-full shrink-[3] items-center justify-between">
                      <p className="text-[#171215] text-base font-medium leading-normal">Choose Difficulty</p>
                      <p className="text-[#171215] text-sm font-normal leading-normal @[480px]:hidden">{getDifficultyLevel(difficultyValue)}</p>
                    </div>
                    <div className="flex h-4 w-full items-center gap-4">
                      <div className="relative flex h-1 flex-1 rounded-sm bg-[#e4dde1]">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 bg-gray-400 rounded-full"></div>
                        
                        <div 
                          className="h-full rounded-sm transition-all duration-300" 
                          style={{
                            width: `${difficultyValue}%`,
                            backgroundColor: getDifficultyColor(difficultyValue)
                          }}
                        ></div>
                        <div className="relative">
                          <div 
                            className="absolute -left-2 -top-1.5 size-4 rounded-full transition-all duration-300 cursor-pointer border-2 border-white shadow-md"
                            style={{
                              backgroundColor: getDifficultyColor(difficultyValue),
                              left: `${difficultyValue}%`,
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={difficultyValue}
                          onChange={handleDifficultyChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={easyToHard}
                        />
                      </div>
                      <p className="text-[#171215] text-sm font-normal leading-normal hidden @[480px]:block">{getDifficultyLevel(difficultyValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3 transition-opacity duration-300 ${easyToHard ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Number of Questions</p>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter number of questions"
                    value={formData.numberOfQuestions}
                    onChange={(e) => setFormData({...formData, numberOfQuestions: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal"
                    disabled={easyToHard}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                  />
                </label>
              </div>
              
              <div className="px-4 py-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Choose Your Path:</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[#ee0b8c]">📋</span>
                      <span><strong>Select Topics:</strong> AI will analyze your description and let you choose specific subtopics to focus on</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">⚡</span>
                      <span><strong>Skip & Generate:</strong> AI will create a comprehensive assessment directly based on your description</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex px-4 py-3 justify-end gap-3 fade-in">
                <button
                  onClick={handleSkipTopicSelection}
                  disabled={isLoading || !formData.assessmentName || !assessmentPrompt.trim() || !formData.assessmentType || !formData.language || (!easyToHard && !formData.numberOfQuestions)}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-gray-600 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-700 btn-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {isLoading ? 'Generating Assessment...' : 'Skip & Generate'}
                  </span>
                </button>
                <button
                  onClick={handleFormSubmit}
                  disabled={isLoading || !formData.assessmentName || !assessmentPrompt.trim() || !formData.assessmentType || !formData.language || (!easyToHard && !formData.numberOfQuestions)}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#ee0b8c] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#d8096d] btn-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {isLoading ? 'Analyzing & Generating Topics...' : 'Select Topics'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Manual Mode Page
  if (showManualMode) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
              <div className="px-4 py-2 mb-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
              
              <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-[#171215] tracking-light text-[32px] font-bold leading-tight min-w-72">Create Assessment - Manual Mode</p>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Assessment Name</p>
                  <input
                    placeholder="Enter assessment name"
                    value={manualFormData.assessmentName}
                    onChange={(e) => setManualFormData({...manualFormData, assessmentName: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal"
                  />
                </label>
              </div>

              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Subject</p>
                  <input
                    placeholder="Enter subject (e.g., Computer Science, Mathematics)"
                    value={manualFormData.subject}
                    onChange={(e) => setManualFormData({...manualFormData, subject: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal"
                  />
                </label>
              </div>

              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Textbook/Document Name</p>
                  <input
                    placeholder="Enter textbook or document name"
                    value={manualFormData.textbookName}
                    onChange={(e) => setManualFormData({...manualFormData, textbookName: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal"
                  />
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Assessment Type</p>
                  <select
                    value={manualFormData.assessmentType}
                    onChange={(e) => setManualFormData({...manualFormData, assessmentType: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(131,103,119)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e')] bg-no-repeat bg-right-[15px] bg-center pr-12"
                  >
                    <option value="">Select assessment type</option>
                    <option value="mcq">MCQ</option>
                    <option value="open-text">Open Text</option>
                    <option value="true-false">True/False</option>
                    <option value="fill-blanks">Fill in the blanks</option>
                    <option value="mixed">Mixed Assessment</option>
                  </select>
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Language</p>
                  <select
                    value={manualFormData.language}
                    onChange={(e) => setManualFormData({...manualFormData, language: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(131,103,119)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e')] bg-no-repeat bg-right-[15px] bg-center pr-12"
                  >
                    <option value="">Select language</option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="arabic">Arabic</option>
                    <option value="kannada">Kannada</option>
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                    <option value="malayalam">Malayalam</option>
                  </select>
                </label>
              </div>

              {/* PDF Upload Section */}
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Upload PDF Document</p>
                  <div className="border-2 border-dashed border-[#e4dde1] rounded-xl p-6 text-center hover:border-[#ee0b8c] transition-colors">
                    {uploadedPDF ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          📄
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{uploadedPDF.name}</p>
                          <p className="text-xs text-gray-500">{(uploadedPDF.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          onClick={() => setUploadedPDF(null)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          📄
                        </div>
                        <p className="text-[#171215] text-sm font-medium mb-1">Upload your textbook or document</p>
                        <p className="text-[#836777] text-xs mb-3">PDF files up to 50MB</p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePDFUpload(file)
                          }}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="inline-flex items-center justify-center px-4 py-2 bg-[#ee0b8c] text-white rounded-lg hover:bg-[#d8096d] transition-all cursor-pointer text-sm"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              
              <div className="flex items-center gap-4 bg-white px-4 min-h-14 justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[#171215] text-base font-normal leading-normal flex-1 truncate">Easy to Hard</p>
                  <p className="text-[#836777] text-sm font-normal leading-normal">(Disables difficulty and question controls)</p>
                </div>
                <div className="shrink-0">
                  <label
                    className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-all duration-300 ${
                      easyToHard ? 'justify-end bg-[#ee0b8c]' : 'justify-start bg-[#f4f1f2]'
                    }`}
                  >
                    <div className="h-full w-[27px] rounded-full bg-white transition-all duration-300" style={{boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 8px, rgba(0, 0, 0, 0.06) 0px 3px 1px'}}></div>
                    <input 
                      type="checkbox" 
                      className="invisible absolute" 
                      checked={easyToHard}
                      onChange={(e) => setEasyToHard(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
              
              <div className={`transition-opacity duration-300 ${easyToHard ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="@container">
                  <div className="relative flex w-full flex-col items-start justify-between gap-3 p-4 @[480px]:flex-row @[480px]:items-center">
                    <div className="flex w-full shrink-[3] items-center justify-between">
                      <p className="text-[#171215] text-base font-medium leading-normal">Choose Difficulty</p>
                      <p className="text-[#171215] text-sm font-normal leading-normal @[480px]:hidden">{getDifficultyLevel(difficultyValue)}</p>
                    </div>
                    <div className="flex h-4 w-full items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="50"
                        value={difficultyValue}
                        onChange={handleDifficultyChange}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${getDifficultyColor(difficultyValue)} 0%, ${getDifficultyColor(difficultyValue)} ${difficultyValue}%, #e5e7eb ${difficultyValue}%, #e5e7eb 100%)`
                        }}
                        disabled={easyToHard}
                      />
                      <p className="text-[#171215] text-sm font-normal leading-normal hidden @[480px]:block min-w-[60px]" style={{color: getDifficultyColor(difficultyValue)}}>{getDifficultyLevel(difficultyValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3 transition-opacity duration-300 ${easyToHard ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#171215] text-base font-medium leading-normal pb-2">Number of Questions</p>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter number of questions"
                    value={manualFormData.numberOfQuestions}
                    onChange={(e) => setManualFormData({...manualFormData, numberOfQuestions: e.target.value})}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#171215] focus:outline-0 focus:ring-0 border border-[#e4dde1] bg-white focus:border-[#e4dde1] h-14 placeholder:text-[#836777] p-[15px] text-base font-normal leading-normal"
                    disabled={easyToHard}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                  />
                </label>
              </div>
              
              <div className="flex px-4 py-3 justify-end">
                <button
                  onClick={handleManualFormSubmit}
                  disabled={isAnalyzingPDF || !manualFormData.assessmentName || !manualFormData.assessmentType || !manualFormData.language || !manualFormData.subject || !manualFormData.textbookName || !uploadedPDF || (!easyToHard && !manualFormData.numberOfQuestions)}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#ee0b8c] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#d8096d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {isAnalyzingPDF ? 'Analyzing PDF...' : 'Continue'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Topic Selection Page
  if (showTopicSelection) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[800px] flex-1">
              <div className="px-4 py-2 mb-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
              
              <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-[#171215] tracking-light text-[32px] font-bold leading-tight">Select Topics for Assessment</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-6 mx-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    �
                  </div>
                  <h3 className="font-semibold text-blue-900">PDF Analysis Results</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📄</span>
                    <span><strong>Document:</strong> {uploadedPDF?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📚</span>
                    <span><strong>Subject:</strong> {manualFormData.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">🔍</span>
                    <span><strong>Topics Found:</strong> {extractedTopics.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">📖</span>
                    <span><strong>Textbook:</strong> {manualFormData.textbookName || 'Not specified'}</span>
                  </div>
                  {pdfAnalysisMetadata?.method && (
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">⚙️</span>
                      <span><strong>Analysis Method:</strong> {pdfAnalysisMetadata.method}</span>
                    </div>
                  )}
                  {pdfAnalysisMetadata?.fileSize && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">📐</span>
                      <span><strong>File Size:</strong> {(pdfAnalysisMetadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-800">
                      ✨ <strong>AI Analysis Complete:</strong> We've intelligently analyzed your document and extracted {extractedTopics.length} relevant topics for {manualFormData.subject}. 
                      Select the topics you want to include in your {manualFormData.assessmentType.toLowerCase()}.
                    </p>
                    <button
                      onClick={analyzePDFAndExtractTopics}
                      disabled={isAnalyzingPDF}
                      className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      title="Re-analyze PDF for better topic extraction"
                    >
                      {isAnalyzingPDF ? '🔄' : '🔄 Re-analyze'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🎯 Topics Extracted from Document:</h3>
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedTopics.length} of {extractedTopics.length} selected
                  </div>
                </div>
                
                {extractedTopics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extractedTopics.map((topic, index) => (
                      <label key={index} className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-sm ${
                        selectedTopics.includes(topic) 
                          ? 'border-[#ee0b8c] bg-pink-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedTopics.includes(topic)}
                          onChange={() => toggleTopicSelection(topic)}
                          className="w-5 h-5 text-[#ee0b8c] border-gray-300 rounded focus:ring-[#ee0b8c] focus:ring-2"
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${selectedTopics.includes(topic) ? 'text-[#ee0b8c]' : 'text-gray-900'}`}>
                            {topic}
                          </span>
                        </div>
                        {selectedTopics.includes(topic) && (
                          <div className="w-6 h-6 bg-[#ee0b8c] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="font-medium text-yellow-800">No topics extracted</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      The AI couldn't extract specific topics from your document. You can still proceed by entering a custom topic below.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✨ Additional Custom Topic (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add any specific topic that wasn't detected in your document but you'd like to include in the assessment.
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Advanced Problem Solving, Case Studies, Practical Applications..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ee0b8c] focus:border-[#ee0b8c] text-sm placeholder:text-gray-400"
                  />
                  {customTopic.trim() && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <span className="text-sm text-purple-800">
                        ✅ Custom topic "<strong>{customTopic.trim()}</strong>" will be added to your assessment
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      📋 Assessment Topic Summary
                    </h4>
                    <span className="text-sm font-medium px-3 py-1 bg-[#ee0b8c] text-white rounded-full">
                      {selectedTopics.length + (customTopic.trim() ? 1 : 0)} topics
                    </span>
                  </div>
                  
                  {(selectedTopics.length > 0 || customTopic.trim()) ? (
                    <div className="space-y-3">
                      {selectedTopics.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">From Document Analysis:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTopics.map((topic, index) => (
                              <span key={index} className="px-3 py-2 bg-[#ee0b8c] text-white rounded-lg text-sm font-medium">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {customTopic.trim() && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Custom Topic:</p>
                          <span className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
                            {customTopic.trim()}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          🎯 Your assessment will include <strong>{selectedTopics.length + (customTopic.trim() ? 1 : 0)} topics</strong> with <strong>{manualFormData.numberOfQuestions} questions</strong> in <strong>{manualFormData.language}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📝</div>
                      <p className="text-gray-500 text-sm">No topics selected yet. Choose topics above to continue.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex px-4 py-3 justify-end">
                <button
                  onClick={handleTopicSelectionSubmit}
                  disabled={isLoading || (selectedTopics.length === 0 && !customTopic.trim())}
                  className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#ee0b8c] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#d8096d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {isLoading ? 'Generating Assessment...' : 'Generate Assessment'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // AI Topic Selection Page
  if (showAITopicSelection) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[800px] flex-1">
              <div className="px-4 py-2 mb-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
              
              <div className="flex flex-wrap justify-between gap-3 p-4">
                <div>
                  <p className="text-[#171215] tracking-light text-[32px] font-bold leading-tight">Select Topics for Assessment</p>
                  {detectedMainTopic && (
                    <p className="text-[#836777] text-lg font-medium mt-2">
                      Subtopics for: <span className="text-[#ee0b8c] font-bold">{detectedMainTopic}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-6 mx-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    🤖
                  </div>
                  <h3 className="font-semibold text-purple-900">AI Topic Analysis Complete</h3>
                </div>
                
                {/* Show Detected Main Topic */}
                {detectedMainTopic && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-lg">🎯</span>
                      <div>
                        <p className="text-sm font-medium text-green-900">Main Topic Detected:</p>
                        <p className="text-lg font-bold text-green-800">{detectedMainTopic}</p>
                        <p className="text-xs text-green-700">AI used NLP techniques to identify this as your primary subject area</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show Assessment Description */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">💭</span>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Your Assessment Description:</p>
                      <p className="text-sm text-purple-700 italic">"{assessmentPrompt}"</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">📚</span>
                    <span><strong>Assessment:</strong> {formData.assessmentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📝</span>
                    <span><strong>Type:</strong> {formData.assessmentType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🔍</span>
                    <span><strong>Subtopics Found:</strong> {aiExtractedTopics.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">🌐</span>
                    <span><strong>Language:</strong> {formData.language}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-purple-800">
                      ✨ <strong>AI Analysis Complete:</strong> We've used NLP techniques to analyze your description and identified "{detectedMainTopic || formData.assessmentName}" as the main topic. 
                      Generated {aiExtractedTopics.length} relevant subtopics within this subject area. 
                      Select the specific areas you want to test in your {formData.assessmentType.toLowerCase()}.
                    </p>
                    <button
                      onClick={generateAITopics}
                      disabled={isLoading}
                      className="ml-4 px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                      title="Re-analyze description and generate new topics"
                    >
                      {isLoading ? '🔄' : '🔄 Re-analyze'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🎯 AI-Generated Subtopics:</h3>
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {aiSelectedTopics.length} of {aiExtractedTopics.length} selected
                  </div>
                </div>
                
                {aiExtractedTopics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiExtractedTopics.map((topic, index) => (
                      <label key={index} className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-sm ${
                        aiSelectedTopics.includes(topic) 
                          ? 'border-[#ee0b8c] bg-pink-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={aiSelectedTopics.includes(topic)}
                          onChange={() => toggleAITopicSelection(topic)}
                          className="w-5 h-5 text-[#ee0b8c] border-gray-300 rounded focus:ring-[#ee0b8c] focus:ring-2"
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${aiSelectedTopics.includes(topic) ? 'text-[#ee0b8c]' : 'text-gray-900'}`}>
                            {topic}
                          </span>
                        </div>
                        {aiSelectedTopics.includes(topic) && (
                          <div className="w-6 h-6 bg-[#ee0b8c] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="font-medium text-yellow-800">No topics generated</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      The AI couldn't generate specific topics. You can still proceed by entering a custom topic below.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✨ Additional Custom Topic (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add any specific topic that wasn't generated but you'd like to include in the assessment.
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Advanced Concepts, Practical Applications, Case Studies..."
                    value={aiCustomTopic}
                    onChange={(e) => setAiCustomTopic(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ee0b8c] focus:border-[#ee0b8c] text-sm placeholder:text-gray-400"
                  />
                  {aiCustomTopic.trim() && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <span className="text-sm text-purple-800">
                        ✅ Custom topic "<strong>{aiCustomTopic.trim()}</strong>" will be added to your assessment
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      📋 Assessment Topic Summary
                    </h4>
                    <span className="text-sm font-medium px-3 py-1 bg-[#ee0b8c] text-white rounded-full">
                      {aiSelectedTopics.length + (aiCustomTopic.trim() ? 1 : 0)} topics
                    </span>
                  </div>
                  
                  {(aiSelectedTopics.length > 0 || aiCustomTopic.trim()) ? (
                    <div className="space-y-3">
                      {aiSelectedTopics.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">AI-Generated Topics:</p>
                          <div className="flex flex-wrap gap-2">
                            {aiSelectedTopics.map((topic, index) => (
                              <span key={index} className="px-3 py-2 bg-[#ee0b8c] text-white rounded-lg text-sm font-medium">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {aiCustomTopic.trim() && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Custom Topic:</p>
                          <span className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
                            {aiCustomTopic.trim()}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          🎯 Your assessment will include <strong>{aiSelectedTopics.length + (aiCustomTopic.trim() ? 1 : 0)} topics</strong> with <strong>{formData.numberOfQuestions || 'auto'} questions</strong> in <strong>{formData.language}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📝</div>
                      <p className="text-gray-500 text-sm">No topics selected yet. Choose topics above to continue.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex px-4 py-3 justify-end">
                <button
                  onClick={handleAITopicSelectionSubmit}
                  disabled={isLoading || (aiSelectedTopics.length === 0 && !aiCustomTopic.trim())}
                  className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#ee0b8c] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#d8096d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {isLoading ? 'Generating Assessment...' : 'Generate Assessment'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Teacher Login Page
  if (showTeacherLogin) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center items-center py-5">
            <div className="layout-content-container flex flex-col max-w-[500px] flex-1 justify-center">
              <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-[#ee0b8c] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-white">👨‍🏫</span>
                </div>
                <h1 className="text-[#181115] text-3xl font-bold leading-tight mb-2">
                  Teacher Access
                </h1>
                <p className="text-[#896178] text-base">
                  Enter your 4-digit teacher code to create assessments
                </p>
              </div>

              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-lg">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Teacher Code
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit code"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl focus:border-[#ee0b8c] focus:ring-0 text-center text-2xl font-mono tracking-widest"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTeacherLogin()
                      // Only allow numbers
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowTeacherLogin(false)
                      setTeacherCode('')
                    }}
                    className="flex-1 h-12 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTeacherLogin}
                    disabled={teacherCode.length !== 4}
                    className="flex-1 h-12 bg-[#ee0b8c] text-white rounded-xl font-bold hover:bg-[#d8096d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Access
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 text-center">
                    🔐 Secure teacher access - Only authorized educators can create assessments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Student Login Page  
  if (showStudentLogin) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-gradient-to-br from-blue-50 to-purple-50 group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center items-center py-5">
            <div className="layout-content-container flex flex-col max-w-[500px] flex-1 justify-center">
              <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-white">🎓</span>
                </div>
                <h1 className="text-[#181115] text-3xl font-bold leading-tight mb-2">
                  Join Assessment
                </h1>
                <p className="text-[#896178] text-base">
                  Enter the code shared by your teacher
                </p>
              </div>

              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-lg">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Assessment Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-character code"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 text-center text-2xl font-mono tracking-widest"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && studentCode.length === 6 && studentName.trim()) {
                        handleStudentLogin()
                      }
                    }}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && studentCode.length === 6 && studentName.trim()) {
                        handleStudentLogin()
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowStudentLogin(false)
                      setStudentCode('')
                      setStudentName('')
                    }}
                    className="flex-1 h-12 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStudentLogin}
                    disabled={isAuthenticating || studentCode.length !== 6 || !studentName.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAuthenticating ? 'Joining...' : 'Join Assessment'}
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 text-center">
                    ✨ Ready to show what you know? Enter the code and let's begin!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showModeSelection) {
    return (
      <div 
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-8 md:px-20 flex flex-1 justify-center items-center py-3">
            <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 justify-center">
              <div className="px-4 py-2 mb-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center justify-center px-4 py-2 text-[#896178] hover:text-[#181115] transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-3 px-4 py-4 text-center">
                <div className="flex flex-col gap-4">
                  <p className="text-[#896178] text-3xl font-medium leading-normal">Choose the mode that best fits your needs.</p>
                </div>
              </div>
              <div className="px-4 py-6 space-y-8">
                <div className="flex items-center justify-center gap-8 rounded-xl border-2 border-gray-200 shadow-sm bg-white hover:border-[#ee0b8c] hover:shadow-lg p-6 card-transition">
                  <div className="flex flex-[2_2_0px] flex-col gap-6 max-w-lg">
                    <div className="flex flex-col gap-2">
                      <p className="text-[#181115] text-2xl font-bold leading-tight">AI Mode</p>
                      <p className="text-[#896178] text-lg font-normal leading-relaxed">
                        Generate assessments quickly using AI. Simply input your requirements, and let the AI create a tailored assessment for you.
                      </p>
                    </div>
                    <button 
                      onClick={handleAIModeSelect}
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-8 flex-row-reverse bg-[#ee0b8c] text-white text-lg font-medium leading-normal w-fit hover:bg-[#d8096d] btn-transition">
                      <span className="truncate">Select</span>
                    </button>
                  </div>
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 overflow-hidden"
                    style={{
                      backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuBBE9O1TKt-nfXjCyVOzAxLc9N70wBhOoq02iMSbRT-f8YXnXWi1Q7BFqblD9nOuwMQJ3kPvPtbdqsFyjo4Hdu32RXE8lwkqdyVn7oihaWoPhE8oJixw76XFZNnu5DCZrCGvUu9k4bAJ7pkn8Sw8l4yE5pR_j7V5m3rwU0KpbN8S3KZYlQgICSjnbrLBxN34KHwFU7ibXMFS35K2pyehvu8CFn4WWlqx2rr_jNxhvpA98Pzh6y3hWA3gfxqsyPh5fMxF-6m9HwiWcN8\")"
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-center gap-8 rounded-xl border-2 border-gray-200 shadow-sm bg-white hover:border-[#ee0b8c] hover:shadow-lg p-6 card-transition">
                  <div className="flex flex-[2_2_0px] flex-col gap-6 max-w-lg">
                    <div className="flex flex-col gap-2">
                      <p className="text-[#181115] text-2xl font-bold leading-tight">Manual Mode</p>
                      <p className="text-[#896178] text-lg font-normal leading-relaxed">
                        Upload your textbook PDF and let AI analyze it to extract key topics. Select topics you want to assess and generate targeted questions.
                      </p>
                    </div>
                    <button 
                      onClick={handleManualModeSelect}
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-8 flex-row-reverse bg-[#ee0b8c] text-white text-lg font-medium leading-normal w-fit hover:bg-[#d8096d] btn-transition">
                      <span className="truncate">Select</span>
                    </button>
                  </div>
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 overflow-hidden"
                    style={{
                      backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuAZW9YY3sl_zW5g7gM81rxfr42pIDNPLoKOxCCqXDvnYMoKPujHL4bQdccmQHpT0pQWQ8sacyGlmzpeNIkIXRu56jxKNIyIqQEUY-3QrRc2qbf64bl3jDDBZVliLHun_4uFRF4YANNlixcje_TpMIs4pfKRz0u8dyLa9UGttzgCABALtwTLGbPen6QV11_OWtoANo7qoxd8bi1Voc7NUcnY9CL0z_nTNJJqzcMFtmLglvZyNArxIuhfw8xd_-d_etreOwYlelGU_6_L\")"
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-center gap-8 rounded-xl border-2 border-gray-200 shadow-sm bg-white hover:border-[#ee0b8c] hover:shadow-lg p-6 card-transition">
                  <div className="flex flex-[2_2_0px] flex-col gap-6 max-w-lg">
                    <div className="flex flex-col gap-2">
                      <p className="text-[#181115] text-2xl font-bold leading-tight">View Mode</p>
                      <p className="text-[#896178] text-lg font-normal leading-relaxed">
                        Monitor live assessments with real-time leaderboards. View student progress, manage active assessments, and terminate assessments when needed.
                      </p>
                    </div>
                    <button 
                      onClick={handleViewModeSelect}
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-8 flex-row-reverse bg-[#ee0b8c] text-white text-lg font-medium leading-normal w-fit hover:bg-[#d8096d] btn-transition">
                      <span className="truncate">Select</span>
                    </button>
                  </div>
                  <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-white text-4xl font-bold">📊</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Welcome page
  return (
    <div 
      className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: '"Be Vietnam Pro", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-8 md:px-20 flex flex-1 justify-center items-center py-3">
          <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 justify-center items-center text-center">
            <h1 className="text-[#181115] tracking-light text-[56px] font-bold leading-tight px-4 text-center pb-6 pt-4 fade-in">
              Welcome to Assessment Generator
            </h1>
            <p className="text-[#181115] text-2xl font-normal leading-relaxed pb-8 pt-1 px-4 text-center max-w-2xl fade-in">
              Create engaging assessments quickly and easily.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
              <button 
                onClick={handleCreateAssessment}
                className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 bg-[#ee0b8c] text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-[#d8096d] btn-transition"
              >
                <span className="mr-2">👨‍🏫</span>
                <span className="truncate">Create Assessment</span>
              </button>
              
              <button 
                onClick={() => setShowStudentLogin(true)}
                className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold leading-normal tracking-[0.015em] hover:from-blue-600 hover:to-purple-700 btn-transition"
              >
                <span className="mr-2">🎓</span>
                <span className="truncate">Take Assessment</span>
              </button>
            </div>
            
            <div className="mt-8 text-sm text-gray-500 space-y-1 fade-in">
              <p><strong>Teachers:</strong> Create and manage assessments with secure access</p>
              <p><strong>Students:</strong> Join assessments using the code from your teacher</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Student Login Modal */}
      {showStudentLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Join Assessment</h2>
              <button
                onClick={() => setShowStudentLogin(false)}
                className="text-gray-400 hover:text-gray-600 btn-transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 input-transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Code</label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  placeholder="Enter assessment code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg input-transition"
                  maxLength={8}
                />
              </div>
              
              <button
                onClick={handleStudentLogin}
                disabled={!studentCode.trim() || !studentName.trim() || isAuthenticating}
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed btn-transition"
              >
                {isAuthenticating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Joining...
                  </div>
                ) : (
                  'Join Assessment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Teacher Login Modal */}
      {showTeacherLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Teacher Login</h2>
              <button
                onClick={() => setShowTeacherLogin(false)}
                className="text-gray-400 hover:text-gray-600 btn-transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teacher Access Code</label>
                <input
                  type="password"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  placeholder="Enter teacher access code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ee0b8c] font-mono text-center text-lg input-transition"
                  onKeyDown={(e) => e.key === 'Enter' && handleTeacherLogin()}
                />
                <p className="text-xs text-gray-500 mt-1">Default code: 1937</p>
              </div>
              
              <button
                onClick={handleTeacherLogin}
                className="w-full bg-[#ee0b8c] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#d8096d] btn-transition"
              >
                Access Teacher Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
