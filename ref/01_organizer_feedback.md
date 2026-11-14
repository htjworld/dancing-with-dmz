# 운영진 피드백 (2026-11-14)

## 피드백 원문

> 서비스의 필요성, 위성 데이터의 신뢰성, 기존 서비스와의 차별성, 48시간 내 구현 가능성을 중심으로 생각해주세요

네 가지 축:
1. 서비스의 필요성
2. 위성 데이터의 신뢰성
3. 기존 서비스와의 차별성
4. 48시간 내 구현 가능성

## 함께 받은 자료: HLS Data Access and Tools 페이지 (원문)

HLS(Harmonized Landsat Sentinel-2)는 Landsat과 Sentinel-2를 맞춘 **광학** 위성 자료다. 레이더(NISAR)와 비교하거나 보조 자료로 쓸 수 있다. 아래는 받은 원문을 그대로 보존한 것이다.

---

Skip to content
 NASA Logo
Home
About HLS
Algorithms
Data Products
Data Access and Tools
Publications
Search for:


DATA ACCESS AND TOOLS

Overview

NASA’s Office of Data Science and Informatics (ODSI) at Marshall Space Flight Center generates the HLS v2.0 data products and the Land Processes Distributed Active Archive Center (LP DAAC) archives them. All HLS data products L30, S30 and HLS-VI are distributed as Cloud Optimized GeoTIFFs in NASA Earthdata cloud and are openly accessible with an Earthdata login.

HLS v2.0 data are produced and made available for download with a latency of ~ 2 – 3 days, depending on the availability of Level-1 inputs and auxiliary atmospheric data. The current status of the data is available on the EarthData HLS status search page, which also includes information on temporary outages and general HLS data issues. Known issues exist due to specific metadata or observational problems. Users are encouraged to refer to the periodic updates when working with time series or quantitative analysis.

Data Access

HLS v2.0 L30, S30, and HLS-VI data products are available for download from the sources listed below. All the HLS data products are distributed and archived by the LP DAAC in the NASA Earthdata Cloud (AWS us-west-2 region). Users can access the data through several interfaces, ranging from direct data download to fully native cloud-based workflows. For access to OPERA-HLS data products, users should refer to the DIST or DSWx product pages.

Name    Description    Product Access/Download
Earthdata Search    Earthdata Search allows users to search, discover, visualize, refine, and access NASA Earth Observation data. Users can search by a keyword, time range, and spatial area of interest, and subset of tile images. An Earthdata Login is required before users can download data or use selected tools.     HLS L30 v2.0
HLS S30 v2.0
HLS L30 VI
HLS S30 VI
NASA WorldView    The URL for viewing a Worldview visualization. The Worldview tool from NASA’s Earth Observing System Data and Information System (EOSDIS) provides the capability to interactively browse over 600 global, full-resolution satellite imagery layers and then download the underlying data. NASA WorldView allows the users to visualize the HLS L30 and S30 browse imagery before downloading the selected granule.    Explore HLS Imagery
CMR and CMR-STAC    HLS Collections are available from NASA’s Common Metadata Repository (CMR) and its CMR-STAC interface enabling scriptable, cloud friendly workflows. The selected granules by time or spatial filter is retrieved using https or S3 links.    CMR-STAC Endpoint
LP DACC cloud catalog
NASA Earthdata Cloud / S3    HLS v2.0 COGs are available in the S3 bucket in the AWS us-west-2 region as part of the NASA Earthdata Cloud. Users can analyze data on AWS and stream COG from S3 bucket once the Earthdata credentials are validated.    L30 AWS bucket 
S30 AWS bucket
AppEEARS    The Application for Extracting and Exploring Analysis Ready Samples (AppEEARS) offers a simple and efficient way to perform data access and transformation processes. AppEEARS allows users to request for specific data subsets based on spatial, temporal or bands, without handling the entire tile. Currently, HLS L30 and S30 products are available for processing/download via AppEEARS.    AppEEARS Tool
NASA Harmony    NASA Harmony allows users to analyze, subset, reproject, and visualize HLS data on the cloud. At present, the services are limited for HLS L30 and S30 but operations are planned for enhanced features.    Access NASA Harmony
Google Earth Engine (GEE)    The historical archive and forward processing of HLS v2.0 L30 and S30 data is now available as Image Collections on Google Earth Engine. Users can perform server side processing and rapid prototyping in the Earth Engine Environment.    HLS L30 v2.0
HLS S30 v2.0
Microsoft Azure    Through the NASA Microsoft partnership, HLS v2.0 is archived as Cloud optimized GeoTIFFs and hosted in Microsoft Azure. L30 and S30 Microsoft’s cloud platform—and accessible through Microsoft’s Planetary Computer.    STAC Access
HLS L30 
HLS S30
ESRI Cloud Atlas    HLS products are not distributed via ESRI but secondary and tertiary products are hosted on the ESRI Cloud resources such as Living Atlas, ArcGIS Online.    
Tools and Tutorials

For Jupyter notebook demos of how to access HLS data available at NASA’s IMPACT Team GitHub repository. 
For tutorials, see LP DAAC GitHub repository.
For additional resources, see EarthData’s HLS Learning Resources page.
NASA Official: Chris Neigh

Webmaster: Ross Walter

Curators: Ross Walter

Copyright: Contains modified Copernicus Sentinel data (2026)

NASA Logo
Last Updated: April 10, 2026

Privacy Policy & Important Notices

Contact Us
