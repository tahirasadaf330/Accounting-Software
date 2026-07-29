// AUTO-GENERATED from SOA Excel files. Do not edit by hand.
// Regenerate if source SOA sheets change.

export interface SoaInvoice { num: string; start: string; end: string; amount: number; }
export interface SoaPayment { date: string; invoices: string; amount: number; }
export interface SoaAdjustment { type: 'DEBIT_NOTE' | 'CREDIT_NOTE'; date: string; amount: number; ref: string; }
export interface SoaContact {
  key: string;
  name: string;
  term: number;
  contactId: string;
  accountId: string;
  sales: SoaInvoice[];
  purchases: SoaInvoice[];
  receipts: SoaPayment[];
  payments: SoaPayment[];
  adjustments: SoaAdjustment[];
}

export const SOA_CONTACTS: SoaContact[] = [
  {
    "key": "42com-international-limited",
    "name": "42com International Limited USD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000001",
    "accountId": "50a0a000-0000-4000-8000-000000000001",
    "sales": [
      {
        "num": "140268",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 3605.27
      },
      {
        "num": "140481",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 4950.8
      },
      {
        "num": "140744",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 1635.06
      },
      {
        "num": "140942",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 536.54
      },
      {
        "num": "141187",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 495.68
      },
      {
        "num": "141374",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 530.25
      },
      {
        "num": "141625",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 5259.95
      },
      {
        "num": "141867",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 34158.98
      },
      {
        "num": "142095",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 12635.2
      },
      {
        "num": "142247",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 10334.36
      },
      {
        "num": "142461",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 14747.01
      },
      {
        "num": "142687",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 2966.16
      },
      {
        "num": "142929",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 6302.26
      },
      {
        "num": "143137",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 29311.28
      }
    ],
    "purchases": [
      {
        "num": "307294",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 11053.01
      },
      {
        "num": "307498",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 4352.65
      },
      {
        "num": "307585",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 7830.47
      },
      {
        "num": "307630",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 4023.84
      },
      {
        "num": "307810",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 3987.79
      },
      {
        "num": "40284",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 2436.58
      },
      {
        "num": "308037",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 2973.31
      },
      {
        "num": "308228",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 8799.83
      },
      {
        "num": "308296",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 7103.13
      },
      {
        "num": "308359",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 5324.89
      },
      {
        "num": "308527",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 8135.43
      },
      {
        "num": "308640",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 2890.77
      },
      {
        "num": "308791",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 2711.93
      },
      {
        "num": "308821",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 4027.87
      }
    ],
    "receipts": [
      {
        "date": "2026-04-13",
        "invoices": "141187, 141374, 141625, 141867 ",
        "amount": 22247.36
      },
      {
        "date": "2026-04-24",
        "invoices": "142095",
        "amount": 5532.07
      },
      {
        "date": "2026-05-15",
        "invoices": "142247",
        "amount": 5009.47
      },
      {
        "date": "2026-05-28",
        "invoices": "142461",
        "amount": 6611.58
      },
      {
        "date": "2026-06-26",
        "invoices": "142687, 142929",
        "amount": 3665.72
      },
      {
        "date": "2026-07-10",
        "invoices": "143137",
        "amount": 25283.4
      }
    ],
    "payments": [
      {
        "date": "2026-01-14",
        "invoices": "307294",
        "amount": 7447.74
      },
      {
        "date": "2026-02-02",
        "invoices": "307498, 307585",
        "amount": 5597.26
      },
      {
        "date": "2026-03-04",
        "invoices": "307630",
        "amount": 3487.3
      }
    ],
    "adjustments": []
  },
  {
    "key": "airon-fzc-llc",
    "name": "AIRON FZC LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000002",
    "accountId": "50a0a000-0000-4000-8000-000000000002",
    "sales": [
      {
        "num": "142991",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 224.47
      },
      {
        "num": "143152",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 214.84
      }
    ],
    "purchases": [
      {
        "num": "28845",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1052.15
      },
      {
        "num": "28938",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3372.55
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "apelby-gmbh",
    "name": "APELBY GMBH",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000003",
    "accountId": "50a0a000-0000-4000-8000-000000000003",
    "sales": [
      {
        "num": "143292",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 259.42
      }
    ],
    "purchases": [
      {
        "num": "2606HAYO06",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1903.01
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "bharti-airtel-uk",
    "name": "BHARTI AIRTEL UK LIMITED",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000004",
    "accountId": "50a0a000-0000-4000-8000-000000000004",
    "sales": [
      {
        "num": "143279",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 12474.11
      }
    ],
    "purchases": [
      {
        "num": "37688",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 9373.87
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "brilliant-telecom",
    "name": "BRILLIANT TELECOM",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000005",
    "accountId": "50a0a000-0000-4000-8000-000000000005",
    "sales": [
      {
        "num": "140796",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 8499.42
      },
      {
        "num": "141040",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 7544.12
      },
      {
        "num": "141265",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 5954.4
      },
      {
        "num": "141474",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 5279.29
      },
      {
        "num": "141699",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 1515.25
      },
      {
        "num": "141943",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 1490.12
      },
      {
        "num": "142131",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 1091.42
      },
      {
        "num": "142377",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 4390.17
      },
      {
        "num": "142564",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 11513.65
      },
      {
        "num": "142857",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 4238.29
      },
      {
        "num": "143039",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 5451.74
      },
      {
        "num": "143289",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2999.38
      }
    ],
    "purchases": [
      {
        "num": "68204",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 24.54
      },
      {
        "num": "900003823",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 17.07
      },
      {
        "num": "900003931",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 13.99
      },
      {
        "num": "68280",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 75.17
      },
      {
        "num": "68441",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 6.41
      },
      {
        "num": "900004080",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 6.2
      },
      {
        "num": "68511",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 8.85
      },
      {
        "num": "900004193",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 6.85
      },
      {
        "num": "68824",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 21.63
      },
      {
        "num": "900004340",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 18.07
      },
      {
        "num": "68894",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 0.67
      },
      {
        "num": "900004470",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 129.87
      },
      {
        "num": "900004638",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 723.03
      },
      {
        "num": "900004759",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 2150.7
      },
      {
        "num": "900004928",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 5210.85
      },
      {
        "num": "900005047",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 4033.95
      },
      {
        "num": "900005239",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 3878.46
      },
      {
        "num": "900005361",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2539.48
      }
    ],
    "receipts": [
      {
        "date": "2026-01-26",
        "invoices": "140796",
        "amount": 8457.81
      },
      {
        "date": "2026-02-12",
        "invoices": "141040",
        "amount": 7454.95
      },
      {
        "date": "2026-02-25",
        "invoices": "141265",
        "amount": 5941.79
      },
      {
        "date": "2026-03-13",
        "invoices": "141474",
        "amount": 5263.6
      },
      {
        "date": "2026-03-20",
        "invoices": "141699",
        "amount": 1475.55
      },
      {
        "date": "2026-05-15",
        "invoices": "141943, 142131, 142377, 142564",
        "amount": 8000
      },
      {
        "date": "2026-06-17",
        "invoices": "141943, 142131, 142377, 142564, 142857",
        "amount": 2474.58
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "c3ntro-telecom-ipbtel",
    "name": "C3NTRO TELECOM (IPBTEL, LLC DBA)",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000006",
    "accountId": "50a0a000-0000-4000-8000-000000000006",
    "sales": [
      {
        "num": "143222",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 553.69
      }
    ],
    "purchases": [
      {
        "num": "IN-IPBTEL-016364",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 4922.69
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "dial-telecommunications",
    "name": "DIAL TELECOMMUNICATIONS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000007",
    "accountId": "50a0a000-0000-4000-8000-000000000007",
    "sales": [
      {
        "num": "140288",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 3.88
      },
      {
        "num": "140439",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 9047.6
      },
      {
        "num": "140712",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 3791.84
      },
      {
        "num": "140899",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 5410.18
      },
      {
        "num": "141144",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 6426.99
      },
      {
        "num": "141333",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 2617.23
      },
      {
        "num": "141579",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 2478.08
      },
      {
        "num": "141783",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 7472.26
      },
      {
        "num": "142032",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 10261.45
      },
      {
        "num": "142280",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 10004.82
      },
      {
        "num": "142519",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 9523.4
      },
      {
        "num": "142771",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 20357.3
      },
      {
        "num": "142994",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 14374.07
      },
      {
        "num": "143211",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11828.88
      }
    ],
    "purchases": [
      {
        "num": "81190",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 5875.14
      },
      {
        "num": "81485",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 11582.15
      },
      {
        "num": "81800",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 5830.38
      },
      {
        "num": "82075",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 7478.01
      },
      {
        "num": "82498",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 24266.26
      },
      {
        "num": "82687",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 7147.31
      },
      {
        "num": "83140",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 10414.81
      },
      {
        "num": "68019",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 1.5
      },
      {
        "num": "83432",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 5450.74
      },
      {
        "num": "68212",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 0.35
      },
      {
        "num": "83766",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 3708.41
      },
      {
        "num": "68427",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 6.65
      },
      {
        "num": "84060",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 1537.97
      },
      {
        "num": "84395",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 13870.55
      },
      {
        "num": "84749",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 18195.09
      },
      {
        "num": "85160",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 4884.79
      },
      {
        "num": "85460",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 12447.69
      }
    ],
    "receipts": [
      {
        "date": "2026-05-11",
        "invoices": "142032, 142280, 142519",
        "amount": 14556.13
      }
    ],
    "payments": [
      {
        "date": "2026-01-08",
        "invoices": "81190",
        "amount": 5871.26
      },
      {
        "date": "2026-01-26",
        "invoices": "81485",
        "amount": 2534.55
      },
      {
        "date": "2026-03-09",
        "invoices": "81800, 82075, 82498",
        "amount": 21945.64
      },
      {
        "date": "2026-03-16",
        "invoices": "82687",
        "amount": 4530.08
      },
      {
        "date": "2026-04-03",
        "invoices": "",
        "amount": 5460.15
      }
    ],
    "adjustments": []
  },
  {
    "key": "didww",
    "name": "DIDWW",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000008",
    "accountId": "50a0a000-0000-4000-8000-000000000008",
    "sales": [
      {
        "num": "140470",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 16124.12
      },
      {
        "num": "140931",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 21657.06
      },
      {
        "num": "141362",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 25857.97
      },
      {
        "num": "141823",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 19902.87
      },
      {
        "num": "142304",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 20157.1
      },
      {
        "num": "142797",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 20761.9
      },
      {
        "num": "143233",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 17280.05
      }
    ],
    "purchases": [
      {
        "num": "03-160197-202512-01",
        "start": "2025-12-01",
        "end": "2025-12-31",
        "amount": 145.94
      },
      {
        "num": "03-160197-202601-01",
        "start": "2026-01-01",
        "end": "2026-01-31",
        "amount": 203.67
      },
      {
        "num": "INVOICE 03-160197-202602-01",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 197.03
      },
      {
        "num": "03-160197-202603-01",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "amount": 410.26
      },
      {
        "num": "03-160197-202604-01",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 200.7
      },
      {
        "num": "03-160197-202605-01",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 100.58
      },
      {
        "num": "03-160197-202606-01\r\n",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 201.04
      }
    ],
    "receipts": [
      {
        "date": "2026-01-22",
        "invoices": "140470",
        "amount": 15952.64
      },
      {
        "date": "2026-02-20",
        "invoices": "140931",
        "amount": 21453.39
      },
      {
        "date": "2026-03-19",
        "invoices": "141362",
        "amount": 25660.94
      },
      {
        "date": "2026-04-16",
        "invoices": "141823",
        "amount": 19492.61
      },
      {
        "date": "2026-05-22",
        "invoices": "142304",
        "amount": 19956.4
      },
      {
        "date": "2026-06-19",
        "invoices": "142797",
        "amount": 20661.32
      }
    ],
    "payments": [],
    "adjustments": [
      {
        "type": "CREDIT_NOTE",
        "date": "2025-12-31",
        "amount": 25.54,
        "ref": "140470"
      }
    ]
  },
  {
    "key": "direct-telco-llc",
    "name": "DIRECT TELCO LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000009",
    "accountId": "50a0a000-0000-4000-8000-000000000009",
    "sales": [
      {
        "num": "143230",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 425.35
      }
    ],
    "purchases": [
      {
        "num": "DT/HY/01JUL2026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2156.3
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ecocarrier-inc",
    "name": "ECOCARRIER INC",
    "term": 5,
    "contactId": "50a0c000-0000-4000-8000-000000000010",
    "accountId": "50a0a000-0000-4000-8000-000000000010",
    "sales": [
      {
        "num": "143183",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 22.26
      }
    ],
    "purchases": [
      {
        "num": "119334",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 6744.72
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-09",
        "invoices": "143183",
        "amount": 6722.46
      }
    ],
    "adjustments": []
  },
  {
    "key": "first-sunrise-group",
    "name": "FIRST SUNRISE GROUP, INC.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000011",
    "accountId": "50a0a000-0000-4000-8000-000000000011",
    "sales": [
      {
        "num": "143146",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 405.81
      }
    ],
    "purchases": [
      {
        "num": "20260740165570",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1542.43
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "globe-teleservices",
    "name": "GLOBE TELESERVICES",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000012",
    "accountId": "50a0a000-0000-4000-8000-000000000012",
    "sales": [
      {
        "num": "143153",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3519.52
      }
    ],
    "purchases": [
      {
        "num": "200368",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1111.45
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ipvoip-s-r",
    "name": "IPVOIP s.r.o.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000013",
    "accountId": "50a0a000-0000-4000-8000-000000000013",
    "sales": [
      {
        "num": "143108",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 118.9
      }
    ],
    "purchases": [
      {
        "num": "7682606010630",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 6867.16
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "sipstatus-global-ltd",
    "name": "SIPSTATUS GLOBAL LTD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000014",
    "accountId": "50a0a000-0000-4000-8000-000000000014",
    "sales": [
      {
        "num": "143277",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 14558.76
      }
    ],
    "purchases": [
      {
        "num": "SG2026-001215",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 6070.06
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "sync-sound-llc",
    "name": "SYNC SOUND LLC",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000015",
    "accountId": "50a0a000-0000-4000-8000-000000000015",
    "sales": [],
    "purchases": [
      {
        "num": "INV-9235180",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 1424.67
      },
      {
        "num": "INV-9235172",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 970.21
      },
      {
        "num": "INV-9235199",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 1151.54
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "t-rk-telekom",
    "name": "Türk Telekom International",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000016",
    "accountId": "50a0a000-0000-4000-8000-000000000016",
    "sales": [
      {
        "num": "143118",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1224.26
      }
    ],
    "purchases": [
      {
        "num": "9010064243",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1387.2
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "talk-to-me",
    "name": "TALK TO ME",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000017",
    "accountId": "50a0a000-0000-4000-8000-000000000017",
    "sales": [],
    "purchases": [
      {
        "num": "INV607060003",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 6514.37
      },
      {
        "num": "INV607130003",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 8944.29
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telko-ms",
    "name": "TELKO MS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000018",
    "accountId": "50a0a000-0000-4000-8000-000000000018",
    "sales": [
      {
        "num": "143171",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.07
      }
    ],
    "purchases": [
      {
        "num": " INV/IDA-USD/HAYOTEL/JUNE2026-002",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1965.14
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ultranet-telecom-ghana",
    "name": "ULTRANET TELECOM GHANA LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000019",
    "accountId": "50a0a000-0000-4000-8000-000000000019",
    "sales": [
      {
        "num": "143199",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 4772.99
      }
    ],
    "purchases": [
      {
        "num": "HT0002119­USD",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2927.68
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "voicespin-ltd",
    "name": "VOICESPIN LTD",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000020",
    "accountId": "50a0a000-0000-4000-8000-000000000020",
    "sales": [
      {
        "num": "143093",
        "start": "2026-06-22",
        "end": "2026-06-28",
        "amount": 597.15
      },
      {
        "num": "143319",
        "start": "2026-06-29",
        "end": "2026-07-05",
        "amount": 633
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vox-master-llc",
    "name": "Vox Master LLC",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000021",
    "accountId": "50a0a000-0000-4000-8000-000000000021",
    "sales": [
      {
        "num": "142941",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 909.88
      },
      {
        "num": "143127",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 98.42
      }
    ],
    "purchases": [
      {
        "num": "3713-160626",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 11169.52
      },
      {
        "num": "3713-010726",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11614.94
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-07-09",
        "invoices": "142941, 143127",
        "amount": 11516.52
      }
    ],
    "adjustments": []
  },
  {
    "key": "wic-worldcom-international",
    "name": "WIC WORLDCOM INTERNATIONAL",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000022",
    "accountId": "50a0a000-0000-4000-8000-000000000022",
    "sales": [
      {
        "num": "143143",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1236.47
      }
    ],
    "purchases": [
      {
        "num": "WIC-26003329",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 5387.62
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "b-i-c",
    "name": "B.I.C.S",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000023",
    "accountId": "50a0a000-0000-4000-8000-000000000023",
    "sales": [
      {
        "num": "U-2-103092",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 22.21
      },
      {
        "num": "143269",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 136056.99
      }
    ],
    "purchases": [
      {
        "num": "871388",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1525.17
      },
      {
        "num": "871206",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 57815.29
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "bird",
    "name": "BIRD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000024",
    "accountId": "50a0a000-0000-4000-8000-000000000024",
    "sales": [
      {
        "num": "143260",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 2315.93
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "business-telecommunications-services",
    "name": "BUSINESS TELECOMMUNICATIONS SERVICES (BTS)",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000025",
    "accountId": "50a0a000-0000-4000-8000-000000000025",
    "sales": [
      {
        "num": "143261",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 27721.84
      }
    ],
    "purchases": [
      {
        "num": "129190",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 12806.72
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "dawn-global-services",
    "name": "DAWN GLOBAL SERVICES LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000026",
    "accountId": "50a0a000-0000-4000-8000-000000000026",
    "sales": [
      {
        "num": "143190",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1237.82
      }
    ],
    "purchases": [
      {
        "num": "PRE-INVOICE-23330",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3007.89
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "galaxy-one-network",
    "name": "GALAXY ONE NETWORK PTE. LTD. (former Green Packet Global Pte Ltd)",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000027",
    "accountId": "50a0a000-0000-4000-8000-000000000027",
    "sales": [
      {
        "num": "143112",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 125.29
      }
    ],
    "purchases": [
      {
        "num": " I­042355\r\n",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 279.32
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "global-reach-communications",
    "name": "GLOBAL REACH COMMUNICATIONS",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000028",
    "accountId": "50a0a000-0000-4000-8000-000000000028",
    "sales": [
      {
        "num": "143291",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 407.31
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "idt-voip",
    "name": "IDT VOIP",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000029",
    "accountId": "50a0a000-0000-4000-8000-000000000029",
    "sales": [
      {
        "num": "143220",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 39488.7
      }
    ],
    "purchases": [
      {
        "num": "723440",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2652.61
      },
      {
        "num": "723437",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2810.05
      }
    ],
    "receipts": [
      {
        "date": "2026-07-07",
        "invoices": "143220",
        "amount": 34026.04
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "primetel-plc",
    "name": "PRIMETEL PLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000030",
    "accountId": "50a0a000-0000-4000-8000-000000000030",
    "sales": [
      {
        "num": "142942",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1761.63
      },
      {
        "num": "143169",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1306.43
      }
    ],
    "purchases": [
      {
        "num": "32269",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 2080.92
      },
      {
        "num": "32410",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 275.71
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "raza-global-inc",
    "name": "RAZA GLOBAL INC.",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000031",
    "accountId": "50a0a000-0000-4000-8000-000000000031",
    "sales": [
      {
        "num": "143293",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 13445.96
      }
    ],
    "purchases": [
      {
        "num": "Hayo173INV",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 81095.05
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "reshetcall-ltd",
    "name": "RESHETCALL LTD.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000032",
    "accountId": "50a0a000-0000-4000-8000-000000000032",
    "sales": [
      {
        "num": "143175",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 3530.03
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telecom-italia-sparkle",
    "name": "TELECOM ITALIA SPARKLE S.p.A.",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000033",
    "accountId": "50a0a000-0000-4000-8000-000000000033",
    "sales": [
      {
        "num": "143114",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 5378.59
      }
    ],
    "purchases": [
      {
        "num": "TISCCI2026002660",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 31332.42
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telegeeks-telecom-dis",
    "name": "TELEGEEKS TELECOM DiS TICARET LIMITED SiRKETI",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000034",
    "accountId": "50a0a000-0000-4000-8000-000000000034",
    "sales": [
      {
        "num": "143236",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 656.75
      }
    ],
    "purchases": [
      {
        "num": "01303520260630o",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11224.63
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telekom-deutschland-gmbh",
    "name": "TELEKOM DEUTSCHLAND GMBH",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000035",
    "accountId": "50a0a000-0000-4000-8000-000000000035",
    "sales": [
      {
        "num": "143113",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 34838.03
      }
    ],
    "purchases": [
      {
        "num": "9000560142",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 18199.02
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "teltac-worldwide-inc",
    "name": "TELTAC WORLDWIDE INC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000036",
    "accountId": "50a0a000-0000-4000-8000-000000000036",
    "sales": [
      {
        "num": "143223",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 25.7
      }
    ],
    "purchases": [
      {
        "num": "TO2026-221",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 275.37
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vinculum-communication",
    "name": "VINCULUM COMMUNICATION",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000037",
    "accountId": "50a0a000-0000-4000-8000-000000000037",
    "sales": [
      {
        "num": "143234",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 3280.31
      }
    ],
    "purchases": [
      {
        "num": "272069",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 86.93
      },
      {
        "num": "272070",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 456.74
      },
      {
        "num": "300250",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2738.18
      },
      {
        "num": "300218",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 856.72
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vonage-america",
    "name": "VONAGE AMERICA",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000038",
    "accountId": "50a0a000-0000-4000-8000-000000000038",
    "sales": [
      {
        "num": "143204",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 260.9
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "wavecrest-networks-ltd",
    "name": "WAVECREST NETWORKS LTD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000039",
    "accountId": "50a0a000-0000-4000-8000-000000000039",
    "sales": [
      {
        "num": "143214",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1175.61
      }
    ],
    "purchases": [
      {
        "num": "250-INVOICE-8196",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.04
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "we2stars-company-limited",
    "name": "WE2STARS COMPANY LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000040",
    "accountId": "50a0a000-0000-4000-8000-000000000040",
    "sales": [
      {
        "num": "143193",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2029.16
      }
    ],
    "purchases": [
      {
        "num": "DGW2S/HAY00026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11604.63
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "382-communications",
    "name": "382 COMMUNICATIONS",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000041",
    "accountId": "50a0a000-0000-4000-8000-000000000041",
    "sales": [
      {
        "num": "143023",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 212.41
      },
      {
        "num": "143251",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 33.25
      }
    ],
    "purchases": [
      {
        "num": "Hayotel-06/15/2026",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 1765.72
      },
      {
        "num": "Hayotel-06/30/2026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1368.1
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "acmetel-usa-llc",
    "name": "ACMETEL USA LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000042",
    "accountId": "50a0a000-0000-4000-8000-000000000042",
    "sales": [
      {
        "num": "142977",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 3953.31
      },
      {
        "num": "143140",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 5360.78
      }
    ],
    "purchases": [
      {
        "num": "2026/17837",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 2539.26
      },
      {
        "num": "2026/17943 ",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 990.15
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "callcaribe-inc",
    "name": "CALLCARIBE INC",
    "term": 3,
    "contactId": "50a0c000-0000-4000-8000-000000000043",
    "accountId": "50a0a000-0000-4000-8000-000000000043",
    "sales": [],
    "purchases": [
      {
        "num": "CC ­ 019049",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 4131.33
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "cima-telecom",
    "name": "CIMA TELECOM",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000044",
    "accountId": "50a0a000-0000-4000-8000-000000000044",
    "sales": [
      {
        "num": "143332",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 5673.46
      }
    ],
    "purchases": [
      {
        "num": "L1025S11741-11615V000032",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 2633.38
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "evox-trading",
    "name": "EVOX TRADING",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000046",
    "accountId": "50a0a000-0000-4000-8000-000000000046",
    "sales": [
      {
        "num": "139860",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 2928.3
      },
      {
        "num": "140119",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 1097.69
      },
      {
        "num": "140234",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 1529.53
      },
      {
        "num": "140415",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 796.96
      },
      {
        "num": "140686",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 429.71
      },
      {
        "num": "140882",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 991.87
      },
      {
        "num": "141126",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 1038.68
      },
      {
        "num": "141309",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 1807.33
      },
      {
        "num": "141566",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 1439.89
      },
      {
        "num": "141776",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 941.73
      },
      {
        "num": "142027",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 10850.68
      },
      {
        "num": "142273",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 1052.72
      },
      {
        "num": "142514",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 562.9
      },
      {
        "num": "142764",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 766.26
      },
      {
        "num": "142989",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 599.94
      },
      {
        "num": "143208",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 437.29
      }
    ],
    "purchases": [
      {
        "num": "25-11-03069",
        "start": "2025-11-01",
        "end": "2025-11-15",
        "amount": 3026.65
      },
      {
        "num": "25-11-03130",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 2438.61
      },
      {
        "num": "25-12-03235",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 1114.33
      },
      {
        "num": "25-12-03294",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 955.65
      },
      {
        "num": "26-1-03368",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 361.88
      },
      {
        "num": "26-1-03429",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 227.57
      },
      {
        "num": "26-2-03500",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 202.87
      },
      {
        "num": "26-02-03566",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 147.46
      },
      {
        "num": "26-03-03648",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 187.35
      },
      {
        "num": "26-03-03722",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 209.41
      },
      {
        "num": "26-04-03804",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 691.41
      },
      {
        "num": "26-04-03874",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 815.52
      },
      {
        "num": "26-05-03961",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 197.79
      },
      {
        "num": "26-05-04022",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 528.86
      },
      {
        "num": "26-05-04107",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 434.14
      },
      {
        "num": "26-06-04178",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 308.47
      }
    ],
    "receipts": [
      {
        "date": "2026-04-23",
        "invoices": "141309, 141566, 141776, 142027, 142273",
        "amount": 13993.18
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "hashikma-n-g",
    "name": "HASHIKMA N.G.N INTERNATIONAL COMMUNICATIONS 015 LTD",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000047",
    "accountId": "50a0a000-0000-4000-8000-000000000047",
    "sales": [],
    "purchases": [
      {
        "num": "6503098",
        "start": "2026-02-01",
        "end": "2026-02-28",
        "amount": 3.16
      },
      {
        "num": "6506384",
        "start": "2026-04-01",
        "end": "2026-04-30",
        "amount": 3.23
      },
      {
        "num": "6508337",
        "start": "2026-05-01",
        "end": "2026-05-31",
        "amount": 3.53
      },
      {
        "num": "6510464",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 3.32
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "liquid-telecommunicatios-u",
    "name": "LIQUID TELECOMMUNICATIOS (U) LTD",
    "term": 30,
    "contactId": "50a0c000-0000-4000-8000-000000000048",
    "accountId": "50a0a000-0000-4000-8000-000000000048",
    "sales": [
      {
        "num": "143285",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 206.21
      }
    ],
    "purchases": [
      {
        "num": "28832",
        "start": "2026-06-01",
        "end": "2026-06-30",
        "amount": 1067.5
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "ngn-corp-s",
    "name": "NGN CORP S.A.L.",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000049",
    "accountId": "50a0a000-0000-4000-8000-000000000049",
    "sales": [
      {
        "num": "140031",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 10.54
      },
      {
        "num": "140301",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 20.17
      },
      {
        "num": "140533",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 2304.46
      },
      {
        "num": "140776",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 5106.42
      },
      {
        "num": "140995",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 427.17
      },
      {
        "num": "141240",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 494.09
      },
      {
        "num": "141426",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 57.92
      },
      {
        "num": "141675",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 20.54
      },
      {
        "num": "141896",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 39.61
      },
      {
        "num": "142111",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 12.3
      },
      {
        "num": "142258",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 31.41
      },
      {
        "num": "142465",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 13.97
      },
      {
        "num": "142693",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 2.91
      },
      {
        "num": "142935",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 420.1
      },
      {
        "num": "143125",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1868.09
      }
    ],
    "purchases": [
      {
        "num": "68610",
        "start": "2025-11-16",
        "end": "2025-11-30",
        "amount": 865.02
      },
      {
        "num": "68746",
        "start": "2025-12-01",
        "end": "2025-12-15",
        "amount": 842.02
      },
      {
        "num": "68887",
        "start": "2025-12-16",
        "end": "2025-12-31",
        "amount": 182.04
      },
      {
        "num": "69051",
        "start": "2026-01-01",
        "end": "2026-01-15",
        "amount": 4496.27
      },
      {
        "num": "69214",
        "start": "2026-01-16",
        "end": "2026-01-31",
        "amount": 2286.71
      },
      {
        "num": "69376",
        "start": "2026-02-01",
        "end": "2026-02-15",
        "amount": 2431.01
      },
      {
        "num": "69506",
        "start": "2026-02-16",
        "end": "2026-02-28",
        "amount": 1388.81
      },
      {
        "num": "69701",
        "start": "2026-03-01",
        "end": "2026-03-15",
        "amount": 970.82
      },
      {
        "num": "69861",
        "start": "2026-03-16",
        "end": "2026-03-31",
        "amount": 984.75
      },
      {
        "num": "70010",
        "start": "2026-04-01",
        "end": "2026-04-15",
        "amount": 724.27
      },
      {
        "num": "70155",
        "start": "2026-04-16",
        "end": "2026-04-30",
        "amount": 582.98
      },
      {
        "num": "70296",
        "start": "2026-05-01",
        "end": "2026-05-15",
        "amount": 823.32
      },
      {
        "num": "70463",
        "start": "2026-05-16",
        "end": "2026-05-31",
        "amount": 379.94
      },
      {
        "num": "70590",
        "start": "2026-06-01",
        "end": "2026-06-15",
        "amount": 175.38
      },
      {
        "num": "70733",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1825.84
      }
    ],
    "receipts": [],
    "payments": [
      {
        "date": "2026-03-19",
        "invoices": "68610, 68746, 68887, 69051, 69214,  69376, 69506",
        "amount": 4071.11
      },
      {
        "date": "2026-05-15",
        "invoices": "69701, 69861, 70010, 70155 ",
        "amount": 3158.96
      }
    ],
    "adjustments": []
  },
  {
    "key": "occam-networks-ltd",
    "name": "OCCAM NETWORKS LTD",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000050",
    "accountId": "50a0a000-0000-4000-8000-000000000050",
    "sales": [
      {
        "num": "143147",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 11.31
      }
    ],
    "purchases": [],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "telebiz",
    "name": "TELEBIZ",
    "term": 7,
    "contactId": "50a0c000-0000-4000-8000-000000000051",
    "accountId": "50a0a000-0000-4000-8000-000000000051",
    "sales": [
      {
        "num": "143356",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 15680.83
      }
    ],
    "purchases": [
      {
        "num": "INV-20260713-47543",
        "start": "2026-07-06",
        "end": "2026-07-12",
        "amount": 4038.5
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "transtalkie-limited",
    "name": "TRANSTALKIE LIMITED",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000052",
    "accountId": "50a0a000-0000-4000-8000-000000000052",
    "sales": [
      {
        "num": "143126",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 5.45
      }
    ],
    "purchases": [
      {
        "num": "HAYO-07-2026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 1950.95
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "us-matrix-telecomm",
    "name": "US MATRIX TELECOMM...",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000053",
    "accountId": "50a0a000-0000-4000-8000-000000000053",
    "sales": [
      {
        "num": "143192",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 51.06
      }
    ],
    "purchases": [
      {
        "num": "11813",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.02
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "vazq-communication-inc",
    "name": "VAZQ COMMUNICATION INC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000054",
    "accountId": "50a0a000-0000-4000-8000-000000000054",
    "sales": [
      {
        "num": "143237",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 2313.88
      }
    ],
    "purchases": [
      {
        "num": "VQ85-16062026-30062026",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 0.03
      }
    ],
    "receipts": [
      {
        "date": "2026-07-07",
        "invoices": "VQ85-16062026-30062026",
        "amount": 2313.85
      }
    ],
    "payments": [],
    "adjustments": []
  },
  {
    "key": "voxzi-llc",
    "name": "Voxzi LLC",
    "term": 15,
    "contactId": "50a0c000-0000-4000-8000-000000000055",
    "accountId": "50a0a000-0000-4000-8000-000000000055",
    "sales": [],
    "purchases": [
      {
        "num": "4705",
        "start": "2026-06-16",
        "end": "2026-06-30",
        "amount": 885.73
      }
    ],
    "receipts": [],
    "payments": [],
    "adjustments": []
  }
];
