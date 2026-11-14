# SpaceGenes+ — SpaceGenes+: A Synergy Dashboard for Molecular Space Health

- 수상: Best Use of Science, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: Build a Space Biology Knowledge Engine
- 지역: Berlin, Germany
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/spacegenes/
- 데모(영상·슬라이드): https://drive.google.com/file/d/1nUliPCPSrPXtbi7LartC2WfROIni7pFv/view?usp=sharing
- 프로젝트(사이트·저장소): https://spacegenes-plus.framer.website/

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

Enable a new era of human space exploration! NASA has been performing biology experiments in space for decades, generating a tremendous amount of information that will need to be considered as humans prepare to revisit the Moon and explore Mars. Although this knowledge is publicly available, it can be difficult for potential users to find information that pertains to their specific interests. Your challenge is to build a dynamic dashboard that leverages artificial intelligence (AI), knowledge graphs, and/or other tools to summarize a set of NASA bioscience publications and enables users to explore the impacts and results of the experiments these publications describe. (Earth Science Division)

## About the team

Hi! I'm a UX designer with a healthtech/fintech background, joining solo. I'm building a smart, interactive tool for the “Build a Space Biology Knowledge Engine” challenge to explore how life responds to space. Looking for teammates into biology, bioinformatics, coding (Python/Streamlit), or AI/data viz. No experts needed—just curiosity and creativity. Let’s build something clear, useful, and exciting!

## Project summary

SpaceGenes+ is an interactive dashboard designed to uncover synergistic gene expression changes in space biology: specifically, how radiation and microgravity together impact astronaut health at the molecular level. Using real NASA GeneLab datasets (OSD-288 Transcriptome analysis of murine spleen in space), our tool identifies genes like TP53, ATM, and GADD45A that exhibit non-additive responses when exposed to multiple spaceflight stressors.

This dashboard empowers researchers, drug developers, and mission planners to quickly visualize synergy effects across different conditions: radiation only, microgravity only, and combined spaceflight. In future, users will be able to filter by organ system, biological function, and stressor type, enabling faster hypothesis generation and precision targeting for space medicine and cancer biology.

SpaceGenes+ addresses a major challenge: most space omics tools treat stressors in isolation. Yet, in real missions, astronauts experience overlapping biological stress. Recognizing these hidden molecular interactions is essential for developing protective measures and advancing long-duration spaceflight.

## Project details

SpaceGenes+ is a web-based interactive dashboard designed to reveal synergistic gene expression changes in response to combined spaceflight stressors—namely radiation and microgravity. Traditionally, biological data from space studies examine these stressors in isolation. Our platform uniquely surfaces how they interact to amplify cellular risks like DNA damage, immune suppression, and cancer susceptibility.
How it works:
SpaceGenes+ ingests transcriptomic datasets (currently featuring NASA GeneLab OSD-288) and calculates synergy scores based on fold-change in gene expression across conditions. It detects when gene activation under combined stress exceeds the sum of individual effects—flagging key "synergy genes" using an automated formula.
Key Benefits & Impact:
- Helps space biologists prioritize genes for further study.
- Aids drug developers in finding therapeutic targets.
- Supports NASA planners in understanding organ-level risks for long-duration missions.
- Offers visual, non-code-based access to large genomics datasets.
Tools & Technologies:
- Framer: front-end website and animation
- Bolt: dashboard and data visualization engine
- Python (Pandas, NumPy): for preprocessing and synergy calculations
- Figma/FigJam: design and prototyping
- Google Sheets/CSV: data curation
Creative Elements:
- Built to be researcher-friendly with exportable visuals,
- Includes a compelling story that connects molecular insights to real astronaut risks,
- Uses an interface that simplifies complex bioinformatics into visual exploration.

## NASA data

[GLDS-288 – RNA-Seq: Mouse Spleen in Spaceflight](https://genelab-data.ndc.nasa.gov/genelab/accession/GLDS-288)
[NASA GeneLab Platform](https://genelab.nasa.gov)
[NASA Space Apps Challenge Website](https://www.spaceappschallenge.org/)

## Other references

[Bolt (No-Code Interactive Dashboard Builder)](https://bolt.new/)
[Lovable.dev (AI design assistant)](https://lovable.dev/)
[Framer (Web Design Platform)](https://framer.com/)

## Use of AI

We used AI tools to speed up development, design, and content creation.
- Google Gemini/Claude/ChatGPT (OpenAI): For generating UX copy, synergy logic, and content drafts (all reviewed and edited).
- Lovable.dev: To prototype page structure and layout quickly.
- Bolt.new: To generate a no-code interactive dashboard using uploaded gene data, auto-building charts and synergy overlays.
- Python with ChatGPT: For calculating synergy and preparing fold-change data.
We tested AI tools like CreaM and Leonardo.ai for visuals, but primarily used free stock images. No NASA logos or branding were used in AI outputs.
AI helped accelerate the process — but the research, logic, and direction were fully team-led.
