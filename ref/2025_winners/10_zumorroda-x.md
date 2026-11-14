# Zumorroda-X — Henry's Farm Adventures

- 수상: Art & Technology, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: NASA Farm Navigators: Using NASA Data Exploration in Agriculture
- 지역: Cairo, Egypt
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/zumorroda-x/
- 데모(영상·슬라이드): https://drive.google.com/file/d/1P-sOTecG2uO2eLu3UabS0PXWLYUKaF4p/view?usp=sharing
- 프로젝트(사이트·저장소): https://henrysfarmadventures.vercel.app/

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

The agriculture community faces the challenge of integrating technology and data to enhance sustainable farming practices. Simulating key farming activities like fertilizing, irrigating, and livestock management using real-world NASA satellite imagery and climate data can enable better understanding of the impacts of these variables on crop production. Your challenge is to create an engaging educational game that effectively utilizes NASA’s open data sets to simulate farming scenarios and enables players to learn how this data can inform innovative, sustainable, agricultural methods. (Earth Science Division)

## About the team

We, the proud residents of Planet Zumorroda, have observed that Earth is running low on resources and threatening the harmony of the solar system. Naturally, we decided to step in — not with spaceships or superpowers, but with our most powerful weapon: our programming skills! 
We are computer engineering students from Egypt, studying at the German University in Cairo (GUC), and as a team of girls on a mission, we’re here to code solutions that could save the planet (and maybe impress a few aliens along the way).

## Project summary

Welcome to Henry’s Farm Adventure!
For the NASA Farm Navigators Challenge, we didn’t just build a game, we built a global farming quest powered by space data.

Meet Henry, a struggling farmer whose crops keep failing. Instead of giving up, he sets off on an epic journey around the world, guided by real NASA satellite data. Along the way, he meets farmers on the frontlines of climate change, like Bilal in Pakistan, fighting the floods of 2022, and Ramesh in India, surviving brutal heatwaves.

But this isn’t just a story, it’s you in action. As the player, you step into Henry’s boots and take on mini-games that transform serious challenges into hands-on missions, by solving them, you learn how farmers adapt in real life, how NASA’s data reveals these risks, and how communities can fight back against climate change.

This is NASA data like you’ve never seen it before, not in charts or reports, but in the palm of your hand, as a playful, high-stakes adventure.

## Project details

Zumorroda-X's Project Solution
Henry’s Farm Adventure is an educational adventure game designed to teach players how environmental challenges affect agriculture turning real NASA satellite data into an interactive story-driven game. Players travel with Henry, meet farmers worldwide, and use hands-on mini games to solve climate challenges making science both fun and accessible.
How Does Our Solution Work
In the game, Henry is a farmer facing repeated crop failures, and he sets out on a journey to uncover the environmental challenges threatening agriculture as floods, heatwaves, droughts, and soil salinization. Along the way, Henry meets farmers from different countries who share their experiences and solutions, helping him piece together which challenge might also be affecting his own farm.
- Heatwaves (India, 2021):
Henry visits Ramesh, a farmer in India, who experienced the devastating 2021 extreme heat crisis. Ramesh shows Henry NASA's extreme heat map, in which player can see India suffering badly from heat in addition to other areas, then teaches Henry about techniques farmers use to protect crops from heats such as shade nets and mulching, after that Ramesh tests player with a quiz game.
- Floods (Pakistan, 2022):
In Pakistan, Henry meets Bilal, who describes how the historic 2022 floods devastated farmland. Using an image slider, Henry compares NASA satellite images of Pakistan before and after the flood, witnessing the disaster’s true scale. In the gameplay, players help Henry protect farms:
  Level 1: Navigate Henry to place straw in the areas hit by the heaviest rainfall.
  Level 2: Install drainage pipes to save waterlogged fields.                                                                                          Through this, players learn how farmers can adapt and reduce flood damage.
- Soil Salinization (Egypt 2021):
Next, Henry travels to Egypt to meet Mohamed, who shows him how irrigation practices are affecting farmland. Henry learns about soil salinization and explores live NASA satellite data that reveals how salt buildup reduces soil productivity over time. In the gameplay, players are given a time limit to save the farm from salinization by:
  Task: Implementing drip irrigation to revive the salty plants.
