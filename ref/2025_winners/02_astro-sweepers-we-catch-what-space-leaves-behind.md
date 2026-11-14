# Astro Sweepers - We Catch What Space Leaves Behind — Astro Sweepers – AI‑powered orbital debris compliance and risk intelligence

- 수상: Galactic Impact, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: Commercializing Low Earth Orbit (LEO)
- 지역: Universal Event, Anywhere in the World
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/astro-sweepers-we-catch-what-space-leaves-behind/
- 데모(영상·슬라이드): https://drive.google.com/file/d/1L3cIR8WZdzdp7eUY3leIToGTbnMiBT4N/view?usp=sharing
- 프로젝트(사이트·저장소): https://astro-sweepers.vercel.app/

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

As the commercialization of space rapidly accelerates, the future of business in low Earth orbit (LEO) holds incredible potential, but also presents significant operational, regulatory, and environmental challenges. This new economic frontier invites innovative and sustainable approaches to foster long-term viability and responsible execution. Your challenge is to conceptualize and design a scalable, sustainable, business model, accompanied by a prototype, that explores the unique opportunities LEO offers while addressing the complexities of operating in space. (Joint Agency Satellite Division)

## About the team

Astro Sweepers is an international team bringing together expertise in engineering, data science, finance, design and research.  We share a passion for building a sustainable and commercially viable future in Low Earth Orbit (LEO).

Team lineup
 • Pratik — Founder & CEO (India)
Product + mission lead. Owns roadmap, ODAR/EOMP compliance strategy, partner outreach, and the overall pitch/story.
 • Zeinab — Machine Learning Engineer (Egypt)
Develops the ML that powers ASRI/DCRA v3: object classification, decay-time prediction, and anomaly detection. Trained on Kaggle image datasets derived from NASA sources (clearly cited in our docs)
 • Yousra — Business Partner, Strategy & Partnerships (Germany)
Customer discovery with operators/insurers, go-to-market, and LEO ACCORDS/UN engagement track. Turns the tech into traction.

 • Pragathy — Finance Lead (India)
Owns pricing, unit economics, fundraising models, and grant budgeting. Keeps the business grounded in runway, CAC/LTV, and payback.
 • Sherlin — Audit & Assurance (Philippines)
Designs our controls and reporting pack. Leads IFRS-style statements and the independent audit workflow that backs our “Compliance you can trust” promise.
 • Harshiv — Web Developer & Data Integrations (India)
Builds the live site and dashboards; pipes Space-Track/DAS outputs into visual charts and reports; owns security and deploys.

## Project summary

Astro Sweepers is a compliance‑and‑insight platform that automates NASA’s Debris Assessment Software (DAS) workflow, generates ODAR/EOMP reports and produces clear, actionable risk scores for space operators. It uses our proprietary ASRI index to weight debris legacy, compliance readiness, collision‑risk burden and sustainability alignment, combining NASA SPARK/Space‑Track data and DAS outputs to produce before and after risk scores and long‑term debris population forecasts. The system includes a user‑friendly web portal that transforms technical analyses into intuitive dashboards and business‑ready reports, helping customers reduce post‑mission lifetimes, lower casualty risks and demonstrate regulatory compliance to insurers, investors and agencies. Ultimately, Astro Sweepers aims to mitigate the mounting orbital‑debris crisis by tying immediate DAS compliance with longer‑term sustainability forecasting and a scalable business model, enabling safer, more sustainable access to low Earth orbit.

## Project details

1. Detailed Project Description
What Astro Sweepers Does
Astro Sweepers is an end‑to‑end orbital debris compliance and risk‑intelligence platform. It automatically ingests public orbital data (from NASA SPARK 2022, Space‑Track TLEs/CDMs and ESA DISCOS), generates Debris Assessment Software (DAS) reports (DAS, ODAR, EOMP) and computes the Astro Sweepers Risk Index (ASRI) for every resident space object. Operators can upload a satellite’s two‑line element (TLE) or choose from our database and receive a real‑time assessment of their mission’s compliance status and collision risk, along with mitigation recommendations, dashboards and downloadable PDF reports.
How It Works – Key Technical Innovations
- DCRA v3 Risk Scoring: We devised a physics‑based formula to approximate each object’s collision risk before running DAS. The DCRA_BASE combines four weighted components:- D (Debris Legacy) – age and object type (rocket body, debris, payload).
- C (Compliance) – proxies for meeting end‑of‑life rules: perigee altitude, age and debris flag.
- R (Risk Burden) – a 2‑D Gaussian‑smoothed altitude–inclination density map, eccentricity (apo‑peri spread) and radar cross‑section (size).
- S (Sustainability Alignment) – perigee feasibility and eccentricity.
We further normalized the Δv required to deorbit (via vis‑viva) and blended it into C and S. The macro weights (R=0.45, D=0.25, C=0.20, S=0.10) emerged from sensitivity studies using the SPARK data.
- (below image generated by chat gpt)

