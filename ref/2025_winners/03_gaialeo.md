# Gaia+LEO — Project Gaia+LEO

- 수상: Global Connection, Global Nominee, Global Finalist, 2025 Global Winner
- 챌린지: Commercializing Low Earth Orbit (LEO)
- 지역: Seattle, WA, United States
- 팀 페이지: https://www.spaceappschallenge.org/2025/find-a-team/gaialeo/
- 데모(영상·슬라이드): https://drive.google.com/file/d/17eORY_V279WEXn_29pDwuUACGKpyKx6K/view
- 프로젝트(사이트·저장소): https://github.com/stayingfoolish/gaia-LEO/blob/main/README.md

> 아래는 팀 페이지의 원문(영문)을 그대로 옮긴 것이다. 수집일 2026-11-14.

## Challenge (excerpt)

As the commercialization of space rapidly accelerates, the future of business in low Earth orbit (LEO) holds incredible potential, but also presents significant operational, regulatory, and environmental challenges. This new economic frontier invites innovative and sustainable approaches to foster long-term viability and responsible execution. Your challenge is to conceptualize and design a scalable, sustainable, business model, accompanied by a prototype, that explores the unique opportunities LEO offers while addressing the complexities of operating in space. (Joint Agency Satellite Division)

## About the team

Gaia+LEO explores the scenario planning of deploying a data center network co-located with a constellation of satellites in Low Earth Orbit. The project evaluates the technical, regulatory, and sustainability constraints of hosting compute and storage infrastructure in space — including power generation, thermal management, data routing, and orbital debris mitigation. Our goal is to identify viable architectures and market applications for orbital data processing, from Earth observation analytics and space situational awareness to sovereign data resilience and low-latency global communication.

## Project summary

We developed Gaia-LEO, a mixed-integer optimization framework that co-designs orbital and terrestrial data-center networks for the next generation of AI and Earth-observation workloads. The model jointly optimizes facility location, network topology, and workload placement by minimizing total CapEx + OpEx while satisfying real-world physical constraints latency, bandwidth, power, and thermal limits. Each orbital module represents a 40 MW containerized data-center node with solar power and radiative cooling; ground sites anchor fiber backhaul and user access. Using inputs from NASA’s CO2 emissions, water & orbital debris data and web scraped data center data the solver decides which orbital clusters to launch, which ground points of presence to activate, and how to route traffic through optical & inter-satellite links.

This framework directly addresses the challenge of commercializing LEO by quantifying when and where orbital compute becomes economically advantageous compared with terrestrial infrastructure. It transforms space from a communications relay into a computational layer – a sustainable, solar-powered extension of Earth’s cloud. The result is an actionable blueprint for scaling AI training and climate modeling in orbit, reducing terrestrial power and water footprints, and accelerating humanity’s transition toward space-based green compute as part of the emerging orbital economy.

## Project details

Re-thinking where the Earth's compute should live.
Gaia-LEO is a data-driven simulation and optimization framework that designs hybrid orbital–terrestrial data center networks for sustainable AI and Earth-observation compute. Built with Python, Three.JS, and Streamlit, the system implements a mixed-integer optimization (MIP) that decides where to build orbital and Earth-based data centers, what optimal balances are required between both compute options, and how to route workloads to minimize total cost (CapEx + OpEx) under physical constraints on latency, bandwidth, power, and thermal limits.
The model integrates NASA POWER data, US energy-grid data, and available public data on terrestrial data centers and costs to simulate real-world environmental and economic trade-offs. Each orbital module represents a 40 MW solar-powered, radiatively-cooled compute node, while ground sites are built for resilience, redundancy, and inference.
The Streamlit interface allows users to interactively explore scenarios, visualize cost-performance trade-offs, and identify when orbital compute becomes environmentally advantageous and profitable. The project’s creativity lies in merging operations-research optimization with environmental modeling and space-systems engineering. 
The development of new data centers is not going to slow down any time soon. We need a more sustainable option to invest in technological advancements while also designing for the future in a scalable and environmentally-friendly way. Gaia-LEO can inform policymakers, governments, and cloud providers on when, where, and how to scale sustainable orbital compute, reducing terrestrial energy and water footprints while enabling a greener and more resilient orbital economy.

## NASA data

[NASA POWER, 10/4/23-10/4/25 Data for the following features: All Sky Surface Shortwave Downward Irradiance, Temperature at 2m, Temperature at 2m Max, Relative Humidity at 2m](https://power.larc.nasa.gov/data-access-viewer/)

## Other references

[Starcloud White Paper - Why we should train AI in space](https://starcloudinc.github.io/wp.pdf)
[US Energy Information Administration, 7/1/25 Data for state energy costs and CO2 output](https://www.eia.gov/)

## Use of AI

We used AI tools (ChatGPT, Cursor AI, and Copilot) to accelerate data modeling, documentation , and code optimization for our Streamlit simulation and digital-twin framework. We also used AI image generators to create our Gaia+LEO logo.
