# Twisters — SkySense

- 수상: Best Use of Technology, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: Will It Rain On My Parade?
- 지역: Monterrey, Mexico
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/twisters/
- 데모(영상·슬라이드): https://drive.google.com/file/d/1LDaKDOHBKm3PxC03xcEJGfdybsVEwOTf/view?usp=sharing
- 프로젝트(사이트·저장소): https://skysense.surf/

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

If you’re planning an outdoor event—like a vacation, a hike on a trail, or fishing on a lake—it would be good to know the chances of adverse weather for the time and location you are considering. There are many types of Earth observation data that can provide information on weather conditions for a particular location and day of the year. Your challenge is to construct an app with a personalized interface that enables users to conduct a customized query to tell them the likelihood of “very hot,” “very cold,” “very windy,” “very wet,” or “very uncomfortable” conditions for the location and time they specify. (Earth Science Division)

## About the team

Twisters is a passionate and versatile team, driven by creativity, collaboration, and innovation.

## Project summary

SkySense is a web-app platform that uses NASA Earth observation data and AI analysis to provide ultra-local and personalized weather predictions. Our goal is to help users plan outdoor events, sports, and travel with greater accuracy and confidence. By integrating NASA, Google, and Gemini APIs, SkySense analyzes multiple weather variables such as rain, wind, temperature, humidity, and visibility to generate real-time risk assessments and suggest the safest time windows for activities. 
The platform also features TwisterBot, a smart conversational assistant that delivers adaptive alerts, reminders, and weather insights directly to the user.
SkySense addresses the challenge of unreliable, generic forecasts by making meteorological data understandable and actionable. It would empower individuals and organizations to make informed decisions, reduce weather-related risks, and transform uncertainty into confidence.

## Project details

SkySense was developed using React.js for a dynamic and responsive front-end experience, supported by Firebase for user authentication, cloud storage, and hosting. It integrates Google APIs to handle calendar synchronization, notifications, and secure Google sign-ins. For environmental intelligence, it connects to NASA’s POWER Data Access Viewer, NASA POWER API, and Open-Meteo datasets, which provide real-time data on temperature, humidity, wind speed, radiation, and precipitation. The predictive model processes this information to generate comfort-based insights, while the Gemini API powers the conversational assistant, enabling natural interaction with users. The design was created in Figma, ensuring a glassy, minimal, and accessible interface across all devices. Together, these technologies make SkySense a seamless bridge between AI, design, and space-based data.

## NASA data

[NASA POWER API (Prediction Of Worldwide Energy Resources)](https://power.larc.nasa.gov/api/temporal/daily/point)
[NASA Earthdata](https://earthdata.nasa.gov/)
[Giovanni](https://giovanni.gsfc.nasa.gov/)
[GES DISC](https://disc.gsfc.nasa.gov/)

## Other references

[Supabase](https://druhaicsjoxgyuhqavcb.supabase.co)
[Google APIs](https://accounts.google.com/gsi/client)
[Google APIs](https://www.googleapis.com/oauth2/v3/userinfo)
[Google APIs](https://www.googleapis.com/calendar/v3/)
[OpenStreetMap Tile Server](https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png)
[OpenStreetMap Nominatim API](https://nominatim.openstreetmap.org/search)
[Open-Meteo API](https://api.open-meteo.com/v1/forecast)

## Use of AI

We developed all the core code of our project ourselves. However, we used AI tools to accelerate some parts of the workflow:
Code assistance: We built the main logic and structure of the application, but we used Lovable AI to help us organize the code, protect API keys, and speed up the deployment of the web app.
Design integration: Our application designs were originally created in Figma by us, and we used Builder.io (with AI-assisted features) to convert them more efficiently into code. Builder.io metadata remains in the code, but the tool was only used to accelerate the implementation. It did not generate the project from scratch.
Visuals: Some SVG icons were generated with ChatGPT, following the specific design guidelines we set, to enhance the visual quality of the app. Our logo was designed by us, but ChatGPT assisted us in transforming it into a pixel art version.
In short, AI was not used to replace our work but rather to accelerate the process and improve quality. All key elements such as the code logic, structure, and design concepts were originally created by our team.
Drive Images: https://drive.google.com/drive/folders/17wDotg7yFPKXvwFFy9u2xJL3CvUaFaVk?usp=sharing
