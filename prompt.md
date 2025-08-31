We want to create a code that scans the entire textbook and utilize AI to extract key terms and terminology to create a lesson curricculum for teachers to use on a day-to-day basis. 

Create a frontend using React and next.js that takes an entire inputted textbook from a PDF upload, sends to ChatGPT via an API call, and returns a lesson plan for teachers. 

Frontend:
It is a website that will run in localhost. It will be one page, and this page will house the functionality. There is a box in the middle for PDF upload where the user can press and upload a PDF stored locally. Underneath there is a dropdown box where users can select they want for a lesson plan (Multiple choice [7, 14, 30]). The input value from the dropdown box provides information to the API call about how many days the user wants for a lesson plan. Along with this, there is a prompt input section where teachers can write any other information they would like, which will also be transmitted along via API. Underneath the prompt, there will be a submit button. Once clicked, this will trigger the API to transmit the PDF, prompt, and multiple choice to the ChatGPT API. 

While the user is wating for the response, the user should see a spinning loading bar.

On the OpenAI Chatgpt server side, after it recieves the PDF, MCQ, and prompt, it should first analyze the PDF. Then, read the prompt and the answer to the MCQ. The primary goal is to create a lesson plan and base it off the rcontent of the textbook but customize it tp the MCQ and the prompt. 

The lesson plan should concist of the following for each day:
- Notes for students to write down in their notebooks
- Title
- Review Questions
- Mini Quiz (answer key at the end)
- Reference the standards of the textbook
- Date
- Duration (target around 1 hour)
- The MCQs and revuew questions should be directly from the textbook and the textbook answer key

ChatGPT should output a JSON file with the above information that will be posted to the frontend and will be displayed via our graphical interface. We should use gpt-5-mini for the model. 

Once the JSON is returned by the API, the JSON should correspond to the following frontend (React with Next.js):
- Calendar that contains the entire month with each day where you can click on the day and view the events from the returned JSON file.
- Lesson plan component: Self graded mini-quiz (MCQ only) that is interactive
- No authentication
- Sample review questions like Quizlet
- Refrence textbook chapters and standards