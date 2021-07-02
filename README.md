# Deno Quiz

This is a multi-player quiz. You can create your quiz in JSON and load it into the program.
This software is easily deployable with fly.io or Docker.

Features:

- Multiple choices questions with one or more correct answers
- In between screens with a youtube video or an image
- Password protection on quizzes
- Images within quizes are loaded via URLs
- When having connectivity problems are it auto re-connects
- You can have images inside the choices
- You can have an image header for a question
- Custom end screens with a video
  
## Tech

This is built with TypeScript and WebSockets.
The backend uses Deno.
It has a DockerFile.