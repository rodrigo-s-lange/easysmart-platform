# �� Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- User authentication system (register/login)
- Device CRUD endpoints
- MQTT real-time integration
- React frontend
- Data visualization charts

---

## [0.1.0] - 2025-10-16

### Added
- 🐳 Docker Compose stack with 4 services
  - PostgreSQL 16 (relational database)
  - InfluxDB 2.7 (time-series database)
  - Eclipse Mosquitto 2.0 (MQTT broker)
  - Node.js backend (Express.js)
- 📁 Project structure with MVC pattern
- 🔧 Environment variables configuration (`.env`)
- 🔐 Mosquitto MQTT authentication with password file
- 🏥 Health check endpoints
  - `GET /health` - Server status
  - `GET /db-check` - PostgreSQL connection test
- 📋 Complete README.md with:
  - Architecture diagrams
  - Quick start guide
  - AI development guidelines
  - Security best practices
  - MQTT topics structure
- 🔒 Security configurations:
  - Helmet (security headers)
  - CORS enabled
  - Password file with proper permissions
  - Healthchecks for all containers

### Configuration Files
- `docker-compose.yml` - Full orchestration with health checks
- `mosquitto/config/mosquitto.conf` - MQTT broker config
- `server/src/server.js` - Express.js entry point
- `server/src/config/database.js` - PostgreSQL connection

### Infrastructure
- Network: `easysmart-net` (bridge driver)
- Volumes:
  - `postgres/data` - PostgreSQL data persistence
  - `influxdb/data` - InfluxDB data persistence
  - `mosquitto/config` - MQTT configuration
  - `mosquitto/data` - MQTT persistence
  - `mosquitto/log` - MQTT logs

### Ports Exposed
- `3000` - Backend API
- `5432` - PostgreSQL
- `8086` - InfluxDB HTTP API
- `1883` - MQTT
- `9001` - MQTT WebSocket

---

## [0.0.1] - 2025-10-16

### Added
- Initial project setup
- GitHub repository created
- Basic directory structure
- `.gitignore` configuration

---

## Version History

| Version | Date       | Status      | Notes                          |
|---------|------------|-------------|--------------------------------|
| 0.1.0   | 2025-10-16 | ✅ Released | Docker stack fully operational |
| 0.0.1   | 2025-10-16 | ✅ Released | Initial setup                  |

---

## Semantic Versioning Guide

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): Add functionality (backwards-compatible)
- **PATCH** version (0.0.X): Bug fixes (backwards-compatible)

---

**Maintained by:** Rodrigo S. Lange  
**Last Updated:** 2025-10-16
