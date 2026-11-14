# TengriSpacers — Project TengriSpacers

- 수상: Global Nominee, Global Finalist
- 챌린지: Through the Radar Looking Glass: Revealing Earth Processes with SAR
- 지역: Bishkek, Kyrgyzstan
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/tengrispacers/
- 데모(영상·슬라이드): https://docs.google.com/presentation/d/1AIfWU3BVx1ATqtZxYBDd6etmI6C5fuZK7UFDtBfDY9Y/edit?usp=sharing
- 프로젝트(사이트·저장소): https://github.com/Apelsinovich/GlacierSAR-Kyrgyzstan

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

Like Alice in Wonderland, let’s travel down the rabbit hole to reveal a world that looks like our planet Earth… but not quite! Using synthetic aperture radar (SAR), we can image the world by emitting radar pulses toward Earth and recording the energy that is reflected back after the signals interact with Earth's surface. Your challenge is to download multi-frequency or multi-polarization SAR data for an interesting study area of your choice –e.g., your hometown, a tropical wetland, ice sheet, forest wildfire, flooded neighborhood, volcano eruption, etc.—and use that data to develop hypotheses about the physical drivers operating there. (Earth Science Division)

## About the team

Our team is an enthusiastic mix of people who simply want to participate, learn, and bring value to the community. Each of us already has our own background and life experience.
I’m Dmitrii, the one who started this team to relive the spirit of a hackathon, to touch the future, and to leave a small trace for ourselves and for humanity.
I earned my Master’s degree in Mechanical Engineering about 10 years ago. By education I am design engineer and I like TRIZ. Now I work in software development as a Performance Engineer. I’m passionate about space, planets, and new technologies, and I love to imagine how we can explore and build beyond Earth.

## Project summary

What we made:
- An APP (no UI) that shows how Kyrgyzstan’s glaciers are melting now - and how they may change next. Built for water, energy, and safety planning.

Why it matters
- Ice is a Kyrgyzstan’s Gold
Glaciers power drinking water, farming, and hydropower. We knew they’re melting - now we quantify how fast and where first for Ala-Archa and Bishkek. 

The science (simple)
- We use SAR (radar from space) that works through clouds and at night. We process Sentinel-1 time series to get change maps, trends, and confidence bands. A trained LSTM (Long Short-Term Memory) model adds short-term forecasts.

## Project details

What we made
An APP (no UI) that shows how Kyrgyzstan’s glaciers are melting now - and how they may change next. Built for water, energy, and safety planning.
Why it matters
Glaciers power drinking water, farming, and hydropower. We knew they’re melting - now we quantify how fast and where first for Ala-Archa and Bishkek.
The science (simple)
We use SAR (radar from space) that works through clouds and at night. We process Sentinel-1 time series to get change maps, trends, and confidence bands. A trained LSTM (Long Short-Term Memory) model adds short-term forecasts.
How it works
- Ingest Sentinel-1 scenes → clean, align, terrain-correct.
- Compute backscatter/coherence change and basic masks (elevation/aspect).
- Output maps, charts, % loss, and a GLOF watchlist.
Architecture (no frontend)
- Python-only toolkit: a set of scripts/modules, each responsible for its own step (download, preprocess, change metrics, ML forecast, export).
- Run via CLI with a simple config (AOI, dates).
- Outputs: GeoTIFF/GeoJSON/CSV/PNG ready for QGIS and reports.
- No web frontend—fast, reproducible, offline-friendly.
Results: Golubin Glacier (Ala-Archa Gorge)
- 2016–2025: glacier tongue shrank by ~1–2% (tongue section only).
- Forecast to 2050 (pessimistic): up to ~30% loss vs 2015.
- Note: real loss is higher due to thinning and side retreat. We’ll refine with more SAR and improved ML.
Local impact
- Water & energy: plan for seasonal shortages; smarter hydropower ops.
- Hazards: target glacial lakes / GLOF watch zones.
- Scales up: same pipeline runs on other Ala-Archa glaciers and nearby basins.
Tech stack
Python (NumPy, Pandas, SciPy, rasterio, Matplotlib), Sentinel-1 SAR, QGIS, LSTM ML, and the Tengri Analysis & Processing scripts/modules (no frontend).

## NASA data

[Alaska Satellite Facility (ASF) Data Search](https://search.asf.alaska.edu/)
[NASA Earthdata Search](https://search.earthdata.nasa.gov/search)
[SAR StoryMaps](https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/)

## Other references

[https://nakarte.me/#m=12/42.49721/74.48909&l=T&nktl=TkSF-r2S7YE1RMks1v2Ing](https://nakarte.me/#m=12/42.49721/74.48909&l=T&nktl=TkSF-r2S7YE1RMks1v2Ing)
[https://step.esa.int/main/download/snap-download/](https://step.esa.int/main/download/snap-download/)
[ChatGPT](https://chatgpt.com/)
[Copilot](https://copilot.microsoft.com/)
[Glacier Research](https://www.researchgate.net/publication/251494315_Classification_and_snow_line_detection_for_glacial_areas_using_the_polarimetric_SAR_image)

## Use of AI

Use of AI
- Ideation & pre-analysis: ChatGPT - distilled research questions, clarified methods, drafted briefs and presentation
- Coding assistance: GitHub Copilot - boilerplate, refactors, quick snippets for Rasterio/GDAL, plotting, and CLI.
