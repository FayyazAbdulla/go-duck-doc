# Source: integrations.html

# Frontend Integrations

Ready-to-use snippets to wire up leading frontend frameworks to your ultra-fast API backend seamlessly.

## 1. Angular (TypeScript)

Angular natively employs RxJS `HttpInterceptor` abstractions, making connecting to your GO-DUCK APIs simple.

Note: We bypass typical manual HTTP Auth mapping by using Angular's pre-built `keycloak-angular` ecosystem package.

### Creating a Service for Entity

```
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common';
import { Observable } from 'rxjs';

export interface Entity {
id: number;
}

@Injectable({ providedIn: 'root' })
export class EntityService {
// {apiPrefix} is configurable (go-duck.server.rest.api-path-prefix), default /{app-name}/api
private apiUrl = 'http://localhost:8080/{apiPrefix}/entitys';

constructor(private http: HttpClient) {}

// Standard REST Fetch with Pagination Parameters — note the param is "size", not "pageSize"
getAll(page: number = 1, size: number = 10): Observable {
let params = new HttpParams()
.set('page', page.toString())
.set('size', size.toString());
return this.http.get(this.apiUrl, { params });
}

// Example: Using the powerful Generic Search RPC Engine
// The operator is a suffix on the query key, not a prefix on the value:
// ?age.greaterThan=20, never ?age=gt.20
search(queryField: string, operator: string, value: string): Observable {
let params = new HttpParams().set(\`\${queryField}.\${operator}\`, value);
return this.http.get('http://localhost:8080/{apiPrefix}/rpc/entity', { params });
}
}
```

## 2. Flutter (Dart)

Connecting a cross-platform mobile app requires managing state efficiently. Here's a raw HTTP Dart integration model you can bind to Provider, Riverpod, or BLoC patterns seamlessly over your Keycloak environment.

```
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiProvider {
// {apiPrefix} is configurable (go-duck.server.rest.api-path-prefix), default /{app-name}/api
static const String baseUrl = "http://localhost:8080/{apiPrefix}/entitys";
final storage = const FlutterSecureStorage();

// Retrieve Keycloak Bearer token from secure storage
Future> _getHeaders() async {
String? token = await storage.read(key: 'jwt_token');
return {
'Content-Type': 'application/json',
'Authorization': 'Bearer $token',
'X-Tenant-ID': 'default', // If using Multi-Tenancy module
};
}

// Fetch API collection
// The entity List endpoint returns a bare JSON array (c.JSON(200, entities)),
// NOT a {"results": [...]} wrapped object — json.decode on an array yields a
// List directly, so indexing with ['results'] would throw at runtime.
Future> fetchEntitys() async {
final response = await http.get(Uri.parse(baseUrl), headers: await _getHeaders());
if (response.statusCode == 200) {
final data = json.decode(response.body) as List;
return data;
} else {
throw Exception('Failed to load data. Res code: \${response.statusCode}');
}
}
}
```

## 3. WSO2 API Manager Integration

GO-DUCK generated APIs can automatically register themselves with a WSO2 API Manager instance on startup. This uses the WSO2 Publisher REST API to import your dynamically generated OpenAPI 3.0 specs.

#### Standard API Gateway Discovery

For external gateways (Kong, Apigee) and ecosystems like JHipster and Spring Boot, your microservice natively exposes its OpenAPI JSON at the standard `/v3/api-docs` endpoint. Legacy systems can still use `/swagger.json`.

WSO2 Configuration: Enable this by adding the `wso2` block to your `config.yaml`.

```
go-duck:
integrations:
wso2:
enabled: true
publisher-url: "https://localhost:9443/api/am/publisher/v3"
client-id: "YOUR_WSO2_CLIENT_ID"
client-secret: "YOUR_WSO2_CLIENT_SECRET"
gateway-environments:
- "Production"
- "Sandbox"
```

Note: `gateway-environments` is accepted in config but not yet wired into the registration flow — the generator hardcodes `visibility: PUBLIC` and doesn't make a separate "deploy to gateway environment" call today.
