# Resonant Exoplanets — Project Resonant Exoplanets

- 수상: Best Use of Data, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: A World Away: Hunting for Exoplanets with AI
- 지역: Mountain View, CA, United States
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/resonant-exoplanets/
- 데모(영상·슬라이드): https://www.youtube.com/watch?v=5fBB5YJpfwU
- 프로젝트(사이트·저장소): https://resonant-planet.vercel.app

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

Data from several different space-based exoplanet surveying missions have enabled discovery of thousands of new planets outside our solar system, but most of these exoplanets were identified manually. With advances in artificial intelligence and machine learning (AI/ML), it is possible to automatically analyze large sets of data collected by these missions to identify exoplanets. Your challenge is to create an AI/ML model that is trained on one or more of the open-source exoplanet datasets offered by NASA and that can analyze new data to accurately identify exoplanets. (Astrophysics Division)

## About the team

We’re building a physics-first AI engine to hunt for new worlds beyond our solar system. Exoplanet detection is one of NASA’s grand challenges — and most methods today are still limited by noise and false positives. Our team will combine open NASA datasets with advanced AI models inspired by physics and resonance theory to improve accuracy, scalability, and discovery speed.
We’re looking for teammates who bring skills in:
- Astrophysics & Astronomy (help frame the scientific methods)
- AI/ML & Coding (training, model development, data pipelines)
- Data Visualization & Storytelling (turn raw detections into compelling narratives)
- Design & Multimedia (to craft a polished final product for judges)
If you want to help uncover new exoplanets — and create a solution competitive for Best Use of Science and Best Use of Data at the global level — join us! 🚀✨

## Project summary

Resonant Worlds Explorer is an AI-powered system that ingests telescope and satellite data, including spectra from missions like JWST, to search for exoplanets and detect possible biosignatures. Unlike traditional tools that rely on approximate floating-point methods, our system integrates Modulus, a new exact-math solver that converts physics and chemistry problems into number theory and solves them without numerical error. This allows us to model planetary atmospheres with high precision, test chemical equilibrium, and distinguish true biosignatures (like O₂ + CH₄ coexistence) from abiotic false positives.
We built a full end-to-end pipeline: fetching NASA data, detecting exoplanets with transit algorithms, validating signals with physics models, and running Modulus-based chemistry checks. Results are presented in a web interface with visual plots and automatically generated scientific reports.
This matters because the search for life beyond Earth depends on accuracy. By combining astronomy data, physics validation, and exact chemistry, Resonant Worlds Explorer reduces false positives and provides a reliable way to identify promising candidates for habitability, helping guide future missions and discoveries.

## Project details

Resonant Worlds Explorer is a full-stack application that combines astronomy data, machine learning, and exact physics to detect exoplanets and identify potential biosignatures. The system ingests data from NASA missions such as Kepler, TESS, and JWST, preprocesses light curves or spectra, and runs transit detection algorithms to find planets. Once candidates are found, it validates them with physics models and uses Modulus, our exact-math solver, to analyze atmospheric chemistry. This allows us to check whether molecules like O₂, CH₄, and O₃ can coexist naturally or require biological replenishment.
The benefits are accuracy and reliability: traditional AI can misclassify or hallucinate results, but our solver eliminates numerical error and dramatically reduces false positives. The intended impact is to provide scientists with a trustworthy, scalable tool for finding habitable worlds and prioritizing targets for future exploration.
We built the project with Python (FastAPI, XGBoost, Lightkurve, Astroquery), TypeScript/React, and Google Cloud integration. Modulus is based on a modified Qwen transformer that we extended into the Prime Algebra Transformer, enabling exact arithmetic for physics and chemistry problems.
The project is creative because it blends machine learning with hard physics, turning exoplanet discovery into an interactive, explainable, and reproducible process. We considered both scientific rigor and usability, delivering not just code but also visual plots, automated PDF reports, and a clear workflow that makes complex science accessible.

## NASA data

[Kepler Mission Data](https://archive.stsci.edu/kepler/)
[TESS Mission Data](https://archive.stsci.edu/tess/)
[James Webb Space Telescope (JWST) Data (MAST Archive)](https://archive.stsci.edu/jwst/)
[Hubble Space Telescope Data (MAST Archive)](https://archive.stsci.edu/hst/)

## Other references

[ESA PLATO Mission (Planned Exoplanet Mission)](https://sci.esa.int/web/plato)
[ESA Ariel Mission (Atmospheric Remote-sensing Exoplanet Large-survey)](https://sci.esa.int/web/ariel)
[Qwen (Open Source AI Model)](https://github.com/QwenLM/Qwen)
[Lightkurve (Kepler & TESS Time Series Analysis Library)](https://docs.lightkurve.org/)
[Astroquery (Astronomical Data Query Tool)](https://astroquery.readthedocs.io/)
[XGBoost (Open Source Machine Learning Library)](https://xgboost.ai/)
[FastAPI (Python Web Framework)](https://fastapi.tiangolo.com/)
[React (Frontend Library)](https://react.dev/)
[ReportLab (PDF Generation Library)](https://www.reportlab.com/)

## Use of AI

Our project makes extensive use of AI in both the system itself and in our development process.
- Core System- We built Modulus, a custom AI solver derived from the open-source Qwen model, where we replaced the transformer with our Prime Algebra Transformer to perform exact arithmetic. This enables us to model planetary transits and atmospheric chemistry without numerical error.
- We use machine learning (XGBoost, CNN embeddings, reinforcement learning) to classify exoplanet candidates and reduce false positives.
- AI is central to biosignature analysis: Modulus calculates chemical equilibrium, reaction timescales, and disequilibrium states to identify life-like atmospheric signals.
- We used AI-assisted tools (e.g., ChatGPT) to accelerate coding, documentation drafting, and brainstorming system design.
- Any AI-generated code or documentation was reviewed, tested, and refined by the team before integration.
- No AI-generated images, logos, or NASA branding were used.
- All AI involvement is documented in the codebase and research paper.

In short, AI was both the foundation of our solver and a tool that helped us move faster, while the scientific logic and implementation remain original to our team.