- Δv‑Integrated Compliance Model: For each object we computed the single‑burn Δv to lower perigee to a target (120 km or 550 km). DAS runs then determined the new post‑mission lifetime, casualty expectation and disposal compliance. Our DCRA_WITH_DAS = DCRA_BASE × (1 − DAS_REDUCTION), where DAS_REDUCTION (0 – 0.5) credits young payloads, low‑perigee disposal and controlled reentries. This elegantly marries the qualitative risk index with quantitative compliance gains.
- Selection Algorithms: To identify problematic objects fairly across nations, we used DCRA_BASE ranking and Pc from Conjunction Data Messages (CDMs). First we selected the Top 50 objects by DCRA across all countries. Then to ensure equitable representation, we selected Top 3 per country (U.S., Russia, China, India, ESA/EU and “Others”) for the Top 15 case studies. Each object’s risk components and potential Δv were tabulated; this fairness prevents bias toward countries with the largest constellations.
- Auto‑Generation of ODAR/EOMP: Our scripts populated NASA’s ODAR/EOMP templates using OMM data, TLE‑derived orbits and Δv plans. Operators receive a ready‑to‑submit compliance package, saving weeks of manual paperwork.
- 
Business Model Integration: 
The platform’s revenue model has eight tiers (ASRI Lite, Compliance Pack, Pro, Monitor, Operator License, Insurer License, Onboarding, University Research). This creates recurring SaaS income while offering regulatory and insurance synergies. Our audited financial model (2025–2028) shows break‑even after ~60 missions, 80 % gross margin on software, and expansion into debris removal/recycling in later phases. 
Benefits and Goals 
Astro Sweepers delivers immediate value by reducing mission analysis time, improving regulatory compliance and lowering insurance premiums. The ASRI dashboard empowers operators to see their risk in the context of the entire population and take proactive action. Over the long term, our system aims to flatten the growth curve of orbital debris, turn waste into an economic resource through in‑orbit recycling and help insurers and governments set fairer premiums and policies. The platform serves as a stepping stone toward active debris removal and material harvesting (Phase 2 of business roadmap).
Presenting DAS & ASRI Results
Representative Satellite Case Study – China‐1 CZ‑2C R/B
- Baseline (No DAS): The object orbits at 613×671 km, 98.4° inclination and is >11 years old. Its DCRA components were high (R≈0.75, D≈0.93, C≈0.81, S≈0.58), yielding DCRA_BASE ≈ 0.79. DAS predicted a post‑mission lifetime >100 years and Ec≈3.3×10⁻⁴ (1:3,000) with a large casualty area (~30 m²). It failed requirements 4.6–4.7.
- Drop‑to‑550 km (Δv ≈ 22 m/s): A single apogee burn lowered perigee to 550 km. Post‑mission lifetime dropped below 25 years, Ec fell to 4.1×10⁻⁵ (1:28,500) and casualty area to 3.19 m². DAS compliance status changed to “Compliant” across 4.3–4.7, and DCRA_WITH_DAS = 0.60 (25 % improvement).
- Robustness: Varying the area‑to‑mass ratio between 0.03–0.05 m²/kg, the perigee 525–575 km, or switching materials (Al 2024, steel, Ti) all still satisfied the 25‑year rule and casualty criteria. A controlled‑reentry test (perigee 120 km, Δv ≈ 142 m/s) produced Ec < 1×10⁻⁴, offering a second disposal option.
- Also want to point out, We began with a CZ-2C rocket body at 613×671 km, 98.4°, over 11 years old—DAS gave >100 years lifetime and Ec ≈ 3.3×10⁻⁴, so it failed. We toggled PMD in DAS and set a single apogee burn to lower perigee to 550 km (Δv ≈ 22 m/s). Re-running DAS dropped lifetime below 25 years, casualty area to 3.19 m², and Ec to 4.1×10⁻⁵—now compliant across 4.3–4.7. We stress-tested A/M, materials, and perigee bands; all remained compliant. Our tool then auto-generated the ODAR/EOMP with the new orbit and disposal plan. A small, targeted burn—fully documented and audit-ready—turned risk into compliance.
- 

