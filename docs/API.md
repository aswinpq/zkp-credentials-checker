# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
Include `X-API-Key` header for authenticated endpoints.

## Endpoints

### Health Check
```
GET /api/health
```
**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 3600,
    "checks": { "memory": true, "uptime": true },
    "memory": { "heapUsed": 45, "heapTotal": 120, "rss": 85 }
  }
}
```

### Create Credential Set
```
POST /api/proof/credential-sets
```
**Body:**
```json
{
  "name": "Top Universities",
  "credentials": ["MIT", "Stanford", "Harvard"],
  "description": "Optional description"
}
```
**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Top Universities",
    "credentialCount": 3,
    "merkleRoot": "hex64",
    "createdAt": "ISO8601"
  }
}
```

### List Credential Sets
```
GET /api/proof/credential-sets
```

### Generate ZK Proof
```
POST /api/proof/generate
```
**Body:**
```json
{
  "credentialSetId": "uuid",
  "credential": "MIT"
}
```

### Verify Proof
```
POST /api/verify
```
**Body:** Serialized proof object with metadata.

### Register Trusted Root
```
POST /api/verify/roots
```
**Body:**
```json
{
  "credentialSetId": "uuid",
  "merkleRoot": "hex64"
}
```

## Error Format
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Description", "details": [] },
  "timestamp": "ISO8601"
}
```
