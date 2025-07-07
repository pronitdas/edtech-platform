/**
 * Dynamic API Client Generator
 * Generates a type-safe API client at runtime based on OpenAPI specification
 */

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Record<string, EndpointDefinition>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

interface EndpointDefinition {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
}

interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema: any;
  description?: string;
  example?: any;
}

interface RequestBody {
  required?: boolean;
  content: Record<string, { schema: any }>;
}

interface Response {
  description: string;
  content?: Record<string, { schema: any; example?: any }>;
}

interface RequestOptions {
  method: string;
  path: string;
  pathParams?: Record<string, any>;
  queryParams?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export class DynamicApiClient {
  private baseUrl: string;
  private spec: OpenAPISpec | null = null;
  private authToken: string | null = null;
  private endpoints: Map<string, Function> = new Map();

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Initialize the client by fetching and parsing the OpenAPI spec
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/openapi.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
      }
      
      this.spec = await response.json();
      this.generateMethods();
      console.log(`✅ Dynamic API Client initialized with ${this.endpoints.size} endpoints`);
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      throw error;
    }
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.authToken = null;
  }

  /**
   * Generate methods for all API endpoints
   */
  private generateMethods(): void {
    if (!this.spec) {
      throw new Error('OpenAPI spec not loaded');
    }

    for (const [path, methods] of Object.entries(this.spec.paths)) {
      for (const [method, definition] of Object.entries(methods)) {
        const methodName = this.generateMethodName(definition, method, path);
        const endpointFunction = this.createEndpointFunction(method, path, definition);
        
        this.endpoints.set(methodName, endpointFunction);
        
        // Dynamically add method to the class instance
        (this as any)[methodName] = endpointFunction;
      }
    }
  }

  /**
   * Generate a camelCase method name from the endpoint definition
   */
  private generateMethodName(definition: EndpointDefinition, method: string, path: string): string {
    // Use operationId if available
    if (definition.operationId) {
      return this.toCamelCase(definition.operationId);
    }

    // Generate from method and path
    const cleanPath = path
      .replace(/[{}]/g, '') // Remove path parameter braces
      .replace(/\//g, '_') // Replace slashes with underscores
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove special characters
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    return this.toCamelCase(`${method}_${cleanPath}`);
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  /**
   * Create a function for a specific API endpoint
   */
  private createEndpointFunction(method: string, path: string, definition: EndpointDefinition): Function {
    return async (params: any = {}) => {
      const requestOptions = this.buildRequestOptions(method, path, definition, params);
      return this.makeRequest(requestOptions);
    };
  }

  /**
   * Build request options from parameters
   */
  private buildRequestOptions(
    method: string, 
    path: string, 
    definition: EndpointDefinition, 
    params: any
  ): RequestOptions {
    const pathParams: Record<string, any> = {};
    const queryParams: Record<string, any> = {};
    let body: any = undefined;

    // Process parameters
    if (definition.parameters) {
      for (const param of definition.parameters) {
        const value = params[param.name];
        
        if (param.required && value === undefined) {
          throw new Error(`Required parameter '${param.name}' is missing`);
        }

        if (value !== undefined) {
          switch (param.in) {
            case 'path':
              pathParams[param.name] = value;
              break;
            case 'query':
              queryParams[param.name] = value;
              break;
          }
        }
      }
    }

    // Process request body
    if (definition.requestBody && params.body !== undefined) {
      body = params.body;
    }

    // Handle file uploads (multipart/form-data)
    if (definition.requestBody?.content?.['multipart/form-data']) {
      const formData = new FormData();
      
      if (params.files && Array.isArray(params.files)) {
        params.files.forEach((file: File) => {
          formData.append('files', file);
        });
      }
      
      // Add other form fields
      Object.keys(params).forEach(key => {
        if (key !== 'files' && key !== 'body') {
          formData.append(key, params[key]);
        }
      });
      
      body = formData;
    }

    return {
      method: method.toUpperCase(),
      path,
      pathParams,
      queryParams,
      body,
      headers: params.headers || {}
    };
  }

  /**
   * Make HTTP request with built options
   */
  private async makeRequest(options: RequestOptions): Promise<any> {
    let url = `${this.baseUrl}${options.path}`;

    // Replace path parameters
    for (const [key, value] of Object.entries(options.pathParams || {})) {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    }

    // Add query parameters
    if (options.queryParams && Object.keys(options.queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.queryParams)) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item));
        } else {
          searchParams.append(key, value);
        }
      }
      url += `?${searchParams.toString()}`;
    }

    // Prepare headers
    const headers: Record<string, string> = { ...options.headers };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Set content type for JSON requests
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Prepare request options
    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body) {
      fetchOptions.body = options.body instanceof FormData 
        ? options.body 
        : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${responseData?.detail || responseData || response.statusText}`);
      }

      return responseData;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * Get available endpoints and their descriptions
   */
  getAvailableEndpoints(): Array<{ name: string; description?: string; tags?: string[] }> {
    if (!this.spec) {
      return [];
    }

    const endpoints: Array<{ name: string; description?: string; tags?: string[] }> = [];
    
    for (const [path, methods] of Object.entries(this.spec.paths)) {
      for (const [method, definition] of Object.entries(methods)) {
        const methodName = this.generateMethodName(definition, method, path);
        endpoints.push({
          name: methodName,
          description: definition.summary || definition.description,
          tags: definition.tags
        });
      }
    }

    return endpoints.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get API documentation for a specific endpoint
   */
  getEndpointDoc(methodName: string): any {
    if (!this.spec) {
      return null;
    }

    for (const [path, methods] of Object.entries(this.spec.paths)) {
      for (const [method, definition] of Object.entries(methods)) {
        const generatedName = this.generateMethodName(definition, method, path);
        if (generatedName === methodName) {
          return {
            method: method.toUpperCase(),
            path,
            summary: definition.summary,
            description: definition.description,
            parameters: definition.parameters,
            tags: definition.tags
          };
        }
      }
    }

    return null;
  }
}

// Convenience function to create and initialize a client
export async function createApiClient(baseUrl?: string): Promise<DynamicApiClient> {
  const client = new DynamicApiClient(baseUrl);
  await client.initialize();
  return client;
}

// Export types for external use
export type { OpenAPISpec, EndpointDefinition, Parameter, RequestBody, Response };