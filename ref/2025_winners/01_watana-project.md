# QUEÑARIS — Queñaris

- 수상: Local Impact, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: BloomWatch: An Earth Observation Application for Global Flowering Phenology
- 지역: Arequipa, Peru
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/watana-project/
- 데모(영상·슬라이드): https://youtu.be/QvbLhHqKULc
- 프로젝트(사이트·저장소): https://quenaris.vercel.app

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

Witness the pulse of life across our planet! From season to season and year to year, Earth’s vegetation is constantly changing, providing critical information on plant species, crops, seasonal effects, pollen sources, and changes in plant phenology (the relationship between seasonal changes and climate and biological phenomena in plants). Your challenge is to harness the power of NASA Earth observations to create a dynamic visual tool that displays and/or detects plant blooming events around the globe—just like pollinators do–and that advances solutions for monitoring, predicting, or managing vegetation. (Earth Science Division)

## About the team

We chose the NASA BloomWatch challenge — an Earth observation application for tracking flowering phenology — because we are interested in monitoring the phenology of Polylepis forests (Queñuales) to develop an intelligent reforestation system. Queñuales are native trees that help conserve water sources and create microclimates that promote biodiversity of plant and animal species, helping to address water scarcity in natural springs used for agriculture and human consumption.

## Project summary

We developed Queñaris, a platform for the smart reforestation of queñua forests. It is a comprehensive system that combines the use of native microorganisms, NASA satellite data, drones, and artificial intelligence to accelerate tree growth, identify the best areas for reforestation, and monitor the health of the ecosystem.
The project addresses critical water scarcity in Arequipa, caused by the degradation of queñua forests, which are vital for water retention. While traditional reforestation methods are slow and not very scalable, our platform uses technology to create a massive and efficient strategy. By digitizing the terrain and analyzing phenological data, we can make evidence-based decisions to maximize the impact of each tree planted.
This is crucial because the loss of queñua forests has a direct impact on water security in Arequipa. The drastic reduction in spring flow (from 14 L/s to 0 in days) threatens the water supply for human consumption, agribusiness (28.5%), energy (67.7%), and mining (11%), creating the risk of food crises and social conflicts. Restoring these forests means restoring the water balance and ensuring a sustainable future for the region.

## Project details

What exactly does it do? 
Queñaris is a decision support system for large-scale reforestation. Specifically:
- It digitizes and analyzes high Andean ecosystems using drones and satellite data.
- It identifies optimal areas for reforestation based on plant health indicators, soil moisture, and other key variables.
- It accelerates the growth and survival rate of queñua seedlings (to 25 cm/year and >80% survival) through the use of native microorganisms.
- It monitors the phenology and health of reforested forests over time to ensure their sustainability.
- Centralizes all information on a web platform so that communities and organizations can plan and execute massive reforestation campaigns.
How does it work?
The process follows a structured workflow:
- Geospatial Digitization: Drone flights are conducted to capture high-resolution images and georeference the area of interest, creating a detailed orthomosaic.
- Satellite Data Analysis: Data from NASA's LP DAAC is used to calculate vegetation indices (NDVI, EVI, NDMI, etc.) that measure the health, greenness, and moisture content of existing vegetation.
- AI Integration and Modeling: Drone and satellite data are integrated. An artificial intelligence model analyzes this combined information to identify the best areas and conditions for planting.
- Biological Preparation: In nurseries, the 5,000 queñua seedlings are strengthened with native microorganisms (mycorrhizae, Trichoderma) to double their growth rate and resistance.
- Execution and Monitoring: Massive reforestation campaigns are carried out in the identified areas. The platform continues to monitor progress in the short, medium, and long term.
What benefits does it have?
Environmental: Restores a key ecosystem, combats desertification, increases water retention (each tree can retain up to 20 liters per day), and promotes water recharge in springs and wetlands.
Social: Ensures a constant water supply for hundreds of local families and communities, reducing the risk of social conflicts due to water scarcity.
Economic: Increases the efficiency and success of reforestation projects, protecting water-dependent industries such as agriculture, energy, and mining. Our business model is based on offering processing and monitoring services per hectare, ensuring the sustainability of the project.
What do you hope to achieve?
In the short term, our goal is to carry out a first large-scale reforestation project in December with the 5,000 seedlings we already have ready, validating our model in the field. In the long term, we seek to reverse the degradation of the 100,000 hectares of queñua forests that historically existed, ensuring water security in the Arequipa region and creating a smart reforestation model that can be replicated in other Andean ecosystems.