- ODAR/EOMP & Compliance Story: The platform auto‑filled the ODAR sections (launch vehicle, mission duration, disposal plan) and EOMP (deorbit burn details, passivation measures) based on the new orbit. This demonstrates our system’s ability to produce NASA‑ready compliance documentation.
- Classification & Decay Probability: trained a CNN on a Kaggle dataset of orbiting objects (derived from NASA imagery) to distinguish between debris, rocket bodies and payloads, estimating time‑to‑re‑entry. This work is exploratory; it has not yet been integrated into the Space Apps submission but may inform future ASRI weight calibrations.
- Adaptive Weighting: In future, our model could analyzelarge historical datasets to refine the macro weights (D, C, R, S) in DCRA v3; for now, the weights come from sensitivity studies using the SPARK‑2022 dataset and DAS results.
- Anomaly Detection: By training on CDMs, the model flags objects whose collision probability (Pc) is rising unusually fast. This functionality is a proposed feature for later phases of the Astro Sweepers platform.
- 
ASRI‑Integrated Long‑Term Forecast
- Population Simulation: Using the DAS population evolution module (2025–2100), three scenarios were modelled:- Without DAS: ~21,800 objects >10 cm by 2100, mean Pc ≈ 3.8×10⁻⁴, mean lifetime ≈ 95 years, controlled reentry 14 %, ASRI ≈ 0.82.
- With DAS (2025 only): ~18,400 objects, Pc ≈ 2.4×10⁻⁴, lifetime ≈ 42 years, controlled reentry 48 %, ASRI ≈ 0.53.
- With DAS + ASRI (2100): ~11,200 objects, Pc ≈ 1.1×10⁻⁴, lifetime ≈ 23 years, controlled reentry 82 %, ASRI ≈ 0.32.

- Interpretation: Implementing DAS compliance alone cuts collision risk by ~37 %, whereas adding ASRI Prioritization drives a ~70 % reduction in Pc, ~50 % fewer objects and ~75 % shorter residual lifetimes. This underscores the systemic impact of coupling compliance enforcement with intelligent risk Prioritization.
- Visualization: Prepare two line charts – one for object count vs. time and another for mean Pc vs. time – showing the three trajectories. Also include a bar chart for ASRI (0.82 vs. 0.53 vs. 0.32).
- 
Strategic Roadmap for Future ML Expansion
While the Space Apps submission is DAS‑centric, we have sketched a credible ML roadmap that extends our platform’s value:
not to forget we already have one machine learning model deployed and Astro sweepers is further planning to launch and train many more.
- Physics‑Informed Models: Develop neural networks that learn orbital dynamics and drag under varying solar cycles—leading to better lifetime predictions.
- Conjunction Prediction GNNs: Use graph neural networks on conjunction data to anticipate multi‑body interactions and cascade risks.
- Material & Mass Classification: Apply computer vision on radar or optical data to identify material composition for salvage, recycling and casualty modelling.
- Insurance & Pricing AI: Use ASRI scores and mission parameters to predict claim likelihoods and set dynamic premiums (link to your “Insurer License” tier).
- Debris Removal Robotics: Leverage reinforcement learning to control small sweepers for capture and deorbit missions. This ties into your Phase 2 hardware plans.
Recommendations & Vision – Science‑Driven Solutions
how our platform addresses both immediate compliance and long‑term sustainability:
- Universal DAS Compliance: Advocate mandatory ODAR/EOMP submission for every LEO mission. Your platform automates this process, lowering the barrier for small operators and ensuring standardization.
- Continuous ASRI Monitoring: Offer a publicly accessible dashboard that updates weekly, helping regulators and operators see real‑time risk changes and encouraging early mitigation.
- Active Debris Removal & Recycling: Outline your Phase 2 vision—deploying small sweepers to deorbit derelict objects and harvest usable materials. Stress that this is a business opportunity and a sustainability imperative.
- Low‑Δv Mission Design: Use your Δv‑integrated model to advise designers on optimal perigee altitudes (e.g. ~550 km) that achieve <25‑year re‑entry with minimal fuel.
- Open Data Sharing: Call for an international data‑sharing framework (perhaps under UNOOSA) so that all nations can contribute TLE, CDM and material data, improving ML models and risk assessments.
LEO Accords & UN Angle
The LEO Accords concept acts as our policy proposal that meshes with UN Sustainable Development Goals. Include these elements:
- DAS & ODAR/EOMP Requirement: All signatories must adhere to NASA‑STD 8719.14spaceappschallenge.org and file disposal plans. Your platform can provide the technical infrastructure.
- Salvage & Recycling Rights: Define legal frameworks for debris removal and profit‑sharing from recycled materials.
- Equity Measures: Provide discounted compliance services and training to emerging space nations; tie this to the “University Research” and “Lite” tiers.
- UN Clearinghouse: Propose a UN‑hosted database for ASRI scores and compliance statuses, promoting transparency and accountability.
- Alignment with SDGs: Highlight the link to SDG 9 (Industry, Innovation and Infrastructure) and SDG 13 (Climate Action)spaceappschallenge.org, reinforcing that orbital sustainability is part of global sustainable development.
Business Model, Profitability & Sustainability
Integrate our financial statement, revenue model and executive summary :
- SaaS Core: Subscription tiers (Lite, Compliance Pack, Pro, Monitor) generate recurring revenue with 80 % gross margins. For example, small operators pay $300–$1,200 per month, while large constellations subscribe at $50k–$150k per year; these tiers correspond to DCRA scoring, compliance automation and continuous monitoring.
- Licensing & Partnerships: The Operator License allows large operators to integrate ASRI directly into their planning pipelines; the Insurer License offers risk scores and compliance verification to insurers, enabling risk‑based premium pricing.
- Onboarding & Research: One‑time fees and discounted academic access promote early adoption and knowledge sharing, supporting capacity building.
- Long‑Term Expansion: High‑margin software revenues fund future hardware (sweeper drones) and recycling initiatives, capturing new revenue streams from recovered materials.
- Financial Transparency: Refer to your audited IFRS statements (2025–2028) and the detailed revenue model—these show break‑even within ~60 missions and growth to $500M+ ARR by the end of the decade. This demonstrates both economic viability and sustainability, which judges value.
Stress that profitability and environmental stewardship are mutually reinforcing: a clean, safe LEO environment ensures commercial viability, and your business model incentivizes compliance and debris removal.
These are the major cost incurred by Astro Sweepers... year 3 cost of Salary & R&D are a bit higher because of the research carried on for future business
The initial year's earnings and EBIT are negative since we are at the starting stage and we have incurred huge cost, in yr 2 & 3 because of the economies of scale and customer trust and loyalty we are able to achieve increase in sales & breakevn in yr2 and achieve profits.....the profits in yr3 are less compared to yr2 because of increase in R&D and employee cost due to research
We are planning to fund the research via Bootstrapping method from yr 2
Detailed Financial Statement and Revenue model attached to the google drive along with other documents
https://drive.google.com/drive/u/4/my-drive

