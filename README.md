# Generalist Discord bot architecture

A robust, highly scalable Discord bot designed for server administration, economy management, and automated user progression systems. This project demonstrates professional-grade backend architecture, featuring cloud-native deployment and real-time data persistence. The architecture is designed to be easily adaptable to new needs and easy to scale.

## Overview

This bot provides server administrators with high-level control over user economies, leveling systems, and server configurations. It is built with a modular command architecture and is designed for high availability through containerization and cloud-based automation.

## Key Features

### Administration
* **Economy Management:** Granular control over user balances (add, subtract, set) with real-time updates.
* **Progression Systems:** Automated leveling and XP management with configurable growth curves.
* **Profile Management:** Robust user profile synchronization and recovery tools (Profile Reset/Fix) to maintain data integrity.
* **Dynamic Server Settings:** Real-time configuration of roles, channels, and currency names via slash commands.

### Technical Capabilities
* **Automated Lifecycle Management:** Automated user profile creation and role synchronization via `guildMemberUpdate` events.
* **Modular Command Architecture:** A highly decoupled command pattern using TypeScript interfaces, allowing for rapid feature expansion.
* **Event-Driven Leveling:** A real-time leveling engine that calculates XP progression and triggers level-up events via message-based triggers.

## Technical Architecture

This project is built to follow modern "Production-Ready" standards:

### 1. Data Persistence (Firestore)
The bot uses Google Cloud Firestore as a NoSQL backend. This ensures that user balances, levels, and server-specific configurations are stored in a highly available, distributed, and scalable manner.

### 2. Infrastructure & DevOps
The project is designed for professional deployment workflows:
* **Containerization:** Fully Dockerized using `node:alpine` for a lightweight, consistent runtime environment.
* **CI/CD Pipeline:** Integrated with Google Cloud Build to automate the build, containerization, and deployment process to Google Cloud Engine.
* **Secrets Management:** Utilizes environment variables and Google Cloud Secret Manager to handle sensitive credentials (Discord Tokens, API Keys) securely.

### 3. Modular Design
The codebase is strictly typed with TypeScript and follows a service-oriented architecture. Logic is separated into:
* **Services:** Dedicated layers for Database (Firestore) and Server Configuration.
* **Commands:** Decoupled command modules for easy maintenance.
* **Events:** Event-driven logic for seamless user integration.

## Tech Stack

* **Runtime:** Node.js (LTS)
* **Language:** TypeScript (Strict Mode)
* **API:** Discord.js
* **Database:** Google Cloud Firestore
* **Infrastructure:** Docker, Google Cloud Platform (GCP), Cloud Build
* **Environment:** Linux (Alpine)

## Installation & Local Development

### Prerequisites
* Node.js (LTS)
* npm / yarn

### Setup
1. **Install dependencies:**
 ```bash
   npm install
 ```
1. **Environment Configuration:**
 Create a `.env` file in the root directory and add your credentials:
 ```env
 DISCORD_TOKEN=bot_token
 CLIENT_ID=application_id
 DATABASE_LOGIN=firestore_login_json_object
 ```
1. **Run the bot:**
 ```bash
   npm run dev
 ```