What tools, coding languages, hardware, or software did you use to develop your project?
- Development Tools: Visual Studio Code, Git, Node.js, npm/yarn, Docker, Loveable( initial template)
- Infrastructure and Technological Hosting: Vercel (Frontend), Google AI Studio (Gemini API), GitHub Pages, GitHub Cloud, Cloudinary (Image Storage)
- Backend & API: Django 5.0.6, Django REST Framework, PostgreSQL with GeoDjango, Redis, Celery, Gunicorn
- Frontend & UI: React 18, TypeScript, Vite, HTML5, CSS3, TailwindCSS, Shadcn/UI, Radix UI Components
- Programming Languages: Python, TypeScript, JavaScript, SQL
- AI & Machine Learning: Google Gemini Pro API 2.5, Geospatial Analysis, Rasterio, GeoPandas
- Data Processing & Geospatial: Pillow, Rasterio, GeoPandas, Shapely, GDAL, Fiona, EarthAccess (NASA/USGS), Metashape Agisoft, QGIS
- Async Tasks & Caching: Celery, Redis, Django Channels, Django Celery Beat
- Software & Design: QGIS (geospatial processing), Google Colab (AI prototyping), Adobe Premier
- Hardware: DJI Matrice 4 Series Drone, Development and analysis computers
- Data Sources: Satellite imagery (NASA/USGS), Aerial drone georeferenced orthomosaic, GPS metadata, HDF5 datasets
Plus:(Workflows, Drone-Contoller and Seedlings for reforestation)

## NASA data

[NDVI, EVI, SAVI, MSAVI, NDMI, NDWI, NBR and NBR2](https://www.earthdata.nasa.gov/data/catalog/lpcloud-hlsl30-vi-2.0)
[NASA Earthdata Main Portal](https://earthdata.nasa.gov/)
[Fire Information for Resource Management System (FIRMS)](https://firms.modaps.eosdis.nasa.gov/)
[Level-1 and Atmosphere Archive & Distribution System (LAADS)](https://ladsweb.modaps.eosdis.nasa.gov/)
[FIRMS API Documentation](https://firms.modaps.eosdis.nasa.gov/api/)
[FIRMS Academy - Learning Resources](https://firms.modaps.eosdis.nasa.gov/academy)
[FIRMS API Data Availability](https://firms.modaps.eosdis.nasa.gov/api/data_availability/)
[LAADS DAAC Tools and Services](https://ladsweb.modaps.eosdis.nasa.gov/tools-and-services/)
[Earthdata CMR Search API](https://cmr.earthdata.nasa.gov/search)
[MODIS Vegetation Index Products - NASA Goddard](https://modis-land.gsfc.nasa.gov/vi.html)
[FIRMS NBR Documentation NASA](https://firms.modaps.eosdis.nasa.gov/usfs/active_fire/)
[MODIS Product Characterization](https://modis.gsfc.nasa.gov/data/dataprod/)
[NASA ARSET Training](https://appliedsciences.nasa.gov/what-we-do/capacity-building/arset)
[NASA Earthdata Search](https://search.earthdata.nasa.gov/search)
[MODIS Products on Earthdata](https://search.earthdata.nasa.gov/search?q=MOD13)

## Other references

[USGS EarthExplorer](https://earthexplorer.usgs.gov/)
[ESA Earth Online Portal](https://earth.esa.int/eogateway)
[Landsat NDVI Technical Guide - USGS](https://www.usgs.gov/landsat-missions/landsat-normalized-difference-vegetation-index)
[Soil Adjusted Vegetation Index - USGS](https://www.usgs.gov/landsat-missions/landsat-soil-adjusted-vegetation-index)
[Normalized Burn Ratio - USGS](https://www.usgs.gov/landsat-missions/landsat-normalized-burn-ratio)
[MTBS Project (Monitoring Trends in Burn Severity)](https://www.mtbs.gov/)
[Landsat Vegetation Index Algorithms](https://www.usgs.gov/landsat-missions/landsat-science-products)
[earthaccess Python Documentation](https://earthaccess.readthedocs.io/en/latest/user-reference/api/api/)
[Local Notices of Problematic in Arequipa( Spanish)](https://docs.google.com/document/d/1TjPZCqN4fGiKoKLGEfPeMbBTpBPMHAyhZgT6rMLbs0E/edit?usp=sharing)

## Use of AI

- Gemini AI: Intelligent forest analysis to determine the reforestation potential of Polylepis (queñual) trees through metadata produced by a drone-collected orthomosaic.- Counting visible Polylepis trees
- Forest health assessment using NDVI (Normalized Difference Vegetation Index)
- Topographical analysis of slopes
- Detection of water resources
- Intelligent conservation recommendations

- ChatGPT: Initial analysis of the environmental setting, image generation, writing, and translations.
- Claude: Python code generation for Satellite Data Analysis
- Perplexity: Information research and data analysis supported by sources.
- Deepseek and Copilot: Code reviews and error resolution.
- Loveable IA Tool: To generate an initial frontend template to accelerate the project.