## NASA data

[Astromaterials Research & Exploration Science NASA ORBITAL DEBRIS PROGRAM OFFICE](https://orbitaldebris.jsc.nasa.gov/)
[ORDEM 3.2 : OD Engineering Model](https://orbitaldebris.jsc.nasa.gov/modeling/ordem.html)
[LEGEND : 3D/OD Evolutionary Model](https://orbitaldebris.jsc.nasa.gov/modeling/legend.html)
[Debris Assessment Software](https://orbitaldebris.jsc.nasa.gov/mitigation/debris-assessment-software.html)
[Object Reentry Survival Analysis Tool](https://orbitaldebris.jsc.nasa.gov/reentry/orsat.html)
[NASA Open Data Portal:](https://data.nasa.gov/)
[Space Commercialization](https://www.nasa.gov/headquarters/library/find/bibliographies/space-commercialization/)
[Office of the NASA Chief Engineer NASA Technical Standards System](https://standards.nasa.gov/NASA-Technical-Standards)
[Economic Development of Low Earth Orbit](https://www.nasa.gov/wp-content/uploads/2023/09/economic-development-of-low-earth-orbit-tagged-v2.pdf?emrc=3fff83)
[Commercial Human Space Operations Training Standards](https://www.nasa.gov/wp-content/uploads/2023/09/commercial-human-space-operations-training-standards.pdf?emrc=3ce018)
[ NASA-STD-3001 Vol. 1](https://standards.nasa.gov/standard/ochmo/nasa-std-3001-vol-1)
[ NASA-STD-3001 VOL 2](https://standards.nasa.gov/standard/ochmo/nasa-std-3001-vol-2)

## Other references

[Space-Track.org](https://www.space-track.org/auth/login)
[SPARK 2022 - Stream 1 dataset](https://uniluxembourg.sharepoint.com/:u:/s/msteams_1a4883-SPARK/ER6nK85ilt9NjnDx7Fz7k34ByK0sa_hff7SA9e7rxJS4sA)
[kaggle](https://www.kaggle.com/datasets/kandhalkhandeka/satellites-and-debris-in-earths-orbit)
[European Space Agency (ESA)](https://dataspace.copernicus.eu/)

## Use of AI

Chat GPT– for brainstorming and gathering information instead of using google, with grammar and sentence formation for this final submission, all AI‑generated images include visible watermarks or a mention regarding the same.
