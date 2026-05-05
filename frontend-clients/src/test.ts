import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

const mockActivatedRoute = {
  snapshot: {
    paramMap: { get: (key: string) => '1' },
  },
};

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    providers: [
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
    ],
  },
);
