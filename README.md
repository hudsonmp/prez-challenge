# 📚 Lesson Plan Generator

An AI-powered web application that transforms textbook PDFs into comprehensive, interactive lesson plans for teachers using OpenAI's GPT-4 technology.

## 🌟 Features

- **PDF Upload**: Drag and drop textbook PDFs for analysis
- **Customizable Duration**: Generate lesson plans for 7, 14, or 30 days
- **Teacher Prompts**: Add custom instructions and requirements
- **Interactive Calendar**: View lesson plans in a monthly calendar format
- **Comprehensive Lesson Plans**: Each day includes:
  - Student notes for notebooks
  - Review questions
  - Interactive mini-quizzes with answer keys
  - Educational standards references
  - Chapter references
- **Real-time Processing**: Loading indicators during AI processing
- **Modern UI**: Built with React, Next.js, and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd prez-challenge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure OpenAI API key:**
   - Open `.env.local`
   - Replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Step 1: Upload Your Textbook
- Drag and drop a PDF file into the upload area
- Or click to browse and select a PDF file
- Supported format: PDF files only

### Step 2: Configure Your Lesson Plan
- **Duration**: Choose between 7, 14, or 30 days
- **Additional Instructions**: Add any specific requirements, learning objectives, or customizations

### Step 3: Generate Lesson Plans
- Click "Generate Lesson Plans"
- Wait for AI processing (this may take a few minutes)
- The system will analyze your textbook and create comprehensive lesson plans

### Step 4: View and Use Your Lesson Plans
- **Calendar View**: See all your lesson plans in a monthly calendar
- **Daily Lessons**: Click on any green date to view that day's lesson plan
- **Interactive Quizzes**: Students can take self-graded mini-quizzes
- **Review Questions**: Quizlet-style questions for study and review

## 🎯 Lesson Plan Structure

Each generated lesson plan includes:

- **📋 Title**: Clear, descriptive lesson title
- **📅 Date & Duration**: Scheduled date and estimated time (~1 hour)
- **📝 Student Notes**: Key points for students to write in their notebooks
- **❓ Review Questions**: Comprehension questions based on textbook content
- **🎯 Mini Quiz**: Interactive multiple-choice questions with explanations
- **📖 Standards**: Educational standards and chapter references

## 🛠️ Technical Details

### Tech Stack
- **Frontend**: React 18, Next.js 14, TypeScript
- **Styling**: Tailwind CSS
- **Calendar**: React Calendar
- **File Upload**: React Dropzone
- **AI**: OpenAI GPT-4o-mini
- **PDF Processing**: pdf-parse

### Project Structure
```
prez-challenge/
├── app/
│   ├── api/generate-lesson-plan/route.ts  # API endpoint for AI processing
│   ├── globals.css                        # Global styles + calendar styling
│   ├── layout.tsx                         # Root layout component
│   └── page.tsx                          # Main application page
├── .env.local                            # Environment variables (API keys)
├── package.json                          # Dependencies and scripts
├── tailwind.config.js                    # Tailwind CSS configuration
└── README.md                             # This file
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file with:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 📝 Notes

- **PDF Size**: Large PDFs are automatically truncated to stay within AI token limits
- **Processing Time**: Complex textbooks may take 2-5 minutes to process
- **API Costs**: Each lesson plan generation uses OpenAI API credits
- **Browser Support**: Works best in modern browsers (Chrome, Firefox, Safari, Edge)

## 🚨 Important Setup Notes

1. **API Key Security**: Never commit your `.env.local` file to version control
2. **File Size Limits**: The app handles PDFs up to 50MB
3. **Internet Required**: Active internet connection needed for AI processing

## 🎓 Perfect for Educators

This tool is designed specifically for teachers who want to:
- Save time creating lesson plans
- Ensure comprehensive coverage of textbook material
- Provide interactive learning experiences
- Generate standardized assessments
- Create structured, professional lesson plans

## 📞 Support

If you encounter any issues:
1. Check that your OpenAI API key is correctly configured
2. Ensure your PDF file is not corrupted
3. Verify you have a stable internet connection
4. Check the browser console for error messages

---

**Happy Teaching! 🍎**
