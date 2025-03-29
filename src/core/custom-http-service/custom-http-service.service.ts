import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

const lodash = require('lodash');

@Injectable()
export class CustomHttpService {
  constructor(private readonly http_service: HttpService) {}

  private async handleApiCall(
    method: string,
    url: string,
    config: AxiosRequestConfig = {},
    req_body?: Object,
  ) {
    if (!!config && !!config['headers']) {
      delete config['headers'].host;
      delete config['headers']['content-length'];
    }

    const request = {
      url: url,
      headers: !!config['headers'] ? config['headers'] : {},
      body: req_body,
    };

    let resp: {
      status: number;
      statusText: string;
      headers: any;
      data: any;
    } = { status: 0, statusText: '', headers: {}, data: null };
    switch (method.toUpperCase()) {
      case 'GET': {
        resp = await lastValueFrom(this.http_service.get(url, config));
        break;
      }
      case 'POST': {
        resp = await lastValueFrom(
          this.http_service.post(url, req_body, config),
        );
        break;
      }
      case 'PATCH': {
        resp = await lastValueFrom(
          this.http_service.patch(url, req_body, config),
        );
        break;
      }
      case 'PUT': {
        resp = await lastValueFrom(
          this.http_service.put(url, req_body, config),
        );
        break;
      }
      case 'DELETE': {
        resp = await lastValueFrom(this.http_service.delete(url, config));
        break;
      }
    }

    const { status, statusText, headers, data } = resp;
    const response = {
      status,
      statusText,
      headers,
      data,
    };

    return resp;
  }

  async get(url: string, config?: AxiosRequestConfig) {
    const response = await this.handleApiCall('GET', url, config);
    return response;
  }

  async post(url: string, req_body: Object, config?: AxiosRequestConfig) {
    const response = await this.handleApiCall('POST', url, config, req_body);
    return response;
  }

  async put(url: string, req_body: Object, config?: AxiosRequestConfig) {
    const response = await this.handleApiCall('PUT', url, config, req_body);
    return response;
  }

  async patch(url: string, req_body: Object, config?: AxiosRequestConfig) {
    const response = await this.handleApiCall('PATCH', url, config, req_body);
    return response;
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    const response = await this.handleApiCall('DELETE', url, config);
    return response;
  }
}
