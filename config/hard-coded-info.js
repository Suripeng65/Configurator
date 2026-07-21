const hardCodedInfo = {
  dataTable: {
    dateFormat: 'M/dd/yyyy',
    noDataMessage:
      'There are no data values for the selected monitors and settings applied in the interface',
    tooManyRowsMessage: 'Requires more selections to generate manageable table',
  },
  dataErrorText:
    'Please check dataset configurations. This monitor does not contain the required data columns for this chart.',
  disclaimerText: 'CMS sensitive information - DO NOT DISTRIBUTE',
  disclaimerTextFullNav:
    'This system contains Sensitive Information, including sensitive PII and/or PHI, intended for US Government-authorized use only. Unauthorized or improper use of this system may result in civil and criminal penalties. Access to any unauthorized information does not constitute authorization to access or use such information. Please notify your project contact if you have gained access to any unauthorized information.',
  disclaimerTextFullCsv:
    'This file contains Sensitive Information including sensitive PII and/or PHI intended for US Government-authorized use only. Unauthorized or improper use of this file may result in civil and criminal penalties. Access to any unauthorized information does not constitute authorization to access or use such information. Please contact the ADAPT support team if you have gained access to any unauthorized information.',
  mapFullDisclaimerText:
    'This report contains Sensitive Information, including sensitive PII and/or PHI, intended for US Government-authorized use only. Unauthorized or improper use of this report may result in civil and criminal penalties. Access to any unauthorized information does not constitute authorization to access or use such information. Please contact the ADAPT support team if you have gained access to any unauthorized information.',
  AKCenterLatitude: 65,
  AKCenterLongitude: -148,
  AKXMax: -4949803.764455184,
  AKXMin: -28000765.510353237,
  AKYMax: 11888029.441509878,
  AKYMin: 7328713.578356868,
  waterLabelsWithIslands: [
    'MP',
    'GU',
    'AS',
    'HI',
    'PR',
    'VI',
    'DC',
    'MD',
    'DE',
    'NJ',
    'CT',
    'RI',
    'MA',
    'NH',
  ],
  posColorSets: {
    1: ['#FF9C33'],
    2: ['#FF9C33', '#B52C4D'],
    3: ['#FF9C33', '#FF4242', '#B52C4D'],
    4: ['#FF9C33', '#FF6F3B', '#DA3748', '#871D53'],
    5: ['#FF9C33', '#FF6F3B', '#FF4242', '#DA3748', '#871D53'],
    6: ['#FF9C33', '#FF6F3B', '#FF4242', '#DA3748', '#B52C4D', '#871D53'],
    7: [
      '#FFBD48',
      '#FF9C33',
      '#FF6F3B',
      '#FF4242',
      '#DA3748',
      '#B52C4D',
      '#871D53',
    ],
    8: [
      '#FFDE5C',
      '#FFBD48',
      '#FF9C33',
      '#FF6F3B',
      '#FF4242',
      '#DA3748',
      '#B52C4D',
      '#871D53',
    ],
  },
  negColorSets: {
    1: ['#99DAFF'],
    2: ['#73C2EE', '#99DAFF'],
    3: ['#4DA9DD', '#73C2EE', '#99DAFF'],
    4: ['#2790CC', '#4DA9DD', '#73C2EE', '#99DAFF'],
    5: ['#0077BB', '#2790CC', '#4DA9DD', '#73C2EE', '#99DAFF'],
    6: ['#0663A5', '#0077BB', '#2790CC', '#4DA9DD', '#73C2EE', '#99DAFF'],
    7: [
      '#0C4E8E',
      '#0663A5',
      '#0077BB',
      '#2790CC',
      '#4DA9DD',
      '#73C2EE',
      '#99DAFF',
    ],
    8: [
      '#10407F',
      '#0C4E8E',
      '#0663A5',
      '#0077BB',
      '#2790CC',
      '#4DA9DD',
      '#73C2EE',
      '#99DAFF',
    ],
  },
  adaptColorPallete: {
    1: ['#0077bb'],
    2: ['#0077bb', '#ff4242'],
    3: ['#0077bb', '#6ced92', '#ff4242'],
    4: ['#0077bb', '#6ced92', '#ffde5c', '#ff4242'],
    5: ['#0077bb', '#6ced92', '#ffde5c', '#ff4242', '#871d53'],
    6: ['#0077bb', '#2eb4af', '#6ced92', '#ffde5c', '#ff4242', '#871d53'],
    7: [
      '#10407f',
      '#0077bb',
      '#2eb4af',
      '#6ced92',
      '#ffde5c',
      '#ff4242',
      '#871d53',
    ],
    8: [
      '#10407f',
      '#0077bb',
      '#2eb4af',
      '#6ced92',
      '#ffde5c',
      'ff9c33',
      '#ff4242',
      '#871d53',
    ],
    sequential: {
      blue: [
        '#10407f',
        '#0c4e8e',
        '#0663a6',
        '#0077bb',
        '#2790cc',
        '#4da9dd',
        '#73c2ee',
        '#99daff',
      ],
    },
  },
  stateNames: [
    'Alabama',
    'Alaska',
    'American Samoa',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'District of Columbia',
    'Florida',
    'Georgia',
    'Guam',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Northern Marianas',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Puerto Rico',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Virgin Islands',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
  ],
  stateHeatmap: {
    regionTooltipMetric: 'Selected Measure',
    facilityTooltipMetric: 'Selected Measure',
    zoomDefaultText: 'All Counties',
    defaultMapColors: [
      '#dbe2af',
      '#edd96e',
      '#f3bf5e',
      '#e89b53',
      '#cf7047',
      '#a93e3c',
      '#7a002d',
    ],
    defaultFacilityColors: [
      '#dbe2af',
      '#edd96e',
      '#f3bf5e',
      '#e89b53',
      '#cf7047',
      '#a93e3c',
      '#7a002d',
    ],
    zeroColor: '#ffffff',
    naColor: '#e0e0e0',
    testingMonitorDistributions: {
      breakpoints: [
        50000, 200000, 225000, 250000, 270000, 280000, 300000, 1000000,
      ],
      max: 1000000,
      threshold: 0,
      total_obs: 0,
    },
  },
  nationalHeatmap: {
    regionTooltipMetric: 'Selected Measure',
    zoomDefaultText: 'All States',
    titleLabel: 'United States',
    defaultColors: [
      '#dbe2af',
      '#edd96e',
      '#f3bf5e',
      '#e89b53',
      '#cf7047',
      '#a93e3c',
      '#7a002d',
    ],
    zeroColor: '#ffffff',
    naColor: '#e0e0e0',
    testingMonitorDistributions: {
      breakpoints: [
        1000000, 2000000, 5000000, 10000000, 15000000, 20000000, 30000000,
        40000000,
      ],
      max: 50000000,
      threshold: 0,
      total_obs: 0,
    },
  },
  pieChart: {
    noCategoryKey: "All"
  },
  scatterplot: {
    noCategoryKey: 'All Categories',
    colorDomain: [100000, 200000, 300000, 400000], // real data will be categorical (OC1, OC2, OC3, etc.)
    colorRange: ['#A9A9A9', '#FFC300', '#FF5733', '#C70039'],
    colorSet: ['#0077bb', '#ff4242', '#6ced92', '#ffde5c', '#871d53', '#2eb4af', '#10407f', '#ff9c33', '#ff773d', '#b6e677'],
    allowedMarkerSymbols: [
  'circle',
  'square',
  'diamond',
  'triangle',
  'triangle-down'
],
series: {
        marker: {
          lineColor: '#fff',
          lineWidth: 0.5,
          radius: 4,
          states: {
            hover: {
              lineColor: '#2e2e2e',
              lineWidth: 2,
              radius: 6
            },
            select: {
              fillColor: undefined,
              lineColor: '#2e2e2e',
              lineWidth: 2,
              radius: 0
            }
          }
        }
      }
  },
  sideMenuViewSelect: {
    defaultText: 'Select state',
  },
  chartHeight: '600',
  chartLegend: {
    heightDefault: 13,
    widthDefault: 13,
    chartSpacingBottom: 0,
    legendLayout: 'vertical',
    legendMaxHeight: 800,
    legendMargin: 0,
    legendPadding: 15.5,
    legendItemMarginTop: 3,
    legendItemMarginBottom: 3,
    legendItemStyle: {
      default: {
        color: '#666',
        fontWeight: 600,
        fontFamily: 'Roboto',
        fontSize: '16px',
        textOverflow: undefined,
      },
      light: {
        color: '#000000',
        fontWeight: 600,
        fontFamily: 'Roboto',
        fontSize: '16px',
        textOverflow: undefined,
      },
      dark: {
        color: '#ffffff',
        fontWeight: 600,
        fontFamily: 'Roboto',
        fontSize: '16px',
        textOverflow: undefined,
      },
    },
    legendItemHoverStyle: {
      default: {
        pointerEvents: 'none',
        color: '#666',
      },
      light: {
        pointerEvents: '#000000',
        color: '#666',
      },
      dark: {
        pointerEvents: 'none',
        color: '#ffffff',
      },
    },
    legendItemNormalFontWeight: 400,
    legendSymbolPadding: 8,
    legendTextColor: {
      default: '#666',
      light: '#000000',
      dark: '#ffffff',
    },
  },
  chartCaption: {
    captionColor: '#666',
    captionAlign: 'center',
    captionAlignScatterplot: 'right',
    captionVerticalAlign: 'top',
    captionFontSize: '16px',
    captionFont: 'Roboto',
  },
  lineChart: {
    aggregateLvlLabels: {
      NT: 'National',
      ST: 'State',
    },
    defaultSeriesLineAdditions: {
      dashStyle: 'Solid',
      marker: {
        symbol: 'circle',
      },
    },
    patternedSeriesLineAdditions: [
      {
        dashStyle: 'ShortDash',
        marker: {
          symbol: 'square',
        },
      },
      {
        dashStyle: 'LongDash',
        marker: {
          symbol: 'circle',
        },
      },
      {
        dashStyle: 'ShortDot',
        marker: {
          symbol: 'diamond',
        },
      },
      {
        dashStyle: 'ShortDashDot',
        marker: {
          symbol: 'triangle',
        },
      },
      {
        dashStyle: 'ShortDashDotDot',
        marker: {
          symbol: 'triangle-down',
        },
      },
      {
        dashStyle: 'LongDashDot',
        marker: {
          symbol: 'star',
        },
      },
    ],
  },
  crossSectionCharts: {
    barChartSingleColor: '#7cb5ec',
    defaultColors: [
      '#0077bb',
      '#ee7733',
      '#009988',
      '#cc3311',
      '#33bbee',
      '#ee3377',
    ],
    patternPaths: [
      'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11',
      'M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9',
      'M 3 0 L 3 10 M 8 0 L 8 10',
      'M 0 3 L 10 3 M 0 8 L 10 8',
      'M 0 3 L 5 3 L 5 0 M 5 10 L 5 7 L 10 7',
      'M 3 3 L 8 3 L 8 8 L 3 8 Z',
    ],
  },
  textColorMapping: {
    '#fff': '#000',
    '#dbe2af': '#000',
    '#edd96e': '#000',
    '#f3bf5e': '#000',
    '#e89b53': '#000',
    '#cf7047': '#000',
    '#a93e3c': '#fff',
    '#7a002d': '#fff',
    '#e0e0e0': '#000',
  },
  colorToPatternMapping: {
    '#ffffff': 1,
    '#dbe2af': 2,
    '#edd96e': 3,
    '#f3bf5e': 4,
    '#e89b53': 5,
    '#cf7047': 6,
    '#a93e3c': 7,
    '#7a002d': 8,
    '#bbbbbb': 9,
  },
  colorToPatternMappingRGB: {
    'rgb(255, 255, 255)': 1,
    'rgb(219, 226, 175)': 2,
    'rgb(237, 217, 110)': 3,
    'rgb(243, 191, 94)': 4,
    'rgb(232, 155, 83)': 5,
    'rgb(207, 112, 71)': 6,
    'rgb(169, 62, 60)': 7,
    'rgb(122, 0, 45)': 8,
    'rgb(187, 187, 187)': 9,
  },
  colorToPatternUrlMapping: {
    '#ffffff':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuMScgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDIgNSBMIDUgMiBMIDggNSBMIDUgOCBaJyBzdHlsZT0nc3Ryb2tlOnJnYigwLCAwLCAwKTsgc3Ryb2tlLXdpZHRoOjE7IGZpbGw6bm9uZScvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsbD0ndXJsKCNQYXR0ZXJuMSknLz48L3N2Zz4=',
    '#dbe2af':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuMicgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDAgMCBMIDEwIDEwIE0gOSAtMSBMIDExIDEgTSAtMSA5IEwgMSAxMScgc3R5bGU9J3N0cm9rZTpyZ2IoMjE5LCAyMjYsIDE3NSk7IHN0cm9rZS13aWR0aDozOyBmaWxsOm5vbmUnLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9J3VybCgjUGF0dGVybjIpJy8+PC9zdmc+',
    '#edd96e':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuMycgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDAgMTAgTCAxMCAwIE0gLTEgMSBMIDEgLTEgTSA5IDExIEwgMTEgOScgc3R5bGU9J3N0cm9rZTpyZ2IoMjM3LCAyMTcsIDExMCk7IHN0cm9rZS13aWR0aDozOyBmaWxsOm5vbmUnLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9J3VybCgjUGF0dGVybjMpJy8+PC9zdmc+',
    '#f3bf5e':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuNCcgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDMgMCBMIDMgMTAgTSA4IDAgTCA4IDEwJyBzdHlsZT0nc3Ryb2tlOnJnYigyNDMsIDE5MSwgOTQpOyBzdHJva2Utd2lkdGg6MzsgZmlsbDpub25lJy8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSd1cmwoI1BhdHRlcm40KScvPjwvc3ZnPg==',
    '#e89b53':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuNScgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDAgMyBMIDEwIDMgTSAwIDggTCAxMCA4JyBzdHlsZT0nc3Ryb2tlOnJnYigyMDcsIDExMiwgNzEpOyBzdHJva2Utd2lkdGg6MTsgZmlsbDpub25lJy8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSd1cmwoI1BhdHRlcm41KScvPjwvc3ZnPg==',
    '#cf7047':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuNicgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDAgMyBMIDUgMyBMIDUgMCBNIDUgMTAgTCA1IDcgTCAxMCA3JyBzdHlsZT0nc3Ryb2tlOnJnYigyMzIsIDE1NSwgODMpOyBzdHJva2Utd2lkdGg6MTsgZmlsbDpub25lJy8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSd1cmwoI1BhdHRlcm42KScvPjwvc3ZnPg==',
    '#a93e3c':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuNycgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDMgMyBMIDggMyBMIDggOCBMIDMgOCBaJyBzdHlsZT0nc3Ryb2tlOnJnYigxNjksIDYyLCA2MCk7IHN0cm9rZS13aWR0aDoxOyBmaWxsOm5vbmUnLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9J3VybCgjUGF0dGVybjcpJy8+PC9zdmc+',
    '#7a002d':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuOCcgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDUgNSBtIC00IDAgYSA0IDQgMCAxIDEgOCAwIGEgNCA0IDAgMSAxIC04IDAnIHN0eWxlPSdzdHJva2U6cmdiKDEyMiwgMCwgNDUpOyBzdHJva2Utd2lkdGg6MTsgZmlsbDpub25lJy8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSd1cmwoI1BhdHRlcm44KScvPjwvc3ZnPg==',
    '#bbbbbb':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuOScgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDEwIDMgTCA1IDMgTCA1IDAgTSA1IDEwIEwgNSA3IEwgMCA3JyBzdHlsZT0nc3Ryb2tlOnJnYigwLCAwLCAwKTsgc3Ryb2tlLXdpZHRoOjE7IGZpbGw6bm9uZScvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsbD0ndXJsKCNQYXR0ZXJuOSknLz48L3N2Zz4=',
    '#e0e0e0':
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdQYXR0ZXJuOScgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBwYXR0ZXJuVW5pdHM9J3VzZXJTcGFjZU9uVXNlJz48cGF0aCBkPSdNIDEwIDMgTCA1IDMgTCA1IDAgTSA1IDEwIEwgNSA3IEwgMCA3JyBzdHlsZT0nc3Ryb2tlOnJnYigwLCAwLCAwKTsgc3Ryb2tlLXdpZHRoOjE7IGZpbGw6bm9uZScvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsbD0ndXJsKCNQYXR0ZXJuOSknLz48L3N2Zz4=',
    nullValue:
      'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMTAwJScgd2lkdGg9JzEwMCUnPjxkZWZzPjxwYXR0ZXJuIGlkPSdudWxsVmFsdWUnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnIHBhdHRlcm5Vbml0cz0ndXNlclNwYWNlT25Vc2UnPjxwYXRoIGQ9Ik0tMSwxIGwyLC0yIE0wLCA0IGw0LC00IE0zLDUgbDIsLTIiIHN0eWxlPSJzdHJva2U6YmxhY2s7IHN0cm9rZS13aWR0aDoxIiAvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsbD0ndXJsKCNudWxsVmFsdWUpJy8+PC9zdmc+',
  },
  csvGenePopup: {
    preDownloadingMsg: [
      'Please note: The first row in the .csv you are downloading will be a security statement. You may need to delete that row before using the file in some programs.',
      'Please note: The table in the .csv you are downloading will only contain the valid cross of measures you selected in the Generate CVS tab.',
    ],
    downloadingMsg: [
      'Your file download is currently in progress.',
      'Please note, if your file is not available within 15 minutes in your portal, please contact your project contact.',
    ],
  },
  downloadPopup: {
    downloadingMsg: [
      'Clicking "OK" will initiate the process of downloading the file to your project portal. Please note, if your file is not available within 15 minutes at that location, please notify your project contact.',
    ],
    disclaimerText:
      'This system contains Sensitive Information, including sensitive PII and/or PHI, intended for US Government-authorized use only. Unauthorized or improper use of this system may result in civil and criminal penalties. Access to any unauthorized information does not constitute authorization to access or use such information. Please contact the ADAPT support team if you have gained access to any unauthorized information.',
    /**
     * @deprecated read report types from ui template config instead
     */
    fileFormatItems: [
      {
        id: 0,
        key: 'reportPDF',
        name: 'Report as PDF',
        isChecked: false,
      },
      {
        id: 1,
        key: 'dataCSV',
        name: 'Data as CSV',
        isChecked: false,
      },
    ],
    fileFormatItemsForQuery: [
      {
        id: 0,
        key: 'firstNRowsCSV',
        name: 'First 1000 rows of the query results as CSV',
        radioName: 'queryOptions',
        isChecked: false,
      },
      {
        id: 1,
        key: 'allRowsCSV',
        name: 'All rows of the query results as CSV',
        radioName: 'queryOptions',
        isChecked: false,
      },
    ],
    fileFormatItemsForQueryCheckbox: {
      id: 0,
      key: 'summaryQueryCSV',
      name: 'Summary Statistics as CSV',
      isChecked: false,
    },
  },
  monitorColors: {
    default: ['#0077bb', '#91371C', '#009988', '#33bbee', '#ee3377', '#ee9032','#e4d354'],
    light: ['#358fe3', '#2b908f', '#a88c00', '#db680a', '#8085e9', '#f15c80','#e4d354'],
    dark: ['#7cb5ec', '#2b908f', '#e4d354', '#f7a35c', '#8085e9', '#f15c80','#91371C'],
  },
  colorIndex: {
    '#0077bb': 'Dark Blue',
    '#ee7733': 'Bright Orange',
    '#009988': 'Dark Cyan',
    '#cc3311': 'Strong Red',
    '#33bbee': 'Bright Blue',
    '#ee3377': 'Strong Pink',
    '#358fe3': 'Strong Blue',
    '#a88c00': 'Dark Yellow',
    '#db680a': 'Strong Orange',
    '#8085e9': 'Soft Purple',
    '#f15c80': 'Bright Pink',
    '#7cb5ec': 'Soft Blue',
    '#2b908f': 'Dark Cyan',
    '#e4d354': 'Bright Yellow',
    '#f7a35c': 'Soft Orange',
  },
  chartBackgroundColor: {
    default: '#ffffff',
    light: '#ffffff',
    dark: '#000000',
  },
  xAxisLineColor: {
    default: '#ccc',
    light: '#000000',
    dark: '#ffffff',
  },
  xAxisTickColor: {
    default: '#ccc',
    light: '#000000',
    dark: '#ffffff',
  },
  xAxisTitleStyle: {
    default: {
      color: '#333',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: '18px',
    },
    light: {
      color: '#000000',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: '18px',
    },
    dark: {
      color: '#ffffff',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: '18px',
    },
  },
  xAxisLabelsStyle: {
    default: {
      color: '#666',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
    light: {
      color: '#000000',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
    dark: {
      color: '#ffffff',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
  },
  yAxisGridLineColor: {
    default: '#ccc',
    light: '#000000',
    dark: '#ffffff',
  },
  yAxisTitleStyle: {
    default: {
      color: '#333',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: '18px',
    },
    light: {
      color: '#000000',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: '18px',
    },
    dark: {
      color: '#ffffff',
      fontWeight: 700,
      fontFamily: 'Roboto',
      fontSize: '18px',
    },
  },
  yAxisLabelsStyle: {
    default: {
      color: '#666',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
    light: {
      color: '#000000',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
    dark: {
      color: '#ffffff',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
  },
  yAxisTickColor: {
    default: '#ccc',
    light: '#000000',
    dark: '#ffffff',
  },
  yAxisLineColor: {
    default: '#ccc',
    light: '#000000',
    dark: '#ffffff',
  },
  pieLabelColor: {
    default: '#666',
    light: '#000000',
    dark: '#ffffff',
  },
  pieLabelStyle: {
    default: {
      color: '#666',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
    light: {
      color: '#000000',
      fontWeight: 600,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
    dark: {
      color: '#ffffff',
      fontWeight: 425,
      fontFamily: 'Roboto',
      fontSize: '16px',
    },
  },
  pingInterval: 10000,
  datasetDropdownConfig: {
    datasetName: 'No Dataset Selected',
    dsIdMissingInUrlWarningModalText:
      'Missing dataset selection in URL. Please confirm the dsId and use the valid URL to proceed.',
    datasetWarningModalText:
      'Changing your Dataset will erase any unsaved work in your Workspace. This action cannot be undone.\n\nAre you sure you want to change your Dataset?',
  },
}

export default hardCodedInfo