Through this, players discover how efficient irrigation methods can protect soil health.
- Drought (United States):
Henry also visits the United States, where he meets an American farmer "Sam" struggling with drought. He learns how drought affects soil health and how scientists use vegetation indexes from satellite imagery to measure water stress and monitor crops.
- Crops Management (Brazil):
Finally, Henry visits João da Silva, a farmer and innovator. João explains how increasing CO₂ levels can sometimes stimulate plant growth. He also emphasizes the importance of adaptation to climate change, using fertilizers wisely, adjusting planting times, and adopting new techniques. João then reveals his AI model, which predicts which crops will survive based on country, year, CO₂ levels, and adaptation strategies. To make it hands-on, he shows Henry a NASA food supply table and turns it into a matching game, where Henry pairs crops with the right conditions, learning how to choose the best crops for each scenario.
When the player completes all the challenges, the farmers gather together for a lively catch-up!
The game benefits 
farmers, students, and the wider community by:
- Educating players on environmental disasters and their impact on crops.
- Demonstrating practical, data-driven strategies for sustainable farming.
- Bridging the gap between NASA’s datasets and real-world agricultural practices in a fun, engaging way.
Our goal
To make NASA’s open data more accessible, helping communities prepare for climate-related agricultural challenges while fostering awareness of global environmental issues. Despite our attempt to reveal agricultural difficulties globally, our game is limited to certain issues and didn't mention other calamities faced by other countries such as wildfires.
Tools and Technologies Used
Coding Languages:
- Python → for the ML model. 
- JavaScript (with Phaser) → for 2D game development.
Data Sources:
- NASA real-time datasets → for environmental and agricultural data. Through NASA’s data, we were able to access Landsat images that allowed us to compare countries' farmlands before and after enduring environmental issues, that go back to a farmland in 1984 and compare it with the same area about 17 years later. Furthermore, NASA provides data that allows us to check recent NDVI (Natural differentiation vegetation index) of different countries, which was integrated in our games using APIs. In addition, an artificial intelligence model was used and integrated with the NASA data to highlight the significance of CO2 on crops, and adaptation level on different types of crops. Finally, data was extracted from NASA’s US drought monitor, displayed in a map, and utilized for learning purposes in the game.
Character Design:
- Piskel → for creating and editing pixel-style images and sprites.
GitHub Link

## NASA data

[NASA Earth Observatory](https://earthobservatory.nasa.gov/images/149183/the-nile-deltas-disappearing-farmland)
[NASA Harvest](https://glam.nasaharvest.org/explore)
[Extreme Heat Data Pathfinder](https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-sdei-gehe-1.00)
[Floods Data Pathfinder](https://search.earthdata.nasa.gov/search/granules?p=C2723754847-GES_DISC&pg[0][v]=f&pg[0][gsk]=-start_date&q=IMERG&sb[0]=67.9871%2C27.97529%2C67.9871%2C27.97529&qt=2022-08-01T00%3A00%3A00.000Z%2C2022-08-02T23%3A59%3A59.999Z&tl=1321577150.739!5!!&lat=26.55266903810636&long=72.28557364181081&zoom=4.335181457135409)
[Extreme Heat Estimates](https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-sdei-gehe-1.00)
[NTRS - NASA Technical Reports Server](https://ntrs.nasa.gov/citations/20210022691?utm_source=chatgpt.com)
[Agriculture and Water Management Pathfinder](https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-cropclim-giss-db-1.00)
[U.S. Drought Monitor](https://droughtmonitor.unl.edu/)

## Other references

[Earth Observing System](https://eos.com/blog/soil-salinization/)
[How Drip Irrigation Saves Water](https://www.twl-irrigation.com/how-drip-irrigation-saves-water/)

## Use of AI

We used AI tools as a supportive resource throughout the project. Specifically:
- Design: When brainstorming creative design ideas, we used AI to explore possible approaches.
- Implementation Guidance: When uncertain about how to implement specific features, we prompted AI for coding suggestions and design best practices.
- Debugging Assistance: During development, AI was used to help identify, explain, and resolve coding errors.
